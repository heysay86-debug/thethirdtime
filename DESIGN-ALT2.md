# Alt2 Design System -- Mystical Night (귀여운 도인)

## 1. Visual Theme & Atmosphere

동물 도인(마법사)이 밤하늘 아래에서 사주를 풀어주는 세계관.
차콜(`#414042`) 밤을 기본 톤으로, 한지와 먹의 따뜻한 질감을 더한다.
**우울하지 않고 귀여운** 느낌이 핵심이다.

영감: 지브리 마법사 + 한국 전통 도사 + 동물의 숲 밤하늘
분위기 키워드: 포근한 밤, 한지 위의 먹글씨, 신비롭지만 다정한, 동양의 지혜

**컬러 제한 규칙 (필수):**
사이트 뼈대(배경, 버튼, 카드, 텍스트 등 UI 구조)에 사용하는 헥스 코드는 아래 6색으로 제한한다.
파생 색상은 이 6색의 opacity 조절로만 생성한다. 새로운 헥스 코드 추가 금지.
단, 오행 색상 등 콘텐츠 고유의 기능적 색상은 이 제한에 포함되지 않는다.

```
#414042  차콜 (Charcoal)       -- 밤, 배경          RGB(65, 64, 66)
#726658  웜 그레이 (Warm Gray)  -- 중간톤, 보조      RGB(114, 102, 88)
#c2b59b  사금 (Sand Gold)      -- 1차 악센트, CTA   RGB(194, 181, 155)
#874b40  적갈 (Terracotta)     -- 강조 포인트       RGB(135, 75, 64)
#c68b7d  살구 (Apricot)        -- 2차 악센트, 따뜻함 RGB(198, 139, 125)
#b0ced1  청백 (Pale Blue)      -- 쿨 대비, 균형     RGB(176, 206, 209)
```

**핵심 원칙:**
- **차콜은 캔버스, 사금은 빛**: 어두운 배경 위에 사금색이 촛불처럼 UI를 밝힌다.
- **6색 엄수 (UI 뼈대)**: 사이트 구조 색상은 위 6개 + opacity 변형만 허용.
- **둥글고 부드럽게**: 날카로운 모서리 없음. 모든 요소는 둥글고 폭신한 인상을 준다.
- **캐릭터가 안내자**: UI가 설명하지 않는다. 캐릭터가 말풍선으로 안내한다.
- **과하지 않은 반짝임**: 별빛 파티클은 은은하게. 네온/글리터 금지.

**Key Characteristics:**
- 차콜(`#414042`) 그라데이션 배경 -- 위에서 아래로 깊어지는 밤
- 사금(`#c2b59b`) 악센트 -- 동양적 지혜, CTA, 강조 라벨
- 살구(`#c68b7d`) 보조 악센트 -- 캐릭터 말풍선, 따뜻한 포인트
- 별빛 파티클 -- `#c2b59b` opacity 변형, 은은하게 깜빡이는 작은 점들
- 말풍선 UI -- 캐릭터 대화 중심, 챗봇이 아닌 스토리텔링
- 둥근 모서리(16-20px) -- alt1(12px)보다 더 둥글게, 폭신한 느낌
- 풀스크린 스텝 전환 -- 스크롤이 아닌 화면 단위 진행

## 2. Color Palette & Roles

### 마스터 팔레트 (6색 한정 -- UI 뼈대 전용)

| 이름 | 헥스 | RGB | 역할 요약 |
|------|------|-----|-----------|
| Charcoal | `#414042` | 65, 64, 66 | 배경, 가장 어두운 톤 |
| Warm Gray | `#726658` | 114, 102, 88 | 보조 배경, 뮤트 텍스트, 디바이더 |
| Sand Gold | `#c2b59b` | 194, 181, 155 | 1차 악센트, CTA, 강조, 별빛 |
| Terracotta | `#874b40` | 135, 75, 64 | 포인트 강조, 적극적 액션 |
| Apricot | `#c68b7d` | 198, 139, 125 | 2차 악센트, 말풍선, 따뜻한 요소 |
| Pale Blue | `#b0ced1` | 176, 206, 209 | 쿨 대비, 정보성 텍스트, 균형 |

### Background (밤)
- **배경 기본**: `#414042` solid
- **배경 그라데이션**: `linear-gradient(180deg, #414042 0%, #3a393b 50%, #333234 100%)`
  (Charcoal의 명도 변형 -- 5% 어둡게/밝게로 깊이감)
