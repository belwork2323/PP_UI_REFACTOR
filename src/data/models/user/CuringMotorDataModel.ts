export type CuringOption = { value: string; label: string };

/** Dropdown options from curing-schema.v2.json HOT_WATER_STATUS. */
export const HOT_WATER_STATUS_OPTIONS: readonly CuringOption[] = [
  { value: "ON", label: "ON" },
  { value: "OFF", label: "OFF" },
  { value: "NA", label: "NA" },
] as const;

export type HotWaterStatusValue = "ON" | "OFF" | "NA" | "";

export type CuringCycleRow = {
  srNo: string;
  TEMPERATURE: string;
  TIME: string;
  START_DATE: string;
  START_TIME: string;
  END_DATE: string;
  END_TIME: string;
  PROPELLANT_PRESSURE: string;
  HOT_WATER_STATUS: HotWaterStatusValue | string;
};

export type CuringMotorData = {
  CURING_CYCLES: { CURING_TABLE: CuringCycleRow[] };
  POST_CURING_DETAILS: {
    OTHER_OBSERVATIONS: string;
    VISUAL_OBSERVATION: string;
    PRESSURE_PLATE_REMOVAL_DATE_TIME: string;
    SHORE_A_HARDNESS: string;
    DE_CORING_DISPATCH_DATE_TIME: string;
  };
  DECORING_DETAILS: {
    DECORING_DATE: string;
    BUILDING_NO: string;
    DECORING_LOAD: string;
    DECORING_REMARKS: string;
    /** File name(s), same shape as SchemaFileField string values. */
    DECORING_VISUAL_OBSERVATION: string;
  };
};

export type CuringMotorSectionPayload = {
  sectionId: string;
  sectionData: Record<string, unknown>[];
};

export const CURING_MOTOR_SECTION_IDS = [
  "CURING_CYCLES",
  "POST_CURING_DETAILS",
  "DECORING_DETAILS",
] as const;

export type CuringMotorSectionId = (typeof CURING_MOTOR_SECTION_IDS)[number];

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const str = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const toApiAttachments = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof File !== "undefined" && value instanceof File) return value.name;
  if (Array.isArray(value)) {
    return value
      .map((item) => toApiAttachments(item))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    const rec = value as Record<string, unknown>;
    return str(rec.name ?? rec.fileName ?? rec.fileUrl ?? rec.path ?? "");
  }
  return str(value);
};

export const createEmptyCuringCycleRow = (srNo: number | string = 1): CuringCycleRow => ({
  srNo: String(srNo),
  TEMPERATURE: "",
  TIME: "",
  START_DATE: "",
  START_TIME: "",
  END_DATE: "",
  END_TIME: "",
  PROPELLANT_PRESSURE: "",
  HOT_WATER_STATUS: "",
});

export const createEmptyCuringMotorData = (): CuringMotorData => ({
  CURING_CYCLES: {
    CURING_TABLE: [
      createEmptyCuringCycleRow(1),
      createEmptyCuringCycleRow(2),
      createEmptyCuringCycleRow(3),
    ],
  },
  POST_CURING_DETAILS: {
    OTHER_OBSERVATIONS: "",
    VISUAL_OBSERVATION: "",
    PRESSURE_PLATE_REMOVAL_DATE_TIME: "",
    SHORE_A_HARDNESS: "",
    DE_CORING_DISPATCH_DATE_TIME: "",
  },
  DECORING_DETAILS: {
    DECORING_DATE: "",
    BUILDING_NO: "",
    DECORING_LOAD: "",
    DECORING_REMARKS: "",
    DECORING_VISUAL_OBSERVATION: "",
  },
});

const META_KEYS = new Set([
  "type",
  "label",
  "parameter",
  "operation",
  "valueFieldType",
  "readonly",
  "srNo",
  "SR_NO",
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

export const curingMotorDataHasUserInput = (data: CuringMotorData): boolean =>
  hasUserContent(data);

const stripRowForPayload = (row: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    if (key === "valueFieldType" || key === "readonly") return;
    if (key.endsWith("__fieldType") || key.startsWith("_")) return;
    out[key] = value;
  });
  return out;
};

const curingCycleRowsForPayload = (rows: CuringCycleRow[]): unknown[] =>
  rows.map((row, index) =>
    stripRowForPayload({
      srNo: Number(row.srNo) || index + 1,
      TEMPERATURE: row.TEMPERATURE,
      TIME: row.TIME,
      START_DATE: row.START_DATE,
      START_TIME: row.START_TIME,
      END_DATE: row.END_DATE,
      END_TIME: row.END_TIME,
      PROPELLANT_PRESSURE: row.PROPELLANT_PRESSURE,
      HOT_WATER_STATUS: row.HOT_WATER_STATUS,
    }),
  );

