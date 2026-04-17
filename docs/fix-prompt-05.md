# fix-prompt-05: Zone B 배경 가독성 + 브랜딩

> 이 문서는 Claude Code에 전달할 구현 프롬프트다.
> 아래 수정사항을 **순서대로, 빠짐없이** 적용하라.

---

## 양피지 카드 타이포그래피 규칙 (전체 적용)

양피지 카드(ParchmentCard) 내부의 텍스트 위계:

| 레벨 | 용도 | 폰트 | 굵기 | 사이즈 | 색상 |
|---|---|---|---|---|---|
| Title | 카드 제목 ("사주 원국 해설") | Noto Sans KR | Bold (700) | 15px | #4a3728 |
| Subtitle | 단락 소제목 ("천간과 지지") | Noto Sans KR | Bold (700) | 13px | #4a3728 |
| Body | 본문 텍스트 | Pretendard | Regular (400) | 13px | #3a2e1e |

- Noto Sans KR은 Google Fonts에서 로드 필요. `app/layout.tsx` 또는 `<head>`에 추가:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&display=swap" rel="stylesheet">
  ```
  > 700 weight만 로드하면 된다 (Title, Subtitle용). Body는 Pretendard 사용.

- 양피지 해설 텍스트(JSON)에서 **서브타이틀은 `\n\n##` 접두사로 구분**한다. ParchmentCard 렌더링 시 `##`로 시작하는 줄은 Subtitle 스타일로, 나머지는 Body 스타일로 처리:

```tsx
// ParchmentCard 내부에서 children이 string일 때 파싱
{typeof children === 'string' ? (
  children.split('\n\n').map((block, i) => {
    if (block.startsWith('##')) {
      return (
        <div key={i} style={{
          fontSize: 13,
          fontWeight: 700,
          fontFamily: '"Noto Sans KR", sans-serif',
          color: '#4a3728',
          marginTop: i > 0 ? 12 : 0,
          marginBottom: 4,
        }}>
          {block.replace(/^##\s*/, '')}
        </div>
      );
    }
    return (
      <p key={i} style={{
        fontSize: 13,
        lineHeight: 1.75,
        fontFamily: '"Pretendard Variable", "Pretendard", sans-serif',
        fontWeight: 400,
        color: '#3a2e1e',
        marginTop: i > 0 ? 8 : 0,
        marginBottom: 0,
      }}>
        {block}
      </p>
    );
  })
) : children}
```

---

## 수정 1: Zone B 불투명 배경 패널

### 문제
Zone B 결과 컴포넌트들이 반투명 배경(rgba 0.10~0.15)을 사용하고 있어 뒤의 StarField/배경 이미지가 비쳐서 텍스트 가독성이 떨어진다.

### 파일: `app/alt2/page.tsx`

Zone B 전체를 감싸는 불투명 배경을 추가한다. 개별 컴포넌트는 건드리지 않는다.

```tsx
{/* ZONE B + C: Results */}
{phase === 'result' && engine && core && (
  <div className="relative" style={{ zIndex: 10 }}>
    {/* 불투명 배경 패널 */}
    <div style={{ background: '#2d3440', minHeight: '100vh' }}>
      <div className="max-w-[440px] mx-auto pt-8 pb-16 space-y-8"
        style={{ paddingLeft: 38, paddingRight: 38 }}
      >
        {/* 기존 컴포넌트들 전부 그대로 유지 */}
      </div>
    </div>
  </div>
)}
```

> `#2d3440`은 기존 `#3e4857`보다 약간 어두운 톤으로, 반투명 카드들이 위에 올라갔을 때 충분한 대비를 제공한다. 원하면 `#3e4857` 그대로 써도 된다.

---

## 수정 2: 브랜드 워터마크 (푸터)

### 파일: `app/alt2/page.tsx`

기존 푸터를 브랜드 워터마크가 포함된 형태로 교체:

```tsx
{/* Footer */}
<footer className="text-center pt-8 pb-16">
  <img
    src="/icon/logo.svg"
    alt="제3의시간"
    style={{
      width: 120,
      opacity: 0.3,
      margin: '0 auto 12px',
      display: 'block',
    }}
  />
  <p className="text-xs" style={{ color: '#688097' }}>
    시간의 마법사 복길이 분석한 사주팔자입니다
  </p>
  <button
    onClick={handleReset}
    className="mt-4 px-6 py-2.5 text-sm font-medium"
    style={{
      borderRadius: 20,
      border: '1px solid rgba(221, 225, 229, 0.4)',
      color: '#dde1e5',
      backgroundColor: 'transparent',
    }}
  >
    다른 사주 분석하기
  </button>
</footer>
```

> 로고 에셋: `/public/icon/logo.svg` (흰색 "제3의시간" 텍스트, 투명 배경). `opacity: 0.3`으로 워터마크 수준의 존재감.

---

## 수정 3: 궁합 업셀 플로우 재설계

### 개요
개인 분석 결과가 끝난 시점에서, 복길이 대화 형태로 궁합 분석을 소개하고 업셀링으로 유도한다. 기존 `GunghamTeaser` 컴포넌트를 대화형 업셀 플로우로 교체한다.

### 플로우

```
[개인 분석 결과 끝]
     ↓
복길 대사: 궁합 소개
  "자네의 사주를 읽었으니, 이제 다른 사람과의 관계도 들여다볼 수 있네."
  "최대 3명의 관계까지 살펴볼 수 있지."
  "연애, 친구, 직장 상사, 경쟁 상대... 어떤 관계든 상관없어."
     ↓
선택지: "궁합을 알아보겠다" / "괜찮습니다"
     ↓ (궁합 선택 시)
인원 선택: 2인 궁합 / 3인 궁합
     ↓
금액 표시 + 결제 CTA
  (예: 2인 ₩X,XXX / 3인 ₩X,XXX)
     ↓ (결제 완료)
상대방 사주 입력 (Zone A와 동일한 대화형 입력)
     ↓
궁합 분석 결과 표시
```

### 파일 변경

#### 1. 기존 GunghamTeaser 교체 → GunghamUpsell

기존 `app/alt2/components/gungham/GunghamTeaser.tsx`를 `GunghamUpsell.tsx`로 교체하거나, 내부 구조를 변경한다.

**GunghamUpsell 컴포넌트 구조:**

```tsx
'use client';

import { useState } from 'react';
import InlineDialogue from '../result/InlineDialogue';
import ChoicePanel from '../dialogue/ChoicePanel';
import CtaButton from '../upsell/CtaButton';

type GunghamStep = 'intro' | 'select_count' | 'offer' | 'declined';

interface GunghamUpsellProps {
  onPurchase?: (count: 2 | 3) => void;
}

const PRICES = {
  2: '₩9,900',
  3: '₩14,900',
};

export default function GunghamUpsell({ onPurchase }: GunghamUpsellProps) {
  const [step, setStep] = useState<GunghamStep>('intro');
  const [personCount, setPersonCount] = useState<2 | 3>(2);

  // ... 각 step별 렌더링
}
```

#### 2. 각 단계별 UI

**step: 'intro'** — 복길의 궁합 소개 대사 (InlineDialogue)

```json
[
  {
    "character": "magician",
    "name": "복길",
    "text": "자네의 사주를 읽었으니,\n이제 다른 이와의 관계도\n들여다볼 수 있네.",
    "style": "normal"
  },
  {
    "character": "speak",
    "text": "최대 세 사람의 관계까지\n살펴볼 수 있지.",
    "style": "normal"
  },
  {
    "character": "excite",
    "text": "연인, 친구, 직장 상사,\n경쟁 상대...\n어떤 관계든 상관없어.",
    "style": "normal"
  }
]
```