- **Surface Elevated**: `rgba(114, 102, 88, 0.15)` (Warm Gray 15%) -- 카드 배경
- **Surface Hover**: `rgba(114, 102, 88, 0.25)` (Warm Gray 25%) -- 호버 상태

### Accent (빛)
- **Primary Accent**: `#c2b59b` -- CTA 버튼, 섹션 제목, 강조 라벨, 캐릭터 이름
- **Strong Accent**: `#874b40` -- 중요 포인트, 액티브 상태
- **Warm Accent**: `#c68b7d` -- 캐릭터 말풍선 배경 틴트, 부드러운 하이라이트
- **Cool Accent**: `#b0ced1` -- 정보 텍스트, 보조 라벨, 청량한 대비

### Surface (카드/말풍선)
- **Card Surface**: `rgba(114, 102, 88, 0.15)` -- Warm Gray 15%, 반투명 카드
- **Card Border**: `rgba(114, 102, 88, 0.30)` -- Warm Gray 30%, 카드 테두리
- **Bubble Character**: `rgba(198, 139, 125, 0.15)` -- Apricot 15%, 캐릭터 말풍선
- **Bubble Border**: `rgba(198, 139, 125, 0.30)` -- Apricot 30%, 말풍선 테두리
- **Input Surface**: `rgba(114, 102, 88, 0.12)` -- Warm Gray 12%, 입력 필드
- **Divider**: `rgba(114, 102, 88, 0.25)` -- Warm Gray 25%, 구분선

### Text
- **Text Primary**: `#c2b59b` -- Sand Gold. 다크 배경 위 주요 텍스트.
- **Text Secondary**: `#b0ced1` -- Pale Blue. 보조 설명, 메타 정보.
- **Text Warm**: `#c68b7d` -- Apricot. 캐릭터 대사 강조, 따뜻한 포인트.
- **Text Muted**: `#726658` -- Warm Gray. 캡션, 비활성 텍스트. (장식/보조용만)
- **Text On CTA**: `#414042` -- Charcoal. Sand Gold 버튼 위 텍스트.

### Semantic (6색 내 매핑)
- **Positive / 길(吉)**: `#b0ced1` -- Pale Blue. 차분한 길함.
- **Caution / 변(變)**: `#c2b59b` -- Sand Gold. 주의/변화.
- **Negative / 흉(凶)**: `#874b40` -- Terracotta. 부드러운 경고 (공포감 없이).
- **Neutral / 평(平)**: `#726658` -- Warm Gray. 중립.

### 오행 색상

오행 색상은 6색 팔레트 제한에 포함되지 않는다.
사주 결과 표시 시 전통적으로 통용되는 오행 색상을 자유롭게 사용한다.
단, 다크 배경과의 조화를 위해 파스텔/소프트 톤을 권장한다.

## 3. Typography Rules

### Font Family
- **UI Primary**: `"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif`
- **Brand Display**: `"Gaegu", "Nanum Pen Script", cursive` -- 손글씨 느낌, 귀여운 캐릭터 대사용
- **Monospace**: `"SF Mono", SFMono-Regular, Menlo, Consolas, monospace`

Pretendard는 오픈소스(OFL), 한글 완성형 지원, 가독성 우수.
Gaegu는 Google Fonts 제공, 귀여운 손글씨체로 캐릭터 말풍선에 사용.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Color | Notes |
|------|------|------|--------|-------------|-------|-------|
| Step Title | Pretendard | 28px | 700 | 1.30 | `#c2b59b` | 각 스텝 진입 시 |
| Section Title | Pretendard | 22px | 600 | 1.36 | `#c2b59b` | 결과 섹션 제목 |
| Character Speech | Gaegu | 20px | 400 | 1.60 | `#c2b59b` | 캐릭터 말풍선 |
| Body | Pretendard | 16px | 400 | 1.65 | `#c2b59b` | 해석 본문 |
| Body Accent | Pretendard | 16px | 500 | 1.65 | `#c68b7d` | 본문 내 강조 |
| Body Cool | Pretendard | 16px | 400 | 1.65 | `#b0ced1` | 보조 정보, 팁 |
| Body Small | Pretendard | 14px | 400 | 1.57 | `#b0ced1` | 보조 설명 |
| Caption | Pretendard | 13px | 400 | 1.54 | `#726658` | 출처, 부가 정보 |
| Label | Pretendard | 12px | 600 | 1.50 | `#c2b59b` | 라벨, 배지 |

