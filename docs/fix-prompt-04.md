# fix-prompt-04: 기둥 프레임 + 오프닝 + 대화창 RPG 리디자인 + UX 버그 수정

> 이 문서는 Claude Code에 전달할 구현 프롬프트다.
> 아래 수정사항을 **순서대로, 빠짐없이** 적용하라.

---

## 수정 0-A: 기둥 프레임 시스템 (PillarFrame 컴포넌트)

### 개요
화면 좌우에 장식 기둥 이미지를 고정 배치하고, 상하에 기둥 색상과 맞춘 CSS 보더 라인을 깔아 RPG 프레임을 구성한다. 이 프레임은 웹사이트가 켜져 있는 동안 **항상 고정**된다.

### 에셋 정보
- **기둥 이미지**: `/public/background/poll.png` (768×1376, RGBA 투명 배경)
  - 실제 기둥은 이미지 중앙에 위치 (x: 331~386, 폭 약 56px)
  - 이미지 대비 기둥 폭: 7.3%
  - 좌측 기둥은 원본 그대로, 우측 기둥은 CSS `transform: scaleX(-1)` 좌우 반전
- **기둥 평균 색상**: `#835b33` (금갈색) — 상하 보더 라인에 이 색상 사용

### 새 파일: `app/alt2/components/base/PillarFrame.tsx`

```tsx
'use client';

import { motion } from 'framer-motion';

interface PillarFrameProps {
  isOpen: boolean;  // 기둥이 펼쳐진 상태인지
}

export default function PillarFrame({ isOpen }: PillarFrameProps) {
  // 기둥 폭: 뷰포트 기준. poll.png의 실제 기둥이 이미지 중앙에 있으므로
  // 이미지 자체를 기둥 폭으로 맞추면 투명 영역이 콘텐츠를 가리지 않는다.
  // 모바일 기준 약 30px 폭이 적절 (440px 기준 ~7%)
  const pillarWidth = 30;
  const borderHeight = 4;
  const borderColor = '#835b33';

  return (
    <div
      className="fixed inset-0"
      style={{ zIndex: 50, pointerEvents: 'none' }}
    >
      {/* 상단 보더 라인 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: borderHeight,
          background: `linear-gradient(to bottom, ${borderColor}, ${borderColor}dd)`,
        }}
      />

      {/* 하단 보더 라인 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: borderHeight,
          background: `linear-gradient(to top, ${borderColor}, ${borderColor}dd)`,
        }}
      />

      {/* 좌측 기둥 — 중앙에서 좌측으로 슬라이드 */}
      <motion.div
        initial={{ x: 'calc(50vw - 15px)' }}
        animate={{ x: isOpen ? 0 : 'calc(50vw - 15px)' }}
        transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: pillarWidth,
          height: '100%',
        }}
      >
        <img
          src="/background/poll.png"
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            imageRendering: 'auto',
          }}
        />
      </motion.div>

      {/* 우측 기둥 — 중앙에서 우측으로 슬라이드 (좌우 반전) */}
      <motion.div
        initial={{ x: 'calc(-50vw + 15px)' }}
        animate={{ x: isOpen ? 0 : 'calc(-50vw + 15px)' }}
        transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: pillarWidth,
          height: '100%',
          transform: 'scaleX(-1)',
        }}
      >
        <img
          src="/background/poll.png"
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            imageRendering: 'auto',
          }}
        />
      </motion.div>
    </div>
  );
}
```

> **주의**: 우측 기둥의 `transform: scaleX(-1)`과 framer-motion의 `animate.x`가 충돌할 수 있다. scaleX 반전은 이미지 `<img>` 태그에 직접 적용하고, motion.div의 transform은 위치 이동만 담당하도록 분리:

```tsx
{/* 우측 기둥 — 수정된 버전 */}
<motion.div
  initial={{ x: 'calc(-50vw + 15px)' }}
  animate={{ x: isOpen ? 0 : 'calc(-50vw + 15px)' }}
  transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
  style={{
    position: 'absolute',
    top: 0,
    right: 0,
    width: pillarWidth,
    height: '100%',
  }}
>
  <img
    src="/background/poll.png"
    alt=""
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'fill',
      transform: 'scaleX(-1)',  // 이미지에만 반전
    }}
  />
</motion.div>
```

---

## 수정 0-B: 오프닝 시퀀스

