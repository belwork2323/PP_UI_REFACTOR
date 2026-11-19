import { STRINGS } from "@/app/config/strings";
import type { MaterialBlock, SpecRow } from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";
import {
  emptyAdductPreparationDetails,
  emptyHtpbBlendingPreparationDetails,
  isAcemAdductMaterial,
  isAcemHtpbBlendingMaterial,
  type AdductPreparationDetails,
  type BlendingStylePreparationDetails,
} from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";
import {
  type FieldValidationState,
  validateFieldState,
} from "@data/validation/fieldValidators";
import {
  CODE_REF_MAX,
  CODE_REF_MIN,
  CODE_REF_PATTERN,
  DECIMAL_MAX_LENGTH,
  DECIMAL_MAX_PLACES,
  REMARKS_MAX,
  REMARKS_MIN,
  REMARKS_PATTERN,
  SHORT_TEXT_MAX,
  SHORT_TEXT_MIN,
  SHORT_TEXT_PATTERN,
} from "@data/validation/inputLimits";
import type { FieldRuleConfig, SubDeptValidationConfig } from "@data/validation/runValidation";
import {
  isReferenceRangeNotApplicable,
  specResultRuleKey,
} from "@data/validation/specResultValidation";
import type { ValidationErrors, ValidationTier } from "@data/validation/submissionIntent";

const M = STRINGS.SOURCING.SPECIFICATION_FORM.VALIDATION;
const A = STRINGS.SOURCING.SPECIFICATION_FORM.ADDUCT_PREPARATION;
const H = STRINGS.SOURCING.SPECIFICATION_FORM.HTPB_BLENDING_PREPARATION;

const CODE_MSG = {
  maxLength: M.codeRef.maxLength,
  minLength: M.codeRef.minLength,
};
const SHORT_MSG = {
  maxLength: M.shortText.maxLength,
  minLength: M.shortText.minLength,
};
const DECIMAL_MSG = {
  maxLength: M.decimal.maxLength,
};
const REMARKS_MSG = {
  maxLength: M.remarks.maxLength,
};

const codeTextRule = (
  requiredIn: ValidationTier[],
  messages: { required: string; invalid: string },
): FieldRuleConfig => ({
  valueType: "text",
  pattern: CODE_REF_PATTERN,
  minLength: CODE_REF_MIN,
  maxLength: CODE_REF_MAX,
  requiredIn,
  messages: { ...messages, ...CODE_MSG },
});

const decimalNumberRule = (
  requiredIn: ValidationTier[],
  messages: { required: string; invalid: string },
): FieldRuleConfig => ({
  valueType: "number",
  maxLength: DECIMAL_MAX_LENGTH,
  maxDecimals: DECIMAL_MAX_PLACES,
  requiredIn,
  messages: { ...messages, ...DECIMAL_MSG },
});

const POSITIVE_QTY_MSG = "Enter a positive number (greater than 0) with at most 6 decimal places";

const positiveDecimalNumberRule = (
  requiredIn: ValidationTier[],
  messages: { required: string; invalid?: string; minVal?: string },
): FieldRuleConfig => ({
  valueType: "number",
  maxLength: DECIMAL_MAX_LENGTH,
  maxDecimals: DECIMAL_MAX_PLACES,
  minVal: 0,
  positiveOnly: true,
  requiredIn,
  messages: {
    required: messages.required,
    invalid: messages.invalid ?? POSITIVE_QTY_MSG,
    minVal: messages.minVal ?? POSITIVE_QTY_MSG,
    ...DECIMAL_MSG,
  },
});

