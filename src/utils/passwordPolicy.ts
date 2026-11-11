/** Shared password strength rules (aligned with BE PasswordPolicy). */

export const PASSWORD_SPECIAL_CHARS = "@#$%^&+=!";

export type PasswordRuleKey =
  | "minLength"
  | "firstUpper"
  | "hasLower"
  | "hasDigit"
  | "hasSpecial";

export type PasswordRuleCheck = {
  key: PasswordRuleKey;
  label: string;
  ok: boolean;
};

export const PASSWORD_RULE_LABELS: Record<PasswordRuleKey, string> = {
  minLength: "At least 8 characters",
  firstUpper: "Starts with an uppercase letter",
  hasLower: "Contains at least one lowercase letter",
  hasDigit: "Contains at least one number",
  hasSpecial: `Contains at least one special character (${PASSWORD_SPECIAL_CHARS})`,
};

export function evaluatePasswordRules(password: string): PasswordRuleCheck[] {
  const pw = password ?? "";
  return [
    { key: "minLength", label: PASSWORD_RULE_LABELS.minLength, ok: pw.length >= 8 },
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
      ok: /[@#$%^&+=!]/.test(pw),
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
