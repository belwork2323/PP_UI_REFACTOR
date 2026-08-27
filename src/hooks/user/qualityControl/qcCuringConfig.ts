import { STRINGS } from "../../../app/config/strings";
import type { QcApiSubType } from "../../../schema-engine/adapters/qc.adapter";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

export const QC_CURING_SECTION_IDS = {
  MOTOR_SETUP: "CURING_MOTOR_SETUP",
  CYCLE_DETAILS: "CURING_CYCLE_DETAILS",
  PRESSURE_DETAILS: "PRESSURE_CURING_DETAILS",
  POST_CURING: "POST_CURING_DETAILS",
  SUBSCALE: "SUBSCALE_ARTICLES_CURING",
} as const;

export const QC_CURING_TYPE_OPTIONS = [
  { value: "NORMAL", label: S.CURING_TYPE_NORMAL },
  { value: "CONFINED", label: S.CURING_TYPE_CONFINED },
  { value: "N2_PRESSURE", label: S.CURING_TYPE_N2_PRESSURE },
] as const;

export type QcCuringSubType = (typeof QC_CURING_TYPE_OPTIONS)[number]["value"];

export const isQcCuringSubType = (value: string): value is QcCuringSubType =>
  QC_CURING_TYPE_OPTIONS.some((option) => option.value === value);

export const getQcCuringTypeLabel = (subType: string) =>
  QC_CURING_TYPE_OPTIONS.find((option) => option.value === subType)?.label ?? subType;

export const mapQcCuringTypeToSubType = (value: string): QcApiSubType =>
  isQcCuringSubType(value) ? value : null;

/** Map manufacturing / API curing type strings → QC subType. */
export const normalizeQcCuringType = (value: unknown): QcCuringSubType | "" => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const upper = raw.toUpperCase().replace(/[\s-]+/g, "_");
  if (upper === "NORMAL" || upper === "NORMAL_CURING") return "NORMAL";
  if (upper === "CONFINED" || upper === "CONFINED_CURING") return "CONFINED";
  if (
    upper === "N2_PRESSURE" ||
    upper === "N2_PRESSURE_CURING" ||
    upper === "NITROGEN_PRESSURE_CURING" ||
    upper === "NITROGEN_PRESSURE"
  ) {
    return "N2_PRESSURE";
  }
  if (isQcCuringSubType(upper)) return upper;
  return "";
};

export const QC_CURING_CONFIGURATION_OPTIONS = [
  { value: "SINGLE", label: "Single" },
  { value: "PAIR", label: "Pair" },
  { value: "TRIPLE", label: "Triple" },
] as const;

export const QC_CURING_CYCLE_OPTIONS = [
  { value: "STANDARD", label: "Standard Cycle" },
  { value: "MODIFIED", label: "Modified Cycle" },
] as const;

export const QC_CURING_HOT_WATER_STATUS_OPTIONS = [
  { value: "ON", label: "ON" },
  { value: "OFF", label: "OFF" },
  { value: "NA", label: "NA" },
] as const;

/** Optional temperature labels only — initial form rows stay empty until API seed. */
export const QC_CURING_CYCLE_PRESET_ROWS = [
  { SR_NO: 1 },
  { SR_NO: 2 },
  { SR_NO: 3 },
  { SR_NO: 4 },
  { SR_NO: 5 },
  { SR_NO: 6 },
  { SR_NO: 7 },
  { SR_NO: 8 },
  { SR_NO: 9 },
  { SR_NO: 10 },
] as const;

export const QC_CURING_SUBSCALE_TEMPERATURE_PLACEHOLDER = "Enter Oven Set Temperature (°C)";

export const QC_CURING_SUBSCALE_PARAMETER_PRESET_ROWS = [
  { SR_NO: 1, PARAMETER: "" },
  { SR_NO: 2, PARAMETER: "" },
  { SR_NO: 3, PARAMETER: "" },
  { SR_NO: 4, PARAMETER: "" },
  { SR_NO: 5, PARAMETER: "" },
  { SR_NO: 6, PARAMETER: "" },
] as const;

export type QcCuringSubscaleParameterColumnId =
  | "BEM_NO"
  | "WHEEL_PEEL_NO"
  | "CARTON_NO"
  | "CONTROL_GRAIN_NO";

const BEM_ARTICLE_TYPE_ORDER = ["40_KG_BEM", "10_KG_BEM", "2_KG_BEM"] as const;

const SUBSCALE_ARTICLE_TYPE_ORDER = [
  ...BEM_ARTICLE_TYPE_ORDER,
  "WHEEL_PEEL",
  "SBS_TBS",
  "CARTOONS",
] as const;

export const resolveQcSubscaleArticleColumn = (
  articleType: unknown,
): QcCuringSubscaleParameterColumnId | null => {
  const normalized = String(articleType ?? "")
    .trim()
    .toUpperCase();
  if (BEM_ARTICLE_TYPE_ORDER.includes(normalized as (typeof BEM_ARTICLE_TYPE_ORDER)[number])) {
    return "BEM_NO";
  }
  if (
    normalized === "WHEEL_PEEL" ||
    normalized === "CARTOONS" ||
    normalized === "CARTONS" ||
    normalized === "SBS_TBS"
  ) {
    return "BEM_NO";
  }
  return null;
};

