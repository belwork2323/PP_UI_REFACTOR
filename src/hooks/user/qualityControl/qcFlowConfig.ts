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
  { value: "WEIGHTMENT", label: "Weightment" },
  { value: "STATIC_TEST_FACILITY", label: "Static Test Facility" },
];

export const QC_RAW_MATERIAL_TYPE_OPTIONS: QcRawMaterialTypeOption[] = [
  { value: "RAW_MATERIAL_REVALIDATION", label: "Raw Material Revalidation" },
  { value: "RAW_MATERIAL_PROCESSING", label: "Raw Material Processing" },
];

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
