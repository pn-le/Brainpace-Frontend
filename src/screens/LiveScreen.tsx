/**
 * LatestScreen — Shows the most recent 5-min pull from AWear.
 * No real-time streaming. Polls every 5 min, shows 300-epoch snapshot.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { colors, BANDS, getTBRLevel } from '../theme';
import { useEEGStream, formatPower, formatDuration, formatCountdown } from '../hooks/useEEGStream';
import CognitiveChart from '../components/CognitiveChart';

const SW = Dimensions.get('window').width;

export default function LatestScreen({ navigation }: any) {
  const {
    tbr, fatigueState, fatigueColor, bands, prediction, tbrHistory,
    lastPullAgo, nextPullIn, epochsInWindow, refreshNow, isConnected,
  } = useEEGStream();

  const level = getTBRLevel(tbr);

  const bandEntries = [
    { key: 'delta' as const, pct: 0.12 },
    { key: 'theta' as const, pct: 0.82 },
    { key: 'alpha' as const, pct: 0.48 },
    { key: 'beta'  as const, pct: 0.26 },
    { key: 'gamma' as const, pct: 0.08 },
  ];

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Latest Reading</Text>
      <Text style={styles.subtitle}>AWear EEG · Polled every 5 min</Text>

      {/* Polling status bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>
          Last pull: {lastPullAgo < 60 ? `${lastPullAgo}s ago` : `${Math.floor(lastPullAgo / 60)}m ago`}
        </Text>
        <Text style={styles.countdownText}>Next in {formatCountdown(nextPullIn)}</Text>
        <TouchableOpacity onPress={refreshNow} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* ── 5-MINUTE SNAPSHOT CARD ── */}
      <View style={styles.snapshotCard}>
        <Text style={styles.snapLabel}>5-Minute Snapshot</Text>
        <Text style={styles.snapSub}>{epochsInWindow} epochs · Welch PSD · n_fft=256</Text>

        <View style={styles.snapRow}>
          {/* TBR + State */}
          <View>
            <Text style={styles.snapTBRLabel}>TBR</Text>
            <Text style={[styles.snapTBR, { color: level.color }]}>{tbr.toFixed(1)}</Text>
            <View style={[styles.statePill, { backgroundColor: level.color }]}>
              <Text style={styles.stateText}>{level.label.toUpperCase()}</Text>
            </View>
          </View>

          {/* Band powers */}
          <View style={styles.snapBands}>
            <Text style={styles.snapBandsTitle}>Avg over window</Text>
            {[
              { sym: 'θ', k: 'theta' as const, c: colors.warn },
              { sym: 'β', k: 'beta' as const,  c: colors.teal },
              { sym: 'α', k: 'alpha' as const, c: colors.purp },
            ].map(b => (
              <View key={b.k} style={styles.snapBandRow}>
                <Text style={styles.snapBandLabel}>{b.sym} Power</Text>
                <Text style={[styles.snapBandVal, { color: b.c }]}>{formatPower(bands[b.k])} V²/Hz</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Trend indicators */}
        {prediction && (
          <View style={styles.trendRow}>
            <Text style={[styles.trendText, { color: prediction.trend === 'increasing' ? colors.warnL : colors.good }]}>
              {prediction.trend === 'increasing' ? '↑' : prediction.trend === 'decreasing' ? '↓' : '→'}{' '}
              {prediction.tbr_vs_baseline > 0 ? `+${prediction.tbr_vs_baseline.toFixed(1)}` : prediction.tbr_vs_baseline.toFixed(1)} from baseline
            </Text>
            <Text style={styles.trendSub}>
              Baseline: {prediction.baseline_tbr.toFixed(1)} · Slope: {prediction.slope_per_min.toFixed(3)}/min
            </Text>
          </View>
        )}
      </View>

      {/* ── BAND POWER BARS ── */}
      <Text style={styles.sectionTitle}>Band Powers · 300-epoch avg</Text>
      {bandEntries.map(b => {
        const info = BANDS[b.key];
        return (
          <View key={b.key} style={styles.barRow}>
            <Text style={styles.barLabel}>{info.label} ({info.range})</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${b.pct * 100}%`, backgroundColor: info.color }]} />
            </View>
            <Text style={[styles.barValue, { color: info.color }]}>{formatPower(bands[b.key])}</Text>
          </View>
        );
      })}

      {/* ── TBR HISTORY CHART ── */}
      <View style={styles.chartSection}>
        <View style={styles.chartHeader}>
          <Text style={styles.sectionTitle}>TBR History · 5-min intervals</Text>
          <View style={styles.pillRow}>
            {['2h', '6h', '12h', '24h'].map((p, i) => (
              <TouchableOpacity key={p} style={[styles.pill, i === 0 && styles.pillActive]}>
                <Text style={[styles.pillText, i === 0 && styles.pillTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <CognitiveChart
          data={tbrHistory}
          width={SW - 32}
          height={160}
          showPrediction={false}
        />
      </View>

      {/* ── HOW IT WORKS ── */}
      <View style={styles.infoCard}>
        <View style={styles.infoDot} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoBody}>
            AWear API polled every 5 min → 300 1-sec epochs fetched → bandpass_fft per band → Welch PSD → TBR computed → displayed here
          </Text>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '700', color: colors.tp },
  subtitle: { fontSize: 11, color: colors.tl, marginTop: 4 },

  statusBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg2,
    borderRadius: 10, padding: 10, marginTop: 12, gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.good },
  statusText: { fontSize: 11, color: colors.good, flex: 1 },
  countdownText: { fontSize: 11, color: colors.ts },
  refreshBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.bg3, alignItems: 'center', justifyContent: 'center' },
  refreshText: { fontSize: 14, color: colors.purpL },

  snapshotCard: {
    backgroundColor: colors.bg2, borderRadius: 18, padding: 16, marginTop: 12,
    shadowColor: colors.purp, shadowOpacity: 0.12, shadowOffset: { width: 0, height: 4 }, shadowRadius: 16, elevation: 4,
  },
  snapLabel: { fontSize: 12, fontWeight: '600', color: colors.ts },
  snapSub: { fontSize: 9, color: colors.tl, marginTop: 2 },
  snapRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  snapTBRLabel: { fontSize: 10, fontWeight: '600', color: colors.ts },
  snapTBR: { fontSize: 38, fontWeight: '700', marginTop: 2 },
  statePill: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 8, marginTop: 6, alignSelf: 'flex-start' },
  stateText: { fontSize: 9, fontWeight: '800', color: '#0A0500' },
  snapBands: { alignItems: 'flex-end' },
  snapBandsTitle: { fontSize: 8, color: colors.tl, marginBottom: 4 },
  snapBandRow: { flexDirection: 'row', gap: 6, marginBottom: 3 },
  snapBandLabel: { fontSize: 9, color: colors.ts },
  snapBandVal: { fontSize: 9, fontWeight: '700' },
  trendRow: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.bg3 },
  trendText: { fontSize: 10, fontWeight: '600' },
  trendSub: { fontSize: 8, color: colors.tl, marginTop: 3 },

  sectionTitle: { fontSize: 12, fontWeight: '600', color: colors.tp, marginTop: 16, marginBottom: 8 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  barLabel: { fontSize: 10, color: colors.ts, width: 100 },
  barTrack: { flex: 1, height: 7, backgroundColor: colors.bg3, borderRadius: 4 },
  barFill: { height: 7, borderRadius: 4 },
  barValue: { fontSize: 10, fontWeight: '600', width: 56, textAlign: 'right' },

  chartSection: { marginTop: 8 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pillRow: { flexDirection: 'row', gap: 4 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: colors.bg3 },
  pillActive: { backgroundColor: colors.purp },
  pillText: { fontSize: 9, color: colors.ts },
  pillTextActive: { fontSize: 9, fontWeight: '700', color: colors.white },

  infoCard: { flexDirection: 'row', backgroundColor: colors.bg2, borderRadius: 12, padding: 12, marginTop: 16, alignItems: 'flex-start' },
  infoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.purp, marginTop: 2 },
  infoTitle: { fontSize: 11, fontWeight: '600', color: colors.ts },
  infoBody: { fontSize: 9, color: colors.tl, marginTop: 3, lineHeight: 14 },
});
