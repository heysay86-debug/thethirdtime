/**
 * 쉬운 풀이 박스 — Phase 3 결과를 각 섹션 아래에 표시
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import { colors, fontSize } from '../styles';

const s = StyleSheet.create({
  container: {
    backgroundColor: '#f0ebe0',
    borderWidth: 0.5,
    borderColor: '#c4b99a',
    borderRadius: 4,
    padding: 12,
    marginTop: 8,
    marginBottom: 14,
  },
  label: {
    fontFamily: 'Paperlogy',
    fontSize: 8,
    fontWeight: 600,
    color: '#8b7355',
    letterSpacing: 1,
    marginBottom: 6,
  },
  text: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.sm,
    fontWeight: 400,
    color: '#4a3728',
    lineHeight: 1.8,
  },
});

interface Props {
  text?: string | null;
}

export default function EasyReadingBox({ text }: Props) {
  if (!text) return null;

  return (
    <View style={s.container}>
      <Text style={s.label}>쉽게 말하면</Text>
      <Text style={s.text}>{text}</Text>
    </View>
  );
}
