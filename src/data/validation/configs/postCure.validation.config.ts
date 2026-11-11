import { STRINGS } from "@/app/config/strings";
import type { SubDeptValidationConfig } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { PostCureMotorData } from "@/data/models/user/PostCureMotorDataModel";
import { assertFromToOrderInTree } from "../dateRangeValidation";
import { parseMixingSpecificationBounds } from "../specificationBounds";
import { VALIDATIONSTRING } from "./validationString";

const S = VALIDATIONSTRING;
const M = VALIDATIONSTRING;

const POST_CURE_QUALIFICATION_PATHS = [
  "qualificationDetails",
  "ir1Qualification",
  "hemcoat3kQualification",
  "othersQualification",
] as const;

/** Mixing parity — Result must fall within Specification bounds when parseable. */
const applyPostCureQualificationRangeRules = (
  data: PostCureMotorData,
  _tier: ValidationTier,
  errors: ValidationErrors,
) => {
  const root = (data ?? {}) as Record<string, unknown>;
  for (const qualPath of POST_CURE_QUALIFICATION_PATHS) {
    const qual = root[qualPath] as { qualificationTable?: unknown } | null | undefined;
    const rows = Array.isArray(qual?.qualificationTable) ? qual.qualificationTable : [];
    rows.forEach((item, i) => {
      const row = (item ?? {}) as Record<string, unknown>;
      const path = `${qualPath}.qualificationTable.${i}.result`;
      if (errors[path]) return;

      const raw = row.result;
      if (raw === undefined || raw === null || String(raw).trim() === "") return;

      const num = Number(raw);
      if (Number.isNaN(num)) {
        errors[path] = S.INVALID;
        return;
      }

      const bounds = parseMixingSpecificationBounds(row.specification);
      const { min, max, minExclusive, maxExclusive } = bounds;
      if (min == null && max == null) return;

      if (min != null && max != null) {
        if (num < min || num > max) {
          errors[path] = M.OBSERVED_VALUE_RANGE.replace("{min}", String(min)).replace(
            "{max}",
            String(max),
          );
        }
      } else if (min != null) {
        const belowMin = minExclusive ? num <= min : num < min;
        if (belowMin) {
          errors[path] = minExclusive
            ? M.OBSERVED_VALUE_GT.replace("{min}", String(min))
            : M.OBSERVED_VALUE_MIN.replace("{min}", String(min));
        }
      } else if (max != null) {
        const aboveMax = maxExclusive ? num >= max : num > max;
        if (aboveMax) {
          errors[path] = maxExclusive
            ? M.OBSERVED_VALUE_LT.replace("{max}", String(max))
            : M.OBSERVED_VALUE_MAX.replace("{max}", String(max));
        }
      }
    });
  }
};

