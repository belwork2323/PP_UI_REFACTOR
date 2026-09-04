import {
  OPERATION_STATUS,
  OPERATION_STATUS_UI_TO_API,
  toOperationStatusApiValue,
  type OperationStatus,
} from "../../../hooks/operationStatus";
import { materialSelectionKey } from "./MaterialsListModel";

/** Re-export for sourcing pages that previously imported from sourcingWorkflowData */
export const SOURCING_STATUS = OPERATION_STATUS;
export type SourcingStatus = (typeof OPERATION_STATUS)[keyof typeof OPERATION_STATUS];

const OPERATION_STATUS_VALUES = Object.values(OPERATION_STATUS) as OperationStatus[];

/** API status enum → UI status labels */
export function normalizeRawMaterialLotListStatus(status: string): OperationStatus {
  const u = String(status ?? "").toUpperCase();
  const map: Record<string, OperationStatus> = {
    TO_BE_INITIATED: OPERATION_STATUS.TO_BE_INITIATED,
    INITIATED: OPERATION_STATUS.TO_BE_INITIATED,
    IN_PROGRESS: OPERATION_STATUS.IN_PROGRESS,
    WAITING_FOR_APPROVAL: OPERATION_STATUS.WAITING_FOR_APPROVAL,
    APPROVED: OPERATION_STATUS.APPROVED,
    REJECTED: OPERATION_STATUS.REJECTED,
  };
  const fromApiKey = map[u];
  if (fromApiKey) return fromApiKey;
  const trimmed = String(status ?? "").trim();
  if (OPERATION_STATUS_VALUES.includes(trimmed as OperationStatus)) {
    return trimmed as OperationStatus;
  }
  return OPERATION_STATUS.TO_BE_INITIATED;
}

/** UI status labels → API status enum for list filters */
export const RAW_MATERIAL_UI_STATUS_TO_API = OPERATION_STATUS_UI_TO_API;

/** Map UI / display status labels to uppercase API enum values for lot-list requests */
export function toRawMaterialLotListApiStatus(status: string): string {
  return toOperationStatusApiValue(status) ?? "";
}

/** Soft-delete is allowed only while the lot is still in progress */
export const canDeleteRawMaterialLot = (status: string | null | undefined) =>
  status === OPERATION_STATUS.IN_PROGRESS;

export type RawMaterialLotDeletePayload = {
  lotId: string;
};

export type RawMaterialLotDeleteResponse = {
  lotId: string;
  status: string;
};

export type LotCertificateStatus = "uploading" | "uploaded" | "failed";

export type LotCertificate = {
  localId?: string;
  fileId?: string | null;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  certificateType: string;
  /** Local file kept until upload succeeds (not sent in JSON payload). */
  file?: File | null;
  status?: LotCertificateStatus;
  /** Local upload progress 0–100 while status is "uploading". */
  uploadProgress?: number;
  /** True until the parent lot create/update succeeds. */
  isTemp?: boolean;
};

export type RawMaterialCertificateApiPayload = {
  fileId: string;
  certificateType: string;
};

export type SpecRow = {
  specificationCode?: string;
  specification: string;
  specificationName?: string;
  refRange: string;
  analysedResult: string;
  acemQcResult: string;
  status?: string | null;
  isOutOfRange?: boolean;
  referenceRange?: {
    minValue: number | null;
    maxValue: number | null;
    unit: string | null;
  };
};

type ApiNumericValue =
  | number
  | string
  | null
  | undefined
  | { source?: string | number | null; parsedValue?: number | null };

export function parseApiNumericValue(value: ApiNumericValue): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === "object") {
    if (value.parsedValue != null && !Number.isNaN(Number(value.parsedValue))) {
      return Number(value.parsedValue);
    }
    if (value.source != null && String(value.source).trim() !== "") {
      const parsed = Number(String(value.source).trim());
      return Number.isNaN(parsed) ? null : parsed;
    }
  }
  return null;
}

export function parseApiAnalysedResultDisplay(value: ApiNumericValue): string {
  const parsed = parseApiNumericValue(value);
  if (parsed !== null) return String(parsed);
  if (value && typeof value === "object" && value.source != null) {
    return String(value.source).trim();
  }
  if (typeof value === "string") return value.trim();
  return "";
}

