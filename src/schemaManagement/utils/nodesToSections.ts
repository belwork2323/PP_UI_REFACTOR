import type {
  SchemaColumn,
  SchemaField,
  SchemaFieldDataSource,
  SchemaGroupedColumn,
  SchemaSection,
  SchemaTableColumnSlot,
  SchemaVisibilityRule,
} from "../models/schema.types";
import type {
  SchemaDataSourceV1,
  SchemaNode,
  SchemaNodeVisibility,
  SchemaVisibilityConditionV1,
} from "../models/schema.v1.types";

type AccordionGroupContext = {
  id: string;
  label: string;
  style?: SchemaNode["style"];
};

const annotateAccordionGroup = (
  sections: SchemaSection[],
  group?: AccordionGroupContext,
): SchemaSection[] =>
  group
    ? sections.map((section) => ({
        ...section,
        accordionGroupId: group.id,
        accordionGroupLabel: group.label,
        accordionGroupStyle: group.style,
      }))
    : sections;

const isV1Node = (item: unknown): item is SchemaNode =>
  Boolean(item && typeof item === "object" && "component" in (item as object) && "id" in (item as object));

export const isV1NodeTree = (nodes: unknown): nodes is SchemaNode[] =>
  Array.isArray(nodes) && nodes.length > 0 && nodes.every(isV1Node);

const mapVisibility = (visibility?: SchemaNodeVisibility): SchemaVisibilityRule | undefined => {
  if (!visibility?.when?.length) return undefined;
  const rules = visibility.when.map((rule: SchemaVisibilityConditionV1) => ({
    field: rule.field,
    condition: rule.op ?? rule.condition ?? "EQ",
    value: rule.value,
  }));
  return rules;
};

const resolveVisibility = (node: SchemaNode): SchemaVisibilityRule | undefined =>
  node.visibleWhen ?? mapVisibility(node.visibility);

const mapColumnKey = (id: string, fieldType?: string) => {
  const normalized = String(id ?? "").trim();
  const type = String(fieldType ?? "").toLowerCase();
  if (type === "autoincrement" || normalized === "SR_NO") return "srNo";
  return normalized;
};

const mapDataSourceToField = (
  dataSource: SchemaNode["dataSource"],
): Pick<SchemaField, "dataSource" | "options" | "displayKey" | "valueKey"> => {
  if (!dataSource) return {};
  if (typeof dataSource === "string") {
    return { dataSource: { type: "api", api: dataSource, method: "GET" } };
  }
  const v1 = dataSource as SchemaDataSourceV1;
  if (v1.type === "static" && Array.isArray(v1.options)) {
    return { options: v1.options };
  }
  const v1Api = v1.api;
  if (v1.type === "api" && v1Api != null && typeof v1Api === "object") {
    return {
      dataSource: {
        type: "api",
        api: String(v1Api.endpoint ?? ""),
        method: String(v1Api.method ?? "POST"),
        requestBody: v1Api.requestBody,
        responsePath: v1Api.responsePath,
      },
      displayKey: v1Api.displayKey,
      valueKey: v1Api.valueKey,
    };
  }
  const legacy = dataSource as SchemaFieldDataSource;
  if (legacy.type === "api" || legacy.api) {
    return { dataSource: legacy };
  }
  return {};
};

const nodeToField = (node: SchemaNode): SchemaField => {
  const fieldType = String(node.fieldType ?? "text").toLowerCase();
  const ds = mapDataSourceToField(node.dataSource);
  return {
    key: mapColumnKey(node.id, fieldType),
    label: String(node.label ?? node.id),
    type: fieldType === "autoincrement" ? "number" : fieldType,
    unit: node.unit,
    required: Boolean(node.required ?? node.validation?.required),
    readonly:
      Boolean(node.behavior?.readonly) ||
      fieldType === "autoincrement" ||
      fieldType === "formula" ||
      fieldType === "static",
    defaultValue: node.defaultValue,
    defaultValues: Array.isArray(node.defaultValues) ? node.defaultValues : undefined,
    visibleWhen: resolveVisibility(node),
    group: node.group,
    formula: node.behavior?.formula,
    ...ds,
  };
};

const deriveColumnsFromLayout = (columnLayout: SchemaTableColumnSlot[]) => {
  const columns: SchemaColumn[] = [];
  const groupedColumns: SchemaGroupedColumn[] = [];

  columnLayout.forEach((slot) => {
    if (slot.kind === "column") {
      columns.push(slot.column);
      return;
    }
    groupedColumns.push(slot.group);
  });

  return { columns, groupedColumns };
};

