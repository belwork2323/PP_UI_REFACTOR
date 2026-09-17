import React, { useMemo, useState } from "react";
import { Box } from "@mui/material";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import WorkflowFormOpeningLoader from "../../../../components/common/WorkflowFormOpeningLoader";
import SubscaleList from "./SubscaleList";
import SubscaleForm from "./SubscaleForm";
import SubscaleHeader from "./SubscaleHeader";
import SubscaleDetailsView from "./SubscaleDetailsView";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { SUBSCALE_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/subscale_theme";
import useSubscaleHook from "../../../../../hooks/user/manufacturing/useSubscaleHook";
import { STRINGS } from "../../../../../app/config/strings";
import validateSubscale, {
  firstSubscaleValidationError,
} from "@/data/validation/adapters/subscale.validation";
import { useAlertStore } from "../../../../../app/store/alertStore";

const SubscalePage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const actionStrings = STRINGS.SOURCING.SPECIFICATION_FORM;
  const S = STRINGS.MANUFACTURING.SUBSCALE;
  const showValidationAlert = useAlertStore((state) => state.showValidationAlert);

  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const hookState = useSubscaleHook();

  const {
    loading,
    loadingFormDetails,
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
    handleSubmit: subScaleFormSubmission,
    subDepartmentId,
    detailsRow,
    detailsData,
    detailsLoading,
    handleBackFromDetails,
    batchDetails,
  } = hookState;

  const listLoading = loading && !loadingFormDetails && view === "list";

  const notifySubscaleValidationErrors = (
    errors: Record<string, string>,
    intent: "draft" | "submit",
  ) => {
    const firstError = firstSubscaleValidationError(errors);
    const base =
      intent === "draft" ? S.DRAFT_VALIDATION_FAILED : S.SUBMIT_VALIDATION_FAILED;
    showValidationAlert(firstError ? `${base} (${firstError})` : base);
  };

  const buildValidationPayload = () => ({
    ...formData.schemaFormValues,
    batchType: activeBatch.batchType,
    subBatchType: batchDetails.subBatchType,
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateSubscale(buildValidationPayload(), "SUBMIT");
    if (errors && Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      notifySubscaleValidationErrors(errors, "submit");
      return;
    }
    setValidationErrors({});
    setSubmitConfirmOpen(true);
  };

  const handleFinalSubmit = async () => {
    setSubmitConfirmOpen(false);
    await subScaleFormSubmission();
  };

  const handleFinalDraft = async () => {
    await handleSaveDraft();
    setDraftConfirmOpen(false);
  };

  const handleDraftValidation = async () => {
    // FORMAT: only validate filled values; empty fields do not block draft save.
    const errors = validateSubscale(buildValidationPayload(), "FORMAT");
    if (errors && Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      notifySubscaleValidationErrors(errors, "draft");
      return;
    }
    setValidationErrors({});
    setDraftConfirmOpen(true);
  };
  const clearFieldError = (ruleKey: string) => {
    setValidationErrors((prev) => {
      if (!prev || !Object.prototype.hasOwnProperty.call(prev, ruleKey)) {
        return prev;
      }
      const next = { ...prev };
      delete next[ruleKey];
      return next;
    });
  };
  return (
    <Box sx={theme.workflow.animatedContainer}>
      <WorkflowFormOpeningLoader
        open={listLoading || Boolean(loadingFormDetails)}
        title={loadingFormDetails ? S.FORM_OPENING_TITLE : S.TITLE}
        message={loadingFormDetails ? S.FORM_OPENING_MESSAGE : "Loading subscale batches…"}
        color={SUBSCALE_BRAND.ss}
        accentColor={SUBSCALE_BRAND.ssLight}
      />

      <form onSubmit={handleFormSubmit}>
        {view === "list" && !listLoading && <SubscaleList hookState={hookState} />}

        {view === "details" && detailsRow && (
          <SubscaleDetailsView
            row={detailsRow}
            data={detailsData}
            loading={detailsLoading}
            onBack={handleBackFromDetails}
          />
        )}

        {view === "form" && activeBatch && !loadingFormDetails && (
          <>
            <SubscaleHeader
              batch={activeBatch}
              isEdit={isEditMode}
              onBack={handleBack}
              theme={theme}
            />
            <SubscaleForm
              batch={activeBatch}
              formData={formData}
              subDepartmentId={subDepartmentId}
              onFormValuesChange={handleFormValuesChange}
              theme={theme}
              batchDetails={batchDetails}
              actionLoading={actionLoading}
              isEditMode={isEditMode}
              errors={validationErrors}
              clearFieldError={clearFieldError}
              onRequestSaveDraft={handleDraftValidation}
            />

            <ConfirmAlertDialog
              open={backConfirmOpen}
              severity="warning"
              title={S.UNSAVED_BACK_TITLE}
              message={S.UNSAVED_BACK_MESSAGE}
              confirmLabel={S.UNSAVED_BACK_DISCARD}
              cancelLabel={S.UNSAVED_BACK_CONFIRM}
              onConfirm={() => {
                handleDiscardAndBack();
                setValidationErrors({});
              }}
              onCancel={() => setBackConfirmOpen(false)}
            />

            <ConfirmAlertDialog
              open={draftConfirmOpen}
              severity="warning"
              title={actionStrings.CONFIRM_DRAFT_TITLE}
              message={actionStrings.CONFIRM_DRAFT_MESSAGE}
              confirmLabel={actionStrings.CONFIRM_DRAFT_ACTION}
              cancelLabel={actionStrings.CONFIRM_DRAFT_CANCEL_ACTION}
              onConfirm={handleFinalDraft}
              onCancel={() => setDraftConfirmOpen(false)}
            />

            {/* Submit Confirmation Dialog */}
            <ConfirmAlertDialog
              open={submitConfirmOpen}
              severity="warning"
              title={
                isEditMode
                  ? actionStrings.CONFIRM_RESUBMIT_TITLE
                  : actionStrings.CONFIRM_SUBMIT_TITLE
              }
              message={
                isEditMode
                  ? actionStrings.CONFIRM_RESUBMIT_MESSAGE
                  : actionStrings.CONFIRM_SUBMIT_MESSAGE
              }
              confirmLabel={
                isEditMode
                  ? actionStrings.CONFIRM_RESUBMIT_ACTION
                  : actionStrings.CONFIRM_SUBMIT_ACTION
              }
              cancelLabel={actionStrings.CONFIRM_CANCEL_ACTION}
              onConfirm={handleFinalSubmit}
              onCancel={() => setSubmitConfirmOpen(false)}
            />
          </>
        )}
      </form>
    </Box>
  );
};

export default SubscalePage;
