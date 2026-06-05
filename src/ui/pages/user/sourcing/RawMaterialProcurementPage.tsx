import { Box } from "@mui/material";
import { useMemo } from "react";
import ConfirmAlertDialog from "../../../components/common/ConfirmAlertDialog";
import { useThemeStore } from "../../../../app/store/themeStore";
import getSourcingTheme from "../../../../app/theme/custom_themes/user/sourcing/sourcing_theme";
import useRawMaterialProcurementHook from "../../../../hooks/user/sourcing/useRawMaterialProcurementHook";
import UserWorkflowFormHeader from "../../../components/custom/UserWorkflowFormHeader";
import RawMaterialBatchList from "./components/RawMaterialBatchList";
import RawMaterialLotDetailsView from "./components/RawMaterialLotDetailsView";
import SpecificationFormBuilder from "./components/SpecificationFormBuilder";
import { STRINGS } from "../../../../app/config/strings";

const RawMaterialProcurement = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getSourcingTheme(mode), [mode]);

  const hookState = useRawMaterialProcurementHook();
  const {
    view,
    detailsRow,
    detailsBlocks,
    loadingDetails,
    handleBackFromDetails,
    activeBatch,
    isEditMode,
    formEntryMode,
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
    deleteConfirmOpen,
    deleteLoading,
    canDeleteActiveLot,
    closeDeleteLotConfirm,
    handleConfirmDeleteLot,
    handleDeleteLotFromForm,
  } = hookState;

  const createLotHeaderHeading =
    !isEditMode && formEntryMode === "create"
      ? {
          title: STRINGS.SOURCING.RAW_MATERIAL.FORM_HEADER_CREATE_LOT_TITLE,
          subtitle: STRINGS.SOURCING.RAW_MATERIAL.FORM_HEADER_CREATE_LOT_SUBTITLE,
        }
      : undefined;

  return (
    <Box sx={theme.workflow.animatedContainer}>
      {view === "list" && (
        <RawMaterialBatchList hookState={hookState} />
      )}

      {view === "details" && detailsRow && (
        <RawMaterialLotDetailsView
          row={detailsRow}
          blocks={detailsBlocks}
          loading={loadingDetails}
          onBack={handleBackFromDetails}
        />
      )}

      {view === "form" && activeBatch && (
        <Box>
          <UserWorkflowFormHeader
            batch={activeBatch}
            isEdit={isEditMode}
            onBack={handleBack}
            newLabel={STRINGS.SOURCING.RAW_MATERIAL.NEW_SUBMISSION}
            batchHeadingOverride={createLotHeaderHeading}
            theme={theme}
          />

          {!loadingFormDetails && (
            <SpecificationFormBuilder
              key={`rm-spec-${formEntryMode}-${activeBatch.lotId || activeBatch.procurementId || "new"}`}
              initialBlocks={formEntryMode === "create" ? [] : formBlocks}
              isEditMode={isEditMode}
              createLotMode={formEntryMode === "create"}
              lockLotNo={formEntryMode !== "create"}
              onBlocksChange={handleBlocksChange}
              onSaveDraft={handleSaveDraft}
              onSubmit={handleSubmit}
              actionLoading={actionLoading}
              showDeleteLot={canDeleteActiveLot}
              onDeleteLot={handleDeleteLotFromForm}
              deleteLoading={deleteLoading}
            />
          )}
        </Box>
      )}

      <ConfirmAlertDialog
        open={backConfirmOpen}
        severity="warning"
        title={STRINGS.SOURCING.SPECIFICATION_FORM.UNSAVED_BACK_TITLE}
        message={STRINGS.SOURCING.SPECIFICATION_FORM.UNSAVED_BACK_MESSAGE}
        confirmLabel={STRINGS.SOURCING.SPECIFICATION_FORM.UNSAVED_BACK_DISCARD}
        cancelLabel={STRINGS.SOURCING.SPECIFICATION_FORM.UNSAVED_BACK_CONFIRM}
        onConfirm={handleDiscardAndBack}
        onCancel={() => setBackConfirmOpen(false)}
      />

      <ConfirmAlertDialog
        open={deleteConfirmOpen}
        severity="error"
        title={STRINGS.SOURCING.SPECIFICATION_FORM.CONFIRM_DELETE_TITLE}
        message={STRINGS.SOURCING.SPECIFICATION_FORM.CONFIRM_DELETE_MESSAGE}
        confirmLabel={STRINGS.SOURCING.SPECIFICATION_FORM.CONFIRM_DELETE_ACTION}
        cancelLabel={STRINGS.SOURCING.SPECIFICATION_FORM.CONFIRM_DRAFT_CANCEL_ACTION}
        onConfirm={handleConfirmDeleteLot}
        onCancel={closeDeleteLotConfirm}
      />
    </Box>
  );
};

export default RawMaterialProcurement;
