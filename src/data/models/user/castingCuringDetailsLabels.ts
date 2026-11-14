/**
 * Create-form labels + blockId normalization for Casting & Curing details UI.
 * Details payloads use camelCase keys; create UI uses SCREAMING_SNAKE — support both.
 */

export type CcDetailsColumn = {
  key: string;
  label: string;
  emphasize?: "result" | "spec" | "remarks";
};

/** Canonical block ids used for UI-owned details tables. */
export type CcDetailsBlockId =
  | "MANDREL_MEASUREMENTS"
  | "FEED_PIPE_DISTANCE"
  | "FINAL_MIX_BOWL_DETAILS"
  | "CASTING_FROM_BOWL_DETAILS"
  | "SLURRY_CAST_FROM_BOWLS"
  | "POST_CAST_TABLE"
  | "CURING_TABLE";

const BLOCK_ID_ALIASES: Record<string, CcDetailsBlockId> = {
  mandrelmeasurements: "MANDREL_MEASUREMENTS",
  mandrel_measurements: "MANDREL_MEASUREMENTS",
  feedpipedistance: "FEED_PIPE_DISTANCE",
  feed_pipe_distance: "FEED_PIPE_DISTANCE",
  finalmixbowldetails: "FINAL_MIX_BOWL_DETAILS",
  final_mix_bowl_details: "FINAL_MIX_BOWL_DETAILS",
  castingfrombowldetails: "CASTING_FROM_BOWL_DETAILS",
  casting_from_bowl_details: "CASTING_FROM_BOWL_DETAILS",
  slurrycastfrombowls: "SLURRY_CAST_FROM_BOWLS",
  slurry_cast_from_bowls: "SLURRY_CAST_FROM_BOWLS",
  postcasttable: "POST_CAST_TABLE",
  post_cast_table: "POST_CAST_TABLE",
  curingtable: "CURING_TABLE",
  curing_table: "CURING_TABLE",
  curing_cycles: "CURING_TABLE",
  curingcycles: "CURING_TABLE",
};

export const normalizeCcBlockId = (blockId: string): CcDetailsBlockId | null => {
  const raw = String(blockId ?? "")
    .replace(/\s+\(\d+\)$/, "")
    .trim();
  if (!raw) return null;
  const compact = raw.replace(/[\s-]+/g, "_").toLowerCase().replace(/_/g, "");
  const underscored = raw.replace(/[\s-]+/g, "_").toLowerCase();
  return (
    BLOCK_ID_ALIASES[compact] ??
    BLOCK_ID_ALIASES[underscored] ??
    (BLOCK_ID_ALIASES[raw.toLowerCase()] as CcDetailsBlockId | undefined) ??
    null
  );
};

/** Create-form scalar / field labels (keyed by camelCase and SCREAMING_SNAKE). */
export const CC_FIELD_LABELS: Record<string, string> = {
  // Final assembly scalars
  emptyMotorWeight: "Weight of assembled empty motor casing (kg)",
  EMPTY_MOTOR_WEIGHT: "Weight of assembled empty motor casing (kg)",
  vacuumApplied: "Vacuum Applied (overnight)",
  VACUUM_APPLIED: "Vacuum Applied (overnight)",
  reading1: "Reading 1 (mm)",
  READING_1: "Reading 1 (mm)",
  reading2: "Reading 2 (mm)",
  READING_2: "Reading 2 (mm)",
  // Casting process scalars
  initialVacuum: "Initial Vacuum",
  INITIAL_VACUUM: "Initial Vacuum",
  vacuumPressureCasting: "Vacuum Pressure Created for Casting",
  VACUUM_PRESSURE_CASTING: "Vacuum Pressure Created for Casting",
  vacuumPressureSoaking: "Vacuum Pressure Created for Soaking",
  VACUUM_PRESSURE_SOAKING: "Vacuum Pressure Created for Soaking",
  tdiClearanceAfterVacuum: "TDI Clearance after Vacuum trial",
  TDI_CLEARANCE_AFTER_VACUUM: "TDI Clearance after Vacuum trial",
  // Post curing
  otherObservations: "Any Other Observations",
  OTHER_OBSERVATIONS: "Any Other Observations",
  visualObservation: "Visual Observation Of Cured Motor",
  VISUAL_OBSERVATION: "Visual Observation Of Cured Motor",
  pressurePlateRemovalDateTime: "Date & Time Of Removal Of Pressure Plate",
  PRESSURE_PLATE_REMOVAL_DATE_TIME: "Date & Time Of Removal Of Pressure Plate",
  shoreAHardness: "Hardness (Shore A)",
  SHORE_A_HARDNESS: "Hardness (Shore A)",
  shoreAhardness: "Hardness (Shore A)",
  decoringDispatchDateTime: "Date & Time Of Dispatch For De-coring",
  DECORING_DISPATCH_DATE_TIME: "Date & Time Of Dispatch For De-coring",
  // De-coring
  decoringDateTime: "Date & Time Of De-coring",
  decoringDate: "Date & Time Of De-coring",
  DECORING_DATE: "Date & Time Of De-coring",
  buildingNo: "Building No",
  BUILDING_NO: "Building No",
  decoringLoad: "De-coring Load (kg)",
  DECORING_LOAD: "De-coring Load (kg)",
  propellantTemperature: "Propellent Temperature (Celcius)",
  PROPELLANT_TEMPERATURE: "Propellent Temperature (Celcius)",
  rh: "RH (%)",
  RH: "RH (%)",
  mandrelWeight: "Mandrel Weight (KG)",
  MANDREL_WEIGHT: "Mandrel Weight (KG)",
  decoringRemarks: "Remarks",
  DECORING_REMARKS: "Remarks",
  remarks: "Remarks",
  REMARKS: "Remarks",
  decoringVisualObservation: "Visual Observations",
  DECORING_VISUAL_OBSERVATION: "Visual Observations",
};

