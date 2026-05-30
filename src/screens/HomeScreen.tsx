import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path, Rect, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, getTBRLevel } from '../theme';
import { useEEGStream, formatPower } from '../hooks/useEEGStream';

const TBR_MAX = 5;
const TIME_LABELS = ['13:10', '13:20', '13:30', '13:40'];

const CURVE: { x: number; y: number }[] = [
  { x: 0.0, y: 0.84 }, { x: 0.15, y: 0.62 }, { x: 0.3, y: 0.44 },
  { x: 0.39, y: 0.36 }, { x: 0.48, y: 0.55 }, { x: 0.56, y: 0.84 },
  { x: 0.63, y: 0.76 }, { x: 0.73, y: 0.55 }, { x: 0.86, y: 0.3 },
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
    d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function MiniBars({ color, heights }: { color: string; heights: number[] }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3, height: 26, alignItems: 'flex-end' }}>
      {heights.map((h, i) => (
        <View key={i} style={{ flex: 1, height: h, backgroundColor: color, borderRadius: 2 }} />
      ))}
    </View>
  );
}

function BandCard({ symbol, name, range, value, pct, rising, accent, barHeights }: {
  symbol: string; name: string; range: string; value: string;
  pct: number; rising: boolean; accent: string; barHeights: number[];
}) {
  return (
    <View style={[s.bandCard]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent }} />
        <Text style={[s.bandLabel, { color: colors.textPrimary }]}>{symbol} {name}</Text>
      </View>
      <Text style={s.bandHz}>{range}</Text>
      <Text style={s.bandVal}>{value} V{'\u00B2'}/Hz</Text>
      <Text style={[s.bandDelta, { color: accent }]}>{rising ? '\u2191' : '\u2193'} {pct}% vs base</Text>
      <MiniBars color={accent} heights={barHeights} />
    </View>
  );
}

