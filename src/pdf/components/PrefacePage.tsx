/**
 * PDF 서문 페이지 — "독자에게"
 *
 * 확정 텍스트 (2026-04-17).
 * 공통 정적 콘텐츠 — 매 리포트 동일하되 userName만 동적 삽입.
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import PageLayout from './PageLayout';
import { colors, fontSize } from '../styles';

interface PrefacePageProps {
  userName: string;
}

const s = StyleSheet.create({
  title: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize['2xl'],
    fontWeight: 700,
    color: colors.darkBg,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.sm,
    fontWeight: 300,
    color: colors.blueGray,
    letterSpacing: 1,
    marginBottom: 20,
  },
  divider: {
    width: 40,
    height: 0.5,
    backgroundColor: colors.goldDim,
    marginBottom: 20,
  },
  paragraph: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.base,
    fontWeight: 400,
    color: colors.textBody,
    lineHeight: 1.85,
    marginBottom: 10,
  },
  closing: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.base,
    fontWeight: 400,
    color: colors.textBody,
    lineHeight: 1.85,
    marginTop: 4,
    marginBottom: 0,
  },
});

export default function PrefacePage({ userName }: PrefacePageProps) {
  return (
    <PageLayout showStamp>
      <Text style={s.title}>독자에게</Text>
      <View style={s.divider} />

      <Text style={s.paragraph}>
        이 리포트는 당신의 운명을 예언하는 문서가 아닙니다. 사주명리학은 수천 년간 축적된 동양의 시간 철학입니다. 태어난 해, 달, 날, 시각이 품고 있는 다섯 가지 기운의 구조를 읽고, 그 사람이 가진 에너지의 균형과 흐름을 해석합니다. 이것은 점술이 아니라 하나의 관점이며, 자신을 들여다보는 오래된 언어입니다.
      </Text>

      <Text style={s.paragraph}>
        {userName} 님은 그간 다양한 사주 풀이를 접하셨으리라 생각합니다. 특히 요즘처럼 인공지능이 발달한 세상에서는 사주 원국만 정확히 주어진다면 인공지능을 통해 충분히 쓸만한 해석을 얻으실 수도 있습니다. 하지만 인공지능은 인간보다 많은 지식을 가지고 있기에, 가장 보편적이고 평균적인 근사치를 내어놓도록 고안되어 있습니다. 어떤 인공지능을 선택해서 물어보시더라도 비슷한 해석의 흐름을 보이기 때문에, 그것이 맞는 답이겠거니 하고 으레 받아들이기 쉽습니다. 이것이 바로 바넘 효과입니다.
      </Text>

      <Text style={s.paragraph}>
        좋은 풀이란 귀찮은 것을 생각하지 않아도 답을 내어주는 풀이가 아닙니다. 세상에 똑같은 인간은 없으며, 스스로를 가장 잘 이해하는 것은 그 누구도 아닌 본인뿐입니다. 저는 오히려 이 풀이를 읽고 깊은 사유를 통해 가장 독창적인 인생의 방향을 결정할 수 있는 계기를 가지시기를 바랍니다.
      </Text>

      <Text style={s.paragraph}>
        이 리포트에서 '운'이라는 단어가 등장하더라도, 그것을 외부에서 찾아오는 행운이나 불운으로 읽지 마십시오. 여기서 말하는 운이란 특정 시기에 자신에게 강하게 작용하는 기운의 흐름, 즉 내면의 상태에 가깝습니다. 같은 대운이 흘러도 어떤 사람은 도약의 계기로 삼고, 어떤 사람은 아무 변화 없이 지나갑니다. 운은 정해진 결과가 아니라 선택의 조건입니다.
      </Text>

      <Text style={s.paragraph}>
        본문에는 격국, 용신, 십성, 지장간 같은 전문 용어가 등장합니다. 이 리포트는 그 용어들을 단순히 나열하지 않습니다. 왜 이 글자가 이 자리에서 이런 역할을 하는지, 어떤 원리로 그런 판단이 나오는지를 함께 서술합니다. 흔히 사주 풀이에서 "빨간색을 가까이 하라", "서쪽을 피하라"와 같은 단편적 조언을 접하게 됩니다만, 이 리포트에는 그런 내용이 없습니다. 결론만 던지는 것이 아니라 그 결론에 이르는 사고의 과정을 함께 드리는 것이 이 리포트의 방식입니다.
      </Text>

      <Text style={s.closing}>
        혹자는 이야기합니다. 같은 사주를 가지고 있는데 왜 다른 운명을 사는가? 저는 그에 대한 답을 이 서문을 통해 독자님께 전달하고 싶었습니다. 긴 글을 읽어주셔서 감사합니다. 이제 본격적인 해석에 들어가겠습니다.
      </Text>
    </PageLayout>
  );
}
