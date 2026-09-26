import type { SchemaSectionSubmission } from "../../../schema-engine";
import { formatDateTimeForApi, toCamelCaseKey } from "../rawMaterialPreparationApiMapper";
import type { DefaultSolidProcessForm, DryingTrayOvenForm, SievingForm } from "./defaultSolidProcessForm";
import {
  createEmptyDefaultSolidProcessForm,
  createEmptyDryingTrayOvenForm,
  createEmptySievingForm,
} from "./defaultSolidProcessForm";

const SECTION_DRYING = "dryingTrayOven";
const SECTION_SIEVING = "sieving";

const normalizeSectionId = (sectionId: string): string =>
  toCamelCaseKey(String(sectionId ?? "").trim());

const pickField = (row: Record<string, unknown>, ...candidates: string[]): string => {
  for (const candidate of candidates) {
    const camel = toCamelCaseKey(candidate);
    const keys = [candidate, camel, candidate.toUpperCase(), candidate.toLowerCase()];
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
        return String(row[key]).trim();
      }
    }
  }
  return "";
};

const firstSectionRow = (
  sections: SchemaSectionSubmission[] | undefined,
  sectionId: string,
): Record<string, unknown> => {
  const target = normalizeSectionId(sectionId);
  const section = (sections ?? []).find(
    (entry) => normalizeSectionId(String(entry.sectionId ?? "")) === target,
  );
  const data = section?.sectionData;
  if (!Array.isArray(data) || data.length === 0) return {};
  const row = data[0];
  if (row && typeof row === "object" && !Array.isArray(row)) {
    return row as Record<string, unknown>;
  }
  return {};
};

const rowFromDrying = (drying: DryingTrayOvenForm): Record<string, unknown> => {
  const row: Record<string, unknown> = {};
  if (drying.ovenType.trim()) row.ovenType = drying.ovenType.trim();
  if (drying.ovenNumber.trim()) row.ovenNumber = drying.ovenNumber.trim();
  if (drying.ovenSetTemperature.trim()) row.ovenSetTemperature = drying.ovenSetTemperature.trim();
  const start = formatDateTimeForApi(drying.startDatetime);
  if (start) row.startDatetime = start;
  const end = formatDateTimeForApi(drying.endDatetime);
  if (end) row.endDatetime = end;
  if (drying.moisture.trim()) row.moisture = drying.moisture.trim();
  if (drying.observation.trim()) row.observation = drying.observation.trim();
  return row;
};

const rowFromSieving = (sieving: SievingForm): Record<string, unknown> => {
  const row: Record<string, unknown> = {};
  const dispatch = formatDateTimeForApi(sieving.sievingDispatchDatetime);
  if (dispatch) row.sievingDispatchDatetime = dispatch;
  if (sieving.sievedQuantity.trim()) row.sievedQuantity = sieving.sievedQuantity.trim();
  if (sieving.sieveMeshSize.trim()) row.sieveMeshSize = sieving.sieveMeshSize.trim();
  if (sieving.observation.trim()) row.observation = sieving.observation.trim();
  return row;
};

export const defaultSolidToSections = (
  form: DefaultSolidProcessForm,
): SchemaSectionSubmission[] => {
  const sections: SchemaSectionSubmission[] = [];
  const dryingRow = rowFromDrying(form.drying);
  if (Object.keys(dryingRow).length > 0) {
    sections.push({ sectionId: SECTION_DRYING, sectionData: [dryingRow] });
  }
  const sievingRow = rowFromSieving(form.sieving);
  if (Object.keys(sievingRow).length > 0) {
    sections.push({ sectionId: SECTION_SIEVING, sectionData: [sievingRow] });
  }
  return sections;
};

export const hydrateDefaultSolidFromSections = (
  sections: SchemaSectionSubmission[] | undefined,
): DefaultSolidProcessForm => {
  const dryingRow = firstSectionRow(sections, SECTION_DRYING);
  const sievingRow = firstSectionRow(sections, SECTION_SIEVING);

  const drying: DryingTrayOvenForm = {
    ...createEmptyDryingTrayOvenForm(),
    ovenType: pickField(dryingRow, "ovenType", "OVEN_TYPE"),
    ovenNumber: pickField(dryingRow, "ovenNumber", "OVEN_NUMBER"),
    ovenSetTemperature: pickField(dryingRow, "ovenSetTemperature", "OVEN_SET_TEMPERATURE"),
    startDatetime: pickField(dryingRow, "startDatetime", "START_DATETIME"),
    endDatetime: pickField(dryingRow, "endDatetime", "END_DATETIME"),
    moisture: pickField(dryingRow, "moisture", "MOISTURE"),
    observation: pickField(dryingRow, "observation", "OBSERVATION"),
  };

  const sieving: SievingForm = {
    ...createEmptySievingForm(),
    sievingDispatchDatetime: pickField(
      sievingRow,
      "sievingDispatchDatetime",
      "SIEVING_DISPATCH_DATETIME",
    ),
    sievedQuantity: pickField(sievingRow, "sievedQuantity", "SIEVED_QUANTITY"),
    sieveMeshSize: pickField(sievingRow, "sieveMeshSize", "SIEVE_MESH_SIZE"),
    observation: pickField(sievingRow, "observation", "OBSERVATION"),
  };

  return {
    uiKey: "defaultSolid",
    drying,
    sieving,
  };
};

export const hydrateDefaultSolidFromSectionsOrEmpty = (
  sections: SchemaSectionSubmission[] | undefined,
): DefaultSolidProcessForm => {
  if (!sections?.length) return createEmptyDefaultSolidProcessForm();
  return hydrateDefaultSolidFromSections(sections);
};
