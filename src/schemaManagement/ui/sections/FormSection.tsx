import { Stack } from "@mui/material";
import type { SchemaApiContext, SchemaFormValues, SchemaSection, SchemaThemeTokens } from "../../models/schema.types";
import {
  buildFlatVisibilityContext,
  isSchemaFieldVisible,
  pruneHiddenFieldValues,
} from "../../utils/schemaVisibility";
import FieldRenderer from "../fields/FieldRenderer";

type FormSectionProps = {
  section: SchemaSection;
  row: Record<string, unknown>;
  allValues: SchemaFormValues;
  onRowChange: (row: Record<string, unknown>) => void;
  readOnly?: boolean;
  theme: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
};

const FormSection = ({
  section,
  row,
  allValues,
  onRowChange,
  readOnly = false,
  theme,
  apiContext,
}: FormSectionProps) => {
  const visibilityContext = buildFlatVisibilityContext(allValues, row);

  const updateField = (key: string, value: string) => {
    const nextRow = pruneHiddenFieldValues(
      section.fields ?? [],
      { ...(row ?? {}), [key]: value },
      buildFlatVisibilityContext(allValues, { ...(row ?? {}), [key]: value })
    );
    onRowChange(nextRow);
  };

  return (
    <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} flexWrap="wrap">
      {section.fields?.map((field) =>
        isSchemaFieldVisible(field, visibilityContext) ? (
          <FieldRenderer
            key={field.key}
            field={field}
            value={row[field.key]}
            readOnly={readOnly}
            theme={theme}
            apiContext={apiContext}
            onChange={(value) => updateField(field.key, value)}
          />
        ) : null
      )}
    </Stack>
  );
};

export default FormSection;
