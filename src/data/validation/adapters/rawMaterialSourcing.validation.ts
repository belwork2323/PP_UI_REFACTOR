import type {
  LotCertificate,
  MaterialBlock,
  MaterialFormGroup,
  MaterialLotBlock,
  SpecRow,
} from "@/data/models/user/RawMaterialProcurementModel";
import {
  areBlocksSubmitComplete,
  areBlocksUnitComplete,
  isBlockSubmitComplete,
  isBlockUnitComplete,
  isMaterialMetaUnitComplete,
  rawMaterialSourcingValidationConfig,
  validateAnalysedResultState,
} from "../configs/rawMaterialSourcing.validation.config";
import { validateFieldState } from "../fieldValidators";
import { runValidation } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { legacyIntentToTier, tierToLegacyIntent } from "../submissionIntent";
import { focusFieldByDataAttr } from "../utils/focusFieldByDataAttr";

export type RawMaterialValidationIntent = "DRAFT" | "SUBMIT";

export type MandatoryValidationMessages = {
  supplyOrderNo: string;
  receiptDate: string;
  manufacturerName: string;
  lotNo: string;
  supplyOrderNoInvalid: string;
  receiptDateInvalid: string;
  manufacturerNameInvalid: string;
  lotNoInvalid: string;
  analysedResult: string;
  analysedResultInvalid: string;
  certificates: string;
};

export type MaterialMetaFieldErrors = {
  supplyOrderNo?: string;
  receiptDate?: string;
  manufacturerName?: string;
};

export type LotFieldErrors = { lotNo?: string };

export const blockMetaPath = (blockIndex: number, field: string) => `blocks.${blockIndex}.${field}`;

export const blockLotPath = (blockIndex: number, suffix: string) =>
  `blocks.${blockIndex}.lots.0.${suffix}`;

export const blockRowPath = (blockIndex: number, rowIndex: number, field: string) =>
  `blocks.${blockIndex}.lots.0.rows.${rowIndex}.${field}`;

export const blockCertTypePath = (blockIndex: number, certIndex: number) =>
  `blocks.${blockIndex}.lots.0.certificates.${certIndex}.certificateType`;

export const blockAdductPath = (blockIndex: number, field: string) =>
  `blocks.${blockIndex}.adductPreparation.${field}`;

export const blockBlendingStylePreparationPath = (
  blockIndex: number,
  preparationKey: string,
  field: string,
) => `blocks.${blockIndex}.${preparationKey}.${field}`;

export const blockHtpbBlendingPath = (blockIndex: number, field: string) =>
  blockBlendingStylePreparationPath(blockIndex, "htpbBlendingPreparation", field);

export const flatBlockIndexFromGroup = (
  groups: MaterialFormGroup[],
  materialIndex: number,
  lotIndex: number,
): number => {
  let idx = 0;
  for (let g = 0; g < groups.length; g++) {
    for (let l = 0; l < (groups[g].lots ?? []).length; l++) {
      if (g === materialIndex && l === lotIndex) return idx;
      idx++;
    }
  }
  return idx;
};

export function validateRawMaterialSourcing(
  blocks: MaterialBlock[],
  tier: ValidationTier,
): ValidationErrors {
  return runValidation(blocks, tier, rawMaterialSourcingValidationConfig);
}

export function validateRawMaterialBlocks(
  blocks: MaterialBlock[],
  intent: RawMaterialValidationIntent,
  _messages?: Partial<MandatoryValidationMessages>,
): ValidationErrors {
  const tier = intent === "SUBMIT" ? "SUBMIT" : "FORMAT";
  return validateRawMaterialSourcing(blocks, tier);
}

export const isMaterialMetaComplete = isMaterialMetaUnitComplete;

export const isLotUnitComplete = (lot: Pick<MaterialLotBlock, "lotNo">): boolean => {
  const fields = rawMaterialSourcingValidationConfig.fields;
  return (
    validateFieldState(lot.lotNo, {
      valueType: fields.lotNo.valueType,
      required: true,
      pattern: fields.lotNo.pattern,
    }) === "valid"
  );
};

