import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission, SchemaTableBlock } from "../../../schema-engine";
import type { SchemaSetupContext } from "../../../schema-engine/utils/setupContext";
import {
  buildCasePrepMotorSubmission,
  buildCasePrepSectionPayload,
  createCasePrepInitialValues,
  hydrateCasePrepValuesFromSections,
  type CasePrepMotorSubmission,
} from "../../../schema-engine";
import { flattenTableColumns, walkBlocks } from "../../../schema-engine/utils/schemaUtils";
import { isWrappedTableValue } from "../../../schema-engine/utils/tableRowUtils";
import { schemaValuesHaveUserData } from "../../../schema-engine/state/formState";
import { formatToIsoDateInput } from "../../../utils/dateUtils";
import { OPERATION_STATUS } from "../../../hooks/operationStatus";
import { normalizeSubdepartmentBatchStatus } from "./SubdepartmentBatchModel";
import {
  formatPrepSectionCellValue,
  formatPrepSectionLabel,
  getPremixStatusLabel,
} from "./RawMaterialPreparationModel";
import { formatDateTimeForApi } from "./rawMaterialPreparationApiMapper";

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
  if (!raw) return value;

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

const convertCasePrepDatesDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(convertCasePrepDatesDeep);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
      out[key] = convertCasePrepDatesDeep(entry);
    });
    return out;
  }
  return toCasePrepPayloadDateValue(value);
};

const convertCasePrepSectionsDatesForApi = (
  sections: SchemaSectionSubmission[] | undefined,
): SchemaSectionSubmission[] | undefined => {
  if (!sections) return sections;
  return convertCasePrepDatesDeep(sections) as SchemaSectionSubmission[];
};

const convertCasePrepMotorDatesForApi = (
  motor: CasePrepMotorSubmission,
): CasePrepMotorSubmission => ({
  ...motor,
  prrcClearanceDate: toCasePrepPayloadDate(motor.prrcClearanceDate),
  sections: convertCasePrepSectionsDatesForApi(motor.sections) ?? [],
});

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
  !status ||
  status === "TO_BE_INITIATED" ||
  status === "IN_PROGRESS" ||
  status === "REJECTED";

export const isMotorApproverTabDisabled = (
  status?: MotorSubmissionStatus | string | null,
): boolean =>
  !status || status === "TO_BE_INITIATED" || status === "IN_PROGRESS";

export const isMotorApproverActionable = (
  status?: MotorSubmissionStatus | string | null,
): boolean => status === "WAITING_FOR_APPROVAL";

/** Entire form can be approved/rejected once submitted and every motor is approved. */
export const canApproverActionEntireCasePrepForm = (params: {
  formSubmissionType?: string | null;
  status?: string | null;
  motors?: Array<{ motorSubmissionStatus?: MotorSubmissionStatus | string | null }>;
}): boolean => {
  const formType = String(params.formSubmissionType ?? "").trim().toUpperCase();
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
  formValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
};

export type CasePreparationFormState = {
  schema: SchemaDocumentV2 | null;
  motors: CasePrepMotorSession[];
  subscaleFormValues: SchemaFormValues;
  subscaleSavedSections?: SchemaSectionSubmission[];
};

export type CasePreparationFormBody = {
  motors: CasePrepMotorSubmission[];
  sections?: SchemaSectionSubmission[];
};

export const createDefaultCasePreparationFormState = (): CasePreparationFormState => ({
  schema: null,
  motors: [],
  subscaleFormValues: {},
});

export const createEmptyMotorSession = (
  motorId: string,
  prrcClearanceDate: string,
  _schema?: SchemaDocumentV2 | null,
  _setupContext?: SchemaSetupContext,
): CasePrepMotorSession => ({
  motorId,
  prrcClearanceDate,
  formValues: {},
  savedSections: undefined,
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
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "DRAFT" || normalized === "SUBMIT") return normalized;
  return undefined;
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
        normalizeMotorSubmissionType(motor?.motorSubmissionType) ??
        existing?.motorSubmissionType,
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
    .map((motor: any) => ({
      motorId: String(motor?.motorId ?? "").trim(),
      prrcClearanceDate: String(
        motor?.prrcClearanceDate ?? motor?.prrcDate ?? motor?.prrcClearance ?? "",
      ).trim(),
      formValues: {},
      savedSections: Array.isArray(motor?.sections)
        ? motor.sections
        : Array.isArray(motor?.motorSections)
          ? motor.motorSections
          : undefined,
    }))
    .filter((motor) => motor.motorId.length > 0);

  const sections = Array.isArray(payload?.sections)
    ? payload.sections
    : Array.isArray(details?.sections)
      ? details.sections
      : undefined;

  return {
    schema: null,
    motors,
    subscaleFormValues: {},
    subscaleSavedSections: sections,
  };
};

/**
 * Attach schema only. Motor form values are hydrated lazily in the active panel
 * so opening Fill Details stays O(1) instead of O(motors × schema walk).
 * Optionally hydrate a single motor (e.g. first tab) for immediate paint.
 */
