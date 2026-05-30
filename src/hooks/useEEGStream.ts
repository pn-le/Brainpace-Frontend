/**
 * useEEGStream — single hook powering every screen.
 *
 * Polls the Brainspace backend every 5 minutes (AWear API constraint).
 * Calls /summary, /live/waveform, and /cognition/series endpoints.
 *
 * Set USE_MOCK = true to run with fake data (no backend needed).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { BandPowers, EpochData, Prediction, TBRPoint, FatigueState } from '../types';
import { getTBRLevel } from '../theme';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════════
const USE_MOCK = false;
const API_URL = 'http://localhost:8000';
const PARTICIPANT_ID = 'P-ZK55GT';
const POLL_INTERVAL_MS = 5 * 60 * 1000;         // 5 minutes
const COUNTDOWN_TICK_MS = 1000;

// ═══════════════════════════════════════════════════════════════════════════════
// Hook output
// ═══════════════════════════════════════════════════════════════════════════════
export interface EEGStream {
  tbr: number;
  fatigueState: FatigueState;
  fatigueColor: string;
  bands: BandPowers;
  prediction: Prediction | null;
  tbrHistory: TBRPoint[];
  sessionSec: number;
  breakCount: number;
  isConnected: boolean;
  lastPullAgo: number;
  nextPullIn: number;
  epochsInWindow: number;
  logBreak: () => void;
  refreshNow: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TBR → fatigue state helpers
// ═══════════════════════════════════════════════════════════════════════════════
function tbrToFatigueState(tbr: number): FatigueState {
  if (tbr < 2) return 'alert';
  if (tbr < 3) return 'mild_fatigue';
  if (tbr < 4) return 'significant_fatigue';
  return 'severe_fatigue';
}

function buildPrediction(
  tbr: number,
  baselineTbr: number,
  history: TBRPoint[],
): Prediction {
  // Compute slope from recent history
  let slope = 0;
  if (history.length >= 2) {
    const recent = history.slice(-5);
    const first = recent[0];
    const last = recent[recent.length - 1];
    const dt = (last.time - first.time) / 60; // minutes
    if (dt > 0) slope = (last.tbr - first.tbr) / dt;
  }

  const secsToSevere = slope > 0 ? Math.max(0, (4.0 - tbr) / slope) : Infinity;
  const retention = Math.max(20, Math.round(100 - Math.max(0, tbr - 1.4) * 16));

  return {
    current_tbr: Math.round(tbr * 100) / 100,
    baseline_tbr: baselineTbr,
    tbr_vs_baseline: Math.round((tbr - baselineTbr) * 100) / 100,
    slope_per_min: Math.round(slope * 10000) / 10000,
    trend: slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable',
    predicted_severe_in_min: isFinite(secsToSevere) ? Math.round(secsToSevere) : null,
    optimal_break_in_min: isFinite(secsToSevere) ? Math.max(0, Math.round(secsToSevere) - 5) : null,
    recommendation: tbr > 3.5 ? 'Take a break NOW.' : tbr > 2.5 ? 'Fatigue building. Break soon.' : 'You\'re doing well.',
    urgency: tbr > 3.5 ? 'critical' : tbr > 2.5 ? 'warning' : tbr > 2.0 ? 'info' : 'none',
    estimated_retention: retention,
    retention_note: `~${retention}% retention at current fatigue`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Mock data fallback
// ═══════════════════════════════════════════════════════════════════════════════
function mockPull(pullIndex: number): { epoch: EpochData; prediction: Prediction } {
  const baseTBR = 1.4 + pullIndex * 0.15 + (Math.random() - 0.5) * 0.3;
  const tbr = Math.max(0.8, Math.min(5.0, baseTBR));
  const beta = (3.5 + Math.random() * 2) * 1e-6;
  const theta = tbr * beta;
  const level = getTBRLevel(tbr);

  const epoch: EpochData = {
    timestamp: Date.now() / 1000,
    delta: (1.5 + Math.random()) * 1e-6,
    theta,
    alpha: (6 + Math.random() * 4) * 1e-6,
    beta,
    gamma: (0.8 + Math.random() * 0.8) * 1e-6,
    tbr: Math.round(tbr * 1000) / 1000,
    fatigue_state: level.state as FatigueState,
    fatigue_color: level.color,
  };

  const prediction: Prediction = {
    current_tbr: Math.round(tbr * 100) / 100,
    baseline_tbr: 1.4,
    tbr_vs_baseline: Math.round((tbr - 1.4) * 100) / 100,
    slope_per_min: 0,
    trend: 'stable',
    predicted_severe_in_min: null,
    optimal_break_in_min: null,
    recommendation: 'Mock data',
    urgency: 'none',
    estimated_retention: 100,
    retention_note: 'Mock',
  };

  return { epoch, prediction };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════════════════
export function useEEGStream(): EEGStream {
  const [tbr, setTbr] = useState(0);
  const [fatigueState, setFatigueState] = useState<FatigueState>('alert');
  const [fatigueColor, setFatigueColor] = useState('#33DB85');
  const [bands, setBands] = useState<BandPowers>({ delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 });
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [tbrHistory, setTbrHistory] = useState<TBRPoint[]>([]);
  const [sessionSec, setSessionSec] = useState(0);
  const [breakCount, setBreakCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [lastPullAgo, setLastPullAgo] = useState(0);
  const [nextPullIn, setNextPullIn] = useState(300);
  const [epochsInWindow, setEpochsInWindow] = useState(0);

  const pullIndex = useRef(0);
  const sessionStart = useRef(Date.now());
  const lastPullTime = useRef(Date.now());
  const baselineTbr = useRef(0);

  // ── Process a pull ────────────────────────────────────────────────────────
  const processPull = useCallback((epoch: EpochData, pred: Prediction) => {
    setTbr(epoch.tbr);
    setFatigueState(epoch.fatigue_state);
    setFatigueColor(epoch.fatigue_color);
    setBands({ delta: epoch.delta, theta: epoch.theta, alpha: epoch.alpha, beta: epoch.beta, gamma: epoch.gamma });
    setPrediction(pred);
    setEpochsInWindow(300);

    const elapsed = (Date.now() - sessionStart.current) / 1000;
    setTbrHistory(prev => [...prev, { time: elapsed, tbr: epoch.tbr, state: epoch.fatigue_state }]);

    lastPullTime.current = Date.now();
    setLastPullAgo(0);
    setNextPullIn(300);
  }, []);

  // ── Do a pull ─────────────────────────────────────────────────────────────
  const doPull = useCallback(async () => {
    if (USE_MOCK) {
      const { epoch, prediction: pred } = mockPull(pullIndex.current);
      pullIndex.current += 1;
      processPull(epoch, pred);
      setIsConnected(true);
      return;
    }

    try {
      // Fan out: summary (band powers + TBR) and cognition series in parallel
      const [summaryRes, seriesRes] = await Promise.all([
        fetch(`${API_URL}/summary/${PARTICIPANT_ID}`),
        fetch(`${API_URL}/cognition/${PARTICIPANT_ID}/series?minutes=30&bucket=20s`),
      ]);

      if (!summaryRes.ok || !seriesRes.ok) {
        setIsConnected(false);
        return;
      }

      const summary = await summaryRes.json();
      const series = await seriesRes.json();

      // Extract TBR from cognition ratios
      const currentTbr = summary.cognition?.tbr ?? 0;
      const bp = summary.band_powers;
      const level = getTBRLevel(currentTbr);

      // Set baseline from first pull
      if (baselineTbr.current === 0) {
        baselineTbr.current = currentTbr;
      }

      // Build TBR history from cognition series
      const historyPoints: TBRPoint[] = (series.points || []).map((pt: any, i: number) => ({
        time: i * series.bucket_seconds,
        tbr: pt.ratios?.tbr ?? 0,
        state: tbrToFatigueState(pt.ratios?.tbr ?? 0),
      }));
      setTbrHistory(historyPoints);
      setEpochsInWindow(series.records || 0);

      // Build epoch
      const epoch: EpochData = {
        timestamp: Date.now() / 1000,
        delta: bp.delta,
        theta: bp.theta,
        alpha: bp.alpha,
        beta: bp.beta,
        gamma: bp.gamma,
        tbr: Math.round(currentTbr * 1000) / 1000,
        fatigue_state: level.state as FatigueState,
        fatigue_color: level.color,
      };

      // Build prediction from history
      const pred = buildPrediction(currentTbr, baselineTbr.current, historyPoints);

      setTbr(epoch.tbr);
      setFatigueState(epoch.fatigue_state);
      setFatigueColor(epoch.fatigue_color);
      setBands({ delta: bp.delta, theta: bp.theta, alpha: bp.alpha, beta: bp.beta, gamma: bp.gamma });
      setPrediction(pred);
      setIsConnected(true);

      lastPullTime.current = Date.now();
      setLastPullAgo(0);
      setNextPullIn(300);
    } catch {
      setIsConnected(false);
    }
  }, [processPull]);

  // ── Initial pull + interval ───────────────────────────────────────────────
  useEffect(() => {
    doPull();
    const pollTimer = setInterval(doPull, POLL_INTERVAL_MS);
    return () => clearInterval(pollTimer);
  }, [doPull]);

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => {
      const sincePull = Math.floor((Date.now() - lastPullTime.current) / 1000);
      setLastPullAgo(sincePull);
      setNextPullIn(Math.max(0, 300 - sincePull));
      setSessionSec(Math.floor((Date.now() - sessionStart.current) / 1000));
    }, COUNTDOWN_TICK_MS);
    return () => clearInterval(tick);
  }, []);

  const logBreak = useCallback(() => {
    setBreakCount(c => c + 1);
  }, []);

  const refreshNow = useCallback(() => {
    doPull();
  }, [doPull]);

  return {
    tbr, fatigueState, fatigueColor, bands, prediction, tbrHistory,
    sessionSec, breakCount, isConnected,
    lastPullAgo, nextPullIn, epochsInWindow,
    logBreak, refreshNow,
  };
}

// ─── Utilities ───────────────────────────────────────────────────────────────
export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatPower(v: number): string {
  return v < 0.001 ? `${(v * 1e6).toFixed(1)}e-6` : v.toFixed(4);
}

export function formatCountdown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
