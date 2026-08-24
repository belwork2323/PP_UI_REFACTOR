import {
  compactRecord,
  isLegacySectionArray,
  pickField,
  toApiDate,
  toApiDateTime,
  toApiNumber,
  toApiTime,
  toUiDate,
  toUiDateTime,
  toUiTime,
  unwrapMotorSectionPayload,
} from "./castingCuringFieldCodec";
import {
  isCasePrepFileUploadIncomplete,
  parseCasePrepFileRefs,
  toCasePrepFilesApiPayload,
  type CasePrepFileRef,
} from "./CasePrepMotorDataModel";


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
    /** Eager file-service refs (Case Prep / RMS / RMC parity). */
    DECORING_VISUAL_OBSERVATION: CasePrepFileRef[];
  };
};

export type CuringMotorSectionPayload = {
  sectionId: string;
  sectionData: Record<string, unknown>[];
};

export type CuringSectionsPayload = {
  curingCycles: {
    curingTable: Array<Record<string, unknown>>;
  };
  postCuringDetails: Record<string, unknown>;
  decoringDetails: Record<string, unknown>;
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
    DECORING_VISUAL_OBSERVATION: [],
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

const rowHasPayloadValues = (row: Record<string, unknown>): boolean =>
  Object.entries(row).some(([key, value]) => key !== "srNo" && value !== undefined && value !== "");

const curingCycleRowsForPayload = (rows: CuringCycleRow[]): Record<string, unknown>[] =>
  rows
    .map((row, index) =>
      compactRecord({
        srNo: Number(row.srNo) || index + 1,
        temperature: toApiNumber(row.TEMPERATURE),
        time: toApiNumber(row.TIME),
        startDate: toApiDate(row.START_DATE),
        startTime: toApiTime(row.START_TIME),
        endDate: toApiDate(row.END_DATE),
        endTime: toApiTime(row.END_TIME),
        hotWaterStatus: str(row.HOT_WATER_STATUS).trim() || undefined,
        propellantPressure: toApiNumber(row.PROPELLANT_PRESSURE),
      }),
    )
    .filter(rowHasPayloadValues);

export const buildCuringSectionsPayload = (data: CuringMotorData): CuringSectionsPayload => ({
  curingCycles: {
    curingTable: curingCycleRowsForPayload(data.CURING_CYCLES.CURING_TABLE ?? []),
  },
  postCuringDetails: compactRecord({
    otherObservations: str(data.POST_CURING_DETAILS.OTHER_OBSERVATIONS).trim() || undefined,
    visualObservation: str(data.POST_CURING_DETAILS.VISUAL_OBSERVATION).trim() || undefined,
    pressurePlateRemovalDateTime: toApiDateTime(
      data.POST_CURING_DETAILS.PRESSURE_PLATE_REMOVAL_DATE_TIME,
    ),
    shoreAHardness: toApiNumber(data.POST_CURING_DETAILS.SHORE_A_HARDNESS),
    decoringDispatchDateTime: toApiDateTime(
      data.POST_CURING_DETAILS.DE_CORING_DISPATCH_DATE_TIME,
    ),
  }),
  decoringDetails: compactRecord({
    decoringDate: toApiDate(data.DECORING_DETAILS.DECORING_DATE),
    buildingNo: str(data.DECORING_DETAILS.BUILDING_NO).trim() || undefined,
    decoringLoad: toApiNumber(data.DECORING_DETAILS.DECORING_LOAD),
    decoringRemarks: str(data.DECORING_DETAILS.DECORING_REMARKS).trim() || undefined,
    decoringVisualObservation: (() => {
      const files = toCasePrepFilesApiPayload(
        data.DECORING_DETAILS.DECORING_VISUAL_OBSERVATION,
      );
      return files.length ? files : undefined;
    })(),
  }),
});

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

const resolveCuringSection = (
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

const parseCuringCycleRow = (item: unknown, index: number): CuringCycleRow => {
  const row = asRecord(item) ?? {};
  return {
    srNo: str(pickField(row, "srNo", "SR_NO") ?? index + 1),
    TEMPERATURE: str(pickField(row, "temperature", "TEMPERATURE") ?? ""),
    TIME: str(pickField(row, "time", "durationMinutes", "DURATION", "TIME") ?? ""),
    START_DATE: toUiDate(pickField(row, "startDate", "START_DATE") ?? ""),
    START_TIME: toUiTime(pickField(row, "startTime", "START_TIME") ?? ""),
    END_DATE: toUiDate(pickField(row, "endDate", "END_DATE") ?? ""),
    END_TIME: toUiTime(pickField(row, "endTime", "END_TIME") ?? ""),
    PROPELLANT_PRESSURE: str(
      pickField(row, "propellantPressure", "PROPELLANT_PRESSURE") ?? "",
    ),
    HOT_WATER_STATUS: str(
      pickField(row, "hotWaterStatus", "HOT_WATER_STATUS", "hotWaterCirculation") ?? "",
    ),
  };
};

export const parseCuringMotorDataFromApi = (source: unknown): CuringMotorData => {
  const empty = createEmptyCuringMotorData();
  if (source == null) return empty;
  if (Array.isArray(source) && source.length === 0) return empty;
  if (typeof source === "object" && !Array.isArray(source) && Object.keys(source).length === 0) {
    return empty;
  }

  const resolved = unwrapMotorSectionPayload(source, "curingSections");

  const cycles = resolveCuringSection(resolved, "curingCycles", "CURING_CYCLES");
  const post = resolveCuringSection(resolved, "postCuringDetails", "POST_CURING_DETAILS");
  const decor = resolveCuringSection(resolved, "decoringDetails", "DECORING_DETAILS");

  const tableRows = asArray(pickField(cycles, "curingTable", "CURING_TABLE")).map(
    parseCuringCycleRow,
  );

  return {
    CURING_CYCLES: {
      CURING_TABLE: tableRows.length ? tableRows : empty.CURING_CYCLES.CURING_TABLE,
    },
    POST_CURING_DETAILS: {
      OTHER_OBSERVATIONS: str(
        pickField(post, "otherObservations", "OTHER_OBSERVATIONS") ?? "",
      ),
      VISUAL_OBSERVATION: str(
        pickField(post, "visualObservation", "VISUAL_OBSERVATION") ?? "",
      ),
      PRESSURE_PLATE_REMOVAL_DATE_TIME: toUiDateTime(
        pickField(post, "pressurePlateRemovalDateTime", "PRESSURE_PLATE_REMOVAL_DATE_TIME") ??
          "",
      ),
      SHORE_A_HARDNESS: str(pickField(post, "shoreAHardness", "SHORE_A_HARDNESS") ?? ""),
      DE_CORING_DISPATCH_DATE_TIME: toUiDateTime(
        pickField(
          post,
          "decoringDispatchDateTime",
          "deCoringDispatchDateTime",
          "DE_CORING_DISPATCH_DATE_TIME",
        ) ?? "",
      ),
    },
    DECORING_DETAILS: {
      DECORING_DATE: toUiDate(pickField(decor, "decoringDate", "DECORING_DATE") ?? ""),
      BUILDING_NO: str(pickField(decor, "buildingNo", "BUILDING_NO") ?? ""),
      DECORING_LOAD: str(pickField(decor, "decoringLoad", "DECORING_LOAD") ?? ""),
      DECORING_REMARKS: str(pickField(decor, "decoringRemarks", "DECORING_REMARKS") ?? ""),
      DECORING_VISUAL_OBSERVATION: parseCasePrepFileRefs(
        pickField(decor, "decoringVisualObservation", "DECORING_VISUAL_OBSERVATION"),
      ),
    },
  };
};

/** @deprecated Use parseCuringMotorDataFromApi */
export const parseCuringMotorDataFromSections = parseCuringMotorDataFromApi;

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
      START_DATE: toUiDate(row.START_DATE ?? row.startDate ?? base.START_DATE),
      START_TIME: toUiTime(row.START_TIME ?? row.startTime ?? base.START_TIME),
      END_DATE: toUiDate(row.END_DATE ?? row.endDate ?? base.END_DATE),
      END_TIME: toUiTime(row.END_TIME ?? row.endTime ?? base.END_TIME),
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


export const collectCastingCuringFileRefsFromMotorData = (
  data: CuringMotorData | null | undefined,
): CasePrepFileRef[] => data?.DECORING_DETAILS?.DECORING_VISUAL_OBSERVATION ?? [];

export const collectCastingCuringFileRefsFromForm = (form: {
  motors?: Array<{ curingData?: CuringMotorData | null }>;
}): CasePrepFileRef[] => {
  const refs: CasePrepFileRef[] = [];
  for (const motor of form?.motors ?? []) {
    refs.push(...collectCastingCuringFileRefsFromMotorData(motor?.curingData));
  }
  return refs;
};

export const hasIncompleteCastingCuringUploads = (form: {
  motors?: Array<{ curingData?: CuringMotorData | null }>;
}): boolean =>
  collectCastingCuringFileRefsFromForm(form).some(isCasePrepFileUploadIncomplete);

export const collectTempFileIdsFromCastingCuringForm = (form: {
  motors?: Array<{ curingData?: CuringMotorData | null }>;
}): string[] =>
  [
    ...new Set(
      collectCastingCuringFileRefsFromForm(form)
        .filter((ref) => ref.isTemp !== false)
        .map((ref) => String(ref.fileId ?? "").trim())
        .filter(Boolean),
    ),
  ];
