import { isRequiredForTier, type ValidationErrors, type ValidationTier } from "./submissionIntent";
import {
  FieldValidationState,
  stateToMessage,
  validateFieldState,
  type FieldValueType,
} from "./fieldValidators";

export type FieldRuleConfig = {
  valueType: FieldValueType;
  pattern?: RegExp;
  // For text/string length validation
  minLength?: number;
  maxLength?: number;
  // For number value validation
  minVal?: number;
  maxVal?: number;

  requiredIn: ValidationTier[];
  messages: {
    required: string;
    invalid: string;
    minLength?: string;
    maxLength?: string;
    minVal?: string;
    maxVal?: string;
  };
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

    // 1. Validate field state (required, type, pattern, min/max limits)
    const state = validateFieldState(value, {
      valueType: rule.valueType,
      required,
      pattern: rule.pattern,
      minLength: rule.minLength,
      maxLength: rule.maxLength,
      minVal: rule.minVal,
      maxVal: rule.maxVal,
    });

    const message = stateToMessage(
      state,
      required,
      rule.messages.required,
      rule.messages.invalid,
      {
        minLength: rule.messages.minLength,
        maxLength: rule.messages.maxLength,
        minVal: rule.messages.minVal,
        maxVal: rule.messages.maxVal,
      },
      {
        minLength: rule.minLength,
        maxLength: rule.maxLength,
        minVal: rule.minVal,
        maxVal: rule.maxVal,
      },
    );

    if (message) errors[path] = message;
  }

  for (const custom of config.customRules ?? []) {
    custom(data, tier, errors);
  }

  return errors;
}
