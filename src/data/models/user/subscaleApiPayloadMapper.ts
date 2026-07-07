import { scopedFormKey, syncRowGenerationTables, type SchemaDocumentV2, type SchemaFormValues, type SchemaSectionSubmission } from "../../../schema-engine";
import { mapSubscaleBatchType } from "../../../schema-engine/adapters/subscale.adapter";
import {
  ARTICLE_TYPE_TABLE_ID,
  HARDWARE_COUNT_FIELDS,
  HARDWARE_SECTION_ID,
  LINER_TYPE_FIELD,
  type ArticleTypeRow,
} from "../../../hooks/user/manufacturing/subscaleHardwareConfig";
import {
  SUBSCALE_BATCH_FIELDS,
  normalizeSubscaleMixingCycles,
} from "../../../hooks/user/manufacturing/subscaleBatchConfig";

const HARDWARE_COUNT_TO_API: Record<string, string> = {
  NO_OF_40KG_BEMS: "numberOf40KgBems",
  NO_OF_10KG_BEMS: "numberOf10KgBems",
  NO_OF_2KG_BEMS: "numberOf2KgBems",
  NO_OF_WHEEL_PEEL: "numberOfWheelPeels",
  NO_OF_SBS_TBS: "numberOfSbsTbs",
};

const ARTICLE_TYPE_TO_API: Record<string, string> = {
  "40 kg BEM": "40_KG_BEM",
  "10 kg BEM": "10_KG_BEM",
  "2 kg BEM": "2_KG_BEM",
  "Wheel Peel": "WHEEL_PEEL",
  "SBS/TBS": "SBS_TBS",
  "40_KG_BEM": "40_KG_BEM",
  "10_KG_BEM": "10_KG_BEM",
  "2_KG_BEM": "2_KG_BEM",
  WHEEL_PEEL: "WHEEL_PEEL",
  SBS_TBS: "SBS_TBS",
};

const TABLE_FIELD_TO_API: Record<string, string> = {
  GRAPH_FILE: "graphDocumentId",
  GRAPH_UPLOAD: "graphDocumentId",
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
};

const RUNTIME_ROW_KEYS = new Set(["SR_NO", "srNo"]);

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
  key
    .toLowerCase()
    .replace(/_([a-z0-9])/gi, (_, char: string) => char.toUpperCase());

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

const getScopedValue = (values: SchemaFormValues, sectionId: string, fieldId: string) =>
  values[scopedFormKey(sectionId, fieldId)];

