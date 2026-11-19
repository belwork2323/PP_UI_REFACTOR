import { flattenValidationErrorTree } from "@utils/flattenValidationErrorTree";
import type { ValidationErrors } from "@data/validation/submissionIntent";
import { extractApiErrorDetails } from "@utils/resolveApiErrorMessage";
import {
  groupBlocksToMaterialGroups,
  type MaterialBlock,
} from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";

export type MapRmsApiErrorsOptions = {
  /** create → materials[i]; update → lot.* / short keys on block 0 */
  mode?: "create" | "update";
  /**
   * Flat create-form blocks (same order as submitted). Required to map
   * `materials[i].lots[j].…` onto `blocks[flat].…` when one material has multiple lots.
   */
  blocks?: Array<Pick<MaterialBlock, "material" | "gradeCode" | "lotNo"> | MaterialBlock>;
};

/** Normalize `materials[0].lots[1].x` → `materials.0.lots.1.x` for remapping. */
export function normalizeApiErrorPath(path: string): string {
  return String(path ?? "")
    .trim()
    .replace(/\[(\d+)\]/g, ".$1")
    .replace(/^\.+/, "");
}

/**
 * Build materials[i].lots[j] → flat block index using the same grouping as create payload.
 */
export function buildMaterialLotFlatIndexMap(
  blocks?: MapRmsApiErrorsOptions["blocks"],
): Map<string, number> {
  const map = new Map<string, number>();
  if (!blocks?.length) return map;

  const groups = groupBlocksToMaterialGroups(blocks as MaterialBlock[]);
  let flat = 0;
  groups.forEach((group, materialIndex) => {
    (group.lots ?? []).forEach((_lot, lotIndex) => {
      map.set(`${materialIndex}:${lotIndex}`, flat);
      flat += 1;
    });
  });
  return map;
}

function resolveFlatBlockIndex(
  materialIndex: number,
  lotIndex: number | null,
  flatIndexByMaterialLot: Map<string, number>,
): number {
  if (lotIndex == null) {
    return flatIndexByMaterialLot.get(`${materialIndex}:0`) ?? materialIndex;
  }
  return (
    flatIndexByMaterialLot.get(`${materialIndex}:${lotIndex}`) ??
    // Fallback when blocks were not provided: assume 1:1 material↔block (legacy).
    (lotIndex === 0 ? materialIndex : materialIndex + lotIndex)
  );
}

/**
 * Map one backend validation path onto RMS UI `validationErrors` keys
 * (`blocks.{i}.…` used by client validation / MaterialSpecificationBlock).
 */
export function remapRmsApiPathToUi(
  apiPath: string,
  options: MapRmsApiErrorsOptions = {},
): string | null {
  const path = normalizeApiErrorPath(apiPath);
  if (!path) return null;

  const flatIndexByMaterialLot = buildMaterialLotFlatIndexMap(options.blocks);

  // Create payload: materials.i.…
  const materialsMatch = path.match(/^materials\.(\d+)(?:\.(.*))?$/);
  if (materialsMatch) {
    const materialIndex = Number(materialsMatch[1]);
    const rest = materialsMatch[2] ?? "";
    return mapMaterialRelativeToBlock(materialIndex, rest, flatIndexByMaterialLot);
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

function mapMaterialRelativeToBlock(
  materialIndex: number,
  rest: string,
  flatIndexByMaterialLot: Map<string, number>,
): string | null {
  // Material-level fields live on the first lot block of that material group.
  const metaBlockIndex = resolveFlatBlockIndex(materialIndex, 0, flatIndexByMaterialLot);

  if (!rest) return `blocks.${metaBlockIndex}.manufacturerName`;

  if (
    rest === "manufacturerName" ||
    rest === "supplyOrderNo" ||
    rest === "receiptDate" ||
    rest === "materialCode" ||
    rest === "grade"
  ) {
    if (rest === "materialCode" || rest === "grade") {
      return `blocks.${metaBlockIndex}.manufacturerName`;
    }
    return `blocks.${metaBlockIndex}.${rest}`;
  }

  if (rest === "lots") return `blocks.${metaBlockIndex}.lots.0.lotNo`;

  const lotMatch = rest.match(/^lots\.(\d+)(?:\.(.*))?$/);
  if (lotMatch) {
    const lotIndex = Number(lotMatch[1]);
    const flatBlockIndex = resolveFlatBlockIndex(materialIndex, lotIndex, flatIndexByMaterialLot);
    // UI stores one lot per flat block at lots.0
    return mapLotRelativeToBlock(flatBlockIndex, lotMatch[2] ?? "");
  }

  if (rest.startsWith("adductPreparation") || rest.startsWith("htpbBlendingPreparation")) {
    return `blocks.${metaBlockIndex}.${rest}`;
  }

  return `blocks.${metaBlockIndex}.${rest}`;
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

/**
 * When the API returns DUPLICATE_LOT (409) without a field map, map the message
 * onto the matching Lot ID field so the create form stays open with a highlight.
 */
export function synthesizeRmsDuplicateLotFieldErrors(
  response: {
    errorCode?: string | null;
    message?: string | null;
    statusCode?: number;
  } | null | undefined,
  blocks?: Array<{ lotNo?: string | null }>,
): ValidationErrors {
  if (!response) return {};
  const code = String(response.errorCode ?? "").toUpperCase();
  const message = String(response.message ?? "").trim();
  const isDuplicate =
    code === "DUPLICATE_LOT" ||
    /lot id already exists/i.test(message) ||
    /duplicate lot id/i.test(message);
  if (!isDuplicate) return {};

  const extracted =
    message.match(/Lot ID already exists:\s*(.+)$/i)?.[1]?.trim() ||
    message.match(/Duplicate Lot ID in request:\s*(.+)$/i)?.[1]?.trim() ||
    "";
  const fieldMessage =
    message || (extracted ? `Lot ID already exists: ${extracted}` : "Lot ID already exists");

  if (extracted && Array.isArray(blocks) && blocks.length > 0) {
    const needle = extracted.toLowerCase();
    // Prefer the last matching block (later duplicate in multi-lot create).
    for (let i = blocks.length - 1; i >= 0; i--) {
      if (String(blocks[i]?.lotNo ?? "").trim().toLowerCase() === needle) {
        return { [`blocks.${i}.lots.0.lotNo`]: fieldMessage };
      }
    }
  }

  return { "blocks.0.lots.0.lotNo": fieldMessage };
}

/** Extract + map in one step from an ApiResponseModel-like object. */
export function mapRmsApiResponseToUiErrors(
  response: unknown,
  options: MapRmsApiErrorsOptions = {},
): ValidationErrors {
  return mapRmsApiErrorsToUi(extractApiErrorDetails(response as any), options);
}
