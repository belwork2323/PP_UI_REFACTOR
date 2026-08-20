import { Box } from "@mui/material";
import { useMemo, useState } from "react";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import WorkflowFormOpeningLoader from "../../../../components/common/WorkflowFormOpeningLoader";
import { STRINGS } from "../../../../../app/config/strings";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { SOLID_PREP_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/rawMaterialPreparation_theme";
import useRawMaterialPrepHook from "../../../../../hooks/user/manufacturing/useRawMaterialPrepHook";
import RawMaterialBuilderForm from "./RawMaterialBuilderPage";
import RawMaterialPreparationDetailsView from "./RawMaterialPreparationDetailsView";
import RawMaterialPreparationHeader from "./RawMaterialPreparationHeader";
import RawMaterialPreparationList from "./RawMaterialPreparationList";

const RawMaterialPreparationPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const actionStrings = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP;
  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [pendingPremixNo, setPendingPremixNo] = useState<number | null>(null);

  const hookState = useRawMaterialPrepHook();
  const {
    loading,
    loadingFormDetails,
    view,
    activeBatch,
    isEditMode,
    backConfirmOpen,
    setBackConfirmOpen,
    subDepartmentId,
    actionLoading,
    numberOfPremix,
    premixGroups,
    identificationSheet,
    allMaterials,
    availableSolidMaterials,
    availableLiquidMaterials,
    premixStatusByNo,
    isPremixEditable,
    detailsRow,
    detailsData,
    detailsLoading,
    handleBackFromDetails,
    handlePremixDateChange,
    addedPremixSelections,
    premixSessions,
    weightmentSheet,
    handleWeightmentSheetChange,
    handlePremixSlotChange,
    handleBack,
    handleDiscardAndBack,
    handleSavePremixDraft,
    handleSubmitPremix,
  } = hookState;

  const listLoading = loading && !loadingFormDetails && view === "list";

  return (
    <Box sx={theme.workflow.animatedContainer}>
      <WorkflowFormOpeningLoader
        open={listLoading || Boolean(loadingFormDetails)}
        title={
          loadingFormDetails
            ? actionStrings.FORM_OPENING_TITLE
            : actionStrings.TITLE
        }
        message={
          loadingFormDetails
            ? actionStrings.FORM_OPENING_MESSAGE
            : "Loading raw material preparation batches…"
        }
        color={SOLID_PREP_BRAND.solid}
        accentColor={SOLID_PREP_BRAND.solidLight}
      />

      {view === "list" && !listLoading && <RawMaterialPreparationList hookState={hookState} />}

      {view === "details" && detailsRow && (
        <RawMaterialPreparationDetailsView
          row={detailsRow}
          data={detailsData}
          loading={detailsLoading}
          onBack={handleBackFromDetails}
        />
      )}

      {view === "form" && activeBatch && !loadingFormDetails && (
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
            numberOfPremix={numberOfPremix}
            premixGroups={premixGroups}
            identificationSheet={identificationSheet}
            allMaterials={allMaterials}
            onPremixDateChange={handlePremixDateChange}
            addedPremixSelections={addedPremixSelections}
            premixSessions={premixSessions}
            availableSolidMaterials={availableSolidMaterials}
            availableLiquidMaterials={availableLiquidMaterials}
            weightmentSheet={weightmentSheet}
            onWeightmentSheetChange={handleWeightmentSheetChange}
            onPremixSlotChange={handlePremixSlotChange}
            subDepartmentId={subDepartmentId}
            theme={theme}
            premixStatusByNo={premixStatusByNo}
            isPremixEditable={isPremixEditable}
            onSavePremixDraft={(premixNo: number) => {
              setPendingPremixNo(premixNo);
              setDraftConfirmOpen(true);
            }}
            onSubmitPremix={(premixNo: number) => {
              setPendingPremixNo(premixNo);
              setSubmitConfirmOpen(true);
            }}
            actionLoading={actionLoading}
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
        title={actionStrings.PREMIX_DRAFT_CONFIRM_TITLE}
        message={
          pendingPremixNo != null
            ? actionStrings.PREMIX_DRAFT_CONFIRM_MESSAGE(pendingPremixNo)
            : actionStrings.PREMIX_DRAFT_CONFIRM_TITLE
        }
        confirmLabel={
          pendingPremixNo != null
            ? actionStrings.SAVE_PREMIX_DRAFT(pendingPremixNo)
            : actionStrings.PREMIX_DRAFT_CONFIRM_TITLE
        }
        cancelLabel={STRINGS.SOURCING.SPECIFICATION_FORM.CONFIRM_DRAFT_CANCEL_ACTION}
        onConfirm={async () => {
          const premixNo = pendingPremixNo;
          setDraftConfirmOpen(false);
          setPendingPremixNo(null);
          if (premixNo != null) await handleSavePremixDraft(premixNo);
        }}
        onCancel={() => {
          setDraftConfirmOpen(false);
          setPendingPremixNo(null);
        }}
      />

      <ConfirmAlertDialog
        open={submitConfirmOpen}
        severity="warning"
        title={actionStrings.PREMIX_SUBMIT_CONFIRM_TITLE}
        message={
          pendingPremixNo != null
            ? actionStrings.PREMIX_SUBMIT_CONFIRM_MESSAGE(pendingPremixNo)
            : actionStrings.PREMIX_SUBMIT_CONFIRM_TITLE
        }
        confirmLabel={
          pendingPremixNo != null
            ? actionStrings.SUBMIT_PREMIX(pendingPremixNo)
            : actionStrings.PREMIX_SUBMIT_CONFIRM_TITLE
        }
        cancelLabel={STRINGS.SOURCING.SPECIFICATION_FORM.CONFIRM_CANCEL_ACTION}
        onConfirm={async () => {
          const premixNo = pendingPremixNo;
          setSubmitConfirmOpen(false);
          setPendingPremixNo(null);
          if (premixNo != null) await handleSubmitPremix(premixNo);
        }}
        onCancel={() => {
          setSubmitConfirmOpen(false);
          setPendingPremixNo(null);
        }}
      />
    </Box>
  );
};

export default RawMaterialPreparationPage;
