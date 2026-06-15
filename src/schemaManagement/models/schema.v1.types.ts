import type {
  SchemaFieldDataSource,
  SchemaFieldOption,
  SchemaVisibilityRule,
} from "./schema.types";

export type SchemaComponentType =
  | "field"
  | "column"
  | "columnGroup"
  | "section"
  | "group"
  | "stack"
  | "grid"
  | "table"
  | "repeatable"
  | "dynamicGroup"
  | "nestedGroup"
  | "header"
  | "divider"
  | "alert"
  | "badge"
  | string;

export type SchemaFieldTypeV1 =
  | "text"
  | "number"
  | "decimal"
  | "textarea"
  | "date"
  | "time"
  | "datetime"
  | "dropdown"
  | "radio"
  | "file"
  | "formula"
  | "autoIncrement"
  | "dynamic"
  | "static"
  | string;

export type SchemaSpacingToken = "xs" | "sm" | "md" | "lg" | "xl" | string;

export type SchemaNodeStyle = {
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
  colSpan?: { xs?: number; sm?: number; md?: number; lg?: number };
  rowSpan?: number;
  flex?: string;
  sx?: Record<string, unknown>;
};

export type SchemaAccordionConfig = {
  defaultExpanded?: boolean;
  allowMultipleExpanded?: boolean;
  expandIcon?: string;
  collapseIcon?: string;
};

export type SchemaNodeLayout = {
  type?: "flat" | "tabs" | "accordion" | "wizard" | string;
  direction?: "row" | "column";
  gap?: SchemaSpacingToken;
  wrap?: boolean;
  alignItems?: string;
  justifyContent?: string;
  columns?: number;
  order?: number;
  sticky?: boolean;
  sectionVariant?: string;
  /** Default corner radius token for all section cards; overridden by node `style.borderRadius`. */
  sectionBorderRadius?: SchemaSpacingToken;
  accordionConfig?: SchemaAccordionConfig;
};

export type SchemaRepeatBehavior = {
  enabled?: boolean;
  mode?: "cycle" | "row" | "group" | "mix";
  min?: number;
  max?: number;
  defaultCount?: number | string;
  allowAdd?: boolean;
  allowDelete?: boolean;
  labelPattern?: string;
  addLabel?: string;
  deleteLabel?: string;
};

export type SchemaTableBehavior = {
  defaultRows?: number;
  minRows?: number;
  maxRows?: number;
  allowAddRow?: boolean;
  allowDeleteRow?: boolean;
  allowAddColumn?: boolean;
  allowDeleteColumn?: boolean;
  autoIncrementKey?: string;
  presetRows?: Record<string, unknown>[];
};

export type SchemaNodeBehavior = {
  repeat?: SchemaRepeatBehavior;
  table?: SchemaTableBehavior;
  readonly?: boolean;
  formula?: {
    expression?: string;
    dependencies?: string[];
  };
};

export type SchemaNodeValidation = {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
};

export type SchemaVisibilityConditionV1 = {
  field: string;
  op?: string;
  condition?: string;
  value?: unknown;
};

export type SchemaNodeVisibility = {
  when?: SchemaVisibilityConditionV1[];
  logic?: "AND" | "OR";
};

export type SchemaDataSourceV1 = {
  type?: "static" | "api" | string;
  options?: SchemaFieldOption[];
  api?: {
    endpoint?: string;
    method?: string;
    requestBody?: Record<string, unknown>;
    responsePath?: string;
    displayKey?: string;
    valueKey?: string;
  };
};

export type SchemaNode = {
  id: string;
  component: SchemaComponentType;
  fieldType?: SchemaFieldTypeV1;
  label?: string;
  unit?: string;
  required?: boolean;
  defaultValue?: unknown;
  defaultValues?: unknown[];
  groupKey?: string;
  group?: string;
  style?: SchemaNodeStyle;
  layout?: SchemaNodeLayout;
  behavior?: SchemaNodeBehavior;
  validation?: SchemaNodeValidation;
  visibility?: SchemaNodeVisibility;
  visibleWhen?: SchemaVisibilityRule;
  dataSource?: SchemaDataSourceV1 | SchemaFieldDataSource | string;
  children?: SchemaNode[];
};

export type SchemaDesignSystemColors = {
  primary?: string;
  primaryLight?: string;
  surface?: string;
  border?: string;
  text?: string;
  textSub?: string;
  danger?: string;
  success?: string;
  warn?: string;
  accent?: string;
};

export type SchemaDesignSystem = {
  colors?: SchemaDesignSystemColors;
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

export type SchemaMeta = {
  title?: string;
  description?: string;
};

export type SchemaContext = Record<string, unknown>;

export type SchemaDataPayload = {
  layout?: SchemaNodeLayout;
  designSystem?: SchemaDesignSystem;
  meta?: SchemaMeta;
  context?: SchemaContext;
  nodes?: SchemaNode[];
};

export type SchemaEnvelopeV1 = {
  schemaVersion?: string;
  schemaType?: string;
  functionality?: string;
  data?: SchemaDataPayload;
};
