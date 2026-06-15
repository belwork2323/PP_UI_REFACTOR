import { STRINGS } from "../../../app/config/strings";

const S = STRINGS.MANUFACTURING.MIXING;

export const MIX_TYPE_CONFIG: Record<string, { color: string; italic?: boolean }> = {
  composite: { color: "#4A235A" },
  solid: { color: "#6D4C41" },
  liquid: { color: "#1565C0" },
  "not selected yet": { color: "#616A6B", italic: true },
};

export const getMixTypeConfig = (value: string) =>
  MIX_TYPE_CONFIG[String(value ?? "").toLowerCase()] ?? { color: "#555" };

export const MIX_TYPE_OPTIONS = [
  S.MIX_TYPE_COMPOSITE,
  S.MIX_TYPE_SOLID,
  S.MIX_TYPE_LIQUID,
  S.MIX_TYPE_NOT_SELECTED,
];

export const MIXING_STAGE_OPTIONS = [
  { value: "PREMIX", label: S.STAGE_PREMIX },
  { value: "FINAL_MIX", label: S.STAGE_FINAL_MIX },
] as const;

export type MixingStageValue = (typeof MIXING_STAGE_OPTIONS)[number]["value"];

export const MIXER_BLDG_OPTIONS = ["MY60-14C", "MY120-14A", "MY120-14B", "14FMY300"];

export const BOWL_ID_OPTIONS = Array.from({ length: 20 }, (_, i) => `Bowl No.${i + 1}`);

export const PREMIX_NO_OPTIONS = Array.from({ length: 10 }, (_, i) => String(i + 1));

export const buildStageNumberOptions = (maxCount: number) =>
  Array.from({ length: Math.max(1, maxCount) }, (_, index) => index + 1);

export const getAvailableStageNumbers = (usedNumbers: number[], maxCount: number) => {
  const used = new Set(usedNumbers);
  return buildStageNumberOptions(maxCount).filter((number) => !used.has(number));
};

export const getPremixNoLabel = (premixNo: number) => `Premix ${premixNo}`;

export const getFinalMixNoLabel = (mixNo: number) => `Final Mix ${mixNo}`;

export type MixingCycleOption = {
  value: string;
  label: string;
  operations: string[];
};

export const MIXING_CYCLE_OPTIONS: MixingCycleOption[] = [
  {
    value: "PROJECT_A_B1",
    label: "Project A - B1",
    operations: [
      S.PRE_ROW_1,
      S.PRE_ROW_2,
      S.PRE_ROW_3,
      S.PRE_ROW_4,
      S.PRE_SAMPLING_ROW,
    ],
  },
  {
    value: "PROJECT_A_B2",
    label: "Project A - B2",
    operations: [S.PRE_ROW_1, S.PRE_ROW_2, S.PRE_ROW_3, S.PRE_SAMPLING_ROW],
  },
  {
    value: "PROJECT_A_B3",
    label: "Project A - B3",
    operations: [S.PRE_ROW_1, S.PRE_ROW_2, S.PRE_SAMPLING_ROW],
  },
];

export const getMixingCycleByValue = (value: string) =>
  MIXING_CYCLE_OPTIONS.find((cycle) => cycle.value === value) ?? null;

export const FINAL_MIX_CYCLE_OPTIONS = [
  { value: "PROJECT_A_B1", label: "Project A - B1" },
  { value: "PROJECT_A_B2", label: "Project A - B2" },
  { value: "PROJECT_A_B3", label: "Project A - B3" },
  { value: "PROJECT_A_B4", label: "Project A - B4" },
];

export type QualityObservedLayout = "quad" | "single";

export const DEFAULT_QUALITY_CHECK_ROWS: Array<{
  parameter: string;
  specification: string;
  observedLayout: QualityObservedLayout;
}> = [
  { parameter: "Homogeneity", specification: "", observedLayout: "quad" },
  { parameter: "Moisture%", specification: "0.08", observedLayout: "quad" },
  { parameter: "EoM Viscosity", specification: "", observedLayout: "single" },
  { parameter: "EoM Temperature", specification: "", observedLayout: "single" },
];

export const isQuadObservedLayout = (layout: QualityObservedLayout) => layout === "quad";

export const createProcessParticularRows = (operations: string[]) =>
  operations.map((operation, index) => ({
    id: index + 1,
    operation,
    rpm: "",
    time: "",
    temp: "",
    vacuum: "",
  }));

export const createQualityCheckRows = () =>
  DEFAULT_QUALITY_CHECK_ROWS.map((row) => ({
    ...row,
    observed1: "",
    observed2: "",
    observed3: "",
    observed4: "",
  }));
