import type { QcApiDivision } from "../../../schema-engine/adapters/qc.adapter";

export const QC_WEIGHMENT_API_DIVISION = "WEIGHTMENT" as const satisfies QcApiDivision;

export const QC_WEIGHMENT_SECTION_IDS = {
  WEIGHTSCALE_DETAILS: "WEIGHTSCALE_DETAILS",
  MOTOR_WEIGHT_DETAILS: "MOTOR_WEIGHT_DETAILS",
  ATTACHMENTS: "ATTACHMENTS",
} as const;

export const QC_WEIGHMENT_SECTION_TITLES: Record<string, string> = {
  [QC_WEIGHMENT_SECTION_IDS.WEIGHTSCALE_DETAILS]: "Weighscale Details",
  [QC_WEIGHMENT_SECTION_IDS.MOTOR_WEIGHT_DETAILS]: "Weighment Details",
  [QC_WEIGHMENT_SECTION_IDS.ATTACHMENTS]: "Attachments",
};

export const QC_WEIGHMENT_FIELD_LABELS = {
  WEIGHSCALE_NO: "Weighscale No.",
  CALIBRATION_DUE_DATE: "Calibration Due Date",
  SR_NO: "Sr. No.",
  WEIGHT_PARAMETER: "Rocket Motor Id. No.",
  WEIGHT_KG: "Weight (kg)",
  UPLOAD_REPORT: "Upload Report",
} as const;

export const QC_WEIGHMENT_PROPELLANT_FORMULA = "H = G − (A − B + C + D − E + F)";
export const QC_WEIGHMENT_API_PROPELLANT_FORMULA = "G-(A-B+C+D-E+F)";
export const QC_WEIGHMENT_PROPELLANT_FORMULA_NOTE = "shall be calculated automatically";

export type QcWeighmentWeightRow = {
  SR_NO: string;
  WEIGHT_PARAMETER: string;
  WEIGHT_KG: string;
  locked?: boolean;
};

export const QC_WEIGHMENT_WEIGHT_PRESET: Array<
  Pick<QcWeighmentWeightRow, "SR_NO" | "WEIGHT_PARAMETER" | "locked">
> = [
  {
    SR_NO: "A",
    WEIGHT_PARAMETER: "Weight of empty motor with insulation and without harness",
  },
  {
    SR_NO: "B",
    WEIGHT_PARAMETER: "Weight of rubber dust after abrading",
  },
  {
    SR_NO: "C",
    WEIGHT_PARAMETER: "Weight of liner coating material",
  },
  {
    SR_NO: "D",
    WEIGHT_PARAMETER: "Weight of loose flap filling material",
  },
  {
    SR_NO: "E",
    WEIGHT_PARAMETER: "Weight of Extra rubber trimmed",
  },
  {
    SR_NO: "F",
    WEIGHT_PARAMETER: "Weight of Inhibition material applied",
  },
  {
    SR_NO: "G",
    WEIGHT_PARAMETER: "Final Weight of finished motor without harness",
  },
  {
    SR_NO: "H",
    WEIGHT_PARAMETER: "Weight of propellant, kg",
    locked: true,
  },
];

/** H = G − (A − B + C + D − E + F) */
export const computeQcWeighmentPropellantWeight = (rows: QcWeighmentWeightRow[]): string => {
  const byKey = new Map(rows.map((row) => [String(row.SR_NO).trim().toUpperCase(), row.WEIGHT_KG]));
  const read = (key: string): number | null => {
    const raw = String(byKey.get(key) ?? "").trim();
    if (!raw) return null;
    const parsed = Number(raw.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  };
  const a = read("A");
  const b = read("B");
  const c = read("C");
  const d = read("D");
  const e = read("E");
  const f = read("F");
  const g = read("G");
  if ([a, b, c, d, e, f, g].some((value) => value == null)) return "";
  const result = (g as number) - ((a as number) - (b as number) + (c as number) + (d as number) - (e as number) + (f as number));
  if (!Number.isFinite(result)) return "";
  return String(Number(result.toFixed(4)));
};

export const applyQcWeighmentRowComputation = (rows: QcWeighmentWeightRow[]): QcWeighmentWeightRow[] => {
  const computedH = computeQcWeighmentPropellantWeight(rows);
  return rows.map((row) =>
    String(row.SR_NO).trim().toUpperCase() === "H" ? { ...row, WEIGHT_KG: computedH, locked: true } : row,
  );
};

export const emptyQcWeighmentWeightRows = (): QcWeighmentWeightRow[] =>
  applyQcWeighmentRowComputation(
    QC_WEIGHMENT_WEIGHT_PRESET.map((preset) => ({
      SR_NO: preset.SR_NO,
      WEIGHT_PARAMETER: preset.WEIGHT_PARAMETER,
      WEIGHT_KG: "",
      locked: Boolean(preset.locked),
    })),
  );

export const getQcWeighmentMotorLabel = (motorId?: string | null) =>
  motorId?.trim() ? `${motorId.trim()} — Weighment` : "Weighment";
