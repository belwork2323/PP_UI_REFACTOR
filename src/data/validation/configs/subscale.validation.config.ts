import { mapSubscaleBatchType } from "@/data/models/user/subscaleBatchType";
import type { FieldRuleConfig, SubDeptValidationConfig } from "../runValidation";
import type { ValidationTier } from "../submissionIntent";
import { assertFromToOrderInTree } from "../dateRangeValidation";
import { stateToMessage, validateFieldState } from "../fieldValidators";
import { VALIDATIONSTRING } from "./validationString";

const S = VALIDATIONSTRING;

const textRule = (
  requiredIn: ValidationTier[],
  maxLength: number = S.LENGTH.MAX_STANDARD,
  requiredMessage: string = S.REQUIRED,
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

const dateRule = (requiredIn: ValidationTier[] = []): FieldRuleConfig => ({
  valueType: "date",
  requiredIn,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

const dateTimeRule = (requiredIn: ValidationTier[] = []): FieldRuleConfig => ({
  valueType: "datetime",
  requiredIn,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

export const subscaleHardwareFieldRules: Record<string, FieldRuleConfig> = {
  // Hardware Preparation Fields
  HARDWARE_ARTICLE_SELECTIONS: {
    valueType: "text",
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  LINER_TYPE: textRule(["UNIT", "SUBMIT"]),
  LINER_BATCH_NO: textRule(["UNIT", "SUBMIT"], 50, S.FIELD_REQUIRED),
  LINER_BATCH_DATE: dateRule(["UNIT", "SUBMIT"]),

  // General Batch Info / Process Fields
  MIXER_BLDG_NO: textRule(["UNIT", "SUBMIT"], S.LENGTH.MAX_STANDARD, S.FIELD_REQUIRED),
  PREMIX_DATE: dateTimeRule(["UNIT", "SUBMIT"]),
  FINAL_MIX_DATE: dateTimeRule(["UNIT", "SUBMIT"]),
  DATE_OF_CASTING: dateTimeRule(["SUBMIT"]),
  IR_BATCH_NO: textRule(["SUBMIT"], 50, S.FIELD_REQUIRED),
  DATE_OF_MFG: dateTimeRule(["SUBMIT"]),

  // System-generated labels (MDM article names) — presence only, no pattern.
  ARTICLE_TYPE: {
    valueType: "text",
    requiredIn: [],
    messages: { required: S.REQUIRED, invalid: S.INVALID },
    maxLength: S.LENGTH.MAX_STANDARD,
  },
  RUBBER_MATERIAL: textRule(["UNIT", "SUBMIT"]),
  SLEEVE_NO: textRule(["UNIT", "SUBMIT"], 50),
  MOULD_NO: textRule(["UNIT", "SUBMIT"], 50),
  BEM_MOULD_NO: textRule(["UNIT", "SUBMIT"], 50),
  BEM_NO: textRule(["UNIT", "SUBMIT"], 50),
  SIZE_MM: textRule([], S.LENGTH.MAX_STANDARD),
  THICKNESS_MM: textRule([], S.LENGTH.MAX_STANDARD),
  LINER_APPLIED: textRule([], S.LENGTH.MAX_STANDARD),
  OBSERVATIONS: textRule([], S.LENGTH.MAX_LONG_TEXT),
  CASTING_PIT_NO: textRule([], S.LENGTH.MAX_STANDARD),
  CASTING_START_TIME: dateTimeRule(),
  CASTING_END_TIME: dateTimeRule(),
  REMARKS: textRule([], S.LENGTH.MAX_LONG_TEXT),
  OVEN_NO: textRule([], S.LENGTH.MAX_STANDARD),
  TEMPERATURE: numberRule(),
  HARDNESS: numberRule(),
  DECORING_DATE: dateTimeRule(),
  DECORING_LOAD: numberRule(),
  CURING_START_DATE: dateTimeRule(),
  CURING_END_DATE: dateTimeRule(),
  GRAIN_SURFACE_OBSERVATIONS: textRule([], S.LENGTH.MAX_LONG_TEXT),
  ACTOR: textRule([], S.LENGTH.MAX_STANDARD),
  DATE_OF_NDT: dateTimeRule(["UNIT", "SUBMIT"]),
  DATE_OF_APPLICATION: dateTimeRule(["UNIT", "SUBMIT"]),
  VACUUM_LEVEL: numberRule(["SUBMIT"]),
  BATCH_SIZE: numberRule(["UNIT", "SUBMIT"]),

  // Inhibition weights (alphanumeric / special text)
  LINER_COATED_SLEEVE_WEIGHT: textRule([], S.LENGTH.MAX_STANDARD),
  WEIGHT_BEFORE_INHIBITION: textRule([], S.LENGTH.MAX_STANDARD),
  WEIGHT_AFTER_INHIBITION: textRule([], S.LENGTH.MAX_STANDARD),
  IR_APPLIED_WEIGHT: textRule([], S.LENGTH.MAX_STANDARD),

  // Trimming measurements (alphanumeric / special text)
  HE_OD: textRule([], S.LENGTH.MAX_STANDARD),
  HE_PORT_INNER: textRule([], S.LENGTH.MAX_STANDARD),
  HE_PORT_OUTER: textRule([], S.LENGTH.MAX_STANDARD),
  HE_BEFORE_INHIBITION_INNER: textRule([], S.LENGTH.MAX_STANDARD),
  HE_BEFORE_INHIBITION_OUTER: textRule([], S.LENGTH.MAX_STANDARD),
  NE_OD: textRule([], S.LENGTH.MAX_STANDARD),
  NE_PORT_INNER: textRule([], S.LENGTH.MAX_STANDARD),
  NE_PORT_OUTER: textRule([], S.LENGTH.MAX_STANDARD),
  NE_WEB_INNER: textRule([], S.LENGTH.MAX_STANDARD),
  NE_WEB_OUTER: textRule([], S.LENGTH.MAX_STANDARD),
  LENGTH_BEFORE_INHIBITION: textRule([], S.LENGTH.MAX_STANDARD),

  // Static testing
  PROPELLANT_MASS: numberRule(),
  DT: numberRule(),
  WEB_THICKNESS: numberRule(),
  N_VALUE: numberRule(),
  PRESSURE_AVG: numberRule(),
  THRUST_AVG: numberRule(),
  BURN_RATE: numberRule(),

  // Mechanical properties
  TS: numberRule(),
  ELONGATION: numberRule(),
  MODULUS: numberRule(),
  SBS: numberRule(),
  TBS: numberRule(),
  PEEL_STRENGTH: numberRule(),
  DENSITY: numberRule(),

  // Mixing Cycle Particulars Fields
  rpm: numberRule(["SUBMIT"]),
  time: numberRule(["SUBMIT"]),
  temp: numberRule(["SUBMIT"]),
  vacuum: numberRule(["SUBMIT"]),
  stage: textRule(["SUBMIT"]),
  mixingCycleCode: textRule(["SUBMIT"], 50),
};

/** Live FORMAT message for a single field value (empty values are valid). */
export function getSubscaleFieldFormatError(fieldId: string, value: unknown): string | undefined {
  const rule = subscaleHardwareFieldRules[fieldId];
  if (!rule) return undefined;

  const state = validateFieldState(value, {
    valueType: rule.valueType,
    required: false,
    pattern: rule.pattern,
    minLength: rule.minLength,
    maxLength: rule.maxLength,
    minVal: rule.minVal,
    maxVal: rule.maxVal,
  });

  return stateToMessage(
    state,
    false,
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
}

function resolveFieldPaths(data: any) {
  const paths: Array<{ path: string; value: unknown; ruleKey: string }> = [];
  const isMain = mapSubscaleBatchType(data?.batchType) === "MAIN_SCALE";
  const subType = String(data?.subBatchType ?? "").toUpperCase();
  const isExperimental = subType === "EXPERIMENTAL";

  // 1. Hardware Preparation — article selections + liner fields
  const selections = Array.isArray(data.HARDWARE_ARTICLE_SELECTIONS)
    ? data.HARDWARE_ARTICLE_SELECTIONS
    : [];
  const hasValidSelection = selections.some(
    (row: { noOfArticles?: unknown; subscaleArticleName?: unknown }) =>
      Number(row?.noOfArticles ?? 0) > 0 && String(row?.subscaleArticleName ?? "").trim(),
  );
  paths.push({
    path: "HARDWARE_ARTICLE_SELECTIONS",
    value: hasValidSelection ? "ok" : "",
    ruleKey: "HARDWARE_ARTICLE_SELECTIONS",
  });

  ["LINER_TYPE", "LINER_BATCH_NO", "LINER_BATCH_DATE"].forEach((field) => {
    paths.push({ path: field, value: data[field], ruleKey: field });
  });

  if (!isMain) {
    // 2. Subscale Conditional Fields
    paths.push({ path: "BATCH_SIZE", value: data.BATCH_SIZE, ruleKey: "BATCH_SIZE" });
    paths.push({ path: "MIXER_BLDG_NO", value: data.MIXER_BLDG_NO, ruleKey: "MIXER_BLDG_NO" });
    paths.push({ path: "PREMIX_DATE", value: data.PREMIX_DATE, ruleKey: "PREMIX_DATE" });
    paths.push({ path: "FINAL_MIX_DATE", value: data.FINAL_MIX_DATE, ruleKey: "FINAL_MIX_DATE" });

    paths.push({
      path: "DATE_OF_CASTING",
      value: data.DATE_OF_CASTING,
      ruleKey: "DATE_OF_CASTING",
    });
    paths.push({ path: "IR_BATCH_NO", value: data.IR_BATCH_NO, ruleKey: "IR_BATCH_NO" });
    paths.push({ path: "DATE_OF_MFG", value: data.DATE_OF_MFG, ruleKey: "DATE_OF_MFG" });

    // 3. Mixing Cycles & Particulars
    if (Array.isArray(data.SUBSCALE_MIXING_CYCLES)) {
      data.SUBSCALE_MIXING_CYCLES.forEach((cycle: any, cIndex: number) => {
        if (isExperimental) {
          paths.push({
            path: `SUBSCALE_MIXING_CYCLES.${cIndex}.stage`,
            value: cycle.stage,
            ruleKey: "stage",
          });
          paths.push({
            path: `SUBSCALE_MIXING_CYCLES.${cIndex}.mixingCycleCode`,
            value: cycle.mixingCycleCode,
            ruleKey: "mixingCycleCode",
          });
        }

        if (Array.isArray(cycle.premixParticulars)) {
          cycle.premixParticulars.forEach((row: any, rIndex: number) => {
            ["rpm", "time", "temp", "vacuum"].forEach((fld) => {
              paths.push({
                path: `SUBSCALE_MIXING_CYCLES.${cIndex}.premixParticulars.${rIndex}.${fld}`,
                value: row[fld],
                ruleKey: fld,
              });
            });
          });
        }

        if (Array.isArray(cycle.finalMixParticulars)) {
          cycle.finalMixParticulars.forEach((row: any, rIndex: number) => {
            ["rpm", "time", "temp", "vacuum"].forEach((fld) => {
              paths.push({
                path: `SUBSCALE_MIXING_CYCLES.${cIndex}.finalMixParticulars.${rIndex}.${fld}`,
                value: row[fld],
                ruleKey: fld,
              });
            });
          });
        }
      });
    }
  }

  // 4. Table Traversals — skip SR_NO / ARTICLE_TYPE (system-generated, display-only).
  const tableMappings: Record<string, string[]> = {
    ARTICLE_TYPE_TABLE: [
      "RUBBER_MATERIAL",
      "SLEEVE_NO",
      "MOULD_NO",
      "SIZE_MM",
      "THICKNESS_MM",
      "LINER_APPLIED",
      "OBSERVATIONS",
    ],
    CASTING_TABLE: [
      "BEM_NO",
      "BEM_MOULD_NO",
      "CASTING_PIT_NO",
      "CASTING_START_TIME",
      "CASTING_END_TIME",
      "VACUUM_LEVEL",
      "REMARKS",
    ],
    CURING_TABLE: [
      "BEM_NO",
      "CURING_START_DATE",
      "CURING_END_DATE",
      "OVEN_NO",
      "TEMPERATURE",
      "HARDNESS",
      "DECORING_DATE",
      "DECORING_LOAD",
      "GRAIN_SURFACE_OBSERVATIONS",
    ],
    NDT_TABLE: ["BEM_NO", "DATE_OF_NDT", "OBSERVATIONS"],
    TRIMMING_TABLE: [
      "BEM_NO",
      "HE_OD",
      "HE_PORT_INNER",
      "HE_PORT_OUTER",
      "HE_BEFORE_INHIBITION_INNER",
      "HE_BEFORE_INHIBITION_OUTER",
      "NE_OD",
      "NE_PORT_INNER",
      "NE_PORT_OUTER",
      "NE_WEB_INNER",
      "NE_WEB_OUTER",
      "LENGTH_BEFORE_INHIBITION",
    ],
    INHIBITION_TABLE: [
      "BEM_NO",
      "LINER_COATED_SLEEVE_WEIGHT",
      "WEIGHT_BEFORE_INHIBITION",
      "WEIGHT_AFTER_INHIBITION",
      "IR_APPLIED_WEIGHT",
      "DATE_OF_APPLICATION",
      "REMARKS",
    ],
    STATIC_TESTING_TABLE: [
      "BEM_NO",
      "PROPELLANT_MASS",
      "DT",
      "WEB_THICKNESS",
      "N_VALUE",
      "PRESSURE_AVG",
      "THRUST_AVG",
      "BURN_RATE",
    ],
    MECHANICAL_PROPERTIES_TABLE: [
      "BEM_NO",
      "TS",
      "ELONGATION",
      "MODULUS",
      "SBS",
      "TBS",
      "PEEL_STRENGTH",
      "DENSITY",
      "ACTOR",
    ],
  };

  Object.entries(tableMappings).forEach(([tableName, fields]) => {
    if (Array.isArray(data[tableName])) {
      data[tableName].forEach((row: any, i: number) => {
        if (!row) return;
        fields.forEach((fld) => {
          paths.push({
            path: `${tableName}.${i}.${fld}`,
            value: row[fld],
            ruleKey: fld,
          });
        });
      });
    }
  });

  return paths;
}

export const subscaleHardwareValidationConfig: SubDeptValidationConfig<any> = {
  id: "subscaleHardware",
  fields: subscaleHardwareFieldRules,
  resolveFieldPaths,
  customRules: [
    (data, _tier, errors) => {
      assertFromToOrderInTree(data, errors);
    },
  ],
};

export default subscaleHardwareValidationConfig;
