# sajuweb 개발 로드맵

최종 업데이트: 2026-04-15
기술 스택: TypeScript / Node.js / Next.js
참고 코드: github.com/hjsh200219/fortuneteller (clean-room 참조, LICENSE 확인 전)

---

## 주요 아키텍처 결정사항

| 항목 | 결정 | 결정일 |
|---|---|---|
| 기술 스택 | TypeScript / Node.js / Next.js | 2026-04-15 |
| 해석 방식 | 옵션 3 하이브리드 — 엔진이 계산·JSON 생성, LLM이 해석문 서술 | 2026-04-15 |
| LLM 출력 구조 | JSON mode / function calling으로 고정 (Phase 2 진입 시 설계) | 2026-04-15 |
| 이론 기준 | 이석영 사주첩경 1차 + 5유파 현대 해석 보강 (상세: interpretation-policy.md) | 2026-04-15 |
| LLM 선택 | Claude API 우선, 추후 교체 가능하도록 gateway 추상화 | 2026-04-15 |

---

## 해석 파이프라인 구조

```
[엔진] 생년월일시 입력
    → 4기둥·십성·격국·용신·신강약 등 계산
    → 구조화 JSON 출력

[LLM 게이트웨이] 구조화 JSON 수신
    → 시스템 프롬프트(이석영 기준 + 5유파 보강 지침) 주입
    → JSON mode로 출력 구조 고정
    → 해석문 JSON 반환

[클라이언트] 해석문 렌더링
```

---

## Phase 0 — 프로젝트 기반 ✅ 완료

- [x] 데이터 파이프라인 (iljin.json, jeolip.json, 1900~2049)
- [x] 프로젝트 문서 초기화 (CLAUDE.md, docs/, .gitignore, .env.example)
- [x] 기술 스택 결정
- [x] 해석 정책 결정 (interpretation-policy.md)
- [x] 개발 로드맵 수립

---

## Phase 1 — 사주 계산 엔진 ✅ 완료

> 각 모듈은 단위 테스트 통과 후 사용자 확인을 받아야 완료 처리한다.
> fortuneteller 코드는 알고리즘 참조용. 이석영 기준 검증 필수.

### M1. 프로젝트 초기화 ✅
- [x] `npm init` + `tsconfig.json` (strict mode)
- [x] Jest + ts-jest 설정
- [x] 의존성 설치: `date-fns`, `date-fns-tz`, `zod`
- [x] 디렉터리 구조 생성 (`src/engine/`, `src/gateway/`, `data/`, `tests/`)
- [x] `data/`에 `iljin.json`, `jeolip.json` 복사 (이미 존재)

완료 기준: `npm test` 오류 없이 실행 (0 tests passed)

### M2. 데이터 어댑터 ✅
- [x] `src/engine/data/iljin_adapter.ts` — 날짜(YYYY-MM-DD) → 일진 조회
- [x] `src/engine/data/jeolip_adapter.ts` — 연도 → 24절기 목록 + 절입 시각 조회
- [x] 단위 테스트: 임의 날짜 5건 일진값, 임의 연도 절입 시각 정상 반환

완료 기준: 단위 테스트 통과 + 사용자 확인

### M3. 음양력 변환 ✅
- [x] `src/engine/calendar.ts` — 양력→음력, 음력→양력, 윤달 처리
- [x] `data/lunar_lookup.json` — manse_data.json에서 음양력 매핑 추출 (4.5MB)
- [x] 단위 테스트: 알려진 음력-양력 대응 17건 (설날·추석·윤달·경계 케이스)

완료 기준: 단위 테스트 통과 + 사용자 확인

### M4. 연주(年柱) 산출 ✅
- [x] `src/engine/pillar_year.ts` — 절입(입춘) 기준 연도 결정 → 연주 간지
- [x] 단위 테스트: 입춘 전날·당일·다음날 경계 케이스 포함 (10건)

완료 기준: 단위 테스트 통과 + 사용자 확인

### M5. 월주(月柱) 산출 ✅
- [x] `src/engine/pillar_month.ts` — 12절 기준 월 결정 → 오호둔 월건법
- [x] 단위 테스트: 절입 당일 전후 경계 케이스 포함 (10건)

완료 기준: 단위 테스트 통과 + 사용자 확인

### M6. 일주(日柱) 산출 ✅
- [x] `src/engine/pillar_day.ts` — iljin.json lookup
- [x] 자시 경계 처리 (이석영 기준: 야자시/조자시 분리)
- [x] 단위 테스트: 자시 경계 케이스 포함 (8건)

완료 기준: 단위 테스트 통과 + 사용자 확인

### M7. 시주(時柱) 산출 ✅
- [x] `src/engine/pillar_hour.ts` — 오서둔 시건법
- [x] 단위 테스트: 12시진 전체 + 야자시 특례 + 시각 미상 (16건)

