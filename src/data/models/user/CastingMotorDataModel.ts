import {
  compactRecord,
  isLegacySectionArray,
  pickField,
  toApiNumber,
  toApiTime,
  toUiTime,
  unwrapMotorSectionPayload,
} from "./castingCuringFieldCodec";

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

export type CastingSectionsPayload = {
  finalAssemblyDetails: {
    motorCasing: Array<Record<string, unknown>>;
  };
  castingProcess: Record<string, unknown>;
  slurryCastDetails: {
    slurryCastFromBowls: Array<Record<string, unknown>>;
  };
  postCastOperations: {
    postCastTable: Array<Record<string, unknown>>;
  };
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
    FINAL_MIX_BOWL_DETAILS: [createEmptyBowlDetailRow()],
    CASTING_FROM_BOWL_DETAILS: [createEmptyCastingFromBowlRow()],
    INITIAL_VACUUM: "",
    VACUUM_PRESSURE_CASTING: "",
    VACUUM_PRESSURE_SOAKING: "",
  },
  SLURRY_CAST_DETAILS: {
    SLURRY_CAST_FROM_BOWLS: syncSlurryCastTotalRow([createEmptySlurryCastRow()]),
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

const rowHasPayloadValues = (row: Record<string, unknown>): boolean =>
  Object.entries(row).some(([key, value]) => key !== "srNo" && value !== undefined && value !== "");

const mandrelRowsForPayload = (rows: MandrelMeasurementRow[]): Record<string, unknown>[] =>
  rows
    .map((row, index) => {
      const computed = applyMandrelFormulas(row);
      return compactRecord({
        srNo: Number(computed.srNo) || index + 1,
        aMock: toApiNumber(computed.A_MOCK),
        bMock: toApiNumber(computed.B_MOCK),
        bFinal: toApiNumber(computed.B_FINAL),
        cMock: toApiNumber(computed.C_MOCK),
        cFinal: toApiNumber(computed.C_FINAL),
        bellowsThicknessD: toApiNumber(computed.BELLOWS_THICKNESS_D),
        eMock: toApiNumber(computed.E_MOCK),
        eFinal: toApiNumber(computed.E_FINAL),
      });
    })
    .filter(rowHasPayloadValues);

const feedPipeRowsForPayload = (rows: FeedPipeDistanceRow[]): Record<string, unknown>[] =>
  rows
    .map((row, index) =>
      compactRecord({
        srNo: index + 1,
        reading1: toApiNumber(row.READING_1),
        reading2: toApiNumber(row.READING_2),
      }),
    )
    .filter(rowHasPayloadValues);

const bowlDetailRowsForPayload = (rows: CastingBowlDetailRow[]): Record<string, unknown>[] =>
  rows
    .map((row, index) =>
      compactRecord({
        srNo: index + 1,
        bowlId: str(row.BOWL_ID).trim() || undefined,
        bowlReceiptTime: toApiTime(row.BOWL_RECEIPT_TIME),
        initialWeight: toApiNumber(row.INITIAL_WEIGHT),
        finalWeight: toApiNumber(row.FINAL_WEIGHT),
        initialSlurryDepth: toApiNumber(row.INITIAL_SLURRY_DEPTH),
        dcOpenTime: toApiTime(row.DC_OPEN_TIME),
        dcCloseTime: toApiTime(row.DC_CLOSE_TIME),
        slurryDepthAfterDc: toApiNumber(row.SLURRY_DEPTH_AFTER_DC),
        ballValveOpenTime: toApiTime(row.BALL_VALVE_OPEN_TIME),
      }),
    )
    .filter((row) => Boolean(row.bowlId) || rowHasPayloadValues(row));

const castingFromBowlRowsForPayload = (rows: CastingFromBowlRow[]): Record<string, unknown>[] =>
  rows
    .map((row, index) =>
      compactRecord({
        srNo: index + 1,
        bowlId: str(row.BOWL_ID).trim() || undefined,
        timeInterval: toApiNumber(row.TIME_INTERVAL),
        rh: toApiNumber(row.RH),
        viscosity: toApiNumber(row.VISCOSITY),
        motorId: str(row.MOTOR_ID).trim() || undefined,
        slurryDepth: toApiNumber(row.SLURRY_DEPTH),
        slurryCast: toApiNumber(row.SLURRY_CAST),
        flowRate: toApiNumber(row.FLOW_RATE),
        valveOpening: toApiNumber(row.VALVE_OPENING),
        vacuumLevel: toApiNumber(row.VACUUM_LEVEL),
      }),
    )
    .filter((row) => Boolean(row.bowlId || row.motorId) || rowHasPayloadValues(row));

const slurryRowsForPayload = (rows: SlurryCastRow[]): Record<string, unknown>[] => {
  let dataIndex = 0;
  return syncSlurryCastTotalRow(rows).map((row) => {
    const isTotal = isSlurryTotalRow(row);
    if (!isTotal) dataIndex += 1;
    return compactRecord({
      rowKey: isTotal ? SLURRY_TOTAL_ROW_KEY : String(dataIndex),
      fmMotorLabel: str(row.FM_MOTOR_LABEL).trim() || undefined,
      slurryCast: toApiNumber(row.SLURRY_CAST),
    });
  });
};

const postCastRowsForPayload = (rows: PostCastRow[]): Record<string, unknown>[] =>
  rows.map((row, index) =>
    compactRecord({
      srNo: index + 1,
      activity: str(row.ACTIVITY).trim() || undefined,
      details: str(row.DETAILS).trim() || undefined,
    }),
  );

/**
 * Nested camelCase casting payload matching create/update API (`motors[].castingSections`).
 */
export const buildCastingSectionsPayload = (data: CastingMotorData): CastingSectionsPayload => {
  const slurryRows = syncSlurryCastTotalRow(
    data.SLURRY_CAST_DETAILS.SLURRY_CAST_FROM_BOWLS ?? [],
  );
  const motorCasing =
    data.FINAL_ASSEMBLY_DETAILS.motorCasing?.[0] ?? createEmptyMotorCasingInstance();

  return {
    finalAssemblyDetails: {
      motorCasing: [
        compactRecord({
          mandrelMeasurements: mandrelRowsForPayload(motorCasing.MANDREL_MEASUREMENTS ?? []),
          feedPipeDistance: feedPipeRowsForPayload(motorCasing.FEED_PIPE_DISTANCE ?? []),
          emptyMotorWeight: toApiNumber(motorCasing.EMPTY_MOTOR_WEIGHT),
        }),
      ],
    },
    castingProcess: compactRecord({
      finalMixBowlDetails: bowlDetailRowsForPayload(
        data.CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS ?? [],
      ),
      castingFromBowlDetails: castingFromBowlRowsForPayload(
        data.CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS ?? [],
      ),
      initialVacuum: toApiNumber(data.CASTING_PROCESS.INITIAL_VACUUM),
      vacuumPressureCasting: toApiNumber(data.CASTING_PROCESS.VACUUM_PRESSURE_CASTING),
      vacuumPressureSoaking: toApiNumber(data.CASTING_PROCESS.VACUUM_PRESSURE_SOAKING),
    }),
    slurryCastDetails: {
      slurryCastFromBowls: slurryRowsForPayload(slurryRows),
    },
    postCastOperations: {
      postCastTable: postCastRowsForPayload(data.POST_CAST_OPERATIONS.POST_CAST_TABLE ?? []),
    },
  };
};

const firstSectionRow = (
  sections: Array<{ sectionId?: string; sectionData?: unknown[] }> | undefined,
  sectionId: string,
): Record<string, unknown> => {
  const match = (sections ?? []).find((section) => {
    const id = str(section.sectionId).trim();
    return id === sectionId || id.toUpperCase() === sectionId.toUpperCase();
  });
  const rows = asArray(match?.sectionData);
  return asRecord(rows[0]) ?? {};
};

const resolveCastingSection = (
  source: unknown,
  camelKey: string,
  snakeKey: string,
): Record<string, unknown> => {
  if (isLegacySectionArray(source)) {
    const fromSnake = firstSectionRow(source, snakeKey);
    if (Object.keys(fromSnake).length) return fromSnake;
    return firstSectionRow(source, camelKey);
  }
  const nested = asRecord(source) ?? {};
  return asRecord(nested[camelKey]) ?? asRecord(nested[snakeKey]) ?? {};
};

const parseMandrelRow = (item: unknown, index: number): MandrelMeasurementRow => {
  const row = asRecord(item) ?? {};
  return applyMandrelFormulas({
    srNo: str(pickField(row, "srNo", "SR_NO") ?? index + 1),
    A_MOCK: str(pickField(row, "aMock", "A_MOCK") ?? ""),
    B_MOCK: str(pickField(row, "bMock", "B_MOCK") ?? ""),
    B_FINAL: str(pickField(row, "bFinal", "B_FINAL") ?? ""),
    C_MOCK: str(pickField(row, "cMock", "C_MOCK") ?? ""),
    C_FINAL: str(pickField(row, "cFinal", "C_FINAL") ?? ""),
    BELLOWS_THICKNESS_D: str(pickField(row, "bellowsThicknessD", "BELLOWS_THICKNESS_D") ?? ""),
    E_MOCK: str(pickField(row, "eMock", "E_MOCK") ?? ""),
    E_FINAL: str(pickField(row, "eFinal", "E_FINAL") ?? ""),
  });
};

const parseFeedPipeRow = (item: unknown): FeedPipeDistanceRow => {
  const row = asRecord(item) ?? {};
  return {
    READING_1: str(pickField(row, "reading1", "READING_1") ?? ""),
    READING_2: str(pickField(row, "reading2", "READING_2") ?? ""),
  };
};

const parseMotorCasingInstance = (item: unknown): CastingMotorCasingInstance => {
  const row = asRecord(item) ?? {};
  const mandrelRows = asArray(
    pickField(row, "mandrelMeasurements", "MANDREL_MEASUREMENTS"),
  ).map(parseMandrelRow);
  const feedRows = asArray(pickField(row, "feedPipeDistance", "FEED_PIPE_DISTANCE")).map(
    parseFeedPipeRow,
  );
  return {
    MANDREL_MEASUREMENTS: mandrelRows.length
      ? mandrelRows
      : createEmptyMotorCasingInstance().MANDREL_MEASUREMENTS,
    FEED_PIPE_DISTANCE: feedRows.length ? feedRows : [createEmptyFeedPipeDistanceRow()],
    EMPTY_MOTOR_WEIGHT: str(pickField(row, "emptyMotorWeight", "EMPTY_MOTOR_WEIGHT") ?? ""),
  };
};

const parseBowlDetailRow = (item: unknown): CastingBowlDetailRow => {
  const row = asRecord(item) ?? {};
  return {
    BOWL_ID: str(pickField(row, "bowlId", "BOWL_ID") ?? ""),
    PREMIX_NO: str(pickField(row, "premixNo", "PREMIX_NO") ?? ""),
    BOWL_NO: str(pickField(row, "bowlNo", "BOWL_NO") ?? ""),
    BOWL_RECEIPT_TIME: toUiTime(pickField(row, "bowlReceiptTime", "BOWL_RECEIPT_TIME") ?? ""),
    INITIAL_WEIGHT: str(pickField(row, "initialWeight", "INITIAL_WEIGHT") ?? ""),
    FINAL_WEIGHT: str(pickField(row, "finalWeight", "FINAL_WEIGHT") ?? ""),
    INITIAL_SLURRY_DEPTH: str(pickField(row, "initialSlurryDepth", "INITIAL_SLURRY_DEPTH") ?? ""),
    DC_OPEN_TIME: toUiTime(pickField(row, "dcOpenTime", "DC_OPEN_TIME") ?? ""),
    DC_CLOSE_TIME: toUiTime(pickField(row, "dcCloseTime", "DC_CLOSE_TIME") ?? ""),
    SLURRY_DEPTH_AFTER_DC: str(
      pickField(row, "slurryDepthAfterDc", "SLURRY_DEPTH_AFTER_DC") ?? "",
    ),
    BALL_VALVE_OPEN_TIME: toUiTime(
      pickField(row, "ballValveOpenTime", "BALL_VALVE_OPEN_TIME") ?? "",
    ),
  };
};

const parseCastingFromBowlRow = (item: unknown): CastingFromBowlRow => {
  const row = asRecord(item) ?? {};
  return {
    BOWL_ID: str(pickField(row, "bowlId", "BOWL_ID") ?? ""),
    PREMIX_NO: str(pickField(row, "premixNo", "PREMIX_NO") ?? ""),
    BOWL_NO: str(pickField(row, "bowlNo", "BOWL_NO") ?? ""),
    TIME_INTERVAL: str(pickField(row, "timeInterval", "TIME_INTERVAL") ?? ""),
    RH: str(pickField(row, "rh", "RH") ?? ""),
    VISCOSITY: str(pickField(row, "viscosity", "VISCOSITY") ?? ""),
    MOTOR_ID: str(pickField(row, "motorId", "MOTOR_ID") ?? ""),
    SLURRY_DEPTH: str(pickField(row, "slurryDepth", "SLURRY_DEPTH") ?? ""),
    SLURRY_CAST: str(pickField(row, "slurryCast", "SLURRY_CAST") ?? ""),
    FLOW_RATE: str(pickField(row, "flowRate", "FLOW_RATE") ?? ""),
    VALVE_OPENING: str(pickField(row, "valveOpening", "VALVE_OPENING") ?? ""),
    VACUUM_LEVEL: str(pickField(row, "vacuumLevel", "VACUUM_LEVEL") ?? ""),
  };
};

const parseSlurryCastRow = (item: unknown): SlurryCastRow => {
  const row = asRecord(item) ?? {};
  const rowKey = str(pickField(row, "rowKey", "ROW_KEY") ?? "");
  const label = str(pickField(row, "fmMotorLabel", "FM_MOTOR_LABEL") ?? "");
  const isTotal =
    rowKey.toUpperCase() === SLURRY_TOTAL_ROW_KEY ||
    label.toLowerCase() === SLURRY_TOTAL_LABEL.toLowerCase() ||
    row.readonly === true;
  return {
    ROW_KEY: rowKey || (isTotal ? SLURRY_TOTAL_ROW_KEY : ""),
    PREMIX_NO: str(pickField(row, "premixNo", "PREMIX_NO") ?? ""),
    BOWL_NO: str(pickField(row, "bowlNo", "BOWL_NO") ?? ""),
    FM_MOTOR_LABEL: label || (isTotal ? SLURRY_TOTAL_LABEL : ""),
    SLURRY_CAST: str(pickField(row, "slurryCast", "SLURRY_CAST") ?? ""),
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
      DETAILS:
        preset.detailsFieldType === "time"
          ? toUiTime(saved.DETAILS ?? saved.details ?? saved.value ?? "")
          : str(saved.DETAILS ?? saved.details ?? saved.value ?? ""),
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

export const parseCastingMotorDataFromApi = (source: unknown): CastingMotorData => {
  const empty = createEmptyCastingMotorData();
  if (source == null) return empty;
  if (Array.isArray(source) && source.length === 0) return empty;
  if (typeof source === "object" && !Array.isArray(source) && Object.keys(source).length === 0) {
    return empty;
  }

  const resolved = unwrapMotorSectionPayload(source, "castingSections");

  const finalAssembly = resolveCastingSection(
    resolved,
    "finalAssemblyDetails",
    "FINAL_ASSEMBLY_DETAILS",
  );
  const castingProcess = resolveCastingSection(resolved, "castingProcess", "CASTING_PROCESS");
  const slurryCast = resolveCastingSection(resolved, "slurryCastDetails", "SLURRY_CAST_DETAILS");
  const postCast = resolveCastingSection(resolved, "postCastOperations", "POST_CAST_OPERATIONS");

  const motorCasingRaw = asArray(
    pickField(finalAssembly, "motorCasing") ?? finalAssembly.motorCasing,
  );
  const motorCasing = motorCasingRaw.length
    ? [parseMotorCasingInstance(motorCasingRaw[0])]
    : empty.FINAL_ASSEMBLY_DETAILS.motorCasing;

  const slurryRows = asArray(
    pickField(slurryCast, "slurryCastFromBowls", "SLURRY_CAST_FROM_BOWLS"),
  ).map(parseSlurryCastRow);

  const mixRows = asArray(
    pickField(castingProcess, "finalMixBowlDetails", "FINAL_MIX_BOWL_DETAILS"),
  ).map(parseBowlDetailRow);
  const castingRows = asArray(
    pickField(castingProcess, "castingFromBowlDetails", "CASTING_FROM_BOWL_DETAILS"),
  ).map(parseCastingFromBowlRow);

  return {
    FINAL_ASSEMBLY_DETAILS: {
      motorCasing,
    },
    CASTING_PROCESS: {
      FINAL_MIX_BOWL_DETAILS: mixRows.length
        ? mixRows
        : empty.CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS,
      CASTING_FROM_BOWL_DETAILS: castingRows.length
        ? castingRows
        : empty.CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS,
      INITIAL_VACUUM: str(
        pickField(castingProcess, "initialVacuum", "INITIAL_VACUUM") ?? "",
      ),
      VACUUM_PRESSURE_CASTING: str(
        pickField(castingProcess, "vacuumPressureCasting", "VACUUM_PRESSURE_CASTING") ?? "",
      ),
      VACUUM_PRESSURE_SOAKING: str(
        pickField(castingProcess, "vacuumPressureSoaking", "VACUUM_PRESSURE_SOAKING") ?? "",
      ),
    },
    SLURRY_CAST_DETAILS: {
      SLURRY_CAST_FROM_BOWLS: syncSlurryCastTotalRow(
        slurryRows.length ? slurryRows : empty.SLURRY_CAST_DETAILS.SLURRY_CAST_FROM_BOWLS,
      ),
    },
    POST_CAST_OPERATIONS: {
      POST_CAST_TABLE: parsePostCastTable(
        pickField(postCast, "postCastTable", "POST_CAST_TABLE"),
      ),
    },
  };
};

/** @deprecated Use parseCastingMotorDataFromApi */
export const parseCastingMotorDataFromSections = parseCastingMotorDataFromApi;
