# 제3의시간 캐릭터 카드 - 구현 로직 문서

**작성일**: 2026-04-18  
**상태**: 설계 완료 (모바일 + 데스크톱 협업)  
**크기**: 600×900px 픽셀아트 카드

---

## 📋 목차
1. [입력 데이터](#입력-데이터)
2. [사주 계산 엔진](#사주-계산-엔진)
3. [스탯 생성 로직](#스탯-생성-로직)
4. [카드 렌더링](#카드-렌더링)
5. [특수 이펙트](#특수-이펙트)
6. [구현 흐름도](#구현-흐름도)

---

## 입력 데이터

### 유저 입력
```javascript
{
  name: string,           // 사용자 이름
  birthDate: Date,        // YYYY-MM-DD HH:MM 형식
  gender: 'M' | 'F'       // 옵션 (여성 기준 음력 변환 필요)
}
```

---

## 사주 계산 엔진

### 1단계: 4기둥 계산 (년월일시)

**입력**: 생년월일시 (양력, UTC 기준)  
**출력**: 4기둥 간지 + 일간 오행

```javascript
function calculate4Pillars(birthDate) {
  const year = getHeavenlyStemEarthlyBranch(birthDate.year);    // 연주 (천간 + 지지)
  const month = getHeavenlyStemEarthlyBranch(birthDate.month);  // 월주
  const day = getHeavenlyStemEarthlyBranch(birthDate.day);      // 일주
  const hour = getHeavenlyStemEarthlyBranch(birthDate.hour);    // 시주
  
  return {
    year,      // { stem: '丙', branch: '寅' }
    month,     // { stem: '丁', branch: '酉' }
    day,       // { stem: '壬', branch: '戌' }
    hour,      // { stem: '庚', branch: '子' }
    mainStem: day.stem  // 일간 (게임 속성 결정)
  };
}
```

### 2단계: 오행 분포 계산

**입력**: 4기둥 (년월일시 천간 + 지지의 지장간)  
**출력**: 5개 오행의 개수 배열

```javascript
function calculateWuxingDistribution(pillars) {
  // 천간 오행 맵핑
  const stemToWuxing = {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水'
  };
  
  // 지지 지장간 맵핑 (최대 3개)
  const branchToWuxing = {
    '子': ['水'],
    '丑': ['土', '金', '水'],
    '寅': ['木', '火', '土'],
    '卯': ['木'],
    '辰': ['土', '木', '水'],
    '巳': ['火', '金', '土'],
    '午': ['火'],
    '未': ['土', '火', '金'],
    '申': ['金', '水', '土'],
    '酉': ['金'],
    '戌': ['土', '火', '金'],
    '亥': ['水', '木']
  };
  
  let wuxingCount = {
    '水': 0,
    '火': 0,
    '木': 0,
    '金': 0,
    '土': 0
  };
  
  // 천간 오행 계산
  [pillars.year.stem, pillars.month.stem, pillars.day.stem, pillars.hour.stem]
    .forEach(stem => wuxingCount[stemToWuxing[stem]]++);
  
  // 지지 지장간 계산
  [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch]
    .forEach(branch => {
      branchToWuxing[branch].forEach(wuxing => wuxingCount[wuxing]++);
    });
  
  return wuxingCount;  // { 水: 2, 火: 0, 木: 1, 金: 0, 土: 1 }
}
```

### 3단계: 신강약 점수 계산

**입력**: 일간 + 4기둥의 관계  
**출력**: 신강약 점수 (0~100)

```javascript
function calculateShenQiangRuo(pillars, wuxingCount) {
  // 일간 오행
  const mainWuxing = wuxingToWuxing(pillars.mainStem);
  
  // 일간과 같은 오행의 개수
  const sameCount = wuxingCount[mainWuxing];
  
  // 일간을 생하는 오행 (목생화, 화생토, 토생금, 금생수, 수생목)
  const supportingWuxing = getSupportingWuxing(mainWuxing);
  const supportCount = wuxingCount[supportingWuxing];
  
  // 일간을 극하는 오행
  const restrainingWuxing = getRestrainingWuxing(mainWuxing);
  const restrainCount = wuxingCount[restrainingWuxing];
  
  // 신강약 점수 계산 (0~100)
  // 공식: (비견·겹재 + 인성×2) / 전체 × 100
  const shengqiangRuo = ((sameCount + supportCount * 2) / (sameCount + supportCount + restrainCount)) * 100;
  
  return {
    score: Math.round(shengqiangRuo),
    category: classifyStrength(shengqiangRuo)
      // 신강 (70~100)
      // 중화 (40~70)
      // 신약 (0~40)
  };
}
```

---

## 스탯 생성 로직

### 1. 주속성 매핑 (일간 오행)

```javascript
const wuxingToAttribute = {
  '水': { color: '#1E90FF', name: '마법사', type: 'Magic' },
  '火': { color: '#FF4500', name: '전사', type: 'Attack' },
  '木': { color: '#228B22', name: '궁수', type: 'Nature' },
  '金': { color: '#A9A9A9', name: '기사', type: 'Defense' },
  '土': { color: '#DAA520', name: '조율자', type: 'Balance' }
};

function getMainAttribute(mainStem) {
  const wuxing = stemToWuxing[mainStem];
  return wuxingToAttribute[wuxing];
}
```

### 2. HP 배치 (신강약 기반)

```javascript
function calculateHP(shengqiangRuo) {
  if (shengqiangRuo >= 70) {
    // 신강: 80~100
    return Math.round(80 + (shengqiangRuo - 70) / 30 * 20);
  } else if (shengqiangRuo >= 40) {
    // 중화: 50~80
    return Math.round(50 + (shengqiangRuo - 40) / 30 * 30);
  } else {
    // 신약: 20~50
    return Math.round(20 + (shengqiangRuo / 40) * 30);
  }
}

// 예: 신강약 점수 65 → HP 약 70
// 예: 신강약 점수 35 → HP 약 48
```

### 3. MP 배치 (신강약 역비례)

```javascript
function calculateMP(shengqiangRuo) {
  // 신약일수록 MP 높음 (마법 의존적)
  const reversedScore = 100 - shengqiangRuo;
  
  if (reversedScore >= 60) {
    // 신약 (MP 80~100)
    return Math.round(80 + (reversedScore - 60) / 40 * 20);
  } else if (reversedScore >= 30) {
    // 중화 (MP 50~80)
    return Math.round(50 + (reversedScore - 30) / 30 * 30);
  } else {
    // 신강 (MP 20~50)
    return Math.round(20 + (reversedScore / 30) * 30);
  }
}

// 예: 신강약 점수 65 → MP 약 35
// 예: 신강약 점수 35 → MP 약 77
```

### 4. 오행 저항력 (레지스트 계산)

```javascript
function calculateResistance(wuxingCount) {
  const totalCount = Object.values(wuxingCount).reduce((a, b) => a + b, 0);
  
  return {
    waterResist: Math.round((wuxingCount['水'] / totalCount) * 100),
    fireResist: Math.round((wuxingCount['火'] / totalCount) * 100),
    woodResist: Math.round((wuxingCount['木'] / totalCount) * 100),
    metalResist: Math.round((wuxingCount['金'] / totalCount) * 100),
    earthResist: Math.round((wuxingCount['土'] / totalCount) * 100)
  };
}

// 예시:
// 水 2, 火 0, 木 1, 金 0, 土 1 (총 4개)
// → Water: 50%, Fire: 0%, Wood: 25%, Metal: 0%, Earth: 25%
```

### 5. 추가 스탯 (STR, DEX, WIS, LUK)

**데이터 필요**: 십성, 신살, 귀인성 정보

```javascript
function calculateAdditionalStats(pillars, shengqiangRuo) {
  // STR (Strength): 정관 + 편관 개수 + 신강 가중치
  const zhengguanCount = countDecans(pillars, '正官');
  const pianGuanCount = countDecans(pillars, '偏官');
  const STR = Math.round((zhengguanCount + pianGuanCount) * 10 + shengqiangRuo * 0.3);
  
  // DEX (Dexterity): 식신 + 상관 개수 + 역마살 유무
  const shiShenCount = countDecans(pillars, '食神');
  const shangGuanCount = countDecans(pillars, '傷官');
  const hasYueMA = hasDecan(pillars, '驛馬');
  const DEX = Math.round((shiShenCount + shangGuanCount) * 10 + (hasYueMA ? 15 : 0));
  
  // WIS (Wisdom): 정인 + 편인 개수 + 신약 가중치
  const zhengYinCount = countDecans(pillars, '正印');
  const pianYinCount = countDecans(pillars, '偏印');
  const WIS = Math.round((zhengYinCount + pianYinCount) * 10 + (100 - shengqiangRuo) * 0.3);
  
  // LUK (Luck): 귀인성 개수 + 길신 총합
  const guiRenCount = countNobles(pillars);  // 천을귀인, 문창귀인 등
  const luckyDecanCount = countLuckyDecans(pillars);
  const LUK = Math.round(guiRenCount * 15 + luckyDecanCount * 8);
  
  return {
    STR: Math.min(99, STR),
    DEX: Math.min(99, DEX),
    WIS: Math.min(99, WIS),
    LUK: Math.min(99, LUK)
  };
}
```

---

## 카드 렌더링

### 레이아웃 구조 (600×900px)

```
┌─────────────────────────────────────┐
│ [특수이펙트 아이콘] ✨               │  y: 20~50px
├─────────────────────────────────────┤
│                                     │
│      [픽셀 캐릭터 이미지]            │  y: 50~450px (400×400)
│     + 아우라/이펙트 레이어           │  중앙 정렬
│                                     │
├─────────────────────────────────────┤
│  [이름] Lv.?? [레어도]               │  y: 460~500px
├─────────────────────────────────────┤
│  STR 45  DEX 72                    │  y: 510~530px
│  WIS 68  LUK 55                    │
├─────────────────────────────────────┤
│  HP: ■■■■■□□□□□ 75/100       │  y: 540~560px
│  MP: ■■■■■■□□□□ 60/100       │
├─────────────────────────────────────┤
│  [주속성] 水 마법사                 │  y: 570~590px
│                                     │
│  Water:  ▓▓▓▓▓░░ 50%  강함        │  y: 600~700px
│  Fire:   ░░░░░░░░░░  0%  약함     │  (오행 저항력 5줄)
│  Wood:   ▓▓░░░░░░░░ 25%  약함     │
│  Metal:  ░░░░░░░░░░  0%  약함     │
│  Earth:  ▓▓░░░░░░░░ 25%  약함     │
└─────────────────────────────────────┘
```

### 렌더링 함수 (Canvas/SVG 기반)

```javascript
async function renderCharacterCard(characterData) {
  const canvas = createCanvas(600, 900);
  const ctx = canvas.getContext('2d');
  
  // 배경색 설정 (레어도에 따라)
  const bgColor = getRarityBgColor(characterData.rarity);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 600, 900);
  
  // 1. 특수이펙트 아이콘 (선택사항)
  if (characterData.specialEffects.length > 0) {
    drawSpecialIcon(ctx, characterData.specialEffects[0]);
  }
  
  // 2. 픽셀 캐릭터 이미지
  const characterImage = await loadCharacterPixelArt(characterData.attribute);
  ctx.drawImage(characterImage, 100, 50, 400, 400);
  
  // 3. 아우라 이펙트 레이어
  if (characterData.rarity !== 'normal') {
    drawAuraEffect(ctx, characterData.rarity, 300, 250);
  }
  
  // 4. 이름 + 레벨 + 레어도
  drawText(ctx, {
    text: `${characterData.name} Lv.${characterData.level}`,
    x: 300, y: 480,
    fontSize: 24, weight: 'bold', align: 'center'
  });
  drawText(ctx, {
    text: characterData.rarity === 'dark' ? 'Dark Elf' : 
          characterData.rarity === 'high' ? 'High Elf' : 'Human',
    x: 300, y: 510,
    fontSize: 14, weight: 'normal', align: 'center'
  });
  
  // 5. 추가 스탯
  drawStats(ctx, characterData.stats);
  
  // 6. HP/MP 바
  drawHealthBar(ctx, characterData.hp, characterData.maxHP, 30);
  drawManaBar(ctx, characterData.mp, characterData.maxMP, 60);
  
  // 7. 주속성
  drawMainAttribute(ctx, characterData.attribute);
  
  // 8. 오행 저항력
  drawWuxingResistance(ctx, characterData.resistance);
  
  // 최종 이미지 저장
  return canvas.toDataURL('image/png');
}
```

---

## 특수 이펙트

### 레어도 분류 로직

```javascript
function determineRarity(pillars, shengqiangRuo) {
  // 길신/흉신 개수 계산
  const luckyDecans = countLuckyDecans(pillars);     // 천을귀인, 문창귀인 등
  const unluckyDecans = countUnluckyDecans(pillars); // 양인살, 현침살 등
  
  let rarity = 'normal';
  let specialEffects = [];
  
  // High Elf: 길신 3개 이상
  if (luckyDecans >= 3) {
    rarity = 'high';
    specialEffects = getHighElfEffects(pillars);
  }
  
  // Dark Elf: 흉신 3개 이상
  else if (unluckyDecans >= 3) {
    rarity = 'dark';
    specialEffects = getDarkElfEffects(pillars);
  }
  
  // 특별한 길신/강살 (추가 이펙트)
  if (hasDecan(pillars, '天乙貴人')) {
    specialEffects.push({
      type: 'blue-glow',
      name: '지식',
      icon: '📖'
    });
  }
  
  if (hasDecan(pillars, '文昌貴人')) {
    specialEffects.push({
      type: 'green-glow',
      name: '창조',
      icon: '🎨'
    });
  }
  
  if (hasDecan(pillars, '驛馬')) {
    specialEffects.push({
      type: 'yellow-lightning',
      name: '활기',
      icon: '⚡'
    });
  }
  
  return { rarity, specialEffects };
}
```

### High Elf 이펙트

```javascript
function getHighElfEffects(pillars) {
  return {
    aura: {
      type: 'golden-light',
      colors: ['#FFD700', '#FFFFFF', '#FFD700'],
      intensity: 1.0
    },
    particles: {
      type: 'stars',
      count: 12,
      color: '#FFD700',
      size: 4
    },
    borderColor: '#FFD700',
    textColor: 'normal'  // 흰색 테스트, 검은색 배경
  };
}
```

### Dark Elf 이펙트

```javascript
function getDarkElfEffects(pillars) {
  return {
    aura: {
      type: 'shadow-dark',
      colors: ['#000000', '#4B0082', '#000000'],  // 검은색 → 보라색
      intensity: 0.8
    },
    particles: {
      type: 'dark-particles',
      count: 16,
      color: '#4B0082',
      size: 3
    },
    borderColor: '#FF0000',
    textColor: 'inverted'  // 검은색 텍스트, 흰색 배경
  };
}
```

---

## 구현 흐름도

```
┌─────────────────────────────┐
│  유저 입력 (생년월일시 + 이름)  │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│   사주 엔진 (4기둥 + 일간)    │
│  - 천간 지지 계산           │
│  - 지장간 추출             │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│   데이터 추출               │
│  - 오행 분포 계산           │
│  - 신강약 점수 (0~100)      │
│  - 십성/신살/귀인 개수      │
└────────────┬────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
┌──────────┐  ┌──────────────┐
│ 기본 스탯 │  │ 특수 이펙트   │
│ HP/MP    │  │ 레어도 판정   │
│ 저항력   │  │ 아우라 결정   │
│ STR/DEX  │  │ 파티클 설정   │
│ WIS/LUK  │  │ 색상 스키마   │
└────┬─────┘  └────────┬─────┘
     │                 │
     └────────┬────────┘
              │
              ▼
┌─────────────────────────────┐
│   카드 렌더링 (Canvas/SVG)   │
│  - 배경 그리기             │
│  - 픽셀 아트 배치          │
│  - 이펙트 레이어 오버레이  │
│  - 텍스트 배치            │
│  - 통계 시각화            │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│   최종 이미지 (600×900px)   │
│  - PNG/GIF 포맷            │
│  - SNS 공유 가능           │
└─────────────────────────────┘
```

---

## 데이터 구조 정의

### Character Card Object

```typescript
interface CharacterCard {
  // 기본 정보
  name: string;
  level: number;
  birthDate: Date;
  
  // 사주 데이터
  pillars: {
    year: { stem: string; branch: string };
    month: { stem: string; branch: string };
    day: { stem: string; branch: string };
    hour: { stem: string; branch: string };
  };
  
  // 게임 스탯
  hp: number;
  maxHP: number;
  mp: number;
  maxMP: number;
  
  // 추가 스탯 (0~99)
  stats: {
    STR: number;  // Strength
    DEX: number;  // Dexterity
    WIS: number;  // Wisdom
    LUK: number;  // Luck
  };
  
  // 속성
  attribute: {
    wuxing: '水' | '火' | '木' | '金' | '土';
    color: string;
    name: string;
    type: string;
  };
  
  // 오행 저항력 (0~100%)
  resistance: {
    waterResist: number;
    fireResist: number;
    woodResist: number;
    metalResist: number;
    earthResist: number;
  };
  
  // 레어도
  rarity: 'normal' | 'high' | 'dark';
  
  // 특수 이펙트
  specialEffects: Array<{
    type: string;
    name: string;
    icon: string;
  }>;
}
```

---

## 구현 우선순위

### Phase 1 (MVP)
- [ ] 사주 엔진 연동 (4기둥 계산)
- [ ] 기본 스탯 계산 (HP/MP/저항력)
- [ ] 기본 카드 렌더링 (텍스트 + 바)

### Phase 2 (Enhanced)
- [ ] 추가 스탯 계산 (STR/DEX/WIS/LUK)
- [ ] 특수 이펙트 (High Elf / Dark Elf)
- [ ] 픽셀 아트 캐릭터 이미지 추가

### Phase 3 (Advanced)
- [ ] GIF 애니메이션 (파티클 이펙트)
- [ ] SNS 공유 최적화
- [ ] 카드 갤러리 (사용자별 히스토리)

---

## 참고사항

- **픽셀 아트**: 256×256px, 8-bit 색상 (256색 팔레트)
- **Canvas 라이브러리**: `canvas.js` 또는 `Fabric.js` 추천
- **이미지 포맷**: PNG (투명도 지원) 또는 GIF (애니메이션)
- **폰트**: 픽셀 폰트 (`Press Start 2P`, `VT323` 등)
- **성능**: 카드 생성 시간 < 2초 목표
