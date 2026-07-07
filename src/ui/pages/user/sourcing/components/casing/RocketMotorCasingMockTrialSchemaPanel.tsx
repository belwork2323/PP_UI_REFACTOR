import { useEffect, useMemo, useRef } from "react";
import { Box, Typography } from "@mui/material";
import {
  SchemaUI,
  buildMockTrialSchemaRequest,
  createMockTrialInitialValues,
  hydrateMockTrialValuesFromSections,
  rocketMotorCasingMockTrialSchemaFetchConfig,
  useSchemaFetch,
  type SchemaFormValues,
} from "../../../../../../schema-engine";
import type { RocketMotorCasingMockTrialSlot } from "../../../../../../data/models/user/RocketMotorCasingFormModel";

type RocketMotorCasingMockTrialSchemaPanelProps = {
  motorStage: string;
  subDepartmentId: number;
  slot: RocketMotorCasingMockTrialSlot;
  onSlotChange: (next: RocketMotorCasingMockTrialSlot) => void;
  theme: any;
};

const RocketMotorCasingMockTrialSchemaPanel = ({
  motorStage,
  subDepartmentId,
  slot,
  onSlotChange,
  theme,
}: RocketMotorCasingMockTrialSchemaPanelProps) => {
  const hydratedRef = useRef(false);
  const palette = theme?.palette ?? {};

  const requestBody = useMemo(() => {
    const stage = String(motorStage ?? "").trim();
    if (!stage || !subDepartmentId) return null;
    return buildMockTrialSchemaRequest({ subDepartmentId, motorStage: stage });
  }, [motorStage, subDepartmentId]);

  const canFetchSchema = Boolean(requestBody);

  const { schema, loading, error } = useSchemaFetch(
    rocketMotorCasingMockTrialSchemaFetchConfig,
    requestBody,
    canFetchSchema
  );

  useEffect(() => {
    hydratedRef.current = false;
  }, [motorStage, subDepartmentId]);

  useEffect(() => {
    if (loading) return;

    if (error || !schema) {
      onSlotChange({
        schema: null,
        schemaLoading: false,
        schemaError: error,
        formValues: slot.formValues,
        savedSections: slot.savedSections,
      });
      return;
    }

    let nextValues: SchemaFormValues = slot.formValues;
    if (!hydratedRef.current) {
      if (slot.savedSections?.length) {
        nextValues = hydrateMockTrialValuesFromSections(schema, slot.savedSections);
      } else if (Object.keys(slot.formValues).length === 0) {
        nextValues = createMockTrialInitialValues(schema);
      }
      hydratedRef.current = true;
    }

    onSlotChange({
      schema,
      schemaLoading: false,
      schemaError: null,
      formValues: nextValues,
      savedSections: slot.savedSections,
    });
  }, [schema, loading, error, slot.savedSections]);

  const handleValuesChange = (values: SchemaFormValues) => {
    onSlotChange({
      schema: error || loading ? null : schema,
      schemaLoading: loading,
      schemaError: error,
      formValues: values,
      savedSections: slot.savedSections,
    });
  };

  const schemaThemeTokens = useMemo(
    () => ({
      primary: palette.primary ?? "#1B4F72",
      primaryLight: palette.primaryLight ?? "#2E86C1",
      accent: palette.accent ?? "#148F77",
      text: palette.text ?? "#1C2833",
      textSub: palette.textSub ?? "#5D6D7E",
      border: palette.border ?? "#D5D8DC",
      surface: palette.surface ?? "#fff",
      warn: palette.warn ?? "#D4AC0D",
    }),
    [palette]
  );

  if (!String(motorStage ?? "").trim()) {
    return (
      <Typography sx={{ fontSize: "0.8rem", color: palette.textSub }}>
        Select a motor stage to load the mock trial form.
      </Typography>
    );
  }

  if (!subDepartmentId) {
    return (
      <Typography sx={{ fontSize: "0.8rem", color: palette.danger ?? "#C0392B" }}>
        Sub-department context is missing. Cannot load mock trial schema.
      </Typography>
    );
  }

  return (
    <Box>
      <SchemaUI
        schema={schema}
        value={slot.formValues}
        onChange={handleValuesChange}
        loading={loading}
        error={error}
        themeTokens={schemaThemeTokens}
        apiContext={{ subDepartmentId }}
      />
    </Box>
  );
};

export default RocketMotorCasingMockTrialSchemaPanel;
