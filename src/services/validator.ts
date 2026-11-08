export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

const VALID_FACES = ['U', 'R', 'F', 'D', 'L', 'B'] as const;

export function validateCubeString(state: string): ValidationResult {
  if (state.length !== 54) {
    return { isValid: false, error: `Expected 54 stickers, but detected ${state.length}` }; //
  }

  // 1. Ensure exactly 9 stickers per face
  const counts: Record<string, number> = {};
  for (const char of state) {
    counts[char] = (counts[char] || 0) + 1;
  }

  for (const face of VALID_FACES) {
    if (counts[face] !== 9) {
      return {
        isValid: false,
        error: `Invalid count for face '${face}': expected 9, got ${counts[face] || 0}` //
      };
    }
  }

  // 2. Ensure all 6 center stickers are distinct (indices 4, 13, 22, 31, 40, 49)
  const centerIndices = [4, 13, 22, 31, 40, 49]; //[cite: 3]
  const centers = centerIndices.map(i => state[i]);
  const uniqueCenters = new Set(centers);

  if (uniqueCenters.size !== 6) {
    return { isValid: false, error: "Duplicate or missing center sticker detected." }; //[cite: 3]
  }

  return { isValid: true };
}