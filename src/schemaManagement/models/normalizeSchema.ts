import type { SchemaDocument, SchemaField, SchemaSection } from "./schema.types";

const normalizeSetParameter = (value: unknown): unknown => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (typeof obj.displayValue === "string") return obj.displayValue;
    const parts: string[] = [];
    Object.entries(obj).forEach(([key, nested]) => {
      if (!nested || typeof nested !== "object") return;
      const n = nested as Record<string, unknown>;
      const val = n.value;
      const unit = n.unit ?? "";
      const tolerance = n.tolerance ? String(n.tolerance) : "";
      if (val !== undefined) {
        parts.push(`${key}: ${val}${tolerance}${unit}`);
      }
    });
    return parts.join("\n") || value;
  }
  return value;
};

const normalizeDefaultRow = (row: Record<string, unknown>) => {
  const next: Record<string, unknown> = { ...row };
  if (next.setParameter !== undefined) {
    next.setParameter = normalizeSetParameter(next.setParameter);
  }
  if (next.setParameter !== undefined && next.displayValue === undefined) {
    const sp = next.setParameter;
    if (typeof sp === "string") {
      next.displayValue = sp;
    }
  }
  return next;
};

const normalizeField = (field: SchemaField): SchemaField => {
  if (field.type === "table" && field.defaultRows) {
    return {
      ...field,
      defaultRows: field.defaultRows.map((row) => normalizeDefaultRow(row as Record<string, unknown>)),
    };
  }
  return field;
};

const normalizeSection = (section: SchemaSection): SchemaSection => {
  return {
    ...section,
    type: section.type === "complex-table" ? "complex-table" : section.type,
    columns: section.columns ?? [],
    groupedColumns: section.groupedColumns,
    defaultRows: section.defaultRows?.map((row) => normalizeDefaultRow(row as Record<string, unknown>)),
    fields: section.fields?.map(normalizeField),
    lots: section.lots
      ? { fields: section.lots.fields?.map(normalizeField) ?? [] }
      : undefined,
    drums: section.drums
      ? { fields: section.drums.fields?.map(normalizeField) ?? [] }
      : undefined,
  };
};

const resolveSchemaSections = (outer: Record<string, unknown>, inner: Record<string, unknown>) => {
  if (Array.isArray(outer.sections)) return outer.sections as SchemaSection[];
  if (Array.isArray(inner.sections)) return inner.sections as SchemaSection[];
  return [];
};

export const normalizeSchemaDocument = (payload: unknown): SchemaDocument | null => {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const outerData = (root.data ?? root) as Record<string, unknown>;
  const innerData = (outerData.data ?? outerData) as Record<string, unknown>;
  const details = (outerData.rawMaterialDetails ??
    innerData.rawMaterialDetails) as SchemaDocument["rawMaterialDetails"] | undefined;
  const sections = resolveSchemaSections(outerData, innerData);
  const schemaType = String(
    root.schemaType ?? outerData.schemaType ?? innerData.schemaType ?? "RAW_MATERIALS"
  );
  const isMockTrial = schemaType === "MOCK_TRIAL";
  const formDetails = (outerData.formDetails ?? innerData.formDetails) as
    | { title?: string; description?: string }
    | undefined;

  if (sections.length === 0) return null;
  if (!isMockTrial && !details?.materialCode) return null;

  const grade = details?.grade
    ? {
        gradeId: Number((details.grade as SchemaDocument["rawMaterialDetails"]["grade"])?.gradeId ?? 0),
        gradeCode: String((details.grade as { gradeCode?: string })?.gradeCode ?? "").trim(),
        gradeName: String((details.grade as { gradeName?: string })?.gradeName ?? "").trim(),
      }
    : null;

  const rawMaterialDetails: SchemaDocument["rawMaterialDetails"] = isMockTrial
    ? {
        materialId: 0,
        materialCode: "MOCK_TRIAL",
        materialName: String(formDetails?.title ?? "Mock Trial").trim(),
        materialType: "MOCK_TRIAL",
        grade: null,
      }
    : {
        materialId: Number(details!.materialId ?? 0),
        materialCode: String(details!.materialCode ?? "").trim(),
        materialName: String(details!.materialName ?? "").trim(),
        materialType: String(details!.materialType ?? "").trim(),
        grade,
      };

  return {
    schemaVersion: String(root.schemaVersion ?? outerData.schemaVersion ?? innerData.schemaVersion ?? "1.0"),
    schemaType,
    functionality: String(root.functionality ?? outerData.functionality ?? innerData.functionality ?? ""),
    layout:
      (innerData.layout as { type: string }) ??
      (outerData.layout as { type: string }) ??
      { type: "flat" },
    formDetails: formDetails
      ? {
          title: String(formDetails.title ?? "").trim() || undefined,
          description: String(formDetails.description ?? "").trim() || undefined,
        }
      : undefined,
    rawMaterialDetails,
    sections: sections.map(normalizeSection),
  };
};
