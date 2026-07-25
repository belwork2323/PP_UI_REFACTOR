import { useEffect, useMemo, useState } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { STRINGS } from "../../../../../app/config/strings";
import { POST_CURE_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/postCure_theme";
import {
  isPostCureInhibitionOperation,
  POST_CURE_INHIBITOR_TYPE_OPTIONS,
  POST_CURE_OPERATION_OPTIONS,
  formatPostCureMotorOperationLabel,
  resolvePostCureMotorOptions,
} from "../../../../../hooks/user/manufacturing/postCureConfig";
import type {
  PostCureFormState,
  PostCureMotorSession,
} from "../../../../../data/models/user/PostCureFormModel";
import type { PostCureAddedMotor } from "../../../../../hooks/user/manufacturing/postCureFlowConfig";
import RemoveProcessButton from "../../../../components/common/RemoveProcessButton";
import FlowBarDateField from "../../../../components/common/FlowBarDateField";
import CasePrepSelect from "../CasePreparation/CasePrepSelect";
import PostCureSchemaPanel from "./PostCureSchemaPanel";

const S = STRINGS.MANUFACTURING.POST_CURE;

type PostCureFormProps = {
  batch?: {
    batchId?: string;
    motorId?: string;
    motorIds?: Array<string | number>;
  } | null;
  formData: PostCureFormState;
  addedMotors: PostCureAddedMotor[];
  draftMotorId: string;
  draftMotorReceiptDate: string;
  draftOperation: string;
  draftInhibitorType: string;
  usedMotorIds: string[];
  subDepartmentId?: number;
  schemaLoading?: boolean;
  schemaError?: string | null;
  canLoadForm?: boolean;
  canAddMotor?: boolean;
  onDraftMotorIdChange: (value: string) => void;
  onDraftMotorReceiptDateChange: (value: string) => void;
  onDraftOperationChange: (value: string) => void;
  onDraftInhibitorTypeChange: (value: string) => void;
  onLoadForm?: () => void;
  onAddMotor?: () => void;
  onRemoveMotor: (motorId: string) => void;
  onMotorSessionChange: (motorId: string, next: PostCureMotorSession) => void;
  theme: any;
};

const PostCureForm = ({
  batch,
  formData,
  addedMotors,
  draftMotorId,
  draftMotorReceiptDate,
  draftOperation,
  draftInhibitorType,
  usedMotorIds,
  subDepartmentId,
  schemaLoading = false,
  schemaError = null,
  canLoadForm = false,
  canAddMotor = false,
  onDraftMotorIdChange,
  onDraftMotorReceiptDateChange,
  onDraftOperationChange,
  onDraftInhibitorTypeChange,
  onLoadForm,
  onAddMotor,
  onRemoveMotor,
  onMotorSessionChange,
  theme,
}: PostCureFormProps) => {
  const flowBar = theme.manufacturing?.casePreparation?.flowBar ?? {};
  const showInhibitionFields = isPostCureInhibitionOperation(draftOperation);
  const motorCards = Array.isArray(addedMotors) ? addedMotors : [];

  const motorOptions = useMemo(() => {
    return resolvePostCureMotorOptions(batch);
  }, [batch]);

  const [activeMotorIndex, setActiveMotorIndex] = useState(0);

  // Sync activeMotorIndex with draftMotorId automatically without resetting to Motor 1 on re-renders
  useEffect(() => {
    if (motorOptions.length === 0) return;

    if (draftMotorId) {
      const matchedIdx = motorOptions.findIndex((opt) => opt.value === draftMotorId);
      if (matchedIdx !== -1) {
        setActiveMotorIndex(matchedIdx);
        return;
      }
    }

    // Only set default if no motor is selected initially
    const defaultId = motorOptions[0]?.value;
    if (defaultId && defaultId !== draftMotorId) {
      setActiveMotorIndex(0);
      onDraftMotorIdChange(defaultId);
    }
  }, [draftMotorId, motorOptions, onDraftMotorIdChange]);

  // Check if the SPECIFIC currently selected motor has a loaded session with schema
  const currentMotorSession = useMemo(() => {
    return (formData.motors ?? []).find((motor) => motor.motorId === draftMotorId) ?? null;
  }, [formData.motors, draftMotorId]);

  const activeMotorEntry = useMemo(() => {
    return motorCards.find((card) => card.motorId === draftMotorId) ?? null;
  }, [motorCards, draftMotorId]);

  const isCurrentMotorLoaded = Boolean(currentMotorSession && currentMotorSession.postCureSchema);

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* 1. TOP MOTOR SELECTION TABS & CONTROLS */}
      <Stack spacing={1.25} sx={{ mb: 2 }}>
        {/* Back / Next Navigation Controls */}
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
              onClick={() => {
                const nextIdx = Math.max(0, activeMotorIndex - 1);
                const nextMotorId = motorOptions[nextIdx]?.value;
                if (nextMotorId) {
                  setActiveMotorIndex(nextIdx);
                  onDraftMotorIdChange(nextMotorId);
                }
              }}
            >
              Back
            </Button>

            <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: theme.palette.primary }}>
              {S.MOTOR_CARD_TITLE} {motorOptions.length > 0 ? activeMotorIndex + 1 : 0} of{" "}
              {motorOptions.length}
            </Typography>

            <Button
              variant="outlined"
              size="small"
              disabled={activeMotorIndex >= motorOptions.length - 1}
              onClick={() => {
                const nextIdx = Math.min(motorOptions.length - 1, activeMotorIndex + 1);
                const nextMotorId = motorOptions[nextIdx]?.value;
                if (nextMotorId) {
                  setActiveMotorIndex(nextIdx);
                  onDraftMotorIdChange(nextMotorId);
                }
              }}
            >
              Next
            </Button>
          </Stack>
        </Box>

        {/* Scrollable Motor Buttons */}
        <Box
          sx={{
            border: `1px solid ${theme.palette.border}`,
            borderRadius: 2,
            px: 1,
            py: 1,
            background: theme.palette.surface,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.76rem",
              fontWeight: 700,
              color: theme.palette.primary,
              mb: 0.4,
            }}
          >
            {S.MOTOR_NAV_TITLE}
          </Typography>

          <Typography sx={{ fontSize: "0.72rem", color: theme.palette.textSub, mb: 0.9 }}>
            {S.MOTOR_NAV_HINT}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
            {motorOptions.map((option, idx) => {
              const isSelected = draftMotorId === option.value;

              return (
                <Button
                  key={`motor-tab-${option.value}`}
                  size="small"
                  variant={isSelected ? "contained" : "outlined"}
                  onClick={() => {
                    setActiveMotorIndex(idx);
                    onDraftMotorIdChange(option.value);
                  }}
                  sx={{ whiteSpace: "nowrap", flexShrink: 0, textTransform: "none" }}
                >
                  {option.label || option.value}
                </Button>
              );
            })}
          </Stack>
        </Box>
      </Stack>

      {/* 2. MOTOR SETUP FORM (Receipt Date, Operation & Load Form Button) */}
      {!isCurrentMotorLoaded && (
        <Box
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${theme.palette.border}`,
            background: theme.palette.surface,
            px: { xs: 1.25, sm: 1.5 },
            py: 1.25,
            mb: 1.25,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.84rem",
              fontWeight: 800,
              color: theme.palette.primary,
              mb: 1.5,
            }}
          >
            {S.PANEL_TITLE} — {draftMotorId || "Select Motor"}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                flexWrap: "wrap",
                gap: 2,
                alignItems: { md: "flex-end" },
              }}
            >
              {/* MOTOR RECEIPT DATE */}
              <Box sx={flowBar.selectField?.(260)}>
                <Typography component="label" sx={flowBar.selectLabel}>
                  {S.MOTOR_RECEIPT_DATE_LABEL}
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                  <DatePicker
                    enableAccessibleFieldDOMStructure={false}
                    format="DD-MM-YYYY"
                    value={
                      draftMotorReceiptDate ? dayjs(draftMotorReceiptDate, "DD-MM-YYYY") : null
                    }
                    onChange={(picked) =>
                      onDraftMotorReceiptDateChange(picked?.format("DD-MM-YYYY") || "")
                    }
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        placeholder: S.MOTOR_RECEIPT_DATE_PLACEHOLDER,
                        sx: flowBar.selectInput?.(Boolean(draftMotorReceiptDate)),
                      },
                    }}
                  />
                </LocalizationProvider>
              </Box>

              {/* OPERATION SELECT */}
              <CasePrepSelect
                label={S.OPERATION_LABEL}
                value={draftOperation}
                placeholder={S.OPERATION_PLACEHOLDER}
                options={POST_CURE_OPERATION_OPTIONS}
                width={260}
                theme={theme}
                onChange={onDraftOperationChange}
              />
            </Box>

            {/* INHIBITION CONDITIONAL FIELDS */}
            {showInhibitionFields ? (
              <Box
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.border}`,
                  background: "rgba(21,101,192,0.03)",
                  px: 1.25,
                  py: 1.25,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: theme.palette.primary,
                    mb: 1.25,
                  }}
                >
                  {S.INHIBITION_SECTION_TITLE}
                </Typography>

                <CasePrepSelect
                  label={S.INHIBITOR_TYPE_LABEL}
                  value={draftInhibitorType}
                  placeholder={S.INHIBITOR_TYPE_PLACEHOLDER}
                  options={POST_CURE_INHIBITOR_TYPE_OPTIONS}
                  width={260}
                  theme={theme}
                  onChange={onDraftInhibitorTypeChange}
                />
              </Box>
            ) : null}

            {/* FORM ACTION BUTTONS (Load Form / Add Motor) */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              {formData.schemaFormLoaded ? (
                <Button
                  variant="contained"
                  size="small"
                  onClick={onAddMotor}
                  disabled={!canAddMotor || schemaLoading}
                  startIcon={
                    schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined
                  }
                >
                  {schemaLoading ? S.SCHEMA_LOADING : "Add Motor"}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  size="small"
                  onClick={onLoadForm}
                  disabled={!canLoadForm || schemaLoading}
                  startIcon={
                    schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined
                  }
                >
                  {schemaLoading ? S.SCHEMA_LOADING : S.LOAD_FORM}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      )}

      {schemaError ? (
        <Typography sx={{ fontSize: "0.82rem", color: POST_CURE_BRAND.danger, mb: 2 }}>
          {schemaError}
        </Typography>
      ) : null}

      {/* 3. DYNAMIC CURED MOTOR SCHEMA DISPLAY */}
      {isCurrentMotorLoaded && activeMotorEntry && currentMotorSession?.postCureSchema ? (
        <Stack spacing={1.25}>
          <Box
            key={`${activeMotorEntry.motorId}-${currentMotorSession.operation}-${currentMotorSession.inhibitorType}`}
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
                <Typography
                  sx={{ fontSize: "0.8rem", fontWeight: 700, color: theme.palette.primary }}
                >
                  {S.MOTOR_CARD_TITLE} — {activeMotorEntry.motorId}
                </Typography>
                <Typography sx={{ fontSize: "0.74rem", color: theme.palette.textSub, mt: 0.25 }}>
                  {S.MOTOR_RECEIPT_DATE_LABEL}: {activeMotorEntry.motorReceiptDate || "—"}
                </Typography>
                <Typography sx={{ fontSize: "0.74rem", color: theme.palette.textSub, mt: 0.25 }}>
                  {S.OPERATION_LABEL}:{" "}
                  {formatPostCureMotorOperationLabel(
                    currentMotorSession.operation,
                    currentMotorSession.inhibitorType,
                  )}
                </Typography>
              </Box>
              <RemoveProcessButton
                onClick={() => onRemoveMotor(activeMotorEntry.motorId)}
                dangerColor={POST_CURE_BRAND.danger}
                tooltip={S.DELETE_MOTOR_TOOLTIP}
              />
            </Stack>
            <PostCureSchemaPanel
              schema={currentMotorSession.postCureSchema}
              formValues={currentMotorSession.schemaFormValues}
              savedSections={currentMotorSession.savedSections}
              subDepartmentId={subDepartmentId}
              batchId={batch?.batchId}
              motorId={activeMotorEntry.motorId}
              onChange={(values) =>
                onMotorSessionChange(activeMotorEntry.motorId, {
                  ...currentMotorSession,
                  schemaFormValues: values,
                })
              }
              loading={schemaLoading}
              error={schemaError}
            />
          </Box>
        </Stack>
      ) : null}
    </Box>
  );
};

export default PostCureForm;
