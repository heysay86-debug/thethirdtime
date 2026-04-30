'use client';

import React from 'react';
import PageShell from '../../components/community/PageShell';
import BoardFrame from '../../components/community/BoardFrame';
import BokgilSays from '../../components/community/BokgilSays';

interface GuideSection {
  title: string;
  content: string[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    title: '사주팔자란',
    content: [
      '사주팔자(四柱八字)란 사람이 태어난 연, 월, 일, 시를 네 개의 기둥(四柱)으로 세우고, 각 기둥에 천간(天干)과 지지(地支) 두 글자씩, 총 여덟 글자(八字)로 표현한 것입니다.',
      '이 여덟 글자에는 태어난 순간의 우주적 기운이 담겨 있다고 봅니다. 마치 씨앗에 나무의 미래가 담겨 있듯이, 태어난 시간의 기운 속에 그 사람의 기질, 적성, 운의 흐름이 내포되어 있다는 것이 명리학의 기본 전제입니다.',
      '사주 분석은 미래를 정확히 예측하는 것이 아니라, 타고난 기질과 운의 흐름을 이해하여 더 나은 선택을 돕는 데 그 목적이 있습니다. 수천 년간 축적된 동양의 지혜를 통해 자신을 더 깊이 이해하는 하나의 도구로 활용할 수 있습니다.',
    ],
  },
  {
    title: '천간과 지지',
    content: [
      '천간(天干)은 하늘의 기운을 나타내는 열 개의 글자입니다. 갑(甲), 을(乙), 병(丙), 정(丁), 무(戊), 기(己), 경(庚), 신(辛), 임(壬), 계(癸)로 이루어져 있으며, 각각 오행(목, 화, 토, 금, 수)의 양과 음에 대응합니다.',
      '지지(地支)는 땅의 기운을 나타내는 열두 개의 글자입니다. 자(子), 축(丑), 인(寅), 묘(卯), 진(辰), 사(巳), 오(午), 미(未), 신(申), 유(酉), 술(戌), 해(亥)로 이루어져 있으며, 우리가 흔히 아는 십이지신(쥐, 소, 호랑이...)의 원형이기도 합니다.',
      '천간이 겉으로 드러나는 성향이라면, 지지는 내면에 감춰진 본성에 해당합니다. 사주를 읽을 때는 이 둘의 조합과 상호작용을 함께 살펴야 합니다. 천간과 지지가 만나 육십갑자(六十甲子)를 이루며, 이것이 사주팔자의 기본 단위가 됩니다.',
    ],
  },
  {
    title: '오행',
    content: [
      '오행(五行)은 우주 만물을 구성하는 다섯 가지 기운입니다. 목(木, 나무), 화(火, 불), 토(土, 흙), 금(金, 쇠), 수(水, 물)가 그것입니다. 이 다섯 기운은 서로 돕기도 하고(상생), 견제하기도 하며(상극), 끊임없이 순환합니다.',
      '상생(相生)의 관계는 다음과 같습니다. 목은 화를 낳고, 화는 토를 낳고, 토는 금을 낳고, 금은 수를 낳고, 수는 목을 낳습니다. 나무가 타서 불이 되고, 불이 꺼지면 재(흙)가 되는 자연의 이치를 반영한 것입니다.',
      '상극(相剋)의 관계는 다음과 같습니다. 목은 토를 극하고, 토는 수를 극하고, 수는 화를 극하고, 화는 금을 극하고, 금은 목을 극합니다. 나무가 흙에 뿌리를 내리고, 흙이 물을 막는 것처럼 자연의 견제 원리를 담고 있습니다.',
      '사주에서 오행의 균형과 편중을 살피는 것이 분석의 출발점입니다. 특정 오행이 지나치게 강하거나 약하면, 그 사람의 성격과 운에 특징적인 패턴이 나타납니다.',
    ],
  },
  {
    title: '십성',
    content: [
      '십성(十星, 또는 십신)은 사주팔자의 여덟 글자 사이의 관계를 나타내는 열 가지 개념입니다. 일간(日干, 태어난 날의 천간)을 기준으로 나머지 글자들이 어떤 관계에 있는지를 분류한 것입니다.',
      '비견(比肩)과 겁재(劫財)는 나와 같은 오행입니다. 동료, 경쟁자, 형제의 의미를 지닙니다. 식신(食神)과 상관(傷官)은 내가 낳는 오행으로, 표현력, 재능, 자녀를 상징합니다.',
      '편재(偏財)와 정재(正財)는 내가 극하는 오행으로, 재물, 아버지, 현실적 능력을 나타냅니다. 편관(偏官, 칠살)과 정관(正官)은 나를 극하는 오행으로, 직업, 규율, 사회적 지위를 의미합니다.',
      '편인(偏印)과 정인(正印)은 나를 낳는 오행으로, 학문, 어머니, 보호와 지원의 기운을 담고 있습니다.',
      '십성의 배치와 힘의 강약을 통해 그 사람의 성격, 직업 적성, 대인관계 패턴, 재물운 등을 구체적으로 읽어낼 수 있습니다.',
    ],
  },
  {
    title: '격국과 용신',
    content: [
      '격국(格局)은 사주팔자의 전체적인 구조와 성격을 한마디로 규정하는 개념입니다. 마치 건물의 설계도처럼, 사주가 어떤 틀(격)을 이루고 있는지를 판단하는 것이 격국 분석입니다.',
      '이석영 선생의 사주첩경에서는 월지(月支, 태어난 달의 지지)에 담긴 기운을 중심으로 격국을 정합니다. 정관격, 편관격, 정인격, 편인격, 식신격, 상관격, 정재격, 편재격 등이 대표적인 격국입니다. 격국이 온전하고 균형 잡혀 있으면 좋은 사주로 봅니다.',
      '용신(用神)은 사주에서 가장 필요한 기운, 즉 균형을 잡아주는 핵심 오행을 말합니다. 사주에 불(화)이 지나치게 강한 사람에게는 물(수)이 용신이 되어 균형을 맞춰주고, 흙(토)이 부족한 사주에는 토가 용신이 됩니다.',
      '용신을 아는 것은 실생활에서도 의미가 있습니다. 용신에 해당하는 방위, 색상, 직업군, 계절 등을 참고하여 자신에게 유리한 환경을 조성할 수 있기 때문입니다. 다만, 용신 판단은 명리학에서 가장 어려운 영역 중 하나이며, 유파마다 기준이 다르므로 여러 시각을 종합적으로 살펴야 합니다.',
    ],
  },
];

