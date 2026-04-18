'use client';
export default function PrivacyPage() {
  return (
    <main className="max-w-lg mx-auto px-6 py-12" style={{ color: '#dde1e5', background: '#1a1e24', minHeight: '100vh' }}>
      <button onClick={() => history.back()} className="text-sm mb-6" style={{ color: '#688097' }}>← 돌아가기</button>
      <h1 className="text-xl font-bold mb-2">개인정보처리방침</h1>
      <p className="text-xs mb-8" style={{ color: '#688097' }}>「개인정보 보호법」 제30조에 따른 개인정보 처리방침</p>

      <div className="text-sm space-y-6" style={{ color: '#a1c5ac', lineHeight: 1.8 }}>

        <section>
          <h2 className="font-bold text-base mb-2" style={{ color: '#dde1e5' }}>1. 개인정보의 수집 항목 및 수집 방법</h2>
          <p><strong>필수 수집 항목:</strong> 생년월일, 출생시각, 출생지, 성별</p>
          <p><strong>선택 수집 항목:</strong> 이름 (리포트 표시 목적)</p>
          <p><strong>결제 시 추가 수집:</strong> 결제 정보는 결제 대행사(PG사)가 직접 처리하며, "몰"은 결제 정보를 보관하지 않습니다.</p>
          <p><strong>수집 방법:</strong> 서비스 이용 시 이용자가 직접 입력</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2" style={{ color: '#dde1e5' }}>2. 개인정보의 수집 및 이용 목적</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>사주팔자 분석 결과 생성 및 제공</li>
            <li>유료 서비스 결제 처리</li>
            <li>서비스 개선을 위한 통계 분석 (비식별 처리)</li>
          </ul>
          <p>수집된 정보는 상기 목적 외에 사용하지 않습니다.</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2" style={{ color: '#dde1e5' }}>3. 개인정보의 보유 및 이용 기간</h2>
          <p>이용자의 개인정보는 <strong style={{ color: '#f0dfad' }}>세션 종료 시 서버 메모리에서 즉시 삭제</strong>됩니다. 별도의 데이터베이스에 영구 저장하지 않습니다.</p>
          <p>다만, 관계법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>전자상거래 거래기록: 5년 (전자상거래법)</li>
            <li>소비자 불만 또는 분쟁 처리 기록: 3년 (전자상거래법)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2" style={{ color: '#dde1e5' }}>4. 개인정보의 제3자 제공</h2>
          <p>분석을 위해 AI 모델(Anthropic Claude API)에 생년월일시 데이터가 전달됩니다.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>제공받는 자: Anthropic, PBC (미국)</li>
            <li>제공 목적: 사주 분석 텍스트 생성</li>
            <li>제공 항목: 생년월일, 출생시각, 성별, 출생지 (마스킹 처리)</li>
            <li>보유 기간: API 호출 즉시 처리 후 미보관 (Anthropic API 정책에 따라 학습에 사용하지 않음)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2" style={{ color: '#dde1e5' }}>5. 개인정보의 파기 절차 및 방법</h2>
          <p>개인정보는 수집 목적이 달성된 후 즉시 파기합니다. 서버 메모리에 임시 저장된 정보는 세션 종료 시 자동 삭제되며, 별도의 파기 절차 없이 복구 불가능한 방법으로 삭제됩니다.</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2" style={{ color: '#dde1e5' }}>6. 이용자의 권리와 행사 방법</h2>
          <p>이용자는 언제든지 개인정보의 열람·정정·삭제·처리정지를 요청할 수 있습니다.</p>
          <p>요청 방법: 이메일 ________@________ 으로 연락</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2" style={{ color: '#dde1e5' }}>7. 개인정보의 안전성 확보 조치</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>전송 구간 암호화 (HTTPS/TLS)</li>
            <li>API 키 암호화 보관 (환경변수/시크릿 관리)</li>
            <li>LLM 전달 시 생년월일시 마스킹 처리</li>
            <li>에러 메시지 내 개인정보 자동 마스킹</li>
          </ul>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2" style={{ color: '#dde1e5' }}>8. 개인정보 보호책임자</h2>
          <p>성명: ________</p>
          <p>연락처: ________@________</p>
          <p>이용자는 서비스 이용 중 발생한 모든 개인정보 관련 문의를 개인정보 보호책임자에게 할 수 있습니다.</p>
        </section>

        <section>
          <h2 className="font-bold text-base mb-2" style={{ color: '#dde1e5' }}>9. 개인정보 처리방침 변경</h2>
          <p>이 개인정보처리방침은 ________년 __월 __일부터 적용됩니다.</p>
          <p>변경 시 서비스 화면을 통해 공지합니다.</p>
        </section>

      </div>
    </main>
  );
}
