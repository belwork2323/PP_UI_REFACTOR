import React, { useMemo, useState } from "react";
import { Box } from "@mui/material";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import WorkflowFormOpeningLoader from "../../../../components/common/WorkflowFormOpeningLoader";
import TrimmingList from "./TrimmingList";
import TrimmingForm from "./TrimmingForm";
import TrimmingHeader from "./TrimmingHeader";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { TRIMMING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/trimming_theme";
import useTrimmingHook from "../../../../../hooks/user/manufacturing/useTrimmingHook";
import { STRINGS } from "../../../../../app/config/strings";
import TrimmingDetailsView from "./TrimmingDetailsView";

const TrimmingPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const S = STRINGS.MANUFACTURING.TRIMMING;
  const [motorDraftConfirmOpen, setMotorDraftConfirmOpen] = useState(false);
  const [motorSubmitConfirmOpen, setMotorSubmitConfirmOpen] = useState(false);
  const [pendingMotorId, setPendingMotorId] = useState<string | null>(null);

  const hookState = useTrimmingHook();

  const {
    loading,
    loadingFormDetails,
    view,
    activeBatch,
    isEditMode,
    formData,
    actionLoading,
    backConfirmOpen,
    setBackConfirmOpen,
    handleBack,
    handleDiscardAndBack,
    addedMotors,
    batchMotorEntries,
    motorStatusById,
    getMotorStatus,
    isMotorEditable,
    previousStageGate,
    detailsRow,
    detailsData,
    detailsLoading,
    handleBackFromDetails,
    handleMotorSessionChange,
    handleSaveMotorDraft,
    handleSubmitMotor,
    handleSubmitForFinalApproval,
  } = hookState;

  const listLoading = loading && !loadingFormDetails && view === "list";

  return (
    <Box sx={theme.workflow.animatedContainer}>
      <WorkflowFormOpeningLoader
        open={listLoading || Boolean(loadingFormDetails)}
        title={loadingFormDetails ? S.FORM_OPENING_TITLE : S.TITLE}
        message={
          loadingFormDetails ? S.FORM_OPENING_MESSAGE : "Loading trimming batches…"
        }
        color={TRIMMING_BRAND.tr}
        accentColor={TRIMMING_BRAND.trLight}
      />

      {view === "list" && !listLoading && <TrimmingList hookState={hookState} />}

      {view === "details" && detailsRow && (
        <TrimmingDetailsView
          row={detailsRow}
          data={detailsData}
          loading={detailsLoading}
          onBack={handleBackFromDetails}
        />
      )}

      {view === "form" && activeBatch && !loadingFormDetails && (
        <>
          <TrimmingHeader batch={activeBatch} isEdit={isEditMode} onBack={handleBack} theme={theme} />
          <TrimmingForm
            batch={activeBatch}
            formData={formData}
            addedMotors={addedMotors}
            autoMotorEntries={batchMotorEntries}
            motorStatusById={motorStatusById}
            getMotorStatus={getMotorStatus}
            isMotorEditable={isMotorEditable}
            previousStageGate={previousStageGate}
            actionLoading={actionLoading}
            onMotorSessionChange={handleMotorSessionChange}
            onSaveMotorDraft={(motorId) => {
              setPendingMotorId(motorId);
              setMotorDraftConfirmOpen(true);
            }}
            onSubmitMotor={(motorId) => {
              setPendingMotorId(motorId);
              setMotorSubmitConfirmOpen(true);
            }}
            onSubmitForFinalApproval={handleSubmitForFinalApproval}
            theme={theme}
          />

          <ConfirmAlertDialog
            open={backConfirmOpen}
            severity="warning"
            title={S.UNSAVED_BACK_TITLE}
            message={S.UNSAVED_BACK_MESSAGE}
            confirmLabel={S.UNSAVED_BACK_DISCARD}
            cancelLabel={S.UNSAVED_BACK_CONFIRM}
            onConfirm={handleDiscardAndBack}
            onCancel={() => setBackConfirmOpen(false)}
          />

          <ConfirmAlertDialog
            open={motorDraftConfirmOpen}
            severity="warning"
            title={S.MOTOR_DRAFT_CONFIRM_TITLE}
            message={S.MOTOR_DRAFT_CONFIRM_MESSAGE(pendingMotorId ?? "")}
            confirmLabel={S.SAVE_MOTOR_DRAFT}
            cancelLabel={STRINGS.SOURCING.SPECIFICATION_FORM.CONFIRM_CANCEL_ACTION}
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
            title={S.MOTOR_SUBMIT_CONFIRM_TITLE}
            message={S.MOTOR_SUBMIT_CONFIRM_MESSAGE(pendingMotorId ?? "")}
            confirmLabel={S.SUBMIT_MOTOR}
            cancelLabel={STRINGS.SOURCING.SPECIFICATION_FORM.CONFIRM_CANCEL_ACTION}
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
        </>
      )}
    </Box>
  );
};

export default TrimmingPage;
