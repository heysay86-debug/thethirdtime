# sajuweb

사주 분석 챗봇 웹서비스. 사용자가 생년월일시를 입력하면 사주팔자를 계산하고
Claude API를 통해 해석 및 대화형 인터랙션을 제공한다.

## 시작하기

1. Claude Code에서 이 디렉토리를 연다
2. `CLAUDE.md`를 먼저 확인 (프로젝트 전체 지침)
3. 작업 유형에 맞는 `docs/` 문서 확인

## 문서

| 문서 | 내용 |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | 프로젝트 전체 지침 (Claude Code 자동 로드) |
| [`docs/architecture.md`](./docs/architecture.md) | 시스템 구성 및 흐름 |
| [`docs/data-schema.md`](./docs/data-schema.md) | `data/` 폴더 파일 스키마 |
| [`docs/saju-engine-spec.md`](./docs/saju-engine-spec.md) | 사주 계산 엔진 명세 |
| [`docs/security.md`](./docs/security.md) | 보안 및 개인정보 지침 (강제 준수) |
| [`.claude/commands/README.md`](./.claude/commands/README.md) | 커스텀 커맨드 목록 |

## 프로젝트 구조

```
sajuweb/
├── CLAUDE.md                  프로젝트 지침 (Claude Code 자동 로드)
├── README.md                  이 파일
├── .gitignore                 커밋 제외 규칙
├── .env.example               환경변수 템플릿 (실제 .env는 gitignore)
├── data/                      lookup 테이블 (read-only)
│   ├── iljin.json             양력 → 일진 (1900~2049)
│   └── jeolip.json            연도 → 24절기 (1900~2049)
├── docs/                      온디맨드 참조 문서
│   ├── architecture.md
│   ├── data-schema.md
│   ├── saju-engine-spec.md
│   └── security.md
├── .claude/
│   └── commands/              Claude Code 커스텀 커맨드
│       ├── saju-individual.md
│       ├── saju-gungham.md
│       └── references/        명리학 이론 참고
├── engine/                    사주 계산 로직 (미구현)
├── api/                       Claude API 연동 (미구현)
└── frontend/                  채팅 UI (미구현)
```

## 데이터 출처

`data/` 폴더는 `/Users/dan/manse_work`에서 생성된 산출물.
원본 데이터 갱신 시 해당 폴더에서 재생성 후 복사.

## 현재 상태

- [x] 데이터 lookup 테이블 (iljin, jeolip)
- [x] 프로젝트 지침·문서 초안
- [ ] 기술 스택 결정
- [ ] 사주 계산 엔진 구현
- [ ] Claude API 연동
- [ ] 프론트엔드
- [ ] 배포 인프라

## 알려진 이슈

- 동지 절기 날짜 오차 (1903~): 전통 만세력과 KASI 천문계산 간 방법론 차이.
  1900~1902는 수기 수정 완료. 나머지는 향후 과제.

## 개발 규칙 요약

- 시크릿은 반드시 `.env`로 관리 (`.env.example` 참고)
- `data/` 폴더 파일은 read-only로 취급
- 개인정보(생년월일시) 로그·에러에 평문 노출 금지
- 상세 지침은 `docs/security.md` 필수 확인
