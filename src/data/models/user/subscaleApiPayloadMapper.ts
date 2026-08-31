import {
  scopedFormKey,
  syncRowGenerationTables,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../schema-engine";
import { mapSubscaleBatchType } from "../../../schema-engine/adapters/subscale.adapter";
import {
  ARTICLE_TYPE_TABLE_ID,
  HARDWARE_COUNT_FIELDS,
  HARDWARE_SECTION_ID,
  LINER_TYPE_FIELD,
  LINER_BATCH_NO_FIELD,
  LINER_BATCH_DATE_FIELD,
  type ArticleTypeRow,
} from "../../../hooks/user/manufacturing/subscaleHardwareConfig";
import {
  SUBSCALE_BATCH_FIELDS,
  normalizeSubscaleMixingCycles,
} from "../../../hooks/user/manufacturing/subscaleBatchConfig";
import { formatToUiDate } from "../../../utils/dateUtils";
import { parseFileRefs, type FileRef } from "../common/FileUploadModel";

/** Mirrors backend `SubscaleDetailsDTO.MixParticular` */
export type SubscaleMixParticularDTO = {
  operationId?: number;
  operation?: string;
  rpm?: string;
  time?: string;
  temp?: string;
  vacuum?: string;
};

/** Mirrors backend `SubscaleDetailsDTO.MixingCycle` */
export type SubscaleMixingCycleDTO = {
  motorStage?: number;
  mixingCycleId?: number;
  mixingCycleCode?: string;
  mixingCycleName?: string;
  premixParticulars?: SubscaleMixParticularDTO[];
  finalMixParticulars?: SubscaleMixParticularDTO[];
};

/** Mirrors backend `SubscaleDetailsDTO` */
export type SubscaleDetailsDTO = {
  batchSize?: number;
  premixDate?: string;
  mixerType?: string;
  bldgNo?: string;
  finalMixDate?: string;
  mixingCycle?: SubscaleMixingCycleDTO;
};

/** Mirrors backend `HardwarePreparationDetailsDTO` */
export type HardwarePreparationDetailsDTO = {
  numberOf40KgBems?: number;
  numberOf10KgBems?: number;
  numberOf2KgBems?: number;
  numberOfWheelPeels?: number;
  numberOfCartoons?: number;
  numberOfSbsTbs?: number;
  linerType?: string;
  linerBatchNo?: string;
  linerBatchDate?: string;
};

/** Mirrors backend `HardwarePreparationTableDTO` */
export type HardwarePreparationTableDTO = {
  articleType?: string;
  rubberMaterial?: string;
  sleeveNo?: string;
  mouldNo?: string;
  lengthMm?: string;
  thicknessMm?: number;
  linerApplied?: boolean;
  observations?: string;
};

/** Mirrors backend `CastingTableDTO` */
export type CastingTableDTO = {
  articleType?: string;
  bemMouldNo?: string;
  castingPitNo?: string;
  castingStartTime?: string;
  castingEndTime?: string;
  vacuumLevel?: number;
  remarks?: string;
};

/** Mirrors backend `CastingDetailsDTO` */
export type CastingDetailsDTO = {
  dateOfCasting?: string;
  castingTable?: CastingTableDTO[];
};

/** Mirrors backend `CuringTableDTO` */
export type CuringTableDTO = {
  articleType?: string;
  bemMouldNo?: string;
  curingStartDate?: string;
  curingEndDate?: string;
  ovenNo?: string;
  temperature?: number;
  hardness?: number;
  decoringDate?: string;
  decoringLoad?: number;
  grainSurfaceObservations?: string;
};

/** Mirrors backend `CuringDetailsDTO` */
export type CuringDetailsDTO = {
  curingTable?: CuringTableDTO[];
};

/** Mirrors backend `NdtTableDTO` */
export type NdtTableDTO = {
  articleType?: string;
  bemNo?: string;
  dateOfNdt?: string;
  observations?: string;
};

/** Mirrors backend `NdtDetailsDTO` */
export type NdtDetailsDTO = {
  ndtTable?: NdtTableDTO[];
};

/** Mirrors backend `TrimmingTableDTO` */
export type TrimmingTableDTO = {
  articleType?: string;
  bemNo?: string;
  heOd?: number;
  hePortInner?: number;
  hePortOuter?: number;
  heBeforeInhibitionInner?: number;
  heBeforeInhibitionOuter?: number;
  neOd?: number;
  nePortInner?: number;
  nePortOuter?: number;
  neWebInner?: number;
  neWebOuter?: number;
  lengthBeforeInhibition?: number;
};

/** Mirrors backend `TrimmingDetailsDTO` */
export type TrimmingDetailsDTO = {
  trimmingTable?: TrimmingTableDTO[];
};

/** Mirrors backend `InhibitionTableDTO` */
export type InhibitionTableDTO = {
  articleType?: string;
  bemNo?: string;
  linerCoatedSleeveWeight?: number;
  weightBeforeInhibition?: number;
  weightAfterInhibition?: number;
  irAppliedWeight?: number;
  remarks?: string;
};

/** Mirrors backend `InhibitionDetailsDTO` */
export type InhibitionDetailsDTO = {
  irBatchNo?: string;
  dateOfManufacturing?: string;
  dateOfApplication?: string;
  inhibitionTable?: InhibitionTableDTO[];
};

/** Static-test graph attachment as expected by create/update API */
export type SubscaleGraphFileDTO = {
  fileId?: string;
  fileName?: string;
  status?: string;
  mimeType?: string;
  readOnly?: boolean;
};

/** Mirrors backend `StaticTestingTableDTO` (API may return `nvalue` lowercase) */
export type StaticTestingTableDTO = {
  articleType?: string | null;
  bemNo?: string | null;
  propellantMass?: number | null;
  dt?: number | null;
  webThickness?: number | null;
  nValue?: number | null;
  nvalue?: number | null;
  pressureAvg?: number | null;
  thrustAvg?: number | null;
  burnRate?: number | null;
  /** Preferred create/update shape */
  graph?: SubscaleGraphFileDTO | null;
  /** Legacy details responses may still return document id only */
  graphDocumentId?: string | null;
};

/** Mirrors backend `StaticTestingDetailsDTO` */
export type StaticTestingDetailsDTO = {
  staticTestingTable?: StaticTestingTableDTO[];
};

/** Mirrors backend `MechanicalPropertiesTableDTO` */
export type MechanicalPropertiesTableDTO = {
  articleType?: string;
  bemNo?: string;
  ts?: number;
  elongation?: number;
  modulus?: number;
  sbs?: number;
  tbs?: number;
  peelStrength?: number;
  density?: number;
  actor?: string;
};

/** Mirrors backend `MechanicalInterfacePropertiesDTO` */
export type MechanicalInterfacePropertiesDTO = {
  mechanicalPropertiesTable?: MechanicalPropertiesTableDTO[];
};

/** Section payload body shared by create and update requests */
export type SubscaleApiPayloadBody = {
  subscaleDetails?: SubscaleDetailsDTO;
  hardwarePreparationDetails?: HardwarePreparationDetailsDTO;
  hardwarePreparationTable?: HardwarePreparationTableDTO[];
  castingDetails?: CastingDetailsDTO;
  curingDetails?: CuringDetailsDTO;
  ndtDetails?: NdtDetailsDTO;
  trimmingDetails?: TrimmingDetailsDTO;
  inhibitionDetails?: InhibitionDetailsDTO;
  staticTestingDetails?: StaticTestingDetailsDTO;
  mechanicalInterfaceProperties?: MechanicalInterfacePropertiesDTO;
};

export type SubscaleFormSubmissionType = "DRAFT" | "SUBMIT";

/** Mirrors backend `CreateSubscaleProcessingRequest` */
export type CreateSubscaleProcessingRequest = SubscaleApiPayloadBody & {
  batchId: string;
  batchType: string;
  subDepartmentId: number;
  formSubmissionType: SubscaleFormSubmissionType;
};

/** Mirrors backend update request (includes formId) */
export type UpdateSubscaleProcessingRequest = CreateSubscaleProcessingRequest & {
  formId: string;
};

/** Person reference as returned by form details API */
export type SubscalePersonRef = {
  id?: string;
  fullName?: string;
  name?: string;
};

/** Full form details response from `/api/v1/user/subscale/form/details` */
export type SubscaleDetailsResponse = SubscaleApiPayloadBody & {
  subscaleProcessingId: string;
  formId: string;
  batchId: string;
  batchType: string;
  status?: string;
  createdBy?: string | SubscalePersonRef | null;
  createdAt?: string | null;
  submittedBy?: string | SubscalePersonRef | null;
  submittedAt?: string | null;
  lastUpdatedBy?: string | SubscalePersonRef | null;
  lastUpdatedAt?: string | null;
  subDepartmentId?: number;
  formSubmissionType?: string;
  sections?: SchemaSectionSubmission[];
};

const HARDWARE_COUNT_TO_API: Record<string, string> = {
  NO_OF_40KG_BEMS: "numberOf40KgBems",
  NO_OF_10KG_BEMS: "numberOf10KgBems",
  NO_OF_2KG_BEMS: "numberOf2KgBems",
  NO_OF_WHEEL_PEEL: "numberOfWheelPeels",
  NO_OF_SBS_TBS: "numberOfSbsTbs",
  NO_OF_CARTOONS: "numberOfCartoons",
};

/** UI article labels → API `articleType` values (create/update contract). */
const ARTICLE_TYPE_TO_API: Record<string, string> = {
  "40 kg BEM": "BEM 40KG",
  "10 kg BEM": "BEM 10KG",
  "2 kg BEM": "BEM 2KG",
  "Wheel Peel": "Wheel Peel",
  "SBS/TBS": "SBS/TBS",
  Cartoons: "Cartoons",
  Cartons: "Cartoons",
  "BEM 40KG": "BEM 40KG",
  "BEM 10KG": "BEM 10KG",
  "BEM 2KG": "BEM 2KG",
  // Legacy enum codes still accepted from older drafts/details
  "40_KG_BEM": "BEM 40KG",
  "10_KG_BEM": "BEM 10KG",
  "2_KG_BEM": "BEM 2KG",
  WHEEL_PEEL: "Wheel Peel",
  SBS_TBS: "SBS/TBS",
  CARTOONS: "Cartoons",
};

const TABLE_FIELD_TO_API: Record<string, string> = {
  GRAPH_FILE: "graph",
  GRAPH_UPLOAD: "graph",
};

const mapGraphFileToApi = (value: unknown): SubscaleGraphFileDTO | undefined => {
  const refs = parseFileRefs(value);
  const ref: FileRef | undefined =
    refs.find((item) => String(item.fileId ?? "").trim()) ?? refs[0];
  if (!ref) {
    // Bare fileId string from legacy storage
    const bareId = String(value ?? "").trim();
    if (bareId && !bareId.includes("{") && bareId !== "[object Object]") {
      return { fileId: bareId, fileName: bareId, status: "SUCCESS", readOnly: false };
    }
    return undefined;
  }

  const fileId = String(ref.fileId ?? "").trim();
  if (!fileId) return undefined;

  const fileName =
    String(ref.originalFileName ?? ref.fileName ?? "").trim() || fileId;
  const mimeType = String(ref.mimeType ?? "").trim();
  const status =
    ref.status === "uploaded" || ref.status === "uploading" || ref.status === "failed"
      ? ref.status === "uploaded"
        ? "SUCCESS"
        : String(ref.status).toUpperCase()
      : "SUCCESS";

  return {
    fileId,
    fileName,
    status,
    ...(mimeType ? { mimeType } : {}),
    readOnly: false,
  };
};

const SUBSCALE_SCHEMA_SECTIONS = {
  CASTING: "CASTING_DETAILS",
  CURING: "CURING_DETAILS",
  NDT: "NDT_DETAILS",
  TRIMMING: "TRIMMING_DETAILS",
  INHIBITION: "INHIBITION_DETAILS",
  STATIC_TESTING: "STATIC_TESTING",
  MECHANICAL: "MECHANICAL_INTERFACE_PROPERTIES",
} as const;

const INHIBITION_FIELD_IDS = {
  IR_BATCH_NO: "IR_BATCH_NO",
  DATE_OF_MANUFACTURING: "DATE_OF_MANUFACTURING",
  DATE_OF_APPLICATION: "DATE_OF_APPLICATION",
} as const;

const ARTICLE_TYPE_TO_COUNT_FIELD: Record<string, string> = {
  "40 kg BEM": "NO_OF_40KG_BEMS",
  "10 kg BEM": "NO_OF_10KG_BEMS",
  "2 kg BEM": "NO_OF_2KG_BEMS",
  "Wheel Peel": "NO_OF_WHEEL_PEEL",
  "SBS/TBS": "NO_OF_SBS_TBS",
  Cartoons: "NO_OF_CARTOONS",
  Cartons: "NO_OF_CARTOONS",
};

const RUNTIME_ROW_KEYS = new Set(["SR_NO", "srNo"]);

/** UI-only table columns not sent to the API */
const TABLE_ROW_EXCLUDED_KEYS = new Set(["PROPELLANT_WEIGHT", "DATE_OF_APPLICATION"]);

const bridgeHardwareArticleTableToSchemaScope = (values: SchemaFormValues) => {
  const rows = values[ARTICLE_TYPE_TABLE_ID];
  if (!Array.isArray(rows) || rows.length === 0) return;
  values[scopedFormKey(HARDWARE_SECTION_ID, ARTICLE_TYPE_TABLE_ID)] = rows;
};

export const applySubscaleHardwareRowGeneration = (
  schema: SchemaDocumentV2 | null | undefined,
  values: SchemaFormValues,
): SchemaFormValues => {
  const next = { ...values };
  bridgeHardwareArticleTableToSchemaScope(next);
  const castingRows = getTableRows(next, SUBSCALE_SCHEMA_SECTIONS.CASTING, "CASTING_TABLE");
  if (castingRows.length > 0) return next;
  return schema ? syncRowGenerationTables(schema, next) : next;
};

const toCamelCase = (key: string) =>
  key.toLowerCase().replace(/_([a-z0-9])/gi, (_, char: string) => char.toUpperCase());

const parseNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseBoolean = (value: unknown): boolean | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "yes", "1", "y"].includes(normalized)) return true;
  if (["false", "no", "0", "n"].includes(normalized)) return false;
  return Boolean(value);
};

