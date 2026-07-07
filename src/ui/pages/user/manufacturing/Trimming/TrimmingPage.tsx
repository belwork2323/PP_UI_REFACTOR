import React, { useMemo, useState } from "react";
import { Box, CircularProgress, Button, Stack } from "@mui/material";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import TrimmingList from "./TrimmingList";
import TrimmingForm from "./TrimmingForm";
import TrimmingHeader from "./TrimmingHeader";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import useTrimmingHook from "../../../../../hooks/user/manufacturing/useTrimmingHook";
import { STRINGS } from "../../../../../app/config/strings";
import TrimmingDetailsView from "./TrimmingDetailsView";
const TrimmingPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const actionStrings = STRINGS.SOURCING.SPECIFICATION_FORM;
  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

  const hookState = useTrimmingHook();

  const {
    loading,
    view,
    activeBatch,
    isEditMode,
    formData,
    actionLoading,
    backConfirmOpen,
    setBackConfirmOpen,
    handleBack,
    handleDiscardAndBack,
    handleFormValuesChange,
    handleSaveDraft,
    handleSubmit,
    schemaLoading,
    schemaError,
    subDepartmentId,
    selectedMotorStage,
    motorStageOptions,
    motorStagesLoading,
    motorCount,
    draftMotorIds,
    motorReceivedAt,
    addedMotors,
    availableMotorOptions,
    approvedMotorsLoading,
    maxMotorCount,
    detailsRow,
    detailsData,
    detailsLoading,
    handleBackFromDetails,
    handleMotorStageChange,
    handleMotorCountChange,
    handleDraftMotorIdChange,
    handleMotorReceivedAtChange,
    handleLoadTrimmingForm,
    handleAddMotors,
    handleMotorSessionChange,
  } = hookState;

  if (loading) {
    return (
      <Box sx={theme.workflow.loadingContainer}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (view === "list") {
    return (
      <Box sx={theme.workflow.animatedContainer}>
        <TrimmingList hookState={hookState} />
      </Box>
    );
  }
  if (view === "details" && detailsRow) {
    return (
      <TrimmingDetailsView
        row={detailsRow}
        data={detailsData}
        loading={detailsLoading}
        onBack={handleBackFromDetails}
      />
    );
  }

  return (
    <Box sx={theme.workflow.animatedContainer}>
      <TrimmingHeader
        batch={activeBatch}
        isEdit={isEditMode}
        onBack={handleBack}
        theme={theme}
      />
      <TrimmingForm
        batch={activeBatch}
        formData={formData}
        subDepartmentId={subDepartmentId}
        selectedMotorStage={selectedMotorStage}
        motorStageOptions={motorStageOptions}
        motorStagesLoading={motorStagesLoading}
        motorCount={motorCount}
        draftMotorIds={draftMotorIds}
        motorReceivedAt={motorReceivedAt}
        addedMotors={addedMotors}
        availableMotorOptions={availableMotorOptions}
        approvedMotorsLoading={approvedMotorsLoading}
        maxMotorCount={maxMotorCount}
        schemaLoading={schemaLoading}
        schemaError={schemaError}
        onMotorStageChange={handleMotorStageChange}
        onMotorCountChange={handleMotorCountChange}
        onDraftMotorIdChange={handleDraftMotorIdChange}
        onMotorReceivedAtChange={handleMotorReceivedAtChange}
        onLoadTrimmingForm={handleLoadTrimmingForm}
        onAddMotors={handleAddMotors}
        onMotorSessionChange={handleMotorSessionChange}
        onFormValuesChange={handleFormValuesChange}
        theme={theme}
      />

      <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} mt={3} justifyContent="flex-end">
        <Button
          variant="outlined"
          disabled={addedMotors.length === 0 || actionLoading}
          onClick={() => setDraftConfirmOpen(true)}
        >
          {actionStrings.SAVE_DRAFT}
        </Button>
        <Button
          variant="contained"
          disabled={addedMotors.length === 0 || actionLoading}
          onClick={() => setSubmitConfirmOpen(true)}
        >
          {isEditMode ? actionStrings.RESUBMIT_APPROVAL : actionStrings.SUBMIT_APPROVAL}
        </Button>
      </Stack>

      <ConfirmAlertDialog
        open={backConfirmOpen}
        severity="warning"
        title={STRINGS.MANUFACTURING.TRIMMING.UNSAVED_BACK_TITLE}
        message={STRINGS.MANUFACTURING.TRIMMING.UNSAVED_BACK_MESSAGE}
        confirmLabel={STRINGS.MANUFACTURING.TRIMMING.UNSAVED_BACK_DISCARD}
        cancelLabel={STRINGS.MANUFACTURING.TRIMMING.UNSAVED_BACK_CONFIRM}
        onConfirm={handleDiscardAndBack}
        onCancel={() => setBackConfirmOpen(false)}
      />

      <ConfirmAlertDialog
        open={draftConfirmOpen}
        severity="warning"
        title={actionStrings.CONFIRM_DRAFT_TITLE}
        message={actionStrings.CONFIRM_DRAFT_MESSAGE}
        confirmLabel={actionStrings.CONFIRM_DRAFT_ACTION}
        cancelLabel={actionStrings.CONFIRM_DRAFT_CANCEL_ACTION}
        onConfirm={async () => {
          setDraftConfirmOpen(false);
          await handleSaveDraft();
        }}
        onCancel={() => setDraftConfirmOpen(false)}
      />

      <ConfirmAlertDialog
        open={submitConfirmOpen}
        severity="warning"
        title={isEditMode ? actionStrings.CONFIRM_RESUBMIT_TITLE : actionStrings.CONFIRM_SUBMIT_TITLE}
        message={isEditMode ? actionStrings.CONFIRM_RESUBMIT_MESSAGE : actionStrings.CONFIRM_SUBMIT_MESSAGE}
        confirmLabel={isEditMode ? actionStrings.CONFIRM_RESUBMIT_ACTION : actionStrings.CONFIRM_SUBMIT_ACTION}
        cancelLabel={actionStrings.CONFIRM_CANCEL_ACTION}
        onConfirm={async () => {
          setSubmitConfirmOpen(false);
          await handleSubmit();
        }}
        onCancel={() => setSubmitConfirmOpen(false)}
      />
    </Box>
  );
};

export default TrimmingPage;
