import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import { QC_CASTING_SECTION_IDS } from "./qcCastingConfig";

export type QcCastingMandrelRow = {
  SR_NO?: number | string;
  READING_WITHOUT_CUP?: string;
  READING_WITH_BOTTOM_CUP?: string;
};

export type QcCastingTableRow = {
  SR_NO?: number | string;
  FINAL_MIX_BOWL_NO?: string;
  PROPELLANT_QTY?: string;
  INITIAL_UNLOADING_VISCOSITY?: string;
  CASTING_START_TIME?: string;
  CASTING_COMPLETION_TIME?: string;
  SLURRY_CAST_FROM_EACH_BOWL?: string;
  REMARKS?: string;
};

export type QcCastingWeightmentRow = {
  LOAD_CELL_INITIAL?: string;
  LOAD_CELL_FINAL?: string;
  TOTAL_WEIGHT?: string;
};

export type QcCastingPressurePlateRow = {
  SR_NO?: number | string;
  START_TIME?: string;
  END_TIME?: string;
  PRESSURE_SENSOR_USED?: string;
  INITIAL_PRESSURE_READING?: string;
  OBSERVATIONS?: string;
};

const formKey = (sectionId: string, blockId: string) => `${sectionId}::${blockId}`;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const hasValue = (value: unknown) => Boolean(String(value ?? "").trim());

const emptyMandrelRow = (srNo = 1): QcCastingMandrelRow => ({
  SR_NO: srNo,
  READING_WITHOUT_CUP: "",
  READING_WITH_BOTTOM_CUP: "",
});

const emptyCastingRow = (srNo = 1): QcCastingTableRow => ({
  SR_NO: srNo,
  FINAL_MIX_BOWL_NO: "",
  PROPELLANT_QTY: "",
  INITIAL_UNLOADING_VISCOSITY: "",
  CASTING_START_TIME: "",
  CASTING_COMPLETION_TIME: "",
  SLURRY_CAST_FROM_EACH_BOWL: "",
  REMARKS: "",
});

const emptyWeightmentRow = (): QcCastingWeightmentRow => ({
  LOAD_CELL_INITIAL: "",
  LOAD_CELL_FINAL: "",
  TOTAL_WEIGHT: "",
});

const emptyPressurePlateRow = (srNo = 1): QcCastingPressurePlateRow => ({
  SR_NO: srNo,
  START_TIME: "",
  END_TIME: "",
  PRESSURE_SENSOR_USED: "",
  INITIAL_PRESSURE_READING: "",
  OBSERVATIONS: "",
});

const normalizeRows = <T extends { SR_NO?: number | string }>(rows: T[]) =>
  rows.map((row, index) => ({
    ...row,
    SR_NO: row.SR_NO ?? index + 1,
  }));

const readTableRows = <T extends Record<string, unknown>>(
  values: SchemaFormValues | null | undefined,
  key: string,
  fallback: T[],
): T[] => {
  const raw = values?.[key];
  if (Array.isArray(raw) && raw.length) {
    return raw.filter((row) => row && typeof row === "object") as T[];
  }
  const rec = asRecord(raw);
  if (rec && Array.isArray(rec.rows) && rec.rows.length) {
    return rec.rows.filter((row) => row && typeof row === "object") as T[];
  }
  return fallback;
};

export const createInitialCastingValues = (): SchemaFormValues => ({
  [formKey(QC_CASTING_SECTION_IDS.SELECTION, "CASTING_TYPE")]: "",
  [formKey(QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY, "ASSEMBLY_DATE")]: "",
  [formKey(QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY, "MANDREL_ASSEMBLY")]: [emptyMandrelRow(1)],
  [formKey(QC_CASTING_SECTION_IDS.PROPELLANT_CASTING, "DATE_OF_CASTING")]: "",
  [formKey(QC_CASTING_SECTION_IDS.PROPELLANT_CASTING, "RH_PERCENT")]: "",
  [formKey(QC_CASTING_SECTION_IDS.PROPELLANT_CASTING, "VACUUM_MAINTAINED")]: "",
  [formKey(QC_CASTING_SECTION_IDS.PROPELLANT_CASTING, "CASTING_TABLE")]: [emptyCastingRow(1)],
  [formKey(QC_CASTING_SECTION_IDS.WEIGHTMENT, "WEIGHTMENT_DETAILS")]: [emptyWeightmentRow()],
  [formKey(QC_CASTING_SECTION_IDS.POST_CAST, "SOAKING_DURATION")]: "",
  [formKey(QC_CASTING_SECTION_IDS.POST_CAST, "PRESSURE_PLATE_ASSEMBLY_REQUIRED")]: "",
  [formKey(QC_CASTING_SECTION_IDS.POST_CAST, "PRESSURE_PLATE_DETAILS")]: [emptyPressurePlateRow(1)],
});