### 파일: `app/alt2/page.tsx`

새로운 Phase 추가 + 오프닝 시퀀스 구현.

1. Phase 타입에 `'opening'` 추가:
```ts
type Phase = 'opening' | 'dialogue' | 'transition' | 'result';
```

2. 초기 상태 변경:
```ts
const [phase, setPhase] = useState<Phase>('opening');
const [pillarsOpen, setPillarsOpen] = useState(false);
```

3. 오프닝 상태 추가:
```ts
const [phase, setPhase] = useState<Phase>('opening');
const [pillarsOpen, setPillarsOpen] = useState(false);
const [logoVisible, setLogoVisible] = useState(false);
const [logoFading, setLogoFading] = useState(false);
```

4. 오프닝 시퀀스 useEffect:
```ts
useEffect(() => {
  if (phase !== 'opening') return;
  
  // 시퀀스:
  // 0ms    — 검은 배경
  // 300ms  — 로고 페이드인
  // 2000ms — 로고 페이드아웃 시작
  // 2500ms — 로고 뒤에서 기둥 펼쳐지기 시작
  // 3700ms — 기둥 펼침 완료 (1.2s 애니메이션)
  // 4200ms — dialogue phase로 전환
  
  const t1 = setTimeout(() => setLogoVisible(true), 300);
  const t2 = setTimeout(() => setLogoFading(true), 2000);
  const t3 = setTimeout(() => setPillarsOpen(true), 2500);
  const t4 = setTimeout(() => {
    setLogoVisible(false);
    setPhase('dialogue');
  }, 4200);

  return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
}, [phase]);
```

5. PillarFrame + 로고 렌더링 (모든 Phase에서 기둥은 항상 표시):
```tsx
import PillarFrame from './components/base/PillarFrame';

// return 내부, 최상위에 배치:
<div className="relative min-h-screen" style={{ background: '#1a1e24' }}>
  {/* 기둥 프레임 — 항상 표시 */}
  <PillarFrame isOpen={pillarsOpen} />

  {/* 오프닝 화면: 로고 */}
  {phase === 'opening' && (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 5 }}
    >
      <img
        src="/icon/logo.svg"
        alt="제3의시간"
        style={{
          width: '60%',
          maxWidth: 280,
          opacity: logoVisible ? (logoFading ? 0 : 1) : 0,
          transition: 'opacity 0.8s ease',
        }}
      />
    </div>
  )}

  {/* 기존 콘텐츠: 배경, dialogue, transition, result ... */}
  {/* 기존 코드 그대로 유지 */}
</div>
```

> **로고 에셋**: `/public/icon/logo.svg` (7.5KB, viewBox 1966×507, 흰색 텍스트 "제3의시간", 투명 배경). 검은 배경 위에 흰색으로 표시된다.
> **시퀀스 설명**: 로고가 먼저 페이드인 → 1.7초간 표시 → 페이드아웃 → 로고가 사라지는 동안 뒤에서 기둥이 펼쳐짐 → 기둥 완료 후 dialogue 시작.

5. 오프닝 배경색 변경: 기존 `background: '#3e4857'`을 `'#1a1e24'` (어두운 색)로 변경하여 오프닝 시 검은 배경에서 기둥이 펼쳐지는 연출. dialogue phase 진입 후 배경은 StarField + before.jpg가 표시되므로 문제없다.

6. **콘텐츠 영역 패딩**: 기둥이 콘텐츠를 가리지 않도록, 모든 콘텐츠 컨테이너에 좌우 패딩을 기둥 폭(30px)만큼 확보. 

기존 max-width 440px 컨테이너들이 이미 `px-6` (24px) 패딩을 갖고 있으므로, 기둥 30px과 겹치지 않는지 확인. 440px 컨테이너가 화면 중앙에 위치하고 기둥은 뷰포트 양 끝에 있으므로, **뷰포트 너비가 440px 이상이면 기둥과 콘텐츠는 겹치지 않는다.**

모바일(440px 이하)에서는 기둥이 콘텐츠 위에 올라갈 수 있다. 이 경우를 위해:
- Zone B 결과 영역의 좌우 패딩을 기둥 폭 이상으로 설정: `px-[38px]` 또는 `pl-[38px] pr-[38px]`
- DialoguePlayer의 `max-w-[440px] mx-auto px-4`도 `px-[38px]`로 변경