export const buildCuringSectionsPayload = (
  data: CuringMotorData,
): CuringMotorSectionPayload[] => [
  {
    sectionId: "CURING_CYCLES",
    sectionData: [
      {
        CURING_TABLE: curingCycleRowsForPayload(data.CURING_CYCLES.CURING_TABLE ?? []),
      },
    ],
  },
  {
    sectionId: "POST_CURING_DETAILS",
    sectionData: [
      {
        OTHER_OBSERVATIONS: str(data.POST_CURING_DETAILS.OTHER_OBSERVATIONS).trim(),
        VISUAL_OBSERVATION: str(data.POST_CURING_DETAILS.VISUAL_OBSERVATION).trim(),
        PRESSURE_PLATE_REMOVAL_DATE_TIME: str(
          data.POST_CURING_DETAILS.PRESSURE_PLATE_REMOVAL_DATE_TIME,
        ).trim(),
        SHORE_A_HARDNESS: str(data.POST_CURING_DETAILS.SHORE_A_HARDNESS).trim(),
        DE_CORING_DISPATCH_DATE_TIME: str(
          data.POST_CURING_DETAILS.DE_CORING_DISPATCH_DATE_TIME,
        ).trim(),
      },
    ],
  },
  {
    sectionId: "DECORING_DETAILS",
    sectionData: [
      {
        DECORING_DATE: str(data.DECORING_DETAILS.DECORING_DATE).trim(),
        BUILDING_NO: str(data.DECORING_DETAILS.BUILDING_NO).trim(),
        DECORING_LOAD: str(data.DECORING_DETAILS.DECORING_LOAD).trim(),
        DECORING_REMARKS: str(data.DECORING_DETAILS.DECORING_REMARKS).trim(),
        DECORING_VISUAL_OBSERVATION: toApiAttachments(
          data.DECORING_DETAILS.DECORING_VISUAL_OBSERVATION,
        ),
      },
    ],
  },
];

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

const parseCuringCycleRow = (item: unknown, index: number): CuringCycleRow => {
  const row = asRecord(item) ?? {};
  return {
    srNo: str(row.srNo ?? row.SR_NO ?? index + 1),
    TEMPERATURE: str(row.TEMPERATURE ?? row.temperature ?? ""),
    TIME: str(row.TIME ?? row.durationMinutes ?? row.DURATION ?? ""),
    START_DATE: str(row.START_DATE ?? row.startDate ?? ""),
    START_TIME: str(row.START_TIME ?? row.startTime ?? ""),
    END_DATE: str(row.END_DATE ?? row.endDate ?? ""),
    END_TIME: str(row.END_TIME ?? row.endTime ?? ""),
    PROPELLANT_PRESSURE: str(row.PROPELLANT_PRESSURE ?? row.propellantPressure ?? ""),
    HOT_WATER_STATUS: str(row.HOT_WATER_STATUS ?? row.hotWaterCirculation ?? ""),
  };
};

export const parseCuringMotorDataFromSections = (
  sections: Array<{ sectionId?: string; sectionData?: unknown[] }> | undefined,
): CuringMotorData => {
  const empty = createEmptyCuringMotorData();
  if (!sections?.length) return empty;

  const cycles = firstSectionRow(sections, "CURING_CYCLES");
  const post = firstSectionRow(sections, "POST_CURING_DETAILS");
  const decor = firstSectionRow(sections, "DECORING_DETAILS");

  const tableRows = asArray(cycles.CURING_TABLE).map(parseCuringCycleRow);

  return {
    CURING_CYCLES: {
      CURING_TABLE: tableRows.length ? tableRows : empty.CURING_CYCLES.CURING_TABLE,
    },
    POST_CURING_DETAILS: {
      OTHER_OBSERVATIONS: str(post.OTHER_OBSERVATIONS ?? ""),
      VISUAL_OBSERVATION: str(post.VISUAL_OBSERVATION ?? ""),
      PRESSURE_PLATE_REMOVAL_DATE_TIME: str(post.PRESSURE_PLATE_REMOVAL_DATE_TIME ?? ""),
      SHORE_A_HARDNESS: str(post.SHORE_A_HARDNESS ?? ""),
      DE_CORING_DISPATCH_DATE_TIME: str(post.DE_CORING_DISPATCH_DATE_TIME ?? ""),
    },
    DECORING_DETAILS: {
      DECORING_DATE: str(decor.DECORING_DATE ?? ""),
      BUILDING_NO: str(decor.BUILDING_NO ?? ""),
      DECORING_LOAD: str(decor.DECORING_LOAD ?? ""),
      DECORING_REMARKS: str(decor.DECORING_REMARKS ?? ""),
      DECORING_VISUAL_OBSERVATION: toApiAttachments(decor.DECORING_VISUAL_OBSERVATION),
    },
  };
};

/**
 * Replace CURING_TABLE from curing-cycles API mapped rows (partials accepted).
 * Accepts either schema-shaped keys or CuringCycleConfig field names.
 */
export const applyCuringCycleConfigRows = (
  data: CuringMotorData,
  rowsFromConfig: Array<Partial<CuringCycleRow> & Record<string, unknown>>,
): CuringMotorData => {
  if (!rowsFromConfig.length) {
    return {
      ...data,
      CURING_CYCLES: { CURING_TABLE: [] },
    };
  }

  const CURING_TABLE = rowsFromConfig.map((row, index) => {
    const base = createEmptyCuringCycleRow(index + 1);
    return {
      ...base,
      srNo: str(row.srNo ?? row.SR_NO ?? row.sequenceNo ?? index + 1),
      TEMPERATURE: str(row.TEMPERATURE ?? row.temperature ?? base.TEMPERATURE),
      TIME: str(row.TIME ?? row.durationMinutes ?? row.DURATION ?? base.TIME),
      START_DATE: str(row.START_DATE ?? row.startDate ?? base.START_DATE),
      START_TIME: str(row.START_TIME ?? row.startTime ?? base.START_TIME),
      END_DATE: str(row.END_DATE ?? row.endDate ?? base.END_DATE),
      END_TIME: str(row.END_TIME ?? row.endTime ?? base.END_TIME),
      PROPELLANT_PRESSURE: str(
        row.PROPELLANT_PRESSURE ?? row.propellantPressure ?? base.PROPELLANT_PRESSURE,
      ),
      HOT_WATER_STATUS: str(
        row.HOT_WATER_STATUS ?? row.hotWaterCirculation ?? base.HOT_WATER_STATUS,
      ),
    };
  });

  return {
    ...data,
    CURING_CYCLES: { CURING_TABLE },
  };
};
