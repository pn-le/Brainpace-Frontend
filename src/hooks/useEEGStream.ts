/**
 * useEEGStream — single hook powering every screen.
 *
 * AWear API constraint: data can only be pulled every 5 minutes.
 * This hook polls REST every 5 min (not WebSocket streaming).
 *
 * Currently runs MOCK DATA. When backend is ready:
 * 1. Set USE_MOCK = false
 * 2. Set API_URL to your server
 * 3. Zero other changes.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { BandPowers, EpochData, Prediction, TBRPoint, FatigueState } from '../types';
import { getTBRLevel } from '../theme';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG — flip USE_MOCK when backend is ready
// ═══════════════════════════════════════════════════════════════════════════════
const USE_MOCK = true;
const API_URL = 'http://YOUR_SERVER_IP:8000';   // ← change this
const POLL_INTERVAL_MS = 5 * 60 * 1000;         // 5 minutes (AWear constraint)
const COUNTDOWN_TICK_MS = 1000;                  // UI countdown updates every 1s

// ═══════════════════════════════════════════════════════════════════════════════
// Hook output — same shape whether mock or real
// ═══════════════════════════════════════════════════════════════════════════════
export interface EEGStream {
  // Latest 5-min window reading
  tbr: number;
  fatigueState: FatigueState;
  fatigueColor: string;
  bands: BandPowers;

  // Prediction (computed from history)
  prediction: Prediction | null;

  // All historical TBR readings (one per 5-min pull)
  tbrHistory: TBRPoint[];

  // Session info
  sessionSec: number;
  breakCount: number;
  isConnected: boolean;

  // Polling state
  lastPullAgo: number;       // seconds since last pull
  nextPullIn: number;        // seconds until next pull
  epochsInWindow: number;    // how many epochs in last 5-min window (should be ~300)

  // Actions
  logBreak: () => void;
  refreshNow: () => void;    // force a pull (won't bypass AWear's rate limit)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Mock data — simulates 5-min polling
// ═══════════════════════════════════════════════════════════════════════════════
function mockPull(pullIndex: number): { epoch: EpochData; prediction: Prediction } {
  // Simulate TBR climbing over study session
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

  const slope = pullIndex > 2 ? 0.15 : 0;
  const secsToSevere = slope > 0 ? Math.max(0, (4.0 - tbr) / (slope / 300)) : Infinity;
  const retention = Math.max(20, Math.round(100 - Math.max(0, tbr - 1.4) * 16));

  const prediction: Prediction = {
    current_tbr: Math.round(tbr * 100) / 100,
    baseline_tbr: 1.4,
    tbr_vs_baseline: Math.round((tbr - 1.4) * 100) / 100,
    slope_per_min: Math.round(slope * 60 * 10000) / 10000,
    trend: slope > 0.001 ? 'increasing' : 'stable',
    predicted_severe_in_min: isFinite(secsToSevere) ? Math.round(secsToSevere / 60) : null,
    optimal_break_in_min: isFinite(secsToSevere) ? Math.max(0, Math.round(secsToSevere / 60) - 5) : null,
    recommendation: tbr > 3.5 ? '⚠ Take a break NOW.' : tbr > 2.5 ? 'Fatigue building. Break soon.' : 'You\'re doing well.',
    urgency: tbr > 3.5 ? 'critical' : tbr > 2.5 ? 'warning' : tbr > 2.0 ? 'info' : 'none',
    estimated_retention: retention,
    retention_note: `~${retention}% retention at current fatigue`,
  };

  return { epoch, prediction };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════════════════
export function useEEGStream(): EEGStream {
  const [tbr, setTbr] = useState(1.4);
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

  // ── Process a pull (same handler for mock + real) ──────────────────────────
  const processPull = useCallback((epoch: EpochData, pred: Prediction) => {
    setTbr(epoch.tbr);
    setFatigueState(epoch.fatigue_state);
    setFatigueColor(epoch.fatigue_color);
    setBands({ delta: epoch.delta, theta: epoch.theta, alpha: epoch.alpha, beta: epoch.beta, gamma: epoch.gamma });
    setPrediction(pred);
    setEpochsInWindow(300); // 5 min × 60 sec = 300 epochs

    const elapsed = (Date.now() - sessionStart.current) / 1000;
    setTbrHistory(prev => [...prev, { time: elapsed, tbr: epoch.tbr, state: epoch.fatigue_state }]);

    lastPullTime.current = Date.now();
    setLastPullAgo(0);
    setNextPullIn(300);
  }, []);

  // ── Do a pull ──────────────────────────────────────────────────────────────
  const doPull = useCallback(async () => {
    if (USE_MOCK) {
      const { epoch, prediction: pred } = mockPull(pullIndex.current);
      pullIndex.current += 1;
      processPull(epoch, pred);
      setIsConnected(true);
    } else {
      try {
        const resp = await fetch(`${API_URL}/api/current`);
        const data = await resp.json();
        if (data.epoch) {
          processPull(data.epoch, data.prediction);
          setBreakCount(data.break_count || 0);
          setIsConnected(true);
        }
      } catch {
        setIsConnected(false);
      }
    }
  }, [processPull]);

  // ── Initial pull + interval ────────────────────────────────────────────────
  useEffect(() => {
    doPull(); // first pull immediately

    const pollTimer = setInterval(doPull, POLL_INTERVAL_MS);
    return () => clearInterval(pollTimer);
  }, [doPull]);

  // ── Countdown timer (UI only, updates every second) ────────────────────────
  useEffect(() => {
    const tick = setInterval(() => {
      const sincePull = Math.floor((Date.now() - lastPullTime.current) / 1000);
      setLastPullAgo(sincePull);
      setNextPullIn(Math.max(0, 300 - sincePull));
      setSessionSec(Math.floor((Date.now() - sessionStart.current) / 1000));
    }, COUNTDOWN_TICK_MS);
    return () => clearInterval(tick);
  }, []);

  // ── Log break ──────────────────────────────────────────────────────────────
  const logBreak = useCallback(async () => {
    setBreakCount(c => c + 1);
    if (!USE_MOCK) {
      try { await fetch(`${API_URL}/api/break`, { method: 'POST' }); } catch {}
    }
  }, []);

  // ── Force refresh (respects AWear rate limit in production) ─────────────────
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
