# alt2 프론트엔드 구현 명령서 v3

> 이 문서는 Claude Code 세션에서 순서대로 실행할 작업 지시서다.
> 각 단계는 이전 단계 완료 후 진행한다. 코딩 시작 전 사용자 승인 필수.
> 디자인 기준: `DESIGN-ALT2.md` (Mystical Night 테마)

---

## 핵심 변경 사항 (v2 → v3)

1. **대화 시스템: 턴제 RPG 스타일 대화창**으로 전면 전환
   - 기존: 스크롤 기반 말풍선 (청월당 스타일)
   - 변경: 하단 고정 대화창 + 캐릭터 포트레이트 + 탭 진행 (파랜드택틱스/영웅전설 스타일)
2. **캐릭터 표시: 포트레이트(얼굴 크롭)** — 전신이 아닌 상반신/얼굴
   - 12종 표정 변화가 "대사에 맞는 표정 교체"로 자연스럽게 활용됨
   - 멀티레이어 애니메이션(B안) 폐기 → 포트레이트 전환 효과로 대체
3. **ZONE A: 탭 진행 대화** (스크롤 아님)
4. **ZONE B: 스크롤 레이아웃 + 인라인 대화창** (해석/코멘트 구간)
5. **ZONE C: 대화창으로 과금 유도 스토리**
6. 기존 유지: 상세페이지형 스크롤, 팝업 모달, 궁합 2/3인, silverlining 배경 전환

### 왜 RPG 대화창인가

캐릭터 SVG가 래스터(PNG-in-SVG) 구조라 부위별 애니메이션에 한계가 있다.
턴제 RPG 대화창은:
- 포트레이트(얼굴 크롭)만으로 12종 표정이 충분한 연출이 됨
- 텍스트 공간이 넓어 더 많은 해설을 자연스럽게 전달 가능
- 탭 진행으로 사용자 통제감(페이스 조절) 제공
- 서비스 전체에 일관된 인터랙션 문법 부여

---

## 에셋 인벤토리

### 캐릭터 (public/character/) — 포트레이트 모드

12종 캐릭터를 **포트레이트(얼굴/상반신 크롭)**로 대화창 좌측에 표시한다.
원본 SVG 전체가 아닌 상단 영역만 잘라서 사용.

| 파일명 | 표정/상태 | 대화창 용도 |
|--------|-----------|------------|
| normal.svg | 기본, 무표정 | 일반 안내, 랜딩 |
| speak.svg | 말하는 중 | 해설, 설명 |
| excite.svg | 기쁨, 흥분 | 긍정적 해석, 길(吉) |
| flash.svg | 깨달음, 번뜩 | 핵심 포인트 강조 |
| crazy.svg | 놀람 | 의외의 결과, 반전 |
| dizzy.svg | 혼란 | 복잡한 관계, 충(衝) |
| dspt.svg | 걱정 | 주의 사항, 약점 |
| sweat.svg | 당황 | 어려운 설명 전환 |
| angel.svg | 천사 (선한) | 긍정 해석, 과금 유도(밝은쪽) |
| devil.svg | 악마 (장난) | 부정/경고, 과금 유도(어두운쪽) |
| magician.svg | 마법사 | 로딩, 분석 중, 신비로운 해설 |
| doin.svg | 도인 (수염) | 궁합 해설, 심층 해석, 대운 코멘트 |

**포트레이트 크롭 규칙:**
- 원본 SVG의 viewBox 상단 60% 영역을 사용 (얼굴+상체)
- CSS `object-position: top center`, `object-fit: cover`로 구현
- 크롭하지 않고 CSS로 처리하므로 별도 이미지 가공 불필요
- 대화창 내 포트레이트 영역: 80×80px (모바일), border-radius 12px

### 아이콘 (public/icon/)

**오행 음양 (10종):**
`mok_yang.svg`, `mok_yin.svg`, `hwa_yang.svg`, `hwa_yin.svg`,
`to_yang.svg`, `to_yin.svg`, `geum_yang.svg`, `geum_yin.svg`,
`su_yang.svg`, `su_yin.svg`

**감정/브랜딩 (9종):**
`angry.svg`, `boom.svg`, `excl.svg`, `heart.svg`, `music.svg`,
`ques.svg`, `stamp.svg`, `star.svg`, `wait.svg`

### 배경 (public/background/)

`silverlining.jpg` — 3753×5630 세로형. 하단 어두운 구름, 상단 빛 관통.
결과 하단(과금 유도 구간)에서 등장. CSS `background-position` 스크롤 연동.

---

## 사전 준비

### 0-1. 의존성 설치

```bash
npm install framer-motion
```

Google Fonts는 `app/alt2/layout.tsx`에서 `next/font/google`로 로드:
- `Gaegu` (weight: 400) — 캐릭터 말풍선 전용
- `Noto Sans KR` (폴백) — Pretendard CDN 불안정 시

### 0-2. alt1 코드 이전

기존 `app/page.tsx`와 `app/components/`를 alt1 경로로 이전한다.

```
app/
├── alt1/
│   ├── page.tsx          ← 기존 app/page.tsx 이동 (import 경로 수정)
│   └── components/
│       ├── SajuForm.tsx
│       ├── PillarTable.tsx
│       ├── CoreJudgment.tsx
│       └── InterpretationStream.tsx
├── alt2/                 ← 신규 생성
│   ├── layout.tsx
│   ├── page.tsx
│   └── components/
├── api/                  ← 변경 없음
│   └── saju/
│       ├── analyze/route.ts
│       └── interpret/route.ts
├── layout.tsx            ← 루트 레이아웃 유지
└── page.tsx              ← alt 선택 페이지 또는 alt1 redirect
```

**작업 내용:**
1. `app/alt1/` 디렉터리 생성
2. `app/alt1/components/` 디렉터리 생성
3. `app/components/` 내 4개 파일을 `app/alt1/components/`로 이동
4. `app/page.tsx`를 `app/alt1/page.tsx`로 이동, import 경로를 `./components/...`로 수정
5. 루트 `app/page.tsx`를 새로 작성 — `/alt2`로 redirect:

```tsx
import { redirect } from 'next/navigation';
export default function Home() { redirect('/alt2'); }
```

6. `npm run build`로 빌드 정상 확인

### 0-3. alt2 디렉터리 구조

```
app/alt2/
├── layout.tsx                  ← 다크 테마 + 폰트 + meta
├── page.tsx                    ← 메인 상태 머신
└── components/
    ├── base/                   ← 기반 UI 부품
    │   ├── DialogueBox.tsx     ← ★ RPG 대화창 (핵심 컴포넌트)
    │   ├── Portrait.tsx        ← 캐릭터 포트레이트 (얼굴 크롭)
    │   ├── DotCharacter.tsx    ← ★ 도트 캐릭터 배경 연출 (걷기 애니메이션)
    │   ├── StarField.tsx       ← 별빛 파티클 (CSS keyframes)
    │   ├── OhengIcon.tsx       ← 오행 음양 아이콘 렌더러
    │   ├── SectionDivider.tsx  ← 브랜딩 구분선
    │   └── ZoneTransition.tsx  ← ★ 픽셀 줌 트랜지션 (ZONE A→B)
    │
    ├── dialogue/               ← ZONE A: RPG 대화 시퀀스
    │   ├── DialoguePlayer.tsx  ← 대화 시퀀스 재생기 (탭 진행)
    │   └── ChoicePanel.tsx     ← 선택지 패널 (입력 유도 등)
    │
    ├── input/                  ← 입력 관련
    │   └── InputModal.tsx      ← 팝업 모달 (createPortal)
    │
    ├── result/                 ← ZONE B: 무료 결과 (스크롤)
    │   ├── PillarTable.tsx     ← 조견표 (한자+음차+십성+지장간+합충형해파)
    │   ├── SinsalRow.tsx       ← 신살 열
    │   ├── DaeunTimeline.tsx   ← 대운 가로 스크롤 타임라인
    │   ├── SeunCard.tsx        ← 세운 (올해/내년)
    │   ├── OhengRelation.tsx   ← 오행 상관관계 (고정 이미지)
    │   ├── OhengRadar.tsx      ← 오행 분포 펜타곤 차트
    │   └── InlineDialogue.tsx  ← ★ 결과 내 인라인 대화창 (해석 코멘트)
    │
    ├── gungham/                ← 궁합 기능
    │   ├── GunghamTeaser.tsx   ← 궁합 유도 (대화창으로)
    │   ├── GunghamModal.tsx    ← 궁합 입력 팝업 (2인/3인)
    │   └── GunghamResult.tsx   ← 궁합 결과 표시
    │
    └── upsell/                 ← ZONE C: 과금 유도
        ├── UpsellDialogue.tsx  ← 과금 유도 대화 시퀀스
        └── CtaButton.tsx       ← 유료 전환 버튼
```

