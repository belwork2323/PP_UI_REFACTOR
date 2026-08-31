import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import { isEmptyManufacturingDivisionDetailsPayload } from "./qcDivisionApprovalUnits";
import { shouldPreserveQcDivisionFileRefsOnSeed } from "./qcDivisionFileUpload";
import {
  isQcPostCureInhibitionOperation,
  resolveQcPostCureSchemaSelection,
  type QcPostCureSchemaSelection,
} from "./qcPostCureConfig";
import {
  isQcQualificationSubBatch,
  isQcSubscaleBatch,
} from "./qcBatchType";
import {
  createInitialPostCureValues,
  hydratePostCureValuesFromMotorDetail,
  hydratePostCureValuesFromSections,
  isPostCureNestedMotorDetail,
  postCureFormValuesHaveUserData,
} from "./qcPostCureTables";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const pickString = (...candidates: unknown[]): string => {
  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim();
    if (value && value.toLowerCase() !== "null") return value;
  }
  return "";
};

const pickMotorId = (rec: Record<string, unknown>) =>
  String(rec.motorIdNo ?? rec.motorId ?? rec.id ?? "").trim();

const collectPostCureMotorLists = (payload: unknown): unknown[] => {
  const root = asRecord(payload);
  if (!root) return [];
  const nested = asRecord(root.data) ?? root;
  const motors: unknown[] = [
    ...asArray(nested.postCureMotorDetails),
    ...asArray(nested.motors),
    ...asArray(nested.motorDetails),
    ...asArray(root.postCureMotorDetails),
    ...asArray(root.motors),
    ...asArray(root.motorDetails),
  ];

  for (const detail of [
    ...asArray(root.divisionDetails),
    ...asArray(nested.divisionDetails),
  ]) {
    const rec = asRecord(detail);
    if (!rec) continue;
    const data = asRecord(rec.data) ?? rec;
    motors.push(
      ...asArray(data.postCureMotorDetails),
      ...asArray(data.motors),
      ...asArray(data.motorDetails),
    );
  }

  const qcForm = asRecord(root.__qcFormDivisionData);
  if (qcForm) {
    motors.push(
      ...asArray(qcForm.postCureMotorDetails),
      ...asArray(qcForm.motors),
      ...asArray(qcForm.motorDetails),
    );
  }

  return motors;
};

export const findPostCureMotorRecord = (
  payload: unknown,
  motorId: string,
): Record<string, unknown> | null => {
  const trimmedMotorId = String(motorId ?? "").trim();
  if (!trimmedMotorId || !payload) return null;

  for (const motor of collectPostCureMotorLists(payload)) {
    const rec = asRecord(motor);
    if (!rec || pickMotorId(rec) !== trimmedMotorId) continue;
    return rec;
  }
  return null;
};

export type QcPostCureManualSetup = {
  operation: string;
  inhibitorType?: string;
  motorReceiptDate: string;
};

export const QC_POST_CURE_MANUAL_SETUP_KEY = "__postCureManualSetup";

export const resolvePostCureManualSetup = (payload: unknown): QcPostCureManualSetup | null => {
  const root = asRecord(payload);
  if (!root) return null;
  const setup = asRecord(root[QC_POST_CURE_MANUAL_SETUP_KEY]);
  if (!setup) return null;
  const operation = pickString(setup.operation);
  if (!operation) return null;
  return {
    operation,
    inhibitorType: pickString(setup.inhibitorType) || undefined,
    motorReceiptDate: pickString(setup.motorReceiptDate),
  };
};

export const buildPostCureManualSetupPayload = (
  setup: QcPostCureManualSetup,
): Record<string, unknown> => ({
  [QC_POST_CURE_MANUAL_SETUP_KEY]: setup,
});

