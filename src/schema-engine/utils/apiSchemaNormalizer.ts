import type {
  SchemaDataSource,
  SchemaFieldBlock,
  SchemaRootUi,
  SchemaSection,
  SchemaTableBlock,
  SchemaTableColumn,
  SchemaTableColumnSlot,
} from "../types";

type ApiField = {
  fieldId?: string;
  id?: string;
  label?: string;
  type?: string;
  readonly?: boolean;
  required?: boolean;
  unit?: string;
  formula?: string;
  dataSource?: string | Record<string, unknown>;
  displayKey?: string;
  valueKey?: string;
};

type ApiTableColumn = ApiField & {
  /** When present, this column slot is a group header spanning sub-columns. */
  columns?: ApiField[];
  /** Alternative key for sub-columns (used by some schemas). */
  fields?: ApiField[];
};

type ApiTableRow = {
  rowId?: string;
  dimension?: string;
  measurementType?: string;
  parameter?: string;
};

type ApiSpecialRow = {
  rowId?: string;
  type?: string;
  instruction?: string;
};

type ApiPredefinedRow = Record<string, unknown>;

type ApiTable = {
  tableId?: string;
  id?: string;
  title?: string;
  tableType?: string;
  dynamicRows?: boolean;
  addRowAllowed?: boolean;
  addColumnsAllowed?: boolean;
  deleteColumnsAllowed?: boolean;
  rowGenerationType?: string;
  rowGenerationSource?: string;
  rowHeaders?: string[];
  rows?: ApiTableRow[];
  predefinedRows?: ApiPredefinedRow[];
  mergePresetColumns?: string[];
  specialRows?: ApiSpecialRow[];
  columns?: ApiTableColumn[];
};

type ApiSectionBase = {
  sectionId?: string;
  sectionName?: string;
  id?: string;
  title?: string;
  type?: string;
  fields?: ApiField[];
  tables?: ApiTable[];
  sections?: ApiSection[];
  ui?: SchemaSection["ui"];
  children?: SchemaSection["children"];
};

/** Legacy API: when type is "table", table props (columns, predefinedRows, etc.) sit on the section root. */
type ApiFlatTableSection = ApiSectionBase &
  Omit<ApiTable, "tableId" | "id" | "title"> & {
    type: "table";
    columns: ApiTableColumn[];
  };

type ApiSection = ApiSectionBase | ApiFlatTableSection;

const isFlatTableSection = (section: ApiSection): section is ApiFlatTableSection =>
  section.type === "table" && Array.isArray((section as ApiFlatTableSection).columns);

const toApiTableFromSection = (section: ApiFlatTableSection): ApiTable => ({
  tableId: section.sectionId ?? section.id,
  columns: section.columns,
  predefinedRows: section.predefinedRows,
  mergePresetColumns: section.mergePresetColumns,
  addRowAllowed: section.addRowAllowed,
  addColumnsAllowed: section.addColumnsAllowed,
  deleteColumnsAllowed: section.deleteColumnsAllowed,
  dynamicRows: section.addRowAllowed !== false,
  rows: section.rows,
  rowHeaders: section.rowHeaders,
  specialRows: section.specialRows,
  rowGenerationSource: section.rowGenerationSource,
  rowGenerationType: section.rowGenerationType,
});

const resolveApiColumnId = (column: ApiTableColumn) => String(column.fieldId ?? column.id ?? "");

const mapPredefinedRowToPreset = (
  row: ApiPredefinedRow,
  columns: ApiTableColumn[],
): Record<string, unknown> => {
  if (row.type === "header") {
    return { type: "header", label: row.label ?? row.instruction ?? "" };
  }

  const preset: Record<string, unknown> = { readonly: true };
  Object.entries(row).forEach(([key, value]) => {
    const column = columns.find(
      (col) => resolveApiColumnId(col).toLowerCase() === key.toLowerCase(),
    );
    if (column) {
      preset[resolveApiColumnId(column)] = value;
    }
  });

  return preset;
};

const buildPresetRowsFromPredefinedRows = (
  predefinedRows: ApiPredefinedRow[] | undefined,
  columns: ApiTableColumn[],
): Record<string, unknown>[] => {
  if (!predefinedRows?.length) return [];
  return predefinedRows.map((row) => mapPredefinedRowToPreset(row, columns));
};