### Principles
- **본문은 Pretendard**: 해석 텍스트는 가독성 최우선. 손글씨체로 긴 글 금지.
- **캐릭터만 Gaegu**: 캐릭터 말풍선, 짧은 감탄사, 전환 멘트에만 사용.
- **line-height 넉넉하게**: 다크 배경에서 텍스트 밀도가 높으면 답답함. 1.6 이상 유지.
- **본문 색상은 Sand Gold**: `#c2b59b`가 기본 텍스트. 순백 사용 금지 (6색 외).

## 4. Component Stylings

### Fullscreen Step Container
- 배경: Charcoal 그라데이션 (전체 화면 고정)
- 콘텐츠: `max-width: 440px`, 수직 중앙 정렬
- 전환: Framer Motion `AnimatePresence` + 페이드/슬라이드
- 별빛 파티클: `#c2b59b` opacity 변형, 배경 레이어에 CSS 키프레임

### Character Avatar
- 크기: 80px (말풍선 옆), 160px (스플래시)
- 형태: 원형, 2px `#c2b59b` 테두리
- 그림자: `0 0 20px rgba(194, 181, 155, 0.2)` -- 은은한 사금빛 글로우
- 위치: 말풍선 왼쪽 상단 (고정)

### Speech Bubble (캐릭터 말풍선)
- 배경: `rgba(198, 139, 125, 0.15)` -- Apricot 15%
- 테두리: 1px `rgba(198, 139, 125, 0.30)` -- Apricot 30%
- Radius: 20px (좌상단 4px -- 꼬리 방향)
- 텍스트: Gaegu 20px, `#c2b59b`
- 타이핑 효과: 글자 단위 순차 표시, 40ms 간격
- 최대 너비: 85%

### CTA Button (Primary)
- 배경: `#c2b59b` (Sand Gold)
- 텍스트: `#414042` (Charcoal), 16px weight 600
- Radius: 20px
- 패딩: 14px 28px
- 그림자: `0 0 16px rgba(194, 181, 155, 0.3)` -- 사금빛 글로우
- 호버: 글로우 확장 (`0 0 24px rgba(194, 181, 155, 0.4)`)
- width: 100% (모바일 풀너비)

### Secondary Button
- 배경: transparent
- 테두리: 1px `rgba(194, 181, 155, 0.4)` -- Sand Gold 40%
- 텍스트: `#c2b59b`, 14px weight 500
- Radius: 20px

### Accent Button (강조 액션)
- 배경: `#874b40` (Terracotta)
- 텍스트: `#c2b59b` (Sand Gold), 16px weight 600
- Radius: 20px
- 용도: "결과 보기", "분석 시작" 등 핵심 전환 액션

### Input Fields
- 배경: `rgba(114, 102, 88, 0.12)` -- Warm Gray 12%
- 테두리: 1px `rgba(114, 102, 88, 0.30)` -- Warm Gray 30%
- 포커스: 테두리 `#c68b7d` (Apricot)
- 텍스트: `#c2b59b`
- 플레이스홀더: `#726658`
- Radius: 16px

### Select / Dropdown
- 배경: `rgba(114, 102, 88, 0.12)` -- Warm Gray 12%
- 테두리: 1px `rgba(114, 102, 88, 0.30)` -- Warm Gray 30%
- 옵션 패널: `#414042` solid + `rgba(114, 102, 88, 0.30)` 보더
- 선택된 옵션: `rgba(194, 181, 155, 0.15)` 배경
- Radius: 16px

### Result Card (해석 결과 섹션)
- 배경: `rgba(114, 102, 88, 0.15)` -- Warm Gray 15%
- 테두리: 1px `rgba(114, 102, 88, 0.25)` -- Warm Gray 25%
- Radius: 20px
- 패딩: 24px
- 제목: `#c2b59b`, 18px weight 600
- backdrop-filter: `blur(8px)` -- 글래스모피즘
- 등장 애니메이션: 아래에서 위로 슬라이드 + 페이드인 (0.4s ease-out)

### Pillar Card (사주 기둥)
- 배경: `rgba(114, 102, 88, 0.10)` -- Warm Gray 10%
- Radius: 16px
- 천간/지지 글자: 28px weight 700
- 십성 라벨: 12px weight 600, `#c2b59b`

