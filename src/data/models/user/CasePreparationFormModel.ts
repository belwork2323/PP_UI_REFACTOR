import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission, SchemaTableBlock } from "../../../schema-engine";
import {
  buildCasePrepMotorSubmission,
  buildCasePrepSectionPayload,
  createCasePrepInitialValues,
  hydrateCasePrepValuesFromSections,
  type CasePrepMotorSubmission,
} from "../../../schema-engine";
import { flattenTableColumns, walkBlocks } from "../../../schema-engine/utils/schemaUtils";
import { isWrappedTableValue } from "../../../schema-engine/utils/tableRowUtils";
import { schemaValuesHaveUserData } from "../../../schema-engine/state/formState";
import {
  formatPrepSectionCellValue,
  formatPrepSectionLabel,
} from "./RawMaterialPreparationModel";

export {
  formatPrepSectionLabel as formatCasePrepSectionLabel,
  formatPrepSectionCellValue as formatCasePrepCellValue,
  orderPrepSectionColumns as orderCasePrepSectionColumns,
} from "./RawMaterialPreparationModel";

export type CasePrepMotorSession = {
  motorId: string;
  prrcClearanceDate: string;
  formValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
};

export type CasePreparationFormState = {
  schema: SchemaDocumentV2 | null;
  motors: CasePrepMotorSession[];
  subscaleFormValues: SchemaFormValues;
  subscaleSavedSections?: SchemaSectionSubmission[];
};

export type CasePreparationFormBody = {
  schemaVersion?: string;
  schemaType?: string;
  motors: CasePrepMotorSubmission[];
  sections?: SchemaSectionSubmission[];
};

export const createDefaultCasePreparationFormState = (): CasePreparationFormState => ({
  schema: null,
  motors: [],
  subscaleFormValues: {},
});

export const createEmptyMotorSession = (
  motorId: string,
  prrcClearanceDate: string,
  schema: SchemaDocumentV2 | null
): CasePrepMotorSession => ({
  motorId,
  prrcClearanceDate,
  formValues: schema ? createCasePrepInitialValues(schema) : {},
  savedSections: undefined,
});

const resolveCasePrepDetailsPayload = (details: any) =>
  details?.casePreparationDetails ?? details?.preparationDetails ?? details ?? {};

export const mapCasePreparationDetailsToFormState = (details: any): CasePreparationFormState => {
  const payload = resolveCasePrepDetailsPayload(details);
  const rawMotors = Array.isArray(payload?.motors) ? payload.motors : [];

  const motors = rawMotors
    .map((motor: any) => ({
      motorId: String(motor?.motorId ?? "").trim(),
      prrcClearanceDate: String(
        motor?.prrcClearanceDate ?? motor?.prrcDate ?? motor?.prrcClearance ?? "",
      ).trim(),
      formValues: {},
      savedSections: Array.isArray(motor?.sections)
        ? motor.sections
        : Array.isArray(motor?.motorSections)
          ? motor.motorSections
          : undefined,
    }))
    .filter((motor) => motor.motorId.length > 0);

  const sections = Array.isArray(payload?.sections)
    ? payload.sections
    : Array.isArray(details?.sections)
      ? details.sections
      : undefined;

  return {
    schema: null,
    motors,
    subscaleFormValues: {},
    subscaleSavedSections: sections,
  };
};

export const hydrateCasePreparationFormState = (
  state: CasePreparationFormState,
  schema: SchemaDocumentV2 | null
): CasePreparationFormState => {
  if (!schema) return state;

  const motors = (state.motors ?? []).map((motor) => ({
    ...motor,
    formValues: motor.savedSections?.length
      ? hydrateCasePrepValuesFromSections(schema, motor.savedSections)
      : Object.keys(motor.formValues ?? {}).length > 0
        ? motor.formValues
        : createCasePrepInitialValues(schema),
  }));

  const subscaleFormValues = state.subscaleSavedSections?.length
    ? hydrateCasePrepValuesFromSections(schema, state.subscaleSavedSections)
    : Object.keys(state.subscaleFormValues ?? {}).length > 0
      ? state.subscaleFormValues
      : createCasePrepInitialValues(schema);

  return {
    ...state,
    schema,
    motors,
    subscaleFormValues,
  };
};

