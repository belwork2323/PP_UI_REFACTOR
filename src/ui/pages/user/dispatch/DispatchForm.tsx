import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { icons } from "../../../../app/theme/icons";
import { STRINGS } from "../../../../app/config/strings";
import getDispatchTheme from "../../../../app/theme/custom_themes/user/dispatch/dispatch_theme";
import {
  isDispatchMotorSetupReady,
  type DispatchFormState,
  type DispatchMotorStatusMeta,
  type DispatchMotorSubmissionStatus,
} from "../../../../data/models/user/DispatchFormModel";
import type {
  DispatchAddedMotor,
  DispatchMotorOption,
  DispatchSharedSetup,
} from "../../../../hooks/user/dispatch/dispatchFlowConfig";
import { DISPATCH_FLOW_LABELS } from "../../../../hooks/user/dispatch/dispatchFlowConfig";
import {
  buildMotorNavGateHelpers,
  type PreviousStageApprovedUnits,
} from "../../../../hooks/user/previousStageApproval";
import PremixStatusChip from "../manufacturing/RawMaterial/components/PremixStatusChip";
import FinalApprovalMotorDialog, {
  areAllMotorsApproved,
  buildFinalApprovalMotorRows,
} from "../manufacturing/CasePreparation/components/FinalApprovalMotorDialog";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../components/custom/UserWorkflowStepPager";
import DispatchFlowBar from "./DispatchFlowBar";
import DispatchMotorDetailsCard from "./DispatchMotorDetailsCard";

const S = STRINGS.DISPATCH;
const { localShipping: LocalShippingRoundedIcon } = icons.user.dispatch.form;

type DispatchFormProps = {
  batch?: { batchId?: string; formId?: string | null } | null;
  formData: DispatchFormState;
  draftMotorId: string;
  addedMotors: DispatchAddedMotor[];
  autoMotorEntries?: DispatchAddedMotor[];
  motorStatusById?: Record<string, DispatchMotorStatusMeta>;
  getMotorStatus?: (motorId: string) => DispatchMotorSubmissionStatus;
  isMotorEditable?: (motorId: string) => boolean;
  previousStageGate?: PreviousStageApprovedUnits | null;
  actionLoading?: boolean;
  subDepartmentId?: number;
  isEditMode?: boolean;
  schemaLoading?: boolean;
  schemaError?: string | null;
  flowBarTheme: any;
  availableMotors?: DispatchMotorOption[];
  onSetupChange: <K extends keyof DispatchSharedSetup>(
    field: K,
    value: DispatchSharedSetup[K],
  ) => void;
  onDraftMotorIdChange: (value: string) => void;
  onLoadDispatchForm: (val: string) => void;
  onFormValuesChange: (motorId: string, values: any) => void;
  onSaveMotorDraft?: (motorId: string) => void;
  onSubmitMotor?: (motorId: string) => void;
  onSubmitForFinalApproval?: () => void;
  theme: any;
};

