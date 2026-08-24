import { formatToIsoDateInput } from "../../../utils/dateUtils";
import { OPERATION_STATUS } from "../../../hooks/operationStatus";
import { normalizeSubdepartmentBatchStatus } from "./SubdepartmentBatchModel";
import {
  formatPrepSectionCellValue,
  formatPrepSectionLabel,
  getPremixStatusLabel,
} from "./RawMaterialPreparationModel";
import { formatDateTimeForApi } from "./rawMaterialPreparationApiMapper";
import {
  buildCasePrepMotorDetailsPayload,
  casePrepMotorDataHasUserInput,
  CASE_PREP_MOTOR_SECTION_KEYS,
  createEmptyCasePrepMotorData,
  parseCasePrepMotorDataFromApi,
  type CasePrepMotorData,
  type CasePrepMotorDetailsPayload,
  type CasePrepMotorSectionPayload,
} from "./CasePrepMotorDataModel";

export {
  formatPrepSectionLabel as formatCasePrepSectionLabel,
  formatPrepSectionCellValue as formatCasePrepCellValue,
  orderPrepSectionColumns as orderCasePrepSectionColumns,
} from "./RawMaterialPreparationModel";

/** UI date is DD-MM-YYYY; create/update API expects YYYY-MM-DD (same as RMP). */
const toCasePrepPayloadDate = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return formatToIsoDateInput(raw) || raw;
};

/** Convert UI date/datetime strings for Case Prep API payloads. */
const toCasePrepPayloadDateValue = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  const raw = value.trim();
  if (!raw) return undefined;

  // UI datetime (DD-MM-YYYY HH:mm) → ISO, matching RMP weighingDateTime
  if (/^\d{1,2}-\d{1,2}-\d{4}[ T]\d{2}:\d{2}/.test(raw)) {
    return formatDateTimeForApi(raw) ?? raw;
  }

  // UI date (DD-MM-YYYY) → YYYY-MM-DD
  const datePart = raw.split(/[T ]/)[0];
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(datePart)) {
    return formatToIsoDateInput(raw) || raw;
  }

  return value;
};

const CASE_PREP_DATETIME_KEYS = new Set([
  "heMotorPastingDateTime",
  "neMotorPastingDateTime",
  "tceCleaningDateTime",
  "prrcClearanceDate",
]);

const convertCasePrepDatesDeep = (value: unknown, keyHint = ""): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => convertCasePrepDatesDeep(entry));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
      const next = convertCasePrepDatesDeep(entry, key);
      // Never send "" for Instant/date fields — omit instead.
      if (
        CASE_PREP_DATETIME_KEYS.has(key) &&
        (next == null || (typeof next === "string" && !next.trim()))
      ) {
        return;
      }
      // Table row `value` cells that look like blank datetimes stay as "" (string ops).
      out[key] = next;
    });
    return out;
  }
  if (typeof value === "string" && CASE_PREP_DATETIME_KEYS.has(keyHint) && !value.trim()) {
    return undefined;
  }
  return toCasePrepPayloadDateValue(value);
};

const convertCasePrepMotorDatesForApi = (
  motor: CasePrepMotorSubmission,
): CasePrepMotorSubmission => {
  const { motorId, prrcClearanceDate, motorSubmissionType, ...details } = motor;
  const converted = convertCasePrepDatesDeep(details) as CasePrepMotorDetailsPayload;
  const clearance = toCasePrepPayloadDate(prrcClearanceDate);
  return {
    motorId,
    ...(clearance ? { prrcClearanceDate: clearance } : { prrcClearanceDate: "" }),
    ...(motorSubmissionType ? { motorSubmissionType } : {}),
    ...converted,
  };
};

export type MotorSubmissionType = "DRAFT" | "SUBMIT";
export type MotorSubmissionStatus =
  | "TO_BE_INITIATED"
  | "IN_PROGRESS"
  | "WAITING_FOR_APPROVAL"
  | "APPROVED"
  | "REJECTED";

export type MotorStatusMeta = {
  motorSubmissionType?: MotorSubmissionType;
  motorSubmissionStatus: MotorSubmissionStatus;
  submittedAt?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  remarks?: string | null;
  rejectionReason?: string | null;
};

export const isMotorLocked = (status?: MotorSubmissionStatus | string | null) => {
  const normalized = String(status ?? "").toUpperCase();
  return normalized === "WAITING_FOR_APPROVAL" || normalized === "APPROVED";
};

export const isMotorEditable = (status?: MotorSubmissionStatus | string | null) =>
  !status || status === "TO_BE_INITIATED" || status === "IN_PROGRESS" || status === "REJECTED";

export const isMotorApproverTabDisabled = (
  status?: MotorSubmissionStatus | string | null,
): boolean => !status || status === "TO_BE_INITIATED";

export const isMotorApproverActionable = (
  status?: MotorSubmissionStatus | string | null,
): boolean => {
  const normalized = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return normalized === "WAITING_FOR_APPROVAL" || normalized === "IN_PROGRESS";
};

