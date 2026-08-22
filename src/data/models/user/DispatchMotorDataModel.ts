import {
  asArray,
  asRecord,
  pickField,
  str,
  toApiDate,
  toUiDate,
} from "./castingCuringFieldCodec";
import type { DispatchMotorSetup } from "./DispatchFormModel";

export type DispatchTableRowKind = "header" | "data";

export type DispatchPropellantRow = {
  srNo?: number | string;
  rowType?: DispatchTableRowKind;
  headerLabel?: string;
  PROPERTY: string;
  SPECIFICATION: string;
  readonly?: boolean;
  fmValues: Record<string, string>;
};

export type DispatchParameterRow = {
  srNo?: number | string;
  rowType?: DispatchTableRowKind;
  headerLabel?: string;
  PARAMETER: string;
  OBSERVATION: string;
  readonly?: boolean;
};

export type DispatchCheckPointRow = {
  srNo?: number | string;
  CHECK_POINT: string;
  OBSERVATION: string;
  readonly?: boolean;
};

export type DispatchPackingRow = {
  srNo?: number | string;
  NOMENCLATURE: string;
  OBSERVATION: string;
  readonly?: boolean;
};

export type DispatchMotorData = {
  PROPELLANT_PROPERTIES: {
    fmColumns: string[];
    rows: DispatchPropellantRow[];
  };
  WAIVER_DETAILS: {
    WAIVER_AVAILABLE: string;
  };
  ROCKET_MOTOR_INSPECTION: {
    rows: DispatchParameterRow[];
  };
  VEHICLE_DETAILS: {
    rows: DispatchCheckPointRow[];
  };
  ROCKET_MOTOR_PACKING: {
    tableRows: DispatchPackingRow[];
    NITROGEN_GAS_PURGING: string;
    NITROGEN_PURGING_PRESSURE: string;
    LABELLING_OF_MOTOR: string;
    DISPATCH_PHOTOS: string;
  };
  SAFETY_CLEARANCE: {
    SAFETY_CLEARANCE_STATUS: string;
    CLEARANCE_CERTIFICATE: string;
  };
  DISPATCH_TEAM: {
    QA_REPRESENTATIVE: string;
    SAFETY_REPRESENTATIVE: string;
    PROJECT_REPRESENTATIVE: string;
  };
};

const PACKING_SUPPLEMENTARY_LABELS = new Set([
  "Nitrogen gas purging",
  "Nitrogen purging pressure",
  "Labelling of motor",
]);

const FM_COLUMN_PREFIX = "FM";
const RESERVED_PROPELLANT_KEYS = new Set([
  "srNo",
  "SR_NO",
  "PROPERTY",
  "property",
  "SPECIFICATION",
  "specification",
  "finalMixResults",
  "type",
  "rowType",
  "headerLabel",
  "label",
  "readonly",
  "_readonly",
]);

const YES_NO_OPTIONS = [
  { value: "YES", label: "YES" },
  { value: "NO", label: "NO" },
];

export const DISPATCH_YES_NO_OPTIONS = YES_NO_OPTIONS;

const propellantPresetRows = (): DispatchPropellantRow[] => [
  { rowType: "header", headerLabel: "1) Mechanical", PROPERTY: "", SPECIFICATION: "", fmValues: {} },
  { readonly: true, PROPERTY: "a) Tensile Strength", SPECIFICATION: "", fmValues: {} },
  { readonly: true, PROPERTY: "b) Modulus", SPECIFICATION: "", fmValues: {} },
  { readonly: true, PROPERTY: "c) Elongation", SPECIFICATION: "", fmValues: {} },
  { readonly: true, PROPERTY: "d) Density", SPECIFICATION: "", fmValues: {} },
  { rowType: "header", headerLabel: "2) Interfacial", PROPERTY: "", SPECIFICATION: "", fmValues: {} },
  { readonly: true, PROPERTY: "a) Peel Strength", SPECIFICATION: "", fmValues: {} },
  { readonly: true, PROPERTY: "b) TBS", SPECIFICATION: "", fmValues: {} },
  { readonly: true, PROPERTY: "c) SBS", SPECIFICATION: "", fmValues: {} },
  { rowType: "header", headerLabel: "3) Ballistic", PROPERTY: "", SPECIFICATION: "", fmValues: {} },
  { readonly: true, PROPERTY: "a) Burn Rate", SPECIFICATION: "", fmValues: {} },
];

