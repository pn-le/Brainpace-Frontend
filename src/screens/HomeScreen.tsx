/**
 * HomeScreen — pixel-faithful rebuild of the Figma "Home" frame (node 97:2).
 *
 * Self-contained: gauge rings, LIVE indicator, 0–5 TBR slider with knob,
 * theta/beta band cards, the "TBR Over Time" chart with fatigue zones,
 * and the purple "Take a break" nudge. Values mirror the Figma mockup
 * (TBR 3.2 — Significant Fatigue). Wire to useEEGStream() to go live.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path, Rect, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../theme';

// ── Figma displayed state ──────────────────────────────────────────────────
const TBR = 3.2;
const TBR_MAX = 5;
const THETA = '14.6e-6';
const BETA = '4.6e-6';
const THETA_PCT = 42; // ↑ vs baseline
const BETA_PCT = 31;  // ↓ vs baseline
const TIME_LABELS = ['13:10', '13:20', '13:30', '13:40'];

// Chart silhouette sampled from the Figma curve (x,y as fractions of plot area;
// y=0 is top/Alert, y=1 is bottom/Severe). Rises, dips mid, climbs to 3.2 peak.
const CURVE: { x: number; y: number }[] = [
  { x: 0.0, y: 0.84 },
  { x: 0.15, y: 0.62 },
  { x: 0.3, y: 0.44 },
  { x: 0.39, y: 0.36 },
  { x: 0.48, y: 0.55 },
  { x: 0.56, y: 0.84 },
  { x: 0.63, y: 0.76 },
  { x: 0.73, y: 0.55 },
  { x: 0.86, y: 0.3 },
  { x: 1.0, y: 0.14 },
];

function catmullRom(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[Math.min(pts.length - 1, i + 1)];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function BandCard({
  symbol, name, range, value, pct, rising, accent,
}: {
  symbol: string; name: string; range: string; value: string;
  pct: number; rising: boolean; accent: string;
}) {
  const fillPct = rising ? 0.82 : 0.38;
  return (
    <View style={[styles.bandCard, { borderLeftColor: accent }]}>
      <Text style={[styles.bandTitle, { color: accent }]}>{symbol} {name} ({range})</Text>
      <View style={styles.bandValueRow}>
        <Text style={styles.bandValue}>{value}</Text>
        <Text style={styles.bandUnit}>V²/Hz</Text>
      </View>
      <Text style={[styles.bandDelta, { color: accent }]}>
        {rising ? '↑' : '↓'} {pct}% vs baseline
      </Text>
      <View style={styles.bandTrack}>
        <View style={[styles.bandFill, { width: `${fillPct * 100}%`, backgroundColor: accent }]} />
      </View>
    </View>
  );
}

function TBRChart() {
  const { width } = useWindowDimensions();
  const W = width - 32;  // ScrollView has 16px horizontal padding each side
  const H = 144;
  const padL = 32;      // left gutter for zone labels
  const padR = 12;
  const padTop = 6;
  const plotW = W - padL - padR;
  const plotH = 116;
  const zones = [
    { label: 'Alert', color: colors.good },
    { label: 'Mild', color: colors.warnL },
    { label: 'Signif.', color: colors.warn },
    { label: 'Severe', color: colors.severe },
  ];
  const zoneH = plotH / 4;

  const px = (fx: number) => padL + fx * plotW;
  const py = (fy: number) => padTop + fy * plotH;
  const linePts = CURVE.map(p => ({ x: px(p.x), y: py(p.y) }));
  const lineD = catmullRom(linePts);
  const areaD = lineD
    ? `${lineD} L ${px(1)} ${padTop + plotH} L ${px(0)} ${padTop + plotH} Z`
    : '';
  const end = linePts[linePts.length - 1];

  return (
    <View style={[styles.chartCard, { width: W }]}>
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id="tbrArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.purp} stopOpacity="0.28" />
            <Stop offset="1" stopColor={colors.purp} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* zone bands + dividers */}
        {zones.map((z, i) => (
          <React.Fragment key={z.label}>
            <Rect
              x={padL} y={padTop + i * zoneH}
              width={plotW} height={zoneH}
              fill={z.color} opacity={0.05}
            />
            <Line
              x1={padL} y1={padTop + i * zoneH}
              x2={padL + plotW} y2={padTop + i * zoneH}
              stroke={colors.bg3} strokeWidth={1} opacity={0.5}
            />
          </React.Fragment>
        ))}

        {/* area + line */}
        {areaD ? <Path d={areaD} fill="url(#tbrArea)" /> : null}
        {lineD ? (
          <Path d={lineD} stroke={colors.purpL} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ) : null}

        {/* end marker */}
        <Circle cx={end.x} cy={end.y} r={10} fill={colors.purp} opacity={0.25} />
        <Circle cx={end.x} cy={end.y} r={5} fill={colors.purp} />
        <Circle cx={end.x} cy={end.y} r={3} fill={colors.white} />
      </Svg>

      {/* zone labels */}
      {zones.map((z, i) => (
        <Text
          key={z.label}
          style={[styles.zoneLabel, { color: z.color, top: padTop + i * zoneH + zoneH / 2 - 5 }]}
        >
          {z.label}
        </Text>
      ))}

      {/* end value label */}
      <Text style={[styles.chartEndLabel, { left: Math.min(W - 26, end.x + 6), top: end.y - 16 }]}>
        {TBR.toFixed(1)}
      </Text>

      {/* time axis */}
      <View style={[styles.timeAxis, { marginLeft: padL, width: plotW }]}>
        {TIME_LABELS.map(t => <Text key={t} style={styles.timeTick}>{t}</Text>)}
      </View>
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const ring = 160;
  const knobLeft = (TBR / TBR_MAX) * 100;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning, Alex</Text>
          <Text style={styles.subtitle}>AWear · Connected · 256 Hz</Text>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>A</Text></View>
      </View>

      {/* TBR card */}
      <View style={styles.tbrCard}>
        {/* LIVE indicator */}
        <View style={styles.liveRow}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        {/* rings + center */}
        <View style={styles.ringWrap}>
          <View style={[styles.glow, { backgroundColor: colors.warn + '14' }]} />
          <Svg width={ring} height={ring}>
            <Circle cx={ring / 2} cy={ring / 2} r={ring / 2 - 1} stroke={colors.bg3} strokeWidth={2} fill="none" opacity={0.6} />
            <Circle cx={ring / 2} cy={ring / 2} r={50} stroke={colors.bg3} strokeWidth={2} fill="none" opacity={0.4} />
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={styles.strainLabel}>COGNITIVE STRAIN</Text>
            <Text style={styles.strainSub}>Theta / Beta Ratio (TBR)</Text>
            <Text style={[styles.tbrNumber, { color: colors.warn }]}>{TBR.toFixed(1)}</Text>
          </View>
        </View>

        {/* state pill */}
        <View style={styles.statePill}>
          <Text style={styles.stateText}>SIGNIFICANT FATIGUE</Text>
        </View>

        {/* 0–5 slider */}
        <View style={styles.sliderWrap}>
          <View style={styles.sliderTrack}>
            <View style={[styles.seg, { flex: 64, backgroundColor: colors.good }]} />
            <View style={[styles.seg, { flex: 64, backgroundColor: colors.teal }]} />
            <View style={[styles.seg, { flex: 64, backgroundColor: colors.warnL }]} />
            <View style={[styles.seg, { flex: 48, backgroundColor: colors.warn }]} />
            <View style={[styles.seg, { flex: 80, backgroundColor: colors.severe }]} />
            <View style={[styles.knob, { left: `${knobLeft}%` }]} />
          </View>
          <View style={styles.tickRow}>
            {[0, 1, 2, 3, 4, 5].map(n => <Text key={n} style={styles.tick}>{n}</Text>)}
          </View>
        </View>

        {/* formula */}
        <Text style={styles.formula}>TBR = θ Power (4–8 Hz) ÷ β Power (13–30 Hz)</Text>
        <Text style={styles.formulaSub}>Computed via Welch PSD · 1-sec epochs · V²/Hz</Text>
      </View>

      {/* band cards */}
      <View style={styles.bandRow}>
        <BandCard symbol="θ" name="Theta" range="4–8 Hz" value={THETA} pct={THETA_PCT} rising accent={colors.warn} />
        <View style={{ width: 8 }} />
        <BandCard symbol="β" name="Beta" range="13–30 Hz" value={BETA} pct={BETA_PCT} rising={false} accent={colors.teal} />
      </View>

      {/* TBR Over Time */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>TBR Over Time</Text>
        <View style={styles.segControl}>
          {['30m', '1h', '3h', '6h'].map((p, i) => (
            <TouchableOpacity key={p} style={[styles.segPill, i === 0 && styles.segPillActive]}>
              <Text style={[styles.segPillText, i === 0 && styles.segPillTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TBRChart />

      {/* nudge banner */}
      <TouchableOpacity style={styles.nudge} activeOpacity={0.85}>
        <View style={styles.nudgeIcon}><Text style={{ fontSize: 18 }}>⚡</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.nudgeTitle}>TBR {TBR.toFixed(1)} — Take a break</Text>
          <Text style={styles.nudgeSub}>Predicted severe in ~12 min at current slope</Text>
          <Text style={styles.nudgeAction}>Start breathing exercise →</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16, paddingTop: 62 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 19, fontWeight: '700', color: colors.white },
  subtitle: { fontSize: 11, color: colors.ts, marginTop: 5 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.purp, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700', color: colors.white },

  tbrCard: { marginTop: 14, backgroundColor: colors.bg2, borderRadius: 22, paddingTop: 14, paddingBottom: 16, paddingHorizontal: 16, alignItems: 'center', overflow: 'hidden' },
  liveRow: { position: 'absolute', top: 14, right: 16, flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.good },
  liveText: { fontSize: 9, fontWeight: '700', color: colors.good, letterSpacing: 0.5 },

  ringWrap: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  glow: { position: 'absolute', width: 150, height: 150, borderRadius: 75 },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  strainLabel: { fontSize: 9, fontWeight: '700', color: colors.ts, letterSpacing: 1.4 },
  strainSub: { fontSize: 10, color: colors.tl, marginTop: 3 },
  tbrNumber: { fontSize: 68, fontWeight: '800', marginTop: 2, lineHeight: 76 },

  statePill: { marginTop: 4, backgroundColor: colors.warn + '26', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 6 },
  stateText: { fontSize: 9, fontWeight: '700', color: colors.warn, letterSpacing: 0.5 },

  sliderWrap: { width: '100%', marginTop: 18, paddingHorizontal: 4 },
  sliderTrack: { flexDirection: 'row', height: 8, borderRadius: 4, position: 'relative' },
  seg: { height: 8 },
  knob: { position: 'absolute', top: -2, marginLeft: -6, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.bg, shadowColor: colors.black, shadowOpacity: 0.4, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  tickRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  tick: { fontSize: 8, color: colors.tl },

  formula: { fontSize: 9, fontWeight: '500', color: colors.ts, marginTop: 12, alignSelf: 'flex-start', paddingLeft: 4 },
  formulaSub: { fontSize: 8, color: colors.tl, marginTop: 3, alignSelf: 'flex-start', paddingLeft: 4 },

  bandRow: { flexDirection: 'row', marginTop: 12 },
  bandCard: { flex: 1, backgroundColor: colors.bg2, borderRadius: 12, padding: 12, borderLeftWidth: 4 },
  bandTitle: { fontSize: 10, fontWeight: '600' },
  bandValueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4, gap: 4 },
  bandValue: { fontSize: 18, fontWeight: '700', color: colors.white },
  bandUnit: { fontSize: 9, color: colors.ts },
  bandDelta: { fontSize: 8, marginTop: 4 },
  bandTrack: { height: 4, backgroundColor: colors.bg3, borderRadius: 2, marginTop: 8 },
  bandFill: { height: 4, borderRadius: 2 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.white },
  segControl: { flexDirection: 'row', gap: 6 },
  segPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 11 },
  segPillActive: { backgroundColor: colors.purp },
  segPillText: { fontSize: 11, color: colors.ts },
  segPillTextActive: { color: colors.white, fontWeight: '600' },

  chartCard: { backgroundColor: colors.bg, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  zoneLabel: { position: 'absolute', left: 4, fontSize: 7, fontWeight: '600' },
  chartEndLabel: { position: 'absolute', fontSize: 9, fontWeight: '700', color: colors.warn },
  timeAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2, paddingBottom: 6 },
  timeTick: { fontSize: 7, color: colors.tl },

  nudge: { flexDirection: 'row', backgroundColor: colors.purp, borderRadius: 14, padding: 14, marginTop: 16, alignItems: 'flex-start', gap: 12 },
  nudgeIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF2E', alignItems: 'center', justifyContent: 'center' },
  nudgeTitle: { fontSize: 14, fontWeight: '700', color: colors.white },
  nudgeSub: { fontSize: 10, color: '#EDE7FF', marginTop: 3 },
  nudgeAction: { fontSize: 10, fontWeight: '600', color: colors.white, marginTop: 6 },
});
