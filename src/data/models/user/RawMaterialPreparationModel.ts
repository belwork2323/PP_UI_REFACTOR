import type { MaterialsListItem } from "./MaterialsListModel";
import type {
  PreparationPremixEntry,
  PreparationProcessEntry,
} from "../../../schema-engine/adapters/rawMaterialPreparation.adapter";
import {
  buildProcessSubmission,
  derivePremixMaterialType,
  findGradeInMaterial,
  findMaterialInList,
} from "../../../schema-engine/adapters/rawMaterialPreparation.adapter";
import type {
  SchemaDocumentV2,
  SchemaFormValues,
  SchemaSectionSubmission,
} from "../../../schema-engine";
import { schemaValuesHaveUserData } from "../../../schema-engine/state/formState";

export type RawMaterialPreparationSubmitResponse = {
  formId: string;
  batchId: string;
  status: string;
};

export type RawMaterialPrepWeightmentDetail = {
  materialCode: string;
  materialName: string;
  percentage: string;
  weightTransferred: string;
  containerType: string;
  containerNumber: string;
  weighScaleNumber: string;
  weighingDateTime: string;
};

export type RawMaterialPrepWeightmentSheet = {
  mixerBuildingNumber: string;
  weightmentDetails: RawMaterialPrepWeightmentDetail[];
  validation: {
    compareWithIdentificationSheet: boolean;
    deviationFound: boolean;
    deviationMessage: string;
  };
};

export const createEmptyWeightmentDetail = (): RawMaterialPrepWeightmentDetail => ({
  materialCode: "",
  materialName: "",
  percentage: "",
  weightTransferred: "",
  containerType: "",
  containerNumber: "",
  weighScaleNumber: "",
  weighingDateTime: "",
});

export const createEmptyWeightmentSheet = (): RawMaterialPrepWeightmentSheet => ({
  mixerBuildingNumber: "",
  weightmentDetails: [],
  validation: {
    compareWithIdentificationSheet: false,
    deviationFound: false,
    deviationMessage: "",
  },
});

const formatDateTimeLocal = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) return raw;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw.slice(0, 16);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const unwrapApiScalar = (value: unknown): unknown => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if ("parsedValue" in obj && obj.parsedValue !== undefined) return obj.parsedValue;
    if ("source" in obj && obj.source !== undefined && obj.source !== "") return obj.source;
  }
  return value;
};

const mapWeightmentDetailFromApi = (row: Record<string, unknown>): RawMaterialPrepWeightmentDetail => ({
  materialCode: String(row.materialCode ?? ""),
  materialName: String(row.materialName ?? row.materialCode ?? ""),
  percentage: unwrapApiScalar(row.percentage) != null ? String(unwrapApiScalar(row.percentage)) : "",
  weightTransferred:
    unwrapApiScalar(row.weightTransferred) != null ? String(unwrapApiScalar(row.weightTransferred)) : "",
  containerType: String(row.containerType ?? ""),
  containerNumber: String(row.containerNumber ?? ""),
  weighScaleNumber: String(row.weighScaleNumber ?? ""),
  weighingDateTime: formatDateTimeLocal(row.weighingDateTime),
});

export const mapWeightmentSheetFromApi = (value: unknown): RawMaterialPrepWeightmentSheet => {
  if (!value || typeof value !== "object") return createEmptyWeightmentSheet();

  const sheet = value as Record<string, unknown>;
  const validation = (sheet.validation ?? {}) as Record<string, unknown>;
  const rows = Array.isArray(sheet.weightmentDetails) ? sheet.weightmentDetails : [];

  return {
    mixerBuildingNumber: String(sheet.mixerBuildingNumber ?? ""),
    weightmentDetails: rows.map((row) => mapWeightmentDetailFromApi(row as Record<string, unknown>)),
    validation: {
      compareWithIdentificationSheet: Boolean(validation.compareWithIdentificationSheet),
      deviationFound: Boolean(validation.deviationFound),
      deviationMessage: String(validation.deviationMessage ?? ""),
    },
  };
};

