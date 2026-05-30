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
    const wave = Math.sin(t * freq + seed) * amplitude +
      Math.sin(t * freq * 2.3 + seed * 1.7) * amplitude * 0.4 +
      Math.sin(t * freq * 0.7 + seed * 0.3) * amplitude * 0.3;
    const envelope = 0.5 + 0.5 * Math.sin(t * 0.3 + seed * 0.5);
    const y = midY - wave * envelope;
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

const BAND_CHIPS = [
  { sym: '\u03B4', key: 'delta' as const, color: colors.bandDelta },
  { sym: '\u03B8', key: 'theta' as const, color: colors.bandTheta },
  { sym: '\u03B2', key: 'beta' as const, color: colors.bandBeta },
  { sym: '\u03B1', key: 'alpha' as const, color: colors.bandAlpha },
  { sym: '\u03B3', key: 'gamma' as const, color: colors.bandGamma },
];

const FILTERED = [
  { label: '\u03B8 Theta (4\u20138 Hz)', color: colors.bandTheta, freq: 1.2, seed: 1 },
  { label: '\u03B1 Alpha (8\u201313 Hz)', color: colors.bandAlpha, freq: 2.0, seed: 3 },
  { label: '\u03B2 Beta (13\u201330 Hz)', color: '#E040FB', freq: 3.2, seed: 5 },
  { label: '\u03B3 Gamma (30\u201350 Hz)', color: colors.bandGamma, freq: 4.5, seed: 7 },
];

export default function LiveScreen() {
  const { tbr, bands, fatigueState, prediction, sessionSec } = useEEGStream();
  const isSevere = fatigueState === 'significant_fatigue' || fatigueState === 'severe_fatigue';
  const minutes = Math.floor(sessionSec / 60);
  const seconds = sessionSec % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const tbrRatio = prediction ? (prediction.tbr_vs_baseline / (prediction.baseline_tbr || 1)).toFixed(1) : '2.1';

  const rawWave = useMemo(() => eegPath(CARD_W - 32, 80, 1.8, 32, 0), []);
  const filtPaths = useMemo(() => FILTERED.map(b => eegPath(CARD_W - 170, 32, b.freq, 12, b.seed)), []);

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Live Feed</Text>
          <Text style={s.subtitle}>AWear EEG {'\u00B7'} 1 channel {'\u00B7'} 256 Hz</Text>
        </View>
        <TouchableOpacity style={s.stopBtn} activeOpacity={0.8}>
          <View style={s.stopSquare} />
          <Text style={s.stopText}>Stop</Text>
        </TouchableOpacity>
      </View>

      <View style={s.recRow}>
        <View style={s.recDot} />
        <Text style={s.recText}>Recording {'\u00B7'} {timeStr}</Text>
      </View>

      <View style={s.chipRow}>
        {BAND_CHIPS.map(b => {
          const isTheta = b.key === 'theta';
          return (
            <View key={b.key} style={[s.chip, isTheta && { borderColor: b.color, borderWidth: 1.5 }]}>
              <Text style={[s.chipSym, { color: b.color }]}>{b.sym}</Text>
              <Text style={s.chipVal}>{formatPower(bands[b.key])}</Text>
            </View>
          );
        })}
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Raw EEG Waveform</Text>
        <Text style={s.cardSub}>AWear_EEG channel {'\u00B7'} bandpass_fft output</Text>
        <View style={{ marginTop: 14, alignItems: 'center' }}>
          <Svg width={CARD_W - 32} height={80}>
            <Path d={rawWave} stroke={colors.bandAlpha} strokeWidth={1.8} fill="none" />
            <Rect x={0} y={39} width={CARD_W - 32} height={1} fill={colors.inkBorder} opacity={0.5} />
          </Svg>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Filtered Band Signals</Text>
        <Text style={s.cardSub}>Output of bandpass_fft(wf, low, high, 256)</Text>
        {FILTERED.map((b, i) => (
          <View key={b.label} style={s.filtRow}>
            <Text style={[s.filtLabel, { color: b.color }]}>{b.label}</Text>
            <View style={{ flex: 1 }}>
              <Svg width={CARD_W - 170} height={32}>
                <Path d={filtPaths[i]} stroke={b.color} strokeWidth={1.5} fill="none" />
              </Svg>
            </View>
          </View>
        ))}
      </View>

      <View style={s.tbrCard}>
        <Text style={s.tbrBig}>{tbr.toFixed(1)}</Text>
        <View>
          <Text style={s.tbrLabel}>LIVE TBR</Text>
          <Text style={[s.tbrState, { color: colors.coral }]}>
            {fatigueState === 'alert' ? 'Alert' : fatigueState === 'mild_fatigue' ? 'Mild Fatigue' :
              fatigueState === 'significant_fatigue' ? 'Significant Fatigue' : 'Severe / Drowsiness'}
          </Text>
        </View>
      </View>

      {isSevere && (
        <View style={s.alertCard}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Text style={{ fontSize: 16, color: colors.coral }}>{'\u26A0'}</Text>
            <Text style={s.alertText}>{'\u03B8'}/{'\u03B2'} ratio {tbrRatio}{'\u00D7'} above baseline {'\u2014'} cognitive fatigue detected</Text>
          </View>
          <View style={s.codeBlock}>
            <Text style={s.codeText}>np.trapz(psd[theta_mask])  /{'\n'}np.trapz(psd[beta_mask])</Text>
          </View>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink, paddingHorizontal: 16, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  stopBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FF5B6E22', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#FF5B6E55' },
  stopSquare: { width: 10, height: 10, borderRadius: 2, backgroundColor: colors.coral },
  stopText: { fontSize: 13, fontWeight: '600', color: colors.coral },

  recRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.okGreen },
  recText: { fontSize: 12, color: colors.okGreen },

  chipRow: { flexDirection: 'row', gap: 7, marginTop: 16 },
  chip: { flex: 1, alignItems: 'center', backgroundColor: colors.inkCard, borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: colors.inkBorder },
  chipSym: { fontSize: 16, fontWeight: '600' },
  chipVal: { fontSize: 9, color: colors.textMuted, marginTop: 3 },

  card: { backgroundColor: colors.inkCard, borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: colors.inkBorder },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  cardSub: { fontSize: 10, color: colors.textMuted, marginTop: 3 },

  filtRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 8 },
  filtLabel: { fontSize: 10, fontWeight: '500', width: 120 },

  tbrCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.inkCard, borderRadius: 16, padding: 18, marginTop: 16, borderWidth: 1, borderColor: colors.inkBorder },
  tbrBig: { fontSize: 48, fontWeight: '800', color: colors.textPrimary },
  tbrLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.5 },
  tbrState: { fontSize: 18, fontWeight: '700', marginTop: 2 },

  alertCard: { backgroundColor: '#FF5B6E1A', borderRadius: 14, padding: 14, marginTop: 16, borderWidth: 1, borderColor: '#FF5B6E66' },
  alertText: { flex: 1, fontSize: 12, color: colors.textPrimary, lineHeight: 18 },
  codeBlock: { backgroundColor: colors.ink, borderRadius: 8, padding: 10, marginTop: 10 },
  codeText: { fontSize: 11, color: colors.textMuted, fontFamily: 'monospace' },
});
