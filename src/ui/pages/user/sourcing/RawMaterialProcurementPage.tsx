import { Box } from "@mui/material";
import { useMemo } from "react";
import ConfirmAlertDialog from "../../../components/common/ConfirmAlertDialog";
import WorkflowFormOpeningLoader from "../../../components/common/WorkflowFormOpeningLoader";
import { useThemeStore } from "../../../../app/store/themeStore";
import getSourcingTheme from "../../../../app/theme/custom_themes/user/sourcing/sourcing_theme";
import useRawMaterialProcurementHook from "../../../../hooks/user/sourcing/useRawMaterialProcurementHook";
import UserWorkflowFormHeader from "../../../components/custom/UserWorkflowFormHeader";
import { resolveWorkflowFormHeaderStatus } from "../../../components/custom/workflowFormHeaderStatus";
import RawMaterialBatchList from "./components/RawMaterialBatchList";
import RawMaterialLotDetailsView from "./components/RawMaterialLotDetailsView";
import SpecificationFormBuilder from "./components/SpecificationFormBuilder";
import { STRINGS } from "../../../../app/config/strings";

const RawMaterialProcurement = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getSourcingTheme(mode), [mode]);
  const strings = STRINGS.SOURCING.RAW_MATERIAL;

  const hookState = useRawMaterialProcurementHook();
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

  const createLotHeaderHeading =
    !isEditMode && formEntryMode === "create"
      ? {
          title: strings.FORM_HEADER_CREATE_LOT_TITLE,
          subtitle: strings.FORM_HEADER_CREATE_LOT_SUBTITLE,
        }
      : undefined;

  const listLoading = loading && !loadingFormDetails && view === "list";

  return (
    <Box sx={theme.workflow.animatedContainer}>
      <WorkflowFormOpeningLoader
        open={listLoading || Boolean(loadingFormDetails)}
        title={loadingFormDetails ? strings.FORM_OPENING_TITLE : strings.TITLE}
        message={
          loadingFormDetails
            ? strings.FORM_OPENING_MESSAGE
            : "Loading raw material lots…"
        }
        color={theme.palette.primary}
        accentColor={theme.palette.primaryLight}
      />

      {view === "list" && !listLoading && <RawMaterialBatchList hookState={hookState} />}

      {view === "details" && detailsRow && (
        <RawMaterialLotDetailsView
          row={detailsRow}
          blocks={detailsBlocks}
          loading={loadingDetails}
          onBack={handleBackFromDetails}
        />
      )}

      {view === "form" && activeBatch && !loadingFormDetails && (
        <Box>
          <UserWorkflowFormHeader
            mode={createLotHeaderHeading ? "create" : "update"}
            data={{
              title: createLotHeaderHeading
                ? createLotHeaderHeading.title
                : String(activeBatch.lotId || activeBatch.batchId || "—"),
              subtitle: createLotHeaderHeading
                ? createLotHeaderHeading.subtitle
                : undefined,
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
            }}
            onBack={handleBack}
            theme={theme}
          />

          <SpecificationFormBuilder
            key={`rm-spec-${formEntryMode}-${activeBatch.lotId || activeBatch.sourcingId || "new"}`}
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
