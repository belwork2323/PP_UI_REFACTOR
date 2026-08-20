import {
  getQcSchemaTypeForDivision,
  type QcApiDivision,
  type QcApiSubType,
} from "../../../schema-engine/adapters/qc.adapter";
import {
  isBothProcessingType,
  isPremixProcessingFlow,
  isRawMaterialProcessingType,
  isRawMaterialRevalidationType,
  type QcProcessingSlot,
} from "./qcProcessingConfig";

export type QcDivisionOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type QcRawMaterialTypeOption = {
  value: string;
  label: string;
};

export type QcProcessingTypeOption = {
  value: string;
  label: string;
  division: QcApiDivision;
  subType: QcApiSubType;
};

export type QCBatch = {
  id: number | string;
  lotId: string;
  batchId: string;
  motorId: string;
  motorIds?: string[];
  motorType: string;
  priority: string;
  assignedTo: { fullName: string } | null;
  createdOn: string;
  qcStatus: string;
  formId?: string | null;
  division?: QcApiDivision | null;
  subType?: QcApiSubType;
  rejectionReason?: string | null;
};

export const QC_DIVISION_OPTIONS: QcDivisionOption[] = [
  { value: "RAW_MATERIAL", label: "Raw Material" },
  { value: "MIXING", label: "Mixing" },
  { value: "HARDWARE", label: "Hardware" },
  { value: "CASTING", label: "Casting" },
  { value: "CURING", label: "Curing" },
  { value: "DE_CORING", label: "De-coring" },
  { value: "TRIMMING", label: "Trimming" },
  { value: "POST_CURE", label: "Post Cure" },
  { value: "NDT", label: "NDT" },
  { value: "QC", label: "QC" },
  { value: "WEIGHTMENT", label: "Weighment" },
  { value: "STATIC_TEST_FACILITY", label: "Static Test Facility", disabled: true },
];

export const QC_RAW_MATERIAL_TYPE_OPTIONS: QcRawMaterialTypeOption[] = [
  { value: "RAW_MATERIAL_REVALIDATION", label: "Raw Material Revalidation" },
  { value: "RAW_MATERIAL_PROCESSING", label: "Raw Material Processing" },
];

/** Known flow-key aliases from API divisionName / type names. */
const QC_DIVISION_NAME_TO_FLOW_KEY: Record<string, string> = {
  rawmaterial: "RAW_MATERIAL",
  mixing: "MIXING",
  hardware: "HARDWARE",
  casting: "CASTING",
  curing: "CURING",
  decorating: "DE_CORING",
  decoring: "DE_CORING",
  trimming: "TRIMMING",
  postcure: "POST_CURE",
  ndt: "NDT",
  qc: "QC",
  weightment: "WEIGHTMENT",
  weighment: "WEIGHTMENT",
  statictestfacility: "STATIC_TEST_FACILITY",
};

const QC_TYPE_NAME_TO_VALUE: Record<string, string> = {
  rawmaterialrevalidation: "RAW_MATERIAL_REVALIDATION",
  rawmaterialprocessing: "RAW_MATERIAL_PROCESSING",
};

const normalizeQcNameKey = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

export type QcDivisionCatalogType = {
  divisionId: number;
  divisionName: string;
  disabled: boolean;
  value: string;
  label: string;
};

export type QcDivisionCatalogItem = {
  divisionId: number;
  divisionName: string;
  disabled: boolean;
  value: string;
  label: string;
  types: QcDivisionCatalogType[];
};