const flattenColumns = (children: SchemaNode[] = []): {
  columns: SchemaColumn[];
  groupedColumns: SchemaGroupedColumn[];
  columnLayout: SchemaTableColumnSlot[];
} => {
  const columnLayout: SchemaTableColumnSlot[] = [];

  children.forEach((child) => {
    if (child.component === "columnGroup") {
      columnLayout.push({
        kind: "group",
        group: {
          groupLabel: child.label,
          columns: (child.children ?? []).map((col) => nodeToColumn(col)),
        },
      });
      return;
    }
    if (child.component === "column") {
      columnLayout.push({
        kind: "column",
        column: nodeToColumn(child),
      });
    }
  });

  const { columns, groupedColumns } = deriveColumnsFromLayout(columnLayout);
  return { columns, groupedColumns, columnLayout };
};

const nodeToColumn = (node: SchemaNode): SchemaColumn => {
  const fieldType = String(node.fieldType ?? "text").toLowerCase();
  const ds = mapDataSourceToField(node.dataSource);
  return {
    key: mapColumnKey(node.id, fieldType),
    label: String(node.label ?? node.id),
    type: fieldType === "autoincrement" ? "number" : fieldType,
    unit: node.unit,
    readonly:
      Boolean(node.behavior?.readonly) ||
      fieldType === "autoincrement" ||
      fieldType === "formula" ||
      fieldType === "static",
    defaultValue: node.defaultValue,
    defaultValues: Array.isArray(node.defaultValues) ? node.defaultValues : undefined,
    width: node.style?.width,
    formula: node.behavior?.formula,
    options: ds.options,
    dataSource: ds.dataSource,
    displayKey: ds.displayKey,
    valueKey: ds.valueKey,
  };
};

const nodeToTableSection = (node: SchemaNode, titleOverride?: string): SchemaSection => {
  const { columns, groupedColumns, columnLayout } = flattenColumns(node.children);
  const tableBehavior = node.behavior?.table;
  const defaultRows = tableBehavior?.presetRows?.length
    ? tableBehavior.presetRows.map((row) => ({ ...row }))
    : tableBehavior?.defaultRows
      ? Array.from({ length: tableBehavior.defaultRows }, (_, index) => ({ srNo: index + 1 }))
      : undefined;

  return {
    sectionId: node.id,
    title: String(titleOverride ?? node.label ?? node.id),
    type: groupedColumns.length > 0 ? "complex-table" : "table",
    columns,
    groupedColumns: groupedColumns.length > 0 ? groupedColumns : undefined,
    columnLayout: columnLayout.length > 0 ? columnLayout : undefined,
    defaultRows,
    addRowAllowed: tableBehavior?.allowAddRow !== false,
    visibleWhen: resolveVisibility(node),
    style: node.style,
    layout: node.layout,
  };
};

const nodeToRepeatableSection = (
  node: SchemaNode,
  titleOverride?: string,
  sectionStyle?: SchemaNode["style"],
): SchemaSection | null => {
  const tableChild = (node.children ?? []).find((child) => child.component === "table");
  if (!tableChild) return null;

  const { columns, groupedColumns, columnLayout } = flattenColumns(tableChild.children);
  const flatColumns = columnLayout.flatMap((slot) =>
    slot.kind === "column" ? [slot.column] : slot.group.columns ?? [],
  );

  const repeat = node.behavior?.repeat;
  const tableBehavior = tableChild.behavior?.table ?? node.behavior?.table;

  return {
    sectionId: node.id,
    title: String(titleOverride ?? node.label ?? node.id),
    type: "repeatable-table",
    columns: flatColumns,
    groupedColumns: groupedColumns.length > 0 ? groupedColumns : undefined,
    columnLayout: columnLayout.length > 0 ? columnLayout : undefined,
    defaultRowCount: Number(tableBehavior?.defaultRows ?? 1) || 1,
    addRowAllowed: tableBehavior?.allowAddRow !== false,
    repeatConfig: {
      labelPattern: String(repeat?.labelPattern ?? "Cycle {index}"),
      allowAdd: repeat?.allowAdd !== false,
      allowDelete: repeat?.allowDelete !== false,
      defaultCount: repeat?.defaultCount,
      minCycles: repeat?.min,
      maxCycles: repeat?.max,
    },
    visibleWhen: resolveVisibility(node),
    style: sectionStyle ?? node.style,
    layout: node.layout,
  };
};

const nodeToDynamicGroupSection = (node: SchemaNode, titleOverride?: string): SchemaSection => ({
  sectionId: node.id,
  title: String(titleOverride ?? node.label ?? node.id),
  type: "dynamic-group",
  fields: (node.children ?? []).filter((c) => c.component === "field").map(nodeToField),
  addRowAllowed: node.behavior?.repeat?.allowAdd !== false,
  visibleWhen: resolveVisibility(node),
  style: node.style,
  layout: node.layout,
});