---

## 단계 1: 기반 컴포넌트

### 1-1. `app/alt2/layout.tsx`

**요구사항:**
- `next/font/google`로 `Gaegu` (weight: 400) 로드
- 본문: `"Pretendard Variable", "Noto Sans KR", sans-serif`
- `<body>` 배경: `#3e4857`
- 전체 텍스트 기본 색: `#dde1e5`
- `min-h-screen`, `overflow-x-hidden`
- `max-width: 440px`, `mx-auto` 중앙 정렬
- 메타데이터: `title: '제3의시간 — 당신의 시간 속 이야기'`

### 1-2. `StarField.tsx`

**요구사항:**
- 20~30개 작은 원(2~4px), 무작위 위치 (`position: fixed`, `inset: 0`, `pointer-events: none`)
- 색상: `#dde1e5`
- CSS `@keyframes twinkle`: `opacity 0.2 → 0.8 → 0.2`, 2~5초 랜덤 주기
- `will-change: opacity` GPU 가속
- `useEffect`로 마운트 시 별 배열 생성 (SSR에서는 빈 배열)
- JS 파티클 라이브러리 금지. 순수 CSS keyframes + div.
- **z-index: 0** (모든 콘텐츠 아래)

### 1-3. `DotCharacter.tsx` — ★ 도트 캐릭터 배경 연출

ZONE A 대화 진행 중 배경(StarField 위)에서 걸어다니는 작은 캐릭터.
대화 내용과 무관한 시각적 생동감 요소. 에셋이 없어도 MVP는 동작한다.

**Props:**
```ts
interface DotCharacterProps {
  spriteSheet?: string;        // 스프라이트 시트 경로 (없으면 CSS 대안)
  frameCount?: number;         // 프레임 수 (기본 4)
  frameSize?: number;          // 프레임 1개 크기 px (기본 32)
  speed?: number;              // 이동 속도 (기본 30, px/s)
  direction?: 'left' | 'right';
  y?: number;                  // 세로 위치 % (기본 40)
}
```

**스프라이트 시트 에셋 규격:**
```
public/sprite/
├── guide_walk.png    ← 안내자 캐릭터 걷기 (4프레임, 가로 나열)
└── (추후 추가)
```
- 캔버스: 32×32px per frame, 4프레임 → 128×32px 시트 1장
- 배경: 투명(PNG)
- 화풍: 현재 캐릭터의 단순화된 도트 버전

**스프라이트 애니메이션 (에셋 있을 때):**
```css
.dot-sprite {
  width: 32px;
  height: 32px;
  background: url('/sprite/guide_walk.png') 0 0 no-repeat;
  background-size: 128px 32px;
  image-rendering: pixelated;          /* 도트 선명하게 */
  animation: sprite-walk 0.6s steps(4) infinite;
}

@keyframes sprite-walk {
  to { background-position: -128px 0; }
}
```

**이동 경로:**
```css
.dot-move {
  position: absolute;
  animation: dot-patrol 12s linear infinite;
}

@keyframes dot-patrol {
  0%   { transform: translateX(-40px); }
  50%  { transform: translateX(calc(440px + 40px)); }
  50.01% { transform: translateX(calc(440px + 40px)) scaleX(-1); }
  100% { transform: translateX(-40px) scaleX(-1); }
}
```
- 440px 컨테이너 좌→우→좌 왕복
- 50% 지점에서 `scaleX(-1)`로 방향 전환 (좌우 반전)

**MVP 대안 (스프라이트 에셋 없을 때):**

에셋이 준비되기 전에도 빈 화면을 방지하기 위해 CSS-only 대안을 구현한다.

```tsx
// spriteSheet이 없으면 CSS 도트 캐릭터를 렌더
function CssDotFallback() {
  return (
    <div className="dot-fallback">
      {/* 8×8px div 조합으로 단순 실루엣 */}
      <div className="dot-head" />   {/* 8×8 원형, #f0dfad */}
      <div className="dot-body" />   {/* 8×12, #688097 */}
      <div className="dot-legs" />   {/* 걷기: 2프레임 CSS steps */}
    </div>
  );
}
```
- 순수 CSS div 조합으로 4~6개 사각형을 쌓아 캐릭터 실루엣 구성
- 색상: `#f0dfad`(머리) + `#688097`(몸) — 6색 팔레트 내
- 크기: 16~24px 높이 (별빛보다 크고 대화창보다 작은 중간 스케일)
- 걷기: 다리 2개 div를 `steps(2)` 애니메이션으로 교차 — 충분히 "걷는 느낌"
- `image-rendering: pixelated` 불필요 (이미 CSS 박스)
- 에셋이 들어오면 `spriteSheet` prop만 넘기면 자동으로 PNG 스프라이트로 전환

**z-index: 1** (StarField(0) 위, 대화창(10) 아래)
**pointer-events: none** (터치 영역 간섭 방지)
**개수: 1~2개** (너무 많으면 산만)

### 1-4. `Portrait.tsx` — 캐릭터 포트레이트

**Props:**
```ts
interface PortraitProps {
  name: string;               // 캐릭터 파일명 (확장자 제외)
  size?: 'sm' | 'md' | 'lg';  // 48px | 80px | 120px
  className?: string;
}
```

**요구사항:**
- `<img src="/character/{name}.svg">` 렌더링
- 상단 60% 영역만 표시: `object-fit: cover`, `object-position: top center`
- border-radius: 12px
- 테두리: 2px `rgba(221, 225, 229, 0.3)`
- 표정 전환 시 crossfade 0.15s (framer-motion `AnimatePresence`)
- 대화창 좌측에 배치될 때: 80×80px

### 1-5. `DialogueBox.tsx` — ★ RPG 대화창 (핵심 컴포넌트)

턴제 RPG 스타일의 텍스트 윈도우. 서비스 전체의 캐릭터 발화에 사용.

**Props:**
```ts
interface DialogueLine {
  character: string;          // 포트레이트 파일명
  name?: string;              // 화자 이름 (예: "안내자", "도인")
  text: string;               // 대사 텍스트 (\n 줄바꿈)
  style?: 'normal' | 'emphasis' | 'whisper' | 'system';
  icon?: string;              // 옆에 표시할 아이콘 (icon/ 파일명)
}

interface DialogueBoxProps {
  line: DialogueLine;
  typing?: boolean;           // 타이핑 애니메이션 여부
  typingSpeed?: number;       // ms/글자 (기본 35)
  onTypingComplete?: () => void;
  onTap?: () => void;         // 탭/클릭 시 (다음 대사 or 타이핑 스킵)
  showIndicator?: boolean;    // ▼ 다음 표시기
  className?: string;
}
```

