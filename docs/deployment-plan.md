# 배포 계획: 하이브리드 (Netlify + Fly.io)

## 아키텍처

```
[Netlify CDN] saju.betterdan.net (또는 www.betterdan.net/saju)
  └─ Next.js 정적 빌드 (프론트엔드)
     - Zone A: RPG 대화, 에셋, 배경 이미지
     - Zone B: 결과 표시, 양피지 카드
     - Zone C: 업셀, 푸터
     - fetch → NEXT_PUBLIC_API_URL

[Fly.io 무료] api-saju.fly.dev (커스텀: api.betterdan.net)
  └─ Node.js API 서버
     - POST /api/saju/analyze (엔진 + LLM Phase 1~3)
     - POST /api/saju/interpret (SSE 스트리밍)
     - 타임아웃 무제한
     - .env: ANTHROPIC_API_KEY
```

## 비용

| 항목 | 비용 |
|------|------|
| Netlify (프론트) | 무료 |
| Fly.io (API) | 무료 (3 VM, 256MB) |
| 도메인 | 기존 betterdan.net 활용 |
| LLM API | ~110원/건 (사용량 기반) |

## 구현 순서

### 1단계: 프로젝트 분리 준비
- [ ] 환경변수 분리: `NEXT_PUBLIC_API_URL` 추가
- [ ] 프론트엔드 fetch URL을 환경변수로 교체
- [ ] CORS 설정: API 서버에서 saju.betterdan.net 허용

### 2단계: Fly.io API 서버 배포
- [ ] fly.io 가입 + flyctl CLI 설치
- [ ] Dockerfile 작성 (Node.js + API routes)
- [ ] .env 시크릿 등록 (ANTHROPIC_API_KEY)
- [ ] `fly launch` → `fly deploy`
- [ ] 헬스체크 확인

### 3단계: Netlify 프론트엔드 배포
- [ ] `next.config.ts` output: 'export' 설정 (정적 빌드)
- [ ] Netlify에 Git 연결 → 자동 배포
- [ ] 환경변수 설정: NEXT_PUBLIC_API_URL=https://api.betterdan.net
- [ ] 커스텀 도메인 연결

### 4단계: DNS 설정
- [ ] api.betterdan.net → Fly.io CNAME
- [ ] saju.betterdan.net → Netlify CNAME (또는 기존 도메인 경로)

### 5단계: 검증
- [ ] 전체 흐름 테스트 (Zone A → API → Zone B)
- [ ] SSL 인증서 확인
- [ ] 모바일 테스트
