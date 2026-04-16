# Alt2 Design System -- Mystical Night (귀여운 도인)

## 1. Visual Theme & Atmosphere

동물 도인(마법사)이 밤하늘 아래에서 사주를 풀어주는 세계관.
다크 네이비(`#3e4857`) 밤을 기본 톤으로, 한지와 먹의 따뜻한 질감을 더한다.
**우울하지 않고 귀여운** 느낌이 핵심이다.

영감: 지브리 마법사 + 한국 전통 도사 + 동물의 숲 밤하늘
분위기 키워드: 포근한 밤, 한지 위의 먹글씨, 신비롭지만 다정한, 동양의 지혜

**컬러 제한 규칙 (필수):**
사이트 뼈대(배경, 버튼, 카드, 텍스트 등 UI 구조)에 사용하는 헥스 코드는 아래 6색으로 제한한다.
파생 색상은 이 6색의 opacity 조절로만 생성한다. 새로운 헥스 코드 추가 금지.
단, 오행 색상 등 콘텐츠 고유의 기능적 색상은 이 제한에 포함되지 않는다.

```
#3e4857  다크 네이비 (Dark Navy)      -- 밤, 배경          RGB(62, 72, 87)
#688097  스틸 블루 (Steel Blue)       -- 중간톤, 보조      RGB(104, 128, 151)
#dde1e5  라이트 그레이블루 (Light Gray Blue) -- 1차 악센트, CTA   RGB(221, 225, 229)
#e9b8b7  소프트 핑크 (Soft Pink)      -- 강조 포인트       RGB(233, 184, 183)
#f0dfad  크림 옐로 (Cream Yellow)     -- 2차 악센트, 따뜻함 RGB(240, 223, 173)
#a1c5ac  세이지 그린 (Sage Green)     -- 쿨 대비, 균형     RGB(161, 197, 172)
```

**핵심 원칙:**
- **네이비는 캔버스, 라이트 그레이블루는 빛**: 어두운 배경 위에 밝은 회청색이 달빛처럼 UI를 밝힌다.
- **6색 엄수 (UI 뼈대)**: 사이트 구조 색상은 위 6개 + opacity 변형만 허용.
- **둥글고 부드럽게**: 날카로운 모서리 없음. 모든 요소는 둥글고 폭신한 인상을 준다.
- **캐릭터가 안내자**: UI가 설명하지 않는다. 캐릭터가 말풍선으로 안내한다.
- **과하지 않은 반짝임**: 별빛 파티클은 은은하게. 네온/글리터 금지.

