import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import { POST_CURE_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/postCure_theme";
import { formatPostCureMotorOperationLabel } from "../../../../../hooks/user/manufacturing/postCureConfig";
import type {
  PostCureFormState,
  PostCureMotorSession,
  PostCureMotorStatusMeta,
  PostCureMotorSubmissionStatus,
} from "../../../../../data/models/user/PostCureFormModel";
import type { PostCureAddedMotor } from "../../../../../hooks/user/manufacturing/postCureFlowConfig";
import RemoveProcessButton from "../../../../components/common/RemoveProcessButton";
import PremixStatusChip from "../RawMaterial/components/PremixStatusChip";
import FinalApprovalMotorDialog, {
  areAllMotorsApproved,
  buildFinalApprovalMotorRows,
} from "../CasePreparation/components/FinalApprovalMotorDialog";
import {
  buildMotorNavGateHelpers,
  type PreviousStageApprovedUnits,
} from "../../../../../hooks/user/previousStageApproval";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../components/custom/UserWorkflowStepPager";
import PostCureFlowBar from "./PostCureFlowBar";
import PostCureSchemaPanel from "./PostCureSchemaPanel";

const S = STRINGS.MANUFACTURING.POST_CURE;
const { handyman: HandymanRoundedIcon } = icons.user.manufacturing.postCure.form;

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
  draftOperation: string;
  draftInhibitorType: string;
  subDepartmentId?: number;
  schemaLoading?: boolean;
  schemaError?: string | null;
  canLoadForm?: boolean;
  onActiveMotorChange: (motorId: string) => void;
  onDraftMotorReceiptDateChange: (value: string) => void;
  onDraftOperationChange: (value: string) => void;
  onDraftInhibitorTypeChange: (value: string) => void;
  onLoadForm?: () => void;
  onRemoveMotor: (motorId: string) => void;
  onMotorSessionChange: (motorId: string, next: PostCureMotorSession) => void;
  onSaveMotorDraft?: (motorId: string) => void;
  onSubmitMotor?: (motorId: string) => void;
  onSubmitForFinalApproval?: () => void;
  motorStatusById?: Record<string, PostCureMotorStatusMeta>;
  getMotorStatus?: (motorId: string) => PostCureMotorSubmissionStatus;
  isMotorEditable?: (motorId: string) => boolean;
  previousStageGate?: PreviousStageApprovedUnits | null;
  actionLoading?: boolean;
  theme: any;
};

