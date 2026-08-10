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
  /** Parent-owned values used to decide whether API sections still need hydration. */
  persistedValues?: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
  /** Resets one-time hydration when switching between division entries. */
  hydrationKey?: string;
  subDepartmentId?: number;
  batchId?: string;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  /** Values editable; no Add Row / REMOVE / repeat Add (shared RAW_MATERIALS schema). */
  lockStructure?: boolean;
  loading?: boolean;
  error?: string | null;
};

const QCSchemaPanel = ({
  schema,
  formValues,
  persistedValues,
  savedSections,
  hydrationKey,
  subDepartmentId,
  batchId,
  onChange,
  readOnly = false,
  lockStructure = false,
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

    const hasPersistedUserData = schemaValuesHaveUserData(persistedValues ?? {});

    if (savedSections?.length && !hasPersistedUserData) {
      onChange(hydrateQcValuesFromSections(schema, savedSections));
      hydratedRef.current = true;
      return;
    }

    if (hasPersistedUserData || schemaValuesHaveUserData(formValues ?? {})) {
      hydratedRef.current = true;
      return;
    }

    if (Object.keys(formValues ?? {}).length === 0) {
      onChange(createQcInitialValues(schema));
    }
    hydratedRef.current = true;
  }, [schema, savedSections, onChange, hydrationKey, formValues, persistedValues]);

  const apiContext = useMemo(
    () => ({ subDepartmentId, batchId }),
    [batchId, subDepartmentId],
  );

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
        lockStructure={lockStructure}
        loading={loading}
        error={error}
        themeTokens={themeTokens}
        apiContext={apiContext}
      />
    </Box>
  );
};

export default QCSchemaPanel;
