import type {
  SchemaContext,
  SchemaDesignSystem,
  SchemaMeta,
  SchemaNode,
} from "./schema.v1.types";

export type SchemaFieldType =
  | "text"
  | "number"
  | "decimal"
  | "date"
  | "time"
  | "datetime"
  | "dynamic"
  | "textarea"
  | "dropdown"
  | "radio"
  | "file"
  | "table"
  | string;

export type SchemaFieldDataSource = {
  type: "api" | string;
  api?: string;
  method?: string;
  requestBody?: Record<string, unknown>;
  /** Dot path to the options array in the API response, e.g. "data.materials" */
  responsePath?: string;
};

/** Runtime values injected into schema API dropdown requests (e.g. subdepartmentId, batchId). */
export type SchemaApiContext = {
  subDepartmentId?: number;
  batchId?: string;
};

export type SchemaFieldOption =
  | string
  | {
      label?: string;
      value?: string;
    };

export type SchemaVisibilityCondition = {
  field: string;
  condition?: string;
  value?: unknown;
};

export type SchemaVisibilityRule = SchemaVisibilityCondition | SchemaVisibilityCondition[];

export type SchemaField = {
  key: string;
  label: string;
  type: SchemaFieldType;
  unit?: string;
  required?: boolean;
  readonly?: boolean;
  defaultValue?: unknown;
  defaultValues?: unknown[];
  visibleWhen?: SchemaVisibilityRule;
  group?: string;
  options?: SchemaFieldOption[];
  addRowAllowed?: boolean;
  columns?: SchemaColumn[];
  defaultRows?: Record<string, unknown>[];
  dataSource?: SchemaFieldDataSource;
  displayKey?: string;
  valueKey?: string;
  measurementConfig?: { valueType?: string; unit?: string };
  formula?: { expression?: string; unit?: string };
  multiple?: boolean;
  allowedTypes?: string[];
};

export type SchemaColumn = {
  key: string;
  label: string;
  type: SchemaFieldType;
  readonly?: boolean;
  defaultValue?: unknown;
  defaultValues?: unknown[];
  unit?: string;
  width?: string;
  multiple?: boolean;
  allowedTypes?: string[];
  options?: SchemaFieldOption[];
  dataSource?: SchemaFieldDataSource;
  displayKey?: string;
  valueKey?: string;
  measurementConfig?: { valueType?: string; unit?: string };
  formula?: { expression?: string; unit?: string };
};

export type SchemaGroupedColumn = {
  groupLabel?: string;
  columns?: SchemaColumn[];
};

export type SchemaTableColumnSlot =
  | { kind: "column"; column: SchemaColumn }
  | { kind: "group"; group: SchemaGroupedColumn };

export type SchemaNestedGroup = {
  fields: SchemaField[];
};

export type SchemaTableDefinition = {
  columns?: SchemaColumn[];
  defaultRows?: Record<string, unknown>[];
  addRowAllowed?: boolean;
  dynamicRowGeneration?: boolean;
};

export type SchemaRepeatConfig = {
  labelPattern?: string;
  allowAdd?: boolean;
  allowDelete?: boolean;
  defaultCount?: number | string;
  minCycles?: number | string;
  maxCycles?: number | string;
};

export type SchemaNodeStyleRef = {
  variant?: string;
  icon?: string;
  iconColor?: string;
  padding?: string;
  gap?: string;
  borderRadius?: string;
  border?: boolean;
  borderColor?: string;
  background?: string;
  sx?: Record<string, unknown>;
  [key: string]: unknown;
};

export type SchemaAccordionConfigRef = {
  defaultExpanded?: boolean;
  allowMultipleExpanded?: boolean;
  expandIcon?: string;
  collapseIcon?: string;
};

export type SchemaNodeLayoutRef = {
  type?: string;
  direction?: string;
  gap?: string;
  wrap?: boolean;
  alignItems?: string;
  justifyContent?: string;
  sectionVariant?: string;
  sectionBorderRadius?: string;
  accordionConfig?: SchemaAccordionConfigRef;
  [key: string]: unknown;
};

export type SchemaSection = {
  sectionId: string;
  title: string;
  type: "dynamic-group" | "table" | "form" | "complex-table" | "group" | "repeatable-table" | string;
  addRowAllowed?: boolean;
  defaultRowCount?: number;
  repeatConfig?: SchemaRepeatConfig;
  groupLabel?: string;
  groupType?: string;
  repeatFor?: string;
  visibleWhen?: SchemaVisibilityRule;
  fields?: SchemaField[];
  columns?: SchemaColumn[];
  groupedColumns?: SchemaGroupedColumn[];
  columnLayout?: SchemaTableColumnSlot[];
  defaultRows?: Record<string, unknown>[];
  sections?: SchemaSection[];
  table?: SchemaTableDefinition;
  lots?: SchemaNestedGroup;
  drums?: SchemaNestedGroup;
  style?: SchemaNodeStyleRef;
  layout?: SchemaNodeLayoutRef;
  /** Top-level section node id when flattened from a `section` parent */
  accordionGroupId?: string;
  /** Top-level section node label for accordion panel headers */
  accordionGroupLabel?: string;
  /** Style from the parent `section` node when children are flattened for accordion panels */
  accordionGroupStyle?: SchemaNodeStyleRef;
};

export type SchemaGrade = {
  gradeId: number;
  gradeCode: string;
  gradeName: string;
};

export type SchemaMaterialDetails = {
  materialId: number;
  materialCode: string;
  materialName: string;
  materialType: string;
  grade?: SchemaGrade | null;
};

export type SchemaFormDetails = {
  title?: string;
  description?: string;
};

export type SchemaDocumentLayout = {
  type?: string;
  gap?: string;
  sectionVariant?: string;
  sectionBorderRadius?: string;
  accordionConfig?: SchemaAccordionConfigRef;
  [key: string]: unknown;
};

export type SchemaDocument = {
  schemaVersion: string;
  schemaType: string;
  functionality: string;
  layout?: SchemaDocumentLayout;
  rawMaterialDetails: SchemaMaterialDetails;
  formDetails?: SchemaFormDetails;
  sections: SchemaSection[];
  /** PP-Schema v1 source nodes (when loaded from data.nodes) */
  nodes?: SchemaNode[];
  designSystem?: SchemaDesignSystem;
  meta?: SchemaMeta;
  context?: SchemaContext;
};

export type SchemaFormValues = Record<string, unknown[]>;

export type SchemaSectionSubmission = {
  sectionId: string;
  sectionData: unknown[];
};

export type SchemaProcessSubmission = {
  materialId: number;
  materialCode: string;
  materialName: string;
  gradeId: number | null;
  gradeCode: string | null;
  schemaVersion: string;
  schemaType: string;
  sections: SchemaSectionSubmission[];
};

export type SchemaThemeTokens = {
  primary: string;
  primaryLight?: string;
  surface: string;
  border: string;
  text: string;
  textSub: string;
  accent?: string;
  warn?: string;
};

export const DEFAULT_SCHEMA_THEME: SchemaThemeTokens = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
  warn: "#D4AC0D",
};