export const postCureFieldRules = {
  // Common / Shared fields
  inhibitorBatchNo: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.ALPHANUMERIC,
    maxLength: 50,
  },
  inhibitorBatchSize: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.FLOAT,
  },
  dispatchDate: {
    valueType: "datetime" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  dispatchStation: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.ALPHABET_WITH_SPECIAL,
    maxLength: S.LENGTH.MAX_STANDARD,
  },

  // Location / Table shared fields
  location: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.ALPHABET_WITH_SPECIAL,
    maxLength: S.LENGTH.MAX_STANDARD,
  },
  fromDate: {
    valueType: "datetime" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  toDate: {
    valueType: "datetime" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  observations: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.ALPHABET_WITH_SPECIAL,
    maxLength: S.LENGTH.MAX_LONG_TEXT,
  },
  qtyFilled: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.FLOAT,
  },
  qtyApplied: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.FLOAT,
  },

  // Ingredient table fields
  mfgLot: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.MASTER_CODE,
    maxLength: 50,
  },
  partsByWeight: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"],
    messages: { required: S.REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.SPECIFICATION_WITH_TOLERANCE,
    maxLength: 20,
  },
  quantity: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.FLOAT,
  },
  qtyTaken: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.FLOAT,
  },

  // Qualification section fields
  qualificationBatchNo: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.ALPHANUMERIC,
    maxLength: 50,
  },
  qualificationPreparationDate: {
    valueType: "datetime" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },

  result: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.FLOAT,
  },
  specification: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
    // Allow common qual specs e.g. ">=8 KSC", "≥25 KSC" (pattern used elsewhere omits '>').
    maxLength: S.LENGTH.MAX_STANDARD,
  },
  // Loose Flap Specific
  epoxyBatchNo: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.ALPHANUMERIC,
    maxLength: 50,
  },
  epoxyPreparationDate: {
    valueType: "datetime" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },

  // IR1 Specific
  ir1PremixBatchNo: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.ALPHANUMERIC,
    maxLength: 50,
  },
  ir1PremixDate: {
    valueType: "datetime" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  ir1FinalMixBatchNo: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.ALPHANUMERIC,
    maxLength: 50,
  },
  ir1FinalMixDate: {
    valueType: "datetime" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },

  // Hemcoat 3K Specific
  hemcoatPremixBatchNo: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.ALPHANUMERIC,
    maxLength: 50,
  },
  hemcoatPremixDate: {
    valueType: "datetime" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  hemcoatFinalMixBatchNo: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.ALPHANUMERIC,
    maxLength: 50,
  },
  hemcoatFinalMixDate: {
    valueType: "datetime" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },

  // Others Specific (flexible mixes)
  othersPremixBatchNo: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.ALPHANUMERIC,
    maxLength: 50,
  },
  othersPremixDate: {
    valueType: "datetime" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  othersFinalMixBatchNo: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.ALPHANUMERIC,
    maxLength: 50,
  },
  othersFinalMixDate: {
    valueType: "datetime" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  ingredient: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.ALPHABET_WITH_SPECIAL,
    maxLength: S.LENGTH.MAX_STANDARD,
  },

  // Not Applicable Variant
  inhibitionNotApplicableRemarks: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
    pattern: S.PATTERNS.ALPHABET_WITH_SPECIAL,
    maxLength: S.LENGTH.MAX_LONG_TEXT,
  },
  qualificationQcReport: {
    valueType: "file" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
};

