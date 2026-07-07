import type { QcApiDivision, QcApiSubType, QcInhibitorType } from "../../../schema-engine/adapters/qc.adapter";
import { STF_MOTOR_TYPE_OPTIONS } from "./stfFlowConfig";
import {
  canLoadQcForm,
  QC_DIVISION_OPTIONS,
  resolveFlowTypeLabel,
  resolveQcSchemaSelection,
} from "./qcFlowConfig";
import { isRawMaterialProcessingType } from "./qcProcessingConfig";
import {
  buildDivisionEntryDedupKey,
  resolveDivisionEntryKind,
} from "./qcDivisionEntries";
import { isQcMixingStage, mapQcMixingStageToSubType } from "./qcMixingConfig";
import {
  mapQcTrimmingSubTypeToApi,
  resolveQcTrimmingSubType,
} from "./qcTrimmingConfig";
import {
  isQcPostCureInhibitionOperation,
  isQcPostCureOperation,
  mapQcInhibitorTypeToApi,
  resolveQcPostCureSchemaSelection,
} from "./qcPostCureConfig";
import { getPendingHardwareProcesses } from "./qcHardwareConfig";
import {
  isQcPropellantProcessSubType,
  mapQcPropellantProcessToApi,
} from "./qcPropellantConfig";

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
  { flowKey: "RAW_MATERIAL", label: "Raw Material", panelType: "RAW_MATERIAL", apiDivision: "RAW_MATERIAL_REVALIDATION" },
  { flowKey: "MIXING", label: "Mixing", panelType: "MIXING", apiDivision: "MIXING" },
  { flowKey: "HARDWARE", label: "Hardware", panelType: "HARDWARE", apiDivision: "HARDWARE" },
  { flowKey: "CASTING", label: "Casting", panelType: "CASTING", apiDivision: "CASTING" },
  { flowKey: "CURING", label: "Curing", panelType: "CURING", apiDivision: "CURING" },
  { flowKey: "DE_CORING", label: "De-coring", panelType: "DE_CORING", apiDivision: "DE_CORING" },
  { flowKey: "TRIMMING", label: "Trimming", panelType: "TRIMMING", apiDivision: "TRIMMING" },
  { flowKey: "POST_CURE", label: "Post Cure", panelType: "POST_CURE", apiDivision: "POST_CURE" },
  { flowKey: "NDT", label: "NDT", panelType: "NDT", apiDivision: "NDT" },
  { flowKey: "QC", label: "QC", panelType: "PROPELLANT", apiDivision: "PROPELLANT_PROPERTIES" },
  { flowKey: "WEIGHTMENT", label: "Weightment", panelType: "WEIGHTMENT", apiDivision: "WEIGHTMENT" },
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

export const getQcDivisionPanelType = (flowKey: string): QcDivisionPanelType =>
  getQcDivisionDefinition(flowKey)?.panelType ?? "SIMPLE";

