import type { QcApiDivision, QcApiSubType } from "../../../schema-engine/adapters/qc.adapter";
import { getQcSchemaCacheKey } from "./qcFlowConfig";
import { resolveDivisionFlowLabel } from "./qcDivisionRegistry";
import type { QcDivisionEntry, QcDivisionEntryKind, QcDivisionEntryValues } from "./qcDivisionEntryTypes";
import {
  getQcPremixLabel,
  isBothProcessingType,
  isPremixProcessingFlow,
  isRawMaterialRevalidationType,
} from "./qcProcessingConfig";
import { STF_MOTOR_TYPE_OPTIONS } from "./stfFlowConfig";
import {
  getQcHardwareProcessLabel,
} from "./qcHardwareConfig";
import { getQcPropellantProcessLabel } from "./qcPropellantConfig";
import {
  getQcMixingNumberLabel,
  getQcMixingStageLabel,
  isQcMixingStage,
  type QcMixingStage,
} from "./qcMixingConfig";
import type { SchemaDocumentV2 } from "../../../schema-engine";
import type { QualityControlFormState } from "../../../data/models/user/QualityControlFormModel";

export type QcDivisionPickerState = {
  flowKey: string;
  rawMaterialType: string;
  processingType: string;
  mixingStage: string;
  selectedPremix: number | "";
  stfMotorType: string;
};

