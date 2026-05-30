// Design tokens from Pencil design file (brainpace-frontend.pen)

export const colors = {
  // Backgrounds
  ink:        '#0B0C10',
  inkCard:    '#16171F',
  inkBorder:  '#FFFFFF12',
  bgBase:     '#0A1024',
  bgDeep:     '#06111F',
  bgElevated: '#101A33',
  cardBg:     '#101A2E',
  cardBorder: '#FFFFFF1A',

  // Text
  textPrimary:   '#F8FAFC',
  textSecondary: '#A7B3C7',
  textMuted:     '#69779A',

  // Accent
  violet:  '#7C5CFF',
  purple:  '#8B5CF6',
  teal:    '#2EE6C8',
  aqua:    '#5BE7FF',
  blue:    '#3B82F6',

  // Status
  okGreen:      '#3FD17A',
  coral:        '#FF5B6E',
  signifOrange: '#FB7A45',
  amber:        '#F5B84B',

  // Bands
  bandTheta: '#FF6A3D',
  bandBeta:  '#2DD4BF',
  bandAlpha: '#9B6BFF',
  bandGamma: '#F5A524',
  bandDelta: '#69779A',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export const font = {
  family: 'Inter',
} as const;

// Fatigue classification — thresholds applied client-side from TBR
export const FATIGUE_LEVELS = [
  { state: 'alert',               label: 'Alert',               min: 0,   max: 2.0, color: colors.okGreen,      bgColor: '#3FD17A1A' },
  { state: 'mild_fatigue',        label: 'Mild Fatigue',        min: 2.0, max: 3.0, color: colors.amber,        bgColor: '#F5B84B1A' },
  { state: 'significant_fatigue', label: 'Significant Fatigue', min: 3.0, max: 4.0, color: colors.coral,        bgColor: '#FF5B6E1A' },
  { state: 'severe_fatigue',      label: 'Severe / Drowsiness', min: 4.0, max: 99,  color: colors.coral,        bgColor: '#FF5B6E2A' },
] as const;

export function getTBRLevel(tbr: number) {
  return FATIGUE_LEVELS.find(l => tbr >= l.min && tbr < l.max) ?? FATIGUE_LEVELS[3];
}

export function tbrToColor(tbr: number): string {
  return getTBRLevel(tbr).color;
}

// Band frequency ranges — matches backend bandpass_fft config
export const BANDS = {
  delta: { label: 'Delta', range: '1–4 Hz',  color: colors.bandDelta },
  theta: { label: 'Theta', range: '4–8 Hz',  color: colors.bandTheta },
  alpha: { label: 'Alpha', range: '8–13 Hz', color: colors.bandAlpha },
  beta:  { label: 'Beta',  range: '13–30 Hz',color: colors.bandBeta },
  gamma: { label: 'Gamma', range: '30–50 Hz',color: colors.bandGamma },
} as const;