완료 기준: 단위 테스트 통과 + 사용자 확인

### M8. 4기둥 통합 + 진태양시 보정 ✅
- [x] `src/engine/saju.ts` — M4~M7 통합 파이프라인
- [x] `src/engine/data/longitude_table.ts` — 229 시군구 경도 보정 (fortuneteller 참조)
- [x] 진태양시 보정 적용 (동경 135° 대비 경도 차이)
- [x] 단위 테스트: 레퍼런스 사주 5건 + 음력 입력 + 진태양시 보정 (10건)

완료 기준: 레퍼런스 사주 5건 통과 + 사용자 확인

> **M8 완료 = "샘플 입력 → 사주 4기둥 출력" 최초 확인 가능 시점**

### M9. 십성(十星) ✅
- [x] `src/engine/ten_gods.ts` — 일간 기준 10개 십성 산출 (천간 + 지지 본기)
- [x] 단위 테스트: 기본 판정 20건 + 레퍼런스 3건 십성 배치 일치 (23건)

완료 기준: 단위 테스트 통과 + 사용자 확인

### M10. 지장간(地藏干) ✅
- [x] `src/engine/jijanggan.ts` — 지지별 지장간 분야 계산 (여기·중기·정기 + 세력 비율)
- [x] 단위 테스트: 12지지 전체 정기 + 세력 합계 + 레퍼런스 2건 (29건)

완료 기준: 단위 테스트 통과 + 사용자 확인

### M11. 신강/신약 ✅ (재작업 완료)
- [x] `src/engine/day_master_strength.ts` — 월령·득지·득세 기준 점수화 (0~100점, 5단계)
- [x] `src/engine/relations.ts` — 천간 5합 검출 · 지지 형충파해 검출 유틸
- [x] 월지 이중 계상 제거, 득지 25점 clamp, 합거 천간 제외, 월지 손상 감점
- [x] 단위 테스트: 레퍼런스 4건 + 극강·극약 + 합·형충파해 검출 (9건)

완료 기준: 단위 테스트 통과 + 사용자 확인

### M12. 격국 ✅
- [x] `src/engine/gyeok_guk.ts` — 이석영 기준 격국 판단 (5단계 판정 절차)
- [x] 투출 우선순위: 월간>연간/시간, 정기>중기>여기
- [x] 외격(종강·종왕·종아·종재·종살), 특수 내격(건록·양인), 내격 8격
- [x] 파격: 상관견관·편인도식·비겁쟁재·재극인·편관무제 (합거 천간 제외)
- [x] 합거(合去): 격 글자 합 경고 + 파격→약화 다운그레이드
- [x] 충격(冲格): 월지 충 경고
- [x] 형해(刑害): 월지 형·해 → 약화 플래그 + weakenedBy 필드
- [x] 단위 테스트: 25건 (외격 6, 특수 내격 2, 투출 4, 파격·합거·충격 7, 레퍼런스 6)

완료 기준: 단위 테스트 통과 + 사용자 확인

### M13. 용신 ✅
- [x] `src/engine/yong_sin.ts` — 5법 병렬 출력 (억부·조후·통관·병약·전왕) + 종합 final
- [x] 궁통보감 일간×월지 조후표 (10간×12지 = 120 엔트리)
- [x] 단위 테스트: 레퍼런스 2건 + 조후 2건 + 종격 2건 + 구조 검증 (12건)

완료 기준: 단위 테스트 통과 + 사용자 확인

### M14. 엔진 출력 JSON 스키마 확정 ✅
- [x] `src/engine/schema.ts` — Zod 스키마 (`SajuResultSchema`)
- [x] `src/engine/analyze.ts` — M8~M13 통합 분석 함수 (`analyzeSaju`)
- [x] 단위 테스트: Zod 검증 + 레퍼런스 + 시각미상 + 음력 + 직렬화 (5건)

완료 기준: 사용자 JSON 구조 승인 ✅

### M14.5. 대운/세운 ✅ (분석 확장 완료)
- [x] `src/engine/daeun.ts` — 대운/세운 간지 산출 + 상세 분석
- [x] 각 대운/세운별: 십성 관계, 용신 희신/기신 판정, 원국 형충합 검출, 종합 점수(0~100), 평가(대길~대흉)
- [x] `SajuInput`에 gender 필드 추가
- [x] `schema.ts`, `analyze.ts` 통합
- [x] 단위 테스트: 순행/역행 + 분석 포함 + 충 검출 + 세운 분석 (10건)

> **M14.5 완료 = Phase 2 설계 진입 가능 시점**

---

## Phase 2 — LLM 게이트웨이 연동 ✅ 완료

