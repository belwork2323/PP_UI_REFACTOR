/* ─────────────────────────────────────────────────────────────────────────────
   BATCH MANAGEMENT MODELS
   Aligned to admin batch API request / response contracts (list, details, create, update).
───────────────────────────────────────────────────────────────────────────── */

import { icons } from "@app/theme/icons";
import type { MaterialsListGrade, MaterialsListItem } from "../../user/MaterialsListModel";
import type { RawMaterialLotListRow } from "../../user/RawMaterialProcurementModel";
import { formatToIsoDateInput, formatToUiDate } from "../../../../utils/dateUtils";

/** Map display / list labels to form/API enum values */
function normalizeBatchTypeForForm(raw: string | undefined | null): string {
  if (!raw) return "MAIN";
  const s = String(raw).trim();
  const u = s.toUpperCase();
  if (u === "MAIN" || u.includes("MAIN")) return "MAIN";
  if (u === "SUBSCALE" || u.includes("SUBSCALE")) return "SUBSCALE";
  return s;
}

/** API motorStage may be a number (0, 1) or stage letter ("B") */
export function normalizeMotorStage(raw: unknown): string | number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed === "") return null;
    const asNumber = Number(trimmed);
    return Number.isFinite(asNumber) && String(asNumber) === trimmed ? asNumber : trimmed;
  }
  if (typeof raw === "object") {
    const obj = raw as { motorStage?: unknown; motorTypeName?: string };
    if (obj.motorStage !== undefined && obj.motorStage !== null) {
      return normalizeMotorStage(obj.motorStage);
    }
    if (obj.motorTypeName) return String(obj.motorTypeName).trim();
  }
  return String(raw);
}

/** Coerce form motor stage to API value (numeric when applicable) */
export function motorStageForApi(raw: unknown): string | number | undefined {
  const normalized = normalizeMotorStage(raw);
  if (normalized === null) return undefined;
  return normalized;
}

export function motorStageLabel(stage: string | number | null | undefined): string {
  if (stage === null || stage === undefined || stage === "") return "—";
  const value = String(stage).trim();
  if (!value) return "—";
  if (/^stage\s/i.test(value)) return value;
  return `Stage ${value}`;
}

export type MixingCycleInfo = {
  mixingCycleId: number | null;
  mixingCycleCode: string;
  mixingCycleName: string;
  motorStage: number | null;
};

/** Parse details API mixingCycleCode (string or object) into a structured value. */
export function parseMixingCycleFromApi(raw: unknown): MixingCycleInfo | null {
  if (raw == null || raw === "") return null;

  if (typeof raw === "string") {
    const code = raw.trim();
    if (!code) return null;
    return {
      mixingCycleId: null,
      mixingCycleCode: code,
      mixingCycleName: code,
      motorStage: null,
    };
  }

  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const code = String(obj.mixingCycleCode ?? obj.code ?? "").trim();
    const name = String(obj.mixingCycleName ?? obj.name ?? code).trim();
    if (!code && !name) return null;
    const idRaw = obj.mixingCycleId ?? obj.id;
    const stageRaw = obj.motorStage;
    return {
      mixingCycleId:
        idRaw != null && idRaw !== "" && Number.isFinite(Number(idRaw)) ? Number(idRaw) : null,
      mixingCycleCode: code || name,
      mixingCycleName: name || code,
      motorStage:
        stageRaw != null && stageRaw !== "" && Number.isFinite(Number(stageRaw))
          ? Number(stageRaw)
          : null,
    };
  }

  return null;
}

export function mixingCycleCodeForApi(raw: unknown): string | undefined {
  if (raw == null || raw === "") return undefined;
  if (typeof raw === "string") {
    const code = raw.trim();
    return code || undefined;
  }
  if (typeof raw === "object") {
    const parsed = parseMixingCycleFromApi(raw);
    return parsed?.mixingCycleCode || undefined;
  }
  const code = String(raw).trim();
  return code || undefined;
}

