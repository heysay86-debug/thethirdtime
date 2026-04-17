# sajuweb 개발 로드맵

최종 업데이트: 2026-04-17
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

### M14.6. 신살(神殺) ✅
- [x] `src/engine/sinsal.ts` — 33종 신살 계산 모듈
  - A. 귀인성 9종: 천을귀인, 문창귀인, 문곡귀인, 천복귀인, 천주귀인, 태극귀인, 학당귀인, 천덕귀인, 월덕귀인
  - B. 살성·특수 10종: 역마살, 화개살, 백호살, 원진살, 괴강살, 양인살, 홍염살, 현침살, 귀문관살, 낙정관살
  - C. 록 3종: 금여록, 암록, 협록
  - D. 공망 1종
  - E. 십이신살 12종 (대운·세운용): 겁살, 재살, 천살, 지살, 연살, 월살, 망신살, 장성살, 반안살, 역마살, 육해살, 화개살
- [x] `schema.ts` — sinsal 필드 추가 (원국 SinsalEntry[], 대운·세운 SibiiSinsalEntry[])
- [x] `analyze.ts` — calculateSinsal 통합
- [x] `daeun.ts` — 대운·세운 각 기간에 십이신살 산출
- [x] 단위 테스트: 공망·천을귀인·괴강·현침·양인·역마·화개·원진·십이신살·월덕·홍염·금여·통합 (25건)

완료 기준: 단위 테스트 통과 + 기존 전체 테스트 267건 통과 + 사용자 확인 ✅

### M14.7. 십이운성(十二運星) ✅
- [x] `src/engine/twelve_stages.ts` — 일간 기준 지지별 생왕사절 판정 (10간×12지 매핑)
  - 12운성: 장생, 목욕, 관대, 건록, 제왕, 쇠, 병, 사, 묘, 절, 태, 양
  - `getTwelveStage(dayGan, ji)` 개별 조회
  - `calculateTwelveStages(dayGan, pillars)` 4기둥 일괄 산출
- [x] `schema.ts` — twelveStages 필드 추가 (year, month, day, hour nullable)
- [x] `analyze.ts` — calculateTwelveStages 통합
- [x] 웹 조견표(PillarTable) + page.tsx에 십이운성 행 표시
- [x] 단위 테스트: 개별 조회 5건 + 4기둥 통합 + 시주 null (9건)

완료 기준: 단위 테스트 통과 + 빌드 성공 ✅

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

## Phase 2.5 — 통변 후처리 엔진 ⚫

> LLM이 생성한 전문가 수준 농축 텍스트를 tongbyeon/ 지침에 따라
> 일반인 친화형으로 재작성하는 후처리 파이프라인.
>
> LLM 프롬프트에 통변 지침을 넣지 않는다. 통변 지침은 이 단계에서만 사용한다.
>
> 파이프라인: 엔진 → LLM(농축 해석) → **통변 후처리** → 최종 리포트

### M17.5. 통변 확장 (LLM Phase 3)
- [ ] Phase 3 LLM 호출: Phase 2 농축 해석 + 엔진 데이터 → 5원칙 기반 장문 확장
  - 해석 관점 5원칙:
    ① 철학적 프레임 — 명리학은 변화의 관조
    ② 반점술적 태도 — 길흉 부정, 삶의 순환 인정
    ③ 한자 원의에서 출발하는 개념 전개
    ④ 개인 사주 데이터와의 유기적 연결
    ⑤ 투출·지장간 등 구조 개념의 비유 해체
  - 입력: Phase2 농축 sections + SajuResult (엔진 데이터)
  - 출력: 동일 구조의 장문 확장 sections
  - 프롬프트: 5원칙 + 페어 예시 2~3개 (농축→장문 변환 쌍)
  - 예상: ~60~80초, ~57원/건 추가 (합계 ~102원/건)
- [ ] `src/gateway/gateway.ts` — `analyzePhase3()` 메서드 추가
- [ ] `src/gateway/prompts/phase3-system.ts` — Phase 3 전용 프롬프트
- [ ] `src/gateway/prompts/phase3-examples/` — 페어 예시 파일 (사용자 제공 원고)
- [ ] PDF 파이프라인 통합: Phase3 장문이 있으면 PDF에 장문 사용
- [ ] 웹 파이프라인: Phase2 즉시 표시 → Phase3 도착 시 교체
- [ ] 선행 조건: 사용자가 2~3개 섹션의 페어 예시(농축+장문) 제공

