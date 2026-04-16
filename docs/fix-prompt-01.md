# alt2 MVP 수정 지시 — 3가지 이슈

아래 3가지를 순서대로 수정하라. 각 수정 후 `npm run build` 에러 없는지 확인.

---

## 수정 1: OhengRelation.tsx — 상생/상극 화살표를 선 중앙에 삼각형으로 표시

### 문제
- `markerEnd`로 선 끝에 화살표를 붙이고 있으나, 끝점이 아이콘(32×32) 뒤에 가려져서 안 보인다.
- 상극(점선)은 marker 자체가 아예 없다.

### 수정 방향
- `<marker>` + `markerEnd` 방식을 제거한다.
- 대신 각 선의 **중점 좌표**에 진행 방향으로 회전한 삼각형(`<polygon>`)을 별도로 그린다.

### 구현 상세

```tsx
// 두 점의 중점 계산
const midX = (from.x + to.x) / 2;
const midY = (from.y + to.y) / 2;

// 진행 방향 각도 계산 (라디안 → 도)
const angleDeg = Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);

// 삼각형을 중점에 배치하고 방향으로 회전
<polygon
  points="-5,-4 5,0 -5,4"
  fill="#a1c5ac"   // 상생: Sage Green / 상극: #e9b8b7 Soft Pink
  transform={`translate(${midX}, ${midY}) rotate(${angleDeg})`}
/>
```