const isRuntimeRowKey = (key: string) => key.startsWith("_") || RUNTIME_ROW_KEYS.has(key);

/** Hardware article panel writes unscoped keys; details hydration also sets scoped keys. */
const getFieldValue = (values: SchemaFormValues, sectionId: string, fieldId: string) => {
  if (Object.prototype.hasOwnProperty.call(values, fieldId)) {
    return values[fieldId];
  }
  return values[scopedFormKey(sectionId, fieldId)];
};

const getTableRows = (values: SchemaFormValues, sectionId: string, tableId: string) => {
  const unscoped = values[tableId];
  const scoped = values[scopedFormKey(sectionId, tableId)];
  const raw = Array.isArray(unscoped) ? unscoped : scoped;
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { rows?: unknown[] }).rows)) {
    return (raw as { rows: Record<string, unknown>[] }).rows;
  }
  return [];
};

const mapTableRowToApi = (row: Record<string, unknown>): Record<string, unknown> => {
  const mapped: Record<string, unknown> = {};

  Object.entries(row).forEach(([key, value]) => {
    if (isRuntimeRowKey(key) || TABLE_ROW_EXCLUDED_KEYS.has(key)) return;
    if (value === null || value === undefined || value === "") return;

    if (key === "ARTICLE_TYPE") {
      const raw = String(value).trim();
      mapped.articleType =
        ARTICLE_TYPE_TO_API[raw] ?? raw.replace(/\s+/g, " ").trim();
      return;
    }

    if (key === "LINER_APPLIED") {
      const bool = parseBoolean(value);
      if (bool !== undefined) mapped.linerApplied = bool;
      return;
    }

    if (key === "GRAPH_FILE" || key === "GRAPH_UPLOAD") {
      const graph = mapGraphFileToApi(value);
      if (graph) mapped.graph = graph;
      return;
    }

    const apiKey = TABLE_FIELD_TO_API[key] ?? toCamelCase(key);

    // Date columns → DD-MM-YYYY for API
    if (/DATE/i.test(key) && typeof value === "string") {
      const formatted = formatToUiDate(value);
      if (formatted) mapped[apiKey] = formatted;
      return;
    }

    const numeric =
      /_(MM|LEVEL|LOAD|MASS|OD|INNER|OUTER|WEIGHT|STRENGTH|RATE|VALUE|AVG|THK)$/i.test(key) ||
      [
        "VACUUM_LEVEL",
        "TEMPERATURE",
        "HARDNESS",
        "DECORING_LOAD",
        "HE_OD",
        "NE_OD",
        "HE_PORT_INNER",
        "HE_PORT_OUTER",
        "HE_BEFORE_INHIBITION_INNER",
        "HE_BEFORE_INHIBITION_OUTER",
        "NE_PORT_INNER",
        "NE_PORT_OUTER",
        "NE_WEB_INNER",
        "NE_WEB_OUTER",
        "DT",
        "N_VALUE",
        "DENSITY",
        "ELONGATION",
        "MODULUS",
        "PEEL_STRENGTH",
        "PROP_MASS",
        "WEB_THICKNESS",
        "PRESSURE_AVG",
        "THRUST_AVG",
        "BURN_RATE",
        "LINER_COATED_SLEEVE_WEIGHT",
        "WEIGHT_BEFORE_INHIBITION",
        "WEIGHT_AFTER_INHIBITION",
        "IR_APPLIED_WEIGHT",
        "PROPELLANT_WEIGHT",
        "LENGTH_BEFORE_INHIBITION",
        "TS",
        "SBS",
        "TBS",
      ].includes(key);

    if (numeric) {
      const num = parseNumber(value);
      if (num !== undefined) mapped[apiKey] = num;
      return;
    }

    mapped[apiKey] = value;
  });

  return mapped;
};