### Progress Indicator
- 스텝 도트: 8px 원형, 현재=`#c2b59b`, 나머지=`rgba(114, 102, 88, 0.40)`
- 전환: scale 1.0 → 1.3 + 색상 변경, 0.3s
- 위치: 화면 상단 중앙, 패딩 16px

### Loading Spinner
- 색상: `#c2b59b` (Sand Gold)
- 트레일: `rgba(194, 181, 155, 0.2)`
- 캐릭터 대사와 함께 표시: "잠시만 기다려주세요~"

## 5. Layout Principles

### Spacing System
- Base unit: 8px
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
- 수평 패딩: 24px (alt1의 16px보다 넓게 -- 여유로운 밤 느낌)
- 섹션 간격: 32px (결과 카드 사이)
- 말풍선 간격: 16px (연속 말풍선)

### Fullscreen Step Layout
```
+---------------------------+
|  [dot] [dot] [dot] [dot]  |   <- 진행 표시 (상단 16px)
|                           |
|                           |
|       [Character]         |   <- 캐릭터 아바타 (중앙)
|                           |
|    +-----------------+    |
|    | 말풍선 텍스트    |    |   <- 타이핑 애니메이션
|    +-----------------+    |
|                           |
|    [===== CTA ======]     |   <- 하단 고정 or 말풍선 아래
|                           |
+---------------------------+
```

### Result Scroll Layout
```
+---------------------------+
|  <- 뒤로    결과 보기      |   <- 헤더 (글래스)
|                           |
|  [Character] "분석 완료"   |   <- 캐릭터 인트로
|                           |
|  +-----+ +-----+         |
|  | 시주 | | 일주 | ...     |   <- 4기둥 가로 스크롤
|  +-----+ +-----+         |
|                           |
|  +---------------------+  |
|  | 격국과 용신          |  |   <- 결과 카드 (순차 등장)
|  | ...                  |  |
|  +---------------------+  |
|                           |
|  +---------------------+  |
|  | 성격과 기질          |  |
|  | ...                  |  |
|  +---------------------+  |
|           ...             |
+---------------------------+
```

### Whitespace Philosophy
- **밤하늘은 넓다**: 요소 사이 공간이 곧 밤하늘. 밀집 배치 금지.
- **호흡 리듬**: 말풍선 → 여백 → 말풍선. 대화하듯 리듬감 있게.
- **하단 여유**: 스크롤 끝에 64px 이상 여백. 마지막 카드가 화면 바닥에 붙지 않게.

### Border Radius Scale
- Soft (16px): 입력 필드, 셀렉트, 작은 카드
- Round (20px): 말풍선, 결과 카드, CTA 버튼
- Pill (9999px): 배지, 진행 도트, 태그
- Character (50%): 캐릭터 아바타

## 6. Animation & Motion

### 전환 (Page Transitions)
- 스텝 간 전환: 페이드아웃(0.2s) → 페이드인(0.3s) + 약간 위로 슬라이드(20px)
- Framer Motion `AnimatePresence` mode="wait"
- 이징: `ease-out` (등장), `ease-in` (퇴장)

### 타이핑 효과 (Character Speech)
- 글자 단위 순차 표시
- 속도: 40ms/글자 (한글 기준, 조절 가능)
- 마침표/쉼표 뒤: 200ms 추가 딜레이 (리듬감)
- 커서: `#c2b59b` 색상 블링크 (타이핑 중에만)

### 카드 등장 (Result Cards)
- 스크롤 진입 시 트리거 (Intersection Observer)
- `opacity: 0, translateY: 24px` → `opacity: 1, translateY: 0`
- duration: 0.4s, easing: `ease-out`
- 연속 카드: 0.1s stagger (순차 등장)

### 별빛 파티클 (Background Stars)
- CSS keyframes로 구현 (JS 파티클 라이브러리 불필요)
- 색상: `#c2b59b` (Sand Gold) -- 6색 내
- 작은 원(2-4px) 20-30개, 무작위 위치
- 깜빡임: `opacity 0.2 → 0.8 → 0.2`, 2-5초 주기 (각각 랜덤)
- 성능: `will-change: opacity`, GPU 가속

