'use client';

import { useState, useEffect, useMemo } from 'react';

interface Report {
  report_no: string;
  channel: string;
  char_name: string;
  keyword1: string;
  keyword2: string;
  keyword3: string;
  is_paid: number;
  created_at: string;
}

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [paidFilter, setPaidFilter] = useState<'all' | 'paid' | 'free'>('all');
  const [activeTab, setActiveTab] = useState<'reports' | 'payments' | 'counter' | 'pdf'>('reports');
  const [payments, setPayments] = useState<any[]>([]);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [counterSummary, setCounterSummary] = useState<any>(null);
  const [concurrent, setConcurrent] = useState({ current: 0, max: 5 });
  const [showWelcome, setShowWelcome] = useState(false);

  // PDF 강제 생성 폼
  const [pdfForm, setPdfForm] = useState({ name: '', birthDate: '', birthTime: '12:00', gender: 'M' as 'M' | 'F', calendar: 'solar' as 'solar' | 'lunar' });
  const [pdfStatus, setPdfStatus] = useState('');

  const fetchData = async (t: string) => {
    setLoading(true);
    setError('');
    try {
      const [rRes, pRes, cRes] = await Promise.all([
        fetch(`/api/admin/reports?token=${encodeURIComponent(t)}&table=reports&limit=500`),
        fetch(`/api/admin/reports?token=${encodeURIComponent(t)}&table=payments&limit=100`),
        fetch(`/api/admin/reports?token=${encodeURIComponent(t)}&table=counter`),
      ]);
      if (rRes.status === 401) { setError('인증 실패'); setAuthenticated(false); return; }
      const [rData, pData, cData] = await Promise.all([rRes.json(), pRes.json(), cRes.json()]);
      setReports(rData.rows || []);
      if (rData.concurrent) setConcurrent(rData.concurrent);
      setPayments(pData.rows || []);
      setDailyStats(cData.daily || []);
      setCounterSummary(cData.summary || null);
      if (!authenticated) {
        setShowWelcome(true);
        setTimeout(() => setShowWelcome(false), 3000);
      }
      setAuthenticated(true);
    } catch { setError('서버 연결 실패'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (reportNo: string) => {
    if (!confirm(`${reportNo} 삭제?`)) return;
    try {
      const res = await fetch(`/api/admin/reports?token=${encodeURIComponent(token)}&reportNo=${encodeURIComponent(reportNo)}`, { method: 'DELETE' });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.report_no !== reportNo));
      } else {
        alert('삭제 실패');
      }
    } catch { alert('삭제 실패'); }
  };

  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); if (token.trim()) fetchData(token.trim()); };

  useEffect(() => {
    if (!authenticated || !token) return;
    const id = setInterval(() => fetchData(token), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [authenticated, token]);

  // 필터 적용
  const filtered = useMemo(() => {
    return reports.filter(r => {
      if (search && !r.report_no.includes(search) && !r.char_name.includes(search) && !r.keyword1.includes(search)) return false;
      if (channelFilter !== 'all' && r.channel !== channelFilter) return false;
      if (paidFilter === 'paid' && !r.is_paid) return false;
      if (paidFilter === 'free' && r.is_paid) return false;
      return true;
    });
  }, [reports, search, channelFilter, paidFilter]);

  const channels = useMemo(() => [...new Set(reports.map(r => r.channel))].sort(), [reports]);

  // 통계
  const stats = useMemo(() => ({
    total: reports.length,
    paid: reports.filter(r => r.is_paid).length,
    today: reports.filter(r => {
      const kst = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
      const todayStr = kst.toISOString().slice(0, 10);
      return r.created_at.startsWith(todayStr);
    }).length,
  }), [reports]);

  const S = {
    page: { background: '#1a1e24', minHeight: '100vh', color: '#dde1e5', fontFamily: 'system-ui, sans-serif', padding: '20px 24px' } as const,
    input: { padding: '8px 12px', fontSize: 13, borderRadius: 4, border: '1px solid #444', background: '#252a31', color: '#dde1e5', boxSizing: 'border-box' as const },
    btn: { padding: '6px 14px', background: '#333', color: '#dde1e5', border: '1px solid #555', borderRadius: 4, cursor: 'pointer', fontSize: 12 } as const,
    stat: { background: '#252a31', borderRadius: 6, padding: '12px 16px', minWidth: 100, textAlign: 'center' as const },
  };

  if (!authenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a1e24' }}>
        <form onSubmit={handleLogin} style={{ background: '#252a31', padding: 40, borderRadius: 8, minWidth: 300 }}>
          <h2 style={{ color: '#dde1e5', marginBottom: 20, fontSize: 18 }}>Admin</h2>
          <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="토큰 입력"
            style={{ ...S.input, width: '100%', fontSize: 16, marginBottom: 12 }} />
          <button type="submit" style={{ width: '100%', padding: 10, background: '#f0dfad', color: '#1a1e24', border: 'none', borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {loading ? '...' : '로그인'}
          </button>
          {error && <p style={{ color: '#e74c3c', marginTop: 10, fontSize: 13 }}>{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* 환영 메시지 */}
      {showWelcome && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
          background: 'linear-gradient(135deg, #1a1e24 0%, #252a31 100%)',
          borderBottom: '1px solid #f0dfad33',
          padding: '16px 0', textAlign: 'center',
          animation: 'fadeIn 0.5s ease',
        }}>
          <p style={{ fontSize: 15, color: '#f0dfad', letterSpacing: 2, margin: 0 }}>
            어서오세요, 시간의 관리자여!
          </p>
        </div>
      )}

      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: showWelcome ? 48 : 0 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>리포트 관리</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => fetchData(token)} style={S.btn}>{loading ? '...' : '새로고침'}</button>
          <button onClick={() => { setAuthenticated(false); setReports([]); setToken(''); }} style={{ ...S.btn, color: '#e74c3c' }}>로그아웃</button>
        </div>
      </div>

      {/* 통계 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={S.stat}>
          <div style={{ fontSize: 11, color: '#889' }}>전체</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.total}</div>
        </div>
        <div style={S.stat}>
          <div style={{ fontSize: 11, color: '#889' }}>오늘</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#4ecdc4' }}>{stats.today}</div>
        </div>
        <div style={S.stat}>
          <div style={{ fontSize: 11, color: '#889' }}>유료</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#2ecc71' }}>{stats.paid}</div>
        </div>
        <div style={S.stat}>
          <div style={{ fontSize: 11, color: '#889' }}>동접</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: concurrent.current > 0 ? '#f39c12' : '#556' }}>{concurrent.current}/{concurrent.max}</div>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #333', paddingBottom: 8 }}>
        {(['reports', 'payments', 'counter', 'pdf'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ ...S.btn, background: activeTab === tab ? '#f0dfad' : '#333', color: activeTab === tab ? '#1a1e24' : '#dde1e5', fontWeight: activeTab === tab ? 700 : 400 }}>
            {tab === 'reports' ? `리포트 (${reports.length})` : tab === 'payments' ? `결제 (${payments.length})` : tab === 'counter' ? '카운터' : 'PDF 생성'}
          </button>
        ))}
      </div>

      {/* 필터 (reports만) */}
      {activeTab === 'reports' && <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="검색 (번호, 이름, 격국)"
          style={{ ...S.input, width: 220 }} />
        <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)} style={S.input}>
          <option value="all">전체 채널</option>
          {channels.map(ch => <option key={ch} value={ch}>{ch}</option>)}
        </select>
        <select value={paidFilter} onChange={e => setPaidFilter(e.target.value as any)} style={S.input}>
          <option value="all">전체</option>
          <option value="paid">유료</option>
          <option value="free">무료</option>
        </select>
        <span style={{ fontSize: 12, color: '#667', alignSelf: 'center' }}>{filtered.length}건 표시</span>
      </div>}

      {/* ═══ reports 테이블 ═══ */}
      {activeTab === 'reports' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #444' }}>
                {['#', '리포트번호', '채널', '캐릭터명', '격국', '신강/약', '용신', '유료', '생성일시', ''].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#8899aa', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.report_no} style={{ borderBottom: '1px solid #2a2f36' }}>
                  <td style={{ padding: '6px 10px', color: '#556' }}>{filtered.length - i}</td>
                  <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 11 }}>{r.report_no}</td>
                  <td style={{ padding: '6px 10px' }}>{r.channel}</td>
                  <td style={{ padding: '6px 10px' }}>{r.char_name}</td>
                  <td style={{ padding: '6px 10px' }}>{r.keyword1}</td>
                  <td style={{ padding: '6px 10px' }}>{r.keyword2}</td>
                  <td style={{ padding: '6px 10px' }}>{r.keyword3}</td>
                  <td style={{ padding: '6px 10px', color: r.is_paid ? '#2ecc71' : '#444', fontSize: 11 }}>{r.is_paid ? 'Y' : '-'}</td>
                  <td style={{ padding: '6px 10px', whiteSpace: 'nowrap', fontSize: 11, color: '#889' }}>{r.created_at}</td>
                  <td style={{ padding: '6px 4px' }}>
                    <button onClick={() => handleDelete(r.report_no)}
                      style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: 11, opacity: 0.5 }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ payments 테이블 ═══ */}
      {activeTab === 'payments' && (
        <div style={{ overflowX: 'auto' }}>
          <p style={{ fontSize: 12, color: '#889', marginBottom: 12 }}>48시간 후 자동 삭제. 결제 검증 전용.</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #444' }}>
                {['#', '주문ID', '리포트번호', '생성일시'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#8899aa', fontWeight: 600, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p: any, i: number) => (
                <tr key={p.order_id} style={{ borderBottom: '1px solid #2a2f36' }}>
                  <td style={{ padding: '6px 10px', color: '#556' }}>{payments.length - i}</td>
                  <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 11 }}>{p.order_id}</td>
                  <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 11 }}>{p.report_no}</td>
                  <td style={{ padding: '6px 10px', fontSize: 11, color: '#889' }}>{p.created_at}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '20px 10px', textAlign: 'center', color: '#556' }}>결제 기록 없음</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ counter (일별 통계) ═══ */}
      {activeTab === 'counter' && (
        <div>
          <table style={{ borderCollapse: 'collapse', fontSize: 13, minWidth: 360 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #444' }}>
                {['날짜', '전체', '무료', '유료'].map(h => (
                  <th key={h} style={{ padding: '8px 20px', textAlign: 'right', color: '#8899aa', fontWeight: 600, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dailyStats.map((d: any) => (
                <tr key={d.date} style={{ borderBottom: '1px solid #2a2f36' }}>
                  <td style={{ padding: '6px 20px', fontFamily: 'monospace', fontSize: 12 }}>{d.date}</td>
                  <td style={{ padding: '6px 20px', textAlign: 'right' }}>{d.total}</td>
                  <td style={{ padding: '6px 20px', textAlign: 'right', color: '#889' }}>{d.free}</td>
                  <td style={{ padding: '6px 20px', textAlign: 'right', color: '#2ecc71', fontWeight: 600 }}>{d.paid}</td>
                </tr>
              ))}
              {/* 합산 */}
              <tr style={{ borderTop: '2px solid #555' }}>
                <td style={{ padding: '8px 20px', fontWeight: 700 }}>누적</td>
                <td style={{ padding: '8px 20px', textAlign: 'right', fontWeight: 700, fontSize: 16 }}>{counterSummary?.total || 0}</td>
                <td style={{ padding: '8px 20px', textAlign: 'right', color: '#889' }}>{(counterSummary?.total || 0) - (counterSummary?.paid || 0)}</td>
                <td style={{ padding: '8px 20px', textAlign: 'right', color: '#2ecc71', fontWeight: 700, fontSize: 16 }}>{counterSummary?.paid || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ PDF 강제 생성 ═══ */}
      {activeTab === 'pdf' && (
        <div style={{ maxWidth: 460 }}>
          <p style={{ fontSize: 12, color: '#889', marginBottom: 16 }}>명식을 입력하면 엔진 계산 → LLM 해석 → PDF 다운로드까지 실행합니다.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 12, color: '#aab' }}>
              이름
              <input value={pdfForm.name} onChange={e => setPdfForm(p => ({ ...p, name: e.target.value }))}
                placeholder="홍길동" style={{ ...S.input, width: '100%', marginTop: 4 }} />
            </label>
            <label style={{ fontSize: 12, color: '#aab' }}>
              생년월일
              <input type="date" value={pdfForm.birthDate} onChange={e => setPdfForm(p => ({ ...p, birthDate: e.target.value }))}
                style={{ ...S.input, width: '100%', marginTop: 4 }} />
            </label>
            <label style={{ fontSize: 12, color: '#aab' }}>
              출생시간
              <input type="time" value={pdfForm.birthTime} onChange={e => setPdfForm(p => ({ ...p, birthTime: e.target.value }))}
                style={{ ...S.input, width: '100%', marginTop: 4 }} />
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ fontSize: 12, color: '#aab' }}>
                성별
                <select value={pdfForm.gender} onChange={e => setPdfForm(p => ({ ...p, gender: e.target.value as any }))}
                  style={{ ...S.input, width: '100%', marginTop: 4 }}>
                  <option value="M">남</option>
                  <option value="F">여</option>
                </select>
              </label>
              <label style={{ fontSize: 12, color: '#aab' }}>
                역법
                <select value={pdfForm.calendar} onChange={e => setPdfForm(p => ({ ...p, calendar: e.target.value as any }))}
                  style={{ ...S.input, width: '100%', marginTop: 4 }}>
                  <option value="solar">양력</option>
                  <option value="lunar">음력</option>
                </select>
              </label>
            </div>
            <button
              disabled={!pdfForm.name || !pdfForm.birthDate || pdfStatus === 'loading'}
              onClick={async () => {
                setPdfStatus('loading');
                try {
                  // 1) 엔진 + Phase1
                  const analyzeRes = await fetch('/api/saju/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      birthDate: pdfForm.birthDate,
                      birthTime: pdfForm.birthTime,
                      calendar: pdfForm.calendar,
                      gender: pdfForm.gender,
                      name: pdfForm.name,
                      birthCity: '서울',
                    }),
                  });
                  if (!analyzeRes.ok) throw new Error('분석 실패');
                  const analyzeData = await analyzeRes.json();

                  // 2) Phase2
                  setPdfStatus('Phase 2 해석 중...');
                  const interpRes = await fetch('/api/saju/interpret', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                  });
                  if (!interpRes.ok) throw new Error('해석 실패');
                  const interpData = await interpRes.json();

                  // 3) PDF 생성
                  setPdfStatus('PDF 렌더링 중...');
                  const pdfRes = await fetch('/api/saju/pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      engine: analyzeData.engine,
                      core: analyzeData.core,
                      sections: interpData.sections,
                      userName: pdfForm.name,
                      reportNo: analyzeData.reportNo,
                    }),
                  });
                  if (!pdfRes.ok) throw new Error('PDF 생성 실패');

                  const blob = await pdfRes.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = analyzeData.reportNo ? `${analyzeData.reportNo}.pdf` : 'admin-report.pdf';
                  a.click();
                  URL.revokeObjectURL(url);
                  setPdfStatus('완료!');
                  fetchData(token);
                } catch (e: any) {
                  setPdfStatus(`오류: ${e.message}`);
                }
              }}
              style={{
                padding: '12px', marginTop: 8,
                background: pdfStatus === 'loading' ? '#555' : '#f0dfad',
                color: '#1a1e24', border: 'none', borderRadius: 4,
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {pdfStatus === 'loading' ? 'Phase 1 분석 중...' : pdfStatus.startsWith('Phase') ? pdfStatus : pdfStatus.startsWith('PDF') ? pdfStatus : 'PDF 생성 및 다운로드'}
            </button>
            {pdfStatus && !['loading'].includes(pdfStatus) && !pdfStatus.startsWith('Phase') && !pdfStatus.startsWith('PDF') && (
              <p style={{ fontSize: 12, color: pdfStatus.startsWith('오류') ? '#e74c3c' : '#2ecc71' }}>{pdfStatus}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