const resolveDivisionFlowKey = (divisionName: string): string => {
  const normalized = normalizeQcNameKey(divisionName);
  if (QC_DIVISION_NAME_TO_FLOW_KEY[normalized]) {
    return QC_DIVISION_NAME_TO_FLOW_KEY[normalized];
  }
  const byLabel = QC_DIVISION_OPTIONS.find(
    (option) => normalizeQcNameKey(option.label) === normalized,
  );
  if (byLabel) return byLabel.value;
  return String(divisionName ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");
};

const resolveTypeValue = (typeName: string): string => {
  const normalized = normalizeQcNameKey(typeName);
  if (QC_TYPE_NAME_TO_VALUE[normalized]) return QC_TYPE_NAME_TO_VALUE[normalized];
  const byLabel = QC_RAW_MATERIAL_TYPE_OPTIONS.find(
    (option) => normalizeQcNameKey(option.label) === normalized,
  );
  if (byLabel) return byLabel.value;
  return String(typeName ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "");
};

/** Map GET /user/qc-division/divisions into UI dropdown catalog. */
export const mapQcDivisionsFromApi = (payload: unknown): QcDivisionCatalogItem[] => {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown })?.data)
      ? ((payload as { data: unknown[] }).data)
      : [];

  return rows
    .map((row) => {
      const entry = row as {
        divisionId?: number;
        divisionName?: string;
        disabled?: boolean;
        types?: Array<{
          divisionId?: number;
          divisionName?: string;
          disabled?: boolean;
        }>;
      };
      const divisionName = String(entry.divisionName ?? "").trim();
      if (!divisionName) return null;

      const value = resolveDivisionFlowKey(divisionName);
      if (!value) return null;

      const types = (Array.isArray(entry.types) ? entry.types : [])
        .map((typeRow) => {
          const typeName = String(typeRow?.divisionName ?? "").trim();
          if (!typeName) return null;
          const typeValue = resolveTypeValue(typeName);
          if (!typeValue) return null;
          return {
            divisionId: Number(typeRow?.divisionId ?? 0),
            divisionName: typeName,
            disabled: Boolean(typeRow?.disabled),
            value: typeValue,
            label: typeName,
          } satisfies QcDivisionCatalogType;
        })
        .filter((type): type is QcDivisionCatalogType => Boolean(type));

      return {
        divisionId: Number(entry.divisionId ?? 0),
        divisionName,
        disabled: Boolean(entry.disabled),
        value,
        label: divisionName,
        types,
      } satisfies QcDivisionCatalogItem;
    })
    .filter((item): item is QcDivisionCatalogItem => Boolean(item));
};

export const toQcDivisionSelectOptions = (
  catalog: QcDivisionCatalogItem[] | undefined,
): QcDivisionOption[] =>
  (catalog ?? []).map((item) => ({
    value: item.value,
    label: item.label,
    disabled: item.disabled,
  }));

/** Flattened division tab for always-visible catalog navigation. */
export type QcDivisionCatalogNavTab = {
  /** Unique tab id (type value when nested, otherwise flow key). */
  tabKey: string;
  /** Parent flow key used by registry / entries (e.g. RAW_MATERIAL, MIXING). */
  flowKey: string;
  /** Nested type value when the tab comes from parent.types (e.g. RAW_MATERIAL_REVALIDATION). */
  rawMaterialType: string;
  label: string;
  divisionId: number;
};

/**
 * Flatten GET /divisions into enabled top-level tabs.
 * Parents with nested types become separate tabs (no parent tab).
 * Disabled parents/types are omitted.
 */
export const toQcDivisionNavTabs = (
  catalog: QcDivisionCatalogItem[] | undefined,
): QcDivisionCatalogNavTab[] => {
  const tabs: QcDivisionCatalogNavTab[] = [];
  for (const item of catalog ?? []) {
    if (item.disabled) continue;
    const enabledTypes = (item.types ?? []).filter((type) => !type.disabled);
    if (enabledTypes.length) {
      for (const type of enabledTypes) {
        tabs.push({
          tabKey: type.value,
          flowKey: item.value,
          rawMaterialType: type.value,
          label: type.label,
          divisionId: type.divisionId,
        });
      }
      continue;
    }
    tabs.push({
      tabKey: item.value,
      flowKey: item.value,
      rawMaterialType: "",
      label: item.label,
      divisionId: item.divisionId,
    });
  }
  return tabs;
};

export const resolveQcRawMaterialTypeOptions = (
  catalog: QcDivisionCatalogItem[] | undefined,
  selectedDivision: string,
): QcRawMaterialTypeOption[] => {
  const selected = (catalog ?? []).find((item) => item.value === selectedDivision);
  if (selected?.types?.length) {
    return selected.types
      .filter((type) => !type.disabled)
      .map((type) => ({ value: type.value, label: type.label }));
  }
  if (selectedDivision === "RAW_MATERIAL") return QC_RAW_MATERIAL_TYPE_OPTIONS;
  return [];
};

/**
 * Resolve the numeric divisionId for division-details auto-populate.
 * - Division with `types`: use the selected type's divisionId (e.g. 101 / 102).
 * - Division without types: use the parent divisionId (e.g. Mixing → 2).
 * Returns null when a typed division is selected but no type is chosen yet.
 */
export const resolveQcDivisionIdForSelection = (
  catalog: QcDivisionCatalogItem[] | undefined,
  selectedDivision: string,
  selectedTypeValue?: string | null,
): number | null => {
  const division = (catalog ?? []).find((item) => item.value === selectedDivision);
  if (!division) return null;

  if (division.types.length > 0) {
    const typeValue = String(selectedTypeValue ?? "").trim();
    if (!typeValue) return null;
    const type = division.types.find((entry) => entry.value === typeValue);
    const typeId = Number(type?.divisionId ?? 0);
    return typeId > 0 ? typeId : null;
  }

  const parentId = Number(division.divisionId ?? 0);
  return parentId > 0 ? parentId : null;
};

