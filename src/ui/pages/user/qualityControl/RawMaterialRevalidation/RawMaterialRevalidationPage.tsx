// src/ui/pages/user/quality_control/raw_material_revalidation/QCRawMaterialPage.jsx

import React, { useMemo } from "react";
import { Box } from "@mui/material";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import RawMaterialRevalidationList from "./RawMaterialRevalidationList";
import RawMaterialRevalidationFormView from "./RawMaterialRevalidationFormView";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import { STRINGS } from "../../../../../app/config/strings";
import useRawMaterialRevalidationHook from "../../../../../hooks/user/qualityControl/useRawMaterialRevalidationHook";

const RawMaterialRevalidationPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getQualityControlTheme(mode), [mode]);
  const hookState = useRawMaterialRevalidationHook();
  const {
    view,
    activeBatch,
    isEditMode,
    formBlocks,
    loadingFormDetails,
    actionLoading,
    backConfirmOpen,
    setBackConfirmOpen,
    handleBlocksChange,
    handleDiscardAndBack,
    handleBack,
    handleSaveDraft,
    handleSubmit,
  } = hookState;

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <Box sx={theme.workflow.animatedContainer}>
        <RawMaterialRevalidationList hookState={hookState} />
      </Box>
    );
  }

  // ── FORM VIEW ──────────────────────────────────────────────────────────────
  return (
    <Box sx={theme.workflow.animatedContainer}>
      <UserWorkflowFormHeader
        batch={activeBatch}
        isEdit={isEditMode}
        onBack={handleBack}
        newLabel={STRINGS.QUALITY_CONTROL.RAW_MATERIAL_REVALIDATION.NEW_LABEL}
        backLabel={STRINGS.QUALITY_CONTROL.FORM_HEADER.BACK_TO_LIST}
        editLabel={STRINGS.QUALITY_CONTROL.FORM_HEADER.EDITING_REJECTED}
        rejectionTitle={STRINGS.QUALITY_CONTROL.FORM_HEADER.REJECTION_REASON}
        theme={theme}
      />
      {!loadingFormDetails && activeBatch && (
        <RawMaterialRevalidationFormView
          initialBlocks={formBlocks}
          isEditMode={isEditMode}
          onBlocksChange={handleBlocksChange}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          actionLoading={actionLoading}
        />
      )}

      <ConfirmAlertDialog
        open={backConfirmOpen}
        severity="warning"
        title={STRINGS.QUALITY_CONTROL.RAW_MATERIAL_REVALIDATION.UNSAVED_BACK_TITLE}
        message={STRINGS.QUALITY_CONTROL.RAW_MATERIAL_REVALIDATION.UNSAVED_BACK_MESSAGE}
        confirmLabel={STRINGS.QUALITY_CONTROL.RAW_MATERIAL_REVALIDATION.UNSAVED_BACK_DISCARD}
        cancelLabel={STRINGS.QUALITY_CONTROL.RAW_MATERIAL_REVALIDATION.UNSAVED_BACK_CONFIRM}
        onConfirm={handleDiscardAndBack}
        onCancel={() => setBackConfirmOpen(false)}
      />
    </Box>
  );
};

export default RawMaterialRevalidationPage;
