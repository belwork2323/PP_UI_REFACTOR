import dayjs from "dayjs";
import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import { formatToUiDate, UI_DATETIME_FORMAT } from "../../../utils/dateUtils";
import { resolveManufacturingDivisionDetailsPayload } from "./qcHardwareDivisionDetails";
import {
  QC_DE_CORING_MANUFACTURING_SECTION_ID,
  QC_DE_CORING_SECTION_IDS,
} from "./qcDeCoringConfig";
import {
  createInitialDeCoringValues,
  hydrateDeCoringValuesFromSections,
  mapDeCoringDetailsFromRecord,
  resolveDeCoringDetailsRecord,
} from "./qcDeCoringTables";

type ManufacturingSection = {
  sectionId: string;
  sectionData: unknown[];
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const hasValue = (value: unknown) => Boolean(String(value ?? "").trim());

const formKey = (sectionId: string, blockId: string) => `${sectionId}::${blockId}`;

const isValueEmpty = (value: unknown): boolean => {
  if (value == null) return true;
  if (typeof value === "string") return !value.trim();
  return !hasValue(value);
};

const pickFirstValue = (...candidates: unknown[]): string => {
  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim();
    if (value && value.toLowerCase() !== "null") return value;
  }
  return "";
};

const formatManufacturingDateTime = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const dmyTime = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::\d{2})?)?$/);
  if (dmyTime) {
    const date = `${dmyTime[1].padStart(2, "0")}-${dmyTime[2].padStart(2, "0")}-${dmyTime[3]}`;
    if (dmyTime[4] != null) {
      return `${date} ${dmyTime[4].padStart(2, "0")}:${dmyTime[5]}`;
    }
    return date;
  }

  if (raw.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const parsed = dayjs(raw);
    if (parsed.isValid()) {
      if (/[T\s]\d{1,2}:\d{2}/.test(raw)) return parsed.format(UI_DATETIME_FORMAT);
      return parsed.format("DD-MM-YYYY");
    }
  }

  return formatToUiDate(raw) || raw;
};

const collectMotorLists = (payload: unknown): unknown[] => {
  const root = resolveManufacturingDivisionDetailsPayload(payload);
  if (!root) return [];
  const details = asRecord(root.data) ?? root;
  return [
    ...asArray(details.motors),
    ...asArray(details.motorDetails),
    ...asArray(details.deCoringDetails),
    ...asArray(details.decoringDetails),
    ...asArray(details.curingDetails),
    ...asArray(root.motors),
    ...asArray(root.motorDetails),
    ...asArray(root.deCoringDetails),
    ...asArray(root.decoringDetails),
    ...asArray(root.curingDetails),
  ];
};

