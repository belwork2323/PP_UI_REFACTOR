import { Box } from "@mui/material";
import { useMemo } from "react";
import ConfirmAlertDialog from "../../../components/common/ConfirmAlertDialog";
import WorkflowFormOpeningLoader from "../../../components/common/WorkflowFormOpeningLoader";
import { useThemeStore } from "../../../../app/store/themeStore";
import getSourcingTheme from "../../../../app/theme/custom_themes/user/sourcing/sourcing_theme";
import useRocketMotorCasingHook from "../../../../hooks/user/sourcing/useRocketMotorCasingHook";
import UserWorkflowActionBar from "../../../components/custom/UserWorkflowActionBar";
import UserWorkflowFormHeader from "../../../components/custom/UserWorkflowFormHeader";
import { resolveWorkflowFormHeaderStatus } from "../../../components/custom/workflowFormHeaderStatus";
import UserWorkflowStatusCell from "../../../components/custom/UserWorkflowStatusCell";
import MotorCasingCreateForm from "./components/casing/MotorCasingCreateForm";
import RocketMotorBatchList, {
  OPERATION_STATUS_CONFIG,
} from "./components/RocketMotorBatchList";
import RocketMotorCasingDetailsView from "./components/RocketMotorCasingDetailsView";
import { STRINGS } from "../../../../app/config/strings";
import { OPERATION_STATUS } from "../../../../hooks/operationStatus";

