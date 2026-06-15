import React, { useMemo, useState } from "react";
import { Box, CircularProgress, Button, Stack } from "@mui/material";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import CastingCuringList from "./CastingAndCuringList";
import CastingCuringForm from "./CastingAndCuringForm";
import CastingAndCuringHeader from "./CastingAndCuringHeader";
import { useThemeStore } from "../../../../../app/store/themeStore";
import { getManufacturingTheme } from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import useCastingAndCuringHook from "../../../../../hooks/user/manufacturing/useCastingAndCuringHook";
import { STRINGS } from "../../../../../app/config/strings";

const CastingCuringPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const actionStrings = STRINGS.SOURCING.SPECIFICATION_FORM;
  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

  const hookState = useCastingAndCuringHook();
  const {
    loading,
    view,
    activeBatch,
    isEditMode,
    formData,
    castingType,
    castingStation,
    motorCount,
    draftMotorIds,
    motorReceivedAt,
    castingSetupDraft,
    addedMotors,
    schemaLoading,
    schemaError,
    castingSchemaError,
    curingSchemaError,
    subDepartmentId,
    actionLoading,
    backConfirmOpen,
    setBackConfirmOpen,
    handleBack,
    handleDiscardAndBack,
    setCastingType,
    setCastingStation,
    handleMotorCountChange,
    handleDraftMotorIdChange,
    setMotorReceivedAt,
    handleSetupDraftChange,
    handleLoadCastingForm,
    handleRemoveLoadedCastingForm,
    handleLoadCuringForm,
    getCuringSetupDraft,
    handleCuringSetupDraftChange,
    handleMotorSessionChange,
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

  return (
    <Box sx={theme.workflow.animatedContainer}>
      {view === "list" && <CastingCuringList hookState={hookState} />}

      {view === "form" && activeBatch && (
        <>
          <CastingAndCuringHeader batch={activeBatch} isEdit={isEditMode} onBack={handleBack} />
          <CastingCuringForm
            batch={activeBatch}
            formData={formData}
            castingType={castingType}
            castingStation={castingStation}
            motorCount={motorCount}
            draftMotorIds={draftMotorIds}
            motorReceivedAt={motorReceivedAt}
            castingSetupDraft={castingSetupDraft}
            addedMotors={addedMotors}
            schemaLoading={schemaLoading}
            schemaError={schemaError}
            castingSchemaError={castingSchemaError}
            curingSchemaError={curingSchemaError}
            subDepartmentId={subDepartmentId}
            onCastingTypeChange={setCastingType}
            onCastingStationChange={setCastingStation}
            onMotorCountChange={handleMotorCountChange}
            onDraftMotorIdChange={handleDraftMotorIdChange}
            onMotorReceivedAtChange={setMotorReceivedAt}
            onSetupDraftChange={handleSetupDraftChange}
            onLoadCastingForm={handleLoadCastingForm}
            onRemoveLoadedCastingForm={handleRemoveLoadedCastingForm}
            onLoadCuringForm={handleLoadCuringForm}
            getCuringSetupDraft={getCuringSetupDraft}
            onCuringSetupDraftChange={handleCuringSetupDraftChange}
            onMotorSessionChange={handleMotorSessionChange}
            theme={theme}
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
        </>
      )}

      <ConfirmAlertDialog
        open={backConfirmOpen}
        severity="warning"
        title={STRINGS.MANUFACTURING.CASTING_CURING.UNSAVED_BACK_TITLE}
        message={STRINGS.MANUFACTURING.CASTING_CURING.UNSAVED_BACK_MESSAGE}
        confirmLabel={STRINGS.MANUFACTURING.CASTING_CURING.UNSAVED_BACK_DISCARD}
        cancelLabel={STRINGS.MANUFACTURING.CASTING_CURING.UNSAVED_BACK_CONFIRM}
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

export default CastingCuringPage;