export default function SajuGuidePage() {
  return (
    <PageShell title="사주란?">
      {/* Bokgil intro */}
      <div style={{ marginBottom: 24 }}>
        <BokgilSays text="사주의 세계에 오신 것을 환영하네. 하나씩 풀어 설명해 드리겠소." />
      </div>

      {/* Guide sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {GUIDE_SECTIONS.map((section, index) => (
          <BoardFrame key={index}>
            {/* Section title */}
            <div
              style={{
                fontFamily: '"Noto Sans KR", sans-serif',
                fontSize: 15,
                fontWeight: 700,
                color: '#4a3728',
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: '1px solid rgba(139, 115, 85, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 22,
                  height: 22,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#8b6914',
                  backgroundColor: 'rgba(139, 105, 20, 0.12)',
                  border: '1px solid rgba(139, 105, 20, 0.25)',
                  borderRadius: 2,
                }}
              >
                {index + 1}
              </span>
              {section.title}
            </div>

            {/* Section content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {section.content.map((paragraph, pIndex) => (
                <p
                  key={pIndex}
                  style={{
                    fontFamily: '"Pretendard Variable", "Pretendard", sans-serif',
                    fontSize: 13,
                    fontWeight: 400,
                    color: '#3a2e1e',
                    lineHeight: 1.8,
                    margin: 0,
                    textAlign: 'justify',
                    wordBreak: 'keep-all',
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </BoardFrame>
        ))}
      </div>

      {/* Closing remark from Bokgil */}
      <div style={{ marginTop: 24 }}>
        <BokgilSays text="여기까지가 기초라네. 더 깊은 이야기는 사주 분석을 받으며 함께 풀어보세." />
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <a
          href="/alt2"
          style={{
            display: 'inline-block',
            padding: '12px 32px',
            fontFamily: '"Pretendard Variable", "Pretendard", sans-serif',
            fontSize: 14,
            fontWeight: 600,
            color: '#f0dfad',
            backgroundColor: '#5c3d1e',
            border: '2px solid #7a5630',
            borderRadius: 2,
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}
        >
          사주 분석 시작하기
        </a>
      </div>
    </PageShell>
  );
}
