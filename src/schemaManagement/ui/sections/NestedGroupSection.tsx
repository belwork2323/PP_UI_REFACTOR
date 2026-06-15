import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import type {
  SchemaApiContext,
  SchemaField,
  SchemaFormValues,
  SchemaSection,
  SchemaThemeTokens,
} from "../../models/schema.types";
import { buildNestedFieldDefaults } from "../../models/schemaFormState";
import {
  buildFlatVisibilityContext,
  isSchemaFieldVisible,
  pruneHiddenFieldValues,
} from "../../utils/schemaVisibility";
import FieldRenderer from "../fields/FieldRenderer";
import NestedTableField from "../fields/NestedTableField";

const getNestedFields = (section: SchemaSection): SchemaField[] | null => {
  if (section.lots?.fields?.length) return section.lots.fields;
  if (section.drums?.fields?.length) return section.drums.fields;
  return null;
};

type NestedGroupSectionProps = {
  section: SchemaSection;
  rows: Record<string, unknown>[];
  allValues: SchemaFormValues;
  onRowsChange: (rows: Record<string, unknown>[]) => void;
  readOnly?: boolean;
  theme: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
};

const NestedGroupSection = ({
  section,
  rows,
  allValues,
  onRowsChange,
  readOnly = false,
  theme,
  apiContext,
}: NestedGroupSectionProps) => {
  const nestedFields = getNestedFields(section);
  if (!nestedFields) return null;

  const groupLabel = section.groupLabel ?? "Group";
  const displayRows = rows.length > 0 ? rows : [buildNestedFieldDefaults(nestedFields)];

  const updateRow = (rowIdx: number, key: string, value: unknown) => {
    onRowsChange(
      displayRows.map((row, idx) => {
        if (idx !== rowIdx) return row;
        const updated = { ...(row ?? {}), [key]: value };
        return pruneHiddenFieldValues(
          nestedFields,
          updated,
          buildFlatVisibilityContext(allValues, updated)
        );
      })
    );
  };

  const addGroup = () => {
    onRowsChange([...displayRows, buildNestedFieldDefaults(nestedFields)]);
  };

  const removeGroup = (rowIdx: number) => {
    onRowsChange(displayRows.filter((_, idx) => idx !== rowIdx));
  };

  const groupedFields = nestedFields.reduce<Record<string, SchemaField[]>>((acc, field) => {
    const groupKey = field.group ?? "";
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(field);
    return acc;
  }, {});

  const renderField = (
    rowIdx: number,
    field: SchemaField,
    row: Record<string, unknown>,
    visibilityContext: Record<string, unknown>
  ) => {
    if (!isSchemaFieldVisible(field, visibilityContext)) {
      return null;
    }

    if (field.type === "table") {
      const tableRows = Array.isArray(row[field.key])
        ? (row[field.key] as Record<string, unknown>[])
        : [];
      return (
        <NestedTableField
          key={field.key}
          field={field}
          rows={tableRows}
          readOnly={readOnly}
          theme={theme}
          onChange={(nextRows) => updateRow(rowIdx, field.key, nextRows)}
        />
      );
    }

    return (
      <FieldRenderer
        key={field.key}
        field={field}
        value={row[field.key]}
        readOnly={readOnly}
        theme={theme}
        apiContext={apiContext}
        onChange={(value) => updateRow(rowIdx, field.key, value)}
      />
    );
  };

  return (
    <Stack spacing={2}>
      {displayRows.map((row, rowIdx) => {
        const visibilityContext = buildFlatVisibilityContext(allValues, row as Record<string, unknown>);

        return (
        <Box
          key={`${section.sectionId}-group-${rowIdx}`}
          sx={{ border: `1px dashed ${theme.border}`, borderRadius: 2, p: 1.5 }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.82rem" }}>
              {groupLabel} {rowIdx + 1}
            </Typography>
            {Boolean(section.addRowAllowed) && !readOnly && displayRows.length > 1 && (
              <Button size="small" color="error" onClick={() => removeGroup(rowIdx)}>
                Remove
              </Button>
            )}
          </Stack>

          {Object.entries(groupedFields).map(([groupName, fields]) => (
            <Box key={`${section.sectionId}-${rowIdx}-${groupName || "default"}`} mb={1.5}>
              {groupName ? (
                <>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: theme.textSub, mb: 0.8 }}>
                    {groupName}
                  </Typography>
                  <Divider sx={{ mb: 1 }} />
                </>
              ) : null}
              <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} flexWrap="wrap">
                {fields
                  .filter((f) => f.type !== "table")
                  .map((field) => renderField(rowIdx, field, row as Record<string, unknown>, visibilityContext))}
              </Stack>
              {fields
                .filter((f) => f.type === "table")
                .map((field) => renderField(rowIdx, field, row as Record<string, unknown>, visibilityContext))}
            </Box>
          ))}
        </Box>
        );
      })}
      {Boolean(section.addRowAllowed) && !readOnly && (
        <Button size="small" variant="outlined" onClick={addGroup}>
          Add {groupLabel}
        </Button>
      )}
    </Stack>
  );
};

export default NestedGroupSection;
