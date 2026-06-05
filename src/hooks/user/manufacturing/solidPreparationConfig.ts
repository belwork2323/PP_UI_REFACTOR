import { icons } from "../../../app/theme/icons";

const {
  blender: BlenderRoundedIcon,
  air: AirRoundedIcon,
  localFireDepartment: LocalFireDepartmentRoundedIcon,
  filterList: FilterListRoundedIcon,
  bubbleChart: BubbleChartRoundedIcon,
  memory: MemoryRoundedIcon,
} = icons.user.manufacturing.rawMaterial.solidPreparation;

export const SOLID_PREP_TEXT = {
  SECTION_TITLE: "Solid Preparation",
  SECTION_SUBTITLE: "Select processes and fill in the corresponding preparation forms",
  SELECTOR_LABEL: "Add Process",
  SELECTOR_PLACEHOLDER: "- Choose process -",
  ADD_PROCESS: "Add Process",
  SELECTOR_HINT: "The same process can be added multiple times if needed",
  EMPTY_TITLE: "No processes added yet",
  EMPTY_SUBTITLE: "Choose a process above and click Add Process to begin",
  ALL_FILLED: "All filled",
  FILLED_SUFFIX: "filled",
  REMOVE_PROCESS_TOOLTIP: "Remove this process",
  REMARKS_PLACEHOLDER: "Remarks or Lab Ref No.",
  REMARKS_REF_PLACEHOLDER: "Remarks or Ref No.",
  PLACEHOLDER_SUBTITLE: "Form coming next - structure will be defined",
  PLACEHOLDER_TITLE_SUFFIX: "form is coming next",
  PLACEHOLDER_NOTE: "This card is added to the session and will hold the form once built",
} as const;

export const SOLID_PROCESSES = [
  { key: "ap_blending", processId: "PROC-SOLID-001", label: "AP Blending", Icon: BlenderRoundedIcon },
  { key: "blending_cum_drying", processId: "PROC-SOLID-002", label: "Blending cum Drying", Icon: AirRoundedIcon },
  { key: "drying_rvd", processId: "PROC-SOLID-003", label: "Drying Operation in RVD", Icon: LocalFireDepartmentRoundedIcon },
  { key: "drying_oven", processId: "PROC-SOLID-004", label: "Drying in Oven", Icon: LocalFireDepartmentRoundedIcon },
  { key: "screening", processId: "PROC-SOLID-005", label: "Screening", Icon: FilterListRoundedIcon },
  { key: "psd", processId: "PROC-SOLID-006", label: "Particle Size Distribution Details", Icon: BubbleChartRoundedIcon },
  { key: "al_processing", processId: "PROC-SOLID-007", label: "Aluminium Processing", Icon: MemoryRoundedIcon },
] as const;

export const AP_BLENDING_ROWS = [
  { id: "row_tumbling", operation: "Tumbling of Blender cum dryer", opSuffix: "@ RPM" },
  { id: "row_jacket", operation: "Jacket water Temperature for blending", opSuffix: null },
  { id: "row_storage", operation: "Storage & marking of blended materials", opSuffix: null },
] as const;

export const DRYING_RVD_ROWS = [
  {
    id: "materialQuantity",
    label: "Material Quantity",
    paramFields: [{ key: "weight", label: "Weight", unit: "Kg", type: "number", icon: "weight" }],
  },
  {
    id: "drying",
    label: "Drying",
    paramFields: [
      { key: "temp", label: "Temp", unit: "°C", type: "number", icon: "thermo" },
      { key: "duration", label: "Duration", unit: "hrs", type: "number", icon: "timer" },
    ],
  },
  {
    id: "vacuumApplication",
    label: "Vacuum Application",
    paramFields: [{ key: "vacuumLevel", label: "Vacuum Level", unit: "mmHg", type: "number", icon: "tune" }],
  },
  { id: "vacuumBreak", label: "Vacuum Break", paramFields: [{ key: "value", label: "Value", unit: null, type: "text", icon: null }] },
  { id: "sampleCollection", label: "Sample Collection", paramFields: [{ key: "value", label: "Value", unit: null, type: "text", icon: null }] },
  {
    id: "storingMarking",
    label: "Storing and marking of container",
    paramFields: [{ key: "value", label: "Value", unit: null, type: "text", icon: null }],
  },
] as const;

export const PSD_ROWS = [
  { id: "range1", label: "Particle Size Range 1 %" },
  { id: "range2", label: "Range 2 %" },
  { id: "range3", label: "Range 3 %" },
  { id: "avgDiameter", label: "Avg Diameter" },
] as const;

export const createAPBlendingData = () =>
  AP_BLENDING_ROWS.reduce(
    (acc, row) => ({ ...acc, [row.id]: { parameter: "", time: "", remarks: "" } }),
    {} as Record<string, { parameter: string; time: string; remarks: string }>
  );

export const createBlendingCumDryingData = () => ({
  hotWaterCirculation: { temp: "", time: "", remarks: "" },
});

export const createDryingRVDData = () => ({
  materialQuantity: { weight: "", remarks: "" },
  drying: { temp: "", duration: "", remarks: "" },
  vacuumApplication: { vacuumLevel: "", remarks: "" },
  vacuumBreak: { value: "", remarks: "" },
  sampleCollection: { value: "", remarks: "" },
  storingMarking: { value: "", remarks: "" },
});

export const createDryingOvenData = () => ({
  materialLoading: { parameter: "", time: "", remarks: "" },
  dryingWaterJacketed: { insideTemp: "", time: "", remarks: "" },
  dryingAirOven: { temp: "", time: "", remarks: "" },
  sampleCollection: { parameter: "", time: "", remarks: "" },
});

export const createPSDData = () => ({
  header: { motorId: "", date: "", grindingBatchId: "" },
  specs: {
    range1: { specification: "" },
    range2: { specification: "" },
    range3: { specification: "" },
    avgDiameter: { specification: "" },
  },
});

export const createAlProcessingData = () => ({
  screenMesh: { parameter: "", time: "", remarks: "" },
  foreignParticle: { observed: "", time: "", remarks: "" },
  collectedQty: { parameter: "", time: "", remarks: "" },
});

export const createSolidProcessDataByKey = (processKey: string) => {
  if (processKey === "ap_blending") return createAPBlendingData();
  if (processKey === "blending_cum_drying") return createBlendingCumDryingData();
  if (processKey === "drying_rvd") return createDryingRVDData();
  if (processKey === "drying_oven") return createDryingOvenData();
  if (processKey === "psd") return createPSDData();
  if (processKey === "al_processing") return createAlProcessingData();
  return {};
};