export function parseApiReferenceRange(
  ref:
    | {
        minValue?: ApiNumericValue;
        maxValue?: ApiNumericValue;
        unit?: string | null;
      }
    | null
    | undefined,
): ReferenceRangeShape {
  return {
    minValue: parseApiNumericValue(ref?.minValue ?? null),
    maxValue: parseApiNumericValue(ref?.maxValue ?? null),
    unit: ref?.unit ?? null,
  };
}

export function formatReferenceRangeLabel(ref: ReferenceRangeShape): string {
  const unitSuffix = ref?.unit ? ` ${ref.unit}` : "";
  if (ref?.minValue != null && ref?.maxValue != null) {
    return `${ref.minValue} - ${ref.maxValue}${unitSuffix}`;
  }
  if (ref?.minValue != null) {
    return `>= ${ref.minValue}${unitSuffix}`;
  }
  if (ref?.maxValue != null) {
    return `<= ${ref.maxValue}${unitSuffix}`;
  }
  return "N/A";
}

export function isSpecRowFailed(
  row: Pick<SpecRow, "status" | "isOutOfRange" | "analysedResult">,
): boolean {
  const hasResult = String(row.analysedResult ?? "").trim() !== "";
  if (!hasResult) return false;
  if (
    String(row.status ?? "")
      .trim()
      .toLowerCase() === "failed"
  )
    return true;
  return Boolean(row.isOutOfRange);
}

/** Clear stale API quality flags when no analysed result is entered yet (draft / continue filling). */
export function normalizeSpecRowQualityState(row: SpecRow): SpecRow {
  const analysedResult = String(row.analysedResult ?? "").trim();
  if (!analysedResult) {
    return { ...row, analysedResult: "", status: null, isOutOfRange: false };
  }
  return {
    ...row,
    analysedResult,
    isOutOfRange:
      String(row.status ?? "")
        .trim()
        .toLowerCase() === "failed" ||
      computeIsOutOfRange(analysedResult, row.referenceRange),
  };
}

export function normalizeMaterialBlockQualityState(block: MaterialBlock): MaterialBlock {
  return {
    ...block,
    rows: (block.rows ?? []).map(normalizeSpecRowQualityState),
  };
}

/** UI label for specification row status (API may return "failed" for out-of-range values). */
export function formatSpecStatusDisplayLabel(
  status: string | null | undefined,
  isOutOfRange?: boolean,
): string | null {
  if (
    isOutOfRange ||
    String(status ?? "")
      .trim()
      .toLowerCase() === "failed"
  ) {
    return "Out of Range";
  }
  const trimmed = String(status ?? "").trim();
  return trimmed || null;
}

export type MaterialBlock = {
  material: string;
  gradeCode?: string;
  lotNo: string;
  supplyOrderNo?: string;
  receiptDate?: string;
  manufacturerName?: string;
  certificates?: LotCertificate[];
  rows: SpecRow[];
};

export type MaterialLotBlock = {
  lotNo: string;
  certificates: LotCertificate[];
  rows: SpecRow[];
};

export type MaterialFormGroup = {
  material: string;
  gradeCode?: string;
  gradeId?: number;
  gradeName?: string;
  supplyOrderNo: string;
  receiptDate: string;
  manufacturerName: string;
  lots: MaterialLotBlock[];
};

export type ReferenceRangeShape = {
  minValue: number | null;
  maxValue: number | null;
  unit: string | null;
};

export function isReferenceRangeNotApplicable(
  referenceRange?: ReferenceRangeShape | null,
): boolean {
  if (!referenceRange) return true;
  return referenceRange.minValue == null && referenceRange.maxValue == null;
}

