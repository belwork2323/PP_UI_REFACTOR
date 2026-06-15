import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import type { SchemaApiContext, SchemaDocument, SchemaFormValues, SchemaThemeTokens } from "../models/schema.types";
import { mergeSchemaTheme } from "../utils/schemaStyle";
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
  setupContext?: import("../utils/schemaSetupContext").SchemaSetupContext;
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
  setupContext,
}: SchemaUIProps) => {
  const theme = mergeSchemaTheme(resolveTheme(themeTokens), schema?.designSystem, themeTokens);

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
        Schema is not loaded yet.
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
      setupContext={setupContext}
    />
  );
};

export default SchemaUI;
