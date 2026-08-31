import {
  buildRawMaterialSchemaRequest,
  buildRawMaterialSchemaRequestFromCodes,
  createInitialValues,
  findGradeInMaterial,
  findMaterialInList,
  hydrateValuesFromProcess,
  rawMaterialPrepSchemaFetchConfig,
  RMP_SCHEMA_TYPE,
  RMP_SCHEMA_VERSION,
  type SchemaProcessSubmission,
} from "../../../schema-engine/adapters/rawMaterialPreparation.adapter";
import schemaEngineController, { toSectionSubmissions } from "../../../schema-engine";
import { isSchemaDocumentReady } from "../../../schema-engine/utils/schemaMessages";
import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import {
  normalizeProcessSubmissionFromApi,
  normalizeSectionsForApiPayload,
  serializeProcessSubmissionForApi,
} from "../../../data/models/user/rawMaterialPreparationApiMapper";
import { formatToIsoDateInput } from "../../../utils/dateUtils";
import type { MaterialItem } from "../../../data/models/admin/BatchManagement/BatchManagementModel";
import { operationsController } from "../../../controllers/user/operationsController";
import {
  buildMaterialSelectionFromSheetRow,
  findPrepMaterialByCode,
  mergeMaterialsLists,
  type RawMaterialPrepMaterialOption,
} from "../manufacturing/rawMaterialPrepFlowConfig";
import { resolveBatchDetailsRoot } from "./qcBatchContext";
import type { QcDivisionEntry } from "./qcDivisionEntryTypes";

