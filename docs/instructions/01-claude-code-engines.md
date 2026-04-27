# 클로드 코드 지시서: 금전운 + 사업운 엔진 개발

> 이 지시서를 클로드 코드 터미널에 붙여넣고 실행하세요.
> 작업 중 sajuweb 폴더의 CLAUDE.md를 반드시 먼저 읽으세요.

---

## 작업 개요

sajuweb 프로젝트에 금전운(money_reading.ts)과 사업운(business_reading.ts) 엔진을 추가한다.
기존 연애운 엔진(`src/engine/love_reading.ts`)과 동일한 패턴으로 구현한다.

## 브랜치

```bash
git checkout -b feat/fortune-engines
```

**주의: main 브랜치에 직접 커밋하지 말 것. 이 브랜치에서만 작업.**

---

## 1단계: 금전운 엔진 (`src/engine/money_reading.ts`)

### 구조 (3단계, love_reading.ts 패턴 동일)

```typescript
export interface MoneyReading {
  // 1단계: 재성궁(財星宮) 분석 — 월주+일지 기반
  wealthHouse: {
    monthGan: string;        // 월간
    monthJi: string;         // 월지
    wealthStarType: '편재' | '정재';  // 일간 기준 재성 유형
    wealthElement: Element;  // 재성 오행
    wealthStrength: 'strong' | 'moderate' | 'weak';  // 원국 내 재성 세력
    description: string;     // 종합 설명
  };

  // 2단계: 금전 성향
  moneyStyle: {
    dayGanElement: Element;
    earning: string;         // 돈 버는 방식 (편재=투기/사업, 정재=월급/저축)
    spending: string;        // 소비 패턴
    hasYeokma: boolean;      // 역마 — 이동/해외 재물
    hasGwimun: boolean;      // 귀문관 — 기술/전문 재물
    dayMasterStrength: string; // 신강약이 재물운에 미치는 영향
  };

  // 3단계: 재물 시기
  timing: {
    wealthDaeun: { startAge: number; endAge: number; gan: string; ji: string; rating: string; desc: string }[];
    peakYears: number[];     // 편재/정재 세운 연도
  };
}
```

### 핵심 로직

- **재성 판별**: 일간이 극하는 오행 = 재성. 음양 같으면 편재, 다르면 정재.
- **재성 세력**: 원국 8글자(천간4+지지4) 중 재성 오행 개수 + 지장간 내 재성 정기 여부로 strong/moderate/weak 판정.
- **신강약 연관**: 신강해야 재성을 감당 → 신강+재성强=길, 신약+재성强=재다신약(재물로 인한 고생).
- **대운 시기**: 대운 간지 중 재성 오행이 오는 시기를 추출, 용신 일치 여부로 rating 산출.

### 참고할 기존 코드

- `src/engine/love_reading.ts` — 구조 패턴
- `src/engine/ten_gods.ts` — 십성 판별 로직
- `src/engine/day_master_strength.ts` — 신강약 점수
- `src/engine/daeun.ts` — 대운/세운 간지 목록
- `src/engine/sinsal.ts` — 역마살, 귀문관살 등 신살 조회

---

## 2단계: 사업운 엔진 (`src/engine/business_reading.ts`)

### 구조

```typescript
export interface BusinessReading {
  // 1단계: 관성+재성 복합 분석
  businessAptitude: {
    officerStarType: '편관' | '정관';  // 관성 유형
    wealthStarType: '편재' | '정재';   // 재성 유형
    combination: string;      // "편관+편재=공격형 사업가" 등 4가지 조합 해석
    entrepreneurScore: number; // 0~100 사업적성 점수
  };

  // 2단계: 업종 적성
  industryFit: {
    primaryElement: Element;   // 용신 오행
    industries: string[];      // 추천 업종 3~5개
    avoidIndustries: string[]; // 비추 업종 2~3개
    reasoning: string;
  };

  // 3단계: 사업 시기 + 주의점
  timing: {
    bestDaeun: { startAge: number; endAge: number; rating: string; desc: string }[];
    cautionPeriods: { startAge: number; endAge: number; reason: string }[];
  };
}
```

### 핵심 로직

- **사업적성 점수**: 편재 유무(+30) + 식상생재 유무(+20) + 역마(+10) + 편관 제화(+15) + 신강(+25) 합산
- **업종 매핑**: 용신 오행별 업종 테이블 (木=교육/출판, 火=IT/요식, 土=부동산/중개, 金=금융/제조, 水=무역/유통)
- **식상생재**: 식신/상관 → 재성으로 이어지는 생재 구조 검출 (기술→수익 흐름)
- **주의 시기**: 비겁 대운(경쟁자), 편관 무제화 대운(관재구설)

---

## 3단계: 스키마 + analyze.ts 통합

### schema.ts 추가

```typescript
// MoneyReadingSchema, BusinessReadingSchema 추가
// SajuResultSchema에 optional 필드로 추가:
//   moneyReading: MoneyReadingSchema.optional()
//   businessReading: BusinessReadingSchema.optional()
```

### analyze.ts 수정

```typescript
// analyzeSaju() 함수에 추가:
// if (options?.includeFortuneReadings) {
//   result.moneyReading = analyzeMoney(sajuResult);
//   result.businessReading = analyzeBusiness(sajuResult);
// }
```

---

## 4단계: 테스트

### `tests/money_reading.test.ts`

- 편재/정재 판별 테스트 (일간 10종 × 재성 오행)
- 재성 세력 판정 (strong/moderate/weak 각 1건)
- 신강+재강, 신약+재강 케이스 각 1건
- 대운 시기 추출 정상 작동 1건
- 최소 8건

### `tests/business_reading.test.ts`

- 사업적성 점수 계산 (식상생재 있는 케이스, 없는 케이스)
- 업종 매핑 (용신 5개 오행 각 1건)
- 관성+재성 조합 4가지
- 최소 10건

---

## 완료 기준

1. `npm test` 전체 통과 (기존 279건 + 신규 18건 이상)
2. `npm run build` 성공
3. 기존 코드 변경 없음 (schema.ts, analyze.ts 추가만)
4. 레퍼런스 사주 1건(1986-09-15 01:17 남명 서울) 전체 파이프라인 동작 확인

---

## 절대 하지 말 것

- main 브랜치 직접 커밋
- 프론트엔드 코드 수정 (app/ 폴더 건드리지 말 것)
- PDF 섹션 추가 (이건 별도 작업)
- API 엔드포인트 추가
- data/ 폴더 수정
