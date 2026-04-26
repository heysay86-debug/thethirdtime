'use client';

import { useState, useEffect, useMemo } from 'react';

interface Report {
  report_no: string;
  channel: string;
  char_name: string;
  keyword1: string;
  keyword2: string;
  keyword3: string;
  age_group: string;
  gender: string;
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
  const [activeTab, setActiveTab] = useState<'reports' | 'payments' | 'counter' | 'pdf' | 'cabinet' | 'inquiries'>('reports');
  const [payments, setPayments] = useState<any[]>([]);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [counterSummary, setCounterSummary] = useState<any>(null);
  const [concurrent, setConcurrent] = useState({ current: 0, max: 5 });
  const [showWelcome, setShowWelcome] = useState(false);

  // PDF 강제 생성 폼
  const [pdfForm, setPdfForm] = useState({ name: '', birthDate: '', birthTime: '12:00', birthTimeUnknown: false, gender: 'M' as 'M' | 'F', calendar: 'solar' as 'solar' | 'lunar' });
  const [pdfStatus, setPdfStatus] = useState('');

  // 캐비넷
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [inquiryReply, setInquiryReply] = useState<Record<string, string>>({});
  const [cabinetFiles, setCabinetFiles] = useState<{ name: string; size: number; created: string }[]>([]);
  const [cabinetLoading, setCabinetLoading] = useState(false);
  const [cabinetSearch, setCabinetSearch] = useState('');
  const [cabinetOffset, setCabinetOffset] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [rRes, pRes, cRes] = await Promise.all([
        fetch(`/api/admin/reports?table=reports&limit=500`),
        fetch(`/api/admin/reports?table=payments&limit=100`),
        fetch(`/api/admin/reports?table=counter`),
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
      const res = await fetch(`/api/admin/reports?reportNo=${encodeURIComponent(reportNo)}`, { method: 'DELETE' });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.report_no !== reportNo));
      } else {
        alert('삭제 실패');
      }
    } catch { alert('삭제 실패'); }
  };

  const fetchCabinet = async (offset = 0, search = '') => {
    setCabinetLoading(true);
    try {
      const params = new URLSearchParams({ offset: String(offset), limit: '50' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/cabinet?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setCabinetFiles(data.files || []);
      setCabinetOffset(offset);
    } catch {}
    finally { setCabinetLoading(false); }
  };

  const handleDownload = async (fileName: string) => {
    try {
      const res = await fetch(`/api/admin/cabinet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
      });
      const data = await res.json();
      if (data.url) window.open(data.url, '_blank');
      else alert('다운로드 URL 생성 실패');
    } catch { alert('다운로드 실패'); }
  };

  const fetchInquiries = async () => {
    try {
      const res = await fetch('/api/contact');
      if (!res.ok) return;
      const data = await res.json();
      setInquiries(data.inquiries || []);
    } catch {}
  };

  const handleReply = async (id: string) => {
    const reply = inquiryReply[id];
    if (!reply?.trim()) return;
    try {
      const res = await fetch('/api/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, reply: reply.trim() }),
      });
      if (res.ok) {
        setInquiryReply(prev => ({ ...prev, [id]: '' }));
        fetchInquiries();
      }
    } catch {}
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      if (res.ok) {
        await fetchData();
      } else {
        setError('인증 실패');
      }
    } catch { setError('서버 연결 실패'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!authenticated || !token) return;
    const id = setInterval(() => fetchData(), 5 * 60 * 1000);
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
          <button onClick={() => fetchData()} style={S.btn}>{loading ? '...' : '새로고침'}</button>
          <button onClick={async () => {
            await fetch('/api/admin/auth', { method: 'DELETE' });
            setAuthenticated(false); setReports([]); setToken('');
          }} style={{ ...S.btn, color: '#e74c3c' }}>로그아웃</button>
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
        {(['reports', 'payments', 'counter', 'pdf', 'cabinet', 'inquiries'] as const).map(tab => (
          <button key={tab} onClick={() => {
            setActiveTab(tab);
            if (tab === 'cabinet' && cabinetFiles.length === 0) fetchCabinet();
            if (tab === 'inquiries' && inquiries.length === 0) fetchInquiries();
          }}
            style={{ ...S.btn, background: activeTab === tab ? '#f0dfad' : '#333', color: activeTab === tab ? '#1a1e24' : '#dde1e5', fontWeight: activeTab === tab ? 700 : 400 }}>
            {tab === 'reports' ? `리포트 (${reports.length})` : tab === 'payments' ? `결제 (${payments.length})` : tab === 'counter' ? '카운터' : tab === 'pdf' ? 'PDF 생성' : tab === 'cabinet' ? '캐비넷' : '의뢰서'}
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
                {['#', '리포트번호', '채널', '캐릭터명', '연령', '성별', '격국', '신강/약', '용신', '유료', '생성일시', ''].map(h => (
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
                  <td style={{ padding: '6px 10px', fontSize: 11, color: '#889' }}>{r.age_group || '-'}</td>
                  <td style={{ padding: '6px 10px', fontSize: 11, color: r.gender === 'F' ? '#e88' : '#88b' }}>{r.gender === 'F' ? '여' : r.gender === 'M' ? '남' : '-'}</td>
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

      {/* ═══ 캐비넷 (PDF 보관함) ═══ */}
      {activeTab === 'cabinet' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <input
              value={cabinetSearch}
              onChange={e => setCabinetSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setCabinetOffset(0); fetchCabinet(0, cabinetSearch); } }}
              placeholder="파일명 검색 (Enter)"
              style={{ ...S.input, width: 240 }}
            />
            <button onClick={() => { setCabinetOffset(0); fetchCabinet(0, cabinetSearch); }} style={S.btn}>
              {cabinetLoading ? '...' : '검색'}
            </button>
            <button onClick={() => { setCabinetSearch(''); setCabinetOffset(0); fetchCabinet(0, ''); }} style={{ ...S.btn, color: '#889' }}>
              초기화
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #444' }}>
                  {['#', '파일명', '크기', '생성일', ''].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#8899aa', fontWeight: 600, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cabinetFiles.map((f, i) => (
                  <tr key={f.name} style={{ borderBottom: '1px solid #2a2f36' }}>
                    <td style={{ padding: '6px 10px', color: '#556', fontSize: 11 }}>{cabinetOffset + i + 1}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontSize: 11 }}>{f.name}</td>
                    <td style={{ padding: '6px 10px', fontSize: 11, color: '#889' }}>{(f.size / 1024).toFixed(0)}KB</td>
                    <td style={{ padding: '6px 10px', fontSize: 11, color: '#889' }}>{f.created ? new Date(f.created).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '-'}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <button
                        onClick={() => handleDownload(f.name)}
                        style={{ ...S.btn, fontSize: 11, padding: '4px 10px' }}
                      >
                        다운로드
                      </button>
                    </td>
                  </tr>
                ))}
                {cabinetFiles.length === 0 && !cabinetLoading && (
                  <tr><td colSpan={5} style={{ padding: '20px 10px', textAlign: 'center', color: '#556' }}>PDF 파일 없음</td></tr>
                )}
                {cabinetLoading && (
                  <tr><td colSpan={5} style={{ padding: '20px 10px', textAlign: 'center', color: '#889' }}>불러오는 중...</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
            <button
              disabled={cabinetOffset === 0}
              onClick={() => fetchCabinet(Math.max(0, cabinetOffset - 50), cabinetSearch)}
              style={{ ...S.btn, opacity: cabinetOffset === 0 ? 0.4 : 1 }}
            >
              이전
            </button>
            <span style={{ fontSize: 12, color: '#889', lineHeight: '30px' }}>
              {cabinetOffset + 1}~{cabinetOffset + cabinetFiles.length}
            </span>
            <button
              disabled={cabinetFiles.length < 50}
              onClick={() => fetchCabinet(cabinetOffset + 50, cabinetSearch)}
              style={{ ...S.btn, opacity: cabinetFiles.length < 50 ? 0.4 : 1 }}
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* ═══ 의뢰서 ═══ */}
      {activeTab === 'inquiries' && (
        <div>
          <button onClick={fetchInquiries} style={S.btn}>새로고침</button>
          <div style={{ marginTop: 12 }}>
            {inquiries.length === 0 && (
              <div style={{ color: '#556', padding: '20px 0', textAlign: 'center' }}>의뢰서 없음</div>
            )}
            {inquiries.map((inq: any) => (
              <div key={inq.id} style={{
                background: inq.status === 'done' ? '#1e2a1e' : '#252a31',
                borderRadius: 8, padding: 14, marginBottom: 10,
                border: `1px solid ${inq.status === 'done' ? '#2a4a2a' : '#333'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#f0dfad', fontWeight: 600 }}>
                    {inq.nickname || '익명'} {inq.email && <span style={{ color: '#889', fontWeight: 400 }}>({inq.email})</span>}
                  </span>
                  <span style={{ fontSize: 10, color: '#556' }}>{inq.createdAt?.slice(0, 16).replace('T', ' ')}</span>
                </div>
                <div style={{ fontSize: 13, color: '#dde1e5', lineHeight: 1.6, marginBottom: 8, whiteSpace: 'pre-wrap' }}>
                  {inq.message}
                </div>
                {inq.status === 'done' ? (
                  <div style={{ background: 'rgba(46,204,113,0.08)', borderRadius: 6, padding: 10 }}>
                    <div style={{ fontSize: 10, color: '#2ecc71', marginBottom: 4 }}>답변 완료 · {inq.repliedAt?.slice(0, 16).replace('T', ' ')}</div>
                    <div style={{ fontSize: 12, color: '#ccc', whiteSpace: 'pre-wrap' }}>{inq.reply}</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <textarea
                      value={inquiryReply[inq.id] || ''}
                      onChange={e => setInquiryReply(prev => ({ ...prev, [inq.id]: e.target.value }))}
                      placeholder="답변 작성..."
                      style={{
                        flex: 1, padding: '8px 10px', fontSize: 12,
                        background: '#1a1e24', border: '1px solid #444', borderRadius: 4,
                        color: '#dde1e5', resize: 'vertical', minHeight: 40,
                      }}
                    />
                    <button
                      onClick={() => handleReply(inq.id)}
                      disabled={!inquiryReply[inq.id]?.trim()}
                      style={{
                        ...S.btn,
                        background: inquiryReply[inq.id]?.trim() ? '#f0dfad' : '#333',
                        color: inquiryReply[inq.id]?.trim() ? '#1a1e24' : '#556',
                        alignSelf: 'flex-end',
                      }}
                    >
                      답변
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
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
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                <input type="time" value={pdfForm.birthTime} disabled={pdfForm.birthTimeUnknown}
                  onChange={e => setPdfForm(p => ({ ...p, birthTime: e.target.value }))}
                  style={{ ...S.input, flex: 1, opacity: pdfForm.birthTimeUnknown ? 0.4 : 1 }} />
                <label style={{ fontSize: 11, color: '#889', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <input type="checkbox" checked={pdfForm.birthTimeUnknown}
                    onChange={e => setPdfForm(p => ({ ...p, birthTimeUnknown: e.target.checked }))} />
                  시간 모름
                </label>
              </div>
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
                setPdfStatus('분석 + PDF 생성 중... (최대 3분 소요)');
                try {
                  const controller = new AbortController();
                  const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5분
                  const res = await fetch(`/api/admin/generate-pdf`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: pdfForm.name,
                      birthDate: pdfForm.birthDate,
                      ...(!pdfForm.birthTimeUnknown && { birthTime: pdfForm.birthTime }),
                      gender: pdfForm.gender,
                      calendar: pdfForm.calendar,
                    }),
                    signal: controller.signal,
                  });
                  clearTimeout(timeout);
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: 'PDF 생성 실패' }));
                    throw new Error(err.error || 'PDF 생성 실패');
                  }

                  const blob = await res.blob();
                  const cd = res.headers.get('Content-Disposition') || '';
                  const fnMatch = cd.match(/filename="(.+?)"/);
                  const fileName = fnMatch ? fnMatch[1] : 'admin-report.pdf';

                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = fileName;
                  a.click();
                  URL.revokeObjectURL(url);
                  setPdfStatus('완료!');
                  fetchData();
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
