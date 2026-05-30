import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path, Rect, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../theme';

const TBR = 3.2;
const TBR_MAX = 5;
const THETA = '14.6e-6';
const BETA = '4.6e-6';
const THETA_PCT = 42;
const BETA_PCT = 31;
const TIME_LABELS = ['13:10', '13:20', '13:30', '13:40'];

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

// Mini vertical bar chart for band cards
function MiniBars({ count, color }: { count: number; color: string }) {
  const heights = [0.6, 0.9, 0.5, 0.8, 0.7, 0.95, 0.4, 0.85, 0.6, 0.75, 0.5, 0.8];
  return (
    <View style={{ flexDirection: 'row', gap: 2, height: 20, alignItems: 'flex-end', marginTop: 8 }}>
      {heights.slice(0, count).map((h, i) => (
        <View key={i} style={{ width: 4, height: 20 * h, backgroundColor: color, borderRadius: 1 }} />
      ))}
    </View>
  );
}

function BandCard({
  symbol, name, range, value, pct, rising, accent,
}: {
  symbol: string; name: string; range: string; value: string;
  pct: number; rising: boolean; accent: string;
}) {
  return (
    <View style={[styles.bandCard, { borderLeftColor: accent }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent }} />
        <Text style={[styles.bandSymName, { color: accent }]}>{symbol} {name}</Text>
      </View>
      <Text style={styles.bandRange}>{range}</Text>
      <View style={styles.bandValueRow}>
        <Text style={styles.bandValue}>{value}</Text>
        <Text style={styles.bandUnit}> V{'\u00B2'}/Hz</Text>
      </View>
      <Text style={[styles.bandDelta, { color: accent }]}>
        {rising ? '\u2191' : '\u2193'} {pct}% vs base
      </Text>
      <MiniBars count={12} color={accent} />
    </View>
  );
}