### M17.6. 번외편 — 연애운·금전운·사업운
- [ ] Phase 2 출력 스키마 확장: `sections`에 번외편 3개 섹션 추가
  ```
  extras: {
    love: "...",           // 연애운
    finance: "...",        // 금전운
    business: "..."        // 사업운
  }
  ```
- [ ] Phase 2 프롬프트에 번외편 섹션 지침 추가
  - 연애운: 일간·일지 궁합 구조, 재성(남)/관성(여) 배치, 도화살·홍염살·원진살 유무, 대운별 인연 시기
  - 금전운: 편재/정재 분포, 식상생재 여부, 재성 강약, 대운별 재물 흐름
  - 사업운: 식상생재 구조, 관성과 인성 균형, 역마살·장성살, 적합 업종 방향
- [ ] `Phase2SectionsSchema` (Zod) 업데이트: extras 필드 추가 (optional — 기존 호환)
- [ ] PDF 번외편 섹션 컴포넌트: `ExtrasSection.tsx`
- [ ] PDF 목차 업데이트
- [ ] 웹 Zone B에 번외편 영역 추가
- [ ] 엔진 추가 로직 불필요 — 기존 데이터(재성·관성·신살·대운)로 LLM이 재구성

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
  - **구현 명령서**: `docs/alt2-implementation-guide.md` (단계별 상세 지시)
  - **디자인 시스템**: `DESIGN-ALT2.md` (Mystical Night 테마)
  - 선행 조건: 캐릭터 SVG 파일 `public/character/`에 준비 (placeholder로 선 구현, 후 교체)
  - Step 1 랜딩: 캐릭터 + 타이핑 말풍선 + CTA
  - Step 2 입력: SajuForm 로직 재사용, UI 다크 테마 재작성
  - Step 3 로딩: 캐릭터 애니메이션 + 순환 멘트
  - Step 4 결과: PillarCard + CoreNarration + StreamRenderer (스크롤 레이아웃)
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

## Phase 2.5 — PDF 리포트 ✅ 완료 (2026-04-17)

> Phase 2 게이트웨이 완료 후 별도 착수. 실제 엔진+LLM 파이프라인 연결 완료.

### M-PDF-1. PDF 섹션 전체 구현 ✅
- [x] `src/pdf/` — react-pdf 기반 리포트 컴포넌트 전체 구축
  - 01 독자에게 (인트로 서문)
  - 02 출생시점 태양계 (SVG 행성 배치도)
  - 03 사주팔자 개요 (원국표·오행 레이더차트)
  - 04 핵심 판단 (신강약 바·격국·용신 카드)
  - 05 주별 심층 분석 (4기둥 개별 카드)
  - 06 오행 분석 (바차트·조후)
  - 07 십성 분석 (배치 테이블·카테고리 카드)
  - 08 형충파해합·신살 (관계 카드·신살 칩)
  - 09 대운 흐름 (대운표·세운표·현재 분석)
  - 10 종합 해석 (총평 배너·주분석·현대적 적용·유파별 관점)
- [x] `scripts/test-real-pipeline.tsx` — 엔진→Phase1→Phase2→PDF 통합 스크립트
- [x] `scripts/dump-engine-result.tsx` — 엔진 결과 JSON 덤프 스크립트

### M-PDF-2. 실제 파이프라인 검증 ✅
- [x] 실제 엔진 출력 확인 (1986-09-15 01:17 남명 서울)
  - 4기둥: 丙寅 丁酉 壬戌 庚子
  - 신강약: 신강 70점 득령
  - 격국: 편인격 내격 **파격** (재극인, 유술해 약화)
  - 용신: **木** / 희신: 火 / 방법: 억부+조후 일치
  - 대운 10개 (8~107세), 세운 10개 (2026~2035)
- [x] LLM 해석 검증 — 리뷰어 에이전트로 검증 완료
  - 엔진 데이터 일치율: 100% (4기둥·십성·신살·대운·세운 전수 확인)
  - 명리학 이론 오류: 없음
  - 발견 이슈: 콘텐츠 분량 부족 (섹션당 평균 700토큰), 종합해석 누락
