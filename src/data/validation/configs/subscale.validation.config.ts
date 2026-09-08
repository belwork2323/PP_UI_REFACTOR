import type { SubDeptValidationConfig } from "../runValidation";
import type { ValidationTier } from "../submissionIntent";
import { VALIDATIONSTRING } from "./validationString";

const S = VALIDATIONSTRING;

export const subscaleHardwareFieldRules = {
  // Hardware Preparation Fields
  NO_OF_40KG_BEMS: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  NO_OF_10KG_BEMS: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  NO_OF_2KG_BEMS: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  NO_OF_WHEEL_PEEL: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  NO_OF_SBS_TBS: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  NO_OF_CARTOONS: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  LINER_TYPE: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.REQUIRED, invalid: S.INVALID },
  },
  LINER_BATCH_NO: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  LINER_BATCH_DATE: {
    valueType: "date" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },

  // General Batch Info / Process Fields
  PREMIX_DATE: {
    valueType: "date" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  FINAL_MIX_DATE: {
    valueType: "date" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  DATE_OF_CASTING: {
    valueType: "date" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  IR_BATCH_NO: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  DATE_OF_MFG: {
    valueType: "date" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },

  // Table Row Fields (Generic / Reused across tables)
  ARTICLE_TYPE: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.REQUIRED, invalid: S.INVALID },
  },
  RUBBER_MATERIAL: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.REQUIRED, invalid: S.INVALID },
  },
  SLEEVE_NO: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.REQUIRED, invalid: S.INVALID },
  },
  MOULD_NO: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.REQUIRED, invalid: S.INVALID },
  },
  BEM_MOULD_NO: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.REQUIRED, invalid: S.INVALID },
  },
  BEM_NO: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.REQUIRED, invalid: S.INVALID },
  },
  DATE_OF_NDT: {
    valueType: "date" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },

  // Mixing Cycle Particulars Fields
  rpm: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  time: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  temp: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  vacuum: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  stage: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.REQUIRED, invalid: S.INVALID },
  },
  mixingCycleCode: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.REQUIRED, invalid: S.INVALID },
  },
};

function resolveFieldPaths(data: any) {
  const paths: Array<{ path: string; value: unknown; ruleKey: string }> = [];
  const isMain = String(data?.batchType ?? "")
    .toUpperCase()
    .includes("MAIN");
  const subType = String(data?.subBatchType ?? "").toUpperCase();
  const isExperimental = subType === "EXPERIMENTAL";

  // 1. Hardware Preparation Scalar Fields
  const prepFields = [
    "NO_OF_40KG_BEMS",
    "NO_OF_10KG_BEMS",
    "NO_OF_2KG_BEMS",
    "NO_OF_WHEEL_PEEL",
    "NO_OF_SBS_TBS",
    "NO_OF_CARTOONS",
    "LINER_TYPE",
    "LINER_BATCH_NO",
    "LINER_BATCH_DATE",
  ];
  prepFields.forEach((field) => {
    paths.push({ path: field, value: data[field], ruleKey: field });
  });

  if (!isMain) {
    // 2. Subscale Conditional Fields
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

        // Premix Particulars Rows
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

        // Final Mix Particulars Rows
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

  // 4. Table Traversals (Article Type, Casting, Curing, NDT, Trimming, Inhibition, etc.)
  const tableMappings: Record<string, string[]> = {
    ARTICLE_TYPE_TABLE: ["SR_NO", "ARTICLE_TYPE", "RUBBER_MATERIAL", "SLEEVE_NO", "MOULD_NO"],
    CASTING_TABLE: ["SR_NO", "ARTICLE_TYPE", "BEM_MOULD_NO", "VACUUM_LEVEL"],
    CURING_TABLE: ["SR_NO", "ARTICLE_TYPE", "BEM_MOULD_NO"],
    NDT_TABLE: ["SR_NO", "ARTICLE_TYPE", "BEM_NO", "DATE_OF_NDT"],
    TRIMMING_TABLE: ["SR_NO", "ARTICLE_TYPE", "BEM_NO"],
    INHIBITION_TABLE: ["SR_NO", "ARTICLE_TYPE", "BEM_NO"],
    STATIC_TESTING_TABLE: ["SR_NO", "ARTICLE_TYPE", "BEM_NO"],
    MECHANICAL_PROPERTIES_TABLE: ["SR_NO", "ARTICLE_TYPE", "BEM_NO"],
  };

  Object.entries(tableMappings).forEach(([tableName, fields]) => {
    if (Array.isArray(data[tableName])) {
      data[tableName].forEach((row: any, i: number) => {
        if (!row) return;
        fields.forEach((fld) => {
          paths.push({
            path: `${tableName}.${i}.${fld}`,
            value: row[fld],
            ruleKey: fld === "SR_NO" ? "ARTICLE_TYPE" : fld, // Fallback/map rule keys as needed
          });
        });
      });
    }
  });

  return paths;
}

export const subscaleHardwareValidationConfig: SubDeptValidationConfig<any> = {
  id: "subscaleHardware",
  fields: subscaleHardwareFieldRules as any,
  resolveFieldPaths,
  customRules: [],
};

export default subscaleHardwareValidationConfig;