function TBRChart() {
  const { width } = useWindowDimensions();
  const W = width - 32;
  const H = 140;
  const padL = 48; const padR = 8; const padTop = 0;
  const plotW = W - padL - padR; const plotH = H;
  const zones = [
    { label: 'Severe', color: colors.textMuted },
    { label: 'Signif.', color: colors.textMuted },
    { label: 'Mild', color: colors.textMuted },
    { label: 'Alert', color: colors.textMuted },
  ];
  const zoneH = plotH / 4;
  const px = (fx: number) => padL + fx * plotW;
  const py = (fy: number) => padTop + fy * plotH;
  const linePts = CURVE.map(p => ({ x: px(p.x), y: py(p.y) }));
  const lineD = catmullRom(linePts);
  const areaD = lineD ? `${lineD} L ${px(1)} ${padTop + plotH} L ${px(0)} ${padTop + plotH} Z` : '';
  const end = linePts[linePts.length - 1];

  return (
    <View style={{ position: 'relative' }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <View style={{ width: 42, height: H, justifyContent: 'space-between' }}>
          {zones.map(z => <Text key={z.label} style={{ fontSize: 9, fontWeight: '500', color: z.color }}>{z.label}</Text>)}
        </View>
        <Svg width={plotW} height={H}>
          <Defs>
            <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.violet} stopOpacity="0.25" />
              <Stop offset="1" stopColor={colors.violet} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>
          {[35, 70, 105].map(y => <Rect key={y} x={0} y={y} width={plotW} height={1} fill={colors.white} opacity={0.05} />)}
          {areaD ? <Path d={`M ${linePts.map(p => `${p.x - padL} ${p.y}`).join(' L ')} L ${plotW} ${H} L 0 ${H} Z`} fill="url(#area)" /> : null}
          <Path d={linePts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x - padL} ${p.y}`).join(' ')} stroke={colors.violet} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={end.x - padL} cy={end.y} r={9} fill={colors.violet} opacity={0.25} />
          <Circle cx={end.x - padL} cy={end.y} r={5} fill={colors.violet} stroke={colors.textPrimary} strokeWidth={2} />
        </Svg>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingLeft: 48 }}>
        {TIME_LABELS.map(t => <Text key={t} style={{ fontSize: 9, fontWeight: '500', color: colors.textMuted }}>{t}</Text>)}
      </View>
    </View>
  );
}

export default function HomeScreen({ navigation }: any) {
  const { tbr: TBR, bands, fatigueState, prediction, isConnected } = useEEGStream();
  const level = getTBRLevel(TBR);
  const knobLeft = Math.min(100, (TBR / TBR_MAX) * 100);

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.avatar}><Text style={s.avatarText}>A</Text></View>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={s.greeting}>Good morning, Alex</Text>
          <View style={s.deviceRow}>
            <View style={[s.liveDot, !isConnected && { backgroundColor: colors.coral }]} />
            <Text style={s.deviceText}>AWear {'\u00B7'} {isConnected ? 'Connected' : 'Disconnected'} {'\u00B7'} 256 Hz</Text>
          </View>
        </View>
      </View>

      {/* TBR Card */}
      <View style={s.tbrCard}>
        <Text style={s.cardTitle}>COGNITIVE STRAIN {'\u2014'} THETA / BETA RATIO (TBR)</Text>

        <View style={s.circleWrap}>
          <View style={s.glowCircle}>
            <Text style={[s.tbrNumber, { color: level.color }]}>{TBR.toFixed(1)}</Text>
            <Text style={s.tbrLabel}>TBR index</Text>
          </View>
        </View>

        <View style={s.pill}>
          <Text style={[s.pillText, { color: level.color }]}>{'\u2197'} {level.label.toUpperCase()}</Text>
        </View>

        {/* Scale bar */}
        <View style={s.scaleWrap}>
          <View style={s.scaleBar}>
            <View style={[s.scaleSeg, { flex: 2, backgroundColor: colors.okGreen }]} />
            <View style={[s.scaleSeg, { flex: 1, backgroundColor: colors.amber }]} />
            <View style={[s.scaleSeg, { flex: 1, backgroundColor: colors.signifOrange }]} />
            <View style={[s.scaleSeg, { flex: 1, backgroundColor: colors.coral }]} />
            <View style={[s.scaleMarker, { left: `${knobLeft}%` }]} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={s.scaleLabel}>0</Text>
            <Text style={s.scaleLabel}>5</Text>
          </View>
        </View>

        <Text style={s.cap1}>TBR = {'\u03B8'} Power (4{'\u2013'}8 Hz) / {'\u03B2'} Power (13{'\u2013'}30 Hz)</Text>
        <Text style={s.cap2}>Computed via Welch PSD {'\u00B7'} 1-sec epochs {'\u00B7'} V{'\u00B2'}/Hz</Text>
      </View>

      {/* Band Cards */}
      <View style={s.bandRow}>
        <BandCard symbol={'\u03B8'} name="Theta" range="4\u20138 Hz" value={formatPower(bands.theta)} pct={42} rising accent={colors.bandTheta}
          barHeights={[24, 21, 13, 19, 22, 18, 14, 20, 21, 16, 16, 22, 22, 10]} />
        <BandCard symbol={'\u03B2'} name="Beta" range="13\u201330 Hz" value={formatPower(bands.beta)} pct={31} rising={false} accent={colors.bandBeta}
          barHeights={[9, 14, 16, 13, 6, 12, 16, 15, 10, 9, 15, 16, 13, 6]} />
      </View>

      {/* TBR Over Time */}
      <View style={s.chartCard}>
        <View style={s.chartHeader}>
          <Text style={s.chartTitle}>TBR Over Time</Text>
          <View style={s.segmented}>
            {['30m', '1h', '3h', '8h'].map((p, i) => (
              <TouchableOpacity key={p} style={[s.segPill, i === 0 && s.segPillActive]}>
                <Text style={[s.segText, i === 0 && s.segTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <TBRChart />
      </View>

      {/* Callout */}
      <TouchableOpacity style={s.callout} activeOpacity={0.85}>
        <View style={s.calloutIcon}><Text style={{ fontSize: 16, color: colors.textPrimary }}>{'\u26A1'}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.calloutTitle}>TBR {TBR.toFixed(1)} {'\u2014'} {prediction?.recommendation ?? 'Take a break'}</Text>
          <Text style={s.calloutSub}>{prediction?.predicted_severe_in_min ? `Predicted severe in ~${prediction.predicted_severe_in_min} min` : 'Monitor your cognitive strain'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Text style={s.calloutAction}>Start adaptive music</Text>
            <Text style={{ color: colors.violet, fontSize: 12 }}>{'\u2192'}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Start session */}
      <TouchableOpacity style={s.startBtn} activeOpacity={0.8} onPress={() => navigation.navigate('Connect')}>
        <Text style={s.startBtnText}>Start New Session</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink, paddingHorizontal: 16, paddingTop: 62 },

  header: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  greeting: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.okGreen },
  deviceText: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },

  tbrCard: { marginTop: 18, backgroundColor: colors.inkCard, borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: colors.inkBorder },
  cardTitle: { fontSize: 11, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.6, textAlign: 'center' },

  circleWrap: { marginTop: 6, marginBottom: 2 },
  glowCircle: { width: 172, height: 172, borderRadius: 86, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF5B6E1A', shadowColor: colors.coral, shadowOpacity: 0.4, shadowRadius: 44, shadowOffset: { width: 0, height: 0 } },
  tbrNumber: { fontSize: 64, fontWeight: '800', lineHeight: 72 },
  tbrLabel: { fontSize: 12, color: colors.textMuted, marginTop: -2 },

  pill: { marginTop: 6, backgroundColor: '#FF5B6E1F', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  pillText: { fontSize: 11, fontWeight: '700', color: colors.coral, letterSpacing: 0.4 },

  scaleWrap: { width: '100%', marginTop: 14, paddingHorizontal: 2 },
  scaleBar: { flexDirection: 'row', height: 8, borderRadius: 4, position: 'relative', overflow: 'hidden' },
  scaleSeg: { height: 8 },
  scaleMarker: { position: 'absolute', top: -3, marginLeft: -7, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.textPrimary, borderWidth: 3, borderColor: colors.coral },
  scaleLabel: { fontSize: 10, fontWeight: '500', color: colors.textMuted },

  cap1: { fontSize: 11, fontWeight: '500', color: colors.textSecondary, marginTop: 10, textAlign: 'center' },
  cap2: { fontSize: 10, fontWeight: '500', color: colors.textMuted, marginTop: 2, textAlign: 'center' },

  bandRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  bandCard: { flex: 1, backgroundColor: colors.inkCard, borderRadius: 16, padding: 14, gap: 8, borderWidth: 1, borderColor: colors.inkBorder },
  bandLabel: { fontSize: 12, fontWeight: '600' },
  bandHz: { fontSize: 10, fontWeight: '500', color: colors.textMuted },
  bandVal: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  bandDelta: { fontSize: 11, fontWeight: '600' },

  chartCard: { marginTop: 18, backgroundColor: colors.inkCard, borderRadius: 18, padding: 16, gap: 14, borderWidth: 1, borderColor: colors.inkBorder },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chartTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  segmented: { flexDirection: 'row', backgroundColor: colors.ink, borderRadius: 10, padding: 3, gap: 2, borderWidth: 1, borderColor: colors.inkBorder },
  segPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  segPillActive: { backgroundColor: colors.violet },
  segText: { fontSize: 11, fontWeight: '500', color: colors.textMuted },
  segTextActive: { color: colors.textPrimary, fontWeight: '600' },

  callout: { flexDirection: 'row', backgroundColor: '#7C5CFF1F', borderRadius: 16, padding: 14, marginTop: 18, gap: 12, borderWidth: 1, borderColor: '#7C5CFF66' },
  calloutIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.violet, alignItems: 'center', justifyContent: 'center' },
  calloutTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  calloutSub: { fontSize: 12, fontWeight: '500', color: colors.textSecondary, marginTop: 3 },
  calloutAction: { fontSize: 12, fontWeight: '700', color: colors.violet, marginTop: 4 },

  startBtn: { backgroundColor: colors.teal, borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  startBtnText: { fontSize: 14, fontWeight: '700', color: colors.bgBase },
});