대사 완료 후 선택지 표시:
```
[ 궁합을 알아보겠다 ]  (primary)
[ 괜찮습니다 ]          (secondary)
```

**step: 'select_count'** — 인원 선택

```
[ 2인 궁합 — 한 사람과의 관계 ]   (primary)
[ 3인 궁합 — 두 사람과의 관계 ]   (secondary)
```

**step: 'offer'** — 금액 표시 + 결제 버튼

복길 대사:
- 2인: "둘 사이의 인연을 읽어보겠네."
- 3인: "세 사람의 얽힌 인연, 흥미롭군."

그 아래 CtaButton:
```tsx
<CtaButton
  label={`${personCount}인 궁합 분석`}
  price={PRICES[personCount]}
  onClick={() => onPurchase?.(personCount)}
/>
```

**step: 'declined'** — 거절 시

복길 대사:
```json
{
  "character": "doin",
  "text": "언제든 마음이 바뀌면\n다시 찾아오게.",
  "style": "normal"
}
```

#### 3. page.tsx에서 GunghamTeaser → GunghamUpsell 교체

```tsx
// 기존
import GunghamTeaser from './components/gungham/GunghamTeaser';
// 변경
import GunghamUpsell from './components/gungham/GunghamUpsell';

// 기존 렌더링
<GunghamTeaser onSelect={(mode) => { ... }} />
// 변경
<GunghamUpsell onPurchase={(count) => {
  // TODO: 결제 처리 후 궁합 입력 화면으로 전환
  alert(`${count}인 궁합 결제 기능은 준비 중입니다`);
}} />
```

#### 4. 기존 UpsellDialogue + CtaButton (Zone C) 관계

현재 Zone C에 있는 `UpsellDialogue`와 `CtaButton`은 **개인 분석 심층 해석 업셀**용이다. 궁합 업셀(GunghamUpsell)과는 별개의 상품이므로 **둘 다 유지**한다.

Zone B 하단 배치 순서:
```
... (개인 분석 결과들) ...
SectionDivider
GunghamUpsell         ← 궁합 업셀 (수정 3)
SectionDivider
UpsellDialogue        ← 심층 해석 업셀 (기존)
CtaButton             ← 심층 해석 결제 (기존)
푸터 (워터마크)       ← 수정 2
```

---

## 수정 4: 신살을 PillarTable에 통합 + SinsalRow 제거

### 파일: `app/alt2/components/result/PillarTable.tsx`

PillarTable 하단에 신살 행을 추가한다. 각 주(년/월/일/시)에 해당하는 신살을 표시.

신살 데이터는 기존 `engine.sinsal` 배열에서 가져온다. 각 신살 항목에 어느 주에 해당하는지 정보가 있으므로 이를 주별로 매핑:

```tsx
// PillarTable props에 sinsalList 추가
interface PillarTableProps {
  pillars: any;
  tenGods: any;
  jijanggan: any;
  relations: any[];
  sinsalList?: any[];  // 추가
}
```

테이블 마지막 행으로 신살 표시:
```
신살    역마    -    천을귀인    화개
```

신살이 없는 주는 `-` 표시. 한 주에 여러 신살이 있으면 줄바꿈으로 나열.

### 파일: `app/alt2/page.tsx`

- PillarTable에 `sinsalList` prop 전달
- `<SinsalRow>` 컴포넌트 렌더링 제거
- SinsalRow import 제거

---

## 수정 5: 양피지 해설 카드 컴포넌트 (ParchmentCard)

### 새 파일: `app/alt2/components/base/ParchmentCard.tsx`

모든 분석 섹션에 동일하게 사용되는 상세 해설 카드.

