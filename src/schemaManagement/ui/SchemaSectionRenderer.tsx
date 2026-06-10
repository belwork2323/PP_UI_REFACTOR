import type { SchemaApiContext, SchemaFormValues, SchemaSection, SchemaThemeTokens } from "../models/schema.types";
import { normalizeCasePrepSection } from "../utils/casePreparationSchema";
import DynamicGroupSection from "./sections/DynamicGroupSection";
import FormSection from "./sections/FormSection";
import GroupSection from "./sections/GroupSection";
import NestedGroupSection from "./sections/NestedGroupSection";
import TableSection from "./sections/TableSection";
import { Box, Typography } from "@mui/material";

type SchemaSectionRendererProps = {
  section: SchemaSection;
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  theme: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
  showTitle?: boolean;
};

const hasNestedGroup = (section: SchemaSection) =>
  Boolean(section.lots?.fields?.length || section.drums?.fields?.length);

const resolveRenderableSection = (section: SchemaSection): SchemaSection => {
  const normalized = normalizeCasePrepSection(section);

  if (normalized.table && normalized.groupType === "table" && normalized.type === "group") {
    return {
      ...normalized,
      type: "table",
      columns: normalized.table.columns ?? normalized.columns,
      defaultRows: normalized.table.defaultRows ?? normalized.defaultRows,
      addRowAllowed: normalized.table.addRowAllowed ?? normalized.addRowAllowed,
    };
  }

  if (normalized.fields?.length && (normalized.table || normalized.columns?.length) && normalized.type === "group") {
    return {
      ...normalized,
      type: "table",
      columns: normalized.table?.columns ?? normalized.columns,
      defaultRows: normalized.table?.defaultRows ?? normalized.defaultRows,
      addRowAllowed: normalized.table?.addRowAllowed ?? normalized.addRowAllowed,
      fields: normalized.fields,
    };
  }

  return normalized;
};

const SchemaSectionRenderer = ({
  section,
  values,
  onChange,
  readOnly = false,
  theme,
  apiContext,
  showTitle = true,
}: SchemaSectionRendererProps) => {
  const resolved = resolveRenderableSection(section);
  const sectionRows = (values[resolved.sectionId] ?? []) as Record<string, unknown>[];
  const isNested = hasNestedGroup(resolved);
  const isGroup = resolved.type === "group" && Boolean(resolved.sections?.length);
  const isForm = resolved.type === "form" || Boolean(resolved.fields?.length && !resolved.columns?.length);
  const isTable = resolved.type === "table" || resolved.type === "complex-table" || Boolean(resolved.columns?.length);
  const isDynamicGroup = resolved.type === "dynamic-group" && !isNested;

  const updateSectionRows = (sectionId: string, rows: Record<string, unknown>[]) => {
    onChange({ ...values, [sectionId]: rows });
  };

  const updateFormSection = (sectionId: string, row: Record<string, unknown>) => {
    onChange({ ...values, [sectionId]: [row] });
  };

  const formSectionId =
    resolved.fields?.length && resolved.columns?.length
      ? `${resolved.sectionId}__form`
      : resolved.sectionId;

  return (
    <Box>
      {showTitle && resolved.title ? (
        <Typography sx={{ fontWeight: 700, fontSize: "0.86rem", mb: 1.2 }}>{resolved.title}</Typography>
      ) : null}

      {isGroup && (
        <GroupSection
          section={resolved}
          values={values}
          onChange={onChange}
          readOnly={readOnly}
          theme={theme}
          apiContext={apiContext}
        />
      )}

      {resolved.fields?.length && resolved.columns?.length && (
        <Box sx={{ mb: 1.5 }}>
          <FormSection
            section={toFormLeaf(resolved, formSectionId)}
            row={(values[formSectionId]?.[0] ?? {}) as Record<string, unknown>}
            onRowChange={(row) => updateFormSection(formSectionId, row)}
            readOnly={readOnly}
            theme={theme}
            apiContext={apiContext}
          />
        </Box>
      )}

      {isNested && (
        <NestedGroupSection
          section={resolved}
          rows={sectionRows}
          onRowsChange={(rows) => updateSectionRows(resolved.sectionId, rows)}
          readOnly={readOnly}
          theme={theme}
          apiContext={apiContext}
        />
      )}

      {isForm && !isGroup && !(resolved.fields?.length && resolved.columns?.length) && (
        <FormSection
          section={toFormLeaf(resolved, resolved.sectionId)}
          row={(sectionRows[0] ?? {}) as Record<string, unknown>}
          onRowChange={(row) => updateFormSection(resolved.sectionId, row)}
          readOnly={readOnly}
          theme={theme}
          apiContext={apiContext}
        />
      )}

      {isDynamicGroup && (
        <DynamicGroupSection
          section={resolved}
          rows={sectionRows}
          onRowsChange={(rows) => updateSectionRows(resolved.sectionId, rows)}
          readOnly={readOnly}
          theme={theme}
          apiContext={apiContext}
        />
      )}

      {isTable && !isGroup && (
        <TableSection
          section={toTableLeaf(resolved)}
          rows={sectionRows}
          onRowsChange={(rows) => updateSectionRows(resolved.sectionId, rows)}
          readOnly={readOnly}
          theme={theme}
        />
      )}
    </Box>
  );
};

const toFormLeaf = (section: SchemaSection, sectionId: string): SchemaSection => ({
  ...section,
  sectionId,
  type: "form",
  columns: undefined,
  defaultRows: undefined,
  sections: undefined,
  table: undefined,
});

const toTableLeaf = (section: SchemaSection): SchemaSection => ({
  ...section,
  type: "table",
  sections: undefined,
  table: undefined,
});

export default SchemaSectionRenderer;