export const mapCasePreparationFormStateToPayload = (
  form: CasePreparationFormState
): CasePreparationFormBody => {
  const schema = form.schema;

  if (!schema) {
    return {
      motors: [],
      sections: [],
    };
  }

  const motors = (form.motors ?? []).map((motor) =>
    buildCasePrepMotorSubmission(motor.motorId, motor.prrcClearanceDate, schema, motor.formValues)
  );

  return {
    schemaVersion: schema.schemaVersion,
    schemaType: schema.schemaType,
    motors,
    sections: motors.length === 0 ? buildCasePrepSectionPayload(schema, form.subscaleFormValues) : undefined,
  };
};

export const hasAnyCasePreparationValue = (form: CasePreparationFormState) => {
  if ((form.motors ?? []).some((motor) => schemaValuesHaveUserData(motor.formValues ?? {}))) {
    return true;
  }
  return schemaValuesHaveUserData(form.subscaleFormValues ?? {});
};

export class CasePreparationSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(data: any = {}) {
    const payload = data?.data ?? data;
    this.formId = String(payload?.formId ?? "");
    this.batchId = String(payload?.batchId ?? "");
    this.status = String(payload?.status ?? "");
  }

  static fromApi(data: any) {
    const payload = data?.data ?? data ?? {};
    return new CasePreparationSubmitResponseModel(payload);
  }
}

export class CasePreparationDetailsModel {
  static fromApi(data: any) {
    const payload = data?.data ?? data ?? {};
    const casePreparationDetails =
      payload?.casePreparationDetails ?? payload?.preparationDetails ?? null;

    const mapPerson = (value: unknown): string | null => {
      if (value == null || value === "") return null;
      if (typeof value === "string") return value.trim();
      if (typeof value === "object") {
        const person = value as { fullName?: string; name?: string; id?: string };
        return String(person.fullName ?? person.name ?? person.id ?? "").trim() || null;
      }
      return String(value).trim() || null;
    };

    return {
      formId: String(payload?.formId ?? ""),
      batchId: String(payload?.batchId ?? ""),
      batchType: String(payload?.batchType ?? ""),
      subDepartmentId: Number(payload?.subDepartmentId ?? 0),
      formSubmissionType: String(payload?.formSubmissionType ?? ""),
      status: payload?.status != null ? String(payload.status) : undefined,
      createdBy: mapPerson(payload?.createdBy),
      createdAt: payload?.createdAt != null ? String(payload.createdAt) : null,
      submittedBy: mapPerson(payload?.submittedBy),
      submittedAt: payload?.submittedAt != null ? String(payload.submittedAt) : null,
      casePreparationDetails,
      motors:
        casePreparationDetails?.motors ??
        payload?.motors ??
        [],
      sections:
        casePreparationDetails?.sections ??
        payload?.sections ??
        [],
      generalActivities:
        casePreparationDetails?.generalActivities ??
        payload?.generalActivities ??
        {},
      linearCoatingOperation:
        casePreparationDetails?.linearCoatingOperation ??
        payload?.linearCoatingOperation ??
        {},
    };
  }
}

export type CasePrepDetailField = {
  key: string;
  label: string;
  value: string;
};

export type CasePrepDetailTable = {
  blockId: string;
  label: string;
  rows: Record<string, unknown>[];
  columnLabels: Record<string, string>;
};

export type CasePrepSchemaLabelIndex = {
  sections: Record<string, string>;
  blocks: Record<string, string>;
  tableColumns: Record<string, Record<string, string>>;
  tablePresetRows: Record<string, Record<string, unknown>[]>;
};