- 상생 삼각형: `fill="#a1c5ac"`, opacity 0.7, 크기 10×8
- 상극 삼각형: `fill="#e9b8b7"`, opacity 0.5, 크기 8×6 (상생보다 약간 작게)
- 기존 `<defs>` 의 `<marker>` 정의 삭제
- 기존 `<line>`에서 `markerEnd` 속성 제거
- 선 자체는 그대로 유지 (상생: 실선 #a1c5ac, 상극: 점선 #e9b8b7)

### 파일
`app/alt2/components/result/OhengRelation.tsx`

---

## 수정 2: OhengRadar.tsx — 오행 분포 데이터를 pillars에서 계산

### 문제
- `engine.ohengDistribution` 필드가 API 응답에 존재하지 않는다.
- page.tsx에서 `{ 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 }` 으로 폴백하여 차트가 중심점에 수렴 → 안 보임.

### 수정 방향
- page.tsx에서 `engine.pillars`의 천간/지지 데이터로부터 오행 분포를 직접 계산한다.

### 구현 상세

page.tsx에 아래 매핑 테이블과 계산 함수를 추가:

```tsx
const GAN_OHENG: Record<string, string> = {
  '甲': '목', '乙': '목', '丙': '화', '丁': '화', '戊': '토',
  '己': '토', '庚': '금', '辛': '금', '壬': '수', '癸': '수',
};
const JI_OHENG: Record<string, string> = {
  '子': '수', '丑': '토', '寅': '목', '卯': '목', '辰': '토',
  '巳': '화', '午': '화', '未': '토', '申': '금', '酉': '금',
  '戌': '토', '亥': '수',
};

function calcOhengDistribution(pillars: any): Record<string, number> {
  const dist: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const positions = ['year', 'month', 'day', 'hour'];
  for (const pos of positions) {
    const p = pillars[pos];
    if (!p) continue;
    const ganOh = GAN_OHENG[p.gan];
    const jiOh = JI_OHENG[p.ji];
    if (ganOh) dist[ganOh]++;
    if (jiOh) dist[jiOh]++;
  }
  return dist;
}
```

기존 line 129:
```tsx
const ohengDistribution = engine?.ohengDistribution || { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
```

변경:
```tsx
const ohengDistribution = engine?.pillars
  ? calcOhengDistribution(engine.pillars)
  : { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
```

### 파일
`app/alt2/page.tsx`

---

## 수정 3: ZONE B에 core 해석 내용 표시

### 문제
- API가 `core` 객체에 `summary`, `strengthReading`, `gyeokGukReading`, `yongSinReading` 4개 필드를 반환하지만, 결과 페이지에 전혀 렌더되고 있지 않다.
- InlineDialogue에 보이는 건 dialogue-result-comments.json의 고정 멘트 몇 줄뿐.

### 수정 방향
- `core.summary`와 `core.strengthReading`을 ZONE B에 InlineDialogue로 표시한다.
- `core.gyeokGukReading`과 `core.yongSinReading`은 ZONE C 블러 미리보기에 사용한다.

### 구현 상세

#### 3-1. core.summary → 조견표 아래 인라인 대화창

기존 `{resultComments?.after_pillar_table && ...}` 부분을 아래로 교체:

```tsx
{/* 조견표 아래: core.summary를 대화창으로 */}
<InlineDialogue
  lines={[
    ...(resultComments?.after_pillar_table || []),
    ...(core?.summary ? [{
      character: 'speak',
      name: '안내자',
      text: core.summary,
      style: 'normal' as const,
    }] : []),
  ]}
  autoPlay
/>
```

#### 3-2. core.strengthReading → 오행 차트 아래 인라인 대화창

기존 `{resultComments?.after_oheng && ...}` 부분을 아래로 교체:

```tsx
{/* 오행 차트 아래: core.strengthReading을 대화창으로 */}
<InlineDialogue
  lines={[
    ...(resultComments?.after_oheng || []),
    ...(core?.strengthReading ? [{
      character: 'flash',
      name: '안내자',
      text: core.strengthReading,
      style: 'emphasis' as const,
    }] : []),
  ]}
  autoPlay
/>
```

#### 3-3. ZONE C 블러 미리보기에 격국/용신 읽기

기존 UpsellDialogue에 `previewData={core}`를 넘기고 있으므로,
UpsellDialogue.tsx 내부에서 `previewData.gyeokGukReading`과 `previewData.yongSinReading`을
블러 처리된 카드로 표시하라.

```tsx
{/* UpsellDialogue 내부 — 블러 미리보기 카드 */}
{previewData?.gyeokGukReading && (
  <div style={{
    filter: 'blur(6px)',
    opacity: 0.5,
    padding: 20,
    borderRadius: 16,
    background: 'rgba(104, 128, 151, 0.15)',
    marginTop: 16,
    userSelect: 'none',
    pointerEvents: 'none',
  }}>
    <p style={{ color: '#f0dfad', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
      격국 분석
    </p>
    <p style={{ color: '#dde1e5', fontSize: 15, lineHeight: 1.6 }}>
      {previewData.gyeokGukReading}
    </p>
  </div>
)}
{previewData?.yongSinReading && (
  <div style={{
    filter: 'blur(6px)',
    opacity: 0.5,
    padding: 20,
    borderRadius: 16,
    background: 'rgba(104, 128, 151, 0.15)',
    marginTop: 12,
    userSelect: 'none',
    pointerEvents: 'none',
  }}>
    <p style={{ color: '#f0dfad', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
      용신 분석
    </p>
    <p style={{ color: '#dde1e5', fontSize: 15, lineHeight: 1.6 }}>
      {previewData.yongSinReading}
    </p>
  </div>
)}
```

블러 카드 위에 오버레이 텍스트:
```tsx
<div style={{
  position: 'relative',
  textAlign: 'center',
  marginTop: -60,
  marginBottom: 16,
}}>
  <p style={{ color: '#f0dfad', fontSize: 16, fontWeight: 600 }}>
    더 자세한 이야기가 기다리고 있어요
  </p>
</div>
```

### 파일
- `app/alt2/page.tsx` (3-1, 3-2)
- `app/alt2/components/upsell/UpsellDialogue.tsx` (3-3)

---

## 수정 후 확인사항

1. `npm run build` — TypeScript 에러 0건
2. 오행 상생 화살표: 수→목 방향으로 삼각형이 선 중앙에 보이는지
3. 오행 상극 화살표: 수→화 방향으로 삼각형이 선 중앙에 보이는지
4. 펜타곤 차트: 테스트 사주 입력 시 오행 분포가 채워진 도형으로 보이는지
5. 조견표 아래: core.summary 텍스트가 대화창으로 표시되는지
6. 오행 차트 아래: core.strengthReading 텍스트가 대화창으로 표시되는지
7. ZONE C: 격국/용신 카드가 블러 처리되어 미리보기로 보이는지

## 주의사항

- DESIGN-ALT2.md의 6색 팔레트 엄수. 새로운 hex 코드 추가 금지.
- InlineDialogue의 text가 길 경우 3줄 이상 가능 (인라인 대화창은 최대 높이 제한 없음).
- core 필드가 null/undefined일 수 있으므로 optional chaining 필수.