/** Entire form can be approved/rejected once submitted and every motor is approved. */
export const canApproverActionEntireCasePrepForm = (params: {
  formSubmissionType?: string | null;
  status?: string | null;
  motors?: Array<{ motorSubmissionStatus?: MotorSubmissionStatus | string | null }>;
}): boolean => {
  const formType = String(params.formSubmissionType ?? "")
    .trim()
    .toUpperCase();
  if (formType !== "SUBMIT") return false;

  const motors = params.motors ?? [];
  if (motors.length === 0) return false;
  const allMotorsApproved = motors.every(
    (motor) => String(motor.motorSubmissionStatus ?? "").toUpperCase() === "APPROVED",
  );
  if (!allMotorsApproved) return false;

  const status = String(params.status ?? "").trim();
  const statusUpper = status.toUpperCase().replace(/\s+/g, "_");

  if (
    statusUpper === "APPROVED" ||
    statusUpper === "REJECTED" ||
    statusUpper === "FINAL_APPROVAL_COMPLETED" ||
    status === OPERATION_STATUS.APPROVED ||
    status === OPERATION_STATUS.REJECTED ||
    status === OPERATION_STATUS.FINAL_APPROVAL_COMPLETED
  ) {
    return false;
  }

  return (
    statusUpper === "WAITING_FOR_COMPLETE_APPROVAL" ||
    status === OPERATION_STATUS.WAITING_FOR_COMPLETE_APPROVAL ||
    status === OPERATION_STATUS.WAITING_FOR_APPROVAL ||
    statusUpper === "WAITING_FOR_APPROVAL"
  );
};

export const getMotorStatusLabel = (status?: MotorSubmissionStatus | string | null) =>
  getPremixStatusLabel(status as any);

/** Batch-level workflow status from details/list APIs (includes partial approval). */
export const getCasePrepBatchStatusLabel = (status: unknown): string =>
  String(normalizeSubdepartmentBatchStatus(status));

export type MotorCounts = {
  pendingMotorCount: number;
  approvedMotorCount: number;
  rejectedMotorCount: number;
  inProgressMotorCount: number;
  totalMotorCount: number;
};

export type CasePrepMotorSession = {
  motorId: string;
  prrcClearanceDate: string;
  data: CasePrepMotorData;
};

export type CasePreparationFormState = {
  motors: CasePrepMotorSession[];
  subscaleData: CasePrepMotorData | null;
};

export type CasePrepMotorSubmission = {
  motorId: string;
  prrcClearanceDate: string;
  motorSubmissionType?: MotorSubmissionType;
} & CasePrepMotorDetailsPayload;

export type CasePreparationFormBody = {
  motors: CasePrepMotorSubmission[];
};

export const createDefaultCasePreparationFormState = (): CasePreparationFormState => ({
  motors: [],
  subscaleData: null,
});

export const createEmptyMotorSession = (
  motorId: string,
  prrcClearanceDate: string,
): CasePrepMotorSession => ({
  motorId,
  prrcClearanceDate,
  data: createEmptyCasePrepMotorData(),
});

const resolveCasePrepDetailsPayload = (details: any) =>
  details?.casePreparationDetails ?? details?.preparationDetails ?? details ?? {};

const normalizeMotorStatus = (value: unknown): MotorSubmissionStatus => {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (
    normalized === "IN_PROGRESS" ||
    normalized === "WAITING_FOR_APPROVAL" ||
    normalized === "APPROVED" ||
    normalized === "REJECTED"
  ) {
    return normalized;
  }
  return "TO_BE_INITIATED";
};

const normalizeMotorSubmissionType = (value: unknown): MotorSubmissionType | undefined => {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();
  if (normalized === "DRAFT" || normalized === "SUBMIT") return normalized;
  return undefined;
};

const resolveMotorSections = (motor: any): CasePrepMotorSectionPayload[] | undefined => {
  if (Array.isArray(motor?.sections)) return motor.sections;
  if (Array.isArray(motor?.motorSections)) return motor.motorSections;
  return undefined;
};

const motorHasNestedCasePrepDetails = (motor: any): boolean =>
  CASE_PREP_MOTOR_SECTION_KEYS.some((key) => motor?.[key] && typeof motor[key] === "object");

const parseMotorCasePrepData = (motor: any): CasePrepMotorData => {
  if (motorHasNestedCasePrepDetails(motor)) {
    return parseCasePrepMotorDataFromApi(motor as Record<string, unknown>);
  }
  return parseCasePrepMotorDataFromApi(resolveMotorSections(motor));
};

