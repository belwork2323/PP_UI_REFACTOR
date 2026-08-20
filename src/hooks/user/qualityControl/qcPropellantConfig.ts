import { STRINGS } from "../../../app/config/strings";
import type { QcApiDivision, QcApiSubType } from "../../../schema-engine/adapters/qc.adapter";
import type { QcDivisionEntry } from "./qcDivisionEntryTypes";
import { buildDivisionEntryDedupKey } from "./qcDivisionEntries";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

export const QC_PROPELLANT_API_DIVISION = "PROPELLANT_PROPERTIES" as const satisfies QcApiDivision;

export const QC_PROPELLANT_PROCESS_OPTIONS = [
  { value: "MECHANICAL_PROPERTIES", label: S.PROPELLANT_PROCESS_MECHANICAL },
  { value: "INTERFACE_PROPERTIES", label: S.PROPELLANT_PROCESS_INTERFACE },
  { value: "SSBR_UBR_BURN_RATE", label: S.PROPELLANT_PROCESS_SSBR_UBR },
  { value: "BALLISTIC_EVALUATION", label: S.PROPELLANT_PROCESS_BALLISTIC },
] as const;

export type QcPropellantProcessSubType = (typeof QC_PROPELLANT_PROCESS_OPTIONS)[number]["value"];

export const QC_PROPELLANT_SECTION_IDS = {
  MECHANICAL_PROPERTIES: "MECHANICAL_PROPERTIES",
  INTERFACE_PROPERTIES: "INTERFACE_PROPERTIES",
  SSBR_UBR_BURN_RATE: "SSBR_UBR_BURN_RATE",
  BALLISTIC_EVALUATION: "BALLISTIC_EVALUATION",
} as const;

export const QC_PROPELLANT_SECTION_TITLES: Record<string, string> = {
  [QC_PROPELLANT_SECTION_IDS.MECHANICAL_PROPERTIES]: "Mechanical Properties Evaluation",
  [QC_PROPELLANT_SECTION_IDS.INTERFACE_PROPERTIES]: "Interface Properties",
  [QC_PROPELLANT_SECTION_IDS.SSBR_UBR_BURN_RATE]: "SSBR / UBR Burn Rate",
  [QC_PROPELLANT_SECTION_IDS.BALLISTIC_EVALUATION]: "Ballistic Evaluation Motor Burn Rate",
};

export const QC_PROPELLANT_DEFAULT_FM_COLUMNS = ["FM_1"] as const;
export const QC_PROPELLANT_DEFAULT_BEM_COLUMNS = ["FM_1_BEM_NO"] as const;

export type QcPropellantBemColumnRef = {
  fmIndex: number;
  bemIndex: number;
};

export const parseQcPropellantBemColumn = (columnId: string): QcPropellantBemColumnRef | null => {
  const match = String(columnId).match(/^FM_(\d+)_BEM_NO(?:_(\d+))?$/i);
  if (!match) return null;
  return {
    fmIndex: Number(match[1]),
    bemIndex: match[2] ? Number(match[2]) : 1,
  };
};

export const buildQcPropellantBemColumnId = (fmIndex: number, bemIndex: number) =>
  bemIndex <= 1 ? `FM_${fmIndex}_BEM_NO` : `FM_${fmIndex}_BEM_NO_${bemIndex}`;

export const isQcPropellantBemColumnId = (columnId: string) => parseQcPropellantBemColumn(columnId) != null;

export const sortQcPropellantBemColumns = (columns: string[]) =>
  [...columns].sort((left, right) => {
    const a = parseQcPropellantBemColumn(left);
    const b = parseQcPropellantBemColumn(right);
    if (!a || !b) return left.localeCompare(right);
    return a.fmIndex - b.fmIndex || a.bemIndex - b.bemIndex;
  });

export type QcPropellantBemColumnGroup = {
  fmIndex: number;
  columnIds: string[];
};

export const groupQcPropellantBemColumns = (columns: string[]): QcPropellantBemColumnGroup[] => {
  const groups: QcPropellantBemColumnGroup[] = [];
  sortQcPropellantBemColumns(columns).forEach((columnId) => {
    const parsed = parseQcPropellantBemColumn(columnId);
    if (!parsed) return;
    const last = groups[groups.length - 1];
    if (last && last.fmIndex === parsed.fmIndex) {
      last.columnIds.push(columnId);
      return;
    }
    groups.push({ fmIndex: parsed.fmIndex, columnIds: [columnId] });
  });
  return groups;
};

