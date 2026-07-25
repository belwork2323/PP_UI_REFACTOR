import { useLayoutEffect, useMemo, useRef } from "react";
import { Box } from "@mui/material";
import {
  SchemaUI,
  createCasePrepInitialValues,
  hydrateCasePrepValuesFromSections,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSetupContext,
} from "../../../../../schema-engine";
import { CASE_PREP_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/casePreparation_theme";
import type { CasePrepMotorSession } from "../../../../../data/models/user/CasePreparationFormModel";

type CasePrepMotorSchemaPanelProps = {
  schema: SchemaDocumentV2 | null;
  motor: CasePrepMotorSession;
  motorIndex?: number;
  setupContext?: SchemaSetupContext;
  subDepartmentId?: number;
  batchId?: string;
  onMotorChange: (next: CasePrepMotorSession, meta?: { hydrate?: boolean }) => void;
  loading?: boolean;
  error?: string | null;
  readOnly?: boolean;
};

const CasePrepMotorSchemaPanel = ({
  schema,
  motor,
  setupContext,
  subDepartmentId,
  batchId,
  onMotorChange,
  loading = false,
  error = null,
  readOnly = false,
}: CasePrepMotorSchemaPanelProps) => {
  const lastHydratedMotorIdRef = useRef<string | null>(null);
  const onMotorChangeRef = useRef(onMotorChange);
  onMotorChangeRef.current = onMotorChange;
  const motorRef = useRef(motor);
  motorRef.current = motor;

  useLayoutEffect(() => {
    if (!schema) return;

    const hasValues = Object.keys(motor.formValues ?? {}).length > 0;
    if (hasValues) {
      lastHydratedMotorIdRef.current = motor.motorId;
      return;
    }
    if (lastHydratedMotorIdRef.current === motor.motorId) return;

    const nextValues = motor.savedSections?.length
      ? hydrateCasePrepValuesFromSections(schema, motor.savedSections, setupContext)
      : createCasePrepInitialValues(schema, setupContext);

    lastHydratedMotorIdRef.current = motor.motorId;
    onMotorChangeRef.current(
      {
        ...motor,
        formValues: nextValues,
        savedSections: undefined,
      },
      { hydrate: true },
    );
  }, [schema, motor.motorId, motor.formValues, motor.savedSections, setupContext]);

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

  const apiContext = useMemo(
    () => ({ subDepartmentId, batchId, motorId: motor.motorId }),
    [subDepartmentId, batchId, motor.motorId],
  );

  const handleValuesChange = useMemo(
    () => (values: SchemaFormValues) => {
      onMotorChangeRef.current({
        ...motorRef.current,
        formValues: values,
        savedSections: undefined,
      });
    },
    [],
  );

  return (
    <Box>
      <SchemaUI
        schema={schema}
        value={motor.formValues}
        onChange={handleValuesChange}
        loading={loading || Object.keys(motor.formValues ?? {}).length === 0}
        error={error}
        readOnly={readOnly}
        themeTokens={themeTokens}
        apiContext={apiContext}
        setupContext={setupContext}
        motorId={motor.motorId}
      />
    </Box>
  );
};

export default CasePrepMotorSchemaPanel;
