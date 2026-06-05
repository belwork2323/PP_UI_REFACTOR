/* ─────────────────────────────────────────────────────────────────────────────
   BATCH MANAGEMENT MODELS
   Aligned to admin batch API request / response contracts (list, details, create, update).
───────────────────────────────────────────────────────────────────────────── */

import { icons } from "../../../app/theme";

/** Map display / list labels to form/API enum values */
function normalizeBatchTypeForForm(raw: string | undefined | null): string {
  if (!raw) return "MAIN";
  const s = String(raw).trim();
  const u = s.toUpperCase();
  if (u === "MAIN" || u.includes("MAIN")) return "MAIN";
  if (u === "SUBSCALE" || u.includes("SUBSCALE")) return "SUBSCALE";
  return s;
}

/** List endpoint may return motorType as a string (e.g. "B"); details return an object */
function normalizeMotorType(raw: any): { motorTypeId: number | null; motorTypeName: string } {
  if (!raw) return { motorTypeId: null, motorTypeName: "" };
  if (typeof raw === "string") {
    return { motorTypeId: null, motorTypeName: raw };
  }
  return {
    motorTypeId: raw.motorTypeId ?? null,
    motorTypeName: raw.motorTypeName ?? "",
  };
}

/** Infer motorTypeId when UI only has letter codes (A/B/…); prefer explicit API values */
const MOTOR_TYPE_LETTER_TO_ID: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
};

export function inferMotorTypeId(motorTypeName: string, explicitId?: number | null): number {
  if (explicitId != null && explicitId > 0) return explicitId;
  const letter = (motorTypeName ?? "").trim().toUpperCase().charAt(0);
  return MOTOR_TYPE_LETTER_TO_ID[letter] ?? 0;
}

/* ─────────────────────────────────────────────────────────────────────────────
   READ MODEL  —  BatchListItemModel
   Maps response.data.batches[] items and response.data.batch (details).

   List extras: projectName, lotIds, systemManager { id, name }, identificationSheetStatus
───────────────────────────────────────────────────────────────────────────── */
export class BatchListItemModel {
  id                  : string | null;
  batchId             : string;
  batchType           : string;
  subBatchType        : string | null;
  projectId           : string | null;
  /** Present on list API for display */
  projectName         : string | null;
  numberOfMotors      : number;
  motorIds            : string[];
  lotIds              : string[];
  motorType           : { motorTypeId: number | null; motorTypeName: string };
  priority            : string;
  systemManagerId     : string;
  systemManager       : { id: string; name: string } | null;

  // Flattened stage / department fields for easy table access
  department          : { departmentId: number | null; departmentName: string } | null;
  subDepartments      : { subDepartmentId: number; subDepartmentName: string }[];

  status              : string;
  createdOn           : string | null;
  createdBy           : { id: string; name: string } | null;
  updatedOn           : string | null;
  updatedBy           : { id: string; name: string } | null;

  /** List: "Draft" | "Completed" when provided */
  identificationSheetStatus : string | null;

  // Implementation details (optional)
  identificationSheet : IdentificationSheet | null;
  objective           : string | null;
  articles            : string[];