export function mixingCycleLabel(cycle: MixingCycleInfo | string | null | undefined): string {
  if (cycle == null || cycle === "") return "—";
  if (typeof cycle === "string") return cycle.trim() || "—";
  const name = String(cycle.mixingCycleName ?? "").trim();
  const code = String(cycle.mixingCycleCode ?? "").trim();
  if (name && code && name !== code) return `${name} (${code})`;
  return name || code || "—";
}

/* ─────────────────────────────────────────────────────────────────────────────
   READ MODEL  —  BatchListItemModel
   Maps response.data.batches[] items and response.data.batch (details).

   List extras: projectName, lotIds, systemManager { id, name }, identificationSheetStatus
───────────────────────────────────────────────────────────────────────────── */
export class BatchListItemModel {
  id: string | null;
  batchId: string;
  batchType: string;
  subBatchType: string | null;

  projectId: string | null;
  /** Present on list API for display */
  projectName: string | null;
  numberOfMotors: number;
  motorIds: string[];
  lotIds: string[];
  motorStage: string | number | null;
  mixingCycle: MixingCycleInfo | null;
  priority: string;
  systemManagerId: string;
  systemManager: { id: string; name: string } | null;

  // Flattened stage / department fields for easy table access
  department: { departmentId: number | null; departmentName: string } | null;
  subDepartments: { subDepartmentId: number; subDepartmentName: string }[];

  status: string;
  createdOn: string | null;
  createdBy: { id: string; name: string } | null;
  updatedOn: string | null;
  updatedBy: { id: string; name: string } | null;

  /** List: "Draft" | "Completed" when provided */
  identificationSheetStatus: string | null;

  // Implementation details (optional)
  identificationSheet: IdentificationSheet | null;
  objective: string | null;
  articles: SubscaleArticleRead[];

  constructor(data: Record<string, any>) {
    this.id = data.id ?? null;
    this.batchId = data.batchId ?? "";
    this.batchType = normalizeBatchTypeForForm(data.batchType);
    this.subBatchType = data.subBatchType ?? null;
    this.projectId = data?.projectId ?? data.project?.projectId ?? null;
    this.projectName = data?.projectName ?? data.project?.projectName ?? null;
    this.numberOfMotors = data.numberOfMotors ?? 0;
    this.motorIds = Array.isArray(data.motorIds) ? data.motorIds : [];
    this.lotIds = Array.isArray(data.lotIds) ? data.lotIds : [];
    this.priority = data.priority ?? "Medium";
    this.status = String(data.status ?? "").trim();

    this.motorStage = normalizeMotorStage(data.motorStage ?? data.motorType ?? data.motorTypeName);
    this.mixingCycle = parseMixingCycleFromApi(data.mixingCycleCode ?? data.mixingCycle);

    if (data.systemManager && typeof data.systemManager === "object") {
      this.systemManager = {
        id: data.systemManager.id ?? "",
        name: data.systemManager.name ?? data.systemManager.fullName ?? "",
      };
      this.systemManagerId = this.systemManager.id;
    } else {
      this.systemManager = null;
      this.systemManagerId = String(data.systemManagerId ?? "").trim();
    }

    this.identificationSheetStatus =
      data.identificationSheetStatus ?? data.identification_sheet_status ?? null;

    // stage may be { department, subDepartments } or flat { departmentId, departmentName, subDepartments }
    const stageRoot = data.stage && typeof data.stage === "object" ? data.stage : null;
    const dept =
      stageRoot?.department && typeof stageRoot.department === "object"
        ? stageRoot.department
        : stageRoot?.departmentId != null || stageRoot?.departmentName
          ? stageRoot
          : null;

    this.department = dept
      ? { departmentId: dept.departmentId ?? null, departmentName: dept.departmentName ?? "" }
      : null;

    const nestedSubDepartments = Array.isArray(dept?.subDepartments)
      ? dept.subDepartments
      : Array.isArray(stageRoot?.subDepartments)
        ? stageRoot.subDepartments
        : Array.isArray(dept?.subDepartment)
          ? dept.subDepartment
          : [];

    this.subDepartments =
      nestedSubDepartments.length > 0
        ? nestedSubDepartments.map((sd: any) => ({
            subDepartmentId: sd.subDepartmentId,
            subDepartmentName: sd.subDepartmentName ?? "",
          }))
        : [];

    // Audit fields
    this.createdOn = data.createdOn ?? null;
    this.createdBy = data.createdBy
      ? { id: data.createdBy.id ?? "", name: data.createdBy.name ?? data.createdBy.fullName ?? "" }
      : null;

    // updatedOn / updatedBy only present in the detail endpoint response
    this.updatedOn = data.updatedOn ?? null;
    this.updatedBy = data.updatedBy
      ? {
          id: data.updatedBy.id ?? "",
          name: data.updatedBy.name ?? data.updatedBy.fullName ?? "",
        }
      : null;

    // Implementation details (optional)
    this.identificationSheet = data.identificationSheet
      ? parseIdentificationSheetFromApi(data.identificationSheet)
      : null;
    this.mixingCycle =
      data.mixingCycle && typeof data.mixingCycle === "object" ? data.mixingCycle : null;
    this.objective = data.objective ?? null;
    this.articles = Array.isArray(data.articles)
      ? data.articles.map((item: any) => {
          if (typeof item === "string") {
            return {
              subscaleArticleId: 0,
              subscaleArticleCode: item,
              subscaleArticleName: item,
            };
          }
          return {
            subscaleArticleId: Number(item?.subscaleArticleId ?? item?.id ?? 0) || 0,
            subscaleArticleCode: String(item?.subscaleArticleCode ?? item?.code ?? "").trim(),
            subscaleArticleName: String(
              item?.subscaleArticleName ?? item?.name ?? item?.subscaleArticleCode ?? "",
            ).trim(),
            isActive: item?.isActive !== false,
          };
        })
      : [];
  }

