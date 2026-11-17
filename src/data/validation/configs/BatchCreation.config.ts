import type { FieldRuleConfig, SubDeptValidationConfig } from "../runValidation";
import type { ValidationTier } from "../submissionIntent";
import { assertFromToOrderInTree } from "../dateRangeValidation";
import { stateToMessage, validateFieldState } from "../fieldValidators";
import { VALIDATIONSTRING } from "./validationString";

const S = VALIDATIONSTRING;

const textRule = (
  requiredIn: ValidationTier[],
  maxLength: number = S.LENGTH.MAX_STANDARD,
  requiredMessage: string = S.FIELD_REQUIRED,
): FieldRuleConfig => ({
  valueType: "text",
  requiredIn,
  messages: { required: requiredMessage, invalid: S.INVALID },
  pattern: S.PATTERNS.ALPHABET_WITH_SPECIAL,
  maxLength,
});

const numberRule = (requiredIn: ValidationTier[] = []): FieldRuleConfig => ({
  valueType: "number",
  requiredIn,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  pattern: S.PATTERNS.FLOAT,
});

const decimalRule = (requiredIn: ValidationTier[] = []): FieldRuleConfig => ({
  valueType: "number",
  requiredIn,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  pattern: S.PATTERNS.SIGNED_FLOAT_WITH_2_DECIMAL,
});

