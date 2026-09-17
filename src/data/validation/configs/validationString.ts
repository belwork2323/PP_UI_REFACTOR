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
    /** Building master codes from /system/buildings, e.g. "BLD-1" */
    BUILDING_CODE: /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/,
    /** Lot / batch / equipment codes, e.g. "LOT-17", "LOT-2026-17-09-001", "OVEN-1" */
    MASTER_CODE: /^[A-Za-z0-9]+(?:[-_/][A-Za-z0-9]+)*$/,
    /** Mixing bowl dropdown labels, e.g. "Bowl No.2" */
    BOWL_ID: /^Bowl No\.\d+$/,
    /** Casting bowl dropdown labels, e.g. "FINAL_MIX 1 / Bowl No.3" */
    CASTING_BOWL_LABEL: /^FINAL[_\s]MIX\s+\S+\s+\/\s*.+$/i,
    ALPHABET_WITH_SPECIAL: /^[A-Za-z0-9\s.,\-_()#/:%&+@°±≤≥µμ²³⁻]+$/, // remarks/observations + science symbols
    SPECIFICATION_WITH_TOLERANCE: /^[A-Za-z0-9\s.,_()#/:+±%\-@°≤≥µμ²³⁻]+$/, // e.g. 28 - 34%, ≤0.5%, @25°C
  },

  LENGTH: {
    MIN_STANDARD: 1,
    MAX_STANDARD: 100,
    MAX_LONG_TEXT: 500, // For big strings / remarks / observations
  },
};