export const createDivisionEntryId = () =>
  `qc-div-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const buildDivisionEntryDedupKey = (params: {
  flowKey: string;
  kind: QcDivisionEntryKind;
  premixNo?: number;
  motorId?: string;
  subType?: QcApiSubType;
  inhibitorType?: string;
}): string => {
  if (params.kind === "MIXING_PREMIX") {
    return `MIXING:PREMIX:${params.premixNo}`;
  }
  if (params.kind === "MIXING_FINAL_MIX") {
    return `MIXING:FINAL_MIX:${params.premixNo}`;
  }
  if (params.kind === "SOLID_PREMIX") {
    return `RAW_MATERIAL:SOLID:${params.premixNo}`;
  }
  if (params.kind === "LIQUID_PREMIX") {
    return `RAW_MATERIAL:LIQUID:${params.premixNo}`;
  }
  if (params.kind === "BOTH_PREMIX") {
    return `RAW_MATERIAL:BOTH:${params.premixNo}`;
  }
  if (params.kind === "STF") {
    return `STATIC_TEST_FACILITY:${params.subType ?? "NONE"}`;
  }
  if (params.kind === "REVALIDATION") {
    return "RAW_MATERIAL:REVALIDATION";
  }
  if (params.kind === "HARDWARE_PROCESS") {
    return `HARDWARE:${params.motorId ?? "NONE"}:${params.subType ?? "NONE"}`;
  }
  if (params.kind === "CASTING_MOTOR") {
    return `CASTING:${params.motorId ?? "NONE"}`;
  }
  if (params.kind === "CURING_MOTOR") {
    return `CURING:${params.motorId ?? "NONE"}`;
  }
  if (params.kind === "TRIMMING_MOTOR") {
    return `TRIMMING:${params.motorId ?? "NONE"}`;
  }
  if (params.kind === "DE_CORING_MOTOR") {
    return `DE_CORING:${params.motorId ?? "NONE"}`;
  }
  if (params.kind === "POST_CURE_MOTOR") {
    return `POST_CURE:${params.motorId ?? "NONE"}:${params.subType ?? "NONE"}:${params.inhibitorType ?? "NONE"}`;
  }
  if (params.kind === "NDT_MOTOR") {
    return `NDT:${params.motorId ?? "NONE"}`;
  }
  if (params.kind === "PROPELLANT_PROCESS") {
    return `PROPELLANT:${params.motorId ?? "NONE"}:${params.subType ?? "NONE"}`;
  }
  if (params.kind === "WEIGHTMENT_MOTOR") {
    return `WEIGHTMENT:${params.motorId ?? "NONE"}`;
  }
  return params.flowKey;
};

export const getDivisionEntryDedupKey = (entry: QcDivisionEntry) =>
  buildDivisionEntryDedupKey({
    flowKey: entry.flowKey,
    kind: entry.kind,
    premixNo: entry.premixNo,
    motorId: entry.motorId,
    subType: entry.subType,
    inhibitorType: entry.inhibitorType,
  });

export const getAddedDivisionEntryKeys = (entries: QcDivisionEntry[] = []) =>
  entries.map(getDivisionEntryDedupKey);

export const getAddedPremixNumbersForPicker = (
  entries: QcDivisionEntry[] = [],
  picker: QcDivisionPickerState,
): number[] => {
  if (picker.flowKey === "MIXING" && isQcMixingStage(picker.mixingStage)) {
    const kind = picker.mixingStage === "FINAL_MIX" ? "MIXING_FINAL_MIX" : "MIXING_PREMIX";
    return entries
      .filter((entry) => entry.kind === kind)
      .map((entry) => entry.premixNo!)
      .filter(Boolean);
  }

  if (picker.flowKey !== "RAW_MATERIAL" || !isPremixProcessingFlow(picker.rawMaterialType, picker.processingType)) {
    return [];
  }

  if (isBothProcessingType(picker.processingType)) {
    return entries
      .filter((entry) => entry.kind === "BOTH_PREMIX")
      .map((entry) => entry.premixNo!)
      .filter(Boolean);
  }

  if (picker.processingType === "SOLID_PROCESSING") {
    return entries
      .filter((entry) => entry.kind === "SOLID_PREMIX")
      .map((entry) => entry.premixNo!)
      .filter(Boolean);
  }

  return entries
    .filter((entry) => entry.kind === "LIQUID_PREMIX")
    .map((entry) => entry.premixNo!)
    .filter(Boolean);
};

export const buildDivisionEntryLabel = (params: {
  flowKey: string;
  kind: QcDivisionEntryKind;
  rawMaterialType?: string;
  processingType?: string;
  premixNo?: number;
  subType?: QcApiSubType;
  mixingStage?: QcMixingStage;
  motorId?: string;
}): string => {
  if (params.kind === "MIXING_PREMIX" && params.premixNo && params.mixingStage) {
    return `Mixing · ${getQcMixingStageLabel(params.mixingStage)} · ${getQcMixingNumberLabel(params.mixingStage, params.premixNo)}`;
  }

  if (params.kind === "MIXING_FINAL_MIX" && params.premixNo && params.mixingStage) {
    return `Mixing · ${getQcMixingStageLabel(params.mixingStage)} · ${getQcMixingNumberLabel(params.mixingStage, params.premixNo)}`;
  }

  if (params.kind === "MIXING_PREMIX" && params.premixNo) {
    return `Mixing · ${getQcPremixLabel(params.premixNo)}`;
  }

  if (params.kind === "BOTH_PREMIX" && params.premixNo) {
    const base = resolveDivisionFlowLabel(
      params.flowKey,
      params.rawMaterialType ?? "",
      params.processingType ?? "",
    );
    return `${base} · ${getQcPremixLabel(params.premixNo)}`;
  }

  if (
    (params.kind === "SOLID_PREMIX" || params.kind === "LIQUID_PREMIX") &&
    params.premixNo
  ) {
    const base = resolveDivisionFlowLabel(
      params.flowKey,
      params.rawMaterialType ?? "",
      params.processingType ?? "",
    );
    return `${base} · ${getQcPremixLabel(params.premixNo)}`;
  }

  if (params.kind === "STF" && params.subType) {
    const motorLabel = STF_MOTOR_TYPE_OPTIONS.find((option) => option.value === params.subType)?.label;
    return motorLabel ? `Static Test Facility · ${motorLabel}` : "Static Test Facility";
  }

  if (params.kind === "HARDWARE_PROCESS" && params.subType) {
    return getQcHardwareProcessLabel(String(params.subType));
  }

  if (params.kind === "PROPELLANT_PROCESS" && params.subType) {
    return getQcPropellantProcessLabel(String(params.subType));
  }

  if (params.kind === "CASTING_MOTOR" && params.motorId) {
    return params.motorId;
  }

  if (params.kind === "CURING_MOTOR" && params.motorId) {
    return params.motorId;
  }

  if (params.kind === "TRIMMING_MOTOR" && params.motorId) {
    return params.motorId;
  }

  if (params.kind === "DE_CORING_MOTOR" && params.motorId) {
    return params.motorId;
  }

  if (params.kind === "POST_CURE_MOTOR" && params.motorId) {
    return params.motorId;
  }

  if (params.kind === "NDT_MOTOR" && params.motorId) {
    return params.motorId;
  }

  if (params.kind === "REVALIDATION") {
    return resolveDivisionFlowLabel(
      params.flowKey,
      params.rawMaterialType ?? "RAW_MATERIAL_REVALIDATION",
      "",
    );
  }

  return resolveDivisionFlowLabel(params.flowKey, "", "") || params.flowKey;
};

export const resolveDivisionEntryKind = (
  flowKey: string,
  rawMaterialType: string,
  processingType: string,
  mixingStage = "",
): QcDivisionEntryKind | null => {
  if (flowKey === "MIXING") {
    if (!isQcMixingStage(mixingStage)) return null;
    return mixingStage === "FINAL_MIX" ? "MIXING_FINAL_MIX" : "MIXING_PREMIX";
  }
  if (flowKey === "HARDWARE") return "HARDWARE_PROCESS";
  if (flowKey === "CASTING") return "CASTING_MOTOR";
  if (flowKey === "CURING") return "CURING_MOTOR";
  if (flowKey === "TRIMMING") return "TRIMMING_MOTOR";
  if (flowKey === "DE_CORING") return "DE_CORING_MOTOR";
  if (flowKey === "POST_CURE") return "POST_CURE_MOTOR";
  if (flowKey === "NDT") return "NDT_MOTOR";
  if (flowKey === "QC") return "PROPELLANT_PROCESS";
  if (flowKey === "WEIGHTMENT") return "WEIGHTMENT_MOTOR";
  if (flowKey === "STATIC_TEST_FACILITY") return "STF";
  if (flowKey === "RAW_MATERIAL") {
    if (isRawMaterialRevalidationType(rawMaterialType)) return "REVALIDATION";
    if (isBothProcessingType(processingType)) return "BOTH_PREMIX";
    if (processingType === "SOLID_PROCESSING") return "SOLID_PREMIX";
    if (processingType === "LIQUID_PROCESSING") return "LIQUID_PREMIX";
    return null;
  }
  return "SIMPLE";
};

export const getSchemaForDivisionEntry = (
  form: QualityControlFormState,
  entry: QcDivisionEntry,
): SchemaDocumentV2 | null => {
  const key = getQcSchemaCacheKey(entry.apiDivision, entry.subType, entry.inhibitorType);
  return form.schemasByKey?.[key] ?? null;
};

export const getLiquidSchemaForBothEntry = (form: QualityControlFormState): SchemaDocumentV2 | null => {
  const key = getQcSchemaCacheKey("RAW_MATERIAL_PROCESSING", "LIQUID_PROCESSING");
  return form.schemasByKey?.[key] ?? null;
};

export const getSolidSchemaForBothEntry = (form: QualityControlFormState): SchemaDocumentV2 | null => {
  const key = getQcSchemaCacheKey("RAW_MATERIAL_PROCESSING", "SOLID_PROCESSING");
  return form.schemasByKey?.[key] ?? null;
};

export const appendDivisionEntryToForm = (
  prev: QualityControlFormState,
  entry: QcDivisionEntry,
  values: QcDivisionEntryValues,
  schemas: Array<{
    schema: SchemaDocumentV2;
    division: QcApiDivision;
    subType: QcApiSubType;
    inhibitorType?: string | null;
  }>,
): QualityControlFormState => {
  const schemasByKey = { ...(prev.schemasByKey ?? {}) };
  schemas.forEach((item) => {
    schemasByKey[getQcSchemaCacheKey(item.division, item.subType, item.inhibitorType)] = item.schema;
  });

  return {
    ...prev,
    schemasByKey,
    schemaFormLoaded: true,
    division: entry.apiDivision,
    subType: entry.subType,
    qcSchema: schemas[0]?.schema ?? prev.qcSchema,
    divisionEntries: [...(prev.divisionEntries ?? []), entry],
    divisionEntryValues: {
      ...(prev.divisionEntryValues ?? {}),
      [entry.entryId]: values,
    },
  };
};
