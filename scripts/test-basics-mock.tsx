import React from 'react';
import { renderToFile } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';
import SajuReport from '../src/pdf/SajuReport';
import { calculateSinsal } from '../src/engine/sinsal';
import type { SajuResult } from '../src/engine/schema';
import type { InterpretationResult } from '../src/gateway/prompts/schema';

const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const mockSajuResult: SajuResult = {
  pillars: {
    year: { gan: '丙', ji: '寅' },
    month: { gan: '丁', ji: '酉' },
    day: { gan: '壬', ji: '戌' },
    hour: { gan: '庚', ji: '子' },  // 壬일 기준 子시 → 庚子시 (丁壬起甲子 규칙)
  },
  birth: { solar: '1986-09-15', time: '01:17', adjustedTime: '01:02', city: '서울', offsetMinutes: -15 },
  tenGods: { yearGan: '편재', monthGan: '정재', dayGan: '비견', hourGan: '편인', yearJi: '편인', monthJi: '정관', dayJi: '편관', hourJi: '비견' },
  jijanggan: {
    year: [{ stem: '甲', role: '여기', days: 7, strength: 0.3 }, { stem: '丙', role: '중기', days: 7, strength: 0.3 }, { stem: '甲', role: '정기', days: 16, strength: 0.7 }],
    month: [{ stem: '庚', role: '여기', days: 10, strength: 0.4 }, { stem: '辛', role: '정기', days: 20, strength: 0.8 }],
    day: [{ stem: '辛', role: '여기', days: 9, strength: 0.3 }, { stem: '丁', role: '중기', days: 3, strength: 0.2 }, { stem: '戊', role: '정기', days: 18, strength: 0.7 }],
    hour: [{ stem: '壬', role: '여기', days: 10, strength: 0.3 }, { stem: '癸', role: '정기', days: 20, strength: 0.8 }],  // 子 지장간: 壬(여기 10일) + 癸(정기 20일)
  },
  strength: { level: '신강', score: 65, wolryeong: '실령', details: { wolryeongScore: 0, deukjiScore: 30, deukseScore: 35, seolgiPenalty: 0 }, cheonganHaps: [], monthDamage: [] },
  gyeokGuk: { type: '편인격', category: '내격', state: '성격', breakCauses: [], weakenedBy: [], basis: { method: '투출', sourceStem: '甲', sourcePosition: '연간' }, monthMainTenGod: '정관', strengthLevel: '신강', warnings: [] },
  yongSin: {
    methods: { eokbu: { applicable: true, primary: '火', secondary: '土', reasoning: '억부' }, johu: { applicable: false, primary: null, secondary: null, reasoning: '' }, tonggwan: { applicable: false, primary: null, secondary: null, reasoning: '' }, byeongyak: { applicable: false, primary: null, secondary: null, reasoning: '' }, jeonwang: { applicable: false, primary: null, secondary: null, reasoning: '' } },
    final: { primary: '火', secondary: '土', xiSin: ['火', '土'], giSin: ['水', '木'], method: '억부', reasoning: '신강 壬수' },
  },
  sinsal: calculateSinsal({
    year:  { gan: '丙', ji: '寅' },
    month: { gan: '丁', ji: '酉' },
    day:   { gan: '壬', ji: '戌' },
    hour:  { gan: '庚', ji: '子' },
  }),
  daeun: { direction: '역행', startAge: 3, periods: [
    { index: 0, startAge: 3, endAge: 13, gan: '丙', ji: '申', analysis: { ganTenGod: '편재', jiTenGod: '편관', yongSinRelation: '희신', cheonganHaps: [], jijiRelations: [], score: 72, rating: '길' }, sinsal: [] },
    { index: 1, startAge: 13, endAge: 23, gan: '乙', ji: '未', analysis: { ganTenGod: '상관', jiTenGod: '정관', yongSinRelation: '중립', cheonganHaps: [], jijiRelations: [], score: 55, rating: '평' }, sinsal: [] },
    { index: 2, startAge: 23, endAge: 33, gan: '甲', ji: '午', analysis: { ganTenGod: '식신', jiTenGod: '정재', yongSinRelation: '희신', cheonganHaps: [], jijiRelations: [], score: 68, rating: '길' }, sinsal: [] },
    { index: 3, startAge: 33, endAge: 43, gan: '癸', ji: '巳', analysis: { ganTenGod: '겁재', jiTenGod: '정재', yongSinRelation: '중립', cheonganHaps: [], jijiRelations: [], score: 52, rating: '평' }, sinsal: [] },
    { index: 4, startAge: 43, endAge: 53, gan: '壬', ji: '辰', analysis: { ganTenGod: '비견', jiTenGod: '편관', yongSinRelation: '기신', cheonganHaps: [], jijiRelations: [], score: 42, rating: '흉' }, sinsal: [] },
    { index: 5, startAge: 53, endAge: 63, gan: '辛', ji: '卯', analysis: { ganTenGod: '정인', jiTenGod: '편재', yongSinRelation: '희신', cheonganHaps: [], jijiRelations: [], score: 75, rating: '길' }, sinsal: [] },
    { index: 6, startAge: 63, endAge: 73, gan: '庚', ji: '寅', analysis: { ganTenGod: '편인', jiTenGod: '편인', yongSinRelation: '기신', cheonganHaps: [], jijiRelations: [], score: 45, rating: '흉' }, sinsal: [] },
    { index: 7, startAge: 73, endAge: 83, gan: '己', ji: '丑', analysis: { ganTenGod: '정관', jiTenGod: '편인', yongSinRelation: '희신', cheonganHaps: [], jijiRelations: [], score: 70, rating: '길' }, sinsal: [] },
  ] },
  seun: [
    { year: 2026, gan: '丙', ji: '午', analysis: { ganTenGod: '편재', jiTenGod: '정재', yongSinRelation: '희신', cheonganHaps: [], jijiRelations: [], score: 78, rating: '길' }, sinsal: [] },
    { year: 2027, gan: '丁', ji: '未', analysis: { ganTenGod: '정재', jiTenGod: '정관', yongSinRelation: '희신', cheonganHaps: [], jijiRelations: [], score: 80, rating: '대길' }, sinsal: [] },
    { year: 2028, gan: '戊', ji: '申', analysis: { ganTenGod: '편관', jiTenGod: '편관', yongSinRelation: '희신', cheonganHaps: [], jijiRelations: [], score: 65, rating: '길' }, sinsal: [] },
    { year: 2029, gan: '己', ji: '酉', analysis: { ganTenGod: '정관', jiTenGod: '정인', yongSinRelation: '중립', cheonganHaps: [], jijiRelations: [], score: 58, rating: '평' }, sinsal: [] },
    { year: 2030, gan: '庚', ji: '戌', analysis: { ganTenGod: '편인', jiTenGod: '편관', yongSinRelation: '기신', cheonganHaps: [], jijiRelations: [], score: 40, rating: '흉' }, sinsal: [] },
  ],
};

