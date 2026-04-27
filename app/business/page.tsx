'use client';
export default function BusinessPage() {
  return (
    <main className="max-w-lg mx-auto px-6 py-12" style={{ color: '#dde1e5', background: '#1a1e24', minHeight: '100vh' }}>
      <button onClick={() => history.back()} className="text-sm mb-6" style={{ color: '#688097' }}>← 돌아가기</button>
      <h1 className="text-xl font-bold mb-2">사업자 정보</h1>
      <p className="text-xs mb-8" style={{ color: '#688097' }}>전자상거래법 제13조에 따른 사업자 정보 공시</p>

      <div className="text-sm" style={{ color: '#a1c5ac' }}>
        <table className="w-full">
          <tbody>
            <tr className="border-b border-gray-700">
              <td className="py-3 pr-4 font-semibold" style={{ color: '#dde1e5', width: '40%' }}>상호</td>
              <td className="py-3">베러댄스튜디오</td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="py-3 pr-4 font-semibold" style={{ color: '#dde1e5' }}>대표자</td>
              <td className="py-3">이대운</td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="py-3 pr-4 font-semibold" style={{ color: '#dde1e5' }}>사업자등록번호</td>
              <td className="py-3">207-27-94576</td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="py-3 pr-4 font-semibold" style={{ color: '#dde1e5' }}>통신판매업 신고번호</td>
              <td className="py-3">준비 중</td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="py-3 pr-4 font-semibold" style={{ color: '#dde1e5' }}>사업장 소재지</td>
              <td className="py-3">서울특별시 동대문구 황물로13길 6, 1층 101호(답십리동)</td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="py-3 pr-4 font-semibold" style={{ color: '#dde1e5' }}>전화번호</td>
              <td className="py-3">________</td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="py-3 pr-4 font-semibold" style={{ color: '#dde1e5' }}>이메일</td>
              <td className="py-3">info@betterdan.net</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-semibold" style={{ color: '#dde1e5' }}>호스팅 서비스</td>
              <td className="py-3">Fly.io (미국)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