const resolvePostCureSelectionFromManufacturingMotor = (
  payload: unknown,
  motorId: string,
): QcPostCureSchemaSelection | null => {
  const motor = findPostCureMotorRecord(payload, motorId);
  if (!motor) return null;

  const details = asRecord(motor.details) ?? {};
  const loose =
    asRecord(motor.looseFlapFillingDetails) ?? asRecord(details.looseFlapFillingDetails);
  const inhibition = asRecord(motor.inhibitionDetails) ?? asRecord(details.inhibitionDetails);

  if (loose && Object.keys(loose).length > 0) {
    return resolveQcPostCureSchemaSelection("LOOSE_FLAP_FILLING", "");
  }

  if (inhibition && Object.keys(inhibition).length > 0) {
    const inhibitorType = pickString(
      inhibition.inhibitorType,
      details.inhibitorType,
      motor.inhibitorType,
    );
    return resolveQcPostCureSchemaSelection("INHIBITION", inhibitorType);
  }

  const operationType = pickString(
    details.operationType,
    details.subType,
    motor.operationType,
    motor.subType,
  );
  const inhibitorType = pickString(details.inhibitorType, motor.inhibitorType);

  return resolveQcPostCureSchemaSelection(operationType, inhibitorType);
};

/** Subscale qualification batches may have no manufacturing post-cure operation until setup. */
export const needsQcPostCureManualSetup = (params: {
  flowKey: string;
  batchType?: string | null;
  subBatchType?: string | null;
  manufacturingPayload?: unknown;
  hasQcSavedData?: boolean;
  manualSetup?: QcPostCureManualSetup | null;
  motorIds?: string[];
}): boolean => {
  if (String(params.flowKey ?? "").trim().toUpperCase() !== "POST_CURE") return false;
  if (params.hasQcSavedData) return false;
  if (params.manualSetup) return false;
  if (!isQcSubscaleBatch(params.batchType) || !isQcQualificationSubBatch(params.subBatchType)) {
    return false;
  }

  const motors = (params.motorIds ?? []).map((id) => String(id ?? "").trim()).filter(Boolean);
  if (!motors.length) {
    return isEmptyManufacturingDivisionDetailsPayload(params.manufacturingPayload);
  }

  return !motors.some((motorId) =>
    Boolean(resolvePostCureSelectionFromManufacturingMotor(params.manufacturingPayload, motorId)),
  );
};

export const canLoadQcPostCureSetupForm = (state: {
  selectedPostCureOperation: string;
  selectedInhibitorType: string;
  postCureMotorReceiptDate: string;
}): boolean => {
  if (!String(state.selectedPostCureOperation ?? "").trim()) return false;
  if (
    isQcPostCureInhibitionOperation(state.selectedPostCureOperation) &&
    !String(state.selectedInhibitorType ?? "").trim()
  ) {
    return false;
  }
  if (!String(state.postCureMotorReceiptDate ?? "").trim()) return false;
  return Boolean(
    resolveQcPostCureSchemaSelection(
      state.selectedPostCureOperation,
      state.selectedInhibitorType ?? "",
    ),
  );
};

/** Resolve Loose Flap / Inhibition (+ inhibitor) from manufacturing, QC, or manual setup. */
export const resolvePostCureSelectionFromMotorDetails = (
  payload: unknown,
  motorId: string,
): QcPostCureSchemaSelection | null => {
  const manualSetup = resolvePostCureManualSetup(payload);
  if (manualSetup) {
    return resolveQcPostCureSchemaSelection(
      manualSetup.operation,
      manualSetup.inhibitorType ?? "",
    );
  }
  return resolvePostCureSelectionFromManufacturingMotor(payload, motorId);
};