export const getCastingType = (values: SchemaFormValues | null | undefined) =>
  String(values?.[formKey(QC_CASTING_SECTION_IDS.SELECTION, "CASTING_TYPE")] ?? "");

export const setCastingType = (
  values: SchemaFormValues | null | undefined,
  value: string,
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_CASTING_SECTION_IDS.SELECTION, "CASTING_TYPE")]: value,
});

export const getCastingAssemblyDate = (values: SchemaFormValues | null | undefined) =>
  String(values?.[formKey(QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY, "ASSEMBLY_DATE")] ?? "");

export const setCastingAssemblyDate = (
  values: SchemaFormValues | null | undefined,
  value: string,
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY, "ASSEMBLY_DATE")]: value,
});

export const getCastingMandrelRows = (
  values: SchemaFormValues | null | undefined,
): QcCastingMandrelRow[] =>
  normalizeRows(
    readTableRows<QcCastingMandrelRow>(
      values,
      formKey(QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY, "MANDREL_ASSEMBLY"),
      [emptyMandrelRow(1)],
    ),
  );

export const setCastingMandrelRows = (
  values: SchemaFormValues | null | undefined,
  rows: QcCastingMandrelRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY, "MANDREL_ASSEMBLY")]: normalizeRows(rows),
});

export const getCastingPropellantField = (
  values: SchemaFormValues | null | undefined,
  field: "DATE_OF_CASTING" | "RH_PERCENT" | "VACUUM_MAINTAINED",
) => String(values?.[formKey(QC_CASTING_SECTION_IDS.PROPELLANT_CASTING, field)] ?? "");

export const setCastingPropellantField = (
  values: SchemaFormValues | null | undefined,
  field: "DATE_OF_CASTING" | "RH_PERCENT" | "VACUUM_MAINTAINED",
  value: string,
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_CASTING_SECTION_IDS.PROPELLANT_CASTING, field)]: value,
});

export const getCastingTableRows = (
  values: SchemaFormValues | null | undefined,
): QcCastingTableRow[] =>
  normalizeRows(
    readTableRows<QcCastingTableRow>(
      values,
      formKey(QC_CASTING_SECTION_IDS.PROPELLANT_CASTING, "CASTING_TABLE"),
      [emptyCastingRow(1)],
    ),
  );

export const setCastingTableRows = (
  values: SchemaFormValues | null | undefined,
  rows: QcCastingTableRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_CASTING_SECTION_IDS.PROPELLANT_CASTING, "CASTING_TABLE")]: normalizeRows(rows),
});

export const getCastingWeightmentRows = (
  values: SchemaFormValues | null | undefined,
): QcCastingWeightmentRow[] => {
  const rows = readTableRows<QcCastingWeightmentRow>(
    values,
    formKey(QC_CASTING_SECTION_IDS.WEIGHTMENT, "WEIGHTMENT_DETAILS"),
    [emptyWeightmentRow()],
  );
  return rows.length ? rows : [emptyWeightmentRow()];
};

export const setCastingWeightmentRows = (
  values: SchemaFormValues | null | undefined,
  rows: QcCastingWeightmentRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_CASTING_SECTION_IDS.WEIGHTMENT, "WEIGHTMENT_DETAILS")]: rows.length
    ? rows
    : [emptyWeightmentRow()],
});