export const buildCasePrepSchemaLabelIndex = (
  schema: SchemaDocumentV2 | null | undefined,
): CasePrepSchemaLabelIndex => {
  const index: CasePrepSchemaLabelIndex = {
    sections: {},
    blocks: {},
    tableColumns: {},
    tablePresetRows: {},
  };

  if (!schema?.data?.sections) return index;

  schema.data.sections.forEach((section) => {
    index.sections[section.id] = section.title ?? formatPrepSectionLabel(section.id);

    walkBlocks(section.children, (block) => {
      if (block.type === "field") {
        index.blocks[block.id] = block.label ?? formatPrepSectionLabel(block.id);
        return;
      }

      if (block.type === "display") {
        index.blocks[block.id] = block.label ?? formatPrepSectionLabel(block.id);
        return;
      }

      if (block.type === "group" && block.label) {
        index.blocks[block.id] = block.label;
        return;
      }

      if (block.type === "table") {
        const table = block as SchemaTableBlock;
        index.blocks[table.id] =
          table.title ?? table.label ?? formatPrepSectionLabel(table.id);
        index.tableColumns[table.id] = {};
        flattenTableColumns(table.columns).forEach((column) => {
          index.tableColumns[table.id][column.id] =
            column.label ?? formatPrepSectionLabel(column.id);
        });
        if (table.rows?.presetRows?.length) {
          index.tablePresetRows[table.id] = table.rows.presetRows;
        }
      }
    });
  });

  return index;
};

const resolveCasePrepBlockLabel = (
  labelIndex: CasePrepSchemaLabelIndex | undefined,
  blockId: string,
): string => labelIndex?.blocks[blockId] ?? formatPrepSectionLabel(blockId);

const resolveCasePrepSectionLabel = (
  labelIndex: CasePrepSchemaLabelIndex | undefined,
  sectionId: string,
): string => labelIndex?.sections[sectionId] ?? formatPrepSectionLabel(sectionId);

const resolveCasePrepColumnLabel = (
  labelIndex: CasePrepSchemaLabelIndex | undefined,
  tableId: string,
  columnId: string,
): string =>
  labelIndex?.tableColumns[tableId]?.[columnId] ?? formatPrepSectionLabel(columnId);

export type CasePrepDetailSection = {
  sectionId: string;
  label: string;
  fields: CasePrepDetailField[];
  tables: CasePrepDetailTable[];
};

export type CasePrepMotorDetailView = {
  motorId: string;
  prrcClearanceDate: string;
  sections: CasePrepDetailSection[];
};

export type CasePreparationDetailView = {
  formId: string;
  batchId: string;
  batchType: string;
  status?: string;
  createdBy: string | null;
  createdAt: string | null;
  submittedBy: string | null;
  submittedAt: string | null;
  motors: CasePrepMotorDetailView[];
};

const CASE_PREP_SECTION_ORDER = [
  "abradingOperation",
  "bellowBonding",
  "tceCleaning",
  "preHeating",
  "linerCoatingOperation",
  "dispatchToCasting",
];

/** Serial / runtime keys — hidden in read-only detail tables. */
export const CASE_PREP_HIDDEN_TABLE_COLUMNS = new Set([
  "SR_NO",
  "srNo",
  "type",
  "fieldType",
  "_rowType",
  "_headerLabel",
]);

const CASE_PREP_COLUMN_PRIORITY = [
  "operation",
  "OPERATION",
  "parameter",
  "PARAMETER",
  "ingredient",
  "INGREDIENT",
  "value",
  "VALUE",
  "result",
  "RESULT",
  "specification",
  "SPECIFICATION",
  "remarks",
  "remarksObservations",
  "REMARKS",
  "attachments",
  "mfgLot",
  "partsByWeight",
  "quantityTaken",
  "totalQuantity",
  "quantity",
  "pastingDateTime",
];

export const orderCasePrepDisplayColumns = (columns: string[]): string[] => {
  const visible = columns.filter((col) => !CASE_PREP_HIDDEN_TABLE_COLUMNS.has(col) && !col.startsWith("_"));
  return [...visible].sort((a, b) => {
    const ai = CASE_PREP_COLUMN_PRIORITY.indexOf(a);
    const bi = CASE_PREP_COLUMN_PRIORITY.indexOf(b);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.localeCompare(b);
  });
};

const isCasePrepDisplayRowEmpty = (row: Record<string, unknown>): boolean => {
  const headerLabel = String(row._headerLabel ?? row.operation ?? row.parameter ?? "").trim();
  if (row.type === "header" && headerLabel) return false;
  if (headerLabel) return false;

  return !Object.entries(row).some(
    ([key, value]) =>
      !key.startsWith("_") &&
      !CASE_PREP_HIDDEN_TABLE_COLUMNS.has(key) &&
      formatPrepSectionCellValue(value) !== "—",
  );
};