/** Build motorStatusById from details root motorStatuses + motors[]. */
export const mapCasePreparationMotorStatusesFromApi = (
  details: any,
  fallbackMotorIds: string[] = [],
): Record<string, MotorStatusMeta> => {
  const payload = resolveCasePrepDetailsPayload(details);
  const root = details?.data ?? details ?? {};
  const statusById: Record<string, MotorStatusMeta> = {};

  const rootStatuses = Array.isArray(root?.motorStatuses)
    ? root.motorStatuses
    : Array.isArray(details?.motorStatuses)
      ? details.motorStatuses
      : [];

  rootStatuses.forEach((entry: any) => {
    const motorId = String(entry?.motorId ?? "").trim();
    if (!motorId) return;
    statusById[motorId] = {
      motorSubmissionType: normalizeMotorSubmissionType(entry?.motorSubmissionType),
      motorSubmissionStatus: normalizeMotorStatus(entry?.motorSubmissionStatus),
      submittedAt: entry?.submittedAt ?? null,
      reviewedBy: entry?.reviewedBy ?? entry?.actionBy ?? null,
      reviewedAt: entry?.reviewedAt ?? entry?.actionAt ?? null,
      remarks: entry?.remarks ?? null,
      rejectionReason: entry?.rejectionReason ?? null,
    };
  });

  const rawMotors = Array.isArray(payload?.motors) ? payload.motors : [];
  rawMotors.forEach((motor: any) => {
    const motorId = String(motor?.motorId ?? "").trim();
    if (!motorId) return;
    const existing = statusById[motorId];
    statusById[motorId] = {
      motorSubmissionType:
        normalizeMotorSubmissionType(motor?.motorSubmissionType) ?? existing?.motorSubmissionType,
      motorSubmissionStatus: normalizeMotorStatus(
        motor?.motorSubmissionStatus ?? existing?.motorSubmissionStatus,
      ),
      submittedAt: motor?.submittedAt ?? existing?.submittedAt ?? null,
      reviewedBy: motor?.actionBy ?? motor?.reviewedBy ?? existing?.reviewedBy ?? null,
      reviewedAt: motor?.actionAt ?? motor?.reviewedAt ?? existing?.reviewedAt ?? null,
      remarks: motor?.remarks ?? existing?.remarks ?? null,
      rejectionReason: motor?.rejectionReason ?? existing?.rejectionReason ?? null,
    };
  });

  fallbackMotorIds.forEach((motorId) => {
    const id = String(motorId ?? "").trim();
    if (!id || statusById[id]) return;
    statusById[id] = { motorSubmissionStatus: "TO_BE_INITIATED" };
  });

  return statusById;
};

export const mapCasePreparationDetailsToFormState = (details: any): CasePreparationFormState => {
  const payload = resolveCasePrepDetailsPayload(details);
  const rawMotors = Array.isArray(payload?.motors) ? payload.motors : [];

  const motors = rawMotors
    .map((motor: any) => {
      const motorId = String(motor?.motorId ?? "").trim();
      if (!motorId) return null;
      return {
        motorId,
        prrcClearanceDate: String(
          motor?.prrcClearanceDate ?? motor?.prrcDate ?? motor?.prrcClearance ?? "",
        ).trim(),
        data: parseMotorCasePrepData(motor),
      } satisfies CasePrepMotorSession;
    })
    .filter(Boolean) as CasePrepMotorSession[];

  const sections = Array.isArray(payload?.sections)
    ? payload.sections
    : Array.isArray(details?.sections)
      ? details.sections
      : undefined;

  return {
    motors,
    subscaleData: sections?.length
      ? parseCasePrepMotorDataFromApi(sections)
      : motors.length === 0
        ? createEmptyCasePrepMotorData()
        : null,
  };
};

export const buildCasePreparationFormBody = (
  form: CasePreparationFormState,
  options?: {
    targetMotorIds?: string[];
    motorSubmissionType?: MotorSubmissionType;
  },
): CasePreparationFormBody => {
  const targetIds = options?.targetMotorIds?.length
    ? new Set(options.targetMotorIds.map((id) => String(id).trim()).filter(Boolean))
    : null;

  const motors = (form.motors ?? [])
    .filter((motor) => !targetIds || targetIds.has(motor.motorId))
    .map((motor) => {
      const details = buildCasePrepMotorDetailsPayload(
        motor.data ?? createEmptyCasePrepMotorData(),
      );
      const submission: CasePrepMotorSubmission = {
        motorId: motor.motorId,
        prrcClearanceDate: motor.prrcClearanceDate,
        ...(options?.motorSubmissionType
          ? { motorSubmissionType: options.motorSubmissionType }
          : {}),
        ...details,
      };
      return submission;
    });

  if (!motors.length && form.subscaleData) {
    const details = buildCasePrepMotorDetailsPayload(form.subscaleData);
    return {
      motors: [
        convertCasePrepMotorDatesForApi({
          motorId: "SUBSCALE",
          prrcClearanceDate: "",
          ...(options?.motorSubmissionType
            ? { motorSubmissionType: options.motorSubmissionType }
            : {}),
          ...details,
        }),
      ],
    };
  }

  return {
    motors: motors.map(convertCasePrepMotorDatesForApi),
  };
};

/** @deprecated Use buildCasePreparationFormBody */
export const mapCasePreparationFormStateToPayload = buildCasePreparationFormBody;

