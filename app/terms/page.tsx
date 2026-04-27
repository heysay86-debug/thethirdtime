'use client';
export default function TermsPage() {
  return (
    <main className="max-w-lg mx-auto px-6 py-12" style={{ color: '#dde1e5', background: '#1a1e24', minHeight: '100vh' }}>
      <button onClick={() => history.back()} className="text-sm mb-6" style={{ color: '#688097' }}>← 돌아가기</button>
      <h1 className="text-xl font-bold mb-2">이용약관</h1>
      <p className="text-xs mb-8" style={{ color: '#688097' }}>공정거래위원회 전자상거래 표준약관 제10023호 준용</p>

      <div className="text-sm space-y-6" style={{ color: '#a1c5ac', lineHeight: 1.8 }}>

        <section>
          <h2 className="font-bold text-base mb-2" style={{ color: '#dde1e5' }}>제1조 (목적)</h2>
          <p>이 약관은 제3의시간(이하 "몰")이 운영하는 사이버몰에서 제공하는 디지털 콘텐츠 서비스(이하 "서비스")를 이용함에 있어 몰과 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2" style={{ color: '#dde1e5' }}>제2조 (정의)</h2>
          <p>① "몰"이란 제3의시간이 디지털 콘텐츠(사주 분석 리포트 PDF 등)를 이용자에게 제공하기 위하여 정보통신설비를 이용하여 설정한 가상의 영업장을 말합니다.</p>
          <p>② "이용자"란 "몰"에 접속하여 이 약관에 따라 "몰"이 제공하는 서비스를 받는 자를 말합니다.</p>
          <p>③ "디지털 콘텐츠"란 몰이 제공하는 사주팔자 분석 리포트(PDF), 웹 결과 페이지 등 전자적 형태의 콘텐츠를 말합니다.</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2" style={{ color: '#dde1e5' }}>제3조 (약관의 명시와 개정)</h2>
          <p>① "몰"은 이 약관의 내용과 상호, 영업소 소재지, 대표자 성명, 사업자등록번호, 연락처 등을 이용자가 쉽게 알 수 있도록 서비스 화면에 게시합니다.</p>
          <p>② "몰"은 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」, 「전자문서 및 전자거래 기본법」 등 관련법을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</p>
          <p>③ 개정약관은 적용일자 7일 이전부터 공지합니다. 이용자에게 불리한 변경의 경우 30일 이전부터 공지합니다.</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2" style={{ color: '#dde1e5' }}>제4조 (서비스의 제공 및 변경)</h2>
          <p>① "몰"은 다음과 같은 서비스를 제공합니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>사주팔자 분석 (무료 기본 분석)</li>
            <li>심층 분석 리포트 PDF (유료)</li>
            <li>궁합 분석 (유료)</li>
            <li>기타 "몰"이 정하는 서비스</li>
          </ul>
          <p>② "몰"은 서비스의 내용을 변경할 수 있으며, 변경 시 그 내용을 공지합니다.</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2" style={{ color: '#dde1e5' }}>제5조 (서비스의 중단)</h2>
          <p>① "몰"은 시스템 점검, 장비 교체 등 불가피한 사유가 있는 경우 서비스 제공을 일시적으로 중단할 수 있습니다.</p>
          <p>② 서비스 중단으로 이용자에게 손해가 발생한 경우, "몰"의 고의 또는 과실이 있는 경우에 한하여 배상합니다.</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2" style={{ color: '#dde1e5' }}>제6조 (이용자 정보 수집)</h2>
          <p>① "몰"은 서비스 제공을 위해 다음 정보를 수집합니다: 생년월일, 출생시각, 출생지, 성별. 이름은 선택 입력입니다.</p>
          <p>② 수집된 정보는 사주 분석 목적에 한하여 사용되며, 별도의 회원가입은 요구하지 않습니다.</p>
          <p>③ 개인정보 처리에 관한 상세 사항은 개인정보처리방침에 따릅니다.</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2" style={{ color: '#dde1e5' }}>제7조 (구매 및 결제)</h2>
          <p>① 이용자는 유료 서비스를 구매할 때 다음 사항을 확인한 후 결제합니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>서비스의 내용 및 가격</li>
            <li>청약철회 제한 사항 (제8조 참조)</li>
            <li>이용약관 및 개인정보처리방침 동의</li>
          </ul>
          <p>② 결제 방법은 "몰"이 제공하는 수단(신용카드, 간편결제 등)에 한합니다.</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2" style={{ color: '#dde1e5' }}>제8조 (청약철회 및 환불)</h2>
          <p>① 본 서비스는 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항 제5호에 해당하는 디지털 콘텐츠(전자출판물)입니다.</p>
          <p>② <strong style={{ color: '#f0dfad' }}>디지털 콘텐츠의 특성상, 결과가 제공된 이후에는 청약철회(환불)가 제한됩니다.</strong> 이 사실은 결제 전에 고지되며, 이용자의 동의를 받은 후 결제가 진행됩니다.</p>
          <p>③ 다만, 다음의 경우 전액 환불합니다:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>서비스 장애로 결과가 제공되지 않은 경우</li>
            <li>결제 후 결과 생성 전 취소 요청이 접수된 경우</li>
            <li>제공된 콘텐츠에 중대한 하자가 있는 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2" style={{ color: '#dde1e5' }}>제9조 (서비스 면책)</h2>
          <p>① 본 서비스는 명리학 이론에 기반한 참고용 정보를 제공하며, 의학적·법률적·재정적 판단의 근거가 될 수 없습니다.</p>
          <p>② 해석의 결과는 개인의 선택과 노력에 따라 달라질 수 있으며, "몰"은 분석 결과의 정확성을 보증하지 않습니다.</p>
          <p>③ 이용자가 분석 결과를 근거로 한 결정에 대해 "몰"은 책임을 지지 않습니다.</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2" style={{ color: '#dde1e5' }}>제10조 (저작권)</h2>
          <p>① "몰"이 제공하는 분석 리포트, 디자인, 캐릭터 등 모든 콘텐츠의 저작권은 "몰"에 있습니다.</p>
          <p>② 이용자는 개인적 용도로만 콘텐츠를 이용할 수 있으며, 상업적 이용·재배포·복제는 금지됩니다.</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2" style={{ color: '#dde1e5' }}>제11조 (분쟁 해결)</h2>
          <p>① "몰"과 이용자 간 분쟁이 발생한 경우 상호 협의하여 해결합니다.</p>
          <p>② 협의가 이루어지지 않는 경우 관할 법원은 "몰"의 소재지를 관할하는 법원으로 합니다.</p>
          <p>③ 이용자는 공정거래위원회 또는 시·도지사가 의뢰한 분쟁조정기관의 조정을 신청할 수 있습니다.</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2" style={{ color: '#dde1e5' }}>부칙</h2>
          <p>이 약관은 2026년 5월 20일부터 시행합니다.</p>
        </section>

      </div>
    </main>
  );
}