/**
 * Manufacturing `/qc-division/division-details` divisionId for auto-populate.
 * De-coring QC reads curing manufacturing data — use the Curing division id, not De-coring.
 */
export const resolveQcManufacturingDivisionDetailsId = (
  catalog: QcDivisionCatalogItem[] | undefined,
  selectedDivision: string,
  selectedTypeValue?: string | null,
): number | null => {
  const flowKey = String(selectedDivision ?? "").trim();
  if (flowKey === "DE_CORING") {
    return resolveQcDivisionIdForSelection(catalog, "CURING", null);
  }
  return resolveQcDivisionIdForSelection(catalog, selectedDivision, selectedTypeValue);
};

const normalizeQcDivisionLookupKey = (value: string | null | undefined) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

/** Flat map of API division keys → numeric divisionId from GET /qc-division/divisions. */
export const buildQcDivisionIdByApiKey = (
  catalog: QcDivisionCatalogItem[] | undefined,
): Record<string, number> => {
  const map: Record<string, number> = {};
  const put = (key: string | null | undefined, id: number) => {
    const normalized = normalizeQcDivisionLookupKey(key);
    if (!normalized || !(id > 0)) return;
    map[normalized] = id;
    // Also keep original casing key for direct lookups.
    const raw = String(key ?? "").trim();
    if (raw) map[raw] = id;
  };

  for (const tab of toQcDivisionNavTabs(catalog)) {
    put(tab.tabKey, tab.divisionId);
    if (tab.rawMaterialType) {
      put(tab.rawMaterialType, tab.divisionId);
    } else {
      put(tab.flowKey, tab.divisionId);
    }
  }

  for (const item of catalog ?? []) {
    if (!(item.types ?? []).length) {
      put(item.value, item.divisionId);
      put(item.divisionName, item.divisionId);
    }
    for (const type of item.types ?? []) {
      put(type.value, type.divisionId);
      put(type.divisionName, type.divisionId);
    }
  }

  // Alias: PROPELLANT_PROPERTIES ↔ QC
  const qcId = map.QC ?? map.PROPELLANT_PROPERTIES;
  if (qcId) {
    map.QC = qcId;
    map.PROPELLANT_PROPERTIES = qcId;
    map.PROPELLANT = qcId;
  }

  return map;
};

/**
 * Resolve numeric divisionId from catalog using an API division key
 * (e.g. RAW_MATERIAL_REVALIDATION, MIXING, HARDWARE, PROPELLANT_PROPERTIES).
 */
export const resolveQcDivisionIdFromApiDivision = (
  catalog: QcDivisionCatalogItem[] | undefined,
  apiDivision: string | null | undefined,
): number | null => {
  const wanted = normalizeQcDivisionLookupKey(apiDivision);
  if (!wanted) return null;

  const fromMap = buildQcDivisionIdByApiKey(catalog);
  const mapped =
    Number(fromMap[wanted] ?? 0) ||
    Number(fromMap[String(apiDivision ?? "").trim()] ?? 0);
  if (mapped > 0) return mapped;

  // Flow-key aliases (QC ↔ PROPELLANT_PROPERTIES) when map missed them
  if (wanted === "PROPELLANT_PROPERTIES" || wanted === "PROPELLANT") {
    return (
      resolveQcDivisionIdFromApiDivision(catalog, "QC") ??
      resolveQcDivisionIdForSelection(catalog, "QC")
    );
  }
  if (wanted === "QC") {
    const byFlow = resolveQcDivisionIdForSelection(catalog, "QC");
    if (byFlow) return byFlow;
  }

  return null;
};

export const QC_PROCESSING_TYPE_OPTIONS: QcProcessingTypeOption[] = [
  {
    value: "SOLID_PROCESSING",
    label: "Solid",
    division: "RAW_MATERIAL_PROCESSING",
    subType: "SOLID_PROCESSING",
  },
  {
    value: "LIQUID_PROCESSING",
    label: "Liquid",
    division: "RAW_MATERIAL_PROCESSING",
    subType: "LIQUID_PROCESSING",
  },
  {
    value: "BOTH",
    label: "Both",
    division: "RAW_MATERIAL_PROCESSING",
    subType: null,
  },
];

