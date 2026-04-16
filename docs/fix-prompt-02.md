# alt2 대화형 입력 수집 시스템 구현 지시

> fix-prompt-01 완료 후 실행. 기존 `InputModal`(폼 모달)을 ZONE A 최초 진입에서 제거하고,
> RPG 대화 흐름 안에서 유저 정보를 수집하는 시스템으로 교체한다.
> 각 수정 후 `npm run build` 에러 없는지 확인.

---

## 배경 · 현재 상태

- `DialoguePlayer.tsx`는 `script: DialogueLine[]`을 순서대로 재생하고, `show_choices`와 `open_input_modal` 2가지 action만 처리한다.
- `page.tsx`의 `handleAction`은 `open_input_modal` → `setModalOpen(true)` 하나만 분기한다.
- `dialogue-intro.json`에는 `lines`(도입 대화)와 `inputFlow`(입력 수집 대화) 두 배열이 있다. 현재 `page.tsx`는 `d.lines`만 로드하고, `inputFlow`는 사용하지 않는다.
- 목표: `lines` 재생 → 유저가 "함께 가겠습니다" 선택(`start_input_flow`) → `inputFlow` 배열로 전환 → 대화 속에서 이름/성별/양음력/생년월일/윤달/생시/출생지를 수집 → `submit_and_transition` → API 호출 + 트랜지션.

---

## 수정 1: DialogueLine 타입 확장 (`DialogueBox.tsx`)

### 현재
```ts
export interface DialogueLine {
  character: string;
  name?: string;
  text: string;
  style?: 'normal' | 'emphasis' | 'whisper' | 'system';
  icon?: string;
  action?: string;
  choices?: { label: string; action: string; style?: 'primary' | 'secondary' }[];
}
```

### 변경
```ts
export interface DialogueLine {
  character: string;
  name?: string;
  text: string;
  style?: 'normal' | 'emphasis' | 'whisper' | 'system';
  icon?: string;
  action?: string;
  choices?: { label: string; action: string; style?: 'primary' | 'secondary' }[];
  // ── 대화형 입력 확장 ──
  inputConfig?: {
    placeholder?: string;
    skipLabel?: string;
    skipValue?: string;
    options?: string[];
  };
  responses?: Record<string, {
    character: string;
    name?: string;
    text: string;
    style?: string;
  }>;
}
```

DialogueBox 컴포넌트 자체는 수정 없음 (타입만 확장).

---

## 수정 2: DialogueInput.tsx 신규 생성

파일: `app/alt2/components/dialogue/DialogueInput.tsx`

### Props
```ts
interface DialogueInputProps {
  type: 'text' | 'gender' | 'date' | 'leapmonth' | 'time' | 'city';
  config?: {
    placeholder?: string;
    skipLabel?: string;
    skipValue?: string;
    options?: string[];
  };
  onSubmit: (value: string) => void;
  onSkip?: () => void;
}
```

### 각 type별 렌더링

**공통 스타일:** DESIGN-ALT2.md 기준. 버튼 borderRadius 16px. 
- 선택 버튼: `backgroundColor: 'rgba(104,128,151,0.25)', color: '#dde1e5'`
- 활성/확인 버튼: `backgroundColor: '#dde1e5', color: '#3e4857'`
- 건너뛰기 버튼: 텍스트만, `color: '#688097'`, 하단 배치

| type | UI |
|------|-----|
| `text` | 텍스트 `<input>` + 확인 버튼. placeholder는 config.placeholder. Enter로도 제출. `onSubmit(value)`. skipLabel 있으면 하단에 건너뛰기 버튼 → `onSkip()` |
| `gender` | [남성] [여성] 2개 버튼 가로 배치. 클릭 → `onSubmit('M')` / `onSubmit('F')`. skipLabel 있으면 하단에 건너뛰기 |
| `date` | **양음력 토글 + 날짜 셀렉터 통합 UI.** 상단에 [양력]/[음력] 토글 버튼 2개 + 그 아래 년(1920~2025)/월(1~12)/일(1~31) 3개 `<select>` 가로 배치 + 확인 버튼. 값은 `solar\|YYYY-MM-DD` 또는 `lunar\|YYYY-MM-DD` 형식으로 제출. `input_calendar` 단계는 삭제됨 — 이 UI에 통합. 각 select 스타일은 InputModal의 inputStyle과 동일(`rgba(104,128,151,0.12)` 배경, borderRadius 16). 월 변경 시 일수 자동 조정 (28/29/30/31). 기본 선택: 양력, 년=1990, 월=1, 일=1 |
| `leapmonth` | [예, 윤달이었어요] [아니오] 2개 버튼. → `onSubmit('true')` / `onSubmit('false')` |
| `time` | **12지시 3열 그리드** (아래 상세) + 지시 선택 후 **1분 단위 분 선택기** (0~59, `<select>` 또는 스크롤 피커) + 하단 [모르겠어요] 풀너비 버튼 → `onSkip()` |
| `city` | `<select>` 드롭다운 (config.options 배열 사용) + 확인 버튼. skipLabel 있으면 하단에 건너뛰기 |

### 12지시 그리드 (type='time')

```
[子시 23~01]  [丑시 01~03]  [寅시 03~05]
[卯시 05~07]  [辰시 07~09]  [巳시 09~11]
[午시 11~13]  [未시 13~15]  [申시 15~17]
[酉시 17~19]  [戌시 19~21]  [亥시 21~23]
         [모르겠어요]
```

