# 콘텐츠 작성 가이드 — RPG 대화 스크립트

이 문서는 alt2 프론트엔드에서 사용하는 대화 스크립트 JSON 파일의 작성 규칙이다.
작성한 JSON을 `public/content/` 폴더에 저장하면 프론트엔드가 로드한다.

---

## 세계관 & 내러티브 프레임

### 캐릭터 설정

- **안내자(도인)**: 대마법사 멀린의 후예. 시간을 되돌려 사람의 숨겨진 힘을 찾아주는 마법의 최고 권위자.
- **유저**: 안내자의 존재를 알고 직접 찾아온 사람. 자신의 숨겨진 힘(사주팔자)을 알고 싶어한다.

### ZONE A 스토리 구조 (dialogue-intro.json)

대화는 크게 **도입 → 입력 수집 → 전환** 3막으로 구성된다.

**1막: 만남 (lines)**

유저가 안내자를 찾아온다. 안내자는 유저를 맞이하며 자신이 시간의 마법을 다루는 멀린의 후예임을 밝힌다. 유저의 이름과 성별을 확인하고, 함께 "시간의 유적"으로 떠날 준비를 한다.

- 캐릭터 등장: doin(도인) → 유저 확인 대화
- 선택지: "나의 사주 보기" → `start_input_flow`로 2막 전환

**2막: 시간의 유적 (inputFlow)**

안내자와 유저가 시간의 유적으로 이동한다. 유적에서 유저가 태어난 시점으로 시간을 되돌린다.

| 이벤트 | 대사 방향 | 수집 항목 |
|--------|----------|----------|
| 멀린의 후예와 첫 인사 | 유저 확인 | `input_name` + `input_gender` |
| 유적 이동 준비 | "자네의 기록은 어떤 달력에...?" | `input_calendar` |
| 유적 도착, 시간 이동 | (연출 대사, system 스타일) | — |
| 달력 발견 | "이곳에 달력이 놓여 있군. 확인해보게" | `input_birthdate` |
| (윤달 해당 시) 달력이 두 장 겹침 | "이 달력이 두 겹이야..." | `input_leapmonth` |
| 시계 발견 | "출생의 비밀... 이 시계를 보게" | `input_birthtime` → 12지지 분기 응답 |
| 장소의 기억 회상 | "이곳의 기운이 느껴지나?" | `input_birthcity` |

**3막: 전환**

모든 정보가 모이면 유적의 네 기둥(사주)이 빛나기 시작한다. `submit_and_transition` → 픽셀 줌 트랜지션 → ZONE B 결과.

### 톤 & 화법

- 도인(doin): 해라체. "~하게", "~이로군", "~인가". 위엄 있지만 따뜻한 노현자.
- 안내자(speak/normal/flash 등): 해요체. "~해요", "~이에요", "~볼까요?". 다정하고 밝은 길잡이.
- system 스타일: 장면 전환 묘사. "...어둠 속에서 빛이 새어나온다."

---

## 파일 목록

| 파일명 | 용도 | 재생 방식 |
|--------|------|----------|
| `dialogue-intro.json` | ZONE A 도입 대화 (서비스 첫 진입) | 풀스크린 RPG 대화창, 탭 진행 |
| `dialogue-upsell.json` | ZONE C 과금 유도 대화 | 인라인 대화창, 스크롤 내 |
| `dialogue-gungham.json` | 궁합 유도 대화 | 인라인 대화창, 스크롤 내 |
| `dialogue-result-comments.json` | ZONE B 결과 해석 코멘트 템플릿 | 인라인 대화창, 자동 재생 |

---

## JSON 구조

### 기본 포맷

```json
{
  "id": "intro",
  "description": "서비스 도입 대화 시퀀스",
  "lines": [
    { ... },
    { ... }
  ]
}
```

### 대사 한 줄 (DialogueLine)

