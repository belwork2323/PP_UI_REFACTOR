import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import { shouldPreserveQcDivisionFileRefsOnSeed } from "./qcDivisionFileUpload";
import { resolveManufacturingDivisionDetailsPayload } from "./qcHardwareDivisionDetails";
import {
  createInitialNdtValues,
  hydrateNdtValuesFromRecord,
  hydrateNdtValuesFromSections,
  mergeBatchRadiographyPlanIntoNdtValues,
  ndtFormValuesHaveUserData,
} from "./qcNdtTables";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const pickMotorId = (rec: Record<string, unknown>) =>
  String(rec.motorIdNo ?? rec.motorId ?? rec.id ?? "").trim();

const collectNdtMotorLists = (payload: unknown): unknown[] => {
  const root = resolveManufacturingDivisionDetailsPayload(payload) ?? asRecord(payload);
  if (!root) return [];
  const nested = asRecord(root.data) ?? root;
  const motors: unknown[] = [
    ...asArray(nested.ndtMotorDetails),
    ...asArray(nested.motors),
    ...asArray(nested.motorDetails),
    ...asArray(root.ndtMotorDetails),
    ...asArray(root.motors),
    ...asArray(root.motorDetails),
  ];
  for (const detail of [...asArray(root.divisionDetails), ...asArray(nested.divisionDetails)]) {
    const rec = asRecord(detail);
    if (!rec) continue;
    const data = asRecord(rec.data) ?? rec;
    motors.push(
      ...asArray(data.ndtMotorDetails),
      ...asArray(data.motors),
      ...asArray(data.motorDetails),
    );
  }
  const qcForm = asRecord(root.__qcFormDivisionData);
  if (qcForm) {
    motors.push(
      ...asArray(qcForm.ndtMotorDetails),
      ...asArray(qcForm.motors),
      ...asArray(qcForm.motorDetails),
    );
  }
  return motors;
};

export const findNdtMotorRecord = (
  payload: unknown,
  motorId: string,
): Record<string, unknown> | null => {
  const trimmedMotorId = String(motorId ?? "").trim();
  const root = asRecord(payload);
  if (!trimmedMotorId || !root) return null;
  for (const motor of collectNdtMotorLists(root)) {
    const rec = asRecord(motor);
    if (!rec || pickMotorId(rec) !== trimmedMotorId) continue;
    return rec;
  }
  return null;
};

const collectMotorSections = (
  payload: unknown,
  motorId: string,
): SchemaSectionSubmission[] => {
  const root = resolveManufacturingDivisionDetailsPayload(payload) ?? asRecord(payload);
  if (!root) return [];
  const data = asRecord(root.data) ?? root;
  const sections: SchemaSectionSubmission[] = [];
  const motor = findNdtMotorRecord(root, motorId);

  for (const section of asArray(data.sections)) {
    const sec = asRecord(section);
    if (!sec) continue;
    const sectionMotorId = String(sec.motorId ?? "").trim();
    if (sectionMotorId && sectionMotorId !== motorId) continue;
    sections.push({
      ...sec,
      motorId,
    } as unknown as SchemaSectionSubmission);
  }

  if (motor) {
    const details = asRecord(motor.details) ?? {};
    for (const section of asArray(details.sections ?? motor.sections)) {
      const sec = asRecord(section);
      if (!sec) continue;
      sections.push({
        ...sec,
        motorId,
      } as unknown as SchemaSectionSubmission);
    }
  }

  return sections;
};

export type NdtDivisionSeedOptions = {
  batchPayload?: unknown;
  onlyIfEmpty?: boolean;
  /** QC form details reload — map radiographyObservations onto defect presets. */
  includeRadiographyObservations?: boolean;
};

export const buildInitialNdtValuesForMotor = (
  divisionDetailPayload: unknown,
  motorId: string,
  options?: Pick<NdtDivisionSeedOptions, "batchPayload" | "includeRadiographyObservations">,
): SchemaFormValues => {
  const trimmedMotorId = String(motorId ?? "").trim();
  const hydrateOpts = {
    includeRadiographyObservations: Boolean(options?.includeRadiographyObservations),
  };
  const base = createInitialNdtValues();
  if (!trimmedMotorId || !divisionDetailPayload) {
    return mergeBatchRadiographyPlanIntoNdtValues(base, trimmedMotorId, options?.batchPayload);
  }

  let seeded = base;
  const motor = findNdtMotorRecord(divisionDetailPayload, trimmedMotorId);
  if (motor) {
    const nested = hydrateNdtValuesFromRecord(motor, hydrateOpts);
    if (ndtFormValuesHaveUserData(nested)) {
      seeded = nested;
    } else {
      const sections = collectMotorSections(divisionDetailPayload, trimmedMotorId);
      seeded =
        sections.length > 0
          ? hydrateNdtValuesFromSections(sections)
          : hydrateNdtValuesFromRecord(motor, hydrateOpts);
    }
  } else {
    const sections = collectMotorSections(divisionDetailPayload, trimmedMotorId);
    if (sections.length > 0) {
      seeded = hydrateNdtValuesFromSections(sections);
    }
  }

  return mergeBatchRadiographyPlanIntoNdtValues(seeded, trimmedMotorId, options?.batchPayload);
};

export const applyNdtDivisionDetailsSeed = (
  current: SchemaFormValues,
  divisionDetailPayload: unknown,
  motorId: string,
  options?: NdtDivisionSeedOptions,
): SchemaFormValues => {
  const seeded = buildInitialNdtValuesForMotor(divisionDetailPayload, motorId, {
    batchPayload: options?.batchPayload,
    includeRadiographyObservations: options?.includeRadiographyObservations,
  });
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
              field === "TYPE_OF_DEFECT" ||
              field === "OBSERVATION_TYPE" ||
              field === "LOCATION"
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