- 3열 CSS grid (`grid-template-columns: repeat(3, 1fr)`, gap 8px)
- 각 버튼 py-2.5, text-xs, borderRadius 12
- 클릭 시 `onSubmit('子')` 등 한자 지지 1글자 전달
- [모르겠어요] 는 `grid-column: 1 / -1` 풀너비, `onSkip()` 호출

### 애니메이션
- framer-motion으로 래핑: `initial={{ opacity: 0, y: 16 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.2 }}`

---

## 수정 3: DialoguePlayer.tsx 대폭 확장

### 3-1. Props 변경

```ts
interface DialoguePlayerProps {
  script: DialogueLine[];
  inputFlow?: DialogueLine[];       // 추가
  onComplete: () => void;
  onAction?: (action: string) => void;
  onInputSubmit?: (input: SajuInput) => void;  // 추가: 전체 입력 수집 완료
}
```

### 3-2. 상태 추가

```ts
const [mode, setMode] = useState<'dialogue' | 'input'>('dialogue');
const [inputLineIndex, setInputLineIndex] = useState(0);
const [showInput, setShowInput] = useState(false);
const [showResponse, setShowResponse] = useState(false);
const [responseLines, setResponseLines] = useState<DialogueLine[]>([]);
const [collectedInput, setCollectedInput] = useState<Record<string, string>>({});
```

### 3-3. 현재 스크립트 결정

```ts
const activeScript = mode === 'dialogue' ? script : (inputFlow || []);
const activeIndex = mode === 'dialogue' ? lineIndex : inputLineIndex;
const currentLine = activeScript[activeIndex];
```

### 3-4. action별 분기 (handleTypingComplete 확장)

타이핑 완료 시:
- `show_choices` → 기존대로 `setShowChoices(true)`
- `input_name` → `setShowInput(true)`, inputType = `'text'`
- `input_gender` → `setShowInput(true)`, inputType = `'gender'`
- `input_birthdate` → `setShowInput(true)`, inputType = `'date'` (양음력 토글 포함)
- `input_leapmonth` → `setShowInput(true)`, inputType = `'leapmonth'`
- `input_birthtime` → `setShowInput(true)`, inputType = `'time'`
- `input_birthcity` → `setShowInput(true)`, inputType = `'city'`
- `submit_and_transition` → `onInputSubmit?.(buildSajuInput(collectedInput))`
- action이 없는 일반 대사 → 탭으로 다음 진행 (기존 동작)

action이 `input_*`인 경우, **탭 진행을 막는다** (`showChoices`처럼 `showInput` 상태에서 tap 무시).

### 3-5. 입력 처리 핸들러

```ts
function handleDialogueInput(value: string) {
  const line = currentLine;
  const actionType = line.action;

  // 1) collectedInput 업데이트 (action에서 필드명 매핑)
  const fieldMap: Record<string, string> = {
    input_name: 'name',
    input_gender: 'gender',
    // input_calendar는 input_birthdate에 통합됨
    input_birthdate: 'birthDate',  // 값: "solar|YYYY-MM-DD" 또는 "lunar|YYYY-MM-DD"
    input_leapmonth: 'isLeapMonth',
    input_birthtime: 'birthTime',
    input_birthcity: 'birthCity',
  };
  
  // birthDate 입력값 파싱 (calendar + date 통합)
  if (field === 'birthDate' && value.includes('|')) {
    const [cal, date] = value.split('|');
    updated.calendar = cal;  // 'solar' or 'lunar'
    updated.birthDate = date; // 'YYYY-MM-DD'
  }
  const field = fieldMap[actionType || ''];
  if (field) {
    const updated = { ...collectedInput, [field]: value };
    setCollectedInput(updated);
  }

  // 2) 입력 UI 닫기
  setShowInput(false);

  // 3) 분기 응답 찾기 및 재생
  const responseKey = line.responses?.[value] ? value : line.responses?.['_any'] ? '_any' : null;
  if (responseKey && line.responses?.[responseKey]) {
    const resp = line.responses[responseKey];
    // {{value}} 치환
    const text = resp.text.replace(/\{\{value\}\}/g, value);
    const responseLine: DialogueLine = { ...resp, text };
    // 응답 대사를 보여준 뒤 다음으로 진행
    setResponseLines([responseLine]);
    setShowResponse(true);
    // → 응답 대사 타이핑 완료 → 탭 → 다음 inputFlow 라인으로 진행
  } else {
    advanceInputFlow();
  }
}

function handleDialogueSkip() {
  const line = currentLine;
  const actionType = line.action;
  const skipValue = line.inputConfig?.skipValue || '';

  // collectedInput에 skip값 저장
  const fieldMap = { /* 위와 동일 */ };
  const field = fieldMap[actionType || ''];
  if (field && skipValue) {
    setCollectedInput(prev => ({ ...prev, [field]: skipValue }));
  }

  setShowInput(false);

  // _skip 응답 찾기
  if (line.responses?.['_skip']) {
    const resp = line.responses['_skip'];
    setResponseLines([{ ...resp, text: resp.text }]);
    setShowResponse(true);
  } else {
    advanceInputFlow();
  }
}
```

### 3-6. inputFlow 진행