const mapTableRowsToApi = (rows: Record<string, unknown>[]) =>
  rows.map(mapTableRowToApi).filter((row) => Object.keys(row).length > 0);

const mapHardwarePreparationDetails = (
  values: SchemaFormValues,
): HardwarePreparationDetailsDTO | undefined => {
  const details: HardwarePreparationDetailsDTO = {};
  HARDWARE_COUNT_FIELDS.forEach((field) => {
    const apiKey = HARDWARE_COUNT_TO_API[field.id] as keyof HardwarePreparationDetailsDTO;
    const num = parseNumber(values[field.id]);
    if (apiKey && num !== undefined) (details as Record<string, unknown>)[apiKey] = num;
  });

  const linerType = String(values[LINER_TYPE_FIELD.id] ?? "").trim();
  if (linerType) details.linerType = linerType;

  const linerBatchNo = String(values[LINER_BATCH_NO_FIELD.id] ?? "").trim();
  if (linerBatchNo) details.linerBatchNo = linerBatchNo;

  const linerBatchDate = formatToUiDate(
    String(values[LINER_BATCH_DATE_FIELD.id] ?? "").trim(),
  );
  if (linerBatchDate) details.linerBatchDate = linerBatchDate;

  return Object.keys(details).length > 0 ? details : undefined;
};

const mapHardwarePreparationTable = (values: SchemaFormValues): HardwarePreparationTableDTO[] => {
  const rows = Array.isArray(values[ARTICLE_TYPE_TABLE_ID])
    ? (values[ARTICLE_TYPE_TABLE_ID] as ArticleTypeRow[])
    : [];

  return rows
    .map((row) => {
      const rawType = String(row.ARTICLE_TYPE ?? "").trim();
      const articleType = ARTICLE_TYPE_TO_API[rawType] ?? rawType;

      const mapped: HardwarePreparationTableDTO = {};
      if (articleType) mapped.articleType = articleType;
      if (row.RUBBER_MATERIAL) mapped.rubberMaterial = row.RUBBER_MATERIAL;
      if (row.SLEEVE_NO) mapped.sleeveNo = row.SLEEVE_NO;
      if (row.MOULD_NO) mapped.mouldNo = row.MOULD_NO;

      const lengthMm = String(row.SIZE_MM ?? "").trim();
      if (lengthMm) mapped.lengthMm = lengthMm;

      const thicknessMm = parseNumber(row.THICKNESS_MM);
      if (thicknessMm !== undefined) mapped.thicknessMm = thicknessMm;

      const linerApplied = parseBoolean(row.LINER_APPLIED);
      if (linerApplied !== undefined) mapped.linerApplied = linerApplied;
      if (row.OBSERVATIONS != null) mapped.observations = String(row.OBSERVATIONS);

      return mapped;
    })
    .filter((row) => Object.keys(row).length > 0);
};

const buildSectionTablePayload = (
  values: SchemaFormValues,
  sectionId: string,
  tableId: string,
  tableApiKey: string,
  extraFields?: Record<string, unknown>,
) => {
  const payload: Record<string, unknown> = { ...extraFields };
  const rows = mapTableRowsToApi(getTableRows(values, sectionId, tableId));
  if (rows.length > 0) payload[tableApiKey] = rows;
  return Object.keys(payload).length > 0 ? payload : {};
};

const mapProcessParticularRowsToApi = (
  rows: Array<{
    operationId?: number;
    operation?: string;
    rpm?: string;
    time?: string;
    temp?: string;
    vacuum?: string;
  }> = [],
) =>
  rows
    .map((row) => {
      const mapped: Record<string, unknown> = {};
      const operationId = Number(row.operationId);
      if (Number.isFinite(operationId) && operationId > 0) mapped.operationId = operationId;
      const operation = String(row.operation ?? "").trim();
      if (operation) mapped.operation = operation;
      const rpm = String(row.rpm ?? "").trim();
      if (rpm) mapped.rpm = rpm;
      const time = String(row.time ?? "").trim();
      if (time) mapped.time = time;
      const temp = String(row.temp ?? "").trim();
      if (temp) mapped.temp = temp;
      const vacuum = String(row.vacuum ?? "").trim();
      if (vacuum) mapped.vacuum = vacuum;
      return mapped;
    })
    .filter((row) => Object.keys(row).length > 0);

const mapMixingCycleToApi = (values: SchemaFormValues): SubscaleMixingCycleDTO | undefined => {
  const cycle = normalizeSubscaleMixingCycles(values[SUBSCALE_BATCH_FIELDS.MIXING_CYCLES])[0];
  if (!cycle) return undefined;

  const payload: SubscaleMixingCycleDTO = {};
  const stageRaw = String(cycle.stage ?? "").trim();
  if (stageRaw) {
    const stageNum = Number(stageRaw);
    if (Number.isFinite(stageNum)) payload.motorStage = stageNum;
  }

  if (cycle.mixingCycleId != null && Number.isFinite(Number(cycle.mixingCycleId))) {
    payload.mixingCycleId = Number(cycle.mixingCycleId);
  }

  const mixingCycleCode = String(cycle.mixingCycleCode ?? "").trim();
  if (mixingCycleCode) payload.mixingCycleCode = mixingCycleCode;

  const mixingCycleName = String(cycle.mixingCycleName ?? "").trim();
  if (mixingCycleName) payload.mixingCycleName = mixingCycleName;

  const premixParticulars = mapProcessParticularRowsToApi(
    cycle.premixParticulars?.length ? cycle.premixParticulars : cycle.processParticulars,
  );
  if (premixParticulars.length > 0) payload.premixParticulars = premixParticulars;

  const finalMixParticulars = mapProcessParticularRowsToApi(cycle.finalMixParticulars);
  if (finalMixParticulars.length > 0) payload.finalMixParticulars = finalMixParticulars;

  return Object.keys(payload).length > 0 ? payload : undefined;
};