export const bemArticleTypeSortOrder = (articleType: unknown): number => {
  const normalized = String(articleType ?? "")
    .trim()
    .toUpperCase();
  const index = BEM_ARTICLE_TYPE_ORDER.indexOf(
    normalized as (typeof BEM_ARTICLE_TYPE_ORDER)[number],
  );
  return index >= 0 ? index : 99;
};

export const subscaleArticleTypeSortOrder = (articleType: unknown): number => {
  const normalized = String(articleType ?? "")
    .trim()
    .toUpperCase();
  if (normalized === "CARTONS") {
    return SUBSCALE_ARTICLE_TYPE_ORDER.indexOf("CARTOONS");
  }
  const index = SUBSCALE_ARTICLE_TYPE_ORDER.indexOf(
    normalized as (typeof SUBSCALE_ARTICLE_TYPE_ORDER)[number],
  );
  return index >= 0 ? index : 99;
};

export const QC_CURING_SECTION_TITLES: Record<string, string> = {
  [QC_CURING_SECTION_IDS.MOTOR_SETUP]: "Curing Configuration",
  [QC_CURING_SECTION_IDS.CYCLE_DETAILS]: "Curing Cycle Details",
  [QC_CURING_SECTION_IDS.PRESSURE_DETAILS]: "Pressure Curing Details",
  [QC_CURING_SECTION_IDS.POST_CURING]: "Post Curing Details",
  [QC_CURING_SECTION_IDS.SUBSCALE]: "Subscale Articles Curing",
};

export const getQcCuringMotorLabel = (motorId?: string | null) =>
  motorId?.trim() || S.CURING_MOTOR_ID_LABEL;

export const curingSubTypeShowsPressureDetails = (subType: string | null | undefined) =>
  normalizeQcCuringType(subType) === "CONFINED";

export const curingSubTypeShowsPropellantPressure = (subType: string | null | undefined) => {
  const normalized = normalizeQcCuringType(subType);
  return normalized === "CONFINED" || normalized === "N2_PRESSURE";
};

export const curingSubTypeShowsPeakPressureAchieved = (subType: string | null | undefined) =>
  normalizeQcCuringType(subType) === "CONFINED";

export type QcCuringSetupField =
  | "MOTOR_STAGE"
  | "CURING_TYPE"
  | "OVEN"
  | "OVEN_NUMBER"
  | "MOTOR_POSITIONING_DATE_TIME";

const QC_SUBSCALE_ARTICLE_TYPE_LABELS: Record<string, string> = {
  "40_KG_BEM": "40 kg BEM",
  "10_KG_BEM": "10 kg BEM",
  "2_KG_BEM": "2 kg BEM",
  WHEEL_PEEL: "Wheel Peel",
  SBS_TBS: "SBS/TBS",
  CARTOONS: "Cartoons",
  CARTONS: "Cartoons",
};

export const formatQcSubscaleArticleTypeLabel = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return QC_SUBSCALE_ARTICLE_TYPE_LABELS[raw] ?? raw.replace(/_/g, " ");
};

/** UI label / loose value → API articleType enum for subscale curingTable. */
export const toQcSubscaleArticleTypeApi = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const upper = raw.toUpperCase().replace(/\s+/g, "_").replace(/\//g, "_");
  if (QC_SUBSCALE_ARTICLE_TYPE_LABELS[upper] || upper === "CARTONS") {
    return upper === "CARTONS" ? "CARTOONS" : upper;
  }
  const matched = Object.entries(QC_SUBSCALE_ARTICLE_TYPE_LABELS).find(
    ([, label]) => label.toLowerCase() === raw.toLowerCase(),
  );
  if (matched) return matched[0] === "CARTONS" ? "CARTOONS" : matched[0];
  return upper;
};

export const formatQcCuringMotorStageLabel = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^stage\s/i.test(raw)) return raw;
  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 0) return `Stage ${numeric}`;
  return raw;
};

export type QcCuringCycleColumnId =
  | "TEMPERATURE"
  | "DURATION"
  | "START_DATE"
  | "START_TIME"
  | "END_DATE"
  | "END_TIME"
  | "ACTUAL_DURATION"
  | "PROPELLANT_PRESSURE"
  | "PEAK_PRESSURE_ACHIEVED"
  | "HOT_WATER_STATUS"
  | "REMARKS";

export const resolveCuringCycleColumnIds = (
  subType: string | null | undefined,
): QcCuringCycleColumnId[] => {
  const base: QcCuringCycleColumnId[] = [
    "TEMPERATURE",
    "DURATION",
    "START_DATE",
    "START_TIME",
    "END_DATE",
    "END_TIME",
    "ACTUAL_DURATION",
  ];
  const normalized = normalizeQcCuringType(subType);
  if (normalized === "CONFINED") {
    return [...base, "PROPELLANT_PRESSURE", "PEAK_PRESSURE_ACHIEVED", "HOT_WATER_STATUS", "REMARKS"];
  }
  if (normalized === "N2_PRESSURE") {
    return [...base, "PROPELLANT_PRESSURE", "HOT_WATER_STATUS", "REMARKS"];
  }
  return [...base, "HOT_WATER_STATUS", "REMARKS"];
};