export const mapWeightmentSheetToApi = (sheet: RawMaterialPrepWeightmentSheet | null | undefined) => {
  if (!sheet) return null;

  const rows = (sheet.weightmentDetails ?? []).filter(
    (row) =>
      row.materialCode.trim() ||
      row.materialName.trim() ||
      row.weightTransferred.trim() ||
      row.percentage.trim(),
  );

  if (!sheet.mixerBuildingNumber.trim() && rows.length === 0) {
    return null;
  }

  return {
    mixerBuildingNumber: sheet.mixerBuildingNumber.trim() || null,
    weightmentDetails: rows.map((row) => ({
      materialCode: row.materialCode.trim(),
      materialName: row.materialName.trim() || row.materialCode.trim(),
      percentage: row.percentage.trim() ? Number(row.percentage) : null,
      weightTransferred: row.weightTransferred.trim() ? Number(row.weightTransferred) : null,
      containerType: row.containerType.trim() || null,
      containerNumber: row.containerNumber.trim() || null,
      weighScaleNumber: row.weighScaleNumber.trim() || null,
      weighingDateTime: row.weighingDateTime.trim() || null,
    })),
    validation: {
      compareWithIdentificationSheet: sheet.validation.compareWithIdentificationSheet,
      deviationFound: sheet.validation.deviationFound,
      deviationMessage: sheet.validation.deviationMessage.trim() || null,
    },
  };
};

export type RawMaterialPrepPremixSelection = {
  premix: number;
  selectedProcesses: { solid: boolean; liquid: boolean };
  solidMaterialCode: string;
  solidGradeCode: string;
  solidMaterialId?: number;
  solidGradeId?: number;
  liquidMaterialCode: string;
  liquidMaterialId?: number;
};

export type RawMaterialPrepMaterialSchemaSlot = {
  schema: SchemaDocumentV2 | null;
  schemaLoading: boolean;
  schemaError: string | null;
  formValues: SchemaFormValues;
};

export type RawMaterialPrepPremixSession = {
  selectedProcesses: { solid: boolean; liquid: boolean };
  solidMaterialCode: string;
  solidGradeCode: string;
  liquidMaterialCode: string;
  solid: RawMaterialPrepMaterialSchemaSlot;
  liquid: RawMaterialPrepMaterialSchemaSlot;
  pendingSolidSections?: SchemaSectionSubmission[];
  pendingLiquidSections?: SchemaSectionSubmission[];
};

export type RawMaterialPreparationDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  status?: string;
  createdBy?: string | null;
  createdAt?: string | null;
  preparationDetails?: {
    premixes?: Array<{
      premixNo: number;
      materialType: string;
      solidProcess?: PreparationProcessEntry[];
      liquidProcess?: PreparationProcessEntry[];
    }>;
    weightmentSheet?: unknown;
  };
};

const emptySlot = (): RawMaterialPrepMaterialSchemaSlot => ({
  schema: null,
  schemaLoading: false,
  schemaError: null,
  formValues: {},
});

export const createEmptyPremixSchemaSession = (): RawMaterialPrepPremixSession => ({
  selectedProcesses: { solid: false, liquid: false },
  solidMaterialCode: "",
  solidGradeCode: "",
  liquidMaterialCode: "",
  solid: emptySlot(),
  liquid: emptySlot(),
});

const resolveMaterialNameFallback = (
  schema: SchemaDocumentV2 | null,
  material: MaterialsListItem | undefined,
  materialCode: string,
): string => {
  const root = schema as (SchemaDocumentV2 & {
    rawMaterialDetails?: { materialName?: string };
    materialName?: string;
  }) | null;

  return (
    root?.rawMaterialDetails?.materialName
    ?? root?.materialName
    ?? material?.materialName
    ?? materialCode
  );
};

const buildProcessForSlot = (
  schema: SchemaDocumentV2 | null,
  values: SchemaFormValues,
  material: MaterialsListItem | undefined,
  gradeCode: string,
  fallback?: { materialId?: number; materialCode?: string; materialName?: string; gradeId?: number }
): PreparationProcessEntry | null => {
  if (!schema || !schemaValuesHaveUserData(values)) return null;

  const resolvedMaterial: MaterialsListItem | undefined =
    material ??
    (fallback?.materialId && fallback.materialCode
      ? {
          materialId: fallback.materialId,
          materialCode: fallback.materialCode,
          materialName: fallback.materialName ?? fallback.materialCode,
          specCount: 0,
          grades: [],
        }
      : undefined);

  if (!resolvedMaterial) return null;

  const grade =
    findGradeInMaterial(resolvedMaterial, gradeCode) ??
    (fallback?.gradeId
      ? {
          gradeId: fallback.gradeId,
          gradeCode,
          gradeName: gradeCode,
        }
      : undefined);

  return buildProcessSubmission(schema, values, resolvedMaterial, grade ?? null);
};