const createProcessingEntryId = () =>
  `qc-div-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/** Expand flat division-details section rows into schema table/repeat shape (same as RMP). */
export const normalizeProcessingSectionsForSchema = (
  schema: SchemaDocumentV2,
  sections: SchemaSectionSubmission[],
  context: {
    materialId: number;
    materialCode: string;
    materialName: string;
    gradeId?: number | null;
    gradeCode?: string | null;
  },
): SchemaSectionSubmission[] =>
  normalizeProcessSubmissionFromApi(
    {
      materialId: context.materialId,
      materialCode: context.materialCode,
      materialName: context.materialName,
      gradeId: context.gradeId ?? null,
      gradeCode: context.gradeCode ?? null,
      schemaVersion: schema.schemaVersion || RMP_SCHEMA_VERSION,
      schemaType: schema.schemaType || RMP_SCHEMA_TYPE,
      sections,
    },
    schema,
  ).sections;

export type QcProcessingProcessSlot = "solid" | "liquid";

export type QcProcessingMaterialSeed = {
  premixNo: number;
  premixDate?: string;
  materialType?: string;
  processSlot: QcProcessingProcessSlot;
  materialId: number;
  materialCode: string;
  materialName: string;
  gradeId: number | null;
  gradeCode: string | null;
  sections: SchemaSectionSubmission[];
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const pickNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
};

const pickString = (...values: unknown[]): string => {
  for (const value of values) {
    const s = String(value ?? "").trim();
    if (s) return s;
  }
  return "";
};

const normalizeSections = (value: unknown): SchemaSectionSubmission[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      const rec = asRecord(row);
      if (!rec) return null;
      const sectionId = pickString(rec.sectionId, rec.section_id);
      if (!sectionId) return null;
      const sectionData = Array.isArray(rec.sectionData)
        ? rec.sectionData
        : Array.isArray(rec.section_data)
          ? rec.section_data
          : [];
      return { sectionId, sectionData } as SchemaSectionSubmission;
    })
    .filter((section): section is SchemaSectionSubmission => Boolean(section));
};

const normalizeCertificateList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }
  const single = String(value ?? "").trim();
  return single ? [single] : [];
};

const sectionsFromProcessingDetail = (detail: Record<string, unknown>): SchemaSectionSubmission[] => {
  const existing = normalizeSections(detail.sections);
  if (existing.length) return existing;

  const parameters = asArray(detail.parameters);
  if (!parameters.length) return [];

  const rawMaterial = pickString(detail.rawMaterial, detail.raw_material, detail.materialCode);
  const grade = pickString(detail.grade, detail.gradeCode, detail.grade_code);
  const operation = pickString(detail.operation);

  const rows = parameters.map((param, index) => {
    const rec = asRecord(param) ?? {};
    return {
      SR_NO: index + 1,
      RAW_MATERIAL: rawMaterial,
      GRADE: grade,
      OPERATION: operation,
      PARAMETER: pickString(rec.parameter, rec.PARAMETER),
      SPECIFICATION: pickString(rec.specification, rec.SPECIFICATION),
      ACTUAL_VALUE: pickString(rec.actualValue, rec.ACTUAL_VALUE, rec.result, rec.RESULT),
      REMARKS: pickString(rec.remarks, rec.REMARKS),
      QC_CERTIFICATE: normalizeCertificateList(rec.qcCertificate ?? rec.QC_CERTIFICATE).join(", "),
    };
  });

  return [
    {
      sectionId: "PROCESSING_DETAILS",
      sectionData: [{ PROCESSING_DETAILS: { rows } }],
    },
  ];
};

const parseProcessMaterials = (
  premixNo: number,
  premixDate: string | undefined,
  materialType: string | undefined,
  processSlot: QcProcessingProcessSlot,
  source: unknown,
): QcProcessingMaterialSeed[] => {
  const rows: QcProcessingMaterialSeed[] = [];
  asArray(source).forEach((row, index) => {
    const rec = asRecord(row);
    if (!rec) return;

    // New API shape: RMP-style process with sections
    // Legacy shape: { srNo, rawMaterial, grade, operation, parameters }
    const rawMaterial = pickString(rec.rawMaterial, rec.raw_material, rec.materialCode, rec.material_code);
    const hasDomainShape = Boolean(rawMaterial) || Array.isArray(rec.parameters);
    const hasSections = normalizeSections(rec.sections).length > 0;
    const materialIdEarly = pickNumber(rec.materialId, rec.material_id);

    if (hasDomainShape && !materialIdEarly && !hasSections) {
      const materialCode = rawMaterial || `MATERIAL_${index + 1}`;
      rows.push({
        premixNo,
        premixDate,
        materialType,
        processSlot,
        materialId: pickNumber(rec.materialId, rec.material_id) ?? index + 1,
        materialCode,
        materialName: pickString(rec.materialName, rec.material_name) || materialCode,
        gradeId: null,
        gradeCode: pickString(rec.grade, rec.gradeCode, rec.grade_code) || null,
        sections: sectionsFromProcessingDetail(rec),
      });
      return;
    }

    const materialId = pickNumber(rec.materialId, rec.material_id);
    const materialCode = pickString(rec.materialCode, rec.material_code, rawMaterial);
    if (materialId == null || !materialCode) return;
    const gradeIdRaw = rec.gradeId ?? rec.grade_id;
    const gradeId =
      gradeIdRaw == null || gradeIdRaw === ""
        ? null
        : Number.isFinite(Number(gradeIdRaw))
          ? Number(gradeIdRaw)
          : null;
    const gradeCodeRaw = pickString(rec.gradeCode, rec.grade_code, rec.grade);
    rows.push({
      premixNo,
      premixDate,
      materialType,
      processSlot,
      materialId,
      materialCode,
      materialName: pickString(rec.materialName, rec.material_name) || materialCode,
      gradeId,
      gradeCode: gradeCodeRaw || null,
      sections: sectionsFromProcessingDetail(rec),
    });
  });
  return rows;
};

export const getQcProcessingMaterialSchemaCacheKey = (params: {
  materialId: number;
  gradeCode?: string | null;
  processSlot: QcProcessingProcessSlot;
}) =>
  `RMP:${params.materialId}:${String(params.gradeCode ?? "").trim() || "NONE"}:${params.processSlot}`;

export const getQcProcessingMaterialDedupKey = (params: {
  premixNo: number;
  processSlot: QcProcessingProcessSlot;
  materialId: number;
  gradeCode?: string | null;
}) =>
  `RAW_MATERIAL:PROCESSING:${params.premixNo}:${params.processSlot}:${params.materialId}:${String(params.gradeCode ?? "").trim() || "NONE"}`;

export const getQcProcessingMaterialLabel = (params: {
  premixNo: number;
  materialCode: string;
}) => `Premix-${params.premixNo} ${params.materialCode}`;

export const parseProcessingMaterialsFromDivisionDetails = (
  payload: unknown,
): QcProcessingMaterialSeed[] => {
  const root = asRecord(payload) ?? {};
  const data = asRecord(root.data) ?? root;
  const seeds: QcProcessingMaterialSeed[] = [];

  asArray(data.premixes).forEach((row) => {
    const rec = asRecord(row);
    if (!rec) return;
    const premixNo = pickNumber(rec.premixNo, rec.premix_no, rec.no);
    if (premixNo == null) return;
    const details = asRecord(rec.details);
    const premixDate =
      pickString(rec.premixDate, rec.premix_date, details?.premixDate, details?.premix_date) ||
      undefined;
    const materialType =
      pickString(rec.materialType, rec.material_type, details?.materialType, details?.material_type) ||
      undefined;

    const solidSource =
      rec.solidProcess ??
      rec.solid_process ??
      details?.solidProcess ??
      details?.solid_process ??
      details?.solidProcessingDetails ??
      details?.solid_processing_details ??
      details?.solidProcessDetails;
    const liquidSource =
      rec.liquidProcess ??
      rec.liquid_process ??
      details?.liquidProcess ??
      details?.liquid_process ??
      details?.liquidProcessingDetails ??
      details?.liquid_processing_details ??
      details?.liquidProcessDetails;

    seeds.push(
      ...parseProcessMaterials(premixNo, premixDate, materialType, "solid", solidSource),
      ...parseProcessMaterials(premixNo, premixDate, materialType, "liquid", liquidSource),
    );
  });

  return seeds;
};

export const getProcessingMaterialsForPremix = (
  payload: unknown,
  premixNo: number,
): QcProcessingMaterialSeed[] =>
  parseProcessingMaterialsFromDivisionDetails(payload).filter((seed) => seed.premixNo === premixNo);

export type QcProcessingMaterialCatalog = {
  solidMaterials: RawMaterialPrepMaterialOption[];
  liquidMaterials: RawMaterialPrepMaterialOption[];
};

const resolveBatchPayloadRoot = (batchPayload: unknown): Record<string, unknown> | null =>
  resolveBatchDetailsRoot(batchPayload);

export const fetchProcessingMaterialCatalog = async (): Promise<QcProcessingMaterialCatalog> => {
  const [solidResp, liquidResp] = await Promise.all([
    operationsController.fetchMaterialsList({ materialType: "SOLID" }),
    operationsController.fetchMaterialsList({ materialType: "LIQUID" }),
  ]);
  return {
    solidMaterials: solidResp?.success ? (solidResp.data ?? []) : [],
    liquidMaterials: liquidResp?.success ? (liquidResp.data ?? []) : [],
  };
};

const processingMaterialSeedKey = (seed: Pick<
  QcProcessingMaterialSeed,
  "premixNo" | "materialCode" | "processSlot"
>) =>
  `${seed.premixNo}:${String(seed.materialCode ?? "").trim().toUpperCase()}:${seed.processSlot}`;

const resolveCatalogMaterialId = (
  materialCode: string,
  preferredId: number | undefined | null,
  catalog: QcProcessingMaterialCatalog,
): number | null => {
  const preferred = Number(preferredId ?? 0);
  if (Number.isFinite(preferred) && preferred > 0) return preferred;
  const all = mergeMaterialsLists(catalog.solidMaterials, catalog.liquidMaterials);
  const match = findPrepMaterialByCode(all, materialCode);
  const id = Number(match?.materialId ?? 0);
  return id > 0 ? id : null;
};

const sortProcessingSeedsBySheetOrder = (
  seeds: QcProcessingMaterialSeed[],
  batchPayload: unknown,
): QcProcessingMaterialSeed[] => {
  const batch = resolveBatchPayloadRoot(batchPayload);
  const sheet = asRecord(batch?.identificationSheet);
  const sheetMaterials = asArray(sheet?.materials);
  const order = new Map<string, number>();
  sheetMaterials.forEach((row, index) => {
    const rec = asRecord(row);
    const code = pickString(rec?.materialCode, rec?.material_code);
    if (code) order.set(code.toUpperCase(), index);
  });
  return [...seeds].sort((a, b) => {
    const ao = order.get(a.materialCode.toUpperCase()) ?? 999;
    const bo = order.get(b.materialCode.toUpperCase()) ?? 999;
    if (ao !== bo) return ao - bo;
    return a.processSlot.localeCompare(b.processSlot);
  });
};

/** @deprecated Prefer status-aware resolveProcessingMaterialSeedsForPremix — no cross-source merge. */
export const mergeProcessingMaterialSeeds = (
  sheetSeeds: QcProcessingMaterialSeed[],
  detailSeeds: QcProcessingMaterialSeed[],
): QcProcessingMaterialSeed[] => {
  if (!sheetSeeds.length) return detailSeeds;
  if (!detailSeeds.length) return sheetSeeds;

  const detailByKey = new Map(
    detailSeeds.map((seed) => [processingMaterialSeedKey(seed), seed] as const),
  );
  const seen = new Set<string>();
  const merged: QcProcessingMaterialSeed[] = [];

  for (const sheetSeed of sheetSeeds) {
    const key = processingMaterialSeedKey(sheetSeed);
    seen.add(key);
    const detail = detailByKey.get(key);
    merged.push(
      detail
        ? {
            ...sheetSeed,
            ...detail,
            sections: detail.sections.length ? detail.sections : sheetSeed.sections,
            premixDate: detail.premixDate ?? sheetSeed.premixDate,
            materialType: detail.materialType ?? sheetSeed.materialType,
          }
        : sheetSeed,
    );
  }

  for (const detail of detailSeeds) {
    const key = processingMaterialSeedKey(detail);
    if (!seen.has(key)) merged.push(detail);
  }

  return merged;
};

/**
 * Build processing material seeds from batch identification sheet — one tab per sheet row
 * per premix (solid and/or liquid slot from material master), independent of premix nav type.
 */
export const buildProcessingMaterialSeedsFromBatchSheet = (
  batchPayload: unknown,
  premixNo: number,
  _processingType: string | undefined,
  catalog: QcProcessingMaterialCatalog,
): QcProcessingMaterialSeed[] => {
  const batch = resolveBatchPayloadRoot(batchPayload);
  if (!batch) return [];

  const sheet = asRecord(batch.identificationSheet);
  const sheetMaterials = asArray(sheet?.materials).filter(
    (row): row is MaterialItem => row != null && typeof row === "object",
  );
  if (!sheetMaterials.length) return [];

  const seeds: QcProcessingMaterialSeed[] = [];

  sheetMaterials.forEach((row) => {
    const selection = buildMaterialSelectionFromSheetRow(
      row,
      premixNo,
      catalog.solidMaterials,
      catalog.liquidMaterials,
    );

    if (selection.selectedProcesses.solid && selection.solidMaterialCode) {
      const materialId = resolveCatalogMaterialId(
        selection.solidMaterialCode,
        selection.solidMaterialId,
        catalog,
      );
      if (materialId) {
        seeds.push({
          premixNo,
          processSlot: "solid",
          materialId,
          materialCode: selection.solidMaterialCode,
          materialName: selection.materialName,
          gradeId: selection.solidGradeId ?? null,
          gradeCode: selection.solidGradeCode || null,
          sections: [],
        });
      }
    }

    if (selection.selectedProcesses.liquid && selection.liquidMaterialCode) {
      const materialId = resolveCatalogMaterialId(
        selection.liquidMaterialCode,
        selection.liquidMaterialId,
        catalog,
      );
      if (materialId) {
        seeds.push({
          premixNo,
          processSlot: "liquid",
          materialId,
          materialCode: selection.liquidMaterialCode,
          materialName: selection.materialName,
          gradeId: null,
          gradeCode: null,
          sections: [],
        });
      }
    }
  });

  return sortProcessingSeedsBySheetOrder(seeds, batchPayload);
};

/**
 * QC data-source rule (all divisions, all batch types):
 * - TO_BE_INITIATED → manufacturing `/qc-division/division-details` (identification sheet
 *   only when division-details has no material rows yet).
 * - IN_PROGRESS+ → saved `/qc-division/details` only — never merge with division-details/sheet.
 */
export const resolveProcessingMaterialSeedsForPremix = async (
  payload: unknown,
  premixNo: number,
  options?: {
    batchPayload?: unknown;
    processingType?: string;
    catalog?: QcProcessingMaterialCatalog;
    useFormDetails?: boolean;
  },
): Promise<{ seeds: QcProcessingMaterialSeed[]; catalog: QcProcessingMaterialCatalog }> => {
  const catalog = options?.catalog ?? (await fetchProcessingMaterialCatalog());

  if (options?.useFormDetails) {
    return {
      seeds: getProcessingMaterialsForPremix(payload, premixNo),
      catalog,
    };
  }

  const fromDivisionDetails = getProcessingMaterialsForPremix(payload, premixNo);
  if (fromDivisionDetails.length) {
    return {
      seeds: sortProcessingSeedsBySheetOrder(fromDivisionDetails, options?.batchPayload),
      catalog,
    };
  }

  return {
    seeds: buildProcessingMaterialSeedsFromBatchSheet(
      options?.batchPayload,
      premixNo,
      options?.processingType,
      catalog,
    ),
    catalog,
  };
};

/** Same schema fetch path as manufacturing Raw Material Preparation premix slots. */
export const fetchQcProcessingMaterialSchema = async (params: {
  subDepartmentId: number;
  seed: QcProcessingMaterialSeed;
  catalog?: QcProcessingMaterialCatalog;
}): Promise<SchemaDocumentV2 | null> => {
  const { subDepartmentId, seed } = params;
  if (subDepartmentId <= 0) return null;

  const isSolid = seed.processSlot === "solid";
  const materialCode = pickString(seed.materialCode);
  if (!materialCode) return null;

  const catalog = params.catalog ?? (await fetchProcessingMaterialCatalog());
  const allMaterials = mergeMaterialsLists(
    catalog.solidMaterials,
    catalog.liquidMaterials,
  ) as RawMaterialPrepMaterialOption[];
  const material = findMaterialInList(allMaterials, materialCode);
  const materialId = material?.materialId ?? seed.materialId;
  if (!materialId) return null;

  const requestBody = material
    ? buildRawMaterialSchemaRequest({
        subDepartmentId,
        material,
        grade: isSolid ? findGradeInMaterial(material, seed.gradeCode ?? "") : null,
      })
    : buildRawMaterialSchemaRequestFromCodes({
        subDepartmentId,
        materialId,
        materialCode,
        gradeId: isSolid ? seed.gradeId : null,
        gradeCode: isSolid ? seed.gradeCode || null : null,
      });

  const response = await schemaEngineController.fetchSchema(
    rawMaterialPrepSchemaFetchConfig,
    requestBody,
  );
  if (!response?.success || !isSchemaDocumentReady(response.data)) return null;
  return response.data;
};

export const hydrateProcessingMaterialValues = (
  schema: SchemaDocumentV2,
  sections: SchemaSectionSubmission[],
  context?: {
    materialId: number;
    materialCode: string;
    materialName: string;
    gradeId?: number | null;
    gradeCode?: string | null;
  },
): SchemaFormValues => {
  if (sections.length > 0) {
    const normalized = context
      ? normalizeProcessingSectionsForSchema(schema, sections, context)
      : sections;
    return hydrateValuesFromProcess(schema, normalized);
  }
  return createInitialValues(schema);
};

export const hydrateProcessingMaterialValuesFromSeed = (
  schema: SchemaDocumentV2,
  seed: QcProcessingMaterialSeed,
): SchemaFormValues =>
  hydrateProcessingMaterialValues(schema, seed.sections, {
    materialId: seed.materialId,
    materialCode: seed.materialCode,
    materialName: seed.materialName,
    gradeId: seed.gradeId,
    gradeCode: seed.gradeCode,
  });

export const buildProcessingMaterialEntry = (
  seed: QcProcessingMaterialSeed,
): QcDivisionEntry => {
  const schemaCacheKey = getQcProcessingMaterialSchemaCacheKey(seed);
  return {
    entryId: createProcessingEntryId(),
    flowKey: "RAW_MATERIAL",
    kind: "PROCESSING_MATERIAL",
    apiDivision: "RAW_MATERIAL_PROCESSING",
    subType: seed.processSlot === "liquid" ? "LIQUID_PROCESSING" : "SOLID_PROCESSING",
    label: getQcProcessingMaterialLabel(seed),
    premixNo: seed.premixNo,
    premixDate: seed.premixDate,
    materialId: seed.materialId,
    materialCode: seed.materialCode,
    materialName: seed.materialName,
    gradeId: seed.gradeId,
    gradeCode: seed.gradeCode,
    processSlot: seed.processSlot,
    schemaCacheKey,
    // Keep API-flat sections; normalize at hydrate time (same as RMP).
    savedSections: seed.sections,
  };
};

export const buildQcProcessingMaterialSubmission = (
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
  entry: QcDivisionEntry,
): SchemaProcessSubmission => ({
  materialId: Number(entry.materialId),
  materialCode: String(entry.materialCode ?? ""),
  materialName: String(entry.materialName ?? entry.materialCode ?? ""),
  gradeId: entry.gradeId ?? null,
  gradeCode: entry.gradeCode ?? null,
  schemaVersion: schema.schemaVersion || RMP_SCHEMA_VERSION,
  schemaType: schema.schemaType || RMP_SCHEMA_TYPE,
  sections: toSectionSubmissions(schema, values),
});

export type QcProcessingProcessApiPayload = {
  materialId: number;
  materialCode: string;
  materialName: string;
  gradeId?: number;
  gradeCode?: string;
  schemaVersion: string;
  schemaType: string;
  sections: Array<{ sectionId: string; sectionData: Record<string, unknown>[] }>;
};

export type QcProcessingPremixApiPayload = {
  premixNo: number;
  premixDate?: string;
  materialType: "SOLID" | "LIQUID" | "BOTH";
  premixSubmissionType?: "DRAFT" | "SUBMIT";
  solidProcess: QcProcessingProcessApiPayload[];
  liquidProcess: QcProcessingProcessApiPayload[];
};

const toApiProcessPayload = (process: SchemaProcessSubmission): QcProcessingProcessApiPayload => {
  const payload: QcProcessingProcessApiPayload = {
    materialId: Number(process.materialId ?? 0),
    materialCode: String(process.materialCode ?? "").trim(),
    materialName: String(process.materialName ?? process.materialCode ?? "").trim(),
    schemaVersion: process.schemaVersion || RMP_SCHEMA_VERSION,
    schemaType: process.schemaType || RMP_SCHEMA_TYPE,
    sections: normalizeSectionsForApiPayload(process.sections ?? []),
  };
  if (process.gradeId != null) payload.gradeId = Number(process.gradeId);
  const gradeCode = String(process.gradeCode ?? "").trim();
  if (gradeCode) payload.gradeCode = gradeCode;
  return payload;
};

/** Fallback when schema is not hydrated — keep material identity + any saved sections. */
const buildProcessingProcessFromEntry = (
  entry: QcDivisionEntry,
  sections: SchemaSectionSubmission[],
): QcProcessingProcessApiPayload =>
  toApiProcessPayload({
    materialId: Number(entry.materialId ?? 0),
    materialCode: String(entry.materialCode ?? "").trim(),
    materialName: String(entry.materialName ?? entry.materialCode ?? "").trim(),
    gradeId: entry.gradeId ?? null,
    gradeCode: entry.gradeCode ?? null,
    schemaVersion: RMP_SCHEMA_VERSION,
    schemaType: RMP_SCHEMA_TYPE,
    sections,
  });

export const deriveProcessingMaterialType = (
  solidCount: number,
  liquidCount: number,
): "SOLID" | "LIQUID" | "BOTH" => {
  if (solidCount > 0 && liquidCount > 0) return "BOTH";
  if (liquidCount > 0) return "LIQUID";
  return "SOLID";
};

/**
 * Create/update payload shape (same as Raw Material Preparation process sections):
 * data.premixes[{
 *   premixNo, premixDate?, materialType, premixSubmissionType?,
 *   solidProcess: [{ materialId, materialCode, materialName, gradeId, gradeCode, schemaVersion, schemaType, sections }],
 *   liquidProcess: [...]
 * }]
 */
export const buildProcessingPremixesPayload = (
  form: {
    schemasByKey?: Partial<Record<string, SchemaDocumentV2>>;
    divisionEntryValues?: Record<string, { schemaValues?: SchemaFormValues }>;
  },
  entries: QcDivisionEntry[],
  options?: { unitSubmissionType?: "DRAFT" | "SUBMIT" | null },
): QcProcessingPremixApiPayload[] => {
  const byPremix = new Map<number, QcDivisionEntry[]>();
  entries.forEach((entry) => {
    if (entry.kind !== "PROCESSING_MATERIAL" || entry.premixNo == null) return;
    const list = byPremix.get(entry.premixNo) ?? [];
    list.push(entry);
    byPremix.set(entry.premixNo, list);
  });

  return Array.from(byPremix.entries())
    .sort(([a], [b]) => a - b)
    .map(([premixNo, premixEntries]) => {
      const solidProcess: QcProcessingProcessApiPayload[] = [];
      const liquidProcess: QcProcessingProcessApiPayload[] = [];

      premixEntries.forEach((entry) => {
        const schemaKey = entry.schemaCacheKey;
        const schema = schemaKey ? form.schemasByKey?.[schemaKey] : null;
        const values = form.divisionEntryValues?.[entry.entryId]?.schemaValues ?? {};

        let process: QcProcessingProcessApiPayload;
        if (schema) {
          process = toApiProcessPayload(
            serializeProcessSubmissionForApi(
              buildQcProcessingMaterialSubmission(schema, values, entry),
              schema,
            ),
          );
        } else {
          process = buildProcessingProcessFromEntry(entry, entry.savedSections ?? []);
        }

        if (entry.processSlot === "liquid") {
          liquidProcess.push(process);
        } else {
          solidProcess.push(process);
        }
      });

      const premixDateRaw = String(premixEntries[0]?.premixDate ?? "").trim();
      const premixDate = premixDateRaw
        ? formatToIsoDateInput(premixDateRaw) || premixDateRaw
        : "";
      return {
        premixNo,
        ...(premixDate ? { premixDate } : {}),
        materialType: deriveProcessingMaterialType(solidProcess.length, liquidProcess.length),
        ...(options?.unitSubmissionType
          ? { premixSubmissionType: options.unitSubmissionType }
          : {}),
        solidProcess,
        liquidProcess,
      };
    });
};
