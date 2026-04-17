/**
 * PDF 마무리 페이지
 *
 * 필자 인사말 + stamp 인장 + 브랜드 서명
 * 리포트의 마지막 페이지.
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import PageLayout, { StampEmblem } from './PageLayout';
import { colors, fontSize } from '../styles';

interface ClosingPageProps {
  analysisDate: string;
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  dividerTop: {
    width: 40,
    height: 0.5,
    backgroundColor: colors.goldDim,
    marginBottom: 40,
  },
  greeting: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.md,
    fontWeight: 400,
    color: colors.textBody,
    lineHeight: 2.2,
    textAlign: 'center',
    marginBottom: 40,
  },
  stampArea: {
    alignItems: 'center',
    marginBottom: 30,
  },
  brandName: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.sm,
    fontWeight: 300,
    color: colors.blueGray,
    letterSpacing: 3,
    marginTop: 12,
  },
  date: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.xs,
    fontWeight: 300,
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 6,
  },
  dividerBottom: {
    width: 40,
    height: 0.5,
    backgroundColor: colors.goldDim,
    marginTop: 40,
  },
  copyright: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.xs,
    fontWeight: 300,
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 20,
    textAlign: 'center',
  },
});

export default function ClosingPage({ analysisDate }: ClosingPageProps) {
  return (
    <PageLayout>
      <View style={s.container}>
        <View style={s.dividerTop} />

        <Text style={s.greeting}>
          이 리포트가 자신을 이해하는{'\n'}
          하나의 시선이 되기를 바랍니다.
        </Text>

        {/* stamp 인장 */}
        <View style={s.stampArea}>
          <StampEmblem size={48} />
          <Text style={s.brandName}>제3의시간</Text>
          <Text style={s.date}>{analysisDate}</Text>
        </View>

        <View style={s.dividerBottom} />
        <Text style={s.copyright}>© 2026 제3의시간. All rights reserved.</Text>
      </View>
    </PageLayout>
  );
}
