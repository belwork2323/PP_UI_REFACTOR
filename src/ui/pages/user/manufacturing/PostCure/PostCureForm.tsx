import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import { POST_CURE_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/postCure_theme";
import {
  POST_CURE_INHIBITOR_TYPE_OPTIONS,
} from "../../../../../hooks/user/manufacturing/postCureConfig";
import type {
  PostCureFormState,
  PostCureMotorSession,
  PostCureMotorStatusMeta,
  PostCureMotorSubmissionStatus,
} from "../../../../../data/models/user/PostCureFormModel";
import { createInhibitionDataForType } from "../../../../../data/models/user/PostCureFormModel";
import type { PostCureAddedMotor } from "../../../../../hooks/user/manufacturing/postCureFlowConfig";
import RemoveProcessButton from "../../../../components/common/RemoveProcessButton";
import PremixStatusChip from "../RawMaterial/components/PremixStatusChip";
import ViewStatusButton from "../../../../components/common/ViewStatusButton";
import FinalApprovalMotorDialog, {
  areAllMotorsApproved,
  buildFinalApprovalMotorRows,
} from "../CasePreparation/components/FinalApprovalMotorDialog";
import {
  buildMotorNavGateHelpers,
  type PreviousStageApprovedUnits,
} from "../../../../../hooks/user/previousStageApproval";
import { SUB_DEPT } from "../../../../../utils/batchStageUtils";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../components/custom/UserWorkflowStepPager";
import PostCureFlowBar from "./PostCureFlowBar";
import PostCureMotorPanel from "./PostCureMotorPanel";
import CasePrepSelect from "../CasePreparation/CasePrepSelect";
import {
  isPostCureInhibitionDetailsRequired,
  type PostCureMotorData,
} from "@/data/models/user/PostCureMotorDataModel";
import { validatePostCureMotorSession } from "@/data/validation/adapters/postCure.validation";
import {
  firstValidationError,
  hasValidationErrors,
} from "@/data/validation/validationErrors";
import { ValidationErrors } from "@/data/validation/submissionIntent";
import { useAlertStore } from "../../../../../app/store/alertStore";

const S = STRINGS.MANUFACTURING.POST_CURE;
const { handyman: HandymanRoundedIcon } = icons.user.manufacturing.postCure.form;

type MotorProcessTab = "LOOSE_FLAP" | "INHIBITION";

type PostCureFormProps = {
  batch?: {
    batchId?: string;
    formId?: string | null;
    motorId?: string;
    motorIds?: Array<string | number>;
  } | null;
  formData: PostCureFormState;
  addedMotors: PostCureAddedMotor[];
  activeMotorId: string;
  draftMotorReceiptDate: string;
  subDepartmentId?: number;
  canLoadForm?: boolean;
  onActiveMotorChange: (motorId: string) => void;
  onDraftMotorReceiptDateChange: (value: string) => void;
  onLoadForm?: () => void;
  onRemoveMotor: (motorId: string) => void;
  onMotorSessionChange: (motorId: string, next: PostCureMotorSession) => void;
  onSaveMotorDraft?: (motorId: string) => void;
  onSubmitMotor?: (motorId: string) => void;
  motorStatusById?: Record<string, PostCureMotorStatusMeta>;
  getMotorStatus?: (motorId: string) => PostCureMotorSubmissionStatus;
  isMotorEditable?: (motorId: string) => boolean;
  previousStageGate?: PreviousStageApprovedUnits | null;
  actionLoading?: boolean;
  /** Field errors mapped from API `errorDetails` (e.g. after save/submit). */
  serverValidationErrors?: ValidationErrors;
  theme: any;
};

const isLooseFlapErrorKey = (key: string) =>
  key === "looseFlapFillingDetails" ||
  key.startsWith("bellowRemovalDetails") ||
  key.startsWith("looseFlapEpoxyPreparation") ||
  key.startsWith("qualificationDetails") ||
  key.startsWith("lfEpoxyFillingDetails");

const isInhibitionErrorKey = (key: string) =>
  key === "inhibitorType" ||
  key.startsWith("ir1") ||
  key.startsWith("hemcoat") ||
  key.startsWith("inhibition") ||
  key.startsWith("dispatch");

const resolveValidationTab = (
  errors: ValidationErrors,
  currentTab: MotorProcessTab = "LOOSE_FLAP",
): MotorProcessTab => {
  const keys = Object.keys(errors);
  const hasLooseFlapError = keys.some(isLooseFlapErrorKey);
  const hasInhibitionError = keys.some(isInhibitionErrorKey);

  // Prefer staying on the tab the user is already viewing when it has errors,
  // so highlighted fields remain visible instead of silently switching away.
  if (currentTab === "LOOSE_FLAP" && hasLooseFlapError) return "LOOSE_FLAP";
  if (currentTab === "INHIBITION" && hasInhibitionError) return "INHIBITION";
  if (hasLooseFlapError) return "LOOSE_FLAP";
  if (hasInhibitionError) return "INHIBITION";
  return currentTab;
};

const scrollToFirstInvalidField = () => {
  if (typeof document === "undefined") return;
  window.requestAnimationFrame(() => {
    const invalid = document.querySelector<HTMLElement>(
      '[aria-invalid="true"], .Mui-error input, .MuiFormHelperText-root.Mui-error',
    );
    invalid?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
};

export const PostCureForm = ({
  batch,
  formData,
  addedMotors,
  activeMotorId,
  draftMotorReceiptDate,
  subDepartmentId,
  canLoadForm = false,
  onActiveMotorChange,
  onDraftMotorReceiptDateChange,
  onLoadForm,
  onRemoveMotor,
  onMotorSessionChange,
  onSaveMotorDraft,
  onSubmitMotor,
  motorStatusById = {},
  getMotorStatus,
  isMotorEditable,
  previousStageGate = null,
  actionLoading = false,
  serverValidationErrors,
  isSubmitMode = false,
  theme,
}: PostCureFormProps & { isSubmitMode?: boolean }) => {
  const BRAND = POST_CURE_BRAND;
  const showAlert = useAlertStore((state) => state.showAlert);
  const motorCards = Array.isArray(addedMotors) ? addedMotors : [];
  const [activeProcessTab, setActiveProcessTab] = useState<MotorProcessTab>("LOOSE_FLAP");
  const [inhibitionTypeEditing, setInhibitionTypeEditing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const activeMotorIndex = useMemo(() => {
    const index = motorCards.findIndex((entry) => entry.motorId === activeMotorId);
    return index >= 0 ? index : 0;
  }, [activeMotorId, motorCards]);

  const activeMotorEntry = useMemo(
    () => (motorCards.length > 0 ? motorCards[activeMotorIndex] : null),
    [motorCards, activeMotorIndex],
  );

  const activeMotorSession = useMemo(() => {
    if (!activeMotorEntry) return null;
    return (formData.motors ?? []).find((m) => m.motorId === activeMotorEntry.motorId) ?? null;
  }, [activeMotorEntry, formData.motors]);

  const resolvedActiveMotorId = activeMotorEntry?.motorId ?? "";

  useEffect(() => {
    setValidationErrors({});
    setActiveProcessTab("LOOSE_FLAP");
    setInhibitionTypeEditing(false);
  }, [resolvedActiveMotorId]);

  const applyValidationErrors = (
    errors: ValidationErrors,
    message: string,
  ) => {
    setValidationErrors(errors);
    setActiveProcessTab((current) => resolveValidationTab(errors, current));
    const firstError = firstValidationError(errors);
    showAlert(firstError ? `${message} (${firstError})` : message, "warning");
    scrollToFirstInvalidField();
  };

  useEffect(() => {
    if (!serverValidationErrors || Object.keys(serverValidationErrors).length === 0) {
      return;
    }
    applyValidationErrors(serverValidationErrors, S.SUBMIT_VALIDATION_FAILED);
    // applyValidationErrors intentionally omitted from deps — only react to new server errors
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverValidationErrors]);

  const clearFieldError = (ruleKey: string) => {
    setValidationErrors((prev) => {
      if (!prev || !Object.prototype.hasOwnProperty.call(prev, ruleKey)) {
        return prev;
      }
      const next = { ...prev };
      delete next[ruleKey];
      return next;
    });
  };

  const persistSession = (session: PostCureMotorSession) => {
    if (!activeMotorEntry) return;
    onMotorSessionChange(activeMotorEntry.motorId, session);
  };

  const handleSaveDraft = async () => {
    if (!activeMotorEntry || !activeMotorSession) return;
    const errors = validatePostCureMotorSession(activeMotorSession, "UNIT");
    if (hasValidationErrors(errors)) {
      applyValidationErrors(errors, S.DRAFT_VALIDATION_FAILED);
      return;
    }
    setValidationErrors({});
    onSaveMotorDraft?.(activeMotorEntry.motorId);
  };

  const handleSubmitForm = () => {
    if (!activeMotorEntry || !activeMotorSession) return;
    const errors = validatePostCureMotorSession(activeMotorSession, "SUBMIT");
    if (hasValidationErrors(errors)) {
      applyValidationErrors(errors, S.SUBMIT_VALIDATION_FAILED);
      return;
    }
    setValidationErrors({});
    onSubmitMotor?.(activeMotorEntry.motorId);
  };

  const handleInhibitorTypeChange = (inhibitorType: string) => {
    if (!activeMotorSession) return;
    persistSession({
      ...activeMotorSession,
      inhibitorType,
      inhibitionData: createInhibitionDataForType(inhibitorType),
    });
    setInhibitionTypeEditing(false);
    clearFieldError("inhibitorType");
  };

  const handleClearInhibitionSetup = () => {
    if (!activeMotorSession) return;
    persistSession({
      ...activeMotorSession,
      inhibitorType: "",
      inhibitionData: null,
    });
    setInhibitionTypeEditing(false);
    clearFieldError("inhibitorType");
  };

  const motorNavGate = useMemo(() => {
    const resolveMotorStatus = (motorId: string) =>
      getMotorStatus?.(motorId) ??
      motorStatusById[motorId]?.motorSubmissionStatus ??
      "TO_BE_INITIATED";
    return buildMotorNavGateHelpers(motorCards, previousStageGate, resolveMotorStatus, {
      previousStage: STRINGS.MANUFACTURING.PREVIOUS_STAGE_MOTOR_TAB_DISABLED,
      sequential: STRINGS.MANUFACTURING.SEQUENTIAL_UNIT_TAB_DISABLED,
      notYetUnlocked: STRINGS.MANUFACTURING.NOT_YET_UNLOCKED,
    }, batch, SUB_DEPT.POST_CURE);
  }, [batch, motorCards, previousStageGate, getMotorStatus, motorStatusById]);

  const [finalApprovalOpen, setFinalApprovalOpen] = useState(false);
  const batchMotorCount = Math.max(motorCards.length, 0);
  const statusConfig = theme?.manufacturing?.postCure?.details?.bannerStatusConfig ?? {};

  useEffect(() => {
    if (!motorCards.length) return;
    const activeEnabled = motorNavGate.isMotorWorkflowEnabled(activeMotorId);
    const hasActive = motorCards.some((entry) => entry.motorId === activeMotorId);
    if (hasActive && activeEnabled) return;
    const firstEnabledIndex = motorCards.findIndex((_, index) =>
      motorNavGate.isMotorTabEnabled(index),
    );
    onActiveMotorChange(
      (firstEnabledIndex >= 0 ? motorCards[firstEnabledIndex] : motorCards[0])?.motorId ?? "",
    );
  }, [activeMotorId, motorCards, motorNavGate, onActiveMotorChange]);

  const activeMotorStatus = (getMotorStatus?.(resolvedActiveMotorId) ??
    motorStatusById[resolvedActiveMotorId]?.motorSubmissionStatus ??
    "TO_BE_INITIATED") as PostCureMotorSubmissionStatus;
  const activeMotorPriorEnabled = motorNavGate.isMotorWorkflowEnabled(resolvedActiveMotorId);
  const activeMotorLocked = resolvedActiveMotorId
    ? !activeMotorPriorEnabled || !(isMotorEditable?.(resolvedActiveMotorId) ?? true)
    : false;
  const activeMotorLoaded = Boolean(activeMotorSession?.formLoaded);
  const inhibitionTypeSelected = Boolean(String(activeMotorSession?.inhibitorType ?? "").trim());
  const inhibitionTypeLocked = inhibitionTypeSelected && !inhibitionTypeEditing;
  const canChangeInhibitionSetup = inhibitionTypeSelected && !activeMotorLocked;
  const showInhibitionDelete =
    canChangeInhibitionSetup && activeMotorStatus === "IN_PROGRESS";
  const showInhibitionEdit =
    canChangeInhibitionSetup && activeMotorStatus !== "IN_PROGRESS";
  const showInhibitionPanel =
    inhibitionTypeSelected &&
    isPostCureInhibitionDetailsRequired(activeMotorSession?.inhibitorType ?? "");

  const finalApprovalRows = useMemo(
    () =>
      buildFinalApprovalMotorRows(
        motorStatusById,
        motorCards.map((m) => m.motorId),
      ),
    [motorCards, motorStatusById],
  );
  const allMotorsApproved = areAllMotorsApproved(finalApprovalRows);

  const navPalette = useMemo(
    () => ({
      primary: theme.palette.primary,
      primaryLight: theme.palette.primaryLight,
      border: theme.palette.border,
      surface: theme.palette.surface,
      textSub: theme.palette.textSub,
      text: theme.palette.text,
    }),
    [theme.palette],
  );

  const sectionToggleSx = {
    width: "100%",
    mb: 1.5,
    display: "flex",
    "& .MuiToggleButtonGroup-grouped": { flex: 1 },
    "& .MuiToggleButton-root": {
      flex: 1,
      px: 2.5,
      py: 0.9,
      fontWeight: 700,
      fontSize: "0.82rem",
      textTransform: "none" as const,
      borderColor: alpha(BRAND.pc, 0.35),
      "&.Mui-selected": {
        background: alpha(BRAND.pc, 0.12),
        color: BRAND.pc,
      },
    },
  };

  const motorTabs = useMemo<UserWorkflowNavTab[]>(
    () =>
      motorCards.map((entry, index) => {
        const status =
          getMotorStatus?.(entry.motorId) ??
          motorStatusById[entry.motorId]?.motorSubmissionStatus ??
          "TO_BE_INITIATED";
        return {
          id: entry.motorId,
          label: entry.motorId,
          endAdornment: (
            <PremixStatusChip
              status={status as any}
              statusConfig={statusConfig}
              variant="embedded"
              onAccent={index === activeMotorIndex}
            />
          ),
        };
      }),
    [activeMotorIndex, getMotorStatus, motorCards, motorStatusById, statusConfig],
  );

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1.5}
        mb={2.5}
        flexWrap="wrap"
      >
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "11px",
              background: `linear-gradient(135deg, ${BRAND.pc}, ${BRAND.pcLight})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(21,101,192,0.3)",
            }}
          >
            <HandymanRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.98rem", color: BRAND.text }}>
              {S.FORM_TITLE}
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mt: 0.15 }}>
              {batch?.batchId ? `${batch.batchId}` : S.FORM_SUBTITLE}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {motorCards.length > 0 ? (
        <Stack spacing={1.25} sx={{ mb: 1.5 }}>
          <UserWorkflowNavPanel palette={navPalette}>
            <UserWorkflowTabNav
              title={S.MOTOR_NAV_TITLE}
              hint={S.MOTOR_NAV_HINT}
              tabs={motorTabs}
              activeIndex={activeMotorIndex}
              onActiveIndexChange={(index) => {
                const next = motorCards[index];
                if (next) onActiveMotorChange(next.motorId);
              }}
              isTabDisabled={(_, index) => !motorNavGate.isMotorTabEnabled(index)}
              tabTooltip={(_, index) => motorNavGate.getMotorTabTooltip(index)}
              palette={navPalette}
              showStepArrows
              titleEndAdornment={
                <Chip
                  label={`${S.BATCH_MOTOR_COUNT_LABEL}: ${batchMotorCount}`}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    height: 24,
                    background: BRAND.pc,
                    color: "#fff",
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              }
            />
          </UserWorkflowNavPanel>

          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            {activeMotorLoaded && activeMotorEntry ? (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={actionLoading || activeMotorLocked}
                  onClick={handleSaveDraft}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  {S.SAVE_MOTOR_DRAFT(activeMotorEntry.motorId)}
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  disabled={actionLoading || activeMotorLocked}
                  onClick={handleSubmitForm}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  {S.SUBMIT_MOTOR(activeMotorEntry.motorId)}
                </Button>
              </>
            ) : null}
            <ViewStatusButton
              disabled={actionLoading}
              onClick={() => setFinalApprovalOpen(true)}
              label={S.VIEW_STATUS}
            />
          </Stack>
        </Stack>
      ) : null}

      {!activeMotorLoaded && resolvedActiveMotorId ? (
        <Box sx={{ mb: 1.5 }}>
          <PostCureFlowBar
            activeMotorId={resolvedActiveMotorId}
            draftMotorReceiptDate={draftMotorReceiptDate}
            canLoadForm={canLoadForm}
            onDraftMotorReceiptDateChange={onDraftMotorReceiptDateChange}
            onLoadForm={onLoadForm ?? (() => undefined)}
            theme={theme}
          />
        </Box>
      ) : null}

      {activeMotorLoaded && activeMotorEntry && activeMotorSession ? (
        <Box
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
              <Typography
                sx={{ fontSize: "0.8rem", fontWeight: 700, color: theme.palette.primary }}
              >
                {S.MOTOR_CARD_TITLE} - {activeMotorEntry.motorId}
              </Typography>
              <PremixStatusChip
                status={activeMotorStatus as any}
                statusConfig={statusConfig}
                variant="embedded"
              />
            </Stack>

            {activeMotorStatus === "TO_BE_INITIATED" ? (
              <RemoveProcessButton
                onClick={() => onRemoveMotor(activeMotorEntry.motorId)}
                dangerColor={BRAND.danger}
                tooltip={S.DELETE_MOTOR_TOOLTIP}
              />
            ) : null}
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
              <Typography
                sx={{ fontSize: "0.72rem", color: theme.palette.textSub, fontWeight: 600 }}
              >
                {!activeMotorPriorEnabled
                  ? STRINGS.MANUFACTURING.PREVIOUS_STAGE_MOTOR_TAB_DISABLED
                  : activeMotorStatus === "APPROVED"
                    ? S.MOTOR_LOCKED_APPROVED
                    : S.MOTOR_LOCKED_WAITING}
              </Typography>
            </Box>
          ) : null}

          {activeMotorStatus === "REJECTED" &&
          motorStatusById[resolvedActiveMotorId]?.rejectionReason ? (
            <Alert severity="error" sx={{ fontSize: "0.78rem", mb: 1.25 }}>
              {motorStatusById[resolvedActiveMotorId]?.rejectionReason}
            </Alert>
          ) : null}

          <Typography sx={{ fontSize: "0.74rem", color: theme.palette.textSub, mb: 1.25 }}>
            {S.MOTOR_RECEIVED_AT_LABEL}: {activeMotorEntry.motorReceiptDate || "?"}
          </Typography>

          {hasValidationErrors(validationErrors) ? (
            <Alert severity="warning" sx={{ mb: 1.25, py: 0.5, fontSize: "0.78rem" }}>
              {S.SUBMIT_VALIDATION_FAILED}
            </Alert>
          ) : null}

          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={activeProcessTab}
            onChange={(_, value: MotorProcessTab | null) => {
              if (!value) return;
              setActiveProcessTab(value);
            }}
            sx={sectionToggleSx}
          >
            <ToggleButton
              value="LOOSE_FLAP"
              sx={
                Object.keys(validationErrors).some(isLooseFlapErrorKey)
                  ? { color: `${BRAND.danger} !important`, borderColor: `${BRAND.danger} !important` }
                  : undefined
              }
            >
              {S.OPERATION_LOOSE_FLAP_FILLING}
            </ToggleButton>
            <ToggleButton
              value="INHIBITION"
              sx={
                Object.keys(validationErrors).some(isInhibitionErrorKey)
                  ? { color: `${BRAND.danger} !important`, borderColor: `${BRAND.danger} !important` }
                  : undefined
              }
            >
              {S.OPERATION_INHIBITION}
            </ToggleButton>
          </ToggleButtonGroup>

          {activeProcessTab === "LOOSE_FLAP" ? (
            <PostCureMotorPanel
              value={activeMotorSession.looseFlapData}
              onChange={(looseFlapData) =>
                persistSession({
                  ...activeMotorSession,
                  looseFlapData,
                })
              }
              validationErrors={validationErrors}
              clearFieldError={clearFieldError}
              disabled={activeMotorLocked}
              theme={theme}
              subDepartmentId={subDepartmentId}
              batchId={batch?.batchId}
              motorId={activeMotorEntry.motorId}
              isSubmitMode={isSubmitMode}
            />
          ) : null}

          {activeProcessTab === "INHIBITION" ? (
            <Stack spacing={1.25}>
              <Box
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.border}`,
                  background: "rgba(21,101,192,0.03)",
                  px: 1.25,
                  py: 1.25,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  justifyContent="space-between"
                  gap={1}
                  mb={1.25}
                >
                  <Typography
                    sx={{
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: theme.palette.primary,
                    }}
                  >
                    {S.INHIBITION_SECTION_TITLE}
                  </Typography>
                  <Stack direction="row" spacing={0.75}>
                    {showInhibitionEdit ? (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setInhibitionTypeEditing(true)}
                        sx={{ textTransform: "none", fontWeight: 700, minWidth: 64 }}
                      >
                        {S.EDIT_INHIBITION_TYPE}
                      </Button>
                    ) : null}
                    {showInhibitionDelete ? (
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={handleClearInhibitionSetup}
                        sx={{ textTransform: "none", fontWeight: 700, minWidth: 64 }}
                      >
                        {S.DELETE_INHIBITION_SETUP}
                      </Button>
                    ) : null}
                  </Stack>
                </Stack>
                <CasePrepSelect
                  label={S.INHIBITOR_TYPE_LABEL}
                  value={activeMotorSession.inhibitorType}
                  placeholder={S.INHIBITOR_TYPE_PLACEHOLDER}
                  options={POST_CURE_INHIBITOR_TYPE_OPTIONS}
                  width={260}
                  theme={theme}
                  disabled={!activeMotorLocked && inhibitionTypeLocked}
                  readOnly={activeMotorLocked}
                  onChange={handleInhibitorTypeChange}
                />
                {validationErrors.inhibitorType ? (
                  <Typography sx={{ fontSize: "0.72rem", color: BRAND.danger, mt: 0.75 }}>
                    {String(validationErrors.inhibitorType)}
                  </Typography>
                ) : null}
              </Box>

              {showInhibitionPanel && activeMotorSession.inhibitionData ? (
                <PostCureMotorPanel
                  value={activeMotorSession.inhibitionData}
                  onChange={(inhibitionData: PostCureMotorData) =>
                    persistSession({
                      ...activeMotorSession,
                      inhibitionData,
                    })
                  }
                  validationErrors={validationErrors}
                  clearFieldError={clearFieldError}
                  disabled={activeMotorLocked}
                  theme={theme}
                  subDepartmentId={subDepartmentId}
                  batchId={batch?.batchId}
                  motorId={activeMotorEntry.motorId}
                  isSubmitMode={isSubmitMode}
                />
              ) : null}
            </Stack>
          ) : null}
        </Box>
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

export default PostCureForm;
