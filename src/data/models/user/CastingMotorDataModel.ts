export type MandrelMeasurementRow = {
  srNo: string;
  A_MOCK: string;
  B_MOCK: string;
  B_FINAL: string;
  C_MOCK: string;
  C_FINAL: string;
  BELLOWS_THICKNESS_D: string;
  E_MOCK: string;
  E_FINAL: string;
};

export type FeedPipeDistanceRow = {
  READING_1: string;
  READING_2: string;
};

export type CastingMotorCasingInstance = {
  MANDREL_MEASUREMENTS: MandrelMeasurementRow[];
  FEED_PIPE_DISTANCE: FeedPipeDistanceRow[];
  EMPTY_MOTOR_WEIGHT: string;
};

export type CastingBowlDetailRow = {
  BOWL_ID: string;
  PREMIX_NO?: string;
  BOWL_NO?: string;
  BOWL_RECEIPT_TIME: string;
  INITIAL_WEIGHT: string;
  FINAL_WEIGHT: string;
  INITIAL_SLURRY_DEPTH: string;
  DC_OPEN_TIME: string;
  DC_CLOSE_TIME: string;
  SLURRY_DEPTH_AFTER_DC: string;
  BALL_VALVE_OPEN_TIME: string;
};

export type CastingFromBowlRow = {
  BOWL_ID: string;
  PREMIX_NO?: string;
  BOWL_NO?: string;
  TIME_INTERVAL: string;
  RH: string;
  VISCOSITY: string;
  MOTOR_ID: string;
  SLURRY_DEPTH: string;
  SLURRY_CAST: string;
  FLOW_RATE: string;
  VALVE_OPENING: string;
  VACUUM_LEVEL: string;
};

export type SlurryCastRow = {
  ROW_KEY?: string;
  PREMIX_NO?: string;
  BOWL_NO?: string;
  FM_MOTOR_LABEL: string;
  SLURRY_CAST: string;
  readonly?: boolean;
};

export type PostCastRow = {
  ACTIVITY: string;
  DETAILS: string;
  detailsFieldType?: string;
  readonly?: boolean;
};

export type CastingMotorData = {
  FINAL_ASSEMBLY_DETAILS: {
    motorCasing: CastingMotorCasingInstance[];
  };
  CASTING_PROCESS: {
    FINAL_MIX_BOWL_DETAILS: CastingBowlDetailRow[];
    CASTING_FROM_BOWL_DETAILS: CastingFromBowlRow[];
    INITIAL_VACUUM: string;
    VACUUM_PRESSURE_CASTING: string;
    VACUUM_PRESSURE_SOAKING: string;
  };
  SLURRY_CAST_DETAILS: {
    SLURRY_CAST_FROM_BOWLS: SlurryCastRow[];
  };
  POST_CAST_OPERATIONS: {
    POST_CAST_TABLE: PostCastRow[];
  };
};

export type CastingMotorSectionPayload = {
  sectionId: string;
  sectionData: Record<string, unknown>[];
};

export const CASTING_MOTOR_SECTION_IDS = [
  "FINAL_ASSEMBLY_DETAILS",
  "CASTING_PROCESS",
  "SLURRY_CAST_DETAILS",
  "POST_CAST_OPERATIONS",
] as const;

export type CastingMotorSectionId = (typeof CASTING_MOTOR_SECTION_IDS)[number];

const SLURRY_TOTAL_ROW_KEY = "TOTAL";
const SLURRY_TOTAL_LABEL = "Total Slurry Cast";

