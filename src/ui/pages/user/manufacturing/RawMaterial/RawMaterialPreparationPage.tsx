import { Box, CircularProgress } from "@mui/material";
import { useMemo, useState } from "react";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import { STRINGS } from "../../../../../app/config/strings";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import useRawMaterialPrepHook from "../../../../../hooks/user/manufacturing/useRawMaterialPrepHook";
import RawMaterialBuilderForm from "./RawMaterialBuilderPage";
import RawMaterialPreparationDetailsView from "./RawMaterialPreparationDetailsView";
import RawMaterialPreparationHeader from "./RawMaterialPreparationHeader";
import RawMaterialPreparationList from "./RawMaterialPreparationList";

const RawMaterialPreparationPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const actionStrings = STRINGS.SOURCING.SPECIFICATION_FORM;
  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

  const hookState = useRawMaterialPrepHook();
  const {
    loading,
    view,
    activeBatch,
    isEditMode,
    backConfirmOpen,
    setBackConfirmOpen,
    materialTypesArray,
    subDepartmentId,
    premixCardsHaveData,
    allPremixSchemasReady,
    actionLoading,
    selectedTypes,
    selectedPremix,
    selectedProcesses,
    solidMaterialCode,
    solidGradeCode,
    liquidMaterialCode,
    availableSolidMaterials,
    availableLiquidMaterials,
    loadingMaterials,
    availablePremixOptions,
    detailsRow,
    detailsData,
    detailsLoading,
    handleBackFromDetails,
    handlePremixChange,
    handleProcessToggle,
    handleSolidMaterialChange,
    handleSolidGradeChange,
    handleLiquidMaterialChange,
    handleAddPremixSelection,
    addedPremixSelections,
    premixSessions,
    weightmentSheet,
    handleWeightmentSheetChange,
    handlePremixSlotChange,
    handleDeletePremixSelection,
    handleBack,
    handleDiscardAndBack,
    handleSaveDraft,
    handleSubmit,
  } = hookState;

  if (loading) {
    return <Box sx={theme.workflow.loadingContainer}><CircularProgress size={theme.manufacturing.rawMaterialPrep.page.loadingSpinnerSize} /></Box>;
  }

  return (
    <Box sx={theme.workflow.animatedContainer}>
      {view === "list" && <RawMaterialPreparationList hookState={hookState} />}

      {view === "details" && detailsRow && (
        <RawMaterialPreparationDetailsView
          row={detailsRow}
          data={detailsData}
          loading={detailsLoading}
          onBack={handleBackFromDetails}
        />
      )}

      {view === "form" && activeBatch && (
        <Box>
          <RawMaterialPreparationHeader
            batch={activeBatch}
            isEdit={isEditMode}
            onBack={handleBack}
            theme={theme}
          />

          <RawMaterialBuilderForm
            activeBatch={activeBatch}
            isEditMode={isEditMode}
            selectedTypes={selectedTypes}
            selectedPremix={selectedPremix}
            selectedProcesses={selectedProcesses}
            solidMaterialCode={solidMaterialCode}
            solidGradeCode={solidGradeCode}
            liquidMaterialCode={liquidMaterialCode}
            availableSolidMaterials={availableSolidMaterials}
            availableLiquidMaterials={availableLiquidMaterials}
            loadingMaterials={loadingMaterials}
            availablePremixOptions={availablePremixOptions}
            onPremixChange={handlePremixChange}
            onProcessToggle={handleProcessToggle}
            onSolidMaterialChange={handleSolidMaterialChange}
            onSolidGradeChange={handleSolidGradeChange}
            onLiquidMaterialChange={handleLiquidMaterialChange}
            onAddPremixSelection={handleAddPremixSelection}
            addedPremixSelections={addedPremixSelections}
            premixSessions={premixSessions}
            weightmentSheet={weightmentSheet}
            onWeightmentSheetChange={handleWeightmentSheetChange}
            onPremixSlotChange={handlePremixSlotChange}
            onDeletePremixSelection={handleDeletePremixSelection}
            subDepartmentId={subDepartmentId}
            theme={theme}
            handleBack={handleBack}
            onSaveDraft={() => setDraftConfirmOpen(true)}
            onSubmit={() => setSubmitConfirmOpen(true)}
            actionLoading={actionLoading}
            disableActions={
              !premixCardsHaveData || !allPremixSchemasReady
            }
          />
        </Box>
      )}

      <ConfirmAlertDialog
        open={backConfirmOpen}
        severity="warning"
        title={STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.UNSAVED_BACK_TITLE}
        message={STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.UNSAVED_BACK_MESSAGE}
        confirmLabel={STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.UNSAVED_BACK_DISCARD}
        cancelLabel={STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.UNSAVED_BACK_CONFIRM}
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

export default RawMaterialPreparationPage;