const nodeToNestedGroupSection = (node: SchemaNode, titleOverride?: string): SchemaSection => {
  const fields = (node.children ?? []).filter((c) => c.component === "field").map(nodeToField);
  const groupKey = node.groupKey === "drums" ? "drums" : "lots";
  return {
    sectionId: node.id,
    title: String(titleOverride ?? node.label ?? node.id),
    type: "form",
    groupLabel: node.label,
    fields,
    addRowAllowed: node.behavior?.repeat?.allowAdd !== false,
    visibleWhen: resolveVisibility(node),
    style: node.style,
    layout: node.layout,
    ...(groupKey === "drums" ? { drums: { fields } } : { lots: { fields } }),
  };
};

const nodeToFormSection = (node: SchemaNode, titleOverride?: string): SchemaSection => ({
  sectionId: node.id,
  title: String(titleOverride ?? node.label ?? node.id),
  type: "form",
  fields: (node.children ?? []).filter((c) => c.component === "field").map(nodeToField),
  visibleWhen: resolveVisibility(node),
  style: node.style,
  layout: node.layout,
});

const flattenSectionNode = (node: SchemaNode, groupContext?: AccordionGroupContext): SchemaSection[] => {
  const children = node.children ?? [];
  const fieldChildren = children.filter((c) => c.component === "field");
  const repeatableChild = children.find((c) => c.component === "repeatable");
  const tableChild = children.find((c) => c.component === "table");
  const dynamicChild = children.find((c) => c.component === "dynamicGroup");
  const nestedChild = children.find((c) => c.component === "nestedGroup");

  if (repeatableChild) {
    const sections: SchemaSection[] = [];
    const repeatableSection = nodeToRepeatableSection(
      repeatableChild,
      node.label ?? repeatableChild.label,
      node.style,
    );
    if (repeatableSection) sections.push(repeatableSection);
    children.forEach((child) => {
      if (child.component === "repeatable") return;
      sections.push(...nodeToSections(child, groupContext));
    });
    return sections;
  }

  if (tableChild && fieldChildren.length === 0 && children.length === 1) {
    return [nodeToTableSection(tableChild, node.label)];
  }

  if (dynamicChild && children.length === 1) {
    return [nodeToDynamicGroupSection(dynamicChild, node.label)];
  }

  if (nestedChild && children.length === 1) {
    return [nodeToNestedGroupSection(nestedChild, node.label)];
  }

  if (fieldChildren.length > 0 && fieldChildren.length === children.length) {
    return [nodeToFormSection(node)];
  }

  const hasOtherChildTypes = children.some(
    (child) => child.component !== "table" && child.component !== "field",
  );

  if (tableChild && fieldChildren.length > 0 && !hasOtherChildTypes) {
    return [
      {
        ...nodeToFormSection({ ...node, children: fieldChildren }),
        sectionId: `${node.id}__form`,
        title: node.label,
      },
      nodeToTableSection(tableChild, tableChild.label),
    ];
  }

  const sections: SchemaSection[] = [];
  children.forEach((child) => {
    sections.push(...nodeToSections(child, groupContext));
  });

  if (sections.length === 0 && fieldChildren.length > 0) {
    return [nodeToFormSection(node)];
  }

  return sections;
};

export const nodeToSections = (node: SchemaNode, groupContext?: AccordionGroupContext): SchemaSection[] => {
  const component = String(node.component ?? "").toLowerCase();

  if (component === "section") {
    const sectionGroup = {
      id: node.id,
      label: String(node.label ?? node.id),
      style: node.style,
    };
    return annotateAccordionGroup(flattenSectionNode(node, sectionGroup), sectionGroup);
  }

  if (component === "group") {
    return annotateAccordionGroup(flattenSectionNode(node, groupContext), groupContext);
  }

  if (component === "table") {
    return annotateAccordionGroup([nodeToTableSection(node)], groupContext);
  }

  if (component === "repeatable") {
    const section = nodeToRepeatableSection(node);
    return annotateAccordionGroup(section ? [section] : [], groupContext);
  }

  if (component === "dynamicgroup") {
    return annotateAccordionGroup([nodeToDynamicGroupSection(node)], groupContext);
  }

  if (component === "nestedgroup") {
    return annotateAccordionGroup([nodeToNestedGroupSection(node)], groupContext);
  }

  if (component === "field") {
    return annotateAccordionGroup([nodeToFormSection({ ...node, children: [node] })], groupContext);
  }

  return [];
};

export const nodesToSections = (nodes: SchemaNode[]): SchemaSection[] =>
  nodes.flatMap((node) => nodeToSections(node));