export const getCastingPostCastField = (
  values: SchemaFormValues | null | undefined,
  field: "SOAKING_DURATION" | "PRESSURE_PLATE_ASSEMBLY_REQUIRED",
) => String(values?.[formKey(QC_CASTING_SECTION_IDS.POST_CAST, field)] ?? "");

export const setCastingPostCastField = (
  values: SchemaFormValues | null | undefined,
  field: "SOAKING_DURATION" | "PRESSURE_PLATE_ASSEMBLY_REQUIRED",
  value: string,
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_CASTING_SECTION_IDS.POST_CAST, field)]: value,
});

export const getCastingPressurePlateRows = (
  values: SchemaFormValues | null | undefined,
): QcCastingPressurePlateRow[] =>
  normalizeRows(
    readTableRows<QcCastingPressurePlateRow>(
      values,
      formKey(QC_CASTING_SECTION_IDS.POST_CAST, "PRESSURE_PLATE_DETAILS"),
      [emptyPressurePlateRow(1)],
    ),
  );

export const setCastingPressurePlateRows = (
  values: SchemaFormValues | null | undefined,
  rows: QcCastingPressurePlateRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_CASTING_SECTION_IDS.POST_CAST, "PRESSURE_PLATE_DETAILS")]: normalizeRows(rows),
});

const mandrelRowHasData = (row: QcCastingMandrelRow) =>
  hasValue(row.READING_WITHOUT_CUP) || hasValue(row.READING_WITH_BOTTOM_CUP);

const castingRowHasData = (row: QcCastingTableRow) =>
  hasValue(row.FINAL_MIX_BOWL_NO) ||
  hasValue(row.PROPELLANT_QTY) ||
  hasValue(row.INITIAL_UNLOADING_VISCOSITY) ||
  hasValue(row.CASTING_START_TIME) ||
  hasValue(row.CASTING_COMPLETION_TIME) ||
  hasValue(row.SLURRY_CAST_FROM_EACH_BOWL) ||
  hasValue(row.REMARKS);

const weightmentRowHasData = (row: QcCastingWeightmentRow) =>
  hasValue(row.LOAD_CELL_INITIAL) ||
  hasValue(row.LOAD_CELL_FINAL) ||
  hasValue(row.TOTAL_WEIGHT);

const pressurePlateRowHasData = (row: QcCastingPressurePlateRow) =>
  hasValue(row.START_TIME) ||
  hasValue(row.END_TIME) ||
  hasValue(row.PRESSURE_SENSOR_USED) ||
  hasValue(row.INITIAL_PRESSURE_READING) ||
  hasValue(row.OBSERVATIONS);

const sanitizeMandrelRows = (rows: QcCastingMandrelRow[]) =>
  normalizeRows(rows.filter(mandrelRowHasData)).map((row, index) => ({
    SR_NO: index + 1,
    READING_WITHOUT_CUP: String(row.READING_WITHOUT_CUP ?? "").trim(),
    READING_WITH_BOTTOM_CUP: String(row.READING_WITH_BOTTOM_CUP ?? "").trim(),
  }));

const sanitizeCastingRows = (rows: QcCastingTableRow[]) =>
  normalizeRows(rows.filter(castingRowHasData)).map((row, index) => ({
    SR_NO: index + 1,
    FINAL_MIX_BOWL_NO: String(row.FINAL_MIX_BOWL_NO ?? "").trim(),
    PROPELLANT_QTY: String(row.PROPELLANT_QTY ?? "").trim(),
    INITIAL_UNLOADING_VISCOSITY: String(row.INITIAL_UNLOADING_VISCOSITY ?? "").trim(),
    CASTING_START_TIME: String(row.CASTING_START_TIME ?? "").trim(),
    CASTING_COMPLETION_TIME: String(row.CASTING_COMPLETION_TIME ?? "").trim(),
    SLURRY_CAST_FROM_EACH_BOWL: String(row.SLURRY_CAST_FROM_EACH_BOWL ?? "").trim(),
    REMARKS: String(row.REMARKS ?? "").trim(),
  }));