  static fromApi(data: Record<string, any>) {
    return new BatchListItemModel(data);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   IDENTIFICATION SHEET MODELS
───────────────────────────────────────────────────────────────────────────── */

/** UI / read model — may include display-only fields from lot lookup */
export interface MaterialItem {
  srNo: number;
  materialCode: string;
  materialName?: string;
  gradeCode?: string;
  gradeName?: string;
  lotId: string;
  make: string;
  manufacturerName?: string;
  requiredComposition: number;
  quantityPerPremix: number;
  revalidationFromDate?: string;
  revalidationToDate?: string;
  /** @deprecated Legacy single date — mapped to from/to when posting */
  revalidationDate?: string;
}

export interface IdentificationSheet {
  date: string;
  batchSize: number;
  bondingSheetNo: string;
  mixerType: string;
  BldgNo: string;
  numberOfPremix: number;
  remarks: string;
  materials: MaterialItem[];
  /** @deprecated Legacy field — read from API responses when mixerType absent */
  mixerDetails?: string;
  prcApprovalDate: string;
}

function serializeMaterialForApi(material: Record<string, any>): Record<string, unknown> {
  const fromDate = formatToIsoDateInput(
    material.revalidationFromDate ?? material.revalidationDate ?? "",
  );
  const toDate = formatToIsoDateInput(
    material.revalidationToDate ?? material.revalidationDate ?? fromDate,
  );

  return {
    srNo: material.srNo,
    materialCode: material.materialCode,
    lotId: material.lotId ?? "",
    make: String(material.make ?? material.manufacturerName ?? "").trim(),
    requiredComposition: material.requiredComposition ?? 0,
    quantityPerPremix: material.quantityPerPremix ?? 0,
    revalidationFromDate: fromDate,
    revalidationToDate: toDate,
    ...(String(material.gradeCode ?? "").trim()
      ? { gradeCode: String(material.gradeCode).trim() }
      : {}),
  };
}

/** Map form identification sheet to API request body */
export function serializeIdentificationSheetForApi(
  sheet: Record<string, any> | null | undefined,
): Record<string, unknown> {
  if (!sheet || typeof sheet !== "object") return {};

  const isDefaultEmpty =
    !sheet.date &&
    (!sheet.batchSize || sheet.batchSize === 0) &&
    !sheet.bondingSheetNo &&
    !sheet.mixerType &&
    !sheet.mixerDetails &&
    !sheet.BldgNo &&
    !sheet.bldgNo &&
    !sheet.prcApprovalDate &&
    (sheet.numberOfPremix === 1 || sheet.numberOfPremix == null) &&
    !sheet.remarks &&
    (!Array.isArray(sheet.materials) || sheet.materials.length === 0);

  if (isDefaultEmpty) return {};

  const payload: Record<string, unknown> = {
    date: formatToIsoDateInput(sheet.date ?? ""),
    batchSize: Number(sheet.batchSize) || 0,
    bondingSheetNo: sheet.bondingSheetNo ?? "",
    mixerType: String(sheet.mixerType ?? sheet.mixerDetails ?? "").trim(),
    BldgNo: String(sheet.BldgNo ?? sheet.bldgNo ?? "").trim(),
    numberOfPremix: sheet.numberOfPremix ?? 0,
    remarks: sheet.remarks ?? "",
    prcApprovalDate: formatToIsoDateInput(sheet.prcApprovalDate),
  };

  if (Array.isArray(sheet.materials)) {
    payload.materials =
      sheet.materials.length > 0 ? sheet.materials.map(serializeMaterialForApi) : [];
  }

  return payload;
}

/** Map API identification sheet to form state */
export function parseIdentificationSheetFromApi(
  sheet: Record<string, any> | null | undefined,
): IdentificationSheet {
  if (!sheet || typeof sheet !== "object") {
    return {
      date: "",
      batchSize: 0,
      bondingSheetNo: "",
      mixerType: "",
      BldgNo: "",
      numberOfPremix: 1,
      remarks: "",
      materials: [],
      prcApprovalDate: "",
    };
  }

  const materials = Array.isArray(sheet.materials)
    ? sheet.materials.map((m: Record<string, any>) => ({
        srNo: m.srNo ?? 0,
        materialCode: m.materialCode ?? "",
        materialName: m.materialName ?? "",
        gradeCode: String(m.gradeCode ?? m.grade?.gradeCode ?? "").trim() || undefined,
        gradeName: String(m.gradeName ?? m.grade?.gradeName ?? "").trim() || undefined,
        lotId: m.lotId ?? "",
        make: m.make ?? m.manufacturerName ?? "",
        manufacturerName: m.manufacturerName ?? m.make ?? "",
        requiredComposition: m.requiredComposition ?? 0,
        quantityPerPremix: m.quantityPerPremix ?? 0,
    revalidationFromDate: formatToUiDate(m.revalidationFromDate ?? m.revalidationDate ?? ""),
    revalidationToDate: formatToUiDate(m.revalidationToDate ?? m.revalidationDate ?? ""),
    revalidationDate: formatToUiDate(m.revalidationFromDate ?? m.revalidationDate ?? ""),
      }))
    : [];
  return {
    date: formatToUiDate(sheet.date ?? ""),
    batchSize: sheet.batchSize ?? 0,
    bondingSheetNo: sheet.bondingSheetNo ?? "",
    mixerType: sheet.mixerType ?? sheet.mixerDetails ?? "",
    BldgNo: sheet.BldgNo ?? sheet.bldgNo ?? "",
    numberOfPremix: sheet.numberOfPremix ?? 1,
    remarks: sheet.remarks ?? "",
    materials,
    prcApprovalDate: formatToUiDate(sheet.prcApprovalDate),
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   WRITE MODELS — CreateBatchPayload / UpdateBatchPayload
   Updated to support the new two-step batch creation workflow.
   Step 1: Create batch with basic details (identificationSheet is optional)
   Step 2: Update batch with implementation details (identificationSheet)
───────────────────────────────────────────────────────────────────────────── */

export interface BatchWritePayload {
  batchType: string;
  subBatchType?: string;
  projectId?: string | null;
  motorStage?: string | number;
  mixingCycleCode?: string;
  numberOfMotors?: number;
  motorIds?: string[];
  priority: string;
  systemManagerId: string;
  identificationSheet?: Record<string, unknown>;
  identificationSheetStatus?: string;
  objective?: string;
  articles?: SubscaleArticleWrite[];
}

/** Article object sent on batch create / update. */
export type SubscaleArticleWrite = {
  subscaleArticleId: number;
  subscaleArticleCode: string;
};

/** Article object returned from batch details / list. */
export type SubscaleArticleRead = SubscaleArticleWrite & {
  subscaleArticleName?: string;
  isActive?: boolean;
};

/** Normalize API / form articles into create-update payload shape. */
export function serializeArticlesForApi(articles: unknown): SubscaleArticleWrite[] {
  if (!Array.isArray(articles)) return [];

  return articles
    .map((item) => {
      if (item == null) return null;

      if (typeof item === "string") {
        const code = item.trim();
        return code ? { subscaleArticleId: 0, subscaleArticleCode: code } : null;
      }

      if (typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const code = String(row.subscaleArticleCode ?? row.code ?? "").trim();
      const id = Number(row.subscaleArticleId ?? row.id ?? 0);
      if (!code) return null;
      return {
        subscaleArticleId: Number.isFinite(id) ? id : 0,
        subscaleArticleCode: code,
      };
    })
    .filter((item): item is SubscaleArticleWrite => item != null && Boolean(item.subscaleArticleCode));
}

/** Map API articles into form selections (keeps id + code for write-back). */
export function parseArticlesFromApi(articles: unknown): SubscaleArticleWrite[] {
  return serializeArticlesForApi(articles).filter((item) => item.subscaleArticleCode);
}

/** Codes used by MultiSelect value binding. */
export function getArticleSelectionCodes(articles: unknown): string[] {
  return parseArticlesFromApi(articles).map((item) => item.subscaleArticleCode);
}

/** Display label for details / chips. */
export function formatArticlesForDisplay(articles: unknown): string {
  if (!Array.isArray(articles) || articles.length === 0) return "";

  return articles
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;
        return String(
          row.subscaleArticleName ?? row.subscaleArticleCode ?? row.name ?? row.code ?? "",
        ).trim();
      }
      return "";
    })
    .filter(Boolean)
    .join(", ");
}

/**
 * Build write articles from selected codes + master catalog.
 * Falls back to code-only entries when catalog is missing a match.
 */
export function buildArticlesFromSelection(
  selectedCodes: string[],
  catalog: Array<{ subscaleArticleId?: number; id?: number; subscaleArticleCode?: string; code?: string; value?: string }> = [],
): SubscaleArticleWrite[] {
  return selectedCodes
    .map((raw) => String(raw ?? "").trim())
    .filter(Boolean)
    .map((code) => {
      const match = catalog.find((item) => {
        const itemCode = String(item.subscaleArticleCode ?? item.code ?? item.value ?? "").trim();
        return itemCode === code;
      });
      return {
        subscaleArticleId: Number(match?.subscaleArticleId ?? match?.id ?? 0) || 0,
        subscaleArticleCode: code,
      };
    });
}

export const IDENTIFICATION_SHEET_STATUS = {
  DRAFT: "DRAFT",
  COMPLETED: "COMPLETED",
} as const;

export type IdentificationSheetStatus =
  (typeof IDENTIFICATION_SHEET_STATUS)[keyof typeof IDENTIFICATION_SHEET_STATUS];

/** Resolve sheet status for create/update payloads (prefer explicit form value). */
export function resolveIdentificationSheetStatus(
  form: Record<string, any>,
): IdentificationSheetStatus {
  const explicit = String(form.identificationSheetStatus ?? "")
    .trim()
    .toUpperCase();
  if (
    explicit === IDENTIFICATION_SHEET_STATUS.DRAFT ||
    explicit === IDENTIFICATION_SHEET_STATUS.COMPLETED
  ) {
    return explicit;
  }

  const materials = Array.isArray(form.identificationSheet?.materials)
    ? form.identificationSheet.materials
    : [];
  return materials.length > 0
    ? IDENTIFICATION_SHEET_STATUS.COMPLETED
    : IDENTIFICATION_SHEET_STATUS.DRAFT;
}

/**
 * Write model — used when POSTing a new batch (Step 1).
 * identificationSheet is optional in create API.
 * Controller builds this from raw form values.
 */
function applyBatchWriteFields(target: BatchWritePayload, form: Record<string, any>): void {
  target.batchType = form.batchType ?? "MAIN";
  target.subBatchType =
    target.batchType === "SUBSCALE" && form.subBatchType ? form.subBatchType : undefined;

  const isExperimental = target.batchType === "SUBSCALE" && form.subBatchType === "EXPERIMENTAL";

  if (isExperimental) {
    const raw = form.projectId;
    target.projectId = raw === "" || raw === undefined || raw === null ? null : String(raw).trim();
  } else {
    const raw = form.projectId;
    target.projectId =
      raw === "" || raw === undefined || raw === null ? undefined : String(raw).trim();
  }

  if (!isExperimental) {
    const stage = motorStageForApi(form.motorStage ?? form.motorType);
    if (stage !== undefined) target.motorStage = stage;

    const mixingCycleCode = mixingCycleCodeForApi(form.mixingCycleCode);
    if (mixingCycleCode) target.mixingCycleCode = mixingCycleCode;

    target.numberOfMotors = form.numberOfMotors ?? 0;
    target.motorIds = Array.isArray(form.motorIds)
      ? form.motorIds.filter((id: string) => String(id ?? "").trim())
      : form.motorIds
        ? [form.motorIds]
        : [];
  }

  target.priority = form.priority ?? "Medium";
  target.systemManagerId = String(form.systemManagerId ?? "").trim();

  if (form.identificationSheet !== undefined) {
    target.identificationSheet = serializeIdentificationSheetForApi(form.identificationSheet);
  }

  target.identificationSheetStatus = resolveIdentificationSheetStatus(form);

  if (form.objective?.trim()) target.objective = form.objective.trim();
  if (Array.isArray(form.articles) && form.articles.length > 0) {
    target.articles = serializeArticlesForApi(form.articles);
  }
}

export class CreateBatchPayload implements BatchWritePayload {
  batchType: string;
  subBatchType?: string;
  projectId?: string | null;
  motorStage?: string | number;
  mixingCycleCode?: string;
  numberOfMotors?: number;
  motorIds?: string[];
  priority: string;
  systemManagerId: string;
  identificationSheet?: Record<string, unknown>;
  identificationSheetStatus?: string;
  objective?: string;
  articles?: SubscaleArticleWrite[];

  constructor(form: Record<string, any>) {
    applyBatchWriteFields(this, form);
  }
}

/**
 * Write model — PUT /admin/batch/update (body includes batchId per API contract).
 */
export class UpdateBatchPayload implements BatchWritePayload {
  batchId: string;
  batchType: string;
  subBatchType?: string;
  projectId?: string | null;
  motorStage?: string | number;
  mixingCycleCode?: string;
  numberOfMotors?: number;
  motorIds?: string[];
  priority: string;
  systemManagerId: string;
  identificationSheet?: Record<string, unknown>;
  identificationSheetStatus?: string;
  objective?: string;
  articles?: SubscaleArticleWrite[];

  constructor(batchId: string, form: Record<string, any>) {
    this.batchId = String(batchId ?? "").trim();
    applyBatchWriteFields(this, form);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   BATCH STATISTICS MODEL
───────────────────────────────────────────────────────────────────────────── */

const STAT_CONFIG = {
  totalBatches: { label: "Total Batches", variant: "total", icon: icons.batchMgmt.batchIcon },
  inProgressBatches: {
    label: "In Progress",
    variant: "inProgress",
    icon: icons.batchMgmt.inProgressStatus,
  },
  completedBatches: {
    label: "Completed",
    variant: "completed",
    icon: icons.batchMgmt.completedStatus,
  },
  pendingApprovals: {
    label: "Pending Approvals",
    variant: "pending",
    icon: icons.batchMgmt.pendingStatus,
  },
  rejectedBatches: { label: "Rejected", variant: "rejected", icon: icons.batchMgmt.rejectedStatus },
};

export class BatchStatsModel {
  static fromStatsApi(apiResponse: any) {
    const { data } = apiResponse;
    if (!data) return [];

    return Object.entries(STAT_CONFIG).map(([apiKey, config]) => {
      const statData = (data as any)[apiKey] || { count: 0, subValue: 0 };

      return {
        label: config.label,
        value: BatchStatsModel.formatNumber(statData.count),
        rawValue: statData.count,
        subLabel:
          statData.subValue !== 0
            ? statData.subValue > 0
              ? `+${statData.subValue} this period`
              : `${statData.subValue} this period`
            : "",
        icon: config.icon,
        variant: config.variant,
      };
    });
  }

  static formatNumber(num: number): string {
    if (num === null || num === undefined) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   FORM STATE — hooks consume these; no mapper logic in hook files
───────────────────────────────────────────────────────────────────────────── */

export const ADMIN_RAW_MATERIAL_SUB_DEPARTMENT_ID = 1;

export type BatchMaterialOption = {
  materialCode: string;
  materialName: string;
  grades: MaterialsListGrade[];
};

export type BatchFormState = {
  batchType: string;
  subBatchType: string;
  projectId: string;
  motorStage: string;
  mixingCycleCode: string;
  numberOfMotors: number;
  motorIds: string[];
  priority: string;
  systemManagerId: string;
  objective: string;
  articles: SubscaleArticleWrite[];
  identificationSheet: IdentificationSheet;
  identificationSheetStatus: IdentificationSheetStatus;
};

export type ImplementationFormState = {
  identificationSheet: IdentificationSheet;
  objective: string;
  articles: SubscaleArticleWrite[];
};

const emptyIdentificationSheet = (): IdentificationSheet => ({
  date: "",
  batchSize: 0,
  bondingSheetNo: "",
  mixerType: "",
  BldgNo: "",
  numberOfPremix: 1,
  remarks: "",
  materials: [],
  prcApprovalDate: "",
});

export const createEmptyBatchFormState = (): BatchFormState => ({
  batchType: "",
  subBatchType: "",
  projectId: "",
  motorStage: "",
  mixingCycleCode: "",
  numberOfMotors: 0,
  motorIds: [],
  priority: "Medium",
  systemManagerId: "",
  objective: "",
  articles: [],
  identificationSheet: emptyIdentificationSheet(),
  identificationSheetStatus: IDENTIFICATION_SHEET_STATUS.DRAFT,
});

export const createEmptyImplementationFormState = (): ImplementationFormState => ({
  identificationSheet: emptyIdentificationSheet(),
  objective: "",
  articles: [],
});

export const normalizeMaterialCodeKey = (code: string | undefined | null): string =>
  String(code ?? "")
    .trim()
    .toUpperCase();

export const groupLotsByMaterialCode = (lots: RawMaterialLotListRow[]) => {
  const grouped: Record<string, RawMaterialLotListRow[]> = {};
  for (const lot of lots) {
    const code = normalizeMaterialCodeKey(lot.materialCode);
    if (!code) continue;
    if (!grouped[code]) grouped[code] = [];
    grouped[code].push(lot);
  }
  return grouped;
};

export const toBatchMaterialOptions = (items: MaterialsListItem[]): BatchMaterialOption[] =>
  items.map(({ materialCode, materialName, grades }) => ({
    materialCode,
    materialName,
    grades: Array.isArray(grades) ? grades : [],
  }));

export const mapBatchToFormState = (batch: any): BatchFormState => {
  const motorStageRaw = batch?.motorStage ?? batch?.motorType;
  const motorStage =
    motorStageRaw != null && motorStageRaw !== ""
      ? String(
          typeof motorStageRaw === "object"
            ? (motorStageRaw.motorTypeName ?? motorStageRaw.motorStage ?? "")
            : motorStageRaw,
        )
      : "";

  const mixingCycle =
    batch?.mixingCycle ?? parseMixingCycleFromApi(batch?.mixingCycleCode ?? batch?.mixingCycle);

  return {
    batchType: batch?.batchType ?? "MAIN",
    subBatchType: batch?.subBatchType ?? "",
    projectId: batch?.projectId ?? batch?.project?.projectId ?? "",
    motorStage,
    mixingCycleCode: mixingCycle?.mixingCycleCode ?? "",
    // Draft "how many to add" input — keep empty; actual count comes from motorIds.
    numberOfMotors: 0,
    motorIds: Array.isArray(batch?.motorIds) && batch.motorIds.length > 0 ? batch.motorIds : [""],
    priority: batch?.priority ?? "Medium",
    systemManagerId: batch?.systemManager?.id ?? batch?.systemManagerId ?? "",
    objective: batch?.objective ?? "",
    articles: parseArticlesFromApi(batch?.articles),
    identificationSheet: batch?.identificationSheet
      ? parseIdentificationSheetFromApi(batch.identificationSheet)
      : emptyIdentificationSheet(),
    identificationSheetStatus: resolveIdentificationSheetStatus(batch ?? {}),
  };
};

export const mapBatchToImplementationFormState = (batch: any): ImplementationFormState => ({
  identificationSheet: batch?.identificationSheet
    ? parseIdentificationSheetFromApi(batch.identificationSheet)
    : emptyIdentificationSheet(),
  objective: batch?.objective ?? "",
  articles: parseArticlesFromApi(batch?.articles),
});

const BATCH_ADDITIONAL_DETAIL_FIELDS = [
  "batchType",
  "subBatchType",
  "projectId",
  "motorStage",
  "mixingCycleCode",
  // numberOfMotors is only a draft "add count" input — real count is motorIds.length
  "motorIds",
  "priority",
  "systemManagerId",
  "objective",
  "articles",
] as const satisfies ReadonlyArray<keyof BatchFormState>;

/** Batch fields editable from the main create/edit popup (excludes identification). */
export const hasAdditionalBatchDetailsChanges = (
  baseline: BatchFormState,
  current: BatchFormState,
): boolean =>
  BATCH_ADDITIONAL_DETAIL_FIELDS.some(
    (field) => JSON.stringify(current[field]) !== JSON.stringify(baseline[field]),
  );

/** PUT payload for main edit popup — updates batch details only, keeps server identification. */
export const buildAdditionalBatchDetailsUpdatePayload = (
  existingBatch: Record<string, any>,
  batchForm: BatchFormState,
): Record<string, any> => {
  const base = mapBatchToFormState(existingBatch);
  return {
    ...base,
    batchType: batchForm.batchType,
    subBatchType: batchForm.subBatchType,
    projectId: batchForm.projectId,
    motorStage: batchForm.motorStage,
    mixingCycleCode: batchForm.mixingCycleCode,
    numberOfMotors: Array.isArray(batchForm.motorIds) ? batchForm.motorIds.length : 0,
    motorIds: batchForm.motorIds,
    priority: batchForm.priority,
    systemManagerId: batchForm.systemManagerId,
    objective: batchForm.objective,
    articles: batchForm.articles,
    identificationSheet: base.identificationSheet,
    identificationSheetStatus: base.identificationSheetStatus,
  };
};

/** PUT payload when saving identification from batch edit mode. */
export const buildIdentificationUpdatePayload = (
  existingBatch: Record<string, any>,
  implForm: ImplementationFormState,
): Record<string, any> => {
  const base = mapBatchToFormState(existingBatch);
  return {
    ...base,
    identificationSheet: implForm.identificationSheet,
    identificationSheetStatus: IDENTIFICATION_SHEET_STATUS.COMPLETED,
    objective: implForm.objective ?? base.objective,
    articles: Array.isArray(implForm.articles) ? implForm.articles : base.articles,
  };
};
