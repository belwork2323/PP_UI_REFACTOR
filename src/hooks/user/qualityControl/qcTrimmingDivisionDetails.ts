import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import { resolveManufacturingDivisionDetailsPayload } from "./qcHardwareDivisionDetails";
import {
  createInitialTrimmingValues,
  getTrimmingSessionFromValues,
  hydrateTrimmingValuesFromMotorDetail,
  hydrateTrimmingValuesFromSections,
  resolveTrimmingDetailSource,
  setTrimmingSessionValues,
  toTrimmingApiMotorStage,
  toTrimmingUiMotorReceivedAt,
} from "./qcTrimmingTables";
import { QC_TRIMMING_SECTION_IDS } from "./qcTrimmingConfig";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const pickFirstValue = (...candidates: unknown[]): string => {
  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim();
    if (value && value.toLowerCase() !== "null") return value;
  }
  return "";
};

const collectMotorLists = (payload: unknown): unknown[] => {
  const root = resolveManufacturingDivisionDetailsPayload(payload);
  if (!root) return [];
  const details = asRecord(root.data) ?? root;
  return [
    ...asArray(details.trimmingDetails),
    ...asArray(details.motors),
    ...asArray(details.motorDetails),
    ...asArray(root.trimmingDetails),
    ...asArray(root.motors),
    ...asArray(root.motorDetails),
  ];
};

const findTrimmingMotorRecord = (
  payload: unknown,
  motorId: string,
): Record<string, unknown> | null => {
  const normalizedMotorId = String(motorId ?? "").trim();
  if (!normalizedMotorId) return null;

  for (const motor of collectMotorLists(payload)) {
    const rec = asRecord(motor);
    if (!rec) continue;
    const id = String(rec.motorId ?? rec.motorIdNo ?? rec.id ?? "").trim();
    if (id === normalizedMotorId) return rec;
  }
  return null;
};

const extractMotorSections = (motor: Record<string, unknown> | null): SchemaSectionSubmission[] => {
  if (!motor) return [];
  const details = asRecord(motor.details) ?? motor;
  return asArray(details.sections ?? motor.sections)
    .map((section) => asRecord(section))
    .filter(Boolean)
    .map((section) => ({
      sectionId: String(section!.sectionId ?? "").trim(),
      sectionData: asArray(section!.sectionData) as Record<string, unknown>[],
    }))
    .filter((section) => section.sectionId) as SchemaSectionSubmission[];
};

/** Manufacturing may send motorReceivedAt on the motor, nested details, or batch root. */
export const resolveTrimmingMotorReceivedAt = (
  payload: unknown,
  motor: Record<string, unknown> | null,
): string => {
  const root = resolveManufacturingDivisionDetailsPayload(payload);
  const rootDetails = asRecord(root?.data) ?? root;
  const motorDetails = asRecord(motor?.details);
  const batch = asRecord((payload as Record<string, unknown> | null)?.__batchDetails);

  return pickFirstValue(
    motor?.motorReceivedAt,
    motor?.motorReceivedDate,
    motorDetails?.motorReceivedAt,
    motorDetails?.motorReceivedDate,
    motorDetails?.motorReceiptDate,
    motorDetails?.receivedAt,
    rootDetails?.motorReceivedAt,
    rootDetails?.motorReceivedDate,
    rootDetails?.motorReceiptDate,
    rootDetails?.receivedAt,
    root?.motorReceivedAt,
    root?.motorReceivedDate,
    batch?.motorReceivedAt,
    batch?.motorReceivedDate,
    batch?.receivedAt,
  );
};

export const resolveTrimmingMotorStage = (
  payload: unknown,
  motor: Record<string, unknown> | null,
): number | string | undefined => {
  const root = resolveManufacturingDivisionDetailsPayload(payload);
  const rootDetails = asRecord(root?.data) ?? root;
  const motorDetails = asRecord(motor?.details);
  const batch = asRecord((payload as Record<string, unknown> | null)?.__batchDetails);

  const raw = pickFirstValue(
    motor?.motorStage,
    motorDetails?.motorStage,
    rootDetails?.motorStage,
    root?.motorStage,
    batch?.motorStage,
    batch?.motorType,
  );
  if (!raw) return undefined;
  return toTrimmingApiMotorStage(raw) ?? raw;
};

const isTrimmingSection = (sectionId: string) => {
  const id = sectionId.trim().toUpperCase();
  return (
    id === QC_TRIMMING_SECTION_IDS.DETAILS ||
    id === QC_TRIMMING_SECTION_IDS.COMMON_FORMAT ||
    id === QC_TRIMMING_SECTION_IDS.REMARKS
  );
};