const sanitizeWeightmentRows = (rows: QcCastingWeightmentRow[]) => {
  const sanitized = rows.filter(weightmentRowHasData).map((row) => ({
    LOAD_CELL_INITIAL: String(row.LOAD_CELL_INITIAL ?? "").trim(),
    LOAD_CELL_FINAL: String(row.LOAD_CELL_FINAL ?? "").trim(),
    TOTAL_WEIGHT: String(row.TOTAL_WEIGHT ?? "").trim(),
  }));
  return sanitized.length ? sanitized : [];
};

const sanitizePressurePlateRows = (rows: QcCastingPressurePlateRow[]) =>
  normalizeRows(rows.filter(pressurePlateRowHasData)).map((row, index) => ({
    SR_NO: index + 1,
    START_TIME: String(row.START_TIME ?? "").trim(),
    END_TIME: String(row.END_TIME ?? "").trim(),
    PRESSURE_SENSOR_USED: String(row.PRESSURE_SENSOR_USED ?? "").trim(),
    INITIAL_PRESSURE_READING: String(row.INITIAL_PRESSURE_READING ?? "").trim(),
    OBSERVATIONS: String(row.OBSERVATIONS ?? "").trim(),
  }));

export const buildCastingSectionPayload = (
  values: SchemaFormValues | null | undefined,
): SchemaSectionSubmission[] => {
  const sections: SchemaSectionSubmission[] = [];
  const castingType = getCastingType(values);
  if (hasValue(castingType)) {
    sections.push({
      sectionId: QC_CASTING_SECTION_IDS.SELECTION,
      sectionData: [{ CASTING_TYPE: castingType }],
    });
  }

  const assemblyDate = getCastingAssemblyDate(values);
  const mandrelRows = sanitizeMandrelRows(getCastingMandrelRows(values));
  if (hasValue(assemblyDate) || mandrelRows.length) {
    sections.push({
      sectionId: QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY,
      sectionData: [
        {
          ...(hasValue(assemblyDate) ? { ASSEMBLY_DATE: assemblyDate } : {}),
          ...(mandrelRows.length ? { MANDREL_ASSEMBLY: mandrelRows } : {}),
        },
      ],
    });
  }

  const propellantFields = {
    DATE_OF_CASTING: getCastingPropellantField(values, "DATE_OF_CASTING"),
    RH_PERCENT: getCastingPropellantField(values, "RH_PERCENT"),
    VACUUM_MAINTAINED: getCastingPropellantField(values, "VACUUM_MAINTAINED"),
  };
  const castingRows = sanitizeCastingRows(getCastingTableRows(values));
  if (
    hasValue(propellantFields.DATE_OF_CASTING) ||
    hasValue(propellantFields.RH_PERCENT) ||
    hasValue(propellantFields.VACUUM_MAINTAINED) ||
    castingRows.length
  ) {
    sections.push({
      sectionId: QC_CASTING_SECTION_IDS.PROPELLANT_CASTING,
      sectionData: [
        {
          ...(hasValue(propellantFields.DATE_OF_CASTING)
            ? { DATE_OF_CASTING: propellantFields.DATE_OF_CASTING }
            : {}),
          ...(hasValue(propellantFields.RH_PERCENT)
            ? { RH_PERCENT: propellantFields.RH_PERCENT }
            : {}),
          ...(hasValue(propellantFields.VACUUM_MAINTAINED)
            ? { VACUUM_MAINTAINED: propellantFields.VACUUM_MAINTAINED }
            : {}),
          ...(castingRows.length ? { CASTING_TABLE: castingRows } : {}),
        },
      ],
    });
  }

  const weightmentRows = sanitizeWeightmentRows(getCastingWeightmentRows(values));
  if (weightmentRows.length) {
    sections.push({
      sectionId: QC_CASTING_SECTION_IDS.WEIGHTMENT,
      sectionData: [{ WEIGHTMENT_DETAILS: weightmentRows }],
    });
  }

  const soakingDuration = getCastingPostCastField(values, "SOAKING_DURATION");
  const pressureRequired = getCastingPostCastField(values, "PRESSURE_PLATE_ASSEMBLY_REQUIRED");
  const pressureRows =
    pressureRequired === "YES"
      ? sanitizePressurePlateRows(getCastingPressurePlateRows(values))
      : [];
  if (hasValue(soakingDuration) || hasValue(pressureRequired) || pressureRows.length) {
    sections.push({
      sectionId: QC_CASTING_SECTION_IDS.POST_CAST,
      sectionData: [
        {
          ...(hasValue(soakingDuration) ? { SOAKING_DURATION: soakingDuration } : {}),
          ...(hasValue(pressureRequired)
            ? { PRESSURE_PLATE_ASSEMBLY_REQUIRED: pressureRequired }
            : {}),
          ...(pressureRows.length ? { PRESSURE_PLATE_DETAILS: pressureRows } : {}),
        },
      ],
    });
  }

  return sections;
};