export const mapSubscaleDetails = (values: SchemaFormValues): SubscaleDetailsDTO | undefined => {
  const payload: SubscaleDetailsDTO = {};
  const batchSize = parseNumber(values[SUBSCALE_BATCH_FIELDS.BATCH_SIZE]);
  if (batchSize !== undefined) payload.batchSize = batchSize;

  const bldgNo = String(values[SUBSCALE_BATCH_FIELDS.MIXER_BLDG_NO] ?? "").trim();
  if (bldgNo) payload.bldgNo = bldgNo;

  const mixerType = String(values.mixerType ?? values.MIXER_TYPE ?? "").trim();
  if (mixerType) payload.mixerType = mixerType;

  const premixDate = formatToUiDate(
    String(values[SUBSCALE_BATCH_FIELDS.PREMIX_DATE] ?? "").trim(),
  );
  if (premixDate) payload.premixDate = premixDate;

  const finalMixDate = formatToUiDate(
    String(values[SUBSCALE_BATCH_FIELDS.FINAL_MIX_DATE] ?? "").trim(),
  );
  if (finalMixDate) payload.finalMixDate = finalMixDate;

  const mixingCycle = mapMixingCycleToApi(values);
  if (mixingCycle) payload.mixingCycle = mixingCycle;

  return Object.keys(payload).length > 0 ? payload : undefined;
};

const SUBSCALE_SECTIONS_OBJECT_METADATA_KEYS = new Set([
  "subscaleProcessingId",
  "batchId",
  "batchType",
  "formStatus",
  "formId",
  "status",
]);

export const SUBSCALE_STRUCTURED_PAYLOAD_KEYS = [
  "hardwarePreparationDetails",
  "hardwarePreparationTable",
  "castingDetails",
  "curingDetails",
  "ndtDetails",
  "trimmingDetails",
  "inhibitionDetails",
  "staticTestingDetails",
  "mechanicalInterfaceProperties",
  "subscaleDetails",
] as const;

const SUBSCALE_DISPLAY_SECTION_GROUPS: Array<{ sectionId: string; keys: string[] }> = [
  { sectionId: "SUBSCALE_DETAILS", keys: ["subscaleDetails"] },
  {
    sectionId: "HARDWARE_PREPARATION_DETAILS",
    keys: ["hardwarePreparationDetails", "hardwarePreparationTable"],
  },
  { sectionId: "CASTING_DETAILS", keys: ["castingDetails"] },
  { sectionId: "CURING_DETAILS", keys: ["curingDetails"] },
  { sectionId: "NDT_DETAILS", keys: ["ndtDetails"] },
  { sectionId: "TRIMMING_DETAILS", keys: ["trimmingDetails"] },
  { sectionId: "INHIBITION_DETAILS", keys: ["inhibitionDetails"] },
  { sectionId: "STATIC_TESTING", keys: ["staticTestingDetails"] },
  { sectionId: "MECHANICAL_INTERFACE_PROPERTIES", keys: ["mechanicalInterfaceProperties"] },
];

export const normalizeSubscaleApiDetailsPayload = (
  payload: Record<string, unknown>,
): Record<string, unknown> => {
  const normalized = { ...payload };

  const mergeRecord = (source: Record<string, unknown>) => {
    Object.entries(source).forEach(([key, value]) => {
      if (SUBSCALE_SECTIONS_OBJECT_METADATA_KEYS.has(key)) return;
      if (value != null && normalized[key] == null) {
        normalized[key] = value;
      }
    });
  };

  const sections = payload.sections;
  if (sections && typeof sections === "object" && !Array.isArray(sections)) {
    mergeRecord(sections as Record<string, unknown>);
  }

  const nestedDetails = payload.details;
  if (nestedDetails && typeof nestedDetails === "object" && !Array.isArray(nestedDetails)) {
    mergeRecord(nestedDetails as Record<string, unknown>);
    const nestedSections = (nestedDetails as Record<string, unknown>).sections;
    if (nestedSections && typeof nestedSections === "object" && !Array.isArray(nestedSections)) {
      mergeRecord(nestedSections as Record<string, unknown>);
    }
  }

  return normalized;
};

export const hasSubscaleStructuredApiPayload = (payload: Record<string, unknown>): boolean =>
  SUBSCALE_STRUCTURED_PAYLOAD_KEYS.some((key) => payload[key] != null);

export const mapSubscaleFormValuesToApiPayload = (
  values: SchemaFormValues,
  batchType?: string | null,
): SubscaleApiPayloadBody => {
  const hardwarePreparationDetails = mapHardwarePreparationDetails(values);
  const hardwarePreparationTable = mapHardwarePreparationTable(values);

  const castingDate = formatToUiDate(
    String(getFieldValue(values, "CASTING_DETAILS", "DATE_OF_CASTING") ?? "").trim(),
  );
  const castingDetails = buildSectionTablePayload(
    values,
    "CASTING_DETAILS",
    "CASTING_TABLE",
    "castingTable",
    castingDate ? { dateOfCasting: castingDate } : undefined,
  ) as CastingDetailsDTO;

  const curingDetails = buildSectionTablePayload(
    values,
    "CURING_DETAILS",
    "CURING_TABLE",
    "curingTable",
  );
  const ndtDetails = buildSectionTablePayload(values, "NDT_DETAILS", "NDT_TABLE", "ndtTable");
  const trimmingDetails = buildSectionTablePayload(
    values,
    "TRIMMING_DETAILS",
    "TRIMMING_TABLE",
    "trimmingTable",
  );

  const inhibitionFields: Partial<InhibitionDetailsDTO> = {};
  const irBatchNo = String(
    getFieldValue(values, SUBSCALE_SCHEMA_SECTIONS.INHIBITION, INHIBITION_FIELD_IDS.IR_BATCH_NO) ??
      values.IR_BATCH_NO ??
      "",
  ).trim();
  if (irBatchNo) inhibitionFields.irBatchNo = irBatchNo;
  const dateOfMfg = formatToUiDate(
    String(
      getFieldValue(
        values,
        SUBSCALE_SCHEMA_SECTIONS.INHIBITION,
        INHIBITION_FIELD_IDS.DATE_OF_MANUFACTURING,
      ) ??
        values.DATE_OF_MANUFACTURING ??
        values.DATE_OF_MFG ??
        "",
    ).trim(),
  );
  if (dateOfMfg) inhibitionFields.dateOfManufacturing = dateOfMfg;
  const dateOfApplication = formatToUiDate(
    String(
      getFieldValue(
        values,
        SUBSCALE_SCHEMA_SECTIONS.INHIBITION,
        INHIBITION_FIELD_IDS.DATE_OF_APPLICATION,
      ) ??
        values.DATE_OF_APPLICATION ??
        "",
    ).trim(),
  );
  if (dateOfApplication) inhibitionFields.dateOfApplication = dateOfApplication;

  const inhibitionDetails = buildSectionTablePayload(
    values,
    SUBSCALE_SCHEMA_SECTIONS.INHIBITION,
    "INHIBITION_TABLE",
    "inhibitionTable",
    inhibitionFields,
  ) as InhibitionDetailsDTO;

  const isMainScale = mapSubscaleBatchType(batchType) === "MAIN_SCALE";

  // MAIN_SCALE does not collect BEM static/mechanical tables — send empty.
  const staticTestingDetails = isMainScale
    ? { staticTestingTable: [] }
    : buildSectionTablePayload(
        values,
        SUBSCALE_SCHEMA_SECTIONS.STATIC_TESTING,
        "STATIC_TESTING_TABLE",
        "staticTestingTable",
      );

  const mechanicalInterfaceProperties = isMainScale
    ? { mechanicalPropertiesTable: [] }
    : buildSectionTablePayload(
        values,
        "MECHANICAL_INTERFACE_PROPERTIES",
        "MECHANICAL_PROPERTIES_TABLE",
        "mechanicalPropertiesTable",
      );

  const payload: SubscaleApiPayloadBody = {
    ...(hardwarePreparationDetails ? { hardwarePreparationDetails } : {}),
    ...(hardwarePreparationTable.length > 0 ? { hardwarePreparationTable } : {}),
    castingDetails,
    curingDetails,
    ndtDetails,
    trimmingDetails,
    inhibitionDetails,
    staticTestingDetails,
    mechanicalInterfaceProperties,
  };

  if (mapSubscaleBatchType(batchType) === "SUBSCALE") {
    const subscaleDetails = mapSubscaleDetails(values);
    if (subscaleDetails) payload.subscaleDetails = subscaleDetails;
  }

  return payload;
};

