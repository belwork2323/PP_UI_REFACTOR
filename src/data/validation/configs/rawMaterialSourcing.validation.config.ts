import { STRINGS } from "@/app/config/strings";
import type { MaterialBlock, SpecRow } from "@/data/models/user/RawMaterialProcurementModel";
import {
  emptyAdductPreparationDetails,
  emptyApFinePreparationDetails,
  emptyApUltrafinePreparationDetails,
  emptyHtpbBlendingPreparationDetails,
  isAcemAdductMaterial,
  isAcemApFineMaterial,
  isAcemApUltrafineMaterial,
  isAcemHtpbBlendingMaterial,
  isReferenceRangeNotApplicable,
  type AdductPreparationDetails,
  type BlendingStylePreparationDetails,
} from "@/data/models/user/RawMaterialProcurementModel";
import {
  ALPHA_NUM,
  type FieldValidationState,
  validateFieldState,
} from "../fieldValidators";
import type { SubDeptValidationConfig } from "../runValidation";
import type { ValidationTier } from "../submissionIntent";

const M = STRINGS.SOURCING.SPECIFICATION_FORM.VALIDATION;
const A = STRINGS.SOURCING.SPECIFICATION_FORM.ADDUCT_PREPARATION;
const H = STRINGS.SOURCING.SPECIFICATION_FORM.HTPB_BLENDING_PREPARATION;

export const rawMaterialSourcingFieldRules = {
  supplyOrderNo: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: [] as ValidationTier[],
    messages: { required: M.supplyOrderNo.required, invalid: M.supplyOrderNo.invalid },
  },
  receiptDate: {
    valueType: "date" as const,
    requiredIn: [] as ValidationTier[],
    messages: { required: M.receiptDate.required, invalid: M.receiptDate.invalid },
  },
  manufacturerName: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: M.manufacturerName.required, invalid: M.manufacturerName.invalid },
  },
  lotNo: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: M.lotNo.required, invalid: M.lotNo.invalid },
  },
  analysedResult: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.analysedResult.required, invalid: M.analysedResult.invalid },
  },
  analysedResultAlphanumeric: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: {
      required: M.analysedResultAlphanumeric.required,
      invalid: M.analysedResultAlphanumeric.invalid,
    },
  },
  certificates: {
    valueType: "file" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.certificates.required, invalid: M.certificates.invalid },
  },
  certificateType: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.certificateType.required, invalid: M.certificateType.invalid },
  },
  adductBatchPrepDate: {
    valueType: "date" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: A.adductBatchPrepDate.required, invalid: A.adductBatchPrepDate.invalid },
  },
  tmpMfgLotNo: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: A.tmpMfgLotNo.required, invalid: A.tmpMfgLotNo.invalid },
  },
  tmpTotalQtyGm: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: A.tmpTotalQtyGm.required, invalid: A.tmpTotalQtyGm.invalid },
  },
  nbdMfgLotNo: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: A.nbdMfgLotNo.required, invalid: A.nbdMfgLotNo.invalid },
  },
  nbdTotalQtyGm: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: A.nbdTotalQtyGm.required, invalid: A.nbdTotalQtyGm.invalid },
  },
  rpm: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: A.rpm.required, invalid: A.rpm.invalid },
  },
  processTemp: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: A.processTemp.required, invalid: A.processTemp.invalid },
  },
  jacketTemp: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: A.jacketTemp.required, invalid: A.jacketTemp.invalid },
  },
  processStartTime: {
    valueType: "datetime" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: A.processStartTime.required, invalid: A.processStartTime.invalid },
  },
  processEndTime: {
    valueType: "datetime" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: A.processEndTime.required, invalid: A.processEndTime.invalid },
  },
  finalAdductQty: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: A.finalAdductQty.required, invalid: A.finalAdductQty.invalid },
  },
  dispatchDateTime: {
    valueType: "datetime" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: A.dispatchDateTime.required, invalid: A.dispatchDateTime.invalid },
  },
  mfgBatchLotNo: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: H.mfgBatchLotNo.required, invalid: H.mfgBatchLotNo.invalid },
  },
  totalQty: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: H.totalQty.required, invalid: H.totalQty.invalid },
  },
  equipmentId: {
    valueType: "text" as const,
    pattern: ALPHA_NUM,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: H.equipmentId.required, invalid: H.equipmentId.invalid },
  },
  agitatorRpm: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: H.agitatorRpm.required, invalid: H.agitatorRpm.invalid },
  },
  htpbProcessTemp: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: H.processTemp.required, invalid: H.processTemp.invalid },
  },
  htpbJacketTemp: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: H.jacketTemp.required, invalid: H.jacketTemp.invalid },
  },
  htpbProcessStartTime: {
    valueType: "datetime" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: H.processStartTime.required, invalid: H.processStartTime.invalid },
  },
  htpbProcessEndTime: {
    valueType: "datetime" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: H.processEndTime.required, invalid: H.processEndTime.invalid },
  },
};