export const mapPreparationDetailsPayload = (params: {
  addedPremixSelections: RawMaterialPrepPremixSelection[];
  premixSessions: Record<number, RawMaterialPrepPremixSession>;
  solidMaterials: MaterialsListItem[];
  liquidMaterials: MaterialsListItem[];
  weightmentSheet?: RawMaterialPrepWeightmentSheet | null;
}) => {
  const premixes: PreparationPremixEntry[] = [];

  params.addedPremixSelections.forEach((entry) => {
    const session = params.premixSessions[entry.premix] ?? createEmptyPremixSchemaSession();
    const solidMaterial = findMaterialInList(params.solidMaterials, entry.solidMaterialCode);
    const liquidMaterial = findMaterialInList(params.liquidMaterials, entry.liquidMaterialCode);

    const solidProcess: PreparationProcessEntry[] = [];
    const liquidProcess: PreparationProcessEntry[] = [];

    if (entry.selectedProcesses.solid) {
      const process = buildProcessForSlot(
        session.solid.schema,
        session.solid.formValues,
        solidMaterial,
        entry.solidGradeCode,
        {
          materialId: entry.solidMaterialId,
          materialCode: entry.solidMaterialCode,
          materialName: resolveMaterialNameFallback(
            session.solid.schema,
            solidMaterial,
            entry.solidMaterialCode,
          ),
          gradeId: entry.solidGradeId,
        }
      );
      if (process) solidProcess.push(process);
    }

    if (entry.selectedProcesses.liquid) {
      const process = buildProcessForSlot(
        session.liquid.schema,
        session.liquid.formValues,
        liquidMaterial,
        "",
        {
          materialId: entry.liquidMaterialId,
          materialCode: entry.liquidMaterialCode,
          materialName: resolveMaterialNameFallback(
            session.liquid.schema,
            liquidMaterial,
            entry.liquidMaterialCode,
          ),
        }
      );
      if (process) liquidProcess.push(process);
    }

    if (solidProcess.length === 0 && liquidProcess.length === 0) return;

    premixes.push({
      premixNo: entry.premix,
      materialType: derivePremixMaterialType(entry),
      solidProcess,
      liquidProcess,
    });
  });

  return {
    preparationDetails: {
      premixes,
      weightmentSheet: mapWeightmentSheetToApi(params.weightmentSheet),
    },
  };
};

export const mapPreparationDetailsFromApi = (
  details: RawMaterialPreparationDetails
): {
  addedPremixSelections: RawMaterialPrepPremixSelection[];
  premixSessions: Record<number, RawMaterialPrepPremixSession>;
  weightmentSheet: RawMaterialPrepWeightmentSheet;
} => {
  const premixes = details.preparationDetails?.premixes ?? [];
  const addedPremixSelections: RawMaterialPrepPremixSelection[] = [];
  const premixSessions: Record<number, RawMaterialPrepPremixSession> = {};

  premixes.forEach((premix) => {
    const premixNo = Number(premix.premixNo ?? 0);
    if (!premixNo) return;

    const solidEntry = premix.solidProcess?.[0];
    const liquidEntry = premix.liquidProcess?.[0];
    const hasSolid = (premix.solidProcess?.length ?? 0) > 0;
    const hasLiquid = (premix.liquidProcess?.length ?? 0) > 0;

    addedPremixSelections.push({
      premix: premixNo,
      selectedProcesses: { solid: hasSolid, liquid: hasLiquid },
      solidMaterialCode: solidEntry?.materialCode ?? "",
      solidGradeCode: solidEntry?.gradeCode ?? "",
      solidMaterialId: solidEntry?.materialId,
      solidGradeId: solidEntry?.gradeId ?? undefined,
      liquidMaterialCode: liquidEntry?.materialCode ?? "",
      liquidMaterialId: liquidEntry?.materialId,
    });

    premixSessions[premixNo] = {
      ...createEmptyPremixSchemaSession(),
      selectedProcesses: { solid: hasSolid, liquid: hasLiquid },
      solidMaterialCode: solidEntry?.materialCode ?? "",
      solidGradeCode: solidEntry?.gradeCode ?? "",
      liquidMaterialCode: liquidEntry?.materialCode ?? "",
      pendingSolidSections: solidEntry?.sections,
      pendingLiquidSections: liquidEntry?.sections,
    };
  });

  return {
    addedPremixSelections,
    premixSessions,
    weightmentSheet: mapWeightmentSheetFromApi(details.preparationDetails?.weightmentSheet),
  };
};

