import React, { useMemo, useState } from "react";
import { Box } from "@mui/material";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import WorkflowFormOpeningLoader from "../../../../components/common/WorkflowFormOpeningLoader";
import PostCureList from "./PostCureList";
import PostCureForm from "./PostCureForm";
import PostCureHeader from "./PostCureHeader";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { POST_CURE_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/postCure_theme";
import usePostCureHook from "../../../../../hooks/user/manufacturing/usePostCureHook";
import { STRINGS } from "../../../../../app/config/strings";
import PostCureDetailsView from "./PostCureDetailsView";

const PostCurePage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const actionStrings = STRINGS.SOURCING.SPECIFICATION_FORM;
  const S = STRINGS.MANUFACTURING.POST_CURE;
  const [motorDraftConfirmOpen, setMotorDraftConfirmOpen] = useState(false);
  const [motorSubmitConfirmOpen, setMotorSubmitConfirmOpen] = useState(false);
  const [pendingMotorId, setPendingMotorId] = useState<string | null>(null);

  const hookState = usePostCureHook();

  const {
    loading,
    loadingFormDetails,
    view,
    activeBatch,
    isEditMode,
    formData,
    addedMotors,
    activeMotorId,
    draftMotorReceiptDate,
    draftOperation,
    draftInhibitorType,
    actionLoading,
    backConfirmOpen,
    setBackConfirmOpen,
    handleBack,
    handleDiscardAndBack,
    setDraftMotorReceiptDate,
    handleDraftOperationChange,
    handleDraftInhibitorTypeChange,
    handleMotorSessionChange,
    handleRemoveMotor,
    handleActiveMotorChange,
    handleSaveMotorDraft,
    handleSubmitMotor,
    motorStatusById,
    getMotorStatus,
    isMotorEditable,
    previousStageGate,
    handleLoadForm,
    canLoadForm,
    subDepartmentId,
    detailsRow,
    detailsData,
    detailsLoading,
    handleBackFromDetails,
  } = hookState;

  const listLoading = loading && !loadingFormDetails && view === "list";

  return (
    <Box sx={theme.workflow.animatedContainer}>
      <WorkflowFormOpeningLoader
        open={listLoading || Boolean(loadingFormDetails)}
        title={loadingFormDetails ? S.FORM_OPENING_TITLE : S.TITLE}
        message={
          loadingFormDetails ? S.FORM_OPENING_MESSAGE : "Loading post-cure operation batches…"
        }
        color={POST_CURE_BRAND.pc}
        accentColor={POST_CURE_BRAND.pcLight}
      />

      {view === "list" && !listLoading && <PostCureList hookState={hookState} />}
      {view === "details" && detailsRow && (
        <PostCureDetailsView
          row={detailsRow}
          data={detailsData}
          loading={detailsLoading}
          onBack={handleBackFromDetails}
        />
      )}

      {view === "form" && activeBatch && !loadingFormDetails && (
        <>
          <PostCureHeader
            batch={activeBatch}
            isEdit={isEditMode}
            onBack={handleBack}
            theme={theme}
          />
          <PostCureForm
            batch={activeBatch}
            formData={formData}
            addedMotors={addedMotors}
            activeMotorId={activeMotorId}
            draftMotorReceiptDate={draftMotorReceiptDate}
            draftOperation={draftOperation}
            draftInhibitorType={draftInhibitorType}
            subDepartmentId={subDepartmentId}
            canLoadForm={canLoadForm}
            onActiveMotorChange={handleActiveMotorChange}
            onDraftMotorReceiptDateChange={setDraftMotorReceiptDate}
            onDraftOperationChange={handleDraftOperationChange}
            onDraftInhibitorTypeChange={handleDraftInhibitorTypeChange}
            onLoadForm={handleLoadForm}
            onRemoveMotor={handleRemoveMotor}
            onMotorSessionChange={handleMotorSessionChange}
            onSaveMotorDraft={(motorId) => {
              setPendingMotorId(motorId);
              setMotorDraftConfirmOpen(true);
            }}
            onSubmitMotor={(motorId) => {
              setPendingMotorId(motorId);
              setMotorSubmitConfirmOpen(true);
            }}
            motorStatusById={motorStatusById}
            getMotorStatus={getMotorStatus}
            isMotorEditable={isMotorEditable}
            previousStageGate={previousStageGate}
            actionLoading={actionLoading}
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
            message={
              pendingMotorId
                ? S.MOTOR_DRAFT_CONFIRM_MESSAGE(pendingMotorId)
                : S.MOTOR_DRAFT_CONFIRM_TITLE
            }
            confirmLabel={
              pendingMotorId ? S.SAVE_MOTOR_DRAFT(pendingMotorId) : S.MOTOR_DRAFT_CONFIRM_TITLE
            }
            cancelLabel={actionStrings.CONFIRM_DRAFT_CANCEL_ACTION}
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
            message={
              pendingMotorId
                ? S.MOTOR_SUBMIT_CONFIRM_MESSAGE(pendingMotorId)
                : S.MOTOR_SUBMIT_CONFIRM_TITLE
            }
            confirmLabel={
              pendingMotorId ? S.SUBMIT_MOTOR(pendingMotorId) : S.MOTOR_SUBMIT_CONFIRM_TITLE
            }
            cancelLabel={actionStrings.CONFIRM_CANCEL_ACTION}
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

export default PostCurePage;
