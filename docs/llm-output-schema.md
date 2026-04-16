# LLM 해석문 출력 스키마

최종 업데이트: 2026-04-15

---

## 개요

사주 엔진(Phase 1)이 산출한 `SajuResult` JSON을 Claude API에 전달하면,
아래 구조의 해석문 JSON(`InterpretationResult`)을 반환한다.

**입력**: `SajuResult` (엔진 출력, `src/engine/schema.ts`)
**출력**: `InterpretationResult` (해석문, `src/gateway/prompts/schema.ts`)

---

## 출력 JSON 구조

```json
{
  "summary": "한 줄 총평",
  "sections": {
    "basics":           { "description": "..." },
    "coreJudgment":     { "strengthReading", "gyeokGukReading", "yongSinReading" },
    "pillarAnalysis":   { "year", "month", "day", "hour" },
    "ohengAnalysis":    { "distribution", "johu", "perspectives?" },
    "sipseongAnalysis": { "reading", "perspectives?" },
    "relations":        { "reading" },
    "daeunReading":     { "overview", "currentPeriod", "upcoming" } | null,
    "overallReading":   { "primary", "modernApplication", "perspectives?" }
  }
}
```

---

## 섹션별 설명

| 섹션 | 내용 | 분량 기준 |
|---|---|---|
| summary | 한 줄 총평 | 30자 이내 |
| basics | 4기둥 간지 + 오행 구성 설명 | 200자 |
| coreJudgment | 신강약·격국·용신 핵심 판단 | 각 200~300자 |
| pillarAnalysis | 연·월·일·시주 각각의 의미 | 각 200~400자 |
| ohengAnalysis | 오행 분포·조후 (궁통보감 병기) | 300자 |
| sipseongAnalysis | 십성 배치·육친 (명리정종 병기) | 300자 |
| relations | 형충파해합·천간합·신살 | 200자 |
| daeunReading | 대운 전체 흐름 + 현재 대운 + 세운 | 각 200자 |
| overallReading | 이석영 종합 + 현대적 적용 + 유파 보강 | 400자 |

---

## perspectives 배열

유파 보강은 선택적(`optional`). 해당 유파의 관점이 의미 있을 때만 포함.

```json
{
  "school": "궁통보감",
  "content": "동절 수일간으로 조후상 화가 필요하며..."
}
```

가능한 school 값: `자평진전`, `적천수`, `궁통보감`, `명리정종`, `사주첩경`

---

## 대운 null 처리

성별 미입력 또는 시각 미상으로 대운을 계산하지 못한 경우:
- 엔진 `daeun` = `null`
- LLM 출력 `daeunReading` = `null`

---

## Claude API 호출 방식

- **모델**: Claude (최신, 교체 가능 구조)
- **시스템 프롬프트**: `src/gateway/prompts/system.ts`
- **사용자 메시지**: `SajuResult` JSON 전문
- **응답 형식**: JSON mode (추후 function calling으로 전환 가능)

---

## Zod 스키마 위치

- 엔진 출력: `src/engine/schema.ts` → `SajuResultSchema`
- 해석문 출력: `src/gateway/prompts/schema.ts` → `InterpretationResultSchema`
