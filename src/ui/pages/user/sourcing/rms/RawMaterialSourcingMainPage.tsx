import { Box } from "@mui/material";
import { useMemo } from "react";
import ConfirmAlertDialog from "@ui/components/common/ConfirmAlertDialog";
import WorkflowFormOpeningLoader from "@ui/components/common/WorkflowFormOpeningLoader";
import { useThemeStore } from "@app/store/themeStore";
import { getRawMaterialSourcingPageTheme } from "@app/theme/custom_themes/user/sourcing/rms/rawMaterialSourcing_theme";
import useRawMaterialSourcingMain from "@hooks/user/sourcing/rms/useRawMaterialSourcingMain";
import RawMaterialSourcingListPage from "@ui/pages/user/sourcing/rms/RawMaterialSourcingListPage";
import RawMaterialSourcingFormPage from "@ui/pages/user/sourcing/rms/RawMaterialSourcingFormPage";
import RawMaterialSourcingDetailsPage from "@ui/pages/user/sourcing/rms/RawMaterialSourcingDetailsPage";
import { STRINGS } from "@app/config/strings";

const RawMaterialSourcingMainPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getRawMaterialSourcingPageTheme(mode), [mode]);
  const strings = STRINGS.SOURCING.RAW_MATERIAL;
  const formStrings = STRINGS.SOURCING.SPECIFICATION_FORM;

  const hookState = useRawMaterialSourcingMain();
  const {
    loading,
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

  const listLoading = loading && !loadingFormDetails && view === "list";

  return (
    <Box sx={theme.workflow.animatedContainer}>
      <WorkflowFormOpeningLoader
        open={listLoading || Boolean(loadingFormDetails)}
        title={loadingFormDetails ? strings.FORM_OPENING_TITLE : strings.TITLE}
        message={loadingFormDetails ? strings.FORM_OPENING_MESSAGE : "Loading raw material lots…"}
        color={theme.palette.primary}
        accentColor={theme.palette.primaryLight}
      />

      {view === "list" && !listLoading && <RawMaterialSourcingListPage hookState={hookState} />}

      {view === "details" && detailsRow && (
        <RawMaterialSourcingDetailsPage
          row={detailsRow}
          blocks={detailsBlocks}
          loading={loadingDetails}
          onBack={handleBackFromDetails}
        />
      )}

      {view === "form" && activeBatch && !loadingFormDetails && (
        <RawMaterialSourcingFormPage
          activeBatch={activeBatch}
          formEntryMode={formEntryMode}
          formBlocks={formBlocks}
          isEditMode={isEditMode}
          actionLoading={actionLoading}
          canDeleteActiveLot={canDeleteActiveLot}
          deleteLoading={deleteLoading}
          onBack={handleBack}
          onBlocksChange={handleBlocksChange}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          onDeleteLot={handleDeleteLotFromForm}
        />
      )}

      <ConfirmAlertDialog
        open={backConfirmOpen}
        severity="warning"
        title={formStrings.UNSAVED_BACK_TITLE}
        message={formStrings.UNSAVED_BACK_MESSAGE}
        confirmLabel={formStrings.UNSAVED_BACK_DISCARD}
        cancelLabel={formStrings.UNSAVED_BACK_CONFIRM}
        onConfirm={handleDiscardAndBack}
        onCancel={() => setBackConfirmOpen(false)}
      />

      <ConfirmAlertDialog
        open={deleteConfirmOpen}
        severity="error"
        title={formStrings.CONFIRM_DELETE_TITLE}
        message={formStrings.CONFIRM_DELETE_MESSAGE}
        confirmLabel={formStrings.CONFIRM_DELETE_ACTION}
        cancelLabel={formStrings.CONFIRM_DRAFT_CANCEL_ACTION}
        onConfirm={handleConfirmDeleteLot}
        onCancel={closeDeleteLotConfirm}
      />
    </Box>
  );
};

export default RawMaterialSourcingMainPage;
