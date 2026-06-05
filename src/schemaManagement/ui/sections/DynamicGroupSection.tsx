import { Box, Button, Stack } from "@mui/material";
import type { SchemaApiContext, SchemaSection, SchemaThemeTokens } from "../../models/schema.types";
import FieldRenderer from "../fields/FieldRenderer";

type DynamicGroupSectionProps = {
  section: SchemaSection;
  rows: Record<string, unknown>[];
  onRowsChange: (rows: Record<string, unknown>[]) => void;
  readOnly?: boolean;
  theme: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
};

const DynamicGroupSection = ({
  section,
  rows,
  onRowsChange,
  readOnly = false,
  theme,
  apiContext,
}: DynamicGroupSectionProps) => {
  const updateRowField = (rowIdx: number, key: string, value: string) => {
    const next = rows.map((row, idx) =>
      idx === rowIdx ? { ...(row ?? {}), [key]: value } : row
    );
    onRowsChange(next);
  };

  const addRow = () => onRowsChange([...rows, {}]);
  const removeRow = (rowIdx: number) => onRowsChange(rows.filter((_, idx) => idx !== rowIdx));

  const displayRows = rows.length > 0 ? rows : [{}];

  return (
    <>
      {displayRows.map((row, rowIdx) => (
        <Stack
          key={`${section.sectionId}-${rowIdx}`}
          direction={{ xs: "column", sm: "row" }}
          gap={1.5}
          mb={1.25}
          flexWrap="wrap"
          alignItems="flex-end"
        >
          {section.fields?.map((field) => (
            <FieldRenderer
              key={field.key}
              field={field}
              value={(row as Record<string, unknown>)[field.key]}
              readOnly={readOnly}
              theme={theme}
              apiContext={apiContext}
              onChange={(value) => updateRowField(rowIdx, field.key, value)}
            />
          ))}
          {section.addRowAllowed && !readOnly && displayRows.length > 1 && (
            <Button size="small" color="error" onClick={() => removeRow(rowIdx)}>
              Remove
            </Button>
          )}
        </Stack>
      ))}
      {section.addRowAllowed && !readOnly && (
        <Button size="small" variant="outlined" onClick={addRow}>
          Add Row
        </Button>
      )}
    </>
  );
};

export default DynamicGroupSection;
