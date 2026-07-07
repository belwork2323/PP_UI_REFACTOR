import { useEffect, useMemo, useRef } from "react";
import { Box } from "@mui/material";
import {
  SchemaUI,
  createTrimmingInitialValues,
  hydrateTrimmingValuesFromSections,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../../../schema-engine";
import { TRIMMING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/trimming_theme";

type TrimmingSchemaPanelProps = {
  schema: SchemaDocumentV2 | null;
  formValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
  subDepartmentId?: number;
  batchId?: string;
  onChange: (values: SchemaFormValues) => void;
  loading?: boolean;
  error?: string | null;
};

const TrimmingSchemaPanel = ({
  schema,
  formValues,
  savedSections,
  subDepartmentId,
  batchId,
  onChange,
  loading = false,
  error = null,
}: TrimmingSchemaPanelProps) => {
  const hydratedRef = useRef(false);

  useEffect(() => {
    hydratedRef.current = false;
  }, [savedSections, schema?.schemaVersion]);

  useEffect(() => {
    if (!schema) return;
    if (hydratedRef.current) return;

    if (savedSections?.length) {
      onChange(hydrateTrimmingValuesFromSections(schema, savedSections));
    } else if (Object.keys(formValues ?? {}).length === 0) {
      onChange(createTrimmingInitialValues(schema));
    }
    hydratedRef.current = true;
  }, [schema, savedSections]);

  const themeTokens = useMemo(
    () => ({
      primary: TRIMMING_BRAND.tr,
      primaryLight: TRIMMING_BRAND.trLight,
      accent: TRIMMING_BRAND.accent,
      text: TRIMMING_BRAND.text,
      textSub: TRIMMING_BRAND.textSub,
      border: TRIMMING_BRAND.border,
      surface: TRIMMING_BRAND.surface,
      warn: TRIMMING_BRAND.warn,
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

export default TrimmingSchemaPanel;