**Key Characteristics:**
- 다크 네이비(`#3e4857`) 그라데이션 배경 -- 위에서 아래로 깊어지는 밤
- 라이트 그레이블루(`#dde1e5`) 악센트 -- 동양적 지혜, CTA, 강조 라벨
- 크림 옐로(`#f0dfad`) 보조 악센트 -- 캐릭터 말풍선, 따뜻한 포인트
- 별빛 파티클 -- `#dde1e5` opacity 변형, 은은하게 깜빡이는 작은 점들
- 말풍선 UI -- 캐릭터 대화 중심, 챗봇이 아닌 스토리텔링
- 둥근 모서리(16-20px) -- alt1(12px)보다 더 둥글게, 폭신한 느낌
- 상세페이지형 스크롤 레이아웃 -- 고정 폭(440px) 안에서 위→아래 순서 고정
- 배경 전환 -- 어두운 밤(#3e4857) → silverlining.jpg 점진 노출 (결과 하단)
- 입력은 팝업 모달 -- 스크롤 위치 유지, DOM 분리(createPortal)

### 콘텐츠 구조 (ZONE 구분)

```
ZONE A — RPG 대화 시퀀스 (풀스크린, 전유저 동일)
  ① 풀스크린 배경(StarField + #3e4857)
  ② 하단 고정 RPG 대화창 (포트레이트 + 텍스트, 탭 진행)
  ③ 표정 변화하는 캐릭터가 스토리텔링
  ④ 선택지 패널 → "나의 사주 보기" or "조금 더 알려줘"
  → "나의 사주 보기" 클릭 시 팝업 모달로 생년월일 입력
  → 제출 후 픽셀 줌 트랜지션(확대→암전→로딩→축소)으로 ZONE B 진입

ZONE B — 무료 결과 (유저별 맞춤)
  ⑤ 사주원국 조견표 (한자+한글음차+십성+지장간+합충형해파)
  ⑥ 신살 (조견표 하단 열 맞춤)
  ⑦ 대운 (가로 스크롤 타임라인)
  ⑧ 세운 (올해/내년)
  ⑨ 오행 상관관계 (고정 이미지, 상생·상극)
  ⑩ 오행 분포 (펜타곤 레이더 차트 + 개수)
  ⑪ 캐릭터 쉬운말 해설 (전문용어 → 일반어 변환)
  ⑪-b 궁합 유도 (2인/3인 선택)

ZONE C — 과금 유도 (고정)
  ⑫ 인라인 대화창 (angel/devil 교차, 블러 미리보기)
  ⑬ 유료 CTA (silverlining 배경 전환)
  ⑭ 푸터
```

### 에셋 인벤토리 요약

**캐릭터 12종** (public/character/) — 포트레이트 모드:
- 12종 모두 RPG 대화창 내 포트레이트(얼굴/상반신 크롭)로 사용
- 표정 전환 = 캐릭터 파일 교체 + crossfade 0.15s
- 멀티레이어 애니메이션은 사용하지 않음 (래스터 SVG 한계로 폐기)

**아이콘 19종** (public/icon/):
- 오행 음양 10종: mok/hwa/to/geum/su × yang/yin
- 감정/브랜딩 9종: angry, boom, excl, heart, music, ques, stamp, star, wait

**배경 1종** (public/background/):
- silverlining.jpg (3753×5630) — ZONE C에서 점진 노출

**도트 스프라이트** (public/sprite/) — 준비 중:
- guide_walk.png (128×32, 4프레임) — 안내자 캐릭터 걷기
- MVP에서는 CSS div 대안으로 대체, 에셋 준비 시 교체

상세 레이어 맵: `docs/alt2-implementation-guide.md` 참조

## 2. Color Palette & Roles

### 마스터 팔레트 (6색 한정 -- UI 뼈대 전용)

| 이름 | 헥스 | RGB | 역할 요약 |
|------|------|-----|-----------|
| Dark Navy | `#3e4857` | 62, 72, 87 | 배경, 가장 어두운 톤 |
| Steel Blue | `#688097` | 104, 128, 151 | 보조 배경, 뮤트 텍스트, 디바이더 |
| Light Gray Blue | `#dde1e5` | 221, 225, 229 | 1차 악센트, CTA, 강조, 별빛 |
| Soft Pink | `#e9b8b7` | 233, 184, 183 | 포인트 강조, 적극적 액션 |
| Cream Yellow | `#f0dfad` | 240, 223, 173 | 2차 악센트, 말풍선, 따뜻한 요소 |
| Sage Green | `#a1c5ac` | 161, 197, 172 | 쿨 대비, 정보성 텍스트, 균형 |

### Background (밤)
- **배경 기본**: `#3e4857` solid
- **배경 그라데이션**: `linear-gradient(180deg, #3e4857 0%, #364050 50%, #2f3848 100%)`
  (Dark Navy의 명도 변형 -- 5% 어둡게/밝게로 깊이감)
- **Surface Elevated**: `rgba(104, 128, 151, 0.15)` (Steel Blue 15%) -- 카드 배경
- **Surface Hover**: `rgba(104, 128, 151, 0.25)` (Steel Blue 25%) -- 호버 상태

### Accent (빛)
- **Primary Accent**: `#dde1e5` -- CTA 버튼, 섹션 제목, 강조 라벨, 캐릭터 이름
- **Strong Accent**: `#e9b8b7` -- 중요 포인트, 액티브 상태
- **Warm Accent**: `#f0dfad` -- 캐릭터 말풍선 배경 틴트, 부드러운 하이라이트
- **Cool Accent**: `#a1c5ac` -- 정보 텍스트, 보조 라벨, 청량한 대비

### Surface (카드/말풍선)
- **Card Surface**: `rgba(104, 128, 151, 0.15)` -- Steel Blue 15%, 반투명 카드
- **Card Border**: `rgba(104, 128, 151, 0.30)` -- Steel Blue 30%, 카드 테두리
- **Bubble Character**: `rgba(240, 223, 173, 0.15)` -- Cream Yellow 15%, 캐릭터 말풍선
- **Bubble Border**: `rgba(240, 223, 173, 0.30)` -- Cream Yellow 30%, 말풍선 테두리
- **Input Surface**: `rgba(104, 128, 151, 0.12)` -- Steel Blue 12%, 입력 필드
- **Divider**: `rgba(104, 128, 151, 0.25)` -- Steel Blue 25%, 구분선

### Text
- **Text Primary**: `#dde1e5` -- Light Gray Blue. 다크 배경 위 주요 텍스트.
- **Text Secondary**: `#a1c5ac` -- Sage Green. 보조 설명, 메타 정보.
- **Text Warm**: `#f0dfad` -- Cream Yellow. 캐릭터 대사 강조, 따뜻한 포인트.
- **Text Muted**: `#688097` -- Steel Blue. 캡션, 비활성 텍스트. (장식/보조용만)
- **Text On CTA**: `#3e4857` -- Dark Navy. Light Gray Blue 버튼 위 텍스트.

### Semantic (6색 내 매핑)
- **Positive / 길(吉)**: `#a1c5ac` -- Sage Green. 차분한 길함.
- **Caution / 변(變)**: `#dde1e5` -- Light Gray Blue. 주의/변화.
- **Negative / 흉(凶)**: `#e9b8b7` -- Soft Pink. 부드러운 경고 (공포감 없이).
- **Neutral / 평(平)**: `#688097` -- Steel Blue. 중립.

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
| Step Title | Pretendard | 28px | 700 | 1.30 | `#dde1e5` | 각 스텝 진입 시 |
| Section Title | Pretendard | 22px | 600 | 1.36 | `#dde1e5` | 결과 섹션 제목 |
| Character Speech | Gaegu | 20px | 400 | 1.60 | `#dde1e5` | 캐릭터 말풍선 |
| Body | Pretendard | 16px | 400 | 1.65 | `#dde1e5` | 해석 본문 |
| Body Accent | Pretendard | 16px | 500 | 1.65 | `#f0dfad` | 본문 내 강조 |
| Body Cool | Pretendard | 16px | 400 | 1.65 | `#a1c5ac` | 보조 정보, 팁 |
| Body Small | Pretendard | 14px | 400 | 1.57 | `#a1c5ac` | 보조 설명 |
| Caption | Pretendard | 13px | 400 | 1.54 | `#688097` | 출처, 부가 정보 |
| Label | Pretendard | 12px | 600 | 1.50 | `#dde1e5` | 라벨, 배지 |

### Principles
- **본문은 Pretendard**: 해석 텍스트는 가독성 최우선. 손글씨체로 긴 글 금지.
- **캐릭터만 Gaegu**: 캐릭터 말풍선, 짧은 감탄사, 전환 멘트에만 사용.
- **line-height 넉넉하게**: 다크 배경에서 텍스트 밀도가 높으면 답답함. 1.6 이상 유지.
- **본문 색상은 Light Gray Blue**: `#dde1e5`가 기본 텍스트. 순백 사용 금지 (6색 외).

## 4. Component Stylings

### Page Container (상세페이지형)
- 배경: Dark Navy (#3e4857) 고정 + silverlining.jpg (ZONE C에서 점진 노출)
- 콘텐츠: `max-width: 440px`, `mx-auto`, 수직 스크롤
- 별빛 파티클: `#dde1e5` opacity 변형, `position: fixed` 배경 레이어
- PC에서도 440px 고정 — 모바일과 동일한 경험

### Character Portrait (포트레이트 모드)

RPG 대화창에서 캐릭터를 **포트레이트(얼굴/상반신 크롭)**로 표시한다.
원본 SVG 전체가 아닌 상단 60% 영역만 잘라서 사용.

- 크기: 48px(sm), 80px(md), 120px(lg)
- 크롭: `object-fit: cover`, `object-position: top center` (상단 60% 사용)
- border-radius: 12px
- 테두리: 2px `rgba(221, 225, 229, 0.3)` -- Light Gray Blue 30%
- 그림자: `0 0 12px rgba(221, 225, 229, 0.15)` -- 은은한 글로우
- **표정 전환**: crossfade 0.15s (framer-motion `AnimatePresence`)
- **대화창 내 기본 크기**: 80×80px

> 참고: 멀티레이어 애니메이션(B안)은 폐기. SVG가 래스터(PNG-in-SVG) 구조라
> 부위별 벡터 애니메이션이 불가하여, 포트레이트 표정 교체 방식으로 전환했다.

### DialogueBox (RPG 대화창) — ★ 핵심 컴포넌트

턴제 RPG 스타일의 텍스트 윈도우. 서비스 전체의 캐릭터 발화에 사용.
파랜드택틱스/영웅전설 UI 참조.

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

- **배경**: `rgba(62, 72, 87, 0.92)` + `backdrop-filter: blur(12px)`
- **테두리**: 1px `rgba(104, 128, 151, 0.4)` -- Steel Blue 40%
- **border-radius**: 16px
- **포트레이트**: 좌측 80×80px, Portrait 컴포넌트 사용
- **화자 이름**: 포트레이트 우측 상단, 12px weight 600, `#f0dfad` (Cream Yellow)
- **대사 본문**: Gaegu 18px, `#dde1e5`, line-height 1.65
  - `emphasis` → 텍스트 `#f0dfad`, 20px
  - `whisper` → 텍스트 opacity 0.6, 16px
  - `system` → 포트레이트 숨김, 중앙 정렬, Pretendard 14px
- **타이핑**: 글자 단위 순차, 35ms/글자. 문장부호(`.`,`,`,`?`,`!`) 뒤 180ms 추가 딜레이
- **탭 동작**: 타이핑 중 → 스킵(전체 표시), 완료 후 → 다음 대사
- **▼ 표시기**: 타이핑 완료 후 우하단, `#dde1e5` 삼각형, 0.8s opacity 블링크
- **패딩**: 16px
- **최대 높이**: 화면 높이의 35% (넘치면 내부 스크롤)

### ChoicePanel (선택지 패널)

대화 시퀀스 중간에 사용자 선택을 받는 패널. 대화창 위에 등장.

- 위치: 대화창 바로 위, 세로 배치
- 각 버튼 풀너비, 간격 8px
- `primary`: `#dde1e5` 배경, `#3e4857` 텍스트, 글로우 `0 0 16px rgba(221,225,229,0.3)`
- `secondary`: `rgba(104, 128, 151, 0.25)` 배경, `#dde1e5` 텍스트
- border-radius: 16px
- 등장: slide-up 0.3s + fade-in

### DotCharacter (도트 캐릭터 배경 연출)

ZONE A 대화 진행 중 배경에서 걸어다니는 작은 도트 캐릭터.
대화 내용과 무관한 시각적 생동감 요소.

- **위치**: StarField 위(z-1), 대화창 아래(z-10). `pointer-events: none`
- **크기**: 32×32px (스프라이트), 16~24px (CSS 대안)
- **이동**: 440px 컨테이너 좌→우→좌 왕복, 12초 주기
- **방향 전환**: 50% 지점에서 `scaleX(-1)` 좌우 반전
- **개수**: 1~2개 (산만하지 않게)
- **걷기 애니메이션**: 스프라이트 시트 4프레임, `steps(4) 0.6s infinite`
- **렌더링**: `image-rendering: pixelated` (도트 선명)
- **MVP 대안**: 스프라이트 에셋 없을 때 CSS div 조합으로 단순 실루엣
  - 머리: `#f0dfad` (Cream Yellow), 몸: `#688097` (Steel Blue)
  - 다리: 2프레임 `steps(2)` 교차 애니메이션

### DialogueInput (대화형 인라인 입력)

RPG 대화 흐름 안에서 유저 정보를 수집하는 입력 위젯.
대화창 바로 위에 등장. 폼 모달 대신 대화에 녹아드는 입력 경험.

- **위치**: 대화창(DialogueBox) 바로 위, `position: fixed`, `bottom: 대화창 높이 + 8px`
- **배경**: `rgba(62, 72, 87, 0.92)` + `backdrop-filter: blur(12px)` (대화창과 동일)
- **테두리**: 1px `rgba(104, 128, 151, 0.4)`
- **border-radius**: 16px
- **등장**: slide-up 0.2s + fade-in
- **텍스트 입력 필드**: DESIGN-ALT2.md §4 Input Fields 준수
- **버튼형 선택지**: ChoicePanel과 동일 스타일
- **건너뛰기 버튼**: secondary 스타일 (반투명 배경 + `#688097` 텍스트)
- **12지시 그리드**: 3열 배치, 각 셀 최소 높이 40px, border-radius 12px
  - 기본: `rgba(104, 128, 151, 0.15)` 배경
  - 선택 시: `#dde1e5` 배경 + `#3e4857` 텍스트
  - 셀 내 오행 아이콘 16px 좌측 배치 (선택적)
- **날짜 셀렉터**: 년/월/일 3개 드롭다운 가로 배치, 각 flex-1

### InlineDialogue (결과 내 인라인 대화창)

ZONE B 스크롤 중간에 삽입되는 대화창. DialogueBox와 동일한 비주얼이지만
**인라인(스크롤 흐름 안)**으로 배치된다.

- `position: static` (인라인), 풀너비
- 비주얼: DialogueBox와 동일 (배경, 테두리, 포트레이트, 타이핑)
- 최대 높이 제한 없음 (긴 텍스트 허용)
- Intersection Observer로 뷰포트 진입 시 자동 타이핑 시작
- 상하 margin: 24px

### CTA Button (Primary)
- 배경: `#dde1e5` (Light Gray Blue)
- 텍스트: `#3e4857` (Dark Navy), 16px weight 600
- Radius: 20px
- 패딩: 14px 28px
- 그림자: `0 0 16px rgba(221, 225, 229, 0.3)` -- 은은한 글로우
- 호버: 글로우 확장 (`0 0 24px rgba(221, 225, 229, 0.4)`)
- width: 100% (모바일 풀너비)

### Secondary Button
- 배경: transparent
- 테두리: 1px `rgba(221, 225, 229, 0.4)` -- Light Gray Blue 40%
- 텍스트: `#dde1e5`, 14px weight 500
- Radius: 20px

### Accent Button (강조 액션)
- 배경: `#e9b8b7` (Soft Pink)
- 텍스트: `#dde1e5` (Light Gray Blue), 16px weight 600
- Radius: 20px
- 용도: "결과 보기", "분석 시작" 등 핵심 전환 액션

### Input Fields
- 배경: `rgba(104, 128, 151, 0.12)` -- Steel Blue 12%
- 테두리: 1px `rgba(104, 128, 151, 0.30)` -- Steel Blue 30%
- 포커스: 테두리 `#f0dfad` (Cream Yellow)
- 텍스트: `#dde1e5`
- 플레이스홀더: `#688097`
- Radius: 16px

### Select / Dropdown
- 배경: `rgba(104, 128, 151, 0.12)` -- Steel Blue 12%
- 테두리: 1px `rgba(104, 128, 151, 0.30)` -- Steel Blue 30%
- 옵션 패널: `#3e4857` solid + `rgba(104, 128, 151, 0.30)` 보더
- 선택된 옵션: `rgba(221, 225, 229, 0.15)` 배경
- Radius: 16px

### Result Card (해석 결과 섹션)
- 배경: `rgba(104, 128, 151, 0.15)` -- Steel Blue 15%
- 테두리: 1px `rgba(104, 128, 151, 0.25)` -- Steel Blue 25%
- Radius: 20px
- 패딩: 24px
- 제목: `#dde1e5`, 18px weight 600
- backdrop-filter: `blur(8px)` -- 글래스모피즘
- 등장 애니메이션: 아래에서 위로 슬라이드 + 페이드인 (0.4s ease-out)

### Pillar Card (사주 기둥)
- 배경: `rgba(104, 128, 151, 0.10)` -- Steel Blue 10%
- Radius: 16px
- 천간/지지 글자: 28px weight 700
- 십성 라벨: 12px weight 600, `#dde1e5`

### Progress Indicator
- 스텝 도트: 8px 원형, 현재=`#dde1e5`, 나머지=`rgba(104, 128, 151, 0.40)`
- 전환: scale 1.0 → 1.3 + 색상 변경, 0.3s
- 위치: 화면 상단 중앙, 패딩 16px

### Loading Spinner
- 색상: `#dde1e5` (Light Gray Blue)
- 트레일: `rgba(221, 225, 229, 0.2)`
- 캐릭터 대사와 함께 표시: "잠시만 기다려주세요~"

## 5. Layout Principles

### Spacing System
- Base unit: 8px
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
- 수평 패딩: 24px (alt1의 16px보다 넓게 -- 여유로운 밤 느낌)
- 섹션 간격: 32px (결과 카드 사이)
- 말풍선 간격: 16px (연속 말풍선)

### 전체 페이지 레이아웃 (상세페이지형)

```
┌──────────── 440px ────────────┐
│ [BG: #3e4857 + StarField]     │
│                                │
│ ZONE A: RPG 대화 시퀀스 (풀스크린) │
│ ┌────────────────────────────┐│
│ │ [StarField 배경]            ││
│ │                             ││
│ │ (탭 진행 RPG 대화)          ││
│ │ ┌────────────────────────┐ ││
│ │ │[포트레이트] 안내자       │ ││
│ │ │  대사 텍스트...       ▼ │ ││ ← 하단 고정
│ │ └────────────────────────┘ ││
│ │ [선택지: 사주보기 / 더보기] ││
│ └────────────────────────────┘│
│                                │
│ ── 팝업 모달 (입력) ──         │ ← createPortal
│                                │
│ ── 픽셀 줌 트랜지션 ──         │ ← scale(20) → 암전 → 로딩 → scale(1)
│                                │
│ ZONE B: 무료 결과              │
│ ┌────────────────────────────┐│
│ │⑤ 조견표 (한자+음차+십성    ││
│ │   +지장간+합충형해파)       ││
│ │⑥ 신살                      ││
│ │⑦ 대운 (가로스크롤)         ││
│ │⑧ 세운 (올해/내년)          ││
│ │── 구분선 (star icon) ──    ││
│ │⑨ 오행 상관관계 (고정이미지) ││
│ │⑩ 오행 펜타곤 차트           ││
│ │⑪ 캐릭터 쉬운말 해설         ││
│ │── 구분선 (stamp icon) ──   ││
│ │⑪-b 궁합 유도 (doin 캐릭터) ││
│ │   [2인 궁합] [3인 궁합]    ││
│ └────────────────────────────┘│
│                                │
│ [BG: silverlining.jpg 점진노출]│
│ ZONE C: 과금 유도              │
│ ┌────────────────────────────┐│
│ │⑫ angel/devil 인라인 대화창  ││
│ │   블러 미리보기 (격국/용신)  ││
│ │⑬ CTA 버튼                  ││
│ └────────────────────────────┘│
│                                │
│ ⑭ 푸터                        │
└────────────────────────────────┘
```

### 팝업 모달 레이아웃

```
┌─── 오버레이 (전체화면) ───┐
│ rgba(62,72,87,0.85)        │
│ backdrop-filter: blur(8px) │
│                            │
│  ┌── 모달 (400px) ──────┐ │
│  │ [X] 닫기              │ │
│  │                       │ │
│  │ [양력|음력] 토글       │ │
│  │ [윤달] (음력 시)       │ │
│  │ [생년월일]             │ │
│  │ [출생시각]             │ │
│  │ [남성|여성]            │ │
│  │ [출생지]               │ │
│  │                       │ │
│  │ [=== 분석 시작 ===]   │ │
│  └───────────────────────┘ │
└────────────────────────────┘
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

### 픽셀 줌 트랜지션 (ZONE A → ZONE B) — ★ 핵심 연출

RPG 전투 진입 느낌의 장면 전환. CSS `transform: scale()` GPU 가속 활용.

**시퀀스:**
```
idle → zoom-out (0.4s) → loading (≥0.5s) → zoom-in (0.4s) → done
```

**Phase 1: zoom-out** (ZONE A 화면이 확대되며 픽셀화 + 암전)
```css
.zone-zoom-out {
  transform: scale(20);
  transition: transform 0.4s cubic-bezier(0.4, 0, 1, 1);
  transform-origin: center center;
  overflow: hidden;
}
```
- 동시에 검은 오버레이(`#3e4857`) opacity 0 → 1

**Phase 2: loading** (암전 배경 + magician 포트레이트 + 로딩 메시지)
- 최소 0.5초 보장 (API 응답 대기 겸용)
- DialogueBox와 동일 스타일 대화창으로 표시
- 도트 로딩 애니메이션 (3개 원, 순차 bounce)

**Phase 3: zoom-in** (ZONE B가 픽셀에서 선명해지며 등장)
```css
.zone-zoom-in {
  transform: scale(1);
  transition: transform 0.4s cubic-bezier(0, 0, 0.2, 1);
  transform-origin: center center;
}
```
- 동시에 오버레이 opacity 1 → 0

**오버레이:**
```css
.zone-overlay {
  position: fixed;
  inset: 0;
  background: #3e4857;
  transition: opacity 0.4s;
  z-index: 50;
}
```

### 일반 전환 (Page Transitions)
- 페이드아웃(0.2s) → 페이드인(0.3s) + 약간 위로 슬라이드(20px)
- Framer Motion `AnimatePresence` mode="wait"
- 이징: `ease-out` (등장), `ease-in` (퇴장)

### 타이핑 효과 (RPG 대화창)
- 글자 단위 순차 표시
- 속도: 35ms/글자 (한글 기준)
- 문장부호(`.` `,` `?` `!`) 뒤: 180ms 추가 딜레이 (리듬감)
- 커서: `#dde1e5` 색상 블링크 (타이핑 중에만)
- 탭으로 스킵 가능 (전체 텍스트 즉시 표시)
- 타이핑 완료 후 ▼ 표시기 등장 (0.8s 블링크)

### 카드 등장 (Result Cards)
- 스크롤 진입 시 트리거 (Intersection Observer)
- `opacity: 0, translateY: 24px` → `opacity: 1, translateY: 0`
- duration: 0.4s, easing: `ease-out`
- 연속 카드: 0.1s stagger (순차 등장)

### 별빛 파티클 (Background Stars)
- CSS keyframes로 구현 (JS 파티클 라이브러리 불필요)
- 색상: `#dde1e5` (Light Gray Blue) -- 6색 내
- 작은 원(2-4px) 20-30개, 무작위 위치
- 깜빡임: `opacity 0.2 → 0.8 → 0.2`, 2-5초 주기 (각각 랜덤)
- 성능: `will-change: opacity`, GPU 가속

### 캐릭터 포트레이트 전환
- 표정 전환: crossfade 0.15s (framer-motion `AnimatePresence`)
- 대화창 등장 시: 포트레이트 약간 scale(0.9→1) + fade-in 0.2s
- 인라인 대화창: Intersection Observer 진입 시 동일 등장 효과

### 금지 애니메이션
- 네온 글로우 펄스 (우울/사이버펑크 느낌)
- 과도한 패럴랙스 (멀미 유발)
- 3D 회전/플립 (동양적 분위기 깨짐)
- 300ms 이상 지연 (답답함)

## 7. Do's and Don'ts

### Do
- 6색 팔레트를 UI 뼈대에 엄격히 준수 (opacity 변형만 허용)
- 다크 네이비 배경에 라이트 그레이블루/크림 옐로 악센트로 달빛 밤 분위기 유지
- 캐릭터를 모든 안내 텍스트의 화자로 사용 (UI가 직접 말하지 않음)
- 둥근 모서리(16-20px)로 부드럽고 폭신한 느낌 유지
- 별빛은 `#dde1e5`로만, 은은하게, 장식이 아닌 배경으로
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
| Desktop | >768px | 중앙 440px 컨테이너, 양쪽 다크 네이비 배경 + 별빛 확장 |

### Mobile First
- alt2는 모바일 전용 설계. 데스크톱은 모바일 레이아웃을 중앙 배치.
- 데스크톱에서 양쪽 여백은 다크 네이비 배경 + 추가 별빛 파티클로 채움.
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
배경:       #3e4857  (Dark Navy)         RGB(62, 72, 87)
보조/뮤트:  #688097  (Steel Blue)        RGB(104, 128, 151)
1차 악센트: #dde1e5  (Light Gray Blue)   RGB(221, 225, 229)
강조 포인트: #e9b8b7  (Soft Pink)        RGB(233, 184, 183)
2차 악센트: #f0dfad  (Cream Yellow)      RGB(240, 223, 173)
쿨 대비:    #a1c5ac  (Sage Green)        RGB(161, 197, 172)
```

### Surface 파생 (opacity 변형)
```
카드 배경:     rgba(104, 128, 151, 0.15)   -- Steel Blue 15%
카드 테두리:   rgba(104, 128, 151, 0.25)   -- Steel Blue 25%
말풍선 배경:   rgba(240, 223, 173, 0.15)  -- Cream Yellow 15%
말풍선 테두리: rgba(240, 223, 173, 0.30)  -- Cream Yellow 30%
입력 배경:     rgba(104, 128, 151, 0.12)   -- Steel Blue 12%
CTA 글로우:    rgba(221, 225, 229, 0.30)  -- Light Gray Blue 30%
별빛:          rgba(221, 225, 229, 0.2~0.8) -- Light Gray Blue 깜빡임
```

### Example Component Prompts
- "Create RPG dialogue box: rgba(62,72,87,0.92) bg, backdrop-blur(12px), 1px rgba(104,128,151,0.4) border, 16px radius. Left: 80x80 portrait (object-fit: cover, object-position: top center, 12px radius). Top-right of portrait: speaker name in #f0dfad 12px weight 600. Body: Gaegu 18px #dde1e5, line-height 1.65, typing animation 35ms/char. Bottom-right: blinking ▼ indicator after typing complete."
- "Build a saju pillar card: rgba(104,128,151,0.10) bg, 16px radius, backdrop-blur(8px). Top: 12px label in #dde1e5. Center: 28px bold hanja character. Element colors are independent of the 6-color palette."
- "Design result section: rgba(104,128,151,0.15) bg, 20px radius, backdrop-blur(8px), 1px rgba(104,128,151,0.25) border. Title in #dde1e5 18px weight 600. Body in #dde1e5 16px Pretendard line-height 1.65. Enter animation: slide up 24px + fade in 0.4s."
- "Create pixel zoom transition: ZONE A content scales from 1 to 20 via CSS transform over 0.4s (cubic-bezier 0.4,0,1,1). Simultaneously, #3e4857 overlay fades opacity 0→1. Then loading screen with magician portrait + DialogueBox style message. Then ZONE B content scales 20→1 over 0.4s (cubic-bezier 0,0,0.2,1) as overlay fades 1→0."

### Iteration Guide
1. UI 뼈대는 6색만 사용 -- 새 색상 추가 시 반드시 거부하고 기존 6색에서 대안 찾기
2. 오행 등 콘텐츠 고유 색상은 자유 -- 6색 제한 밖
3. Light Gray Blue(`#dde1e5`)가 THE accent -- CTA, 제목, 본문, 강조 모두 이 색
4. 캐릭터 말풍선은 Cream Yellow 틴트, 본문 카드는 Steel Blue 틴트
5. 20px가 THE border-radius -- 버튼, 카드, 말풍선 모두 20px
6. 글래스모피즘: `rgba + backdrop-blur` 조합, 불투명 카드 금지
7. 모든 안내 텍스트는 캐릭터 화법으로 ("~해볼까요?", "~이랍니다")

---

## 10. Tailwind / CSS Variables

```css
@layer base {
  :root {
    /* alt2 마스터 팔레트 (6색 한정 -- UI 뼈대) */
    --alt2-dark-navy: #3e4857;
    --alt2-steel-blue: #688097;
    --alt2-light-gray-blue: #dde1e5;
    --alt2-soft-pink: #e9b8b7;
    --alt2-cream-yellow: #f0dfad;
    --alt2-sage-green: #a1c5ac;

    /* HSL 변환 (Tailwind 호환) */
    --alt2-bg: 216 17% 29%;
    --alt2-muted: 209 18% 50%;
    --alt2-primary: 210 13% 88%;
    --alt2-accent-strong: 1 53% 82%;
    --alt2-accent-warm: 45 69% 81%;
    --alt2-accent-cool: 138 24% 70%;

    /* Semantic 매핑 */
    --alt2-foreground: 210 13% 88%;           /* Light Gray Blue -- 기본 텍스트 */
    --alt2-foreground-secondary: 138 24% 70%; /* Sage Green -- 보조 텍스트 */
    --alt2-foreground-muted: 209 18% 50%;     /* Steel Blue -- 뮤트 텍스트 */

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
