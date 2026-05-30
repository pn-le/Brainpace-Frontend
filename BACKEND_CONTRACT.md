# Backend Contract — Brainspace API

**Base URL:** `http://localhost:8000` (configurable in `src/api/config.ts`)
**Source:** FastAPI, OpenAPI 3.1.0
**Data source:** AWear B2B EEG (single-channel TP10, 256 Hz)
**Polling:** No WebSocket. REST only. AWear ingestion lag ~5 min.

---

## Endpoints

### `GET /health`
```ts
Response: { status: string; app: string }
// Example: { "status": "ok", "app": "brainpace" }
```

### `GET /members`
List participants with bound AWear devices.
```ts
Response: { participants: string[] }
// Example: { "participants": ["P-ZK55GT"] }
```

### `GET /summary/{participant_id}?date=&tz=UTC`
**Home screen — all current metrics in one call.**
```ts
Response: {
  participant_id: string;
  records: number;                     // EEG records analyzed
  band_powers: BandPowers;
  mood: { valence: number; arousal: number; label: string };
  tiredness: { score: number; index: number; label: string };
  cognition: { tbr: number; cognitive_state: number };
}
```
- `cognition.tbr` = theta/beta (core fatigue metric)
- `cognition.cognitive_state` = alpha/theta
- `tiredness.score` = 0..1, higher = more tired
- `tiredness.index` = raw (theta+alpha)/beta

### `GET /live/{participant_id}/waveform?minutes=2&tz=UTC`
**Live Feed — latest EEG record with raw + filtered waveforms.**
```ts
Response: {
  participant_id: string;
  timestamp: string | null;            // ISO 8601 (null if no data)
  sample_rate_hz: number;              // 256
  raw: number[];                       // 256 raw waveform samples
  bands: Record<string, number[]>;     // { delta: [...], theta: [...], ... }
  band_powers: BandPowers;
  ratios: { tbr: number; cognitive_state: number };
}
```

### `GET /cognition/{participant_id}/series?minutes=30&bucket=20s&tz=UTC`
**TBR time series for charts.**
```ts
Response: {
  participant_id: string;
  records: number;                     // raw per-second records
  bucket_seconds: number;              // bucket width (1=raw, 20=averaged)
  delay_seconds: number;               // ingestion lag offset
  ratios: string[];                    // ["tbr", "cognitive_state"]
  points: Array<{
    timestamp: string;                 // ISO 8601 bucket start
    samples: number;                   // records in this bucket
    ratios: { tbr: number; cognitive_state: number };
    band_powers: BandPowers;
  }>;
}
```

### `GET /tiredness/{participant_id}?date=&tz=UTC`
**Fatigue score.**
```ts
Response: {
  participant_id: string;
  records: number;
  band_powers: BandPowers;
  score: number;                       // 0..1
  index: number;                       // raw (theta+alpha)/beta
  label: string;                       // "alert" | "tired" | ...
}
```

### `GET /mood/{participant_id}?date=&tz=UTC`
**Mood estimation.**
```ts
Response: {
  participant_id: string;
  records: number;
  band_powers: BandPowers;
  valence: number;                     // 0..1, pleasant
  arousal: number;                     // 0..1, aroused
  label: string;                       // "calm" | ...
}
```

### Shared type
```ts
type BandPowers = {
  delta: number; theta: number; alpha: number; beta: number; gamma: number;
}
```

---

## Gaps — design needs vs. backend

| Feature | Backend? | Frontend approach |
|---------|----------|-------------------|
| TBR (theta/beta) | YES | `cognition.tbr` from /summary |
| Band powers (5 bands) | YES | `band_powers` from all endpoints |
| Raw EEG waveform | YES | `/live/{pid}/waveform` → `raw[]` |
| Filtered band waveforms | YES | `/live/{pid}/waveform` → `bands{}` |
| TBR time series | YES | `/cognition/{pid}/series` |
| Tiredness score | YES | `/tiredness/{pid}` |
| Mood valence/arousal | YES | `/mood/{pid}` |
| Fatigue classification | **NO** | Client-side from TBR thresholds |
| Baseline TBR | **NO** | Compute from first pull |
| "Severe in X min" | **NO** | Extrapolate from TBR slope |
| Retention % / grades | **NO** | **MOCK — label as illustrative** |
| Session management | **NO** | Local state |
| Adaptive music | **NO** | UI only |
| CORS | **REQUIRED** | Must add CORSMiddleware to backend |
