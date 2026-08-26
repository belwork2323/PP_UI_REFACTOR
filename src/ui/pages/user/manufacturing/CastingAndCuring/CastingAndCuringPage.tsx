import React, { useMemo, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import WorkflowFormOpeningLoader from "../../../../components/common/WorkflowFormOpeningLoader";
import CastingCuringList from "./CastingAndCuringList";
import CastingCuringForm from "./CastingAndCuringForm";
import CastingAndCuringHeader from "./CastingAndCuringHeader";
import CastingCuringDetailsView from "./CastingCuringDetailsView";
import { useThemeStore } from "../../../../../app/store/themeStore";
import { getManufacturingTheme } from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { CASTING_CURING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/castingAndCuring_theme";
import useCastingAndCuringHook from "../../../../../hooks/user/manufacturing/useCastingAndCuringHook";
import { STRINGS } from "../../../../../app/config/strings";

const CastingCuringPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const actionStrings = STRINGS.SOURCING.SPECIFICATION_FORM;
  const S = STRINGS.MANUFACTURING.CASTING_CURING;
  const [motorDraftConfirmOpen, setMotorDraftConfirmOpen] = useState(false);
  const [motorSubmitConfirmOpen, setMotorSubmitConfirmOpen] = useState(false);
  const [pendingMotorId, setPendingMotorId] = useState<string | null>(null);

  const hookState = useCastingAndCuringHook();
  const {
    loading,
    loadingFormDetails,
    view,
    activeBatch,
    isEditMode,
    formData,
    castingMotorDraftsById,
    addedMotors,
    curingCycleConfig,
    curingCyclesLoading,
    actionLoading,
    backConfirmOpen,
    setBackConfirmOpen,
    handleBack,
    handleDiscardAndBack,
    handleCastingMotorDraftChange,
    handleLoadCastingForm,
    handleLoadCuringForm,
    getCuringSetupDraft,
    getCrossMotorExcludedBowlSelections,
    handleCuringSetupDraftChange,
    fetchCuringCycleConfig,
    handleMotorSessionChange,
    handleRemoveMotor,
    handleSaveMotorDraft,
    handleSubmitMotor,
    motorStatusById,
    getMotorStatus,
    isMotorEditable,
    previousStageGate,
    detailsRow,
    detailsData,
    detailsLoading,
    handleBackFromDetails,
  } = hookState;

  const listLoading = loading && !loadingFormDetails && view === "list";
  // Full-page opener only when leaving the list / first open — not on draft refresh.
  const showFullPageLoader =
    listLoading || (Boolean(loadingFormDetails) && view !== "form");

  return (
    <Box sx={theme.workflow.animatedContainer}>
      <WorkflowFormOpeningLoader
        open={showFullPageLoader}
        title={loadingFormDetails ? S.FORM_OPENING_TITLE : S.TITLE}
        message={
          loadingFormDetails
            ? S.FORM_OPENING_MESSAGE
            : "Loading casting and curing batches…"
        }
        color={CASTING_CURING_BRAND.cc}
        accentColor={CASTING_CURING_BRAND.ccLight}
      />

      {view === "list" && !listLoading && <CastingCuringList hookState={hookState} />}

      {view === "details" &&
        (detailsData ? (
          <CastingCuringDetailsView
            row={detailsRow ?? {}}
            data={detailsData}
            loading={detailsLoading}
            onBack={handleBackFromDetails}
          />
        ) : (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={28} />
          </Box>
        ))}

      {view === "form" && activeBatch && (
        <>
          {actionLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 1.5,
                mb: 1,
              }}
            >
              <CircularProgress size={28} sx={{ color: CASTING_CURING_BRAND.cc }} />
            </Box>
          ) : null}
          <CastingAndCuringHeader batch={activeBatch} isEdit={isEditMode} onBack={handleBack} />
          <CastingCuringForm
            batch={activeBatch}
            formData={formData}
            castingMotorDraftsById={castingMotorDraftsById}
            addedMotors={addedMotors}
            curingCycleConfig={curingCycleConfig}
            curingCyclesLoading={curingCyclesLoading}
            onFetchCuringCycleConfig={fetchCuringCycleConfig}
            onCastingMotorDraftChange={handleCastingMotorDraftChange}
            onLoadCastingForm={handleLoadCastingForm}
            onLoadCuringForm={handleLoadCuringForm}
            getCuringSetupDraft={getCuringSetupDraft}
            getCrossMotorExcludedBowlSelections={getCrossMotorExcludedBowlSelections}
            onCuringSetupDraftChange={handleCuringSetupDraftChange}
            onMotorSessionChange={handleMotorSessionChange}
            onRemoveMotor={handleRemoveMotor}
            motorStatusById={motorStatusById}
            getMotorStatus={getMotorStatus}
            isMotorEditable={isMotorEditable}
            previousStageGate={previousStageGate}
            onSaveMotorDraft={(motorId) => {
              setPendingMotorId(motorId);
              setMotorDraftConfirmOpen(true);
            }}
            onSubmitMotor={(motorId) => {
              setPendingMotorId(motorId);
              setMotorSubmitConfirmOpen(true);
            }}
            actionLoading={actionLoading}
            theme={theme}
          />
        </>
      )}

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
    </Box>
  );
};

export default CastingCuringPage;