export const buildQcPropellantBallisticColumns = (fmCount: number, existing: string[] = []): string[] => {
  const n = Math.max(1, Math.floor(Number(fmCount)) || 1);
  const grouped = new Map<number, string[]>();
  sortQcPropellantBemColumns(existing.filter(isQcPropellantBemColumnId)).forEach((columnId) => {
    const parsed = parseQcPropellantBemColumn(columnId);
    if (!parsed || parsed.fmIndex > n) return;
    const list = grouped.get(parsed.fmIndex) ?? [];
    list.push(columnId);
    grouped.set(parsed.fmIndex, list);
  });
  const columns: string[] = [];
  for (let fmIndex = 1; fmIndex <= n; fmIndex += 1) {
    const current = grouped.get(fmIndex);
    if (current?.length) columns.push(...current);
    else columns.push(buildQcPropellantBemColumnId(fmIndex, 1));
  }
  return columns;
};

export const addQcPropellantBemColumn = (columns: string[], fmIndex: number): string[] => {
  const parsedColumns = columns
    .map((columnId) => ({ columnId, parsed: parseQcPropellantBemColumn(columnId) }))
    .filter((item): item is { columnId: string; parsed: QcPropellantBemColumnRef } => item.parsed != null);
  const nextBemIndex =
    parsedColumns
      .filter((item) => item.parsed.fmIndex === fmIndex)
      .reduce((max, item) => Math.max(max, item.parsed.bemIndex), 0) + 1;
  const nextId = buildQcPropellantBemColumnId(fmIndex, nextBemIndex);
  const lastIndex = columns.reduce((found, columnId, index) => {
    const parsed = parseQcPropellantBemColumn(columnId);
    return parsed?.fmIndex === fmIndex ? index : found;
  }, -1);
  const next = lastIndex < 0 ? [...columns, nextId] : [...columns.slice(0, lastIndex + 1), nextId, ...columns.slice(lastIndex + 1)];
  return sortQcPropellantBemColumns(next.filter(isQcPropellantBemColumnId));
};

export const removeQcPropellantBemColumn = (columns: string[], columnId: string): string[] => {
  const parsed = parseQcPropellantBemColumn(columnId);
  if (!parsed) return columns;
  const bemCount = columns.filter((id) => parseQcPropellantBemColumn(id)?.fmIndex === parsed.fmIndex).length;
  if (bemCount <= 1) return columns;
  return columns.filter((id) => id !== columnId);
};

export const buildQcPropellantFmColumnIds = (count: number, ballistic = false): string[] => {
  const n = Math.max(1, Math.floor(Number(count)) || 1);
  if (ballistic) return buildQcPropellantBallisticColumns(n);
  return Array.from({ length: n }, (_, index) => `FM_${index + 1}`);
};

const asPremixCountRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readPremixCount = (value: unknown): number => {
  const rec = asPremixCountRecord(value);
  if (!rec) return 0;
  const nested = asPremixCountRecord(rec.__batchDetails) ?? rec;
  const sheet =
    asPremixCountRecord(nested.identificationSheet) ??
    asPremixCountRecord(nested.identification_sheet) ??
    asPremixCountRecord(asPremixCountRecord(nested.data)?.identificationSheet);
  const raw = Number(
    sheet?.numberOfPremix ??
      sheet?.number_of_premix ??
      nested.numberOfPremix ??
      nested.number_of_premix ??
      nested.premixCount,
  );
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
};

/** Final-mix count matches identification-sheet number of premix. */
export const resolveQcPropellantPremixCount = (...payloads: unknown[]): number => {
  for (const payload of payloads) {
    const count = readPremixCount(payload);
    if (count > 0) return count;
  }
  return 1;
};

export const QC_PROPELLANT_MECHANICAL_PRESET = [
  { SAMPLE_NO: 1, PROPERTY: "Tensile Strength (kgf/cm²)", kind: "data" as const },
  { SAMPLE_NO: 2, PROPERTY: "Elongation (%)", kind: "data" as const },
  { SAMPLE_NO: 3, PROPERTY: "E-Modulus (kgf/cm²)", kind: "data" as const },
  { SAMPLE_NO: 4, PROPERTY: "Density (g/cc)", kind: "data" as const },
];