const POST_CAST_PRESETS: Array<{ ACTIVITY: string; detailsFieldType: string }> = [
  { ACTIVITY: "Soaking Time", detailsFieldType: "time" },
  { ACTIVITY: "Time of removal from pit", detailsFieldType: "time" },
  { ACTIVITY: "Fixtures assembled for curing", detailsFieldType: "text" },
  { ACTIVITY: "Pressure sensor details (If applicable)", detailsFieldType: "text" },
  { ACTIVITY: "Initial pressure reading (If applicable)", detailsFieldType: "text" },
  { ACTIVITY: "Time of dispatch to curing station", detailsFieldType: "time" },
];

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const str = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const parseNumeric = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = str(value).trim().replace(/,/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const formatComputed = (value: number | null): string => {
  if (value === null) return "";
  return String(value);
};

/** C = A − B (mock / final variants). */
export const computeMandrelDifferenceC = (a: string, b: string): string => {
  const aNum = parseNumeric(a);
  const bNum = parseNumeric(b);
  if (aNum === null || bNum === null) return "";
  return formatComputed(aNum - bNum);
};

/** E = C − D (mock / final variants). */
export const computeMandrelLiftE = (c: string, d: string): string => {
  const cNum = parseNumeric(c);
  const dNum = parseNumeric(d);
  if (cNum === null || dNum === null) return "";
  return formatComputed(cNum - dNum);
};

export const applyMandrelFormulas = (row: MandrelMeasurementRow): MandrelMeasurementRow => {
  const C_MOCK = computeMandrelDifferenceC(row.A_MOCK, row.B_MOCK);
  const C_FINAL = computeMandrelDifferenceC(row.A_MOCK, row.B_FINAL);
  return {
    ...row,
    C_MOCK,
    C_FINAL,
    E_MOCK: computeMandrelLiftE(C_MOCK, row.BELLOWS_THICKNESS_D),
    E_FINAL: computeMandrelLiftE(C_FINAL, row.BELLOWS_THICKNESS_D),
  };
};

export const createEmptyMandrelMeasurementRow = (srNo: number | string = 1): MandrelMeasurementRow =>
  applyMandrelFormulas({
    srNo: String(srNo),
    A_MOCK: "",
    B_MOCK: "",
    B_FINAL: "",
    C_MOCK: "",
    C_FINAL: "",
    BELLOWS_THICKNESS_D: "",
    E_MOCK: "",
    E_FINAL: "",
  });

export const createEmptyFeedPipeDistanceRow = (): FeedPipeDistanceRow => ({
  READING_1: "",
  READING_2: "",
});

export const createEmptyMotorCasingInstance = (): CastingMotorCasingInstance => ({
  MANDREL_MEASUREMENTS: [
    createEmptyMandrelMeasurementRow(1),
    createEmptyMandrelMeasurementRow(2),
    createEmptyMandrelMeasurementRow(3),
  ],
  FEED_PIPE_DISTANCE: [createEmptyFeedPipeDistanceRow()],
  EMPTY_MOTOR_WEIGHT: "",
});

export const createEmptyBowlDetailRow = (): CastingBowlDetailRow => ({
  BOWL_ID: "",
  PREMIX_NO: "",
  BOWL_NO: "",
  BOWL_RECEIPT_TIME: "",
  INITIAL_WEIGHT: "",
  FINAL_WEIGHT: "",
  INITIAL_SLURRY_DEPTH: "",
  DC_OPEN_TIME: "",
  DC_CLOSE_TIME: "",
  SLURRY_DEPTH_AFTER_DC: "",
  BALL_VALVE_OPEN_TIME: "",
});

export const createEmptyCastingFromBowlRow = (): CastingFromBowlRow => ({
  BOWL_ID: "",
  PREMIX_NO: "",
  BOWL_NO: "",
  TIME_INTERVAL: "",
  RH: "",
  VISCOSITY: "",
  MOTOR_ID: "",
  SLURRY_DEPTH: "",
  SLURRY_CAST: "",
  FLOW_RATE: "",
  VALVE_OPENING: "",
  VACUUM_LEVEL: "",
});

export const createEmptySlurryCastRow = (): SlurryCastRow => ({
  ROW_KEY: "",
  PREMIX_NO: "",
  BOWL_NO: "",
  FM_MOTOR_LABEL: "",
  SLURRY_CAST: "",
});

const createSlurryTotalRow = (total: string): SlurryCastRow => ({
  ROW_KEY: SLURRY_TOTAL_ROW_KEY,
  FM_MOTOR_LABEL: SLURRY_TOTAL_LABEL,
  SLURRY_CAST: total,
  readonly: true,
});

export const createEmptyPostCastTable = (): PostCastRow[] =>
  POST_CAST_PRESETS.map((preset) => ({
    ACTIVITY: preset.ACTIVITY,
    DETAILS: "",
    detailsFieldType: preset.detailsFieldType,
    readonly: true,
  }));

export const createEmptyCastingMotorData = (): CastingMotorData => ({
  FINAL_ASSEMBLY_DETAILS: {
    motorCasing: [createEmptyMotorCasingInstance()],
  },
  CASTING_PROCESS: {
    FINAL_MIX_BOWL_DETAILS: [],
    CASTING_FROM_BOWL_DETAILS: [],
    INITIAL_VACUUM: "",
    VACUUM_PRESSURE_CASTING: "",
    VACUUM_PRESSURE_SOAKING: "",
  },
  SLURRY_CAST_DETAILS: {
    SLURRY_CAST_FROM_BOWLS: [createSlurryTotalRow("")],
  },
  POST_CAST_OPERATIONS: {
    POST_CAST_TABLE: createEmptyPostCastTable(),
  },
});

const isSlurryTotalRow = (row: SlurryCastRow): boolean =>
  str(row.ROW_KEY).trim().toUpperCase() === SLURRY_TOTAL_ROW_KEY ||
  str(row.FM_MOTOR_LABEL).trim().toLowerCase() === SLURRY_TOTAL_LABEL.toLowerCase();

/** Ensure a TOTAL row exists with the sum of data-row SLURRY_CAST values. */
export const syncSlurryCastTotalRow = (rows: SlurryCastRow[]): SlurryCastRow[] => {
  const dataRows = rows.filter((row) => !isSlurryTotalRow(row));
  let sum = 0;
  let hasAny = false;
  for (const row of dataRows) {
    const n = parseNumeric(row.SLURRY_CAST);
    if (n === null) continue;
    hasAny = true;
    sum += n;
  }
  return [...dataRows, createSlurryTotalRow(hasAny ? String(sum) : "")];
};

const META_KEYS = new Set([
  "type",
  "label",
  "parameter",
  "operation",
  "valueFieldType",
  "detailsFieldType",
  "readonly",
  "srNo",
  "SR_NO",
  "ROW_KEY",
  "ACTIVITY",
  "BOWL_ID",
  "FM_MOTOR_LABEL",
  "PREMIX_NO",
  "BOWL_NO",
  "MOTOR_ID",
]);

const hasUserContent = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (typeof File !== "undefined" && value instanceof File) return true;
  if (Array.isArray(value)) return value.some((item) => hasUserContent(item));
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(([key, entry]) => {
      if (key.startsWith("_") || META_KEYS.has(key) || key.endsWith("__fieldType")) return false;
      return hasUserContent(entry);
    });
  }
  return false;
};

