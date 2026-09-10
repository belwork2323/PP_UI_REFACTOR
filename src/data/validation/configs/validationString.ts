export const VALIDATIONSTRING = {
  REQUIRED: "Required",
  INVALID: "Invalid value",
  FIELD_REQUIRED: "Field is required",
  OBSERVED_VALUE_RANGE: "Value must be between {min} and {max}",
  OBSERVED_VALUE_MIN: "Value must be ≥ {min}",
  OBSERVED_VALUE_MAX: "Value must be ≤ {max}",

  PATTERNS: {
    ONLY_DIGITS: /^\d+$/, // Positive integers only (e.g., 123)
    INTEGER: /^-?\d+$/, // Positive and negative integers (e.g., -123, 123)
    FLOAT: /^\d*\.?\d*$/, // Positive and negative decimals (e.g., 12.34, -0.5)
    SIGNED_FLOAT: /^-?\d*(\.\d+)?$/, // Decimals allowing optional leading integer part (e.g., .5, -.5)
    ONLY_LETTERS: /^[A-Za-z]+$/, // Alphabets only (no spaces/numbers)
    ALPHANUMERIC: /^[A-Za-z0-9]+$/, // Letters and numbers only
    /** Mixing bowl dropdown labels, e.g. "Bowl No.2" */
    BOWL_ID: /^Bowl No\.\d+$/,
    /** Casting bowl dropdown labels, e.g. "FINAL_MIX 1 / Bowl No.3" */
    CASTING_BOWL_LABEL: /^FINAL[_\s]MIX\s+\S+\s+\/\s*.+$/i,
    ALPHABET_WITH_SPECIAL: /^[A-Za-z0-9\s.,-_()#/:]+$/, // Text, numbers, spaces, and common punctuation for remarks/observations
  },

  LENGTH: {
    MIN_STANDARD: 1,
    MAX_STANDARD: 100,
    MAX_LONG_TEXT: 500, // For big strings / remarks / observations
  },
};
