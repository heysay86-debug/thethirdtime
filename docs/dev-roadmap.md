# sajuweb 개발 로드맵

최종 업데이트: 2026-04-29
GitHub: https://github.com/heysay86-debug/thethirdtime
라이브: https://saju-api-rough-shadow-6686.fly.dev/alt2
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

## 2026-04-25 코드베이스 실구현 점검 메모

> Claude와 병행 개발하며 기록 누락이 있었던 부분을 보완하기 위해, 로컬 코드베이스 기준으로 실제 구현 범위를 재확인함.

### 확인 결과 요약 (2026-04-27 갱신)

- 사주 엔진, LLM 게이트웨이 (Phase 1~3), 웹 API, alt2 프론트엔드, PDF 리포트, 어드민, SQLite/Supabase 연동, GA4, 육효점(`/hyo`) 구현 완료.
- 부가 콘텐츠: `/contact`, `/faq`, `/guide/saju`, `/blog` (25편), 메인 메뉴, 게임 메뉴.
- 엔진 확장: 오행 분석, 지지합(삼합/방합/육합/반합), 천간충, 연애운.
- PDF 확장: 일간 상세, 오행 상태, 십성 상세, 지지 합충, 대운 상세, Phase 3 쉬운 풀이.
- 보안: CSP/보안 헤더, 어드민 쿠키 인증 전환.

### 로컬 검증 결과

- `npm run build`: 2026-04-27 기준 빌드 성공.
- `npm test`: 345개 테스트 통과 (2026-04-28 기준).

### 특히 기억할 현재 상태

- Phase 3 통변 확장 (쉬운 풀이) 구현 완료.
- 번외편 3종 엔진 완료: 연애운, 금전운, 사업운.
- 3장 궁합 기능 완성: 엔진 + API + 프론트 + 비주얼.
- 카카오 로그인 + 골골 시스템 기반 구축.
- 애드센스 심사 요청 완료, betterdan.net 루트 도메인 SSL.
- SNS 마케팅 준비: Buffer + Canva 템플릿 + 첫 캐러셀.

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
- [x] 시스템 프롬프트 (`src/gateway/prompts/system.ts`) — 역할·원칙·서술 지침
- [x] Phase 2 전용 프롬프트 (`SAJU_SYSTEM_PROMPT_PHASE2`) — JSON 구조 명시 + 분량 기준
- [x] 프롬프트에서 특정 서적명 제거 ("이석영 사주첩경" 워딩 삭제)
- [x] 통변 지침(tongbyeon/)은 LLM 프롬프트에 포함하지 않음 (Phase 3 전용)
- [x] Phase 1 tool: `src/gateway/tools/saju_core.ts` (summary + 3 readings)
- [x] Phase 2 tool: `src/gateway/tools/saju_interpretation.ts` (coreJudgment 제외, 스키마 참조용)
- [x] Phase 2 Zod 스키마: `Phase2ResultSchema` (`src/gateway/prompts/schema.ts`)
- [x] Prompt caching 로깅 구현 (현재 토큰 합산 미달로 캐시 미작동, Phase 3 이후 재평가)

### M16. LLM 게이트웨이 ✅
- [x] `src/gateway/gateway.ts` — 2단계 구조 (`analyzePhase1`, `analyzePhase2`)
- [x] Phase 1: tool use + `messages.create()` (Haiku, ~10초)
- [x] Phase 2: 텍스트 스트리밍 + `JSON.parse()` + `Phase2ResultSchema.parse()` (TTFT ~1초, 212 chunks)
- [x] 캐시 히트율 로깅 (`cache_creation_input_tokens`, `cache_read_input_tokens`)
- [x] 개인정보 주입 방지 검증 — analyze/interpret/pdf/admin-pdf 4개 API 모두 sanitize 적용

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

### M17.5. 통변 확장 (LLM Phase 3) ✅ (2026-04-27)
- [x] Phase 3 LLM 호출: Phase 2 농축 해석 + 엔진 데이터 → 쉬운 풀이 확장
  - Haiku + tool use 방식으로 구현
- [x] `src/gateway/gateway.ts` — `analyzePhase3()` 메서드 추가
- [x] `src/gateway/prompts/phase3-system.ts` — Phase 3 전용 프롬프트
- [x] `src/gateway/prompts/phase3-examples/` — 페어 예시 파일
- [x] PDF 파이프라인 통합: `EasyReadingBox` 컴포넌트로 Phase 3 쉬운 풀이 삽입
- [ ] 웹 파이프라인: Phase2 즉시 표시 → Phase3 도착 시 교체

