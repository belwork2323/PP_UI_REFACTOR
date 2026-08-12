import { USER_CASE_PREPARATION_ENDPOINTS } from "../../data/api/endPoints";
import type { SchemaFetchConfig } from "../controller/schemaEngineController";
import {
  buildInitialFormValues,
  mergeSectionDataIntoValues,
  toSectionSubmissions,
} from "../state/formState";
import type {
  SchemaBlock,
  SchemaDocumentV2,
  SchemaFieldBlock,
  SchemaFormValues,
  SchemaSection,
  SchemaSectionSubmission,
  SchemaTableBlock,
} from "../types";
import type { SchemaSetupContext } from "../utils/setupContext";
import { syncRowGenerationTables } from "../utils/rowGenerationSync";

export const CP_SCHEMA_FUNCTIONALITY = "CREATE_CASE_PREPARATION_FORM";
export const CP_SCHEMA_TYPE = "CASE_PREPARATION";
export const CP_SCHEMA_VERSION = "1.0";

/** Injected when API schema omits a date entry for pre-heating / liner coating. */
export const CP_PREHEATING_DATE_FIELD_ID = "preHeatingDate";
export const CP_LINER_COATING_DATE_FIELD_ID = "linerCoatingDate";

const PREHEATING_SECTION_IDS = new Set(["preHeating", "PREHEATING", "preheating"]);
const LINER_SECTION_IDS = new Set([
  "linerCoatingOperation",
  "LINER_COATING",
  "LINEAR_COATING",
  "linerCoating",
]);
const PREHEATING_MONITOR_TABLE_IDS = new Set([
  "preHeatingMonitoring",
  "PREHEATING_MONITORING",
  "preheatingMonitoring",
]);
const LINER_LOG_TABLE_IDS = new Set([
  "linerApplicationLog",
  "LINER_APPLICATION_LOG",
  "linerApplicationProcessLog",
]);

const hasDateFieldOrPreset = (blocks: SchemaBlock[]): boolean => {
  for (const block of blocks) {
    if (block.type === "field" && block.fieldType === "date") return true;
    if (block.type === "table") {
      const hasDateColumn = (block.columns ?? []).some(
        (col) => col.id === "DATE" || col.fieldType === "date",
      );
      if (hasDateColumn) return true;
      const presets = block.rows?.presetRows ?? [];
      const hasDatePreset = presets.some((row) => {
        const parameter = String(row.parameter ?? row.PARAMETER ?? row.operation ?? "").trim().toLowerCase();
        const valueType = String(
          row.value__fieldType ?? row["value__fieldType"] ?? "",
        )
          .trim()
          .toLowerCase();
        return parameter === "date" || valueType === "date";
      });
      if (hasDatePreset) return true;
    }
    if ("children" in block && Array.isArray(block.children) && hasDateFieldOrPreset(block.children)) {
      return true;
    }
  }
  return false;
};

const createDateField = (id: string, label = "Date"): SchemaFieldBlock => ({
  type: "field",
  id,
  fieldType: "date",
  label,
  ui: { maxWidth: "240px" },
});

const injectDatePresetRow = (table: SchemaTableBlock): SchemaTableBlock => {
  const presets = [...(table.rows?.presetRows ?? [])];
  const alreadyHasDate = presets.some((row) => {
    const parameter = String(row.parameter ?? row.PARAMETER ?? row.operation ?? "").trim().toLowerCase();
    return parameter === "date";
  });
  if (alreadyHasDate) return table;

  const datePreset = {
    readonly: true,
    parameter: "Date",
    value__fieldType: "date",
  };
  const nextPresets = [datePreset, ...presets];
  return {
    ...table,
    rows: {
      ...table.rows,
      allowAdd: table.rows?.allowAdd ?? false,
      allowDelete: table.rows?.allowDelete ?? false,
      defaultCount: Math.max(table.rows?.defaultCount ?? 0, nextPresets.length),
      presetRows: nextPresets,
    },
  };
};