function resolveFieldPaths(data: any) {
  const paths: Array<{ path: string; value: unknown; ruleKey: string }> = [];
  const variant = data?.variant;

  // 1. Shared Inhibition Details Builder (Uniform across variants)
  const pushInhibitionSharedPaths = (basePath: string = "") => {
    const prefix = basePath ? `${basePath}.` : "";

    const batchDetails = basePath
      ? data[basePath]?.inhibitionBatchDetails
      : data.inhibitionBatchDetails;
    if (batchDetails) {
      paths.push({
        path: `${prefix}inhibitionBatchDetails.inhibitorBatchNo`,
        value: batchDetails.inhibitorBatchNo,
        ruleKey: "inhibitorBatchNo",
      });
      paths.push({
        path: `${prefix}inhibitionBatchDetails.inhibitorBatchSize`,
        value: batchDetails.inhibitorBatchSize,
        ruleKey: "inhibitorBatchSize",
      });
    }

    const appDetails = basePath
      ? data[basePath]?.inhibitionApplicationDetails
      : data.inhibitionApplicationDetails;
    if (appDetails && Array.isArray(appDetails.inhibitionApplicationTable)) {
      appDetails.inhibitionApplicationTable.forEach((row: any, i: number) => {
        paths.push({
          path: `${prefix}inhibitionApplicationDetails.inhibitionApplicationTable.${i}.location`,
          value: row.location,
          ruleKey: "location",
        });
        paths.push({
          path: `${prefix}inhibitionApplicationDetails.inhibitionApplicationTable.${i}.fromDate`,
          value: row.fromDate,
          ruleKey: "fromDate",
        });
        paths.push({
          path: `${prefix}inhibitionApplicationDetails.inhibitionApplicationTable.${i}.toDate`,
          value: row.toDate,
          ruleKey: "toDate",
        });
        paths.push({
          path: `${prefix}inhibitionApplicationDetails.inhibitionApplicationTable.${i}.qtyApplied`,
          value: row.qtyApplied,
          ruleKey: "qtyApplied",
        });
        paths.push({
          path: `${prefix}inhibitionApplicationDetails.inhibitionApplicationTable.${i}.observations`,
          value: row.observations,
          ruleKey: "observations",
        });
      });
    }

    const dispatch = basePath ? data[basePath]?.dispatchDetails : data.dispatchDetails;
    if (dispatch) {
      paths.push({
        path: `${prefix}dispatchDetails.dispatchDate`,
        value: dispatch.dispatchDate,
        ruleKey: "dispatchDate",
      });
      paths.push({
        path: `${prefix}dispatchDetails.dispatchStation`,
        value: dispatch.dispatchStation,
        ruleKey: "dispatchStation",
      });
    }
  };

  // 2. Uniform Qualification Paths Builder
  const pushQualificationPaths = (
    qualPath: string,
    options?: { requireSpecification?: boolean },
  ) => {
    const qual = data[qualPath];
    if (qual) {
      paths.push({
        path: `${qualPath}.qualificationBatchNo`,
        value: qual.qualificationBatchNo,
        ruleKey: "qualificationBatchNo",
      });
      paths.push({
        path: `${qualPath}.qualificationPreparationDate`,
        value: qual.qualificationPreparationDate,
        ruleKey: "qualificationPreparationDate",
      });

      if (Array.isArray(qual.qualificationTable)) {
        qual.qualificationTable.forEach((row: any, i: number) => {
          if (options?.requireSpecification) {
            paths.push({
              path: `${qualPath}.qualificationTable.${i}.specification`,
              value: row.specification,
              ruleKey: "specification",
            });
          }
          paths.push({
            path: `${qualPath}.qualificationTable.${i}.result`,
            value: row.result,
            ruleKey: "result",
          });
        });
      }
      paths.push({
        path: `${qualPath}.qualificationQcReport`,
        value: qual.qualificationQcReport,
        ruleKey: "qualificationQcReport",
      });
    }
  };

  // 3. Uniform Ingredient Table Builder
  const pushIngredientTablePaths = (
    tablePath: string,
    ruleKeyMap: { batchNoKey: string; prepDateKey: string; tableKey: string },
    rowsArray: any[],
  ) => {
    const tableObj = data[tablePath];
    if (!tableObj) return;

    paths.push({
      path: `${tablePath}.${ruleKeyMap.batchNoKey}`,
      value: tableObj[ruleKeyMap.batchNoKey],
      ruleKey: ruleKeyMap.batchNoKey,
    });
    paths.push({
      path: `${tablePath}.${ruleKeyMap.prepDateKey}`,
      value: tableObj[ruleKeyMap.prepDateKey],
      ruleKey: ruleKeyMap.prepDateKey,
    });

    if (Array.isArray(rowsArray)) {
      rowsArray.forEach((row: any, i: number) => {
        const isTotal = String(row.srNo ?? "").toUpperCase() === "TOTAL";
        if (!isTotal) {
          paths.push({
            path: `${tablePath}.${ruleKeyMap.tableKey}.${i}.mfgLot`,
            value: row.mfgLot,
            ruleKey: "mfgLot",
          });
          paths.push({
            path: `${tablePath}.${ruleKeyMap.tableKey}.${i}.partsByWeight`,
            value: row.partsByWeight,
            ruleKey: "partsByWeight",
          });
          paths.push({
            path: `${tablePath}.${ruleKeyMap.tableKey}.${i}.${row.quantity !== undefined ? "quantity" : "qtyTaken"}`,
            value: row.quantity ?? row.qtyTaken,
            ruleKey: row.quantity !== undefined ? "quantity" : "qtyTaken",
          });
        }
      });
    }
  };

  // Variant 1: Loose Flap Filling
  if (variant === "loose-flap-filling") {
    const bellowRemoval = data.bellowRemovalDetails;
    if (bellowRemoval && Array.isArray(bellowRemoval.bellowRemovalTable)) {
      bellowRemoval.bellowRemovalTable.forEach((row: any, i: number) => {
        paths.push({
          path: `bellowRemovalDetails.bellowRemovalTable.${i}.location`,
          value: row.location,
          ruleKey: "location",
        });
        paths.push({
          path: `bellowRemovalDetails.bellowRemovalTable.${i}.fromDate`,
          value: row.fromDate,
          ruleKey: "fromDate",
        });
        paths.push({
          path: `bellowRemovalDetails.bellowRemovalTable.${i}.toDate`,
          value: row.toDate,
          ruleKey: "toDate",
        });
        paths.push({
          path: `bellowRemovalDetails.bellowRemovalTable.${i}.observations`,
          value: row.observations,
          ruleKey: "observations",
        });
      });
    }

    pushIngredientTablePaths(
      "looseFlapEpoxyPreparation",
      {
        batchNoKey: "epoxyBatchNo",
        prepDateKey: "epoxyPreparationDate",
        tableKey: "preparationDetails",
      },
      data.looseFlapEpoxyPreparation?.preparationDetails,
    );

    pushQualificationPaths("qualificationDetails");

    const lfFilling = data.lfEpoxyFillingDetails;
    if (lfFilling && Array.isArray(lfFilling.lfFillingTable)) {
      lfFilling.lfFillingTable.forEach((row: any, i: number) => {
        paths.push({
          path: `lfEpoxyFillingDetails.lfFillingTable.${i}.location`,
          value: row.location,
          ruleKey: "location",
        });
        paths.push({
          path: `lfEpoxyFillingDetails.lfFillingTable.${i}.fromDate`,
          value: row.fromDate,
          ruleKey: "fromDate",
        });
        paths.push({
          path: `lfEpoxyFillingDetails.lfFillingTable.${i}.toDate`,
          value: row.toDate,
          ruleKey: "toDate",
        });
        paths.push({
          path: `lfEpoxyFillingDetails.lfFillingTable.${i}.qtyFilled`,
          value: row.qtyFilled,
          ruleKey: "qtyFilled",
        });
        paths.push({
          path: `lfEpoxyFillingDetails.lfFillingTable.${i}.observations`,
          value: row.observations,
          ruleKey: "observations",
        });
      });
    }
  }

  // Variant 2: Inhibition IR1
  else if (variant === "inhibition-ir1") {
    pushIngredientTablePaths(
      "ir1Premix",
      { batchNoKey: "ir1PremixBatchNo", prepDateKey: "ir1PremixDate", tableKey: "ir1PremixTable" },
      data.ir1Premix?.ir1PremixTable,
    );

    pushIngredientTablePaths(
      "ir1FinalMix",
      {
        batchNoKey: "ir1FinalMixBatchNo",
        prepDateKey: "ir1FinalMixDate",
        tableKey: "ir1FinalMixTable",
      },
      data.ir1FinalMix?.ir1FinalMixTable,
    );

    pushQualificationPaths("ir1Qualification");
    pushInhibitionSharedPaths("");
  }

  // Variant 3: Inhibition Hemcoat 3K
  else if (variant === "inhibition-hemcoat-3k") {
    pushIngredientTablePaths(
      "hemcoat3kPreparation",
      {
        batchNoKey: "hemcoatPremixBatchNo",
        prepDateKey: "hemcoatPremixDate",
        tableKey: "premixPreparationTable",
      },
      data.hemcoat3kPreparation?.premixPreparationTable,
    );

    pushIngredientTablePaths(
      "hemcoat3kFinalMix",
      {
        batchNoKey: "hemcoatFinalMixBatchNo",
        prepDateKey: "hemcoatFinalMixDate",
        tableKey: "finalMixTable",
      },
      data.hemcoat3kFinalMix?.finalMixTable,
    );

    pushQualificationPaths("hemcoat3kQualification");
    pushInhibitionSharedPaths("");
  }

  // Variant 4: Inhibition Others (flexible premix/final + shared trailing sections)
  else if (variant === "inhibition-others") {
    const pushOthersMixPaths = (
      tablePath: string,
      ruleKeyMap: { batchNoKey: string; prepDateKey: string; tableKey: string },
      rowsArray: any[],
    ) => {
      const tableObj = data[tablePath];
      if (!tableObj) return;

      paths.push({
        path: `${tablePath}.${ruleKeyMap.batchNoKey}`,
        value: tableObj[ruleKeyMap.batchNoKey],
        ruleKey: ruleKeyMap.batchNoKey,
      });
      paths.push({
        path: `${tablePath}.${ruleKeyMap.prepDateKey}`,
        value: tableObj[ruleKeyMap.prepDateKey],
        ruleKey: ruleKeyMap.prepDateKey,
      });

      if (!Array.isArray(rowsArray)) return;
      rowsArray.forEach((row: any, i: number) => {
        const isTotal = String(row.srNo ?? "").toUpperCase() === "TOTAL";
        if (isTotal) return;

        paths.push({
          path: `${tablePath}.${ruleKeyMap.tableKey}.${i}.ingredient`,
          value: row.ingredient,
          ruleKey: "ingredient",
        });
        paths.push({
          path: `${tablePath}.${ruleKeyMap.tableKey}.${i}.partsByWeight`,
          value: row.partsByWeight,
          ruleKey: "partsByWeight",
        });
        paths.push({
          path: `${tablePath}.${ruleKeyMap.tableKey}.${i}.qtyTaken`,
          value: row.qtyTaken ?? row.quantity,
          ruleKey: "qtyTaken",
        });
        // Mfg lot only when a catalog material is selected (free-text ingredient may omit it).
        if (String(row.materialCode ?? "").trim()) {
          paths.push({
            path: `${tablePath}.${ruleKeyMap.tableKey}.${i}.mfgLot`,
            value: row.mfgLot,
            ruleKey: "mfgLot",
          });
        }
      });
    };

    pushOthersMixPaths(
      "othersPremix",
      {
        batchNoKey: "othersPremixBatchNo",
        prepDateKey: "othersPremixDate",
        tableKey: "othersPremixTable",
      },
      data.othersPremix?.othersPremixTable,
    );

    pushOthersMixPaths(
      "othersFinalMix",
      {
        batchNoKey: "othersFinalMixBatchNo",
        prepDateKey: "othersFinalMixDate",
        tableKey: "othersFinalMixTable",
      },
      data.othersFinalMix?.othersFinalMixTable,
    );

    pushQualificationPaths("othersQualification", { requireSpecification: true });
    pushInhibitionSharedPaths("");
  }

  // Variant 5: Inhibition Not Applicable
  else if (variant === "inhibition-not-applicable") {
    const na = data.inhibitionNotApplicable;
    if (na) {
      paths.push({
        path: `inhibitionNotApplicable.remarks`,
        value: na.remarks,
        ruleKey: "inhibitionNotApplicableRemarks",
      });
    }
  }

  return paths;
}