export function analysedResultRuleKey(row: Pick<SpecRow, "referenceRange">): string {
  return isReferenceRangeNotApplicable(row.referenceRange)
    ? "analysedResultAlphanumeric"
    : "analysedResult";
}

export function validateAnalysedResultState(
  row: Pick<SpecRow, "analysedResult" | "referenceRange">,
  required: boolean,
): FieldValidationState {
  const fields = rawMaterialSourcingFieldRules;
  if (isReferenceRangeNotApplicable(row.referenceRange)) {
    return validateFieldState(row.analysedResult, {
      valueType: fields.analysedResultAlphanumeric.valueType,
      required,
      pattern: fields.analysedResultAlphanumeric.pattern,
    });
  }
  return validateFieldState(row.analysedResult, {
    valueType: fields.analysedResult.valueType,
    required,
  });
}

function resolveBlockFieldPaths(blocks: MaterialBlock[]) {
  const paths: Array<{ path: string; value: unknown; ruleKey: string }> = [];

  (blocks ?? []).forEach((block, blockIndex) => {
    paths.push(
      {
        path: `blocks.${blockIndex}.supplyOrderNo`,
        value: block.supplyOrderNo,
        ruleKey: "supplyOrderNo",
      },
      {
        path: `blocks.${blockIndex}.receiptDate`,
        value: block.receiptDate,
        ruleKey: "receiptDate",
      },
      {
        path: `blocks.${blockIndex}.manufacturerName`,
        value: block.manufacturerName,
        ruleKey: "manufacturerName",
      },
      {
        path: `blocks.${blockIndex}.lots.0.lotNo`,
        value: block.lotNo,
        ruleKey: "lotNo",
      },
      {
        path: `blocks.${blockIndex}.lots.0.certificates`,
        value: block.certificates,
        ruleKey: "certificates",
      },
    );

    (block.certificates ?? []).forEach((cert, certIndex) => {
      paths.push({
        path: `blocks.${blockIndex}.lots.0.certificates.${certIndex}.certificateType`,
        value: cert.certificateType,
        ruleKey: "certificateType",
      });
    });

    (block.rows ?? []).forEach((row, rowIndex) => {
      paths.push({
        path: `blocks.${blockIndex}.lots.0.rows.${rowIndex}.analysedResult`,
        value: row.analysedResult,
        ruleKey: analysedResultRuleKey(row),
      });
    });

    if (isAcemAdductMaterial(block.rawMaterialType, block.preparationType)) {
      const adduct = block.adductPreparation ?? emptyAdductPreparationDetails();
      (
        [
          "adductBatchPrepDate",
          "tmpMfgLotNo",
          "tmpTotalQtyGm",
          "nbdMfgLotNo",
          "nbdTotalQtyGm",
          "rpm",
          "processTemp",
          "jacketTemp",
          "processStartTime",
          "processEndTime",
          "finalAdductQty",
          "dispatchDateTime",
        ] as Array<keyof AdductPreparationDetails>
      ).forEach((field) => {
        paths.push({
          path: `blocks.${blockIndex}.adductPreparation.${field}`,
          value: adduct[field],
          ruleKey: field,
        });
      });
    }

    const blendingStyleFieldRules: Array<[keyof BlendingStylePreparationDetails, string]> = [
      ["mfgBatchLotNo", "mfgBatchLotNo"],
      ["totalQty", "totalQty"],
      ["equipmentId", "equipmentId"],
      ["agitatorRpm", "agitatorRpm"],
      ["processTemp", "htpbProcessTemp"],
      ["jacketTemp", "htpbJacketTemp"],
      ["processStartTime", "htpbProcessStartTime"],
      ["processEndTime", "htpbProcessEndTime"],
    ];

    const appendBlendingStylePaths = (
      preparationKey: string,
      details: BlendingStylePreparationDetails,
    ) => {
      blendingStyleFieldRules.forEach(([field, ruleKey]) => {
        paths.push({
          path: `blocks.${blockIndex}.${preparationKey}.${field}`,
          value: details[field],
          ruleKey,
        });
      });
    };

    if (isAcemHtpbBlendingMaterial(block.rawMaterialType, block.preparationType)) {
      appendBlendingStylePaths(
        "htpbBlendingPreparation",
        block.htpbBlendingPreparation ?? emptyHtpbBlendingPreparationDetails(),
      );
    }

    if (isAcemApFineMaterial(block.rawMaterialType, block.preparationType)) {
      appendBlendingStylePaths(
        "apFinePreparation",
        block.apFinePreparation ?? emptyApFinePreparationDetails(),
      );
    }

    if (isAcemApUltrafineMaterial(block.rawMaterialType, block.preparationType)) {
      appendBlendingStylePaths(
        "apUltrafinePreparation",
        block.apUltrafinePreparation ?? emptyApUltrafinePreparationDetails(),
      );
    }
  });

  return paths;
}