```ts
function advanceInputFlow() {
  setShowResponse(false);
  setResponseLines([]);
  
  const justProcessed = currentLine;
  
  // 날짜 확인 분기 (birthDate 입력 직후)
  // → 캐릭터가 "양력 1986년 9월 15일, 이 날이 맞는가?" 확인 대사
  // → "맞아" 선택 시 윤달 체크 후 진행
  // → "다시 입력할게" 선택 시 birthdate 입력 단계로 되돌아감
  //    (collectedInput에서 calendar/birthDate/isLeapMonth 초기화)
  // 이 로직은 이미 코드에 구현됨 (별도 수정 불필요)
  
  // 윤달 동적 삽입 체크 (날짜 확인 "맞아" 이후)
  // → 수정 4에서 상세 설명
  
  if (inputLineIndex < (inputFlow?.length || 0) - 1) {
    setInputLineIndex(prev => prev + 1);
    setTypingDone(false);
    setShowInput(false);
  }
}
```

### 3-7. `start_input_flow` action 처리

`handleChoiceSelect`에서:
```ts
if (action === 'start_input_flow') {
  setMode('input');
  setInputLineIndex(0);
  setTypingDone(false);
  setShowChoices(false);
  return;
}
```

`continue` action 처리도 기존 유지 — `lines` 내에서 "조금 더 알려주세요" 분기가 작동해야 함.

### 3-8. 응답 대사 재생

`showResponse === true`일 때, `responseLines[0]`를 DialogueBox로 렌더링.
응답 대사 타이핑 완료 후 탭하면 `advanceInputFlow()` 호출.

### 3-9. 렌더링 구조

```tsx
return (
  <div className="fixed inset-0 flex flex-col justify-end" style={{ zIndex: 10 }}>
    {/* Tap area */}
    <div className="flex-1" onClick={handleTap} />
    
    <div className="w-full max-w-[440px] mx-auto px-4 space-y-2"
         style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
      
      {/* Choice panel (기존) */}
      {showChoices && currentLine?.choices && (
        <ChoicePanel choices={currentLine.choices} onSelect={handleChoiceSelect} />
      )}
      
      {/* Input panel (신규) */}
      {showInput && currentLine?.action && (
        <DialogueInput
          type={actionToInputType(currentLine.action)}
          config={currentLine.inputConfig}
          onSubmit={handleDialogueInput}
          onSkip={currentLine.inputConfig?.skipLabel ? handleDialogueSkip : undefined}
        />
      )}
      
      {/* Dialogue box — 응답 대사 모드 or 일반 모드 */}
      <DialogueBox
        key={showResponse ? `resp-${inputLineIndex}` : `${mode}-${activeIndex}`}
        line={showResponse ? responseLines[0] : lineWithName}
        typing
        onTypingComplete={showResponse ? handleResponseTypingComplete : handleTypingComplete}
        onTap={handleTap}
        showIndicator={typingDone && !showChoices && !showInput}
      />
    </div>
  </div>
);
```

### 3-10. `actionToInputType` 유틸

```ts
function actionToInputType(action: string): DialogueInputProps['type'] {
  const map: Record<string, DialogueInputProps['type']> = {
    input_name: 'text',
    input_gender: 'gender',
    input_birthdate: 'date',  // 양음력 토글 포함
    input_leapmonth: 'leapmonth',
    input_birthtime: 'time',
    input_birthcity: 'city',
  };
  return map[action] || 'text';
}
```

### 3-11. SajuInput 변환

```ts
function buildSajuInput(collected: Record<string, string>) {
  return {
    birthDate: collected.birthDate || '',
    birthTime: collected.birthTime || '',
    calendar: (collected.calendar || 'solar') as 'solar' | 'lunar',
    isLeapMonth: collected.isLeapMonth === 'true',
    birthCity: collected.birthCity || '서울',
    gender: (collected.gender || '') as 'M' | 'F' | '',
    name: collected.name || '',
  };
}
```

---

## 수정 4: 윤달 동적 삽입

`advanceInputFlow()` 내부, 다음 라인으로 진행하기 전에:

```ts
// 현재 방금 처리한 라인이 input_birthdate였다면
if (currentLine.action === 'input_birthdate' && collectedInput.calendar === 'lunar') {
  // hasLeapMonth import: src/engine/calendar.ts에서
  // 단, 클라이언트 컴포넌트에서 직접 import가 어려우면
  // 별도 API route 또는 data fetch 방식 사용
  // → 실용적 방법: lunar_lookup.json을 public/에 두고 fetch하거나,
  //   hasLeapMonth 로직을 클라이언트 유틸로 분리
}
```

### 구현 방식 (선택)

**방식 A (권장): 클라이언트용 윤달 체크 유틸 분리**

`app/alt2/utils/leapMonthCheck.ts` 생성:
```ts
// lunar_lookup.json에서 윤달 데이터만 추출한 경량 맵
// 빌드 시 static import 가능하도록 ts 파일로 관리
// 형식: { "연도-월": true } (윤달이 존재하는 연-월만 포함)

import leapMonthData from './leapMonthMap.json';

export function hasLeapMonthClient(year: number, month: number): boolean {
  return !!leapMonthData[`${year}-${month}`];
}
```

`app/alt2/utils/leapMonthMap.json` 생성:
- `data/lunar_lookup.json`에서 윤달(`isLeap: true`)이 존재하는 연-월 조합만 추출
- 예: `{ "1987-6": true, "1990-5": true, ... }`
- 이 JSON은 빌드 시 번들에 포함됨 (수 KB 이하)