export const postCureValidationConfig: SubDeptValidationConfig<PostCureMotorData> = {
  id: "postCure",
  fields: postCureFieldRules as any,
  resolveFieldPaths,
  customRules: [
    (data: PostCureMotorData, tier: string, errors: Record<string, string>) => {
      const isSubmit = tier === "SUBMIT";

      const checkQualificationTable = (prefix: string, qualTable: any[] | undefined) => {
        if (!qualTable || !qualTable.length) return;

        qualTable.forEach((row, qIdx) => {
          const spec = row.specification;
          let min: number | undefined;
          let max: number | undefined;

          // Extract min and max from the specification object
          if (spec && typeof spec === "object") {
            const minVal = Number((spec as any).min);
            const maxVal = Number((spec as any).max);

            if (
              !Number.isNaN(minVal) &&
              (spec as any).min !== null &&
              (spec as any).min !== undefined
            ) {
              min = minVal;
            }
            if (
              !Number.isNaN(maxVal) &&
              (spec as any).max !== null &&
              (spec as any).max !== undefined
            ) {
              max = maxVal;
            }
          }

          const val = row.result;
          const path = `${prefix}.${qIdx}.result`;

          if (isSubmit) {
            if (val === undefined || val === null || String(val).trim() === "") {
              errors[path] = postCureFieldRules.result.messages.required;
              return;
            }
          } else {
            // FORMAT/UNIT: skip empty during draft checks
            if (val === undefined || val === null || String(val).trim() === "") return;
          }

          // Validate as a valid number
          const num = Number(val);
          if (Number.isNaN(num)) {
            errors[path] = postCureFieldRules.result.messages.invalid;
            return;
          }

          // Range validation based on extracted min and max from specification object
          if (min !== undefined && max !== undefined) {
            if (num < min || num > max) {
              errors[path] = M.OBSERVED_VALUE_RANGE.replace("{min}", String(min)).replace(
                "{max}",
                String(max),
              );
            }
          } else if (min !== undefined && num < min) {
            errors[path] = M.OBSERVED_VALUE_MIN.replace("{min}", String(min));
          } else if (max !== undefined && num > max) {
            errors[path] = M.OBSERVED_VALUE_MAX.replace("{max}", String(max));
          }
        });
      };

      // Check all possible qualification tables dynamically based on your data structure
      // (Adjust `data.someParentKey` or call directly if they are top-level or nested)

      // Example if they are under a specific object or root data structure:
      checkQualificationTable(
        "qualificationDetails.qualificationTable",
        (data as any).qualificationDetails?.qualificationTable,
      );
      checkQualificationTable(
        "ir1Qualification.qualificationTable",
        (data as any).ir1Qualification?.qualificationTable,
      );
      checkQualificationTable(
        "hemcoat3kQualification.qualificationTable",
        (data as any).hemcoat3kQualification?.qualificationTable,
      );
      checkQualificationTable(
        "othersQualification.qualificationTable",
        (data as any).othersQualification?.qualificationTable,
      );
    },
  ],
};

export default postCureValidationConfig;