const inspectionPresetRows = (): DispatchParameterRow[] => [
  { rowType: "header", headerLabel: "a. External Surface", PARAMETER: "", OBSERVATION: "" },
  { readonly: true, PARAMETER: "i. Condition of Lugs", OBSERVATION: "" },
  { readonly: true, PARAMETER: "ii. HE Polar Boss", OBSERVATION: "" },
  { readonly: true, PARAMETER: "iii. NE Polar Boss", OBSERVATION: "" },
  { rowType: "header", headerLabel: "b. Propellant Internal Surface", PARAMETER: "", OBSERVATION: "" },
  { readonly: true, PARAMETER: "i. Port", OBSERVATION: "" },
  { readonly: true, PARAMETER: "ii. IR Bead", OBSERVATION: "" },
];

const vehiclePresetRows = (): DispatchCheckPointRow[] => [
  { readonly: true, CHECK_POINT: "Vehicle No.", OBSERVATION: "" },
  { readonly: true, CHECK_POINT: "Condition of Tyres", OBSERVATION: "" },
  { readonly: true, CHECK_POINT: "Visual observation on article", OBSERVATION: "" },
  { readonly: true, CHECK_POINT: "Firefighting Equipment availability", OBSERVATION: "" },
  { readonly: true, CHECK_POINT: "Isolator conditions", OBSERVATION: "" },
  { readonly: true, CHECK_POINT: "Shock log Ids", OBSERVATION: "" },
  { readonly: true, CHECK_POINT: "Name of Convoy Commander", OBSERVATION: "" },
];

const packingPresetRows = (): DispatchPackingRow[] => [
  { readonly: true, NOMENCLATURE: "End Closures at HE", OBSERVATION: "" },
  { readonly: true, NOMENCLATURE: "End Closures at NE", OBSERVATION: "" },
];

export const createEmptyDispatchMotorData = (): DispatchMotorData => ({
  PROPELLANT_PROPERTIES: {
    fmColumns: ["FM_1"],
    rows: propellantPresetRows(),
  },
  WAIVER_DETAILS: { WAIVER_AVAILABLE: "" },
  ROCKET_MOTOR_INSPECTION: { rows: inspectionPresetRows() },
  VEHICLE_DETAILS: { rows: vehiclePresetRows() },
  ROCKET_MOTOR_PACKING: {
    tableRows: packingPresetRows(),
    NITROGEN_GAS_PURGING: "",
    NITROGEN_PURGING_PRESSURE: "",
    LABELLING_OF_MOTOR: "",
    DISPATCH_PHOTOS: "",
  },
  SAFETY_CLEARANCE: {
    SAFETY_CLEARANCE_STATUS: "NO",
    CLEARANCE_CERTIFICATE: "",
  },
  DISPATCH_TEAM: {
    QA_REPRESENTATIVE: "",
    SAFETY_REPRESENTATIVE: "",
    PROJECT_REPRESENTATIVE: "",
  },
});

const toFilePathList = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object" && "name" in item) {
          return String((item as { name?: string }).name ?? "").trim();
        }
        return "";
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

const toFilePathValue = (value: unknown): string => toFilePathList(value).join(", ");

const sortFmColumnIds = (columns: string[]): string[] =>
  [...columns].sort((a, b) => {
    const na = Number(a.replace(/\D/g, "")) || 0;
    const nb = Number(b.replace(/\D/g, "")) || 0;
    return na - nb;
  });

const fmColumnFromMixNo = (mixNo: unknown): string | null => {
  const n = Number(mixNo);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `FM_${n}`;
};