const mapFieldType = (
  type: string | undefined,
  readonly?: boolean,
  columnId?: string,
): { fieldType: string; readonly?: boolean } => {
  const normalized = String(type ?? "").toLowerCase();
  const id = String(columnId ?? "").toUpperCase();
  if (normalized === "autoincrement" || id === "SR_NO" || id === "S_NO") {
    return { fieldType: "serial", readonly: true };
  }
  if (normalized === "readonly") return { fieldType: "text", readonly: true };
  if (normalized === "formula") return { fieldType: "formula" };
  if (normalized === "time") return { fieldType: "time" };
  if (normalized === "datetime") return { fieldType: "datetime" };
  if (normalized === "date") return { fieldType: "date" };
  if (normalized === "number" && readonly && /^(SR[_\s]?NO|S\.?\s*NO\.?)$/i.test(id)) {
    return { fieldType: "serial", readonly: true };
  }
  return { fieldType: normalized || "text", readonly: readonly || undefined };
};

const mapDataSource = (dataSource?: string): SchemaDataSource | undefined => {
  const key = String(dataSource ?? "").trim();
  if (!key) return undefined;
  return { type: "api", api: { endpoint: key } };
};

const normalizeApiDataSource = (field: ApiField): SchemaDataSource | undefined => {
  const raw = field.dataSource;
  if (!raw) return undefined;

  if (typeof raw === "string") return mapDataSource(raw);

  if (typeof raw !== "object") return undefined;

  const ds = raw as Record<string, unknown>;
  const type = String(ds.type ?? "api").toLowerCase();

  if (type === "static" && Array.isArray(ds.options)) {
    return {
      type: "static",
      options: ds.options as Array<{ label: string; value: string }>,
    };
  }

  if (type === "api") {
    const apiValue = ds.api;
    const nested =
      apiValue && typeof apiValue === "object" ? (apiValue as Record<string, unknown>) : {};
    const endpoint =
      typeof apiValue === "string" ? apiValue : String(nested.endpoint ?? ds.endpoint ?? "");

    const resolveString = (nestedKey: string, flatKey: string) => {
      const nestedValue = nested[nestedKey];
      if (typeof nestedValue === "string") return nestedValue;
      const flatValue = ds[flatKey];
      return typeof flatValue === "string" ? flatValue : undefined;
    };

    const requestField = resolveString("requestField", "requestField")?.trim();

    return {
      type: "api",
      api: {
        endpoint,
        method: (nested.method ?? ds.method) as "GET" | "POST" | "PUT" | "DELETE" | undefined,
        ...(requestField ? { requestField } : {}),
        requestBody: (nested.requestBody ?? ds.requestBody) as Record<string, unknown> | undefined,
        responsePath: resolveString("responsePath", "responsePath"),
        displayKey:
          field.displayKey ??
          (typeof nested.displayKey === "string"
            ? nested.displayKey
            : typeof ds.displayKey === "string"
              ? ds.displayKey
              : undefined),
        valueKey:
          field.valueKey ??
          (typeof nested.valueKey === "string"
            ? nested.valueKey
            : typeof ds.valueKey === "string"
              ? ds.valueKey
              : undefined),
        ...(typeof nested.nestedOptionsKey === "string"
          ? { nestedOptionsKey: nested.nestedOptionsKey }
          : {}),
        ...(typeof nested.parentMatchField === "string"
          ? { parentMatchField: nested.parentMatchField }
          : {}),
        ...(typeof nested.parentMatchContextKey === "string"
          ? { parentMatchContextKey: nested.parentMatchContextKey }
          : {}),
      },
    };
  }

  return undefined;
};

const applyFieldMeta = (
  block: { validation?: { required?: boolean }; unit?: string; readonly?: boolean },
  field: ApiField,
  mapped: { fieldType: string; readonly?: boolean },
) => {
  if (mapped.readonly) block.readonly = true;
  if (field.required) {
    block.validation = { ...(block.validation ?? {}), required: true };
  }
  if (field.unit) block.unit = String(field.unit);
};

const normalizeApiField = (field: ApiField): SchemaFieldBlock => {
  const id = String(field.fieldId ?? field.id ?? "");
  const mapped = mapFieldType(field.type, field.readonly, id);
  const block: SchemaFieldBlock = {
    type: "field",
    id,
    fieldType: mapped.fieldType,
    label: field.label ? String(field.label) : undefined,
  };

  applyFieldMeta(block, field, mapped);

  const dataSource = normalizeApiDataSource(field);
  if (dataSource) block.dataSource = dataSource;

  if (field.formula) {
    block.formula = { expression: String(field.formula) };
    block.readonly = true;
  }

  return block;
};

