import type {
  SchemaDocumentV2,
  SchemaFormValues,
  SchemaSectionSubmission,
  SchemaSetupContext,
} from "../../../schema-engine";
import {
  buildCastingCuringSectionPayload,
  createCastingCuringInitialValues,
  hydrateCastingCuringValuesFromSections,
  buildCastingSetupContext,
  schemaValuesHaveUserData,
} from "../../../schema-engine";
import { cloneValue } from "../../../schema-engine/state/formState";
import type { CuringProjectStageMatrix } from "./curingProjectStageMatrix";
import { OPERATION_STATUS } from "../../../hooks/operationStatus";
import { normalizeSubdepartmentBatchStatus } from "./SubdepartmentBatchModel";
import {
  formatPrepSectionCellValue,
  formatPrepSectionLabel,
} from "./RawMaterialPreparationModel";
import type {
  CasePrepDetailField,
  CasePrepDetailSection,
  CasePrepDetailTable,
} from "./CasePreparationFormModel";

export type CastingProcessSetup = Record<string, never>;

export type CuringProcessSetup = {
  oven: string;
  ovenNo: string;
  curingType: string;
  configuration: string;
  motorsToCureCount: number | "";
  ovensUtilized: string;
};

export type CastingCuringMotorSubmissionType = "DRAFT" | "SUBMIT";
export type CastingCuringMotorSubmissionStatus =
  | "TO_BE_INITIATED"
  | "IN_PROGRESS"
  | "WAITING_FOR_APPROVAL"
  | "APPROVED"
  | "REJECTED";

export type CastingCuringMotorStatusMeta = {
  motorSubmissionType?: CastingCuringMotorSubmissionType;
  motorSubmissionStatus: CastingCuringMotorSubmissionStatus;
  submittedAt?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  remarks?: string | null;
  rejectionReason?: string | null;
};

export const isCastingCuringMotorLocked = (status?: CastingCuringMotorSubmissionStatus | string | null) => {
  const normalized = String(status ?? "").toUpperCase();
  return normalized === "WAITING_FOR_APPROVAL" || normalized === "APPROVED";
};

export const isCastingCuringMotorEditable = (status?: CastingCuringMotorSubmissionStatus | string | null) =>
  !status ||
  status === "TO_BE_INITIATED" ||
  status === "IN_PROGRESS" ||
  status === "REJECTED";

export const areAllCastingCuringMotorsApproved = (
  motorStatusById: Record<string, CastingCuringMotorStatusMeta>,
): boolean => {
  const entries = Object.values(motorStatusById);
  if (entries.length === 0) return false;
  return entries.every(
    (meta) => String(meta.motorSubmissionStatus ?? "").toUpperCase() === "APPROVED",
  );
};

export const isCastingCuringMotorApproverTabDisabled = (
  status?: CastingCuringMotorSubmissionStatus | string | null,
): boolean =>
  !status || status === "TO_BE_INITIATED";

export const isCastingCuringMotorApproverActionable = (
  status?: CastingCuringMotorSubmissionStatus | string | null,
): boolean => {
  const normalized = String(status ?? "").trim().toUpperCase().replace(/\s+/g, "_");
  return normalized === "WAITING_FOR_APPROVAL" || normalized === "IN_PROGRESS";
};

