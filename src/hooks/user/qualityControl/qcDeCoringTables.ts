import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import dayjs from "dayjs";
import { UI_DATETIME_FORMAT } from "../../../utils/dateUtils";
import {
  QC_DE_CORING_MANUFACTURING_SECTION_ID,
  QC_DE_CORING_SECTION_IDS,
  type QcDeCoringField,
} from "./qcDeCoringConfig";

export type QcDeCoringMotorSubmissionType = "DRAFT" | "SUBMIT";

const formKey = (sectionId: string, blockId: string) => `${sectionId}::${blockId}`;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const hasValue = (value: unknown) => Boolean(String(value ?? "").trim());

const pickFirstValue = (...candidates: unknown[]): string => {
  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim();
    if (value && value.toLowerCase() !== "null") return value;
  }
  return "";
};

const omitEmpty = <T extends Record<string, unknown>>(record: T): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined && value !== "" && value !== null),
  );

export const createInitialDeCoringValues = (): SchemaFormValues => ({
  [formKey(QC_DE_CORING_SECTION_IDS.DETAILS, "DE_CORING_LOAD")]: "",
  [formKey(QC_DE_CORING_SECTION_IDS.DETAILS, "DE_CORING_DATE_TIME")]: "",
  [formKey(QC_DE_CORING_SECTION_IDS.DETAILS, "OBSERVATIONS")]: "",
});

const getField = (values: SchemaFormValues | null | undefined, field: QcDeCoringField) =>
  String(values?.[formKey(QC_DE_CORING_SECTION_IDS.DETAILS, field)] ?? "");

const setField = (
  values: SchemaFormValues | null | undefined,
  field: QcDeCoringField,
  value: string,
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_DE_CORING_SECTION_IDS.DETAILS, field)]: value,
});

export const getDeCoringField = (
  values: SchemaFormValues | null | undefined,
  field: QcDeCoringField,
) => getField(values, field);

export const setDeCoringField = (
  values: SchemaFormValues | null | undefined,
  field: QcDeCoringField,
  value: string,
) => setField(values, field, value);

const isDeCoringSectionId = (sectionId: string) => {
  const normalized = sectionId.trim().toUpperCase().replace(/-/g, "_");
  return (
    normalized === QC_DE_CORING_SECTION_IDS.DETAILS ||
    normalized === QC_DE_CORING_MANUFACTURING_SECTION_ID
  );
};

const mapObservationsFromRecord = (data: Record<string, unknown>): string => {
  const observations = pickFirstValue(data.OBSERVATIONS, data.observations);
  const remarks = pickFirstValue(
    data.decoringRemarks,
    data.DECORING_REMARKS,
    data.REMARKS,
    data.remarks,
  );
  // Manufacturing `decoringVisualObservation` is often a file-ref array — skip non-strings.
  const visualRaw =
    data.decoringVisualObservation ??
    data.DECORING_VISUAL_OBSERVATION ??
    data.VISUAL_OBSERVATION ??
    data.VISUAL_OBSERVATIONS ??
    data.visualObservation ??
    data.visualObservations;
  const visual =
    typeof visualRaw === "string" || typeof visualRaw === "number"
      ? pickFirstValue(visualRaw)
      : "";
  return [observations, remarks, visual].filter(Boolean).join("; ");
};

const toUiDeCoringDateTime = (value: string): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^\d{1,2}-\d{1,2}-\d{4}/.test(raw)) return raw;
  const parsed = dayjs(raw);
  if (!parsed.isValid()) return raw;
  if (/[T\s]\d{1,2}:\d{2}/.test(raw)) return parsed.format(UI_DATETIME_FORMAT);
  return parsed.format("DD-MM-YYYY");
};

export const mapDeCoringDetailsFromRecord = (
  data: Record<string, unknown>,
): Record<QcDeCoringField, string> => ({
  DE_CORING_LOAD: pickFirstValue(
    data.DE_CORING_LOAD,
    data.DECORING_LOAD,
    data.deCoringLoad,
    data.decoringLoad,
    data.decoringLoadKg,
    data.DECORING_LOAD_KG,
  ),
  DE_CORING_DATE_TIME: toUiDeCoringDateTime(
    pickFirstValue(
      data.DE_CORING_DATE_TIME,
      data.DECORING_DATE_TIME,
      data.deCoringDateTime,
      data.decoringDateTime,
      data.decoringDate,
      data.DECORING_DATE,
    ),
  ),
  OBSERVATIONS: mapObservationsFromRecord(data),
});

