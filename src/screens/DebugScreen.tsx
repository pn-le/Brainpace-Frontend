// Temporary debug screen — delete before demo.
// Calls every backend endpoint and shows raw JSON + status.

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { API_URL, fetchParticipants, fetchSummary, fetchCognitionSeries, resolveParticipantId } from '../api';
import { colors } from '../theme';

type Status = 'idle' | 'loading' | 'ok' | 'error';

interface EndpointResult {
  status: Status;
  data?: any;
  error?: string;
  ms?: number;
}

async function getJSON(path: string) {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

const ENDPOINTS = [
  { key: 'health', label: 'GET /health', fn: () => getJSON('/health') },
  { key: 'members', label: 'GET /members', fn: () => fetchParticipants() },
  { key: 'resolve', label: 'resolveParticipantId()', fn: () => resolveParticipantId() },
  { key: 'summary', label: 'GET /summary/{pid}', fn: async () => { const pid = await resolveParticipantId(); return pid ? fetchSummary(pid) : 'No participant'; } },
  { key: 'cognition', label: 'GET /cognition/{pid}/series', fn: async () => { const pid = await resolveParticipantId(); return pid ? fetchCognitionSeries(pid) : 'No participant'; } },
  { key: 'waveform', label: 'GET /live/{pid}/waveform', fn: async () => { const pid = await resolveParticipantId(); return pid ? getJSON(`/live/${pid}/waveform?minutes=5`) : 'No participant'; } },
  { key: 'tiredness', label: 'GET /tiredness/{pid}', fn: async () => { const pid = await resolveParticipantId(); return pid ? getJSON(`/tiredness/${pid}`) : 'No participant'; } },
  { key: 'mood', label: 'GET /mood/{pid}', fn: async () => { const pid = await resolveParticipantId(); return pid ? getJSON(`/mood/${pid}`) : 'No participant'; } },
];

function truncate(obj: any): string {
  const s = JSON.stringify(obj, null, 2);
  // Truncate arrays longer than 5 items for readability
  return s.replace(/\[([^\[\]]{200,})\]/g, (match) => {
    try {
      const arr = JSON.parse(match);
      if (Array.isArray(arr) && arr.length > 5) {
        return JSON.stringify([...arr.slice(0, 3), `... ${arr.length - 3} more`], null, 2);
      }
    } catch {}
    return match.slice(0, 200) + '...';
  });
}

export default function DebugScreen() {
  const [results, setResults] = useState<Record<string, EndpointResult>>({});

  const callEndpoint = useCallback(async (key: string, fn: () => Promise<any>) => {
    setResults(prev => ({ ...prev, [key]: { status: 'loading' } }));
    const t0 = Date.now();
    try {
      const data = await fn();
      setResults(prev => ({ ...prev, [key]: { status: 'ok', data, ms: Date.now() - t0 } }));
    } catch (e: any) {
      setResults(prev => ({ ...prev, [key]: { status: 'error', error: e.message, ms: Date.now() - t0 } }));
    }
  }, []);

  const callAll = useCallback(() => {
    ENDPOINTS.forEach(ep => callEndpoint(ep.key, ep.fn));
  }, [callEndpoint]);

  return (
    <ScrollView style={s.root}>
      <Text style={s.title}>Debug: API Integration</Text>
      <Text style={s.sub}>Base URL: {API_URL}</Text>
      <Text style={s.sub}>Participant: auto-resolved from /members</Text>

      <TouchableOpacity style={s.callAllBtn} onPress={callAll} activeOpacity={0.8}>
        <Text style={s.callAllText}>Call All Endpoints</Text>
      </TouchableOpacity>

      {ENDPOINTS.map(ep => {
        const r = results[ep.key];
        const statusColor = !r || r.status === 'idle' ? colors.textMuted :
          r.status === 'loading' ? colors.amber :
          r.status === 'ok' ? colors.okGreen : colors.coral;

        return (
          <View key={ep.key} style={s.card}>
            <View style={s.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.endpoint}>{ep.label}</Text>
                {r?.ms != null && <Text style={s.timing}>{r.ms}ms</Text>}
              </View>
              <View style={[s.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor + '55' }]}>
                <Text style={[s.statusText, { color: statusColor }]}>
                  {!r ? 'IDLE' : r.status === 'loading' ? 'LOADING' : r.status === 'ok' ? 'OK' : 'ERROR'}
                </Text>
              </View>
              <TouchableOpacity
                style={s.callBtn}
                onPress={() => callEndpoint(ep.key, ep.fn)}
              >
                <Text style={s.callBtnText}>Call</Text>
              </TouchableOpacity>
            </View>

            {r?.status === 'loading' && <ActivityIndicator color={colors.violet} style={{ marginTop: 8 }} />}

            {r?.status === 'ok' && (
              <Text style={s.json}>{truncate(r.data)}</Text>
            )}

            {r?.status === 'error' && (
              <Text style={[s.json, { color: colors.coral }]}>{r.error}</Text>
            )}
          </View>
        );
      })}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink, paddingHorizontal: 16, paddingTop: 62 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontFamily: 'monospace' },

  callAllBtn: { backgroundColor: colors.violet, borderRadius: 12, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 8 },
  callAllText: { fontSize: 14, fontWeight: '700', color: colors.white },

  card: { backgroundColor: colors.inkCard, borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: colors.inkBorder },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  endpoint: { fontSize: 11, fontWeight: '600', color: colors.textPrimary, fontFamily: 'monospace' },
  timing: { fontSize: 9, color: colors.textMuted, marginTop: 2 },

  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  statusText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },

  callBtn: { backgroundColor: colors.violet + '33', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  callBtnText: { fontSize: 10, fontWeight: '600', color: colors.violet },

  json: { fontSize: 10, color: colors.teal, fontFamily: 'monospace', marginTop: 8, lineHeight: 15 },
});
