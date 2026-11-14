import {
  scopedFormKey,
  syncRowGenerationTables,
  SchemaDocumentV2,
  SchemaFormValues,
  SchemaSectionSubmission,
} from "@/data/models/shared/sectionFormTypes";
import { mapSubscaleBatchType } from "@/data/models/user/subscaleBatchType";
import {
  ARTICLE_TYPE_TABLE_ID,
  HARDWARE_ARTICLE_SELECTIONS_ID,
  HARDWARE_COUNT_FIELDS,
  HARDWARE_SECTION_ID,
  LINER_TYPE_FIELD,
  LINER_BATCH_NO_FIELD,
  LINER_BATCH_DATE_FIELD,
  getHardwareArticleSelections,
  synthesizeSelectionsFromLegacyCounts,
  type ArticleTypeRow,
  type HardwareArticleSelection,
} from "../../../hooks/user/manufacturing/subscaleHardwareConfig";
import {
  SUBSCALE_BATCH_FIELDS,
  normalizeSubscaleMixingCycles,
} from "../../../hooks/user/manufacturing/subscaleBatchConfig";
import { formatToUiDate } from "../../../utils/dateUtils";
import { toApiDate, toApiDateTime, toUiDate, toUiDateTime } from "./castingCuringFieldCodec";
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

/** Mirrors backend `HardwareArticleSelectionDTO` */
export type HardwareArticleSelectionDTO = {
  subscaleArticleId?: number;
  subscaleArticleCode?: string;
  subscaleArticleName?: string;
  noOfArticles?: number;
  noOfParts?: number;
  isBem?: boolean;
};

/** Mirrors backend `HardwarePreparationDetailsDTO` */
export type HardwarePreparationDetailsDTO = {
  numberOf40KgBems?: number;
  numberOf10KgBems?: number;
  numberOf2KgBems?: number;
  numberOfWheelPeels?: number;
  numberOfCartoons?: number;
  numberOfSbsTbs?: number;
  articles?: HardwareArticleSelectionDTO[];
  linerType?: string;
  linerBatchNo?: string;
  /** LocalDate wire value; property name remains unchanged for compatibility. */
  linerBatchDate?: string;
};

/** Mirrors backend `HardwarePreparationTableDTO` */
export type HardwarePreparationTableDTO = {
  articleType?: string;
  rubberMaterial?: string;
  sleeveNo?: string;
  mouldNo?: string;
  lengthMm?: string;
  thicknessMm?: string;
  linerApplied?: boolean;
  observations?: string;
};

/** Mirrors backend `CastingTableDTO` */
export type CastingTableDTO = {
  articleType?: string;
  bemNo?: string;
  bemMouldNo?: string;
  castingPitNo?: string;
  castingStartDateTime?: string;
  castingEndDateTime?: string;
  castingStartTime?: string;
  castingEndTime?: string;
  vacuumLevel?: string;
  remarks?: string;
};

/** Mirrors backend `CastingDetailsDTO` */
export type CastingDetailsDTO = {
  dateTimeOfCasting?: string;
  dateOfCastingDateTime?: string;
  /** Legacy JSON property. */
  dateOfCasting?: string;
  castingTable?: CastingTableDTO[];
};

/** Mirrors backend `CuringTableDTO` */
export type CuringTableDTO = {
  articleType?: string;
  /** Article No / BEM No (legacy key: bemMouldNo). */
  bemNo?: string;
  bemMouldNo?: string;
  curingStartDateTime?: string;
  curingEndDateTime?: string;
  curingStartDate?: string;
  curingEndDate?: string;
  ovenNo?: string;
  temperature?: string;
  hardness?: string;
  decoringDateTime?: string;
  decoringDate?: string;
  decoringLoad?: string;
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
  dateTimeOfNdt?: string;
  dateOfNdtDateTime?: string;
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
  heOd?: string;
  hePortInner?: string;
  hePortOuter?: string;
  heBeforeInhibitionInner?: string;
  heBeforeInhibitionOuter?: string;
  neOd?: string;
  nePortInner?: string;
  nePortOuter?: string;
  neWebInner?: string;
  neWebOuter?: string;
  lengthBeforeInhibition?: string;
};

