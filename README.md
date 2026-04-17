# 제3의시간 (sajuweb)

사주 분석 리포트 서비스. 생년월일시를 입력하면 사주팔자를 계산하고
Claude API를 통해 PDF 리포트를 생성한다.

## 시작하기

```bash
cp .env.example .env          # ANTHROPIC_API_KEY 설정
npm install
npm test                      # 267개 단위 테스트
npx tsx scripts/test-real-pipeline.tsx  # 엔진+LLM+PDF 통합 실행
```

## 문서

| 문서 | 내용 |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | 프로젝트 전체 지침 (Claude Code 자동 로드) |
| [`docs/dev-roadmap.md`](./docs/dev-roadmap.md) | Phase별 개발 로드맵 + 미결 이슈 |
| [`docs/architecture.md`](./docs/architecture.md) | 시스템 구성 및 흐름 |
| [`docs/interpretation-policy.md`](./docs/interpretation-policy.md) | 해석 유파 정책 (이석영 1차) |
| [`docs/security.md`](./docs/security.md) | 보안·개인정보 지침 |
| [`DESIGN.md`](./DESIGN.md) | UI/UX 디자인 가이드 |

## 현재 구현 상태 (2026-04-17 기준)

| Phase | 항목 | 상태 |
|---|---|---|
| 0 | 데이터 파이프라인·문서 기반 | ✅ 완료 |
| 1 | 사주 계산 엔진 (M1~M14.6) | ✅ 완료 |
| 2 | LLM 게이트웨이 연동 | ✅ 완료 |
| 2.5 | PDF 리포트 생성 (10개 섹션) | ✅ 완료 |
| 3 | 웹 API & 세션 | ✅ 완료 |
| 4 | 프론트엔드 UI (alt1) | ✅ 완료 |
| 5 | 배포 | ⚫ 미착수 |

## 파이프라인 구조

```
SajuInput (생년월일시·성별·도시)
  └─ analyzeSaju()          ← 엔진: 4기둥·격국·용신·대운·세운 계산
       └─ SajuResult JSON
            └─ Phase 1 LLM  ← 핵심 판단 (tool use, ~12초)
            └─ Phase 2 LLM  ← 전체 해석 + 교안 참고 (스트리밍, ~50초)
                 └─ InterpretationResult
                      └─ SajuReport (react-pdf)
                           └─ PDF 출력 (~225KB, 22페이지)
```

## LLM 해석 구조

**Phase 1** — CoreJudgment (tool use)
- 한 줄 총평, 신강약 해석, 격국 해석, 용신 해석

**Phase 2** — Phase2Sections (텍스트 스트리밍 → JSON)
- basics, pillarAnalysis, ohengAnalysis, sipseongAnalysis
- relations, daeunReading, overallReading

**교안 참고 자료 주입** (`references/rag chunks.json`)
- 섹션별 관련 챕터 청크를 Phase 2 프롬프트에 자동 주입
- 심리·상담 관점 보강 (이석영 이론이 1차, 교안은 보조)
- `references/` 에 자료 추가 → `src/gateway/chunks.ts` CHAPTER_MAP 확장으로 반영

## 비용 참고 (Claude Haiku 4.5 기준)

| 항목 | 수치 |
|---|---|
| Phase 1 입력 | ~5,700 토큰 |
| Phase 2 입력 | ~13,200 토큰 (엔진 데이터 + 교안 청크 ~7,300) |
| 출력 | ~7,000 토큰 (분량 기준 강화 후) |
| 1회 비용 | 약 $0.05 (약 70원) |
| 소요 시간 | 약 60~70초 |

## 프로젝트 구조

```
sajuweb/
├── src/
│   ├── engine/            사주 계산 엔진 (267 단위 테스트)
│   ├── gateway/           LLM 게이트웨이
│   │   ├── gateway.ts     Phase 1/2 호출
│   │   ├── chunks.ts      교안 청크 로더 (references/ 연동)
│   │   └── prompts/       시스템 프롬프트·스키마
│   ├── pdf/               PDF 리포트 (react-pdf)
│   └── middleware/        rate-limit·세션·sanitize
├── scripts/
│   ├── test-real-pipeline.tsx   엔진+LLM+PDF 통합 테스트
│   └── dump-engine-result.tsx   엔진 결과 JSON 덤프
├── references/
│   ├── rag chunks.json    명리심리상담 교안 (94청크)
│   └── saju rag session notes.pdf
├── data/                  iljin.json, jeolip.json (read-only)
└── docs/                  설계 문서
```

## 알려진 이슈

- 동지 절기 오차 1903년 이후 미수정 (전통 만세력 이미지 재확보 후 처리)
- PDF 22페이지 중 여백 과다 (Phase 2 분량 기준 강화로 개선 중)

## 개발 규칙 요약

- API 키는 반드시 `.env` 관리 (하드코딩 금지)
- 이석영 사주첩경이 계산·격국·용신 판단의 1차 기준
- 명리학 이론 근거 없는 즉흥 해석 금지
- `data/` 폴더 직접 수정 금지
- 상세: `CLAUDE.md`, `docs/security.md`
