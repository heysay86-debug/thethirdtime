# [대체됨 → 03-cowork-character-card.md 사용] Cowork 지시서 ②: 이미지 에셋 + OG/공유카드 + 오프라인 광고

> 이 지시서를 새 Cowork 세션에 붙여넣고 실행하세요.
> 작업 폴더: sajuweb (마운트 필요)

---

## 프로젝트 정보

- **서비스명**: 제3의시간 (the third time)
- **URL**: ttt.betterdan.net
- **로고**: `/public/icon/logo.svg`
- **캐릭터**: 복길 (시간의 마법사). 도트 캐릭터 PNG: `/public/character/` 폴더
- **게임 스크린샷**: `/public/background/` 폴더 내 이미지 참고
- **디자인 가이드**: `docs/sns-design-guide.md` (반드시 먼저 읽을 것)

## 컬러 팔레트

| 이름 | HEX | 용도 |
|---|---|---|
| Yellow | #f4dea6 | 포인트, 강조 텍스트 |
| Pink | #f2b6b6 | 서브 포인트, 감성 |
| Green | #97c6aa | 자연/치유/긍정 |
| Dark sky-blue | #618199 | 서브텍스트 |
| Dark navy | #3c4859 | 배경 |

---

## 요청 작업

### 작업 1: OG(Open Graph) 이미지

SNS에서 링크 공유 시 미리보기에 뜨는 이미지.

**메인 OG (1200×630px)**
- 배경: Dark navy (#3c4859) 또는 게임 분위기 그라데이션
- 중앙: 로고 + "제3의시간" 타이틀
- 서브카피: "RPG형 사주풀이" 또는 "시간의 마법사 복길이 읽어주는 당신의 운명"
- 하단: ttt.betterdan.net
- 출력: `public/og/og-main.png`

**블로그 OG (1200×630px)**
- 복길의 서고 느낌. 책장/양피지 분위기.
- "복길의 서고 — 사주 이야기"
- 출력: `public/og/og-blog.png`

**육효점 OG (1200×630px)**
- 신비로운 제단 분위기 (hyo.jpeg 참고)
- "복길의 시초점 — 정통 육효점"
- 출력: `public/og/og-hyo.png`

### 작업 2: 카카오톡 공유 카드

카카오톡으로 링크 공유했을 때 뜨는 카드.

**기본 공유 카드 (800×400px)**
- 좌: 복길 캐릭터
- 우: "제3의시간 — RPG형 사주풀이" + 짧은 훅 카피
- 배경: Dark navy
- 텍스트: Yellow
- 출력: `public/og/kakao-share.png`

**결과 공유 카드 템플릿 (800×400px)**
- "나의 사주 한줄 요약" + 격국/용신 자리에 플레이스홀더 텍스트
- 하단: "제3의시간에서 확인하기"
- 출력: `public/og/kakao-result-template.png`

### 작업 3: 인스타그램 템플릿

**피드 템플릿 (1080×1350px, 4:5)**
- 기본 레이아웃: sns-design-guide.md의 캐러셀 구조 따름
- 표지용 1장 + 내지용 1장 + CTA용 1장 = 3장 세트
- 배경: Dark navy + 게임 스크린샷 오버레이 (opacity 30%)
- 출력: `docs/marketing/assets/insta-template-cover.png`, `insta-template-body.png`, `insta-template-cta.png`

**스토리 템플릿 (1080×1920px, 9:16)**
- 상단: 복길 말풍선
- 중앙: 콘텐츠 영역
- 하단: 스와이프업 CTA 영역
- 출력: `docs/marketing/assets/insta-story-template.png`

### 작업 4: 코인노래방 오프라인 광고

**벽보 (A3, 297×420mm, 300dpi = 3508×4961px)**
- 레이아웃:
  - 상단 1/3: "운명을 읽어드립니다" + 복길 캐릭터
  - 중앙: 서비스 설명 3줄 이내 ("RPG형 사주풀이 / 정통 명리학 기반 / 무료 체험 가능")
  - 하단: QR코드 (ttt.betterdan.net 링크) + "카메라로 스캔하세요"
- 컬러: Dark navy 배경, Yellow 텍스트
- 출력: `docs/marketing/assets/poster-a3.png`

**노래방 대기화면 (1920×1080px, 16:9)**
- 5초 안에 눈에 들어와야 함
- 대형 텍스트: "노래 부르기 전에, 운명 한번 볼까?"
- 서브: "QR 스캔 → 무료 사주풀이" + QR코드
- 복길 캐릭터 우측 하단
- 출력: `docs/marketing/assets/screen-ad-16x9.png`

---

## 제작 시 주의사항

1. `docs/sns-design-guide.md`를 반드시 먼저 읽고 톤/컬러/레이아웃 규칙을 따를 것
2. 복길 캐릭터는 `/public/character/` 폴더의 실제 PNG를 사용할 것 (새로 그리지 말 것)
3. 로고는 `/public/icon/logo.svg` 사용
4. QR코드는 플레이스홀더로 표시 (실제 QR은 나중에 교체)
5. 텍스트는 한국어, 폰트는 Pretendard 또는 시스템 고딕 계열
6. canvas-design 스킬을 활용해서 PNG로 생성

## 출력 폴더 구조

```
public/og/
  og-main.png
  og-blog.png
  og-hyo.png
  kakao-share.png
  kakao-result-template.png

docs/marketing/assets/
  insta-template-cover.png
  insta-template-body.png
  insta-template-cta.png
  insta-story-template.png
  poster-a3.png
  screen-ad-16x9.png
```

완료 후 "이미지 에셋 생성 완료" 라고 알려줘.
