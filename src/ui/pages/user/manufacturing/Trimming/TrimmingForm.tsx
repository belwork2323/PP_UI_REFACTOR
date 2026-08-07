import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import { TRIMMING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/trimming_theme";
import type {
  TrimmingFormState,
  TrimmingMotorSession,
  TrimmingMotorStatusMeta,
  TrimmingMotorSubmissionStatus,
} from "../../../../../data/models/user/TrimmingFormModel";
import type { TrimmingAddedMotor } from "../../../../../hooks/user/manufacturing/trimmingFlowConfig";
import {
  buildMotorNavGateHelpers,
  type PreviousStageApprovedUnits,
} from "../../../../../hooks/user/previousStageApproval";
import PremixStatusChip from "../RawMaterial/components/PremixStatusChip";
import FinalApprovalMotorDialog, {
  areAllMotorsApproved,
  buildFinalApprovalMotorRows,
} from "../CasePreparation/components/FinalApprovalMotorDialog";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../components/custom/UserWorkflowStepPager";
import { TrimmingCommonTable } from "./TrimmingCommonTable";

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
  addedMotors: TrimmingAddedMotor[];
  autoMotorEntries?: TrimmingAddedMotor[];
  motorStatusById?: Record<string, TrimmingMotorStatusMeta>;
  getMotorStatus?: (motorId: string) => TrimmingMotorSubmissionStatus;
  isMotorEditable?: (motorId: string) => boolean;
  previousStageGate?: PreviousStageApprovedUnits | null;
  actionLoading?: boolean;
  onMotorSessionChange: (motorId: string, next: TrimmingMotorSession) => void;
  onSaveMotorDraft?: (motorId: string) => void;
  onSubmitMotor?: (motorId: string) => void;
  onSubmitForFinalApproval?: () => void;
  theme: any;
};

