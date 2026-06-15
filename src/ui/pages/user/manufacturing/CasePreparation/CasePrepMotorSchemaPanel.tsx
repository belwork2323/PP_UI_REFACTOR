import { useEffect, useMemo, useRef } from "react";
import { Box } from "@mui/material";
import {
  SchemaUI,
  createCasePrepInitialValues,
  hydrateCasePrepValuesFromSections,
  type SchemaDocument,
  type SchemaFormValues,
} from "../../../../../schemaManagement";
import { CASE_PREP_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/casePreparation_theme";
import type { CasePrepMotorSession } from "../../../../../data/models/user/CasePreparationFormModel";

type CasePrepMotorSchemaPanelProps = {
  schema: SchemaDocument | null;
  motor: CasePrepMotorSession;
  subDepartmentId?: number;
  batchId?: string;
  onMotorChange: (next: CasePrepMotorSession) => void;
  loading?: boolean;
  error?: string | null;
};

const CasePrepMotorSchemaPanel = ({
  schema,
  motor,
  subDepartmentId,
  batchId,
  onMotorChange,
  loading = false,
  error = null,
}: CasePrepMotorSchemaPanelProps) => {
  const hydratedRef = useRef(false);

  useEffect(() => {
    hydratedRef.current = false;
  }, [motor.motorId, motor.savedSections, schema?.schemaVersion]);

  useEffect(() => {
    if (!schema) return;

    let nextValues: SchemaFormValues = motor.formValues;
    if (!hydratedRef.current) {
      if (motor.savedSections?.length) {
        nextValues = hydrateCasePrepValuesFromSections(schema, motor.savedSections);
      } else if (Object.keys(motor.formValues ?? {}).length === 0) {
        nextValues = createCasePrepInitialValues(schema);
      }
      hydratedRef.current = true;
      if (nextValues !== motor.formValues) {
        onMotorChange({ ...motor, formValues: nextValues });
      }
    }
  }, [schema, motor.motorId, motor.savedSections]);

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
    []
  );

  const handleValuesChange = (values: SchemaFormValues) => {
    onMotorChange({ ...motor, formValues: values });
  };

  return (
    <Box>
      <SchemaUI
        schema={schema}
        value={motor.formValues}
        onChange={handleValuesChange}
        loading={loading}
        error={error}
        themeTokens={themeTokens}
        apiContext={{ subDepartmentId, batchId }}
      />
    </Box>
  );
};

export default CasePrepMotorSchemaPanel;