function TBRChart() {
  const { width } = useWindowDimensions();
  const W = width - 32;
  const H = 144;
  const padL = 32;
  const padR = 12;
  const padTop = 6;
  const plotW = W - padL - padR;
  const plotH = 116;
  const zones = [
    { label: 'Severe', color: colors.severe },
    { label: 'Signif.', color: colors.warn },
    { label: 'Mild', color: colors.warnL },
    { label: 'Alert', color: colors.good },
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

        {zones.map((z, i) => (
          <React.Fragment key={z.label}>
            <Rect x={padL} y={padTop + i * zoneH} width={plotW} height={zoneH} fill={z.color} opacity={0.05} />
            <Line x1={padL} y1={padTop + i * zoneH} x2={padL + plotW} y2={padTop + i * zoneH} stroke={colors.bg3} strokeWidth={1} opacity={0.5} />
          </React.Fragment>
        ))}

        {areaD ? <Path d={areaD} fill="url(#tbrArea)" /> : null}
        {lineD ? <Path d={lineD} stroke={colors.purpL} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}

        <Circle cx={end.x} cy={end.y} r={10} fill={colors.purp} opacity={0.25} />
        <Circle cx={end.x} cy={end.y} r={5} fill={colors.purp} />
        <Circle cx={end.x} cy={end.y} r={3} fill={colors.white} />
      </Svg>

      {zones.map((z, i) => (
        <Text key={z.label} style={[styles.zoneLabel, { color: z.color, top: padTop + i * zoneH + zoneH / 2 - 5 }]}>{z.label}</Text>
      ))}

      <Text style={[styles.chartEndLabel, { left: Math.min(W - 26, end.x + 6), top: end.y - 16 }]}>{TBR.toFixed(1)}</Text>

      <View style={[styles.timeAxis, { marginLeft: padL, width: plotW }]}>
        {TIME_LABELS.map(t => <Text key={t} style={styles.timeTick}>{t}</Text>)}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const knobLeft = (TBR / TBR_MAX) * 100;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
      {/* Header — avatar LEFT, greeting RIGHT */}
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>A</Text></View>
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.greeting}>Good morning, Alex</Text>
          <View style={styles.subRow}>
            <View style={styles.connDot} />
            <Text style={styles.subtitle}>AWear {'\u00B7'} Connected {'\u00B7'} 256 Hz</Text>
          </View>
        </View>
      </View>

      {/* TBR card */}
      <View style={styles.tbrCard}>
        {/* Single-line card header */}
        <Text style={styles.cardHeader}>COGNITIVE STRAIN {'\u2014'} THETA / BETA RATIO (TBR)</Text>

        {/* Rings + center */}
        <View style={styles.ringWrap}>
          <View style={[styles.glow, { backgroundColor: colors.warn + '14' }]} />
          <Svg width={160} height={160}>
            <Circle cx={80} cy={80} r={79} stroke={colors.bg3} strokeWidth={2} fill="none" opacity={0.6} />
            <Circle cx={80} cy={80} r={50} stroke={colors.bg3} strokeWidth={2} fill="none" opacity={0.4} />
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={[styles.tbrNumber, { color: colors.warn }]}>{TBR.toFixed(1)}</Text>
            <Text style={styles.tbrIndex}>TBR index</Text>
          </View>
        </View>

        {/* State pill with trend icon */}
        <View style={styles.statePill}>
          <Text style={styles.stateText}>{'\u2197'} SIGNIFICANT FATIGUE</Text>
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
            <Text style={styles.tick}>0</Text>
            <Text style={styles.tick}>5</Text>
          </View>
        </View>

        <Text style={styles.formula}>TBR = {'\u03B8'} Power (4{'\u20138'} Hz) / {'\u03B2'} Power (13{'\u201330'} Hz)</Text>
        <Text style={styles.formulaSub}>Computed via Welch PSD {'\u00B7'} 1-sec epochs {'\u00B7'} V{'\u00B2'}/Hz</Text>
      </View>

      {/* Band cards */}
      <View style={styles.bandRow}>
        <BandCard symbol={'\u03B8'} name="Theta" range="4{'\u2013'}8 Hz" value={THETA} pct={THETA_PCT} rising accent={colors.warn} />
        <View style={{ width: 8 }} />
        <BandCard symbol={'\u03B2'} name="Beta" range="13{'\u2013'}30 Hz" value={BETA} pct={BETA_PCT} rising={false} accent={colors.teal} />
      </View>

      {/* TBR Over Time */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>TBR Over Time</Text>
        <View style={styles.segControl}>
          {['30m', '1h', '3h', '8h'].map((p, i) => (
            <TouchableOpacity key={p} style={[styles.segPill, i === 0 && styles.segPillActive]}>
              <Text style={[styles.segPillText, i === 0 && styles.segPillTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TBRChart />

      {/* Nudge banner */}
      <TouchableOpacity style={styles.nudge} activeOpacity={0.85}>
        <View style={styles.nudgeIcon}><Text style={{ fontSize: 16 }}>{'\u26A1'}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.nudgeTitle}>TBR {TBR.toFixed(1)} {'\u2014'} Take a break</Text>
          <Text style={styles.nudgeSub}>Predicted severe in ~12 min at current slope</Text>
          <Text style={styles.nudgeAction}>Start breathing exercise {'\u2192'}</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16, paddingTop: 62 },

  header: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.purp, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '700', color: colors.white },
  greeting: { fontSize: 20, fontWeight: '700', color: colors.white },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  connDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.good },
  subtitle: { fontSize: 11, color: colors.ts },

  tbrCard: { marginTop: 16, backgroundColor: colors.bg2, borderRadius: 22, paddingTop: 16, paddingBottom: 18, paddingHorizontal: 16, alignItems: 'center', overflow: 'hidden' },
  cardHeader: { fontSize: 10, fontWeight: '600', color: colors.ts, letterSpacing: 1.2, textAlign: 'center' },

  ringWrap: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  glow: { position: 'absolute', width: 150, height: 150, borderRadius: 75 },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  tbrNumber: { fontSize: 68, fontWeight: '800', lineHeight: 76 },
  tbrIndex: { fontSize: 12, color: colors.ts, marginTop: -2 },

  statePill: { marginTop: 8, backgroundColor: colors.warn + '26', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 6 },
  stateText: { fontSize: 10, fontWeight: '700', color: colors.warn, letterSpacing: 0.5 },

  sliderWrap: { width: '100%', marginTop: 18, paddingHorizontal: 4 },
  sliderTrack: { flexDirection: 'row', height: 8, borderRadius: 4, position: 'relative' },
  seg: { height: 8 },
  knob: { position: 'absolute', top: -3, marginLeft: -7, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.bg, shadowColor: colors.black, shadowOpacity: 0.4, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  tickRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  tick: { fontSize: 9, color: colors.tl },

  formula: { fontSize: 10, fontWeight: '500', color: colors.ts, marginTop: 14, alignSelf: 'flex-start', paddingLeft: 4 },
  formulaSub: { fontSize: 9, color: colors.tl, marginTop: 3, alignSelf: 'flex-start', paddingLeft: 4 },

  bandRow: { flexDirection: 'row', marginTop: 14 },
  bandCard: { flex: 1, backgroundColor: colors.bg2, borderRadius: 12, padding: 12, borderLeftWidth: 4 },
  bandSymName: { fontSize: 11, fontWeight: '600' },
  bandRange: { fontSize: 9, color: colors.tl, marginTop: 2 },
  bandValueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6 },
  bandValue: { fontSize: 18, fontWeight: '700', color: colors.white },
  bandUnit: { fontSize: 9, color: colors.ts },
  bandDelta: { fontSize: 9, marginTop: 4 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.white },
  segControl: { flexDirection: 'row', gap: 6 },
  segPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  segPillActive: { backgroundColor: colors.purp },
  segPillText: { fontSize: 11, color: colors.ts },
  segPillTextActive: { color: colors.white, fontWeight: '600' },

  chartCard: { backgroundColor: colors.bg, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  zoneLabel: { position: 'absolute', left: 4, fontSize: 8, fontWeight: '600' },
  chartEndLabel: { position: 'absolute', fontSize: 10, fontWeight: '700', color: colors.warn },
  timeAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2, paddingBottom: 6 },
  timeTick: { fontSize: 8, color: colors.tl },

  nudge: { flexDirection: 'row', backgroundColor: colors.purp, borderRadius: 14, padding: 14, marginTop: 16, alignItems: 'flex-start', gap: 12 },
  nudgeIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF2E', alignItems: 'center', justifyContent: 'center' },
  nudgeTitle: { fontSize: 14, fontWeight: '700', color: colors.white },
  nudgeSub: { fontSize: 10, color: '#EDE7FF', marginTop: 3 },
  nudgeAction: { fontSize: 10, fontWeight: '600', color: colors.white, marginTop: 6 },
});