const RocketMotorCasing = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getSourcingTheme(mode), [mode]);
  const strings = STRINGS.SOURCING.CASING;

  const hookState = useRocketMotorCasingHook();
  const {
    loading,
    view,
    detailsRow,
    detailsBlocks,
    loadingDetails,
    handleBackFromDetails,
    formEntryMode,
    activeBatch,
    isEditMode,
    casingForm,
    setCasingForm,
    loadingFormDetails,
    actionLoading,
    dimensionalParameters,
    dimensionalParametersErrorMessage,
    isDimensionalParamsLoading,
    fetchingMotorParams,
    resolvedMotorStage,
    subDepartmentId,
    lookups,
    backConfirmOpen,
    canSubmit,
    canSaveDraft,
    submitConfirm,
    draftConfirm,
    setBackConfirmOpen,
    setSubmitConfirm,
    setDraftConfirm,
    handleBack,
    handleDiscardAndBack,
    handleConfirmDraft,
    handleConfirmSubmit,
    deleteConfirmOpen,
    deleteLoading,
    canDeleteActiveCasing,
    closeDeleteCasingConfirm,
    handleConfirmDeleteCasing,
    handleDeleteCasingFromForm,
  } = hookState;

  const headerMotorCasingId = String(casingForm.motorCasingId || activeBatch?.motorCasingId || "").trim();
  const headerMotorId = String(casingForm.motorId || activeBatch?.motorId || "").trim();
  const headerBatchId =
    headerMotorCasingId ||
    (activeBatch?.batchId && activeBatch.batchId !== "—" ? activeBatch.batchId : "");

  const createMotorCasingHeaderHeading =
    !isEditMode && formEntryMode === "create" && !headerMotorCasingId
      ? {
          title: STRINGS.SOURCING.CASING.FORM_HEADER_CREATE_MOTOR_CASING_TITLE,
          subtitle: STRINGS.SOURCING.CASING.FORM_HEADER_CREATE_MOTOR_CASING_SUBTITLE,
        }
      : undefined;

  const loadingDimensionalParams =
    Boolean(resolvedMotorStage) &&
    (fetchingMotorParams || isDimensionalParamsLoading(resolvedMotorStage));

  const lockIdentification =
    formEntryMode === "edit" ||
    (formEntryMode === "fill" && Boolean(String(casingForm.projectId ?? "").trim()));

  const formStatusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(OPERATION_STATUS_CONFIG).map(([status, cfg]) => [
          status,
          { ...cfg, ...theme.batchList.statusConfig[status] },
        ]),
      ),
    [theme],
  );

  const projectCaption = [
    String(activeBatch?.projectName ?? casingForm.projectName ?? "").trim(),
    String(activeBatch?.projectId ?? casingForm.projectId ?? "").trim(),
  ]
    .filter(Boolean)
    .join(" · ");

  const listLoading = loading && !loadingFormDetails && view === "list";

  return (
    <Box sx={theme.workflow.animatedContainer}>
      <WorkflowFormOpeningLoader
        open={listLoading || Boolean(loadingFormDetails)}
        title={loadingFormDetails ? strings.FORM_OPENING_TITLE : strings.TITLE}
        message={
          loadingFormDetails
            ? strings.FORM_OPENING_MESSAGE
            : "Loading rocket motor casing batches…"
        }
        color={theme.palette.primary}
        accentColor={theme.palette.primaryLight}
      />

      {view === "list" && !listLoading && (
        <RocketMotorBatchList hookState={hookState} rowsPerPageOptions={[5, 10, 25]} />
      )}

      {view === "details" && detailsRow && (
        <RocketMotorCasingDetailsView
          row={detailsRow}
          blocks={detailsBlocks}
          loading={loadingDetails}
          onBack={handleBackFromDetails}
        />
      )}

      {view === "form" && activeBatch && !loadingFormDetails && (
        <Box>
          <UserWorkflowFormHeader
            mode={createMotorCasingHeaderHeading ? "create" : "update"}
            data={{
              title: createMotorCasingHeaderHeading
                ? createMotorCasingHeaderHeading.title
                : headerMotorCasingId || headerBatchId || "—",
              subtitle: createMotorCasingHeaderHeading
                ? createMotorCasingHeaderHeading.subtitle
                : `${STRINGS.SOURCING.CASING_CREATE.MOTOR_ID}: ${headerMotorId || "—"}`,
              caption: createMotorCasingHeaderHeading ? undefined : projectCaption || undefined,
              ...(() => {
                const hs = resolveWorkflowFormHeaderStatus(activeBatch, {
                  preferredStatusKeys: ["rmStatus"],
                });
                return {
                  statusLabel: hs.statusLabel,
                  statusVariant: hs.statusVariant,
                  rejectionReason: hs.rejectionReason,
                };
              })(),
              statusNode: createMotorCasingHeaderHeading ? undefined : (
                <UserWorkflowStatusCell
                  status={activeBatch.rmStatus}
                  statusConfig={formStatusConfig}
                  rejectedStatus={OPERATION_STATUS.REJECTED}
                  rejectionReason={activeBatch.rejectionReason}
                  theme={theme}
                />
              ),
            }}
            onBack={handleBack}
            theme={theme}
          />

          <Box sx={{ mt: 2.5 }}>
            <MotorCasingCreateForm
              key={activeBatch.batchId ?? activeBatch.motorCasingId ?? "new-casing"}
              form={casingForm}
              setForm={setCasingForm}
              lookups={lookups}
              dimensionalParameters={dimensionalParameters}
              dimensionalParametersErrorMessage={dimensionalParametersErrorMessage}
              motorStage={resolvedMotorStage}
              subDepartmentId={subDepartmentId}
              loadingDimensionalParams={loadingDimensionalParams}
              lockIdentification={lockIdentification}
              showDeleteCasing={canDeleteActiveCasing}
              onDeleteCasing={handleDeleteCasingFromForm}
              deleteLoading={deleteLoading}
              theme={theme}
            />
          </Box>

          <UserWorkflowActionBar
            isEdit={isEditMode}
            canSubmit={canSubmit}
            canSaveDraft={canSaveDraft}
            readinessText={STRINGS.SOURCING.CASING_FORM.READY_TO_SUBMIT}
            pendingText={STRINGS.SOURCING.CASING_FORM.NOT_READY_TO_SUBMIT}
            helperText={STRINGS.SOURCING.CASING_FORM.ACTION_HELPER}
            saveLabel={STRINGS.SOURCING.CASING_FORM.SAVE_DRAFT}
            submitLabel={STRINGS.SOURCING.CASING_FORM.SUBMIT_APPROVAL}
            resubmitLabel={STRINGS.SOURCING.CASING_FORM.RESUBMIT_APPROVAL}
            saveTooltip={STRINGS.SOURCING.CASING_FORM.SAVE_TOOLTIP}
            disableActions={actionLoading}
            disableSubmit={actionLoading || loadingDimensionalParams}
            onSaveDraft={() => setDraftConfirm(true)}
            onSubmitClick={() => setSubmitConfirm(true)}
            theme={theme}
          />
        </Box>
      )}

      <ConfirmAlertDialog
        open={draftConfirm}
        severity="info"
        title={STRINGS.SOURCING.CASING_FORM.CONFIRM_DRAFT_TITLE}
        message={STRINGS.SOURCING.CASING_FORM.CONFIRM_DRAFT_MESSAGE}
        confirmLabel={STRINGS.SOURCING.CASING_FORM.CONFIRM_DRAFT_ACTION}
        cancelLabel={STRINGS.SOURCING.CASING_FORM.CONFIRM_DRAFT_CANCEL_ACTION}
        onConfirm={handleConfirmDraft}
        onCancel={() => setDraftConfirm(false)}
      />

      <ConfirmAlertDialog
        open={submitConfirm}
        severity="warning"
        title={
          isEditMode
            ? STRINGS.SOURCING.CASING_FORM.CONFIRM_RESUBMIT_TITLE
            : STRINGS.SOURCING.CASING_FORM.CONFIRM_SUBMIT_TITLE
        }
        message={
          isEditMode
            ? STRINGS.SOURCING.CASING_FORM.CONFIRM_RESUBMIT_MESSAGE
            : STRINGS.SOURCING.CASING_FORM.CONFIRM_SUBMIT_MESSAGE
        }
        confirmLabel={
          isEditMode
            ? STRINGS.SOURCING.CASING_FORM.CONFIRM_RESUBMIT_ACTION
            : STRINGS.SOURCING.CASING_FORM.CONFIRM_SUBMIT_ACTION
        }
        cancelLabel={STRINGS.SOURCING.CASING_FORM.CONFIRM_CANCEL_ACTION}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setSubmitConfirm(false)}
      />

      <ConfirmAlertDialog
        open={backConfirmOpen}
        severity="warning"
        title={STRINGS.SOURCING.CASING_FORM.UNSAVED_BACK_TITLE}
        message={STRINGS.SOURCING.CASING_FORM.UNSAVED_BACK_MESSAGE}
        confirmLabel={STRINGS.SOURCING.CASING_FORM.UNSAVED_BACK_DISCARD}
        cancelLabel={STRINGS.SOURCING.CASING_FORM.UNSAVED_BACK_CONFIRM}
        onConfirm={handleDiscardAndBack}
        onCancel={() => setBackConfirmOpen(false)}
      />

      <ConfirmAlertDialog
        open={deleteConfirmOpen}
        severity="error"
        title={STRINGS.SOURCING.CASING_FORM.CONFIRM_DELETE_TITLE}
        message={STRINGS.SOURCING.CASING_FORM.CONFIRM_DELETE_MESSAGE}
        confirmLabel={STRINGS.SOURCING.CASING_FORM.CONFIRM_DELETE_ACTION}
        cancelLabel={STRINGS.SOURCING.CASING_FORM.CONFIRM_DRAFT_CANCEL_ACTION}
        onConfirm={handleConfirmDeleteCasing}
        onCancel={closeDeleteCasingConfirm}
      />
    </Box>
  );
};

export default RocketMotorCasing;
