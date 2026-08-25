import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import { STATIC_TEST_FACILITY_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type { StaticTestFacilityFormState } from "../../../../../data/models/user/StaticTestFacilityFormModel";
import {
  createEmptyStfMotorSession,
  normalizeStfMotorSession,
  resolveStfNavigationMotors,
  type StfMotorStatusMeta,
  type StfMotorSubmissionStatus,
} from "../../../../../data/models/user/StaticTestFacilityFormModel";
import type { StfSubType } from "../../../../../hooks/user/qualityControl/stfFlowConfig";
import type {
  StfAddedMotor,
  StfMotorOption,
} from "../../../../../hooks/user/qualityControl/stfFlowConfig";
import {
  shouldShowStfBemMotorSelection,
  buildStfMotorNavGateHelpers,
  STF_FLOW_LABELS,
} from "../../../../../hooks/user/qualityControl/stfFlowConfig";
import type { PreviousStageApprovedUnits } from "../../../../../hooks/user/previousStageApproval";
import PremixStatusChip from "../../manufacturing/RawMaterial/components/PremixStatusChip";
import ViewStatusButton from "../../../../components/common/ViewStatusButton";
import FinalApprovalMotorDialog, {
  areAllMotorsApproved,
  buildFinalApprovalMotorRows,
} from "../../manufacturing/CasePreparation/components/FinalApprovalMotorDialog";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../components/custom/UserWorkflowStepPager";
import RemoveProcessButton from "../../../../components/common/RemoveProcessButton";
import STFFlowBar from "./STFFlowBar";
import StfMotorPanel from "./StfMotorPanel";
import AppTextField from "../../../../components/common/AppTextField";

const S = STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY;
const { rocketLaunch: RocketLaunchRoundedIcon, warning: WarningAmberRoundedIcon } =
  icons.user.qualityControl.staticTestFacility.form;

type StaticTestFacilityFormProps = {
  batch?: {
    batchId?: string;
    formId?: string | null;
    batchType?: string | null;
    subBatchType?: string | null;
  } | null;
  formData: StaticTestFacilityFormState;
  subDepartmentId?: number;
  selectedMotorType: StfSubType | "";
  motorCount: number | "";
  draftMotorIds: string[];
  draftBemNo: string;
  addedMotors: StfAddedMotor[];
  autoMotorEntries?: StfAddedMotor[];
  availableMotorOptions: StfMotorOption[];
  availableBemMotorOptions?: StfMotorOption[];
  maxMotorCount: number;
  approvedMotorsLoading?: boolean;
  motorStatusById?: Record<string, StfMotorStatusMeta>;
  getMotorStatus?: (motorId: string) => StfMotorSubmissionStatus;
  isMotorEditable?: (motorId: string) => boolean;
  previousStageGate?: PreviousStageApprovedUnits | null;
  isStfTestNoLocked?: (motorId: string) => boolean;
  actionLoading?: boolean;
  isEditMode?: boolean;
  flowBarTheme: any;
  onMotorTypeChange: (value: string) => void;
  onMotorCountChange: (count: number | "") => void;
  onDraftMotorIdChange: (index: number, motorId: string) => void;
  onDraftBemNoChange: (value: string) => void;
  onLoadStfForm: () => void;
  onAddMotors: () => void;
  onFormValuesChange: (
    motorId: string,
    values: import("../../../../../data/models/user/StfMotorDataModel").StfMotorData,
  ) => void;
  onStfTestNoChange?: (motorId: string, stfTestNo: string) => void;
  onRemoveMotor?: (motorId: string) => void;
  onSaveMotorDraft?: (motorId: string) => void;
  onSubmitMotor?: (motorId: string) => void;
  theme: any;
};

const StaticTestFacilityForm = ({
  batch,
  formData,
  subDepartmentId,
  selectedMotorType,
  motorCount,
  draftMotorIds,
  draftBemNo,
  addedMotors,
  autoMotorEntries,
  availableMotorOptions,
  availableBemMotorOptions = [],
  maxMotorCount,
  approvedMotorsLoading = false,
  motorStatusById = {},
  getMotorStatus,
  isMotorEditable,
  previousStageGate = null,
  isStfTestNoLocked,
  actionLoading = false,
  isEditMode = false,
  flowBarTheme,
  onMotorTypeChange,
  onMotorCountChange,
  onDraftMotorIdChange,
  onDraftBemNoChange,
  onLoadStfForm,
  onAddMotors,
  onFormValuesChange,
  onStfTestNoChange,
  onRemoveMotor,
  onSaveMotorDraft,
  onSubmitMotor,
  theme,
}: StaticTestFacilityFormProps) => {
  const BRAND = STATIC_TEST_FACILITY_BRAND;
  const stfTheme = theme.qualityControl?.staticTestFacility;
  const statusConfig = stfTheme?.details?.bannerStatusConfig ?? theme.batchList?.statusConfig ?? {};
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const [finalApprovalOpen, setFinalApprovalOpen] = useState(false);
  const prevMotorCountRef = useRef(0);
  const formSessionKey = `${batch?.batchId ?? ""}:${batch?.formId ?? "new"}`;

  const motorCards = useMemo(
    () => resolveStfNavigationMotors(addedMotors, autoMotorEntries),
    [addedMotors, autoMotorEntries],
  );

  const resolveMotorStatus = useCallback(
    (motorId: string) =>
      getMotorStatus?.(motorId) ??
      motorStatusById[motorId]?.motorSubmissionStatus ??
      "TO_BE_INITIATED",
    [getMotorStatus, motorStatusById],
  );

  const stfMotorNavGate = useMemo(
    () =>
      buildStfMotorNavGateHelpers(motorCards, previousStageGate, resolveMotorStatus, "ACEM", {
        previousStage: S.PREVIOUS_STAGE_MOTOR_TAB_DISABLED,
        sequential: STRINGS.MANUFACTURING.SEQUENTIAL_UNIT_TAB_DISABLED,
      }),
    [motorCards, previousStageGate, resolveMotorStatus],
  );

  const hasMotors = motorCards.length > 0;
  const showBemFlowBar = shouldShowStfBemMotorSelection(batch?.batchType, batch?.subBatchType);

  const activeMotorTypes = useMemo(() => {
    const types = new Set(motorCards.map((motor) => motor.subType));
    return Array.from(types);
  }, [motorCards]);

  const motorTypeLabel =
    activeMotorTypes.length > 1
      ? "Main Motor + BEM"
      : activeMotorTypes[0] === "MAIN_MOTOR"
        ? "Main Motor"
        : activeMotorTypes[0] === "BEM"
          ? "BEM"
          : selectedMotorType === "MAIN_MOTOR"
            ? "Main Motor"
            : selectedMotorType === "BEM"
              ? "BEM"
              : "";

  useEffect(() => {
    setActiveMotorIndex(0);
    prevMotorCountRef.current = 0;
  }, [formSessionKey]);

  const isStfTabEnabled = (entry?: StfAddedMotor | null, index?: number) => {
    if (!entry) return false;
    if (typeof index === "number") return stfMotorNavGate.isStfMotorTabEnabled(index);
    const resolvedIndex = motorCards.findIndex((motor) => motor.motorId === entry.motorId);
    return resolvedIndex >= 0 ? stfMotorNavGate.isStfMotorTabEnabled(resolvedIndex) : false;
  };

  useEffect(() => {
    if (motorCards.length === 0) {
      setActiveMotorIndex(0);
      prevMotorCountRef.current = 0;
      return;
    }

    const prevCount = prevMotorCountRef.current;
    const firstEnabled = motorCards.findIndex((_, index) =>
      stfMotorNavGate.isStfMotorTabEnabled(index),
    );

    if (prevCount === 0) {
      setActiveMotorIndex(firstEnabled >= 0 ? firstEnabled : 0);
    } else if (motorCards.length > prevCount) {
      setActiveMotorIndex(motorCards.length - 1);
    } else {
      setActiveMotorIndex((prev) => {
        const current = motorCards[prev];
        if (current && stfMotorNavGate.isStfMotorTabEnabled(prev)) {
          return Math.min(prev, motorCards.length - 1);
        }
        return firstEnabled >= 0 ? firstEnabled : Math.min(prev, motorCards.length - 1);
      });
    }
    prevMotorCountRef.current = motorCards.length;
  }, [motorCards, stfMotorNavGate]);

  const activeMotorEntry = useMemo(
    () => (motorCards.length > 0 ? motorCards[activeMotorIndex] : null),
    [motorCards, activeMotorIndex],
  );

  const activeMotorSession = useMemo(() => {
    if (!activeMotorEntry) return null;
    const found = (formData.motors ?? []).find(
      (motor) => motor.motorId === activeMotorEntry.motorId,
    );
    return found ? normalizeStfMotorSession(found) : createEmptyStfMotorSession(activeMotorEntry.motorId, activeMotorEntry.subType);
  }, [activeMotorEntry, formData.motors]);

  const activeMotorId = activeMotorEntry?.motorId ?? "";
  const activeMotorStatus = (getMotorStatus?.(activeMotorId) ??
    motorStatusById[activeMotorId]?.motorSubmissionStatus ??
    "TO_BE_INITIATED") as StfMotorSubmissionStatus;
  const activeMotorPriorEnabled = isStfTabEnabled(activeMotorEntry, activeMotorIndex);
  const activeMotorLocked = activeMotorId
    ? !activeMotorPriorEnabled || !(isMotorEditable?.(activeMotorId) ?? true)
    : false;
  const activeStfTestNoLocked = activeMotorId ? Boolean(isStfTestNoLocked?.(activeMotorId)) : false;
  const canRemoveActiveMotor =
    activeMotorEntry?.subType === "BEM" && activeMotorStatus === "TO_BE_INITIATED";
  const isCurrentMotorFormReady = Boolean(activeMotorSession?.formLoaded);

  const finalApprovalRows = useMemo(
    () =>
      buildFinalApprovalMotorRows(
        motorStatusById as Record<string, { motorSubmissionStatus: string }>,
        motorCards.map((m) => m.motorId),
      ),
    [motorCards, motorStatusById],
  );
  const allMotorsApproved = areAllMotorsApproved(finalApprovalRows);

  const navPalette = {
    primary: BRAND.primary,
    primaryLight: BRAND.primaryLight,
    border: BRAND.border,
    surface: BRAND.surface,
    textSub: BRAND.textSub,
    text: BRAND.text,
  };

  const motorTabs = useMemo<UserWorkflowNavTab[]>(
    () =>
      motorCards.map((entry) => {
        const status = (getMotorStatus?.(entry.motorId) ??
          motorStatusById[entry.motorId]?.motorSubmissionStatus ??
          "TO_BE_INITIATED") as StfMotorSubmissionStatus;
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
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      {isEditMode ? (
        <Box
          sx={{
            mb: 2,
            px: 1.75,
            py: 1.1,
            borderRadius: 2,
            background: alpha(BRAND.danger, 0.05),
            border: `1.5px solid ${alpha(BRAND.danger, 0.2)}`,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <WarningAmberRoundedIcon sx={{ fontSize: 18, color: BRAND.danger }} />
          <Typography sx={{ fontSize: "0.8rem", color: BRAND.danger, fontWeight: 600 }}>
            {S.EDIT_MODE_BANNER}
          </Typography>
        </Box>
      ) : null}

      <Box sx={stfTheme?.panel?.header ?? { mb: 2.5 }}>
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
                background: `linear-gradient(135deg,${BRAND.primary},${BRAND.primaryLight})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 14px ${BRAND.primary}40`,
              }}
            >
              <RocketLaunchRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: BRAND.text }}>
                {S.TITLE}
              </Typography>
              <Typography sx={{ fontSize: "0.74rem", color: BRAND.textSub, mt: 0.2 }}>
                {S.SUBTITLE}
                {batch?.batchId ? ` · ${batch.batchId}` : ""}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" gap={1}>
            {motorTypeLabel ? (
              <Chip
                label={motorTypeLabel}
                size="small"
                sx={{
                  height: 26,
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  background: "rgba(27,79,114,0.1)",
                  color: BRAND.primary,
                  border: `1px solid ${BRAND.primary}44`,
                }}
              />
            ) : null}
          </Stack>
        </Stack>
      </Box>

      {/* Subscale: add BEM motors via dropdown. Main: batch motors are seeded into navigation. */}
      {showBemFlowBar ? (
        <STFFlowBar
          key={`${motorCards.map((motor) => motor.motorId).join("|")}-${selectedMotorType}`}
          selectedMotorType={selectedMotorType || "BEM"}
          motorCount={motorCount}
          draftMotorIds={draftMotorIds}
          draftBemNo={draftBemNo}
          addedMotors={addedMotors}
          availableMotorOptions={availableMotorOptions}
          availableBemMotorOptions={availableBemMotorOptions}
          maxMotorCount={maxMotorCount}
          approvedMotorsLoading={approvedMotorsLoading}
          lockMotorTypeToBem
          onMotorTypeChange={onMotorTypeChange}
          onMotorCountChange={onMotorCountChange}
          onDraftMotorIdChange={onDraftMotorIdChange}
          onDraftBemNoChange={onDraftBemNoChange}
          onLoadForm={onLoadStfForm}
          onAddMotors={onAddMotors}
          theme={flowBarTheme}
        />
      ) : null}

      {hasMotors && activeMotorEntry ? (
        <Stack spacing={1.25} sx={{ mt: 2 }}>
          <UserWorkflowNavPanel palette={navPalette}>
            <UserWorkflowTabNav
              title={S.MOTOR_NAV_TITLE}
              hint={S.MOTOR_NAV_HINT}
              tabs={motorTabs}
              activeIndex={activeMotorIndex}
              onActiveIndexChange={setActiveMotorIndex}
              isTabDisabled={(_, index) => !stfMotorNavGate.isStfMotorTabEnabled(index)}
              tabTooltip={(_, index) => stfMotorNavGate.getStfMotorTabTooltip(index)}
              palette={navPalette}
              showStepArrows
              wrapTabs
              titleEndAdornment={
                <Chip
                  label={`${S.BATCH_MOTOR_COUNT_LABEL}: ${motorCards.length}`}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    height: 24,
                    background: BRAND.primary,
                    color: "#fff",
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              }
            />
          </UserWorkflowNavPanel>

          <Stack direction="row" justifyContent="flex-end" spacing={1} flexWrap="wrap">
            <Button
              variant="outlined"
              size="small"
              disabled={actionLoading || activeMotorLocked || !isCurrentMotorFormReady}
              onClick={() => onSaveMotorDraft?.(activeMotorEntry.motorId)}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              {S.SAVE_MOTOR_DRAFT(activeMotorEntry.motorId)}
            </Button>
            <Button
              variant="contained"
              size="small"
              disabled={actionLoading || activeMotorLocked || !isCurrentMotorFormReady}
              onClick={() => onSubmitMotor?.(activeMotorEntry.motorId)}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              {S.SUBMIT_MOTOR(activeMotorEntry.motorId)}
            </Button>
            <ViewStatusButton
              disabled={actionLoading}
              onClick={() => setFinalApprovalOpen(true)}
              label={S.VIEW_STATUS}
            />
            {canRemoveActiveMotor ? (
              <RemoveProcessButton
                onClick={() => onRemoveMotor?.(activeMotorEntry.motorId)}
                dangerColor={BRAND.danger}
                tooltip={S.DELETE_MOTOR_TOOLTIP}
              />
            ) : null}
          </Stack>

          <Box
            sx={
              stfTheme?.panel?.motorCard ?? {
                borderRadius: 2,
                border: `1px solid ${BRAND.border}`,
                p: 2,
              }
            }
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ sm: "center" }}
              justifyContent="space-between"
              gap={1}
              mb={1.25}
            >
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, color: BRAND.primary }}>
                  {activeMotorEntry.subType === "BEM"
                    ? STF_FLOW_LABELS.bemCardTitle
                    : STF_FLOW_LABELS.motorCardTitle}{" "}
                  — {activeMotorEntry.motorId}
                </Typography>
                <PremixStatusChip
                  status={activeMotorStatus as any}
                  statusConfig={statusConfig}
                  variant="embedded"
                />
              </Stack>
            </Stack>

            {activeMotorLocked ? (
              <Box
                sx={{
                  mb: 1.25,
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 1.5,
                  border: `1px solid ${BRAND.border}`,
                  bgcolor: BRAND.surface,
                }}
              >
                <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, fontWeight: 600 }}>
                  {!activeMotorPriorEnabled
                    ? STRINGS.MANUFACTURING.PREVIOUS_STAGE_MOTOR_TAB_DISABLED
                    : activeMotorStatus === "APPROVED"
                      ? S.MOTOR_LOCKED_APPROVED
                      : S.MOTOR_LOCKED_WAITING}
                </Typography>
              </Box>
            ) : null}

            {activeMotorStatus === "REJECTED" && motorStatusById[activeMotorId]?.rejectionReason ? (
              <Alert severity="error" sx={{ fontSize: "0.78rem", mb: 1.25 }}>
                {motorStatusById[activeMotorId]?.rejectionReason}
              </Alert>
            ) : null}

            <Box sx={{ mb: 1.5, maxWidth: 360 }}>
              <AppTextField
                label={S.STF_TEST_NO_LABEL}
                value={activeMotorSession?.stfTestNo || ""}
                placeholder={S.STF_TEST_NO_PLACEHOLDER}
                disabled={actionLoading || activeMotorLocked || activeStfTestNoLocked}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (!activeMotorEntry?.motorId) return;
                  onStfTestNoChange?.(activeMotorEntry.motorId, e.target.value);
                }}
              />
            </Box>

            {activeMotorSession ? (
              <Box sx={activeMotorLocked ? { pointerEvents: "none", opacity: 0.72 } : undefined}>
                <StfMotorPanel
                  value={activeMotorSession.stfData}
                  onChange={(next) => onFormValuesChange(activeMotorSession.motorId, next)}
                  disabled={actionLoading || activeMotorLocked}
                  theme={theme}
                  subDeptSlug="static-test-facility"
                  subDepartmentId={subDepartmentId}
                  batchId={batch?.batchId}
                  motorId={activeMotorSession.motorId}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  borderRadius: 2,
                  border: `1px dashed ${BRAND.border}`,
                  px: 2,
                  py: 3,
                  textAlign: "center",
                }}
              >
                <Typography sx={{ fontSize: "0.8rem", color: BRAND.textSub, fontWeight: 600 }}>
                  {S.FORM_NOT_LOADED}
                </Typography>
              </Box>
            )}
          </Box>
        </Stack>
      ) : null}

      <FinalApprovalMotorDialog
        open={finalApprovalOpen}
        rows={finalApprovalRows}
        statusConfig={statusConfig}
        allMotorsApproved={allMotorsApproved}
        hideConfirm
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
      />
    </Box>
  );
};

export default StaticTestFacilityForm;
