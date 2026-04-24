/**
 * 괘 읽기 — 정통 용어 언급 후 평서문으로 풀어 설명
 */

import { type GuaPalaceInfo, getPalaceLabel, liuqinKorean } from './gua-palace';
import { type YaoResult } from './sicho';

const DIZHI_IMAGE: Record<string, string> = {
  '子': '한밤의 물', '丑': '얼어붙은 흙', '寅': '새벽의 나무',
  '卯': '봄날의 나무', '辰': '비 머금은 흙', '巳': '아침의 불',
  '午': '한낮의 불', '未': '여름의 흙', '申': '가을의 쇠',
  '酉': '저녁의 쇠', '戌': '마른 흙', '亥': '깊은 밤의 물',
};

const LIUQIN_EXPLAIN: Record<string, string> = {
  '父': '지켜주고 가르쳐주는 힘',
  '兄': '함께 겨루고 나누는 힘',
  '官': '다스리고 시험하는 힘',
  '財': '얻고 다루는 힘',
  '孫': '기쁨을 주고 풀어주는 힘',
};

const LIUQIN_SHORT: Record<string, string> = {
  '父': '보호', '兄': '경쟁', '官': '시련', '財': '재물', '孫': '기쁨',
};

const WUXING_EXPLAIN: Record<string, string> = {
  '金': '굳건하고 날카로운 쇠의 기운이야. 결단력과 의지를 뜻하지.',
  '木': '자라나고 뻗어가는 나무의 기운이야. 성장과 시작을 뜻하지.',
  '水': '흘러가며 스며드는 물의 기운이야. 지혜와 유연함을 뜻하지.',
  '火': '밝히고 드러내는 불의 기운이야. 표현과 열정을 뜻하지.',
  '土': '품어주고 받쳐주는 흙의 기운이야. 안정과 포용을 뜻하지.',
};

const PALACE_EXPLAIN: Record<number, string> = {
  0: '괘가 본래 자리에 있으니, 상황이 안정적이고 본질 그대로야.',
  1: '한 발짝 움직인 상태야. 작은 변화가 시작되고 있어.',
  2: '두 걸음 나아갔어. 변화가 눈에 띄기 시작하지.',
  3: '세 걸음 벗어났어. 원래 모습에서 꽤 달라진 거야.',
  4: '크게 변화한 상태야. 상황이 많이 바뀌었어.',
  5: '깊이 변해버렸어. 처음과는 아주 다른 처지에 놓인 거야.',
  6: '멀리 떠났다가 방황하는 상태야. 돌아갈지 나아갈지, 마음이 정해지지 않았어.',
  7: '떠돌다 돌아와 자리를 잡은 상태야. 비로소 안착하려는 움직임이지.',
};

const YAO_POS = ['초효', '이효', '삼효', '사효', '오효', '상효'];
const YAO_POS_PLAIN = ['맨 아래', '아래서 둘째', '아래서 셋째', '위에서 셋째', '위에서 둘째', '맨 위'];

export function generateTraditionalReading(
  palace: GuaPalaceInfo,
  guaName: string,
  yaos: YaoResult[],
): string {
  const lines: string[] = [];
  const w = palace.palace.wuxing;
  const pLabel = getPalaceLabel(palace.palaceIndex);

  // 1. 소속 — 정통 용어 + 풀이
  lines.push(`이 괘는 ${palace.palace.name}의 ${pLabel}괘이다.`);
  lines.push('');
  lines.push(`→ ${palace.palace.name}은 ${w}(${WUXING_EXPLAIN[w]}`);
  lines.push(`→ ${pLabel}괘란? ${PALACE_EXPLAIN[palace.palaceIndex]}`);

  // 2. 世 — 정통 용어 + 풀이
  const shiIdx = palace.shi - 1;
  const shiDz = palace.yaoDizhi[shiIdx];
  const shiLq = palace.yaoLiuqin[shiIdx];
  lines.push('');
  lines.push(`세효(世)는 ${YAO_POS[shiIdx]}, ${shiDz} ${liuqinKorean(shiLq)}효.`);
  lines.push('');
  lines.push(`→ 세효는 "나 자신"의 자리야.`);
  lines.push(`→ ${YAO_POS_PLAIN[shiIdx]}에 있고, ${DIZHI_IMAGE[shiDz]}의 기운 위에 서 있어.`);
  lines.push(`→ 그 성질은 ${LIUQIN_EXPLAIN[shiLq]}이야.`);

  // 3. 應 — 정통 용어 + 풀이
  const yingIdx = palace.ying - 1;
  const yingDz = palace.yaoDizhi[yingIdx];
  const yingLq = palace.yaoLiuqin[yingIdx];
  lines.push('');
  lines.push(`응효(應)는 ${YAO_POS[yingIdx]}, ${yingDz} ${liuqinKorean(yingLq)}효.`);
  lines.push('');
  lines.push(`→ 응효는 "상대" 혹은 "내가 물은 상황"의 자리야.`);
  lines.push(`→ ${YAO_POS_PLAIN[yingIdx]}에 있고, ${DIZHI_IMAGE[yingDz]}의 기운이야.`);
  lines.push(`→ 그 성질은 ${LIUQIN_EXPLAIN[yingLq]}이지.`);

  // 4. 나와 상대의 관계
  lines.push('');
  if (shiLq === yingLq) {
    lines.push(`나와 상대 모두 ${LIUQIN_SHORT[shiLq]}의 성질이야. 서로 닮은 처지라 할 수 있지.`);
  } else {
    lines.push(`나는 ${LIUQIN_SHORT[shiLq]}, 상대는 ${LIUQIN_SHORT[yingLq]}. 서로 다른 입장이니 그 차이를 잘 헤아려야 해.`);
  }

  // 5. 변효 — 정통 용어 + 풀이
  const changingIndices = yaos
    .map((y, i) => y.isChanging ? i : -1)
    .filter(i => i >= 0);

  if (changingIndices.length > 0) {
    lines.push('');
    lines.push('— 움직이는 기운 —');
    for (const ci of changingIndices) {
      const dz = palace.yaoDizhi[ci];
      const lq = palace.yaoLiuqin[ci];
      const isShi = ci + 1 === palace.shi;
      const isYing = ci + 1 === palace.ying;

      lines.push('');
      lines.push(`${YAO_POS[ci]}의 ${dz} ${liuqinKorean(lq)}효가 동(動)한다.`);
      lines.push(`→ ${YAO_POS_PLAIN[ci]}의 ${DIZHI_IMAGE[dz]} 기운이 변하고 있어. ${LIUQIN_SHORT[lq]}에 움직임이 생긴다는 뜻이야.`);

      if (isShi) {
        lines.push('→ 이건 바로 자네 자신의 자리야. 자네에게 직접적인 변화가 올 거야.');
      } else if (isYing) {
        lines.push('→ 이건 상대 쪽 자리야. 저쪽에서 변화가 일어나고 있어.');
      }
    }
  }

  return lines.join('\n');
}
