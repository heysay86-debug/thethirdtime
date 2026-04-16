# fix-prompt-03: 배경 전환 시퀀스 재설계 + 입력 분기 보호

> 이 문서는 Claude Code에 전달할 구현 프롬프트다.
> 아래 수정사항을 **순서대로, 빠짐없이** 적용하라.

---

## 배경 시퀀스 전체 흐름 (필수 숙지)

```
before.jpg        성별 입력 후      생년월일 입력 후     신전 도착         과거로 전환
(갈림길)     →    after.jpeg    →   캐릭터 이동    →   inside_sun/moon → past.jpeg
                  (맵 전체)         (PATH 따라)         (신전 내부)       (출생 시점의 방)
```

| 시점 | 배경 | 복길(DotCharacter) |
|---|---|---|
| 시작 ~ 성별 입력 전 | before.jpg | 갈림길 중앙(x:50, y:79), 정면, 보임 |
| 성별 응답 수신 직후 | → after.jpeg | 그대로 보임 |
| 생년월일 응답 후 탭 | after.jpeg | SUN_PATH 또는 MOON_PATH 따라 이동 |
| 신전 도착 | → blackout → inside_sun/moon | 사라짐 → 내부에서 재등장(x:50, y:60) |
| "보이는가?" 대사 부근 | → past.jpeg | 안 보임 (visible: false) |
| confirm "맞아" | past.jpeg 유지 | 안 보임 |
| retry "다시 입력" | → inside_sun/moon 복귀 | 재등장 |
| 이후 시퀀스 (시간/도시 입력 등) | past.jpeg | 안 보임 |

---

## 수정 1: ZoneBg 타입에 'past' 추가

### 파일: `app/alt2/page.tsx`

1. `ZoneBg` 타입에 `'past'` 추가:
```ts
type ZoneBg = 'before' | 'after' | 'blackout' | 'inside_sun' | 'inside_moon' | 'past';
```

2. 배경 이미지 렌더링 배열에 `'past'` 추가. 기존:
```ts
{(['before', 'after', 'inside_sun', 'inside_moon'] as const).map(bg => (
```
변경:
```ts
{(['before', 'after', 'inside_sun', 'inside_moon', 'past'] as const).map(bg => (
```

3. 파일 확장자 매핑 수정. 기존:
```ts
src={`/background/${bg}.${bg === 'before' ? 'jpg' : 'jpeg'}`}
```
변경:
```ts
src={`/background/${bg}.${bg === 'before' ? 'jpg' : 'jpeg'}`}
```
→ before.jpg, 나머지는 전부 .jpeg이므로 기존 로직 그대로 유지.

4. `DialoguePlayer`의 `onBgChange` 타입도 `ZoneBg`와 동일하게 'past' 포함하도록 확인.

---

## 수정 2: 입력 분기 터치 차단 강화

### 파일: `app/alt2/components/dialogue/DialoguePlayer.tsx`

### 문제
`handleTap`에서 `showInput`이 true일 때만 차단하고 있다. 하지만 `isInputAction`이 true인 라인에서 타이핑 완료 후 `showInput`이 true가 되기 전 찰나에 탭하면 다음으로 넘어갈 수 있다. 또한 response가 표시 중일 때 탭하면 input을 건너뛸 수 있다.

### 수정 내용

`handleTap` 함수에서, input mode일 때의 차단 조건을 강화한다:

```ts
const handleTap = useCallback(() => {
  if (showChoices || showInput) return;

  if (showResponse) {
    // response 표시 후 탭: 다음으로 진행
    // 단, 신전 이동 시퀀스가 필요한 경우 별도 처리 (수정 4에서 구현)
    advanceInputFlow();
    return;
  }

  if (mode === 'dialogue') {
    if (currentLine.action && currentLine.action !== 'show_choices') {
      onAction?.(currentLine.action);
    }
    if (lineIndex < script.length - 1) {
      setLineIndex(prev => prev + 1);
      setTypingDone(false);
      setShowChoices(false);
    } else {
      onComplete();
    }
  } else {
    // Input mode: isInputAction이거나 submit_and_transition이면 절대 탭으로 진행 불가
    if (!isInputAction && currentLine.action !== 'submit_and_transition' && currentLine.action !== 'show_choices') {
      advanceInputFlow();
    }
  }
}, [
  showChoices, showInput, showResponse, mode, currentLine,
  lineIndex, script, isInputAction, onAction, onComplete, advanceInputFlow,
]);
```

핵심: **유저 정보를 입력받는 라인(`isInputAction === true`)에서는, 유저가 실제로 값을 제출하거나 스킵하지 않는 한 절대 다음으로 넘어가지 않는다.**

---