/** Rebuild payload from saved details for final form SUBMIT (RMP mirror). */
export const mapCasePreparationDetailsFromSavedForm = (
  details: any,
  options?: { motorStatusById?: Record<string, MotorStatusMeta> },
): CasePreparationFormBody => {
  const payload = resolveCasePrepDetailsPayload(details);
  const rawMotors = Array.isArray(payload?.motors) ? payload.motors : [];
  const statusById = options?.motorStatusById ?? mapCasePreparationMotorStatusesFromApi(details);

  const motors = rawMotors
    .map((motor: any) => {
      const motorId = String(motor?.motorId ?? "").trim();
      if (!motorId) return null;
      const statusMeta = statusById[motorId];
      const details = buildCasePrepMotorDetailsPayload(parseMotorCasePrepData(motor));
      return {
        motorId,
        prrcClearanceDate: String(motor?.prrcClearanceDate ?? "").trim(),
        motorSubmissionType:
          statusMeta?.motorSubmissionType ??
          normalizeMotorSubmissionType(motor?.motorSubmissionType) ??
          "SUBMIT",
        ...details,
      } as CasePrepMotorSubmission;
    })
    .filter(Boolean) as CasePrepMotorSubmission[];

  return {
    motors: motors.map(convertCasePrepMotorDatesForApi),
  };
};

export const hasAnyCasePreparationValue = (form: CasePreparationFormState) => {
  if ((form.motors ?? []).some((motor) => casePrepMotorDataHasUserInput(motor.data))) {
    return true;
  }
  return form.subscaleData ? casePrepMotorDataHasUserInput(form.subscaleData) : false;
};

export const hasMotorCasePreparationValue = (form: CasePreparationFormState, motorId: string) => {
  const motor = (form.motors ?? []).find((entry) => entry.motorId === motorId);
  if (!motor) return false;
  return casePrepMotorDataHasUserInput(motor.data);
};

export class CasePreparationSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(data: any = {}) {
    const payload = data?.data ?? data;
    this.formId = String(payload?.formId ?? "");
    this.batchId = String(payload?.batchId ?? "");
    this.status = String(payload?.status ?? "");
  }

  static fromApi(data: any) {
    const payload = data?.data ?? data ?? {};
    return new CasePreparationSubmitResponseModel(payload);
  }
}

export class CasePreparationDetailsModel {
  static fromApi(data: any) {
    const payload = data?.data ?? data ?? {};
    const casePreparationDetails =
      payload?.casePreparationDetails ?? payload?.preparationDetails ?? null;

    const mapPerson = (value: unknown): string | null => {
      if (value == null || value === "") return null;
      if (typeof value === "string") return value.trim();
      if (typeof value === "object") {
        const person = value as { fullName?: string; name?: string; id?: string };
        return String(person.fullName ?? person.name ?? person.id ?? "").trim() || null;
      }
      return String(value).trim() || null;
    };

    return {
      formId: String(payload?.formId ?? ""),
      batchId: String(payload?.batchId ?? ""),
      batchType: String(payload?.batchType ?? ""),
      subDepartmentId: Number(payload?.subDepartmentId ?? 0),
      formSubmissionType: String(payload?.formSubmissionType ?? ""),
      status: payload?.status != null ? String(payload.status) : undefined,
      createdBy: mapPerson(payload?.createdBy),
      createdAt: payload?.createdAt != null ? String(payload.createdAt) : null,
      submittedBy: mapPerson(payload?.submittedBy),
      submittedAt: payload?.submittedAt != null ? String(payload.submittedAt) : null,
      casePreparationDetails,
      motors: casePreparationDetails?.motors ?? payload?.motors ?? [],
      sections: casePreparationDetails?.sections ?? payload?.sections ?? [],
      generalActivities:
        casePreparationDetails?.generalActivities ?? payload?.generalActivities ?? {},
      linearCoatingOperation:
        casePreparationDetails?.linearCoatingOperation ?? payload?.linearCoatingOperation ?? {},
    };
  }
}

export type CasePrepDetailField = {
  key: string;
  label: string;
  /** Raw cell value (string, file ref, or file ref list). Formatted at render. */
  value: unknown;
};

export type CasePrepDetailTable = {
  blockId: string;
  label: string;
  rows: Record<string, unknown>[];
  columnLabels: Record<string, string>;
};

export type CasePrepSchemaLabelIndex = {
  sections: Record<string, string>;
  blocks: Record<string, string>;
  tableColumns: Record<string, Record<string, string>>;
  tablePresetRows: Record<string, Record<string, unknown>[]>;
};