/** @deprecated Use QC_RAW_MATERIAL_TYPE_OPTIONS + QC_PROCESSING_TYPE_OPTIONS */
export const QC_RAW_MATERIAL_SUB_TYPE_OPTIONS = [
  {
    value: "RAW_MATERIAL_REVALIDATION",
    label: "Raw Material Revalidation",
    division: "RAW_MATERIAL_REVALIDATION" as QcApiDivision,
    subType: null as QcApiSubType,
  },
  ...QC_PROCESSING_TYPE_OPTIONS.filter((option) => option.value !== "BOTH"),
];

export const QC_FLOW_LABELS = {
  division: "Division",
  divisionPlaceholder: "Select division",
  rawMaterialType: "Raw Material Type",
  rawMaterialTypePlaceholder: "Select raw material type",
  processingType: "Processing Type",
  processingTypePlaceholder: "Select solid, liquid, or both",
  processingSlot: "Add Premix For",
  processingSlotPlaceholder: "Select process",
  loadForm: "Load Form",
  loadingSchema: "Loading schema...",
};

export const getQcSchemaCacheKey = (
  division: QcApiDivision,
  subType: QcApiSubType,
  inhibitorType?: string | null,
) => {
  if (division === "POST_CURE" && subType === "INHIBITION" && inhibitorType) {
    return `${getQcSchemaTypeForDivision(division)}:${division}:${subType}:${inhibitorType}`;
  }
  return `${getQcSchemaTypeForDivision(division)}:${division}:${subType ?? "NONE"}`;
};

export const resolveQcSchemaSelectionForSlot = (
  slot: QcProcessingSlot,
): { division: QcApiDivision; subType: QcApiSubType } => ({
  division: "RAW_MATERIAL_PROCESSING",
  subType: slot,
});

export const resolveQcSchemaSelection = (
  division: string,
  rawMaterialType: string,
  processingType = "",
): { division: QcApiDivision; subType: QcApiSubType } | null => {
  if (division !== "RAW_MATERIAL" || !rawMaterialType) return null;

  if (isRawMaterialRevalidationType(rawMaterialType)) {
    return { division: "RAW_MATERIAL_REVALIDATION", subType: null };
  }

  if (!isRawMaterialProcessingType(rawMaterialType) || !processingType || isBothProcessingType(processingType)) {
    return null;
  }

  const option = QC_PROCESSING_TYPE_OPTIONS.find((item) => item.value === processingType);
  if (!option) return null;
  return { division: option.division, subType: option.subType };
};

export const resolveBatchFlowSelection = (
  division?: QcApiDivision | null,
  subType?: QcApiSubType,
): { rawMaterialType: string; processingType: string } => {
  if (division === "RAW_MATERIAL_REVALIDATION") {
    return { rawMaterialType: "RAW_MATERIAL_REVALIDATION", processingType: "" };
  }
  if (division === "RAW_MATERIAL_PROCESSING") {
    if (subType === "SOLID_PROCESSING") {
      return { rawMaterialType: "RAW_MATERIAL_PROCESSING", processingType: "SOLID_PROCESSING" };
    }
    if (subType === "LIQUID_PROCESSING") {
      return { rawMaterialType: "RAW_MATERIAL_PROCESSING", processingType: "LIQUID_PROCESSING" };
    }
  }
  return { rawMaterialType: "", processingType: "" };
};

export const canLoadQcForm = (
  division: string,
  rawMaterialType: string,
  processingType: string,
  options?: {
    selectedPremix?: number | "";
    addedPremixNumbers?: number[];
    premixSlot?: QcProcessingSlot;
  },
) => {
  if (division !== "RAW_MATERIAL" || !rawMaterialType) return false;

  if (isRawMaterialRevalidationType(rawMaterialType)) {
    return Boolean(resolveQcSchemaSelection(division, rawMaterialType));
  }

  if (!isRawMaterialProcessingType(rawMaterialType) || !processingType) return false;

  if (!isPremixProcessingFlow(rawMaterialType, processingType)) return false;

  if (options?.selectedPremix === "" || options?.selectedPremix == null) return false;
  return !options.addedPremixNumbers?.includes(Number(options.selectedPremix));
};

export const resolveFlowTypeLabel = (rawMaterialType: string, processingType: string) => {
  const rawMaterialLabel = QC_RAW_MATERIAL_TYPE_OPTIONS.find((option) => option.value === rawMaterialType)?.label;
  if (!rawMaterialLabel) return "";

  if (!isRawMaterialProcessingType(rawMaterialType)) return rawMaterialLabel;

  const processingLabel = QC_PROCESSING_TYPE_OPTIONS.find((option) => option.value === processingType)?.label;
  return processingLabel ? `${rawMaterialLabel} · ${processingLabel}` : rawMaterialLabel;
};
