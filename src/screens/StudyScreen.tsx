import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Rect, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, getTBRLevel } from '../theme';
import { useEEGStream, formatDuration } from '../hooks/useEEGStream';

const SW = Dimensions.get('window').width;
const CHART_W = SW - 68;

const PAST_SESSIONS = [
  { name: 'Linear Algebra', dur: '2h', tbr: 2.8, breaks: 3, grade: 'B+', color: colors.amber },
  { name: 'Organic Chem',   dur: '1h40', tbr: 3.6, breaks: 1, grade: 'C',  color: colors.coral },
  { name: 'Neuroscience',   dur: '1h15', tbr: 2.1, breaks: 2, grade: 'A-', color: colors.okGreen },
];

const CURVE: { x: number; y: number }[] = [
  { x: 0.0, y: 0.92 }, { x: 0.08, y: 0.85 }, { x: 0.16, y: 0.72 },
  { x: 0.24, y: 0.55 }, { x: 0.32, y: 0.40 }, { x: 0.38, y: 0.48 },
  { x: 0.44, y: 0.60 }, { x: 0.50, y: 0.70 }, { x: 0.56, y: 0.65 },
  { x: 0.62, y: 0.50 }, { x: 0.68, y: 0.42 }, { x: 0.75, y: 0.30 },
  { x: 0.82, y: 0.22 }, { x: 0.88, y: 0.18 }, { x: 0.94, y: 0.20 },
  { x: 1.0, y: 0.15 },
];
const BREAK_X = 0.50;

