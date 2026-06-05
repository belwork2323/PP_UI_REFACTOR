export type SchemaFieldType =
  | "text"
  | "number"
  | "datetime"
  | "textarea"
  | "dropdown"
  | "table"
  | string;

export type SchemaFieldDataSource = {
  type: "api" | string;
  api?: string;
  method?: string;
  requestBody?: Record<string, unknown>;
};

/** Runtime values injected into schema API dropdown requests (e.g. subdepartmentId). */
export type SchemaApiContext = {
  subDepartmentId?: number;
};

export type SchemaField = {
  key: string;
  label: string;
  type: SchemaFieldType;
  unit?: string;
  required?: boolean;
  readonly?: boolean;
  group?: string;
  options?: string[];
  addRowAllowed?: boolean;
  columns?: SchemaColumn[];
  defaultRows?: Record<string, unknown>[];
  dataSource?: SchemaFieldDataSource;
  displayKey?: string;
  valueKey?: string;
  measurementConfig?: { valueType?: string; unit?: string };
  formula?: { expression?: string; unit?: string };
};

export type SchemaColumn = {
  key: string;
  label: string;
  type: SchemaFieldType;
  readonly?: boolean;
  unit?: string;
  width?: string;
  measurementConfig?: { valueType?: string; unit?: string };
  formula?: { expression?: string; unit?: string };
};

export type SchemaGroupedColumn = {
  groupLabel?: string;
  columns?: SchemaColumn[];
};

export type SchemaNestedGroup = {
  fields: SchemaField[];
};

export type SchemaSection = {
  sectionId: string;
  title: string;
  type: "dynamic-group" | "table" | "form" | "complex-table" | string;
  addRowAllowed?: boolean;
  groupLabel?: string;
  fields?: SchemaField[];
  columns?: SchemaColumn[];
  groupedColumns?: SchemaGroupedColumn[];
  defaultRows?: Record<string, unknown>[];
  lots?: SchemaNestedGroup;
  drums?: SchemaNestedGroup;
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

export type SchemaDocument = {
  schemaVersion: string;
  schemaType: string;
  functionality: string;
  layout?: { type: string };
  rawMaterialDetails: SchemaMaterialDetails;
  formDetails?: SchemaFormDetails;
  sections: SchemaSection[];
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