```tsx
'use client';

interface ParchmentCardProps {
  title: string;
  children: React.ReactNode;
}

export default function ParchmentCard({ title, children }: ParchmentCardProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #d4c4a0 0%, #c9b88c 30%, #d6c69a 70%, #cabb8a 100%)',
        border: '2px solid #8b7355',
        padding: '16px 18px',
        position: 'relative',
        boxShadow: 'inset 0 0 20px rgba(100, 80, 50, 0.15), 0 2px 8px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* 제목 — Title 레벨 */}
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          fontFamily: '"Noto Sans KR", sans-serif',
          color: '#4a3728',
          marginBottom: 10,
          borderBottom: '1px solid rgba(139, 115, 85, 0.4)',
          paddingBottom: 6,
        }}
      >
        📜 {title}
      </div>

      {/* 본문 영역 — Body 레벨 */}
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.75,
          color: '#3a2e1e',
          whiteSpace: 'pre-wrap',
          fontFamily: '"Pretendard Variable", "Pretendard", sans-serif',
          fontWeight: 400,
        }}
      >
        {children}
      </div>
    </div>
  );
}
```

### 스타일 설명
- 배경: 베이지/탄 그라데이션 (양피지 느낌)
- 테두리: `#8b7355` (갈색, 기둥 프레임 색상 계열)
- 내부 그림자: 가장자리가 살짝 어두움 (오래된 종이)
- 텍스트: 짙은 갈색 `#3a2e1e` (양피지 위 잉크)
- 직각 모서리 (RPG 톤 유지, border-radius 없음)

---

## 수정 6: 각 섹션별 해설 텍스트 배치

### 파일: `public/content/dialogue-result-comments.json`

기존 구조에 양피지 카드용 해설 텍스트를 추가한다. 새 키:

```json
{
  "sections": {
    "after_pillar_table": [ ... ],
    "after_seun": [ ... ],
    "after_oheng": [ ... ],
    "free_section_end": [ ... ],

    "parchment_pillar": "사주 원국은 태어난 연·월·일·시를 각각 하나의 기둥으로 세운 것입니다.\n\n## 천간과 지지\n천간(天干)은 하늘의 기운으로, 자신이 세상에 드러내는 성향을 나타냅니다. 지지(地支)는 땅의 기운으로, 내면에 품고 있는 잠재력과 환경을 뜻합니다.\n\n## 십성의 의미\n십성(十星)은 일간(나)을 기준으로 다른 글자와의 관계를 보여줍니다. 비견·겁재는 나와 같은 기운, 식신·상관은 내가 낳는 기운, 편재·정재는 내가 다스리는 기운, 편관·정관은 나를 다스리는 기운, 편인·정인은 나를 낳는 기운입니다.\n\n## 지장간\n지장간(支藏干)은 지지 속에 감춰진 천간의 기운입니다. 겉으로 보이지 않지만 실제 운의 흐름에 깊이 관여합니다.\n\n## 신살\n신살(神殺)은 특정 기둥 조합에서 나타나는 특별한 기운입니다. 길신(吉神)은 유리한 흐름을, 흉신(凶神)은 주의할 흐름을 알려줍니다.",

    "parchment_daeun": "대운(大運)은 10년 단위로 바뀌는 큰 운의 흐름입니다.\n\n## 대운의 산출\n월주(월간·월지)를 기준으로 순행 또는 역행하며, 성별과 연간의 음양에 따라 방향이 정해집니다.\n\n## 전반과 후반\n대운의 천간은 전반 5년, 지지는 후반 5년에 더 강하게 작용한다고 봅니다. 현재 대운이 용신(用神)과 맞으면 순조로운 시기, 기신(忌神)과 만나면 조심해야 할 시기입니다.",

    "parchment_seun": "세운(歲運)은 매년 바뀌는 한 해의 운입니다.\n\n## 세운의 작용\n그해의 연주(천간+지지)가 본인의 사주 원국과 어떤 관계를 맺는지에 따라 한 해의 흐름이 결정됩니다.\n\n## 대운과의 관계\n대운이 큰 강물이라면, 세운은 그 위를 흐르는 물결과 같습니다. 대운이 좋더라도 세운이 나쁘면 잠시 어려울 수 있고, 대운이 어렵더라도 세운이 좋으면 기회가 찾아올 수 있습니다.",

    "parchment_oheng": "오행(五行)은 목·화·토·금·수 다섯 가지 기운의 균형입니다.\n\n## 오행의 분포\n사주 원국에서 각 오행이 얼마나 분포되어 있는지를 보면, 어떤 기운이 넘치고 어떤 기운이 부족한지 알 수 있습니다.\n\n## 상생과 상극\n상생(相生) 관계는 서로 도와주는 흐름이고, 상극(相剋) 관계는 서로 견제하는 흐름입니다. 오행이 고르게 분포된 사주는 안정적이고, 한쪽으로 치우친 사주는 그 기운의 특성이 강하게 드러납니다.\n\n## 신강과 신약\n신강(身强)은 일간의 힘이 강한 상태, 신약(身弱)은 일간의 힘이 약한 상태를 말합니다. 이에 따라 용신(用神)이 결정되며, 용신은 사주의 균형을 맞추는 핵심 기운입니다."
  }
}
```