/** Static labels matching case-prep schema JSON — details/approver need no schema fetch. */
export const getCasePrepStaticLabelIndex = (): CasePrepSchemaLabelIndex => ({
  sections: {
    abradingOperation: "Abrading Operation",
    bellowBonding: "Bellow Bonding",
    tceCleaning: "TCE Cleaning",
    preHeating: "Pre-heating",
    linerCoatingOperation: "Liner Coating Operation",
    dispatchToCasting: "Dispatch To Casting",
  },
  blocks: {
    abradingConfigurationHeading: "Abrading Configuration",
    typeOfCasing: "Type of Casting",
    typeOfInsulation: "Type of Insulation",
    abradingWheelType: "Abrading Wheel Type",
    abradingDetails: "Abrading Details",
    adhesiveDetailsHeading: "Adhesive Details",
    adhesiveDetails: "Adhesive Details",
    heBellowDimension: "HE Bellow Dimension",
    heMotorPastingDateTime: "HE Pasting Date & Time",
    neBellowDimension: "NE Bellow Dimension",
    neMotorPastingDateTime: "NE Pasting Date & Time",
    numberOfSpacers: "No. of Spacers",
    pastingDetails: "Pasting Details",
    remarks: "Remarks",
    tceCleaningDateTime: "TCE Cleaning Date & Time",
    solventUsedQtyKg: "Solvent Used Qty (KG)",
    observation: "Observation",
    testReport: "Upload Test Report",
    preHeatingConfigurationHeading: "Pre-heating Configuration",
    vacuumBaggingApplied: "Vacuum Bagging Application",
    vacuumAppliedHint: "If YES, then vacuum applied",
    vacuumApplied: "Enter vacuum value",
    preHeatingRecipe: "Pre-heating Recipe",
    otherTemperature: "Other Temperature",
    otherDuration: "Other Duration",
    temperatureDurationHeading: "Temperature Duration",
    temperatureDuration: "Temperature Duration",
    preHeatingMonitoring: "Pre-heating Monitoring",
    preHeatingDate: "Pre-heating Date",
    linerCoatingOperation: "Liner Coating Operation",
    linerType: "Select Liner Type",
    otherLinerType: "Other Liner Type",
    linerPreparationDetails: "Liner Preparation Details",
    batchNo: "Batch No.",
    batchSize: "Batch Size",
    premixIngredients: "Premix",
    finalMixIngredients: "Final Mix",
    qualificationDetails: "Qualification Details",
    qualifyingSubscaleBatchNo: "Qualifying Subscale Batch No.",
    qualificationParameters: "Qualification Parameters",
    linerApplicationLog: "Liner Application Process Log",
    linerCoatingDate: "Liner Coating Date",
    dispatchVisualObservations: "Dispatch Visual Observations",
    dispatchToCastingDetails: "Dispatch To Casting Details",
  },
  tableColumns: {
    abradingDetails: {
      operation: "Operation",
      value: "Value",
      remarksObservations: "Remarks / Observations",
      attachments: "Photos / Videos",
    },
    temperatureDuration: {
      parameter: "Parameter",
      value: "Value",
      remarks: "Remarks",
    },
    preHeatingMonitoring: {
      parameter: "Parameter",
      value: "Value",
      remarks: "Remarks",
    },
    premixIngredients: {
      srNo: "Sr. No.",
      materialName: "Material Name",
      ingredient: "Material Code",
      mfgLot: "Mfg. Lot",
      partsByWeight: "Parts by Wt.",
      quantityTaken: "Quantity Taken (g)",
      totalQuantity: "Total Quantity (g)",
    },
    finalMixIngredients: {
      srNo: "Sr. No.",
      materialName: "Material Name",
      ingredient: "Material Code",
      mfgLot: "Mfg. Lot",
      partsByWeight: "Parts by Wt.",
      quantityTaken: "Quantity Taken (g)",
      totalQuantity: "Total Quantity (g)",
    },
    qualificationParameters: {
      srNo: "Sr. No.",
      parameter: "Parameter",
      specification: "Specification",
      result: "Result",
    },
    linerApplicationLog: {
      parameter: "Operation",
      value: "Value",
      remarks: "Remarks",
    },
    dispatchVisualObservations: {
      parameter: "Operation",
      observations: "Observations",
    },
    dispatchToCastingDetails: {
      parameter: "Operation",
      value: "Value",
      remarks: "Remarks",
    },
  },
  tablePresetRows: {},
});

/** @deprecated Prefer getCasePrepStaticLabelIndex — schema walk no longer required. */
export const buildCasePrepSchemaLabelIndex = (
  _schema?: unknown,
): CasePrepSchemaLabelIndex => getCasePrepStaticLabelIndex();

const resolveCasePrepBlockLabel = (
  labelIndex: CasePrepSchemaLabelIndex | undefined,
  blockId: string,
): string => labelIndex?.blocks[blockId] ?? formatPrepSectionLabel(blockId);

const resolveCasePrepSectionLabel = (
  labelIndex: CasePrepSchemaLabelIndex | undefined,
  sectionId: string,
): string => labelIndex?.sections[sectionId] ?? formatPrepSectionLabel(sectionId);

const resolveCasePrepColumnLabel = (
  labelIndex: CasePrepSchemaLabelIndex | undefined,
  tableId: string,
  columnId: string,
): string => labelIndex?.tableColumns[tableId]?.[columnId] ?? formatPrepSectionLabel(columnId);

export type CasePrepDetailSection = {
  sectionId: string;
  label: string;
  fields: CasePrepDetailField[];
  tables: CasePrepDetailTable[];
};

export type CasePrepMotorDetailView = {
  motorId: string;
  prrcClearanceDate: string;
  motorSubmissionType?: MotorSubmissionType;
  motorSubmissionStatus?: MotorSubmissionStatus;
  submittedAt?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  remarks?: string | null;
  rejectionReason?: string | null;
  sections: CasePrepDetailSection[];
  casePrepData: CasePrepMotorData;
};

export type CasePreparationDetailView = {
  formId: string;
  batchId: string;
  batchType: string;
  status?: string;
  formSubmissionType?: string;
  createdBy: string | null;
  createdAt: string | null;
  submittedBy: string | null;
  submittedAt: string | null;
  motorCounts?: MotorCounts;
  motors: CasePrepMotorDetailView[];
};

