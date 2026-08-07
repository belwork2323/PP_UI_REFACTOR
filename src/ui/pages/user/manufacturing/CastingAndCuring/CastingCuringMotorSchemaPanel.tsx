import { useMemo } from "react";
import { Box } from "@mui/material";
import {
  SchemaUI,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSetupContext,
} from "../../../../../schema-engine";
import { CASTING_CURING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/castingAndCuring_theme";
import { STRINGS } from "../../../../../app/config/strings";
import type { CastingCuringMotorSession } from "../../../../../data/models/user/CastingCuringFormModel";

type CastingCuringMotorSchemaPanelProps = {
  schema: SchemaDocumentV2 | null;
  motor: CastingCuringMotorSession;
  subDepartmentId?: number;
  batchId?: string;
  projectId?: string;
  setupContext?: SchemaSetupContext;
  curingFormValues?: SchemaFormValues;
  castingFormValues?: SchemaFormValues;
  getCrossMotorExcludedBowlSelections?: (motorId: string) => string[];
  onMotorChange: (next: CastingCuringMotorSession) => void;
  onCastingFormValuesChange?: (values: SchemaFormValues) => void;
  onCuringFormValuesChange?: (values: SchemaFormValues) => void;
  loading?: boolean;
  error?: string | null;
  readOnly?: boolean;
};

const CastingCuringMotorSchemaPanel = ({
  schema,
  motor,
  subDepartmentId,
  batchId,
  projectId,
  setupContext,
  curingFormValues,
  castingFormValues,
  getCrossMotorExcludedBowlSelections,
  onMotorChange,
  onCastingFormValuesChange,
  onCuringFormValuesChange,
  loading = false,
  error = null,
  readOnly = false,
}: CastingCuringMotorSchemaPanelProps) => {
  const themeTokens = useMemo(
    () => ({
      primary: CASTING_CURING_BRAND.cc,
      primaryLight: CASTING_CURING_BRAND.ccLight,
      accent: CASTING_CURING_BRAND.accent,
      text: CASTING_CURING_BRAND.text,
      textSub: CASTING_CURING_BRAND.textSub,
      border: CASTING_CURING_BRAND.border,
      surface: CASTING_CURING_BRAND.surface,
      warn: CASTING_CURING_BRAND.warn,
    }),
    [],
  );

  const formValues = castingFormValues ?? motor.formValues ?? {};
  const resolvedCuringFormValues = curingFormValues ?? motor.curingFormValues ?? {};
  const isCuringPanel = schema?.schemaType === "CURING";
  const value = isCuringPanel ? resolvedCuringFormValues : formValues;

  const crossMotorExcludedBowlSelections = useMemo(
    () => getCrossMotorExcludedBowlSelections?.(motor.motorId) ?? [],
    [getCrossMotorExcludedBowlSelections, motor.motorId],
  );

  const handleValuesChange = (values: SchemaFormValues) => {
    if (isCuringPanel) {
      if (onCuringFormValuesChange) {
        onCuringFormValuesChange(values);
        return;
      }
      onMotorChange({ ...motor, curingFormValues: values });
      return;
    }
    if (onCastingFormValuesChange) {
      onCastingFormValuesChange(values);
      return;
    }
    onMotorChange({ ...motor, formValues: values });
  };

  return (
    <Box>
      <SchemaUI
        key={`${motor.motorId}-${isCuringPanel ? "curing" : "casting"}`}
        schema={schema}
        value={value}
        onChange={handleValuesChange}
        loading={loading}
        error={error}
        readOnly={readOnly}
        themeTokens={themeTokens}
        apiContext={{
          subDepartmentId,
          batchId,
          projectId,
          motorId: motor.motorId,
          mixingStageType: "FINAL_MIX",
          crossMotorExcludedBowlSelections,
          noBowlsAvailablePlaceholder: STRINGS.MANUFACTURING.CASTING_CURING.PLACEHOLDER_NO_BOWLS_AVAILABLE,
        }}
        setupContext={setupContext}
        batch={{ batchId, projectId }}
        motorId={motor.motorId}
        hideRepeatInstanceLabels={!isCuringPanel}
      />
    </Box>
  );
};

export default CastingCuringMotorSchemaPanel;