export const rawMaterialSourcingFieldRules = {
  supplyOrderNo: codeTextRule([], {
    required: M.supplyOrderNo.required,
    invalid: M.supplyOrderNo.invalid,
  }),
  receiptDate: {
    valueType: "date" as const,
    requiredIn: [] as ValidationTier[],
    messages: { required: M.receiptDate.required, invalid: M.receiptDate.invalid },
  },
  manufacturerName: {
    valueType: "text" as const,
    pattern: SHORT_TEXT_PATTERN,
    minLength: SHORT_TEXT_MIN,
    maxLength: SHORT_TEXT_MAX,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: {
      required: M.manufacturerName.required,
      invalid: M.manufacturerName.invalid,
      ...SHORT_MSG,
    },
  },
  lotNo: codeTextRule(["UNIT", "SUBMIT"], {
    required: M.lotNo.required,
    invalid: M.lotNo.invalid,
  }),
  analysedResult: decimalNumberRule(["SUBMIT"], {
    required: M.analysedResult.required,
    invalid: M.analysedResult.invalid,
  }),
  analysedResultAlphanumeric: codeTextRule(["SUBMIT"], {
    required: M.analysedResultAlphanumeric.required,
    invalid: M.analysedResultAlphanumeric.invalid,
  }),
  acemQcResult: decimalNumberRule([], {
    required: M.acemQcResult.required,
    invalid: M.acemQcResult.invalid,
  }),
  acemQcResultAlphanumeric: codeTextRule([], {
    required: M.acemQcResultAlphanumeric.required,
    invalid: M.acemQcResultAlphanumeric.invalid,
  }),
  certificates: {
    valueType: "file" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.certificates.required, invalid: M.certificates.invalid },
  },
  certificateType: codeTextRule(["SUBMIT"], {
    required: M.certificateType.required,
    invalid: M.certificateType.invalid,
  }),
  adductBatchPrepDate: {
    valueType: "date" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: A.adductBatchPrepDate.required, invalid: A.adductBatchPrepDate.invalid },
  },
  tmpMfgLotNo: codeTextRule(["SUBMIT"], {
    required: A.tmpMfgLotNo.required,
    invalid: A.tmpMfgLotNo.invalid,
  }),
  tmpTotalQtyGm: positiveDecimalNumberRule(["SUBMIT"], {
    required: A.tmpTotalQtyGm.required,
    invalid: A.tmpTotalQtyGm.invalid,
    minVal: A.tmpTotalQtyGm.minVal,
  }),
  nbdMfgLotNo: codeTextRule(["SUBMIT"], {
    required: A.nbdMfgLotNo.required,
    invalid: A.nbdMfgLotNo.invalid,
  }),
  nbdTotalQtyGm: positiveDecimalNumberRule(["SUBMIT"], {
    required: A.nbdTotalQtyGm.required,
    invalid: A.nbdTotalQtyGm.invalid,
    minVal: A.nbdTotalQtyGm.minVal,
  }),
  rpm: decimalNumberRule(["SUBMIT"], {
    required: A.rpm.required,
    invalid: A.rpm.invalid,
  }),
  processTemp: decimalNumberRule(["SUBMIT"], {
    required: A.processTemp.required,
    invalid: A.processTemp.invalid,
  }),
  jacketTemp: decimalNumberRule(["SUBMIT"], {
    required: A.jacketTemp.required,
    invalid: A.jacketTemp.invalid,
  }),
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
  finalAdductQty: positiveDecimalNumberRule(["SUBMIT"], {
    required: A.finalAdductQty.required,
    invalid: A.finalAdductQty.invalid,
    minVal: A.finalAdductQty.minVal,
  }),
  dispatchDateTime: {
    valueType: "datetime" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: A.dispatchDateTime.required, invalid: A.dispatchDateTime.invalid },
  },
  mfgBatchLotNo: codeTextRule(["SUBMIT"], {
    required: H.mfgBatchLotNo.required,
    invalid: H.mfgBatchLotNo.invalid,
  }),
  totalQty: positiveDecimalNumberRule(["SUBMIT"], {
    required: H.totalQty.required,
    invalid: H.totalQty.invalid,
    minVal: H.totalQty.minVal,
  }),
  equipmentId: codeTextRule(["SUBMIT"], {
    required: H.equipmentId.required,
    invalid: H.equipmentId.invalid,
  }),
  agitatorRpm: decimalNumberRule(["SUBMIT"], {
    required: H.agitatorRpm.required,
    invalid: H.agitatorRpm.invalid,
  }),
  htpbProcessTemp: decimalNumberRule(["SUBMIT"], {
    required: H.processTemp.required,
    invalid: H.processTemp.invalid,
  }),
  htpbJacketTemp: decimalNumberRule(["SUBMIT"], {
    required: H.jacketTemp.required,
    invalid: H.jacketTemp.invalid,
  }),
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
  otherObservations: {
    valueType: "text" as const,
    pattern: REMARKS_PATTERN,
    minLength: REMARKS_MIN,
    maxLength: REMARKS_MAX,
    requiredIn: [] as ValidationTier[],
    messages: {
      required: H.otherObservations.required,
      invalid: H.otherObservations.invalid,
      ...REMARKS_MSG,
    },
  },
};

function optionsFromRule(rule: FieldRuleConfig, required: boolean) {
  return {
    valueType: rule.valueType,
    required,
    pattern: rule.pattern,
    minLength: rule.minLength,
    maxLength: rule.maxLength,
    maxDecimals: rule.maxDecimals,
    minVal: rule.minVal,
    maxVal: rule.maxVal,
    positiveOnly: rule.positiveOnly,
  };
}