const getTableRows = (values: SchemaFormValues, sectionId: string, tableId: string) => {
  const raw = getScopedValue(values, sectionId, tableId);
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
    const apiKey = TABLE_FIELD_TO_API[key] ?? toCamelCase(key);
    if (value === null || value === undefined || value === "") return;

    if (key === "LINER_APPLIED") {
      const bool = parseBoolean(value);
      if (bool !== undefined) mapped[apiKey] = bool;
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

const resolveLinerFields = (values: SchemaFormValues) => {
  const raw = String(values[LINER_TYPE_FIELD.id] ?? "").trim();
  if (!raw) return { linerType: undefined, linerBatchNo: undefined };

  const upper = raw.toUpperCase();
  if (upper === "EPDM" || upper === "NBR") {
    return { linerType: upper, linerBatchNo: undefined };
  }

  const [first, ...rest] = raw.split(/[\s-]+/);
  if (first && (first.toUpperCase() === "EPDM" || first.toUpperCase() === "NBR")) {
    return {
      linerType: first.toUpperCase(),
      linerBatchNo: rest.join("-").trim() || undefined,
    };
  }

  return { linerType: undefined, linerBatchNo: raw };
};

const mapHardwarePreparationDetails = (values: SchemaFormValues) => {
  const details: Record<string, unknown> = {};
  HARDWARE_COUNT_FIELDS.forEach((field) => {
    const apiKey = HARDWARE_COUNT_TO_API[field.id];
    const num = parseNumber(values[field.id]);
    if (apiKey && num !== undefined) details[apiKey] = num;
  });

  const liner = resolveLinerFields(values);
  if (liner.linerType) details.linerType = liner.linerType;
  if (liner.linerBatchNo) details.linerBatchNo = liner.linerBatchNo;

  return Object.keys(details).length > 0 ? details : undefined;
};

const mapHardwarePreparationTable = (values: SchemaFormValues) => {
  const rows = Array.isArray(values[ARTICLE_TYPE_TABLE_ID])
    ? (values[ARTICLE_TYPE_TABLE_ID] as ArticleTypeRow[])
    : [];

  return rows
    .map((row) => {
      const articleType = ARTICLE_TYPE_TO_API[String(row.ARTICLE_TYPE ?? "").trim()] ??
        String(row.ARTICLE_TYPE ?? "").trim().replace(/\s+/g, "_").toUpperCase();

      const mapped: Record<string, unknown> = {};
      if (articleType) mapped.articleType = articleType;
      if (row.RUBBER_MATERIAL) mapped.rubberMaterial = row.RUBBER_MATERIAL;
      if (row.SLEEVE_NO) mapped.sleeveNo = row.SLEEVE_NO;
      if (row.MOULD_NO) mapped.mouldNo = row.MOULD_NO;

      const lengthMm = parseNumber(row.LENGTH_MM);
      if (lengthMm !== undefined) mapped.lengthMm = lengthMm;
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

const buildProcessParticularsSummary = (values: SchemaFormValues) => {
  const cycles = normalizeSubscaleMixingCycles(values[SUBSCALE_BATCH_FIELDS.MIXING_CYCLES]);
  if (!cycles.length) return "";

  return cycles
    .filter((cycle) => cycle.stage)
    .map((cycle) => {
      const ops = cycle.processParticulars
        .map((row) => {
          const parts = [row.operation, row.rpm && `rpm ${row.rpm}`, row.time && `time ${row.time}`]
            .filter(Boolean)
            .join(" ");
          return parts;
        })
        .filter(Boolean)
        .join("; ");
      return ops ? `Stage ${cycle.stage}: ${ops}` : `Stage ${cycle.stage}`;
    })
    .join(" | ");
};

const mapSubscaleDetails = (values: SchemaFormValues) => {
  const cycles = normalizeSubscaleMixingCycles(values[SUBSCALE_BATCH_FIELDS.MIXING_CYCLES]);
  const primaryStage = cycles.find((cycle) => cycle.stage)?.stage ?? "";

  const payload: Record<string, unknown> = {};
  const batchSize = parseNumber(values[SUBSCALE_BATCH_FIELDS.BATCH_SIZE]);
  if (batchSize !== undefined) payload.batchSize = batchSize;

  const mixer = String(values[SUBSCALE_BATCH_FIELDS.MIXER_BLDG_NO] ?? "").trim();
  if (mixer) payload.mixerAndBuildingNo = mixer;

  const premixDate = String(values[SUBSCALE_BATCH_FIELDS.PREMIX_DATE] ?? "").trim();
  if (premixDate) payload.premixDate = premixDate;

  const finalMixDate = String(values[SUBSCALE_BATCH_FIELDS.FINAL_MIX_DATE] ?? "").trim();
  if (finalMixDate) payload.finalMixDate = finalMixDate;

  if (primaryStage) payload.mixingCycle = primaryStage;

  const processParticulars = buildProcessParticularsSummary(values);
  if (processParticulars) payload.processParticulars = processParticulars;

  return Object.keys(payload).length > 0 ? payload : undefined;
};

export type SubscaleApiPayloadBody = {
  hardwarePreparationDetails?: Record<string, unknown>;
  hardwarePreparationTable?: Record<string, unknown>[];
  subscaleDetails?: Record<string, unknown>;
  castingDetails?: Record<string, unknown>;
  curingDetails?: Record<string, unknown>;
  ndtDetails?: Record<string, unknown>;
  trimmingDetails?: Record<string, unknown>;
  inhibitionDetails?: Record<string, unknown>;
  staticTestingDetails?: Record<string, unknown>;
  mechanicalInterfaceProperties?: Record<string, unknown>;
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
  { sectionId: "SUBSCALE_DETAILS", keys: ["subscaleDetails"] },
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

  const castingDate = String(getScopedValue(values, "CASTING_DETAILS", "DATE_OF_CASTING") ?? "").trim();
  const castingDetails = buildSectionTablePayload(
    values,
    "CASTING_DETAILS",
    "CASTING_TABLE",
    "castingTable",
    castingDate ? { dateOfCasting: castingDate } : undefined,
  );

  const curingDetails = buildSectionTablePayload(values, "CURING_DETAILS", "CURING_TABLE", "curingTable");
  const ndtDetails = buildSectionTablePayload(values, "NDT_DETAILS", "NDT_TABLE", "ndtTable");
  const trimmingDetails = buildSectionTablePayload(
    values,
    "TRIMMING_DETAILS",
    "TRIMMING_TABLE",
    "trimmingTable",
  );

  const inhibitionFields: Record<string, unknown> = {};
  const irBatchNo = String(
    getScopedValue(values, SUBSCALE_SCHEMA_SECTIONS.INHIBITION, INHIBITION_FIELD_IDS.IR_BATCH_NO) ?? "",
  ).trim();
  if (irBatchNo) inhibitionFields.irBatchNo = irBatchNo;
  const dateOfMfg = String(
    getScopedValue(values, SUBSCALE_SCHEMA_SECTIONS.INHIBITION, INHIBITION_FIELD_IDS.DATE_OF_MANUFACTURING) ?? "",
  ).trim();
  if (dateOfMfg) inhibitionFields.dateOfManufacturing = dateOfMfg;
  const dateOfApplication = String(
    getScopedValue(values, SUBSCALE_SCHEMA_SECTIONS.INHIBITION, INHIBITION_FIELD_IDS.DATE_OF_APPLICATION) ??
      "",
  ).trim();
  if (dateOfApplication) inhibitionFields.dateOfApplication = dateOfApplication;

  const inhibitionDetails = buildSectionTablePayload(
    values,
    SUBSCALE_SCHEMA_SECTIONS.INHIBITION,
    "INHIBITION_TABLE",
    "inhibitionTable",
    inhibitionFields,
  );

  const staticTestingDetails = buildSectionTablePayload(
    values,
    SUBSCALE_SCHEMA_SECTIONS.STATIC_TESTING,
    "STATIC_TESTING_TABLE",
    "staticTestingTable",
  );

  const mechanicalInterfaceProperties = buildSectionTablePayload(
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
  graphDocumentId: "GRAPH_FILE",
  bemNo: "BEM_NO",
  bemMouldNo: "BEM_MOULD_NO",
};

const ARTICLE_TYPE_FROM_API: Record<string, string> = {
  "40_KG_BEM": "40 kg BEM",
  "10_KG_BEM": "10 kg BEM",
  "2_KG_BEM": "2 kg BEM",
  WHEEL_PEEL: "Wheel Peel",
  SBS_TBS: "SBS/TBS",
};

const formatUiCellValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return value;
};

const mapApiTableRowToUi = (row: Record<string, unknown>, index: number) => {
  const mapped: Record<string, unknown> = { SR_NO: index + 1 };

  Object.entries(row).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    const uiKey = API_TO_TABLE_FIELD[key] ?? toScreamingSnake(key);
    if (uiKey === "LINER_APPLIED" && typeof value === "boolean") {
      mapped[uiKey] = value ? "Yes" : "No";
      return;
    }
    mapped[uiKey] = formatUiCellValue(value);
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
  if (rows.length > 0) values[scopedFormKey(sectionId, tableId)] = rows;
};

export const mapSubscaleApiDetailsToFormValues = (payload: Record<string, unknown>): SchemaFormValues => {
  const normalized = normalizeSubscaleApiDetailsPayload(payload);
  const values: SchemaFormValues = {};
  const hardware = (normalized.hardwarePreparationDetails ?? {}) as Record<string, unknown>;

  Object.entries(HARDWARE_COUNT_TO_API).forEach(([uiKey, apiKey]) => {
    if (hardware[apiKey] !== undefined) values[uiKey] = String(hardware[apiKey]);
  });

  const linerType = String(hardware.linerType ?? "").trim();
  const linerBatchNo = String(hardware.linerBatchNo ?? "").trim();
  if (linerType && linerBatchNo) values[LINER_TYPE_FIELD.id] = `${linerType} ${linerBatchNo}`;
  else if (linerBatchNo) values[LINER_TYPE_FIELD.id] = linerBatchNo;
  else if (linerType) values[LINER_TYPE_FIELD.id] = linerType;

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
        LENGTH_MM: source.lengthMm != null ? String(source.lengthMm) : "",
        THICKNESS_MM: source.thicknessMm != null ? String(source.thicknessMm) : "",
        LINER_APPLIED:
          source.linerApplied === true ? "Yes" : source.linerApplied === false ? "No" : "",
        OBSERVATIONS: String(source.observations ?? ""),
        ...(countField
          ? { _articleKey: countField, _articleIndex: articleIndex }
          : {}),
      };
    });
    bridgeHardwareArticleTableToSchemaScope(values);
  }

  const subscale = (normalized.subscaleDetails ?? {}) as Record<string, unknown>;
  if (subscale.batchSize != null) values[SUBSCALE_BATCH_FIELDS.BATCH_SIZE] = String(subscale.batchSize);
  if (subscale.mixerAndBuildingNo != null) {
    values[SUBSCALE_BATCH_FIELDS.MIXER_BLDG_NO] = String(subscale.mixerAndBuildingNo);
  }
  if (subscale.premixDate != null) values[SUBSCALE_BATCH_FIELDS.PREMIX_DATE] = String(subscale.premixDate);
  if (subscale.finalMixDate != null) {
    values[SUBSCALE_BATCH_FIELDS.FINAL_MIX_DATE] = String(subscale.finalMixDate);
  }
  if (subscale.mixingCycle != null) {
    values[SUBSCALE_BATCH_FIELDS.MIXING_CYCLES] = normalizeSubscaleMixingCycles([
      {
        _key: "mixing-cycle-1",
        stage: String(subscale.mixingCycle),
        processParticulars: [],
      },
    ]);
  }

  const casting = (normalized.castingDetails ?? {}) as Record<string, unknown>;
  if (casting.dateOfCasting != null) {
    values[scopedFormKey(SUBSCALE_SCHEMA_SECTIONS.CASTING, "DATE_OF_CASTING")] = String(
      casting.dateOfCasting,
    );
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
    values[scopedFormKey(SUBSCALE_SCHEMA_SECTIONS.INHIBITION, INHIBITION_FIELD_IDS.IR_BATCH_NO)] =
      String(inhibition.irBatchNo);
  }
  if (inhibition.dateOfManufacturing != null) {
    values[
      scopedFormKey(
        SUBSCALE_SCHEMA_SECTIONS.INHIBITION,
        INHIBITION_FIELD_IDS.DATE_OF_MANUFACTURING,
      )
    ] = String(inhibition.dateOfManufacturing);
  }
  if (inhibition.dateOfApplication != null) {
    values[
      scopedFormKey(SUBSCALE_SCHEMA_SECTIONS.INHIBITION, INHIBITION_FIELD_IDS.DATE_OF_APPLICATION)
    ] = String(inhibition.dateOfApplication);
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

  return values;
};

const rebuildSubscaleSectionsRecord = (payload: Record<string, unknown>): Record<string, unknown> => {
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
  if (sectionId === "HARDWARE_PREPARATION_DETAILS") {
    HARDWARE_COUNT_FIELDS.forEach((field) => {
      if (values[field.id] != null) merged[field.id] = values[field.id];
    });
    if (values[LINER_TYPE_FIELD.id] != null) {
      merged[LINER_TYPE_FIELD.id] = values[LINER_TYPE_FIELD.id];
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
    if (values[scopedKey] != null) merged[tableId] = values[scopedKey];
  }
  Object.keys(values).forEach((key) => {
    if (!key.startsWith(`${sectionId}::`)) return;
    const fieldId = key.split("::")[1];
    if (fieldId) merged[fieldId] = values[key];
  });
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
