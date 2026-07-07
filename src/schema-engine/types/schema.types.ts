/**
 * PP-Schema v2 TypeScript types.
 * Authoritative JSON shape is documented in docs/SCHEMA_SPEC.md.
 */

export type SchemaSpacingToken = "xs" | "sm" | "md" | "lg" | "xl" | string;

export type SchemaFieldOption = string | { label: string; value: string };

export type SchemaVisibilityOperator =
  | "EQ" | "EQUAL" | "EQUALS"
  | "NEQ" | "NOT_EQUAL" | "NOT_EQ"
  | "EMPTY" | "IS_EMPTY"
  | "NOT_EMPTY" | "IS_NOT_EMPTY"
  | "IN";

export type SchemaVisibilityCondition = {
  field: string;
  op?: SchemaVisibilityOperator;
  condition?: string;
  value?: unknown;
};

export type SchemaVisibleWhen = {
  when: SchemaVisibilityCondition[];
  logic?: "AND" | "OR";
};

export type SchemaValidation = {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
};

export type SchemaFormula = {
  expression: string;
  dependencies?: string[];
};

export type SchemaApiDataSource = {
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  requestBody?: Record<string, unknown>;
  /** Shorthand: pull this key from apiContext into the POST body (e.g. `batchId`). */
  requestField?: string;
  responsePath?: string;
  displayKey?: string;
  valueKey?: string;
  /** Extract nested array from a parent row (e.g. `grades` on a material). */
  nestedOptionsKey?: string;
  /** Parent row field matched against apiContext (e.g. `materialCode` vs `RAW_MATERIAL`). */
  parentMatchField?: string;
  parentMatchContextKey?: string;
};

export type SchemaDataSource =
  | { type: "static"; options: SchemaFieldOption[] }
  | { type: "api"; api: SchemaApiDataSource };

export type SchemaFieldValueTransform = "referenceRange" | "string";

export type SchemaCommitFieldMapping = {
  sourceField: string;
  targetColumn: string;
  transform?: SchemaFieldValueTransform;
};

export type SchemaColumnValueDerive = {
  targetColumn: string;
  sourceField: string;
  transform?: SchemaFieldValueTransform;
  matchFields?: string[];
};

export type SchemaTableCommitGroupConfig = {
  pickerColumns: string[];
  expandFromColumn: string;
  headerLabelTemplate?: string;
  carryColumns?: string[];
  readonlyExpandedColumns?: string[];
  /** Span these columns across expanded rows in a committed group (e.g. ingredient). */
  mergeExpandedColumns?: string[];
  /** When false, skip the full-width group header row (default: false if mergeExpandedColumns is set). */
  showGroupHeader?: boolean;
  fieldMappings: SchemaCommitFieldMapping[];
  addLabel?: string;
  removeGroupLabel?: string;
};

export type SchemaRepeatConfig = {
  defaultCount?: number | string;
  min?: number | string;
  max?: number | string;
  allowAdd?: boolean;
  allowDelete?: boolean;
  label?: string;
  addLabel?: string;
  deleteLabel?: string;
};

export type SchemaRowsConfig = {
  defaultCount?: number;
  min?: number;
  max?: number;
  allowAdd?: boolean;
  allowDelete?: boolean;
  autoIncrementKey?: string;
  presetRows?: Record<string, unknown>[];
  /** Backend table row source (e.g. CASTING_TABLE, HARDWARE_PREPARATION). */
  rowGenerationSource?: string;
  /** Picker row committed via Add Row expands API options into grouped rows. */
  commitGroup?: SchemaTableCommitGroupConfig;
  addLabel?: string;
};

export type SchemaColSpan = {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
};

