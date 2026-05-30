import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../theme';

export default function SummaryScreen({ navigation }: any) {
  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.popToTop()}>
          <Text style={{ fontSize: 20, color: colors.textPrimary }}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>Session Summary</Text>
        <Text style={{ fontSize: 18, color: colors.textSecondary }}>{'\u2191'}</Text>
      </View>

      {/* Recovery badge */}
      <View style={s.badge}>
        <Text style={s.badgeText}>{'\u2713'} RECOVERY VERIFIED</Text>
      </View>

      {/* Big stat */}
      <Text style={s.bigStat}>Fatigue down 38%</Text>
      <Text style={s.bigSub}>in just 4 minutes {'\u00B7'} Great recovery!</Text>

      {/* Chart card */}
      <View style={s.chartCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={s.chartTitle}>Fatigue over time</Text>
          <Text style={s.chartDuration}>6 min</Text>
        </View>
        {/* Simplified chart representation */}
        <View style={s.chartPlot}>
          <View style={s.chartBaseline}>
            <Text style={s.chartLabel}>Baseline</Text>
          </View>
          <View style={s.chartPeak}>
            <Text style={[s.chartLabel, { color: colors.coral }]}>Fatigue detected</Text>
          </View>
          <View style={s.chartRecovery}>
            <Text style={[s.chartLabel, { color: colors.teal }]}>Recovery started</Text>
          </View>
          <View style={s.chartEnd}>
            <Text style={[s.chartLabel, { color: colors.okGreen }]}>Recovered</Text>
          </View>
        </View>
        <Text style={s.demoLabel}>Illustrative chart {'\u2014'} not measured data</Text>
      </View>

      {/* Stat row */}
      <View style={s.statRow}>
        {[
          { label: 'PEAK', value: '68', unit: '/100', color: colors.coral },
          { label: 'FINAL', value: '28', unit: '/100', color: colors.teal },
          { label: 'DURATION', value: '4', unit: 'min', color: colors.textPrimary },
        ].map(st => (
          <View key={st.label} style={s.statCard}>
            <Text style={s.statLabel}>{st.label}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 4 }}>
              <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
              <Text style={s.statUnit}>{st.unit}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Quality card */}
      <View style={s.qualityCard}>
        <Text style={s.qualityLabel}>Recovery quality</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <Text style={s.qualityValue}>High</Text>
          <Text style={{ fontSize: 16 }}>{'\u2B50\u2B50\u2B50'}</Text>
        </View>
      </View>

      {/* Disclaimer */}
      <Text style={s.disclaimer}>
        BrainPace tracks baseline-relative EEG patterns associated with mental fatigue. It is not a medical diagnostic tool.
      </Text>

      {/* Buttons */}
      <View style={s.buttons}>
        <TouchableOpacity
          style={s.saveBtn}
          onPress={() => navigation.popToTop()}
          activeOpacity={0.8}
        >
          <Text style={s.saveBtnText}>{'\u2713'} Save session</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.shareBtn} activeOpacity={0.8}>
          <Text style={s.shareBtnText}>Share</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep, paddingHorizontal: 20, paddingTop: 62 },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },

  badge: { alignSelf: 'center', marginTop: 24, backgroundColor: '#2EE6C81F', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#2EE6C84D' },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.teal, letterSpacing: 0.3 },

  bigStat: { fontSize: 30, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginTop: 12 },
  bigSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },

  chartCard: { backgroundColor: colors.cardBg, borderRadius: 24, padding: 18, marginTop: 24, borderWidth: 1, borderColor: colors.cardBorder },
  chartTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  chartDuration: { fontSize: 11, color: colors.textMuted },
  chartPlot: { height: 120, marginTop: 12, justifyContent: 'space-between' },
  chartBaseline: { height: 24 },
  chartPeak: { height: 24 },
  chartRecovery: { height: 24 },
  chartEnd: { height: 24 },
  chartLabel: { fontSize: 10, fontWeight: '500', color: colors.textMuted },
  demoLabel: { fontSize: 9, color: colors.textMuted, fontStyle: 'italic', marginTop: 8, textAlign: 'center' },

  statRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  statCard: { flex: 1, backgroundColor: colors.cardBg, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.cardBorder },
  statLabel: { fontSize: 9, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.3 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statUnit: { fontSize: 10, color: colors.textMuted },

  qualityCard: { backgroundColor: '#2EE6C81F', borderRadius: 22, padding: 18, marginTop: 16, borderWidth: 1, borderColor: '#2EE6C84D' },
  qualityLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  qualityValue: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },

  disclaimer: { fontSize: 10.5, color: colors.textMuted, textAlign: 'center', lineHeight: 15, marginTop: 16, paddingHorizontal: 10 },

  buttons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  saveBtn: { flex: 1, backgroundColor: colors.teal, borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: colors.bgDeep },
  shareBtn: { flex: 1, backgroundColor: '#FFFFFF12', borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  shareBtnText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
});