**레이아웃:**
```
┌──────────────────────────────────────┐
│ ┌────────┐  안내자                    │ ← 화자 이름 (12px, #f0dfad)
│ │        │                           │
│ │ 포트   │  안녕하세요.               │ ← 대사 본문
│ │ 레이트  │  저는 시간의 안내자예요.    │    (Gaegu 18px, #dde1e5)
│ │        │  당신이 태어난 그 순간,     │    타이핑 중 커서 블링크
│ │        │  하늘에는 이야기가 있었어요. │
│ └────────┘                        ▼  │ ← 탭 표시기 (블링크)
└──────────────────────────────────────┘
```

**요구사항:**
- **배경**: `rgba(62, 72, 87, 0.92)` + `backdrop-filter: blur(12px)` + 1px `rgba(104, 128, 151, 0.4)` 테두리
- **border-radius**: 16px
- **포트레이트**: 좌측 80×80px, Portrait 컴포넌트 사용
- **화자 이름**: 포트레이트 우측 상단, 12px weight 600, `#f0dfad` (Cream Yellow)
- **대사 본문**: Gaegu 18px, `#dde1e5`, line-height 1.65
  - `style: 'emphasis'` → 텍스트 `#f0dfad`, 약간 큰 20px
  - `style: 'whisper'` → 텍스트 opacity 0.6, 16px
  - `style: 'system'` → 포트레이트 숨김, 중앙 정렬, Pretendard 14px
- **타이핑**: 글자 단위 순차 표시, 35ms/글자. `.`/`,`/`?`/`!` 뒤 180ms 추가 딜레이
- **탭 동작**:
  - 타이핑 중 탭 → 즉시 전체 표시 (스킵)
  - 타이핑 완료 후 탭 → `onTap()` 호출 (다음 대사)
- **▼ 표시기**: 타이핑 완료 후 우하단에 `#dde1e5` 삼각형, 0.8s opacity 블링크
- **패딩**: 16px
- **최대 높이**: 화면 높이의 35% (넘치면 내부 스크롤)

### 1-6. `ZoneTransition.tsx` — ★ 픽셀 줌 트랜지션

ZONE A → ZONE B 전환 시 RPG 전투 진입 연출.

**Props:**
```ts
interface ZoneTransitionProps {
  phase: 'idle' | 'zoom-out' | 'loading' | 'zoom-in' | 'done';
  onPhaseChange: (phase: string) => void;
  loadingPortrait?: string;   // 로딩 중 캐릭터 (기본: 'magician')
  loadingText?: string;       // 로딩 메시지
}
```

**시퀀스:**
```
idle → zoom-out (0.4s) → loading (0.5s 최소, API 대기) → zoom-in (0.4s) → done

Phase 1: zoom-out
  - 현재 화면(ZONE A)에 transform: scale(1 → 20) 적용
  - 동시에 검은 오버레이 opacity 0 → 1
  - transition: 0.4s cubic-bezier(0.4, 0, 1, 1)
  - 결과: 픽셀이 보이다가 암전

Phase 2: loading
  - 검은 배경 위에 magician 포트레이트 + 로딩 메시지
  - "시간의 문을 열고 있어요..."
  - 최소 0.5초 보장. API 응답이 먼저 오면 대기.

Phase 3: zoom-in
  - ZONE B 콘텐츠를 scale(20)에서 시작
  - transform: scale(20 → 1) 적용
  - 동시에 검은 오버레이 opacity 1 → 0
  - transition: 0.4s cubic-bezier(0, 0, 0.2, 1)
  - 결과: 픽셀에서 선명해지며 결과 등장
```

**CSS:**
```css
.zone-zoom-out {
  transform: scale(20);
  transition: transform 0.4s cubic-bezier(0.4, 0, 1, 1);
  transform-origin: center center;
  overflow: hidden;
}

.zone-zoom-in {
  transform: scale(1);
  transition: transform 0.4s cubic-bezier(0, 0, 0.2, 1);
  transform-origin: center center;
}

.zone-overlay {
  position: fixed;
  inset: 0;
  background: #3e4857;
  transition: opacity 0.4s;
  z-index: 50;
}
```

**로딩 화면 레이아웃:**
```
┌──────────────────────────────┐
│         (암전 배경)           │
│                              │
│      [magician 포트레이트]    │
│                              │
│  "시간의 문을 열고 있어요..." │
│         ● ● ●               │ ← 도트 로딩 애니메이션
│                              │
└──────────────────────────────┘
```

### 1-7. `OhengIcon.tsx`

**Props:**
```ts
interface OhengIconProps {
  element: '목' | '화' | '토' | '금' | '수';
  yinYang: '양' | '음';
  size?: number;  // px, 기본 32
}
```

**요구사항:**
- `<img src="/icon/{element}_{yinYang}.svg">` 매핑:
  - 목→mok, 화→hwa, 토→to, 금→geum, 수→su
  - 양→yang, 음→yin

### 1-8. `SectionDivider.tsx`

**Props:**
```ts
interface SectionDividerProps {
  icon?: string;  // icon 파일명 (확장자 제외). 예: 'star', 'stamp'
}
```

**요구사항:**
- 가로선: `rgba(104, 128, 151, 0.25)` 1px
- 중앙에 아이콘 (지정 시) 또는 작은 원형 도트
- 상하 margin: 32px

---

## 단계 2: ZONE A — RPG 대화 시퀀스

### 2-1. `DialoguePlayer.tsx` — 대화 시퀀스 재생기

ZONE A 전체를 풀스크린 RPG 대화 장면으로 운영한다.
배경은 StarField + 어두운 밤. 하단에 DialogueBox가 고정.

**Props:**
```ts
interface DialoguePlayerProps {
  script: DialogueLine[];       // 대화 스크립트 (JSON에서 로드)
  onComplete: () => void;       // 스크립트 끝 도달 시
  onAction?: (action: string) => void;  // 선택지/액션 트리거
}
```

**동작:**
```
[풀스크린 어두운 배경 + StarField + DotCharacter]

        ~~~  (도트 캐릭터가 좌우로 걸어다님)  ~~~

┌──────────────────────────────────────┐
│ ┌────────┐  안내자                    │
│ │ normal │  안녕하세요.               │
│ │        │  저는 시간의 안내자예요.    │
│ └────────┘                        ▼  │
└──────────────────────────────────────┘

  탭 → 다음 대사 → 포트레이트 교체 (표정 변화)
  탭 → 다음 대사 → ...
  마지막 대사 + action: "show_choices" → ChoicePanel 등장
```

**요구사항:**
- 풀스크린 (`min-h-screen`, `position: relative`)
- 배경: `#3e4857` + StarField (z-0) + DotCharacter (z-1)
- 대화창: **화면 하단 고정** (`position: fixed`, `bottom: 0`, 모바일 safe-area 패딩)
- 대사 인덱스를 `useState`로 관리, 탭마다 +1
- 대사 내 `action` 필드가 있으면 `onAction(action)` 호출
- 타이핑 중 탭 → 스킵 (전체 텍스트 즉시 표시)
- 대사 전환 시 포트레이트 crossfade 0.15s
- 스크립트 끝 → `onComplete()` 호출
- **터치 영역**: 대화창 전체 + 배경 전체 (어디를 탭해도 진행)

### 2-2. `ChoicePanel.tsx` — 선택지 패널