const DispatchForm: React.FC<DispatchFormProps> = ({
  batch,
  formData,
  draftMotorId,
  addedMotors = [],
  autoMotorEntries,
  motorStatusById = {},
  getMotorStatus,
  isMotorEditable,
  previousStageGate = null,
  actionLoading = false,
  subDepartmentId,
  isEditMode = false,
  schemaLoading = false,
  schemaError = null,
  flowBarTheme,
  availableMotors = [],
  onSetupChange,
  onDraftMotorIdChange,
  onLoadDispatchForm,
  onFormValuesChange,
  onSaveMotorDraft,
  onSubmitMotor,
  onSubmitForFinalApproval,
  theme,
}) => {
  const dispatchTheme = getDispatchTheme(theme);
  const panel = dispatchTheme.panel;
  const brand = dispatchTheme.brand;
  const statusConfig = dispatchTheme.details?.bannerStatusConfig ?? {};

  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const [finalApprovalOpen, setFinalApprovalOpen] = useState(false);
  const prevMotorCountRef = useRef(0);
  const formSessionKey = `${batch?.batchId ?? ""}:${batch?.formId ?? "new"}`;

  const motorCards = useMemo(() => {
    const autoCards = Array.isArray(autoMotorEntries)
      ? autoMotorEntries.filter((entry) => Boolean(entry?.motorId))
      : [];
    if (autoCards.length > 0) return autoCards;
    if (availableMotors.length > 0) {
      return availableMotors.map((motor) => ({ motorId: motor.motorId }));
    }
    return Array.isArray(addedMotors) ? addedMotors : [];
  }, [addedMotors, autoMotorEntries, availableMotors]);

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

  const activeMotorData = useMemo(() => {
    if (!activeMotorEntry) return null;
    return (formData.motors ?? []).find((m) => m.motorId === activeMotorEntry.motorId) ?? null;
  }, [activeMotorEntry, formData.motors]);

  const isCurrentMotorSetupReady = isDispatchMotorSetupReady(activeMotorData);
  const activeMotorId = activeMotorEntry?.motorId ?? "";
  const activeMotorStatus = (getMotorStatus?.(activeMotorId) ??
    motorStatusById[activeMotorId]?.motorSubmissionStatus ??
    "TO_BE_INITIATED") as DispatchMotorSubmissionStatus;
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
    primary: brand.primary,
    primaryLight: brand.primaryLight,
    border: brand.border,
    surface: brand.surface,
    textSub: brand.textSub,
    text: brand.text,
  };

  const motorTabs = useMemo<UserWorkflowNavTab[]>(
    () =>
      motorCards.map((entry) => {
        const status = (getMotorStatus?.(entry.motorId) ??
          motorStatusById[entry.motorId]?.motorSubmissionStatus ??
          "TO_BE_INITIATED") as DispatchMotorSubmissionStatus;
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

  const handleTabChange = (index: number) => {
    setActiveMotorIndex(index);
    const selected = motorCards[index];
    if (selected) onDraftMotorIdChange(selected.motorId);
  };

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      {isEditMode ? (
        <Box
          sx={{
            mb: 2.5,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            background: "rgba(192,57,43,0.05)",
            border: "1.5px solid rgba(192,57,43,0.2)",
          }}
        >
          <Typography sx={{ fontSize: "0.8rem", color: brand.danger, fontWeight: 600 }}>
            {S.EDIT_MODE_BANNER}
          </Typography>
        </Box>
      ) : null}

      <Box sx={panel.header}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          gap={1.5}
        >
          <Stack direction="row" alignItems="center" gap={1.5} flex={1}>
            <Box sx={panel.headerIcon}>
              <LocalShippingRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={panel.headerTitle}>{S.TITLE}</Typography>
              <Typography sx={panel.headerSubtitle}>
                {S.SUBTITLE}
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

      {motorCards.length > 0 && activeMotorEntry ? (
        <Stack spacing={1.25}>
          <UserWorkflowNavPanel palette={navPalette}>
            <UserWorkflowTabNav
              title={S.MOTOR_NAV_TITLE}
              hint={S.MOTOR_NAV_HINT}
              tabs={motorTabs}
              activeIndex={activeMotorIndex}
              onActiveIndexChange={handleTabChange}
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
                    background: brand.primary,
                    color: "#fff",
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              }
            />
          </UserWorkflowNavPanel>

          <Box sx={panel.motorCard}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ sm: "center" }}
              justifyContent="space-between"
              gap={1}
              mb={1.5}
            >
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, color: brand.primary }}>
                  {DISPATCH_FLOW_LABELS.motorCardTitle} — {activeMotorEntry.motorId}
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
                  disabled={actionLoading || activeMotorLocked || !isCurrentMotorSetupReady}
                  onClick={() => onSaveMotorDraft?.(activeMotorEntry.motorId)}
                >
                  {S.SAVE_MOTOR_DRAFT}
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  disabled={actionLoading || activeMotorLocked || !isCurrentMotorSetupReady}
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
                  border: `1px solid ${brand.border}`,
                  bgcolor: brand.surface,
                }}
              >
                <Typography sx={{ fontSize: "0.72rem", color: brand.textSub, fontWeight: 600 }}>
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

            {!isCurrentMotorSetupReady ? (
              <DispatchFlowBar
                setup={formData}
                draftMotorId={draftMotorId || activeMotorEntry.motorId}
                usedMotorIds={(formData.motors ?? [])
                  .filter((motor) => isDispatchMotorSetupReady(motor))
                  .map((m) => m.motorId)}
                hasMotors={(formData.motors ?? []).some((m) => isDispatchMotorSetupReady(m))}
                schemaLoading={schemaLoading}
                onSetupChange={onSetupChange}
                onLoadForm={() => onLoadDispatchForm(activeMotorEntry.motorId)}
                theme={flowBarTheme}
                dispatchTheme={dispatchTheme}
              />
            ) : (
              formData.dispatchSchema &&
              activeMotorData && (
                <Box sx={activeMotorLocked ? { pointerEvents: "none", opacity: 0.72 } : undefined}>
                  <DispatchMotorDetailsCard
                    motor={activeMotorData}
                    schema={formData.dispatchSchema}
                    subDepartmentId={subDepartmentId}
                    batchId={batch?.batchId}
                    schemaLoading={schemaLoading}
                    schemaError={schemaError}
                    theme={theme}
                    readOnly={activeMotorLocked}
                    onFormValuesChange={(values) =>
                      onFormValuesChange(activeMotorEntry.motorId, values)
                    }
                  />
                </Box>
              )
            )}
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

export default DispatchForm;