const CASE_PREP_SECTION_ORDER = [
  "abradingOperation",
  "bellowBonding",
  "tceCleaning",
  "preHeating",
  "linerCoatingOperation",
  "dispatchToCasting",
];

/** Serial / runtime keys — hidden in read-only detail tables. */
export const CASE_PREP_HIDDEN_TABLE_COLUMNS = new Set([
  "SR_NO",
  "srNo",
  "type",
  "fieldType",
  "_rowType",
  "_headerLabel",
]);

const CASE_PREP_COLUMN_PRIORITY = [
  "operation",
  "OPERATION",
  "parameter",
  "PARAMETER",
  "ingredient",
  "INGREDIENT",
  "value",
  "VALUE",
  "result",
  "RESULT",
  "specification",
  "SPECIFICATION",
  "remarks",
  "remarksObservations",
  "observations",
  "REMARKS",
  "attachments",
  "mfgLot",
  "partsByWeight",
  "quantityTaken",
  "totalQuantity",
  "quantity",
  "pastingDateTime",
];

export const orderCasePrepDisplayColumns = (columns: string[]): string[] => {
  const visible = columns.filter(
    (col) => !CASE_PREP_HIDDEN_TABLE_COLUMNS.has(col) && !col.startsWith("_"),
  );
  return [...visible].sort((a, b) => {
    const ai = CASE_PREP_COLUMN_PRIORITY.indexOf(a);
    const bi = CASE_PREP_COLUMN_PRIORITY.indexOf(b);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.localeCompare(b);
  });
};

const isCasePrepDisplayRowEmpty = (row: Record<string, unknown>): boolean => {
  const headerLabel = String(row._headerLabel ?? row.operation ?? row.parameter ?? "").trim();
  if (row.type === "header" && headerLabel) return false;
  if (headerLabel) return false;

  return !Object.entries(row).some(
    ([key, value]) =>
      !key.startsWith("_") &&
      !CASE_PREP_HIDDEN_TABLE_COLUMNS.has(key) &&
      formatPrepSectionCellValue(value) !== "—",
  );
};

export const filterCasePrepDisplayRows = (
  rows: Record<string, unknown>[],
): Record<string, unknown>[] => rows.filter((row) => !isCasePrepDisplayRowEmpty(row));

export const enrichCasePrepTableRows = (
  tableId: string,
  rows: Record<string, unknown>[],
  labelIndex?: CasePrepSchemaLabelIndex,
): Record<string, unknown>[] => {
  const presetRows = labelIndex?.tablePresetRows[tableId] ?? [];
  const enriched: Record<string, unknown>[] = [];

  rows.forEach((row, index) => {
    const preset = presetRows[index];
    if (preset?.type === "header") {
      if (!isCasePrepDisplayRowEmpty(row)) {
        enriched.push(row);
        return;
      }
      const headerLabel = String(preset.label ?? "").trim();
      if (headerLabel) {
        enriched.push({ type: "header", _headerLabel: headerLabel });
      }
      return;
    }

    if (!isCasePrepDisplayRowEmpty(row)) {
      enriched.push(row);
    }
  });

  return enriched;
};

const buildTableColumnLabels = (
  tableId: string,
  rows: Record<string, unknown>[],
  labelIndex?: CasePrepSchemaLabelIndex,
): Record<string, string> => {
  const columns = orderCasePrepDisplayColumns(
    Array.from(
      rows.reduce((keys, row) => {
        Object.keys(row ?? {}).forEach((key) => keys.add(key));
        return keys;
      }, new Set<string>()),
    ),
  );

  return Object.fromEntries(
    columns.map((columnId) => [
      columnId,
      resolveCasePrepColumnLabel(labelIndex, tableId, columnId),
    ]),
  );
};

const isWrappedTableValue = (
  value: unknown,
): value is { rows: Record<string, unknown>[] } =>
  Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Array.isArray((value as { rows?: unknown }).rows),
  );