export const isLotMandatoryComplete = (
  lot: Pick<MaterialLotBlock, "lotNo" | "rows"> & { certificates?: LotCertificate[] },
): boolean => {
  const fields = rawMaterialSourcingValidationConfig.fields;
  const lotOk =
    validateFieldState(lot.lotNo, {
      valueType: fields.lotNo.valueType,
      required: true,
      pattern: fields.lotNo.pattern,
    }) === "valid";
  const certOk =
    validateFieldState(lot.certificates, {
      valueType: fields.certificates.valueType,
      required: true,
    }) === "valid";
  const certTypesOk = (lot.certificates ?? []).every(
    (cert) =>
      validateFieldState(cert.certificateType, {
        valueType: fields.certificateType.valueType,
        required: true,
        pattern: fields.certificateType.pattern,
      }) === "valid",
  );
  const rowsOk =
    (lot.rows ?? []).length > 0 &&
    (lot.rows ?? []).every((row) => validateAnalysedResultState(row, true) === "valid");
  return lotOk && certOk && certTypesOk && rowsOk;
};

export const isMaterialGroupUnitComplete = (group: MaterialFormGroup): boolean =>
  isMaterialMetaComplete(group) && (group.lots ?? []).every(isLotUnitComplete);

export const isMaterialGroupMandatoryComplete = (group: MaterialFormGroup): boolean =>
  isMaterialMetaComplete(group) && (group.lots ?? []).every(isLotMandatoryComplete);

export const isBlockMandatoryComplete = isBlockSubmitComplete;

export const areMaterialGroupsUnitComplete = (groups: MaterialFormGroup[]): boolean =>
  groups.length > 0 && groups.every(isMaterialGroupUnitComplete);

export const areMaterialGroupsMandatoryComplete = (groups: MaterialFormGroup[]): boolean =>
  groups.length > 0 && groups.every(isMaterialGroupMandatoryComplete);

export const areBlocksMandatoryComplete = areBlocksSubmitComplete;

export { areBlocksUnitComplete };

export const areAllAnalyzedResultsFilled = (blocks: MaterialBlock[]): boolean => {
  const rows = (blocks ?? []).flatMap((block) => block.rows ?? []);
  return (
    rows.length > 0 &&
    rows.every((row) => validateAnalysedResultState(row, true) === "valid")
  );
};

export const hasRawMaterialDraftData = (blocks: MaterialBlock[]): boolean =>
  (blocks ?? []).some(
    (block) =>
      [block.lotNo, block.supplyOrderNo, block.receiptDate, block.manufacturerName].some((value) =>
        String(value ?? "").trim(),
      ) ||
      (block.certificates ?? []).some(
        (cert) =>
          String(cert.fileName ?? "").trim() || cert.file || String(cert.fileId ?? "").trim(),
      ) ||
      (block.rows ?? []).some(
        (row) => String(row.analysedResult ?? "").trim() || String(row.acemQcResult ?? "").trim(),
      ),
  );

export type RmsValidationFocusTarget = {
  fieldPath: string;
  blockIndex?: number;
};

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

/** First non-empty validation message (stable key sort). */
export const firstRmsValidationErrorMessage = (
  errors: ValidationErrors,
): string | undefined => {
  for (const key of Object.keys(errors).sort()) {
    const text = str(errors[key]);
    if (text) return text;
  }
  return undefined;
};

/** Prefer manufacturer → lot → analysed results → certificates → prep fields. */
const RMS_FOCUS_PATH_PRIORITY = (path: string): number => {
  if (/\.manufacturerName$/.test(path)) return 10;
  if (/\.lots\.0\.lotNo$/.test(path)) return 20;
  if (/\.lots\.0\.rows\.\d+\.analysedResult$/.test(path)) return 30;
  if (/\.lots\.0\.certificates$/.test(path)) return 40;
  if (/\.lots\.0\.certificates\.\d+\.certificateType$/.test(path)) return 50;
  if (/\.adductPreparation\./.test(path) || /\.htpbBlendingPreparation\./.test(path)) return 60;
  if (/\.supplyOrderNo$|\.receiptDate$/.test(path)) return 70;
  return 100;
};