### M17.6. 번외편 — 연애운·금전운·사업운 🟡 진행 중
- [x] 연애운 엔진: `src/engine/love_reading.ts`
  - 3단계 구조: 배우자궁 + 연애성향 + 인연 초상화
  - 생지/왕지/고지 프레임, 도화/홍염/원진 신살 연동, 대운 시기 + 도화 세운 산출
- [x] 금전운 엔진: `src/engine/money_reading.ts` (2026-04-28)
  - 3단계: 재성궁 분석 → 금전 성향 → 재물 시기
  - 편재/정재 판별, 재성 세력, 신강약×재성 조합, 대운/세운 시기 추출
- [x] 사업운 엔진: `src/engine/business_reading.ts` (2026-04-28)
  - 3단계: 관성+재성 복합 → 업종 적성 → 사업 시기
  - 사업적성 점수(0~100), 용신별 추천/비추 업종, 주의 시기
- [ ] Phase 2 프롬프트에 번외편 섹션 지침 추가
- [ ] PDF 번외편 섹션 컴포넌트
- [ ] 웹 Zone B에 번외편 영역 추가

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

### alt1 / alt2 분기 ✅
- [x] 기존 구현을 `app/alt1/`로 이전. `app/page.tsx`는 alt2 redirect.
- [x] `app/alt2/` RPG형 스토리텔링 버전 구현 완료
  - Zone A: RPG 대화 시퀀스 (DialoguePlayer + 대화형 입력 수집)
  - Zone B: 무료 결과 (조견표 + 대운 + 세운 + 오행 + 양피지 해설)
  - Zone C: 업셀 (궁합 + 심층 해석 CTA)
  - 오프닝 시퀀스 (로고 + 슬로건 + 기둥 프레임 디졸브)
  - 4단계 배경 전환 (before→after→inside_sun/moon→past)
  - DotCharacter 4방향 스프라이트 + PATH 이동 시퀀스
  - cast 이펙트 (캐릭터 회전 연출 + 방사형 밝기)
  - 흔들림+플래시 트랜지션 (inside→past)
  - thought 스타일 (유저 내면 대사)
  - redo 모드 (다시하기 → 짧은 대화 + InputModal)
  - BGM (crystalfield.mp3, 로딩 대기, visibility 제어)
  - PWA manifest + iOS 줌 방지
- [x] alt2를 메인으로 확정 (루트 → /alt2 redirect)

### M-SEO. 검색엔진 최적화 → Phase 5 M-SEO로 이동 ✅

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
  - 08 십이운성 분석 (배치 테이블·운성별 해설 카드)
  - 09 형충파해합·신살 (관계 카드·신살 칩)
  - 10 대운 흐름 (대운표·세운표·현재 분석)
  - 11 종합 해석 (총평 배너·주분석·현대적 적용)
  - 목차·섹션 번호 업데이트 (십이운성 추가에 따른 재조정)
  - OverallReadingSection 서적명 제거 ("명리학 종합 분석"으로 변경)
- [x] `scripts/test-real-pipeline.tsx` — 엔진→Phase1→Phase2→PDF 통합 스크립트
- [x] `scripts/dump-engine-result.tsx` — 엔진 결과 JSON 덤프 스크립트

### M-PDF-1.5. PDF 레이아웃 개선 ✅ (2026-04-19)
- [x] 주별 심층 분석 — LLM 제거, 키워드 테이블 기반 결정적 생성
  - `src/pdf/utils/pillarKeywords.ts` — 십성·십이운성 주별 키워드 + 자연어 조립
  - 연주+월주 / 일주+시주 페어 카드로 합체 (4→2카드)
  - 지장간 표시 제거 (해석 없이 공간 낭비)
  - Phase 2 토큰 42% 감소, 생성 시간 38% 단축
- [x] 대운/세운 타임라인 — 한자+한글 인라인 (庚子 경자, 줄바꿈 제거)
- [x] 대운 섹션 원래 레이아웃 복원 + 셀 글자 크기 소폭 상향
- [x] 신살 — 주별(연주/월주/일주/시주) 그룹 정렬 + 한 줄 해설 35종 수록
- [x] 전체 섹션 간격 축소 (sectionSubtitle 20→10, titleDivider 20→14)
- [x] 한자 폰트 메트릭 수정 — DroidSans 글리프 advance 900→792 통일 (비뚤거림 해결)
- [x] 표지에 리포트 번호 표시
- [x] PDF 파일명에 리포트 번호 사용 (T3-00-260419-A0010000.pdf)
- [x] 프론트에서 reportNo 전달 (analyze 응답 → PDF 요청)

