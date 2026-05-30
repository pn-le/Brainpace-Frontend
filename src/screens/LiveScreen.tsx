import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, BANDS } from '../theme';
import { useEEGStream, formatPower } from '../hooks/useEEGStream';

const SW = Dimensions.get('window').width;
const CARD_W = SW - 32;

function eegPath(width: number, height: number, freq: number, amplitude: number, seed: number): string {
  const pts: string[] = [];
  const steps = 120;
  const midY = height / 2;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const t = i * 0.15;
    const wave =
      Math.sin(t * freq + seed) * amplitude +
      Math.sin(t * freq * 2.3 + seed * 1.7) * amplitude * 0.4 +
      Math.sin(t * freq * 0.7 + seed * 0.3) * amplitude * 0.3;
    const envelope = 0.5 + 0.5 * Math.sin(t * 0.3 + seed * 0.5);
    const y = midY - wave * envelope;
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

const BAND_PILLS = [
  { sym: '\u03B4', key: 'delta' as const, color: colors.tl },
  { sym: '\u03B8', key: 'theta' as const, color: colors.warn },
  { sym: '\u03B2', key: 'beta' as const, color: colors.teal },
  { sym: '\u03B1', key: 'alpha' as const, color: colors.purpL },
  { sym: '\u03B3', key: 'gamma' as const, color: colors.warnL },
];

const FILTERED_BANDS = [
  { label: '\u03B8 Theta (4\u20138 Hz)', color: colors.warn, freq: 1.2, seed: 1 },
  { label: '\u03B1 Alpha (8\u201313 Hz)', color: colors.purpL, freq: 2.0, seed: 3 },
  { label: '\u03B2 Beta (13\u201330 Hz)', color: '#E040FB', freq: 3.2, seed: 5 },
  { label: '\u03B3 Gamma (30\u201350 Hz)', color: colors.warnL, freq: 4.5, seed: 7 },
];

export default function LiveScreen() {
  const { tbr, bands, fatigueState, prediction, sessionSec } = useEEGStream();

  const isSevere = fatigueState === 'significant_fatigue' || fatigueState === 'severe_fatigue';
  const minutes = Math.floor(sessionSec / 60);
  const seconds = sessionSec % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const tbrRatio = prediction
    ? (prediction.tbr_vs_baseline / prediction.baseline_tbr).toFixed(1)
    : '2.1';

  const rawWavePath = useMemo(() => eegPath(CARD_W - 32, 80, 1.8, 32, 0), []);
  const filteredPaths = useMemo(
    () => FILTERED_BANDS.map(b => eegPath(CARD_W - 170, 32, b.freq, 12, b.seed)),
    [],
  );

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Live Feed</Text>
          <Text style={styles.subtitle}>AWear EEG {'\u00B7'} 1 channel {'\u00B7'} 256 Hz</Text>
        </View>
        <TouchableOpacity style={styles.stopBtn} activeOpacity={0.8}>
          <View style={styles.stopSquare} />
          <Text style={styles.stopText}>Stop</Text>
        </TouchableOpacity>
      </View>

      {/* Recording status */}
      <View style={styles.statusRow}>
        <View style={styles.recDot} />
        <Text style={styles.recText}>Recording {'\u00B7'} {timeStr}</Text>
      </View>

      {/* Band power pills */}
      <View style={styles.pillRow}>
        {BAND_PILLS.map(b => {
          const isTheta = b.key === 'theta';
          return (
            <View key={b.key} style={[styles.pill, isTheta && { borderColor: b.color, borderWidth: 1.5 }]}>
              <Text style={[styles.pillSym, { color: b.color }]}>{b.sym}</Text>
              <Text style={styles.pillVal}>{formatPower(bands[b.key])}</Text>
            </View>
          );
        })}
      </View>

      {/* Raw EEG Waveform */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Raw EEG Waveform</Text>
        <Text style={styles.cardSub}>AWear_EEG channel {'\u00B7'} bandpass_fft output</Text>
        <View style={styles.waveWrap}>
          <Svg width={CARD_W - 32} height={80}>
            <Path d={rawWavePath} stroke={colors.purpL} strokeWidth={1.8} fill="none" />
            <Rect x={0} y={39} width={CARD_W - 32} height={1} fill={colors.bg3} opacity={0.5} />
          </Svg>
        </View>
      </View>

      {/* Filtered Band Signals */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Filtered Band Signals</Text>
        <Text style={styles.cardSub}>Output of bandpass_fft(wf, low, high, 256)</Text>
        {FILTERED_BANDS.map((b, i) => (
          <View key={b.label} style={styles.filteredRow}>
            <Text style={[styles.filteredLabel, { color: b.color }]}>{b.label}</Text>
            <View style={styles.filteredWave}>
              <Svg width={CARD_W - 170} height={32}>
                <Path d={filteredPaths[i]} stroke={b.color} strokeWidth={1.5} fill="none" />
              </Svg>
            </View>
          </View>
        ))}
      </View>

      {/* Live TBR readout */}
      <View style={styles.tbrCard}>
        <Text style={styles.tbrBig}>{tbr.toFixed(1)}</Text>
        <View>
          <Text style={styles.tbrLabel}>LIVE TBR</Text>
          <Text style={[styles.tbrState, { color: colors.warn }]}>
            {fatigueState === 'alert' ? 'Alert' :
              fatigueState === 'mild_fatigue' ? 'Mild Fatigue' :
              fatigueState === 'significant_fatigue' ? 'Significant Fatigue' :
              'Severe / Drowsiness'}
          </Text>
        </View>
      </View>

      {/* Warning card */}
      {isSevere && (
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertIcon}>{'\u26A0'}</Text>
            <Text style={styles.alertText}>
              {'\u03B8'}/{'\u03B2'} ratio {tbrRatio}{'\u00D7'} above baseline {'\u2014'} cognitive fatigue detected
            </Text>
          </View>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>
              np.trapz(psd[theta_mask])  /{'\n'}np.trapz(psd[beta_mask])
            </Text>
          </View>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16, paddingTop: 60 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 28, fontWeight: '700', color: colors.tp },
  subtitle: { fontSize: 12, color: colors.tl, marginTop: 4 },
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#3A1215', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  stopSquare: { width: 10, height: 10, borderRadius: 2, backgroundColor: colors.warn },
  stopText: { fontSize: 13, fontWeight: '600', color: colors.warn },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.good },
  recText: { fontSize: 12, color: colors.good },

  pillRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  pill: {
    flex: 1, alignItems: 'center', backgroundColor: colors.bg2,
    borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: colors.bg3,
  },
  pillSym: { fontSize: 16, fontWeight: '600' },
  pillVal: { fontSize: 9, color: colors.tl, marginTop: 3 },

  card: { backgroundColor: colors.bg2, borderRadius: 16, padding: 16, marginTop: 14 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.tp },
  cardSub: { fontSize: 10, color: colors.tl, marginTop: 3 },
  waveWrap: { marginTop: 14, alignItems: 'center' },

  filteredRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 8 },
  filteredLabel: { fontSize: 10, fontWeight: '500', width: 120 },
  filteredWave: { flex: 1 },

  tbrCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: colors.bg2, borderRadius: 16, padding: 20, marginTop: 14,
  },
  tbrBig: { fontSize: 48, fontWeight: '800', color: colors.tp },
  tbrLabel: { fontSize: 11, fontWeight: '600', color: colors.ts, letterSpacing: 0.5 },
  tbrState: { fontSize: 18, fontWeight: '700', marginTop: 2 },

  alertCard: {
    backgroundColor: '#1A0A0A', borderRadius: 14, padding: 14, marginTop: 14,
    borderWidth: 1, borderColor: colors.warn + '44',
  },
  alertHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  alertIcon: { fontSize: 16, color: colors.warn, marginTop: 1 },
  alertText: { flex: 1, fontSize: 12, color: colors.tp, lineHeight: 18 },
  codeBlock: { backgroundColor: colors.bg, borderRadius: 8, padding: 10, marginTop: 10 },
  codeText: { fontSize: 11, color: colors.tl, fontFamily: 'monospace' },
});