const toScreamingSnake = (key: string) =>
  key
    .replace(/([A-Z])/g, "_$1")
    .replace(/^_/, "")
    .toUpperCase();

const API_TO_TABLE_FIELD: Record<string, string> = {
  graph: "GRAPH_FILE",
  graphDocumentId: "GRAPH_FILE",
  bemNo: "BEM_NO",
  bemMouldNo: "BEM_MOULD_NO",
  nvalue: "N_VALUE",
  nValue: "N_VALUE",
};

const ARTICLE_TYPE_FROM_API: Record<string, string> = {
  "BEM 40KG": "40 kg BEM",
  "BEM 10KG": "10 kg BEM",
  "BEM 2KG": "2 kg BEM",
  "40_KG_BEM": "40 kg BEM",
  "10_KG_BEM": "10 kg BEM",
  "2_KG_BEM": "2 kg BEM",
  WHEEL_PEEL: "Wheel Peel",
  "Wheel Peel": "Wheel Peel",
  SBS_TBS: "SBS/TBS",
  "SBS/TBS": "SBS/TBS",
  CARTOONS: "Cartoons",
  CARTONS: "Cartoons",
  Cartoons: "Cartoons",
};

const formatUiCellValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return value;
};

const mapApiTableRowToUi = (row: Record<string, unknown>, index: number) => {
  const mapped: Record<string, unknown> = { SR_NO: index + 1 };

  Object.entries(row).forEach(([key, value]) => {
    const uiKey = API_TO_TABLE_FIELD[key] ?? toScreamingSnake(key);
    if (uiKey === "ARTICLE_TYPE") {
      const raw = value == null ? "" : String(value);
      mapped[uiKey] = raw ? ARTICLE_TYPE_FROM_API[raw] ?? raw : "";
      return;
    }
    if (uiKey === "LINER_APPLIED") {
      if (typeof value === "boolean") {
        mapped[uiKey] = value ? "Yes" : "No";
        return;
      }
      mapped[uiKey] = value == null ? "" : formatUiCellValue(value);
      return;
    }
    if (uiKey === "GRAPH_FILE") {
      if (value == null || value === "") {
        mapped[uiKey] = "";
        return;
      }
      // Prefer graph file object; legacy graphDocumentId is a bare id string
      if (typeof value === "string") {
        const fileId = value.trim();
        mapped[uiKey] = fileId
          ? [
              {
                fileId,
                fileName: fileId,
                fileUrl: fileId,
                status: "uploaded",
                isTemp: false,
              },
            ]
          : "";
        return;
      }
      const refs = parseFileRefs(value);
      mapped[uiKey] = refs.length > 0 ? refs : "";
      return;
    }
    // Keep null/empty keys so details tables always render the full column set.
    mapped[uiKey] = value == null ? "" : formatUiCellValue(value);
  });

  return mapped;
};

const mapApiTableRowsToUi = (rows: unknown) => {
  if (!Array.isArray(rows)) return [];
  return rows.map((row, index) =>
    mapApiTableRowToUi((row ?? {}) as Record<string, unknown>, index),
  );
};

const setScopedTable = (
  values: SchemaFormValues,
  sectionId: string,
  tableId: string,
  rows: Record<string, unknown>[],
) => {
  if (rows.length === 0) return;
  values[scopedFormKey(sectionId, tableId)] = rows;
  // Hardware article panel reads unscoped table keys.
  values[tableId] = rows;
};

const setUnscopedField = (values: SchemaFormValues, fieldId: string, value: unknown) => {
  if (value == null || value === "") return;
  values[fieldId] = value;
};