export const castingMotorDataHasUserInput = (data: CastingMotorData): boolean =>
  hasUserContent(data);

const stripRowForPayload = (row: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    if (key === "valueFieldType" || key === "detailsFieldType" || key === "readonly") return;
    if (key.endsWith("__fieldType") || key.startsWith("_")) return;
    out[key] = value;
  });
  return out;
};

const mandrelRowsForPayload = (rows: MandrelMeasurementRow[]): unknown[] =>
  rows.map((row, index) => {
    const computed = applyMandrelFormulas(row);
    return stripRowForPayload({
      srNo: Number(computed.srNo) || index + 1,
      A_MOCK: computed.A_MOCK,
      B_MOCK: computed.B_MOCK,
      B_FINAL: computed.B_FINAL,
      C_MOCK: computed.C_MOCK,
      C_FINAL: computed.C_FINAL,
      BELLOWS_THICKNESS_D: computed.BELLOWS_THICKNESS_D,
      E_MOCK: computed.E_MOCK,
      E_FINAL: computed.E_FINAL,
    });
  });

const feedPipeRowsForPayload = (rows: FeedPipeDistanceRow[]): unknown[] =>
  rows.map((row) =>
    stripRowForPayload({
      READING_1: row.READING_1,
      READING_2: row.READING_2,
    }),
  );

