import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import { resolveManufacturingDivisionDetailsPayload } from "./qcHardwareDivisionDetails";
import {
  createInitialWeighmentValues,
  hydrateWeighmentValuesFromRecord,
  hydrateWeighmentValuesFromSections,
  weighmentFormValuesHaveUserData,
} from "./qcWeighmentTables";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const pickMotorId = (rec: Record<string, unknown>) =>
  String(rec.motorIdNo ?? rec.motorId ?? rec.id ?? "").trim();

const isWeighmentDivisionKey = (value: unknown) => {
  const key = String(value ?? "")
    .trim()
    .toUpperCase();
  return key === "WEIGHTMENT" || key === "WEIGHMENT";
};

/** Only motorWeightDetails / records with `weights[]` — never Hardware/Casting motors. */
const isWeighmentMotorRecord = (rec: Record<string, unknown> | null) =>
  Boolean(rec && (Array.isArray(rec.weights) || Array.isArray(rec.motorWeightDetails)));

const collectFromSource = (source: Record<string, unknown> | null, motors: unknown[]) => {
  if (!source) return;
  motors.push(...asArray(source.motorWeightDetails));
  for (const item of [
    ...asArray(source.motors),
    ...asArray(source.motorDetails),
    ...asArray(source.weighmentDetails),
  ]) {
    const rec = asRecord(item);
    if (isWeighmentMotorRecord(rec)) motors.push(item);
  }
};

const collectWeighmentMotorLists = (payload: unknown): unknown[] => {
  const root = resolveManufacturingDivisionDetailsPayload(payload) ?? asRecord(payload);
  if (!root) return [];
  const nested = asRecord(root.data) ?? root;
  const motors: unknown[] = [];
  collectFromSource(nested, motors);
  collectFromSource(root, motors);
  for (const detail of [...asArray(root.divisionDetails), ...asArray(nested.divisionDetails)]) {
    const rec = asRecord(detail);
    if (!rec) continue;
    if (rec.division && !isWeighmentDivisionKey(rec.division)) continue;
    collectFromSource(asRecord(rec.data) ?? rec, motors);
  }
  collectFromSource(asRecord(root.__qcFormDivisionData), motors);
  return motors;
};

const collectWeighmentScaleDetails = (payload: unknown): Record<string, unknown> | null => {
  const root = resolveManufacturingDivisionDetailsPayload(payload) ?? asRecord(payload);
  if (!root) return null;
  const nested = asRecord(root.data) ?? root;
  const candidates = [
    asRecord(nested.weighscaleDetails),
    asRecord(root.weighscaleDetails),
    asRecord(asRecord(root.__qcFormDivisionData)?.weighscaleDetails),
  ];
  for (const detail of [...asArray(root.divisionDetails), ...asArray(nested.divisionDetails)]) {
    const rec = asRecord(detail);
    if (!rec) continue;
    if (rec.division && !isWeighmentDivisionKey(rec.division)) continue;
    const data = asRecord(rec.data) ?? rec;
    candidates.push(asRecord(data?.weighscaleDetails));
  }
  return candidates.find((item) => item && (item.weighscaleNo || item.calibrationDueDate)) ?? null;
};

export const findWeighmentMotorRecord = (
  payload: unknown,
  motorId: string,
): Record<string, unknown> | null => {
  const trimmedMotorId = String(motorId ?? "").trim();
  const root = asRecord(payload);
  if (!trimmedMotorId || !root) return null;
  const scale = collectWeighmentScaleDetails(root);
  for (const motor of collectWeighmentMotorLists(root)) {
    const rec = asRecord(motor);
    if (!rec || pickMotorId(rec) !== trimmedMotorId || !isWeighmentMotorRecord(rec)) continue;
    return scale ? { ...rec, weighscaleDetails: asRecord(rec.weighscaleDetails) ?? scale } : rec;
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
  const motor = findWeighmentMotorRecord(root, motorId);

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

export const buildInitialWeighmentValuesForMotor = (
  divisionDetailPayload: unknown,
  motorId: string,
): SchemaFormValues => {
  const trimmedMotorId = String(motorId ?? "").trim();
  const base = createInitialWeighmentValues();
  if (!trimmedMotorId || !divisionDetailPayload) return base;

  const motor = findWeighmentMotorRecord(divisionDetailPayload, trimmedMotorId);
  if (motor) {
    const nested = hydrateWeighmentValuesFromRecord(motor);
    if (weighmentFormValuesHaveUserData(nested)) return nested;
  }

  const sections = collectMotorSections(divisionDetailPayload, trimmedMotorId);
  if (sections.length > 0) {
    return hydrateWeighmentValuesFromSections(sections);
  }

  if (motor) return hydrateWeighmentValuesFromRecord(motor);
  return base;
};

export const applyWeighmentDivisionDetailsSeed = (
  current: SchemaFormValues,
  divisionDetailPayload: unknown,
  motorId: string,
  options?: { onlyIfEmpty?: boolean },
): SchemaFormValues => {
  const seeded = buildInitialWeighmentValuesForMotor(divisionDetailPayload, motorId);
  if (!options?.onlyIfEmpty) return seeded;

  const next: SchemaFormValues = { ...current };
  Object.entries(seeded).forEach(([key, value]) => {
    const existing = next[key];
    const empty =
      existing == null ||
      existing === "" ||
      (Array.isArray(existing) &&
        existing.every((row) => {
          const rec = asRecord(row);
          if (!rec) return true;
          return !String(rec.WEIGHT_KG ?? rec.weightKg ?? "").trim();
        }));
    if (empty) next[key] = value;
  });
  return next;
};