**생성 스크립트** (`scripts/extract-leap-months.ts`):
```ts
import lunarLookup from '../data/lunar_lookup.json';

const leapMap: Record<string, boolean> = {};
for (const [key] of Object.entries(lunarLookup)) {
  // key format 검사: 윤달 키는 "YYYY-MM-DD-leap" 등
  // lunar_lookup.json의 실제 구조를 확인하여 윤달 엔트리 추출
  // 결과를 leapMap에 추가
}
// JSON 파일로 출력
```

또는 더 간단하게: `data/lunar_lookup.json`의 구조를 확인하고 윤달 존재 여부를 하드코딩 배열로 넣어도 됨 (1900~2049 범위에 윤달은 약 50여 건).

**윤달 질문 삽입 로직** (DialoguePlayer 내):
```ts
function advanceInputFlow() {
  setShowResponse(false);
  setResponseLines([]);
  
  const justProcessed = currentLine;
  let nextIndex = inputLineIndex + 1;
  
  // 윤달 동적 삽입
  if (justProcessed.action === 'input_birthdate' && collectedInput.calendar === 'lunar') {
    const [yearStr, monthStr] = (collectedInput.birthDate || '').split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    if (year && month && hasLeapMonthClient(year, month)) {
      // 윤달 질문 라인을 동적으로 끼워넣기
      // → insertedLines 상태를 두거나, inputFlow를 복사 후 splice
      // 가장 단순한 방법: dynamicLines 큐
      setDynamicInsertQueue([{
        character: 'magician',
        text: `음... ${month}월이라 했나?\n그 해에는 윤달이 있었는데,\n혹시 윤달이었나?`,
        action: 'input_leapmonth',
        inputConfig: { skipLabel: '아니오, 평달이었어요' },
        responses: {
          'true': { character: 'flash', text: '윤달이었군!\n달의 흐름이 한 번 더 겹친 때에 태어났어.' },
          'false': { character: 'doin', text: '평달이군.\n좋아, 그대로 진행하지.' },
        },
      }]);
      return; // nextIndex 진행 보류, dynamicInsertQueue 처리 후 재개
    }
  }
  
  // 일반 진행
  if (nextIndex < (inputFlow?.length || 0)) {
    setInputLineIndex(nextIndex);
    setTypingDone(false);
    setShowInput(false);
  }
}
```

**dynamicInsertQueue 처리**: 큐에 라인이 있으면 `currentLine`을 큐에서 꺼내서 사용. 큐가 비면 원래 inputFlow 인덱스 재개.

---

## 수정 5: page.tsx 연동 변경

### 5-1. dialogue-intro.json 로드 시 inputFlow도 저장

```ts
const [introScript, setIntroScript] = useState<DialogueLine[]>([]);
const [introInputFlow, setIntroInputFlow] = useState<DialogueLine[]>([]); // 추가

useEffect(() => {
  fetch('/content/dialogue-intro.json')
    .then(r => r.json())
    .then(d => {
      setIntroScript(d.lines);
      setIntroInputFlow(d.inputFlow || []); // 추가
    })
    .catch(() => {});
  // ... 나머지 동일
}, []);
```

### 5-2. handleAction에서 `start_input_flow` 제거

`start_input_flow`는 이제 DialoguePlayer 내부에서 처리하므로 page.tsx의 handleAction에서는 불필요.
다만 `open_input_modal`은 궁합/수정용으로 유지.

```ts
const handleAction = useCallback((action: string) => {
  if (action === 'open_input_modal') setModalOpen(true);
  // start_input_flow는 DialoguePlayer 내부에서 mode 전환으로 처리
}, []);
```

### 5-3. onInputSubmit 핸들러 추가

```ts
const handleInputSubmit = useCallback(async (input: any) => {
  // 기존 handleSubmit과 동일한 로직 (트랜지션 + API)
  // 단, setModalOpen(false) 제거 (모달을 사용하지 않으므로)
  
  setPhase('transition');
  setTransitionPhase('zoom-out');
  await delay(400);
  
  setTransitionPhase('loading');
  const body: any = {
    birthDate: input.birthDate,
    calendar: input.calendar,
  };
  if (input.birthTime) body.birthTime = input.birthTime;
  if (input.calendar === 'lunar') body.isLeapMonth = input.isLeapMonth;
  if (input.birthCity) body.birthCity = input.birthCity;
  if (input.gender) body.gender = input.gender;
  
  try {
    const apiPromise = fetch('/api/saju/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => {
      if (!r.ok) throw new Error('API error');
      return r.json();
    });
    
    const [data] = await Promise.all([apiPromise, delay(500)]);
    setEngine(data.engine);
    setCore(data.core);
    
    setTransitionPhase('zoom-in');
    await delay(400);
    
    setPhase('result');
    setTransitionPhase('idle');
    window.scrollTo({ top: 0 });
  } catch {
    alert('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    setPhase('dialogue');
    setTransitionPhase('idle');
  }
}, []);
```

### 5-4. DialoguePlayer에 새 props 전달

```tsx
<DialoguePlayer
  script={introScript}
  inputFlow={introInputFlow}          // 추가
  onComplete={() => {}}
  onAction={handleAction}
  onInputSubmit={handleInputSubmit}    // 추가
/>
```

