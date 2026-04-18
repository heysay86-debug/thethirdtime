/**
 * 등록된 신살 전체 목록 PDF 출력
 */
import React from 'react';
import { Document, Page, View, Text, StyleSheet, renderToFile } from '@react-pdf/renderer';
import path from 'path';

const s = StyleSheet.create({
  page: { backgroundColor: '#F5F2EB', padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 4, color: '#1a1e24' },
  subtitle: { fontSize: 11, color: '#688097', marginBottom: 20 },
  catTitle: { fontSize: 14, fontWeight: 'bold', color: '#3e4857', marginTop: 16, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 4 },
  row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#ddd', paddingVertical: 4 },
  headerRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#999', paddingBottom: 4, marginBottom: 2 },
  colNo: { width: 30, fontSize: 9, color: '#999' },
  colName: { width: 100, fontSize: 10, fontWeight: 'bold' },
  colLayer: { width: 50, fontSize: 9, textAlign: 'center' },
  colBasis: { width: 80, fontSize: 9, color: '#555' },
  colDesc: { flex: 1, fontSize: 9, color: '#444' },
  header: { fontSize: 9, fontWeight: 'bold', color: '#333' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#999', textAlign: 'center' },
  badge: { fontSize: 8, color: '#fff', backgroundColor: '#a1c5ac', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
  badgeHyung: { fontSize: 8, color: '#fff', backgroundColor: '#e9b8b7', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
});

const sinsalData = [
  // A. 십이신살
  { cat: 'A. 십이신살 (十二神殺)', items: [
    { name: '겁살', layer: 'L1+L2', basis: '연지 기준', desc: '삼합 역방향, 겁탈·강제 변화' },
    { name: '재살', layer: 'L1+L2', basis: '연지 기준', desc: '삼합 역방향, 재앙·외부 충격' },
    { name: '천살', layer: 'L1+L2', basis: '연지 기준', desc: '천재지변, 불가항력적 변화' },
    { name: '지살', layer: 'L1+L2', basis: '연지 기준', desc: '지상 재해, 이동·변동' },
    { name: '연살(년살)', layer: 'L1+L2', basis: '연지 기준', desc: '매력·인기, 이성 관계' },
    { name: '월살', layer: 'L1+L2', basis: '연지 기준', desc: '고독·소외, 내면 성찰' },
    { name: '망신살', layer: 'L1+L2', basis: '연지 기준', desc: '체면 손상, 구설수' },
    { name: '장성살', layer: 'L1+L2', basis: '연지 기준', desc: '권위·리더십, 승진' },
    { name: '반안살', layer: 'L1+L2', basis: '연지 기준', desc: '안정·여유, 준비 기간' },
    { name: '역마살', layer: 'L1+L2', basis: '일지/연지 기준', desc: '이동·변동, 해외·출장' },
    { name: '육해살', layer: 'L1+L2', basis: '연지 기준', desc: '건강 주의, 육체 피로' },
    { name: '화개살', layer: 'L1+L2', basis: '일지/연지 기준', desc: '종교·예술·학문 성향' },
  ]},
  // B. 귀인·길신
  { cat: 'B. 귀인·길신 (吉神)', items: [
    { name: '천을귀인', layer: 'L1+L2', basis: '일간→지지', desc: '최고 귀인, 위기 시 조력자' },
    { name: '문창귀인', layer: 'L1+L2', basis: '일간→지지', desc: '학문·문서 능력, 시험 운' },
    { name: '문곡귀인', layer: 'L1+L2', basis: '일간→지지', desc: '예술·창작 재능' },
    { name: '천복귀인', layer: 'L1+L2', basis: '일간→지지', desc: '하늘의 복, 자연스러운 행운' },
    { name: '천주귀인', layer: 'L1+L2', basis: '일간→지지', desc: '식복·재물복, 의식주 안정' },
    { name: '태극귀인', layer: 'L1+L2', basis: '일간→지지', desc: '원리·철학, 근본적 통찰' },
    { name: '학당귀인', layer: 'L1+L2', basis: '일간→지지', desc: '학업 성취, 교육 관련' },
    { name: '천덕귀인', layer: 'L1+L2', basis: '월지→천간', desc: '도덕·품성, 재난 회피' },
    { name: '월덕귀인', layer: 'L1+L2', basis: '월지→천간', desc: '월간 덕, 모친 복' },
    { name: '금여록', layer: 'L1+L2', basis: '일간→지지', desc: '금전·배우자 복' },
    { name: '암록', layer: 'L1+L2', basis: '일간→지지', desc: '숨은 녹봉, 비공식 수입' },
    { name: '협록', layer: 'L1+L2', basis: '일간→지지쌍', desc: '양쪽에서 끼는 녹, 주변 도움' },
  ]},
  // C. 살성·흉신
  { cat: 'C. 살성·흉신 (凶神)', items: [
    { name: '양인살', layer: 'L1+L2', basis: '일간→지지', desc: '강렬한 기운, 결단력/과격함' },
    { name: '괴강살', layer: 'L1(4종) L2(5종)', basis: '일주 조합', desc: '강한 개성, 지도력/독선' },
    { name: '백호살', layer: 'L1(10종) L2(7종)', basis: '일주 조합', desc: '사고·수술, 급격한 변화' },
    { name: '원진살', layer: 'L1+L2', basis: '일지→지지', desc: '미움·반목, 관계 갈등' },
    { name: '귀문관살', layer: 'L1+L2', basis: '일지→지지', desc: '영감·직감, 심리 불안' },
    { name: '낙정관살', layer: 'L1+L2', basis: '일간쌍→지지', desc: '우물에 빠짐, 수해 주의' },
    { name: '홍염살', layer: 'L1+L2', basis: '일간→지지', desc: '색정·매력, 이성 문제' },
    { name: '현침살', layer: 'L1(일간) L2(4주전체)', basis: '천간/지지 글자', desc: '바늘에 찔림, 수술·주사' },
    { name: '공망', layer: 'L1+L2', basis: '일주 60갑자순', desc: '빈 자리, 헛수고·무효화' },
    { name: '도화살', layer: 'L2 only', basis: '연지/일지→지지', desc: '매력·색정, 이성 인연' },
    { name: '고란살', layer: 'L2 only', basis: '일주 조합', desc: '고독한 인연, 배우자 인연 약함' },
    { name: '과숙살', layer: 'L2 only', basis: '연지→지지', desc: '홀로 지냄, 독신·독립' },
    { name: '급각살', layer: 'L2 only', basis: '일지 (子丑申)', desc: '다리 부상, 급한 행동 주의' },
  ]},
];

function SinsalListPdf() {
  let globalNo = 0;
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.title}>제3의시간 — 신살 등록 목록</Text>
        <Text style={s.subtitle}>Layer 1: 엔진용 (이석영 기준) / Layer 2: 표시용 (통용 만세력 기준) / 총 {sinsalData.reduce((a, c) => a + c.items.length, 0)}종</Text>

        {sinsalData.map((cat) => (
          <View key={cat.cat}>
            <Text style={s.catTitle}>{cat.cat}</Text>
            <View style={s.headerRow}>
              <Text style={[s.colNo, s.header]}>#</Text>
              <Text style={[s.colName, s.header]}>신살명</Text>
              <Text style={[s.colLayer, s.header]}>레이어</Text>
              <Text style={[s.colBasis, s.header]}>판정 기준</Text>
              <Text style={[s.colDesc, s.header]}>의미</Text>
            </View>
            {cat.items.map((item) => {
              globalNo++;
              return (
                <View key={item.name} style={s.row}>
                  <Text style={s.colNo}>{globalNo}</Text>
                  <Text style={s.colName}>{item.name}</Text>
                  <Text style={s.colLayer}>{item.layer}</Text>
                  <Text style={s.colBasis}>{item.basis}</Text>
                  <Text style={s.colDesc}>{item.desc}</Text>
                </View>
              );
            })}
          </View>
        ))}

        <Text style={s.footer}>제3의시간 · 신살 레지스트리 · {new Date().toISOString().slice(0, 10)}</Text>
      </Page>
    </Document>
  );
}

async function main() {
  const outPath = path.join(__dirname, 'output', 'sinsal-list.pdf');
  await renderToFile(React.createElement(SinsalListPdf) as any, outPath);
  console.log(`PDF 생성 완료: ${outPath}`);
}

main().catch(console.error);