### 캐릭터 등장
- 스텝 진입 시: 아래에서 바운스 등장 (`spring` 이징, damping: 15)
- 말풍선 전: 캐릭터 약간 기울기(3도) → 복원 (고개 갸웃 느낌)
- 결과 전환 시: 캐릭터 손(지팡이) 흔드는 모션 (SVG 애니메이션 or CSS rotate)

### 금지 애니메이션
- 네온 글로우 펄스 (우울/사이버펑크 느낌)
- 과도한 패럴랙스 (멀미 유발)
- 3D 회전/플립 (동양적 분위기 깨짐)
- 300ms 이상 지연 (답답함)

## 7. Do's and Don'ts

### Do
- 6색 팔레트를 UI 뼈대에 엄격히 준수 (opacity 변형만 허용)
- 차콜 배경에 사금/살구 악센트로 따뜻한 밤 분위기 유지
- 캐릭터를 모든 안내 텍스트의 화자로 사용 (UI가 직접 말하지 않음)
- 둥근 모서리(16-20px)로 부드럽고 폭신한 느낌 유지
- 별빛은 `#c2b59b`로만, 은은하게, 장식이 아닌 배경으로
- 텍스트 line-height 1.6 이상 유지 (다크 배경 가독성)
- Gaegu 손글씨체는 캐릭터 말풍선에만 한정
- 전환 애니메이션은 0.3-0.5s 이내
- 오행 색상은 전통적 색상을 자유롭게 사용 (6색 제한 밖)

### Don't
- UI 뼈대에 6색 외 새로운 헥스 코드 추가
- 6색 팔레트를 오행 등 콘텐츠 고유 색상에까지 강제
- 긴 해석 본문에 손글씨체 사용 (가독성 저하)
- 글리터/스파클 과다 사용 (저가 느낌)
- 원색 네온 사용 (사이버펑크 =/= 동양 신비)
- 그림자 과다 사용 (글래스모피즘의 blur로 대체)
- 텍스트에 그라데이션 적용 (가독성 저하)
- 배경 영상/GIF 사용 (성능 + 분위기 통제 어려움)

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile (Primary) | <480px | 풀스크린 스텝, 세로 스크롤 결과 |
| Tablet | 480-768px | 동일 레이아웃, 넓은 카드 |
| Desktop | >768px | 중앙 440px 컨테이너, 양쪽 차콜 배경 + 별빛 확장 |

### Mobile First
- alt2는 모바일 전용 설계. 데스크톱은 모바일 레이아웃을 중앙 배치.
- 데스크톱에서 양쪽 여백은 차콜 배경 + 추가 별빛 파티클로 채움.
- 최대 콘텐츠 너비: 440px (모바일 최적)

### Touch Targets
- CTA 버튼: 최소 48px 높이, 풀너비
- 선택지 버튼: 최소 44px 높이
- 캐릭터 아바타: 탭 시 캐릭터 리액션 (이스터에그)

### Safe Area
- 하단 CTA: `padding-bottom: env(safe-area-inset-bottom)` 적용
- 상단 진행 도트: `padding-top: env(safe-area-inset-top)` 적용

## 9. Agent Prompt Guide

### Quick Color Reference (6색 한정 -- UI 뼈대)
```
배경:       #414042  (Charcoal)      RGB(65, 64, 66)
보조/뮤트:  #726658  (Warm Gray)     RGB(114, 102, 88)
1차 악센트: #c2b59b  (Sand Gold)     RGB(194, 181, 155)
강조 포인트: #874b40  (Terracotta)    RGB(135, 75, 64)
2차 악센트: #c68b7d  (Apricot)       RGB(198, 139, 125)
쿨 대비:    #b0ced1  (Pale Blue)     RGB(176, 206, 209)
```

### Surface 파생 (opacity 변형)
```
카드 배경:     rgba(114, 102, 88, 0.15)   -- Warm Gray 15%
카드 테두리:   rgba(114, 102, 88, 0.25)   -- Warm Gray 25%
말풍선 배경:   rgba(198, 139, 125, 0.15)  -- Apricot 15%
말풍선 테두리: rgba(198, 139, 125, 0.30)  -- Apricot 30%
입력 배경:     rgba(114, 102, 88, 0.12)   -- Warm Gray 12%
CTA 글로우:    rgba(194, 181, 155, 0.30)  -- Sand Gold 30%
별빛:          rgba(194, 181, 155, 0.2~0.8) -- Sand Gold 깜빡임
```

