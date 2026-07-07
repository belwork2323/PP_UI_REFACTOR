import {
  OPERATION_STATUS,
  OPERATION_STATUS_UI_TO_API,
  toOperationStatusApiValue,
  type OperationStatus,
} from "../../../hooks/operationStatus";

/** Re-export for sourcing pages that previously imported from sourcingWorkflowData */
export const SOURCING_STATUS = OPERATION_STATUS;
export type SourcingStatus = (typeof OPERATION_STATUS)[keyof typeof OPERATION_STATUS];

const OPERATION_STATUS_VALUES = Object.values(OPERATION_STATUS) as OperationStatus[];

/** API status enum → UI status labels */
export function normalizeRawMaterialLotListStatus(status: string): OperationStatus {
  const u = String(status ?? "").toUpperCase();
  const map: Record<string, OperationStatus> = {
    INITIATED: OPERATION_STATUS.INITIATED,
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
  return OPERATION_STATUS.INITIATED;
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

export type LotCertificate = {
  fileName: string;
  fileUrl: string;
  certificateType: string;
  /** Local file pending upload (casing-aligned; not sent in JSON payload). */
  file?: File | null;
};

export type SpecRow = {
  specificationCode?: string;
  specification: string;
  specificationName?: string;
  refRange: string;
  analysedResult: string;
  remarks: string;
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
    | undefined
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

export function isSpecRowFailed(row: Pick<SpecRow, "status" | "isOutOfRange">): boolean {
  if (String(row.status ?? "").trim().toLowerCase() === "failed") return true;
  return Boolean(row.isOutOfRange);
}

/** UI label for specification row status (API may return "failed" for out-of-range values). */
export function formatSpecStatusDisplayLabel(
  status: string | null | undefined,
  isOutOfRange?: boolean
): string | null {
  if (isOutOfRange || String(status ?? "").trim().toLowerCase() === "failed") {
    return "Out of Range";
  }
  const trimmed = String(status ?? "").trim();
  return trimmed || null;
}

export type MaterialBlock = {
  material: string;
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

export function computeIsOutOfRange(
  analysedResult: string,
  referenceRange?: ReferenceRangeShape
): boolean {
  const trimmed = String(analysedResult ?? "").trim();
  if (!trimmed || !referenceRange) return false;
  const value = Number(trimmed);
  if (Number.isNaN(value)) return false;
  const { minValue, maxValue } = referenceRange;
  if (minValue != null && value < minValue) return true;
  if (maxValue != null && value > maxValue) return true;
  return false;
}

/** Stable JSON for dirty-check / snapshots (File → name only). */
export function serializeMaterialBlocks(blocks: MaterialBlock[]): string {
  return JSON.stringify(blocks ?? [], (_key, value) => {
    if (value instanceof File) return value.name;
    return value;
  });
}

export function flattenMaterialGroups(groups: MaterialFormGroup[]): MaterialBlock[] {
  return (groups ?? []).flatMap((group) =>
    (group.lots ?? []).map((lot) => ({
      material: group.material,
      lotNo: lot.lotNo,
      supplyOrderNo: group.supplyOrderNo,
      receiptDate: group.receiptDate,
      manufacturerName: group.manufacturerName,
      certificates: lot.certificates ?? [],
      rows: lot.rows ?? [],
    }))
  );
}

export function groupBlocksToMaterialGroups(blocks: MaterialBlock[]): MaterialFormGroup[] {
  const byMaterial = new Map<string, MaterialBlock[]>();
  for (const block of blocks ?? []) {
    const code = (block.material ?? "").trim();
    if (!code) continue;
    if (!byMaterial.has(code)) byMaterial.set(code, []);
    byMaterial.get(code)!.push(block);
  }

  return Array.from(byMaterial.entries()).map(([material, group]) => {
    const head = group[0];
    return {
      material,
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
  "procurementId",
  "materialCode",
  "materialName",
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
    row.procurementId,
    row.materialCode,
    row.materialName,
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
        d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
      );
    }
  }

  return parts.some((part) => String(part).toLowerCase().includes(q));
}

/** List row from POST …/lot-list */
export type RawMaterialLotListRow = {
  id: string | number;
  lotId: string;
  procurementId: string;
  materialCode: string;
  materialName: string;
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
  procurementId: string;
  materialCode: string;
  materialName: string;
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
  procurementId: string | null;
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
  analysedResult: number | null;
  isOutOfRange: boolean;
  remarks: string;
};

export type RawMaterialLotCreatePayload = {
  lotId: string;
  specifications: RawMaterialLotSpecificationPayload[];
  certificates: LotCertificate[];
};

export type RawMaterialMaterialCreatePayload = {
  materialCode: string;
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
  specifications: Array<{
    specificationCode: string;
    specificationName: string;
    referenceRange: {
      minValue: number | null;
      maxValue: number | null;
      unit: string | null;
    };
    analysedResult: number | null;
    remarks: string;
    status: string | null;
  }>;
  certificates: LotCertificate[];
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
  procurementId: string;
  status: string;

  constructor(payload: { formId?: string; batchId?: string; procurementId?: string; status?: string }) {
    this.formId = payload.formId ?? "";
    this.batchId = payload.batchId ?? "";
    this.procurementId = payload.procurementId ?? "";
    this.status = payload.status ?? "";
  }

  static fromApi(apiResponse: any): RawMaterialProcurementSubmitResponseModel {
    return new RawMaterialProcurementSubmitResponseModel(apiResponse?.data ?? {});
  }
}
export function normalizeRawMaterialStatus(status: string): OperationStatus {
  const u = String(status ?? "").toUpperCase();

  const map: Record<string, OperationStatus> = {
    INITIATED: OPERATION_STATUS.INITIATED,
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

  return OPERATION_STATUS.INITIATED;
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
      analysedResult: number | null;
      remarks: string;
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
        const analysedResult = parseApiAnalysedResultDisplay(spec.analysedResult as ApiNumericValue);
        const status = spec.status ?? null;
        return {
          specificationCode: spec.specificationCode,
          specification: spec.specificationName,
          specificationName: spec.specificationName,
          refRange: formatReferenceRangeLabel(referenceRange),
          analysedResult,
          remarks: spec.remarks ?? "",
          status,
          isOutOfRange:
            String(status ?? "").trim().toLowerCase() === "failed" ||
            computeIsOutOfRange(analysedResult, referenceRange),
          referenceRange,
        };
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
  specifications: Array<{
    specificationCode: string;
    specificationName: string;
    referenceRange: {
      minValue: number | null;
      maxValue: number | null;
      unit: string | null;
    };
    analysedResult: number | null;
    remarks: string;
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
    this.specifications = Array.isArray(payload?.specifications) ? payload.specifications : [];
    this.certificates = Array.isArray(payload?.certificates) ? payload.certificates : [];
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
        lotNo: model.lotId,
        supplyOrderNo: model.supplyOrderNo,
        receiptDate: model.receiptDate,
        manufacturerName: model.manufacturerName,
        certificates: [...(model.certificates ?? [])],
        rows: (model.specifications ?? []).map((spec) => {
          const referenceRange = parseApiReferenceRange(spec.referenceRange);
          const analysedResult = parseApiAnalysedResultDisplay(spec.analysedResult as ApiNumericValue);
          const status = spec.status ?? null;
          return {
            specificationCode: spec.specificationCode,
            specification: spec.specificationName,
            specificationName: spec.specificationName,
            refRange: formatReferenceRangeLabel(referenceRange),
            analysedResult,
            remarks: spec.remarks ?? "",
            status,
            isOutOfRange:
              String(status ?? "").trim().toLowerCase() === "failed" ||
              computeIsOutOfRange(analysedResult, referenceRange),
            referenceRange,
          };
        }),
      },
    ];
  }
}

export function mapLotListApiRow(lot: any, index: number): RawMaterialLotListRow {
  const lotId = String(lot?.lotId ?? "");
  const id = lotId ? simpleHash(lotId) : index;
  const statusRaw = String(lot?.status ?? "");
  const rmStatus = normalizeRawMaterialLotListStatus(statusRaw);
  return {
    id,
    lotId,
    procurementId: String(lot?.procurementId ?? ""),
    materialCode: String(lot?.materialCode ?? lot?.material ?? "").trim(),
    materialName: String(lot?.materialName ?? ""),
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

export function lotListRowToFormBatch(row: RawMaterialLotListRow, draftData: MaterialBlock[]): RawMaterialFormBatch {
  return {
    id: row.id,
    lotId: row.lotId,
    procurementId: row.procurementId,
    formId: row.formId ?? null,
    batchId: row.procurementId || row.lotId,
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
    procurementId: null,
    formId: null,
    batchId: "—",
    batchType: "",
    motorId: "—",
    motorType: "",
    priority: "Medium",
    assignedTo: null,
    createdOn: new Date().toISOString(),
    rmStatus: OPERATION_STATUS.INITIATED,
    draftData: [],
    rejectionReason: null,
  };
}

/**
 * Legacy placeholder when neither https URL nor pending-upload marker applies.
 * Backend contract: accept `pending-upload://` refs (same as rocket motor casing reportUpload)
 * or provide a dedicated multipart upload endpoint — see fileToCertificateApiRef.
 */
export const RAW_MATERIAL_CERTIFICATE_PLACEHOLDER_FILE_URL =
  "https://example.invalid/raw-material-procurement/certificate-upload-pending";

/** Casing-aligned pending marker for new local files in create/update payloads. */
export function pendingCertificateUploadUrl(fileName: string): string {
  return `pending-upload://${encodeURIComponent(String(fileName ?? "file").trim() || "file")}`;
}

export function certificateFileUrlForApi(cert: LotCertificate): string {
  const url = String(cert.fileUrl ?? "").trim();
  if (/^https?:\/\//i.test(url)) return url;
  if (/^pending-upload:\/\//i.test(url)) return url;
  if (cert.file) return pendingCertificateUploadUrl(cert.file.name || cert.fileName);
  if (/^blob:/i.test(url) && cert.fileName) {
    return pendingCertificateUploadUrl(cert.fileName);
  }
  return RAW_MATERIAL_CERTIFICATE_PLACEHOLDER_FILE_URL;
}

function mapLotBlockToCreatePayload(lot: MaterialLotBlock): RawMaterialLotCreatePayload {
  return {
    lotId: (lot.lotNo ?? "").trim(),
    specifications: (lot.rows ?? [])
      .filter((row) => (row.specificationCode ?? "").trim())
      .map((row) => ({
        specificationCode: (row.specificationCode ?? "").trim(),
        analysedResult:
          row.analysedResult === "" || row.analysedResult === null || row.analysedResult === undefined
            ? null
            : Number(row.analysedResult),
        isOutOfRange: Boolean(row.isOutOfRange),
        remarks: row.remarks ?? "",
      })),
    certificates: (lot.certificates ?? [])
      .filter(
        (c) =>
          String(c.fileUrl ?? "").trim().length > 0 ||
          String(c.fileName ?? "").trim().length > 0 ||
          String(c.certificateType ?? "").trim().length > 0
      )
      .map((c) => ({
        fileName: String(c.fileName ?? "").trim(),
        certificateType: String(c.certificateType ?? "").trim(),
        fileUrl: certificateFileUrlForApi(c),
      })),
  };
}

export function mapMaterialGroupsToCreateMaterials(
  groups: MaterialFormGroup[]
): RawMaterialMaterialCreatePayload[] {
  return (groups ?? [])
    .filter((g) => (g.material ?? "").trim())
    .map((group) => ({
      materialCode: group.material.trim(),
      supplyOrderNo: (group.supplyOrderNo ?? "").trim(),
      receiptDate: (group.receiptDate ?? "").trim(),
      manufacturerName: (group.manufacturerName ?? "").trim(),
      lots: (group.lots ?? []).map(mapLotBlockToCreatePayload),
    }));
}

export function mapBlocksToCreateMaterials(blocks: MaterialBlock[]): RawMaterialMaterialCreatePayload[] {
  return mapMaterialGroupsToCreateMaterials(groupBlocksToMaterialGroups(blocks));
}

export function mapFirstBlockToLotUpdatePayload(
  block: MaterialBlock,
  lotId: string,
  subDepartmentId: number,
  submissionType: "DRAFT" | "UPDATE"
): RawMaterialLotUpdatePayload {
  return {
    lotId,
    submissionType,
    subDepartmentId,
    supplyOrderNo: (block.supplyOrderNo ?? "").trim(),
    receiptDate: (block.receiptDate ?? "").trim(),
    manufacturerName: (block.manufacturerName ?? "").trim(),
    materialCode: (block.material ?? "").trim(),
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
        analysedResult:
          row.analysedResult === "" || row.analysedResult === null || row.analysedResult === undefined
            ? null
            : Number(row.analysedResult),
        remarks: row.remarks ?? "",
        status: null,
      })),
    certificates: (block.certificates ?? [])
      .filter(
        (c) =>
          String(c.fileUrl ?? "").trim().length > 0 ||
          String(c.fileName ?? "").trim().length > 0 ||
          String(c.certificateType ?? "").trim().length > 0
      )
      .map((c) => ({
        fileName: String(c.fileName ?? "").trim(),
        certificateType: String(c.certificateType ?? "").trim(),
        fileUrl: certificateFileUrlForApi(c),
      })),
  };
}

/** @deprecated legacy flat shape — use mapBlocksToCreateMaterials */
export const mapBlocksToMaterialsPayload = (blocks: MaterialBlock[]) => {
  return (blocks ?? []).map((block) => ({
    materialCode: block.material,
    lotNo: block.lotNo ?? "",
    specifications: (block.rows ?? []).map((row) => ({
      specificationCode: row.specificationCode ?? "",
      analysedResult:
        row.analysedResult === "" || row.analysedResult === null || row.analysedResult === undefined
          ? null
          : Number(row.analysedResult),
      remarks: row.remarks ?? "",
    })),
  }));
};