  constructor(data: Record<string, any>) {
    this.id              = data.id              ?? null;
    this.batchId         = data.batchId         ?? "";
    this.batchType       = normalizeBatchTypeForForm(data.batchType);
    this.subBatchType    = data.subBatchType    ?? null;
    this.projectId       = data.projectId       ?? null;
    this.projectName     = data.projectName     ?? null;
    this.numberOfMotors  = data.numberOfMotors  ?? 0;
    this.motorIds        = Array.isArray(data.motorIds) ? data.motorIds : [];
    this.lotIds          = Array.isArray(data.lotIds) ? data.lotIds : [];
    this.priority        = data.priority        ?? "Medium";
    this.status          = data.status          ?? "Initiated";

    this.motorType = normalizeMotorType(data.motorType);

    if (data.systemManager && typeof data.systemManager === "object") {
      this.systemManager = {
        id: data.systemManager.id ?? "",
        name: data.systemManager.name ?? "",
      };
      this.systemManagerId = this.systemManager.id;
    } else {
      this.systemManager = null;
      this.systemManagerId = String(data.systemManagerId ?? "").trim();
    }

    this.identificationSheetStatus =
      data.identificationSheetStatus ?? data.identification_sheet_status ?? null;

    // stage → department (nested in API response)
    const dept = data.stage?.department ?? null;
    this.department = dept
      ? { departmentId: dept.departmentId ?? null, departmentName: dept.departmentName ?? "" }
      : null;

    // The API may return either subDepartments or legacy subDepartment.
    const nestedSubDepartments = Array.isArray(dept?.subDepartments)
      ? dept.subDepartments
      : Array.isArray(dept?.subDepartment)
        ? dept.subDepartment
        : [];

    this.subDepartments = nestedSubDepartments.length > 0
      ? nestedSubDepartments.map((sd: any) => ({
          subDepartmentId  : sd.subDepartmentId,
          subDepartmentName: sd.subDepartmentName ?? "",
        }))
      : [];

    // Audit fields
    this.createdOn = data.createdOn ?? null;
    this.createdBy = data.createdBy
      ? { id: data.createdBy.id ?? "", name: data.createdBy.name ?? "" }
      : null;

    // updatedOn / updatedBy only present in the detail endpoint response
    this.updatedOn = data.updatedOn ?? null;
    this.updatedBy = data.updatedBy
      ? { id: data.updatedBy.id ?? "", name: data.updatedBy.name ?? "" }
      : null;

    // Implementation details (optional)
    this.identificationSheet = data.identificationSheet ?? null;
    this.objective           = data.objective ?? null;
    this.articles            = Array.isArray(data.articles) ? data.articles : [];
  }