/** Mirrors backend `TrimmingDetailsDTO` */
export type TrimmingDetailsDTO = {
  trimmingTable?: TrimmingTableDTO[];
};

/** Mirrors backend `InhibitionTableDTO` */
export type InhibitionTableDTO = {
  articleType?: string;
  bemNo?: string;
  linerCoatedSleeveWeight?: string;
  weightBeforeInhibition?: string;
  weightAfterInhibition?: string;
  irAppliedWeight?: string;
  dateTimeOfApplication?: string;
  dateOfApplicationDateTime?: string;
  dateOfApplication?: string;
  remarks?: string;
};

/** Mirrors backend `InhibitionDetailsDTO` */
export type InhibitionDetailsDTO = {
  irBatchNo?: string;
  dateTimeOfManufacturing?: string;
  dateTimeOfApplication?: string;
  dateOfManufacturingDateTime?: string;
  dateOfApplicationDateTime?: string;
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
  BEM_NO: "bemNo",
  BEM_MOULD_NO: "bemMouldNo",
  CASTING_START_TIME: "castingStartDateTime",
  CASTING_END_TIME: "castingEndDateTime",
  CURING_START_DATE: "curingStartDateTime",
  CURING_END_DATE: "curingEndDateTime",
  DECORING_DATE: "decoringDateTime",
  DATE_OF_NDT: "dateTimeOfNdt",
  DATE_OF_APPLICATION: "dateTimeOfApplication",
};

const DATETIME_TABLE_FIELDS = new Set([
  "CASTING_START_TIME",
  "CASTING_END_TIME",
  "CURING_START_DATE",
  "CURING_END_DATE",
  "DECORING_DATE",
  "DATE_OF_NDT",
  "DATE_OF_APPLICATION",
]);

const mapGraphFileToApi = (value: unknown): SubscaleGraphFileDTO | undefined => {
  const refs = parseFileRefs(value);
  const ref: FileRef | undefined = refs.find((item) => String(item.fileId ?? "").trim()) ?? refs[0];
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

  const fileName = String(ref.originalFileName ?? ref.fileName ?? "").trim() || fileId;
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

/** Map article master names / API codes → legacy preparation count field ids. */
const resolveHardwareCountFieldFromArticleName = (articleName: string): string | null => {
  const raw = String(articleName ?? "").trim();
  if (!raw) return null;
  if (ARTICLE_TYPE_TO_COUNT_FIELD[raw]) return ARTICLE_TYPE_TO_COUNT_FIELD[raw];

  const normalized = raw.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (ARTICLE_TYPE_TO_COUNT_FIELD[normalized]) return ARTICLE_TYPE_TO_COUNT_FIELD[normalized];

  if (/(?:^|\s)40\s*kg/.test(normalized) && normalized.includes("bem")) return "NO_OF_40KG_BEMS";
  if (/(?:^|\s)10\s*kg/.test(normalized) && normalized.includes("bem")) return "NO_OF_10KG_BEMS";
  if (/(?:^|\s)2\s*kg/.test(normalized) && normalized.includes("bem")) return "NO_OF_2KG_BEMS";
  if (normalized.includes("bem") && normalized.includes("40")) return "NO_OF_40KG_BEMS";
  if (normalized.includes("bem") && normalized.includes("10")) return "NO_OF_10KG_BEMS";
  if (normalized.includes("bem") && /(?:^|\s)2(?:\s|$)/.test(normalized.replace("kg", " "))) {
    return "NO_OF_2KG_BEMS";
  }
  if (normalized.includes("wheel") && normalized.includes("peel")) return "NO_OF_WHEEL_PEEL";
  if (normalized.includes("sbs") || normalized.includes("tbs")) return "NO_OF_SBS_TBS";
  if (normalized.includes("cartoon") || normalized.includes("carton")) return "NO_OF_CARTOONS";
  return null;
};

const RUNTIME_ROW_KEYS = new Set(["SR_NO", "srNo"]);

/** UI-only table columns not sent to the API */
// const TABLE_ROW_EXCLUDED_KEYS = new Set(["PROPELLANT_WEIGHT"]);

/**
 * Propellant Wt (C−B−A): C=Wt After Inhib, B=Wt Before Inhib, A=Liner Coated Sleeve Wt.
 * Returns "" when any input is blank or non-numeric.
 */
export const recomputeInhibitionPropellantWeight = (
  row: Record<string, unknown> | null | undefined,
): string | number => {
  if (!row) return "";
  const parse = (value: unknown): number => {
    const text = String(value ?? "").trim();
    if (!text) return Number.NaN;
    return Number(text);
  };
  const a = parse(row.LINER_COATED_SLEEVE_WEIGHT);
  const b = parse(row.WEIGHT_BEFORE_INHIBITION);
  const c = parse(row.WEIGHT_AFTER_INHIBITION);
  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) return "";
  return c - b - a;
};