대화 시퀀스 중간에 사용자 선택을 받는 패널.

**Props:**
```ts
interface Choice {
  label: string;
  action: string;              // 'open_input_modal', 'open_gungham_2', 'open_gungham_3', 'continue'
  style?: 'primary' | 'secondary';
}

interface ChoicePanelProps {
  choices: Choice[];
  onSelect: (action: string) => void;
}
```

**요구사항:**
- 대화창 위에 등장 (대화창은 유지, 그 위로 선택지)
- 세로 배치, 각 버튼 풀너비
- `primary`: `#dde1e5` 배경, `#3e4857` 텍스트, 글로우
- `secondary`: `rgba(104, 128, 151, 0.25)` 배경, `#dde1e5` 텍스트
- 등장: 아래에서 slide-up 0.3s + fade-in
- 선택 시 → `onSelect(action)` 호출

### 2-3. 대화 스크립트 파일

```
public/content/
├── dialogue-intro.json        ← ZONE A 도입 + 대화형 입력 수집
├── dialogue-upsell.json       ← ZONE C 과금 유도 대화
├── dialogue-gungham.json      ← 궁합 유도 대화
└── dialogue-result-comments.json ← ZONE B 결과 내 인라인 코멘트 템플릿
```

### 2-4. 대화형 입력 수집 시스템 — ★ 핵심 차별화

기존 폼 모달(`InputModal`) 대신, **RPG 대화 흐름 안에서 유저 정보를 수집**한다.
캐릭터 생성 + NPC 대화 이벤트 방식으로 몰입감을 유지하면서 입력을 모은다.

**수집 항목 및 순서:**

| 순서 | 항목 | action 타입 | 필수 | 비고 |
|------|------|------------|------|------|
| 1 | 이름 | `input_name` | 선택 | 연출용. 결과 "OO님의 사주"에 활용. 건너뛰기 가능 |
| 2 | 성별 | `input_gender` | 선택 | 대운 방향 계산. 미선택 시 대운 생략 |
| 3 | 양력/음력 | `input_calendar` | 필수 | |
| 4 | 생년월일 | `input_birthdate` | 필수 | |
| 4-1 | 윤달 여부 | `input_leapmonth` | 조건부 | 음력 + `hasLeapMonth(year,month)===true` 일 때만 질문 |
| 5 | 생시 | `input_birthtime` | 선택 | 12지지 분기 응답 + "모름" 옵션 |
| 6 | 출생지 | `input_birthcity` | 선택 | 진태양시 보정. 기본값 서울. 건너뛰기 가능 |

**DialogueLine 확장 — 입력 action 타입:**

```ts
// 기존 action에 추가
type DialogueAction =
  | 'show_choices'
  | 'open_input_modal'   // 레거시: 폼 모달 (궁합용 보존)
  | 'continue'
  // ── 대화형 입력 (신규) ──
  | 'input_name'         // 텍스트 입력 필드
  | 'input_gender'       // 남/여 선택 (choices와 유사)
  | 'input_calendar'     // 양력/음력 선택
  | 'input_birthdate'    // 날짜 선택기
  | 'input_leapmonth'    // 윤달 예/아니오 (조건부)
  | 'input_birthtime'    // 시간 선택 + "모름"
  | 'input_birthcity';   // 도시 선택 + "건너뛰기"

// 입력 action이 있는 DialogueLine 확장
interface DialogueLine {
  character: string;
  name?: string;
  text: string;
  style?: 'normal' | 'emphasis' | 'whisper' | 'system';
  icon?: string;
  action?: DialogueAction;
  choices?: Choice[];
  // ── 입력 관련 필드 (신규) ──
  inputConfig?: {
    placeholder?: string;      // 입력 필드 힌트
    skipLabel?: string;        // 건너뛰기 버튼 텍스트 (없으면 필수)
    skipValue?: string;        // 건너뛰기 시 저장할 기본값
    options?: string[];        // input_birthcity 등에서 사용할 선택지 목록
  };
  responses?: Record<string, {  // 입력값에 따른 분기 응답
    character: string;
    text: string;
    style?: string;
  }>;
}
```

**대화형 입력 UI 컴포넌트 — `DialogueInput.tsx` (신규):**

대화창 내부 또는 바로 아래에 나타나는 인라인 입력 위젯.

```
app/alt2/components/dialogue/
├── DialoguePlayer.tsx   ← 기존 (입력 action 핸들링 추가)
├── ChoicePanel.tsx       ← 기존
└── DialogueInput.tsx     ← ★ 신규: 인라인 입력 위젯
```

**DialogueInput Props:**
```ts
interface DialogueInputProps {
  type: 'text' | 'gender' | 'calendar' | 'date' | 'leapmonth' | 'time' | 'city';
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

**각 입력 타입별 UI:**

| type | 렌더링 |
|------|--------|
| `text` | 텍스트 입력 + 확인 버튼. 대화창 아래에 인라인 |
| `gender` | [남성] [여성] 2개 버튼 (ChoicePanel과 동일 스타일) |
| `calendar` | [양력] [음력] 2개 버튼 |
| `date` | 년/월/일 3개 셀렉터 가로 배치 + 확인 버튼 |
| `leapmonth` | [예, 윤달이었어요] [아니오] 2개 버튼 |
| `time` | 시간 셀렉터 (12지시 기반) + [모름] 버튼 |
| `city` | 도시 드롭다운 + [건너뛰기(서울 기준)] 버튼 |

- 모든 입력 위젯 스타일: DESIGN-ALT2.md §4 Input Fields 준수
- 대화창 바로 위 또는 대화창 내부 하단에 등장
- 등장: slide-up 0.2s + fade-in
- 입력 완료 시 → `onSubmit(value)` → DialoguePlayer가 다음 대사(응답)로 진행

**시간 입력(input_birthtime)의 12지지 선택기:**

시(時)를 직접 입력하는 대신 12지시 기반 선택지로 제공:

```
[子시 (23~01시)]  [丑시 (01~03시)]  [寅시 (03~05시)]
[卯시 (05~07시)]  [辰시 (07~09시)]  [巳시 (09~11시)]
[午시 (11~13시)]  [未시 (13~15시)]  [申시 (15~17시)]
[酉시 (17~19시)]  [戌시 (19~21시)]  [亥시 (21~23시)]
[모르겠어요]
```

3열 그리드 + 하단 "모르겠어요" 풀너비 버튼.
각 버튼에 오행 아이콘(해당 지지의 오행)을 작게 표시하면 더 RPG 느낌.

**입력값별 분기 응답 (responses 필드):**

DialoguePlayer가 `responses` 맵에서 입력값에 매칭되는 대사를 찾아 자동 재생한다.

생시 입력 시 12지지 + unknown 총 13개 분기:

```json
{
  "character": "doin",
  "name": "도인",
  "text": "자네는 자네 출생에 대한\n비밀을 들은 적이 있는가?",
  "action": "input_birthtime",
  "inputConfig": { "skipLabel": "모르겠어요", "skipValue": "unknown" },
  "responses": {
    "子": { "character": "crazy", "text": "자시라... 한밤중의 기운을 타고났군!\n물의 시작점이야. 꽤 깊은 사람이겠어." },
    "丑": { "character": "doin",  "text": "축시... 소가 밭을 가는 시간이지.\n묵묵하지만 단단한 기운이로군." },
    "寅": { "character": "excite","text": "인시! 호랑이의 시간이라.\n새벽을 깨우는 강한 기운이 느껴지는걸." },
    "卯": { "character": "flash", "text": "묘시라... 토끼의 시간.\n부드럽지만 날카로운 감각이 있겠구먼." },
    "辰": { "character": "magician","text": "진시! 용의 시간이로군.\n하늘의 기운이 충만한 때에 태어났어." },
    "巳": { "character": "speak", "text": "사시... 뱀의 시간이야.\n지혜롭고 깊이 있는 기운이군." },
    "午": { "character": "excite","text": "오시라! 말의 시간이지.\n한낮의 양기가 최고조인 때에 태어났군!" },
    "未": { "character": "doin",  "text": "미시... 양의 시간이로군.\n온화하지만 속은 단단한 기운이야." },
    "申": { "character": "flash", "text": "신시! 원숭이의 시간.\n영리하고 재빠른 기운이 느껴지는걸!" },
    "酉": { "character": "speak", "text": "유시라... 닭의 시간이지.\n정밀하고 날카로운 금의 기운이군." },
    "戌": { "character": "doin",  "text": "술시... 개의 시간이야.\n의리 있고 충직한 기운이 강하겠어." },
    "亥": { "character": "crazy", "text": "해시라! 돼지의 시간이지.\n한 해의 끝, 물의 기운을 품고 태어났군." },
    "unknown": { "character": "sweat", "text": "때론 모르는 것이\n나을 수도 있지..." }
  }
}
```

**윤달 질문 조건부 삽입 로직:**

DialoguePlayer 내부에서 `input_birthdate` 응답 후:

```ts
// 유저가 음력을 선택했고, 입력한 년/월에 윤달이 존재하면
if (collectedInput.calendar === 'lunar') {
  const [year, month] = collectedInput.birthDate.split('-').map(Number);
  if (hasLeapMonth(year, month)) {
    // 윤달 질문 대사를 동적으로 삽입
    insertNextLine({
      character: 'doin',
      text: `음... ${month}월이라 했나?\n그 해에는 윤달이 있었는데,\n혹시 윤달이었나?`,
      action: 'input_leapmonth',
    });
  }
}
```

이 로직은 JSON이 아닌 DialoguePlayer 코드에서 처리한다 (동적 분기).

**DialoguePlayer 상태 관리 확장:**

```ts
// DialoguePlayer 내부에 입력 수집 상태 추가
const [collectedInput, setCollectedInput] = useState<Partial<SajuInput>>({});