> M14.5 완료(엔진 출력 JSON + 대운/세운 확정) 후 진입.
>
> 구현 방식:
> - **출력 구조 고정**: Anthropic tool use (function calling)로 스키마 강제
>   시스템 프롬프트에 JSON 스키마를 기술하지 않음
>   참고: https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview
> - **Prompt caching**: system + tools를 `cache_control: {"type": "ephemeral"}`로 지정
>   반복 호출 시 토큰 비용 절감 (캐시 TTL 5분)
>   참고: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching

### M15. 시스템 프롬프트 + Tool 정의 ✅
- [x] 시스템 프롬프트 (`src/gateway/prompts/system.ts`) — 역할·원칙·서술 지침 (~500 토큰)
- [x] Phase 2 전용 프롬프트 (`SAJU_SYSTEM_PROMPT_PHASE2`) — JSON 직접 출력 지침 추가
- [x] Phase 1 tool: `src/gateway/tools/saju_core.ts` (summary + 3 readings)
- [x] Phase 2 tool: `src/gateway/tools/saju_interpretation.ts` (coreJudgment 제외, 스키마 참조용)
- [x] Phase 2 Zod 스키마: `Phase2ResultSchema` (`src/gateway/prompts/schema.ts`)
- [x] Prompt caching 로깅 구현 (현재 토큰 합산 미달로 캐시 미작동, Phase 3 이후 재평가)

### M16. LLM 게이트웨이 ✅
- [x] `src/gateway/gateway.ts` — 2단계 구조 (`analyzePhase1`, `analyzePhase2`)
- [x] Phase 1: tool use + `messages.create()` (Haiku, ~10초)
- [x] Phase 2: 텍스트 스트리밍 + `JSON.parse()` + `Phase2ResultSchema.parse()` (TTFT ~1초, 212 chunks)
- [x] 캐시 히트율 로깅 (`cache_creation_input_tokens`, `cache_read_input_tokens`)
- [ ] 개인정보 주입 방지 검증 → Phase 3으로 이관

### M17. 엔진-게이트웨이 E2E 테스트 ✅
- [x] 1986-09-15 01:17 레퍼런스 사주 전체 파이프라인 동작 확인
- [x] Phase 2 Zod 스키마 검증 통과
- [x] 출력 구조 일관성 확인 (2회 연속 호출, 섹션 키·내부 구조 동일)
- [x] 전 섹션(14개 필드) ALL FILLED (daeun 포함)
- [x] 캐시 로깅 동작 확인 (토큰 미달로 HIT 미발생, 구조적으로는 정상)

> **M17 완료 = "샘플 입력 → 해석문 포함 전체 결과 출력" 확인 가능 시점**

---

## Phase 3 — 웹 API & 세션 ✅ 완료

### M18. Next.js 프로젝트 초기화 ✅
- [x] Next.js 16 + App Router + React 설치
- [x] tsconfig: Next.js(bundler) + Jest(commonjs) 공존
- [x] `next.config.ts`, `app/layout.tsx`, `app/page.tsx`
- [x] `npm test` 219건 + `next build` 성공

### M19. API Routes ✅
- [x] `POST /api/saju/analyze` — Zod 입력 검증 → 엔진 → Phase 1 LLM → JSON 응답
- [x] `POST /api/saju/interpret` — Phase 2 LLM → SSE 스트리밍 (chunk/done/error)
- [x] 에러 응답 표준화 (400/429/500)

### M20. Rate Limiting + 개인정보 보호 ✅
- [x] `src/middleware/rate-limit.ts` — IP 기반 슬라이딩 윈도우 (분당 10회, .env 설정)
- [x] `src/middleware/sanitize.ts` — LLM 응답 내 생년월일시 마스킹 (6개 패턴)
- [x] 에러 메시지 날짜 마스킹
- [x] 단위 테스트 8건

### M21. 세션 관리 ✅
- [x] `src/middleware/session.ts` — 인메모리 세션 (쿠키 ID, 24시간 TTL)
- [x] 동일 입력 캐싱 (`cached: true` 반환, 엔진/LLM 재계산 방지)
- [x] 단위 테스트 6건

---

## Phase 4 — 프론트엔드 UI ✅ 완료 (alt1 기준)

- [x] SajuForm — 생년월일시 입력 (양력/음력, 윤달, 성별, 출생지 44개 도시)
- [x] PillarTable — 4기둥 시각화 (오행별 컬러, 십성 표시)
- [x] CoreJudgment — Phase 1 핵심 판단 카드
- [x] InterpretationStream — Phase 2 SSE 스트리밍 + 14개 섹션 카드
- [x] 기본 UX 흐름 (입력 → Phase1 즉시 표시 → Phase2 스트리밍)

