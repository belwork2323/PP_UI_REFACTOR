import { STRINGS } from "../../../app/config/strings";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

export type QcDivisionSetupFieldType = "text" | "select" | "datetime" | "multiselect";

export type QcDivisionSetupField = {
  id: string;
  label: string;
  type: QcDivisionSetupFieldType;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  readOnly?: boolean;
};

export type QcDivisionSetupDefinition = {
  flowKey: string;
  title: string;
  loadLabel: string;
  fields: QcDivisionSetupField[];
};

const MOTOR_ONLY_SETUP: QcDivisionSetupDefinition = {
  flowKey: "MOTOR_UNIT",
  title: "Motor Selection",
  loadLabel: S.LOAD_FORM_LABEL,
  fields: [],
};

export const QC_DIVISION_SETUP_DEFINITIONS: Record<string, QcDivisionSetupDefinition> = {
  RAW_MATERIAL_PROCESSING: {
    flowKey: "RAW_MATERIAL",
    title: "Raw Material Processing Setup",
    loadLabel: S.LOAD_FORM_LABEL,
    fields: [
      {
        id: "processingType",
        label: S.PROCESSING_TYPE_LABEL,
        type: "select",
        required: true,
      },
      { id: "premixNo", label: "Premix", type: "select", required: true },
    ],
  },
  MIXING: {
    flowKey: "MIXING",
    title: "Mixing Setup",
    loadLabel: S.LOAD_FORM_LABEL,
    fields: [
      { id: "mixingStage", label: "Mixing Stage", type: "select", required: true },
      { id: "premixNo", label: "Premix / Final Mix", type: "select", required: true },
    ],
  },
  HARDWARE: {
    flowKey: "HARDWARE",
    title: "Hardware Setup",
    loadLabel: S.LOAD_FORM_LABEL,
    fields: [
      { id: "motorId", label: "Motor ID", type: "select", required: true },
      { id: "processes", label: "Processes", type: "multiselect", required: true },
    ],
  },
  CASTING: {
    flowKey: "CASTING",
    title: "Casting Setup",
    loadLabel: S.LOAD_FORM_LABEL,
    fields: [
      { id: "castingStation", label: "Casting Station", type: "select", required: true },
      { id: "motorReceivedAt", label: "Motor Received Date/Time", type: "datetime", required: true },
    ],
  },
  CURING: {
    flowKey: "CURING",
    title: "Curing Setup",
    loadLabel: S.LOAD_FORM_LABEL,
    fields: [
      { id: "oven", label: "Oven", type: "select", required: true },
      { id: "ovenNumber", label: "Oven Number", type: "text", required: true },
    ],
  },
  TRIMMING: {
    flowKey: "TRIMMING",
    title: "Trimming Setup",
    loadLabel: S.LOAD_FORM_LABEL,
    fields: [
      { id: "motorStage", label: "Motor Stage", type: "select", required: true },
      { id: "motorReceivedAt", label: "Motor Received Date/Time", type: "datetime", required: true },
    ],
  },
  POST_CURE: {
    flowKey: "POST_CURE",
    title: "Post Cure Setup",
    loadLabel: S.LOAD_FORM_LABEL,
    fields: [
      { id: "operation", label: "Operation", type: "select", required: true },
      { id: "motorReceiptDate", label: "Motor Receipt Date/Time", type: "datetime", required: true },
    ],
  },
  NDT: {
    flowKey: "NDT",
    title: "NDT Setup",
    loadLabel: S.LOAD_FORM_LABEL,
    fields: [
      { id: "equipment", label: "Equipment", type: "select", required: true },
      { id: "beamEnergy", label: "Beam Energy", type: "text", required: true },
    ],
  },
  DE_CORING: { ...MOTOR_ONLY_SETUP, flowKey: "DE_CORING", title: "De-coring Setup" },
  QC: { ...MOTOR_ONLY_SETUP, flowKey: "QC", title: "QC Setup" },
  WEIGHTMENT: { ...MOTOR_ONLY_SETUP, flowKey: "WEIGHTMENT", title: "Weighment Setup" },
};

export const resolveQcDivisionSetupKey = (
  flowKey: string,
  rawMaterialType?: string | null,
): string => {
  const key = String(flowKey ?? "").trim().toUpperCase();
  const typeKey = String(rawMaterialType ?? "").trim().toUpperCase();
  if (key === "RAW_MATERIAL" && typeKey) return typeKey;
  return key;
};

export const getQcDivisionSetupDefinition = (
  flowKey: string,
  rawMaterialType?: string | null,
): QcDivisionSetupDefinition | null => {
  const setupKey = resolveQcDivisionSetupKey(flowKey, rawMaterialType);
  return QC_DIVISION_SETUP_DEFINITIONS[setupKey] ?? null;
};

export const divisionHasQcSetup = (
  flowKey: string,
  rawMaterialType?: string | null,
): boolean => Boolean(getQcDivisionSetupDefinition(flowKey, rawMaterialType));