const mergeTrimmingSessions = (
  current: ReturnType<typeof getTrimmingSessionFromValues>,
  incoming: ReturnType<typeof getTrimmingSessionFromValues>,
) =>
  setTrimmingSessionValues({
    motorStage: current.motorStage || incoming.motorStage,
    motorReceivedAt: current.motorReceivedAt || incoming.motorReceivedAt,
    trimmingDetails: current.trimmingDetails.some((row) =>
      Object.values(row).some((value) => String(value ?? "").trim()),
    )
      ? current.trimmingDetails
      : incoming.trimmingDetails,
    commonFormatParameters: current.commonFormatParameters.some((param) =>
      (param.stages ?? []).some((stage) =>
        Object.values(stage.readings ?? {}).some((value) => String(value ?? "").trim()),
      ),
    )
      ? current.commonFormatParameters
      : incoming.commonFormatParameters,
    commonFormatLocations: current.commonFormatLocations.length
      ? current.commonFormatLocations
      : incoming.commonFormatLocations,
    motorRemarks: current.motorRemarks || incoming.motorRemarks,
    reportFile: current.reportFile || incoming.reportFile,
    reportLink: current.reportLink || incoming.reportLink,
  });

export const applyTrimmingDivisionDetailsSeed = (
  base: SchemaFormValues,
  payload: unknown,
  motorId: string,
  options?: { onlyIfEmpty?: boolean },
): SchemaFormValues => {
  const onlyIfEmpty = options?.onlyIfEmpty ?? false;
  const motor = findTrimmingMotorRecord(payload, motorId);
  const detailSource = resolveTrimmingDetailSource(motor);
  const receivedAt = toTrimmingUiMotorReceivedAt(resolveTrimmingMotorReceivedAt(payload, motor));
  const motorStage = resolveTrimmingMotorStage(payload, motor);

  if (!motor && !receivedAt && motorStage == null) return base;

  const sections = extractMotorSections(motor);
  const hasTrimmingSections = sections.some((section) => isTrimmingSection(section.sectionId));
  const hasFlatDetail =
    Array.isArray(detailSource.trimmingMeasurementDetails) ||
    Array.isArray(detailSource.trimmingOperationDetails) ||
    Boolean(asRecord(detailSource.trimmingRemarks)) ||
    Boolean(String(detailSource.motorReceivedDate ?? detailSource.motorReceivedAt ?? "").trim()) ||
    detailSource.motorStage != null;

  let next = base;
  if (motor && hasTrimmingSections) {
    const hydrated = setTrimmingSessionValues({
      ...getTrimmingSessionFromValues(
        hydrateTrimmingValuesFromSections(sections, { motorReceivedAt: receivedAt }),
      ),
      motorStage,
    });
    next = onlyIfEmpty
      ? mergeTrimmingSessions(getTrimmingSessionFromValues(base), getTrimmingSessionFromValues(hydrated))
      : hydrated;
  } else if (motor && hasFlatDetail) {
    // Manufacturing division-details nests fields under motors[].details
    const hydrated = hydrateTrimmingValuesFromMotorDetail({
      ...detailSource,
      ...(motorStage != null ? { motorStage } : {}),
      ...(receivedAt
        ? { motorReceivedAt: receivedAt, motorReceivedDate: receivedAt }
        : {}),
    });
    next = onlyIfEmpty
      ? mergeTrimmingSessions(getTrimmingSessionFromValues(base), getTrimmingSessionFromValues(hydrated))
      : hydrated;
  }

  const current = getTrimmingSessionFromValues(next);
  let changed = false;
  let merged = { ...current };

  if (receivedAt && (!onlyIfEmpty || !current.motorReceivedAt)) {
    merged = { ...merged, motorReceivedAt: receivedAt };
    changed = true;
  }
  if (motorStage != null && (!onlyIfEmpty || current.motorStage == null || current.motorStage === "")) {
    merged = { ...merged, motorStage };
    changed = true;
  }

  return changed ? setTrimmingSessionValues(merged) : next;
};

export const buildInitialTrimmingValuesForMotor = (
  payload: unknown,
  motorId: string,
): SchemaFormValues => {
  const values = createInitialTrimmingValues();
  return applyTrimmingDivisionDetailsSeed(values, payload, motorId, { onlyIfEmpty: false });
};