### 파일: `app/alt2/page.tsx`

각 컴포넌트 뒤에 InlineDialogue + ParchmentCard를 배치:

```tsx
import ParchmentCard from './components/base/ParchmentCard';

// ... resultComments에서 parchment 텍스트도 함께 로드 ...

{/* ① PillarTable (신살 통합) */}
<PillarTable
  pillars={engine.pillars}
  tenGods={engine.tenGods}
  jijanggan={engine.jijanggan}
  relations={relationsArr}
  sinsalList={sinsalList}
/>

{/* 복길 코멘트 + core.summary */}
<InlineDialogue
  lines={[
    ...(resultComments?.after_pillar_table || []),
    ...(core?.summary ? [{
      character: 'speak',
      name: '복길',
      text: core.summary,
      style: 'normal' as const,
    }] : []),
  ]}
  autoPlay
/>

{/* 양피지 해설: 사주 원국 */}
{resultComments?.parchment_pillar && (
  <ParchmentCard title="사주 원국 해설">
    {resultComments.parchment_pillar}
  </ParchmentCard>
)}

{/* ② DaeunTimeline */}
{daeunPeriods.length > 0 && (
  <DaeunTimeline periods={daeunPeriods} currentAge={currentAge} />
)}

{/* 양피지 해설: 대운 */}
{resultComments?.parchment_daeun && (
  <ParchmentCard title="대운 해설">
    {resultComments.parchment_daeun}
  </ParchmentCard>
)}

{/* ③ SeunCard */}
<SeunCard currentYear={seunCurrent} nextYear={seunNext} />

{/* 복길 코멘트: 세운 */}
{resultComments?.after_seun && (
  <InlineDialogue lines={resultComments.after_seun} autoPlay />
)}

{/* 양피지 해설: 세운 */}
{resultComments?.parchment_seun && (
  <ParchmentCard title="세운 해설">
    {resultComments.parchment_seun}
  </ParchmentCard>
)}

<SectionDivider icon="star" />

{/* ④ OhengRelation + OhengRadar */}
<OhengRelation />
<OhengRadar distribution={ohengDistribution} />

{/* 복길 코멘트 + core.strengthReading */}
<InlineDialogue
  lines={[
    ...(resultComments?.after_oheng || []),
    ...(core?.strengthReading ? [{
      character: 'flash',
      name: '복길',
      text: core.strengthReading,
      style: 'emphasis' as const,
    }] : []),
  ]}
  autoPlay
/>

{/* 양피지 해설: 오행 */}
{resultComments?.parchment_oheng && (
  <ParchmentCard title="오행과 신강신약 해설">
    {resultComments.parchment_oheng}
  </ParchmentCard>
)}

<SectionDivider icon="stamp" />

{/* 궁합 업셀 + 심층 해석 업셀 + 푸터 ... */}
```

---

