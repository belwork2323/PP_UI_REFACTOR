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
  /**
   * Values stay editable; hide/disable Add Row, REMOVE, repeat Add, and column add/delete.
   * Use for shared schemas (e.g. RAW_MATERIALS) where QC may edit values but not structure.
   */
  lockStructure?: boolean;
  loading?: boolean;
  error?: string | null;
  themeTokens?: Partial<SchemaThemeTokens>;
  apiContext?: SchemaApiContext;
  setupContext?: SchemaSetupContext;
  batch?: { batchId?: string; projectName?: string; projectId?: string };
  motorId?: string;
  hideRepeatInstanceLabels?: boolean;
  /** Field path → message; shown in red under schema fields (no toast). */
  errors?: Record<string, string>;
};

const SchemaUI = ({
  schema,
  value,
  onChange,
  readOnly = false,
  lockStructure = false,
  loading = false,
  error = null,
  themeTokens,
  apiContext,
  setupContext,
  batch,
  motorId,
  hideRepeatInstanceLabels,
  errors,
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
      lockStructure={lockStructure}
      theme={theme}
      apiContext={apiContext}
      setupContext={setupContext}
      batch={batch}
      motorId={motorId}
      hideRepeatInstanceLabels={hideRepeatInstanceLabels}
      errors={errors}
    />
  );
};

export default SchemaUI;
