import { useEffect, useMemo, useRef } from "react";
import { Box } from "@mui/material";
import {
  SchemaUI,
  createStfInitialValues,
  hydrateStfValuesFromSections,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../../../schema-engine";
import { STATIC_TEST_FACILITY_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";

type STFSchemaPanelProps = {
  schema: SchemaDocumentV2 | null;
  formValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
  subDepartmentId?: number;
  batchId?: string;
  onChange: (values: SchemaFormValues) => void;
  loading?: boolean;
  error?: string | null;
};

const STFSchemaPanel = ({
  schema,
  formValues,
  savedSections,
  subDepartmentId,
  batchId,
  onChange,
  loading = false,
  error = null,
}: STFSchemaPanelProps) => {
  const hydratedRef = useRef(false);

  useEffect(() => {
    hydratedRef.current = false;
  }, [savedSections, schema?.schemaVersion, schema?.data?.context]);

  useEffect(() => {
    if (!schema) return;
    if (hydratedRef.current) return;

    if (savedSections?.length) {
      onChange(hydrateStfValuesFromSections(schema, savedSections));
    } else if (Object.keys(formValues ?? {}).length === 0) {
      onChange(createStfInitialValues(schema));
    }
    hydratedRef.current = true;
  }, [schema, savedSections]);

  const themeTokens = useMemo(
    () => ({
      primary: STATIC_TEST_FACILITY_BRAND.primary,
      primaryLight: STATIC_TEST_FACILITY_BRAND.primaryLight,
      accent: STATIC_TEST_FACILITY_BRAND.accent,
      text: STATIC_TEST_FACILITY_BRAND.text,
      textSub: STATIC_TEST_FACILITY_BRAND.textSub,
      border: STATIC_TEST_FACILITY_BRAND.border,
      surface: STATIC_TEST_FACILITY_BRAND.surface,
      warn: STATIC_TEST_FACILITY_BRAND.warn,
    }),
    [],
  );

  return (
    <Box>
      <SchemaUI
        schema={schema}
        value={formValues}
        onChange={onChange}
        loading={loading}
        error={error}
        themeTokens={themeTokens}
        apiContext={{ subDepartmentId, batchId }}
      />
    </Box>
  );
};

export default STFSchemaPanel;