const TrimmingForm = ({
  batch,
  formData,
  addedMotors,
  autoMotorEntries,
  motorStatusById = {},
  getMotorStatus,
  isMotorEditable,
  previousStageGate = null,
  actionLoading = false,
  onMotorSessionChange,
  onSaveMotorDraft,
  onSubmitMotor,
  onSubmitForFinalApproval,
  theme,
}: TrimmingFormProps) => {
  const BRAND = TRIMMING_BRAND;
  const primaryColor = theme.palette.primary;

  const motorCards = useMemo(() => {
    const autoCards = Array.isArray(autoMotorEntries)
      ? autoMotorEntries.filter((entry) => Boolean(entry?.motorId))
      : [];
    return autoCards.length > 0 ? autoCards : Array.isArray(addedMotors) ? addedMotors : [];
  }, [addedMotors, autoMotorEntries]);

  const motorNavGate = useMemo(() => {
    const resolveMotorStatus = (motorId: string) =>
      getMotorStatus?.(motorId) ??
      motorStatusById[motorId]?.motorSubmissionStatus ??
      "TO_BE_INITIATED";
    return buildMotorNavGateHelpers(motorCards, previousStageGate, resolveMotorStatus, {
      previousStage: STRINGS.MANUFACTURING.PREVIOUS_STAGE_MOTOR_TAB_DISABLED,
      sequential: STRINGS.MANUFACTURING.SEQUENTIAL_UNIT_TAB_DISABLED,
    });
  }, [motorCards, previousStageGate, getMotorStatus, motorStatusById]);

  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const [finalApprovalOpen, setFinalApprovalOpen] = useState(false);
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
    const firstEnabled = motorCards.findIndex((_, index) => motorNavGate.isMotorTabEnabled(index));

    if (prevCount === 0) {
      setActiveMotorIndex(firstEnabled >= 0 ? firstEnabled : 0);
    } else if (motorCards.length > prevCount) {
      setActiveMotorIndex(motorCards.length - 1);
    } else {
      setActiveMotorIndex((prev) => {
        const current = motorCards[prev];
        if (current && motorNavGate.isMotorWorkflowEnabled(current.motorId)) {
          return Math.min(prev, motorCards.length - 1);
        }
        return firstEnabled >= 0
          ? firstEnabled
          : Math.min(prev, motorCards.length - 1);
      });
    }

    prevMotorCountRef.current = motorCards.length;
  }, [motorCards, motorNavGate]);

  const activeMotorEntry = useMemo(
    () => (motorCards.length > 0 ? motorCards[activeMotorIndex] : null),
    [motorCards, activeMotorIndex],
  );

  const activeMotorSession = useMemo(() => {
    if (!activeMotorEntry) return null;
    return (
      (formData.motors ?? []).find((motor) => motor.motorId === activeMotorEntry.motorId) ?? null
    );
  }, [activeMotorEntry, formData.motors]);

  const statusConfig = theme?.manufacturing?.trimming?.details?.bannerStatusConfig ?? {};
  const activeMotorId = activeMotorEntry?.motorId ?? "";
  const activeMotorStatus = (getMotorStatus?.(activeMotorId) ??
    motorStatusById[activeMotorId]?.motorSubmissionStatus ??
    "TO_BE_INITIATED") as TrimmingMotorSubmissionStatus;
  const activeMotorPriorEnabled = motorNavGate.isMotorWorkflowEnabled(activeMotorId);
  const activeMotorLocked = activeMotorId
    ? !activeMotorPriorEnabled || !(isMotorEditable?.(activeMotorId) ?? true)
    : false;

  const finalApprovalRows = useMemo(
    () =>
      buildFinalApprovalMotorRows(
        motorStatusById as Record<string, { motorSubmissionStatus: string }>,
        motorCards.map((m) => m.motorId),
      ),
    [motorCards, motorStatusById],
  );
  const allMotorsApproved = areAllMotorsApproved(finalApprovalRows);
  const canOpenFinalApproval = Boolean(batch?.formId);

  const navPalette = {
    primary: theme.palette.primary,
    primaryLight: theme.palette.primaryLight,
    border: theme.palette.border,
    surface: theme.palette.surface,
    textSub: theme.palette.textSub,
    text: theme.palette.text,
  };

  const motorTabs = useMemo<UserWorkflowNavTab[]>(
    () =>
      motorCards.map((entry) => {
        const status = (getMotorStatus?.(entry.motorId) ??
          motorStatusById[entry.motorId]?.motorSubmissionStatus ??
          "TO_BE_INITIATED") as TrimmingMotorSubmissionStatus;
        return {
          id: entry.motorId,
          label: entry.motorId,
          endAdornment: (
            <PremixStatusChip
              status={status as any}
              statusConfig={statusConfig}
              showIcon={false}
              variant="embedded"
              onAccent={entry.motorId === activeMotorId}
            />
          ),
        };
      }),
    [activeMotorId, getMotorStatus, motorCards, motorStatusById, statusConfig],
  );

  return (
    <Box>
      <Box
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${theme.palette.border}`,
          background: theme.palette.surface ?? BRAND.surface,
          px: 2,
          py: 1.75,
          mb: 2.5,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          gap={1.5}
        >
          <Stack direction="row" alignItems="center" gap={1.5} flex={1}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                background: `linear-gradient(135deg, ${theme.palette.primary ?? BRAND.tr}, ${theme.palette.primaryLight ?? BRAND.trLight})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary ?? BRAND.tr, 0.28)}`,
              }}
            >
              <StraightenRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "0.98rem",
                  color: theme.palette.text ?? BRAND.text,
                }}
              >
                {S.FORM_TITLE}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  color: theme.palette.textSub ?? BRAND.textSub,
                  mt: 0.15,
                }}
              >
                {S.FORM_SUBTITLE}
                {batch?.batchId ? ` · ${batch.batchId}` : ""}
              </Typography>
            </Box>
          </Stack>

          {motorCards.length > 0 ? (
            <Button
              variant="contained"
              size="small"
              disabled={actionLoading || !canOpenFinalApproval}
              onClick={() => setFinalApprovalOpen(true)}
            >
              {S.SUBMIT_FOR_FINAL_APPROVAL}
            </Button>
          ) : null}
        </Stack>
      </Box>

      {motorCards.length > 0 && activeMotorEntry && activeMotorSession ? (
        <Stack spacing={1.25}>
          <UserWorkflowNavPanel palette={navPalette}>
            <UserWorkflowTabNav
              title={S.MOTOR_NAV_TITLE}
              hint={S.MOTOR_NAV_HINT}
              tabs={motorTabs}
              activeIndex={activeMotorIndex}
              onActiveIndexChange={setActiveMotorIndex}
              isTabDisabled={(_, index) => !motorNavGate.isMotorTabEnabled(index)}
              tabTooltip={(_, index) => motorNavGate.getMotorTabTooltip(index)}
              palette={navPalette}
              showStepArrows
              titleEndAdornment={
                <Chip
                  label={`${S.BATCH_MOTOR_COUNT_LABEL}: ${motorCards.length}`}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    height: 24,
                    background: theme.palette.primary ?? BRAND.primary,
                    color: "#fff",
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              }
            />
          </UserWorkflowNavPanel>

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
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ sm: "center" }}
              justifyContent="space-between"
              gap={1}
              mb={1}
            >
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: primaryColor }}>
                  {S.MOTOR_CARD_TITLE} — {activeMotorEntry.motorId}
                </Typography>
                <PremixStatusChip
                  status={activeMotorStatus as any}
                  statusConfig={statusConfig}
                  variant="embedded"
                />
              </Stack>

              <Stack direction="row" gap={1} flexShrink={0} alignItems="center">
                <Button
                  variant="outlined"
                  size="small"
                  disabled={actionLoading || activeMotorLocked}
                  onClick={() => onSaveMotorDraft?.(activeMotorEntry.motorId)}
                >
                  {S.SAVE_MOTOR_DRAFT}
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  disabled={actionLoading || activeMotorLocked}
                  onClick={() => onSubmitMotor?.(activeMotorEntry.motorId)}
                >
                  {S.SUBMIT_MOTOR}
                </Button>
              </Stack>
            </Stack>

            {activeMotorLocked ? (
              <Box
                sx={{
                  mb: 1.25,
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 1.5,
                  border: `1px solid ${theme.palette.border}`,
                  bgcolor: theme.palette.background ?? BRAND.surface,
                }}
              >
                <Typography sx={{ fontSize: "0.72rem", color: theme.palette.textSub, fontWeight: 600 }}>
                  {!activeMotorPriorEnabled
                    ? STRINGS.MANUFACTURING.PREVIOUS_STAGE_MOTOR_TAB_DISABLED
                    : activeMotorStatus === "APPROVED"
                      ? S.MOTOR_LOCKED_APPROVED
                      : S.MOTOR_LOCKED_WAITING}
                </Typography>
              </Box>
            ) : null}

            {activeMotorStatus === "REJECTED" &&
            motorStatusById[activeMotorId]?.rejectionReason ? (
              <Alert severity="error" sx={{ fontSize: "0.78rem", mb: 1.25 }}>
                {motorStatusById[activeMotorId]?.rejectionReason}
              </Alert>
            ) : null}

            <Typography sx={{ fontSize: "0.74rem", color: theme.palette.textSub ?? BRAND.textSub, mb: 1.25 }}>
              {S.MOTOR_STAGE_LABEL}: {activeMotorEntry.motorStage || activeMotorSession.motorStage || "—"}
            </Typography>

            <TrimmingCommonTable
              activeMotorSession={activeMotorSession}
              activeMotorEntry={activeMotorEntry}
              onMotorSessionChange={onMotorSessionChange}
              readOnly={activeMotorLocked}
              theme={theme}
            />
          </Box>
        </Stack>
      ) : null}

      <FinalApprovalMotorDialog
        open={finalApprovalOpen}
        rows={finalApprovalRows}
        statusConfig={statusConfig}
        allMotorsApproved={allMotorsApproved}
        confirmDisabled={actionLoading}
        copy={{
          title: S.FINAL_APPROVAL_DIALOG_TITLE,
          info: S.FINAL_APPROVAL_DIALOG_INFO,
          proceed: S.FINAL_APPROVAL_PROCEED,
          close: S.FINAL_APPROVAL_CLOSE,
          notReady: S.FINAL_APPROVAL_NOT_READY,
          colMotor: S.FINAL_APPROVAL_COL_MOTOR,
          colType: S.FINAL_APPROVAL_COL_TYPE,
          colStatus: S.FINAL_APPROVAL_COL_STATUS,
        }}
        onClose={() => setFinalApprovalOpen(false)}
        onProceed={async () => {
          setFinalApprovalOpen(false);
          await onSubmitForFinalApproval?.();
        }}
      />
    </Box>
  );
};

export default TrimmingForm;