const mixNoFromFmColumn = (columnId: string): number | null => {
  const n = Number(String(columnId).replace(/\D/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const extractFmColumns = (rows: unknown[]): string[] => {
  const columns = new Set<string>();
  asArray(rows).forEach((row) => {
    const rec = asRecord(row);
    if (!rec) return;

    const finalMixResults = asArray(rec.finalMixResults);
    if (finalMixResults.length) {
      finalMixResults.forEach((entry) => {
        const mixRec = asRecord(entry);
        const col = fmColumnFromMixNo(mixRec?.finalMixNo);
        if (col) columns.add(col);
      });
      return;
    }

    Object.keys(rec).forEach((key) => {
      if (RESERVED_PROPELLANT_KEYS.has(key)) return;
      if (/^FM/i.test(key)) columns.add(key);
    });
  });
  const sorted = sortFmColumnIds([...columns]);
  return sorted.length ? sorted : ["FM_1"];
};

const readPropellantFmValues = (
  savedRow: Record<string, unknown>,
  fmColumns: string[],
): Record<string, string> => {
  const fmValues: Record<string, string> = {};
  const finalMixResults = asArray(savedRow.finalMixResults);
  if (finalMixResults.length) {
    finalMixResults.forEach((entry) => {
      const mixRec = asRecord(entry);
      const col = fmColumnFromMixNo(mixRec?.finalMixNo);
      if (col) fmValues[col] = str(mixRec?.value ?? "");
    });
    return fmValues;
  }

  fmColumns.forEach((col) => {
    fmValues[col] = str(savedRow[col] ?? "");
  });
  return fmValues;
};

const parsePropellantRows = (saved: unknown): DispatchPropellantRow[] => {
  const preset = propellantPresetRows();
  const savedRows = asArray(saved);
  if (!savedRows.length) return preset;

  const fmColumns = extractFmColumns(savedRows);
  return preset.map((presetRow, index) => {
    const savedRow =
      asRecord(
        savedRows.find((entry) => {
          const rec = asRecord(entry);
          if (!rec) return false;
          const property = str(pickField(rec, "PROPERTY", "property")).trim();
          return property && property === presetRow.PROPERTY;
        }),
      ) ?? asRecord(savedRows[index]) ?? {};

    if (presetRow.rowType === "header") {
      return {
        ...presetRow,
        headerLabel:
          str(pickField(savedRow, "headerLabel", "label")) || presetRow.headerLabel || "",
      };
    }

    const fmValues = readPropellantFmValues(savedRow, fmColumns);

    return {
      ...presetRow,
      SPECIFICATION: str(pickField(savedRow, "SPECIFICATION", "specification")) || "",
      fmValues,
    };
  });
};

const observationParseKeys = (fieldKey: string): string[] => {
  if (fieldKey === "PARAMETER") return ["PARAMETER", "parameter"];
  if (fieldKey === "CHECK_POINT") return ["CHECK_POINT", "checkPoint"];
  if (fieldKey === "NOMENCLATURE") return ["NOMENCLATURE", "nomenclature"];
  if (fieldKey === "OBSERVATION") return ["OBSERVATION", "observation"];
  return [fieldKey, fieldKey.toLowerCase()];
};

const mergePresetObservationRows = <T extends { readonly?: boolean }>(
  preset: T[],
  saved: unknown,
  labelKey: keyof T,
  valueKey: keyof T,
): T[] => {
  const savedRows = asArray(saved);
  const labelKeys = observationParseKeys(String(labelKey));
  const valueKeys = observationParseKeys(String(valueKey));
  return preset.map((presetRow, index) => {
    const label = str(presetRow[labelKey] ?? "").trim();
    const savedRow =
      asRecord(
        savedRows.find((entry) => {
          const rec = asRecord(entry);
          if (!rec) return false;
          return str(pickField(rec, ...labelKeys)).trim() === label;
        }),
      ) ?? asRecord(savedRows[index]) ?? {};
    return {
      ...presetRow,
      [valueKey]: str(pickField(savedRow, ...valueKeys)) || "",
    } as T;
  });
};

const splitPackingDetails = (rows: unknown[]) => {
  const tableRows: Record<string, unknown>[] = [];
  let nitrogenPurging = "";
  let nitrogenPressure = "";
  let labelling = "";

  asArray(rows).forEach((row) => {
    const rec = asRecord(row);
    if (!rec) return;
    const label = str(pickField(rec, "NOMENCLATURE", "nomenclature")).trim();
    if (PACKING_SUPPLEMENTARY_LABELS.has(label)) {
      const observation = str(pickField(rec, "OBSERVATION", "observation")).trim();
      if (label === "Nitrogen gas purging") nitrogenPurging = observation;
      if (label === "Nitrogen purging pressure") nitrogenPressure = observation;
      if (label === "Labelling of motor") labelling = observation;
      return;
    }
    tableRows.push(rec);
  });

  return { tableRows, nitrogenPurging, nitrogenPressure, labelling };
};

export const parseDispatchMotorDataFromApi = (
  details: Record<string, unknown> | null | undefined,
): DispatchMotorData => {
  const empty = createEmptyDispatchMotorData();
  if (!details) return empty;

  const packing = splitPackingDetails(
    asArray(details.rocketMotorPackingDetails ?? details.rocketMotorPacking),
  );
  const waiver = asRecord(details.waiverDetails) ?? {};
  const safety = asRecord(details.safetyClearance) ?? {};
  const team = asRecord(details.dispatchTeam) ?? {};

  const propellantRows = parsePropellantRows(details.propellantProperties);

  return {
    PROPELLANT_PROPERTIES: {
      fmColumns: extractFmColumns(asArray(details.propellantProperties)),
      rows: propellantRows,
    },
    WAIVER_DETAILS: {
      WAIVER_AVAILABLE: str(
        pickField(waiver, "details", "WAIVER_AVAILABLE", "available") ||
          (typeof waiver.available === "boolean" && !waiver.details ? "" : waiver.details),
      ),
    },
    ROCKET_MOTOR_INSPECTION: {
      rows: mergePresetObservationRows(
        inspectionPresetRows(),
        details.rocketMotorInspection,
        "PARAMETER",
        "OBSERVATION",
      ),
    },
    VEHICLE_DETAILS: {
      rows: mergePresetObservationRows(
        vehiclePresetRows(),
        details.vehicleDetails,
        "CHECK_POINT",
        "OBSERVATION",
      ),
    },
    ROCKET_MOTOR_PACKING: {
      tableRows: mergePresetObservationRows(
        packingPresetRows(),
        packing.tableRows,
        "NOMENCLATURE",
        "OBSERVATION",
      ),
      NITROGEN_GAS_PURGING: packing.nitrogenPurging,
      NITROGEN_PURGING_PRESSURE: packing.nitrogenPressure,
      LABELLING_OF_MOTOR: packing.labelling,
      DISPATCH_PHOTOS: toFilePathValue(details.uploadDispatchPhotos),
    },
    SAFETY_CLEARANCE: {
      SAFETY_CLEARANCE_STATUS: str(
        pickField(safety, "accorded", "SAFETY_CLEARANCE_STATUS") || "NO",
      ),
      CLEARANCE_CERTIFICATE: toFilePathValue(
        pickField(safety, "clearanceCertificate", "CLEARANCE_CERTIFICATE"),
      ),
    },
    DISPATCH_TEAM: {
      QA_REPRESENTATIVE: str(pickField(team, "qaRepresentative", "QA_REPRESENTATIVE")),
      SAFETY_REPRESENTATIVE: str(pickField(team, "safetyRepresentative", "SAFETY_REPRESENTATIVE")),
      PROJECT_REPRESENTATIVE: str(
        pickField(team, "projectRepresentative", "PROJECT_REPRESENTATIVE"),
      ),
    },
  };
};

const apiDateOrUi = (value: string): string | undefined =>
  (toApiDate(value) ?? String(value).trim()) || undefined;

const omitEmpty = <T extends Record<string, unknown>>(record: T): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(record).filter(([, value]) => {
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }),
  );

const observationApiKeys = (
  labelKey: string,
): { label: string; value: string } => {
  if (labelKey === "PARAMETER") return { label: "parameter", value: "observation" };
  if (labelKey === "CHECK_POINT") return { label: "checkPoint", value: "observation" };
  return { label: "nomenclature", value: "observation" };
};

const buildPropellantApiRows = (data: DispatchMotorData["PROPELLANT_PROPERTIES"]) =>
  data.rows
    .filter((row) => row.rowType !== "header" && String(row.PROPERTY ?? "").trim())
    .map((row, index) => {
      const finalMixResults = data.fmColumns
        .map((col) => {
          const finalMixNo = mixNoFromFmColumn(col);
          const value = row.fmValues[col]?.trim();
          if (!finalMixNo || !value) return null;
          return { finalMixNo, value };
        })
        .filter((entry): entry is { finalMixNo: number; value: string } => Boolean(entry));

      return omitEmpty({
        srNo: index + 1,
        property: row.PROPERTY,
        specification: row.SPECIFICATION.trim() || undefined,
        finalMixResults: finalMixResults.length ? finalMixResults : undefined,
      });
    });

const buildPackingSupplementaryRows = (packing: DispatchMotorData["ROCKET_MOTOR_PACKING"]) => {
  const rows: Record<string, unknown>[] = [];
  const nitrogen = String(packing.NITROGEN_GAS_PURGING ?? "").trim();
  if (nitrogen) {
    rows.push({ nomenclature: "Nitrogen gas purging", observation: nitrogen });
    const pressure = String(packing.NITROGEN_PURGING_PRESSURE ?? "").trim();
    if (nitrogen === "YES" && pressure) {
      rows.push({ nomenclature: "Nitrogen purging pressure", observation: pressure });
    }
  }
  const labelling = String(packing.LABELLING_OF_MOTOR ?? "").trim();
  if (labelling) {
    rows.push({ nomenclature: "Labelling of motor", observation: labelling });
  }
  return rows;
};

const buildObservationApiRows = <T extends Record<string, string>>(
  rows: T[],
  labelKey: keyof T,
  valueKey: keyof T,
) => {
  const { label: apiLabelKey, value: apiValueKey } = observationApiKeys(String(labelKey));
  return rows
    .filter((row) => row.rowType !== "header" && String(row[labelKey] ?? "").trim())
    .map((row, index) =>
      omitEmpty({
        srNo: index + 1,
        [apiLabelKey]: row[labelKey],
        [apiValueKey]: String(row[valueKey] ?? "").trim() || undefined,
      }),
    );
};

export type DispatchDetailsApiPayload = {
  projectName?: string;
  stage?: string;
  castingDate?: string;
  dispatchDate?: string;
  dispatchLocation?: string;
  ndtClearance?: { accorded: string; momNo?: string };
  finalAcceptanceCommitteeClearance?: { accorded: string; momNo?: string };
  propellantProperties?: unknown[];
  waiverDetails?: { available: boolean; details: string; uploadedDocuments: string[] };
  rocketMotorInspection?: unknown[];
  vehicleDetails?: unknown[];
  rocketMotorPackingDetails?: unknown[];
  uploadDispatchPhotos?: string[];
  safetyClearance?: { accorded: string; clearanceCertificate?: string };
  dispatchTeam?: {
    qaRepresentative?: string;
    safetyRepresentative?: string;
    projectRepresentative?: string;
  };
};

export const buildDispatchMotorDetailsPayload = (
  data: DispatchMotorData,
  setup: DispatchMotorSetup,
  options?: { projectName?: string },
): DispatchDetailsApiPayload => {
  const waiverText = String(data.WAIVER_DETAILS.WAIVER_AVAILABLE ?? "").trim();
  const packing = data.ROCKET_MOTOR_PACKING;

  return omitEmpty({
    projectName: options?.projectName,
    stage: setup.motorStage ? `STAGE_${setup.motorStage}` : undefined,
    castingDate: apiDateOrUi(setup.castingDate),
    dispatchDate: apiDateOrUi(setup.dispatchDate),
    dispatchLocation: setup.dispatchLocation.trim() || undefined,
    ndtClearance: {
      accorded: setup.ndtClearance || "NO",
      momNo: setup.ndtClearance === "YES" ? setup.ndtMomNo.trim() || undefined : undefined,
    },
    finalAcceptanceCommitteeClearance: {
      accorded: setup.finalAcceptanceClearance || "NO",
      momNo:
        setup.finalAcceptanceClearance === "YES"
          ? setup.finalAcceptanceMomNo.trim() || undefined
          : undefined,
    },
    propellantProperties: buildPropellantApiRows(data.PROPELLANT_PROPERTIES),
    waiverDetails: {
      available: waiverText.length > 0,
      details: waiverText,
      uploadedDocuments: [],
    },
    rocketMotorInspection: buildObservationApiRows(
      data.ROCKET_MOTOR_INSPECTION.rows,
      "PARAMETER",
      "OBSERVATION",
    ),
    vehicleDetails: buildObservationApiRows(
      data.VEHICLE_DETAILS.rows,
      "CHECK_POINT",
      "OBSERVATION",
    ),
    rocketMotorPackingDetails: [
      ...buildObservationApiRows(packing.tableRows, "NOMENCLATURE", "OBSERVATION"),
      ...buildPackingSupplementaryRows(packing),
    ],
    uploadDispatchPhotos: toFilePathList(packing.DISPATCH_PHOTOS),
    safetyClearance: {
      accorded: data.SAFETY_CLEARANCE.SAFETY_CLEARANCE_STATUS || "NO",
      clearanceCertificate: toFilePathValue(data.SAFETY_CLEARANCE.CLEARANCE_CERTIFICATE) || undefined,
    },
    dispatchTeam: {
      qaRepresentative: data.DISPATCH_TEAM.QA_REPRESENTATIVE.trim() || undefined,
      safetyRepresentative: data.DISPATCH_TEAM.SAFETY_REPRESENTATIVE.trim() || undefined,
      projectRepresentative: data.DISPATCH_TEAM.PROJECT_REPRESENTATIVE.trim() || undefined,
    },
  }) as DispatchDetailsApiPayload;
};

export const nextFmColumnId = (columns: string[]): string => {
  const nums = columns
    .map((col) => mixNoFromFmColumn(col))
    .filter((n): n is number => n !== null);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${FM_COLUMN_PREFIX}_${next}`;
};

export const dispatchMotorDataHasUserInput = (data: DispatchMotorData | null | undefined): boolean => {
  if (!data) return false;
  const check = (value: unknown): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "number" || typeof value === "boolean") return true;
    if (Array.isArray(value)) return value.some(check);
    if (typeof value === "object") {
      return Object.values(value as Record<string, unknown>).some(check);
    }
    return false;
  };
  return check(data);
};