export const resolveCcFieldLabel = (key: string, fallbackLabel?: string): string => {
  const trimmed = String(key ?? "").trim();
  if (!trimmed) return fallbackLabel ?? "";
  // field keys may be nested like "section.field"
  const leaf = trimmed.includes(".") ? trimmed.slice(trimmed.lastIndexOf(".") + 1) : trimmed;
  return CC_FIELD_LABELS[leaf] ?? CC_FIELD_LABELS[trimmed] ?? fallbackLabel ?? leaf;
};

const compactCcKey = (key: string): string =>
  String(key ?? "")
    .replace(/[\s_-]+/g, "")
    .toLowerCase();

const isCcPresentValue = (value: unknown): boolean => {
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (typeof value === "object") {
    // Prefer unwrapped API scalars ({ parsedValue } / { source }) when present.
    const obj = value as Record<string, unknown>;
    if ("parsedValue" in obj && obj.parsedValue != null && obj.parsedValue !== "") {
      return true;
    }
    if ("source" in obj && obj.source != null && String(obj.source).trim() !== "") {
      return true;
    }
    // Non-empty plain object / Decimal-like payload still counts as present.
    return Object.keys(obj).length > 0;
  }
  return String(value).trim() !== "";
};

const unwrapCcCellValue = (value: unknown): unknown => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if ("parsedValue" in obj && obj.parsedValue !== undefined) return obj.parsedValue;
    if ("source" in obj && obj.source !== undefined && obj.source !== "") return obj.source;
  }
  return value;
};

export const pickCcRowValue = (
  row: Record<string, unknown>,
  ...keys: string[]
): unknown => {
  if (!row || typeof row !== "object") return "";

  // 1) Exact key match (prefer non-empty).
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(row, key)) continue;
    const value = row[key];
    if (isCcPresentValue(value)) return unwrapCcCellValue(value);
  }

  // 2) Compact / case-insensitive match (aMock, A_MOCK, amock, AMock, …).
  const wanted = new Set(keys.map(compactCcKey).filter(Boolean));
  if (wanted.size) {
    for (const [key, value] of Object.entries(row)) {
      if (!wanted.has(compactCcKey(key))) continue;
      if (isCcPresentValue(value)) return unwrapCcCellValue(value);
    }
  }

  // 3) Exact key present but empty / null.
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      return unwrapCcCellValue(row[key]);
    }
  }

  return "";
};

export const FINAL_MIX_BOWL_COLUMNS: CcDetailsColumn[] = [
  { key: "bowlId", label: "Bowl Id" },
  { key: "bowlReceiptTime", label: "Bowl Receipt Date & Time" },
  { key: "initialWeight", label: "Initial Weight" },
  { key: "finalWeight", label: "Final Weight" },
  { key: "initialSlurryDepth", label: "Initial Slurry Depth" },
  { key: "dcOpenTime", label: "Bowl D/C Valve Opening Date & Time" },
  { key: "dcCloseTime", label: "Bowl D/C Valve Closing Date & Time" },
  { key: "slurryDepthAfterDc", label: "Depth of Slurry after Opening of D/C Valve" },
  { key: "ballValveOpenTime", label: "Ball Valve Opening Date & Time" },
];