/** Outbound API value: numeric specs send numbers; N/A specs send trimmed text. */
export function mapAnalysedResultForApi(
  row: Pick<SpecRow, "analysedResult" | "referenceRange">,
): string | number | null {
  const trimmed = String(row.analysedResult ?? "").trim();
  if (!trimmed) return null;
  if (isReferenceRangeNotApplicable(row.referenceRange)) {
    return trimmed;
  }
  const numeric = Number(trimmed.replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

/** Restrict numeric spec inputs to digits, one decimal point, and optional leading minus. */
export function sanitizeNumericAnalysedResultInput(value: string): string {
  const raw = String(value ?? "");
  if (!raw) return "";

  let result = "";
  let hasDecimal = false;
  let index = 0;

  if (raw[0] === "-") {
    result = "-";
    index = 1;
  }

  for (; index < raw.length; index += 1) {
    const char = raw[index];
    if (char >= "0" && char <= "9") {
      result += char;
      continue;
    }
    if (char === "." && !hasDecimal) {
      hasDecimal = true;
      result += char;
    }
  }

  return result;
}

export function computeIsOutOfRange(
  analysedResult: string,
  referenceRange?: ReferenceRangeShape,
): boolean {
  const trimmed = String(analysedResult ?? "").trim();
  if (!trimmed || !referenceRange || isReferenceRangeNotApplicable(referenceRange)) return false;
  const value = Number(trimmed);
  if (Number.isNaN(value)) return false;
  const { minValue, maxValue } = referenceRange;
  if (minValue != null && value < minValue) return true;
  if (maxValue != null && value > maxValue) return true;
  return false;
}

/** Stable JSON for dirty-check / snapshots (File → name only; strips upload UI state). */
export function serializeMaterialBlocks(blocks: MaterialBlock[]): string {
  // Lazy import avoided — inline same normalization as workflowFormSnapshot
  const normalized = JSON.parse(
    JSON.stringify(blocks ?? [], (_key, value) => {
      if (value instanceof File) return undefined;
      if (_key === "uploadProgress") return undefined;
      if (_key === "file") return undefined;
      if (_key === "localId") return undefined;
      if (_key === "status" && value === "uploading") return undefined;
      return value;
    }),
  );
  return JSON.stringify(normalized ?? []);
}

export function flattenMaterialGroups(groups: MaterialFormGroup[]): MaterialBlock[] {
  return (groups ?? []).flatMap((group) =>
    (group.lots ?? []).map((lot) => ({
      material: group.material,
      ...(group.gradeCode ? { gradeCode: group.gradeCode } : {}),
      lotNo: lot.lotNo,
      supplyOrderNo: group.supplyOrderNo,
      receiptDate: group.receiptDate,
      manufacturerName: group.manufacturerName,
      certificates: lot.certificates ?? [],
      rows: lot.rows ?? [],
    })),
  );
}

export function groupBlocksToMaterialGroups(blocks: MaterialBlock[]): MaterialFormGroup[] {
  const bySelection = new Map<string, MaterialBlock[]>();
  for (const block of blocks ?? []) {
    const code = (block.material ?? "").trim();
    if (!code) continue;
    const key = materialSelectionKey(code, block.gradeCode);
    if (!bySelection.has(key)) bySelection.set(key, []);
    bySelection.get(key)!.push(block);
  }

  return Array.from(bySelection.values()).map((group) => {
    const head = group[0];
    const gradeCode = (head.gradeCode ?? "").trim();
    return {
      material: (head.material ?? "").trim(),
      ...(gradeCode ? { gradeCode } : {}),
      supplyOrderNo: head.supplyOrderNo ?? "",
      receiptDate: head.receiptDate ?? "",
      manufacturerName: head.manufacturerName ?? "",
      lots: group.map((block) => ({
        lotNo: block.lotNo ?? "",
        certificates: block.certificates ?? [],
        rows: block.rows ?? [],
      })),
    };
  });
}

/** Column keys searched by the raw material lot list search bar */
export const RAW_MATERIAL_LOT_SEARCH_FIELDS = [
  "lotId",
  "sourcingId",
  "materialCode",
  "materialName",
  "grade.gradeCode",
  "grade.gradeName",
  "supplyOrderNo",
  "receiptDate",
  "manufacturerName",
  "createdBy.fullName",
  "createdBy.id",
  "rmStatus",
  "status",
  "createdOn",
] as const;

/** Match lot list row against free-text search across all visible table columns */
export function rawMaterialLotMatchesSearch(row: RawMaterialLotListRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const parts: string[] = [
    row.lotId,
    row.sourcingId,
    row.materialCode,
    row.materialName,
    row.grade?.gradeCode ?? "",
    row.grade?.gradeName ?? "",
    row.supplyOrderNo,
    row.receiptDate,
    row.manufacturerName,
    row.rmStatus,
    row.status,
    row.createdBy?.fullName ?? "",
    row.createdBy?.id ?? "",
  ];

  if (row.createdOn) {
    parts.push(row.createdOn);
    const d = new Date(row.createdOn);
    if (!Number.isNaN(d.getTime())) {
      parts.push(
        d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
      );
    }
  }

  return parts.some((part) => String(part).toLowerCase().includes(q));
}

/** Grade metadata on lot-list rows */
export type RawMaterialLotListGrade = {
  gradeId: number;
  gradeCode: string;
  gradeName: string;
};

/** List row from POST …/lot-list */
export type RawMaterialLotListRow = {
  id: string | number;
  lotId: string;
  sourcingId: string;
  materialCode: string;
  materialName: string;
  grade: RawMaterialLotListGrade | null;
  supplyOrderNo: string;
  receiptDate: string;
  manufacturerName: string;
  status: string;
  createdBy?: { id: string; fullName: string } | null;
  createdOn: string;
  rmStatus: string;
  formId?: string | null;
};

/** Read-only lot details page context (from list row + details API) */
export type RawMaterialLotDetailsContext = {
  lotId: string;
  sourcingId: string;
  materialCode: string;
  materialName: string;
  grade: RawMaterialLotListGrade | null;
  supplyOrderNo: string;
  receiptDate: string;
  manufacturerName: string;
  rmStatus: string;
  createdBy?: { id: string; fullName: string } | null;
  createdOn: string;
  rejectionReason?: string | null;
};

/** Synthetic + list row context for form shell (UserWorkflowFormHeader) */
export type RawMaterialFormBatch = {
  id: string | number;
  lotId: string | null;
  sourcingId: string | null;
  formId?: string | null;
  batchId: string;
  batchType: string;
  motorId: string;
  motorType: string;
  priority: string;
  assignedTo: { fullName: string } | null;
  createdOn: string;
  rmStatus: SourcingStatus;
  draftData: MaterialBlock[];
  rejectionReason: string | null;
};

export type RawMaterialProcurementSubmissionType = "DRAFT" | "SUBMIT" | "UPDATE";

export type RawMaterialLotSpecificationPayload = {
  specificationCode: string;
  analysedResult: string | number | null;
  isOutOfRange: boolean;
  acemQcResult: string;
};

export type RawMaterialLotCreatePayload = {
  lotId: string;
  specifications: RawMaterialLotSpecificationPayload[];
  certificates: RawMaterialCertificateApiPayload[];
};

export type RawMaterialMaterialCreatePayload = {
  materialCode: string;
  grade: string | null;
  supplyOrderNo: string;
  receiptDate: string;
  manufacturerName: string;
  lots: RawMaterialLotCreatePayload[];
};

export type RawMaterialCreateFormPayload = {
  subDepartmentId: number;
  submissionType: "DRAFT" | "SUBMIT";
  materials: RawMaterialMaterialCreatePayload[];
};

export type RawMaterialLotUpdatePayload = {
  lotId: string;
  submissionType: "DRAFT" | "UPDATE";
  subDepartmentId: number;
  supplyOrderNo: string;
  receiptDate: string;
  manufacturerName: string;
  materialCode: string;
  grade: string | null;
  specifications: Array<{
    specificationCode: string;
    specificationName: string;
    referenceRange: {
      minValue: number | null;
      maxValue: number | null;
      unit: string | null;
    };
    analysedResult: string | number | null;
    acemQcResult: string;
    status: string | null;
  }>;
  certificates: RawMaterialCertificateApiPayload[];
};

export type RawMaterialLotListRequest = {
  subDepartmentId: number;
  page: number;
  limit: number;
  status?: string[];
  materialCode?: string[];
  manufacturerName?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
};

export function normalizeRawMaterialLotListRequest(
  payload: RawMaterialLotListRequest,
): RawMaterialLotListRequest {
  if (!payload.status?.length) {
    return payload;
  }

  return {
    ...payload,
    status: payload.status.map(toRawMaterialLotListApiStatus),
  };
}

export type RawMaterialLotListPagination = {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
};

export type RawMaterialLotListData = {
  statusCounts: Record<string, number>;
  lots: RawMaterialLotListRow[];
  pagination: RawMaterialLotListPagination;
};

export class RawMaterialProcurementSubmitResponseModel {
  formId: string;
  batchId: string;
  sourcingId: string;
  lotId: string;
  status: string;

  constructor(payload: {
    formId?: string;
    batchId?: string;
    sourcingId?: string;
    lotId?: string;
    status?: string;
  }) {
    this.formId = String(payload.formId ?? "").trim();
    this.lotId = String(payload.lotId ?? "").trim();
    // Create/update may return formId as the sourcing id; accept either field.
    this.sourcingId = String(payload.sourcingId ?? payload.formId ?? "").trim();
    this.batchId = String(payload.batchId ?? payload.lotId ?? "").trim();
    this.status = String(payload.status ?? "").trim();
  }

  static fromApi(apiResponse: any): RawMaterialProcurementSubmitResponseModel {
    return new RawMaterialProcurementSubmitResponseModel(apiResponse?.data ?? {});
  }
}
export function normalizeRawMaterialStatus(status: string): OperationStatus {
  const u = String(status ?? "").toUpperCase();

  const map: Record<string, OperationStatus> = {
    TO_BE_INITIATED: OPERATION_STATUS.TO_BE_INITIATED,
    INITIATED: OPERATION_STATUS.TO_BE_INITIATED,
    IN_PROGRESS: OPERATION_STATUS.IN_PROGRESS,
    WAITING_FOR_APPROVAL: OPERATION_STATUS.WAITING_FOR_APPROVAL,
    APPROVED: OPERATION_STATUS.APPROVED,
    REJECTED: OPERATION_STATUS.REJECTED,
  };

  const fromApiKey = map[u];
  if (fromApiKey) return fromApiKey;

  const trimmed = String(status ?? "").trim();

  if (OPERATION_STATUS_VALUES.includes(trimmed as OperationStatus)) {
    return trimmed as OperationStatus;
  }

  return OPERATION_STATUS.TO_BE_INITIATED;
}
/** Legacy batch-style details (multi-material) — kept for approver until migrated */
export class RawMaterialProcurementDetailsModel {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  materials: Array<{
    materialCode: string;
    lotNo: string;
    specifications: Array<{
      specificationCode: string;
      specificationName: string;
      referenceRange: {
        minValue: number | null;
        maxValue: number | null;
        unit: string | null;
      };
      analysedResult: string | number | null;
      acemQcResult: string;
      status: string | null;
    }>;
  }>;

  constructor(payload: any) {
    this.formId = payload?.formId ?? "";
    this.batchId = payload?.batchId ?? "";
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.materials = Array.isArray(payload?.materials) ? payload.materials : [];
  }

  static fromApi(apiResponse: any): RawMaterialProcurementDetailsModel {
    return new RawMaterialProcurementDetailsModel(apiResponse?.data ?? {});
  }

  static toMaterialBlocks(model: RawMaterialProcurementDetailsModel): MaterialBlock[] {
    return model.materials.map((material) => ({
      material: material.materialCode,
      lotNo: material.lotNo ?? "",
      rows: (material.specifications ?? []).map((spec) => {
        const referenceRange = parseApiReferenceRange(spec.referenceRange);
        const analysedResult = parseApiAnalysedResultDisplay(
          spec.analysedResult as ApiNumericValue,
        );
        const status = spec.status ?? null;
        return normalizeSpecRowQualityState({
          specificationCode: spec.specificationCode,
          specification: spec.specificationName,
          specificationName: spec.specificationName,
          refRange: formatReferenceRangeLabel(referenceRange),
          analysedResult,
          acemQcResult: String(spec.acemQcResult ?? "").trim(),
          status,
          isOutOfRange:
            String(status ?? "")
              .trim()
              .toLowerCase() === "failed" || computeIsOutOfRange(analysedResult, referenceRange),
          referenceRange,
        });
      }),
    }));
  }
}

/** Single-lot POST …/form/details response */
export class RawMaterialLotDetailsModel {
  lotId: string;
  submissionType: string;
  subDepartmentId: number;
  supplyOrderNo: string;
  receiptDate: string;
  manufacturerName: string;
  materialCode: string;
  grade: string | null;
  specifications: Array<{
    specificationCode: string;
    specificationName: string;
    referenceRange: {
      minValue: number | null;
      maxValue: number | null;
      unit: string | null;
    };
    analysedResult: string | number | null;
    acemQcResult: string;
    status: string | null;
  }>;
  certificates: LotCertificate[];
  progressInsights?: Record<string, unknown>;
  qualityInsights?: Record<string, unknown>;
  workflowInsights?: {
    currentStatus?: string;
    rejectionReason?: string | null;
    approvalPending?: boolean;
    reworkRequired?: boolean;
    resubmissionCount?: number;
  };

  constructor(payload: any) {
    this.lotId = payload?.lotId ?? "";
    this.submissionType = payload?.submissionType ?? "";
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.supplyOrderNo = payload?.supplyOrderNo ?? "";
    this.receiptDate = payload?.receiptDate ?? "";
    this.manufacturerName = payload?.manufacturerName ?? "";
    this.materialCode = payload?.materialCode ?? "";
    this.grade = resolveGradeCode(payload?.grade);
    this.specifications = Array.isArray(payload?.specifications) ? payload.specifications : [];
    this.certificates = Array.isArray(payload?.certificates)
      ? payload.certificates.map(normalizeLotCertificate)
      : [];
    this.progressInsights = payload?.progressInsights;
    this.qualityInsights = payload?.qualityInsights;
    this.workflowInsights = payload?.workflowInsights;
  }

  static fromApi(apiResponse: any): RawMaterialLotDetailsModel {
    return new RawMaterialLotDetailsModel(apiResponse?.data ?? {});
  }

  static toMaterialBlocks(model: RawMaterialLotDetailsModel): MaterialBlock[] {
    return [
      {
        material: model.materialCode,
        ...(model.grade ? { gradeCode: model.grade } : {}),
        lotNo: model.lotId,
        supplyOrderNo: model.supplyOrderNo,
        receiptDate: model.receiptDate,
        manufacturerName: model.manufacturerName,
        certificates: [...(model.certificates ?? [])],
        rows: (model.specifications ?? []).map((spec) => {
          const referenceRange = parseApiReferenceRange(spec.referenceRange);
          const analysedResult = parseApiAnalysedResultDisplay(
            spec.analysedResult as ApiNumericValue,
          );
          const status = spec.status ?? null;
          return normalizeSpecRowQualityState({
            specificationCode: spec.specificationCode,
            specification: spec.specificationName,
            specificationName: spec.specificationName,
            refRange: formatReferenceRangeLabel(referenceRange),
            analysedResult,
            acemQcResult: String(spec.acemQcResult ?? "").trim(),
            status,
            isOutOfRange:
              String(status ?? "")
                .trim()
                .toLowerCase() === "failed" || computeIsOutOfRange(analysedResult, referenceRange),
            referenceRange,
          });
        }),
      },
    ];
  }
}

function parseLotListGrade(raw: unknown): RawMaterialLotListGrade | null {
  if (!raw || typeof raw !== "object") return null;
  const grade = raw as Record<string, unknown>;
  const gradeCode = String(grade.gradeCode ?? "").trim();
  if (!gradeCode) return null;
  return {
    gradeId: Number(grade.gradeId ?? 0),
    gradeCode,
    gradeName: String(grade.gradeName ?? gradeCode).trim(),
  };
}

/** Normalize API grade field (`"COARSE"` | `{ gradeCode }` | null) to a grade code string. */
export function resolveGradeCode(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === "[object Object]") return null;
    return trimmed;
  }
  if (typeof raw === "object") {
    const parsed = parseLotListGrade(raw);
    return parsed?.gradeCode ?? null;
  }
  return null;
}