const extractTableRows = <T extends Record<string, unknown>>(
  sectionData: unknown,
  tableId: string,
): T[] => {
  const data = asRecord(asArray(sectionData)[0]);
  if (!data) return [];
  const tableValue = data[tableId];
  if (Array.isArray(tableValue)) {
    return tableValue.filter((row) => row && typeof row === "object") as T[];
  }
  if (tableValue && typeof tableValue === "object") {
    const nestedRows = (tableValue as Record<string, unknown>).rows;
    if (Array.isArray(nestedRows)) {
      return nestedRows.filter((row) => row && typeof row === "object") as T[];
    }
  }
  return [];
};

export const hydrateCastingValuesFromSections = (
  sections: SchemaSectionSubmission[] | null | undefined,
): SchemaFormValues => {
  const values = createInitialCastingValues();

  for (const section of sections ?? []) {
    const sectionId = String(section.sectionId ?? "").trim();
    const data = asRecord(asArray(section.sectionData)[0]);
    if (!data) continue;

    if (sectionId === QC_CASTING_SECTION_IDS.SELECTION) {
      values[formKey(sectionId, "CASTING_TYPE")] = String(data.CASTING_TYPE ?? "");
      continue;
    }

    if (sectionId === QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY) {
      values[formKey(sectionId, "ASSEMBLY_DATE")] = String(data.ASSEMBLY_DATE ?? "");
      const rows = extractTableRows<QcCastingMandrelRow>(section.sectionData, "MANDREL_ASSEMBLY");
      if (rows.length) {
        values[formKey(sectionId, "MANDREL_ASSEMBLY")] = normalizeRows(rows);
      }
      continue;
    }

    if (sectionId === QC_CASTING_SECTION_IDS.PROPELLANT_CASTING) {
      values[formKey(sectionId, "DATE_OF_CASTING")] = String(data.DATE_OF_CASTING ?? "");
      values[formKey(sectionId, "RH_PERCENT")] = String(data.RH_PERCENT ?? "");
      values[formKey(sectionId, "VACUUM_MAINTAINED")] = String(data.VACUUM_MAINTAINED ?? "");
      const rows = extractTableRows<QcCastingTableRow>(section.sectionData, "CASTING_TABLE");
      if (rows.length) {
        values[formKey(sectionId, "CASTING_TABLE")] = normalizeRows(rows);
      }
      continue;
    }

    if (sectionId === QC_CASTING_SECTION_IDS.WEIGHTMENT) {
      const rows = extractTableRows<QcCastingWeightmentRow>(
        section.sectionData,
        "WEIGHTMENT_DETAILS",
      );
      if (rows.length) {
        values[formKey(sectionId, "WEIGHTMENT_DETAILS")] = rows;
      }
      continue;
    }

    if (sectionId === QC_CASTING_SECTION_IDS.POST_CAST) {
      values[formKey(sectionId, "SOAKING_DURATION")] = String(data.SOAKING_DURATION ?? "");
      values[formKey(sectionId, "PRESSURE_PLATE_ASSEMBLY_REQUIRED")] = String(
        data.PRESSURE_PLATE_ASSEMBLY_REQUIRED ?? "",
      );
      const rows = extractTableRows<QcCastingPressurePlateRow>(
        section.sectionData,
        "PRESSURE_PLATE_DETAILS",
      );
      if (rows.length) {
        values[formKey(sectionId, "PRESSURE_PLATE_DETAILS")] = normalizeRows(rows);
      }
    }
  }

  return values;
};