export const CASTING_FROM_BOWL_COLUMNS: CcDetailsColumn[] = [
  { key: "bowlId", label: "Bowl Id" },
  { key: "timeInterval", label: "Time" },
  { key: "rh", label: "RH (%)" },
  { key: "viscosity", label: "Viscosity (Poise)" },
  { key: "motorId", label: "Motor Id No." },
  { key: "slurryDepth", label: "Slurry Depth (cm)" },
  { key: "slurryCast", label: "Slurry Cast (kg)" },
  { key: "flowRate", label: "Flow Rate (kg/min)" },
  { key: "valveOpening", label: "Valve Opening (%)" },
  { key: "vacuumLevel", label: "Vacuum Level (torr)" },
];

export const SLURRY_CAST_COLUMNS: CcDetailsColumn[] = [
  { key: "fmMotorLabel", label: "FM/Motor Id" },
  { key: "slurryCast", label: "Slurry Cast (kg)" },
];

export const POST_CAST_COLUMNS: CcDetailsColumn[] = [
  { key: "activity", label: "Activity" },
  { key: "details", label: "Post Cast Operation Details" },
];

export const FEED_PIPE_COLUMNS: CcDetailsColumn[] = [
  { key: "reading1", label: "Reading 1 (mm)" },
  { key: "reading2", label: "Reading 2 (mm)" },
];

/** Map fixed-column keys → possible row key aliases. */
const COLUMN_KEY_ALIASES: Record<string, string[]> = {
  bowlId: ["bowlId", "BOWL_ID"],
  bowlReceiptTime: ["bowlReceiptDateTime", "bowlReceiptTime", "BOWL_RECEIPT_TIME"],
  initialWeight: ["initialWeight", "INITIAL_WEIGHT"],
  finalWeight: ["finalWeight", "FINAL_WEIGHT"],
  initialSlurryDepth: ["initialSlurryDepth", "INITIAL_SLURRY_DEPTH"],
  dcOpenTime: ["dcOpenDateTime", "dcOpenTime", "DC_OPEN_TIME"],
  dcCloseTime: ["dcCloseDateTime", "dcCloseTime", "DC_CLOSE_TIME"],
  slurryDepthAfterDc: ["slurryDepthAfterDc", "SLURRY_DEPTH_AFTER_DC"],
  ballValveOpenTime: ["ballValveOpenDateTime", "ballValveOpenTime", "BALL_VALVE_OPEN_TIME"],
  timeInterval: ["timeInterval", "TIME_INTERVAL", "TIME", "time"],
  rh: ["rh", "RH"],
  viscosity: ["viscosity", "VISCOSITY"],
  motorId: ["motorId", "MOTOR_ID"],
  slurryDepth: ["slurryDepth", "SLURRY_DEPTH"],
  slurryCast: ["slurryCast", "SLURRY_CAST"],
  flowRate: ["flowRate", "FLOW_RATE"],
  valveOpening: ["valveOpening", "VALVE_OPENING"],
  vacuumLevel: ["vacuumLevel", "VACUUM_LEVEL"],
  fmMotorLabel: ["fmMotorLabel", "FM_MOTOR_LABEL"],
  activity: ["activity", "ACTIVITY"],
  details: ["details", "DETAILS"],
  reading1: ["reading1", "READING_1", "READING1"],
  reading2: ["reading2", "READING_2", "READING2"],
  // Mandrel
  srNo: ["srNo", "SR_NO"],
  A_MOCK: ["A_MOCK", "aMock"],
  B_MOCK: ["B_MOCK", "bMock"],
  B_FINAL: ["B_FINAL", "bFinal"],
  C_MOCK: ["C_MOCK", "cMock"],
  C_FINAL: ["C_FINAL", "cFinal"],
  BELLOWS_THICKNESS_D: ["BELLOWS_THICKNESS_D", "bellowsThicknessD"],
  E_MOCK: ["E_MOCK", "eMock"],
  E_FINAL: ["E_FINAL", "eFinal"],
};

export const resolveCcFixedColumnValue = (
  row: Record<string, unknown>,
  columnKey: string,
  rowIndex: number,
): unknown => {
  if (columnKey === "srNo") {
    const raw = pickCcRowValue(row, "srNo", "SR_NO");
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
    return rowIndex + 1;
  }
  if (columnKey === "activity") {
    const activity = String(pickCcRowValue(row, "activity", "ACTIVITY") ?? "");
    const fieldType = String(row.detailsFieldType ?? row.DETAILS_FIELD_TYPE ?? "").toLowerCase();
    if (fieldType === "datetime") {
      return activity.replace(/\bTime\b/i, "Date & Time");
    }
    return activity;
  }
  const aliases = COLUMN_KEY_ALIASES[columnKey] ?? [columnKey];
  return pickCcRowValue(row, ...aliases);
};
