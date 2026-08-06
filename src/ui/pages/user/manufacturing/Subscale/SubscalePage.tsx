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

const SubscalePage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const actionStrings = STRINGS.SOURCING.SPECIFICATION_FORM;
  const S = STRINGS.MANUFACTURING.SUBSCALE;
  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

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
    handleSubmit,
    schemaLoading,
    schemaError,
    subDepartmentId,
    detailsRow,
    detailsData,
    detailsLoading,
    handleBackFromDetails,
    batchDetails,
  } = hookState;

  const listLoading = loading && !loadingFormDetails && view === "list";

  return (
    <Box sx={theme.workflow.animatedContainer}>
      <WorkflowFormOpeningLoader
        open={listLoading || Boolean(loadingFormDetails)}
        title={loadingFormDetails ? S.FORM_OPENING_TITLE : S.TITLE}
        message={
          loadingFormDetails
            ? S.FORM_OPENING_MESSAGE
            : "Loading subscale batches…"
        }
        color={SUBSCALE_BRAND.ss}
        accentColor={SUBSCALE_BRAND.ssLight}
      />

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
          <SubscaleHeader batch={activeBatch} isEdit={isEditMode} onBack={handleBack} theme={theme} />
          <SubscaleForm
            batch={activeBatch}
            formData={formData}
            subDepartmentId={subDepartmentId}
            schemaLoading={schemaLoading}
            schemaError={schemaError}
            onFormValuesChange={handleFormValuesChange}
            theme={theme}
            batchDetails={batchDetails}
            actionLoading={actionLoading}
            isEditMode={isEditMode}
            onRequestSaveDraft={() => setDraftConfirmOpen(true)}
            onRequestSubmit={() => setSubmitConfirmOpen(true)}
          />

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
              isEditMode
                ? actionStrings.CONFIRM_RESUBMIT_MESSAGE
                : actionStrings.CONFIRM_SUBMIT_MESSAGE
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
        </>
      )}
    </Box>
  );
};

export default SubscalePage;
