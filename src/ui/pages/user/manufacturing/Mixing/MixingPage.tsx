import React, { useMemo, useState } from "react";
import { Box } from "@mui/material";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import WorkflowFormOpeningLoader from "../../../../components/common/WorkflowFormOpeningLoader";
import MixingList from "./MixingList";
import MixingForm from "./MixingForm";
import MixingHeader from "./MixingHeader";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { MIXING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";
import useMixingHook from "../../../../../hooks/user/manufacturing/useMixingHook";
import { STRINGS } from "../../../../../app/config/strings";
import MixingDetailsView from "./MixingDetailsView";
import type { MixCardStageType } from "../../../../../data/models/user/MixingFormModel";

const MixingPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const actionStrings = STRINGS.SOURCING.SPECIFICATION_FORM;
  const S = STRINGS.MANUFACTURING.MIXING;
  const [mixCardDraftConfirmOpen, setMixCardDraftConfirmOpen] = useState(false);
  const [mixCardSubmitConfirmOpen, setMixCardSubmitConfirmOpen] = useState(false);
  const [pendingMixCard, setPendingMixCard] = useState<{
    stageType: MixCardStageType;
    cardNo: string;
  } | null>(null);

  const hookState = useMixingHook();

  const {
    loading,
    loadingFormDetails,
    view,
    activeBatch,
    isEditMode,
    formData,
    numberOfPremix,
    motorStage,
    mixCardStatusById,
    getMixCardStatus,
    isMixCardEditable,
    previousStageGate,
    actionLoading,
    backConfirmOpen,
    setBackConfirmOpen,
    handleBack,
    handleDiscardAndBack,
    handleFormChange,
    handleSaveMixCardDraft,
    handleSubmitMixCard,
    handleSubmitForFinalApproval,
    detailsRow,
    detailsData,
    detailsLoading,
    handleBackFromDetails,
  } = hookState;

  const listLoading = loading && !loadingFormDetails && view === "list";

  return (
    <Box sx={theme.workflow.animatedContainer}>
      <WorkflowFormOpeningLoader
        open={listLoading || Boolean(loadingFormDetails)}
        title={loadingFormDetails ? S.FORM_OPENING_TITLE : S.TITLE}
        message={
          loadingFormDetails ? S.FORM_OPENING_MESSAGE : "Loading mixing batches…"
        }
        color={MIXING_BRAND.mx}
        accentColor={MIXING_BRAND.mxLight}
      />

      {view === "list" && !listLoading && <MixingList hookState={hookState} />}

      {view === "details" && detailsRow && (
        <MixingDetailsView
          row={detailsRow}
          data={detailsData}
          loading={detailsLoading}
          onBack={handleBackFromDetails}
        />
      )}

      {view === "form" && activeBatch && !loadingFormDetails && (
        <>
          <MixingHeader batch={activeBatch} isEdit={isEditMode} onBack={handleBack} theme={theme} />
          <MixingForm
            initialData={formData}
            numberOfPremix={numberOfPremix}
            motorStage={motorStage}
            onBlocksChange={handleFormChange}
            identificationSheet={activeBatch?.identificationSheet}
            mixCardStatusById={mixCardStatusById}
            getMixCardStatus={getMixCardStatus}
            isMixCardEditable={isMixCardEditable}
            previousStageGate={previousStageGate}
            actionLoading={actionLoading}
            canSubmitForFinalApproval={Boolean(activeBatch?.formId)}
            onSaveMixCardDraft={(stageType, cardNo) => {
              setPendingMixCard({ stageType, cardNo });
              setMixCardDraftConfirmOpen(true);
            }}
            onSubmitMixCard={(stageType, cardNo) => {
              setPendingMixCard({ stageType, cardNo });
              setMixCardSubmitConfirmOpen(true);
            }}
            onSubmitForFinalApproval={handleSubmitForFinalApproval}
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
            open={mixCardDraftConfirmOpen}
            severity="warning"
            title={actionStrings.CONFIRM_DRAFT_TITLE}
            message={actionStrings.CONFIRM_DRAFT_MESSAGE}
            confirmLabel={actionStrings.CONFIRM_DRAFT_ACTION}
            cancelLabel={actionStrings.CONFIRM_DRAFT_CANCEL_ACTION}
            onConfirm={async () => {
              setMixCardDraftConfirmOpen(false);
              if (!pendingMixCard) return;
              await handleSaveMixCardDraft(pendingMixCard.stageType, pendingMixCard.cardNo);
              setPendingMixCard(null);
            }}
            onCancel={() => {
              setMixCardDraftConfirmOpen(false);
              setPendingMixCard(null);
            }}
          />

          <ConfirmAlertDialog
            open={mixCardSubmitConfirmOpen}
            severity="warning"
            title={actionStrings.CONFIRM_SUBMIT_TITLE}
            message={actionStrings.CONFIRM_SUBMIT_MESSAGE}
            confirmLabel={actionStrings.CONFIRM_SUBMIT_ACTION}
            cancelLabel={actionStrings.CONFIRM_CANCEL_ACTION}
            onConfirm={async () => {
              setMixCardSubmitConfirmOpen(false);
              if (!pendingMixCard) return;
              await handleSubmitMixCard(pendingMixCard.stageType, pendingMixCard.cardNo);
              setPendingMixCard(null);
            }}
            onCancel={() => {
              setMixCardSubmitConfirmOpen(false);
              setPendingMixCard(null);
            }}
          />
        </>
      )}
    </Box>
  );
};

export default MixingPage;