export function mapLotListApiRow(lot: any, index: number): RawMaterialLotListRow {
  const lotId = String(lot?.lotId ?? "");
  const id = lotId ? simpleHash(lotId) : index;
  const statusRaw = String(lot?.status ?? "");
  const rmStatus = normalizeRawMaterialLotListStatus(statusRaw);
  // Live API returns sourcingId (nullable); keep procurementId as a legacy fallback.
  const sourcingId = String(lot?.sourcingId ?? lot?.procurementId ?? "").trim();
  const grade = parseLotListGrade(lot?.grade);
  return {
    id,
    lotId,
    sourcingId,
    materialCode: String(lot?.materialCode ?? lot?.material ?? "").trim(),
    materialName: String(lot?.materialName ?? grade?.gradeName ?? "").trim(),
    grade,
    supplyOrderNo: String(lot?.supplyOrderNo ?? ""),
    receiptDate: String(lot?.receiptDate ?? ""),
    manufacturerName: String(lot?.manufacturerName ?? ""),
    status: statusRaw,
    rmStatus,
    createdBy: lot?.createdBy ?? null,
    createdOn: String(lot?.createdOn ?? ""),
    formId: lot?.formId ?? null,
  };
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function lotListRowToFormBatch(
  row: RawMaterialLotListRow,
  draftData: MaterialBlock[],
): RawMaterialFormBatch {
  return {
    id: row.id,
    lotId: row.lotId,
    sourcingId: row.sourcingId || null,
    formId: row.formId ?? null,
    batchId: row.sourcingId || row.lotId,
    batchType: row.materialName || row.materialCode,
    motorId: row.materialCode,
    motorType: row.materialName,
    priority: "Medium",
    assignedTo: row.createdBy ? { fullName: row.createdBy.fullName } : null,
    createdOn: row.createdOn,
    rmStatus: row.rmStatus as SourcingStatus,
    draftData,
    rejectionReason: null,
  };
}

export function createEmptyFormBatch(): RawMaterialFormBatch {
  return {
    id: "new",
    lotId: null,
    sourcingId: null,
    formId: null,
    batchId: "—",
    batchType: "",
    motorId: "—",
    motorType: "",
    priority: "Medium",
    assignedTo: null,
    createdOn: new Date().toISOString(),
    rmStatus: OPERATION_STATUS.TO_BE_INITIATED,
    draftData: [],
    rejectionReason: null,
  };
}

export function newCertificateLocalId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `cert-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const decodeStoredFileName = (name: string): string => {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return "";
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
};

/** Human-readable certificate file name for lot details and previews. */
export function resolveLotCertificateDisplayFileName(
  cert: Pick<LotCertificate, "fileName" | "fileUrl" | "fileId">,
): string {
  const fileId = String(cert.fileId ?? "").trim();
  const apiName = decodeStoredFileName(cert.fileName ?? "");
  const looksLikeStorageKey =
    !apiName ||
    apiName === fileId ||
    apiName.startsWith("FILE_") ||
    /^FILE_[0-9a-f-]{36}_/i.test(apiName);

  if (!looksLikeStorageKey) {
    return apiName;
  }

  const fromUrl = decodeStoredFileName(String(cert.fileUrl ?? "").split(/[/\\]/).pop() ?? "");
  if (fromUrl) {
    if (fileId && fromUrl.startsWith(`${fileId}_`)) {
      const trimmed = fromUrl.slice(fileId.length + 1).trim();
      if (trimmed) return trimmed;
    }
    const prefixed = fromUrl.match(/^FILE_[0-9a-f-]{36}_(.+)$/i);
    if (prefixed?.[1]?.trim()) {
      return prefixed[1].trim();
    }
    if (fromUrl !== fileId) return fromUrl;
  }

  return apiName || "Document";
}

export function normalizeLotCertificate(raw: unknown): LotCertificate {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const fileId = String(source.fileId ?? "").trim() || null;
  const fileUrl = String(source.fileUrl ?? "").trim();
  const fileName = resolveLotCertificateDisplayFileName({
    fileName: String(source.fileName ?? "").trim(),
    fileUrl,
    fileId,
  });
  return {
    localId: String(source.localId ?? "").trim() || newCertificateLocalId(),
    fileId,
    fileName,
    fileUrl: /^blob:/i.test(fileUrl) ? "" : fileUrl,
    mimeType: String(source.mimeType ?? "").trim() || "application/octet-stream",
    certificateType: String(source.certificateType ?? "").trim(),
    file: null,
    status: fileId ? "uploaded" : undefined,
    isTemp: false,
  };
}

export function isCertificateUploadIncomplete(cert: LotCertificate): boolean {
  return cert.status === "uploading" || cert.status === "failed";
}

export function hasIncompleteCertificateUploads(
  blocks: Array<{ certificates?: LotCertificate[] }>,
): boolean {
  return (blocks ?? []).some((block) =>
    (block.certificates ?? []).some(isCertificateUploadIncomplete),
  );
}

export function mapCertificateToApiPayload(
  cert: LotCertificate,
): RawMaterialCertificateApiPayload | null {
  if (isCertificateUploadIncomplete(cert)) return null;
  const fileId = String(cert.fileId ?? "").trim();
  if (!fileId) return null;
  return {
    fileId,
    certificateType: String(cert.certificateType ?? "").trim(),
  };
}

function mapCertificatesForApi(certs: LotCertificate[] | undefined): RawMaterialCertificateApiPayload[] {
  return (certs ?? [])
    .map(mapCertificateToApiPayload)
    .filter((item): item is RawMaterialCertificateApiPayload => item != null);
}

function mapLotBlockToCreatePayload(lot: MaterialLotBlock): RawMaterialLotCreatePayload {
  return {
    lotId: (lot.lotNo ?? "").trim(),
    specifications: (lot.rows ?? [])
      .filter((row) => (row.specificationCode ?? "").trim())
      .map((row) => ({
        specificationCode: (row.specificationCode ?? "").trim(),
        analysedResult: mapAnalysedResultForApi(row),
        isOutOfRange: Boolean(row.isOutOfRange),
        acemQcResult: row.acemQcResult ?? "",
      })),
    certificates: mapCertificatesForApi(lot.certificates),
  };
}

export function mapMaterialGroupsToCreateMaterials(
  groups: MaterialFormGroup[],
): RawMaterialMaterialCreatePayload[] {
  return (groups ?? [])
    .filter((g) => (g.material ?? "").trim())
    .map((group) => ({
      materialCode: group.material.trim(),
      grade: resolveGradeCode(group.gradeCode),
      supplyOrderNo: (group.supplyOrderNo ?? "").trim(),
      receiptDate: (group.receiptDate ?? "").trim(),
      manufacturerName: (group.manufacturerName ?? "").trim(),
      lots: (group.lots ?? []).map(mapLotBlockToCreatePayload),
    }));
}

export function mapBlocksToCreateMaterials(
  blocks: MaterialBlock[],
): RawMaterialMaterialCreatePayload[] {
  return mapMaterialGroupsToCreateMaterials(groupBlocksToMaterialGroups(blocks));
}

export function mapFirstBlockToLotUpdatePayload(
  block: MaterialBlock,
  lotId: string,
  subDepartmentId: number,
  submissionType: "DRAFT" | "UPDATE",
): RawMaterialLotUpdatePayload {
  return {
    lotId,
    submissionType,
    subDepartmentId,
    supplyOrderNo: (block.supplyOrderNo ?? "").trim(),
    receiptDate: (block.receiptDate ?? "").trim(),
    manufacturerName: (block.manufacturerName ?? "").trim(),
    materialCode: (block.material ?? "").trim(),
    grade: resolveGradeCode(block.gradeCode),
    specifications: (block.rows ?? [])
      .filter((row) => (row.specificationCode ?? "").trim())
      .map((row) => ({
        specificationCode: (row.specificationCode ?? "").trim(),
        specificationName: (row.specificationName ?? row.specification ?? "").trim(),
        referenceRange: {
          minValue: row.referenceRange?.minValue ?? null,
          maxValue: row.referenceRange?.maxValue ?? null,
          unit: row.referenceRange?.unit ?? null,
        },
        analysedResult: mapAnalysedResultForApi(row),
        acemQcResult: row.acemQcResult ?? "",
        status: null,
      })),
    certificates: mapCertificatesForApi(block.certificates),
  };
}

/** @deprecated legacy flat shape — use mapBlocksToCreateMaterials */
export const mapBlocksToMaterialsPayload = (blocks: MaterialBlock[]) => {
  return (blocks ?? []).map((block) => ({
    materialCode: block.material,
    lotNo: block.lotNo ?? "",
    specifications: (block.rows ?? []).map((row) => ({
      specificationCode: row.specificationCode ?? "",
      analysedResult: mapAnalysedResultForApi(row),
      acemQcResult: row.acemQcResult ?? "",
    })),
  }));
};