export const premixSessionHasData = (session: RawMaterialPrepPremixSession) => {
  const solidFilled =
    session.selectedProcesses.solid && schemaValuesHaveUserData(session.solid.formValues);
  const liquidFilled =
    session.selectedProcesses.liquid && schemaValuesHaveUserData(session.liquid.formValues);
  return solidFilled || liquidFilled;
};

export class RawMaterialPreparationSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(data: Partial<RawMaterialPreparationSubmitResponse> = {}) {
    this.formId = data.formId ?? "";
    this.batchId = data.batchId ?? "";
    this.status = data.status ?? "";
  }

  static fromApi(apiResponse: any) {
    const data = apiResponse?.data ?? apiResponse;
    return new RawMaterialPreparationSubmitResponseModel({
      formId: data?.formId,
      batchId: data?.batchId,
      status: data?.status,
    });
  }
}

const mapPrepPersonFromApi = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    const person = value as { fullName?: string; name?: string; id?: string };
    return String(person.fullName ?? person.name ?? person.id ?? "").trim();
  }
  return String(value).trim();
};

export class RawMaterialPreparationDetailsModel {
  static fromApi(apiResponse: any): RawMaterialPreparationDetails {
    const data = apiResponse?.data ?? apiResponse;
    return {
      formId: String(data?.formId ?? ""),
      batchId: String(data?.batchId ?? ""),
      subDepartmentId: Number(data?.subDepartmentId ?? 0),
      formSubmissionType: String(data?.formSubmissionType ?? ""),
      status: data?.status != null ? String(data.status) : undefined,
      createdBy: mapPrepPersonFromApi(data?.createdBy) || null,
      createdAt: data?.createdAt != null ? String(data.createdAt) : null,
      preparationDetails: data?.preparationDetails ?? { premixes: [] },
    };
  }
}

export type RawMaterialPrepApproverSectionView = {
  sectionId: string;
  sectionData: Record<string, unknown>[];
};

export type RawMaterialPrepApproverProcessView = {
  materialCode: string;
  materialName: string;
  gradeCode: string | null;
  sections: RawMaterialPrepApproverSectionView[];
};

export type RawMaterialPrepApproverPremixView = {
  premixNo: number;
  materialType: string;
  solidProcesses: RawMaterialPrepApproverProcessView[];
  liquidProcesses: RawMaterialPrepApproverProcessView[];
};

export type RawMaterialPrepApproverDetailView = {
  formId: string;
  batchId: string;
  formSubmissionType: string;
  createdBy?: string | null;
  createdAt?: string | null;
  premixes: RawMaterialPrepApproverPremixView[];
  weightmentSheet: Record<string, unknown> | null;
};

const PREP_SECTION_ACRONYMS = new Set([
  "AP",
  "PSD",
  "RVD",
  "TDI",
  "HTPB",
  "DOA",
  "IO",
  "CC",
  "NA",
  "Kg",
  "ID",
]);

