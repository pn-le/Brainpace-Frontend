// Types matching backend OpenAPI schema exactly

export interface BandPowers {
  delta: number;
  theta: number;
  alpha: number;
  beta: number;
  gamma: number;
}

export interface HealthResponse {
  status: string;
  app: string;
}

export interface MoodSummary {
  valence: number;
  arousal: number;
  label: string;
}

export interface TirednessSummary {
  score: number;
  index: number;
  label: string;
}

export interface SummaryResponse {
  participant_id: string;
  records: number;
  band_powers: BandPowers;
  mood: MoodSummary;
  tiredness: TirednessSummary;
  cognition: Record<string, number>;
}

export interface WaveformResponse {
  participant_id: string;
  timestamp: string | null;
  sample_rate_hz: number;
  raw: number[];
  bands: Record<string, number[]>;
  band_powers: BandPowers;
  ratios: Record<string, number>;
}

export interface CognitionPoint {
  timestamp: string;
  samples: number;
  ratios: Record<string, number>;
  band_powers: BandPowers;
}

export interface CognitionResponse {
  participant_id: string;
  records: number;
  bucket_seconds: number;
  delay_seconds: number;
  ratios: string[];
  points: CognitionPoint[];
}

export interface TirednessResponse {
  participant_id: string;
  records: number;
  band_powers: BandPowers;
  score: number;
  index: number;
  label: string;
}

export interface MoodResponse {
  participant_id: string;
  records: number;
  band_powers: BandPowers;
  valence: number;
  arousal: number;
  label: string;
}
