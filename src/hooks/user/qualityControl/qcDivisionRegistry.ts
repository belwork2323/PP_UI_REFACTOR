import type {
  QcApiDivision,
  QcApiSubType,
  QcInhibitorType,
} from "../../../schema-engine/adapters/qc.adapter";
import { STF_MOTOR_TYPE_OPTIONS } from "./stfFlowConfig";
import {
  canLoadQcForm,
  QC_DIVISION_OPTIONS,
  resolveFlowTypeLabel,
  resolveQcSchemaSelection,
} from "./qcFlowConfig";
import { isRawMaterialProcessingType } from "./qcProcessingConfig";
import { buildDivisionEntryDedupKey, resolveDivisionEntryKind } from "./qcDivisionEntries";
import { isQcMixingStage, mapQcMixingStageToSubType } from "./qcMixingConfig";
import { canLoadQcPostCureSetupForm } from "./qcPostCureDivisionDetails";

export type QcDivisionPanelType =
  | "RAW_MATERIAL"
  | "MIXING"
  | "HARDWARE"
  | "CASTING"
  | "CURING"
  | "TRIMMING"
  | "DE_CORING"
  | "POST_CURE"
  | "NDT"
  | "PROPELLANT"
  | "WEIGHTMENT"
  | "STF"
  | "SIMPLE";

export type QcDivisionDefinition = {
  flowKey: string;
  label: string;
  panelType: QcDivisionPanelType;
  apiDivision: QcApiDivision;
};

export const QC_DIVISION_DEFINITIONS: QcDivisionDefinition[] = [
  {
    flowKey: "RAW_MATERIAL",
    label: "Raw Material",
    panelType: "RAW_MATERIAL",
    apiDivision: "RAW_MATERIAL_REVALIDATION",
  },
  { flowKey: "MIXING", label: "Mixing", panelType: "MIXING", apiDivision: "MIXING" },
  { flowKey: "HARDWARE", label: "Hardware", panelType: "HARDWARE", apiDivision: "HARDWARE" },
  { flowKey: "CASTING", label: "Casting", panelType: "CASTING", apiDivision: "CASTING" },
  { flowKey: "CURING", label: "Curing", panelType: "CURING", apiDivision: "CURING" },
  { flowKey: "DE_CORING", label: "De-coring", panelType: "DE_CORING", apiDivision: "DE_CORING" },
  { flowKey: "TRIMMING", label: "Trimming", panelType: "TRIMMING", apiDivision: "TRIMMING" },
  { flowKey: "POST_CURE", label: "Post Cure", panelType: "POST_CURE", apiDivision: "POST_CURE" },
  { flowKey: "NDT", label: "NDT", panelType: "NDT", apiDivision: "NDT" },
  { flowKey: "QC", label: "QC", panelType: "PROPELLANT", apiDivision: "PROPELLANT_PROPERTIES" },
  {
    flowKey: "WEIGHTMENT",
    label: "Weighment",
    panelType: "WEIGHTMENT",
    apiDivision: "WEIGHTMENT",
  },
  {
    flowKey: "STATIC_TEST_FACILITY",
    label: "Static Test Facility",
    panelType: "STF",
    apiDivision: "STATIC_TEST_FACILITY",
  },
];

export const DEFAULT_QC_DIVISION_FLOW_KEY = QC_DIVISION_OPTIONS[0]?.value ?? "RAW_MATERIAL";

export const getQcDivisionDefinition = (flowKey: string): QcDivisionDefinition | null =>
  QC_DIVISION_DEFINITIONS.find((definition) => definition.flowKey === flowKey) ?? null;

/** API `division` value for approver change-status, resolved from a UI tab key. */
export const resolveQcApiDivisionForTabKey = (tabKey: string): string => {
  const key = String(tabKey ?? "")
    .trim()
    .toUpperCase();
  if (!key) return "";
  if (key === "RAW_MATERIAL_PROCESSING" || key === "RAW_MATERIAL_REVALIDATION") return key;
  if (key === "PROPELLANT_PROPERTIES" || key === "PROPELLANT") return "PROPELLANT_PROPERTIES";
  if (key === "WEIGHMENT") return "WEIGHTMENT";
  const flowKey = key === "POST_CURE_OPERATION" ? "POST_CURE" : key;
  return getQcDivisionDefinition(flowKey)?.apiDivision ?? key;
};

export const getQcDivisionPanelType = (flowKey: string): QcDivisionPanelType =>
  getQcDivisionDefinition(flowKey)?.panelType ?? "SIMPLE";

/**
 * Custom QC division UIs hydrate from /qc-division/details JSON.
 * Do not call GET /user/quality-control/schema for these divisions.
 */
