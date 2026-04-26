'use client';

import React, { useState } from 'react';
import PageShell from '../components/community/PageShell';
import BoardFrame from '../components/community/BoardFrame';
import BokgilSays from '../components/community/BokgilSays';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    question: '사주 분석은 어떻게 이루어지나요?',
    answer:
      '생년월일시를 기반으로 사주팔자(네 기둥, 여덟 글자)를 산출합니다. 이석영 선생의 사주첩경을 기준으로 격국과 용신을 판단하고, 자평진전, 적천수, 궁통보감 등 다양한 명리학 유파의 해석을 종합하여 분석 리포트를 제공합니다. 모든 해석에는 이론적 근거가 병기됩니다.',
  },
  {
    question: '육효점이란 무엇인가요?',
    answer:
      '육효점은 주역(周易)의 64괘를 활용한 전통 점술입니다. 시초(蓍草)를 세어 괘를 만드는 정통 시초법 방식을 온라인에서 재현하여, 현재 상황에 대한 괘를 뽑고 그 의미를 해석해 드립니다. 구체적인 질문을 마음에 품고 점을 치면 더욱 명확한 답을 얻을 수 있습니다.',
  },
  {
    question: '개인정보는 안전한가요?',
    answer:
      '제3의시간은 생년월일시 외에 불필요한 개인정보를 수집하지 않습니다. 입력하신 생년월일시 정보는 사주 분석에만 사용되며, 서버에 평문으로 저장되지 않습니다. 분석이 완료된 후에는 세션 데이터가 자동 만료됩니다. 자세한 내용은 개인정보처리방침을 확인해 주세요.',
  },
  {
    question: '결과를 다시 볼 수 있나요?',
    answer:
      '분석 완료 시 제공되는 PDF 리포트를 다운로드하면 언제든 다시 확인할 수 있습니다. 웹 페이지의 결과는 세션이 종료되면 사라지므로, 중요한 분석 결과는 반드시 PDF로 저장해 두시기를 권합니다.',
  },
  {
    question: '비용이 드나요?',
    answer:
      '기본 사주 분석은 무료로 제공됩니다. 향후 더 상세한 분석이나 추가 기능이 도입될 경우 별도로 안내드리겠습니다. 현재 제공되는 모든 기능은 비용 없이 이용하실 수 있습니다.',
  },
  {
    question: '사주와 육효점의 차이는?',
    answer:
      '사주는 태어난 시간을 기반으로 타고난 기질, 운의 흐름, 적성 등을 분석하는 명리학입니다. 반면 육효점은 특정 시점에 특정 질문에 대한 답을 구하는 점술입니다. 쉽게 말해, 사주가 "나는 어떤 사람인가"를 보는 것이라면, 육효점은 "지금 이 상황은 어떻게 될까"를 보는 것입니다. 두 가지를 함께 활용하면 보다 풍부한 통찰을 얻을 수 있습니다.',
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <PageShell title="자주 묻는 질문">
      {/* Bokgil intro */}
      <div style={{ marginBottom: 20 }}>
        <BokgilSays text="자주 들어오는\n질문들을 모아두었네.\n궁금한 것을 눌러보게." />
      </div>

      <BoardFrame>
        {/* Board title */}
        <div
          style={{
            fontFamily: '"Noto Sans KR", sans-serif',
            fontSize: 15,
            fontWeight: 700,
            color: '#4a3728',
            textAlign: 'center',
            marginBottom: 16,
            paddingBottom: 10,
            borderBottom: '1px solid rgba(139, 115, 85, 0.4)',
          }}
        >
          게시판 - 공지사항
        </div>

        {/* FAQ items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {FAQ_DATA.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                style={{
                  borderBottom:
                    index < FAQ_DATA.length - 1
                      ? '1px solid rgba(139, 115, 85, 0.25)'
                      : 'none',
                }}
              >
                {/* Question row */}
                <button
                  onClick={() => toggle(index)}
                  style={{
                    width: '100%',
                    padding: '12px 4px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {/* Pin icon */}
                  <span
                    style={{
                      flexShrink: 0,
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#8b6914',
                      backgroundColor: 'rgba(139, 105, 20, 0.15)',
                      border: '1px solid rgba(139, 105, 20, 0.3)',
                      borderRadius: 2,
                      marginTop: 1,
                    }}
                  >
                    Q
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontFamily: '"Pretendard Variable", "Pretendard", sans-serif',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#3a2e1e',
                      lineHeight: 1.5,
                    }}
                  >
                    {item.question}
                  </span>
                  {/* Expand arrow */}
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: 12,
                      color: '#8a7a60',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      marginTop: 2,
                    }}
                  >
                    &#9660;
                  </span>
                </button>

                {/* Answer (collapsible) */}
                <div
                  style={{
                    maxHeight: isOpen ? 500 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease',
                  }}
                >
                  <div
                    style={{
                      padding: '0 4px 14px 28px',
                      fontFamily: '"Pretendard Variable", "Pretendard", sans-serif',
                      fontSize: 13,
                      fontWeight: 400,
                      color: '#5a4a30',
                      lineHeight: 1.75,
                    }}
                  >
                    {item.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </BoardFrame>
    </PageShell>
  );
}