- [x] 비용 측정: Phase1 $0.009 + Phase2 $0.024 = 총 약 $0.033 / 1회

### M-PDF-3. 해석 품질 보강 ✅ (2026-04-17)
- [x] `src/gateway/chunks.ts` — 교안 청크 로더 신규 구현
  - `references/rag chunks.json` (94청크, 명리심리상담 교안) 로드
  - 섹션별 챕터 정적 매핑: pillarAnalysis→Ch7/6, relations→Ch8, daeunReading→Ch12/5, overallReading→Ch10/13 등
  - 파일 없음 시 빈 문자열 반환 (파이프라인 영향 없음)
  - 향후 자료 추가 시 CHAPTER_MAP 확장으로 즉시 반영
- [x] `src/gateway/prompts/system.ts` — Phase 2 분량 기준 추가 및 조정
  - 초기: 섹션별 최소 분량만 명시 → JSON 절단 문제 발생 (출력 7,450 토큰, max 8,192 초과)
  - 수정: 섹션별 목표 범위(상한 포함) + 총 출력 6,500 토큰 이내 제한으로 변경
- [x] `src/gateway/gateway.ts` — Phase 2 메시지에 교안 청크 자동 주입
  - 추가 입력 토큰: 약 7,300 (14,500자)
  - 총 Phase 2 입력: ~13,200 토큰 → 1회 비용 약 $0.05
- [x] `src/gateway/gateway.ts` — JSON 절단 복구 함수 `repairTruncatedJson()` 추가
  - max_tokens 도달로 JSON이 중간에 끊길 경우 괄호 분석 후 자동 복구 시도
  - 복구 성공 시 경고 로그 후 계속 진행, 복구 불가 시에만 에러 throw
- [x] 267개 기존 단위 테스트 전체 통과 확인

> **현재 상태**: 로컬 `npx tsx scripts/test-real-pipeline.tsx` 재실행 후 PDF 품질 검증 대기 중

### 향후 개선 방향 (우선순위 순)

**단기 (다음 세션)**
- [ ] 분량 보강 후 PDF 재생성 및 섹션별 품질 검토
- [ ] 통변 지침 보강: DAN이 PDF 해석문을 직접 첨삭 → 첨삭본을 references/ 에 추가
  → `chunks.ts` CHAPTER_MAP에 신규 챕터 매핑
  → Phase 2 프롬프트에 "통변 지침" 섹션으로 주입
- [ ] 종합해석(10번 섹션) 누락 원인 조사 및 수정

**중기**
- [ ] Phase 2 섹션별 분리 호출 검토 (콘텐츠 품질이 여전히 부족할 경우)
- [ ] Prompt caching 실효 적용 (교안 청크 캐시 등록으로 반복 비용 절감)
- [ ] overallReading.perspectives 유파별 관점 3개 이상 생성 유도

**장기**
- [ ] references/ 자료 확충 → 시맨틱 검색(RAG) 전환 (벡터 DB 도입)
- [ ] 통변 지침 문서화 (`docs/tongbyeon/`) 체계화

---

## Phase 5 — 배포 & 운영 ⚫

> 하이브리드 배포: Netlify(프론트) + Fly.io(API). 상세: `docs/deployment-plan.md`

### M-GA. GA4 이벤트 추적 (배포 후 즉시)
- [ ] `gtag.js` 삽입 (Next.js Script 컴포넌트)
- [ ] 퍼널 이벤트 설계 및 발송:
  - `opening_start` → `dialogue_start` → `input_name` → `input_gender`
  - `input_birthdate` → `input_birthtime` → `input_city` → `submit`
  - `result_view` → `upsell_view` → `purchase_click` → `purchase_complete`
  - `gungham_click` → `redo_click`
- [ ] GA4 퍼널 리포트 설정 (단계별 이탈률 확인)
- [ ] 이탈 구간 분석 → UX 개선 피드백 루프

### M-ADS. 애드센스 (선택)
- [ ] 무료 랜딩(`app/free/`) 또는 Zone B 섹션 사이 광고 삽입
- [ ] 유료 결제 후 광고 제거 분기
- [ ] 애드센스 승인 요건 충족 (개인정보처리방침, 콘텐츠 충분성)

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
