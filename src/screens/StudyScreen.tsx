import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { colors, getTBRLevel } from '../theme';
import { useEEGStream, formatDuration } from '../hooks/useEEGStream';
import CognitiveChart from '../components/CognitiveChart';

const SW = Dimensions.get('window').width;

const PAST_SESSIONS = [
  { name: 'Linear Algebra', dur: '2h 05m', tbr: 2.8, breaks: 3, grade: 'B+', color: colors.warnL },
  { name: 'Organic Chem',   dur: '1h 40m', tbr: 3.6, breaks: 1, grade: 'C',  color: colors.warn },
  { name: 'Neuroscience',   dur: '1h 15m', tbr: 2.1, breaks: 2, grade: 'A-', color: colors.good },
];

export default function StudyScreen({ navigation }: any) {
  const { tbr, prediction, tbrHistory, sessionSec, breakCount, logBreak } = useEEGStream();
  const level = getTBRLevel(tbr);
  const retention = prediction?.estimated_retention ?? 100;

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Text style={styles.title}>Study Session</Text>
      <Text style={styles.subtitle}>Organic Chemistry · AWear streaming</Text>

      {/* Stat pills */}
      <View style={styles.pillRow}>
        {[
          { l: 'Duration', v: formatDuration(sessionSec) },
          { l: 'Avg TBR', v: tbr.toFixed(1) },
          { l: 'Breaks', v: `${breakCount}` },
          { l: 'Retain', v: `${retention}%` },
        ].map(s => (
          <View key={s.l} style={styles.statPill}>
            <Text style={styles.statLabel}>{s.l}</Text>
            <Text style={styles.statValue}>{s.v}</Text>
          </View>
        ))}
      </View>

      {/* ── MASSIVE CHART ── */}
      <CognitiveChart
        data={tbrHistory}
        width={SW - 24}
        height={260}
        showPrediction={true}
        predictedSevereMin={prediction?.predicted_severe_in_min}
      />

      {/* Take Break button (if urgent) */}
      {prediction && prediction.urgency !== 'none' && (
        <TouchableOpacity
          style={[styles.breakBtn, prediction.urgency === 'critical' && styles.breakBtnCritical]}
          onPress={logBreak}
          activeOpacity={0.85}
        >
          <Text style={styles.breakBtnText}>
            {prediction.urgency === 'critical' ? '⚠ TAKE BREAK NOW' : '☕ Log Break'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Prediction card */}
      {prediction && (
        <View style={styles.predCard}>
          <View style={styles.predHeader}>
            <Text style={{ fontSize: 14 }}>🧠</Text>
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={styles.predTitle}>Fatigue Prediction</Text>
              <Text style={styles.predSub}>Based on TBR slope · {tbrHistory.length} data points</Text>
            </View>
          </View>

          <View style={styles.predStats}>
            {[
              { l: 'To severe', v: prediction.predicted_severe_in_min ? `~${prediction.predicted_severe_in_min} min` : '—', c: colors.warn },
              { l: 'Break at', v: prediction.urgency === 'critical' ? 'NOW' : prediction.optimal_break_in_min ? `~${prediction.optimal_break_in_min}m` : '—', c: colors.teal },
              { l: 'Recovery', v: '8–10 min', c: colors.good },
            ].map(s => (
              <View key={s.l} style={styles.predStat}>
                <Text style={styles.predStatLabel}>{s.l}</Text>
                <Text style={[styles.predStatValue, { color: s.c }]}>{s.v}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.predNote}>
            → You lose ~40% retention past TBR 3.5
          </Text>
        </View>
      )}

      {/* Past sessions */}
      <Text style={styles.sectionTitle}>Past Sessions</Text>
      {PAST_SESSIONS.map(se => (
        <View key={se.name} style={styles.sessionRow}>
          <View style={[styles.sessionBorder, { backgroundColor: se.color }]} />
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionName}>{se.name}</Text>
            <Text style={styles.sessionMeta}>{se.dur} · TBR {se.tbr} · {se.breaks} breaks</Text>
          </View>
          <View style={[styles.gradePill, { backgroundColor: se.color }]}>
            <Text style={styles.gradeText}>{se.grade}</Text>
          </View>
        </View>
      ))}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 12, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '700', color: colors.tp },
  subtitle: { fontSize: 11, color: colors.tl, marginTop: 4 },

  pillRow: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 12 },
  statPill: { flex: 1, backgroundColor: colors.bg2, borderRadius: 10, padding: 10 },
  statLabel: { fontSize: 8, color: colors.ts },
  statValue: { fontSize: 16, fontWeight: '700', color: colors.purpL, marginTop: 2 },

  breakBtn: { backgroundColor: colors.teal, borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  breakBtnCritical: { backgroundColor: colors.warn },
  breakBtnText: { fontSize: 14, fontWeight: '700', color: '#030604' },

  predCard: { backgroundColor: '#2A1806', borderRadius: 16, padding: 16, marginTop: 12, borderLeftWidth: 4, borderLeftColor: colors.warn },
  predHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  predTitle: { fontSize: 13, fontWeight: '600', color: colors.warn },
  predSub: { fontSize: 9, color: colors.ts, marginTop: 2 },
  predStats: { flexDirection: 'row', marginTop: 12, gap: 8 },
  predStat: { flex: 1 },
  predStatLabel: { fontSize: 8, color: colors.ts },
  predStatValue: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  predNote: { fontSize: 9, color: colors.warnL, marginTop: 10 },

  sectionTitle: { fontSize: 12, fontWeight: '600', color: colors.tp, marginTop: 16, marginBottom: 8 },
  sessionRow: { flexDirection: 'row', backgroundColor: colors.bg2, borderRadius: 10, marginBottom: 8, overflow: 'hidden', alignItems: 'center' },
  sessionBorder: { width: 3, height: '100%' },
  sessionInfo: { flex: 1, padding: 10 },
  sessionName: { fontSize: 12, fontWeight: '600', color: colors.tp },
  sessionMeta: { fontSize: 9, color: colors.ts, marginTop: 3 },
  gradePill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginRight: 10 },
  gradeText: { fontSize: 11, fontWeight: '700', color: colors.bg },
});