### M-PDF-1.6. JSON 파서 강화 ✅ (2026-04-19)
- [x] `robustParsePhase2()` — 5단계 fallback → 단일 함수로 통합
  - 직접 파싱 → 줄바꿈 수정 → 첫 JSON 추출+나머지 병합 → 절단 복구
  - LLM이 sections 바깥에 키를 쓰는 패턴 자동 병합
- [x] `patchMissingSections()` — johu/currentPeriod/upcoming/modernApplication 바깥 이탈 복구
- [x] Phase 2 콘텐츠 검증 + 자동 재시도 (핵심 2개 이상 누락 시 1회 재시도)
- [x] 괄호 균형 검사 — 절단된 JSON에서 lastBrace 슬라이싱 건너뛰기

### M-PDF-1.7. 동시접속 제한 ✅ (2026-04-19)
- [x] `src/middleware/concurrency.ts` — 세마포어 (MAX_CONCURRENT=5)
- [x] 초과 시 503 + "지금 다른 여행자의 운명을 읽고 있습니다" 안내
- [x] 캐시 히트 시 슬롯 즉시 반환, finally 블록 안전 해제
- [x] 어드민 대시보드에 동접 현황 표시

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
- [x] 종합해석(10번 섹션) 누락 — 현재 정상 출력 확인 (2026-04-27)

**중기**
- [ ] Phase 2 섹션별 분리 호출 검토 (콘텐츠 품질이 여전히 부족할 경우)
- [ ] Prompt caching 실효 적용 (교안 청크 캐시 등록으로 반복 비용 절감)
- [ ] overallReading.perspectives 유파별 관점 3개 이상 생성 유도

**장기**
- [ ] references/ 자료 확충 → 시맨틱 검색(RAG) 전환 (벡터 DB 도입)
- [ ] 통변 지침 문서화 (`docs/tongbyeon/`) 체계화

---

## Phase 5 — 배포 & 운영 🟡 진행 중

> 하이브리드 배포: Netlify(프론트) + Fly.io(API). 상세: `docs/deployment-plan.md`

### M-DEPLOY. Fly.io 배포 ✅
- [x] Dockerfile + standalone 빌드
- [x] Fly.io 앱 생성 (도쿄 nrt, shared-cpu-1x 1GB RAM)
- [x] 영구 볼륨 1GB (SQLite DB 저장)
- [x] 시크릿 등록 (ANTHROPIC_API_KEY, SESSION_SECRET)
- [x] 프록시 타임아웃 300초 (fly_proxy_timeout 메타데이터)
- [x] 파일 권한 수정 (chungan/jiji 폴더)
- [x] 라이브: https://saju-api-rough-shadow-6686.fly.dev/alt2
- [ ] 커스텀 도메인 연결 (saju.betterdan.net)
- [ ] Netlify 프론트 분리 (하이브리드 구조 완성)

### M-API. API 안정화 ✅
- [x] CORS 설정 (app/api/cors.ts)
- [x] Phase 2 JSON 추출 강화 (extractFirstJsonObject)
- [x] 누락 섹션 자동 패치 (patchMissingSections)
- [x] Phase 2 프롬프트 JSON 구조 명시
- [x] max_tokens 12000
- [x] PDF 생성 API (/api/saju/pdf) — 서버사이드 렌더링 + 다운로드
- [x] 환경변수 분리 (NEXT_PUBLIC_API_URL)
- [x] Phase 2: Haiku 텍스트 스트리밍 → Sonnet 4.5 tool use 전환 (JSON 안정성 확보)
- [x] robustParsePhase2() 통합 JSON 파서 + sections 이중 래핑 정규화
- [x] 콘텐츠 검증 + 자동 재시도 (핵심 섹션 2개 이상 누락 시 1회 재시도)
- [x] 동시접속 제한 (MAX_CONCURRENT=5, 503 대기 안내)
- [x] 한자 표기 규칙: 천간/지지/오행 39자만 허용, 나머지 한글 강제

### M-WEB-REPORT. 웹 리포트 표시 ✅
- [x] CTA 버튼 클릭 → Phase 2 SSE 호출 → 웹에서 전체 해석 양피지 카드 렌더링
- [x] PDF 다운로드 버튼 (서버사이드 PDF 생성 후 blob 다운로드)
- [x] Content-Disposition UTF-8 한글 파일명

