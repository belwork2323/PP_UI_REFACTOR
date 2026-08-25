import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import { isFileUploadIncomplete, parseFileRefs, toFileIdListPayload, type FileRef } from "../../../data/models/common/FileUploadModel";
import {
  QC_PROPELLANT_AVG_COLUMN,
  QC_PROPELLANT_BALLISTIC_PRESET,
  QC_PROPELLANT_INTERFACE_PRESET,
  QC_PROPELLANT_MECHANICAL_GRAPH_FIELD,
  QC_PROPELLANT_MECHANICAL_PRESET,
  QC_PROPELLANT_ROW_UPLOAD_FIELD,
  QC_PROPELLANT_SECTION_IDS,
  QC_PROPELLANT_SSBR_PRESET,
  QC_PROPELLANT_STD_COLUMN,
  addQcPropellantBemColumn,
  buildQcPropellantBallisticColumns,
  buildQcPropellantFmColumnIds,
  isQcPropellantBemColumnId,
  parseQcPropellantBemColumn,
  removeQcPropellantBemColumn,
  sortQcPropellantBemColumns,
  type QcPropellantBallisticRow,
  type QcPropellantPropertyRow,
} from "./qcPropellantConfig";

const formKey = (sectionId: string, blockId: string) => `${sectionId}::${blockId}`;

const tableKey = (sectionId: string) => formKey(sectionId, sectionId);
const columnsKey = (sectionId: string) => formKey(sectionId, "FM_COLUMNS");
const mechanicalGraphKey = () =>
  formKey(QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES, QC_PROPELLANT_MECHANICAL_GRAPH_FIELD);

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const pickEditableString = (...candidates: unknown[]): string => {
  for (const candidate of candidates) {
    if (candidate == null) continue;
    const value = String(candidate);
    if (value.toLowerCase() === "null") continue;
    return value;
  }
  return "";
};

const parseUploadFiles = (...candidates: unknown[]): FileRef[] => {
  for (const candidate of candidates) {
    if (candidate == null || candidate === "") continue;
    const refs = parseFileRefs(candidate);
    if (refs.length) return refs;
  }
  return [];
};

const normalizeKey = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");

const labelsMatch = (a: unknown, b: unknown) => {
  const left = normalizeKey(a);
  const right = normalizeKey(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
};

const isStatPropertyLabel = (value: unknown) => {
  const key = normalizeKey(value).replace(/\./g, "");
  return key === "MEAN" || key === "AVG" || key === "STD" || key === "STD DEV";
};

const isFmColumnId = (id: string, ballistic = false) =>
  ballistic ? isQcPropellantBemColumnId(id) : /^FM_\d+$/i.test(id);

const FIXED_PROPERTY_KEYS = new Set([
  "SAMPLE_NO",
  "PROPERTY",
  "SPECIFICATION",
  "REMARKS",
  "UPLOAD_GRAPH",
  QC_PROPELLANT_AVG_COLUMN,
  QC_PROPELLANT_STD_COLUMN,
  "DETAILS",
  "kind",
  "locked",
  "readonly",
]);

const sortFmColumnIds = (columns: string[]) =>
  [...columns].sort((left, right) => {
    const a = Number(String(left).match(/^FM_(\d+)$/i)?.[1] ?? 0);
    const b = Number(String(right).match(/^FM_(\d+)$/i)?.[1] ?? 0);
    return a - b || left.localeCompare(right);
  });

const collectFmColumnIds = (rows: Array<Record<string, unknown>>, ballistic = false): string[] => {
  const seen = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (FIXED_PROPERTY_KEYS.has(key) || !isFmColumnId(key, ballistic)) return;
      seen.add(key);
    });
  });
  const collected = Array.from(seen);
  return ballistic ? sortQcPropellantBemColumns(collected) : sortFmColumnIds(collected);
};

