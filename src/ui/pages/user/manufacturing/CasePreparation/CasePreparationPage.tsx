// src/ui/pages/user/manufacturing/CasePreparation/CasePreparationPage.tsx

import React, { useMemo, useState } from "react";
import { Box, Button, CircularProgress, Stack } from "@mui/material";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import WorkflowFormOpeningLoader from "../../../../components/common/WorkflowFormOpeningLoader";
import CasePrepList from "./CasePreparationList";
import CasePreparationForm from "./CasePreparationForm";
import CasePreparationHeader from "./CasePreparationHeader";
import CasePreparationDetailsView from "./CasePreparationDetailsView";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { CASE_PREP_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/casePreparation_theme";
import useCasePreparationHook from "../../../../../hooks/user/manufacturing/useCasePreparationWorkflowHook";
import { isSubscaleBatch } from "../../../../../hooks/user/manufacturing/casePreparationFlowConfig";
import { STRINGS } from "../../../../../app/config/strings";

const CasePreparationPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const actionStrings = STRINGS.SOURCING.SPECIFICATION_FORM;
  const S = STRINGS.MANUFACTURING.CASE_PREP;
  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [motorDraftConfirmOpen, setMotorDraftConfirmOpen] = useState(false);
  const [motorSubmitConfirmOpen, setMotorSubmitConfirmOpen] = useState(false);
  const [pendingMotorId, setPendingMotorId] = useState<string | null>(null);

  const hookState = useCasePreparationHook();
  const {
    loading,
    loadingFormDetails,
    view,
    activeBatch,
    isEditMode,
    formData,
    addedMotors,
    batchMotorCount,
    motorStatusById,
    getMotorStatus,
    isMotorEditable,
    schemaLoading,
    schemaError,
    subDepartmentId,
    actionLoading,
    backConfirmOpen,
    setBackConfirmOpen,
    detailsRow,
    detailsData,
    detailsLoading,
    handleViewCasePrepDetails,
    handleBackFromDetails,
    handleBack,
    handleDiscardAndBack,
    handleMotorSessionChange,
    handleSubscaleValuesChange,
    handleSaveMotorDraft,
    handleSubmitMotor,
    handleSaveDraft,
    handleSubmit,
  } = hookState;

  const listLoading = loading && !loadingFormDetails && view === "list";
  const isSubscale = isSubscaleBatch(activeBatch?.batchType);
  // Full-page opener only when leaving the list / first open — not on draft refresh.
  const showFullPageLoader =
    listLoading || (Boolean(loadingFormDetails) && view !== "form");

  return (
    <Box sx={theme.workflow.animatedContainer}>
      <WorkflowFormOpeningLoader
        open={showFullPageLoader}
        title={loadingFormDetails ? S.FORM_OPENING_TITLE : S.TITLE}
        message={loadingFormDetails ? S.FORM_OPENING_MESSAGE : "Loading case preparation batches…"}
        color={CASE_PREP_BRAND.cp}
        accentColor={CASE_PREP_BRAND.cpLight}
      />

      {view === "list" && !listLoading && <CasePrepList hookState={hookState} />}

      {view === "details" && detailsRow && (
        <CasePreparationDetailsView
          row={detailsRow}
          data={detailsData}
          loading={detailsLoading}
          onBack={handleBackFromDetails}
        />
      )}

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
              <CircularProgress size={28} sx={{ color: CASE_PREP_BRAND.cp }} />
            </Box>
          ) : null}
          <CasePreparationHeader
            batch={activeBatch}
            isEdit={isEditMode}
            onBack={handleBack}
            theme={theme}
          />
          <CasePreparationForm
            batch={activeBatch}
            formData={formData}
            addedMotors={addedMotors}
            batchMotorCount={batchMotorCount}
            motorStatusById={motorStatusById}
            getMotorStatus={getMotorStatus}
            isMotorEditable={isMotorEditable}
            schemaLoading={schemaLoading}
            schemaError={schemaError}
            subDepartmentId={subDepartmentId}
            actionLoading={actionLoading}
            onMotorSessionChange={handleMotorSessionChange}
            onSubscaleValuesChange={handleSubscaleValuesChange}
            onSaveMotorDraft={(motorId) => {
              setPendingMotorId(motorId);
              setMotorDraftConfirmOpen(true);
            }}
            onSubmitMotor={(motorId) => {
              setPendingMotorId(motorId);
              setMotorSubmitConfirmOpen(true);
            }}
            theme={theme}
          />

          {isSubscale ? (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              gap={1.5}
              mt={3}
              justifyContent="flex-end"
            >
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
        title={
          isEditMode ? actionStrings.CONFIRM_RESUBMIT_TITLE : actionStrings.CONFIRM_SUBMIT_TITLE
        }
        message={
          isEditMode ? actionStrings.CONFIRM_RESUBMIT_MESSAGE : actionStrings.CONFIRM_SUBMIT_MESSAGE
        }
        confirmLabel={
          isEditMode ? actionStrings.CONFIRM_RESUBMIT_ACTION : actionStrings.CONFIRM_SUBMIT_ACTION
        }
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
