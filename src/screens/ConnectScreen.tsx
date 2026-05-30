import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Ellipse, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../theme';

export default function ConnectScreen({ navigation }: any) {
  return (
    <View style={s.root}>
      {/* Top bar */}
      <View style={s.topBar}>
        <View style={s.logoRow}>
          <View style={s.logoDot} />
          <Text style={s.logoText}>BrainPace</Text>
        </View>
        <Text style={s.menuIcon}>{'\u2630'}</Text>
      </View>

      {/* Headline */}
      <Text style={s.headline}>Connect your AWEAR device</Text>

      {/* Illustration */}
      <View style={s.illustration}>
        <Svg width={200} height={200}>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={colors.teal} stopOpacity="0.3" />
              <Stop offset="1" stopColor={colors.teal} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx={100} cy={100} rx={90} ry={90} fill="url(#glow)" />
          <Circle cx={100} cy={100} r={60} stroke={colors.teal} strokeWidth={2} fill="none" opacity={0.4} />
          <Circle cx={100} cy={100} r={45} stroke={colors.teal} strokeWidth={1.5} fill="none" opacity={0.2} />
          {/* Device icon placeholder */}
          <Circle cx={100} cy={100} r={28} fill={colors.bgElevated} stroke={colors.teal} strokeWidth={1} opacity={0.6} />
        </Svg>
        <Text style={s.deviceIcon}>{'\uD83C\uDFA7'}</Text>
      </View>

      {/* Instructions */}
      <Text style={s.instruction}>Make sure your device is on and placed behind your ear.</Text>

      {/* Bottom */}
      <View style={s.bottom}>
        <TouchableOpacity
          style={s.connectBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Baseline')}
        >
          <Text style={s.connectText}>{'\u26A1'} Connect</Text>
        </TouchableOpacity>

        <View style={s.qualityRow}>
          <View style={s.qualityDot} />
          <View>
            <Text style={s.qualityLabel}>Excellent</Text>
            <Text style={s.qualitySub}>Signal quality</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase, paddingHorizontal: 20, paddingTop: 62, justifyContent: 'space-between' },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.teal },
  logoText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  menuIcon: { fontSize: 20, color: colors.textMuted },

  headline: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, lineHeight: 34, marginTop: 16 },

  illustration: { alignItems: 'center', justifyContent: 'center', height: 300 },
  deviceIcon: { position: 'absolute', fontSize: 40 },

  instruction: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 20 },

  bottom: { gap: 18, paddingBottom: 24 },
  connectBtn: { backgroundColor: colors.teal, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' },
  connectText: { fontSize: 16, fontWeight: '700', color: colors.bgBase },

  qualityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center' },
  qualityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.okGreen },
  qualityLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  qualitySub: { fontSize: 10, color: colors.textMuted },
});
