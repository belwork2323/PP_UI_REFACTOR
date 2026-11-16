import { flattenValidationErrorTree } from "@utils/flattenValidationErrorTree";
import type { ValidationErrors } from "@data/validation/submissionIntent";
import { extractApiErrorDetails } from "@utils/resolveApiErrorMessage";

export type MapRmsApiErrorsOptions = {
  /** create → materials[i]; update → lot.* / short keys on block 0 */
  mode?: "create" | "update";
};

/** Normalize `materials[0].lots[1].x` → `materials.0.lots.1.x` for remapping. */
export function normalizeApiErrorPath(path: string): string {
  return String(path ?? "")
    .trim()
    .replace(/\[(\d+)\]/g, ".$1")
    .replace(/^\.+/, "");
}

/**
 * Map one backend validation path onto RMS UI `validationErrors` keys
 * (`blocks.{i}.…` used by client validation / MaterialSpecificationBlock).
 */
export function remapRmsApiPathToUi(
  apiPath: string,
  _options: MapRmsApiErrorsOptions = {},
): string | null {
  const path = normalizeApiErrorPath(apiPath);
  if (!path) return null;

  // Create payload: materials.i.…
  const materialsMatch = path.match(/^materials\.(\d+)(?:\.(.*))?$/);
  if (materialsMatch) {
    const blockIndex = Number(materialsMatch[1]);
    const rest = materialsMatch[2] ?? "";
    return mapMaterialRelativeToBlock(blockIndex, rest);
  }

  // Update payload: lot.…
  if (path === "lot" || path.startsWith("lot.")) {
    const rest = path === "lot" ? "" : path.slice("lot.".length);
    return mapLotRelativeToBlock(0, rest);
  }

  // Bean short keys / top-level update fields → block 0
  if (path === "lotId") return `blocks.0.lots.0.lotNo`;
  if (path === "fileId" || path === "certificateType") {
    return `blocks.0.lots.0.certificates.0.certificateType`;
  }
  if (path === "analysedResult" || path === "acemQcResult" || path === "specificationCode") {
    return `blocks.0.lots.0.rows.0.${path === "specificationCode" ? "analysedResult" : path}`;
  }
  if (path === "materials") return `blocks.0.manufacturerName`;
  if (
    path === "manufacturerName" ||
    path === "supplyOrderNo" ||
    path === "receiptDate"
  ) {
    return `blocks.0.${path}`;
  }
  if (
    path === "materialCode" ||
    path === "grade" ||
    path === "subDepartmentId" ||
    path === "submissionType"
  ) {
    // No dedicated UI control for these — highlight manufacturer as nearest meta field.
    return `blocks.0.manufacturerName`;
  }

  // Bare prep / nested without prefix (rare)
  if (path.startsWith("adductPreparation.") || path.startsWith("htpbBlendingPreparation.")) {
    return `blocks.0.${path}`;
  }
  if (path.startsWith("specifications") || path.startsWith("certificates")) {
    return mapLotRelativeToBlock(0, path);
  }

  return null;
}

function mapMaterialRelativeToBlock(blockIndex: number, rest: string): string | null {
  if (!rest) return `blocks.${blockIndex}.manufacturerName`;

  if (
    rest === "manufacturerName" ||
    rest === "supplyOrderNo" ||
    rest === "receiptDate" ||
    rest === "materialCode" ||
    rest === "grade"
  ) {
    if (rest === "materialCode" || rest === "grade") {
      return `blocks.${blockIndex}.manufacturerName`;
    }
    return `blocks.${blockIndex}.${rest}`;
  }

  if (rest === "lots") return `blocks.${blockIndex}.lots.0.lotNo`;

  const lotMatch = rest.match(/^lots\.(\d+)(?:\.(.*))?$/);
  if (lotMatch) {
    // UI stores one lot per block at lots.0
    return mapLotRelativeToBlock(blockIndex, lotMatch[2] ?? "");
  }

  if (rest.startsWith("adductPreparation") || rest.startsWith("htpbBlendingPreparation")) {
    return `blocks.${blockIndex}.${rest}`;
  }

  return `blocks.${blockIndex}.${rest}`;
}

function mapLotRelativeToBlock(blockIndex: number, rest: string): string | null {
  if (!rest || rest === "lotId") return `blocks.${blockIndex}.lots.0.lotNo`;

  if (rest === "specifications") {
    return `blocks.${blockIndex}.lots.0.rows.0.analysedResult`;
  }

  const specMatch = rest.match(/^specifications\.(\d+)(?:\.(.*))?$/);
  if (specMatch) {
    const rowIndex = Number(specMatch[1]);
    const field = specMatch[2] ?? "analysedResult";
    if (!specMatch[2] || field === "specificationCode") {
      return `blocks.${blockIndex}.lots.0.rows.${rowIndex}.analysedResult`;
    }
    if (field === "analysedResult" || field === "acemQcResult") {
      return `blocks.${blockIndex}.lots.0.rows.${rowIndex}.${field}`;
    }
    return `blocks.${blockIndex}.lots.0.rows.${rowIndex}.analysedResult`;
  }

  if (rest === "certificates") {
    return `blocks.${blockIndex}.lots.0.certificates`;
  }

  const certMatch = rest.match(/^certificates\.(\d+)(?:\.(.*))?$/);
  if (certMatch) {
    const certIndex = Number(certMatch[1]);
    const field = certMatch[2] ?? "certificateType";
    // fileId / certificateType both highlight the cert type control for that row
    if (field === "fileId" || field === "certificateType" || !certMatch[2]) {
      return `blocks.${blockIndex}.lots.0.certificates.${certIndex}.certificateType`;
    }
    return `blocks.${blockIndex}.lots.0.certificates.${certIndex}.certificateType`;
  }

  if (rest.startsWith("adductPreparation") || rest.startsWith("htpbBlendingPreparation")) {
    return `blocks.${blockIndex}.${rest}`;
  }

  if (rest === "preparationDetails") {
    return `blocks.${blockIndex}.adductPreparation.adductBatchPrepDate`;
  }

  return `blocks.${blockIndex}.lots.0.${rest}`;
}

/**
 * Maps RMS API validation field maps onto UI `validationErrors` keys.
 */
export function mapRmsApiErrorsToUi(
  errorDetails: unknown,
  options: MapRmsApiErrorsOptions = {},
): ValidationErrors {
  if (!errorDetails) return {};

  const flat = flattenValidationErrorTree(errorDetails);
  const result: ValidationErrors = {};

  for (const [apiPath, message] of Object.entries(flat)) {
    const msg = String(message ?? "").trim();
    if (!msg) continue;
    const uiPath = remapRmsApiPathToUi(apiPath, options);
    if (!uiPath) continue;
    // Keep first message per UI field
    if (!result[uiPath]) result[uiPath] = msg;
  }

  return result;
}

/** Extract + map in one step from an ApiResponseModel-like object. */
export function mapRmsApiResponseToUiErrors(
  response: unknown,
  options: MapRmsApiErrorsOptions = {},
): ValidationErrors {
  return mapRmsApiErrorsToUi(extractApiErrorDetails(response as any), options);
}
