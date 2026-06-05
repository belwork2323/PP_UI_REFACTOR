// src/ui/pages/user/quality_control/static_test_facility/STFPage.jsx

import React, { useMemo } from "react";
import { Box, CircularProgress } from "@mui/material";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import STFList from "./StaticTestFacilityList";
import STFForm from "./StaticTestFacilityFormView";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import { STRINGS } from "../../../../../app/config/strings";
import useStaticTestFacilityHook from "../../../../../hooks/user/qualityControl/useStaticTestFacilityWorkflowHook";

const STFPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getQualityControlTheme(mode), [mode]);
  const hookState = useStaticTestFacilityHook();
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
    handleFormChange,
    handleDiscardAndBack,
    handleSaveDraft,
    handleSubmit,
  } = hookState;

  if (loading)
    return (
      <Box sx={theme.workflow.loadingContainer}>
        <CircularProgress size={32} />
      </Box>
    );

  if (view === "list")
    return (
      <Box sx={theme.workflow.animatedContainer}>
        <STFList hookState={hookState} />
      </Box>
    );

  return (
    <Box sx={theme.workflow.animatedContainer}>
      <UserWorkflowFormHeader batch={activeBatch} isEdit={isEditMode} onBack={handleBack} newLabel={STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY.NEW_LABEL} backLabel={STRINGS.QUALITY_CONTROL.FORM_HEADER.BACK_TO_LIST} editLabel={STRINGS.QUALITY_CONTROL.FORM_HEADER.EDITING_REJECTED} rejectionTitle={STRINGS.QUALITY_CONTROL.FORM_HEADER.REJECTION_REASON} theme={theme} />
      {!loadingFormDetails && activeBatch && (
        <STFForm
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
        title={STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY.UNSAVED_BACK_TITLE}
        message={STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY.UNSAVED_BACK_MESSAGE}
        confirmLabel={STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY.UNSAVED_BACK_DISCARD}
        cancelLabel={STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY.UNSAVED_BACK_CONFIRM}
        onConfirm={handleDiscardAndBack}
        onCancel={() => setBackConfirmOpen(false)}
      />
    </Box>
  );
};

export default STFPage;