export const mapSubscaleApiDetailsToFormValues = (
  payload: Record<string, unknown>,
): SchemaFormValues => {
  const normalized = normalizeSubscaleApiDetailsPayload(payload);
  const values: SchemaFormValues = {};
  const hardware = (normalized.hardwarePreparationDetails ?? {}) as Record<string, unknown>;

  Object.entries(HARDWARE_COUNT_TO_API).forEach(([uiKey, apiKey]) => {
    if (hardware[apiKey] !== undefined) values[uiKey] = String(hardware[apiKey]);
  });

  if (hardware.linerType != null) values[LINER_TYPE_FIELD.id] = String(hardware.linerType);
  if (hardware.linerBatchNo != null) {
    values[LINER_BATCH_NO_FIELD.id] = String(hardware.linerBatchNo);
  }
  if (hardware.linerBatchDate != null) {
    values[LINER_BATCH_DATE_FIELD.id] = String(hardware.linerBatchDate);
  }

  const hardwareRows = Array.isArray(normalized.hardwarePreparationTable)
    ? normalized.hardwarePreparationTable
    : [];
  if (hardwareRows.length > 0) {
    const typeCounters: Record<string, number> = {};
    values[ARTICLE_TYPE_TABLE_ID] = hardwareRows.map((row, index) => {
      const source = (row ?? {}) as Record<string, unknown>;
      const articleType =
        ARTICLE_TYPE_FROM_API[String(source.articleType ?? "")] ?? String(source.articleType ?? "");
      const countField = ARTICLE_TYPE_TO_COUNT_FIELD[articleType] ?? "";
      const articleIndex = countField ? (typeCounters[countField] ?? 0) : 0;
      if (countField) typeCounters[countField] = articleIndex + 1;

      return {
        SR_NO: index + 1,
        ARTICLE_TYPE: articleType,
        RUBBER_MATERIAL: String(source.rubberMaterial ?? ""),
        SLEEVE_NO: String(source.sleeveNo ?? ""),
        MOULD_NO: String(source.mouldNo ?? ""),
        SIZE_MM: source.lengthMm != null ? String(source.lengthMm) : "",
        THICKNESS_MM: source.thicknessMm != null ? String(source.thicknessMm) : "",
        LINER_APPLIED:
          source.linerApplied === true ? "Yes" : source.linerApplied === false ? "No" : "",
        OBSERVATIONS: String(source.observations ?? ""),
        ...(countField ? { _articleKey: countField, _articleIndex: articleIndex } : {}),
      };
    });
    bridgeHardwareArticleTableToSchemaScope(values);
  }

  const subscale = (normalized.subscaleDetails ?? {}) as SubscaleDetailsDTO;
  const subscaleLegacy = subscale as SubscaleDetailsDTO & Record<string, unknown>;
  if (subscale.batchSize != null)
    values[SUBSCALE_BATCH_FIELDS.BATCH_SIZE] = String(subscale.batchSize);
  const mixerBldg =
    subscale.bldgNo ??
    subscaleLegacy.mixerAndBuildingNo ??
    subscaleLegacy.mixerBldgNo ??
    subscaleLegacy.buildingNo;
  if (mixerBldg != null && String(mixerBldg).trim() !== "") {
    values[SUBSCALE_BATCH_FIELDS.MIXER_BLDG_NO] = String(mixerBldg);
  }
  if (subscale.mixerType != null) {
    values.mixerType = String(subscale.mixerType);
  }
  if (subscale.premixDate != null)
    values[SUBSCALE_BATCH_FIELDS.PREMIX_DATE] = String(subscale.premixDate);
  if (subscale.finalMixDate != null) {
    values[SUBSCALE_BATCH_FIELDS.FINAL_MIX_DATE] = String(subscale.finalMixDate);
  }

  const mixingCycleRaw = subscale.mixingCycle;
  if (mixingCycleRaw != null) {
    if (typeof mixingCycleRaw === "object" && !Array.isArray(mixingCycleRaw)) {
      const mc = mixingCycleRaw as Record<string, unknown>;
      const mapParticulars = (rows: unknown) =>
        Array.isArray(rows)
          ? rows.map((row) => {
              const item = (row ?? {}) as Record<string, unknown>;
              return {
                operationId: Number(item.operationId ?? 0) || 0,
                operation: String(item.operation ?? item.operationName ?? ""),
                rpm: String(item.rpm ?? ""),
                time: String(item.time ?? ""),
                temp: String(item.temp ?? ""),
                vacuum: String(item.vacuum ?? ""),
              };
            })
          : [];

      values[SUBSCALE_BATCH_FIELDS.MIXING_CYCLES] = normalizeSubscaleMixingCycles([
        {
          _key: "mixing-cycle-1",
          stage: String(mc.motorStage ?? ""),
          mixingCycleCode: String(mc.mixingCycleCode ?? ""),
          mixingCycleName: String(mc.mixingCycleName ?? ""),
          mixingCycleId:
            mc.mixingCycleId == null || mc.mixingCycleId === ""
              ? null
              : Number(mc.mixingCycleId),
          premixParticulars: mapParticulars(mc.premixParticulars),
          finalMixParticulars: mapParticulars(mc.finalMixParticulars),
        },
      ]);
    } else {
      // Legacy string mixingCycle (motor stage only)
      values[SUBSCALE_BATCH_FIELDS.MIXING_CYCLES] = normalizeSubscaleMixingCycles([
        {
          _key: "mixing-cycle-1",
          stage: String(mixingCycleRaw),
          mixingCycleCode: "",
          mixingCycleName: "",
          mixingCycleId: null,
          premixParticulars: [],
          finalMixParticulars: [],
        },
      ]);
    }
  }

  const casting = (normalized.castingDetails ?? {}) as Record<string, unknown>;
  if (casting.dateOfCasting != null) {
    const dateOfCasting = String(casting.dateOfCasting);
    values[scopedFormKey(SUBSCALE_SCHEMA_SECTIONS.CASTING, "DATE_OF_CASTING")] = dateOfCasting;
    setUnscopedField(values, "DATE_OF_CASTING", dateOfCasting);
  }
  setScopedTable(
    values,
    SUBSCALE_SCHEMA_SECTIONS.CASTING,
    "CASTING_TABLE",
    mapApiTableRowsToUi(casting.castingTable),
  );

  const curing = (normalized.curingDetails ?? {}) as Record<string, unknown>;
  setScopedTable(
    values,
    SUBSCALE_SCHEMA_SECTIONS.CURING,
    "CURING_TABLE",
    mapApiTableRowsToUi(curing.curingTable),
  );

  const ndt = (normalized.ndtDetails ?? {}) as Record<string, unknown>;
  setScopedTable(
    values,
    SUBSCALE_SCHEMA_SECTIONS.NDT,
    "NDT_TABLE",
    mapApiTableRowsToUi(ndt.ndtTable),
  );

  const trimming = (normalized.trimmingDetails ?? {}) as Record<string, unknown>;
  setScopedTable(
    values,
    SUBSCALE_SCHEMA_SECTIONS.TRIMMING,
    "TRIMMING_TABLE",
    mapApiTableRowsToUi(trimming.trimmingTable),
  );

  const inhibition = (normalized.inhibitionDetails ?? {}) as Record<string, unknown>;
  if (inhibition.irBatchNo != null) {
    const irBatchNo = String(inhibition.irBatchNo);
    values[scopedFormKey(SUBSCALE_SCHEMA_SECTIONS.INHIBITION, INHIBITION_FIELD_IDS.IR_BATCH_NO)] =
      irBatchNo;
    setUnscopedField(values, "IR_BATCH_NO", irBatchNo);
  }
  if (inhibition.dateOfManufacturing != null) {
    const dateOfMfg = String(inhibition.dateOfManufacturing);
    values[
      scopedFormKey(SUBSCALE_SCHEMA_SECTIONS.INHIBITION, INHIBITION_FIELD_IDS.DATE_OF_MANUFACTURING)
    ] = dateOfMfg;
    setUnscopedField(values, "DATE_OF_MFG", dateOfMfg);
    setUnscopedField(values, "DATE_OF_MANUFACTURING", dateOfMfg);
  }
  if (inhibition.dateOfApplication != null) {
    const dateOfApplication = String(inhibition.dateOfApplication);
    values[
      scopedFormKey(SUBSCALE_SCHEMA_SECTIONS.INHIBITION, INHIBITION_FIELD_IDS.DATE_OF_APPLICATION)
    ] = dateOfApplication;
    setUnscopedField(values, "DATE_OF_APPLICATION", dateOfApplication);
  }
  setScopedTable(
    values,
    SUBSCALE_SCHEMA_SECTIONS.INHIBITION,
    "INHIBITION_TABLE",
    mapApiTableRowsToUi(inhibition.inhibitionTable),
  );

  const staticTesting = (normalized.staticTestingDetails ?? {}) as Record<string, unknown>;
  setScopedTable(
    values,
    SUBSCALE_SCHEMA_SECTIONS.STATIC_TESTING,
    "STATIC_TESTING_TABLE",
    mapApiTableRowsToUi(staticTesting.staticTestingTable),
  );

  const mechanical = (normalized.mechanicalInterfaceProperties ?? {}) as Record<string, unknown>;
  setScopedTable(
    values,
    SUBSCALE_SCHEMA_SECTIONS.MECHANICAL,
    "MECHANICAL_PROPERTIES_TABLE",
    mapApiTableRowsToUi(mechanical.mechanicalPropertiesTable),
  );

  const hasProcessTables =
    (Array.isArray(values.CASTING_TABLE) && (values.CASTING_TABLE as unknown[]).length > 0) ||
    (Array.isArray(values[ARTICLE_TYPE_TABLE_ID]) &&
      (values[ARTICLE_TYPE_TABLE_ID] as unknown[]).length > 0);
  if (hasProcessTables) {
    values.IS_PROCESS_FORM_LOADED = true;
  }

  return values;
};

const HARDWARE_COUNT_FROM_API = Object.fromEntries(
  Object.entries(HARDWARE_COUNT_TO_API).map(([uiKey, apiKey]) => [apiKey, uiKey]),
);

const mapMixParticularsApiToDisplay = (rows: unknown) =>
  Array.isArray(rows)
    ? rows.map((row, index) => {
        const item = (row ?? {}) as Record<string, unknown>;
        return {
          SR_NO: index + 1,
          OPERATION: String(item.operation ?? item.operationName ?? ""),
          RPM: item.rpm == null ? "" : String(item.rpm),
          TIME: item.time == null ? "" : String(item.time),
          TEMP: item.temp == null ? "" : String(item.temp),
          VACUUM: item.vacuum == null ? "" : String(item.vacuum),
        };
      })
    : [];

const mapSubscaleDetailsApiToDisplayMerged = (
  details: SubscaleDetailsDTO | Record<string, unknown>,
): Record<string, unknown> => {
  const source = details as SubscaleDetailsDTO;
  const merged: Record<string, unknown> = {};

  if (source.batchSize != null) merged.BATCH_SIZE = String(source.batchSize);
  if (source.bldgNo) merged.MIXER_BLDG_NO = source.bldgNo;
  if (source.mixerType) merged.MIXER_TYPE = source.mixerType;
  if (source.premixDate) merged.PREMIX_DATE = source.premixDate;
  if (source.finalMixDate) merged.FINAL_MIX_DATE = source.finalMixDate;

  const mixingCycle = source.mixingCycle;
  if (mixingCycle) {
    merged.SUBSCALE_MIXING_CYCLES = [
      {
        MOTOR_STAGE: mixingCycle.motorStage != null ? String(mixingCycle.motorStage) : "",
        MIXING_CYCLE_CODE: mixingCycle.mixingCycleCode ?? "",
        MIXING_CYCLE_NAME: mixingCycle.mixingCycleName ?? "",
        MIXING_CYCLE_ID: mixingCycle.mixingCycleId ?? "",
        PREMIX_PARTICULARS: mapMixParticularsApiToDisplay(mixingCycle.premixParticulars),
        FINAL_MIX_PARTICULARS: mapMixParticularsApiToDisplay(mixingCycle.finalMixParticulars),
      },
    ];
  }

  return merged;
};

