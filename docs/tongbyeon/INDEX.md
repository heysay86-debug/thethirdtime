# 통변 지침 INDEX

리포트 목차 기준. 각 파일은 **지침 원본** (이론 근거 + 유파 비교 + 결정 사유).
LLM 프롬프트는 `src/gateway/prompts/XX-name.prompt.md`에 규칙만 압축하여 별도 관리.

## 3계층 구조

```
지침 원본 (docs/tongbyeon/)  →  이론 근거, 결정 사유. 개발자·세션 AI가 읽음
        ↓ 증류
프롬프트 (src/gateway/prompts/)  →  규칙만 압축 10~20줄. Claude API가 읽음
        +
엔진 데이터 (JSON)  →  구조화된 사실. Claude API user 메시지로 전달
```

## 섹션별 상태

| # | 섹션 | 지침 원본 | 프롬프트 | 상태 |
|---|------|-----------|----------|------|
| 03 | 사주팔자 개요 | [03-basics.md](03-basics.md) | — | 예정 |
| 04 | 핵심 판단 | [04-core-judgment.md](04-core-judgment.md) | — | 예정 |
| 05 | 주별 심층 분석 | [05-pillars.md](05-pillars.md) | — | 예정 |
| 06 | 오행 분석 | [06-ohaeng.md](06-ohaeng.md) | — | 예정 |
| 07 | 십성 분석 | [07-sipseong.md](07-sipseong.md) | — | 예정 |
| 08 | 형충파해합 | [08-relations.md](08-relations.md) | `08-relations.prompt.md` | **완료** |
| 08 | 신살 | [08-sinsal.md](08-sinsal.md) | `08-sinsal.prompt.md` | **완료** |
| 09 | 대운·세운 | [09-daeun.md](09-daeun.md) | — | 예정 |
| 10 | 종합 해석 | [10-synthesis.md](10-synthesis.md) | — | 예정 |
