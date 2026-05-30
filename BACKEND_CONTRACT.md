# Backend Contract — Brainspace API

**Base URL:** `http://localhost:8000`
**Source:** `github.com/Y0z64/Brainspace` (`backend/`)
**Framework:** FastAPI (Python)
**Data source:** AWear B2B API (single-channel EEG, TP10, 256 Hz)
**Polling constraint:** AWear data arrives in batches; ~5 min ingestion delay (`data_delay_seconds: 300`)

---

## Endpoints

### `GET /health`
Health check.
```json
{ "status": "ok", "app": "brainpace" }
```

### `GET /members`
List participants with a bound AWear device.
```json
{ "participants": ["P-ZK55GT"] }
```

### `GET /summary/{participant_id}?date=&tz=UTC`
**Home screen — single round-trip for all current metrics.**
```json
{
  "participant_id": "P-ZK55GT",
  "records": 13985,
  "band_powers": { "delta": 4976392.1, "theta": 677290.4, "alpha": 171704.7, "beta": 120544.4, "gamma": 29318.3 },
  "mood": { "valence": 0.59, "arousal": 0.12, "label": "calm" },
  "tiredness": { "score": 0.78, "index": 7.04, "label": "tired" },
  "cognition": { "tbr": 5.62, "cognitive_state": 0.25 }
}
```
- `cognition.tbr` = theta/beta ratio (the core metric)
- `cognition.cognitive_state` = alpha/theta
- `tiredness.index` = (theta+alpha)/beta (different from TBR)
- Band powers are raw V²/Hz (NOT micro-scale; these are large numbers from raw waveforms)

### `GET /live/{participant_id}/waveform?minutes=2&tz=UTC`
**Live Feed — latest EEG record's raw + filtered waveforms.**
```json
{
  "participant_id": "P-ZK55GT",
  "timestamp": "2026-05-30T20:00:05.000+00:00",
  "sample_rate_hz": 256,
  "raw": [800.0, 821.0, 838.0, ...],           // 256 samples
  "bands": {
    "delta": [0.12, -0.34, ...],                // bandpass_fft filtered
    "theta": [...], "alpha": [...], "beta": [...], "gamma": [...]
  },
  "band_powers": { "delta": 8606.2, "theta": 1587.8, "alpha": 875.2, "beta": 1831.9, "gamma": 1099.7 },
  "ratios": { "tbr": 0.87, "cognitive_state": 0.55 }
}
```
- Returns the MOST RECENT single record from the recent window
- `raw` = 256 float samples (1 second of EEG at 256 Hz)
- `bands` = per-band bandpass_fft filtered waveforms (same length as raw)
- `ratios.tbr` = theta/beta for THIS record

### `GET /cognition/{participant_id}/series?minutes=30&bucket=20s&tz=UTC`
**TBR Over Time chart — time series of cognitive ratios.**
```json
{
  "participant_id": "P-ZK55GT",
  "records": 1658,
  "bucket_seconds": 20,
  "delay_seconds": 300,
  "ratios": ["tbr", "cognitive_state"],
  "points": [
    {
      "timestamp": "2026-05-30T19:31:20Z",
      "samples": 15,
      "ratios": { "tbr": 0.94, "cognitive_state": 0.65 },
      "band_powers": { "delta": 8606.2, "theta": 1587.8, "alpha": 875.2, "beta": 1831.9, "gamma": 1099.7 }
    },
    ...
  ]
}
```
- Per-second ratios computed first, then averaged into buckets
- `bucket=1s` = raw per-second data; `bucket=20s` = 20-second averages

### `GET /tiredness/{participant_id}?date=&tz=UTC`
**Fatigue score for the day.**
```json
{
  "participant_id": "P-ZK55GT",
  "records": 13985,
  "band_powers": { ... },
  "score": 0.78,    // 0..1, higher = more tired
  "index": 7.04,    // raw (theta+alpha)/beta
  "label": "tired"  // "alert" | "tired" | ...
}
```

### `GET /mood/{participant_id}?date=&tz=UTC`
**Mood estimation for the day.**
```json
{
  "participant_id": "P-ZK55GT",
  "records": 13985,
  "band_powers": { ... },
  "valence": 0.59,  // 0..1, higher = more pleasant
  "arousal": 0.12,  // 0..1, higher = more aroused
  "label": "calm"
}
```

---

## What the design needs vs. what the backend provides

| Feature | Backend? | Notes |
|---------|----------|-------|
| TBR (theta/beta ratio) | YES | `cognition.tbr` via `/summary` and `/cognition/series` |
| Band powers (5 bands) | YES | All endpoints return `band_powers` |
| Live raw EEG waveform | YES | `/live/{pid}/waveform` → `raw` (256 samples) |
| Filtered band signals | YES | `/live/{pid}/waveform` → `bands` dict |
| TBR time series | YES | `/cognition/{pid}/series` with configurable buckets |
| Tiredness score/label | YES | `/tiredness/{pid}` |
| Mood valence/arousal | YES | `/mood/{pid}` |
| Fatigue classification (Alert/Mild/Signif/Severe) | **NO** | Thresholds applied client-side from TBR value |
| Baseline TBR | **NO** | No baseline calibration endpoint; must compute on client from first pull |
| "Severe in X min" prediction | **NO** | Must compute on client from TBR slope |
| Retention % / predicted grade | **NO** | Not a real measurement — **MOCK / illustrative only** |
| Study session start/stop/breaks | **NO** | Must manage on client (local state) |
| Past sessions history | **NO** | Must store on client (AsyncStorage or similar) |
| Adaptive music control | **NO** | No music API — **UI only, not wired** |
| User auth / profile | **NO** | Participants come from AWear; no user accounts |
| CORS | **NEEDS ADDING** | `CORSMiddleware` must be added to `main.py` |

---

## Config needed

```env
# Frontend .env or constants
API_URL=http://localhost:8000
PARTICIPANT_ID=P-ZK55GT
```

## Key implementation notes

1. **Band power scale:** Backend returns raw power values (thousands), not micro-scale (1e-6). The `formatPower()` helper needs to handle both scales.
2. **Fatigue thresholds are client-side:** Backend gives raw TBR; frontend classifies: <2 Alert, 2-3 Mild, 3-4 Significant, >4 Severe.
3. **Polling not streaming:** No WebSocket. Poll `/summary` + `/cognition/series` every 5 min. Poll `/live/waveform` more frequently for the Live screen if needed (backend caches for 60s).
4. **Prediction is client-computed:** Slope from `/cognition/series` points, extrapolate to TBR=4.0 for "severe in X min".
5. **Retention/grades are demo data:** The backend cannot compute learning retention. Label clearly as illustrative.
