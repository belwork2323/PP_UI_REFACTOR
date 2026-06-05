// src/ui/pages/user/quality_control/qc_division/QCDivisionPage.jsx

import React, { useMemo } from "react";
import { Box } from "@mui/material";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import QCDivisionList from "./QCDivisionList";
import QCInProcessForm from "./QCInProcessFormView";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import { STRINGS } from "../../../../../app/config/strings";
import useQCDivisionHook from "../../../../../hooks/user/qualityControl/useQCDivisionHook";

const QCDivisionPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getQualityControlTheme(mode), [mode]);
  const hookState = useQCDivisionHook();
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
    handleFormChange,
    handleDiscardAndBack,
    handleSaveDraft,
    handleSubmit,
  } = hookState;

  if (view === "list") {
    return (
      <Box sx={theme.workflow.animatedContainer}>
        <QCDivisionList hookState={hookState} />
      </Box>
    );
  }

  return (
    <Box sx={theme.workflow.animatedContainer}>
      <UserWorkflowFormHeader
        batch={activeBatch}
        isEdit={isEditMode}
        onBack={handleBack}
        newLabel={STRINGS.QUALITY_CONTROL.QC_DIVISION.NEW_LABEL}
        backLabel={STRINGS.QUALITY_CONTROL.FORM_HEADER.BACK_TO_LIST}
        editLabel={STRINGS.QUALITY_CONTROL.FORM_HEADER.EDITING_REJECTED}
        rejectionTitle={STRINGS.QUALITY_CONTROL.FORM_HEADER.REJECTION_REASON}
        theme={theme}
      />

      {!loadingFormDetails && activeBatch && (
        <QCInProcessForm
          initialData={formData}
          isEditMode={isEditMode}
          onDataChange={handleFormChange}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          actionLoading={actionLoading}
        />
      )}

      <ConfirmAlertDialog
        open={backConfirmOpen}
        severity="warning"
        title={STRINGS.QUALITY_CONTROL.QC_DIVISION.UNSAVED_BACK_TITLE}
        message={STRINGS.QUALITY_CONTROL.QC_DIVISION.UNSAVED_BACK_MESSAGE}
        confirmLabel={STRINGS.QUALITY_CONTROL.QC_DIVISION.UNSAVED_BACK_DISCARD}
        cancelLabel={STRINGS.QUALITY_CONTROL.QC_DIVISION.UNSAVED_BACK_CONFIRM}
        onConfirm={handleDiscardAndBack}
        onCancel={() => setBackConfirmOpen(false)}
      />
    </Box>
  );
};

export default QCDivisionPage;