export function resolveFirstRmsValidationFocus(
  errors: ValidationErrors,
): RmsValidationFocusTarget | null {
  const paths = Object.keys(errors).filter((key) => str(errors[key]));
  if (!paths.length) return null;
  paths.sort((a, b) => {
    const pa = RMS_FOCUS_PATH_PRIORITY(a);
    const pb = RMS_FOCUS_PATH_PRIORITY(b);
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b, undefined, { numeric: true });
  });
  const fieldPath = paths[0];
  const blockMatch = fieldPath.match(/^blocks\.(\d+)\./);
  return {
    fieldPath,
    blockIndex: blockMatch ? Number(blockMatch[1]) : undefined,
  };
}

/** Scroll + focus the control tagged with `data-rms-field`. */
export function focusRmsField(fieldPath: string, root: ParentNode = document): boolean {
  return focusFieldByDataAttr("rms-field", fieldPath, root);
}

/** @deprecated Use fieldError(errors, path) with validationErrors from hook */
export function getMaterialMetaErrors(
  meta: { supplyOrderNo?: string; receiptDate?: string; manufacturerName?: string },
  _messages: MandatoryValidationMessages,
  show: boolean,
  _showRequired = show,
): MaterialMetaFieldErrors {
  if (!show) return {};
  const errors = validateRawMaterialSourcing(
    [
      {
        material: "",
        lotNo: "",
        supplyOrderNo: meta.supplyOrderNo,
        receiptDate: meta.receiptDate,
        manufacturerName: meta.manufacturerName,
        certificates: [],
        rows: [],
      },
    ],
    "SUBMIT",
  );
  return {
    supplyOrderNo: errors["blocks.0.supplyOrderNo"],
    receiptDate: errors["blocks.0.receiptDate"],
    manufacturerName: errors["blocks.0.manufacturerName"],
  };
}

/** @deprecated Use fieldError(errors, path) with validationErrors from hook */
export function getLotFieldErrors(
  lot: Pick<MaterialLotBlock, "lotNo">,
  _messages: MandatoryValidationMessages,
  show: boolean,
  _showRequired = show,
): LotFieldErrors {
  if (!show) return {};
  const errors = validateRawMaterialSourcing(
    [{ material: "", lotNo: lot.lotNo, certificates: [], rows: [] }],
    "SUBMIT",
  );
  return { lotNo: errors["blocks.0.lots.0.lotNo"] };
}

/** @deprecated Use fieldError(errors, path) with validationErrors from hook */
export function getAnalyzedResultError(
  row: Pick<SpecRow, "analysedResult">,
  _messages: MandatoryValidationMessages,
  show: boolean,
  _showRequired = show,
): string | undefined {
  if (!show) return undefined;
  const errors = validateRawMaterialSourcing(
    [
      {
        material: "",
        lotNo: "",
        certificates: [],
        rows: [
          {
            specification: "",
            refRange: "",
            acemQcResult: "",
            ...row,
          },
        ],
      },
    ],
    "SUBMIT",
  );
  return errors["blocks.0.lots.0.rows.0.analysedResult"];
}

/** @deprecated Use fieldError(errors, path) with validationErrors from hook */
export function getCertificateError(
  certs: LotCertificate[] | undefined,
  messages: MandatoryValidationMessages,
  show: boolean,
): string | undefined {
  if (!show) return undefined;
  const errors = validateRawMaterialSourcing(
    [{ material: "", lotNo: "", certificates: certs, rows: [] }],
    "SUBMIT",
  );
  return errors["blocks.0.lots.0.certificates"] ?? messages.certificates;
}

export { tierToLegacyIntent, legacyIntentToTier };
