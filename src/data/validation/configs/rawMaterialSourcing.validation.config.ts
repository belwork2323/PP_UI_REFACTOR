import { STRINGS } from "@/app/config/strings";
import type { MaterialBlock, SpecRow } from "@/data/models/user/RawMaterialProcurementModel";
import { isReferenceRangeNotApplicable } from "@/data/models/user/RawMaterialProcurementModel";
import {
  ALPHA_NUM,
  type FieldValidationState,
  validateFieldState,
} from "../fieldValidators";
import type { SubDeptValidationConfig } from "../runValidation";
import type { ValidationTier } from "../submissionIntent";

const M = STRINGS.SOURCING.SPECIFICATION_FORM.VALIDATION;

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
  return certOk && certTypesOk && rowsOk;
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