```tsx
// DialoguePlayer.tsx 렌더링 영역
<div
  className="w-full max-w-[440px] mx-auto space-y-2"
  style={{ 
    paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
    paddingLeft: 38,
    paddingRight: 38,
  }}
>
```

```tsx
// page.tsx Zone B 결과 영역
<div className="max-w-[440px] mx-auto pt-8 pb-16 space-y-8"
  style={{ paddingLeft: 38, paddingRight: 38 }}
>
```

---

## 수정 1: 캐릭터 시작 위치 상향

### 문제
현재 DotCharacter 초기 y좌표가 79%로, 하단 대화창 영역에 가려진다.

### 파일: `app/alt2/page.tsx`

dotState 초기값 변경:
```ts
// 기존
const [dotState, setDotState] = useState({
  direction: 'front' as 'front' | 'back' | 'left' | 'right',
  x: 50,
  y: 79,  // ← 대화창에 가림
  visible: true,
});

// 변경
const [dotState, setDotState] = useState({
  direction: 'front' as 'front' | 'back' | 'left' | 'right',
  x: 50,
  y: 62,  // ← 대화창 위로 올림
  visible: true,
});
```

`handleReset`의 dotState 초기화도 동일하게 y: 62로 변경.

### 파일: `app/alt2/components/dialogue/DialoguePlayer.tsx`

SUN_PATH, MOON_PATH의 시작점도 y:62 기준으로 재조정. 기존 경로에서 y좌표를 전체적으로 비례 축소한다:

```ts
const SUN_PATH = [
  { direction: 'left' as const,  x: 40, y: 62, duration: 400 },
  { direction: 'back' as const,  x: 40, y: 56, duration: 500 },
  { direction: 'left' as const,  x: 31, y: 56, duration: 400 },
  { direction: 'back' as const,  x: 31, y: 46, duration: 600 },
  { direction: 'right' as const, x: 37, y: 46, duration: 300 },
  { direction: 'back' as const,  x: 37, y: 38, duration: 500 },
  { direction: 'left' as const,  x: 32, y: 38, duration: 300 },
  { direction: 'back' as const,  x: 32, y: 32, duration: 400 },
];

const MOON_PATH = [
  { direction: 'right' as const, x: 58, y: 62, duration: 400 },
  { direction: 'back' as const,  x: 58, y: 54, duration: 500 },
  { direction: 'right' as const, x: 63, y: 54, duration: 300 },
  { direction: 'back' as const,  x: 63, y: 44, duration: 600 },
];
```

---

## 수정 2: DialogueBox RPG 픽셀 스타일 리디자인

### 파일: `app/alt2/components/base/DialogueBox.tsx`

대화창을 고전 RPG 스타일로 전면 교체한다.

### 레이아웃 변경사항
- **초상화 위치**: 왼쪽 → **오른쪽**으로 이동
- **초상화 크기**: 80×80 → **대화창 높이에 맞춤 (약 100~120px)**
- **이름 위치**: 좌상단에 색상 강조 (금색 #f0dfad)
- **진행 표시**: 하단 **중앙**에 ▼
- **테두리**: CSS border-image 9-slice 픽셀 보더

### 픽셀 보더 구현 (CSS border-image 9-slice)

인라인 SVG로 픽셀 보더를 생성한다. 이 SVG는 24×24 크기의 9-slice 원본으로, 각 모서리에 3단계 계단형 픽셀 컷이 들어간다:

```ts
const PIXEL_BORDER_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
  <defs>
    <style>
      .outer { fill: #8899aa; }
      .inner { fill: #556677; }
      .bg { fill: rgba(20, 25, 35, 0.92); }
    </style>
  </defs>
  <!-- Background -->
  <rect x="3" y="3" width="18" height="18" class="bg"/>
  <!-- Outer border -->
  <rect x="3" y="0" width="18" height="1" class="outer"/>
  <rect x="3" y="23" width="18" height="1" class="outer"/>
  <rect x="0" y="3" width="1" height="18" class="outer"/>
  <rect x="23" y="3" width="1" height="18" class="outer"/>
  <rect x="2" y="1" width="1" height="1" class="outer"/>
  <rect x="1" y="2" width="1" height="1" class="outer"/>
  <rect x="21" y="1" width="1" height="1" class="outer"/>
  <rect x="22" y="2" width="1" height="1" class="outer"/>
  <rect x="2" y="22" width="1" height="1" class="outer"/>
  <rect x="1" y="21" width="1" height="1" class="outer"/>
  <rect x="21" y="22" width="1" height="1" class="outer"/>
  <rect x="22" y="21" width="1" height="1" class="outer"/>
  <!-- Inner border -->
  <rect x="3" y="2" width="18" height="1" class="inner"/>
  <rect x="3" y="21" width="18" height="1" class="inner"/>
  <rect x="2" y="3" width="1" height="18" class="inner"/>
  <rect x="21" y="3" width="1" height="18" class="inner"/>
</svg>
`)}`;
```

