---
name: 세션 2 작업 요약
description: 2026-04-17~18 세션. 배포, BGM, DB, PDF 다운로드, UX 개선, 법적 고지 구현 완료. 다음 세션에서 이어서 진행할 항목 포함.
type: project
---

## 세션 2 완료 (2026-04-17~18)

### 배포 상태
- **라이브 URL**: https://saju-api-rough-shadow-6686.fly.dev/alt2
- **인프라**: Fly.io (도쿄 nrt, 1GB RAM, 1GB 볼륨)
- **프록시 타임아웃**: 300초 (LLM 호출 대응)
- **커밋**: `469d14b` (main)

### 구현 완료
- Fly.io 배포 + SQLite DB (비식별 데이터)
- 리포트번호 체계: T3-XX-YYMMDD-A001XXXX
- 유입채널 추적 (A001~A006, URL ?ch= 파라미터)
- BGM (crystalfield.mp3, 8% 볼륨, 로딩 대기)
- PDF 다운로드 API (/api/saju/pdf)
- Phase 2 해석 웹 렌더링 (양피지 카드)
- cast 이펙트 (캐릭터 회전 + 방사형 밝기)
- PWA manifest + iOS 줌 방지
- 법적 고지 3페이지 (약관/개인정보/사업자 — 블랭크)
- redo 모드 (다시하기 → 짧은 대화)
- InputModal 이름 + 생시 모름 체크박스

### 알려진 이슈
- 모바일에서 cast 이펙트 간헐적 미표시 (requestAnimationFrame 적용했으나 완전 해결 미확인)
- bgPastFiredRef 리셋 관련 retry_birthdate 동작 불안정 가능성

### 다음 세션 우선 작업
1. 통변 후처리 Phase 3 (사용자 원고 대기 중 — 핵심판단, 대운/종합)
2. 번외편 (연애운/금전운/사업운) 구현
3. PDF 공백 레이아웃 개선
4. 토스페이먼츠 결제 연동 (사업자 등록 후)
5. GA4 이벤트 추적
6. 친구 공유 카드 기능
7. 도메인 연결 (saju.betterdan.net)
