import React, { useMemo, useState } from "react";
import { Box, Button, Stack } from "@mui/material";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import NDTList from "./NDTList";
import NDTForm from "./NDTForm";
import NDTDetailsView from "./NDTDetailsView";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { STRINGS } from "../../../../../app/config/strings";
import useNDTHook from "../../../../../hooks/user/qualityControl/useNDTHook";

const NDTPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => {
    const qc = getQualityControlTheme(mode);
    const mfg = getManufacturingTheme(mode);
    return { ...qc, manufacturing: mfg.manufacturing };
  }, [mode]);
  const strings = STRINGS.QUALITY_CONTROL.NDT;
  const [draftConfirm, setDraftConfirm] = useState(false);
  const [submitConfirm, setSubmitConfirm] = useState(false);

  const hookState = useNDTHook();
  const {
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
    handleSaveDraft,
    handleSubmit,
    handleBackFromDetails,
    detailsRow,
    detailsData,
    detailsLoading,
    motorCount,
    draftMotorIds,
    addedMotors,
    availableMotorOptions,
    maxMotorCount,
    handleSetupChange,
    handleMotorSessionChange,
    handleMotorCountChange,
    handleDraftMotorIdChange,
    handleLoadNDTForm,
    handleAddMotors,
    handleRemoveMotor,
  } = hookState;

  const canAct = formData.formLoaded;

  if (view === "list") {
    return (
      <Box sx={theme.workflow.animatedContainer}>
        <NDTList hookState={hookState} />
      </Box>
    );
  }

  if (view === "details" && detailsRow) {
    return (
      <Box sx={theme.workflow.animatedContainer}>
        <NDTDetailsView row={detailsRow} data={detailsData} loading={detailsLoading} onBack={handleBackFromDetails} />
      </Box>
    );
  }

  return (
    <Box sx={theme.workflow.animatedContainer}>
      {activeBatch && (
        <>
          <UserWorkflowFormHeader
            batch={{
              ...activeBatch,
              lotId: activeBatch.lotId ?? activeBatch.batchId,
            }}
            isEdit={isEditMode}
            onBack={handleBack}
            newLabel={strings.NEW_LABEL}
            backLabel={STRINGS.QUALITY_CONTROL.FORM_HEADER.BACK_TO_LIST}
            editLabel={STRINGS.QUALITY_CONTROL.FORM_HEADER.EDITING_REJECTED}
            rejectionTitle={STRINGS.QUALITY_CONTROL.FORM_HEADER.REJECTION_REASON}
            theme={theme}
          />
          {!loadingFormDetails && (
            <NDTForm
              activeBatch={activeBatch}
              formData={formData}
              addedMotors={addedMotors}
              motorCount={motorCount}
              draftMotorIds={draftMotorIds}
              availableMotorOptions={availableMotorOptions}
              maxMotorCount={maxMotorCount}
              isEditMode={isEditMode}
              theme={theme}
              onSetupChange={handleSetupChange}
              onMotorSessionChange={handleMotorSessionChange}
              onMotorCountChange={handleMotorCountChange}
              onDraftMotorIdChange={handleDraftMotorIdChange}
              onLoadNDTForm={handleLoadNDTForm}
              onAddMotors={handleAddMotors}
              onRemoveMotor={handleRemoveMotor}
            />
          )}

          {!loadingFormDetails && canAct ? (
            <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} mt={3} justifyContent="flex-end">
              <Button
                variant="outlined"
                disabled={actionLoading}
                onClick={() => setDraftConfirm(true)}
              >
                {strings.SAVE_DRAFT_LABEL}
              </Button>
              <Button
                variant="contained"
                disabled={actionLoading}
                onClick={() => setSubmitConfirm(true)}
              >
                {isEditMode ? strings.RESUBMIT_LABEL : strings.SUBMIT_LABEL}
              </Button>
            </Stack>
          ) : null}

          {!loadingFormDetails && canAct ? (
            <>
              <ConfirmAlertDialog
                open={draftConfirm}
                severity="info"
                title={strings.DRAFT_CONFIRM_TITLE}
                message={strings.DRAFT_CONFIRM_MESSAGE}
                confirmLabel={strings.DRAFT_CONFIRM_LABEL}
                cancelLabel={strings.CONFIRM_CANCEL_LABEL}
                onConfirm={async () => {
                  setDraftConfirm(false);
                  await handleSaveDraft();
                }}
                onCancel={() => setDraftConfirm(false)}
              />
              <ConfirmAlertDialog
                open={submitConfirm}
                severity="warning"
                title={isEditMode ? strings.RESUBMIT_CONFIRM_TITLE : strings.SUBMIT_CONFIRM_TITLE}
                message={isEditMode ? strings.RESUBMIT_CONFIRM_MESSAGE : strings.SUBMIT_CONFIRM_MESSAGE}
                confirmLabel={isEditMode ? strings.RESUBMIT_CONFIRM_LABEL : strings.SUBMIT_CONFIRM_LABEL}
                cancelLabel={strings.CONFIRM_GO_BACK_LABEL}
                onConfirm={async () => {
                  setSubmitConfirm(false);
                  await handleSubmit();
                }}
                onCancel={() => setSubmitConfirm(false)}
              />
            </>
          ) : null}
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
    </Box>
  );
};

export default NDTPage;