이 SVG를 `border-image`로 적용:
```css
borderImage: `url("${PIXEL_BORDER_SVG}") 6 fill / 6px`,
borderStyle: 'solid',
```

> **핵심**: `fill` 키워드가 있어야 중앙 영역(배경)도 함께 채워진다. `6`은 slice 값으로, 24px SVG에서 모서리 6px를 잘라 9-slice로 사용한다.

### 전체 DialogueBox 컴포넌트 구조

```tsx
return (
  <div
    className={`relative ${className}`}
    onClick={skipTyping}
    style={{
      borderImage: `url("${PIXEL_BORDER_SVG}") 6 fill / 6px`,
      borderStyle: 'solid',
      padding: '12px 14px',
      cursor: 'pointer',
      imageRendering: 'pixelated',
    }}
  >
    <div className="flex gap-3">
      {/* Text area - 왼쪽 */}
      <div className="flex-1 min-w-0">
        {/* Speaker name - 좌상단 */}
        {!isSystem && line.name && (
          <div
            className="mb-1"
            style={{ fontSize: 13, fontWeight: 700, color: '#f0dfad' }}
          >
            {line.name}
          </div>
        )}

        {/* Dialogue text */}
        <div style={textStyle}>
          {displayed}
          {isTyping && (
            <span className="animate-pulse" style={{ color: '#dde1e5', marginLeft: 2 }}>
              ▏
            </span>
          )}
        </div>
      </div>

      {/* Portrait - 오른쪽 */}
      {!isSystem && (
        <Portrait name={line.character} size="lg" />
      )}
    </div>

    {/* Indicator - 하단 중앙 */}
    {showIndicator && !isTyping && (
      <div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 animate-pulse"
        style={{ color: '#8899aa', fontSize: 10 }}
      >
        ▼
      </div>
    )}
  </div>
);
```

### 텍스트 스타일 조정

기존 `textStyle`에서 폰트 유지하되, system 스타일일 때도 픽셀 보더 안에서 자연스럽게 보이도록 조정:
```ts
const textStyle: React.CSSProperties = {
  fontFamily: isSystem
    ? '"Pretendard Variable", "Noto Sans KR", sans-serif'
    : 'var(--font-gaegu), "Gaegu", cursive',
  fontSize: line.style === 'emphasis' ? 18 : line.style === 'whisper' ? 14 : isSystem ? 13 : 16,
  color: line.style === 'emphasis' ? '#f0dfad' : '#dde1e5',
  opacity: line.style === 'whisper' ? 0.6 : 1,
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
  textAlign: isSystem ? 'center' : undefined,
};
```

### 배경색 제거

기존의 `background`, `backdropFilter`, `border`, `borderRadius` 속성을 **모두 제거**한다. border-image가 배경과 테두리를 모두 처리한다.

---

## 수정 3: Portrait 컴포넌트 수정

### 파일: `app/alt2/components/base/Portrait.tsx`

- `lg` 사이즈를 대화창 높이에 맞게 조정
- 둥근 모서리(borderRadius) 제거 → 직각 또는 작은 단계형
- 테두리를 픽셀 스타일로 변경

```ts
const sizeMap = { sm: 48, md: 80, lg: 110 };
```

Portrait 컨테이너 스타일 변경:
```tsx
<div
  className={`flex-shrink-0 overflow-hidden ${className}`}
  style={{
    width: px,
    height: px,
    border: '2px solid #8899aa',
    imageRendering: 'pixelated',
    background: 'rgba(20, 25, 35, 0.6)',
  }}
>
```

> borderRadius 제거. 픽셀 아트와 둥근 모서리는 어울리지 않는다.

---