const enrichInhibitionUiRows = (
  rows: Record<string, unknown>[],
  sectionDateOfApplication?: string | null,
): Record<string, unknown>[] => {
  const sectionDate = String(sectionDateOfApplication ?? "").trim();
  return rows.map((row) => {
    const next = { ...row };
    const rowDate = String(next.DATE_OF_APPLICATION ?? "").trim();
    if (!rowDate && sectionDate) {
      next.DATE_OF_APPLICATION = sectionDate;
    }
    const calculatedWeight = recomputeInhibitionPropellantWeight(next);
    if (calculatedWeight !== "") {
      next.PROPELLANT_WEIGHT = calculatedWeight;
    } else if (next.PROPELLANT_WEIGHT == null) {
      next.PROPELLANT_WEIGHT = "";
    }
    return next;
  });
};

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

/** Subscale measure fields that accept alphanumeric / special text (not parseNumber). */
const ALPHANUMERIC_MEASURE_KEYS = new Set([
  "THICKNESS_MM",
  "VACUUM_LEVEL",
  "TEMPERATURE",
  "HARDNESS",
  "DECORING_LOAD",
  "HE_OD",
  "HE_PORT_INNER",
  "HE_PORT_OUTER",
  "HE_BEFORE_INHIBITION_INNER",
  "HE_BEFORE_INHIBITION_OUTER",
  "NE_OD",
  "NE_PORT_INNER",
  "NE_PORT_OUTER",
  "NE_WEB_INNER",
  "NE_WEB_OUTER",
  "LENGTH_BEFORE_INHIBITION",
  "LINER_COATED_SLEEVE_WEIGHT",
  "WEIGHT_BEFORE_INHIBITION",
  "WEIGHT_AFTER_INHIBITION",
  "IR_APPLIED_WEIGHT",
]);

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
    if (isRuntimeRowKey(key)) return;
    if (value === null || value === undefined || value === "") return;

    if (key === "ARTICLE_TYPE") {
      const raw = String(value).trim();
      mapped.articleType = ARTICLE_TYPE_TO_API[raw] ?? raw.replace(/\s+/g, " ").trim();
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

    if (DATETIME_TABLE_FIELDS.has(key) && typeof value === "string") {
      const formatted = toApiDateTime(value);
      if (formatted) mapped[apiKey] = formatted;
      return;
    }

    // Date-only columns → DD-MM-YYYY for API
    if (/DATE/i.test(key) && typeof value === "string") {
      const formatted = formatToUiDate(value);
      if (formatted) mapped[apiKey] = formatted;
      return;
    }

    if (ALPHANUMERIC_MEASURE_KEYS.has(key)) {
      const text = String(value).trim();
      if (text) mapped[apiKey] = text;
      return;
    }

    const numeric =
      /_(MM|LEVEL|LOAD|MASS|OD|INNER|OUTER|WEIGHT|STRENGTH|RATE|VALUE|AVG|THK)$/i.test(key) ||
      [
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
        "PROPELLANT_WEIGHT",
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

  const selections = getHardwareArticleSelections(values);
  if (selections.length > 0) {
    details.articles = selections.map((row) => ({
      subscaleArticleId: row.subscaleArticleId,
      subscaleArticleCode: row.subscaleArticleCode,
      subscaleArticleName: row.subscaleArticleName,
      noOfArticles: row.noOfArticles,
      noOfParts: row.isBem === true ? row.noOfParts : 0,
      isBem: row.isBem === true,
    }));
  } else {
    // Legacy count fields for older in-progress drafts only
    HARDWARE_COUNT_FIELDS.forEach((field) => {
      const apiKey = HARDWARE_COUNT_TO_API[field.id] as keyof HardwarePreparationDetailsDTO;
      const num = parseNumber(values[field.id]);
      if (apiKey && num !== undefined) (details as Record<string, unknown>)[apiKey] = num;
    });
  }

  const linerType = String(values[LINER_TYPE_FIELD.id] ?? "").trim();
  if (linerType) details.linerType = linerType;

  const linerBatchNo = String(values[LINER_BATCH_NO_FIELD.id] ?? "").trim();
  if (linerBatchNo) details.linerBatchNo = linerBatchNo;

  const linerBatchDate = toApiDate(String(values[LINER_BATCH_DATE_FIELD.id] ?? "").trim());
  if (linerBatchDate) details.linerBatchDate = linerBatchDate;

  return Object.keys(details).length > 0 ? details : undefined;
};

const mapApiArticlesToSelections = (articles: unknown): HardwareArticleSelection[] => {
  if (!Array.isArray(articles)) return [];
  return articles
    .map((item) => {
      const row = (item ?? {}) as HardwareArticleSelectionDTO;
      const isBem = row.isBem === true;
      return {
        subscaleArticleId: Number(row.subscaleArticleId ?? 0),
        subscaleArticleCode: String(row.subscaleArticleCode ?? "").trim(),
        subscaleArticleName: String(row.subscaleArticleName ?? "").trim(),
        noOfArticles: Number(row.noOfArticles ?? 0) || 0,
        noOfParts: isBem ? Number(row.noOfParts ?? 0) || 0 : 0,
        isBem,
      };
    })
    .filter((row) => row.subscaleArticleName && row.noOfArticles > 0);
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

      const thicknessMm = String(row.THICKNESS_MM ?? "").trim();
      if (thicknessMm) mapped.thicknessMm = thicknessMm;

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

  const premixDate = toApiDate(String(values[SUBSCALE_BATCH_FIELDS.PREMIX_DATE] ?? "").trim());
  if (premixDate) payload.premixDate = premixDate;

  const finalMixDate = toApiDate(
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

  const castingDate = toApiDateTime(
    String(getFieldValue(values, "CASTING_DETAILS", "DATE_OF_CASTING") ?? "").trim(),
  );
  const castingDetails = buildSectionTablePayload(
    values,
    "CASTING_DETAILS",
    "CASTING_TABLE",
    "castingTable",
    castingDate ? { dateTimeOfCasting: castingDate } : undefined,
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
  const dateOfApplicationFromRows = getTableRows(
    values,
    SUBSCALE_SCHEMA_SECTIONS.INHIBITION,
    "INHIBITION_TABLE",
  ).find((row) => String(row.DATE_OF_APPLICATION ?? "").trim())?.DATE_OF_APPLICATION;
  const irBatchNo = String(
    getFieldValue(values, SUBSCALE_SCHEMA_SECTIONS.INHIBITION, INHIBITION_FIELD_IDS.IR_BATCH_NO) ??
      values.IR_BATCH_NO ??
      "",
  ).trim();
  if (irBatchNo) inhibitionFields.irBatchNo = irBatchNo;
  const dateOfMfg = toApiDateTime(
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
  if (dateOfMfg) inhibitionFields.dateTimeOfManufacturing = dateOfMfg;
  let dateOfApplication = toApiDateTime(
    String(
      dateOfApplicationFromRows ??
        getFieldValue(
          values,
          SUBSCALE_SCHEMA_SECTIONS.INHIBITION,
          INHIBITION_FIELD_IDS.DATE_OF_APPLICATION,
        ) ??
        values.DATE_OF_APPLICATION ??
        "",
    ).trim(),
  );
  // Prefer first non-empty per-row date when section scalar was never written by the UI.
  if (!dateOfApplication) {
    const inhibitionRows = getTableRows(
      values,
      SUBSCALE_SCHEMA_SECTIONS.INHIBITION,
      "INHIBITION_TABLE",
    );
    for (const row of inhibitionRows) {
      const rowDate = toApiDateTime(String(row.DATE_OF_APPLICATION ?? "").trim());
      if (rowDate) {
        dateOfApplication = rowDate;
        break;
      }
    }
  }
  if (dateOfApplication) inhibitionFields.dateTimeOfApplication = dateOfApplication;

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
  castingStartDateTime: "CASTING_START_TIME",
  castingEndDateTime: "CASTING_END_TIME",
  curingStartDateTime: "CURING_START_DATE",
  curingEndDateTime: "CURING_END_DATE",
  decoringDateTime: "DECORING_DATE",
  dateTimeOfNdt: "DATE_OF_NDT",
  dateOfNdtDateTime: "DATE_OF_NDT",
  dateTimeOfApplication: "DATE_OF_APPLICATION",
  dateOfApplicationDateTime: "DATE_OF_APPLICATION",
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
      mapped[uiKey] = raw ? (ARTICLE_TYPE_FROM_API[raw] ?? raw) : "";
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
    // DateTimeField and the details table both consume the UI-local datetime shape.
    // The API may return either ISO timestamps or `DD-MM-YYYY HH:mm:ss`; normalize
    // them here so hydration and read-only details use the same representation.
    if (DATETIME_TABLE_FIELDS.has(uiKey)) {
      mapped[uiKey] = value == null || value === "" ? "" : toUiDateTime(value);
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

const mapInhibitionRowsToUi = (inhibition: Record<string, unknown>) => {
  const rows = mapApiTableRowsToUi(inhibition.inhibitionTable);
  const dateOfApplication =
    inhibition.dateTimeOfApplication ??
    inhibition.dateOfApplicationDateTime ??
    inhibition.dateOfApplication;
  const sectionDate = dateOfApplication ? toUiDateTime(dateOfApplication) : undefined;
  return enrichInhibitionUiRows(rows, sectionDate);
};

/** Normalize curing identity to BEM_NO (legacy curing used BEM_MOULD_NO / bemMouldNo). */
const normalizeCuringUiRows = (rows: Record<string, unknown>[]): Record<string, unknown>[] =>
  rows.map((row) => {
    const bemNo = String(row.BEM_NO ?? "").trim();
    if (bemNo) {
      const { BEM_MOULD_NO: _legacy, ...rest } = row;
      return { ...rest, BEM_NO: bemNo };
    }
    const legacy = String(row.BEM_MOULD_NO ?? "").trim();
    if (!legacy) return row;
    const { BEM_MOULD_NO: _legacy, ...rest } = row;
    return { ...rest, BEM_NO: legacy };
  });

/** Restore casting Article No / BEM No from curing/NDT when API omitted casting.bemNo. */
const backfillCastingBemNoFromDownstream = (
  castingRows: Record<string, unknown>[],
  curingRows: Record<string, unknown>[],
  ndtRows: Record<string, unknown>[],
): Record<string, unknown>[] =>
  castingRows.map((row, index) => {
    const existing = String(row.BEM_NO ?? "").trim();
    if (existing) return row;
    const curing = curingRows[index] ?? {};
    const fromCuring =
      String(curing.BEM_NO ?? "").trim() || String(curing.BEM_MOULD_NO ?? "").trim();
    if (fromCuring) return { ...row, BEM_NO: fromCuring };
    const fromNdt = String(ndtRows[index]?.BEM_NO ?? "").trim();
    if (fromNdt) return { ...row, BEM_NO: fromNdt };
    return row;
  });

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
    // Skip null — String(null) becomes "null" and shows in the details UI.
    if (hardware[apiKey] != null) values[uiKey] = String(hardware[apiKey]);
  });

  const apiSelections = mapApiArticlesToSelections(hardware.articles);
  if (apiSelections.length > 0) {
    values[HARDWARE_ARTICLE_SELECTIONS_ID] = apiSelections;
    // Backfill legacy count fields from BEM noOfParts for details / older UI.
    apiSelections.forEach((row) => {
      const countField = resolveHardwareCountFieldFromArticleName(row.subscaleArticleName);
      if (!countField) return;
      if (row.isBem === true) {
        values[countField] = String(row.noOfParts ?? 0);
      } else if (values[countField] == null || values[countField] === "") {
        values[countField] = String(row.noOfArticles ?? 0);
      }
    });
  } else {
    const legacySelections = synthesizeSelectionsFromLegacyCounts(values);
    if (legacySelections.length > 0) {
      values[HARDWARE_ARTICLE_SELECTIONS_ID] = legacySelections;
    }
  }

  if (hardware.linerType != null) values[LINER_TYPE_FIELD.id] = String(hardware.linerType);
  if (hardware.linerBatchNo != null) {
    values[LINER_BATCH_NO_FIELD.id] = String(hardware.linerBatchNo);
  }
  if (hardware.linerBatchDate != null) {
    values[LINER_BATCH_DATE_FIELD.id] = toUiDate(String(hardware.linerBatchDate));
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
    values[SUBSCALE_BATCH_FIELDS.PREMIX_DATE] = toUiDate(String(subscale.premixDate));
  if (subscale.finalMixDate != null) {
    values[SUBSCALE_BATCH_FIELDS.FINAL_MIX_DATE] = toUiDate(String(subscale.finalMixDate));
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
            mc.mixingCycleId == null || mc.mixingCycleId === "" ? null : Number(mc.mixingCycleId),
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
  const castingDateTime =
    casting.dateTimeOfCasting ?? casting.dateOfCastingDateTime ?? casting.dateOfCasting;
  if (castingDateTime != null) {
    const dateOfCasting = toUiDateTime(castingDateTime);
    values[scopedFormKey(SUBSCALE_SCHEMA_SECTIONS.CASTING, "DATE_OF_CASTING")] = dateOfCasting;
    setUnscopedField(values, "DATE_OF_CASTING", dateOfCasting);
  }
  const curing = (normalized.curingDetails ?? {}) as Record<string, unknown>;
  const ndt = (normalized.ndtDetails ?? {}) as Record<string, unknown>;
  const curingRowsUi = normalizeCuringUiRows(mapApiTableRowsToUi(curing.curingTable));
  const castingRowsUi = backfillCastingBemNoFromDownstream(
    mapApiTableRowsToUi(casting.castingTable),
    curingRowsUi,
    mapApiTableRowsToUi(ndt.ndtTable),
  );
  setScopedTable(values, SUBSCALE_SCHEMA_SECTIONS.CASTING, "CASTING_TABLE", castingRowsUi);

  setScopedTable(values, SUBSCALE_SCHEMA_SECTIONS.CURING, "CURING_TABLE", curingRowsUi);

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
  const manufacturingDateTime =
    inhibition.dateTimeOfManufacturing ??
    inhibition.dateOfManufacturingDateTime ??
    inhibition.dateOfManufacturing;
  if (manufacturingDateTime != null) {
    const dateOfMfg = toUiDateTime(manufacturingDateTime);
    values[
      scopedFormKey(SUBSCALE_SCHEMA_SECTIONS.INHIBITION, INHIBITION_FIELD_IDS.DATE_OF_MANUFACTURING)
    ] = dateOfMfg;
    setUnscopedField(values, "DATE_OF_MFG", dateOfMfg);
    setUnscopedField(values, "DATE_OF_MANUFACTURING", dateOfMfg);
  }
  const applicationDateTime =
    inhibition.dateTimeOfApplication ??
    inhibition.dateOfApplicationDateTime ??
    inhibition.dateOfApplication;
  const inhibitionSectionDate =
    applicationDateTime != null ? toUiDateTime(applicationDateTime) : "";
  if (inhibitionSectionDate) {
    values[
      scopedFormKey(SUBSCALE_SCHEMA_SECTIONS.INHIBITION, INHIBITION_FIELD_IDS.DATE_OF_APPLICATION)
    ] = inhibitionSectionDate;
    setUnscopedField(values, "DATE_OF_APPLICATION", inhibitionSectionDate);
  }
  setScopedTable(
    values,
    SUBSCALE_SCHEMA_SECTIONS.INHIBITION,
    "INHIBITION_TABLE",
    mapInhibitionRowsToUi(inhibition),
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
  if (source.premixDate) merged.PREMIX_DATE = toUiDate(source.premixDate);
  if (source.finalMixDate) merged.FINAL_MIX_DATE = toUiDate(source.finalMixDate);

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

  // Keep selections for form hydration paths; details display merges BEM parts into
  // count fields and omits the selections table.
  const apiSelections = mapApiArticlesToSelections(source.articles);
  if (apiSelections.length > 0) {
    merged[HARDWARE_ARTICLE_SELECTIONS_ID] = apiSelections;
    apiSelections
      .filter((row) => row.isBem === true)
      .forEach((row) => {
        const countField = resolveHardwareCountFieldFromArticleName(row.subscaleArticleName);
        if (countField) merged[countField] = String(row.noOfParts ?? 0);
      });
  } else {
    const legacySelections = synthesizeSelectionsFromLegacyCounts(merged as SchemaFormValues);
    if (legacySelections.length > 0) {
      merged[HARDWARE_ARTICLE_SELECTIONS_ID] = legacySelections;
    }
  }

  if (source.linerType) merged[LINER_TYPE_FIELD.id] = source.linerType;
  if (source.linerBatchNo) merged[LINER_BATCH_NO_FIELD.id] = source.linerBatchNo;
  if (source.linerBatchDate) {
    merged[LINER_BATCH_DATE_FIELD.id] = toUiDate(source.linerBatchDate);
  }

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
    if (merged[uiKey] == null && value != null && value !== "") merged[uiKey] = value;
  });

  const tableRows = mapApiTableRowsToUi(section[tableApiKey]);
  if (tableRows.length > 0) merged[tableUiKey] = tableRows;

  return merged;
};

export const parseSubscaleDetailsApiResponse = (data: unknown): SubscaleDetailsResponse => {
  const raw = ((data as { data?: Record<string, unknown> })?.data ?? data ?? {}) as Record<
    string,
    unknown
  >;
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
    subDepartmentId: payload.subDepartmentId != null ? Number(payload.subDepartmentId) : undefined,
    formSubmissionType:
      payload.formSubmissionType != null ? String(payload.formSubmissionType) : undefined,
    subscaleDetails: payload.subscaleDetails as SubscaleDetailsDTO | undefined,
    hardwarePreparationDetails: payload.hardwarePreparationDetails as
      HardwarePreparationDetailsDTO | undefined,
    hardwarePreparationTable: payload.hardwarePreparationTable as
      HardwarePreparationTableDTO[] | undefined,
    castingDetails: payload.castingDetails as CastingDetailsDTO | undefined,
    curingDetails: payload.curingDetails as CuringDetailsDTO | undefined,
    ndtDetails: payload.ndtDetails as NdtDetailsDTO | undefined,
    trimmingDetails: payload.trimmingDetails as TrimmingDetailsDTO | undefined,
    inhibitionDetails: payload.inhibitionDetails as InhibitionDetailsDTO | undefined,
    staticTestingDetails: payload.staticTestingDetails as StaticTestingDetailsDTO | undefined,
    mechanicalInterfaceProperties: payload.mechanicalInterfaceProperties as
      MechanicalInterfacePropertiesDTO | undefined,
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
        mapProcessSectionApiToDisplayMerged(
          value as Record<string, unknown>,
          "castingTable",
          "CASTING_TABLE",
          [
            { apiKey: "dateTimeOfCasting", uiKey: "DATE_OF_CASTING" },
            { apiKey: "dateOfCastingDateTime", uiKey: "DATE_OF_CASTING" },
            { apiKey: "dateOfCasting", uiKey: "DATE_OF_CASTING" },
          ],
        ),
      );
      return;
    }

    if (key === "curingDetails") {
      const curingMapped = mapProcessSectionApiToDisplayMerged(
        value as Record<string, unknown>,
        "curingTable",
        "CURING_TABLE",
      );
      if (Array.isArray(curingMapped.CURING_TABLE)) {
        curingMapped.CURING_TABLE = normalizeCuringUiRows(
          curingMapped.CURING_TABLE as Record<string, unknown>[],
        );
      }
      Object.assign(merged, curingMapped);
      return;
    }

    if (key === "ndtDetails") {
      Object.assign(
        merged,
        mapProcessSectionApiToDisplayMerged(
          value as Record<string, unknown>,
          "ndtTable",
          "NDT_TABLE",
        ),
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
      const manufacturingDateTime =
        source.dateTimeOfManufacturing ??
        source.dateOfManufacturingDateTime ??
        source.dateOfManufacturing;
      const applicationDateTime =
        source.dateTimeOfApplication ??
        source.dateOfApplicationDateTime ??
        source.dateOfApplication;
      if (manufacturingDateTime) {
        merged.DATE_OF_MANUFACTURING = toUiDateTime(manufacturingDateTime);
      }
      if (applicationDateTime) {
        merged.DATE_OF_APPLICATION = toUiDateTime(applicationDateTime);
      }
      const rows = mapInhibitionRowsToUi(source as Record<string, unknown>);
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
    const selections = Array.isArray(values[HARDWARE_ARTICLE_SELECTIONS_ID])
      ? (values[HARDWARE_ARTICLE_SELECTIONS_ID] as HardwareArticleSelection[])
      : [];

    // Do not surface HARDWARE_ARTICLE_SELECTIONS as a details table — show
    // No. of Articles + No. of Parts against each BEM article.
    const bemLegacyCountFields = new Set<string>();
    if (selections.length > 0) {
      selections
        .filter((row) => row.isBem === true)
        .forEach((row, index) => {
          const name = String(row.subscaleArticleName ?? "").trim() || `BEM ${index + 1}`;
          merged[`No. of Articles (${name})`] = String(row.noOfArticles ?? 0);
          merged[`No. of Parts (${name})`] = String(row.noOfParts ?? 0);
          const countField = resolveHardwareCountFieldFromArticleName(name);
          if (countField) bemLegacyCountFields.add(countField);
        });

      selections
        .filter((row) => row.isBem !== true)
        .forEach((row) => {
          const countField = resolveHardwareCountFieldFromArticleName(row.subscaleArticleName);
          if (countField && merged[countField] == null) {
            merged[countField] = String(row.noOfArticles ?? 0);
          }
        });
    }

    HARDWARE_COUNT_FIELDS.forEach((field) => {
      // Prefer explicit "No. of Parts (article)" rows over legacy BEM count labels.
      if (bemLegacyCountFields.has(field.id)) return;
      if (merged[field.id] != null) return;
      const raw = values[field.id];
      if (raw != null && raw !== "" && String(raw).toLowerCase() !== "null") {
        merged[field.id] = raw;
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
