import { Stack } from "@mui/material";
import type { SchemaApiContext, SchemaSection, SchemaThemeTokens } from "../../models/schema.types";
import FieldRenderer from "../fields/FieldRenderer";

type FormSectionProps = {
  section: SchemaSection;
  row: Record<string, unknown>;
  onRowChange: (row: Record<string, unknown>) => void;
  readOnly?: boolean;
  theme: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
};

const FormSection = ({
  section,
  row,
  onRowChange,
  readOnly = false,
  theme,
  apiContext,
}: FormSectionProps) => {
  const updateField = (key: string, value: string) => {
    onRowChange({ ...(row ?? {}), [key]: value });
  };

  return (
    <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} flexWrap="wrap">
      {section.fields?.map((field) => (
        <FieldRenderer
          key={field.key}
          field={field}
          value={row[field.key]}
          readOnly={readOnly}
          theme={theme}
          apiContext={apiContext}
          onChange={(value) => updateField(field.key, value)}
        />
      ))}
    </Stack>
  );
};

export default FormSection;
