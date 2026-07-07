// src/ui/pages/user/manufacturing/PostCure/PostCurePage.tsx

import React, { useMemo, useState } from "react";
import { Box, CircularProgress, Button, Stack, IconButton  } from "@mui/material";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import PostCureList from "./PostCureList";
import PostCureForm from "./PostCureForm";
import PostCureHeader from "./PostCureHeader";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import usePostCureHook from "../../../../../hooks/user/manufacturing/usePostCureHook";
import { STRINGS } from "../../../../../app/config/strings";
import PostCureDetailsView from "./PostCureDetailsView";
const PostCurePage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const actionStrings = STRINGS.SOURCING.SPECIFICATION_FORM;
  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

  const hookState = usePostCureHook();

  const {
    loading,
    view,
    activeBatch,
    isEditMode,
    formData,
    addedMotors,
    draftMotorId,
    draftMotorReceiptDate,
    draftOperation,
    draftInhibitorType,
    usedMotorIds,
    actionLoading,
    backConfirmOpen,
    setBackConfirmOpen,
    handleBack,
    handleDiscardAndBack,
    setDraftMotorId,
    setDraftMotorReceiptDate,
    handleDraftOperationChange,
    handleDraftInhibitorTypeChange,
    handleMotorSessionChange,
    handleRemoveMotor,
    handleSaveDraft,
    handleSubmit,
    schemaLoading,
    schemaError,
    handleLoadForm,
    handleAddMotor,
    canLoadForm,
    canAddMotor,
    subDepartmentId,
    detailsRow,
    detailsData,
    detailsLoading,
    handleViewPostCureDetails,
    handleBackFromDetails,
  } = hookState;

  if (loading) {
    return (
      <Box sx={theme.workflow.loadingContainer}>
        <CircularProgress size={32} />
      </Box>
    );
  }
  if (view === "details") {
    return (
      <PostCureDetailsView
        row={detailsRow}
        data={detailsData}
        loading={detailsLoading}
        onBack={handleBackFromDetails}
      />
    );
  }
  if (view === "list") {
    return (
      <Box sx={theme.workflow.animatedContainer}>
        <PostCureList hookState={hookState} />
      </Box>
    );
  }

  return (
    <Box sx={theme.workflow.animatedContainer}>
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
        draftMotorId={draftMotorId}
        draftMotorReceiptDate={draftMotorReceiptDate}
        draftOperation={draftOperation}
        draftInhibitorType={draftInhibitorType}
        usedMotorIds={usedMotorIds}
        subDepartmentId={subDepartmentId}
        schemaLoading={schemaLoading}
        schemaError={schemaError}
        canLoadForm={canLoadForm}
        canAddMotor={canAddMotor}
        onDraftMotorIdChange={setDraftMotorId}
        onDraftMotorReceiptDateChange={setDraftMotorReceiptDate}
        onDraftOperationChange={handleDraftOperationChange}
        onDraftInhibitorTypeChange={handleDraftInhibitorTypeChange}
        onLoadForm={handleLoadForm}
        onAddMotor={handleAddMotor}
        onRemoveMotor={handleRemoveMotor}
        onMotorSessionChange={handleMotorSessionChange}
        theme={theme}
      />

      {formData.schemaFormLoaded && formData.motors.length > 0 ? (
      <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} mt={3} justifyContent="flex-end">
        <Button
          variant="outlined"
          disabled={actionLoading}
          onClick={() => setDraftConfirmOpen(true)}
        >
          {actionStrings.SAVE_DRAFT}
        </Button>
        <Button
          variant="contained"
          disabled={actionLoading}
          onClick={() => setSubmitConfirmOpen(true)}
        >
          {isEditMode ? actionStrings.RESUBMIT_APPROVAL : actionStrings.SUBMIT_APPROVAL}
        </Button>
      </Stack>
      ) : null}

      <ConfirmAlertDialog
        open={backConfirmOpen}
        severity="warning"
        title={STRINGS.MANUFACTURING.POST_CURE.UNSAVED_BACK_TITLE}
        message={STRINGS.MANUFACTURING.POST_CURE.UNSAVED_BACK_MESSAGE}
        confirmLabel={STRINGS.MANUFACTURING.POST_CURE.UNSAVED_BACK_DISCARD}
        cancelLabel={STRINGS.MANUFACTURING.POST_CURE.UNSAVED_BACK_CONFIRM}
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

export default PostCurePage;