const enrichCasePrepBlocks = (
  blocks: SchemaBlock[],
  sectionKind: "preheating" | "liner" | null,
): SchemaBlock[] => {
  if (!sectionKind) return blocks;

  const next = blocks.map((block) => {
    if (block.type === "table") {
      const tableId = String(block.id ?? "");
      const shouldInjectPreset =
        (sectionKind === "preheating" && PREHEATING_MONITOR_TABLE_IDS.has(tableId)) ||
        (sectionKind === "liner" && LINER_LOG_TABLE_IDS.has(tableId));
      if (shouldInjectPreset) return injectDatePresetRow(block);
    }
    if ("children" in block && Array.isArray(block.children)) {
      return {
        ...block,
        children: enrichCasePrepBlocks(block.children, sectionKind),
      } as SchemaBlock;
    }
    return block;
  });

  if (hasDateFieldOrPreset(next)) return next;

  const fieldId =
    sectionKind === "preheating" ? CP_PREHEATING_DATE_FIELD_ID : CP_LINER_COATING_DATE_FIELD_ID;
  return [createDateField(fieldId), ...next];
};

const resolveSectionKind = (sectionId: string): "preheating" | "liner" | null => {
  if (PREHEATING_SECTION_IDS.has(sectionId)) return "preheating";
  if (LINER_SECTION_IDS.has(sectionId)) return "liner";
  return null;
};

/** Ensure Pre-heating / Liner Coating expose a Date control (picker) even if API schema omits it. */
export const enrichCasePreparationSchemaDates = (
  schema: SchemaDocumentV2,
): SchemaDocumentV2 => {
  const sections = (schema.sections ?? []).map((section: SchemaSection) => {
    const kind = resolveSectionKind(String(section.id ?? ""));
    if (!kind) return section;
    const children = Array.isArray(section.children) ? section.children : [];
    return {
      ...section,
      children: enrichCasePrepBlocks(children, kind),
    };
  });

  return { ...schema, sections };
};

export const casePreparationSchemaFetchConfig: SchemaFetchConfig = {
  endpoint: USER_CASE_PREPARATION_ENDPOINTS.SCHEMA,
};

export const mapCasePrepBatchTypeToSchema = (batchType: string | undefined | null) => {
  const normalized = String(batchType ?? "").toUpperCase();
  if (normalized === "MAIN" || normalized === "MAIN_BATCH") return "MAIN_BATCH";
  if (normalized === "SUBSCALE" || normalized === "SUBSCALE_BATCH") return "SUBSCALE_BATCH";
  return normalized;
};

export const buildCasePreparationSchemaRequest = (params: {
  subDepartmentId: number;
  batchType: string;
}) => ({
  schemaVersion: CP_SCHEMA_VERSION,
  schemaType: CP_SCHEMA_TYPE,
  subdepartmentId: params.subDepartmentId,
  batchType: mapCasePrepBatchTypeToSchema(params.batchType),
  functionality: CP_SCHEMA_FUNCTIONALITY,
});

export const createCasePrepInitialValues = (
  schema: SchemaDocumentV2,
  setupContext?: SchemaSetupContext,
) => syncRowGenerationTables(schema, buildInitialFormValues(schema, setupContext));

export const hydrateCasePrepValuesFromSections = (
  schema: SchemaDocumentV2,
  sections: SchemaSectionSubmission[],
  setupContext?: SchemaSetupContext,
): SchemaFormValues =>
  syncRowGenerationTables(schema, mergeSectionDataIntoValues(schema, sections, setupContext));

/** @deprecated Form is per-motor; schema is identical for every motor tab. */
export const CASE_PREP_BATCH_LEVEL_SECTION_IDS = new Set<string>();

/** Kept for call-site compatibility — returns the same schema for all motors. */
export const filterCasePrepSchemaForMotor = (
  schema: SchemaDocumentV2,
  _motorIndex?: number,
): SchemaDocumentV2 => schema;

/** Build section payload from schema + form values (hidden blocks omitted). */
export const buildCasePrepSectionPayload = (
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
): SchemaSectionSubmission[] =>
  toSectionSubmissions(schema, syncRowGenerationTables(schema, values));

export type CasePrepMotorSubmission = {
  motorId: string;
  prrcClearanceDate: string;
  motorSubmissionType?: "DRAFT" | "SUBMIT";
  sections: SchemaSectionSubmission[];
};

export const buildCasePrepMotorSubmission = (
  motorId: string,
  prrcClearanceDate: string,
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
  motorSubmissionType?: "DRAFT" | "SUBMIT",
): CasePrepMotorSubmission => ({
  motorId,
  prrcClearanceDate,
  ...(motorSubmissionType ? { motorSubmissionType } : {}),
  sections: buildCasePrepSectionPayload(schema, values),
});

export const isCasePrepSchemaDocument = (schema: SchemaDocumentV2 | null | undefined) =>
  schema?.schemaType === CP_SCHEMA_TYPE;