export const canApproverActionEntireCastingCuringForm = (params: {
  formSubmissionType?: string | null;
  status?: string | null;
  motors?: Array<{ motorSubmissionStatus?: CastingCuringMotorSubmissionStatus | string | null }>;
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

export const getCastingCuringBatchStatusLabel = (status: unknown): string =>
  String(normalizeSubdepartmentBatchStatus(status));

export type CastingCuringMotorCounts = {
  pendingMotorCount: number;
  approvedMotorCount: number;
  rejectedMotorCount: number;
  inProgressMotorCount: number;
  toBeInitiatedMotorCount: number;
  totalMotorCount: number;
};

export const normalizeCastingCuringMotorStatus = (value: unknown): CastingCuringMotorSubmissionStatus => {
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

const normalizeCCMotorStatus = normalizeCastingCuringMotorStatus;

export const normalizeCastingCuringMotorSubmissionType = (
  value: unknown,
): CastingCuringMotorSubmissionType | undefined => {
  const raw = String(value ?? "").trim().toUpperCase();
  if (raw === "DRAFT" || raw === "SUBMIT") return raw;
  return undefined;
};

const normalizeCCMotorSubmissionType = normalizeCastingCuringMotorSubmissionType;

export const mapCastingCuringMotorStatusesFromApi = (
  details: any,
): Record<string, CastingCuringMotorStatusMeta> => {
  const root = details?.data ?? details ?? {};
  const statusById: Record<string, CastingCuringMotorStatusMeta> = {};

  const rootStatuses = Array.isArray(root?.motorStatuses)
    ? root.motorStatuses
    : Array.isArray(details?.motorStatuses)
      ? details.motorStatuses
      : [];

  rootStatuses.forEach((entry: any) => {
    const motorId = String(entry?.motorId ?? "").trim();
    if (!motorId) return;
    statusById[motorId] = {
      motorSubmissionType: normalizeCCMotorSubmissionType(entry?.motorSubmissionType),
      motorSubmissionStatus: normalizeCCMotorStatus(entry?.motorSubmissionStatus),
      submittedAt: entry?.submittedAt ?? null,
      reviewedBy: entry?.reviewedBy ?? entry?.actionBy ?? null,
      reviewedAt: entry?.reviewedAt ?? entry?.actionAt ?? null,
      remarks: entry?.remarks ?? null,
      rejectionReason: entry?.rejectionReason ?? null,
    };
  });

  const payload = details?.castingCuringDetails ?? details?.preparationDetails ?? details ?? {};
  const rawMotors = Array.isArray(payload?.motors) ? payload.motors : [];
  rawMotors.forEach((motor: any) => {
    const motorId = String(motor?.motorId ?? "").trim();
    if (!motorId) return;
    const existing = statusById[motorId];
    statusById[motorId] = {
      motorSubmissionType:
        normalizeCCMotorSubmissionType(motor?.motorSubmissionType) ??
        existing?.motorSubmissionType,
      motorSubmissionStatus: normalizeCCMotorStatus(
        motor?.motorSubmissionStatus ?? existing?.motorSubmissionStatus,
      ),
      submittedAt: motor?.submittedAt ?? existing?.submittedAt ?? null,
      reviewedBy: motor?.actionBy ?? motor?.reviewedBy ?? existing?.reviewedBy ?? null,
      reviewedAt: motor?.actionAt ?? motor?.reviewedAt ?? existing?.reviewedAt ?? null,
      remarks: motor?.remarks ?? existing?.remarks ?? null,
      rejectionReason: motor?.rejectionReason ?? existing?.rejectionReason ?? null,
    };
  });

  return statusById;
};

export type CastingCuringMotorSession = {
  motorId: string;
  motorReceivedAt: string;
  /** Snapshot of casting process setup captured when this motor was added. */
  castingType?: string;
  castingStation?: string;
  castingSetup?: CastingProcessSetup;
  formValues: SchemaFormValues;
  curingSetup: CuringProcessSetup;
  /** Set after user saves casting and explicitly continues to curing. */
  castingSavedForCuring?: boolean;
  curingFormLoaded?: boolean;
  curingFormValues?: SchemaFormValues;
  curingProjectStageMatrix?: CuringProjectStageMatrix;
  savedSections?: SchemaSectionSubmission[];
  curingSavedSections?: SchemaSectionSubmission[];
};

export type CastingCuringFormState = {
  castingType: string;
  castingStation: string;
  castingSetup: CastingProcessSetup;
  castingFormLoaded: boolean;
  readyForCuring: boolean;
  castingSchema: SchemaDocumentV2 | null;
  curingSchema: SchemaDocumentV2 | null;
  motors: CastingCuringMotorSession[];
  curingFormValues: SchemaFormValues;
  curingSavedSections?: SchemaSectionSubmission[];
};

export type CastingCuringFormBody = {
  motors: Array<{
    motorId: string;
    motorReceivedAt: string;
    motorSubmissionType?: CastingCuringMotorSubmissionType;
    setup: {
      castingType: string;
      castingStation: string;
    };
    curingSetup: {
      oven: string;
      ovenNo: string;
      curingType: string;
      configuration: string;
      motorsToCureCount: number | "";
      ovensUtilized: string;
    };
    castingSections: SchemaSectionSubmission[];
    curingSections: SchemaSectionSubmission[];
  }>;
};

export const createDefaultCastingProcessSetup = (): CastingProcessSetup => ({});

export const createDefaultCuringProcessSetup = (): CuringProcessSetup => ({
  oven: "",
  ovenNo: "",
  curingType: "",
  configuration: "",
  motorsToCureCount: "",
  ovensUtilized: "",
});

export const createDefaultCastingCuringFormState = (): CastingCuringFormState => ({
  castingType: "",
  castingStation: "",
  castingSetup: createDefaultCastingProcessSetup(),
  castingFormLoaded: false,
  readyForCuring: false,
  castingSchema: null,
  curingSchema: null,
  motors: [],
  curingFormValues: {},
});

export const resolveCastingMotorProcessMeta = (
  motor: CastingCuringMotorSession,
  form: Pick<CastingCuringFormState, "castingType" | "castingStation" | "castingSetup">,
) => ({
  castingType: String(motor.castingType ?? form.castingType ?? "").trim(),
  castingStation: String(motor.castingStation ?? form.castingStation ?? "").trim(),
  castingSetup: motor.castingSetup ?? form.castingSetup ?? createDefaultCastingProcessSetup(),
});

export type CastingMotorProcessMeta = ReturnType<typeof resolveCastingMotorProcessMeta>;

export const normalizeCastingCuringMotorId = (motorId: string) => String(motorId).trim();

export const resolveMotorCuringFormValues = (
  motor: Pick<CastingCuringMotorSession, "curingFormValues" | "curingSavedSections">,
  curingSchema: SchemaDocumentV2,
  setupContext?: SchemaSetupContext,
): SchemaFormValues => {
  if (motor.curingSavedSections?.length) {
    return cloneValue(
      hydrateCastingCuringValuesFromSections(
        curingSchema,
        motor.curingSavedSections,
        setupContext,
      ),
    );
  }
  if (motor.curingFormValues && Object.keys(motor.curingFormValues).length > 0) {
    return cloneValue(motor.curingFormValues);
  }
  return cloneValue(createCastingCuringInitialValues(curingSchema, setupContext));
};

export const buildMotorCuringValuesMapFromSessions = (
  motors: CastingCuringMotorSession[],
): Record<string, SchemaFormValues> => {
  const map: Record<string, SchemaFormValues> = {};
  for (const motor of motors) {
    const motorId = normalizeCastingCuringMotorId(motor.motorId);
    if (!motorId || !motor.curingFormLoaded) continue;
    if (!motor.curingFormValues || Object.keys(motor.curingFormValues).length === 0) continue;
    map[motorId] = cloneValue(motor.curingFormValues);
  }
  return map;
};

export const buildMotorCastingValuesMapFromSessions = (
  motors: CastingCuringMotorSession[],
): Record<string, SchemaFormValues> => {
  const map: Record<string, SchemaFormValues> = {};
  for (const motor of motors) {
    const motorId = normalizeCastingCuringMotorId(motor.motorId);
    if (!motorId || !motor.formValues || Object.keys(motor.formValues).length === 0) continue;
    map[motorId] = cloneValue(motor.formValues);
  }
  return map;
};

export const applyMotorCuringValuesMap = (
  form: CastingCuringFormState,
  valuesById: Record<string, SchemaFormValues>,
): CastingCuringFormState => ({
  ...form,
  curingFormValues: {},
  motors: (form.motors ?? []).map((motor) => {
    const motorId = normalizeCastingCuringMotorId(motor.motorId);
    if (!motor.curingFormLoaded) return motor;
    const curingFormValues = valuesById[motorId];
    if (!curingFormValues) return motor;
    return { ...motor, curingFormValues: cloneValue(curingFormValues) };
  }),
});

export const applyMotorCastingValuesMap = (
  form: CastingCuringFormState,
  valuesById: Record<string, SchemaFormValues>,
): CastingCuringFormState => ({
  ...form,
  motors: (form.motors ?? []).map((motor) => {
    const motorId = normalizeCastingCuringMotorId(motor.motorId);
    const castingFormValues = valuesById[motorId];
    if (!castingFormValues) return motor;
    return { ...motor, formValues: cloneValue(castingFormValues) };
  }),
});

export const applyMotorFormValuesMaps = (
  form: CastingCuringFormState,
  castingValuesById: Record<string, SchemaFormValues>,
  curingValuesById: Record<string, SchemaFormValues>,
): CastingCuringFormState =>
  applyMotorCuringValuesMap(applyMotorCastingValuesMap(form, castingValuesById), curingValuesById);

export const createEmptyMotorSession = (
  motorId: string,
  motorReceivedAt: string,
  schema: SchemaDocumentV2 | null,
  setupContext?: SchemaSetupContext,
  castingMeta?: CastingMotorProcessMeta,
): CastingCuringMotorSession => ({
  motorId,
  motorReceivedAt,
  castingType: castingMeta?.castingType,
  castingStation: castingMeta?.castingStation,
  castingSetup: castingMeta?.castingSetup
    ? { ...castingMeta.castingSetup }
    : undefined,
  formValues: schema ? createCastingCuringInitialValues(schema, setupContext) : {},
  curingFormValues: {},
  curingSetup: createDefaultCuringProcessSetup(),
  curingFormLoaded: false,
  castingSavedForCuring: false,
  savedSections: undefined,
});

export const mapCastingCuringDetailsToFormState = (details: any): CastingCuringFormState => {
  const payload = details?.castingCuringDetails ?? details?.preparationDetails ?? details ?? {};
  const rawMotors = Array.isArray(payload?.motors) ? payload.motors : [];

  const extractMotorData = (motor: any) => {
    const src = motor?.details ?? motor;
    const motorSetup = motor?.setup ?? src?.setup ?? {};
    return {
      motorId: String(motor?.motorId ?? src?.motorId ?? "").trim(),
      motorReceivedAt: String(src?.motorReceivedAt ?? motor?.motorReceivedAt ?? "").trim(),
      castingType: String(motorSetup?.castingType ?? "").trim(),
      castingStation: String(motorSetup?.castingStation ?? "").trim(),
      castingSetup: createDefaultCastingProcessSetup(),
      formValues: {},
      curingSetup: {
        oven: String(motor?.curingSetup?.oven ?? ""),
        ovenNo: String(motor?.curingSetup?.ovenNo ?? ""),
        curingType: String(motor?.curingSetup?.curingType ?? ""),
        configuration: String(motor?.curingSetup?.configuration ?? ""),
        motorsToCureCount: Number(motor?.curingSetup?.motorsToCureCount ?? "") || "",
        ovensUtilized: String(motor?.curingSetup?.ovensUtilized ?? ""),
      },
      curingFormLoaded: Boolean(
        String(motor?.curingSetup?.oven ?? "").trim() &&
          String(motor?.curingSetup?.ovenNo ?? "").trim(),
      ),
      castingSavedForCuring: Boolean(
        motor?.castingSavedForCuring ||
          (Array.isArray(motor?.sections) && motor.sections.length > 0) ||
          (Array.isArray(motor?.castingSections) && motor.castingSections.length > 0) ||
          (String(motor?.curingSetup?.oven ?? "").trim() &&
            String(motor?.curingSetup?.ovenNo ?? "").trim()),
      ),
      savedSections: Array.isArray(motor?.sections)
        ? motor.sections
        : Array.isArray(motor?.castingSections)
          ? motor.castingSections
          : undefined,
      curingSavedSections: Array.isArray(motor?.curingSections) ? motor.curingSections : undefined,
      curingProjectStageMatrix: motor?.curingProjectStageMatrix ?? undefined,
    };
  };

  const motors = rawMotors.map(extractMotorData).filter((motor) => motor.motorId.length > 0);

const curingSections = Array.isArray(payload?.curingSections)
  ? payload.curingSections
  : motors.find((motor) => Array.isArray(motor.curingSavedSections))?.curingSavedSections;

const firstMotorSetup = rawMotors.find((m: any) => m?.setup)?.setup ?? {};

return {
  castingType: String(
    payload?.setup?.castingType ?? payload?.castingType ?? firstMotorSetup?.castingType ?? "",
  ),
  castingStation: String(
    payload?.setup?.castingStation ?? payload?.castingStation ?? firstMotorSetup?.castingStation ?? "",
  ),
  castingSetup: createDefaultCastingProcessSetup(),
  castingFormLoaded: motors.length > 0,
  readyForCuring: false,
  castingSchema: null,
  curingSchema: null,
  motors,
  curingFormValues: {},
  curingSavedSections: curingSections,
};
};

export const hydrateCastingCuringFormState = (
  state: CastingCuringFormState,
  castingSchema: SchemaDocumentV2 | null,
  curingSchema: SchemaDocumentV2 | null,
): CastingCuringFormState => {
  const motors = (state.motors ?? []).map((motor) => {
    const motorContext = buildCastingSetupContext({
      ...(motor.castingSetup ?? state.castingSetup),
      castingType: motor.castingType ?? state.castingType,
      castingStation: motor.castingStation ?? state.castingStation,
      motorId: motor.motorId,
    });

    let curingFormValues: SchemaFormValues = {};
    if (curingSchema && motor.curingFormLoaded) {
      if (motor.curingSavedSections?.length) {
        curingFormValues = cloneValue(
          hydrateCastingCuringValuesFromSections(
            curingSchema,
            motor.curingSavedSections,
            motorContext,
          ),
        );
      } else if (motor.curingFormValues && Object.keys(motor.curingFormValues).length > 0) {
        curingFormValues = cloneValue(motor.curingFormValues);
      } else {
        curingFormValues = cloneValue(createCastingCuringInitialValues(curingSchema, motorContext));
      }
    }

    const formValues = castingSchema
      ? motor.savedSections?.length
        ? hydrateCastingCuringValuesFromSections(castingSchema, motor.savedSections, motorContext)
        : Object.keys(motor.formValues ?? {}).length > 0
          ? motor.formValues
          : createCastingCuringInitialValues(castingSchema, motorContext)
      : motor.formValues;

    return {
      ...motor,
      curingSetup: motor.curingSetup ?? createDefaultCuringProcessSetup(),
      castingSavedForCuring: Boolean(motor.castingSavedForCuring),
      curingFormLoaded: Boolean(motor.curingFormLoaded),
      curingFormValues,
      formValues,
    };
  });

  return {
    ...state,
    castingSchema,
    curingSchema,
    motors,
    curingFormValues: {},
  };
};

export const mapCastingCuringFormStateToPayload = (
  form: CastingCuringFormState,
  options?: {
    targetMotorIds?: string[];
    motorSubmissionType?: CastingCuringMotorSubmissionType;
  },
): CastingCuringFormBody => {
  const castingSchema = form.castingSchema;
  const curingSchema = form.curingSchema;

  const targetIds = options?.targetMotorIds?.length
    ? new Set(options.targetMotorIds.map((id) => String(id).trim()).filter(Boolean))
    : null;

  return {
    motors: castingSchema
      ? (form.motors ?? [])
          .filter((motor) => !targetIds || targetIds.has(motor.motorId))
          .map((motor) => {
            const meta = resolveCastingMotorProcessMeta(motor, form);
            return {
              motorId: motor.motorId,
              motorReceivedAt: motor.motorReceivedAt,
              ...(options?.motorSubmissionType
                ? { motorSubmissionType: options.motorSubmissionType }
                : {}),
              setup: {
                castingType: meta.castingType,
                castingStation: meta.castingStation,
              },
              curingSetup: {
                oven: String(motor.curingSetup?.oven ?? ""),
                ovenNo: String(motor.curingSetup?.ovenNo ?? ""),
                curingType: String(motor.curingSetup?.curingType ?? ""),
                configuration: String(motor.curingSetup?.configuration ?? ""),
                motorsToCureCount: motor.curingSetup?.motorsToCureCount ?? "",
                ovensUtilized: String(motor.curingSetup?.ovensUtilized ?? ""),
              },
              castingSections: buildCastingCuringSectionPayload(castingSchema, motor.formValues),
              curingSections: curingSchema
                ? buildCastingCuringSectionPayload(curingSchema, motor.curingFormValues ?? {})
                : [],
            };
          })
      : [],
  };
};

export const hasAnyCastingCuringValue = (form: CastingCuringFormState) => {
  if (String(form.castingType ?? "").trim() || String(form.castingStation ?? "").trim()) {
    return true;
  }

  if ((form.motors ?? []).some((motor) => schemaValuesHaveUserData(motor.formValues ?? {}))) {
    return true;
  }

  if ((form.motors ?? []).some((motor) => schemaValuesHaveUserData(motor.curingFormValues ?? {}))) {
    return true;
  }

  return false;
};

const CASTING_CURING_HIDDEN_COLUMNS = new Set([
  "type",
  "_rowType",
  "_headerLabel",
  "_groupId",
]);

const CASTING_CURING_TABLE_HIDDEN_COLUMNS: Record<string, Set<string>> = {
  POST_CAST_TABLE: new Set(["MOTOR_ID", "motorId"]),
};

const resolveCastingCuringTableBlockKey = (blockId: string) =>
  blockId.replace(/\s+\(\d+\)$/, "").trim();

const getCastingCuringHiddenColumnsForTable = (blockId: string) =>
  CASTING_CURING_TABLE_HIDDEN_COLUMNS[resolveCastingCuringTableBlockKey(blockId)] ?? new Set<string>();

const CASTING_CURING_COLUMN_PRIORITY = [
  "srNo",
  "SR_NO",
  "sr_no",
  "BOWL_ID",
  "BOWL_NO",
];

const isFlatCastingCuringTable = (value: unknown): value is Record<string, unknown>[] => {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every(
    (item) =>
      item &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      !Object.values(item as Record<string, unknown>).some((entry) => Array.isArray(entry)),
  );
};

const isCastingCuringRowEmpty = (row: Record<string, unknown>): boolean =>
  !Object.entries(row).some(
    ([key, value]) =>
      !key.startsWith("_") &&
      !CASTING_CURING_HIDDEN_COLUMNS.has(key) &&
      !key.endsWith("__fieldType") &&
      formatPrepSectionCellValue(value) !== "—",
  );

const filterCastingCuringDisplayRows = (rows: Record<string, unknown>[]) =>
  rows.filter((row) => !isCastingCuringRowEmpty(row));

export const orderCastingCuringDisplayColumns = (
  columns: string[],
  extraHidden: Set<string> = new Set(),
): string[] => {
  const visible = columns.filter(
    (col) =>
      !CASTING_CURING_HIDDEN_COLUMNS.has(col) &&
      !extraHidden.has(col) &&
      !col.startsWith("_") &&
      !col.endsWith("__fieldType"),
  );
  return [...visible].sort((a, b) => {
    const ai = CASTING_CURING_COLUMN_PRIORITY.indexOf(a);
    const bi = CASTING_CURING_COLUMN_PRIORITY.indexOf(b);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.localeCompare(b);
  });
};

const buildCastingCuringTableColumnLabels = (
  blockId: string,
  rows: Record<string, unknown>[],
): Record<string, string> => {
  const tableHidden = getCastingCuringHiddenColumnsForTable(blockId);
  const columns = orderCastingCuringDisplayColumns(
    Array.from(
      rows.reduce((keys, row) => {
        Object.keys(row ?? {}).forEach((key) => keys.add(key));
        return keys;
      }, new Set<string>()),
    ),
    tableHidden,
  );
  return Object.fromEntries(columns.map((columnId) => [columnId, formatPrepSectionLabel(columnId)]));
};

const resolveCastingCuringTableLabel = (blockId: string, tables: CasePrepDetailTable[]) => {
  const baseLabel = formatPrepSectionLabel(blockId);
  const duplicates = tables.filter((table) => table.blockId === blockId || table.blockId.startsWith(`${blockId} (`));
  if (duplicates.length === 0) return { blockId, label: baseLabel };
  const suffix = duplicates.length + 1;
  return { blockId: `${blockId} (${suffix})`, label: `${baseLabel} (${suffix})` };
};

const pushCastingCuringTable = (
  tables: CasePrepDetailTable[],
  blockId: string,
  rows: Record<string, unknown>[],
) => {
  const displayRows = filterCastingCuringDisplayRows(rows);
  if (!displayRows.length) return;
  const { blockId: uniqueBlockId, label } = resolveCastingCuringTableLabel(blockId, tables);
  tables.push({
    blockId: uniqueBlockId,
    label,
    rows: displayRows,
    columnLabels: buildCastingCuringTableColumnLabels(uniqueBlockId, displayRows),
  });
};

const walkCastingCuringObject = (
  blockId: string,
  obj: Record<string, unknown>,
  fields: CasePrepDetailField[],
  tables: CasePrepDetailTable[],
) => {
  Object.entries(obj)
    .filter(([key]) => !key.startsWith("_"))
    .forEach(([key, value]) => {
      if (isFlatCastingCuringTable(value)) {
        pushCastingCuringTable(tables, key, value);
        return;
      }

      if (Array.isArray(value)) {
        walkCastingCuringValue(key, value, fields, tables);
        return;
      }

      if (value && typeof value === "object") {
        walkCastingCuringValue(key, value, fields, tables);
        return;
      }

      const formatted = formatPrepSectionCellValue(value);
      if (formatted === "—") return;
      fields.push({
        key: blockId ? `${blockId}.${key}` : key,
        label: formatPrepSectionLabel(key),
        value: formatted,
      });
    });
};

const walkCastingCuringValue = (
  blockId: string,
  value: unknown,
  fields: CasePrepDetailField[],
  tables: CasePrepDetailTable[],
) => {
  if (value === null || value === undefined || value === "") return;

  if (isFlatCastingCuringTable(value)) {
    pushCastingCuringTable(tables, blockId, value);
    return;
  }

  if (Array.isArray(value)) {
    const objectItems = value.filter(
      (item): item is Record<string, unknown> =>
        Boolean(item && typeof item === "object" && !Array.isArray(item)),
    );
    if (!objectItems.length) return;

    if (objectItems.length === 1) {
      walkCastingCuringObject(blockId, objectItems[0], fields, tables);
      return;
    }

    objectItems.forEach((entry, index) => {
      walkCastingCuringObject(`${blockId} ${index + 1}`, entry, fields, tables);
    });
    return;
  }

  if (typeof value === "object") {
    walkCastingCuringObject(blockId, value as Record<string, unknown>, fields, tables);
  }
};

export const parseCastingCuringSectionData = (
  sectionId: string,
  sectionData: unknown,
): CasePrepDetailSection => {
  const fields: CasePrepDetailField[] = [];
  const tables: CasePrepDetailTable[] = [];

  if (isFlatCastingCuringTable(sectionData)) {
    pushCastingCuringTable(tables, sectionId, sectionData);
  } else if (Array.isArray(sectionData)) {
    sectionData.forEach((dataRow) => {
      walkCastingCuringValue(sectionId, dataRow, fields, tables);
    });
  }

  return {
    sectionId,
    label: formatPrepSectionLabel(sectionId),
    fields,
    tables,
  };
};

export type CastingCuringMotorDetailView = {
  motorId: string;
  motorReceivedAt: string;
  motorSubmissionType?: CastingCuringMotorSubmissionType;
  motorSubmissionStatus?: CastingCuringMotorSubmissionStatus;
  rejectionReason?: string | null;
  setup: {
    castingType: string;
    castingStation: string;
  };
  curingSetup: {
    oven: string;
    ovenNo: string;
    curingType: string;
    configuration: string;
    motorsToCureCount: string;
    ovensUtilized: string;
  };
  castingSections: CasePrepDetailSection[];
  curingSections: CasePrepDetailSection[];
};

export type CastingCuringDetailView = {
  formId: string;
  batchId: string;
  batchType: string;
  status?: string;
  formSubmissionType?: string;
  projectId: string;
  projectName: string;
  createdBy: string | null;
  createdAt: string | null;
  submittedBy: string | null;
  submittedAt: string | null;
  lastUpdatedBy: string | null;
  lastUpdatedAt: string | null;
  motorCounts?: CastingCuringMotorCounts;
  motors: CastingCuringMotorDetailView[];
};

export const mapCastingCuringPersonLabel = (value: unknown): string | null => {
  if (value == null || value === "") return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "object") {
    const person = value as { fullName?: string; name?: string; id?: string };
    return String(person.fullName ?? person.name ?? person.id ?? "").trim() || null;
  }
  return String(value).trim() || null;
};

const parseCastingCuringDisplaySections = (
  sections: unknown[] | undefined,
): CasePrepDetailSection[] =>
  (sections ?? [])
    .map((section) => {
      const block = section as { sectionId?: string; sectionData?: Record<string, unknown>[] };
      return parseCastingCuringSectionData(String(block.sectionId ?? ""), block.sectionData);
    })
    .filter((section) => section.fields.length > 0 || section.tables.length > 0);

export const mapCastingCuringDetailsForDisplay = (
  data: Record<string, unknown> | null | undefined,
  options?: { preferredMotorIds?: Array<string | number> | null },
): CastingCuringDetailView | null => {
  if (!data) return null;

  const details = (data.castingCuringDetails ?? data) as Record<string, unknown>;
  const rawMotors = Array.isArray(details.motors) ? details.motors : [];
  const project = (details.project ?? {}) as Record<string, unknown>;

  const motorStatuses = mapCastingCuringMotorStatusesFromApi(data);

  const preferredMotorIds =
    options?.preferredMotorIds ??
    (Array.isArray(data.motorIds) ? (data.motorIds as Array<string | number>) : null) ??
    (Array.isArray(details.motorIds) ? (details.motorIds as Array<string | number>) : null);

  const motors: CastingCuringMotorDetailView[] = rawMotors
    .map((motor) => {
      const entry = motor as Record<string, unknown>;
      const src = (entry.details ?? entry) as Record<string, unknown>;
      const setup = (src.setup ?? {}) as Record<string, unknown>;
      const curingSetup = (src.curingSetup ?? {}) as Record<string, unknown>;
      const motorId = String(entry.motorId ?? src.motorId ?? "").trim();
      const statusMeta = motorStatuses[motorId];

      return {
        motorId,
        motorReceivedAt: String(src.motorReceivedAt ?? "").trim(),
        motorSubmissionType: statusMeta?.motorSubmissionType ?? normalizeCCMotorSubmissionType(entry.motorSubmissionType as unknown),
        motorSubmissionStatus: statusMeta?.motorSubmissionStatus ?? normalizeCCMotorStatus(entry.motorSubmissionStatus),
        rejectionReason: statusMeta?.rejectionReason ?? (entry.rejectionReason as string | null) ?? null,
        setup: {
          castingType: String(setup.castingType ?? ""),
          castingStation: String(setup.castingStation ?? ""),
        },
        curingSetup: {
          oven: String(curingSetup.oven ?? ""),
          ovenNo: String(curingSetup.ovenNo ?? ""),
          curingType: String(curingSetup.curingType ?? ""),
          configuration: String(curingSetup.configuration ?? ""),
          motorsToCureCount: String(curingSetup.motorsToCureCount ?? ""),
          ovensUtilized: String(curingSetup.ovensUtilized ?? ""),
        },
        castingSections: parseCastingCuringDisplaySections(src.castingSections as unknown[] | undefined),
        curingSections: parseCastingCuringDisplaySections(src.curingSections as unknown[] | undefined),
      };
    })
    .filter((motor) => motor.motorId.length > 0);

  const sortByPreferredMotorIds = (
    entries: CastingCuringMotorDetailView[],
    preferredIds: Array<string | number> | null | undefined,
  ) => {
    if (!preferredIds?.length) {
      return [...entries].sort((a, b) => a.motorId.localeCompare(b.motorId));
    }
    const order = new Map(
      preferredIds.map((id, index) => [String(id).trim(), index] as const),
    );
    return [...entries].sort((a, b) => {
      const ai = order.get(a.motorId);
      const bi = order.get(b.motorId);
      if (ai != null && bi != null) return ai - bi;
      if (ai != null) return -1;
      if (bi != null) return 1;
      return a.motorId.localeCompare(b.motorId);
    });
  };

  const sortedMotors = sortByPreferredMotorIds(motors, preferredMotorIds);

  const motorCountsFromApi = (data.motorCounts ?? details.motorCounts) as
    | Partial<CastingCuringMotorCounts>
    | undefined;
  const derivedCounts: CastingCuringMotorCounts = {
    pendingMotorCount: 0,
    approvedMotorCount: 0,
    rejectedMotorCount: 0,
    inProgressMotorCount: 0,
    toBeInitiatedMotorCount: 0,
    totalMotorCount: sortedMotors.length,
  };
  sortedMotors.forEach((motor) => {
    const status = String(motor.motorSubmissionStatus ?? "TO_BE_INITIATED").toUpperCase();
    if (status === "WAITING_FOR_APPROVAL") derivedCounts.pendingMotorCount += 1;
    else if (status === "APPROVED") derivedCounts.approvedMotorCount += 1;
    else if (status === "REJECTED") derivedCounts.rejectedMotorCount += 1;
    else if (status === "IN_PROGRESS") derivedCounts.inProgressMotorCount += 1;
    else derivedCounts.toBeInitiatedMotorCount += 1;
  });

  return {
    formId: String(data.formId ?? details.formId ?? ""),
    batchId: String(data.batchId ?? details.batchId ?? ""),
    batchType: String(data.batchType ?? details.batchType ?? ""),
    status:
      data.status != null
        ? getCastingCuringBatchStatusLabel(data.status)
        : details.status != null
          ? getCastingCuringBatchStatusLabel(details.status)
          : undefined,
    formSubmissionType: String(
      data.formSubmissionType ?? details.formSubmissionType ?? "",
    ),
    projectId: String(project.projectId ?? ""),
    projectName: String(project.projectName ?? ""),
    createdBy: mapCastingCuringPersonLabel(data.createdBy ?? details.createdBy),
    createdAt:
      data.createdAt != null
        ? String(data.createdAt)
        : details.createdAt != null
          ? String(details.createdAt)
          : null,
    submittedBy: mapCastingCuringPersonLabel(data.submittedBy ?? details.submittedBy),
    submittedAt:
      data.submittedAt != null
        ? String(data.submittedAt)
        : details.submittedAt != null
          ? String(details.submittedAt)
          : null,
    lastUpdatedBy: mapCastingCuringPersonLabel(data.lastUpdatedBy ?? details.lastUpdatedBy),
    lastUpdatedAt:
      data.lastUpdatedAt != null
        ? String(data.lastUpdatedAt)
        : details.lastUpdatedAt != null
          ? String(details.lastUpdatedAt)
          : null,
    motorCounts: {
      pendingMotorCount:
        motorCountsFromApi?.pendingMotorCount ?? derivedCounts.pendingMotorCount,
      approvedMotorCount:
        motorCountsFromApi?.approvedMotorCount ?? derivedCounts.approvedMotorCount,
      rejectedMotorCount:
        motorCountsFromApi?.rejectedMotorCount ?? derivedCounts.rejectedMotorCount,
      inProgressMotorCount:
        motorCountsFromApi?.inProgressMotorCount ?? derivedCounts.inProgressMotorCount,
      toBeInitiatedMotorCount:
        motorCountsFromApi?.toBeInitiatedMotorCount ?? derivedCounts.toBeInitiatedMotorCount,
      totalMotorCount: Math.max(
        Number(motorCountsFromApi?.totalMotorCount ?? 0),
        derivedCounts.totalMotorCount,
        sortedMotors.length,
      ),
    },
    motors: sortedMotors,
  };
};

export class CastingCuringSubmitResponseModel {
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
    return new CastingCuringSubmitResponseModel(data);
  }
}

export type CastingCuringMotorDetail = {
  motorId: string;
  motorStage?: number;
  motorReceivedAt?: string;
  motorSubmissionType?: CastingCuringMotorSubmissionType;
  motorSubmissionStatus?: CastingCuringMotorSubmissionStatus;
  setup?: { castingType: string; castingStation: string };
  curingSetup?: { oven: string; ovenNo: string; curingType: string; configuration: string; motorsToCureCount: number | ""; ovensUtilized: string };
  castingConfiguration?: Record<string, any>;
  castingDetails?: Record<string, any>;
  curingConfiguration?: Record<string, any>;
  curingDetails?: Record<string, any>;
  castingSections?: any[];
  curingSections?: any[];
};

export type CastingCuringFormDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  status?: string;
  project?: { projectId: string; projectName: string };
  motors: CastingCuringMotorDetail[];
  motorStatuses?: Array<{
    motorId: string;
    motorSubmissionType?: CastingCuringMotorSubmissionType;
    motorSubmissionStatus?: CastingCuringMotorSubmissionStatus;
    submittedAt?: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    remarks?: string | null;
    rejectionReason?: string | null;
  }>;
  allMotorsApproved?: boolean;
  pendingMotorCount?: number;
  approvedMotorCount?: number;
  rejectedMotorCount?: number;
  inProgressMotorCount?: number;
  totalMotorCount?: number;
  createdBy?: string;
  createdAt?: string;
  submittedBy?: string;
  submittedAt?: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
};