const mockInterpretation: InterpretationResult = {
  summary: '壬水 일간, 酉월 편인격 신강 — 지적 탐구와 재물 감각이 공존하는 구조. 용신 火·土로 현실 정착력 보강이 관건.',
  sections: {
    basics: {
      description: '壬수(壬水) 일간으로 태어난 이대운 님의 사주는 丙寅(병인)년 丁酉(정유)월 壬戌(임술)일 庚子(경자)시의 네 기둥으로 이루어져 있습니다.\n\n연간 丙화는 편재(偏財), 월간 丁화는 정재(正財)로서 재성이 천간에 투출해 있어 물질적 감각이 예민합니다. 월지 酉금이 격국의 근거가 되어 편인격(偏印格)을 구성하며, 일지 戌토 편관(偏官)이 일간을 억제하면서도 안정적인 토대를 제공합니다.\n\n시주 庚子는 편인과 비견의 조합으로, 지적 호기심이 강하되 자기 세계에 몰입하는 경향을 보여줍니다. 전체적으로 水기운이 강한 가운데 火·土가 이를 제어하는 구도가 사주의 핵심 역학입니다.',
    },
    coreJudgment: {
      strengthReading: '壬水 일간은 월지 酉금에서 실령(失令)하였으나, 시지 子수가 비견으로 득지하고 시간 庚금이 편인으로 생조하여 전체 득세 점수가 높습니다.\n\n월령만 보면 金이 水를 생하는 상생 관계이나, 사주첩경 기준으로는 酉금이 水의 제왕지가 아니므로 실령으로 판정합니다. 그러나 子수(비견)와 庚금(편인)의 지원이 강력하여 총합 65점으로 신강에 해당합니다. 극강까지는 아니므로 억부법 적용이 적절합니다.',
      gyeokGukReading: '월지 酉금의 정기 辛금이 편인에 해당하며, 연간에 甲목이 투출하여 편인격(偏印格)을 구성합니다. 내격(內格)에 속하며 파격 사유가 없으므로 성격(成格) 상태입니다.\n\n편인격은 독창적 사고력과 비정통적 학문에 대한 관심을 의미합니다. 성격 상태의 편인격은 이러한 장점이 온전히 발현되는 구조로, 전문 분야에서의 깊은 탐구가 가능합니다. 다만 편인이 식신을 극하는 도식(倒食) 관계에 주의가 필요합니다.',
      yongSinReading: '신강 壬수에 억부법을 적용하여 용신을 火, 희신을 土로 판정하였습니다.\n\n火는 재성으로서 강한 水기운을 설기(洩氣)하여 에너지를 유용하게 전환하는 역할을 합니다. 土는 관성으로서 직접 水를 억제하여 규율과 방향성을 부여합니다. 조후법은 酉월(가을) 壬수이므로 크게 적용되지 않으나, 火의 온기가 보조적으로 조후 역할도 수행합니다.\n\n기신은 水(비겁 강화)와 木(설기 방향 오류)입니다. 金은 인성으로서 신강을 더 강화하므로 역시 기신에 해당하나, 격국의 근거이므로 완전 기신으로 보기 어려운 이중적 위치입니다.',
    },
    pillarAnalysis: {
      year: '丙寅(병인)년주는 편재(丙화)와 편인(寅목 내 甲목)이 공존하는 구조입니다. 연주는 조상궁·사회궁에 해당하며, 편재가 천간에 투출해 있어 외부 활동과 재물에 대한 감각이 초년부터 형성됩니다.\n\n寅목 지장간의 甲목(편인 정기)·丙화(편재 중기)·甲목(여기)은 학문적 호기심과 물질적 실리가 동시에 작용하는 양면성을 보여줍니다. 사회적으로는 새로운 기회를 감지하는 능력이 뛰어나나, 전통적 방식보다는 비정통적 경로로 성과를 얻는 경향이 있습니다.',
      month: '丁酉(정유)월주는 정재(丁화)와 편인(酉금)의 조합으로, 격국의 핵심 기둥입니다. 월주는 부모궁·직업궁에 해당하며 사주 전체 에너지의 중심축 역할을 합니다.\n\n丁화 정재는 안정적이고 꾸준한 재물 운용을 의미하며, 酉금 편인은 체계적 분석력과 전문 지식 축적을 나타냅니다. 정재와 편인의 조합은 전문성을 기반으로 안정적 수입을 확보하는 구조입니다. 다만 酉금이 일지 戌토와 해(害) 관계를 형성하여 직업과 가정 사이의 긴장이 잠재합니다.',
      day: '壬戌(임술)일주는 일간 壬水가 편관 戌토 위에 앉은 형상입니다. 일지는 배우자궁이자 내면의 본질을 나타내는 자리로, 편관 위의 일간은 내적 긴장감과 자기 통제력이 강한 성격을 형성합니다.\n\n戌토 지장간에는 辛금(정인 여기)·丁화(정재 중기)·戊토(편관 정기)가 있어, 내면에 지혜(인성)·실리(재성)·규율(관성)이 복합적으로 작용합니다. 壬戌 일주는 겉으로는 유연하지만 내면에 강한 원칙을 가진 인물로, 위기 상황에서 진가를 발휘하는 특성이 있습니다.',
      hour: '庚子(경자)시주는 편인(庚금)과 비견(子수)의 조합으로, 지적 탐구와 자기 세계가 강화되는 구조입니다. 시주는 자녀궁·노년궁에 해당하며, 후반생의 방향성을 암시합니다.\n\n庚금 편인이 시간에 위치하여 나이가 들수록 학문적·기술적 깊이가 더해지며, 子수 비견은 독립적 활동을 선호하는 경향을 강화합니다. 子수와 월지 酉금 사이의 파(破) 관계는 전문성 추구 과정에서의 방향 전환이나 기존 방법론의 수정을 시사합니다.',
    },
    ohengAnalysis: {
      distribution: '천간·지지 8자의 오행 분포를 보면, 水 3개(壬·庚의 생수+子), 金 2개(酉·庚), 火 2개(丙·丁), 木 1개(寅), 土 1개(戌)로 구성됩니다. 水가 가장 강하고 木·土가 상대적으로 부족한 편중 구조입니다.\n\n水 과다는 사고력과 지적 유동성이 뛰어난 반면, 현실 정착력과 실행력(土)이 부족할 수 있음을 의미합니다. 火가 2개 있어 완전한 결핍은 아니지만, 용신 火·土를 보강하는 방향이 균형에 도움이 됩니다.',
      johu: '酉월(음력 8월, 양력 9월)은 가을의 한가운데로, 金기운이 왕성하고 서늘한 기운이 감도는 시기입니다. 壬水 일간은 가을에 金의 생조를 받아 더욱 차가워지는 경향이 있습니다.\n\n이석영 사주첩경 기준으로 酉월 壬수는 조후 용신으로 丙화(태양의 온기)를 필요로 합니다. 연간에 丙화가 투출해 있으므로 조후 조건이 어느 정도 충족되지만, 水勢가 강하여 丙화 하나로는 완전한 조후가 되지 않습니다. 운에서 火기운이 올 때 조후가 더욱 완성됩니다.',
    },
    sipseongAnalysis: {
      reading: '편인격 사주의 십성 배치를 살펴보면, 재성(편재+정재)이 천간에 2개, 인성(편인)이 2개(庚금 시간+酉금 월지 근거), 관성(편관)이 일지에 1개, 비겁이 시지에 1개로 분포합니다.\n\n재성과 인성이 동시에 강한 것은 학문적 깊이와 현실적 수완이 공존하는 구조입니다. 편인 중심의 인성은 정통 학문보다는 독창적 연구나 비주류 분야에서 두각을 나타내며, 편재·정재의 재성은 이를 실질적 수입으로 연결하는 능력을 부여합니다.\n\n다만 식상(식신·상관)이 원국에 없어 표현력과 소통에 약점이 있을 수 있습니다. 편인이 식신을 극하는 도식(倒食) 구조가 잠재하므로, 자신의 지식을 외부에 전달하는 연습이 필요합니다.',
    },
    relations: {
      reading: '원국의 합충형해파 관계를 분석하면, 丁壬합(월간-일간 천간합)이 가장 두드러집니다. 丁壬합은 木으로 화하는 합으로, 일간과 정재가 합하여 재물에 대한 집착이 아닌 자연스러운 재물 인연을 형성합니다.\n\n지지에서는 酉戌 해(害) 관계가 월지와 일지 사이에 존재하여, 직업 환경과 내면 사이의 갈등을 시사합니다. 또한 子酉 파(破) 관계가 시지와 월지 사이에 형성되어, 전문성 추구 과정에서의 방법론적 전환을 암시합니다.\n\n寅戌 반합(화국 미완)이 연지와 일지 사이에 있어, 火기운의 잠재적 결집이 가능합니다. 이는 용신 火를 강화할 수 있는 긍정적 구조입니다.\n\n원국 신살로는 천을귀인, 문창귀인 등이 있어 학문적 성취와 귀인의 도움이 기대됩니다.',
    },
    daeunReading: {
      overview: '역행 대운으로 3세부터 대운이 시작됩니다. 초년 대운에서 丙申(병신) 대운이 편재+편관 조합으로 진행되며, 용신 관계가 희신에 해당하여 비교적 순탄한 출발입니다.\n\n대운의 흐름은 金·水 → 土·火 방향으로 전환되며, 중년 이후 용신 火·土 대운이 도래하면서 본격적인 발전기에 진입합니다. 전체적으로 초년은 학업과 기반 형성, 중년은 사회적 성취, 후반은 안정과 결실의 구도입니다.',
      currentPeriod: '현재 壬辰(임진) 대운(33~43세) 구간으로, 비견(壬수)+편관(辰토) 조합입니다. 비견 대운은 독립적 활동과 경쟁 상황이 증가하는 시기입니다.\n\n辰토는 편관이자 수고(水庫)로서, 강한 水기운을 일부 저장하면서도 관성의 규율을 부여합니다. 이 시기에는 자기 역량을 증명해야 하는 상황이 빈번하며, 전문 분야에서의 입지를 확고히 하는 것이 핵심 과제입니다.',
      upcoming: '다음 辛卯(신묘) 대운(43~53세)부터는 정인+편재 조합으로 전환됩니다. 정인은 정통적 지식과 안정적 지원을, 卯목은 편재의 생지(生地)로서 재물운의 활성화를 의미합니다.\n\n辛卯 이후 庚寅(경인) 대운(53~63세)에서 편인+편인 조합이 오면서 학문적 깊이가 극대화되며, 己丑(기축) 대운(63~73세)에서는 정관+편인으로 사회적 인정과 안정이 동시에 찾아옵니다. 후반생으로 갈수록 운의 질이 상승하는 만시형통(晩時亨通)의 구조입니다.',
    },
    overallReading: {
      primary: '壬水 일간 편인격 신강의 사주는, 지적 탐구력과 독창적 사고가 핵심 역량인 구조입니다. 이석영 사주첩경 기준으로 편인격 성격(成格)은 비정통적 분야에서의 전문성을 통해 성취를 이루는 격국입니다.\n\n용신 火·土는 강한 水기운에 방향성과 현실성을 부여하는 역할을 합니다. 연간 丙화(편재)와 일지 戌토(편관)가 용신·희신 역할을 수행하고 있어, 원국 자체에 발전의 씨앗이 내재해 있습니다.\n\n다만 식상이 부재하고 편인이 강하므로, 자신의 지식과 역량을 외부에 전달하고 소통하는 능력을 의식적으로 개발해야 합니다. 기술적 깊이는 충분하나 이를 대중화하거나 조직 내에서 공유하는 역량이 성장의 관건입니다.',
      modernApplication: '현대적 맥락에서 이 사주 구조는 IT·데이터 분석·연구개발·금융공학 등 전문 지식 기반의 직종에서 강점을 발휘합니다. 편인격의 독창성과 재성의 실리 감각이 결합되어, 기술을 비즈니스 가치로 전환하는 역할에 적합합니다.\n\n대인관계에서는 깊이 있는 소수와의 관계를 선호하며, 넓고 얕은 네트워킹보다는 전문 커뮤니티 내에서의 인정이 동력이 됩니다. 배우자궁(일지)의 편관은 파트너가 규율적이고 현실적인 성향일 때 상호 보완이 잘 이루어짐을 시사합니다.\n\n건강 측면에서는 水 과다로 신장·방광 계통에 주의가 필요하며, 火 보강을 위해 규칙적인 운동과 활동적인 생활 패턴이 권장됩니다. 용신 火를 생활에서 활용하는 것(남향 거주, 적색 계열 포인트, 따뜻한 음식 선호)도 보조적으로 도움이 됩니다.',
      perspectives: [
        { school: '자평진전', content: '자평진전 관점에서 편인격은 편인이 용신이 되어야 하나, 본 사주는 신강이므로 편인이 오히려 기신 방향입니다. 재성(丙·丁화)이 편인을 제어하면서 격국의 균형을 잡아주는 재파인(財破印) 구조로 해석됩니다.' },
        { school: '적천수', content: '적천수는 "壬水通河, 能泄金氣"라 하여 壬水의 소통·유통 능력을 강조합니다. 庚금에서 생조 받은 壬水가 丙·丁 재성으로 흘러가는 금수상관(金水傷官)의 청수(淸秀)한 기운이 잠재합니다.' },
        { school: '궁통보감', content: '궁통보감 酉월 壬수편에 따르면, 가을 壬水는 金白水清의 기운을 가지나 丙화의 온기가 반드시 필요합니다. 연간 丙화 투출이 이 조건을 충족하여, 조후 면에서 양호한 구성입니다.' },
      ],
    },
  },
};

async function main() {
  console.log('목업 데이터 PDF 렌더링 테스트...');
  const outPath = path.join(OUTPUT_DIR, 'report-mock.pdf');
  const doc = React.createElement(SajuReport, {
    userName: '이대운',
    analysisDate: '2026. 4. 17',
    birthDateUtc: new Date('1986-09-14T16:17:00Z'),
    birthTimeKnown: true,
    sajuResult: mockSajuResult,
    interpretation: mockInterpretation,
    gender: '남',
  });
  await renderToFile(doc as any, outPath);
  const stat = fs.statSync(outPath);
  console.log('완료 → ' + outPath + ' (' + (stat.size / 1024).toFixed(1) + ' KB)');
}

main().catch(err => { console.error('실패:', err.message || err); process.exit(1); });