### M-UX. 프론트엔드 UX 개선 ✅
- [x] 프로모션 가격 시스템 (pricing.ts, 날짜 기반 자동 할인)
- [x] GunghamUpsell 대화형 궁합 업셀 (intro→select→offer→declined)
- [x] ParchmentCard 양피지 해설 카드 + ## 소제목 파싱
- [x] Zone B 불투명 배경 (#2d3440) + Zone C silverlining 분리
- [x] PillarTable 십이운성+신살 컬럼 내부 통합 + 참고사항
- [x] DaeunTimeline 강화 (대운수, 길운, 평가, 형충합, 용신관계)
- [x] SeunCard 세운 버그 수정 (engine.seun 경로) + analysis 표시
- [x] 상단/하단 로고 워터마크 + 오프닝 슬로건
- [x] Portrait 가로형 캐릭터 contain 모드
- [x] 키보드 컨테이너 고정 (overlays-content + visualViewport)
- [x] 입력 필드 fontSize 16px (iOS 줌 방지)
- [x] 에러 시 배경 상태 초기화
- [x] CTA 로딩 중 재클릭 알림
- [x] 대화 텍스트 1줄 17자 제한 (wrapText)
- [x] 준비되었나? 확인 버튼 (submit 전 유저 동의)
- [x] ZoneTransition timezone 배경 + 춤추는 캐릭터 (dance1/2)
- [x] DialoguePlayer: show_choices 줄 타이핑 중 탭 건너뛰기 방지
- [x] PDF 다운로드: 전체 화면 로딩 오버레이 (프로그레스 바 + 팁 로테이션, 광고 영역 예비)
- [x] PDF 파일명에 리포트 번호 사용 + 표지에 번호 표시
- [x] PDF 유저 이름 연결 ('분석 대상자' → 유저 입력 이름)
- [x] 배경 이미지 최적화: poll.png 1.5MB→120KB, silverlining.jpg 1.9MB→13KB (WebP 전환)
- [x] 클라이언트 번들 경량화: lunar_lookup.json(4.5MB) → leap-months-lite.ts(607B)

### M-DB. 익명화된 고객정보 데이터베이스 ✅
- [x] SQLite + better-sqlite3 + Fly.io 영구 볼륨 (/data/reports.db)
- [x] reports 테이블: report_no(PK), channel, char_name(마스킹), keyword1~3, is_paid, created_at
- [x] payments 테이블 (휘발성): order_id(PK), report_no, created_at — 48시간 자동 삭제
- [x] counter 테이블: 결제 유저 카운트 관리
- [x] 이름 마스킹 저장 (이대운→이*운, 이현진→이*진)
- [x] 결제 ID 분리: reports에서 order_id 제거 → payments 테이블로 분리 (개인정보보호)
- [x] 리포트번호: T3-XX-YYMMDD-A001XXXX (XX=결제카운트, A001=유입채널, XXXX=순번)
- [x] 유입채널 추적 6종 (A001~A006) + URL ?ch= 파라미터
- [x] 핵심키워드 자동 추출 (격국, 신강/신약, 용신) — 필드명 수정 완료 (type/state/primary)
- [x] analyze API 연동 (자동 저장, 실패 시 서비스 영향 없음)
- [x] upgradeToPaid() — 무료→유료 리포트 전환 함수

### M-ADMIN. 어드민 대시보드 ✅
- [x] `/admin` 페이지 — 토큰 인증 로그인
- [x] 리포트 탭: 검색(번호/이름/격국), 채널 필터, 유료/무료 필터, 행별 삭제
- [x] 결제 탭: payments 테이블 조회 (report_no 키로 reports와 연결)
- [x] 카운터 탭: 일별 전체/무료/유료 통계 + 누적 합산
- [x] PDF 강제 생성 탭: 명식 입력 → 엔진+LLM+PDF 다운로드 (CS 대응용)
- [x] 통계 카드: 전체/오늘/유료/동접(current/max) 실시간 표시
- [x] 5분 자동 새로고침
- [x] ADMIN_TOKEN 환경변수 인증 (Fly.io secrets)
- [x] PDF 강제 생성: 전용 API(/api/admin/generate-pdf) + 시간 모름 체크박스
- [x] 환영 메시지 ("어서오세요, 시간의 관리자여!")
- [x] fetch 타임아웃 5분 확장 (Sonnet 응답 대기)

### M-SEO. 검색엔진 최적화 ✅ (2026-04-21)
- [x] 루트 메타태그: title template, OG(Open Graph), Twitter 카드, canonical
- [x] alt2 메타태그: viewport 분리 (Next.js 16 경고 해소), OG 추가
- [x] robots.txt: API/어드민/alt1 차단, 메인 허용
- [x] sitemap.xml: 동적 생성 (alt2 priority 1.0, 법적 페이지 0.3)
- [ ] Google Search Console 등록 (도메인 확정 후)
- [ ] Naver Search Advisor 등록
- [ ] OG 이미지 제작 (SNS 공유 미리보기)

### M-SUPABASE. Supabase 연동 ✅ (2026-04-21)
- [x] Supabase 프로젝트 생성 (thethirdtime, 도쿄 ap-northeast-1)
- [x] Storage 버킷 'reports' 생성 (PDF 보관)
- [x] src/db/supabase.ts: 지연 초기화 클라이언트 (빌드 타임 안전)
- [x] PDF 생성 시 Supabase Storage 자동 업로드 + 로컬 폴백
- [x] 업로드 비동기화 (fire-and-forget, PDF 응답 블로킹 없음)
- [ ] Auth 연동 (카카오 로그인 → Supabase Auth)
- [ ] DB 이전 (SQLite → Supabase PostgreSQL)

### M-PDF-QUALITY. PDF 콘텐츠 품질 ✅ (2026-04-22)
- [x] 십이운성 12종 해설: 엑셀 키워드 → 이석영 사주첩경 기반 총론+주별+십성별 구조
- [x] docs/tongbyeon/twelve-stages-reference.md 원본 저장
- [x] TwelveStagesSection 해설 카드: 총론 + 해당 주별 해석 함께 표시
- [x] PillarAnalysisSection: 십이운성×십성 교차 해석 반영
- [x] 한자 폰트 메트릭 통일 (DroidSans advance 900→792)
- [x] 천간/지지 아이콘 영문 파일명 전환 (Unicode NFC/NFD 문제 해결)
- [x] 신살 35종 한 줄 해설 + 주별 그룹 정렬
- [x] 표지 별 배치: 의사난수, 중앙 텍스트 영역 회피
- [ ] 리포트 톤 다듬기: 레퍼런스 텍스트 제공 후 프롬프트 반영 (대기 중)

### M-LEGAL. 법적 고지 사항 🟡 진행 중
- [x] 이용약관 페이지 (`/terms`) — 표준약관 제10023호 준용, 11개 조항
- [x] 개인정보처리방침 페이지 (`/privacy`) — 개인정보보호법 제30조 기반, 9개 항목
- [x] 사업자 정보 페이지 (`/business`) — 전자상거래법 제13조 기반
- [x] 푸터 링크 삽입 (opacity 0.01, 사업자 등록 후 노출)
- [x] 사업자 등록 완료 (베러댄스튜디오, 207-27-94576, 2026-04-27)
- [x] 사업자 정보 페이지 실데이터 반영 (상호, 대표자, 사업자번호, 소재지)
- [x] 푸터: 상호명 + 사업자번호 표시, 법적 링크 opacity 1로 변경
- [x] 이용약관/개인정보처리방침 시행일 반영 (2026-05-20)
- [ ] 통신판매업 신고 (준비 중)
- [ ] 통판번호 발급 후 사업자 정보 페이지 업데이트
- [ ] 이메일/전화번호 기재 (확정 후)
- [ ] 결제 UI에 "전체 동의" 체크박스 추가 (이용약관 + 개인정보 + 환불제한 동의)

### M-AUTH. 카카오 로그인 + 골골 시스템 🟡 진행 중
- [x] 카카오 로그인 연동 (OAuth, REST API + client_secret)
- [x] 유저 테이블: kakao_id, nickname, profile_image, email, golgol_balance, created_at, last_login_at
- [x] 메인 메뉴: 카카오로 시작하기 버튼 / 로그인 시 프로필+골골 잔액 표시
- [x] 로그아웃 기능
- [ ] 골골(骨) 시스템: 서비스 내 통용 화폐. 1골골 = ₩1,000 (부가세 별도)
- [ ] 카카오 채널 친구추가 시 골골 지급 (무료 체험)
- [ ] 골골 차감: 서비스 이용 시 소모 (리포트, 궁합 등 서비스별 단가 설정)
- [ ] 카카오톡 공유 API (추천 링크, 심사 불필요)
- [ ] (비즈니스 심사 후) 알림톡 — 리포트 완료 알림, PDF 이메일 자동 발송

### M-PAY. 결제 연동 (골골 충전)
- [x] 토스페이먼츠 가입 완료 (2026-04-27)
- [ ] 토스페이먼츠 SDK 연동 → 골골 충전
- [ ] 결제 전 동의 체크박스 (이용약관 + 개인정보 + 환불제한)
- [ ] 충전 패키지 설계 (예: 10골골 / 30골골 / 50골골 + 보너스)
- [ ] 결제 완료 → 골골 즉시 반영
- [ ] 결제 시작 시점에 백그라운드 Phase 1+2 호출 (대기시간 단축)
- [ ] savePaidReport() + upgradeToPaid() 연동

### M-GUNGHAM. 3장 — 인연의 거울 (궁합) ✅ (2026-04-28)
- [x] 궁합 엔진: `src/engine/gungham.ts` (1219줄)
  - 2인/3인 분석, 일간 오행 관계, 용신 교환, 지지 합충 교차 비교
  - 궁합 점수(0~100) + 5단계 등급
  - 관계 유형 5종별 해석 분기 (couple/parent_child/friend/business/boss_sub)
  - 관점 질문 3개 × 관계별 다른 세트 + "잘 모르겠어요" 공통
  - 관점 기반 2차 해석 재조합
  - 3인 그룹 역학 분석
- [x] API: `/api/saju/gungham` (LLM 없음, 비용 0원)
- [x] 프론트: `app/gungham/page.tsx`
  - 프리앰블 ("좋은 관계란" 4가지 메시지, 필수)
  - 관계 유형 카드 선택 → 본인(자동채움) + 상대 입력 → 3인 추가
  - 1차 결과 → 관점 질문 → 2차 맞춤 해석
- [x] 배경 맵: mirror.jpeg / mirror_after.jpeg + 플래시 전환
- [x] 복길 캐릭터: angel_dot (float) + cast 시퀀스 (angel_back/right/summon + sparkle)
- [x] BGM: memorialfield.mp3 (1.2MB, 64kbps mono)
- [x] Zone B 궁합 업셀 → /gungham?from=saju 연결 (유저 정보 자동 세팅)
- [x] 메인 메뉴 "3장 - 인연의 거울 (궁합)" 추가
- [x] 테스트 20건
- [ ] 궁합 결과 PDF 리포트
- [ ] 궁합 결과 공유 카드

### M-SHARE. 친구 공유 카드
- [ ] 공유용 카드 이미지 생성 (사주 요약 + QR/링크)
- [ ] 카카오톡 공유 API 연동
- [ ] 유입채널 A006 (친구 공유 카드) 추적

### M-HYO. 육효점 미니게임 🟡 진행 중 (2026-04-24)
> 정통 시초법(서죽점법) 기반 육효점. 별도 모듈(/hyo, src/hyo/)로 사주 본체와 분리.
> LLM 비용 0원, 클라이언트 전용. 애드센스 승인용 콘텐츠 다양성 + 체류시간 증가.
- [x] `src/hyo/sicho.ts` — 시초법 엔진 (대연지수 49, 삼변, 6→9 노음~노양)
- [x] `src/hyo/stages.ts` — 6개 스테이지 설정 + 신령 패스 (나무별 이동 좌표)
- [x] `app/hyo/page.tsx` — 메인 페이지 (탭 인터랙션, 카운팅 애니메이션, 효 쌓기)
- [x] `app/hyo/layout.tsx` — 전용 레이아웃 (Gaegu + Pretendard 폰트)
- [x] `public/background/hyo.jpeg` — 제단 배경 이미지
- [x] `public/character/hyo.png` — 복길 도인 캐릭터
- [x] `public/bgm/hyo.mp3` — 전용 BGM (64kbps, 1.3MB)
- [x] 64괘 해석 데이터 추출 (`src/hyo/gua-data.json`, 총론 + 384효 × 17카테고리)
- [x] 괘 해석 룩업 (`src/hyo/gua-lookup.ts`, 시초법→책 번호 매핑)
- [x] 팔궁 체계 (`src/hyo/gua-palace.ts`, 世應·지지·육친 알고리즘, 64괘 전수 매핑)
- [x] 정통 읽기 + 평서문 풀이 (`src/hyo/gua-reading.ts`)
- [x] 입장 다이얼로그 (alt2 하단고정 스타일, 복길 대사 + 유저 thought)
- [x] 복길 캐릭터 맵 위 표시 + 신령 패스 애니메이션 (스테이지별 나무 이동)
- [x] 변효 개수별 안내 (RPG 톤) + 효별 상세 카테고리 17종
- [x] 복사 버튼 (전체 + 효별) + 브랜드 출처 삽입
- [x] GA4 이벤트 (hyo_start, hyo_complete, hyo_copy)
- [x] sitemap.xml에 /hyo 추가 (이미 포함됨)
- [x] robots.txt에 /hyo + /blog + /faq + /contact + /guide 허용
- [ ] 괘 도표에 변효 하이라이트
- [ ] 맵 스크롤 (캐릭터 따라 뷰포트 이동)

### M-UX-2. 프론트엔드 UX 추가 개선 ✅ (2026-04-24)
- [x] GlossaryTip 컴포넌트 + glossary 데이터
- [x] favicon 아이콘 세트 (favicon.ico, 32px, 192px, 512px)
- [x] 대화창 글씨 18px, 초상화 축소 (lg 110→90), 패딩 확대
- [x] ▼ 인디케이터 금색 바운스 애니메이션
- [x] 오프닝 GM 메시지 ("BGM을 켜고 플레이하시면 더 재미있습니다")
- [x] 대화창 아이콘 제거

### M-QUEUE. 대기열 시스템 ✅ (2026-04-24)
- [x] 503 거절 → 대기열 방식 (waitForSlot, 최대 2분 대기)
- [x] 자리 나면 큐에서 자동 활성화 (release → next)
- [x] 대기 중 복길 대사 순환 (8초마다, 5개 메시지)
- [x] `/api/saju/queue` 상태 조회 API
- [x] 프론트 503 거절 메시지 제거

### M-STATS. 익명 통계 데이터 확장 ✅ (2026-04-24)
- [x] DB age_group 컬럼 추가 (10대미만~70대이상)
- [x] DB gender 컬럼 추가 (M/F)
- [x] 어드민 리포트 테이블에 연령/성별 표시
- [x] 기존 DB 자동 마이그레이션 (ALTER TABLE)

### M-GA. GA4 이벤트 추적 ✅ (2026-04-24)
- [x] `gtag.js` 삽입 (Next.js Script 컴포넌트, G-P88RY9HF2E)
- [x] `src/analytics.ts` — trackEvent 유틸
- [x] 퍼널 이벤트: opening_start → dialogue_complete → submit → result_view → upsell_click → pdf_download → redo_click
- [ ] GA4 퍼널 리포트 설정 (사업자등록+통판 완료 후 진행 예정)
- [ ] 이탈 구간 분석 → UX 개선 피드백 루프

### M-CABINET. 어드민 캐비넷 ✅ (2026-04-24)
- [x] `/api/admin/cabinet` — Supabase Storage PDF 목록 조회 + 서명 URL 다운로드
- [x] 어드민 캐비넷 탭 (검색, 페이지네이션, 개별 다운로드)

### M-SECURITY. 보안 보강 ✅ (2026-04-26)
- [x] CSP / X-Frame-Options / 보안 헤더 추가 (next.config.ts)
- [x] X-Frame-Options SAMEORIGIN (iframe 모달용) + frame-ancestors 'self'
- [x] 어드민 인증 쿠키 방식 전환 (URL 토큰 노출 제거, `src/middleware/admin-auth.ts`)

### M-CONTENT. 콘텐츠 페이지 ✅ (2026-04-26)
- [x] `/contact` 문의 페이지 + `/api/contact` 문의 API
- [x] `/faq` FAQ 페이지
- [x] `/guide/saju` 사주 가이드 페이지
- [x] 공통 레이아웃 컴포넌트: `PageShell`, `BoardFrame`, `BokgilSays`

### M-BLOG. 복길의 서고 (블로그) ✅ (2026-04-26~27)
- [x] `/blog` 목록 + `/blog/[slug]` 상세 (마크다운 기반)
- [x] `content/blog/` 25편 (사주 기초, 일간 10종, 십성 5종, 합충형, 대운세운, 육효점 등)
- [x] `src/lib/blog.ts` — 마크다운 파서 + frontmatter
- [x] `content/blog/CONTENT-GUIDE.md` — 블로그 작성 가이드
- [x] 도표 PNG 5종 (`public/blog/`: 삼합/방합/육합/오행/십신)
- [x] `scripts/generate-blog-diagrams.ts` — 도표 자동 생성 스크립트
- [x] 마크다운 이미지 렌더러 추가
- [x] `references/blog-chunks.json` — 블로그 RAG 청크 (1139줄)
- [x] `scripts/build-blog-chunks.ts` — 블로그 청크 빌드 스크립트
- [x] 게임 내 오버레이 서고 + 페이지네이션
- [x] 블로그 CTA 배너
- [x] sitemap.xml에 블로그 페이지 추가

### M-ENGINE-EXT. 엔진 확장 ✅ (2026-04-26~27)
- [x] `src/engine/oheng_analysis.ts` — 오행 분석 (왕상휴수사/발달/과다/고립)
- [x] `src/engine/relations.ts` — 지지합 확장 (삼합/방합/육합/반합) + 천간충 (4쌍)
- [x] `src/engine/love_reading.ts` — 연애운 엔진 (배우자궁+연애성향+인연초상화)
- [x] `src/gateway/chunks.ts` — RAG 청크 선별 주입 (사주 맞춤)

### M-PDF-EXT. PDF 섹션 확장 ✅ (2026-04-26~27)
- [x] `IlganDetailSection` — 일간 상세 프로필 섹션
- [x] `OhengStatusSection` — 오행 상태 분석 섹션
- [x] `SipseongDetailSection` — 십성 상세 해설 섹션
- [x] `JijiHapChungSection` — 지지 합충 관계 섹션
- [x] `DaeunDetailSection` — 대운별 한 줄 요약 추가
- [x] `EasyReadingBox` — Phase 3 쉬운 풀이 박스
- [x] 관계별 해설 텍스트 보강 (형충파해합 8종)
- [x] Paperlogy italic 폰트 에러 수정

### M-UX-3. 프론트엔드 UX 추가 개선 ✅ (2026-04-26~27)
- [x] 메인 메뉴 페이지 (board.png 배경, 히어로 섹션, 로고+카피)
- [x] 게임 메뉴 (햄버거, `GameMenu.tsx`) — 서고/FAQ/문의 iframe 모달, BGM 유지
- [x] 메뉴 버튼 탭 모션 (inset shadow)
- [x] 메인 BGM (Crystal Labyrinth, `crystal-labyrinth.mp3`)
- [x] BGM 자동재생 (첫 터치 시) + 볼륨 30% 감소
- [x] 오프닝 분기 ("와 본 적 있나?" 선택지)
- [x] 육효점 URL 직접 접근 차단 (메인 메뉴 해금 필요)
- [x] 카피라이트 추가
- [x] `OhengWangSang` 오행 왕상 결과 컴포넌트
- [x] 결과 저장 UX (`EmailSaveModal`, `SavePromptCard`, `SaveResultButton`)
- [x] 모달 내 링크 target="_top" 전역 적용
- [x] PageShell 로고 클릭 → 메인 이동

### M-ADMIN-EXT. 어드민 확장 ✅ (2026-04-27)
- [x] 의뢰서(문의) 탭: 조회/답변/완료 관리
- [x] 어드민 인증 API (`/api/admin/auth`)

### M-SNS. SNS 콘텐츠 ✅ (2026-04-26)
- [x] `.claude/commands/sns-content.md` — SNS 콘텐츠 생성 커맨드
- [x] `docs/sns-design-guide.md` — SNS 디자인 가이드

### M-CHAT. 카카오 채널 실시간 상담
- [ ] 카카오 채널 개설 (사업자 인증)
- [ ] 챗봇 API 연동 (카카오 i 오픈빌더 또는 웹훅)
  - Haiku 기반 복길 자동 응대 (건당 ~$0.001)
  - 사주/육효 FAQ 자동 답변, 복잡한 문의는 수동 전환
- [ ] 사이트 내 카카오 채널 상담 버튼 (친구추가 → 바로 채팅)
- [ ] (선택) 네이버 톡톡 — 스마트플레이스 유입 시 추가 검토

### M-ADS. 애드센스 🟡 진행 중
- [x] 애드센스 가입 + 스크립트 삽입 (ca-pub-8002064106147760)
- [x] 자동광고 설정
- [x] betterdan.net 루트 도메인 Fly.io 연결 (SSL 발급 완료)
- [ ] 유료 유저(골골 보유 or 구매 이력) 광고 제거 분기
- [ ] 게임 몰입 구간(다이얼로그, 주문 등) 광고 제외 설정
- [ ] 수익 데이터 기반 광고 위치 최적화

### M-SNS-MARKETING. SNS 마케팅 🟡 진행 중 (2026-04-28)
- [x] 인스타그램 비즈니스 계정 전환
- [x] 스레드 계정 연결
- [x] Buffer 가입 + 인스타/스레드 연동 (무료, 월 30개 예약)
- [x] Canva 템플릿 폴더 생성 (제3의시간 — SNS 템플릿)
- [x] 첫 캐러셀 5장 텍스트 완성 (서비스 소개)
- [x] 인스타 프로필 소개글 확정
- [x] `/sns-content` 스킬로 콘텐츠 생성 가능
- [ ] 첫 캐러셀 CTA 페이지 마무리 + Buffer 예약 발행
- [ ] 주 3회 콘텐츠 루틴 안착 (화 릴스, 목 캐러셀, 일 릴스)
- [ ] 틱톡 계정 추가 (인스타 안착 후)
- [ ] Meta Graph API 직접 연동 (트래픽 증가 시)

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
- [x] 콘텐츠 페이지: /guide/saju, /faq, /contact + 블로그 25편 (GEO 대비)

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