export const isMaterialMetaUnitComplete = (meta: {
  supplyOrderNo?: string;
  receiptDate?: string;
  manufacturerName?: string;
}): boolean => {
  const fields = rawMaterialSourcingFieldRules;
  return (
    validateFieldState(meta.supplyOrderNo, {
      valueType: fields.supplyOrderNo.valueType,
      required: false,
      pattern: fields.supplyOrderNo.pattern,
    }) === "valid" &&
    validateFieldState(meta.receiptDate, {
      valueType: fields.receiptDate.valueType,
      required: false,
    }) === "valid" &&
    validateFieldState(meta.manufacturerName, {
      valueType: fields.manufacturerName.valueType,
      required: true,
      pattern: fields.manufacturerName.pattern,
    }) === "valid"
  );
};

/** Draft save (UNIT): manufacturer + lot ID only. */
export const isBlockUnitComplete = (block: MaterialBlock): boolean => {
  const fields = rawMaterialSourcingFieldRules;
  const metaOk = isMaterialMetaUnitComplete(block);
  const lotOk =
    validateFieldState(block.lotNo, {
      valueType: fields.lotNo.valueType,
      required: true,
      pattern: fields.lotNo.pattern,
    }) === "valid";
  return metaOk && lotOk;
};

const isAdductSubmitComplete = (block: MaterialBlock): boolean => {
  if (!isAcemAdductMaterial(block.rawMaterialType, block.preparationType)) return true;
  const fields = rawMaterialSourcingFieldRules;
  const adduct = block.adductPreparation ?? emptyAdductPreparationDetails();
  const entries: Array<[keyof AdductPreparationDetails, keyof typeof rawMaterialSourcingFieldRules]> = [
    ["adductBatchPrepDate", "adductBatchPrepDate"],
    ["tmpMfgLotNo", "tmpMfgLotNo"],
    ["tmpTotalQtyGm", "tmpTotalQtyGm"],
    ["nbdMfgLotNo", "nbdMfgLotNo"],
    ["nbdTotalQtyGm", "nbdTotalQtyGm"],
    ["rpm", "rpm"],
    ["processTemp", "processTemp"],
    ["jacketTemp", "jacketTemp"],
    ["processStartTime", "processStartTime"],
    ["processEndTime", "processEndTime"],
    ["finalAdductQty", "finalAdductQty"],
    ["dispatchDateTime", "dispatchDateTime"],
  ];
  return entries.every(([field, ruleKey]) => {
    const rule = fields[ruleKey];
    return (
      validateFieldState(adduct[field], {
        valueType: rule.valueType,
        required: true,
        pattern: "pattern" in rule ? rule.pattern : undefined,
      }) === "valid"
    );
  });
};

const blendingStyleSubmitEntries: Array<
  [keyof BlendingStylePreparationDetails, keyof typeof rawMaterialSourcingFieldRules]
> = [
  ["mfgBatchLotNo", "mfgBatchLotNo"],
  ["totalQty", "totalQty"],
  ["equipmentId", "equipmentId"],
  ["agitatorRpm", "agitatorRpm"],
  ["processTemp", "htpbProcessTemp"],
  ["jacketTemp", "htpbJacketTemp"],
  ["processStartTime", "htpbProcessStartTime"],
  ["processEndTime", "htpbProcessEndTime"],
];