const normalizeApiTableColumn = (column: ApiTableColumn): SchemaTableColumn => {
  const id = String(column.fieldId ?? column.id ?? "");
  const mapped = mapFieldType(column.type, column.readonly, id);
  const col: SchemaTableColumn = {
    type: "column",
    id,
    fieldType: mapped.fieldType,
    label: column.label ? String(column.label) : undefined,
  };

  applyFieldMeta(col, column, mapped);

  const dataSource = normalizeApiDataSource(column);
  if (dataSource) col.dataSource = dataSource;

  if (column.formula) {
    col.formula = { expression: String(column.formula) };
    col.readonly = true;
  }

  return col;
};

const normalizeApiTableColumnSlot = (column: ApiTableColumn): SchemaTableColumnSlot => {
  const subColumns = column.columns ?? column.fields;
  if (Array.isArray(subColumns) && subColumns.length > 0) {
    return {
      type: "group",
      id: String(column.fieldId ?? column.id ?? column.label ?? ""),
      label: String(column.label ?? ""),
      columns: subColumns.map(normalizeApiTableColumn),
    };
  }
  if (column.type === "group") {
    return normalizeApiTableColumn({ ...column, type: "text" });
  }
  return normalizeApiTableColumn(column);
};

const buildPresetRowsFromApiTable = (table: ApiTable): Record<string, unknown>[] => {
  const predefinedPresetRows = buildPresetRowsFromPredefinedRows(
    table.predefinedRows,
    table.columns ?? [],
  );
  if (predefinedPresetRows.length) return predefinedPresetRows;

  const specialByRowId = new Map(
    (table.specialRows ?? []).map((row) => [String(row.rowId ?? ""), row]),
  );

  if (table.rowHeaders?.length) {
    return table.rowHeaders.map((header) => ({
      readonly: true,
      ROW_LABEL: header,
    }));
  }

  if (!table.rows?.length) return [];

  const presetRows: Record<string, unknown>[] = [];
  table.rows.forEach((row) => {
    const rowId = String(row.rowId ?? "");
    const special = specialByRowId.get(rowId);
    if (special?.type === "instruction") {
      presetRows.push({
        type: "header",
        label: special.instruction ?? "",
      });
    }

    const preset: Record<string, unknown> = { readonly: true };
    if (row.dimension) preset.DIMENSION = row.dimension;
    if (row.measurementType) preset.MEASUREMENT_TYPE = row.measurementType;
    if (row.parameter) preset.PARAMETER = row.parameter;
    presetRows.push(preset);
  });

  return presetRows;
};

const flattenSlotIds = (slots: SchemaTableColumnSlot[]): string[] =>
  slots.flatMap((slot) => "columns" in slot && slot.type === "group" ? slot.columns.map((c) => c.id) : [slot.id]);

const findSerialColumn = (slots: SchemaTableColumnSlot[]): SchemaTableColumn | undefined => {
  for (const slot of slots) {
    if ("columns" in slot && slot.type === "group") {
      const found = slot.columns.find((c) => c.fieldType === "serial");
      if (found) return found;
    } else if ((slot as SchemaTableColumn).fieldType === "serial") {
      return slot as SchemaTableColumn;
    }
  }
  return undefined;
};

const injectLeadingColumns = (
  columns: SchemaTableColumnSlot[],
  presetRows: Record<string, unknown>[],
): SchemaTableColumnSlot[] => {
  const existingIds = new Set(flattenSlotIds(columns));
  const prefix: SchemaTableColumn[] = [];

  if (presetRows.some((row) => row.ROW_LABEL !== undefined) && !existingIds.has("ROW_LABEL")) {
    prefix.push({
      type: "column",
      id: "ROW_LABEL",
      fieldType: "static",
      label: "Row",
      readonly: true,
    });
  }
  if (presetRows.some((row) => row.DIMENSION !== undefined) && !existingIds.has("DIMENSION")) {
    prefix.push({
      type: "column",
      id: "DIMENSION",
      fieldType: "static",
      label: "Dimension",
      readonly: true,
    });
  }
  if (
    presetRows.some((row) => row.MEASUREMENT_TYPE !== undefined) &&
    !existingIds.has("MEASUREMENT_TYPE")
  ) {
    prefix.push({
      type: "column",
      id: "MEASUREMENT_TYPE",
      fieldType: "static",
      label: "Measurement",
      readonly: true,
    });
  }
  if (presetRows.some((row) => row.PARAMETER !== undefined) && !existingIds.has("PARAMETER")) {
    prefix.push({
      type: "column",
      id: "PARAMETER",
      fieldType: "static",
      label: "Parameter",
      readonly: true,
    });
  }

  return [...prefix, ...columns];
};