### 5-5. InputModal은 유지 (레거시/궁합용)

기존 InputModal 코드와 import는 그대로 둔다.
단, ZONE A 대화 흐름에서는 더 이상 `open_input_modal` action을 사용하지 않는다
(dialogue-intro.json에 해당 action이 없음을 확인).

---

## 수정 6: birthTime 지지→시간 변환

API는 `birthTime`을 `"HH:mm"` 형식으로 기대한다.
12지시 선택(`'子'`, `'丑'` 등)을 중간값 시각으로 변환하는 유틸 추가:

`app/alt2/utils/jijiToTime.ts`:
```ts
const JIJI_TIME: Record<string, string> = {
  '子': '00:00',
  '丑': '02:00',
  '寅': '04:00',
  '卯': '06:00',
  '辰': '08:00',
  '巳': '10:00',
  '午': '12:00',
  '未': '14:00',
  '申': '16:00',
  '酉': '18:00',
  '戌': '20:00',
  '亥': '22:00',
};

export function jijiToTime(jiji: string): string {
  return JIJI_TIME[jiji] || '';
}
```

`buildSajuInput()`에서 birthTime 변환 적용:
```ts
birthTime: collected.birthTime
  ? (JIJI_TIME[collected.birthTime] || collected.birthTime)
  : '',
```

---

## 수정 7: ZONE A 배경 맵 시스템 (4단계 + 모바일 우선)

ZONE A 대화 진행 중 배경에 RPG 맵 이미지를 표시한다.
**모바일 우선** — 배경 영역도 `max-width: 440px` + 좌우 센터링. PC에서 전체 화면을 채울 필요 없다.

### 배경 4단계

| 단계 | 이미지 | 트리거 | 대화 구간 |
|------|--------|--------|-----------|
| 1 | `before.jpg` | 초기 | 복길 등장, 이름·성별 수집 |
| 2 | `after.jpeg` | 생일 입력 확인("맞아") 후 | 유적 외관 (태양+달 신전) |
| 3 | 암전 (검은 화면) | 성별 응답 대사 후 캐릭터 이동 연출 | "건양/곤음의 기운" → 캐릭터가 신전으로 걸어감 → 화면 암전 |
| 4 | `inside_sun.jpeg` 또는 `inside_moon.jpeg` | 암전 후 | 생시·출생지 수집, 마무리 |

**양력 → inside_sun / 음력 → inside_moon** (collectedInput.calendar 기준)

에셋 경로 (모두 존재):
- `/background/before.jpg` — 안개 숲길
- `/background/after.jpeg` — 태양·달 신전 외관
- `/background/inside_sun.jpeg` — 태양 신전 내부 (황금 제단)
- `/background/inside_moon.jpeg` — 달 신전 내부 (푸른 제단)

### 7-1. page.tsx — 배경 상태

```ts
type ZoneBg = 'before' | 'after' | 'blackout' | 'inside_sun' | 'inside_moon';
const [zonaBg, setZonaBg] = useState<ZoneBg>('before');
```

### 7-2. 모바일 우선 배경 컨테이너

배경 이미지를 전체 화면(`fixed inset-0`)이 아닌, 콘텐츠 영역과 동일한 폭으로 제한한다.

```tsx
{/* Fixed background layers */}
<div className="fixed inset-0 flex justify-center" style={{ zIndex: 0 }}>
  {/* 모바일 폭 제한 컨테이너 */}
  <div className="relative w-full" style={{ maxWidth: 440 }}>
    <StarField />
    
    {/* ZONE A: RPG 맵 배경 */}
    {phase === 'dialogue' && (
      <>
        {/* 4장 이미지 레이어 — opacity로 전환 */}
        {(['before', 'after', 'inside_sun', 'inside_moon'] as const).map(bg => (
          <img
            key={bg}
            src={`/background/${bg}.jpeg`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: zonaBg === bg ? 1 : 0,
              transition: 'opacity 0.7s ease',
              objectPosition: 'bottom center',
            }}
          />
        ))}
        
        {/* 암전 레이어 */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: '#1a1e24',
            opacity: zonaBg === 'blackout' ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
        />
        
        {/* 하단 그라데이션 오버레이 (대화창 가독성) */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(62,72,87,0.85) 0%, rgba(62,72,87,0.3) 40%, rgba(62,72,87,0.15) 100%)',
            zIndex: 1,
          }}
        />
      </>
    )}
    
    {/* Silverlining background for ZONE C (기존 유지) */}
    <img
      src="/background/silverlining.jpg"
      alt=""
      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
      style={{ opacity: bgOpacity }}
      loading="lazy"
    />
  </div>
  
  {/* 440px 밖 영역은 어두운 배경 유지 (#3e4857) */}
</div>
```

PC에서는 440px 폭의 가운데 정렬 영역에만 배경 이미지가 표시되고, 양쪽은 기존 `#3e4857` 배경색.

### 7-3. DialoguePlayer 콜백

```ts
// Props
onBgChange?: (bg: ZoneBg) => void;
```

```tsx
// page.tsx에서 전달
<DialoguePlayer
  script={introScript}
  inputFlow={introInputFlow}
  onComplete={() => {}}
  onAction={handleAction}
  onInputSubmit={handleInputSubmit}
  onBgChange={(bg) => setZonaBg(bg)}
/>
```

### 7-4. 전환 시퀀스 (DialoguePlayer 내부)