export const shouldSkipQcSchemaFetch = (
  division?: string | null,
  subType?: string | null,
): boolean => {
  const div = String(division ?? "")
    .trim()
    .toUpperCase();
  const type = String(subType ?? "")
    .trim()
    .toUpperCase();
  if (!div) return true;
  if (
    div === "CASTING" ||
    div === "CURING" ||
    div === "DE_CORING" ||
    div === "TRIMMING" ||
    div === "POST_CURE" ||
    div === "POST_CURE_OPERATION" ||
    div === "NDT" ||
    div === "PROPELLANT_PROPERTIES" ||
    div === "QC" ||
    div === "HARDWARE" ||
    div === "MIXING" ||
    div === "RAW_MATERIAL_REVALIDATION" ||
    div === "RAW_MATERIAL_PROCESSING" ||
    div === "WEIGHTMENT" ||
    div === "WEIGHMENT"
  ) {
    return true;
  }
  if (div === "RAW_MATERIAL") {
    return (
      type === "RAW_MATERIAL_REVALIDATION" ||
      type === "RAW_MATERIAL_PROCESSING" ||
      type === "SOLID_PROCESSING" ||
      type === "LIQUID_PROCESSING" ||
      type === "BOTH" ||
      type === ""
    );
  }
  return false;
};

export type QcDivisionFlowState = {
  rawMaterialType: string;
  processingType: string;
  mixingStage: string;
  selectedPremix: number | "";
  addedPremixNumbers: number[];
  stfMotorType: string;
  selectedMotorId: string;
  selectedHardwareProcesses: string[];
  selectedTrimmingMotorCount: number | "";
  trimmingMotorReceivedDate: string;
  postCureMotorReceiptDate: string;
  selectedPostCureOperation: string;
  selectedInhibitorType: string;
  selectedPropellantProcess: string;
  addedDivisionEntryKeys: string[];
};

export const resolveDivisionFlowLabel = (
  divisionFlowKey: string,
  rawMaterialType: string,
  processingType: string,
) => {
  if (divisionFlowKey === "RAW_MATERIAL") {
    return resolveFlowTypeLabel(rawMaterialType, processingType);
  }
  const definition = getQcDivisionDefinition(divisionFlowKey);
  return definition?.label ?? divisionFlowKey;
};

export type QcDivisionSchemaSelection = {
  division: QcApiDivision;
  subType: QcApiSubType;
  inhibitorType?: QcInhibitorType;
};

export const resolveDivisionSchemaRequest = (
  divisionFlowKey: string,
  state: QcDivisionFlowState,
): QcDivisionSchemaSelection | null => {
  if (divisionFlowKey === "RAW_MATERIAL") {
    return resolveQcSchemaSelection(divisionFlowKey, state.rawMaterialType, state.processingType);
  }

  const definition = getQcDivisionDefinition(divisionFlowKey);
  if (!definition) return null;

  if (definition.panelType === "MIXING") {
    if (!isQcMixingStage(state.mixingStage)) return null;
    return {
      division: definition.apiDivision,
      subType: mapQcMixingStageToSubType(state.mixingStage),
    };
  }

  if (definition.panelType === "HARDWARE") {
    // Custom hardware panels — Motor Navigation seeds forms; no schema fetch.
    return null;
  }

  if (
    definition.panelType === "CASTING" ||
    definition.panelType === "CURING" ||
    definition.panelType === "DE_CORING" ||
    definition.panelType === "TRIMMING"
  ) {
    // Custom panels — Motor Navigation seeds forms; no schema fetch / FlowBar load.
    return null;
  }

  if (definition.panelType === "POST_CURE") {
    // Custom panels by operation / inhibitor dropdown — no schema fetch.
    // Selection metadata is resolved in handleLoadQcForm via resolveQcPostCureSchemaSelection.
    return null;
  }

  if (definition.panelType === "NDT") {
    // Custom panel — Motor Navigation seeds forms; no schema fetch / FlowBar load.
    return null;
  }

  if (definition.panelType === "PROPELLANT") {
    // Custom panel — Motor Navigation seeds all 4 process tables; no schema fetch / FlowBar load.
    return null;
  }

  if (definition.panelType === "WEIGHTMENT") {
    // Custom panel — Motor Navigation seeds forms; no schema fetch / FlowBar load.
    return null;
  }

  if (definition.panelType === "STF") {
    if (!state.stfMotorType) return null;
    return {
      division: definition.apiDivision,
      subType: state.stfMotorType as QcApiSubType,
    };
  }

  return {
    division: definition.apiDivision,
    subType: null,
  };
};

