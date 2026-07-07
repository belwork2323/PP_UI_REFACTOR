import { useEffect, useMemo, useRef } from "react";
import { Box } from "@mui/material";
import {
  SchemaUI,
  createPostCureInitialValues,
  hydratePostCureValuesFromSections,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../../../schema-engine";
import { POST_CURE_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/postCure_theme";

type PostCureSchemaPanelProps = {
  schema: SchemaDocumentV2 | null;
  formValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
  subDepartmentId?: number;
  batchId?: string;
  motorId?: string;
  onChange: (values: SchemaFormValues) => void;
  loading?: boolean;
  error?: string | null;
  readOnly?: boolean;
};

const PostCureSchemaPanel = ({
  schema,
  formValues,
  savedSections,
  subDepartmentId,
  batchId,
  motorId,
  onChange,
  loading = false,
  error = null,
  readOnly = false,
}: PostCureSchemaPanelProps) => {
  const hydratedRef = useRef(false);

  useEffect(() => {
    hydratedRef.current = false;
  }, [savedSections, schema?.schemaVersion, schema?.schemaType]);

  useEffect(() => {
    if (!schema) return;
    if (hydratedRef.current) return;

    if (savedSections?.length) {
      onChange(hydratePostCureValuesFromSections(schema, savedSections));
    } else if (Object.keys(formValues ?? {}).length === 0) {
      onChange(createPostCureInitialValues(schema));
    }
    hydratedRef.current = true;
  }, [schema, savedSections]);

  const themeTokens = useMemo(
    () => ({
      primary: POST_CURE_BRAND.pc,
      primaryLight: POST_CURE_BRAND.pcLight,
      accent: POST_CURE_BRAND.accent,
      text: POST_CURE_BRAND.text,
      textSub: POST_CURE_BRAND.textSub,
      border: POST_CURE_BRAND.border,
      surface: POST_CURE_BRAND.surface,
      warn: POST_CURE_BRAND.warn,
    }),
    [],
  );

  const apiContext = useMemo(
    () => ({ subDepartmentId, batchId, motorId }),
    [subDepartmentId, batchId, motorId],
  );

  return (
    <Box mt={2}>
      <SchemaUI
        schema={schema}
        value={formValues}
        onChange={onChange}
        loading={loading}
        error={error}
        readOnly={readOnly}
        themeTokens={themeTokens}
        apiContext={apiContext}
        batch={{ batchId }}
        motorId={motorId}
      />
    </Box>
  );
};

export default PostCureSchemaPanel;