**트리거 1: before → after**
생일 입력 확인("맞아") 후:
```ts
// 날짜 확인 "맞아" 선택 시
onBgChange?.('after');
```

**트리거 2: after → 캐릭터 이동 → blackout → inside**
성별 응답 대사("건양/곤음의 기운이 느껴지는군") 재생 후,
캐릭터가 신전까지 상하좌우로만 이동하는 연출 + 암전 + 신전 내부 전환.

**이동 규칙: 대각선 이동 금지.** 2D RPG이므로 상하좌우만 허용.
- 위로 이동 → `back`
- 아래로 이동 → `front`
- 좌로 이동 → `left`
- 우로 이동 → `right`

각 구간을 순차적으로 실행하고, 구간마다 direction을 변경한 뒤 position을 이동한다.

**이동 경로는 after.jpeg의 길 색상 (갈색/황토색) 픽셀 분석으로 추출한 중심선을 따른다.**
초록색 필드는 진입 불가. 캐릭터는 반드시 길 위에서만 이동한다.

길 중심선 데이터 (% 좌표):
- 갈림길(fork): (50, 79)
- 좌측 분기 (태양): y=70 center=33 → y=60 center=35 → y=50 center=41 → y=40 center=34 → y=35 center=31
- 우측 분기 (달): y=75~52 center≈58, 신전 입구 (63, 55)

**태양 신전 경로 (양력 — solar):**
갈림길 → 좌 → 상 → 좌 → 상 → 우 → 상 → 좌 → 상 (길의 커브를 따라감)

```ts
const SUN_PATH = [
  { direction: 'left',  x: 40, y: 79, duration: 400 },  // 좌로: 갈림길에서 왼쪽 분기로
  { direction: 'back',  x: 40, y: 72, duration: 500 },  // 상으로: 길을 따라 올라감
  { direction: 'left',  x: 31, y: 72, duration: 400 },  // 좌로: 길이 왼쪽으로 꺾임
  { direction: 'back',  x: 31, y: 58, duration: 600 },  // 상으로: 직진
  { direction: 'right', x: 37, y: 58, duration: 300 },  // 우로: 길이 살짝 오른쪽으로 휨
  { direction: 'back',  x: 37, y: 45, duration: 500 },  // 상으로: 신전 방향 직진
  { direction: 'left',  x: 32, y: 45, duration: 300 },  // 좌로: 신전 입구 쪽으로
  { direction: 'back',  x: 32, y: 38, duration: 400 },  // 상으로: 신전 도착
];
```

**달 신전 경로 (음력 — lunar):**
갈림길 → 우 → 상 → 우 → 상 (우측 분기는 비교적 직선)

```ts
const MOON_PATH = [
  { direction: 'right', x: 58, y: 79, duration: 400 },  // 우로: 갈림길에서 오른쪽 분기로
  { direction: 'back',  x: 58, y: 70, duration: 500 },  // 상으로: 길을 따라 올라감
  { direction: 'right', x: 63, y: 70, duration: 300 },  // 우로: 신전 쪽으로
  { direction: 'back',  x: 63, y: 55, duration: 600 },  // 상으로: 달 신전 도착
];
```

**신전 진입 시퀀스 (비동기):**

```ts
async function enterTempleSequence() {
  const calendar = collectedInput.calendar; // 'solar' or 'lunar'
  const path = calendar === 'lunar' ? MOON_PATH : SUN_PATH;
  
  // 1. 경로를 따라 한 구간씩 이동
  for (const step of path) {
    onDotMove?.({ direction: step.direction });
    // direction 변경 후 약간의 딜레이 (방향 전환이 보이도록)
    await delay(100);
    onDotMove?.({ x: step.x, y: step.y });
    await delay(step.duration);
  }
  
  // 2. 캐릭터 숨기기 + 암전
  onDotMove?.({ visible: false });
  onBgChange?.('blackout');
  await delay(800);
  
  // 3. 신전 내부 배경 전환
  onBgChange?.(calendar === 'lunar' ? 'inside_moon' : 'inside_sun');
  await delay(500);
  
  // 4. 캐릭터 다시 표시 (front, 신전 내부 하단)
  onDotMove?.({ direction: 'front', x: 50, y: 60, visible: true });
  
  // 5. 다음 대사로 진행 (생시 질문 등)
  advanceInputFlow();
}
```

이 시퀀스는 dialogue-intro.json의 `style: "system"` 대사("......", "시간의 유적에 도착했네") 구간에서 발동한다.

**CSS transition으로 이동 구현:**
DotCharacter에 이미 `transition: left 1.2s ease, top 1.2s ease`이 있으므로,
`onDotMove`로 x/y를 변경하면 CSS가 자동으로 부드러운 이동을 처리한다.
각 구간의 `duration`은 CSS transition 완료를 기다리는 대기 시간이므로,
transition duration과 맞추거나 약간 길게 설정한다.

### 7-5. 이미지 표시 스타일

- `object-fit: cover` — 모바일 세로 화면에 맞춤
- `object-position: bottom center` — 숲길/신전 하단이 중요
- before↔after 전환: `transition: opacity 0.7s ease` (크로스페이드)
- after→blackout: `transition: opacity 0.5s ease` (빠른 암전)
- blackout→inside: `transition: opacity 0.7s ease` (서서히 밝아짐)
- `image-rendering: pixelated` 는 배경에는 적용하지 않음 (도트 캐릭터에만 적용)