const dateRule = (requiredIn: ValidationTier[] = []): FieldRuleConfig => ({
  valueType: "date",
  requiredIn,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

export const batchCreationFieldRules: Record<string, FieldRuleConfig> = {
  // ── Common Parent Batch Fields ──
  BATCH_TYPE: textRule(["UNIT", "SUBMIT"], 50),
  SUB_BATCH_TYPE: textRule([], 50), // Handled conditionally
  PROJECT_ID: textRule([], 50), // Handled conditionally
  MOTOR_STAGE: textRule([], 50), // Handled conditionally
  SYSTEM_MANAGER_ID: textRule([], 50), // Handled conditionally for MAIN
  OBJECTIVE: textRule([], S.LENGTH.MAX_LONG_TEXT), // Handled conditionally for EXPERIMENTAL
  ARTICLES: textRule([], S.LENGTH.MAX_STANDARD), // Handled conditionally for EXPERIMENTAL
  MOTOR_IDS: textRule([], S.LENGTH.MAX_STANDARD), // Handled conditionally for MAIN/QUALIFICATION

  // ── Identification Sheet Fields (Strictly mandatory when submitted) ──
  DATE: dateRule(["SUBMIT"]),
  BATCH_SIZE: {
    ...numberRule(["SUBMIT"]),
    minVal: 0.1,
  },
  BONDING_SHEET_NO: textRule(["SUBMIT"], 50),
  MIXER_TYPE: textRule(["SUBMIT"], 50),
  NUMBER_OF_PREMIX: {
    ...numberRule(["SUBMIT"]),
    pattern: S.PATTERNS.ONLY_DIGITS,
    minVal: 1,
  },
  REMARKS: textRule(["SUBMIT"], S.LENGTH.MAX_LONG_TEXT),
  PRC_APPROVAL_DATE: dateRule([]), // Optional

  // ── Materials Table Fields (Strictly mandatory when submitted) ──
  SR_NO: numberRule(["SUBMIT"]),
  MATERIAL_CODE: textRule(["SUBMIT"], 50),
  MATERIAL_NAME: textRule(["SUBMIT"], 100),
  GRADE_CODE: textRule([], 50),
  GRADE_NAME: textRule([], 100),
  LOT_IDS: {
    valueType: "text",
    requiredIn: ["SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  MANUFACTURER_NAME: textRule([], 100),
  MAKE: textRule([], 100),
  REQUIRED_COMPOSITION: {
    ...decimalRule(["SUBMIT"]),
    minVal: 0.1,
    maxVal: 100,
  },
  QUANTITY_PER_PREMIX: numberRule(["SUBMIT"]),
  REVALIDATION_FROM_DATE: dateRule([]), // Optional
  REVALIDATION_TO_DATE: dateRule([]), // Optional
};

function resolveFieldPaths(data: any) {
  const paths: Array<{ path: string; value: unknown; ruleKey: string }> = [];

  const topFields = [
    { key: "batchType", ruleKey: "BATCH_TYPE" },
    { key: "subBatchType", ruleKey: "SUB_BATCH_TYPE" },
    { key: "projectId", ruleKey: "PROJECT_ID" },
    { key: "motorStage", ruleKey: "MOTOR_STAGE" },
    { key: "systemManagerId", ruleKey: "SYSTEM_MANAGER_ID" },
    { key: "objective", ruleKey: "OBJECTIVE" },
  ];

  topFields.forEach(({ key, ruleKey }) => {
    if (data && key in data) {
      paths.push({ path: key, value: data[key], ruleKey });
    }
  });

  if (Array.isArray(data?.motorIds)) {
    data.motorIds.forEach((id: string, i: number) => {
      paths.push({
        path: `motorIds.${i}`,
        value: id,
        ruleKey: "MOTOR_IDS",
      });
    });
  }

  const ident = data?.identificationSheet ?? {};
  const identFields = [
    "DATE",
    "BATCH_SIZE",
    "BONDING_SHEET_NO",
    "MIXER_TYPE",
    "NUMBER_OF_PREMIX",
    "REMARKS",
    "PRC_APPROVAL_DATE",
  ];

  identFields.forEach((field) => {
    const camelKey = field.toLowerCase().replace(/_([a-z])/g, (_, g) => g.toUpperCase());
    paths.push({
      path: `identificationSheet.${camelKey}`,
      value: ident[camelKey],
      ruleKey: field,
    });
  });

  if (Array.isArray(ident.materials)) {
    const materialFields = [
      "SR_NO",
      "MATERIAL_CODE",
      "MATERIAL_NAME",
      "GRADE_CODE",
      "GRADE_NAME",
      "LOT_IDS",
      "MANUFACTURER_NAME",
      "MAKE",
      "REQUIRED_COMPOSITION",
      "QUANTITY_PER_PREMIX",
      "REVALIDATION_FROM_DATE",
      "REVALIDATION_TO_DATE",
    ];

    ident.materials.forEach((row: any, i: number) => {
      if (!row) return;
      materialFields.forEach((fld) => {
        const camelKey = fld.toLowerCase().replace(/_([a-z])/g, (_, g) => g.toUpperCase());
        const rawVal = row[camelKey];
        const normalizedVal = Array.isArray(rawVal) ? (rawVal.length > 0 ? "ok" : "") : rawVal;

        paths.push({
          path: `identificationSheet.materials.${i}.${camelKey}`,
          value: normalizedVal,
          ruleKey: fld,
        });
      });
    });
  }

  return paths;
}

export const batchImplementationValidationConfig: SubDeptValidationConfig<any> = {
  id: "batchImplementation",
  fields: batchCreationFieldRules,
  resolveFieldPaths,
  customRules: [
    (data, tier, errors) => {
      assertFromToOrderInTree(data, errors);

      const batchType = data?.batchType;
      const subBatchType = data?.subBatchType;

      // 1. MAIN BATCH RULES: project, systemManagerId, motorStage, motorIds are required
      if (batchType === "MAIN") {
        if (!String(data?.projectId ?? "").trim()) errors.projectId = S.FIELD_REQUIRED;
        if (!String(data?.systemManagerId ?? "").trim()) errors.systemManagerId = S.FIELD_REQUIRED;
        if (!String(data?.motorStage ?? "").trim()) errors.motorStage = S.FIELD_REQUIRED;

        const motorIds = data?.motorIds ?? [];
        if (
          !Array.isArray(motorIds) ||
          motorIds.length === 0 ||
          motorIds.some((id: string) => !String(id ?? "").trim())
        ) {
          errors.motorIds = "At least one valid motor ID is required";
        }
      }

      // 2. SUBSCALE BATCH RULES
      if (batchType === "SUBSCALE") {
        if (!String(subBatchType ?? "").trim()) {
          errors.subBatchType = S.FIELD_REQUIRED;
        } else {
          // If Qualification: project, motorStage, motorIds are required
          if (subBatchType === "QUALIFICATION") {
            if (!String(data?.projectId ?? "").trim()) errors.projectId = S.FIELD_REQUIRED;
            if (!String(data?.motorStage ?? "").trim()) errors.motorStage = S.FIELD_REQUIRED;

            const motorIds = data?.motorIds ?? [];
            if (
              !Array.isArray(motorIds) ||
              motorIds.length === 0 ||
              motorIds.some((id: string) => !String(id ?? "").trim())
            ) {
              errors.motorIds = "At least one valid motor ID is required";
            }
          }
          // If Experimental: project, objective, articles are required
          else if (subBatchType === "EXPERIMENTAL") {
            if (!String(data?.projectId ?? "").trim()) errors.projectId = S.FIELD_REQUIRED;
            if (!String(data?.objective ?? "").trim()) errors.objective = S.FIELD_REQUIRED;

            const articles = data?.articles ?? [];
            if (!Array.isArray(articles) || articles.length === 0) {
              errors.articles = S.FIELD_REQUIRED;
            }
          }
        }
      }

      // 3. IDENTIFICATION SHEET VALIDATION ON SUBMIT TIER
      if (tier === "SUBMIT") {
        const materials = data?.identificationSheet?.materials ?? [];
        if (!Array.isArray(materials) || materials.length === 0) {
          errors.identificationSheet = {
            ...(errors.identificationSheet ?? {}),
            materials: "At least one material must be added",
          };
        }
      }
    },
  ],
};

export default batchImplementationValidationConfig;