const isBlendingStyleSubmitComplete = (
  enabled: boolean,
  details: BlendingStylePreparationDetails,
): boolean => {
  if (!enabled) return true;
  const fields = rawMaterialSourcingFieldRules;
  return blendingStyleSubmitEntries.every(([field, ruleKey]) => {
    const rule = fields[ruleKey];
    return (
      validateFieldState(details[field], {
        valueType: rule.valueType,
        required: true,
        pattern: "pattern" in rule ? rule.pattern : undefined,
      }) === "valid"
    );
  });
};

const isHtpbBlendingSubmitComplete = (block: MaterialBlock): boolean =>
  isBlendingStyleSubmitComplete(
    isAcemHtpbBlendingMaterial(block.rawMaterialType, block.preparationType),
    block.htpbBlendingPreparation ?? emptyHtpbBlendingPreparationDetails(),
  );

const isApFineSubmitComplete = (block: MaterialBlock): boolean =>
  isBlendingStyleSubmitComplete(
    isAcemApFineMaterial(block.rawMaterialType, block.preparationType),
    block.apFinePreparation ?? emptyApFinePreparationDetails(),
  );

const isApUltrafineSubmitComplete = (block: MaterialBlock): boolean =>
  isBlendingStyleSubmitComplete(
    isAcemApUltrafineMaterial(block.rawMaterialType, block.preparationType),
    block.apUltrafinePreparation ?? emptyApUltrafinePreparationDetails(),
  );

/** Submit for approval: manufacturer, lot ID, certificates, and every analysed result. */
export const isBlockSubmitComplete = (block: MaterialBlock): boolean => {
  const fields = rawMaterialSourcingFieldRules;
  if (!isBlockUnitComplete(block)) return false;
  const certOk =
    validateFieldState(block.certificates, {
      valueType: fields.certificates.valueType,
      required: true,
    }) === "valid";
  const certTypesOk = (block.certificates ?? []).every(
    (cert) =>
      validateFieldState(cert.certificateType, {
        valueType: fields.certificateType.valueType,
        required: true,
        pattern: fields.certificateType.pattern,
      }) === "valid",
  );
  const rowsOk =
    (block.rows ?? []).length > 0 &&
    (block.rows ?? []).every((row) => validateAnalysedResultState(row, true) === "valid");
  return (
    certOk &&
    certTypesOk &&
    rowsOk &&
    isAdductSubmitComplete(block) &&
    isHtpbBlendingSubmitComplete(block) &&
    isApFineSubmitComplete(block) &&
    isApUltrafineSubmitComplete(block)
  );
};

export const areBlocksUnitComplete = (blocks: MaterialBlock[]): boolean =>
  blocks.length > 0 && blocks.every(isBlockUnitComplete);

export const areBlocksSubmitComplete = (blocks: MaterialBlock[]): boolean =>
  blocks.length > 0 && blocks.every(isBlockSubmitComplete);

export const rawMaterialSourcingValidationConfig: SubDeptValidationConfig<MaterialBlock[]> = {
  id: "raw-material-sourcing",
  fields: rawMaterialSourcingFieldRules,
  resolveFieldPaths: resolveBlockFieldPaths,
  isUnitComplete: areBlocksUnitComplete,
};

/** @deprecated Use rawMaterialSourcingFieldRules — legacy shape for subdepartmentValidationRules */
export const toLegacyRawMaterialSourcingRules = () => ({
  supplyOrderNo: {
    required: false,
    valueType: "text" as const,
    pattern: rawMaterialSourcingFieldRules.supplyOrderNo.pattern,
  },
  receiptDate: { required: false, valueType: "date" as const },
  manufacturerName: {
    required: true,
    valueType: "text" as const,
    pattern: rawMaterialSourcingFieldRules.manufacturerName.pattern,
  },
  lotNo: {
    required: true,
    valueType: "text" as const,
    pattern: rawMaterialSourcingFieldRules.lotNo.pattern,
  },
  analysedResult: { required: true, valueType: "number" as const },
  acemQcResult: { required: false, valueType: "text" as const },
  certificates: { required: true, valueType: "file" as const },
  certificateType: {
    required: true,
    valueType: "text" as const,
    pattern: rawMaterialSourcingFieldRules.certificateType.pattern,
  },
});
