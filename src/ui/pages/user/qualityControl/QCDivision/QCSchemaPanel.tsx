import { useEffect, useMemo, useRef } from "react";
import { Box } from "@mui/material";
import {
  SchemaUI,
  createQcInitialValues,
  hydrateQcValuesFromSections,
  schemaValuesHaveUserData,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../../../schema-engine";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";

type QCSchemaPanelProps = {
  schema: SchemaDocumentV2 | null;
  formValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
  /** Resets one-time hydration when switching between division entries. */
  hydrationKey?: string;
  subDepartmentId?: number;
  batchId?: string;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  loading?: boolean;
  error?: string | null;
};

const QCSchemaPanel = ({
  schema,
  formValues,
  savedSections,
  hydrationKey,
  subDepartmentId,
  batchId,
  onChange,
  readOnly = false,
  loading = false,
  error = null,
}: QCSchemaPanelProps) => {
  const hydratedRef = useRef(false);

  useEffect(() => {
    hydratedRef.current = false;
  }, [hydrationKey, savedSections, schema?.schemaVersion, schema?.data?.context]);

  useEffect(() => {
    if (!schema) return;
    if (hydratedRef.current) return;

    const hasExistingValues =
      schemaValuesHaveUserData(formValues ?? {}) || Object.keys(formValues ?? {}).length > 0;

    if (hasExistingValues) {
      hydratedRef.current = true;
      return;
    }

    if (savedSections?.length) {
      onChange(hydrateQcValuesFromSections(schema, savedSections));
    } else {
      onChange(createQcInitialValues(schema));
    }
    hydratedRef.current = true;
  }, [schema, savedSections, formValues, onChange]);

  const themeTokens = useMemo(
    () => ({
      primary: QC_DIVISION_BRAND.primary,
      primaryLight: QC_DIVISION_BRAND.primaryLight,
      accent: QC_DIVISION_BRAND.accent,
      text: QC_DIVISION_BRAND.text,
      textSub: QC_DIVISION_BRAND.textSub,
      border: QC_DIVISION_BRAND.border,
      surface: QC_DIVISION_BRAND.surface,
      warn: QC_DIVISION_BRAND.warn,
    }),
    [],
  );

  return (
    <Box>
      <SchemaUI
        schema={schema}
        value={formValues}
        onChange={onChange}
        readOnly={readOnly}
        loading={loading}
        error={error}
        themeTokens={themeTokens}
        apiContext={{ subDepartmentId, batchId }}
      />
    </Box>
  );
};

export default QCSchemaPanel;