## 수정 7: CTA 버튼 강조 (글로우 + 컬러)

### 파일: `app/alt2/components/upsell/CtaButton.tsx`

버튼을 금색 배경 + 글로우 맥동 이펙트로 교체한다.

```tsx
'use client';

interface CtaButtonProps {
  label: string;
  price?: string;
  onClick: () => void;
}

export default function CtaButton({ label, price, onClick }: CtaButtonProps) {
  return (
    <>
      <style jsx>{`
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 12px rgba(240, 223, 173, 0.4), 0 0 24px rgba(240, 223, 173, 0.2); }
          50% { box-shadow: 0 0 20px rgba(240, 223, 173, 0.6), 0 0 40px rgba(240, 223, 173, 0.3); }
        }
      `}</style>
      <button
        onClick={onClick}
        className="w-full py-4 font-semibold text-base transition-transform active:scale-[1.02]"
        style={{
          backgroundColor: '#f0dfad',
          color: '#1a1e24',
          borderRadius: 20,
          animation: 'glow-pulse 2s ease-in-out infinite',
        }}
      >
        {label}
        {price && (
          <span className="ml-2 text-sm font-normal" style={{ opacity: 0.6 }}>
            — {price}
          </span>
        )}
      </button>
    </>
  );
}
```

### 변경 요약
- 배경: `#dde1e5` → `#f0dfad` (팔레트 최밝 금색)
- 텍스트: `#3e4857` → `#1a1e24` (최짙 컬러, 대비 강화)
- 그림자: 정적 → `glow-pulse` 애니메이션 (2초 주기 맥동)
- 글로우 색상: `rgba(240, 223, 173, ...)` (버튼 컬러 기반 금색 빛)

---

---

## 검증 체크리스트

### 배경 + 브랜딩
1. [ ] Zone B 배경이 불투명하여 텍스트가 선명하게 읽히는가
2. [ ] 기존 Zone B 컴포넌트(PillarTable, DaeunTimeline 등)가 그대로 동작하는가
3. [ ] 푸터에 "제3의시간" 로고 워터마크가 표시되는가
4. [ ] "다른 사주 분석하기" 버튼이 정상 동작하는가

### 궁합 업셀
5. [ ] 개인 분석 결과 후 복길의 궁합 소개 대사가 나오는가
6. [ ] "궁합을 알아보겠다" / "괜찮습니다" 선택지가 표시되는가
7. [ ] 인원 선택 (2인/3인) 화면이 나오는가
8. [ ] 선택한 인원에 맞는 금액이 표시되는가
9. [ ] 결제 CTA 버튼이 동작하는가 (현재는 alert placeholder)
10. [ ] "괜찮습니다" 선택 시 거절 대사가 표시되는가
11. [ ] 궁합 업셀과 심층 해석 업셀이 별개로 존재하는가

### 신살 통합 + 양피지 카드
12. [ ] PillarTable 하단에 신살 행이 표시되는가
13. [ ] SinsalRow 컴포넌트가 제거되었는가
14. [ ] PillarTable 뒤에 양피지 카드("사주 원국 해설")가 표시되는가
15. [ ] DaeunTimeline 뒤에 양피지 카드("대운 해설")가 표시되는가
16. [ ] SeunCard 뒤에 양피지 카드("세운 해설")가 표시되는가
17. [ ] OhengRadar 뒤에 양피지 카드("오행과 신강신약 해설")가 표시되는가
18. [ ] 양피지 카드가 베이지 배경 + 갈색 테두리 + 직각 모서리인가
19. [ ] 양피지 카드 텍스트가 짙은 갈색으로 가독성이 좋은가

### CTA 버튼
20. [ ] CTA 버튼이 금색(#f0dfad) 배경인가
21. [ ] 버튼 텍스트가 어두운 색(#1a1e24)으로 대비되는가
22. [ ] 글로우 맥동 애니메이션이 2초 주기로 동작하는가