const bowlDetailRowsForPayload = (rows: CastingBowlDetailRow[]): unknown[] =>
  rows.map((row, index) =>
    stripRowForPayload({
      SR_NO: index + 1,
      BOWL_ID: row.BOWL_ID,
      ...(row.PREMIX_NO ? { PREMIX_NO: row.PREMIX_NO } : {}),
      ...(row.BOWL_NO ? { BOWL_NO: row.BOWL_NO } : {}),
      BOWL_RECEIPT_TIME: row.BOWL_RECEIPT_TIME,
      INITIAL_WEIGHT: row.INITIAL_WEIGHT,
      FINAL_WEIGHT: row.FINAL_WEIGHT,
      INITIAL_SLURRY_DEPTH: row.INITIAL_SLURRY_DEPTH,
      DC_OPEN_TIME: row.DC_OPEN_TIME,
      DC_CLOSE_TIME: row.DC_CLOSE_TIME,
      SLURRY_DEPTH_AFTER_DC: row.SLURRY_DEPTH_AFTER_DC,
      BALL_VALVE_OPEN_TIME: row.BALL_VALVE_OPEN_TIME,
    }),
  );

const castingFromBowlRowsForPayload = (rows: CastingFromBowlRow[]): unknown[] =>
  rows.map((row, index) =>
    stripRowForPayload({
      SR_NO: index + 1,
      BOWL_ID: row.BOWL_ID,
      ...(row.PREMIX_NO ? { PREMIX_NO: row.PREMIX_NO } : {}),
      ...(row.BOWL_NO ? { BOWL_NO: row.BOWL_NO } : {}),
      TIME_INTERVAL: row.TIME_INTERVAL,
      RH: row.RH,
      VISCOSITY: row.VISCOSITY,
      MOTOR_ID: row.MOTOR_ID,
      SLURRY_DEPTH: row.SLURRY_DEPTH,
      SLURRY_CAST: row.SLURRY_CAST,
      FLOW_RATE: row.FLOW_RATE,
      VALVE_OPENING: row.VALVE_OPENING,
      VACUUM_LEVEL: row.VACUUM_LEVEL,
    }),
  );

const slurryRowsForPayload = (rows: SlurryCastRow[]): unknown[] =>
  syncSlurryCastTotalRow(rows).map((row) =>
    stripRowForPayload({
      ...(row.ROW_KEY ? { ROW_KEY: row.ROW_KEY } : {}),
      ...(row.PREMIX_NO ? { PREMIX_NO: row.PREMIX_NO } : {}),
      ...(row.BOWL_NO ? { BOWL_NO: row.BOWL_NO } : {}),
      FM_MOTOR_LABEL: row.FM_MOTOR_LABEL,
      SLURRY_CAST: row.SLURRY_CAST,
    }),
  );

const postCastRowsForPayload = (rows: PostCastRow[]): unknown[] =>
  rows.map((row) =>
    stripRowForPayload({
      ACTIVITY: row.ACTIVITY,
      DETAILS: row.DETAILS,
    }),
  );

/**
 * Flatten casting motor data into API section payloads.
 * CASTING_PROCESS vacuum fields sit on the same flat section row as the tables;
 * motorCasing remains nested under FINAL_ASSEMBLY_DETAILS.
 */