const isTableRowArray = (value: unknown): value is Record<string, unknown>[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((item) => item && typeof item === "object" && !Array.isArray(item));

const isCasePrepTableRow = (row: unknown): row is Record<string, unknown> => {
  if (!row || typeof row !== "object" || Array.isArray(row)) return false;
  const entry = row as Record<string, unknown>;
  if (entry.type === "header" || entry._rowType === "header") return true;
  return ["parameter", "operation", "ingredient", "PARAMETER", "OPERATION", "INGREDIENT"].some(
    (key) => key in entry,
  );
};

const isFlatCasePrepTableSection = (
  sectionData: Record<string, unknown>[] | undefined,
): boolean => {
  const rows = sectionData ?? [];
  if (!rows.length) return false;
  return rows.every((row) => isCasePrepTableRow(row));
};

const resolveCasePrepTableRows = (value: unknown): Record<string, unknown>[] | null => {
  if (isWrappedTableValue(value) && value.rows.length > 0) {
    return value.rows as Record<string, unknown>[];
  }
  if (isTableRowArray(value)) {
    return value;
  }
  if (isCasePrepTableRow(value)) {
    return [value];
  }
  return null;
};

const pushCasePrepDetailTable = (
  tables: CasePrepDetailTable[],
  blockId: string,
  rows: Record<string, unknown>[],
  labelIndex?: CasePrepSchemaLabelIndex,
) => {
  const displayRows = enrichCasePrepTableRows(blockId, rows, labelIndex);
  if (!displayRows.length) return;
  tables.push({
    blockId,
    label: resolveCasePrepBlockLabel(labelIndex, blockId),
    rows: displayRows,
    columnLabels: buildTableColumnLabels(blockId, displayRows, labelIndex),
  });
};

export const parseCasePrepSectionData = (
  sectionId: string,
  sectionData: Record<string, unknown>[] | undefined,
  labelIndex?: CasePrepSchemaLabelIndex,
): CasePrepDetailSection => {
  const fields: CasePrepDetailField[] = [];
  const tables: CasePrepDetailTable[] = [];
  const sectionRows = sectionData ?? [];

  if (isFlatCasePrepTableSection(sectionRows)) {
    pushCasePrepDetailTable(tables, sectionId, sectionRows, labelIndex);
    return {
      sectionId,
      label: resolveCasePrepSectionLabel(labelIndex, sectionId),
      fields,
      tables,
    };
  }

  sectionRows.forEach((dataRow) => {
    if (!dataRow || typeof dataRow !== "object") return;

    if (Array.isArray(dataRow)) {
      const nestedRows = dataRow.filter((item): item is Record<string, unknown> =>
        Boolean(item && typeof item === "object" && !Array.isArray(item)),
      );
      if (nestedRows.length > 0 && nestedRows.every(isCasePrepTableRow)) {
        pushCasePrepDetailTable(tables, sectionId, nestedRows, labelIndex);
      }
      return;
    }

    const entries = Object.entries(dataRow).filter(([key]) => !key.startsWith("_"));
    const arrayEntries = entries.filter(([, value]) => resolveCasePrepTableRows(value) !== null);
    const scalarEntries = entries.filter(([, value]) => resolveCasePrepTableRows(value) === null);

    if (arrayEntries.length === 1 && scalarEntries.length === 0) {
      const tableRows = resolveCasePrepTableRows(arrayEntries[0][1]);
      if (tableRows) {
        pushCasePrepDetailTable(tables, arrayEntries[0][0], tableRows, labelIndex);
      }
      return;
    }

    entries.forEach(([key, value]) => {
      const tableRows = resolveCasePrepTableRows(value);
      if (tableRows) {
        pushCasePrepDetailTable(tables, key, tableRows, labelIndex);
        return;
      }

      const formatted = formatPrepSectionCellValue(value);
      if (formatted === "—") return;

      fields.push({
        key,
        label: resolveCasePrepBlockLabel(labelIndex, key),
        value,
      });
    });
  });

  return {
    sectionId,
    label: resolveCasePrepSectionLabel(labelIndex, sectionId),
    fields,
    tables,
  };
};

/** Build detail sections from nested motor keys or legacy `sections[]`. */
export const resolveCasePrepMotorDetailSections = (
  motor: Record<string, unknown>,
  labelIndex?: CasePrepSchemaLabelIndex,
): CasePrepDetailSection[] => {
  if (Array.isArray(motor.sections)) {
    return (motor.sections as Array<{ sectionId?: string; sectionData?: Record<string, unknown>[] }>)
      .map((section) =>
        parseCasePrepSectionData(
          String(section.sectionId ?? ""),
          section.sectionData,
          labelIndex,
        ),
      )
      .filter((section) => section.sectionId);
  }

  return CASE_PREP_MOTOR_SECTION_KEYS.map((sectionId) => {
    const sectionObj = motor[sectionId];
    if (!sectionObj || typeof sectionObj !== "object" || Array.isArray(sectionObj)) {
      return parseCasePrepSectionData(sectionId, [], labelIndex);
    }
    return parseCasePrepSectionData(
      sectionId,
      [sectionObj as Record<string, unknown>],
      labelIndex,
    );
  });
};

const sortCasePrepSections = (sections: CasePrepDetailSection[]): CasePrepDetailSection[] =>
  [...sections].sort((a, b) => {
    const ai = CASE_PREP_SECTION_ORDER.indexOf(a.sectionId);
    const bi = CASE_PREP_SECTION_ORDER.indexOf(b.sectionId);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.sectionId.localeCompare(b.sectionId);
  });

const mapPersonLabel = (value: unknown): string | null => {
  if (value == null || value === "") return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "object") {
    const person = value as { fullName?: string; name?: string; id?: string };
    return String(person.fullName ?? person.name ?? person.id ?? "").trim() || null;
  }
  return String(value).trim() || null;
};

/** Keep motors in the same order as batch `motorIds` (user-side tab order). */
export const sortCasePrepMotorsByPreferredIds = <T extends { motorId: string }>(
  motors: T[],
  preferredMotorIds?: Array<string | number> | null,
): T[] => {
  const preferred = (preferredMotorIds ?? []).map((id) => String(id ?? "").trim()).filter(Boolean);
  if (!preferred.length || motors.length <= 1) return motors;

  const order = new Map(preferred.map((id, index) => [id, index]));
  return [...motors].sort((a, b) => {
    const aIndex = order.has(a.motorId)
      ? (order.get(a.motorId) as number)
      : Number.MAX_SAFE_INTEGER;
    const bIndex = order.has(b.motorId)
      ? (order.get(b.motorId) as number)
      : Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.motorId.localeCompare(b.motorId);
  });
};