export type QcDivisionFlowState = {
  rawMaterialType: string;
  processingType: string;
  mixingStage: string;
  selectedPremix: number | "";
  addedPremixNumbers: number[];
  stfMotorType: string;
  selectedMotorId: string;
  selectedHardwareProcesses: string[];
  selectedCuringType: string;
  selectedTrimmingMotorCount: number | "";
  trimmingMotorReceivedDate: string;
  selectedPostCureOperation: string;
  selectedInhibitorType: string;
  selectedPropellantProcess: string;
  weightmentWeighscaleNo: string;
  weightmentCalibrationDueDate: string;
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
    const pending = getPendingHardwareProcesses(
      state.selectedMotorId,
      state.selectedHardwareProcesses,
      state.addedDivisionEntryKeys,
      divisionFlowKey,
    );
    const nextProcess = pending[0];
    if (!state.selectedMotorId || !nextProcess) return null;
    return {
      division: definition.apiDivision,
      subType: nextProcess,
    };
  }

  if (definition.panelType === "CASTING") {
    if (!state.selectedMotorId) return null;
    return {
      division: definition.apiDivision,
      subType: null,
    };
  }

  if (definition.panelType === "DE_CORING") {
    if (!state.selectedMotorId) return null;
    return {
      division: definition.apiDivision,
      subType: null,
    };
  }

  if (definition.panelType === "CURING") {
    if (!state.selectedMotorId || !state.selectedCuringType) return null;
    return {
      division: definition.apiDivision,
      subType: state.selectedCuringType as QcApiSubType,
    };
  }

  if (definition.panelType === "TRIMMING") {
    if (
      !state.selectedMotorId ||
      state.selectedTrimmingMotorCount === "" ||
      !state.trimmingMotorReceivedDate.trim()
    ) {
      return null;
    }
    return {
      division: definition.apiDivision,
      subType: mapQcTrimmingSubTypeToApi(resolveQcTrimmingSubType()),
    };
  }

  if (definition.panelType === "POST_CURE") {
    if (!state.selectedMotorId || !isQcPostCureOperation(state.selectedPostCureOperation)) {
      return null;
    }
    return resolveQcPostCureSchemaSelection(
      state.selectedPostCureOperation,
      state.selectedInhibitorType,
    );
  }

  if (definition.panelType === "NDT") {
    if (!state.selectedMotorId) return null;
    return {
      division: definition.apiDivision,
      subType: null,
    };
  }

  if (definition.panelType === "PROPELLANT") {
    if (!state.selectedMotorId || !isQcPropellantProcessSubType(state.selectedPropellantProcess)) {
      return null;
    }
    return {
      division: definition.apiDivision,
      subType: mapQcPropellantProcessToApi(state.selectedPropellantProcess),
    };
  }

  if (definition.panelType === "WEIGHTMENT") {
    if (
      !state.selectedMotorId ||
      !state.weightmentWeighscaleNo.trim() ||
      !state.weightmentCalibrationDueDate.trim()
    ) {
      return null;
    }
    return {
      division: definition.apiDivision,
      subType: null,
    };
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

export const canLoadDivisionSchema = (
  divisionFlowKey: string,
  state: QcDivisionFlowState,
) => {
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
    if (!state.selectedMotorId) return false;
    if (!state.selectedHardwareProcesses.length) return false;
    return (
      getPendingHardwareProcesses(
        state.selectedMotorId,
        state.selectedHardwareProcesses,
        state.addedDivisionEntryKeys,
        divisionFlowKey,
      ).length > 0
    );
  }

  if (panelType === "CASTING") {
    if (!state.selectedMotorId) return false;
    const dedupKey = buildDivisionEntryDedupKey({
      flowKey: divisionFlowKey,
      kind: "CASTING_MOTOR",
      motorId: state.selectedMotorId,
    });
    return !state.addedDivisionEntryKeys.includes(dedupKey);
  }

  if (panelType === "DE_CORING") {
    if (!state.selectedMotorId) return false;
    const dedupKey = buildDivisionEntryDedupKey({
      flowKey: divisionFlowKey,
      kind: "DE_CORING_MOTOR",
      motorId: state.selectedMotorId,
    });
    return !state.addedDivisionEntryKeys.includes(dedupKey);
  }

  if (panelType === "CURING") {
    if (!state.selectedMotorId || !state.selectedCuringType) return false;
    const dedupKey = buildDivisionEntryDedupKey({
      flowKey: divisionFlowKey,
      kind: "CURING_MOTOR",
      motorId: state.selectedMotorId,
    });
    return !state.addedDivisionEntryKeys.includes(dedupKey);
  }

  if (panelType === "TRIMMING") {
    if (!state.selectedMotorId) return false;
    if (state.selectedTrimmingMotorCount === "" || state.selectedTrimmingMotorCount == null) return false;
    if (!state.trimmingMotorReceivedDate.trim()) return false;
    const dedupKey = buildDivisionEntryDedupKey({
      flowKey: divisionFlowKey,
      kind: "TRIMMING_MOTOR",
      motorId: state.selectedMotorId,
    });
    return !state.addedDivisionEntryKeys.includes(dedupKey);
  }

  if (panelType === "POST_CURE") {
    if (!state.selectedMotorId || !isQcPostCureOperation(state.selectedPostCureOperation)) return false;
    if (
      isQcPostCureInhibitionOperation(state.selectedPostCureOperation) &&
      !mapQcInhibitorTypeToApi(state.selectedInhibitorType)
    ) {
      return false;
    }
    const selection = resolveQcPostCureSchemaSelection(
      state.selectedPostCureOperation,
      state.selectedInhibitorType,
    );
    if (!selection) return false;
    const dedupKey = buildDivisionEntryDedupKey({
      flowKey: divisionFlowKey,
      kind: "POST_CURE_MOTOR",
      motorId: state.selectedMotorId,
      subType: selection.subType,
      inhibitorType: selection.inhibitorType,
    });
    return !state.addedDivisionEntryKeys.includes(dedupKey);
  }

  if (panelType === "NDT") {
    if (!state.selectedMotorId) return false;
    const dedupKey = buildDivisionEntryDedupKey({
      flowKey: divisionFlowKey,
      kind: "NDT_MOTOR",
      motorId: state.selectedMotorId,
    });
    return !state.addedDivisionEntryKeys.includes(dedupKey);
  }

  if (panelType === "PROPELLANT") {
    if (!state.selectedMotorId || !isQcPropellantProcessSubType(state.selectedPropellantProcess)) {
      return false;
    }
    const dedupKey = buildDivisionEntryDedupKey({
      flowKey: divisionFlowKey,
      kind: "PROPELLANT_PROCESS",
      motorId: state.selectedMotorId,
      subType: mapQcPropellantProcessToApi(state.selectedPropellantProcess) ?? undefined,
    });
    return !state.addedDivisionEntryKeys.includes(dedupKey);
  }

  if (panelType === "WEIGHTMENT") {
    if (
      !state.selectedMotorId ||
      !state.weightmentWeighscaleNo.trim() ||
      !state.weightmentCalibrationDueDate.trim()
    ) {
      return false;
    }
    const dedupKey = buildDivisionEntryDedupKey({
      flowKey: divisionFlowKey,
      kind: "WEIGHTMENT_MOTOR",
      motorId: state.selectedMotorId,
    });
    return !state.addedDivisionEntryKeys.includes(dedupKey);
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

export const isWeightmentDivisionFlow = (divisionFlowKey: string) =>
  getQcDivisionPanelType(divisionFlowKey) === "WEIGHTMENT";

/** @deprecated Use isMixingDivisionFlow */
export const isPremixDivisionFlow = isMixingDivisionFlow;

export const STF_MOTOR_TYPE_SELECT_OPTIONS = STF_MOTOR_TYPE_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));