function handleInputSubmit(field: string, value: string) {
  const updated = { ...collectedInput, [field]: value };
  setCollectedInput(updated);

  // 분기 응답이 있으면 재생
  const currentLine = script[lineIndex];
  if (currentLine.responses?.[value]) {
    playResponseLine(currentLine.responses[value]);
  }

  // 윤달 체크 (calendar=lunar + birthdate 입력 직후)
  if (field === 'birthDate' && updated.calendar === 'lunar') {
    checkAndInsertLeapMonth(updated.birthDate);
  }

  // 다음 대사로 진행
  advanceToNextLine();
}

// 모든 입력 수집 완료 후 → 트랜지션 발동
function handleAllInputComplete() {
  onSubmit(collectedInput as SajuInput);
}
```

**대화 흐름 예시 (dialogue-intro.json 구조):**

```json
{
  "id": "intro",
  "lines": [
    { "character": "normal", "name": "안내자", "text": "..." },
    { "character": "speak", "text": "...", "icon": "star" },
    { "character": "flash", "text": "...", "action": "show_choices",
      "choices": [
        { "label": "나의 사주 보기", "action": "start_input_flow", "style": "primary" },
        { "label": "조금 더 알려줘", "action": "continue", "style": "secondary" }
      ]
    },
    { "character": "speak", "text": "(추가 설명...)" },
    { "character": "flash", "text": "...", "action": "show_choices",
      "choices": [
        { "label": "나의 사주 보기", "action": "start_input_flow", "style": "primary" }
      ]
    }
  ],
  "inputFlow": [
    {
      "character": "doin", "name": "도인",
      "text": "자네의 이름이 무엇인가?",
      "action": "input_name",
      "inputConfig": { "placeholder": "이름을 입력하세요", "skipLabel": "건너뛰기" },
      "responses": {
        "_any": { "character": "doin", "text": "{{value}}... 좋은 이름이로군." },
        "_skip": { "character": "doin", "text": "이름을 밝히지 않겠다는 건가.\n그것도 하나의 선택이지." }
      }
    },
    {
      "character": "doin",
      "text": "자네는 남자인가, 여자인가?",
      "action": "input_gender",
      "inputConfig": { "skipLabel": "밝히지 않겠네" },
      "responses": {
        "M": { "character": "doin", "text": "허허, 건양의 기운이 느껴지는군." },
        "F": { "character": "doin", "text": "허허, 곤음의 기운이 느껴지는군." },
        "_skip": { "character": "doin", "text": "좋네. 하늘의 기둥은\n그것과 관계없이 서 있으니." }
      }
    },
    {
      "character": "speak", "name": "안내자",
      "text": "기록을 확인하려면\n달력 기준을 알아야 해요.",
      "action": "input_calendar",
      "responses": {
        "solar": { "character": "flash", "text": "양력이군요!\n해(太陽)의 기준으로 찾아볼게요." },
        "lunar": { "character": "flash", "text": "음력이군요!\n달(太陰)의 기준으로 찾아볼게요." }
      }
    },
    {
      "character": "doin",
      "text": "당신의 기록은 당신이 태어났을 때부터\n이미 내 손에 들어와 있었네.\n가만 있자... 아니!\n너무 오래되서 지워져 있잖아?\n자네가 대답해보게.\n당신은 언제 태어났지?",
      "action": "input_birthdate",
      "responses": {
        "_any": { "character": "excite", "text": "{{value}}...\n그래, 이 날이었군! 기억이 돌아오는걸." }
      }
    },
    {
      "character": "doin",
      "text": "자네는 자네 출생에 대한\n비밀을 들은 적이 있는가?",
      "action": "input_birthtime",
      "inputConfig": { "skipLabel": "모르겠어요", "skipValue": "unknown" },
      "responses": { "...12지지 + unknown (위 예시 참조)..." }
    },
    {
      "character": "speak", "name": "안내자",
      "text": "마지막으로 하나만 더!\n어디에서 태어났나요?",
      "action": "input_birthcity",
      "inputConfig": {
        "skipLabel": "서울 기준으로 할게요",
        "skipValue": "서울",
        "options": ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "..."]
      },
      "responses": {
        "_any": { "character": "flash", "text": "{{value}}에서 태어났군요!\n그곳의 시간 보정까지 반영할게요." },
        "_skip": { "character": "flash", "text": "좋아요, 서울 기준으로 볼게요!" }
      }
    },
    {
      "character": "magician", "name": "안내자",
      "text": "좋아요! 모든 준비가 끝났어요.\n이제 시간의 문을 열어볼까요?",
      "style": "emphasis",
      "action": "submit_and_transition"
    }
  ]
}
```

`start_input_flow` → DialoguePlayer가 `lines` 재생 종료 후 `inputFlow` 배열로 전환.
`submit_and_transition` → 수집된 `collectedInput`으로 API 호출 + 픽셀 줌 트랜지션 발동.

---

## 단계 3: 입력 모달 (레거시 — 궁합/수정용 보존)

### 3-1. `InputModal.tsx`

**용도 변경:**
- 최초 진입: 대화형 입력 수집 (DialoguePlayer + DialogueInput)
- **InputModal은 "수정하기" 용도 + 궁합 모드에서만 사용**
- 결과 화면에서 "입력 수정" 클릭 시 기존 값이 prefilled된 모달이 열림
- 궁합 모드: 상대방 정보 입력 시 기존 모달 방식 유지 (대화형은 본인만)

**Props:**
```ts
interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: SajuInput) => void;
  prefilled?: Partial<SajuInput>;  // 수정 또는 궁합 시 자동 완성
}
```

**요구사항:**
- 기존 구현 유지 (createPortal, 스타일 등)
- `prefilled` 필드에 대화형 수집 결과가 들어옴
- "수정하기" 진입 시 모든 필드 수정 가능

---

## 단계 4: 픽셀 줌 트랜지션 + 로딩

ZONE A 대화형 입력 완료(`submit_and_transition`) 시 발동.

### 4-1. 트랜지션 흐름 (page.tsx에서 제어)

```
1. 입력 모달 제출 → 모달 닫힘
2. ZoneTransition phase='zoom-out' → ZONE A 화면이 확대되며 픽셀화 + 암전
3. ZoneTransition phase='loading' → magician 포트레이트 + 로딩 메시지
   동시에 /api/saju/analyze POST 호출