function catmullRom(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]; const p1 = pts[i];
    const p2 = pts[Math.min(pts.length - 1, i + 1)]; const p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`;
  }
  return d;
}

const ZONES = [
  { label: 'Severe', color: colors.coral },
  { label: 'Signif.', color: colors.signifOrange },
  { label: 'Mild', color: colors.amber },
  { label: 'Alert', color: colors.okGreen },
];

function SessionChart() {
  const padL = 36; const padR = 8; const padTop = 8;
  const plotW = CHART_W - padL - padR; const plotH = 160; const zoneH = plotH / 4;
  const px = (fx: number) => padL + fx * plotW;
  const py = (fy: number) => padTop + fy * plotH;
  const linePts = CURVE.map(p => ({ x: px(p.x), y: py(p.y) }));
  const lineD = catmullRom(linePts);
  const areaD = lineD ? `${lineD} L ${px(1)} ${padTop + plotH} L ${px(0)} ${padTop + plotH} Z` : '';
  const end = linePts[linePts.length - 1];
  const breakX = px(BREAK_X);

  return (
    <View>
      <Svg width={CHART_W} height={plotH + padTop + 4}>
        <Defs>
          <LinearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.violet} stopOpacity="0.25" />
            <Stop offset="1" stopColor={colors.violet} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>
        {ZONES.map((z, i) => (
          <React.Fragment key={z.label}>
            <Rect x={padL} y={padTop + i * zoneH} width={plotW} height={zoneH} fill={z.color} opacity={0.04} />
            <Line x1={padL} y1={padTop + i * zoneH} x2={padL + plotW} y2={padTop + i * zoneH} stroke={colors.white} strokeWidth={0.5} opacity={0.05} />
          </React.Fragment>
        ))}
        <Rect x={breakX - 8} y={padTop} width={16} height={plotH} fill={colors.okGreen} opacity={0.12} />
        <Line x1={breakX} y1={padTop} x2={breakX} y2={padTop + plotH} stroke={colors.okGreen} strokeWidth={1} opacity={0.5} />
        {areaD ? <Path d={areaD} fill="url(#chartArea)" /> : null}
        {lineD ? <Path d={lineD} stroke={colors.violet} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
        <Circle cx={end.x} cy={end.y} r={8} fill={colors.violet} opacity={0.2} />
        <Circle cx={end.x} cy={end.y} r={4.5} fill={colors.violet} />
        <Circle cx={end.x} cy={end.y} r={2.5} fill={colors.white} />
      </Svg>
      {ZONES.map((z, i) => (
        <Text key={z.label} style={[s.zoneLabel, { color: colors.textMuted, top: padTop + i * zoneH + zoneH / 2 - 5 }]}>{z.label}</Text>
      ))}
      <Text style={[s.breakLabel, { left: breakX - 16, top: padTop - 2 }]}>BREAK</Text>
      <View style={[s.timeAxis, { marginLeft: padL, width: CHART_W - padL - padR }]}>
        {['0m', '30m', '60m', '90m', 'now'].map(t => <Text key={t} style={s.timeTick}>{t}</Text>)}
      </View>
    </View>
  );
}

export default function StudyScreen() {
  const { tbr, prediction, sessionSec, breakCount, logBreak } = useEEGStream();
  const retention = prediction?.estimated_retention ?? 68;

  const stats = [
    { label: 'DURATION', value: formatDuration(sessionSec), color: colors.textPrimary },
    { label: 'AVG TBR', value: tbr.toFixed(1), color: colors.teal },
    { label: 'BREAKS', value: `${breakCount}/3`, color: colors.textPrimary },
    { label: 'RETAIN*', value: `${retention}%`, color: colors.okGreen },
  ];

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>Study Session</Text>
      <View style={s.subRow}>
        <View style={s.connDot} />
        <Text style={s.subtitle}>Organic Chemistry {'\u00B7'} AWear streaming</Text>
      </View>

      <View style={s.pillRow}>
        {stats.map(st => (
          <View key={st.label} style={s.statPill}>
            <Text style={s.statLabel}>{st.label}</Text>
            <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
          </View>
        ))}
      </View>

      <View style={s.chartCard}>
        <View style={s.chartHeader}>
          <Text style={s.chartTitle}>Session fatigue (TBR)</Text>
          <TouchableOpacity style={s.breakBtn} onPress={logBreak} activeOpacity={0.8}>
            <Text style={s.breakBtnText}>BREAK NOW</Text>
          </TouchableOpacity>
        </View>
        <SessionChart />
      </View>

      <View style={s.predCard}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <View style={s.predIcon}><Text style={{ fontSize: 16 }}>{'\u26A1'}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.predTitle}>Fatigue Prediction</Text>
            <Text style={s.predSub}>Based on TBR slope from 42 prior sessions</Text>
          </View>
        </View>
        <View style={s.predStats}>
          <View style={{ flex: 1 }}><Text style={s.predStatLabel}>To severe</Text><Text style={[s.predStatVal, { color: colors.coral }]}>~12 min</Text></View>
          <View style={{ flex: 1 }}><Text style={s.predStatLabel}>Break at</Text><Text style={[s.predStatVal, { color: colors.textPrimary }]}>NOW</Text></View>
          <View style={{ flex: 1 }}><Text style={s.predStatLabel}>Recovery</Text><Text style={[s.predStatVal, { color: colors.teal }]}>8-10 min</Text></View>
        </View>
        <Text style={s.predNote}>{'\u2192'} You lose ~40% retention past TBR 3.5</Text>
        <Text style={s.demoLabel}>Illustrative forecast {'\u2014'} not measured data</Text>
      </View>

      <Text style={s.sectionTitle}>Past Sessions</Text>
      {PAST_SESSIONS.map(se => (
        <View key={se.name} style={s.sessionRow}>
          <View style={[s.sessionBorder, { backgroundColor: se.color }]} />
          <View style={s.sessionInfo}>
            <Text style={s.sessionName}>{se.name}</Text>
            <Text style={s.sessionMeta}>{se.dur} {'\u00B7'} TBR {se.tbr} {'\u00B7'} {se.breaks} break{se.breaks !== 1 ? 's' : ''}</Text>
          </View>
          <View style={[s.gradeBadge, { backgroundColor: se.color }]}>
            <Text style={s.gradeText}>{se.grade}</Text>
          </View>
        </View>
      ))}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink, paddingHorizontal: 18, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  connDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.okGreen },
  subtitle: { fontSize: 12, color: colors.textMuted },

  pillRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  statPill: { flex: 1, backgroundColor: colors.inkCard, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: colors.inkBorder },
  statLabel: { fontSize: 8, fontWeight: '600', color: colors.textMuted, letterSpacing: 0.5 },
  statValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },

  chartCard: { backgroundColor: colors.inkCard, borderRadius: 18, padding: 16, marginTop: 18, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: colors.inkBorder },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  chartTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  breakBtn: { backgroundColor: colors.teal, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  breakBtnText: { fontSize: 10, fontWeight: '700', color: colors.ink, letterSpacing: 0.3 },

  zoneLabel: { position: 'absolute', left: 4, fontSize: 8, fontWeight: '600' },
  breakLabel: { position: 'absolute', fontSize: 8, fontWeight: '700', color: colors.okGreen },
  timeAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  timeTick: { fontSize: 9, color: colors.textMuted },

  predCard: { backgroundColor: '#F5A5240F', borderRadius: 16, padding: 16, marginTop: 18, borderWidth: 1, borderColor: '#F5A52440' },
  predIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bandGamma + '30', alignItems: 'center', justifyContent: 'center' },
  predTitle: { fontSize: 14, fontWeight: '600', color: colors.bandGamma },
  predSub: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  predStats: { flexDirection: 'row', marginTop: 16, gap: 8 },
  predStatLabel: { fontSize: 9, color: colors.textMuted },
  predStatVal: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  predNote: { fontSize: 10, color: colors.textMuted, marginTop: 14 },
  demoLabel: { fontSize: 9, color: colors.textMuted, fontStyle: 'italic', marginTop: 8 },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginTop: 24, marginBottom: 12 },
  sessionRow: { flexDirection: 'row', backgroundColor: colors.inkCard, borderRadius: 12, marginBottom: 8, overflow: 'hidden', alignItems: 'center', borderWidth: 1, borderColor: colors.inkBorder },
  sessionBorder: { width: 4, alignSelf: 'stretch' },
  sessionInfo: { flex: 1, paddingVertical: 14, paddingHorizontal: 12 },
  sessionName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  sessionMeta: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  gradeBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  gradeText: { fontSize: 12, fontWeight: '700', color: colors.ink },
});