## 수정 4: 워크 시퀀스 중 대화창 숨김 (isWalking 상태)

### 문제
캐릭터가 PATH를 따라 이동하는 동안 대화창에 텍스트가 나타났다 사라지며 깜빡인다. 원인: `pendingTempleWalk` 진입 시 `setShowResponse(false)`로 대화창이 이전 라인으로 돌아가고, async 워크 중에도 DialogueBox가 계속 렌더링된다.

### 파일: `app/alt2/components/dialogue/DialoguePlayer.tsx`

1. 새로운 상태 추가:
```ts
const [isWalking, setIsWalking] = useState(false);
```

2. `handleTap`의 pendingTempleWalk 블록 수정:
```ts
if (showResponse) {
  if (pendingTempleWalk) {
    setPendingTempleWalk(false);
    setIsWalking(true);  // 대화창 숨김 시작
    setShowResponse(false);
    setResponseLines([]);

    (async () => {
      const calendar = collectedInput.calendar;
      const path = calendar === 'lunar' ? MOON_PATH : SUN_PATH;

      onDotMove?.({ direction: 'back' });
      await delay(300);

      for (const step of path) {
        onDotMove?.({ direction: step.direction });
        await delay(100);
        onDotMove?.({ x: step.x, y: step.y });
        await delay(step.duration);
      }

      onDotMove?.({ visible: false });
      onBgChange?.('blackout');
      await delay(800);

      onBgChange?.(calendar === 'lunar' ? 'inside_moon' : 'inside_sun');
      await delay(500);

      onDotMove?.({ direction: 'front', x: 50, y: 60, visible: true });
      
      setIsWalking(false);  // 대화창 다시 표시
      advanceInputFlow();
    })();
    return;
  }
  advanceInputFlow();
  return;
}
```

3. **렌더링 영역에서 isWalking일 때 대화창 전체 숨김**:

```tsx
return (
  <div className="fixed inset-0 flex flex-col justify-end" style={{ zIndex: 10 }}>
    {/* Tap area */}
    <div className="flex-1" onClick={handleTap} />

    {/* isWalking이면 대화창 영역 전체를 숨김 */}
    {!isWalking && (
      <div
        className="w-full max-w-[440px] mx-auto px-4 space-y-2"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        {/* Choice panel */}
        {showChoices && currentLine.choices && (
          <ChoicePanel choices={currentLine.choices} onSelect={handleChoiceSelect} />
        )}

        {/* Input panel */}
        {showInput && currentLine.action && INPUT_TYPE_MAP[currentLine.action] && (
          <DialogueInput
            type={INPUT_TYPE_MAP[currentLine.action]}
            config={currentLine.inputConfig}
            onSubmit={handleDialogueInput}
            onSkip={currentLine.inputConfig?.skipLabel ? handleDialogueSkip : undefined}
          />
        )}

        {/* Dialogue box */}
        <DialogueBox
          key={showResponse ? `resp-${inputLineIndex}-${dynamicInsertQueue.length}` : `${mode}-${activeIndex}-${dynamicInsertQueue.length}`}
          line={showResponse ? responseLines[0] : lineWithName}
          typing
          onTypingComplete={showResponse ? handleResponseTypingComplete : handleTypingComplete}
          onTap={handleTap}
          showIndicator={showResponse ? typingDone : showIndicator}
        />
      </div>
    )}
  </div>
);
```

4. `isWalking` 중에는 탭도 무시:
```ts
const handleTap = useCallback(() => {
  if (isWalking) return;  // 워크 중 탭 무시
  if (showChoices || showInput) return;
  // ... 이하 동일
```

---

## 수정 5: past 구간 대사 보강

### 파일: `public/content/dialogue-intro.json`

past.jpeg 배경에서 진행되는 대사가 너무 짧다. 이미지에 달력, 시계, 아기 침대가 있으므로 이를 활용한 내러티브를 추가한다.

### 현재 inputFlow에서 past 전환 이후 흐름:

```
index 5: "시간의 유적에 도착했네." (action: bg_past) → past.jpeg 전환
index 6: "오...! 보이는가?"
index 7: "저기 벽에 달력이 걸려 있군."
index 8: "{{birthdate_display}} 이 날이 맞는가?" → confirm/retry
index 9: (confirm 후) input_birthtime 대화
index 10: input_birthtime 입력
...
```