  static fromApi(data: Record<string, any>) {
    return new BatchListItemModel(data);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   IDENTIFICATION SHEET MODELS
───────────────────────────────────────────────────────────────────────────── */

export interface MaterialItem {
  srNo                : number;
  materialCode        : string;
  lotId               : string;
  make                : string;
  requiredComposition : number;
  quantityPerPremix   : number;
  revalidationDate    : string;
}

export interface IdentificationSheet {
  date              : string;
  batchSize         : number;
  bondingSheetNo    : string;
  mixerDetails      : string;
  numberOfPremix    : number;
  remarks?          : string;
  materials         : MaterialItem[];
}

/* ─────────────────────────────────────────────────────────────────────────────
   WRITE MODELS — CreateBatchPayload / UpdateBatchPayload
   Updated to support the new two-step batch creation workflow.
   Step 1: Create batch with basic details (identificationSheet is optional)
   Step 2: Update batch with implementation details (identificationSheet)
───────────────────────────────────────────────────────────────────────────── */

export interface BatchWritePayload {
  batchType           : string;
  subBatchType?       : string;
  projectId?          : string | null;
  motorType           : { motorTypeId: number; motorTypeName: string };
  numberOfMotors      : number;
  motorIds            : string[];
  priority            : string;
  systemManagerId     : string;
  identificationSheet?: IdentificationSheet;
  objective?          : string;
  articles?           : string[];
}

/**
 * Write model — used when POSTing a new batch (Step 1).
 * identificationSheet is optional in create API.
 * Controller builds this from raw form values.
 */
export class CreateBatchPayload implements BatchWritePayload {
  batchType           : string;
  subBatchType?       : string;
  projectId?          : string | null;
  motorType           : { motorTypeId: number; motorTypeName: string };
  numberOfMotors      : number;
  motorIds            : string[];
  priority            : string;
  systemManagerId     : string;
  identificationSheet?: IdentificationSheet;
  objective?          : string;
  articles?           : string[];

  constructor(form: Record<string, any>) {
    this.batchType = form.batchType ?? "MAIN";
    this.subBatchType =
      this.batchType === "SUBSCALE" && form.subBatchType ? form.subBatchType : undefined;

    const isExperimental =
      this.batchType === "SUBSCALE" && form.subBatchType === "EXPERIMENTAL";
    if (isExperimental) {
      const raw = form.projectId;
      this.projectId =
        raw === "" || raw === undefined || raw === null ? null : String(raw).trim();
    } else {
      const raw = form.projectId;
      this.projectId =
        raw === "" || raw === undefined || raw === null ? undefined : String(raw).trim();
    }

    const motorTypeName =
      typeof form.motorType === "string"
        ? form.motorType.trim()
        : String(form.motorType?.motorTypeName ?? "").trim();
    const motorTypeId = inferMotorTypeId(
      motorTypeName,
      form.motorTypeId ?? (typeof form.motorType === "object" ? form.motorType?.motorTypeId : undefined)
    );
    this.motorType = { motorTypeId: motorTypeId, motorTypeName: motorTypeName };

    this.numberOfMotors    = form.numberOfMotors      ?? 0;
    this.motorIds          = Array.isArray(form.motorIds) ? form.motorIds : (form.motorIds ? [form.motorIds] : []);
    this.priority          = form.priority            ?? "Medium";
    this.systemManagerId   = String(form.systemManagerId ?? "").trim();
    this.identificationSheet = form.identificationSheet ?? undefined;
    this.objective         = form.objective           ?? undefined;
    this.articles          = Array.isArray(form.articles) ? form.articles : undefined;
  }
}

/**
 * Write model — PUT /admin/batch/update (body includes batchId per API contract).
 */
export class UpdateBatchPayload implements BatchWritePayload {
  batchId             : string;
  batchType           : string;
  subBatchType?       : string;
  projectId?          : string | null;
  motorType           : { motorTypeId: number; motorTypeName: string };
  numberOfMotors      : number;
  motorIds            : string[];
  priority            : string;
  systemManagerId     : string;
  identificationSheet?: IdentificationSheet;
  objective?          : string;
  articles?           : string[];

  constructor(batchId: string, form: Record<string, any>) {
    this.batchId = String(batchId ?? "").trim();
    this.batchType = form.batchType ?? "MAIN";
    this.subBatchType =
      this.batchType === "SUBSCALE" && form.subBatchType ? form.subBatchType : undefined;

    const isExperimental =
      this.batchType === "SUBSCALE" && form.subBatchType === "EXPERIMENTAL";
    if (isExperimental) {
      const raw = form.projectId;
      this.projectId =
        raw === "" || raw === undefined || raw === null ? null : String(raw).trim();
    } else {
      const raw = form.projectId;
      this.projectId =
        raw === "" || raw === undefined || raw === null ? undefined : String(raw).trim();
    }

    const motorTypeName =
      typeof form.motorType === "string"
        ? form.motorType.trim()
        : String(form.motorType?.motorTypeName ?? "").trim();
    const motorTypeId = inferMotorTypeId(
      motorTypeName,
      form.motorTypeId ?? (typeof form.motorType === "object" ? form.motorType?.motorTypeId : undefined)
    );
    this.motorType = { motorTypeId: motorTypeId, motorTypeName: motorTypeName };

    this.numberOfMotors    = form.numberOfMotors      ?? 0;
    this.motorIds          = Array.isArray(form.motorIds) ? form.motorIds : (form.motorIds ? [form.motorIds] : []);
    this.priority          = form.priority            ?? "Medium";
    this.systemManagerId   = String(form.systemManagerId ?? "").trim();
    this.identificationSheet = form.identificationSheet ?? undefined;
    this.objective         = form.objective           ?? undefined;
    this.articles          = Array.isArray(form.articles) ? form.articles : undefined;
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   BATCH STATISTICS MODEL
───────────────────────────────────────────────────────────────────────────── */

const STAT_CONFIG = {
  totalBatches     : { label: "Total Batches",      variant: "total",      icon: icons.batchMgmt.batchIcon },
  inProgressBatches: { label: "In Progress",        variant: "inProgress", icon: icons.batchMgmt.inProgressStatus },
  completedBatches : { label: "Completed",          variant: "completed",  icon: icons.batchMgmt.completedStatus },
  pendingApprovals : { label: "Pending Approvals",  variant: "pending",    icon: icons.batchMgmt.pendingStatus },
  rejectedBatches  : { label: "Rejected",           variant: "rejected",   icon: icons.batchMgmt.rejectedStatus },
};

export class BatchStatsModel {
  static fromStatsApi(apiResponse: any) {
    const { data } = apiResponse;
    if (!data) return [];

    return Object.entries(STAT_CONFIG).map(([apiKey, config]) => {
      const statData = (data as any)[apiKey] || { count: 0, subValue: 0 };

      return {
        label   : config.label,
        value   : BatchStatsModel.formatNumber(statData.count),
        rawValue: statData.count,
        subLabel: statData.subValue !== 0
          ? (statData.subValue > 0
              ? `+${statData.subValue} this period`
              : `${statData.subValue} this period`)
          : "",
        icon   : config.icon,
        variant: config.variant,
      };
    });
  }

  static formatNumber(num: number): string {
    if (num === null || num === undefined) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
}