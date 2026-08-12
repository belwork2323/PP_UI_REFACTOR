import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import {
  QC_DE_CORING_MANUFACTURING_SECTION_ID,
  QC_DE_CORING_SECTION_IDS,
  type QcDeCoringField,
} from "./qcDeCoringConfig";

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
  const remarks = pickFirstValue(data.DECORING_REMARKS, data.REMARKS, data.remarks);
  const visual = pickFirstValue(
    data.DECORING_VISUAL_OBSERVATION,
    data.VISUAL_OBSERVATION,
    data.VISUAL_OBSERVATIONS,
  );
  return [observations, remarks, visual].filter(Boolean).join("; ");
};

const mapDetailsFromRecord = (data: Record<string, unknown>): Record<QcDeCoringField, string> => ({
  DE_CORING_LOAD: pickFirstValue(data.DE_CORING_LOAD, data.DECORING_LOAD, data.decoringLoad),
  DE_CORING_DATE_TIME: pickFirstValue(
    data.DE_CORING_DATE_TIME,
    data.DECORING_DATE_TIME,
    data.DECORING_DATE,
    data.decoringDateTime,
    data.decoringDate,
  ),
  OBSERVATIONS: mapObservationsFromRecord(data),
});

export const hydrateDeCoringValuesFromSections = (
  sections: SchemaSectionSubmission[] | null | undefined,
): SchemaFormValues => {
  const values = createInitialDeCoringValues();

  for (const section of sections ?? []) {
    const sectionId = String(section.sectionId ?? "").trim();
    if (!isDeCoringSectionId(sectionId)) continue;
    const data = asRecord(asArray(section.sectionData)[0]);
    if (!data) continue;
    const mapped = mapDetailsFromRecord(data);
    values[formKey(QC_DE_CORING_SECTION_IDS.DETAILS, "DE_CORING_LOAD")] = mapped.DE_CORING_LOAD;
    values[formKey(QC_DE_CORING_SECTION_IDS.DETAILS, "DE_CORING_DATE_TIME")] =
      mapped.DE_CORING_DATE_TIME;
    values[formKey(QC_DE_CORING_SECTION_IDS.DETAILS, "OBSERVATIONS")] = mapped.OBSERVATIONS;
  }

  return values;
};

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
