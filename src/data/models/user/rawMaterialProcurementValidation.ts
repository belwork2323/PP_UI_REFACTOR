/**
 * @deprecated Import from @/data/validation/adapters/rawMaterialSourcing.validation
 * Re-exports preserved for backward compatibility during migration.
 */
export {
  areAllAnalyzedResultsFilled,
  areBlocksMandatoryComplete,
  areMaterialGroupsMandatoryComplete,
  getAnalyzedResultError,
  getCertificateError,
  getLotFieldErrors,
  getMaterialMetaErrors,
  hasRawMaterialDraftData,
  isBlockMandatoryComplete,
  isLotMandatoryComplete,
  isMaterialGroupMandatoryComplete,
  isMaterialMetaComplete,
  validateRawMaterialBlocks,
  type LotFieldErrors,
  type MandatoryValidationMessages,
  type MaterialMetaFieldErrors,
  type RawMaterialValidationIntent,
} from "../../validation/adapters/rawMaterialSourcing.validation";

export type RawMaterialValidationErrors = Record<string, string>;

export { validateRawMaterialSourcing } from "../../validation/adapters/rawMaterialSourcing.validation";