### 변경: index 5~8 사이에 대사 추가

"시간의 유적에 도착했네" (bg_past 전환) 이후, confirm_birthdate 전까지 대사를 보강:

```json
{
  "character": "magician",
  "text": "시간의 유적에 도착했네.",
  "style": "system",
  "action": "bg_past"
},
{
  "character": "crazy",
  "text": "오...! 보이는가?\n이곳이 자네가 태어난 바로 그 시점이야.",
  "style": "emphasis"
},
{
  "character": "speak",
  "text": "우주의 한 귀퉁이에 떠 있는 이 작은 방...\n자네의 시간은 이곳에서 시작되었지.",
  "style": "normal"
},
{
  "character": "magician",
  "text": "저기 벽에 달력이 걸려 있군.\n확인해보게.",
  "style": "normal"
},
{
  "character": "excite",
  "text": "{{birthdate_display}}\n이 날이 맞는가?",
  "style": "emphasis",
  "action": "show_choices",
  "choices": [
    { "label": "맞아, 이 날이야", "action": "confirm_birthdate", "style": "primary" },
    { "label": "아니, 다시 입력할게", "action": "retry_birthdate", "style": "secondary" }
  ]
}
```

confirm_birthdate 이후 ~ submit_and_transition 전까지도 보강:

```json
{
  "character": "doin",
  "text": "좋아. 이제 저 시계를 보게.\n자네가 이 세상에 첫 울음을 터뜨린\n바로 그 시각이 적혀 있을 거야.",
  "style": "normal"
},
{
  "character": "magician",
  "text": "자네는 자네 출생에 대한\n비밀을 들은 적이 있는가?",
  "action": "input_birthtime",
  "icon": "ques",
  "inputConfig": {
    "skipLabel": "모르겠어요",
    "skipValue": "unknown"
  },
  "responses": {
    "_any": {
      "character": "flash",
      "text": "{{value}}...\n그래, 그 시각이었군.\n시계의 바늘이 움직이기 시작했어."
    },
    "_skip": {
      "character": "sweat",
      "text": "시계가... 멈춰 있군.\n때론 모르는 것이 나을 수도 있지."
    }
  }
},
{
  "character": "speak",
  "text": "이 방의 창밖을 보게.\n별들의 위치가 자네가 태어난 곳을 가리키고 있어.",
  "style": "normal"
},
{
  "character": "speak",
  "text": "자네가 태어난 곳의 기운을\n기억해보게. 어디였지?\n가장 가까운 곳을 선택하게.",
  "action": "input_birthcity",
  "inputConfig": {
    "skipLabel": "서울 기준으로 하겠습니다",
    "skipValue": "서울",
    "options": [
      "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
      "수원", "성남", "고양", "용인", "부천", "안산", "안양", "남양주",
      "화성", "평택", "의정부", "시흥", "파주", "김포",
      "춘천", "원주", "강릉", "청주", "충주", "천안", "아산",
      "전주", "군산", "익산", "목포", "여수", "순천",
      "포항", "경주", "구미", "안동", "창원", "진주", "김해",
      "제주", "서귀포"
    ]
  },
  "responses": {
    "_any": {
      "character": "flash",
      "text": "{{value}}...\n그곳의 기운까지 반영하겠네.\n시간 보정이 더 정확해질 거야."
    },
    "_skip": {
      "character": "flash",
      "text": "좋네. 서울의 기준점으로 읽겠네."
    }
  }
},
{
  "character": "magician",
  "text": "......",
  "style": "system"
},
{
  "character": "excite",
  "name": "복길",
  "text": "됐어! 네 기둥의 글자가\n모두 드러나기 시작했네!",
  "style": "emphasis",
  "icon": "star"
},
{
  "character": "magician",
  "text": "이 방의 모든 것이 자네의 사주를 가리키고 있었어.\n달력은 자네의 날을, 시계는 자네의 시를.",
  "style": "normal"
},
{
  "character": "magician",
  "text": "이제 시간의 문을 열어\n자네의 숨겨진 힘을 읽어보지.",
  "style": "emphasis",
  "action": "submit_and_transition"
}
```

> **중요**: 위 JSON은 confirm_birthdate 이후부터 submit_and_transition까지의 전체 흐름이다. 기존 inputFlow의 해당 구간을 이 내용으로 **교체**하라. 새로 추가된 대사는 "이 방의 창밖을 보게" (birthcity 입력 전)와 "이 방의 모든 것이..." (submit 직전) 두 줄이다.