export const hydrateCasePreparationFormState = (
  state: CasePreparationFormState,
  schema: SchemaDocumentV2 | null,
  setupContext?: SchemaSetupContext,
  options?: { hydrateMotorIds?: string[] },
): CasePreparationFormState => {
  if (!schema) return state;

  const hydrateIds = options?.hydrateMotorIds?.length
    ? new Set(options.hydrateMotorIds)
    : null;

  const motors = (state.motors ?? []).map((motor) => {
    if (Object.keys(motor.formValues ?? {}).length > 0) {
      return motor;
    }
    if (!hydrateIds?.has(motor.motorId)) {
      return motor;
    }
    if (motor.savedSections?.length) {
      return {
        ...motor,
        formValues: hydrateCasePrepValuesFromSections(
          schema,
          motor.savedSections,
          setupContext,
        ),
        savedSections: undefined,
      };
    }
    return {
      ...motor,
      formValues: createCasePrepInitialValues(schema, setupContext),
    };
  });

  const subscaleFormValues = state.subscaleSavedSections?.length
    ? hydrateCasePrepValuesFromSections(schema, state.subscaleSavedSections, setupContext)
    : Object.keys(state.subscaleFormValues ?? {}).length > 0
      ? state.subscaleFormValues
      : isSubscaleNeedsInitial(state)
        ? createCasePrepInitialValues(schema, setupContext)
        : state.subscaleFormValues ?? {};

  return {
    ...state,
    schema,
    motors,
    subscaleFormValues,
    subscaleSavedSections: state.subscaleSavedSections?.length
      ? undefined
      : state.subscaleSavedSections,
  };
};

const isSubscaleNeedsInitial = (state: CasePreparationFormState) =>
  (state.motors?.length ?? 0) === 0 &&
  Object.keys(state.subscaleFormValues ?? {}).length === 0 &&
  !(state.subscaleSavedSections?.length);

export const mapCasePreparationFormStateToPayload = (
  form: CasePreparationFormState,
  options?: {
    targetMotorIds?: string[];
    motorSubmissionType?: MotorSubmissionType;
  },
): CasePreparationFormBody => {
  const schema = form.schema;

  if (!schema) {
    return {
      motors: [],
      sections: [],
    };
  }

  const targetIds = options?.targetMotorIds?.length
    ? new Set(options.targetMotorIds.map((id) => String(id).trim()).filter(Boolean))
    : null;

  const motors = (form.motors ?? [])
    .filter((motor) => !targetIds || targetIds.has(motor.motorId))
    .map((motor) => {
      if (
        Object.keys(motor.formValues ?? {}).length === 0 &&
        motor.savedSections?.length
      ) {
        return {
          motorId: motor.motorId,
          prrcClearanceDate: motor.prrcClearanceDate,
          ...(options?.motorSubmissionType
            ? { motorSubmissionType: options.motorSubmissionType }
            : {}),
          sections: motor.savedSections,
        };
      }
      return buildCasePrepMotorSubmission(
        motor.motorId,
        motor.prrcClearanceDate,
        schema,
        motor.formValues,
        options?.motorSubmissionType,
      );
    });

  return {
    motors: motors.map(convertCasePrepMotorDatesForApi),
    sections: convertCasePrepSectionsDatesForApi(
      motors.length === 0
        ? form.subscaleSavedSections?.length &&
          Object.keys(form.subscaleFormValues ?? {}).length === 0
          ? form.subscaleSavedSections
          : buildCasePrepSectionPayload(schema, form.subscaleFormValues)
        : undefined,
    ),
  };
};

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
      return {
        motorId,
        prrcClearanceDate: String(motor?.prrcClearanceDate ?? "").trim(),
        motorSubmissionType:
          statusMeta?.motorSubmissionType ??
          normalizeMotorSubmissionType(motor?.motorSubmissionType) ??
          "SUBMIT",
        sections: Array.isArray(motor?.sections) ? motor.sections : [],
      } as CasePrepMotorSubmission;
    })
    .filter(Boolean) as CasePrepMotorSubmission[];

  return {
    motors: motors.map(convertCasePrepMotorDatesForApi),
    sections: convertCasePrepSectionsDatesForApi(
      Array.isArray(payload?.sections) ? payload.sections : undefined,
    ),
  };
};

export const hasAnyCasePreparationValue = (form: CasePreparationFormState) => {
  if (
    (form.motors ?? []).some(
      (motor) =>
        schemaValuesHaveUserData(motor.formValues ?? {}) ||
        Boolean(motor.savedSections?.length),
    )
  ) {
    return true;
  }
  return (
    schemaValuesHaveUserData(form.subscaleFormValues ?? {}) ||
    Boolean(form.subscaleSavedSections?.length)
  );
};