const normalizeApiTable = (table: ApiTable): SchemaTableBlock => {
  const presetRows = buildPresetRowsFromApiTable(table);
  const hasFixedRows = presetRows.length > 0;
  const allowAdd =
    table.addRowAllowed === true
      ? true
      : table.addRowAllowed === false
        ? false
        : !hasFixedRows && table.dynamicRows !== false;
  const columns = injectLeadingColumns(
    (table.columns ?? []).map(normalizeApiTableColumnSlot),
    presetRows,
  );
  const serialColumn = findSerialColumn(columns);

  return {
    type: "table",
    id: String(table.tableId ?? table.id ?? ""),
    label: table.title ? String(table.title) : undefined,
    title: table.title ? String(table.title) : undefined,
    ...(table.addColumnsAllowed ? { allowAddColumn: true } : {}),
    ...(table.deleteColumnsAllowed ? { allowDeleteColumn: true } : {}),
    rows: {
      allowAdd,
      allowDelete: allowAdd,
      autoIncrementKey: serialColumn?.id ?? "SR_NO",
      defaultCount: hasFixedRows ? presetRows.length : undefined,
      presetRows: hasFixedRows ? presetRows : undefined,
      ...(table.mergePresetColumns?.length
        ? { mergePresetColumns: table.mergePresetColumns.map(String) }
        : {}),
      ...(table.rowGenerationSource
        ? { rowGenerationSource: String(table.rowGenerationSource) }
        : {}),
    },
    columns,
  };
};

export const isApiStyleSection = (section: unknown): section is ApiSection => {
  if (!section || typeof section !== "object") return false;
  const row = section as ApiSection;
  if (Array.isArray(row.children)) return false;
  return Boolean(
    row.sectionId ||
    row.fields?.length ||
    row.tables?.length ||
    isFlatTableSection(row) ||
    (row.type === "stageSpecific" && row.tables?.length),
  );
};

export const isApiStyleSections = (sections: unknown[]): boolean =>
  sections.some((section) => isApiStyleSection(section));

export const normalizeApiSection = (section: ApiSection): SchemaSection => {
  if (section.id && Array.isArray(section.children)) {
    return section as unknown as SchemaSection;
  }

  let children: SchemaSection["children"] = [];

  if (isFlatTableSection(section)) {
    children = [normalizeApiTable(toApiTableFromSection(section))];
  } else if (section.type === "group" && section.sections?.length) {
    children = section.sections.flatMap((nested) => normalizeApiSection(nested).children ?? []);
  } else if (section.type === "stageSpecific" && section.tables?.length) {
    children = section.tables.map((table, index) =>
      normalizeApiTable({
        ...table,
        tableId: table.tableId ?? `${section.sectionId ?? section.id ?? "TABLE"}_${index}`,
      }),
    );
  } else {
    children = [
      ...(section.fields ?? []).map(normalizeApiField),
      ...(section.tables ?? []).map(normalizeApiTable),
    ];
  }

  return {
    id: String(section.sectionId ?? section.id ?? ""),
    title: String(section.sectionName ?? section.title ?? ""),
    ...(section.ui ? { ui: section.ui } : {}),
    children,
  };
};

export const normalizeApiSchemaSections = (sections: unknown[]): SchemaSection[] =>
  sections.map((section) =>
    isApiStyleSection(section) ? normalizeApiSection(section) : (section as SchemaSection),
  );

export const resolveSchemaRootUi = (
  dataPayload: Record<string, unknown>,
  envelope: Record<string, unknown>,
): SchemaRootUi | undefined => {
  const ui = (dataPayload.ui ?? envelope.ui) as SchemaRootUi | undefined;
  const layout = dataPayload.layout as { type?: string } | undefined;
  if (!layout?.type) return ui;

  return {
    ...(ui ?? {}),
    layout: layout.type,
  };
};
