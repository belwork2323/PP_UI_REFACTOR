import React, { useMemo, useState } from "react";
import { Box } from "@mui/material";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import WorkflowFormOpeningLoader from "../../../../components/common/WorkflowFormOpeningLoader";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import { resolveWorkflowFormHeaderStatus } from "../../../../components/custom/workflowFormHeaderStatus";
import NDTList from "./NDTList";
import NDTForm from "./NDTForm";
import NDTDetailsView from "./NDTDetailsView";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { NDT_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import { STRINGS } from "../../../../../app/config/strings";
import useNDTHook from "../../../../../hooks/user/qualityControl/useNDTHook";

const formatMotorSubtitle = (batch?: {
  motorId?: string;
  motorIds?: Array<string | number>;
} | null) => {
  const ids = Array.isArray(batch?.motorIds)
    ? batch.motorIds.map((id) => String(id).trim()).filter(Boolean)
    : [];
  if (ids.length > 0) return ids.join(" · ");
  const motorId = String(batch?.motorId ?? "").trim();
  return motorId && motorId !== "—" ? motorId : undefined;
};

const NDTPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => {
    const qc = getQualityControlTheme(mode);
    const mfg = getManufacturingTheme(mode);
    return { ...qc, manufacturing: mfg.manufacturing };
  }, [mode]);
  const strings = STRINGS.QUALITY_CONTROL.NDT;
  const [motorDraftConfirmOpen, setMotorDraftConfirmOpen] = useState(false);
  const [motorSubmitConfirmOpen, setMotorSubmitConfirmOpen] = useState(false);
  const [pendingMotorId, setPendingMotorId] = useState<string | null>(null);

  const hookState = useNDTHook();
  const {
    loading,
    view,
    activeBatch,
    isEditMode,
    formData,
    loadingFormDetails,
    actionLoading,
    backConfirmOpen,
    setBackConfirmOpen,
    handleBack,
    handleDiscardAndBack,
    handleSaveMotorDraft,
    handleSubmitMotor,
    handleBackFromDetails,
    detailsRow,
    detailsData,
    detailsLoading,
    addedMotors,
    batchMotorEntries,
    availableMotorOptions,
    motorStatusById,
    getMotorStatus,
    isMotorEditable,
    previousStageGate,
    handleSetupChange,
    handleMotorSessionChange,
    handleLoadNDTForm,
  } = hookState;

  const listLoading = loading && !loadingFormDetails && view === "list";
  const formHeaderStatus =
    view === "form" && activeBatch
      ? resolveWorkflowFormHeaderStatus(activeBatch, { preferredStatusKeys: ["ndtStatus"] })
      : null;

  return (
    <Box sx={theme.workflow.animatedContainer}>
      <WorkflowFormOpeningLoader
        open={listLoading || Boolean(loadingFormDetails)}
        title={loadingFormDetails ? strings.FORM_OPENING_TITLE : strings.TITLE}
        message={
          loadingFormDetails ? strings.FORM_OPENING_MESSAGE : "Loading NDT batches…"
        }
        color={NDT_BRAND.primary}
        accentColor={NDT_BRAND.primaryLight}
      />

      {view === "list" && !listLoading && <NDTList hookState={hookState} />}

      {view === "details" && detailsRow && (
        <NDTDetailsView
          row={detailsRow}
          data={detailsData}
          loading={detailsLoading}
          onBack={handleBackFromDetails}
        />
      )}

      {view === "form" && activeBatch && !loadingFormDetails && formHeaderStatus && (
        <>
          <UserWorkflowFormHeader
            mode="update"
            data={{
              title: String(activeBatch.lotId ?? activeBatch.batchId ?? "—"),
              subtitle: formatMotorSubtitle(activeBatch),
              statusLabel: formHeaderStatus.statusLabel,
              statusVariant: formHeaderStatus.statusVariant,
              rejectionReason: formHeaderStatus.rejectionReason,
            }}
            onBack={handleBack}
            backLabel={STRINGS.QUALITY_CONTROL.FORM_HEADER.BACK_TO_LIST}
            rejectionTitle={STRINGS.QUALITY_CONTROL.FORM_HEADER.REJECTION_REASON}
            theme={theme}
          />
          <NDTForm
            activeBatch={activeBatch}
            formData={formData}
            addedMotors={addedMotors}
            autoMotorEntries={batchMotorEntries}
            availableMotorOptions={availableMotorOptions}
            motorStatusById={motorStatusById}
            getMotorStatus={getMotorStatus}
            isMotorEditable={isMotorEditable}
            previousStageGate={previousStageGate}
            actionLoading={actionLoading}
            isEditMode={isEditMode}
            theme={theme}
            onSetupChange={handleSetupChange}
            onMotorSessionChange={handleMotorSessionChange}
            onLoadNDTForm={handleLoadNDTForm}
            onSaveMotorDraft={(motorId) => {
              setPendingMotorId(motorId);
              setMotorDraftConfirmOpen(true);
            }}
            onSubmitMotor={(motorId) => {
              setPendingMotorId(motorId);
              setMotorSubmitConfirmOpen(true);
            }}
          />
        </>
      )}

      <ConfirmAlertDialog
        open={backConfirmOpen}
        severity="warning"
        title={strings.UNSAVED_BACK_TITLE}
        message={strings.UNSAVED_BACK_MESSAGE}
        confirmLabel={strings.UNSAVED_BACK_DISCARD}
        cancelLabel={strings.UNSAVED_BACK_CONFIRM}
        onConfirm={handleDiscardAndBack}
        onCancel={() => setBackConfirmOpen(false)}
      />

      <ConfirmAlertDialog
        open={motorDraftConfirmOpen}
        severity="warning"
        title={strings.MOTOR_DRAFT_CONFIRM_TITLE}
        message={strings.MOTOR_DRAFT_CONFIRM_MESSAGE(pendingMotorId ?? "")}
        confirmLabel={
          pendingMotorId ? strings.SAVE_MOTOR_DRAFT(pendingMotorId) : strings.MOTOR_DRAFT_CONFIRM_TITLE
        }
        cancelLabel={strings.CONFIRM_CANCEL_LABEL}
        onConfirm={async () => {
          const motorId = pendingMotorId;
          setMotorDraftConfirmOpen(false);
          setPendingMotorId(null);
          if (motorId) await handleSaveMotorDraft(motorId);
        }}
        onCancel={() => {
          setMotorDraftConfirmOpen(false);
          setPendingMotorId(null);
        }}
      />

      <ConfirmAlertDialog
        open={motorSubmitConfirmOpen}
        severity="warning"
        title={strings.MOTOR_SUBMIT_CONFIRM_TITLE}
        message={strings.MOTOR_SUBMIT_CONFIRM_MESSAGE(pendingMotorId ?? "")}
        confirmLabel={
          pendingMotorId ? strings.SUBMIT_MOTOR(pendingMotorId) : strings.MOTOR_SUBMIT_CONFIRM_TITLE
        }
        cancelLabel={strings.CONFIRM_CANCEL_LABEL}
        onConfirm={async () => {
          const motorId = pendingMotorId;
          setMotorSubmitConfirmOpen(false);
          setPendingMotorId(null);
          if (motorId) await handleSubmitMotor(motorId);
        }}
        onCancel={() => {
          setMotorSubmitConfirmOpen(false);
          setPendingMotorId(null);
        }}
      />
    </Box>
  );
};

export default NDTPage;
