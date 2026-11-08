// Converts RGB (0-255) to HSV:
// H (Hue): 0 - 360
// S (Saturation): 0 - 100
// V (Value/Brightness): 0 - 100
export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  const s = max === 0 ? 0 : (diff / max) * 100;
  const v = max * 100;

  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff + (g < b ? 6 : 0)) * 60;
    } else if (max === g) {
      h = ((b - r) / diff + 2) * 60;
    } else {
      h = ((r - g) / diff + 4) * 60;
    }
  }

  return [Math.round(h), Math.round(s), Math.round(v)];
}

// Classifies an HSV reading into standard Rubik's cube face notation[cite: 2]:
// U = White, R = Red, F = Green, D = Yellow, L = Orange, B = Blue[cite: 2]
export function classifyHsv(h: number, s: number, v: number): string {
  // White has very low color saturation[cite: 2]
  if (s < 22 && v > 40) return 'U'; // White[cite: 2]

  // Hue classification on standard 360-degree color wheel
  if (h >= 75 && h <= 160) return 'F'; // Green[cite: 2]
  if (h >= 165 && h <= 255) return 'B'; // Blue[cite: 2]
  if (h >= 40 && h <= 74) return 'D';  // Yellow[cite: 2]
  if (h >= 14 && h <= 39) return 'L';  // Orange[cite: 2]

  // Red wraps around 0/360 degrees (e.g. 340-360 or 0-13)[cite: 2]
  return 'R'; // Red[cite: 2]
}

export const FACE_NAMES: Record<string, { name: string; color: string; sampleHex: string }> = {
  U: { name: 'Up (White)', color: 'text-slate-100', sampleHex: '#ffffff' },
  R: { name: 'Right (Red)', color: 'text-red-400', sampleHex: '#dc2626' },
  F: { name: 'Front (Green)', color: 'text-emerald-400', sampleHex: '#16a34a' },
  D: { name: 'Down (Yellow)', color: 'text-yellow-400', sampleHex: '#eab308' },
  L: { name: 'Left (Orange)', color: 'text-orange-400', sampleHex: '#ea580c' },
  B: { name: 'Back (Blue)', color: 'text-blue-400', sampleHex: '#2563eb' }
};