// src/ui/pages/user/manufacturing/CasePreparation/CasePreparationPage.tsx

import React, { useMemo, useState } from "react";
import { Box, CircularProgress, Button, Stack } from "@mui/material";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import CasePrepList from "./CasePreparationList";
import CasePreparationForm from "./CasePreparationForm";
import CasePreparationHeader from "./CasePreparationHeader";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import useCasePreparationHook from "../../../../../hooks/user/manufacturing/useCasePreparationWorkflowHook";
import { STRINGS } from "../../../../../app/config/strings";

const CasePreparationPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const actionStrings = STRINGS.SOURCING.SPECIFICATION_FORM;
  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

  const hookState = useCasePreparationHook();
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
    handleFormChange,
    handleSaveDraft,
    handleSubmit,
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
        <CasePrepList hookState={hookState} />
      </Box>
    );
  }

  return (
    <Box sx={theme.workflow.animatedContainer}>
      <CasePreparationHeader
        batch={activeBatch}
        isEdit={isEditMode}
        onBack={handleBack}
        theme={theme}
      />
      <CasePreparationForm
        initialData={formData}
        isEditMode={isEditMode}
        onBlocksChange={handleFormChange}
      />

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

      <ConfirmAlertDialog
        open={backConfirmOpen}
        severity="warning"
        title={STRINGS.MANUFACTURING.CASE_PREP.UNSAVED_BACK_TITLE}
        message={STRINGS.MANUFACTURING.CASE_PREP.UNSAVED_BACK_MESSAGE}
        confirmLabel={STRINGS.MANUFACTURING.CASE_PREP.UNSAVED_BACK_DISCARD}
        cancelLabel={STRINGS.MANUFACTURING.CASE_PREP.UNSAVED_BACK_CONFIRM}
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

export default CasePreparationPage;
