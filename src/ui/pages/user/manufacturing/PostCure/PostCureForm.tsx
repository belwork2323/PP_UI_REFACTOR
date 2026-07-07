import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { STRINGS } from "../../../../../app/config/strings";
import { POST_CURE_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/postCure_theme";
import {
  isPostCureInhibitionOperation,
  POST_CURE_INHIBITOR_TYPE_OPTIONS,
  POST_CURE_OPERATION_OPTIONS,
  formatPostCureMotorOperationLabel,
  resolvePostCureMotorOptions,
} from "../../../../../hooks/user/manufacturing/postCureConfig";
import type { PostCureFormState, PostCureMotorSession } from "../../../../../data/models/user/PostCureFormModel";
import type { PostCureAddedMotor } from "../../../../../hooks/user/manufacturing/postCureFlowConfig";
import { POST_CURE_FLOW_LABELS } from "../../../../../hooks/user/manufacturing/postCureFlowConfig";
import RemoveProcessButton from "../../../../components/common/RemoveProcessButton";
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
  const schemaFormLoaded = Boolean(formData.schemaFormLoaded);
  const showInhibitionFields = isPostCureInhibitionOperation(draftOperation);
  const motorCards = Array.isArray(addedMotors) ? addedMotors : [];
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const prevMotorCountRef = useRef(0);

  const motorOptions = useMemo(() => {
    const options = resolvePostCureMotorOptions(batch);
    return options.map((option) => ({
      ...option,
      disabled: option.value !== draftMotorId && usedMotorIds.includes(option.value),
    }));
  }, [batch, draftMotorId, usedMotorIds]);

  useEffect(() => {
    if (motorCards.length === 0) {
      setActiveMotorIndex(0);
      prevMotorCountRef.current = 0;
      return;
    }

    const prevCount = prevMotorCountRef.current;

    if (prevCount === 0) {
      // Initial load (e.g. continue filling) — always start on the first motor.
      setActiveMotorIndex(0);
    } else if (motorCards.length > prevCount) {
      // User added a motor — focus the newly added one.
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

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
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
        <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: theme.palette.primary, mb: 1.5 }}>
          {S.PANEL_TITLE}
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
            <CasePrepSelect
              label={S.MOTOR_ID_LABEL}
              value={draftMotorId}
              placeholder={S.MOTOR_ID_PLACEHOLDER}
              options={motorOptions}
              width={260}
              theme={theme}
              onChange={onDraftMotorIdChange}
            />

            <Box sx={flowBar.selectField?.(260)}>
              <Typography component="label" sx={flowBar.selectLabel}>
                {S.MOTOR_RECEIPT_DATE_LABEL}
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                <DatePicker
                  enableAccessibleFieldDOMStructure={false}
                  format="DD-MM-YYYY"
                  value={draftMotorReceiptDate ? dayjs(draftMotorReceiptDate, "DD-MM-YYYY") : null}
                  onChange={(picked) => onDraftMotorReceiptDateChange(picked?.format("DD-MM-YYYY") || "")}
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
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: theme.palette.primary, mb: 1.25 }}>
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

          {schemaFormLoaded ? (
            canAddMotor ? (
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={onAddMotor}
                  disabled={schemaLoading}
                  startIcon={schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
                >
                  {schemaLoading ? POST_CURE_FLOW_LABELS.schemaLoading : POST_CURE_FLOW_LABELS.addMotor}
                </Button>
              </Box>
            ) : null
          ) : canLoadForm ? (
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                size="small"
                onClick={onLoadForm}
                disabled={schemaLoading}
                startIcon={schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
              >
                {schemaLoading ? S.SCHEMA_LOADING : S.LOAD_FORM}
              </Button>
            </Box>
          ) : null}
        </Box>
      </Box>

      {schemaError ? (
        <Typography sx={{ fontSize: "0.82rem", color: POST_CURE_BRAND.danger, mb: 2 }}>{schemaError}</Typography>
      ) : null}

      {schemaFormLoaded && activeMotorEntry && activeMotorSession?.postCureSchema ? (
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
          ) : null}

          <Box
            key={`${activeMotorEntry.motorId}-${activeMotorSession.operation}-${activeMotorSession.inhibitorType}`}
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
                  {S.MOTOR_RECEIPT_DATE_LABEL}: {activeMotorEntry.motorReceiptDate || "—"}
                </Typography>
                <Typography sx={{ fontSize: "0.74rem", color: theme.palette.textSub, mt: 0.25 }}>
                  {S.OPERATION_LABEL}:{" "}
                  {formatPostCureMotorOperationLabel(activeMotorSession.operation, activeMotorSession.inhibitorType)}
                </Typography>
              </Box>
              <RemoveProcessButton
                onClick={() => onRemoveMotor(activeMotorEntry.motorId)}
                dangerColor={POST_CURE_BRAND.danger}
                tooltip={S.DELETE_MOTOR_TOOLTIP}
              />
            </Stack>

            <PostCureSchemaPanel
              schema={activeMotorSession.postCureSchema}
              formValues={activeMotorSession.schemaFormValues}
              savedSections={activeMotorSession.savedSections}
              subDepartmentId={subDepartmentId}
              batchId={batch?.batchId}
              motorId={activeMotorEntry.motorId}
              onChange={(values) =>
                onMotorSessionChange(activeMotorEntry.motorId, {
                  ...activeMotorSession,
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