const findDeCoringMotorRecord = (
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

const toManufacturingSections = (sections: unknown[]): ManufacturingSection[] =>
  sections
    .map((section) => asRecord(section))
    .filter(Boolean)
    .map((section) => ({
      sectionId: String(section!.sectionId ?? "").trim(),
      sectionData: asArray(section!.sectionData),
    }))
    .filter((section) => section.sectionId);

const extractMotorSections = (motor: Record<string, unknown> | null): ManufacturingSection[] => {
  if (!motor) return [];
  const details = asRecord(motor.details) ?? motor;
  const nestedObject =
    asRecord(details.deCoringDetails) ??
    asRecord(details.decoringDetails) ??
    asRecord(motor.deCoringDetails) ??
    asRecord(motor.decoringDetails);
  // Manufacturing division-details often returns a flat object under details.decoringDetails
  // (not section arrays). Synthesize a section so hydrate paths stay consistent.
  if (
    nestedObject &&
    !Array.isArray(details.deCoringDetails) &&
    !Array.isArray(details.decoringDetails) &&
    !Array.isArray(motor.deCoringDetails) &&
    !Array.isArray(motor.decoringDetails)
  ) {
    return [
      {
        sectionId: QC_DE_CORING_MANUFACTURING_SECTION_ID,
        sectionData: [nestedObject],
      },
    ];
  }
  return toManufacturingSections(
    asArray(
      details.decoringSections ??
        details.sections ??
        details.curingSections ??
        motor.decoringSections ??
        motor.sections ??
        motor.curingSections,
    ),
  );
};

const firstSectionRecord = (
  sections: ManufacturingSection[],
  sectionId: string,
): Record<string, unknown> | null => {
  const match = sections.find(
    (section) =>
      section.sectionId.localeCompare(sectionId, undefined, { sensitivity: "accent" }) === 0,
  );
  return asRecord(asArray(match?.sectionData)[0]) ?? null;
};

const sectionsLookLikeQcDeCoring = (sections: ManufacturingSection[]) =>
  sections.some(
    (section) =>
      section.sectionId === QC_DE_CORING_SECTION_IDS.DETAILS ||
      section.sectionId === QC_DE_CORING_MANUFACTURING_SECTION_ID,
  );

const mapDeCoringFieldsFromManufacturing = (
  motor: Record<string, unknown>,
  sections: ManufacturingSection[],
): Record<string, string> => {
  const qcSection = firstSectionRecord(sections, QC_DE_CORING_SECTION_IDS.DETAILS);
  const mfgSection = firstSectionRecord(sections, QC_DE_CORING_MANUFACTURING_SECTION_ID);
  const nested = resolveDeCoringDetailsRecord(motor);
  const source = { ...nested, ...(mfgSection ?? {}), ...(qcSection ?? {}) };
  const mapped = mapDeCoringDetailsFromRecord(source);

  return {
    DE_CORING_LOAD: mapped.DE_CORING_LOAD,
    DE_CORING_DATE_TIME: formatManufacturingDateTime(mapped.DE_CORING_DATE_TIME),
    OBSERVATIONS: mapped.OBSERVATIONS,
  };
};

const applyManufacturingDeCoringFieldSeed = (
  values: SchemaFormValues,
  motor: Record<string, unknown>,
  sections: ManufacturingSection[],
  onlyIfEmpty: boolean,
): SchemaFormValues => {
  const next = { ...values };
  const mapped = mapDeCoringFieldsFromManufacturing(motor, sections);

  const mergeField = (field: string, incoming: unknown) => {
    const key = formKey(QC_DE_CORING_SECTION_IDS.DETAILS, field);
    if (onlyIfEmpty && !isValueEmpty(next[key])) return;
    if (hasValue(incoming)) next[key] = String(incoming);
  };

  mergeField("DE_CORING_LOAD", mapped.DE_CORING_LOAD);
  mergeField("DE_CORING_DATE_TIME", mapped.DE_CORING_DATE_TIME);
  mergeField("OBSERVATIONS", mapped.OBSERVATIONS);
  return next;
};

export const applyDeCoringDivisionDetailsSeed = (
  base: SchemaFormValues,
  payload: unknown,
  motorId: string,
  options?: { onlyIfEmpty?: boolean },
): SchemaFormValues => {
  const onlyIfEmpty = options?.onlyIfEmpty ?? false;
  const motor = findDeCoringMotorRecord(payload, motorId);
  if (!motor) return base;

  const sections = extractMotorSections(motor);
  let next = { ...base };

  if (sectionsLookLikeQcDeCoring(sections)) {
    const hydrated = hydrateDeCoringValuesFromSections(sections as SchemaSectionSubmission[]);
    if (onlyIfEmpty) {
      Object.entries(hydrated).forEach(([key, value]) => {
        if (isValueEmpty(next[key])) next[key] = value;
      });
    } else {
      next = { ...next, ...hydrated };
    }
    return applyManufacturingDeCoringFieldSeed(next, motor, sections, true);
  }

  return applyManufacturingDeCoringFieldSeed(next, motor, sections, onlyIfEmpty);
};

export const buildInitialDeCoringValuesForMotor = (
  payload: unknown,
  motorId: string,
): SchemaFormValues => {
  const values = createInitialDeCoringValues();
  return applyDeCoringDivisionDetailsSeed(values, payload, motorId, { onlyIfEmpty: false });
};