const mapHardwareDetailsApiToDisplayMerged = (
  details: HardwarePreparationDetailsDTO | Record<string, unknown>,
): Record<string, unknown> => {
  const source = details as HardwarePreparationDetailsDTO;
  const merged: Record<string, unknown> = {};

  Object.entries(HARDWARE_COUNT_FROM_API).forEach(([apiKey, uiKey]) => {
    const value = (source as Record<string, unknown>)[apiKey];
    if (value != null) merged[uiKey] = String(value);
  });

  if (source.linerType) merged[LINER_TYPE_FIELD.id] = source.linerType;
  if (source.linerBatchNo) merged[LINER_BATCH_NO_FIELD.id] = source.linerBatchNo;
  if (source.linerBatchDate) merged[LINER_BATCH_DATE_FIELD.id] = source.linerBatchDate;

  return merged;
};

const mapHardwareTableApiToDisplay = (rows: unknown): Record<string, unknown>[] => {
  if (!Array.isArray(rows)) return [];
  const typeCounters: Record<string, number> = {};

  return rows.map((row, index) => {
    const source = (row ?? {}) as HardwarePreparationTableDTO;
    const articleType =
      ARTICLE_TYPE_FROM_API[String(source.articleType ?? "")] ?? String(source.articleType ?? "");
    const countField = ARTICLE_TYPE_TO_COUNT_FIELD[articleType] ?? "";
    const articleIndex = countField ? (typeCounters[countField] ?? 0) : 0;
    if (countField) typeCounters[countField] = articleIndex + 1;

    return {
      SR_NO: index + 1,
      ARTICLE_TYPE: articleType,
      RUBBER_MATERIAL: source.rubberMaterial ?? "",
      SLEEVE_NO: source.sleeveNo ?? "",
      MOULD_NO: source.mouldNo ?? "",
      SIZE_MM: source.lengthMm != null ? String(source.lengthMm) : "",
      THICKNESS_MM: source.thicknessMm != null ? String(source.thicknessMm) : "",
      LINER_APPLIED:
        source.linerApplied === true ? "Yes" : source.linerApplied === false ? "No" : "",
      OBSERVATIONS: source.observations ?? "",
      ...(countField ? { _articleKey: countField, _articleIndex: articleIndex } : {}),
    };
  });
};

const mapProcessSectionApiToDisplayMerged = (
  section: Record<string, unknown>,
  tableApiKey: string,
  tableUiKey: string,
  scalarFields: Array<{ apiKey: string; uiKey: string }> = [],
): Record<string, unknown> => {
  const merged: Record<string, unknown> = {};

  scalarFields.forEach(({ apiKey, uiKey }) => {
    const value = section[apiKey];
    if (value != null && value !== "") merged[uiKey] = value;
  });

  const tableRows = mapApiTableRowsToUi(section[tableApiKey]);
  if (tableRows.length > 0) merged[tableUiKey] = tableRows;

  return merged;
};

export const parseSubscaleDetailsApiResponse = (data: unknown): SubscaleDetailsResponse => {
  const raw = ((data as { data?: Record<string, unknown> })?.data ??
    data ??
    {}) as Record<string, unknown>;
  const payload = normalizeSubscaleApiDetailsPayload(raw);

  return {
    subscaleProcessingId: String(payload.subscaleProcessingId ?? payload.formId ?? ""),
    formId: String(payload.formId ?? payload.subscaleProcessingId ?? ""),
    batchId: String(payload.batchId ?? ""),
    batchType: String(payload.batchType ?? ""),
    status: payload.status != null ? String(payload.status) : undefined,
    createdBy: (payload.createdBy as SubscaleDetailsResponse["createdBy"]) ?? null,
    createdAt: payload.createdAt != null ? String(payload.createdAt) : null,
    submittedBy: (payload.submittedBy as SubscaleDetailsResponse["submittedBy"]) ?? null,
    submittedAt: payload.submittedAt != null ? String(payload.submittedAt) : null,
    lastUpdatedBy: (payload.lastUpdatedBy as SubscaleDetailsResponse["lastUpdatedBy"]) ?? null,
    lastUpdatedAt: payload.lastUpdatedAt != null ? String(payload.lastUpdatedAt) : null,
    subDepartmentId:
      payload.subDepartmentId != null ? Number(payload.subDepartmentId) : undefined,
    formSubmissionType:
      payload.formSubmissionType != null ? String(payload.formSubmissionType) : undefined,
    subscaleDetails: payload.subscaleDetails as SubscaleDetailsDTO | undefined,
    hardwarePreparationDetails: payload.hardwarePreparationDetails as
      | HardwarePreparationDetailsDTO
      | undefined,
    hardwarePreparationTable: payload.hardwarePreparationTable as
      | HardwarePreparationTableDTO[]
      | undefined,
    castingDetails: payload.castingDetails as CastingDetailsDTO | undefined,
    curingDetails: payload.curingDetails as CuringDetailsDTO | undefined,
    ndtDetails: payload.ndtDetails as NdtDetailsDTO | undefined,
    trimmingDetails: payload.trimmingDetails as TrimmingDetailsDTO | undefined,
    inhibitionDetails: payload.inhibitionDetails as InhibitionDetailsDTO | undefined,
    staticTestingDetails: payload.staticTestingDetails as StaticTestingDetailsDTO | undefined,
    mechanicalInterfaceProperties: payload.mechanicalInterfaceProperties as
      | MechanicalInterfacePropertiesDTO
      | undefined,
    sections: resolveSubscaleApiSectionsForDisplay(raw.sections, raw),
  };
};

const rebuildSubscaleSectionsRecord = (
  payload: Record<string, unknown>,
): Record<string, unknown> => {
  const record: Record<string, unknown> = {};
  SUBSCALE_DISPLAY_SECTION_GROUPS.forEach(({ keys }) => {
    keys.forEach((key) => {
      const value = payload[key];
      if (value != null) record[key] = value;
    });
  });
  return record;
};

const mergeSubscaleApiSectionRecord = (
  record: Record<string, unknown>,
  keys: string[],
  merged: Record<string, unknown>,
) => {
  keys.forEach((key) => {
    const value = record[key];
    if (value == null) return;

    if (key === "subscaleDetails") {
      Object.assign(merged, mapSubscaleDetailsApiToDisplayMerged(value as SubscaleDetailsDTO));
      return;
    }

    if (key === "hardwarePreparationDetails") {
      Object.assign(
        merged,
        mapHardwareDetailsApiToDisplayMerged(value as HardwarePreparationDetailsDTO),
      );
      return;
    }

    if (key === "hardwarePreparationTable") {
      const rows = mapHardwareTableApiToDisplay(value);
      if (rows.length > 0) merged[ARTICLE_TYPE_TABLE_ID] = rows;
      return;
    }

    if (key === "castingDetails") {
      Object.assign(
        merged,
        mapProcessSectionApiToDisplayMerged(value as Record<string, unknown>, "castingTable", "CASTING_TABLE", [
          { apiKey: "dateOfCasting", uiKey: "DATE_OF_CASTING" },
        ]),
      );
      return;
    }

    if (key === "curingDetails") {
      Object.assign(
        merged,
        mapProcessSectionApiToDisplayMerged(value as Record<string, unknown>, "curingTable", "CURING_TABLE"),
      );
      return;
    }

    if (key === "ndtDetails") {
      Object.assign(
        merged,
        mapProcessSectionApiToDisplayMerged(value as Record<string, unknown>, "ndtTable", "NDT_TABLE"),
      );
      return;
    }

    if (key === "trimmingDetails") {
      Object.assign(
        merged,
        mapProcessSectionApiToDisplayMerged(
          value as Record<string, unknown>,
          "trimmingTable",
          "TRIMMING_TABLE",
        ),
      );
      return;
    }

    if (key === "inhibitionDetails") {
      const source = value as InhibitionDetailsDTO;
      if (source.irBatchNo) merged.IR_BATCH_NO = source.irBatchNo;
      if (source.dateOfManufacturing) merged.DATE_OF_MANUFACTURING = source.dateOfManufacturing;
      if (source.dateOfApplication) merged.DATE_OF_APPLICATION = source.dateOfApplication;
      const rows = mapApiTableRowsToUi(source.inhibitionTable);
      if (rows.length > 0) merged.INHIBITION_TABLE = rows;
      return;
    }

    if (key === "staticTestingDetails") {
      Object.assign(
        merged,
        mapProcessSectionApiToDisplayMerged(
          value as Record<string, unknown>,
          "staticTestingTable",
          "STATIC_TESTING_TABLE",
        ),
      );
      return;
    }

    if (key === "mechanicalInterfaceProperties") {
      Object.assign(
        merged,
        mapProcessSectionApiToDisplayMerged(
          value as Record<string, unknown>,
          "mechanicalPropertiesTable",
          "MECHANICAL_PROPERTIES_TABLE",
        ),
      );
      return;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      Object.assign(merged, value as Record<string, unknown>);
    } else {
      merged[key] = value;
    }
  });
};

