/**
 * Nutrition Constants
 *
 * Scientific constants and thresholds for nutrition evaluation.
 * These are based on general health guidelines (e.g., Voedingscentrum)
 * and should not be confused with personal user goals (which are in settings).
 */

export const NUTRITION_CONSTANTS = {
  /**
   * Protein requirements
   */
  /** Minimum protein per kg bodyweight (Voedingscentrum recommendation) */
  PROTEIN_PER_KG_MIN: 0.83,

  /** Acceptable range for protein intake relative to calculated target */
  PROTEIN_MIN_THRESHOLD: 0.80,  // 80% of target is acceptable
  PROTEIN_MAX_THRESHOLD: 1.20,  // 120% of target is acceptable upper bound

  /**
   * Fiber intake thresholds
   */
  /** Realistic daily fiber goal (sufficient intake) */
  FIBER_SUFFICIENT: 28,

  /** Minimum acceptable fiber intake */
  FIBER_MINIMUM: 20,

  /**
   * Calorie evaluation thresholds
   * Note: Actual calorie goals are in user settings (calories)
   */
  /** Upper threshold for "yellow" calorie warning */
  CALORIE_YELLOW_THRESHOLD: 2100,
} as const;

/**
 * Type-safe access to nutrition constants
 */
export type NutritionConstantsKey = keyof typeof NUTRITION_CONSTANTS;
