# sajuweb 프로젝트 지침

사주 분석 챗봇 웹서비스. 사용자가 생년월일시를 입력하면 사주팔자를 계산하고
Claude API를 통해 해석·대화 인터랙션을 제공한다.

## 작업 원칙 (필수 준수)

1. **보안 최우선**: API 키·비밀값은 절대 코드·커밋에 포함하지 않는다. 반드시 `.env`로 관리.
   상세 규정: `docs/security.md`
2. **데이터 무결성**: `data/iljin.json`, `data/jeolip.json`은 read-only로 취급.
   수정 필요 시 반드시 원본 프로젝트(`/Users/dan/manse_work`)에서 재생성 후 복사.
3. **명리학 이론 기준**: 이석영『사주첩경』을 계산 및 격국·용신 판단의 1차 기준으로 삼는다.
   해석 단계에서는 현대적 5개 유파(자평진전·적천수·궁통보감·명리정종·滴天髓 계열)를 보조 참고로 활용,
   다양한 시각을 병기한다. 자의적 해석 또는 이론 근거 없는 즉흥 해석은 금지.
   상세: `docs/saju-engine-spec.md`, `docs/interpretation-policy.md`, `.claude/commands/` 내 사주 커맨드 파일
4. **개인정보 최소 수집**: 생년월일시 외 불필요한 정보 수집 금지.
5. **검증 우선**: 사주 계산 로직은 단위 테스트로 검증. 알려진 레퍼런스 사주로 확인 후 배포.

## 세션 시작 시 필수 절차 (매번 실행)

**새 세션을 시작하면 반드시 아래 순서를 따른다.**

1. `docs/dev-roadmap.md` 를 읽어 현재 Phase와 미완료 항목(`[ ]`)을 확인한다.
2. 미완료 항목 중 첫 번째를 현재 작업 대상으로 설정하고 사용자에게 보고한다.
3. 사용자가 별도 지시를 하지 않으면 해당 항목부터 착수한다.
4. 항목 작업이 끝나면 결과를 사용자에게 보고하고 **확인을 받은 후에만** `dev-roadmap.md`의 `[ ]`를 `[x]`로 업데이트한다. 사용자 승인 없이 임의로 완료 처리하지 않는다.

> 이유: 세션이 바뀌면 이전 진행 상황이 초기화된다. 로드맵을 매번 확인해야 맥락 없이 중복 작업하거나 순서를 건너뛰는 것을 방지할 수 있다.

## 작업 유형별 참고 문서

특정 작업 시 해당 문서를 추가로 읽는다.

| 작업 유형 | 읽을 문서 |
|---|---|
| 데이터 구조 관련 | `docs/data-schema.md` |
| 사주 계산 로직 구현 | `docs/saju-engine-spec.md` |
| 시스템 구성·흐름 확인 | `docs/architecture.md` |
| 보안·개인정보 관련 | `docs/security.md` |
| 해석 유파 정책 | `docs/interpretation-policy.md` |
| 격국 판정 체크리스트 | `docs/gyeokguk-checklist.md` |
| 사주 해석·명리학 | `.claude/commands/saju-individual.md`, `saju-gungham.md` |
| UI·디자인 관련 | `DESIGN.md` |
| 통변(해석문) 작성 | `docs/tongbyeon/INDEX.md` → 해당 섹션 지침 원본 |
| LLM 프롬프트 수정 | `src/gateway/prompts/XX-name.prompt.md` (지침 원본에서 증류) |

## 현재 구현 상태

- [x] 데이터 lookup 테이블 (iljin.json, jeolip.json, 1900~2049)
- [ ] 사주 계산 엔진 (연·월·일·시주 산출)
- [ ] Claude API 연동 (채팅 인터페이스)
- [ ] 프론트엔드 UI
- [ ] 세션·대화 관리
- [ ] 배포 인프라

## 미결 이슈

- 동지 절기 날짜 오차: 1900~1902는 수정 완료, 1903년 이후 미수정
  (상세: `/Users/dan/manse_work/logs/2026-04-15_작업로그.md`)

## 기술 스택 (2026-04-15 확정)

- 백엔드: **TypeScript / Node.js** (fortuneteller-main 참조 기반)
- 프론트엔드: Next.js (SSR + API Routes 통합 편의)
- 세션 저장: Redis (추후 확장 고려) 또는 서버 메모리 (MVP)
- DB: SQLite (MVP) → PostgreSQL (Phase 2 이후)
- 배포: 미확정 (Fly.io / Vercel / VPS 중 선택)
- 참고 코드: github.com/hjsh200219/fortuneteller (MIT 추정, LICENSE 파일 미확인 — 라이선스 확인 전 clean-room 참조)

## 절대 하지 말 것

- API 키 하드코딩
- 개인정보(생년월일시 포함) 로그·에러메시지에 평문 출력
- 이석영 사주첩경 기준 검증 없이 특정 유파 해석을 1차 출력으로 사용
- 명리학 이론 근거 없는 즉흥적 해석
- `data/` 폴더 파일 직접 수정 (원본 재생성 경로 유지)
- 검증 없이 프로덕션 배포