### 7-6. handleReset 시 배경 초기화

```ts
const handleReset = useCallback(() => {
  setEngine(null);
  setCore(null);
  setPhase('dialogue');
  setBgOpacity(0);
  setZonaBg('before');  // 초기화
  window.scrollTo({ top: 0 });
}, []);
```

---

## 수정 8: DotCharacter — 배경 맵 위 도트 캐릭터 표시

ZONE A 배경 맵(before/after) 위에 복길 도트 캐릭터를 배치한다.
대화 진행 중 맵 위에 작은 캐릭터가 서 있는 RPG 월드맵 느낌.

### 에셋

경로: `/character/front.png`, `back.png`, `left.png`, `right.png`
원본 크기: 약 370~384 × 448~502px (각각 다름)
형식: PNG, 투명 배경
내용: 마법사 고양이 "복길" 도트 스프라이트 4방향

### 8-1. DotCharacter.tsx 신규 생성

파일: `app/alt2/components/base/DotCharacter.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Direction = 'front' | 'back' | 'left' | 'right';

interface DotCharacterProps {
  direction?: Direction;
  /** 배경 맵 대비 캐릭터 높이 (vh 단위). 맵에 자연스럽게 앉히기 위해 조정 */
  size?: number;
  /** 화면 내 수평 위치 (% 단위, 0=왼쪽 100=오른쪽) */
  x?: number;
  /** 화면 내 수직 위치 (% 단위, 0=상단 100=하단) */
  y?: number;
  /** 바운스 애니메이션 활성화 */
  bounce?: boolean;
  visible?: boolean;
}

export default function DotCharacter({
  direction = 'front',
  size = 12,
  x = 50,
  y = 55,
  bounce = true,
  visible = true,
}: DotCharacterProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4 }}
          className="fixed"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 2,  // 배경(0) < 오버레이(1) < 캐릭터(2) < 대화창(10)
            pointerEvents: 'none',
          }}
        >
          <img
            src={`/character/${direction}.png`}
            alt="복길"
            style={{
              height: `${size}vh`,
              width: 'auto',
              imageRendering: 'pixelated',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
            }}
            className={bounce ? 'animate-bounce-gentle' : ''}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### 8-2. 바운스 애니메이션 CSS

`app/alt2/globals.css` 또는 tailwind 설정에 추가:

```css
@keyframes bounce-gentle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.animate-bounce-gentle {
  animation: bounce-gentle 1.2s ease-in-out infinite;
}
```

이것은 걷기 프레임이 없는 정지 스프라이트에 생동감을 주기 위한 미세 바운스.

### 8-3. page.tsx에 DotCharacter 배치

```tsx
import DotCharacter from './components/base/DotCharacter';

// state 추가
const [dotDirection, setDotDirection] = useState<'front' | 'back' | 'left' | 'right'>('front');
const [dotPosition, setDotPosition] = useState({ x: 50, y: 60 });
```

배경 영역 내 렌더링 (오버레이와 같은 레벨 또는 바로 위):

```tsx
{/* ZONE A: RPG 맵 배경 */}
{phase === 'dialogue' && (
  <>
    {/* before/after 맵 이미지 (수정 7에서 추가) */}
    {/* ... */}
    
    {/* 그라데이션 오버레이 (수정 7에서 추가) */}
    {/* ... */}
    
    {/* 도트 캐릭터 */}
    <DotCharacter
      direction={dotDirection}
      size={10}
      x={dotPosition.x}
      y={dotPosition.y}
      bounce={true}
      visible={true}
    />
  </>
)}
```

### 8-4. 캐릭터 상태를 page.tsx에서 통합 관리

```ts
const [dotState, setDotState] = useState({
  direction: 'front' as 'front' | 'back' | 'left' | 'right',
  x: 50,
  y: 60,
  visible: true,
});
```

DialoguePlayer에 캐릭터 제어 콜백 전달:
```tsx
<DotCharacter {...dotState} size={10} bounce={true} />

<DialoguePlayer
  // ...기존 props
  onBgChange={(bg) => setZonaBg(bg)}
  onDotMove={(state) => setDotState(prev => ({ ...prev, ...state }))}
/>
```

### 8-5. 배경 단계별 캐릭터 위치·방향

| 배경 단계 | direction | x(%) | y(%) | visible | 설명 |
|-----------|-----------|------|------|---------|------|
| before (초기) | `front` | 50 | 79 | true | 숲길 갈림길 중앙 (Y자 분기점), 유저를 바라봄 |
| after (초기) | `back` | 50 | 79 | true | 갈림길에서 신전을 바라봄 |
| after → 태양 신전 | 좌→상→좌→상→우→상→좌→상 | 50→...→32 | 79→...→38 | true | SUN_PATH 8구간 |
| after → 달 신전 | 우→상→우→상 | 50→...→63 | 79→...→55 | true | MOON_PATH 4구간 |
| blackout | — | — | — | false | 캐릭터 숨김 + 암전 |
| inside_sun / inside_moon | `front` | 50 | 60 | true | 신전 내부, 유저를 바라봄 |

캐릭터 이동은 CSS transition으로 처리:
```tsx
style={{
  left: `${x}%`,
  top: `${y}%`,
  transition: 'left 1.2s ease, top 1.2s ease, opacity 0.4s ease',
}}
```

`size` 값은 배경 맵 대비 캐릭터가 자연스러운 크기로 보이도록 조정.
모바일(세로 화면) 기준으로 `8~12vh`가 적절할 것으로 예상되나, 실제 렌더링 후 판단.

### 8-6. DotCharacter도 모바일 컨테이너 내부에 배치

DotCharacter는 `fixed` 전체화면이 아닌, **배경 컨테이너(max-width 440px) 내부의 `absolute` 배치**로 변경.
배경 이미지와 동일한 영역 안에서만 표시되어야 한다.

```tsx
// page.tsx 배경 컨테이너 내부에 배치
<div className="relative w-full h-full" style={{ maxWidth: 440 }}>
  {/* 배경 이미지들 ... */}
  
  {/* 도트 캐릭터 (배경 컨테이너 내부) */}
  {phase === 'dialogue' && (
    <DotCharacter {...dotState} size={10} bounce={true} />
  )}
  
  {/* 그라데이션 오버레이 ... */}
