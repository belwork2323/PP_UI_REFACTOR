import { useEffect, useMemo, useRef } from "react";
import { Box } from "@mui/material";
import {
  SchemaUI,
  createCasePrepInitialValues,
  hydrateCasePrepValuesFromSections,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../../../schema-engine";
import { CASE_PREP_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/casePreparation_theme";

type CasePrepSubscaleSchemaPanelProps = {
  schema: SchemaDocumentV2 | null;
  formValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
  subDepartmentId?: number;
  batchId?: string;
  onChange: (values: SchemaFormValues) => void;
  loading?: boolean;
  error?: string | null;
};

const CasePrepSubscaleSchemaPanel = ({
  schema,
  formValues,
  savedSections,
  subDepartmentId,
  batchId,
  onChange,
  loading = false,
  error = null,
}: CasePrepSubscaleSchemaPanelProps) => {
  const hydratedRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    hydratedRef.current = false;
  }, [schema?.schemaVersion, schema?.schemaType]);

  useEffect(() => {
    if (!schema || hydratedRef.current) return;
    if (Object.keys(formValues ?? {}).length > 0) {
      hydratedRef.current = true;
      return;
    }

    if (savedSections?.length) {
      onChangeRef.current(hydrateCasePrepValuesFromSections(schema, savedSections));
    } else {
      onChangeRef.current(createCasePrepInitialValues(schema));
    }
    hydratedRef.current = true;
  }, [schema, savedSections, formValues]);

  const themeTokens = useMemo(
    () => ({
      primary: CASE_PREP_BRAND.cp,
      primaryLight: CASE_PREP_BRAND.cpLight,
      accent: CASE_PREP_BRAND.accent,
      text: CASE_PREP_BRAND.text,
      textSub: CASE_PREP_BRAND.textSub,
      border: CASE_PREP_BRAND.border,
      surface: CASE_PREP_BRAND.surface,
      warn: CASE_PREP_BRAND.warn,
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

export default CasePrepSubscaleSchemaPanel;
