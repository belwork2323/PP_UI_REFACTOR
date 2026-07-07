import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import type { SchemaDocumentV2 } from "./types";
import type { SchemaFormValues } from "./state/formState";
import type { SchemaApiContext } from "./rules/apiDependency";
import {
  isSchemaDocumentReady,
  SCHEMA_NOT_LOADED_MESSAGE,
} from "./utils/schemaMessages";
import type { SchemaThemeTokens } from "./utils/schemaUtils";
import { defaultThemeTokens, mergeThemeFromDesignSystem } from "./utils/schemaUtils";
import type { SchemaSetupContext } from "./utils/setupContext";
import SchemaRenderer from "./SchemaRenderer";

export type SchemaUIProps = {
  schema: SchemaDocumentV2 | null;
  value: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  loading?: boolean;
  error?: string | null;
  themeTokens?: Partial<SchemaThemeTokens>;
  apiContext?: SchemaApiContext;
  setupContext?: SchemaSetupContext;
  batch?: { batchId?: string; projectName?: string; projectId?: string };
  motorId?: string;
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
  batch,
  motorId,
}: SchemaUIProps) => {
  const theme = mergeThemeFromDesignSystem(
    { ...defaultThemeTokens, ...themeTokens },
    schema?.data?.ui?.designSystem,
  );

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

  if (!isSchemaDocumentReady(schema)) {
    return (
      <Typography sx={{ fontSize: "0.8rem", color: theme.textSub }}>
        {SCHEMA_NOT_LOADED_MESSAGE}
      </Typography>
    );
  }

  return (
    <SchemaRenderer
      schema={schema}
      values={value}
      onChange={onChange}
      readOnly={readOnly}
      theme={theme}
      apiContext={apiContext}
      setupContext={setupContext}
      batch={batch}
      motorId={motorId}
    />
  );
};

export default SchemaUI;