</div>
```

DotCharacter 컴포넌트의 position을 `fixed` → `absolute`로 변경.

### 8-7. handleReset 시 캐릭터 초기화

```ts
const handleReset = useCallback(() => {
  // 기존 초기화...
  setZonaBg('before');
  setDotState({ direction: 'front', x: 50, y: 79, visible: true });
  window.scrollTo({ top: 0 });
}, []);
```

---

## 검증 체크리스트

구현 완료 후 아래를 확인:

**대화형 입력 시스템:**
1. `npm run build` 에러 없음
2. 브라우저에서 ZONE A 대화가 정상 재생됨
3. "함께 가겠습니다" 선택 → inputFlow로 전환
4. "조금 더 알려주세요" 선택 → 추가 설명 대사 재생 후 다시 선택지
5. 이름 입력 → 텍스트 필드 표시, 입력 후 분기 응답 재생
6. 이름 건너뛰기 → _skip 응답 재생
7. 성별 선택 → 분기 응답
8. 생년월일 선택 → 양음력 토글 + 날짜 셀렉터 통합 UI, 확인 후 날짜 확인 분기("이 날이 맞는가?")
9. "다시 입력할게" → birthdate 입력 단계로 되돌아감 (calendar/birthDate/isLeapMonth 초기화)
10. (음력 + 윤달 있는 해/월 입력 시) 윤달 질문 동적 삽입
11. (양력이면) 윤달 질문 스킵
12. 생시 → 12지시 그리드 + 1분 단위 분 선택기, 선택 후 해당 지지 분기 응답
13. 생시 모름 → unknown 응답
14. 출생지 → 드롭다운, 확인 후 응답
15. 마지막 대사 → `submit_and_transition` → 트랜지션 + API 호출 → 결과 표시
16. API 결과가 정상적으로 ZONE B에 렌더링됨

**배경 맵 + 도트 캐릭터:**
17. 배경·캐릭터 영역이 max-width 440px로 제한되어 모바일 우선 표시
18. ZONE A 시작 시 before.jpg 배경 + front 방향 도트 캐릭터 표시
19. 도트 캐릭터가 `image-rendering: pixelated`로 선명하게 렌더링됨
20. 도트 캐릭터 바운스 애니메이션 동작
21. 생년월일 확인("맞아") 후 before→after 크로스페이드 + 캐릭터 back 방향 전환
22. 성별 응답("건양/곤음") 후 캐릭터가 신전 방향으로 이동 → 암전 → 신전 내부 배경 전환
23. 양력이면 inside_sun.jpeg, 음력이면 inside_moon.jpeg 표시
24. 신전 내부에서 캐릭터 front 방향으로 재등장
25. 하단 그라데이션 오버레이로 대화창 텍스트 가독성 확보
26. "다시하기" 시 배경 before + 캐릭터 front로 초기화

---

## 주의사항

- `dialogue-intro.json`의 `inputFlow` 대사에서 `character`가 대부분 `"magician"`이다. Portrait 컴포넌트가 `/character/magician.svg`를 정상 로드하는지 확인.
- `responses` 맵의 키가 한자(`子`, `丑` 등)이므로 exact match 주의.
- `{{value}}` 치환은 `_any` 응답에서만 사용. 정확한 키 매칭이 우선, 없으면 `_any` 폴백.
- `style: 'system'` 대사(예: `"......"`)는 포트레이트 없이 중앙 텍스트로 표시됨 (기존 DialogueBox 동작).
- `name` 필드가 없는 대사는 기존 DialoguePlayer의 "마지막으로 name이 있었던 라인에서 가져오기" 로직 유지.
- `responses` 매칭 순서: **정확한 키 매칭 우선** → `_any` (와일드카드 폴백) → `_skip` (건너뛰기 전용). `_any`와 `_skip`은 서로 다른 트리거: `_any`는 `onSubmit(value)` 시, `_skip`은 `onSkip()` 시.
- `inputConfig.options`가 있으면 해당 배열로 `<select>` 또는 버튼 목록을 동적 생성한다 (city 타입에서 사용).
- `lines` 배열 내 `show_choices`의 `continue` action은 기존대로 다음 라인 진행. `inputFlow` 내에서도 action 없는 일반 대사는 탭으로 진행 (별도 입력 없이 내러티브만 표시하는 중간 대사가 있음).
- `date` 입력의 년도 범위: `1920~2025`. 기본 선택값은 1990년 1월 1일.