export const buildCastingSectionsPayload = (
  data: CastingMotorData,
): CastingMotorSectionPayload[] => {
  const slurryRows = syncSlurryCastTotalRow(
    data.SLURRY_CAST_DETAILS.SLURRY_CAST_FROM_BOWLS ?? [],
  );

  return [
    {
      sectionId: "FINAL_ASSEMBLY_DETAILS",
      sectionData: [
        {
          motorCasing: (data.FINAL_ASSEMBLY_DETAILS.motorCasing ?? []).map((instance) => ({
            MANDREL_MEASUREMENTS: mandrelRowsForPayload(instance.MANDREL_MEASUREMENTS ?? []),
            FEED_PIPE_DISTANCE: feedPipeRowsForPayload(instance.FEED_PIPE_DISTANCE ?? []),
            EMPTY_MOTOR_WEIGHT: str(instance.EMPTY_MOTOR_WEIGHT).trim(),
          })),
        },
      ],
    },
    {
      sectionId: "CASTING_PROCESS",
      sectionData: [
        {
          FINAL_MIX_BOWL_DETAILS: bowlDetailRowsForPayload(
            data.CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS ?? [],
          ),
          CASTING_FROM_BOWL_DETAILS: castingFromBowlRowsForPayload(
            data.CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS ?? [],
          ),
          INITIAL_VACUUM: str(data.CASTING_PROCESS.INITIAL_VACUUM).trim(),
          VACUUM_PRESSURE_CASTING: str(data.CASTING_PROCESS.VACUUM_PRESSURE_CASTING).trim(),
          VACUUM_PRESSURE_SOAKING: str(data.CASTING_PROCESS.VACUUM_PRESSURE_SOAKING).trim(),
        },
      ],
    },
    {
      sectionId: "SLURRY_CAST_DETAILS",
      sectionData: [
        {
          SLURRY_CAST_FROM_BOWLS: slurryRowsForPayload(slurryRows),
        },
      ],
    },
    {
      sectionId: "POST_CAST_OPERATIONS",
      sectionData: [
        {
          POST_CAST_TABLE: postCastRowsForPayload(
            data.POST_CAST_OPERATIONS.POST_CAST_TABLE ?? [],
          ),
        },
      ],
    },
  ];
};

const firstSectionRow = (
  sections: Array<{ sectionId?: string; sectionData?: unknown[] }> | undefined,
  sectionId: string,
): Record<string, unknown> => {
  const match = (sections ?? []).find(
    (section) => str(section.sectionId).trim() === sectionId,
  );
  const rows = asArray(match?.sectionData);
  return asRecord(rows[0]) ?? {};
};

const parseMandrelRow = (item: unknown, index: number): MandrelMeasurementRow => {
  const row = asRecord(item) ?? {};
  return applyMandrelFormulas({
    srNo: str(row.srNo ?? row.SR_NO ?? index + 1),
    A_MOCK: str(row.A_MOCK ?? ""),
    B_MOCK: str(row.B_MOCK ?? ""),
    B_FINAL: str(row.B_FINAL ?? ""),
    C_MOCK: str(row.C_MOCK ?? ""),
    C_FINAL: str(row.C_FINAL ?? ""),
    BELLOWS_THICKNESS_D: str(row.BELLOWS_THICKNESS_D ?? ""),
    E_MOCK: str(row.E_MOCK ?? ""),
    E_FINAL: str(row.E_FINAL ?? ""),
  });
};

const parseFeedPipeRow = (item: unknown): FeedPipeDistanceRow => {
  const row = asRecord(item) ?? {};
  return {
    READING_1: str(row.READING_1 ?? ""),
    READING_2: str(row.READING_2 ?? ""),
  };
};