export const hasMotorCasePreparationValue = (
  form: CasePreparationFormState,
  motorId: string,
) => {
  const motor = (form.motors ?? []).find((entry) => entry.motorId === motorId);
  if (!motor) return false;
  return (
    schemaValuesHaveUserData(motor.formValues ?? {}) || Boolean(motor.savedSections?.length)
  );
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
      motors:
        casePreparationDetails?.motors ??
        payload?.motors ??
        [],
      sections:
        casePreparationDetails?.sections ??
        payload?.sections ??
        [],
      generalActivities:
        casePreparationDetails?.generalActivities ??
        payload?.generalActivities ??
        {},
      linearCoatingOperation:
        casePreparationDetails?.linearCoatingOperation ??
        payload?.linearCoatingOperation ??
        {},
    };
  }
}

export type CasePrepDetailField = {
  key: string;
  label: string;
  value: string;
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

export const buildCasePrepSchemaLabelIndex = (
  schema: SchemaDocumentV2 | null | undefined,
): CasePrepSchemaLabelIndex => {
  const index: CasePrepSchemaLabelIndex = {
    sections: {},
    blocks: {},
    tableColumns: {},
    tablePresetRows: {},
  };

  if (!schema?.data?.sections) return index;

  schema.data.sections.forEach((section) => {
    index.sections[section.id] = section.title ?? formatPrepSectionLabel(section.id);

    walkBlocks(section.children, (block) => {
      if (block.type === "field") {
        index.blocks[block.id] = block.label ?? formatPrepSectionLabel(block.id);
        return;
      }

      if (block.type === "display") {
        index.blocks[block.id] = block.label ?? formatPrepSectionLabel(block.id);
        return;
      }

      if (block.type === "group" && block.label) {
        index.blocks[block.id] = block.label;
        return;
      }

      if (block.type === "table") {
        const table = block as SchemaTableBlock;
        index.blocks[table.id] =
          table.title ?? table.label ?? formatPrepSectionLabel(table.id);
        index.tableColumns[table.id] = {};
        flattenTableColumns(table.columns).forEach((column) => {
          index.tableColumns[table.id][column.id] =
            column.label ?? formatPrepSectionLabel(column.id);
        });
        if (table.rows?.presetRows?.length) {
          index.tablePresetRows[table.id] = table.rows.presetRows;
        }
      }
    });
  });

  return index;
};

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
): string =>
  labelIndex?.tableColumns[tableId]?.[columnId] ?? formatPrepSectionLabel(columnId);

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
  const visible = columns.filter((col) => !CASE_PREP_HIDDEN_TABLE_COLUMNS.has(col) && !col.startsWith("_"));
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
    columns.map((columnId) => [columnId, resolveCasePrepColumnLabel(labelIndex, tableId, columnId)]),
  );
};

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

const isFlatCasePrepTableSection = (sectionData: Record<string, unknown>[] | undefined): boolean => {
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
      const nestedRows = dataRow.filter(
        (item): item is Record<string, unknown> =>
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
        value: formatted,
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

export const mapCasePreparationDetailsForDisplay = (
  data: Record<string, unknown> | null | undefined,
  schema?: SchemaDocumentV2 | null,
): CasePreparationDetailView | null => {
  if (!data) return null;

  const labelIndex = buildCasePrepSchemaLabelIndex(schema);
  const details = (data.casePreparationDetails ?? data) as Record<string, unknown>;
  const rawMotors = Array.isArray(details.motors) ? details.motors : [];
  const statusById = mapCasePreparationMotorStatusesFromApi(data);

  const motors: CasePrepMotorDetailView[] = rawMotors
    .map((motor) => {
      const entry = motor as Record<string, unknown>;
      const motorId = String(entry.motorId ?? "").trim();
      const statusMeta = statusById[motorId];
      const sections = sortCasePrepSections(
        (Array.isArray(entry.sections) ? entry.sections : [])
          .map((section) => {
            const block = section as { sectionId?: string; sectionData?: Record<string, unknown>[] };
            return parseCasePrepSectionData(
              String(block.sectionId ?? ""),
              block.sectionData,
              labelIndex,
            );
          })
          .filter((section) => section.fields.length > 0 || section.tables.length > 0),
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
          statusMeta?.motorSubmissionStatus ??
          normalizeMotorStatus(entry.motorSubmissionStatus),
        submittedAt: statusMeta?.submittedAt ?? (entry.submittedAt as string | null | undefined) ?? null,
        reviewedBy: statusMeta?.reviewedBy ?? (entry.reviewedBy as string | null | undefined) ?? null,
        reviewedAt: statusMeta?.reviewedAt ?? (entry.reviewedAt as string | null | undefined) ?? null,
        remarks: statusMeta?.remarks ?? (entry.remarks as string | null | undefined) ?? null,
        rejectionReason:
          statusMeta?.rejectionReason ??
          (entry.rejectionReason as string | null | undefined) ??
          null,
        sections,
      };
    })
    .filter((motor) => motor.motorId.length > 0);

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
    formSubmissionType: String(
      data.formSubmissionType ?? details.formSubmissionType ?? "",
    ).trim() || undefined,
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
