import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import { CASE_PREP_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/casePreparation_theme";
import {
  CASE_PREP_FLOW_LABELS,
  canAddCasePrepMotors,
  isMainMotorBatch,
  isSubscaleBatch,
  resolveCasePrepMotorOptions,
  supportsCasePrepSchemaFlow,
  type CasePrepAddedMotor,
} from "../../../../../hooks/user/manufacturing/casePreparationFlowConfig";
import type { CasePrepMotorSession, CasePreparationFormState } from "../../../../../data/models/user/CasePreparationFormModel";
import type { SchemaDocument, SchemaFormValues } from "../../../../../schemaManagement";
import RemoveProcessButton from "../../../../components/common/RemoveProcessButton";
import CasePrepFlowBar from "./CasePrepFlowBar";
import CasePrepMotorSchemaPanel from "./CasePrepMotorSchemaPanel";
import CasePrepSubscaleSchemaPanel from "./CasePrepSubscaleSchemaPanel";

const S = STRINGS.MANUFACTURING.CASE_PREP;
const { cleaningServices: CleaningServicesRoundedIcon } = icons.user.manufacturing.casePreparation.form;

type CasePreparationFormProps = {
  batch?: { batchId?: string; batchType?: string; motorId?: string; motorIds?: string[] } | null;
  formData: CasePreparationFormState;
  addedMotors: CasePrepAddedMotor[];
  motorCount: number | "";
  draftMotorIds: string[];
  prrcClearanceDate: string;
  schemaLoading?: boolean;
  schemaError?: string | null;
  subDepartmentId?: number;
  onMotorCountChange: (count: number | "") => void;
  onDraftMotorIdChange: (index: number, motorId: string) => void;
  onPrrcDateChange: (value: string) => void;
  onAddMotors: () => void;
  onRemoveMotor: (motorId: string) => void;
  onMotorSessionChange: (motorId: string, next: CasePrepMotorSession) => void;
  onSubscaleValuesChange: (values: SchemaFormValues) => void;
  theme: any;
};

const CasePreparationForm = ({
  batch,
  formData,
  addedMotors,
  motorCount,
  draftMotorIds,
  prrcClearanceDate,
  schemaLoading = false,
  schemaError = null,
  subDepartmentId,
  onMotorCountChange,
  onDraftMotorIdChange,
  onPrrcDateChange,
  onAddMotors,
  onRemoveMotor,
  onMotorSessionChange,
  onSubscaleValuesChange,
  theme,
}: CasePreparationFormProps) => {
  const BRAND = CASE_PREP_BRAND;
  const schema = formData.schema;
  const motorCards = Array.isArray(addedMotors) ? addedMotors : [];
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);

  useEffect(() => {
    if (motorCards.length === 0) {
      setActiveMotorIndex(0);
      return;
    }
    setActiveMotorIndex((prev) => Math.min(prev, motorCards.length - 1));
  }, [motorCards.length]);

  const activeMotorEntry = useMemo(
    () => (motorCards.length > 0 ? motorCards[activeMotorIndex] : null),
    [motorCards, activeMotorIndex]
  );

  const activeMotorSession = useMemo(() => {
    if (!activeMotorEntry) return null;
    return (formData.motors ?? []).find((m) => m.motorId === activeMotorEntry.motorId) ?? null;
  }, [activeMotorEntry, formData.motors]);

  const usedMotorIds = motorCards.map((m) => m.motorId);
  const availableMotorOptions = useMemo(() => resolveCasePrepMotorOptions(batch), [batch]);
  const canAddMotors = canAddCasePrepMotors({
    batchType: batch?.batchType,
    motorCount,
    draftMotorIds,
    prrcClearanceDate,
    usedMotorIds,
    hasSchema: Boolean(schema),
    availableMotorOptions,
  });

  if (!supportsCasePrepSchemaFlow(batch?.batchType)) {
    return (
      <Box sx={{ p: 2, borderRadius: 2, border: `1px solid ${BRAND.border}`, background: BRAND.surface }}>
        <Typography sx={{ fontSize: "0.85rem", color: BRAND.textSub }}>
          {CASE_PREP_FLOW_LABELS.nonMainBatchMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Stack direction="row" alignItems="center" gap={1.5} mb={2.5}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "11px",
            background: "linear-gradient(135deg,#1565C0,#1976D2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(21,101,192,0.3)",
          }}
        >
          <CleaningServicesRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "0.98rem", color: BRAND.text }}>{S.FORM_TITLE}</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mt: 0.15 }}>{S.FORM_SUBTITLE}</Typography>
        </Box>
      </Stack>

      <CasePrepFlowBar
        batchType={batch?.batchType}
        motorCount={motorCount}
        draftMotorIds={draftMotorIds}
        prrcClearanceDate={prrcClearanceDate}
        availableMotorOptions={availableMotorOptions}
        hasSchema={Boolean(schema)}
        usedMotorIds={usedMotorIds}
        onMotorCountChange={onMotorCountChange}
        onDraftMotorIdChange={onDraftMotorIdChange}
        onPrrcDateChange={onPrrcDateChange}
        onAddMotors={onAddMotors}
        canAddMotors={canAddMotors}
        schemaLoading={schemaLoading}
        theme={theme}
      />

      {schemaError ? (
        <Typography sx={{ fontSize: "0.82rem", color: BRAND.danger, mb: 2 }}>{schemaError}</Typography>
      ) : null}

      {isSubscaleBatch(batch?.batchType) && schema && (
        <Box
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${theme.palette.border}`,
            background: theme.palette.surface,
            px: 1.5,
            py: 1.25,
          }}
        >
          <CasePrepSubscaleSchemaPanel
            schema={schema}
            formValues={formData.subscaleFormValues ?? {}}
            savedSections={formData.subscaleSavedSections}
            subDepartmentId={subDepartmentId}
            batchId={batch?.batchId}
            onChange={onSubscaleValuesChange}
            loading={schemaLoading}
            error={schemaError}
          />
        </Box>
      )}

      {isMainMotorBatch(batch?.batchType) && motorCards.length > 0 && activeMotorEntry && activeMotorSession && schema && (
        <Stack spacing={1.25}>
          {motorCards.length > 1 && (
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
                    Back
                  </Button>
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: theme.palette.primary }}>
                    {S.MOTOR_CARD_TITLE} {activeMotorIndex + 1} of {motorCards.length}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={activeMotorIndex >= motorCards.length - 1}
                    onClick={() => setActiveMotorIndex((prev) => Math.min(motorCards.length - 1, prev + 1))}
                  >
                    Next
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
                <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: theme.palette.primary, mb: 0.4 }}>
                  {S.MOTOR_NAV_TITLE}
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: theme.palette.textSub, mb: 0.9 }}>
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
          )}

          <Box
            key={activeMotorEntry.motorId}
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${theme.palette.border}`,
              background: theme.palette.surface,
              px: 1.5,
              py: 1.25,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25}>
              <Box>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: theme.palette.primary }}>
                  {S.MOTOR_CARD_TITLE} — {activeMotorEntry.motorId}
                </Typography>
                <Typography sx={{ fontSize: "0.74rem", color: theme.palette.textSub, mt: 0.25 }}>
                  {S.PRRC_CLEARANCE_DATE_LABEL}: {activeMotorEntry.prrcClearanceDate || "—"}
                </Typography>
              </Box>
              <RemoveProcessButton
                onClick={() => onRemoveMotor(activeMotorEntry.motorId)}
                dangerColor={BRAND.danger}
                tooltip={S.DELETE_MOTOR_TOOLTIP}
              />
            </Stack>

            <CasePrepMotorSchemaPanel
              schema={schema as SchemaDocument}
              motor={activeMotorSession}
              subDepartmentId={subDepartmentId}
              batchId={batch?.batchId}
              onMotorChange={(next) => onMotorSessionChange(activeMotorEntry.motorId, next)}
              loading={schemaLoading}
              error={schemaError}
            />
          </Box>
        </Stack>
      )}
    </Box>
  );
};

export default CasePreparationForm;