export const filterCasePrepDisplayRows = (
  rows: Record<string, unknown>[],
): Record<string, unknown>[] => rows.filter((row) => !isCasePrepDisplayRowEmpty(row));

export const enrichCasePrepTableRows = (
  tableId: string,
  rows: Record<string, unknown>[],
  labelIndex?: CasePrepSchemaLabelIndex,
): Record<string, unknown>[] => {
  const presetRows = labelIndex?.tablePresetRows[tableId] ?? [];
  const enriched: Record<string, unknown>[] = [];

  rows.forEach((row, index) => {
    const preset = presetRows[index];
    if (preset?.type === "header") {
      if (!isCasePrepDisplayRowEmpty(row)) {
        enriched.push(row);
        return;
      }
      const headerLabel = String(preset.label ?? "").trim();
      if (headerLabel) {
        enriched.push({ type: "header", _headerLabel: headerLabel });
      }
      return;
    }

    if (!isCasePrepDisplayRowEmpty(row)) {
      enriched.push(row);
    }
  });

  return enriched;
};

const buildTableColumnLabels = (
  tableId: string,
  rows: Record<string, unknown>[],
  labelIndex?: CasePrepSchemaLabelIndex,
): Record<string, string> => {
  const columns = orderCasePrepDisplayColumns(
    Array.from(
      rows.reduce((keys, row) => {
        Object.keys(row ?? {}).forEach((key) => keys.add(key));
        return keys;
      }, new Set<string>()),
    ),
  );

  return Object.fromEntries(
    columns.map((columnId) => [columnId, resolveCasePrepColumnLabel(labelIndex, tableId, columnId)]),
  );
};

const isTableRowArray = (value: unknown): value is Record<string, unknown>[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((item) => item && typeof item === "object" && !Array.isArray(item));

const isCasePrepTableRow = (row: unknown): row is Record<string, unknown> => {
  if (!row || typeof row !== "object" || Array.isArray(row)) return false;
  const entry = row as Record<string, unknown>;
  if (entry.type === "header" || entry._rowType === "header") return true;
  return ["parameter", "operation", "ingredient", "PARAMETER", "OPERATION", "INGREDIENT"].some(
    (key) => key in entry,
  );
};

const isFlatCasePrepTableSection = (sectionData: Record<string, unknown>[] | undefined): boolean => {
  const rows = sectionData ?? [];
  if (!rows.length) return false;
  return rows.every((row) => isCasePrepTableRow(row));
};

const resolveCasePrepTableRows = (value: unknown): Record<string, unknown>[] | null => {
  if (isWrappedTableValue(value) && value.rows.length > 0) {
    return value.rows as Record<string, unknown>[];
  }
  if (isTableRowArray(value)) {
    return value;
  }
  if (isCasePrepTableRow(value)) {
    return [value];
  }
  return null;
};

const pushCasePrepDetailTable = (
  tables: CasePrepDetailTable[],
  blockId: string,
  rows: Record<string, unknown>[],
  labelIndex?: CasePrepSchemaLabelIndex,
) => {
  const displayRows = enrichCasePrepTableRows(blockId, rows, labelIndex);
  if (!displayRows.length) return;
  tables.push({
    blockId,
    label: resolveCasePrepBlockLabel(labelIndex, blockId),
    rows: displayRows,
    columnLabels: buildTableColumnLabels(blockId, displayRows, labelIndex),
  });
};

export const parseCasePrepSectionData = (
  sectionId: string,
  sectionData: Record<string, unknown>[] | undefined,
  labelIndex?: CasePrepSchemaLabelIndex,
): CasePrepDetailSection => {
  const fields: CasePrepDetailField[] = [];
  const tables: CasePrepDetailTable[] = [];
  const sectionRows = sectionData ?? [];

  if (isFlatCasePrepTableSection(sectionRows)) {
    pushCasePrepDetailTable(tables, sectionId, sectionRows, labelIndex);
    return {
      sectionId,
      label: resolveCasePrepSectionLabel(labelIndex, sectionId),
      fields,
      tables,
    };
  }

  sectionRows.forEach((dataRow) => {
    if (!dataRow || typeof dataRow !== "object") return;

    if (Array.isArray(dataRow)) {
      const nestedRows = dataRow.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item && typeof item === "object" && !Array.isArray(item)),
      );
      if (nestedRows.length > 0 && nestedRows.every(isCasePrepTableRow)) {
        pushCasePrepDetailTable(tables, sectionId, nestedRows, labelIndex);
      }
      return;
    }

    const entries = Object.entries(dataRow).filter(([key]) => !key.startsWith("_"));
    const arrayEntries = entries.filter(([, value]) => resolveCasePrepTableRows(value) !== null);
    const scalarEntries = entries.filter(([, value]) => resolveCasePrepTableRows(value) === null);

    if (arrayEntries.length === 1 && scalarEntries.length === 0) {
      const tableRows = resolveCasePrepTableRows(arrayEntries[0][1]);
      if (tableRows) {
        pushCasePrepDetailTable(tables, arrayEntries[0][0], tableRows, labelIndex);
      }
      return;
    }

    entries.forEach(([key, value]) => {
      const tableRows = resolveCasePrepTableRows(value);
      if (tableRows) {
        pushCasePrepDetailTable(tables, key, tableRows, labelIndex);
        return;
      }

      const formatted = formatPrepSectionCellValue(value);
      if (formatted === "—") return;

      fields.push({
        key,
        label: resolveCasePrepBlockLabel(labelIndex, key),
        value: formatted,
      });
    });
  });

  return {
    sectionId,
    label: resolveCasePrepSectionLabel(labelIndex, sectionId),
    fields,
    tables,
  };
};