/** Prefer nested curing `details.curingSections.decoringDetails` / flat `decoringDetails`. */
export const resolveDeCoringDetailsRecord = (
  motor: Record<string, unknown> | null | undefined,
): Record<string, unknown> => {
  if (!motor) return {};
  const details = asRecord(motor.details) ?? {};
  const curingSections =
    asRecord(details.curingSections) ??
    (!Array.isArray(motor.curingSections) ? asRecord(motor.curingSections) : null);
  const fromCuringSections =
    asRecord(curingSections?.decoringDetails) ??
    asRecord(curingSections?.DECORING_DETAILS) ??
    asRecord(curingSections?.deCoringDetails);
  const nested =
    fromCuringSections ??
    asRecord(details.deCoringDetails) ??
    asRecord(details.decoringDetails) ??
    asRecord(motor.deCoringDetails) ??
    asRecord(motor.decoringDetails) ??
    asRecord(details.DECORING_DETAILS) ??
    null;
  return {
    ...motor,
    ...details,
    ...(nested ?? {}),
  };
};

export const hydrateDeCoringValuesFromSections = (
  sections: SchemaSectionSubmission[] | null | undefined,
): SchemaFormValues => {
  const values = createInitialDeCoringValues();

  for (const section of sections ?? []) {
    const sectionId = String(section.sectionId ?? "").trim();
    if (!isDeCoringSectionId(sectionId)) continue;
    const data = asRecord(asArray(section.sectionData)[0]);
    if (!data) continue;
    const mapped = mapDeCoringDetailsFromRecord(data);
    (Object.keys(mapped) as QcDeCoringField[]).forEach((field) => {
      values[formKey(QC_DE_CORING_SECTION_IDS.DETAILS, field)] = mapped[field];
    });
  }

  return values;
};

/** Convert UI datetime (DD-MM-YYYY HH:mm) → API `YYYY-MM-DDTHH:mm:ss`. */
const toDeCoringApiDateTime = (value: string): string | undefined => {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?/.test(raw)) {
    return raw.length === 16 ? `${raw}:00` : raw.slice(0, 19);
  }

  const dmyTime = raw.match(
    /^(\d{1,2})-(\d{1,2})-(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::\d{2})?)?$/,
  );
  if (dmyTime) {
    const day = dmyTime[1].padStart(2, "0");
    const month = dmyTime[2].padStart(2, "0");
    const year = dmyTime[3];
    const hour = (dmyTime[4] ?? "0").padStart(2, "0");
    const minute = (dmyTime[5] ?? "0").padStart(2, "0");
    return `${year}-${month}-${day}T${hour}:${minute}:00`;
  }

  return raw;
};

const toDeCoringApiLoad = (value: string): number | string | undefined => {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  const asNumber = Number(raw);
  return Number.isFinite(asNumber) ? asNumber : raw;
};

/**
 * De-coring motor payload for create/update (`data.deCoringDetails[]`).
 * Matches `{ motorId, motorSubmissionType, decoringDetails }`.
 */
export const buildDeCoringMotorDetailPayload = (
  values: SchemaFormValues | null | undefined,
  motorId: string,
  motorSubmissionType: QcDeCoringMotorSubmissionType = "DRAFT",
): Record<string, unknown> => {
  const load = toDeCoringApiLoad(getDeCoringField(values, "DE_CORING_LOAD"));
  const dateTime = toDeCoringApiDateTime(getDeCoringField(values, "DE_CORING_DATE_TIME"));
  const observations = getDeCoringField(values, "OBSERVATIONS");

  return omitEmpty({
    motorId,
    motorSubmissionType,
    decoringDetails: omitEmpty({
      decoringLoad: load,
      // Full datetime (YYYY-MM-DDTHH:mm:ss) — same for create and update.
      decoringDate: dateTime,
      decoringRemarks: observations || undefined,
    }),
  });
};