## 수정 3: 성별 입력 후 before → after 전환

### 파일: `app/alt2/components/dialogue/DialoguePlayer.tsx`

### 수정 위치: `handleDialogueInput` 함수

성별(input_gender) 입력값을 처리한 직후, `onBgChange('after')`를 호출한다.

`handleDialogueInput` 내부, `setCollectedInput(updated)` 이후 response 처리 전에:

```ts
// 성별 입력 후 배경 전환
if (action === 'input_gender') {
  onBgChange?.('after');
}
```

기존 `confirm_birthdate` 핸들러 내의 `onBgChange?.('after')` 라인은 **삭제**한다.

---

## 수정 4: 생년월일 입력 후 신전 이동 시퀀스

### 파일: `app/alt2/components/dialogue/DialoguePlayer.tsx`

### 핵심 변경
기존에 `confirm_birthdate` 선택지 핸들러에 있던 신전 진입 시퀀스(캐릭터 이동 + 암전 + 내부 전환)를, **생년월일 입력 응답("좋아, 받았네. 유적으로 향하지") 표시 후 사용자 탭 시점**으로 이동한다.

### 구현 방법

1. 새로운 상태 추가:
```ts
const [pendingTempleWalk, setPendingTempleWalk] = useState(false);
```

2. `handleDialogueInput`에서 `input_birthdate` 처리 시, response 표시와 함께 플래그 설정:
```ts
if (action === 'input_birthdate') {
  // ... 기존 birthDate 파싱 로직 유지 ...
  setBirthdateStepIndex(inputLineIndex);
  setPendingTempleWalk(true);  // 추가
}
```

3. `handleTap`에서 `showResponse`이고 `pendingTempleWalk`이면, advanceInputFlow 대신 신전 이동 시퀀스 실행:
```ts
if (showResponse) {
  if (pendingTempleWalk) {
    setPendingTempleWalk(false);
    setShowResponse(false);
    setResponseLines([]);
    // 신전 이동 시퀀스 실행
    (async () => {
      const calendar = collectedInput.calendar;
      const path = calendar === 'lunar' ? MOON_PATH : SUN_PATH;

      // 1. 캐릭터 뒤돌기
      onDotMove?.({ direction: 'back' });
      await delay(300);

      // 2. PATH 따라 이동
      for (const step of path) {
        onDotMove?.({ direction: step.direction });
        await delay(100);
        onDotMove?.({ x: step.x, y: step.y });
        await delay(step.duration);
      }

      // 3. 캐릭터 숨김 + 암전
      onDotMove?.({ visible: false });
      onBgChange?.('blackout');
      await delay(800);

      // 4. 신전 내부
      onBgChange?.(calendar === 'lunar' ? 'inside_moon' : 'inside_sun');
      await delay(500);

      // 5. 캐릭터 신전 내부에서 재등장
      onDotMove?.({ direction: 'front', x: 50, y: 60, visible: true });

      // 6. 다음 대사로 진행
      advanceInputFlow();
    })();
    return;
  }
  advanceInputFlow();
  return;
}
```

4. **기존 `confirm_birthdate` 핸들러에서 신전 이동 시퀀스(onBgChange, onDotMove, 전체 async 블록) 전부 삭제**. `confirm_birthdate`는 이제 단순히 다음으로 진행하는 역할만 한다:
```ts
if (action === 'confirm_birthdate') {
  // past.jpeg에서 날짜 확인 완료 → 그냥 다음으로 진행
  if (mode === 'input') {
    advanceInputFlow();
  }
  return;
}
```

---

## 수정 5: past.jpeg 전환 + 캐릭터 숨김

### 파일: `public/content/dialogue-intro.json`

신전 내부 도착 후, "보이는가?" 대사 시점에서 past.jpeg로 전환해야 한다.

`DialogueLine` 타입에 선언적 배경/캐릭터 제어 필드를 추가하는 대신, **기존 action 시스템을 활용**한다.

### 방법: 새로운 action 타입 `bg_past` 추가

inputFlow에서 "보이는가?" 직전의 시스템 메시지("시간의 유적에 도착했네.")에 action을 추가:

**기존** (inputFlow index 5):
```json
{
  "character": "magician",
  "text": "시간의 유적에 도착했네.",
  "style": "system"
}
```

**변경**:
```json
{
  "character": "magician",
  "text": "시간의 유적에 도착했네.",
  "style": "system",
  "action": "bg_past"
}
```

### 파일: `app/alt2/components/dialogue/DialoguePlayer.tsx`

`handleTypingComplete`에서 `bg_past` 액션을 처리:

```ts
const handleTypingComplete = useCallback(() => {
  setTypingDone(true);
  const action = currentLine.action;

  if (action === 'show_choices' && currentLine.choices) {
    setShowChoices(true);
  } else if (action && INPUT_TYPE_MAP[action]) {
    setShowInput(true);
  } else if (action === 'submit_and_transition') {
    onInputSubmit?.(buildSajuInput(collectedInput));
  } else if (action === 'bg_past') {
    // past.jpeg로 전환 + 캐릭터 숨김
    onBgChange?.('past');
    onDotMove?.({ visible: false });
  }
}, [currentLine, collectedInput, onInputSubmit, onBgChange, onDotMove]);
```

`bg_past` 액션이 있는 라인은 input 액션이 아니므로, 탭으로 정상 진행된다.

---

## 수정 6: retry_birthdate 동작 수정

### 파일: `app/alt2/components/dialogue/DialoguePlayer.tsx`

기존 `retry_birthdate` 핸들러를 수정. "다시 입력" 선택 시:
- 배경을 inside_sun/inside_moon으로 복귀 (현재 calendar에 따라)
- 캐릭터 재등장
- birthdate 입력 스텝으로 복귀

**기존**:
```ts
if (action === 'retry_birthdate') {
  if (birthdateStepIndex >= 0) {
    setInputLineIndex(birthdateStepIndex);
    setTypingDone(false);
    setShowInput(false);
    setCollectedInput(prev => {
      const { birthDate, calendar, isLeapMonth, ...rest } = prev;
      return rest;
    });
    onBgChange?.('before');  // ← 이것이 잘못됨
  }
  return;
}
```

**변경**:
```ts
if (action === 'retry_birthdate') {
  if (birthdateStepIndex >= 0) {
    setInputLineIndex(birthdateStepIndex);
    setTypingDone(false);
    setShowInput(false);
    // calendar는 유지 (신전을 선택한 결과이므로), birthDate와 isLeapMonth만 초기화
    setCollectedInput(prev => {
      const { birthDate, isLeapMonth, ...rest } = prev;
      return rest;
    });
    // 신전 내부로 복귀
    const calendar = collectedInput.calendar;
    onBgChange?.(calendar === 'lunar' ? 'inside_moon' : 'inside_sun');
    onDotMove?.({ direction: 'front', x: 50, y: 60, visible: true });
  }
  return;
}
```

**주의**: `retry_birthdate` 시 `calendar`는 초기화하지 않는다. 양력/음력 선택은 생년월일 입력 시 함께 수집되므로, 신전(sun/moon) 선택은 이미 결정된 상태다. 생년월일만 다시 입력받는다.

---

## 수정 7: handleChoiceSelect의 collectedInput 의존성

기존 `handleChoiceSelect`의 `useCallback` 의존성 배열에 `collectedInput`이 빠져 있다. retry_birthdate에서 `collectedInput.calendar`를 참조하므로 추가:

```ts
}, [lineIndex, script.length, mode, birthdateStepIndex, collectedInput, onAction, onComplete, onBgChange, onDotMove, advanceInputFlow]);
```

---

## 검증 체크리스트

1. [ ] 초기 화면: before.jpg 배경 + 복길 캐릭터(x:50, y:79) 보임
2. [ ] 대화 탭으로 진행 가능
3. [ ] input_name 라인: 이름 입력 전 탭해도 넘어가지 않음
4. [ ] input_gender 라인: 성별 선택 전 탭해도 넘어가지 않음
5. [ ] 성별 응답 표시 후 배경이 before.jpg → after.jpeg 전환
6. [ ] input_birthdate 라인: 날짜 입력 전 탭해도 넘어가지 않음
7. [ ] 생년월일 응답("좋아, 받았네. 유적으로 향하지") 표시됨
8. [ ] 응답 표시 상태에서 탭 → 캐릭터가 PATH 따라 이동 시작
9. [ ] 양력 선택 시 SUN_PATH(좌측), 음력 선택 시 MOON_PATH(우측)
10. [ ] 이동 완료 → 암전 → inside_sun.jpeg 또는 inside_moon.jpeg 표시
11. [ ] 캐릭터 신전 내부에서 재등장
12. [ ] "시간의 유적에 도착했네" 대사 후 past.jpeg 전환 + 캐릭터 사라짐
13. [ ] "이 날이 맞는가?" 선택지 표시
14. [ ] "맞아, 이 날이야" → past.jpeg 유지, 다음 대사로 진행
15. [ ] "아니, 다시 입력할게" → inside_sun/moon 복귀, 캐릭터 재등장, 생년월일 재입력
16. [ ] input_birthtime, input_birthcity: past.jpeg 유지, 캐릭터 안 보임
17. [ ] submit_and_transition → ZONE B 결과 표시