const parseMotorCasingInstance = (item: unknown): CastingMotorCasingInstance => {
  const row = asRecord(item) ?? {};
  const mandrelRows = asArray(row.MANDREL_MEASUREMENTS).map(parseMandrelRow);
  const feedRows = asArray(row.FEED_PIPE_DISTANCE).map(parseFeedPipeRow);
  return {
    MANDREL_MEASUREMENTS: mandrelRows.length
      ? mandrelRows
      : createEmptyMotorCasingInstance().MANDREL_MEASUREMENTS,
    FEED_PIPE_DISTANCE: feedRows.length ? feedRows : [createEmptyFeedPipeDistanceRow()],
    EMPTY_MOTOR_WEIGHT: str(row.EMPTY_MOTOR_WEIGHT ?? ""),
  };
};

const parseBowlDetailRow = (item: unknown): CastingBowlDetailRow => {
  const row = asRecord(item) ?? {};
  return {
    BOWL_ID: str(row.BOWL_ID ?? ""),
    PREMIX_NO: str(row.PREMIX_NO ?? ""),
    BOWL_NO: str(row.BOWL_NO ?? ""),
    BOWL_RECEIPT_TIME: str(row.BOWL_RECEIPT_TIME ?? ""),
    INITIAL_WEIGHT: str(row.INITIAL_WEIGHT ?? ""),
    FINAL_WEIGHT: str(row.FINAL_WEIGHT ?? ""),
    INITIAL_SLURRY_DEPTH: str(row.INITIAL_SLURRY_DEPTH ?? ""),
    DC_OPEN_TIME: str(row.DC_OPEN_TIME ?? ""),
    DC_CLOSE_TIME: str(row.DC_CLOSE_TIME ?? ""),
    SLURRY_DEPTH_AFTER_DC: str(row.SLURRY_DEPTH_AFTER_DC ?? ""),
    BALL_VALVE_OPEN_TIME: str(row.BALL_VALVE_OPEN_TIME ?? ""),
  };
};

const parseCastingFromBowlRow = (item: unknown): CastingFromBowlRow => {
  const row = asRecord(item) ?? {};
  return {
    BOWL_ID: str(row.BOWL_ID ?? ""),
    PREMIX_NO: str(row.PREMIX_NO ?? ""),
    BOWL_NO: str(row.BOWL_NO ?? ""),
    TIME_INTERVAL: str(row.TIME_INTERVAL ?? ""),
    RH: str(row.RH ?? ""),
    VISCOSITY: str(row.VISCOSITY ?? ""),
    MOTOR_ID: str(row.MOTOR_ID ?? ""),
    SLURRY_DEPTH: str(row.SLURRY_DEPTH ?? ""),
    SLURRY_CAST: str(row.SLURRY_CAST ?? ""),
    FLOW_RATE: str(row.FLOW_RATE ?? ""),
    VALVE_OPENING: str(row.VALVE_OPENING ?? ""),
    VACUUM_LEVEL: str(row.VACUUM_LEVEL ?? ""),
  };
};

const parseSlurryCastRow = (item: unknown): SlurryCastRow => {
  const row = asRecord(item) ?? {};
  const rowKey = str(row.ROW_KEY ?? "");
  const label = str(row.FM_MOTOR_LABEL ?? "");
  const isTotal =
    rowKey.toUpperCase() === SLURRY_TOTAL_ROW_KEY ||
    label.toLowerCase() === SLURRY_TOTAL_LABEL.toLowerCase() ||
    row.readonly === true;
  return {
    ROW_KEY: rowKey || (isTotal ? SLURRY_TOTAL_ROW_KEY : ""),
    PREMIX_NO: str(row.PREMIX_NO ?? ""),
    BOWL_NO: str(row.BOWL_NO ?? ""),
    FM_MOTOR_LABEL: label || (isTotal ? SLURRY_TOTAL_LABEL : ""),
    SLURRY_CAST: str(row.SLURRY_CAST ?? ""),
    ...(isTotal ? { readonly: true } : {}),
  };
};

