import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../theme';

export default function RecoveryScreen({ navigation }: any) {
  const [elapsed, setElapsed] = useState(0);
  const [fatigue, setFatigue] = useState(68);

  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(prev => prev + 1);
      setFatigue(prev => Math.max(20, prev - 0.15));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const tempo = 72 - Math.floor(elapsed / 30) * 2; // slows over time

  return (
    <View style={s.root}>
      {/* Top bar */}
      <View style={s.topBar}>
        <View style={s.modePill}>
          <Text style={s.modeText}>Recover {'\u25BE'}</Text>
        </View>
        <TouchableOpacity
          style={s.endBtn}
          onPress={() => navigation.navigate('Summary')}
        >
          <Text style={s.endText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Orb */}
      <View style={s.orbArea}>
        <Svg width={220} height={220}>
          <Defs>
            <RadialGradient id="orb" cx="50%" cy="45%" r="50%">
              <Stop offset="0" stopColor={colors.aqua} stopOpacity="0.7" />
              <Stop offset="0.5" stopColor={colors.teal} stopOpacity="0.4" />
              <Stop offset="1" stopColor={colors.purple} stopOpacity="0.15" />
            </RadialGradient>
          </Defs>
          <Circle cx={110} cy={110} r={90} fill="url(#orb)" />
          <Circle cx={110} cy={110} r={70} fill={colors.teal} opacity={0.1} />
        </Svg>
      </View>

      {/* Caption */}
      <View style={s.caption}>
        <Text style={s.captionTitle}>Easing you back.</Text>
        <Text style={s.captionSub}>You're doing great.</Text>
      </View>

      {/* Metrics */}
      <View style={s.metricsCard}>
        <View style={s.metricCol}>
          <Text style={s.metricLabel}>TEMPO</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text style={s.metricValue}>{tempo}</Text>
            <Text style={s.metricUnit}>BPM</Text>
          </View>
        </View>

        <View style={s.waveCol}>
          {Array.from({ length: 16 }).map((_, i) => (
            <View key={i} style={[s.waveBar, { height: 8 + Math.sin(i * 0.8 + elapsed * 0.3) * 12, backgroundColor: colors.teal }]} />
          ))}
        </View>

        <View style={[s.metricCol, { alignItems: 'flex-end' }]}>
          <Text style={s.metricLabel}>FATIGUE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text style={[s.metricValue, { color: colors.teal }]}>{'\u2193'}{Math.round(fatigue)}</Text>
            <Text style={s.metricUnit}>/100</Text>
          </View>
        </View>
      </View>

      {/* AI Coach */}
      <View style={s.coachCard}>
        <View style={s.coachIcon}>
          <Text style={{ fontSize: 18 }}>{'\uD83E\uDDE0'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.coachLabel}>AI COACH</Text>
          <Text style={s.coachText}>Your theta is climbing {'\u2014'} easing you down with slower sound.</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep, paddingHorizontal: 20, paddingTop: 62 },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modePill: { backgroundColor: '#FFFFFF12', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.cardBorder },
  modeText: { fontSize: 13, fontWeight: '500', color: colors.textPrimary },
  endBtn: { backgroundColor: '#FF5B6E22', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: '#FF5B6E55' },
  endText: { fontSize: 13, fontWeight: '600', color: colors.coral },

  orbArea: { alignItems: 'center', justifyContent: 'center', marginTop: 40, height: 240 },

  caption: { alignItems: 'center', gap: 6, marginTop: 16 },
  captionTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  captionSub: { fontSize: 15, color: colors.teal },

  metricsCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF0F', borderRadius: 22, padding: 20, marginTop: 32, borderWidth: 1, borderColor: colors.cardBorder },
  metricCol: { flex: 1 },
  metricLabel: { fontSize: 9, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.5 },
  metricValue: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginTop: 4 },
  metricUnit: { fontSize: 11, color: colors.textMuted },
  waveCol: { flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' },
  waveBar: { width: 3, borderRadius: 2 },

  coachCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#8B5CF618', borderRadius: 22, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#8B5CF640' },
  coachIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#8B5CF630', alignItems: 'center', justifyContent: 'center' },
  coachLabel: { fontSize: 9, fontWeight: '600', color: colors.purple, letterSpacing: 0.5 },
  coachText: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
