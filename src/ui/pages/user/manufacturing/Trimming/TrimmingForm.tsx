import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import { TRIMMING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/trimming_theme";
import type { TrimmingFormState, TrimmingMotorSession } from "../../../../../data/models/user/TrimmingFormModel";
import {
  canAddTrimmingMotors,
  canLoadTrimmingForm,
  type TrimmingAddedMotor,
  type TrimmingMotorStageOption,
} from "../../../../../hooks/user/manufacturing/trimmingFlowConfig";
import { mapTrimmingMotorStage, resolveTrimmingMotorStage } from "../../../../../schema-engine";
import TrimmingFlowBar from "./TrimmingFlowBar";
import TrimmingSchemaPanel from "./TrimmingSchemaPanel";

const S = STRINGS.MANUFACTURING.TRIMMING;
const { straighten: StraightenRoundedIcon } = icons.user.manufacturing.trimming.form;

type TrimmingFormProps = {
  batch?: {
    batchId?: string;
    formId?: string | null;
    motorId?: string;
    motorStage?: unknown;
    motorType?: unknown;
  } | null;
  formData: TrimmingFormState;
  subDepartmentId?: number;
  selectedMotorStage: string;
  motorStageOptions: TrimmingMotorStageOption[];
  motorStagesLoading?: boolean;
  motorCount: number | "";
  draftMotorIds: string[];
  motorReceivedAt: string;
  addedMotors: TrimmingAddedMotor[];
  availableMotorOptions: Array<{ value: string; label: string }>;
  approvedMotorsLoading?: boolean;
  maxMotorCount: number;
  schemaLoading?: boolean;
  schemaError?: string | null;
  onMotorStageChange: (value: string) => void;
  onMotorCountChange: (count: number | "") => void;
  onDraftMotorIdChange: (index: number, motorId: string) => void;
  onMotorReceivedAtChange: (value: string) => void;
  onLoadTrimmingForm: () => void;
  onAddMotors: () => void;
  onMotorSessionChange: (motorId: string, next: TrimmingMotorSession) => void;
  onFormValuesChange: (motorId: string, values: import("../../../../../schema-engine").SchemaFormValues) => void;
  theme: any;
};

const TrimmingForm = ({
  batch,
  formData,
  subDepartmentId,
  selectedMotorStage,
  motorStageOptions,
  motorStagesLoading = false,
  motorCount,
  draftMotorIds,
  motorReceivedAt,
  addedMotors,
  availableMotorOptions,
  approvedMotorsLoading = false,
  maxMotorCount,
  schemaLoading = false,
  schemaError = null,
  onMotorStageChange,
  onMotorCountChange,
  onDraftMotorIdChange,
  onMotorReceivedAtChange,
  onLoadTrimmingForm,
  onAddMotors,
  onMotorSessionChange,
  onFormValuesChange,
  theme,
}: TrimmingFormProps) => {
  const BRAND = TRIMMING_BRAND;
  const primaryColor = theme.palette.primary;
  const motorStageLabel = selectedMotorStage
    ? mapTrimmingMotorStage(selectedMotorStage)
    : resolveTrimmingMotorStage(batch);
  const schema = formData.trimmingSchema;
  const trimmingFormLoaded = Boolean(
    formData.schemaFormLoaded && (formData.motors?.length || schema),
  );
  const motorCards = Array.isArray(addedMotors) ? addedMotors : [];
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const prevMotorCountRef = useRef(0);
  const formSessionKey = `${batch?.batchId ?? ""}:${batch?.formId ?? "new"}`;

  useEffect(() => {
    setActiveMotorIndex(0);
    prevMotorCountRef.current = 0;
  }, [formSessionKey]);

  useEffect(() => {
    if (motorCards.length === 0) {
      setActiveMotorIndex(0);
      prevMotorCountRef.current = 0;
      return;
    }

    const prevCount = prevMotorCountRef.current;

    if (prevCount === 0) {
      setActiveMotorIndex(0);
    } else if (motorCards.length > prevCount) {
      setActiveMotorIndex(motorCards.length - 1);
    } else {
      setActiveMotorIndex((prev) => Math.min(prev, motorCards.length - 1));
    }

    prevMotorCountRef.current = motorCards.length;
  }, [motorCards.length]);

  const activeMotorEntry = useMemo(
    () => (motorCards.length > 0 ? motorCards[activeMotorIndex] : null),
    [motorCards, activeMotorIndex],
  );

  const activeMotorSession = useMemo(() => {
    if (!activeMotorEntry) return null;
    return (formData.motors ?? []).find((motor) => motor.motorId === activeMotorEntry.motorId) ?? null;
  }, [activeMotorEntry, formData.motors]);

  const activeSchema = useMemo(() => {
    if (!activeMotorSession) return null;
    return (
      activeMotorSession.schema ??
      formData.schemasByStage?.[activeMotorSession.motorStage] ??
      formData.trimmingSchema
    );
  }, [activeMotorSession, formData.schemasByStage, formData.trimmingSchema]);

  const usedMotorIds = motorCards.map((motor) => motor.motorId);
  const canLoad = canLoadTrimmingForm({
    selectedMotorStage,
    motorCount,
    draftMotorIds,
    motorReceivedAt,
    usedMotorIds,
    trimmingFormLoaded,
    availableMotorOptions,
    maxMotorCount,
  });
  const canAdd = canAddTrimmingMotors({
    selectedMotorStage,
    motorCount,
    draftMotorIds,
    motorReceivedAt,
    usedMotorIds,
    trimmingFormLoaded,
    availableMotorOptions,
    maxMotorCount,
  });

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Box
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${theme.palette.border}`,
          background: `linear-gradient(135deg, ${BRAND.surface} 0%, #fff 100%)`,
          px: 2,
          py: 1.75,
          mb: 2.5,
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} gap={1.5}>
          <Stack direction="row" alignItems="center" gap={1.5} flex={1}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                background: `linear-gradient(135deg,${BRAND.tr},${BRAND.trLight})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 14px ${BRAND.tr}40`,
              }}
            >
              <StraightenRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: BRAND.text }}>
                {S.FORM_TITLE}
              </Typography>
              <Typography sx={{ fontSize: "0.74rem", color: BRAND.textSub, mt: 0.2 }}>
                {S.FORM_SUBTITLE}
                {batch?.batchId ? ` · ${batch.batchId}` : ""}
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={`${S.MOTOR_STAGE_LABEL}: ${motorStageLabel}`}
            size="small"
            sx={{
              height: 26,
              fontWeight: 700,
              fontSize: "0.7rem",
              alignSelf: { xs: "flex-start", sm: "center" },
              background: "rgba(106,27,154,0.1)",
              color: BRAND.tr,
              border: `1px solid ${BRAND.tr}44`,
            }}
          />
        </Stack>
      </Box>

      <TrimmingFlowBar
        selectedMotorStage={selectedMotorStage}
        motorStageOptions={motorStageOptions}
        motorStagesLoading={motorStagesLoading}
        motorCount={motorCount}
        draftMotorIds={draftMotorIds}
        motorReceivedAt={motorReceivedAt}
        availableMotorOptions={availableMotorOptions}
        approvedMotorsLoading={approvedMotorsLoading}
        usedMotorIds={usedMotorIds}
        trimmingFormLoaded={trimmingFormLoaded}
        maxMotorCount={maxMotorCount}
        onMotorStageChange={onMotorStageChange}
        onMotorCountChange={onMotorCountChange}
        onDraftMotorIdChange={onDraftMotorIdChange}
        onMotorReceivedAtChange={onMotorReceivedAtChange}
        onLoadTrimmingForm={onLoadTrimmingForm}
        onAddMotors={onAddMotors}
        canLoad={canLoad}
        canAdd={canAdd}
        schemaLoading={schemaLoading}
        theme={theme}
      />

      {schemaLoading && !schema ? (
        <Box
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${theme.palette.border}`,
            background: theme.palette.surface,
            px: 2,
            py: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <CircularProgress size={28} sx={{ color: BRAND.tr }} />
          <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: BRAND.text }}>
            {S.SCHEMA_LOADING}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: BRAND.textSub, textAlign: "center" }}>
            {S.SCHEMA_LOADING_HINT}
          </Typography>
        </Box>
      ) : null}

      {schemaError && !schemaLoading ? (
        <Typography sx={{ fontSize: "0.82rem", color: BRAND.danger, mb: 2 }}>{schemaError}</Typography>
      ) : null}

      {motorCards.length > 0 && activeMotorEntry && activeMotorSession && activeSchema ? (
        <Stack spacing={1.25}>
          {motorCards.length > 1 ? (
            <>
              <Box
                sx={{
                  border: `1px solid ${theme.palette.border}`,
                  borderRadius: 2,
                  px: 1.2,
                  py: 1,
                  background: theme.palette.surface,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={activeMotorIndex === 0}
                    onClick={() => setActiveMotorIndex((prev) => Math.max(0, prev - 1))}
                  >
                    {S.NAV_BACK}
                  </Button>
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: primaryColor }}>
                    {S.MOTOR_CARD_TITLE} {activeMotorIndex + 1} of {motorCards.length}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={activeMotorIndex >= motorCards.length - 1}
                    onClick={() =>
                      setActiveMotorIndex((prev) => Math.min(motorCards.length - 1, prev + 1))
                    }
                  >
                    {S.NAV_NEXT}
                  </Button>
                </Stack>
              </Box>

              <Box
                sx={{
                  border: `1px solid ${theme.palette.border}`,
                  borderRadius: 2,
                  px: 1,
                  py: 1,
                  background: theme.palette.surface,
                }}
              >
                <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: primaryColor, mb: 0.4 }}>
                  {S.MOTOR_NAV_TITLE}
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mb: 0.9 }}>
                  {S.MOTOR_NAV_HINT}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
                  {motorCards.map((entry, idx) => (
                    <Button
                      key={`motor-tab-${entry.motorId}`}
                      size="small"
                      variant={idx === activeMotorIndex ? "contained" : "outlined"}
                      onClick={() => setActiveMotorIndex(idx)}
                      sx={{ whiteSpace: "nowrap", flexShrink: 0, textTransform: "none" }}
                    >
                      {entry.motorId}
                    </Button>
                  ))}
                </Stack>
              </Box>
            </>
          ) : null}

          <Box
            key={`${activeMotorEntry.motorId}-${activeMotorSession.motorStage}`}
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${theme.palette.border}`,
              background: theme.palette.surface,
              px: 1.5,
              py: 1.25,
            }}
          >
            <Box mb={1.25}>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: primaryColor }}>
                {S.MOTOR_CARD_TITLE} — {activeMotorEntry.motorId}
              </Typography>
              <Typography sx={{ fontSize: "0.74rem", color: BRAND.textSub, mt: 0.25 }}>
                {S.MOTOR_RECEIVED_AT_LABEL}: {activeMotorEntry.motorReceivedAt || "—"}
              </Typography>
              <Typography sx={{ fontSize: "0.74rem", color: BRAND.textSub, mt: 0.25 }}>
                {S.MOTOR_STAGE_LABEL}: {mapTrimmingMotorStage(activeMotorEntry.motorStage)}
              </Typography>
            </Box>

            <TrimmingSchemaPanel
              schema={activeSchema}
              formValues={activeMotorSession.formValues ?? {}}
              savedSections={activeMotorSession.savedSections}
              subDepartmentId={subDepartmentId}
              batchId={batch?.batchId}
              onChange={(values) => {
                onFormValuesChange(activeMotorEntry.motorId, values);
                onMotorSessionChange(activeMotorEntry.motorId, {
                  ...activeMotorSession,
                  schema: activeSchema,
                  formValues: values,
                });
              }}
              loading={schemaLoading}
              error={schemaError}
            />
          </Box>
        </Stack>
      ) : null}
    </Box>
  );
};

export default TrimmingForm;
