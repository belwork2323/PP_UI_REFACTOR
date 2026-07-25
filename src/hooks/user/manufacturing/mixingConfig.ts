import { ProcessParticularRow, QualityCheckRow } from "@/data/models/user/MixingFormModel";
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
  operations: MixingOperation[];
};

export const FINAL_MIX_CYCLE_OPTIONS = [
  { value: "PROJECT_A_B1", label: "Project A - B1" },
  { value: "PROJECT_A_B2", label: "Project A - B2" },
  { value: "PROJECT_A_B3", label: "Project A - B3" },
  { value: "PROJECT_A_B4", label: "Project A - B4" },
];

export type QualityObservedLayout = "quad" | "single";

/** Canonical QC parameter labels — must match mapQualityChecksToApi / mapApiQualityChecksToRows */
// export const QUALITY_CHECK_PARAMETERS = {
//   homogeneity: "Homogeneity",
//   moisture: "Moisture %",
//   eomViscosity: "EOM Viscosity",
//   eomTemperature: "EOM Temperature",
// } as const;

export const normalizeQualityCheckParameterKey = (parameter: string) =>
  String(parameter ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

// export const DEFAULT_QUALITY_CHECK_ROWS: Array<{
//   parameterId: string;
//   parameter: string;
//   specification: string;
//   observedLayout: QualityObservedLayout;
//   sampleCount: number;
// }> = [
//   {
//     parameterId: "",
//     parameter: QUALITY_CHECK_PARAMETERS.homogeneity,
//     specification: "",
//     observedLayout: "quad",
//     sampleCount: 4,
//   },
//   {
//     parameterId: "",
//     parameter: QUALITY_CHECK_PARAMETERS.moisture,
//     specification: "0.08",
//     observedLayout: "quad",
//     sampleCount: 4,
//   },
//   {
//     parameterId: "",
//     parameter: QUALITY_CHECK_PARAMETERS.eomViscosity,
//     specification: "",
//     observedLayout: "single",
//     sampleCount: 1,
//   },
//   {
//     parameterId: "",
//     parameter: QUALITY_CHECK_PARAMETERS.eomTemperature,
//     specification: "",
//     observedLayout: "single",
//     sampleCount: 1,
//   },
// ];

export const isQuadObservedLayout = (layout: QualityObservedLayout) => layout === "quad";

export type MixingOperation = {
  operationId: number;
  operationName: string;
};

export const createProcessParticularRows = (
  operations: MixingOperation[],
): ProcessParticularRow[] =>
  operations.map((operation) => ({
    operationId: operation.operationId,
    operation: operation.operationName,
    rpm: "",
    time: "",
    temp: "",
    vacuum: "",
  }));

export const createQualityCheckRows = (qualityChecks: QualityCheckRow[]): QualityCheckRow[] => {
  return qualityChecks.map((q) => {
    const parsed = Number(q.sampleCount);
    const sampleCount =
      Number.isFinite(parsed) && parsed > 0
        ? Math.max(1, Math.min(4, Math.floor(parsed)))
        : q.observedLayout === "quad"
          ? 4
          : 1;
    return {
      parameterId: q.parameterId,
      parameter: q.parameter,
      specification: q.specification,
      observedLayout: sampleCount > 1 ? "quad" : "single",
      sampleCount,
      observed1: "",
      observed2: "",
      observed3: "",
      observed4: "",
    };
  });
};

// export const createQualityCheckRows = () =>
//   DEFAULT_QUALITY_CHECK_ROWS.map((row) => ({
//     ...row,
//     observed1: "",
//     observed2: "",
//     observed3: "",
//     observed4: "",
//   }));
