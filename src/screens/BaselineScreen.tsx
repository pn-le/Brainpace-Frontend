import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme';

const DURATION = 60;

export default function BaselineScreen({ navigation }: any) {
  const [remaining, setRemaining] = useState(DURATION);
  const timer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    timer.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer.current!);
          navigation.navigate('LiveMonitor');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer.current!);
  }, [navigation]);

  const pct = 1 - remaining / DURATION;
  const r = 80;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Baseline capture</Text>
        <Text style={s.subtitle}>We're learning your fresh state.</Text>
      </View>

      {/* Countdown ring */}
      <View style={s.ringWrap}>
        <Svg width={200} height={200}>
          <Circle cx={100} cy={100} r={r} stroke={colors.teal} strokeWidth={4} fill="none" opacity={0.15} />
          <Circle
            cx={100} cy={100} r={r}
            stroke={colors.teal} strokeWidth={4} fill="none"
            strokeDasharray={`${circ}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            rotation="-90" origin="100,100"
          />
        </Svg>
        <View style={s.ringCenter}>
          <Text style={s.countdown}>{remaining}s</Text>
        </View>
      </View>

      {/* Instruction */}
      <Text style={s.instruction}>Relax. Stay still. Breathe naturally.</Text>

      {/* Cancel */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.cancelBtn}>
        <Text style={s.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase, alignItems: 'center', justifyContent: 'space-between', paddingTop: 80, paddingBottom: 40, paddingHorizontal: 20 },

  header: { alignItems: 'center', gap: 6 },
  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary },

  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  countdown: { fontSize: 64, fontWeight: '700', color: colors.teal },

  instruction: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },

  cancelBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  cancelText: { fontSize: 14, fontWeight: '500', color: colors.textMuted },
});