export const canLoadDivisionSchema = (divisionFlowKey: string, state: QcDivisionFlowState) => {
  if (!divisionFlowKey) return false;

  const panelType = getQcDivisionPanelType(divisionFlowKey);
  const entryKind = resolveDivisionEntryKind(
    divisionFlowKey,
    state.rawMaterialType,
    state.processingType,
    state.mixingStage,
  );

  if (panelType === "RAW_MATERIAL") {
    if (!state.rawMaterialType) return false;
    if (isRawMaterialProcessingType(state.rawMaterialType) && !state.processingType) return false;

    if (entryKind === "REVALIDATION") {
      const dedupKey = buildDivisionEntryDedupKey({
        flowKey: divisionFlowKey,
        kind: "REVALIDATION",
      });
      return !state.addedDivisionEntryKeys.includes(dedupKey);
    }

    return canLoadQcForm(divisionFlowKey, state.rawMaterialType, state.processingType, {
      selectedPremix: state.selectedPremix,
      addedPremixNumbers: state.addedPremixNumbers,
    });
  }

  if (panelType === "MIXING") {
    if (!isQcMixingStage(state.mixingStage)) return false;
    if (state.selectedPremix === "" || state.selectedPremix == null) return false;

    const kind = state.mixingStage === "FINAL_MIX" ? "MIXING_FINAL_MIX" : "MIXING_PREMIX";
    const dedupKey = buildDivisionEntryDedupKey({
      flowKey: divisionFlowKey,
      kind,
      premixNo: Number(state.selectedPremix),
      subType: mapQcMixingStageToSubType(state.mixingStage),
    });
    return !state.addedDivisionEntryKeys.includes(dedupKey);
  }

  if (panelType === "HARDWARE") {
    // Motor Navigation seeds all 4 processes — no FlowBar Motor/Process pickers.
    return false;
  }

  if (panelType === "CASTING") {
    // Motor Navigation seeds the casting form — no FlowBar Motor ID picker / Load Form.
    return false;
  }

  if (panelType === "DE_CORING") {
    // Motor Navigation seeds the de-coring form — no FlowBar Motor ID picker / Load Form.
    return false;
  }

  if (panelType === "CURING") {
    // Motor Navigation seeds the curing form — no FlowBar Motor ID / curing type pickers.
    return false;
  }

  if (panelType === "TRIMMING") {
    // Motor Navigation seeds the trimming form — no FlowBar motor count / ID / date pickers.
    return false;
  }

  if (panelType === "POST_CURE") {
    return canLoadQcPostCureSetupForm({
      selectedPostCureOperation: state.selectedPostCureOperation,
      selectedInhibitorType: state.selectedInhibitorType,
      postCureMotorReceiptDate: state.postCureMotorReceiptDate,
    });
  }

  if (panelType === "NDT") {
    // Motor Navigation seeds the NDT form — no FlowBar Motor ID picker / Load Form.
    return false;
  }

  if (panelType === "PROPELLANT") {
    // Motor Navigation seeds the QC form — no FlowBar Motor ID / process pickers / Load Form.
    return false;
  }

  if (panelType === "WEIGHTMENT") {
    // Motor Navigation seeds the weighment form — no FlowBar Motor ID / weighscale pickers.
    return false;
  }

  if (panelType === "STF") {
    if (!state.stfMotorType) return false;
    const dedupKey = buildDivisionEntryDedupKey({
      flowKey: divisionFlowKey,
      kind: "STF",
      subType: state.stfMotorType as QcApiSubType,
    });
    return !state.addedDivisionEntryKeys.includes(dedupKey);
  }

  const dedupKey = buildDivisionEntryDedupKey({
    flowKey: divisionFlowKey,
    kind: "SIMPLE",
  });
  return !state.addedDivisionEntryKeys.includes(dedupKey);
};

export const isMixingDivisionFlow = (divisionFlowKey: string) =>
  getQcDivisionPanelType(divisionFlowKey) === "MIXING";

export const isHardwareDivisionFlow = (divisionFlowKey: string) =>
  getQcDivisionPanelType(divisionFlowKey) === "HARDWARE";

export const isCastingDivisionFlow = (divisionFlowKey: string) =>
  getQcDivisionPanelType(divisionFlowKey) === "CASTING";

export const isCuringDivisionFlow = (divisionFlowKey: string) =>
  getQcDivisionPanelType(divisionFlowKey) === "CURING";

export const isTrimmingDivisionFlow = (divisionFlowKey: string) =>
  getQcDivisionPanelType(divisionFlowKey) === "TRIMMING";

export const isDeCoringDivisionFlow = (divisionFlowKey: string) =>
  getQcDivisionPanelType(divisionFlowKey) === "DE_CORING";

export const isPostCureDivisionFlow = (divisionFlowKey: string) =>
  getQcDivisionPanelType(divisionFlowKey) === "POST_CURE";

export const isNdtDivisionFlow = (divisionFlowKey: string) =>
  getQcDivisionPanelType(divisionFlowKey) === "NDT";

export const isPropellantDivisionFlow = (divisionFlowKey: string) =>
  getQcDivisionPanelType(divisionFlowKey) === "PROPELLANT";

export const isWeighmentDivisionFlow = (divisionFlowKey: string) =>
  getQcDivisionPanelType(divisionFlowKey) === "WEIGHTMENT";

/** @deprecated Use isWeighmentDivisionFlow */
export const isWeightmentDivisionFlow = isWeighmentDivisionFlow;

/** QC / Weighment seed motor nav from the batch — no manufacturing /division-details. */
export const isBatchMotorSeededQcFlow = (divisionFlowKey: string) => {
  const key = String(divisionFlowKey ?? "")
    .trim()
    .toUpperCase();
  return key === "QC" || key === "WEIGHTMENT" || key === "WEIGHMENT";
};

/** @deprecated Use isMixingDivisionFlow */
export const isPremixDivisionFlow = isMixingDivisionFlow;

export const STF_MOTOR_TYPE_SELECT_OPTIONS = STF_MOTOR_TYPE_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));