```json
{
  "character": "normal",
  "name": "안내자",
  "text": "안녕하세요.\n저는 시간의 안내자예요.",
  "style": "normal"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `character` | string | ✓ | 포트레이트 파일명 (아래 12종 중 택 1) |
| `name` | string | 선택 | 화자 이름. 대화창 상단에 노란색으로 표시. 생략 시 이전 대사의 이름 유지 |
| `text` | string | ✓ | 대사 본문. `\n`으로 줄바꿈. 3줄 이내 권장 (모바일 대화창 높이 제한) |
| `style` | string | 선택 | `normal` (기본), `emphasis` (강조, 노란색), `whisper` (작게, 흐리게), `system` (포트레이트 없이 중앙 텍스트) |
| `icon` | string | 선택 | 대사 옆에 작게 표시할 아이콘 (icon/ 파일명, 확장자 제외) |
| `action` | string | 선택 | 이 대사 타이핑 완료 후 트리거할 동작 |
| `choices` | array | 선택 | `action: "show_choices"`일 때 표시할 선택지 목록 |

---

## 캐릭터 목록 (12종)

대화창 좌측 포트레이트로 표시된다. 표정에 맞는 캐릭터를 선택.

| character 값 | 표정/분위기 | 언제 사용 |
|-------------|------------|----------|
| `normal` | 기본, 차분 | 일반 안내, 시작 |
| `speak` | 말하는 중 | 설명, 해설, 긴 텍스트 |
| `excite` | 기쁨, 들뜸 | 긍정적 결과, 좋은 소식 |
| `flash` | 번뜩, 깨달음 | 핵심 포인트, 전환 순간 |
| `crazy` | 놀람, 충격 | 의외의 결과, 반전 |
| `dizzy` | 혼란, 어지러움 | 복잡한 관계, 형충 |
| `dspt` | 걱정, 근심 | 주의 사항, 약점 언급 |
| `sweat` | 당황, 쑥스러움 | 민감한 주제, 어려운 설명 전환 |
| `angel` | 천사, 밝음 | 긍정 해석, 과금 유도(밝은 쪽) |
| `devil` | 악마, 장난 | 경고, 과금 유도(어두운 쪽) |
| `magician` | 마법사, 신비 | 로딩, 분석 중, 신비로운 해설 |
| `doin` | 도인, 현자 | 궁합, 심층 해석, 대운 코멘트 |

---

## action 목록

### 기본 action

| action 값 | 동작 |
|-----------|------|
| `show_choices` | 선택지 패널 표시 (choices 필드 필수) |
| `start_input_flow` | 대화형 입력 수집 시작 (inputFlow 배열로 전환) |
| `submit_and_transition` | 수집 완료 → API 호출 + 픽셀 줌 트랜지션 |
| `open_input_modal` | 레거시: 입력 폼 팝업 (궁합/수정용) |
| `open_gungham_2` | 2인 궁합 입력 팝업 열기 |
| `open_gungham_3` | 3인 궁합 입력 팝업 열기 |
| `continue` | 대화 계속 (다음 줄로) |

### 대화형 입력 action (inputFlow 내에서 사용)

| action 값 | 동작 | UI |
|-----------|------|----|
| `input_name` | 이름 입력 | 텍스트 필드 + 확인 + 건너뛰기 |
| `input_gender` | 성별 선택 | [남성] [여성] + 건너뛰기 |
| `input_calendar` | 양력/음력 선택 | [양력] [음력] |
| `input_birthdate` | 생년월일 입력 | 년/월/일 셀렉터 |
| `input_leapmonth` | 윤달 여부 | [예] [아니오] — 시스템이 자동 판단, 해당 시에만 등장 |
| `input_birthtime` | 생시 입력 | 12지시 그리드 + [모르겠어요] |
| `input_birthcity` | 출생지 선택 | 도시 드롭다운 + 건너뛰기 |

---

## 선택지 (choices)

`action: "show_choices"`인 대사에 함께 사용.

```json
{
  "character": "flash",
  "name": "안내자",
  "text": "준비되셨나요?",
  "action": "show_choices",
  "choices": [
    { "label": "나의 사주 보기", "action": "start_input_flow", "style": "primary" },
    { "label": "조금 더 알려줘", "action": "continue", "style": "secondary" }
  ]
}
```

| 필드 | 설명 |
|------|------|
| `label` | 버튼 텍스트 |
| `action` | 클릭 시 동작 (action 목록 참조) |
| `style` | `primary` (밝은 배경, 주요 동작) 또는 `secondary` (반투명, 보조) |

---

## 대화형 입력 (inputFlow)

`dialogue-intro.json`에서 `lines` 외에 `inputFlow` 배열을 추가로 작성한다.
유저가 "나의 사주 보기"(`start_input_flow`)를 선택하면 `inputFlow`로 전환된다.

### 추가 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `inputConfig` | object | 입력 위젯 설정 |
| `inputConfig.placeholder` | string | 텍스트 입력 힌트 |
| `inputConfig.skipLabel` | string | 건너뛰기 버튼 텍스트. 없으면 필수 입력 |
| `inputConfig.skipValue` | string | 건너뛰기 시 저장할 기본값 |
| `inputConfig.options` | array | 도시 선택 등에서 사용할 목록 |
| `responses` | object | 입력값에 따른 캐릭터 분기 응답 |

### responses 키 규칙

| 키 | 매칭 조건 |
|----|----------|
| 구체적 값 (`"M"`, `"子"`, `"solar"` 등) | 해당 값과 정확히 일치 |
| `"_any"` | 어떤 값이든 매칭 (구체적 키가 없을 때 폴백) |
| `"_skip"` | 건너뛰기를 선택했을 때 |

responses 안의 `text`에서 `{{value}}`를 쓰면 유저가 입력한 값으로 치환된다.

### inputFlow 작성 예시

```json
{
  "character": "doin",
  "name": "도인",
  "text": "자네의 이름이 무엇인가?",
  "action": "input_name",
  "inputConfig": {
    "placeholder": "이름을 입력하세요",
    "skipLabel": "건너뛰기"
  },
  "responses": {
    "_any": { "character": "doin", "text": "{{value}}... 좋은 이름이로군." },
    "_skip": { "character": "doin", "text": "이름을 밝히지 않겠다는 건가.\n그것도 하나의 선택이지." }
  }
}
```

```json
{
  "character": "doin",
  "text": "자네는 자네 출생에 대한\n비밀을 들은 적이 있는가?",
  "action": "input_birthtime",
  "inputConfig": { "skipLabel": "모르겠어요", "skipValue": "unknown" },
  "responses": {
    "子": { "character": "crazy", "text": "자시라... 한밤중의 기운을 타고났군!\n물의 시작점이야." },
    "丑": { "character": "doin",  "text": "축시... 소가 밭을 가는 시간이지.\n묵묵하지만 단단한 기운이로군." },
    "寅": { "character": "excite","text": "인시! 호랑이의 시간이라.\n새벽을 깨우는 강한 기운이 느껴지는걸." },
    "卯": { "character": "flash", "text": "묘시라... 토끼의 시간.\n부드럽지만 날카로운 감각이 있겠구먼." },
    "辰": { "character": "magician","text": "진시! 용의 시간이로군.\n하늘의 기운이 충만한 때에 태어났어." },
    "巳": { "character": "speak", "text": "사시... 뱀의 시간이야.\n지혜롭고 깊이 있는 기운이군." },
    "午": { "character": "excite","text": "오시라! 말의 시간이지.\n한낮의 양기가 최고조인 때야!" },
    "未": { "character": "doin",  "text": "미시... 양의 시간이로군.\n온화하지만 속은 단단한 기운이야." },
    "申": { "character": "flash", "text": "신시! 원숭이의 시간.\n영리하고 재빠른 기운이 느껴지는걸!" },
    "酉": { "character": "speak", "text": "유시라... 닭의 시간이지.\n정밀하고 날카로운 금의 기운이군." },
    "戌": { "character": "doin",  "text": "술시... 개의 시간이야.\n의리 있고 충직한 기운이 강하겠어." },
    "亥": { "character": "crazy", "text": "해시라! 돼지의 시간이지.\n물의 기운을 품고 태어났군." },
    "unknown": { "character": "sweat", "text": "때론 모르는 것이\n나을 수도 있지..." }
  }
}
```

### 윤달 질문

윤달 질문(`input_leapmonth`)은 JSON에 작성하지 않는다.
시스템이 유저의 음력 년/월을 확인 후 윤달이 존재하면 자동으로 삽입한다.

### 주의사항

1. inputFlow 내 대사도 **3줄 이내** 권장 (대화창 높이 제한)
2. responses의 text에도 3줄 이내 유지
3. 12지지 응답은 캐릭터 표정을 다양하게 배분 (단조로움 방지)
4. `_any` 응답에서 `{{value}}`를 사용할 때 길이가 길 수 있으므로 줄바꿈 고려

---

## 아이콘 목록

`icon` 필드에 사용 가능한 아이콘 (public/icon/ 내 파일):

| icon 값 | 모양 | 용도 |
|---------|------|------|
| `star` | 별 | 강조, 구분선 |
| `heart` | 하트 | 궁합, 인연 |
| `excl` | 느낌표 | 주의, 중요 |
| `ques` | 물음표 | 질문, 유도 |
| `boom` | 폭발 | 충격, 충(衝) |
| `angry` | 화남 | 형(刑), 갈등 |
| `music` | 음표 | 합(合), 조화 |
| `wait` | 모래시계 | 대기, 시간 |
| `stamp` | 도장 | 확인, 마무리 |

오행 아이콘(mok_yang, hwa_yin 등)은 대화창에서는 사용하지 않고 차트/조견표에서만 사용.

---

## 작성 예시

### dialogue-intro.json (ZONE A 도입)

```json
{
  "id": "intro",
  "description": "서비스 첫 진입 시 RPG 대화 시퀀스",
  "lines": [
    {
      "character": "normal",
      "name": "안내자",
      "text": "..."
    },
    {
      "character": "speak",
      "text": "..."
    },
    {
      "character": "speak",
      "text": "...",
      "icon": "star"
    },
    {
      "character": "excite",
      "text": "...",
      "style": "emphasis"
    },
    {
      "character": "flash",
      "text": "...",
      "style": "emphasis",
      "action": "show_choices",
      "choices": [
        { "label": "나의 사주 보기", "action": "start_input_flow", "style": "primary" },
        { "label": "조금 더 알려줘", "action": "continue", "style": "secondary" }
      ]
    },
    {
      "character": "speak",
      "text": "...\n...",
      "style": "normal"
    },
    {
      "character": "flash",
      "text": "...",
      "action": "show_choices",
      "choices": [
        { "label": "나의 사주 보기", "action": "start_input_flow", "style": "primary" }
      ]
    }
  ]
}
```

> **참고**: "조금 더 알려줘"를 선택하면 대화가 계속되어 추가 설명 후
> 다시 "나의 사주 보기" 선택지가 등장한다. 이런 분기 구조가 가능하다.

### dialogue-upsell.json (ZONE C 과금 유도)

```json
{
  "id": "upsell",
  "description": "무료 결과 후 과금 유도 대화",
  "lines": [
    {
      "character": "angel",
      "name": "안내자",
      "text": "...",
      "style": "normal"
    },
    {
      "character": "devil",
      "text": "...",
      "style": "whisper"
    },
    {
      "character": "angel",
      "text": "...",
      "style": "emphasis"
    }
  ]
}
```

### dialogue-gungham.json (궁합 유도)

```json
{
  "id": "gungham-tease",
  "description": "개인 결과 후 궁합 유도",
  "lines": [
    {
      "character": "doin",
      "name": "도인",
      "text": "...",
      "style": "normal"
    },
    {
      "character": "doin",
      "text": "...",
      "action": "show_choices",
      "choices": [
        { "label": "2인 궁합 보기", "action": "open_gungham_2", "style": "primary" },
        { "label": "3인 궁합 보기", "action": "open_gungham_3", "style": "secondary" }
      ]
    }
  ]
}
```

### dialogue-result-comments.json (결과 내 코멘트 템플릿)

이 파일은 **템플릿**이다. `{{변수}}`는 프론트엔드에서 실제 분석 데이터로 치환된다.

```json
{
  "id": "result-comments",
  "description": "ZONE B 결과 내 인라인 대화창 템플릿",
  "sections": {
    "after_pillar_table": [
      {
        "character": "speak",
        "name": "안내자",
        "text": "{{easyNarration_pillar}}"
      }
    ],
    "after_seun": [
      {
        "character": "speak",
        "text": "{{easyNarration_seun}}"
      }
    ],
    "after_oheng": [
      {
        "character": "flash",
        "text": "{{easyNarration_oheng}}",
        "style": "emphasis"
      }
    ],
    "free_section_end": [
      {
        "character": "normal",
        "text": "여기까지가 당신의 사주에서\n보이는 겉모습이에요.",
        "style": "normal"
      },
      {
        "character": "speak",
        "text": "더 깊은 이야기가 궁금하다면...",
        "style": "whisper"
      }
    ]
  }
}
```

> `{{easyNarration_pillar}}` 같은 변수는 LLM Phase 1에서 생성된 쉬운말 해설이 들어간다.
> 프론트엔드가 API 응답의 해당 필드를 여기에 삽입한다.

---

## 작성 팁

1. **한 대사 3줄 이내**: 모바일 대화창 높이가 화면의 35%. 4줄 넘으면 스크롤이 생겨 RPG 느낌 깨진다.

2. **표정 전환을 자주**: 같은 캐릭터가 계속되면 단조로움. 2~3대사마다 표정을 바꿔주면 살아있는 느낌.

3. **선택지는 2개가 적정**: 모바일에서 3개 이상 선택지는 답답함. 최대 2개 권장.

4. **첫 대사에 name 필수**: 이후 같은 화자면 생략 가능. 화자가 바뀌면 다시 name 명시.

5. **style: 'system'은 절제해서**: 포트레이트 없는 시스템 메시지. 장면 전환이나 시간 경과 표현에만.

6. **icon은 1~2대사에 하나**: 너무 많으면 산만함.

7. **"조금 더 알려줘" 분기**: intro에서 추가 설명→재선택 패턴이 리텐션에 유리. 2단계까지만 (3단계 이상은 이탈).
