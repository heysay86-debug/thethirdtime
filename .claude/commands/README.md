# Claude Code 커스텀 커맨드

이 폴더의 `.md` 파일은 Claude Code에서 `/파일명`으로 호출 가능한 커스텀 커맨드.

| 커맨드 | 용도 |
|---|---|
| `/saju-individual` | 개인 사주 심층 분석 리포트 생성 |
| `/saju-gungham` | 2인 이상 궁합 분석 |

## 원본 출처

Cowork 스킬(`~/.claude/skills/saju-individual`, `saju-gungham`)에서 이식.
프런트매터의 `trigger`, `depends_on` 필드는 Cowork 전용이며 Claude Code에서는
무시된다. 콘텐츠는 동일하게 작동.

## 참고 문서

`references/` 폴더에 명리학 이론 참고 문서가 포함됨.
- `sajucheomgyeong.md` — 이석영 『사주첩경』 요약
- `ohaeng-relation.md` — 오행 상생상극 관계
- `jiji-hapchung.md` — 지지 합충형파해
- `yongsin-guide.md` — 용신 추출 가이드

커맨드 실행 중 Claude가 필요 시 이 파일들을 읽도록 지침됨.

## 동지 절기 이슈 관련

`data/jeolip.json`의 동지 값은 KASI 천문계산 기준. 1900~1902는 사용자가 수기로
전통 만세력 값으로 수정. 1903년 이후는 미수정. 분석 결과 출력 시 주석 고려.