const formatCastingCuringApiDate = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "$date" in value) {
    return new Date(String((value as { $date: string }).$date)).toISOString();
  }
  return String(value);
};

export class CastingCuringDetailsModel {
  static fromApi(data: any): CastingCuringFormDetails {
    const payload = data?.data ?? data ?? {};
    const details = payload.castingCuringDetails ?? payload.preparationDetails ?? payload;
    const rawMotors = Array.isArray(details?.motors) ? details.motors : [];

    return {
      formId: String(details?.formId ?? payload?.formId ?? ""),
      batchId: String(details?.batchId ?? payload?.batchId ?? ""),
      subDepartmentId: Number(details?.subDepartmentId ?? payload?.subDepartmentId ?? 0),
      formSubmissionType: String(details?.formSubmissionType ?? payload?.formSubmissionType ?? ""),
      status: String(details?.status ?? payload?.status ?? ""),
      project: details?.project ?? payload?.project
        ? {
          projectId: String((details?.project ?? payload?.project)?.projectId ?? ""),
          projectName: String((details?.project ?? payload?.project)?.projectName ?? ""),
        }
        : undefined,
      motors: rawMotors.map((m: any) => {
        const src = m?.details ?? m;
        const setup = src?.setup ?? {};
        return {
          motorId: String(m.motorId ?? src?.motorId ?? ""),
          motorStage: (m.motorStage ?? src?.motorStage) != null ? Number(m.motorStage ?? src?.motorStage) : undefined,
          motorReceivedAt: String(src?.motorReceivedAt ?? m?.motorReceivedAt ?? ""),
          motorSubmissionType: normalizeCCMotorSubmissionType(m?.motorSubmissionType ?? src?.motorSubmissionType),
          motorSubmissionStatus: normalizeCCMotorStatus(m?.motorSubmissionStatus ?? src?.motorSubmissionStatus),
          setup: {
            castingType: String(setup?.castingType ?? ""),
            castingStation: String(setup?.castingStation ?? ""),
          },
          curingSetup: src.curingSetup ?? m.curingSetup ?? undefined,
          castingConfiguration: src.castingConfiguration ?? undefined,
          castingDetails: src.castingDetails ?? undefined,
          curingConfiguration: src.curingConfiguration ?? undefined,
          curingDetails: src.curingDetails ?? undefined,
          castingSections: Array.isArray(src?.castingSections)
            ? src.castingSections
            : Array.isArray(m?.castingSections)
              ? m.castingSections
              : undefined,
          curingSections: Array.isArray(src?.curingSections)
            ? src.curingSections
            : Array.isArray(m?.curingSections)
              ? m.curingSections
              : undefined,
        };
      }),
      motorStatuses: Array.isArray(payload?.motorStatuses)
        ? payload.motorStatuses.map((entry: any) => ({
          motorId: String(entry?.motorId ?? "").trim(),
          motorSubmissionType: normalizeCCMotorSubmissionType(entry?.motorSubmissionType),
          motorSubmissionStatus: normalizeCCMotorStatus(entry?.motorSubmissionStatus),
          submittedAt: entry?.submittedAt ?? null,
          reviewedBy: entry?.reviewedBy ?? entry?.actionBy ?? null,
          reviewedAt: entry?.reviewedAt ?? entry?.actionAt ?? null,
          remarks: entry?.remarks ?? null,
          rejectionReason: entry?.rejectionReason ?? null,
        })).filter((entry: { motorId: string }) => entry.motorId.length > 0)
        : undefined,
      allMotorsApproved: payload?.allMotorsApproved ?? undefined,
      pendingMotorCount: payload?.pendingMotorCount ?? undefined,
      approvedMotorCount: payload?.approvedMotorCount ?? undefined,
      rejectedMotorCount: payload?.rejectedMotorCount ?? undefined,
      inProgressMotorCount: payload?.inProgressMotorCount ?? undefined,
      totalMotorCount: payload?.totalMotorCount ?? undefined,
      createdBy: mapCastingCuringPersonLabel(payload?.createdBy ?? details?.createdBy) ?? undefined,
      createdAt: formatCastingCuringApiDate(payload?.createdAt ?? details?.createdAt) || undefined,
      submittedBy: mapCastingCuringPersonLabel(payload?.submittedBy ?? details?.submittedBy) ?? undefined,
      submittedAt: formatCastingCuringApiDate(payload?.submittedAt ?? details?.submittedAt) || undefined,
      lastUpdatedBy:
        mapCastingCuringPersonLabel(
          payload?.lastUpdatedBy ?? details?.lastUpdatedBy ?? payload?.updatedBy ?? details?.updatedBy,
        ) ?? undefined,
      lastUpdatedAt:
        formatCastingCuringApiDate(
          payload?.lastUpdatedAt ?? details?.lastUpdatedAt ?? payload?.updatedAt ?? details?.updatedAt,
        ) || undefined,
    };
  }
}