const sortCasePrepSections = (sections: CasePrepDetailSection[]): CasePrepDetailSection[] =>
  [...sections].sort((a, b) => {
    const ai = CASE_PREP_SECTION_ORDER.indexOf(a.sectionId);
    const bi = CASE_PREP_SECTION_ORDER.indexOf(b.sectionId);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.sectionId.localeCompare(b.sectionId);
  });

const mapPersonLabel = (value: unknown): string | null => {
  if (value == null || value === "") return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "object") {
    const person = value as { fullName?: string; name?: string; id?: string };
    return String(person.fullName ?? person.name ?? person.id ?? "").trim() || null;
  }
  return String(value).trim() || null;
};

export const mapCasePreparationDetailsForDisplay = (
  data: Record<string, unknown> | null | undefined,
  schema?: SchemaDocumentV2 | null,
): CasePreparationDetailView | null => {
  if (!data) return null;

  const labelIndex = buildCasePrepSchemaLabelIndex(schema);
  const details = (data.casePreparationDetails ?? data) as Record<string, unknown>;
  const rawMotors = Array.isArray(details.motors) ? details.motors : [];

  const motors: CasePrepMotorDetailView[] = rawMotors
    .map((motor) => {
      const entry = motor as Record<string, unknown>;
      const sections = sortCasePrepSections(
        (Array.isArray(entry.sections) ? entry.sections : [])
          .map((section) => {
            const block = section as { sectionId?: string; sectionData?: Record<string, unknown>[] };
            return parseCasePrepSectionData(
              String(block.sectionId ?? ""),
              block.sectionData,
              labelIndex,
            );
          })
          .filter((section) => section.fields.length > 0 || section.tables.length > 0),
      );

      return {
        motorId: String(entry.motorId ?? "").trim(),
        prrcClearanceDate: String(
          entry.prrcClearanceDate ?? entry.prrcDate ?? entry.prrcClearance ?? "",
        ).trim(),
        sections,
      };
    })
    .filter((motor) => motor.motorId.length > 0);

  return {
    formId: String(data.formId ?? ""),
    batchId: String(data.batchId ?? ""),
    batchType: String(data.batchType ?? ""),
    status: data.status != null ? String(data.status) : undefined,
    createdBy: mapPersonLabel(data.createdBy),
    createdAt: data.createdAt != null ? String(data.createdAt) : null,
    submittedBy: mapPersonLabel(data.submittedBy),
    submittedAt: data.submittedAt != null ? String(data.submittedAt) : null,
    motors,
  };
};