export function analysedResultRuleKey(row: Pick<SpecRow, "referenceRange">): string {
  return specResultRuleKey("analysedResult", row.referenceRange);
}

export function acemQcResultRuleKey(row: Pick<SpecRow, "referenceRange">): string {
  return specResultRuleKey("acemQcResult", row.referenceRange);
}

export function validateAnalysedResultState(
  row: Pick<SpecRow, "analysedResult" | "referenceRange">,
  required: boolean,
): FieldValidationState {
  const fields = rawMaterialSourcingFieldRules;
  if (isReferenceRangeNotApplicable(row.referenceRange)) {
    return validateFieldState(
      row.analysedResult,
      optionsFromRule(fields.analysedResultAlphanumeric, required),
    );
  }
  return validateFieldState(row.analysedResult, optionsFromRule(fields.analysedResult, required));
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
      paths.push({
        path: `blocks.${blockIndex}.lots.0.rows.${rowIndex}.acemQcResult`,
        value: row.acemQcResult,
        ruleKey: acemQcResultRuleKey(row),
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
      ["otherObservations", "otherObservations"],
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
    validateFieldState(meta.supplyOrderNo, optionsFromRule(fields.supplyOrderNo, false)) ===
      "valid" &&
    validateFieldState(meta.receiptDate, optionsFromRule(fields.receiptDate, false)) ===
      "valid" &&
    validateFieldState(meta.manufacturerName, optionsFromRule(fields.manufacturerName, true)) ===
      "valid"
  );
};

/** Draft save (UNIT): manufacturer + lot ID only. */
export const isBlockUnitComplete = (block: MaterialBlock): boolean => {
  const fields = rawMaterialSourcingFieldRules;
  const metaOk = isMaterialMetaUnitComplete(block);
  const lotOk =
    validateFieldState(block.lotNo, optionsFromRule(fields.lotNo, true)) === "valid";
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
    return validateFieldState(adduct[field], optionsFromRule(rule, true)) === "valid";
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
    return validateFieldState(details[field], optionsFromRule(rule, true)) === "valid";
  });
};

const isHtpbBlendingSubmitComplete = (block: MaterialBlock): boolean =>
  isBlendingStyleSubmitComplete(
    isAcemHtpbBlendingMaterial(block.rawMaterialType, block.preparationType),
    block.htpbBlendingPreparation ?? emptyHtpbBlendingPreparationDetails(),
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
      validateFieldState(cert.certificateType, optionsFromRule(fields.certificateType, true)) ===
      "valid",
  );
  const rowsOk =
    (block.rows ?? []).length > 0 &&
    (block.rows ?? []).every((row) => validateAnalysedResultState(row, true) === "valid");
  return (
    certOk &&
    certTypesOk &&
    rowsOk &&
    isAdductSubmitComplete(block) &&
    isHtpbBlendingSubmitComplete(block)
  );
};

export const areBlocksUnitComplete = (blocks: MaterialBlock[]): boolean =>
  blocks.length > 0 && blocks.every(isBlockUnitComplete);

export const areBlocksSubmitComplete = (blocks: MaterialBlock[]): boolean =>
  blocks.length > 0 && blocks.every(isBlockSubmitComplete);


/** Flag later blocks that reuse a lot ID already present earlier in the form. */
const collectDuplicateLotNoErrors = (
  blocks: MaterialBlock[],
  _tier: ValidationTier,
  errors: ValidationErrors,
) => {
  const seen = new Map<string, number>();
  (blocks ?? []).forEach((block, blockIndex) => {
    const lotNo = String(block.lotNo ?? "").trim();
    if (!lotNo) return;
    const key = lotNo.toLowerCase();
    const firstIndex = seen.get(key);
    if (firstIndex === undefined) {
      seen.set(key, blockIndex);
      return;
    }
    const path = `blocks.${blockIndex}.lots.0.lotNo`;
    if (!errors[path]) {
      errors[path] = M.lotNo.duplicate;
    }
  });
};

export const rawMaterialSourcingValidationConfig: SubDeptValidationConfig<MaterialBlock[]> = {
  id: "raw-material-sourcing",
  fields: rawMaterialSourcingFieldRules,
  resolveFieldPaths: resolveBlockFieldPaths,
  customRules: [collectDuplicateLotNoErrors],
  isUnitComplete: areBlocksUnitComplete,
};