### alt1 / alt2 분기
- [ ] 현재 구현을 `app/alt1/`로 이전. `app/page.tsx`는 alt1 redirect.
- [ ] `app/alt2/` 신규 구현 — 캐릭터 스토리텔링 버전
  - 선행 조건: 캐릭터 SVG 파일 `public/character/`에 준비 (AI/PDF → SVG 변환)
  - Step 1 랜딩: 캐릭터 + 타이핑 말풍선 + CTA
  - Step 2 입력: SajuForm 재사용
  - Step 3 핵심판단: CoreJudgment 재사용 + 캐릭터 내레이션 (1.5초 간격 순차 등장)
  - Step 4 상세해석: InterpretationStream 재사용 + 캐릭터 아이콘
  - Step 5 PDF: window.print() MVP
- [ ] alt1·alt2 비교 후 메인 방향 확정

### M-SEO. 검색엔진 최적화 (Phase 4 병행)
- [ ] Next.js Metadata API로 페이지별 title·description·og 태그 설정
- [ ] sitemap.xml 자동 생성 (next-sitemap 또는 App Router 내장)
- [ ] robots.txt 설정
- [ ] Schema.org 구조화 데이터 삽입 (WebApplication 타입)
- [ ] Google Search Console·Bing Webmaster Tools·Naver Search Advisor 등록
      (배포 후 즉시 수행, 도메인 확정 후 진행 가능)
- [ ] Core Web Vitals 측정 및 기준치(LCP 2.5초 이하) 충족 확인

---

## Phase 5 — 배포 ⚫

> Phase 4 완료 후 진입. 배포 대상 미확정 (Fly.io / Vercel / VPS).

---

## 미결 이슈 (개발과 별도 추적)

### 라이선스·데이터 권리
- [ ] fortuneteller 저작자(hjsh200219) LICENSE 파일 존재 여부 및 저작권자명 확인
- [ ] KASI 공공데이터 상업적 이용 가능 여부 확인 (이용약관 검토)

### 격국 미구현 (Phase 2 이후 필요 시)
- [ ] 화격(化格) 판정 — 천간합화 + 월령 득 + 극 없음 조건 (실전 매우 드묾)
- [ ] 진종(眞從) vs 가종(假從) 구분 — 미약한 비겁·인성 유무에 따른 세분화

### 데이터 보완
- [ ] 동지 절기 오차 수정 — 1903년 이후 (전통 만세력 이미지 재확보 후)
- [ ] 2050년 데이터 추가 — 2048년 11월 이후 KASI 재수집

### SEO·노출 전략
- [ ] 도메인 확정 및 구매
- [ ] 배포 후 외부 디렉토리 등재 (Product Hunt, AlternativeTo, 네이버 플레이스 등)
- [ ] 콘텐츠 페이지 설계: "사주란?", "용신이란?" 등 설명 페이지 (GEO 대비)

### 명리학 교재 참조 데이터 구축
- [ ] PDF 교재 목록 정리 (보유 교재 + 우선순위)
- [ ] PDF → Claude 읽기 → 주제별 마크다운 추출 (`docs/references/`)
  - 격국론, 용신론, 십성론, 신강약론, 조후론, 대운론, 궁합론 등
  - 원문 인용이 아닌 재정리 형태 (저작권 고려)
- [ ] 정리된 참조 데이터를 시스템 프롬프트에 반영 (해석 품질 향상)
- [ ] glossary.ts 자동 확장 — 교재 기반 용어 정의 보강
- [ ] (선택) RAG 파이프라인 구축 — 벡터 DB에 교재 텍스트 적재, 해석 시 관련 구절 검색
- [ ] 콘텐츠 페이지 원천 데이터로 활용 ("사주란?", "용신이란?" 등 SEO 페이지)

### 해외 출생 지원 (Phase 3 이후)
- [ ] 해외 출생 경도 보정 방식 확정 및 구현
  - 결정사항 (2026-04-15): 세계 도시 테이블 방식 채택하지 않음 (데이터 무결성 문제)
  - 채택 방식: 타임존 선택 → 표준경선 기준 보정 (근사값, 한계 UI 고지)
  - 고급 옵션: 위도/경도 직접 입력 (사용자 책임)
  - 기술: `date-fns-tz` IANA 타임존 DB 활용 (이미 의존성 포함)
  - DST 이력은 `date-fns-tz`로 처리 가능
  - UI: 국가/타임존 드롭다운 + 고급 좌표 입력 옵션 병행

---

## 레퍼런스 사주 목록 (단위 테스트용)

> M4~M13 테스트에 사용할 검증된 사주. 이석영 사주첩경 수록 예제 또는 검증된 출처로 채운다.
> 개인정보 보호: 실명·연락처 기재 금지. 출처와 간지 정보만 기록.

| 번호 | 생년월일시 (양력) | 성별 | 예상 일주 | 격국 | 출처 |
|---|---|---|---|---|---|
| 1 | — | — | — | — | — |