export type SchemaUiConfig = {
  variant?: "card" | "plain" | "outlined" | string;
  density?: "compact" | "comfortable" | string;
  icon?: string;
  iconPosition?: "left" | "right";
  iconColor?: string;
  color?: string;
  background?: string;
  border?: boolean;
  borderColor?: string;
  borderRadius?: SchemaSpacingToken;
  shadow?: "none" | "sm" | string;
  padding?: SchemaSpacingToken;
  gap?: SchemaSpacingToken;
  fontSize?: SchemaSpacingToken;
  fontWeight?: number;
  textAlign?: "left" | "center" | "right";
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  colSpan?: SchemaColSpan;
  rowSpan?: number;
  placeholder?: string;
  flex?: string;
  expanded?: boolean;
  columns?: number;
  direction?: "row" | "column";
  wrap?: boolean;
  alignItems?: string;
  justifyContent?: string;
  order?: number;
  sx?: Record<string, unknown>;
};

export type SchemaDesignSystem = {
  colors?: Record<string, string>;
  typography?: {
    fontFamily?: string;
    scale?: Record<string, string>;
    label?: {
      size?: string;
      weight?: number;
      transform?: string;
      letterSpacing?: string;
    };
  };
  spacing?: Record<string, number>;
  radius?: Record<string, number>;
  icons?: Record<string, string>;
};

export type SchemaAccordionConfig = {
  defaultExpanded?: boolean;
  allowMultipleExpanded?: boolean;
  expandIcon?: string;
  collapseIcon?: string;
};

export type SchemaRootUi = {
  layout?: "flat" | "accordion" | "tabs" | "wizard" | string;
  gap?: SchemaSpacingToken;
  sectionVariant?: "card" | "plain" | "outlined" | string;
  sectionBorderRadius?: SchemaSpacingToken;
  designSystem?: SchemaDesignSystem;
  accordion?: SchemaAccordionConfig;
};

export type SchemaMeta = {
  title?: string;
  description?: string;
};

export type SchemaContext = Record<string, unknown>;

export type SchemaFieldType =
  | "text" | "number" | "decimal" | "textarea" | "password"
  | "date" | "time" | "datetime"
  | "dropdown" | "radio" | "checkbox" | "switch"
  | "file" | "image" | "formula" | "serial" | "static" | "dynamic"
  | string;

export type SchemaBlockBase = {
  id: string;
  label?: string;
  title?: string;
  ui?: SchemaUiConfig;
  validation?: SchemaValidation;
  visibleWhen?: SchemaVisibleWhen;
  defaultValue?: unknown;
  defaultValues?: unknown[];
};

export type SchemaFieldBlock = SchemaBlockBase & {
  type: "field";
  fieldType: SchemaFieldType;
  unit?: string;
  dataSource?: SchemaDataSource;
  formula?: SchemaFormula;
  readonly?: boolean;
};

export type SchemaTableColumn = SchemaBlockBase & {
  type: "column";
  fieldType: SchemaFieldType;
  unit?: string;
  dataSource?: SchemaDataSource;
  formula?: SchemaFormula;
  readonly?: boolean;
  derive?: SchemaColumnValueDerive;
};

export type SchemaTableColumnGroup = {
  type: "group";
  id: string;
  label: string;
  ui?: SchemaUiConfig;
  columns: SchemaTableColumn[];
};

export type SchemaTableColumnSlot = SchemaTableColumn | SchemaTableColumnGroup;

export type SchemaTableExtraColumn = SchemaTableColumn;

export type SchemaTableStoredValue = {
  rows: Record<string, unknown>[];
  extraColumns?: SchemaTableExtraColumn[];
};

export type SchemaTableColumnActions = {
  /** Toolbar placement for add-column control — default `top-right` when add is enabled */
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  addLabel?: string;
  ui?: SchemaUiConfig;
};

export type SchemaTableBlock = SchemaBlockBase & {
  type: "table";
  rows?: SchemaRowsConfig;
  columns: SchemaTableColumnSlot[];
  /** When true, user can add columns (e.g. FM4, FM5) via Add Column control */
  allowAddColumn?: boolean;
  /** When true, user can remove dynamically added columns */
  allowDeleteColumn?: boolean;
  /** Prefix for auto-generated column ids/labels — default `FM` → FM4, FM5, … */
  addColumnPrefix?: string;
  /** Count of prefixed columns created on form init (e.g. 1 → FM1) */
  initialExtraColumnCount?: number;
  /** Placement and styling for column add/delete toolbar */
  columnActions?: SchemaTableColumnActions;
};