---

## 수정 6: Zone B InlineDialogue 호환

### 파일: `app/alt2/components/result/InlineDialogue.tsx`

InlineDialogue도 DialogueBox를 사용하므로, 수정 2의 RPG 스타일이 자동 적용된다. 단, Zone B에서는 대화창 크기가 다양하게 변할 수 있으므로 확인 필요:

- border-image 9-slice는 **어떤 크기에서도** 자동 스케일되므로 별도 수정 불필요.
- Zone B의 InlineDialogue에서 초상화가 너무 크면 `size="md"` 또는 `size="sm"`로 조절. InlineDialogue에서 DialogueBox를 호출할 때 사용하는 Portrait 사이즈가 현재 DialogueBox 내부에서 고정(lg)되어 있으므로, **props로 portrait 사이즈를 받을 수 있도록** DialogueBox에 optional prop 추가:

```ts
interface DialogueBoxProps {
  line: DialogueLine;
  typing?: boolean;
  typingSpeed?: number;
  onTypingComplete?: () => void;
  onTap?: () => void;
  showIndicator?: boolean;
  className?: string;
  portraitSize?: 'sm' | 'md' | 'lg';  // 추가
}
```

기본값은 `'lg'` (Zone A용), InlineDialogue에서는 `'md'`로 전달:
```tsx
// InlineDialogue.tsx 내부
<DialogueBox
  key={lineIndex}
  line={{ ...currentLine, name: displayName }}
  typing={started}
  onTypingComplete={handleTypingComplete}
  onTap={handleTap}
  showIndicator={typingDone && lineIndex < lines.length - 1}
  portraitSize="md"
/>
```

---

## 검증 체크리스트

### 오프닝 + 프레임
1. [ ] 페이지 진입 시 검은 배경에서 시작
2. [ ] 0.3초 후 "제3의시간" 로고가 페이드인되는가
3. [ ] 로고가 약 1.7초간 표시된 후 페이드아웃되는가
4. [ ] 로고 페이드아웃 중 좌우 기둥이 중앙에서 양쪽으로 펼쳐지는가
5. [ ] 기둥 펼침 완료 후 상하 보더 라인이 나타나는가
6. [ ] 오프닝 종료 후 자동으로 dialogue phase로 전환되는가
5. [ ] 기둥 프레임이 모든 phase에서 항상 고정 표시되는가
6. [ ] 기둥이 콘텐츠 클릭을 가리지 않는가 (pointer-events: none)
7. [ ] Zone B 콘텐츠가 기둥 안쪽에서 표시되는가 (좌우 패딩 38px)

### 대화창
8. [ ] 대화창이 픽셀 보더로 렌더링되는가 (계단형 모서리, 이중선)
9. [ ] 초상화가 대화창 **오른쪽**에 표시되는가
10. [ ] 이름이 대화창 **좌상단**에 금색으로 표시되는가
11. [ ] ▼ 표시가 하단 **중앙**에 있는가
12. [ ] system 스타일 대사에서 초상화가 숨겨지는가

### 캐릭터 + 워크
13. [ ] 캐릭터가 대화창 위에 보이는가 (y:62 확인)
14. [ ] 캐릭터 워크 시퀀스 동안 대화창이 완전히 숨겨지는가
15. [ ] 워크 중 탭해도 반응하지 않는가
16. [ ] 워크 완료 후 대화창이 정상 복귀하는가

### 대사 + 흐름
17. [ ] past.jpeg 전환 후 "우주의 한 귀퉁이에..." 추가 대사가 표시되는가
18. [ ] confirm_birthdate 후 "저 시계를 보게" 대사가 이어지는가
19. [ ] "이 방의 창밖을 보게" 대사 후 birthcity 입력이 나오는가
20. [ ] "이 방의 모든 것이..." 대사 후 submit_and_transition이 실행되는가
21. [ ] Zone B의 InlineDialogue에서도 픽셀 보더가 정상 표시되는가
22. [ ] Zone B InlineDialogue의 초상화 크기가 적절한가 (md 사이즈)

### 전체 흐름
23. [ ] 오프닝(기둥 펼침) → before → after(성별) → 워크(대화창 숨김) → blackout → inside → past → Zone B