const mergeSubscaleDisplayValues = (
  sectionId: string,
  values: SchemaFormValues,
  merged: Record<string, unknown>,
) => {
  if (sectionId === "SUBSCALE_DETAILS") {
    if (values[SUBSCALE_BATCH_FIELDS.BATCH_SIZE] != null) {
      merged.BATCH_SIZE = values[SUBSCALE_BATCH_FIELDS.BATCH_SIZE];
    }
    if (values[SUBSCALE_BATCH_FIELDS.MIXER_BLDG_NO] != null) {
      merged.MIXER_BLDG_NO = values[SUBSCALE_BATCH_FIELDS.MIXER_BLDG_NO];
    }
    if (values.mixerType != null) merged.MIXER_TYPE = values.mixerType;
    if (values[SUBSCALE_BATCH_FIELDS.PREMIX_DATE] != null) {
      merged.PREMIX_DATE = values[SUBSCALE_BATCH_FIELDS.PREMIX_DATE];
    }
    if (values[SUBSCALE_BATCH_FIELDS.FINAL_MIX_DATE] != null) {
      merged.FINAL_MIX_DATE = values[SUBSCALE_BATCH_FIELDS.FINAL_MIX_DATE];
    }

    const cycles = normalizeSubscaleMixingCycles(values[SUBSCALE_BATCH_FIELDS.MIXING_CYCLES]);
    if (cycles.length > 0) {
      merged.SUBSCALE_MIXING_CYCLES = cycles.map((cycle) => ({
        MOTOR_STAGE: cycle.stage || "",
        MIXING_CYCLE_CODE: cycle.mixingCycleCode || "",
        MIXING_CYCLE_NAME: cycle.mixingCycleName || "",
        MIXING_CYCLE_ID: cycle.mixingCycleId ?? "",
        PREMIX_PARTICULARS: (cycle.premixParticulars?.length
          ? cycle.premixParticulars
          : cycle.processParticulars || []
        ).map((row, index) => ({
          SR_NO: index + 1,
          OPERATION: row.operation || "",
          RPM: row.rpm || "",
          TIME: row.time || "",
          TEMP: row.temp || "",
          VACUUM: row.vacuum || "",
        })),
        FINAL_MIX_PARTICULARS: (cycle.finalMixParticulars || []).map((row, index) => ({
          SR_NO: index + 1,
          OPERATION: row.operation || "",
          RPM: row.rpm || "",
          TIME: row.time || "",
          TEMP: row.temp || "",
          VACUUM: row.vacuum || "",
        })),
      }));
    }
    return;
  }

  if (sectionId === "HARDWARE_PREPARATION_DETAILS") {
    HARDWARE_COUNT_FIELDS.forEach((field) => {
      if (values[field.id] != null && values[field.id] !== "") {
        merged[field.id] = values[field.id];
      }
    });
    if (values[LINER_TYPE_FIELD.id] != null && values[LINER_TYPE_FIELD.id] !== "") {
      merged[LINER_TYPE_FIELD.id] = values[LINER_TYPE_FIELD.id];
    }
    if (values[LINER_BATCH_NO_FIELD.id] != null && values[LINER_BATCH_NO_FIELD.id] !== "") {
      merged[LINER_BATCH_NO_FIELD.id] = values[LINER_BATCH_NO_FIELD.id];
    }
    if (values[LINER_BATCH_DATE_FIELD.id] != null && values[LINER_BATCH_DATE_FIELD.id] !== "") {
      merged[LINER_BATCH_DATE_FIELD.id] = values[LINER_BATCH_DATE_FIELD.id];
    }
    if (values[ARTICLE_TYPE_TABLE_ID] != null) {
      merged[ARTICLE_TYPE_TABLE_ID] = values[ARTICLE_TYPE_TABLE_ID];
    }
    return;
  }

  const tableIdBySection: Record<string, string> = {
    CASTING_DETAILS: "CASTING_TABLE",
    CURING_DETAILS: "CURING_TABLE",
    NDT_DETAILS: "NDT_TABLE",
    TRIMMING_DETAILS: "TRIMMING_TABLE",
    INHIBITION_DETAILS: "INHIBITION_TABLE",
    STATIC_TESTING: "STATIC_TESTING_TABLE",
    MECHANICAL_INTERFACE_PROPERTIES: "MECHANICAL_PROPERTIES_TABLE",
  };
  const tableId = tableIdBySection[sectionId];
  if (tableId) {
    const scopedKey = scopedFormKey(sectionId, tableId);
    const rows = values[scopedKey] ?? values[tableId];
    if (rows != null) merged[tableId] = rows;
  }
  Object.keys(values).forEach((key) => {
    if (!key.startsWith(`${sectionId}::`)) return;
    const fieldId = key.split("::")[1];
    if (fieldId && fieldId !== tableId) merged[fieldId] = values[key];
  });
  // Unscoped scalar fallbacks used by the hardware article panel.
  if (sectionId === "CASTING_DETAILS" && values.DATE_OF_CASTING != null) {
    merged.DATE_OF_CASTING = values.DATE_OF_CASTING;
  }
  if (sectionId === "INHIBITION_DETAILS") {
    if (values.IR_BATCH_NO != null) merged.IR_BATCH_NO = values.IR_BATCH_NO;
    if (values.DATE_OF_MFG != null) merged.DATE_OF_MANUFACTURING = values.DATE_OF_MFG;
    if (values.DATE_OF_MANUFACTURING != null) {
      merged.DATE_OF_MANUFACTURING = values.DATE_OF_MANUFACTURING;
    }
    if (values.DATE_OF_APPLICATION != null) {
      merged.DATE_OF_APPLICATION = values.DATE_OF_APPLICATION;
    }
  }
};

export const resolveSubscaleApiSectionsForDisplay = (
  sections: unknown,
  payload?: Record<string, unknown>,
): SchemaSectionSubmission[] => {
  if (Array.isArray(sections) && !payload) {
    return sections as SchemaSectionSubmission[];
  }

  const normalized = payload ? normalizeSubscaleApiDetailsPayload(payload) : null;
  const values = normalized ? mapSubscaleApiDetailsToFormValues(normalized) : null;

  let sectionRecord: Record<string, unknown> | null = null;
  if (sections && typeof sections === "object" && !Array.isArray(sections)) {
    sectionRecord = sections as Record<string, unknown>;
  } else if (normalized) {
    sectionRecord = rebuildSubscaleSectionsRecord(normalized);
  }

  if (!sectionRecord) {
    if (Array.isArray(sections)) return sections as SchemaSectionSubmission[];
    return [];
  }

  return SUBSCALE_DISPLAY_SECTION_GROUPS.flatMap(({ sectionId, keys }) => {
    const merged: Record<string, unknown> = {};

    if (values) {
      mergeSubscaleDisplayValues(sectionId, values, merged);
    } else {
      mergeSubscaleApiSectionRecord(sectionRecord!, keys, merged);
    }

    if (Object.keys(merged).length === 0) return [];
    return [{ sectionId, sectionData: [merged] }];
  });
};