const parsePostCastTable = (value: unknown): PostCastRow[] => {
  const presets = createEmptyPostCastTable();
  const rows = asArray(value)
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => Boolean(item));

  if (!rows.length) return presets;

  const byActivity = new Map(
    rows.map((row) => [str(row.ACTIVITY ?? row.activity ?? "").trim().toLowerCase(), row] as const),
  );

  const merged = presets.map((preset) => {
    const saved = byActivity.get(preset.ACTIVITY.trim().toLowerCase());
    if (!saved) return preset;
    return {
      ...preset,
      DETAILS: str(saved.DETAILS ?? saved.details ?? saved.value ?? ""),
      detailsFieldType:
        str(
          saved.detailsFieldType ??
            saved.DETAILS__fieldType ??
            saved.DETAILS_fieldType ??
            "",
        ) || preset.detailsFieldType,
    };
  });

  const presetKeys = new Set(presets.map((row) => row.ACTIVITY.trim().toLowerCase()));
  const extras = rows
    .filter((row) => !presetKeys.has(str(row.ACTIVITY ?? row.activity ?? "").trim().toLowerCase()))
    .map((row) => ({
      ACTIVITY: str(row.ACTIVITY ?? row.activity ?? ""),
      DETAILS: str(row.DETAILS ?? row.details ?? row.value ?? ""),
      detailsFieldType:
        str(row.detailsFieldType ?? row.DETAILS__fieldType ?? row.DETAILS_fieldType ?? "") ||
        undefined,
      readonly: row.readonly === true,
    }));

  return [...merged, ...extras];
};

export const parseCastingMotorDataFromSections = (
  sections: Array<{ sectionId?: string; sectionData?: unknown[] }> | undefined,
): CastingMotorData => {
  const empty = createEmptyCastingMotorData();
  if (!sections?.length) return empty;

  const finalAssembly = firstSectionRow(sections, "FINAL_ASSEMBLY_DETAILS");
  const castingProcess = firstSectionRow(sections, "CASTING_PROCESS");
  const slurryCast = firstSectionRow(sections, "SLURRY_CAST_DETAILS");
  const postCast = firstSectionRow(sections, "POST_CAST_OPERATIONS");

  const motorCasingRaw = asArray(finalAssembly.motorCasing);
  const motorCasing = motorCasingRaw.length
    ? motorCasingRaw.map(parseMotorCasingInstance)
    : empty.FINAL_ASSEMBLY_DETAILS.motorCasing;

  const slurryRows = asArray(slurryCast.SLURRY_CAST_FROM_BOWLS).map(parseSlurryCastRow);

  return {
    FINAL_ASSEMBLY_DETAILS: {
      motorCasing,
    },
    CASTING_PROCESS: {
      FINAL_MIX_BOWL_DETAILS: asArray(castingProcess.FINAL_MIX_BOWL_DETAILS).map(
        parseBowlDetailRow,
      ),
      CASTING_FROM_BOWL_DETAILS: asArray(castingProcess.CASTING_FROM_BOWL_DETAILS).map(
        parseCastingFromBowlRow,
      ),
      INITIAL_VACUUM: str(castingProcess.INITIAL_VACUUM ?? ""),
      VACUUM_PRESSURE_CASTING: str(castingProcess.VACUUM_PRESSURE_CASTING ?? ""),
      VACUUM_PRESSURE_SOAKING: str(castingProcess.VACUUM_PRESSURE_SOAKING ?? ""),
    },
    SLURRY_CAST_DETAILS: {
      SLURRY_CAST_FROM_BOWLS: syncSlurryCastTotalRow(
        slurryRows.length ? slurryRows : empty.SLURRY_CAST_DETAILS.SLURRY_CAST_FROM_BOWLS,
      ),
    },
    POST_CAST_OPERATIONS: {
      POST_CAST_TABLE: parsePostCastTable(postCast.POST_CAST_TABLE),
    },
  };
};
