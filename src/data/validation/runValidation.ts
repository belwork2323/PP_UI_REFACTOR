import {
  isRequiredForTier,
  type ValidationErrors,
  type ValidationTier,
} from "./submissionIntent";
import { stateToMessage, validateFieldState, type FieldValueType } from "./fieldValidators";

export type FieldRuleConfig = {
  valueType: FieldValueType;
  pattern?: RegExp;
  requiredIn: ValidationTier[];
  messages: { required: string; invalid: string };
};

export type ResolvedFieldPath = {
  path: string;
  value: unknown;
  ruleKey: string;
};

export type SubDeptValidationConfig<TData> = {
  id: string;
  resolveFieldPaths: (data: TData) => ResolvedFieldPath[];
  fields: Record<string, FieldRuleConfig>;
  customRules?: Array<(data: TData, tier: ValidationTier, errors: ValidationErrors) => void>;
  isUnitComplete?: (data: TData) => boolean;
};

export function runValidation<TData>(
  data: TData,
  tier: ValidationTier,
  config: SubDeptValidationConfig<TData>,
): ValidationErrors {
  const errors: ValidationErrors = {};
  const paths = config.resolveFieldPaths(data);

  for (const { path, value, ruleKey } of paths) {
    const rule = config.fields[ruleKey];
    if (!rule) continue;
    const required = isRequiredForTier(rule.requiredIn, tier);
    const state = validateFieldState(value, {
      valueType: rule.valueType,
      required,
      pattern: rule.pattern,
    });
    const message = stateToMessage(state, required, rule.messages.required, rule.messages.invalid);
    if (message) errors[path] = message;
  }

  for (const custom of config.customRules ?? []) {
    custom(data, tier, errors);
  }

  return errors;
}