const PostCureForm = ({
  batch,
  formData,
  addedMotors,
  activeMotorId,
  draftMotorReceiptDate,
  draftOperation,
  draftInhibitorType,
  subDepartmentId,
  schemaLoading = false,
  schemaError = null,
  canLoadForm = false,
  onActiveMotorChange,
  onDraftMotorReceiptDateChange,
  onDraftOperationChange,
  onDraftInhibitorTypeChange,
  onLoadForm,
  onRemoveMotor,
  onMotorSessionChange,
  onSaveMotorDraft,
  onSubmitMotor,
  onSubmitForFinalApproval,
  motorStatusById = {},
  getMotorStatus,
  isMotorEditable,
  previousStageGate = null,
  actionLoading = false,
  theme,
}: PostCureFormProps) => {
  const BRAND = POST_CURE_BRAND;
  const motorCards = Array.isArray(addedMotors) ? addedMotors : [];
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
  const [finalApprovalOpen, setFinalApprovalOpen] = useState(false);

  const batchMotorCount = Math.max(motorCards.length, 0);
  const statusConfig = theme?.manufacturing?.postCure?.details?.bannerStatusConfig ?? {};

  const activeMotorIndex = useMemo(() => {
    const index = motorCards.findIndex((entry) => entry.motorId === activeMotorId);
    return index >= 0 ? index : 0;
  }, [activeMotorId, motorCards]);

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

  const activeMotorEntry = useMemo(
    () => (motorCards.length > 0 ? motorCards[activeMotorIndex] : null),
    [motorCards, activeMotorIndex],
  );

  const activeMotorSession = useMemo(() => {
    if (!activeMotorEntry) return null;
    return (formData.motors ?? []).find((m) => m.motorId === activeMotorEntry.motorId) ?? null;
  }, [activeMotorEntry, formData.motors]);

  const resolvedActiveMotorId = activeMotorEntry?.motorId ?? "";
  const activeMotorStatus = (getMotorStatus?.(resolvedActiveMotorId) ??
    motorStatusById[resolvedActiveMotorId]?.motorSubmissionStatus ??
    "TO_BE_INITIATED") as PostCureMotorSubmissionStatus;
  const activeMotorPriorEnabled = motorNavGate.isMotorWorkflowEnabled(resolvedActiveMotorId);
  const activeMotorLocked = resolvedActiveMotorId
    ? !activeMotorPriorEnabled || !(isMotorEditable?.(resolvedActiveMotorId) ?? true)
    : false;
  const activeMotorLoaded = Boolean(activeMotorSession?.postCureSchema);

  const finalApprovalRows = useMemo(
    () =>
      buildFinalApprovalMotorRows(
        motorStatusById,
        motorCards.map((m) => m.motorId),
      ),
    [motorCards, motorStatusById],
  );
  const allMotorsApproved = areAllMotorsApproved(finalApprovalRows);
  const canOpenFinalApproval = Boolean(batch?.formId);

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
        </Stack>
      ) : null}

      {!activeMotorLoaded && resolvedActiveMotorId ? (
        <Box sx={{ mb: 1.5 }}>
          <PostCureFlowBar
            activeMotorId={resolvedActiveMotorId}
            draftMotorReceiptDate={draftMotorReceiptDate}
            draftOperation={draftOperation}
            draftInhibitorType={draftInhibitorType}
            canLoadForm={canLoadForm}
            schemaLoading={schemaLoading}
            onDraftMotorReceiptDateChange={onDraftMotorReceiptDateChange}
            onDraftOperationChange={onDraftOperationChange}
            onDraftInhibitorTypeChange={onDraftInhibitorTypeChange}
            onLoadForm={onLoadForm ?? (() => undefined)}
            theme={theme}
          />
        </Box>
      ) : null}

      {schemaLoading && !activeMotorLoaded ? (
        <Stack
          direction="row"
          alignItems="center"
          gap={1.25}
          sx={{ py: 3, justifyContent: "center" }}
        >
          <CircularProgress size={22} />
          <Typography sx={{ fontSize: "0.82rem", color: BRAND.textSub }}>
            {S.SCHEMA_LOADING}
          </Typography>
        </Stack>
      ) : null}

      {schemaError ? (
        <Typography sx={{ fontSize: "0.82rem", color: BRAND.danger, mb: 2 }}>
          {schemaError}
        </Typography>
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
              {activeMotorStatus === "TO_BE_INITIATED" ? (
                <RemoveProcessButton
                  onClick={() => onRemoveMotor(activeMotorEntry.motorId)}
                  dangerColor={BRAND.danger}
                  tooltip={S.DELETE_MOTOR_TOOLTIP}
                />
              ) : null}
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

          <Typography sx={{ fontSize: "0.74rem", color: theme.palette.textSub, mb: 0.35 }}>
            {S.MOTOR_RECEIVED_AT_LABEL}: {activeMotorEntry.motorReceiptDate || "?"}
          </Typography>
          <Typography sx={{ fontSize: "0.74rem", color: theme.palette.textSub, mb: 1.25 }}>
            {S.OPERATION_LABEL}:{" "}
            {formatPostCureMotorOperationLabel(
              activeMotorSession.operation,
              activeMotorSession.inhibitorType,
            )}
          </Typography>

          <PostCureSchemaPanel
            schema={activeMotorSession.postCureSchema}
            formValues={activeMotorSession.schemaFormValues}
            savedSections={activeMotorSession.savedSections}
            subDepartmentId={subDepartmentId}
            batchId={batch?.batchId}
            motorId={activeMotorEntry.motorId}
            readOnly={activeMotorLocked}
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

export default PostCureForm;
