import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import type { SchemaApiContext, SchemaDocument, SchemaFormValues, SchemaThemeTokens } from "../models/schema.types";
import SchemaFormRenderer from "./SchemaFormRenderer";
import { resolveTheme } from "./theme";

export type SchemaUIProps = {
  schema: SchemaDocument | null;
  value: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  loading?: boolean;
  error?: string | null;
  themeTokens?: Partial<SchemaThemeTokens>;
  apiContext?: SchemaApiContext;
};

const SchemaUI = ({
  schema,
  value,
  onChange,
  readOnly = false,
  loading = false,
  error = null,
  themeTokens,
  apiContext,
}: SchemaUIProps) => {
  const theme = resolveTheme(themeTokens);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!schema) {
    return (
      <Typography sx={{ fontSize: "0.8rem", color: theme.textSub }}>
        Select a material to load the preparation form schema.
      </Typography>
    );
  }

  return (
    <SchemaFormRenderer
      schema={schema}
      values={value}
      onChange={onChange}
      readOnly={readOnly}
      theme={theme}
      apiContext={apiContext}
    />
  );
};

export default SchemaUI;
