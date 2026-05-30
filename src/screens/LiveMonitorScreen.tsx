import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme';
import { useEEGStream, formatPower } from '../hooks/useEEGStream';

export default function LiveMonitorScreen({ navigation }: any) {
  const { tbr, bands, fatigueState } = useEEGStream();

  // Convert TBR to 0-100 fatigue score (approximate)
  const fatigueScore = Math.min(100, Math.round(tbr * 20));
  const pct = fatigueScore / 100;
  const r = 70;
  const circ = 2 * Math.PI * r;
  const arcLen = circ * 0.75;
  const offset = arcLen * (1 - pct);

  const statusLabel = fatigueState === 'alert' ? 'Focused \u2014 fatigue low' :
    fatigueState === 'mild_fatigue' ? 'Mild fatigue building' :
    fatigueState === 'significant_fatigue' ? 'Fatigued \u2014 break recommended' :
    'Severely fatigued \u2014 stop now';
  const statusColor = fatigueState === 'alert' ? colors.okGreen :
    fatigueState === 'mild_fatigue' ? colors.amber :
    colors.coral;

  const bandStats = [
    { label: 'Theta', value: formatPower(bands.theta), unit: '\u00B5V\u00B2', color: colors.bandTheta },
    { label: 'Alpha', value: formatPower(bands.alpha), unit: '\u00B5V\u00B2', color: colors.bandAlpha },
    { label: 'Engagement', value: `${Math.round((1 - pct) * 100)}`, unit: '%', color: colors.teal },
  ];

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Top bar */}
      <View style={s.topBar}>
        <View style={s.logoRow}>
          <View style={s.logoDot} />
          <Text style={s.logoText}>BrainPace</Text>
        </View>
        <View style={s.connBadge}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.okGreen }} />
          <Text style={s.connText}>Connected</Text>
        </View>
      </View>

      <Text style={s.title}>Live Monitor</Text>

      {/* Gauge */}
      <View style={s.gaugeWrap}>
        <Svg width={180} height={180}>
          <Circle cx={90} cy={90} r={r} stroke={colors.textMuted} strokeWidth={6} fill="none" opacity={0.15}
            strokeDasharray={`${arcLen} ${circ}`} rotation="-225" origin="90,90" strokeLinecap="round" />
          <Circle cx={90} cy={90} r={r} stroke={statusColor} strokeWidth={6} fill="none"
            strokeDasharray={`${arcLen} ${circ}`} strokeDashoffset={offset}
            rotation="-225" origin="90,90" strokeLinecap="round" />
        </Svg>
        <View style={s.gaugeCenter}>
          <Text style={[s.gaugeScore, { color: statusColor }]}>{fatigueScore}</Text>
          <Text style={s.gaugeLabel}>FATIGUE</Text>
          <Text style={s.gaugeRange}>0 \u2013 100</Text>
        </View>
      </View>

      {/* Status */}
      <View style={s.statusRow}>
        <View style={[s.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[s.statusText, { color: statusColor }]}>{statusLabel}</Text>
      </View>

      {/* Band stats */}
      <View style={s.statsRow}>
        {bandStats.map(b => (
          <View key={b.label} style={s.statCard}>
            <Text style={s.statLabel}>{b.label}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
              <Text style={[s.statValue, { color: colors.textPrimary }]}>{b.value}</Text>
              <Text style={s.statUnit}>{b.unit}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Live EEG placeholder */}
      <View style={s.eegCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={s.eegTitle}>Live EEG</Text>
          <View style={s.liveBadge}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.coral }} />
            <Text style={s.liveText}>LIVE</Text>
          </View>
        </View>
        <View style={s.eegWave}>
          <Text style={{ color: colors.teal, fontSize: 10, fontFamily: 'monospace' }}>
            {'~'.repeat(40)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase, paddingHorizontal: 16, paddingTop: 62 },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.teal },
  logoText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  connBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFFFFF0F', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: colors.cardBorder },
  connText: { fontSize: 11, fontWeight: '500', color: colors.okGreen },

  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginTop: 16 },

  gaugeWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  gaugeCenter: { position: 'absolute', alignItems: 'center' },
  gaugeScore: { fontSize: 56, fontWeight: '800' },
  gaugeLabel: { fontSize: 10, fontWeight: '600', color: colors.textMuted, letterSpacing: 1 },
  gaugeRange: { fontSize: 9, color: colors.textMuted, marginTop: 2 },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', marginTop: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  statCard: { flex: 1, backgroundColor: colors.cardBg, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.cardBorder },
  statLabel: { fontSize: 10, color: colors.textMuted },
  statValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  statUnit: { fontSize: 10, color: colors.textMuted },

  eegCard: { backgroundColor: colors.cardBg, borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: colors.cardBorder },
  eegTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveText: { fontSize: 9, fontWeight: '700', color: colors.coral },
  eegWave: { marginTop: 12, height: 40, justifyContent: 'center' },
});
