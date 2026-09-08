import { STRINGS } from "@/app/config/strings";
import type { SubDeptValidationConfig } from "../runValidation";
import type { ValidationTier } from "../submissionIntent";
import { PostCureMotorData } from "@/data/models/user/PostCureMotorDataModel";
import { VALIDATIONSTRING } from "./validationString";

const S = VALIDATIONSTRING;

export const postCureFieldRules = {
  // Common / Shared fields
  inhibitorBatchNo: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  inhibitorBatchSize: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  dispatchDate: {
    valueType: "date" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  dispatchStation: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.REQUIRED, invalid: S.INVALID },
  },

  // Location / Table shared fields
  location: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.REQUIRED, invalid: S.INVALID },
  },
  fromDate: {
    valueType: "date" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  toDate: {
    valueType: "date" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  observations: {
    valueType: "text" as const,
    requiredIn: ["SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  qtyFilled: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  qtyApplied: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },

  // Ingredient table fields
  mfgLot: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.REQUIRED, invalid: S.INVALID },
  },
  partsByWeight: {
    valueType: "text" as const,
    requiredIn: [],
    messages: { required: S.REQUIRED, invalid: S.INVALID },
  },
  quantity: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  qtyTaken: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },

  // Qualification section fields
  qualificationBatchNo: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  qualificationPreparationDate: {
    valueType: "date" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  qualificationSpecification: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.REQUIRED, invalid: S.INVALID },
  },

  // Loose Flap Specific
  epoxyBatchNo: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  epoxyPreparationDate: {
    valueType: "date" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },

  // IR1 Specific
  ir1PremixBatchNo: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  ir1PremixDate: {
    valueType: "date" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  ir1FinalMixBatchNo: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  ir1FinalMixDate: {
    valueType: "date" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },

  // Hemcoat 3K Specific
  hemcoatPremixBatchNo: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  hemcoatPremixDate: {
    valueType: "date" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  hemcoatFinalMixBatchNo: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  hemcoatFinalMixDate: {
    valueType: "date" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },

  // Not Applicable Variant
  inhibitionNotApplicableRemarks: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
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
  const pushQualificationPaths = (qualPath: string) => {
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
          paths.push({
            path: `${qualPath}.qualificationTable.${i}.specification`,
            value: row.specification,
            ruleKey: "qualificationSpecification",
          });
        });
      }

      if (Array.isArray(qual.qualificationQcReport)) {
        qual.qualificationQcReport.forEach((file: any, i: number) => {
          paths.push({
            path: `${qualPath}.qualificationQcReport.${i}`,
            value: file,
            ruleKey: "qualificationQcReport",
          });
        });
      }
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

  // Variant 4: Inhibition Not Applicable
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
  customRules: [],
};

export default postCureValidationConfig;