4. API 응답 도착 (최소 0.5초 보장)
5. ZoneTransition phase='zoom-in' → ZONE B가 픽셀에서 선명해지며 등장
6. ZoneTransition phase='done' → 트랜지션 컴포넌트 언마운트
```

ZoneTransition 내부의 로딩 화면은 DialogueBox와 동일한 스타일의 대화창을 사용:
- magician 포트레이트 + "시간의 문을 열고 있어요..."
- 0.5초 이상이면 두 번째 멘트로 전환: "오행의 흐름을 읽는 중이에요~"

---

## 단계 5: ZONE B — 무료 결과

### 전체 흐름 (위→아래 스크롤 순서)

```
⑤ PillarTable — 사주원국 조견표
⑥ SinsalRow — 신살
⑦ DaeunTimeline — 대운
⑧ SeunCard — 세운 (올해/내년)
⑨ OhengRelation — 오행 상관관계 (고정 이미지)
⑩ OhengRadar — 오행 분포 펜타곤 차트
⑪ EasyNarration — 캐릭터 쉬운말 해설
── 무료 구간 끝 ──
```

### 5-1. `PillarTable.tsx` — 사주원국 조견표

**alt1 PillarTable과의 차이점: 한글 음차 병기, 지장간 포함, 합충형해파 표시**

**Props:**
```ts
interface PillarTableProps {
  pillars: {
    year: { gan: string; ji: string };
    month: { gan: string; ji: string };
    day: { gan: string; ji: string };
    hour: { gan: string; ji: string } | null;
  };
  tenGods: Record<string, string>;   // 8위치 십성
  jijanggan: Record<string, string[]>; // 각 지지의 지장간
  relations: string[];              // 합충형해파 목록
}
```

**요구사항:**
- 4열 그리드 (시주 | 일주 | 월주 | 연주)
- 각 셀 구성:
  ```
  편인          ← 십성 (12px, #688097)
  庚            ← 한자 (28px bold, 오행 색상)
  경            ← 한글 음차 (14px, #dde1e5 70%)
  ─────
  子            ← 한자 (28px bold, 오행 색상)
  자            ← 한글 음차 (14px, #dde1e5 70%)
  겁재          ← 십성 (12px, #688097)
  ```
- 한자→한글 매핑 테이블 필요:
  ```ts
  const HANJA_TO_HANGUL: Record<string, string> = {
    '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
    '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
    '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진',
    '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유',
    '戌': '술', '亥': '해',
  };
  ```
- 지장간: 각 지지 아래에 작은 글씨로 표기 (10px, `#688097`)
- 합충형해파: 테이블 하단에 가로 배치. 예: "酉戌해(월일지해)" — 해당 관계의 글자를 강조색(`#e9b8b7`)으로
- 카드 배경: `rgba(104, 128, 151, 0.10)`, border-radius 16px, `backdrop-filter: blur(8px)`
- 오행 색상: alt1의 `ELEMENT_COLORS` 맵 그대로 사용 (6색 제한 밖, 자유)
- 등장: Intersection Observer, slide-up 24px + fade-in 0.4s

### 5-2. `SinsalRow.tsx`

**Props:**
```ts
interface SinsalRowProps {
  sinsalList: { name: string; position: string }[];
}
```

**요구사항:**
- 조견표 바로 아래, 열 너비를 맞춰 배치
- 각 신살: 이름 + 위치 (14px, `#688097`)
- 배경 없음 (투명), 조견표 카드와 시각적 연결감 유지

### 5-3. `DaeunTimeline.tsx`

**Props:**
```ts
interface DaeunPeriod {
  startAge: number;
  endAge: number;
  gan: string;
  ji: string;
}
interface DaeunTimelineProps {
  periods: DaeunPeriod[];
  currentAge: number;
}
```

**요구사항:**
- **가로 스크롤** 타임라인
- 각 대운: 간지(한자+음차) + 나이 범위
- 현재 대운: 강조 보더 `#f0dfad`, 약간 scale up
- 과거 대운: opacity 0.5
- 미래 대운: 기본 opacity
- 카드 배경: `rgba(104, 128, 151, 0.10)`, border-radius 12px

### 5-4. `SeunCard.tsx`

**Props:**
```ts
interface SeunCardProps {
  currentYear: { year: number; gan: string; ji: string; reading: string };
  nextYear: { year: number; gan: string; ji: string; reading: string };
}
```

**요구사항:**
- 올해/내년 2장 카드, 가로 배치
- 캐릭터(speak, sm) + 말풍선으로 세운 코멘트
- 카드 배경: `rgba(104, 128, 151, 0.15)`, border-radius 16px

### 5-5. `OhengRelation.tsx`

**요구사항:**
- **고정 이미지** — 상생·상극 다이어그램
- `public/icon/` 오행 아이콘 10종을 활용하여 원형 배치
- 목→화→토→금→수 상생 관계 화살표
- 상극 관계 점선 화살표
- 이 컴포넌트는 모든 유저에게 동일 (유저 데이터 비의존)
- 유저의 오행 분포를 하이라이트하면 더 좋으나, MVP에서는 고정 이미지로 시작

### 5-6. `OhengRadar.tsx`

**Props:**
```ts
interface OhengRadarProps {
  distribution: {
    목: number; 화: number; 토: number; 금: number; 수: number;
  };
}
```

**요구사항:**
- 펜타곤(레이더) 차트 — CSS 또는 SVG로 직접 구현 (차트 라이브러리 최소화)
- 5꼭짓점: 목/화/토/금/수, 각각 오행 아이콘 배치
- 채움 영역: `rgba(221, 225, 229, 0.2)`, 보더: `#dde1e5`
- 각 꼭짓점 옆에 개수 표기 (예: "木 3")
- 반응형: 차트 최대 너비 300px, 중앙 정렬

### 5-7. `InlineDialogue.tsx` — 결과 내 인라인 대화창

ZONE B 스크롤 중간에 삽입되는 대화창. DialogueBox와 동일한 스타일이지만
**고정이 아닌 인라인**(스크롤 콘텐츠 흐름 안)으로 배치된다.

**Props:**
```ts
interface InlineDialogueProps {
  lines: DialogueLine[];         // 1개 이상의 대사
  autoPlay?: boolean;            // true: Intersection Observer로 진입 시 자동 타이핑 시작
  interactive?: boolean;         // true: 탭으로 진행 (기본), false: 전체 즉시 표시
}
```

**요구사항:**
- DialogueBox와 동일한 비주얼 (포트레이트 + 대사 + 테두리)
- `position: static` (인라인), 풀너비
- `autoPlay: true`이면 Intersection Observer로 뷰포트 진입 시 타이핑 시작
- `interactive: true`이면 탭으로 다음 대사 진행
- 여러 줄이면 순차 표시 (탭 또는 자동)
- 스크롤 흐름을 끊지 않도록 **최대 높이 제한 없음** (긴 텍스트도 허용)

**사용 위치:**
- 조견표 아래 해설: "이 사주에서 주목할 점은..."
- 오행 차트 아래 해설: "오행의 균형을 보면..."
- 세운 코멘트: "올해는 특히..."
- 무료 구간 마지막 요약: "여기까지가 당신의 사주 겉모습이에요"

**쉬운말 변환 예시 (LLM Phase 1에서 생성):**
- "월지 유금 천간 투출" → "사주원국에서 중요한 월지의 기운이 드러나는 형세예요"
- "편인격 신강 사주" → "배움과 지혜의 에너지가 강한 사주예요"
- 프론트엔드는 받은 텍스트를 표시만 함

---

## 단계 6: 궁합 기능

### 6-1. `GunghamTeaser.tsx`

**요구사항:**
- 무료 결과(ZONE B) 마지막에 삽입
- 캐릭터(doin, md, animated) + 말풍선:
  - "혼자만의 이야기가 아닌,\n누군가와의 이야기도 궁금하다면…"
- 2개 버튼 가로 배치:
  - [2인 궁합 보기] — `#dde1e5` 배경
  - [3인 궁합 보기] — `rgba(104, 128, 151, 0.25)` 배경 + `#dde1e5` 텍스트
- 버튼 클릭 → `GunghamModal` 열기 (mode: 2 or 3)

### 6-2. `GunghamModal.tsx`

**Props:**
```ts
interface GunghamModalProps {
  isOpen: boolean;
  mode: 2 | 3;
  myData: SajuInput;           // "나"의 정보 (자동 완성)
  onClose: () => void;
  onSubmit: (inputs: SajuInput[]) => void;
}
```

**요구사항:**
- `InputModal`과 동일한 오버레이/모달 구조 (createPortal)
- "나"의 정보: 자동 완성 + 비활성화 상태로 상단에 요약 표시
- "상대방 1": `InputModal` 동일 폼 필드
- 3인 모드: "상대방 2" 추가 폼 필드
- 관계 유형 선택: [연인] [친구] [동료] [가족] [기타] — 칩(chip) 형태 토글
- 제출 버튼: "궁합 분석 시작"
- 제출 시 `onSubmit([myData, partner1, partner2?])` 호출

### 6-3. `GunghamResult.tsx`

**Props:**
```ts
interface GunghamResultProps {
  participants: Array<{
    label: string;
    engine: SajuResult;
    core: CoreJudgment;
  }>;
  relationshipType: string;
}
```

**요구사항:**
- 참여자 사주 비교:
  - 2인: 2열 나란히
  - 3인: 가로 스크롤 또는 탭 전환 (A-B, A-C, B-C 쌍별)
- 오행 겹침 레이더 차트 (OhengRadar 확장)
- 캐릭터(doin) 해설 말풍선: 일간 관계, 주요 합충 교차
- **무료 구간**: 비교 조견표 + 오행 겹침 차트 + 캐릭터 한줄 요약
- **유료 CTA**: "심층 궁합 분석"
- 3인 모바일(440px): 3열은 불가능하므로 **탭 전환** 방식 채택
  - Tab: [나↔상대1] [나↔상대2] [상대1↔상대2]

---

## 단계 7: ZONE C — 과금 유도

### 7-1. `UpsellDialogue.tsx`

**Props:**
```ts
interface UpsellDialogueProps {
  script: DialogueLine[];       // dialogue-upsell.json에서 로드
  previewData?: {               // 블러 미리보기용
    gyeokGukReading: string;
    yongSinReading: string;
  };
  onCtaClick: () => void;
}
```

**요구사항:**
- InlineDialogue로 angel/devil 교차 대화 표시
- 블러 처리된 심층분석 미리보기:
  - 격국·용신 카드가 `filter: blur(6px)` + `opacity: 0.5`로 표시
  - "더 자세한 이야기가 기다리고 있어요" 오버레이 텍스트
- **배경 전환**: 이 구간에서 `silverlining.jpg` 등장
  - 구현: 페이지 전체에 `silverlining.jpg`를 `position: fixed`로 깔고,
    ZONE A/B에서는 `#3e4857` 오버레이로 가림.
    ZONE C 진입 시 오버레이 opacity를 줄여 배경이 서서히 드러남.
  - Intersection Observer로 ZONE C 진입 감지 → CSS transition `opacity 1s`

### 7-2. `CtaButton.tsx`

**Props:**
```ts
interface CtaButtonProps {
  label: string;
  price?: string;
  onClick: () => void;
}
```

**요구사항:**
- 버튼: `#dde1e5` 배경, `#3e4857` 텍스트, 20px radius, 풀너비
- 글로우: `box-shadow: 0 0 24px rgba(221, 225, 229, 0.3)`
- 가격 표시: `price` 있으면 라벨 옆에 표기
- 텍스트 예: "구름 너머의 이야기를 만나보세요 — ₩9,900"
- hover/active: `scale(1.02)` + 글로우 강화

---

## 단계 8: 메인 페이지 (상태 머신)

### 8-1. `app/alt2/page.tsx`

**상태 머신:**
```
dialogue → transition(zoom-out→loading→zoom-in) → result → (gungham) → upsell
              ↑                                      ↑                    |
              └──────────────────────────────────────┘────────────────────┘ (다시하기)
```

**요구사항:**

```tsx
// 핵심 상태
const [phase, setPhase] = useState<
  'dialogue' | 'transition' | 'result' | 'gungham_loading' | 'gungham_result'
>('dialogue');
const [transitionPhase, setTransitionPhase] = useState<
  'idle' | 'zoom-out' | 'loading' | 'zoom-in' | 'done'
>('idle');
const [modalOpen, setModalOpen] = useState(false);
const [gunghamModalOpen, setGunghamModalOpen] = useState(false);
const [gunghamMode, setGunghamMode] = useState<2 | 3>(2);
const [engine, setEngine] = useState(null);
const [core, setCore] = useState(null);
const [myInput, setMyInput] = useState(null);

// 대화 스크립트 로드
const introScript = await fetch('/content/dialogue-intro.json');
const upsellScript = await fetch('/content/dialogue-upsell.json');
```

**페이지 구조:**
```tsx
<div className="relative min-h-screen bg-[#3e4857]">
  {/* 배경 레이어 */}
  <div className="fixed inset-0 z-0">
    <StarField />
    <img src="/background/silverlining.jpg"
         className="fixed inset-0 object-cover opacity-0 transition-opacity duration-1000"
         style={{ opacity: bgOpacity }} />
  </div>

  {/* ZONE A: RPG 대화 시퀀스 (풀스크린) */}
  {phase === 'dialogue' && (
    <div id="zone-a" className="relative z-10">
      <DialoguePlayer
        script={introScript.lines}
        onAction={(action) => {
          if (action === 'open_input_modal') setModalOpen(true);
        }}
        onComplete={() => {}}
      />
    </div>
  )}

  {/* 픽셀 줌 트랜지션 */}
  {phase === 'transition' && (
    <ZoneTransition
      phase={transitionPhase}
      onPhaseChange={setTransitionPhase}
      loadingPortrait="magician"
      loadingText="시간의 문을 열고 있어요..."
    />
  )}

  {/* ZONE B + C: 결과 (스크롤) */}
  {phase === 'result' && (
    <div id="zone-b" className="relative z-10 max-w-[440px] mx-auto px-6">
      <PillarTable ... />
      <SinsalRow ... />
      <InlineDialogue lines={pillarComment} autoPlay />
      <DaeunTimeline ... />
      <SeunCard ... />
      <InlineDialogue lines={seunComment} autoPlay />
      <SectionDivider icon="star" />
      <OhengRelation />
      <OhengRadar ... />
      <InlineDialogue lines={ohengComment} autoPlay />
      <SectionDivider icon="stamp" />
      <GunghamTeaser onSelect={(mode) => { setGunghamMode(mode); setGunghamModalOpen(true); }} />

      {/* ZONE C */}
      <div id="upsell-section">
        <UpsellDialogue script={upsellScript.lines} previewData={core} onCtaClick={handlePurchase} />
        <CtaButton label="구름 너머의 이야기를 만나보세요" price="₩9,900" onClick={handlePurchase} />
      </div>

      <footer>...</footer>
    </div>
  )}

  {/* 궁합 결과 */}
  {phase === 'gungham_result' && <GunghamResult ... />}

  {/* 모달 (포탈) */}
  <InputModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} />
  <GunghamModal isOpen={gunghamModalOpen} mode={gunghamMode} myData={myInput}
                onClose={() => setGunghamModalOpen(false)} onSubmit={handleGunghamSubmit} />
</div>
```

**API 호출 핸들러:**
```tsx
// 개인 분석 — 트랜지션 연동
async function handleSubmit(input: SajuInput) {
  setModalOpen(false);
  setMyInput(input);

  // Phase 1: 줌 아웃 (0.4s)
  setPhase('transition');
  setTransitionPhase('zoom-out');
  await delay(400);

  // Phase 2: 로딩 화면 + API 호출 동시 진행
  setTransitionPhase('loading');
  const apiPromise = fetch('/api/saju/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then(r => r.json());

  // 최소 0.5초 보장
  const [data] = await Promise.all([apiPromise, delay(500)]);
  setEngine(data.engine);
  setCore(data.core);

  // Phase 3: 줌 인 (0.4s)
  setTransitionPhase('zoom-in');
  await delay(400);

  // Phase 4: 완료
  setPhase('result');
  setTransitionPhase('idle');
  window.scrollTo({ top: 0 });
}

// 궁합 분석
async function handleGunghamSubmit(inputs: SajuInput[]) {
  setGunghamModalOpen(false);
  setPhase('transition');
  setTransitionPhase('zoom-out');
  await delay(400);

  setTransitionPhase('loading');
  const results = await Promise.all(
    inputs.map(input => fetch('/api/saju/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }).then(r => r.json()))
  );
  await delay(500);

  setGunghamResults(results);
  setTransitionPhase('zoom-in');
  await delay(400);

  setPhase('gungham_result');
  setTransitionPhase('idle');
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
```

---

## 단계 9: 배경 전환 시스템

### 스크롤 기반 배경 opacity 제어

```tsx
// page.tsx 내
const [bgOpacity, setBgOpacity] = useState(0);

useEffect(() => {
  const handleScroll = () => {
    const upsellEl = document.getElementById('upsell-section');
    if (!upsellEl) return;

    const rect = upsellEl.getBoundingClientRect();
    const windowH = window.innerHeight;

    // upsell 섹션이 뷰포트에 진입하면 opacity 증가
    if (rect.top < windowH && rect.bottom > 0) {
      const progress = 1 - (rect.top / windowH);
      setBgOpacity(Math.min(Math.max(progress, 0), 0.6)); // 최대 60%
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

---

## 단계 10: 통합 테스트 & 검증

### 10-1. 빌드 확인
```bash
npm run build
```
- TypeScript 에러 0건
- 빌드 성공

### 10-2. 기능 확인 (수동)
- `/alt1` — 기존 UI 정상 동작
- `/alt2` — 전체 흐름:
  - ZONE A: 스크롤 → 씬 순차 등장 → 입력 버튼 노출
  - 모달: 입력 → 제출 → 모달 닫힘
  - 로딩: magician 애니메이션 + 멘트 순환
  - ZONE B: 조견표(한자+음차) → 신살 → 대운 → 세운 → 오행 → 차트 → 쉬운말
  - 궁합: 유도 → 모달(2인/3인) → 결과
  - ZONE C: 배경 전환 → 블러 미리보기 → CTA

### 10-3. 반응형 확인
- 모바일(375px): 440px 컨테이너 풀 사용
- 모바일(440px+): 440px 고정, 중앙 정렬
- 데스크톱(1280px): 중앙 440px 컨테이너 + 양쪽 `#3e4857` 배경

### 10-4. 캐릭터 포트레이트 확인
- 12종 포트레이트: 상단 60% 크롭 정상 표시
- crossfade 표정 전환(0.15s) 동작
- 대화창 내 80×80px 배치 정상

### 10-5. 성능 확인
- 캐릭터 SVG 12종 총 ~1.8MB → lazy loading 적용 확인
- silverlining.jpg ~2MB → `loading="lazy"` + 리사이즈(1080px 너비) 적용 확인
- Lighthouse 모바일 점수 60+ 목표

---

## 레이어 PNG 추출 사전 작업 (현재 미사용)

> **참고**: 포트레이트 모드 전환으로 멀티레이어 애니메이션은 폐기되었다.
> 아래 스크립트는 향후 레이어 활용 가능성을 위해 참고용으로 보존한다.

빌드 전 1회 실행하는 스크립트. 멀티레이어 SVG에서 개별 PNG를 추출한다.

```bash
# scripts/extract-layers.py
python3 scripts/extract-layers.py
```

**출력:**
```
public/character/layers/
├── angel_0.png ~ angel_4.png
├── devil_0.png ~ devil_4.png
├── magician_0.png ~ magician_4.png
└── doin_0.png ~ doin_2.png
```

이 스크립트는 이미 실행하여 `docs/layer-preview/`에 미리보기가 생성되어 있다.
프로덕션용은 원본 해상도로 재추출 필요.

---

## 금지사항 (DESIGN-ALT2.md 준수)

- UI 뼈대에 6색 외 새로운 hex 코드 추가 금지
- 오행 색상은 자유 (6색 제한 밖)
- 긴 해석 본문에 Gaegu(손글씨체) 사용 금지 — Gaegu는 말풍선에만
- 글리터/네온/그라데이션 텍스트 금지
- 배경 영상/GIF 금지
- `#ffffff` (순백) 텍스트 금지 — 본문 텍스트는 `#dde1e5`
- 300ms 이상 지연 애니메이션 금지 (전환은 0.3~0.5s 이내)
- JS 파티클 라이브러리 사용 금지 (별빛은 CSS keyframes로)
- 스토리 콘텐츠 하드코딩 금지 — 외부 JSON에서 로드

---

## 참고 데이터 구조

### API 응답: `POST /api/saju/analyze`
```json
{
  "engine": {
    "pillars": {
      "year": { "gan": "丙", "ji": "寅" },
      "month": { "gan": "丁", "ji": "酉" },
      "day": { "gan": "壬", "ji": "戌" },
      "hour": { "gan": "庚", "ji": "子" } | null
    },
    "tenGods": {
      "yearGan": "편재", "monthGan": "정재",
      "dayGan": "비견", "hourGan": "편인" | null,
      "yearJi": "식신", "monthJi": "정인",
      "dayJi": "편관", "hourJi": "겁재" | null
    }
  },
  "core": {
    "summary": "string",
    "strengthReading": "string",
    "gyeokGukReading": "string",
    "yongSinReading": "string"
  }
}
```

### SSE 스트리밍: `POST /api/saju/interpret`
```
event: chunk → data: {"text": "..."}
event: done  → data: {"sections": { ... }}
event: error → data: {"error": "..."}
```