const titleCasePrepToken = (token: string): string => {
  const trimmed = token.trim();
  if (!trimmed) return "";
  const upper = trimmed.toUpperCase();
  if (PREP_SECTION_ACRONYMS.has(upper)) return upper;
  if (/^\d+$/.test(trimmed)) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

/** Human-readable label from schema section / field ids (FEED_MATERIAL_DETAILS → Feed Material Details). */
export const formatPrepSectionLabel = (sectionId: string): string => {
  const raw = String(sectionId ?? "").trim();
  if (!raw) return "";

  const knownLabels: Record<string, string> = {
    srNo: "Sr No.",
  };
  if (knownLabels[raw]) return knownLabels[raw];

  const words = raw
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  return words.map(titleCasePrepToken).join(" ");
};

export const formatPrepSectionCellValue = (value: unknown): string => {
  const unwrapped = unwrapApiScalar(value);
  if (unwrapped === null || unwrapped === undefined || unwrapped === "") return "—";
  if (typeof unwrapped === "object") {
    if (Array.isArray(unwrapped)) {
      return unwrapped.length > 0
        ? unwrapped.map((entry) => formatPrepSectionCellValue(entry)).join(", ")
        : "—";
    }
    const entries = Object.entries(unwrapped as Record<string, unknown>).filter(
      ([key, entryValue]) =>
        !key.startsWith("_") &&
        entryValue !== null &&
        entryValue !== undefined &&
        entryValue !== "",
    );
    if (entries.length === 0) return "—";
    return entries
      .map(([key, entryValue]) => `${formatPrepSectionLabel(key)}: ${formatPrepSectionCellValue(entryValue)}`)
      .join("; ");
  }
  return String(unwrapped);
};

/** Expand nested repeat/table blocks (e.g. FEED_LOTS) into flat table rows for read-only views. */
export const expandRawMaterialPrepSectionRows = (
  sectionData: Record<string, unknown>[] | undefined,
): Record<string, unknown>[] => {
  if (!Array.isArray(sectionData)) return [];

  const rows: Record<string, unknown>[] = [];

  sectionData.forEach((dataRow) => {
    if (!dataRow || typeof dataRow !== "object") return;

    const entries = Object.entries(dataRow).filter(([key]) => !key.startsWith("_"));
    const arrayEntries = entries.filter(([, value]) => Array.isArray(value));
    const scalarEntries = entries.filter(([, value]) => !Array.isArray(value));

    if (arrayEntries.length === 1 && scalarEntries.length === 0) {
      (arrayEntries[0][1] as unknown[]).forEach((item) => {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          rows.push(item as Record<string, unknown>);
        }
      });
      return;
    }

    rows.push(dataRow);
  });

  return rows;
};

const mapProcessSections = (process: PreparationProcessEntry): RawMaterialPrepApproverProcessView => ({
  materialCode: String(process.materialCode ?? ""),
  materialName: String(process.materialName ?? process.materialCode ?? ""),
  gradeCode: process.gradeCode ?? null,
  sections: (process.sections ?? []).map((section) => ({
    sectionId: String(section.sectionId ?? ""),
    sectionData: Array.isArray(section.sectionData)
      ? (section.sectionData as Record<string, unknown>[])
      : [],
  })),
});

export const mapRawMaterialPreparationApproverDetailView = (
  details: RawMaterialPreparationDetails,
): RawMaterialPrepApproverDetailView => ({
  formId: details.formId,
  batchId: details.batchId,
  formSubmissionType: details.formSubmissionType,
  createdBy: details.createdBy ?? null,
  createdAt: details.createdAt ?? null,
  premixes: (details.preparationDetails?.premixes ?? []).map((premix) => ({
    premixNo: Number(premix.premixNo ?? 0),
    materialType: String(premix.materialType ?? ""),
    solidProcesses: (premix.solidProcess ?? []).map(mapProcessSections),
    liquidProcesses: (premix.liquidProcess ?? []).map(mapProcessSections),
  })),
  weightmentSheet:
    details.preparationDetails?.weightmentSheet &&
    typeof details.preparationDetails.weightmentSheet === "object"
      ? (details.preparationDetails.weightmentSheet as Record<string, unknown>)
      : null,
});

/** Preferred column order for schema-driven section tables (srNo, lot, operation, …). */
export const orderPrepSectionColumns = (columns: string[]): string[] => {
  const priority = ["srNo", "LOT_NUMBER", "OPERATION", "BIN_NUMBER", "PSD_REQUIREMENT"];
  return [...columns].sort((a, b) => {
    const ai = priority.indexOf(a);
    const bi = priority.indexOf(b);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.localeCompare(b);
  });
};

/** Single entry point for user + approver detail views. */
export const mapRawMaterialPreparationDetailsForDisplay = (
  details: RawMaterialPreparationDetails | null | undefined,
) => {
  if (!details) {
    return {
      detailView: null as RawMaterialPrepApproverDetailView | null,
      weightmentSheet: createEmptyWeightmentSheet(),
    };
  }

  const detailView = mapRawMaterialPreparationApproverDetailView(details);
  const weightmentSheet = mapWeightmentSheetFromApi(
    detailView.weightmentSheet ?? details.preparationDetails?.weightmentSheet,
  );

  return { detailView, weightmentSheet };
};