export type SchemaMatrixRowField = {
  id: string;
  label: string;
  readonly?: boolean;
  ui?: SchemaUiConfig;
};

export type SchemaMatrixBlock = SchemaBlockBase & {
  type: "matrix";
  title?: string;
  rowFields: SchemaMatrixRowField[];
  columns: SchemaDataSource;
  rows?: SchemaRowsConfig;
  allowAddColumn?: boolean;
  allowDeleteColumn?: boolean;
};

export type SchemaAction =
  | { type: "submit" }
  | { type: "save_draft" }
  | { type: "reset" }
  | { type: "cancel" }
  | { type: "api"; api: SchemaApiDataSource; confirm?: string }
  | { type: "navigate"; path: string }
  | { type: "custom"; handler: string };

export type SchemaButtonBlock = SchemaBlockBase & {
  type: "button";
  action: SchemaAction;
  variant?: "primary" | "secondary" | "danger" | "text" | string;
};

export type SchemaDisplayBlock = SchemaBlockBase & {
  type: "display";
  displayType: "label" | "heading" | "description" | "badge" | "alert" | string;
  value?: string;
};

export type SchemaGroupBlock = SchemaBlockBase & {
  type: "group";
  groupKey?: string;
  repeat?: SchemaRepeatConfig;
  children: SchemaBlock[];
};

export type SchemaSectionBlock = SchemaBlockBase & {
  type: "section";
  title: string;
  repeat?: SchemaRepeatConfig;
  children: SchemaBlock[];
};

export type SchemaBlock =
  | SchemaFieldBlock
  | SchemaTableBlock
  | SchemaMatrixBlock
  | SchemaButtonBlock
  | SchemaDisplayBlock
  | SchemaGroupBlock
  | SchemaSectionBlock;

export type SchemaSection = {
  id: string;
  title: string;
  ui?: SchemaUiConfig;
  repeat?: SchemaRepeatConfig;
  visibleWhen?: SchemaVisibleWhen;
  children: SchemaBlock[];
};

/** Payload nested under root `data` — meta, ui, context, and sections */
export type SchemaPayload = {
  meta?: SchemaMeta;
  ui?: SchemaRootUi;
  context?: SchemaContext;
  sections: SchemaSection[];
};

export type SchemaDocumentV2 = {
  schemaVersion: string;
  schemaType: string;
  functionality: string;
  meta?: SchemaMeta;
  data: SchemaPayload;
};

export type SchemaComponentMapping = {
  blockType: string;
  fieldType?: string;
  commonComponent: string;
  status: "existing" | "planned";
};

export const SCHEMA_COMPONENT_MAP: SchemaComponentMapping[] = [
  { blockType: "field", fieldType: "text", commonComponent: "FormInput", status: "existing" },
  { blockType: "field", fieldType: "number", commonComponent: "FormInput", status: "existing" },
  { blockType: "field", fieldType: "textarea", commonComponent: "FormInput", status: "existing" },
  { blockType: "field", fieldType: "dropdown", commonComponent: "Dropdown", status: "existing" },
  { blockType: "field", fieldType: "date", commonComponent: "DateField", status: "planned" },
  { blockType: "field", fieldType: "file", commonComponent: "FileUploadButton", status: "existing" },
  { blockType: "field", fieldType: "image", commonComponent: "MediaUpload", status: "existing" },
  { blockType: "table", commonComponent: "DynamicTable", status: "planned" },
  { blockType: "matrix", commonComponent: "MatrixTable", status: "planned" },
  { blockType: "field", fieldType: "formula", commonComponent: "FormulaCell", status: "planned" },
  { blockType: "section", commonComponent: "FormCard / AccordionSection", status: "existing" },
  { blockType: "button", commonComponent: "Button", status: "existing" },
  { blockType: "display", fieldType: "badge", commonComponent: "StatusChip", status: "existing" },
];
