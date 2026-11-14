/** Shared password strength rules (aligned with BE PasswordPolicy). */

export const PASSWORD_SPECIAL_CHARS = "@#$%^&+=!";

export type PasswordRuleKey =
  "minLength" | "maxLength" | "firstUpper" | "hasLower" | "hasDigit" | "hasSpecial";

export type PasswordRuleCheck = {
  key: PasswordRuleKey;
  label: string;
  ok: boolean;
};
export const PASSWORD_RULE_LABELS: Record<PasswordRuleKey, string> = {
  minLength: "At least 8 characters",
  maxLength: "Maximum 20 characters",
  firstUpper: "Starts with an uppercase letter",
  hasLower: "Contains at least one lowercase letter",
  hasDigit: "Contains at least one number",
  hasSpecial: `Contains at least one special character (${PASSWORD_SPECIAL_CHARS})`,
};

export function evaluatePasswordRules(password: string): PasswordRuleCheck[] {
  const pw = password ?? "";

  // Must contain only letters, numbers, and allowed special chars AND have at least one special char
  const isValidCharsAndSpecial = /^[A-Za-z0-9@#$%^&+=!]*$/.test(pw) && /[@#$%^&+=!]/.test(pw);

  return [
    { key: "minLength", label: PASSWORD_RULE_LABELS.minLength, ok: pw.length >= 8 },
    { key: "maxLength", label: PASSWORD_RULE_LABELS.maxLength, ok: pw.length <= 20 },
    {
      key: "firstUpper",
      label: PASSWORD_RULE_LABELS.firstUpper,
      ok: pw.length > 0 && /^[A-Z]/.test(pw),
    },
    { key: "hasLower", label: PASSWORD_RULE_LABELS.hasLower, ok: /[a-z]/.test(pw) },
    { key: "hasDigit", label: PASSWORD_RULE_LABELS.hasDigit, ok: /[0-9]/.test(pw) },
    {
      key: "hasSpecial",
      label: PASSWORD_RULE_LABELS.hasSpecial,
      ok: isValidCharsAndSpecial,
    },
  ];
}

export function isPasswordStrong(password: string): boolean {
  return evaluatePasswordRules(password).every((r) => r.ok);
}

/** User ID: letters, numbers, hyphens, underscores */
export const USER_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

/** Reason: alphanumeric + spaces + limited punctuation */
export const REASON_PATTERN = /^[a-zA-Z0-9 .,!?'\-()]+$/;

export const REASON_MIN_LENGTH = 10;
export const REASON_MAX_LENGTH = 200;