export const mapCasePreparationDetailsForDisplay = (
  data: Record<string, unknown> | null | undefined,
  _schema?: unknown,
  options?: { preferredMotorIds?: Array<string | number> | null },
): CasePreparationDetailView | null => {
  if (!data) return null;

  const labelIndex = getCasePrepStaticLabelIndex();
  const details = (data.casePreparationDetails ?? data) as Record<string, unknown>;
  const rawMotors = Array.isArray(details.motors) ? details.motors : [];
  const statusById = mapCasePreparationMotorStatusesFromApi(data);

  const preferredMotorIds =
    options?.preferredMotorIds ??
    (Array.isArray(data.motorIds) ? (data.motorIds as Array<string | number>) : null) ??
    (Array.isArray(details.motorIds) ? (details.motorIds as Array<string | number>) : null);

  const motors: CasePrepMotorDetailView[] = sortCasePrepMotorsByPreferredIds(
    rawMotors
      .map((motor) => {
        const entry = motor as Record<string, unknown>;
        const motorId = String(entry.motorId ?? "").trim();
        const statusMeta = statusById[motorId];
        const sections = sortCasePrepSections(
          resolveCasePrepMotorDetailSections(entry, labelIndex).filter(
            (section) => section.fields.length > 0 || section.tables.length > 0,
          ),
        );

        return {
          motorId,
          prrcClearanceDate: String(
            entry.prrcClearanceDate ?? entry.prrcDate ?? entry.prrcClearance ?? "",
          ).trim(),
          motorSubmissionType:
            statusMeta?.motorSubmissionType ??
            normalizeMotorSubmissionType(entry.motorSubmissionType),
          motorSubmissionStatus:
            statusMeta?.motorSubmissionStatus ?? normalizeMotorStatus(entry.motorSubmissionStatus),
          submittedAt:
            statusMeta?.submittedAt ?? (entry.submittedAt as string | null | undefined) ?? null,
          reviewedBy:
            statusMeta?.reviewedBy ?? (entry.reviewedBy as string | null | undefined) ?? null,
          reviewedAt:
            statusMeta?.reviewedAt ?? (entry.reviewedAt as string | null | undefined) ?? null,
          remarks: statusMeta?.remarks ?? (entry.remarks as string | null | undefined) ?? null,
          rejectionReason:
            statusMeta?.rejectionReason ??
            (entry.rejectionReason as string | null | undefined) ??
            null,
          sections,
          casePrepData: parseCasePrepMotorDataFromApi(entry),
        };
      })
      .filter((motor) => motor.motorId.length > 0),
    preferredMotorIds,
  );

  const motorCountsFromApi = (data.motorCounts ?? details.motorCounts) as
    | Partial<MotorCounts>
    | undefined;
  const derivedCounts: MotorCounts = {
    pendingMotorCount: 0,
    approvedMotorCount: 0,
    rejectedMotorCount: 0,
    inProgressMotorCount: 0,
    totalMotorCount: motors.length,
  };
  motors.forEach((motor) => {
    const status = String(motor.motorSubmissionStatus ?? "TO_BE_INITIATED").toUpperCase();
    if (status === "WAITING_FOR_APPROVAL") derivedCounts.pendingMotorCount += 1;
    else if (status === "APPROVED") derivedCounts.approvedMotorCount += 1;
    else if (status === "REJECTED") derivedCounts.rejectedMotorCount += 1;
    else if (status === "IN_PROGRESS") derivedCounts.inProgressMotorCount += 1;
  });

  return {
    formId: String(data.formId ?? ""),
    batchId: String(data.batchId ?? ""),
    batchType: String(data.batchType ?? ""),
    status:
      data.status != null
        ? getCasePrepBatchStatusLabel(data.status)
        : details.status != null
          ? getCasePrepBatchStatusLabel(details.status)
          : undefined,
    formSubmissionType:
      String(data.formSubmissionType ?? details.formSubmissionType ?? "").trim() || undefined,
    createdBy: mapPersonLabel(data.createdBy),
    createdAt: data.createdAt != null ? String(data.createdAt) : null,
    submittedBy: mapPersonLabel(data.submittedBy),
    submittedAt: data.submittedAt != null ? String(data.submittedAt) : null,
    motorCounts: {
      pendingMotorCount: Number(
        motorCountsFromApi?.pendingMotorCount ?? derivedCounts.pendingMotorCount,
      ),
      approvedMotorCount: Number(
        motorCountsFromApi?.approvedMotorCount ?? derivedCounts.approvedMotorCount,
      ),
      rejectedMotorCount: Number(
        motorCountsFromApi?.rejectedMotorCount ?? derivedCounts.rejectedMotorCount,
      ),
      inProgressMotorCount: Number(
        motorCountsFromApi?.inProgressMotorCount ?? derivedCounts.inProgressMotorCount,
      ),
      totalMotorCount: Math.max(
        Number(motorCountsFromApi?.totalMotorCount ?? 0),
        derivedCounts.totalMotorCount,
      ),
    },
    motors,
  };
};