const maxFmIndexFromColumnIds = (columns: string[], ballistic = false): number =>
  columns.reduce((max, columnId) => {
    if (ballistic) {
      const parsed = parseQcPropellantBemColumn(columnId);
      return parsed ? Math.max(max, parsed.fmIndex) : max;
    }
    const match = String(columnId).match(/^FM_(\d+)$/i);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

const readStoredFmColumns = (
  values: SchemaFormValues | undefined,
  sectionId: string,
  ballistic = false,
): string[] =>
  asArray(values?.[columnsKey(sectionId)])
    .map((item) => String(item ?? "").trim())
    .filter((id) => isFmColumnId(id, ballistic));

const readRowFmColumns = (
  values: SchemaFormValues | undefined,
  sectionId: string,
  ballistic = false,
): string[] => {
  const rows = asArray(values?.[tableKey(sectionId)])
    .map((item) => asRecord(item))
    .filter(Boolean) as Record<string, unknown>[];
  return collectFmColumnIds(rows, ballistic);
};

/** Keep saved FM / BEM columns from API rows; expand to premix count when it is larger. */
const resolveMergedFmColumns = (
  values: SchemaFormValues | undefined,
  sectionId: string,
  ballistic = false,
  fmCount?: number,
): string[] => {
  const inferred = Array.from(
    new Set([...readStoredFmColumns(values, sectionId, ballistic), ...readRowFmColumns(values, sectionId, ballistic)]),
  );
  const inferredCount = maxFmIndexFromColumnIds(inferred, ballistic);
  const targetCount = Math.max(fmCount ?? 0, inferredCount, inferred.length ? 0 : 1);
  const n = Math.max(1, targetCount);
  if (ballistic) return buildQcPropellantBallisticColumns(n, inferred);
  return buildQcPropellantFmColumnIds(n);
};

const emptyFmValues = (columns: readonly string[]) =>
  Object.fromEntries(columns.map((id) => [id, ""]));

const toNumericOrEmpty = (value: unknown): string => {
  if (value == null) return "";
  const text = String(value).trim();
  if (!text || text.toLowerCase() === "null") return "";
  return text;
};

const parseNumeric = (value: unknown): number | null => {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const numeric = Number(text);
  return Number.isFinite(numeric) ? numeric : null;
};

const formatStat = (value: number) => {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round(value * 10000) / 10000;
  return String(rounded);
};

export const computeColumnStats = (values: Array<string | number | unknown>) => {
  const numbers = values
    .map((value) => parseNumeric(value))
    .filter((value): value is number => value != null);
  if (!numbers.length) return { mean: "", std: "" };
  const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  if (numbers.length < 2) return { mean: formatStat(mean), std: "" };
  const variance =
    numbers.reduce((sum, n) => sum + (n - mean) ** 2, 0) / (numbers.length - 1);
  return { mean: formatStat(mean), std: formatStat(Math.sqrt(variance)) };
};

export const applyPropellantRowStats = (
  row: QcPropellantPropertyRow,
  columns: string[],
): QcPropellantPropertyRow => {
  const stats = computeColumnStats(columns.map((columnId) => row[columnId]));
  return {
    ...row,
    [QC_PROPELLANT_AVG_COLUMN]: stats.mean,
    [QC_PROPELLANT_STD_COLUMN]: stats.std,
  };
};

const emptyRowStats = () => ({
  [QC_PROPELLANT_AVG_COLUMN]: "",
  [QC_PROPELLANT_STD_COLUMN]: "",
});

const emptyRowUpload = () => ({
  [QC_PROPELLANT_ROW_UPLOAD_FIELD]: "",
});

const emptyMechanicalRows = (columns: readonly string[] = buildQcPropellantFmColumnIds(1)) =>
  QC_PROPELLANT_MECHANICAL_PRESET.map((preset) => ({
    SAMPLE_NO: preset.SAMPLE_NO ?? "",
    PROPERTY: preset.PROPERTY,
    SPECIFICATION: "",
    REMARKS: "",
    kind: preset.kind,
    ...emptyFmValues(columns),
    ...emptyRowStats(),
  })) as QcPropellantPropertyRow[];

const emptyInterfaceRows = (columns: readonly string[] = buildQcPropellantFmColumnIds(1)) =>
  QC_PROPELLANT_INTERFACE_PRESET.map((preset) => ({
    SAMPLE_NO: preset.SAMPLE_NO ?? "",
    PROPERTY: preset.PROPERTY,
    SPECIFICATION: "",
    REMARKS: "",
    kind: preset.kind,
    ...emptyFmValues(columns),
    ...emptyRowStats(),
    ...emptyRowUpload(),
  })) as QcPropellantPropertyRow[];

const overlayRowStats = (
  next: QcPropellantPropertyRow,
  savedRow: Record<string, unknown> | undefined,
  columns: string[],
) => {
  const computed = computeColumnStats(columns.map((columnId) => next[columnId]));
  next[QC_PROPELLANT_AVG_COLUMN] =
    pickEditableString(
      savedRow?.[QC_PROPELLANT_AVG_COLUMN],
      savedRow?.avg,
      savedRow?.AVG,
    ) || computed.mean;
  next[QC_PROPELLANT_STD_COLUMN] =
    pickEditableString(
      savedRow?.[QC_PROPELLANT_STD_COLUMN],
      savedRow?.stdDev,
      savedRow?.STD,
    ) || computed.std;
};

const emptySsbrRows = (columns: readonly string[] = buildQcPropellantFmColumnIds(1)) =>
  QC_PROPELLANT_SSBR_PRESET.map((preset) => ({
    PROPERTY: preset.PROPERTY,
    SPECIFICATION: "",
    kind: preset.kind,
    locked: preset.locked,
    ...emptyFmValues(columns),
    ...emptyRowStats(),
    ...emptyRowUpload(),
  })) as QcPropellantPropertyRow[];

const emptyBallisticRows = (columns: readonly string[] = buildQcPropellantFmColumnIds(1, true)) =>
  QC_PROPELLANT_BALLISTIC_PRESET.map((preset) => ({
    DETAILS: preset.DETAILS,
    SPECIFICATION: "",
    ...emptyFmValues(columns),
  })) as QcPropellantBallisticRow[];

const overlayPropertyRows = (
  presets: QcPropellantPropertyRow[],
  saved: unknown,
  columns: string[],
  options?: { allowExtraRows?: boolean; includeRowStats?: boolean; includeGraph?: boolean },
): QcPropellantPropertyRow[] => {
  const keepStatRows = presets.some((preset) => preset.kind === "mean" || preset.kind === "std");
  const savedRows = asArray(saved)
    .map((item) => asRecord(item))
    .filter(Boolean)
    .filter((row) => keepStatRows || !isStatPropertyLabel(row.PROPERTY ?? row.property)) as Record<
    string,
    unknown
  >[];
  const used = new Set<number>();
  const overlayRow = (preset: QcPropellantPropertyRow, fallbackIndex: number) => {
    const matchIndex = savedRows.findIndex(
      (row, index) =>
        !used.has(index) && labelsMatch(row.PROPERTY ?? row.property, preset.PROPERTY),
    );
    const index = matchIndex >= 0 ? matchIndex : fallbackIndex;
    const savedRow = savedRows[index];
    if (savedRow) used.add(index);
    const next: QcPropellantPropertyRow = {
      ...preset,
      SAMPLE_NO: preset.SAMPLE_NO ?? "",
      SPECIFICATION: pickEditableString(savedRow?.SPECIFICATION, savedRow?.specification),
      REMARKS: pickEditableString(savedRow?.REMARKS, savedRow?.remarks),
      ...emptyFmValues(columns),
    };
    columns.forEach((columnId) => {
      next[columnId] = toNumericOrEmpty(savedRow?.[columnId]);
    });
    if (options?.includeRowStats) overlayRowStats(next, savedRow, columns);
    if (options?.includeGraph) {
      next[QC_PROPELLANT_ROW_UPLOAD_FIELD] = parseUploadFiles(
        savedRow?.[QC_PROPELLANT_ROW_UPLOAD_FIELD] ?? savedRow?.uploadGraph,
      );
    }
    return next;
  };

  const rows = presets.map((preset, index) => overlayRow(preset, index));
  if (!options?.allowExtraRows) return rows;

  savedRows.forEach((savedRow, index) => {
    if (used.has(index)) return;
    const property = pickEditableString(savedRow.PROPERTY, savedRow.property);
    const extra: QcPropellantPropertyRow = {
      PROPERTY: property,
      SPECIFICATION: pickEditableString(savedRow.SPECIFICATION, savedRow.specification),
      kind: "data",
      locked: false,
      ...emptyFmValues(columns),
      ...emptyRowStats(),
    };
    columns.forEach((columnId) => {
      extra[columnId] = toNumericOrEmpty(savedRow[columnId]);
    });
    if (options?.includeRowStats) overlayRowStats(extra, savedRow, columns);
    rows.push(extra);
  });
  return rows;
};

const overlayBallisticRows = (
  saved: unknown,
  columns: string[],
): QcPropellantBallisticRow[] => {
  const savedRows = asArray(saved)
    .map((item) => asRecord(item))
    .filter(Boolean) as Record<string, unknown>[];
  return emptyBallisticRows(columns).map((preset, index) => {
    const savedRow =
      savedRows.find((row) => labelsMatch(row.DETAILS ?? row.details, preset.DETAILS)) ??
      savedRows[index];
    const next: QcPropellantBallisticRow = {
      ...preset,
      SPECIFICATION: pickEditableString(savedRow?.SPECIFICATION, savedRow?.specification),
      ...emptyFmValues(columns),
    };
    columns.forEach((columnId) => {
      next[columnId] = pickEditableString(savedRow?.[columnId]);
    });
    return next;
  });
};

export const createInitialPropellantValues = (fmCount = 1): SchemaFormValues => {
  const fmColumns = buildQcPropellantFmColumnIds(fmCount);
  const bemColumns = buildQcPropellantFmColumnIds(fmCount, true);
  return {
    [tableKey(QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES)]: emptyMechanicalRows(fmColumns),
    [columnsKey(QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES)]: fmColumns,
    [mechanicalGraphKey()]: [] as FileRef[],
    [tableKey(QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES)]: emptyInterfaceRows(fmColumns),
    [columnsKey(QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES)]: fmColumns,
    [tableKey(QC_PROPELLANT_SECTION_IDS.SSBR_UBR_BURN_RATE)]: emptySsbrRows(fmColumns),
    [columnsKey(QC_PROPELLANT_SECTION_IDS.SSBR_UBR_BURN_RATE)]: fmColumns,
    [tableKey(QC_PROPELLANT_SECTION_IDS.BALLISTIC_EVALUATION)]: emptyBallisticRows(bemColumns),
    [columnsKey(QC_PROPELLANT_SECTION_IDS.BALLISTIC_EVALUATION)]: bemColumns,
  };
};

export const getPropellantFmColumns = (
  values: SchemaFormValues | undefined,
  sectionId: string,
  ballistic = false,
  fmCount?: number,
): string[] => resolveMergedFmColumns(values, sectionId, ballistic, fmCount);

export const getPropellantPropertyRows = (
  values: SchemaFormValues | undefined,
  sectionId: string,
  fmCount?: number,
): QcPropellantPropertyRow[] => {
  const columns = getPropellantFmColumns(values, sectionId, false, fmCount);
  const raw = values?.[tableKey(sectionId)];
  if (sectionId === QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES) {
    return overlayPropertyRows(emptyMechanicalRows(columns), raw, columns, { includeRowStats: true });
  }
  if (sectionId === QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES) {
    return overlayPropertyRows(emptyInterfaceRows(columns), raw, columns, {
      includeRowStats: true,
      includeGraph: true,
    });
  }
  return overlayPropertyRows(emptySsbrRows(columns), raw, columns, {
    includeRowStats: true,
    includeGraph: true,
  });
};

export const getPropellantBallisticColumns = (
  values: SchemaFormValues | undefined,
  fmCount?: number,
): string[] =>
  resolveMergedFmColumns(values, QC_PROPELLANT_SECTION_IDS.BALLISTIC_EVALUATION, true, fmCount);

export const getPropellantBallisticRows = (
  values: SchemaFormValues | undefined,
  fmCount?: number,
): QcPropellantBallisticRow[] => {
  const columns = getPropellantBallisticColumns(values, fmCount);
  return overlayBallisticRows(values?.[tableKey(QC_PROPELLANT_SECTION_IDS.BALLISTIC_EVALUATION)], columns);
};

export const getPropellantMechanicalGraph = (
  values: SchemaFormValues | undefined,
): FileRef[] => parseUploadFiles(values?.[mechanicalGraphKey()]);

export const setPropellantMechanicalGraph = (
  values: SchemaFormValues,
  value: FileRef[],
): SchemaFormValues => ({
  ...values,
  [mechanicalGraphKey()]: value ?? [],
});

export const collectPropellantFileRefsFromQcValues = (
  values: SchemaFormValues | null | undefined,
): FileRef[] => {
  const refs: FileRef[] = [...getPropellantMechanicalGraph(values ?? undefined)];
  for (const sectionId of [
    QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES,
    QC_PROPELLANT_SECTION_IDS.SSBR_UBR_BURN_RATE,
  ]) {
    for (const row of getPropellantPropertyRows(values ?? undefined, sectionId)) {
      refs.push(...parseUploadFiles(row[QC_PROPELLANT_ROW_UPLOAD_FIELD]));
    }
  }
  return refs;
};

export const hasIncompleteQcPropellantUploads = (
  values: SchemaFormValues | null | undefined,
): boolean => collectPropellantFileRefsFromQcValues(values).some(isFileUploadIncomplete);

export const collectTempFileIdsFromQcPropellantValues = (
  values: SchemaFormValues | null | undefined,
): string[] =>
  [
    ...new Set(
      collectPropellantFileRefsFromQcValues(values)
        .filter((ref) => ref.isTemp !== false)
        .map((ref) => String(ref.fileId ?? "").trim())
        .filter(Boolean),
    ),
  ];

export const setPropellantPropertyRows = (
  values: SchemaFormValues,
  sectionId: string,
  rows: QcPropellantPropertyRow[],
): SchemaFormValues => ({
  ...values,
  [tableKey(sectionId)]: rows,
});

export const setPropellantBallisticRows = (
  values: SchemaFormValues,
  rows: QcPropellantBallisticRow[],
): SchemaFormValues => ({
  ...values,
  [tableKey(QC_PROPELLANT_SECTION_IDS.BALLISTIC_EVALUATION)]: rows,
});

export const setPropellantFmColumns = (
  values: SchemaFormValues,
  sectionId: string,
  columns: string[],
  ballistic = false,
): SchemaFormValues => {
  const nextColumns = columns.filter((id) => isFmColumnId(id, ballistic));
  if (ballistic) {
    return {
      ...values,
      [columnsKey(sectionId)]: nextColumns,
      [tableKey(sectionId)]: overlayBallisticRows(values[tableKey(sectionId)], nextColumns),
    };
  }
  const includeGraph =
    sectionId === QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES ||
    sectionId === QC_PROPELLANT_SECTION_IDS.SSBR_UBR_BURN_RATE;
  const presets =
    sectionId === QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES
      ? emptyMechanicalRows(nextColumns)
      : sectionId === QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES
        ? emptyInterfaceRows(nextColumns)
        : emptySsbrRows(nextColumns);
  return {
    ...values,
    [columnsKey(sectionId)]: nextColumns,
    [tableKey(sectionId)]: overlayPropertyRows(presets, values[tableKey(sectionId)], nextColumns, {
      includeRowStats: true,
      includeGraph,
    }),
  };
};

export const syncPropellantFmColumns = (values: SchemaFormValues, fmCount: number): SchemaFormValues => {
  const fmColumns = buildQcPropellantFmColumnIds(fmCount);
  const bemColumns = getPropellantBallisticColumns(values, fmCount);
  let next = values;
  next = setPropellantFmColumns(next, QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES, fmColumns);
  next = setPropellantFmColumns(next, QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES, fmColumns);
  next = setPropellantFmColumns(next, QC_PROPELLANT_SECTION_IDS.SSBR_UBR_BURN_RATE, fmColumns);
  next = setPropellantFmColumns(
    next,
    QC_PROPELLANT_SECTION_IDS.BALLISTIC_EVALUATION,
    bemColumns,
    true,
  );
  return next;
};

export const addPropellantBemColumn = (
  values: SchemaFormValues,
  fmIndex: number,
  fmCount?: number,
): SchemaFormValues => {
  const columns = addQcPropellantBemColumn(getPropellantBallisticColumns(values, fmCount), fmIndex);
  return setPropellantFmColumns(values, QC_PROPELLANT_SECTION_IDS.BALLISTIC_EVALUATION, columns, true);
};

export const removePropellantBemColumn = (
  values: SchemaFormValues,
  columnId: string,
  fmCount?: number,
): SchemaFormValues => {
  const columns = removeQcPropellantBemColumn(getPropellantBallisticColumns(values, fmCount), columnId);
  return setPropellantFmColumns(values, QC_PROPELLANT_SECTION_IDS.BALLISTIC_EVALUATION, columns, true);
};

const extractSectionDataRecord = (section: SchemaSectionSubmission) =>
  asRecord(asArray(section.sectionData)[0]);

const extractTableRows = (section: SchemaSectionSubmission): unknown[] => {
  const sectionId = String(section.sectionId ?? "").trim();
  const data = extractSectionDataRecord(section);
  if (!data) return asArray(section.sectionData);
  const direct = data[sectionId] ?? data[sectionId.replace(/_([A-Z])/g, (_, ch) => ch)];
  if (Array.isArray(direct)) return direct;
  const firstArray = Object.values(data).find((value) => Array.isArray(value));
  return asArray(firstArray);
};

const extractMechanicalGraph = (
  section: SchemaSectionSubmission,
  rows: unknown[],
): FileRef[] => {
  const data = extractSectionDataRecord(section);
  const fromSection = parseUploadFiles(
    data?.[QC_PROPELLANT_MECHANICAL_GRAPH_FIELD] ?? data?.uploadGraph,
  );
  if (fromSection.length) return fromSection;
  for (const row of rows) {
    const rec = asRecord(row);
    const graph = parseUploadFiles(rec?.UPLOAD_GRAPH ?? rec?.uploadGraph);
    if (graph.length) return graph;
  }
  return [];
};

const resolveHydrateFmColumns = (
  rows: unknown[],
  fmCount: number | undefined,
  ballistic: boolean,
  fallback: string[],
): string[] => {
  const collected = collectFmColumnIds(
    asArray(rows)
      .map((item) => asRecord(item))
      .filter(Boolean) as Record<string, unknown>[],
    ballistic,
  );
  const targetCount = Math.max(fmCount ?? 0, maxFmIndexFromColumnIds(collected, ballistic), collected.length ? 0 : 1);
  const n = Math.max(1, targetCount);
  if (ballistic) {
    const next = buildQcPropellantBallisticColumns(n, collected);
    return next.length ? next : fallback;
  }
  return collected.length || fmCount != null ? buildQcPropellantFmColumnIds(n) : fallback;
};

export const hydratePropellantValuesFromSections = (
  sections: SchemaSectionSubmission[] | null | undefined,
  fmCount?: number,
): SchemaFormValues => {
  const values = createInitialPropellantValues(fmCount ?? 1);
  const fmColumns = buildQcPropellantFmColumnIds(fmCount ?? 1);
  const bemColumns = buildQcPropellantFmColumnIds(fmCount ?? 1, true);
  for (const section of sections ?? []) {
    const sectionId = String(section.sectionId ?? section.subType ?? "").trim().toUpperCase();
    const rows = extractTableRows(section);
    const graph = sectionId === QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES
      ? extractMechanicalGraph(section, rows)
      : "";
    if (!rows.length) {
      if (graph.length) values[mechanicalGraphKey()] = graph;
      continue;
    }

    if (sectionId === QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES) {
      const nextColumns = resolveHydrateFmColumns(rows, fmCount, false, fmColumns);
      values[columnsKey(sectionId)] = nextColumns;
      values[tableKey(sectionId)] = overlayPropertyRows(
        emptyMechanicalRows(nextColumns),
        rows,
        nextColumns,
        { includeRowStats: true },
      );
      values[mechanicalGraphKey()] = extractMechanicalGraph(section, rows);
      continue;
    }

    if (sectionId === QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES) {
      const nextColumns = resolveHydrateFmColumns(rows, fmCount, false, fmColumns);
      values[columnsKey(sectionId)] = nextColumns;
      values[tableKey(sectionId)] = overlayPropertyRows(emptyInterfaceRows(nextColumns), rows, nextColumns, {
        includeRowStats: true,
        includeGraph: true,
      });
      continue;
    }

    if (sectionId === QC_PROPELLANT_SECTION_IDS.SSBR_UBR_BURN_RATE) {
      const nextColumns = resolveHydrateFmColumns(rows, fmCount, false, fmColumns);
      values[columnsKey(sectionId)] = nextColumns;
      values[tableKey(sectionId)] = overlayPropertyRows(emptySsbrRows(nextColumns), rows, nextColumns, {
        includeRowStats: true,
        includeGraph: true,
      });
      continue;
    }

    if (sectionId === QC_PROPELLANT_SECTION_IDS.BALLISTIC_EVALUATION) {
      const nextColumns = resolveHydrateFmColumns(rows, fmCount, true, bemColumns);
      values[columnsKey(sectionId)] = nextColumns;
      values[tableKey(sectionId)] = overlayBallisticRows(rows, nextColumns);
    }
  }

  const inferredFmCount = Math.max(
    fmCount ?? 0,
    maxFmIndexFromColumnIds(readStoredFmColumns(values, QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES), false),
    maxFmIndexFromColumnIds(readStoredFmColumns(values, QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES), false),
    maxFmIndexFromColumnIds(readStoredFmColumns(values, QC_PROPELLANT_SECTION_IDS.SSBR_UBR_BURN_RATE), false),
    maxFmIndexFromColumnIds(readStoredFmColumns(values, QC_PROPELLANT_SECTION_IDS.BALLISTIC_EVALUATION, true), true),
  );
  return inferredFmCount > 0 ? syncPropellantFmColumns(values, inferredFmCount) : values;
};

const toApiScalar = (value: unknown, numeric: boolean) => {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  if (!numeric) return text;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : text;
};

const serializePropertyRow = (
  row: QcPropellantPropertyRow,
  columns: string[],
  options?: {
    includeRowStats?: boolean;
    includeRemarks?: boolean;
    includeSampleNo?: boolean;
    includeGraph?: boolean;
  },
) => {
  const payload: Record<string, unknown> = {
    PROPERTY: row.PROPERTY,
  };
  if (options?.includeSampleNo && row.SAMPLE_NO !== "" && row.SAMPLE_NO != null) {
    payload.SAMPLE_NO = row.SAMPLE_NO;
  }
  const specification = String(row.SPECIFICATION ?? "").trim();
  if (specification) payload.SPECIFICATION = specification;
  if (options?.includeRemarks) {
    const remarks = String(row.REMARKS ?? "").trim();
    if (remarks) payload.REMARKS = remarks;
  }
  columns.forEach((columnId) => {
    const value = toApiScalar(row[columnId], true);
    if (value !== undefined) payload[columnId] = value;
  });
  if (options?.includeRowStats) {
    const avg = toApiScalar(row[QC_PROPELLANT_AVG_COLUMN], true);
    const std = toApiScalar(row[QC_PROPELLANT_STD_COLUMN], true);
    if (avg !== undefined) payload[QC_PROPELLANT_AVG_COLUMN] = avg;
    if (std !== undefined) payload[QC_PROPELLANT_STD_COLUMN] = std;
  }
  if (options?.includeGraph) {
    const graph = toFileIdListPayload(row[QC_PROPELLANT_ROW_UPLOAD_FIELD]);
    if (graph.length) payload.uploadGraph = graph;
  }
  return payload;
};

export type QcPropellantMotorSubmissionType = "DRAFT" | "SUBMIT";

const QC_PROPELLANT_PROCESS_TYPES = new Set<string>([
  QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES,
  QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES,
  QC_PROPELLANT_SECTION_IDS.SSBR_UBR_BURN_RATE,
  QC_PROPELLANT_SECTION_IDS.BALLISTIC_EVALUATION,
]);

const serializeMechanicalSamples = (values: SchemaFormValues | undefined) => {
  const columns = getPropellantFmColumns(values, QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES);
  return getPropellantPropertyRows(values, QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES).map((row) =>
    serializePropertyRow(row, columns, {
      includeRowStats: true,
      includeRemarks: true,
      includeSampleNo: true,
    }),
  );
};

const serializeInterfaceSamples = (values: SchemaFormValues | undefined) => {
  const columns = getPropellantFmColumns(values, QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES);
  return getPropellantPropertyRows(values, QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES).map((row) =>
    serializePropertyRow(row, columns, {
      includeRowStats: true,
      includeRemarks: true,
      includeSampleNo: true,
      includeGraph: true,
    }),
  );
};

const serializeBurnRateDetails = (values: SchemaFormValues | undefined) => {
  const columns = getPropellantFmColumns(values, QC_PROPELLANT_SECTION_IDS.SSBR_UBR_BURN_RATE);
  return getPropellantPropertyRows(values, QC_PROPELLANT_SECTION_IDS.SSBR_UBR_BURN_RATE).map((row) =>
    serializePropertyRow(row, columns, {
      includeRowStats: true,
      includeGraph: true,
    }),
  );
};

const serializeBallisticDetails = (values: SchemaFormValues | undefined) => {
  const columns = getPropellantBallisticColumns(values);
  return getPropellantBallisticRows(values).map((row) => {
    const payload: Record<string, unknown> = { DETAILS: row.DETAILS };
    const specification = String(row.SPECIFICATION ?? "").trim();
    if (specification) payload.SPECIFICATION = specification;
    columns.forEach((columnId) => {
      const value = toApiScalar(row[columnId], false);
      if (value !== undefined) payload[columnId] = value;
    });
    return payload;
  });
};

export const buildPropellantMotorPayload = (
  values: SchemaFormValues | undefined,
  motorId: string,
  motorSubmissionType: QcPropellantMotorSubmissionType = "DRAFT",
): Record<string, unknown> => {
  const mechanicalGraph = toFileIdListPayload(getPropellantMechanicalGraph(values));
  return {
    motorId,
    motorSubmissionType,
    processes: [
      {
        processType: QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES,
        data: {
          mechanicalProperties: {
            samples: serializeMechanicalSamples(values),
            statistics: {},
            ...(mechanicalGraph.length ? { uploadGraph: mechanicalGraph } : {}),
          },
        },
      },
      {
        processType: QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES,
        data: {
          interfaceProperties: {
            samples: serializeInterfaceSamples(values),
            statistics: {},
          },
        },
      },
      {
        processType: QC_PROPELLANT_SECTION_IDS.SSBR_UBR_BURN_RATE,
        data: {
          burnRateDetails: serializeBurnRateDetails(values),
        },
      },
      {
        processType: QC_PROPELLANT_SECTION_IDS.BALLISTIC_EVALUATION,
        data: {
          ballisticDetails: serializeBallisticDetails(values),
        },
      },
    ],
  };
};

export const isPropellantNestedMotorDetail = (rec: Record<string, unknown> | null | undefined) =>
  Boolean(
    rec &&
      Array.isArray(rec.processes) &&
      rec.processes.some((item) => {
        const process = asRecord(item);
        const processType = String(process?.processType ?? process?.process ?? "")
          .trim()
          .toUpperCase();
        return QC_PROPELLANT_PROCESS_TYPES.has(processType);
      }),
  );

const readProcessRows = (data: Record<string, unknown> | null, ...keys: string[]): unknown[] => {
  if (!data) return [];
  for (const key of keys) {
    const direct = data[key];
    if (Array.isArray(direct)) return direct;
    const nested = asRecord(direct);
    if (!nested) continue;
    if (Array.isArray(nested.samples)) return nested.samples;
    if (Array.isArray(nested.burnRateDetails)) return nested.burnRateDetails;
    if (Array.isArray(nested.ballisticDetails)) return nested.ballisticDetails;
    const table = nested[key];
    if (Array.isArray(table)) return table;
  }
  return [];
};

export const propellantMotorDetailToSections = (
  rec: Record<string, unknown>,
  motorId: string,
): SchemaSectionSubmission[] => {
  const source = asRecord(rec.details) ?? rec;
  const processes = asArray(source.processes);
  const trimmedMotorId = String(motorId ?? "").trim();
  const withMotor = (section: SchemaSectionSubmission): SchemaSectionSubmission =>
    (trimmedMotorId ? { ...section, motorId: trimmedMotorId } : section) as SchemaSectionSubmission;

  return processes.flatMap((item) => {
    const process = asRecord(item);
    if (!process) return [];
    const processType = String(process.processType ?? process.process ?? "")
      .trim()
      .toUpperCase();
    const data = asRecord(process.data) ?? process;

    if (processType === QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES) {
      const mechanical = asRecord(data.mechanicalProperties) ?? data;
      const samples = readProcessRows(data, "mechanicalProperties", "samples");
      const graph = parseUploadFiles(
        mechanical?.uploadGraph ?? mechanical?.UPLOAD_GRAPH ?? data.uploadGraph ?? data.UPLOAD_GRAPH,
      );
      return [
        withMotor({
          sectionId: QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES,
          subType: QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES,
          sectionData: [
            {
              [QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES]: samples,
              ...(graph.length ? { [QC_PROPELLANT_MECHANICAL_GRAPH_FIELD]: graph } : {}),
            },
          ],
        }),
      ];
    }

    if (processType === QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES) {
      return [
        withMotor({
          sectionId: QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES,
          subType: QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES,
          sectionData: [
            {
              [QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES]: readProcessRows(
                data,
                "interfaceProperties",
                "samples",
              ),
            },
          ],
        }),
      ];
    }

    if (processType === QC_PROPELLANT_SECTION_IDS.SSBR_UBR_BURN_RATE) {
      return [
        withMotor({
          sectionId: QC_PROPELLANT_SECTION_IDS.SSBR_UBR_BURN_RATE,
          subType: QC_PROPELLANT_SECTION_IDS.SSBR_UBR_BURN_RATE,
          sectionData: [
            {
              [QC_PROPELLANT_SECTION_IDS.SSBR_UBR_BURN_RATE]: readProcessRows(
                data,
                "burnRateDetails",
                "ssbrUbrBurnRate",
              ),
            },
          ],
        }),
      ];
    }

    if (processType === QC_PROPELLANT_SECTION_IDS.BALLISTIC_EVALUATION) {
      return [
        withMotor({
          sectionId: QC_PROPELLANT_SECTION_IDS.BALLISTIC_EVALUATION,
          subType: QC_PROPELLANT_SECTION_IDS.BALLISTIC_EVALUATION,
          sectionData: [
            {
              [QC_PROPELLANT_SECTION_IDS.BALLISTIC_EVALUATION]: readProcessRows(
                data,
                "ballisticDetails",
                "ballisticEvaluation",
              ),
            },
          ],
        }),
      ];
    }

    return [];
  });
};