export const QC_PROPELLANT_AVG_COLUMN = "AVG";
export const QC_PROPELLANT_STD_COLUMN = "STD_DEV";
export const QC_PROPELLANT_ROW_UPLOAD_FIELD = "UPLOAD_GRAPH";
export const QC_PROPELLANT_MECHANICAL_GRAPH_FIELD = "UPLOAD_GRAPH";

export const QC_PROPELLANT_INTERFACE_PRESET = [
  { SAMPLE_NO: 1, PROPERTY: "Peel Strength (kgf/cm)", kind: "data" as const },
  { SAMPLE_NO: 2, PROPERTY: "SBS (kgf/cm²)", kind: "data" as const },
  { SAMPLE_NO: 3, PROPERTY: "TBS (kgf/cm²)", kind: "data" as const },
];

export const QC_PROPELLANT_SSBR_PRESET = [
  { PROPERTY: "SSBR Burn rate (mm/s)", kind: "data" as const, locked: true },
  { PROPERTY: "Ultrasonic Burn Rate (mm/s)", kind: "data" as const, locked: true },
];

export const QC_PROPELLANT_BALLISTIC_PRESET = [
  { DETAILS: "Date of Test" },
  { DETAILS: "Net propellant weight (kg)" },
  { DETAILS: "Tb (s)" },
  { DETAILS: "Pmax (ksc)" },
  { DETAILS: "Pavg (ksc)" },
  { DETAILS: "Burn rate (mm/s)" },
];

export type QcPropellantPropertyRow = {
  SAMPLE_NO?: number | "";
  PROPERTY: string;
  SPECIFICATION: string;
  REMARKS?: string;
  UPLOAD_GRAPH?: string;
  kind?: "data" | "mean" | "std";
  locked?: boolean;
  [key: string]: unknown;
};

export type QcPropellantBallisticRow = {
  DETAILS: string;
  SPECIFICATION: string;
  [key: string]: unknown;
};

export const isQcPropellantProcessSubType = (value: string): value is QcPropellantProcessSubType =>
  QC_PROPELLANT_PROCESS_OPTIONS.some((option) => option.value === value);

export const getQcPropellantProcessLabel = (subType: string) =>
  QC_PROPELLANT_PROCESS_OPTIONS.find((option) => option.value === subType)?.label ?? subType;

export const mapQcPropellantProcessToApi = (process: string): QcApiSubType | null =>
  isQcPropellantProcessSubType(process) ? process : null;

export const getQcPropellantMotorLabel = (motorId?: string | null) =>
  motorId?.trim() ? `${motorId.trim()} — QC` : "QC";

export const getQcPropellantFmColumnLabel = (columnId: string) => {
  const bem = parseQcPropellantBemColumn(columnId);
  if (bem) {
    return bem.bemIndex <= 1 ? `FM-${bem.fmIndex} BEM No` : `FM-${bem.fmIndex} BEM No ${bem.bemIndex}`;
  }
  const fm = columnId.match(/^FM_(\d+)$/i);
  if (fm) return `FM-${fm[1]}`;
  return columnId.replace(/_/g, "-");
};

export const getQcPropellantBemSubLabel = (columnId: string) => {
  const bem = parseQcPropellantBemColumn(columnId);
  if (!bem) return columnId;
  return bem.bemIndex <= 1 ? "BEM No" : `BEM No ${bem.bemIndex}`;
};

export const isPropellantProcessAlreadyAdded = (
  motorId: string,
  process: string,
  addedDivisionEntryKeys: string[],
  flowKey: string,
) =>
  addedDivisionEntryKeys.includes(
    buildDivisionEntryDedupKey({
      flowKey,
      kind: "PROPELLANT_MOTOR",
      motorId,
      subType: mapQcPropellantProcessToApi(process) ?? undefined,
    }),
  ) ||
  addedDivisionEntryKeys.includes(
    buildDivisionEntryDedupKey({
      flowKey,
      kind: "PROPELLANT_MOTOR",
      motorId,
    }),
  );

export const getAddedPropellantProcessKeysForMotor = (
  entries: QcDivisionEntry[] = [],
  motorId: string,
) =>
  entries
    .filter(
      (entry) =>
        (entry.kind === "PROPELLANT_MOTOR" || entry.kind === "PROPELLANT_PROCESS") &&
        entry.motorId === motorId,
    )
    .map((entry) =>
      buildDivisionEntryDedupKey({
        flowKey: entry.flowKey,
        kind: entry.kind,
        motorId: entry.motorId,
        subType: entry.subType,
      }),
    );