export const isDeCoringNestedMotorDetail = (rec: Record<string, unknown>) => {
  if (asRecord(rec.decoringDetails)) return true;
  if (Array.isArray(rec.decoringSections)) return true;
  const details = asRecord(rec.details);
  if (Array.isArray(details?.decoringSections)) return true;
  if (
    asRecord(details?.deCoringDetails) ||
    asRecord(details?.decoringDetails) ||
    asRecord(rec.deCoringDetails) ||
    asRecord(rec.decoringDetails)
  ) {
    return true;
  }
  // Flat QC create/update unit shape
  if (
    rec.deCoringLoad != null ||
    rec.deCoringDateTime != null ||
    rec.DE_CORING_LOAD != null ||
    rec.DE_CORING_DATE_TIME != null
  ) {
    return true;
  }

  const candidateSections = [
    ...asArray(rec.sections),
    ...asArray(details?.sections),
  ];
  return candidateSections.some((section) => {
    const sectionId = String(asRecord(section)?.sectionId ?? "")
      .trim()
      .toUpperCase()
      .replace(/-/g, "_");
    return (
      sectionId === QC_DE_CORING_SECTION_IDS.DETAILS ||
      sectionId === QC_DE_CORING_MANUFACTURING_SECTION_ID
    );
  });
};

/** Flatten nested create/update de-coring motor into form sections for hydrate. */
export const deCoringMotorDetailToSections = (
  rec: Record<string, unknown>,
  motorId: string,
): SchemaSectionSubmission[] => {
  const sections: SchemaSectionSubmission[] = [];
  const nestedSections = [
    ...asArray(rec.sections),
    ...asArray(rec.decoringSections),
    ...asArray(asRecord(rec.details)?.sections),
    ...asArray(asRecord(rec.details)?.decoringSections),
  ];

  for (const section of nestedSections) {
    const sec = asRecord(section);
    if (!sec) continue;
    const sectionId = String(sec.sectionId ?? "").trim();
    if (!isDeCoringSectionId(sectionId)) continue;
    const data = asRecord(asArray(sec.sectionData)[0]) ?? {};
    const mapped = mapDeCoringDetailsFromRecord({
      ...resolveDeCoringDetailsRecord(rec),
      ...data,
    });
    sections.push({
      sectionId: QC_DE_CORING_SECTION_IDS.DETAILS,
      sectionData: [mapped],
      motorId,
    } as SchemaSectionSubmission);
  }

  if (!sections.length) {
    const mapped = mapDeCoringDetailsFromRecord(resolveDeCoringDetailsRecord(rec));
    if (Object.values(mapped).some(hasValue)) {
      sections.push({
        sectionId: QC_DE_CORING_SECTION_IDS.DETAILS,
        sectionData: [mapped],
        motorId,
      } as SchemaSectionSubmission);
    }
  }

  return sections;
};

/** Legacy section payload (internal hydrate / manufacturing seed). */
export const buildDeCoringSectionPayload = (
  values: SchemaFormValues | null | undefined,
  motorId?: string | null,
): SchemaSectionSubmission[] => {
  const section: SchemaSectionSubmission = {
    sectionId: QC_DE_CORING_SECTION_IDS.DETAILS,
    sectionData: [
      {
        DE_CORING_LOAD: getDeCoringField(values, "DE_CORING_LOAD"),
        DE_CORING_DATE_TIME: getDeCoringField(values, "DE_CORING_DATE_TIME"),
        OBSERVATIONS: getDeCoringField(values, "OBSERVATIONS"),
      },
    ],
  };
  const trimmedMotorId = String(motorId ?? "").trim();
  if (trimmedMotorId) {
    (section as SchemaSectionSubmission & { motorId?: string }).motorId = trimmedMotorId;
  }
  return [section];
};

export const deCoringValuesHaveData = (values: SchemaFormValues | null | undefined) =>
  (["DE_CORING_LOAD", "DE_CORING_DATE_TIME", "OBSERVATIONS"] as const).some((field) =>
    hasValue(getDeCoringField(values, field)),
  );