const collectMotorSections = (
  payload: unknown,
  motorId: string,
): SchemaSectionSubmission[] => {
  const root = asRecord(payload);
  if (!root) return [];
  const data = asRecord(root.data) ?? root;
  const sections: SchemaSectionSubmission[] = [];
  const motor = findPostCureMotorRecord(root, motorId);
  const details = asRecord(motor?.details) ?? {};
  const operationType = pickString(
    details.operationType,
    details.subType,
    motor?.operationType,
    motor?.subType,
  );
  const inhibitorType = pickString(details.inhibitorType, motor?.inhibitorType);

  for (const section of asArray(data.sections)) {
    const sec = asRecord(section);
    if (!sec) continue;
    const sectionMotorId = String(sec.motorId ?? "").trim();
    if (sectionMotorId && sectionMotorId !== motorId) continue;
    sections.push({
      ...sec,
      motorId,
      ...(operationType ? { subType: operationType } : null),
      ...(inhibitorType ? { inhibitorType } : null),
    } as unknown as SchemaSectionSubmission);
  }

  if (motor) {
    const motorSections = asArray(details.sections ?? motor.sections);
    for (const section of motorSections) {
      const sec = asRecord(section);
      if (!sec) continue;
      sections.push({
        ...sec,
        motorId,
        ...(sec.subType != null
          ? { subType: sec.subType }
          : operationType
            ? { subType: operationType }
            : null),
        ...(sec.inhibitorType != null
          ? { inhibitorType: sec.inhibitorType }
          : inhibitorType
            ? { inhibitorType }
            : null),
      } as unknown as SchemaSectionSubmission);
    }
  }

  return sections;
};

/**
 * Seed Post Cure form values from manufacturing / QC division-details payload
 * for a motor + operation (+ inhibitor). Prefers nested postCureMotorDetails shape.
 */
export const buildInitialPostCureValuesForMotor = (
  divisionDetailPayload: unknown,
  motorId: string,
  subType?: string | null,
  inhibitorType?: string | null,
): SchemaFormValues => {
  const trimmedMotorId = String(motorId ?? "").trim();
  const selection =
    subType
      ? resolveQcPostCureSchemaSelection(String(subType), String(inhibitorType ?? ""))
      : resolvePostCureSelectionFromMotorDetails(divisionDetailPayload, trimmedMotorId);

  const resolvedSubType = selection?.subType ?? subType ?? null;
  const resolvedInhibitor = selection?.inhibitorType ?? inhibitorType ?? null;
  const base = createInitialPostCureValues(resolvedSubType, resolvedInhibitor);

  if (!trimmedMotorId || !divisionDetailPayload) return base;

  const motor = findPostCureMotorRecord(divisionDetailPayload, trimmedMotorId);
  if (motor && isPostCureNestedMotorDetail(motor)) {
    const nested = hydratePostCureValuesFromMotorDetail(motor, resolvedSubType, resolvedInhibitor);
    if (postCureFormValuesHaveUserData(nested)) return nested;
  }

  const sections = collectMotorSections(divisionDetailPayload, trimmedMotorId);
  if (sections.length > 0) {
    const fromSections = hydratePostCureValuesFromSections(
      sections,
      resolvedSubType,
      resolvedInhibitor,
    );
    if (postCureFormValuesHaveUserData(fromSections)) return fromSections;
  }

  if (motor && isPostCureNestedMotorDetail(motor)) {
    return hydratePostCureValuesFromMotorDetail(motor, resolvedSubType, resolvedInhibitor);
  }

  return base;
};

export const applyPostCureDivisionDetailsSeed = (
  current: SchemaFormValues,
  divisionDetailPayload: unknown,
  motorId: string,
  subType?: string | null,
  inhibitorType?: string | null,
  options?: { onlyIfEmpty?: boolean },
): SchemaFormValues => {
  const seeded = buildInitialPostCureValuesForMotor(
    divisionDetailPayload,
    motorId,
    subType,
    inhibitorType,
  );
  if (!options?.onlyIfEmpty) return seeded;

  const next: SchemaFormValues = { ...current };
  Object.entries(seeded).forEach(([key, value]) => {
    const existing = next[key];
    if (shouldPreserveQcDivisionFileRefsOnSeed(existing, options?.onlyIfEmpty)) return;
    const empty =
      existing == null ||
      existing === "" ||
      (Array.isArray(existing) &&
        existing.every((row) => {
          const rec = asRecord(row);
          if (!rec) return true;
          return Object.entries(rec).every(([field, fieldValue]) => {
            if (
              field === "SR_NO" ||
              field === "LOCATION" ||
              field === "PARAMETER" ||
              field === "SPECIFICATION"
            ) {
              return true;
            }
            return !String(fieldValue ?? "").trim();
          });
        }));
    if (empty) next[key] = value;
  });
  return next;
};
