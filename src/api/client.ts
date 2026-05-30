// Typed API client for the Brainspace backend.
// Every endpoint from /openapi.json is covered here.

import { BASE_URL, PARTICIPANT_ID } from './config';
import type {
  HealthResponse,
  SummaryResponse,
  WaveformResponse,
  CognitionResponse,
  TirednessResponse,
  MoodResponse,
} from './types';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

export const api = {
  health: () =>
    get<HealthResponse>('/health'),

  members: () =>
    get<{ participants: string[] }>('/members'),

  summary: (pid = PARTICIPANT_ID, tz = 'UTC') =>
    get<SummaryResponse>(`/summary/${pid}?tz=${tz}`),

  waveform: (pid = PARTICIPANT_ID, minutes = 5, tz = 'UTC') =>
    get<WaveformResponse>(`/live/${pid}/waveform?minutes=${minutes}&tz=${tz}`),

  cognitionSeries: (pid = PARTICIPANT_ID, minutes = 30, bucket = '20s', tz = 'UTC') =>
    get<CognitionResponse>(`/cognition/${pid}/series?minutes=${minutes}&bucket=${bucket}&tz=${tz}`),

  tiredness: (pid = PARTICIPANT_ID, tz = 'UTC') =>
    get<TirednessResponse>(`/tiredness/${pid}?tz=${tz}`),

  mood: (pid = PARTICIPANT_ID, tz = 'UTC') =>
    get<MoodResponse>(`/mood/${pid}?tz=${tz}`),
};