### Example Component Prompts
- "Create a fullscreen step: #414042 bg. Center: 80px circle avatar with 2px #c2b59b border and subtle glow (0 0 20px rgba(194,181,155,0.2)). Below: speech bubble with rgba(198,139,125,0.15) bg, 20px radius, Gaegu font 20px #c2b59b text with typing animation. Bottom: full-width #c2b59b button, 20px radius, #414042 text."
- "Build a saju pillar card: rgba(114,102,88,0.10) bg, 16px radius, backdrop-blur(8px). Top: 12px label in #c2b59b. Center: 28px bold hanja character. Element colors are independent of the 6-color palette."
- "Design result section: rgba(114,102,88,0.15) bg, 20px radius, backdrop-blur(8px), 1px rgba(114,102,88,0.25) border. Title in #c2b59b 18px weight 600. Body in #c2b59b 16px Pretendard line-height 1.65. Enter animation: slide up 24px + fade in 0.4s."

### Iteration Guide
1. UI 뼈대는 6색만 사용 -- 새 색상 추가 시 반드시 거부하고 기존 6색에서 대안 찾기
2. 오행 등 콘텐츠 고유 색상은 자유 -- 6색 제한 밖
3. Sand Gold(`#c2b59b`)가 THE accent -- CTA, 제목, 본문, 강조 모두 이 색
4. 캐릭터 말풍선은 Apricot 틴트, 본문 카드는 Warm Gray 틴트
5. 20px가 THE border-radius -- 버튼, 카드, 말풍선 모두 20px
6. 글래스모피즘: `rgba + backdrop-blur` 조합, 불투명 카드 금지
7. 모든 안내 텍스트는 캐릭터 화법으로 ("~해볼까요?", "~이랍니다")

---

## 10. Tailwind / CSS Variables

```css
@layer base {
  :root {
    /* alt2 마스터 팔레트 (6색 한정 -- UI 뼈대) */
    --alt2-charcoal: #414042;
    --alt2-warm-gray: #726658;
    --alt2-sand-gold: #c2b59b;
    --alt2-terracotta: #874b40;
    --alt2-apricot: #c68b7d;
    --alt2-pale-blue: #b0ced1;

    /* HSL 변환 (Tailwind 호환) */
    --alt2-bg: 300 1% 25%;
    --alt2-muted: 26 12% 40%;
    --alt2-primary: 39 27% 68%;
    --alt2-accent-strong: 9 36% 39%;
    --alt2-accent-warm: 11 33% 63%;
    --alt2-accent-cool: 185 22% 75%;

    /* Semantic 매핑 */
    --alt2-foreground: 39 27% 68%;           /* Sand Gold -- 기본 텍스트 */
    --alt2-foreground-secondary: 185 22% 75%; /* Pale Blue -- 보조 텍스트 */
    --alt2-foreground-muted: 26 12% 40%;     /* Warm Gray -- 뮤트 텍스트 */

    --alt2-radius-soft: 1rem;
    --alt2-radius-round: 1.25rem;
    --alt2-radius-pill: 9999px;
  }
}
```

---

## 11. Required Dependencies (alt1 대비 추가)

| 패키지 | 용도 | 비고 |
|--------|------|------|
| `framer-motion` | 페이지 전환, 카드 등장, 캐릭터 모션 | 핵심 |
| `pretendard` (CDN) | 본문 폰트 | Google Fonts or CDN link |
| Gaegu (Google Fonts) | 캐릭터 말풍선 폰트 | `@import` or `next/font` |

기존 의존성(`next`, `tailwindcss`, `lucide-react` 등)은 그대로 유지.

---

## 12. alt1 컴포넌트 재사용 계획

| alt1 컴포넌트 | alt2 재사용 | 변경 사항 |
|---------------|------------|-----------|
| SajuForm | 로직 재사용, UI 재작성 | 다크 테마 입력 필드 + 캐릭터 안내 |
| PillarTable | 로직 재사용, UI 재작성 | 다크 테마 기둥 카드 |
| CoreJudgment | 로직 재사용, UI 재작성 | 캐릭터 내레이션 형태 |
| InterpretationStream | SSE 로직 재사용, UI 재작성 | 순차 등장 카드 + 캐릭터 코멘트 |
| API Routes | 그대로 재사용 | 변경 없음 |
| Engine | 그대로 재사용 | 변경 없음 |
