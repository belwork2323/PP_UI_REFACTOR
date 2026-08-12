import React, { useMemo, useState } from "react";
import { Box } from "@mui/material";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import WorkflowFormOpeningLoader from "../../../../components/common/WorkflowFormOpeningLoader";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import QCDivisionList from "./QCDivisionList";
import QCForm from "./QCForm";
import QCDivisionDetailsView from "./QCDivisionDetailsView";
import DivisionApprovalUnitDialog from "./components/DivisionApprovalUnitDialog";
import FinalApprovalDivisionDialog from "./components/FinalApprovalDivisionDialog";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import { STRINGS } from "../../../../../app/config/strings";
import useQCDivisionHook from "../../../../../hooks/user/qualityControl/useQCDivisionHook";

const QualityControlPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getQualityControlTheme(mode), [mode]);
  const flowBarTheme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const strings = STRINGS.QUALITY_CONTROL.QC_DIVISION;
  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [divisionDialogOpen, setDivisionDialogOpen] = useState(false);
  const [divisionConfirmOpen, setDivisionConfirmOpen] = useState(false);
  const [finalDialogOpen, setFinalDialogOpen] = useState(false);

  const hookState = useQCDivisionHook();
  const {
    loading,
    view,
    activeBatch,
    isEditMode,
    formData,
    selectedDivision,
    divisionsLoading,
    divisionNavTabs,
    activeDivisionTabKey,
    selectedRawMaterialType,
    selectedProcessingType,
    selectedPremix,
    selectedMixingStage,
    selectedStfMotorType,
    selectedMotorId,
    selectedHardwareProcesses,
    selectedTrimmingMotorCount,
    trimmingMotorReceivedDate,
    selectedPostCureOperation,
    selectedInhibitorType,
    selectedPropellantProcess,
    weightmentWeighscaleNo,
    weightmentCalibrationDueDate,
    addedPremixNumbers,
    addedDivisionEntryKeys,
    activeDivisionGroupIndex,
    activeDivisionSubIndex,
    loadingFormDetails,
    schemaLoading,
    schemaError,
    divisionAutoPopulateData,
    mixingQualityChecksByStage,
    actionLoading,
    backConfirmOpen,
    subDepartmentId,
    setBackConfirmOpen,
    handleBack,
    handleDiscardAndBack,
    handleDivisionNavTabChange,
    handleProcessingTypeChange,
    handlePremixChange,
    handleMixingStageChange,
    handleStfMotorTypeChange,
    handleMotorIdChange,
    handleHardwareProcessesChange,
    handleTrimmingMotorCountChange,
    handleTrimmingMotorReceivedDateChange,
    handlePostCureOperationChange,
    handleInhibitorTypeChange,
    handlePropellantProcessChange,
    handleWeightmentWeighscaleNoChange,
    handleWeightmentCalibrationDueDateChange,
    handleLoadQcForm,
    handlePartialNavIndexChange,
    handleDivisionEntryValuesChange,
    handleDivisionEntryLiquidValuesChange,
    handleMixingFinalMixDetailsChange,
    handleRemoveDivisionEntry,
    setActiveDivisionGroupIndex,
    setActiveDivisionSubIndex,
    readOnly,
    handleSaveDraft,
    handleSubmit,
    handleSubmitDivision,
    handleSubmitForFinalApproval,
    canProceedDivisionSubmit,
    canProceedFinalApproval,
    divisionApprovalRows,
    finalApprovalGroups,
    finalApprovalRows,
    handleBackFromDetails,
    detailsRow,
    detailsData,
    detailsLoading,
    scopedFormData,
    partialNavItems,
    activePartialNavIndex,
    partialNavActive,
    isActivePartialReadOnly,
    isActiveDivisionReadOnly,
    isFormFieldsReadOnly,
    formLockMessage,
    divisionGroupStatusByFlowKey,
    isPartialNavTabEnabled,
    getPartialNavTabDisabledReason,
    isDivisionNavTabEnabled,
    getDivisionNavTabDisabledReason,
  } = hookState;

  const formReadOnly = isFormFieldsReadOnly;
  const unitActionsLocked = isActivePartialReadOnly || (!partialNavActive && isActiveDivisionReadOnly);

  const canAct =
    !readOnly &&
    !unitActionsLocked &&
    ((scopedFormData.divisionEntries?.length ?? 0) > 0 ||
      scopedFormData.schemaFormLoaded ||
      (scopedFormData.solidPremixEntries?.length ?? 0) > 0 ||
      (scopedFormData.liquidPremixEntries?.length ?? 0) > 0);

  // Keep Submit Division enabled so users can open the unit-status popup (RMP / Mixing).
  // Proceed inside the dialog stays gated by canProceedDivisionSubmit (all units approved).
  const canOpenDivisionDialog =
    !readOnly &&
    (partialNavActive || !isActiveDivisionReadOnly) &&
    (Boolean(activeBatch?.formId) ||
      (scopedFormData.divisionEntries?.length ?? 0) > 0 ||
      scopedFormData.schemaFormLoaded ||
      partialNavItems.length > 0);

  const canOpenFinalDialog = Boolean(activeBatch?.formId);

  const listLoading = loading && !loadingFormDetails && view === "list";

  return (
    <Box sx={theme.workflow.animatedContainer}>
      <WorkflowFormOpeningLoader
        open={listLoading || Boolean(loadingFormDetails)}
        title={loadingFormDetails ? strings.FORM_OPENING_TITLE : strings.TITLE}
        message={
          loadingFormDetails ? strings.FORM_OPENING_MESSAGE : "Loading quality control batches…"
        }
        color={QC_DIVISION_BRAND.primary}
        accentColor={QC_DIVISION_BRAND.primaryLight}
      />

      {view === "list" && !listLoading && <QCDivisionList hookState={hookState} />}

      {view === "details" && detailsRow && (
        <QCDivisionDetailsView
          row={detailsRow}
          data={detailsData}
          formData={formData}
          subDepartmentId={subDepartmentId}
          loading={detailsLoading || loadingFormDetails}
          schemaLoading={schemaLoading}
          schemaError={schemaError}
          activeDivisionGroupIndex={activeDivisionGroupIndex}
          activeDivisionSubIndex={activeDivisionSubIndex}
          onActiveDivisionGroupIndexChange={setActiveDivisionGroupIndex}
          onActiveDivisionSubIndexChange={setActiveDivisionSubIndex}
          onBack={handleBackFromDetails}
        />
      )}

      {view === "form" && activeBatch && !loadingFormDetails && (
        <>
          <UserWorkflowFormHeader
            mode="update"
            data={{
              title: String(activeBatch.batchId ?? activeBatch.lotId ?? "—"),
              subtitle:
                String(activeBatch.motorId ?? "").trim() &&
                String(activeBatch.motorId).trim() !== "—"
                  ? String(activeBatch.motorId).trim()
                  : undefined,
              statusLabel: isEditMode
                ? STRINGS.QUALITY_CONTROL.FORM_HEADER.EDITING_REJECTED
                : strings.NEW_LABEL,
              statusVariant: isEditMode ? "edit" : "new",
              rejectionReason: activeBatch.rejectionReason,
            }}
            isEdit={isEditMode}
            onBack={handleBack}
            backLabel={STRINGS.QUALITY_CONTROL.FORM_HEADER.BACK_TO_LIST}
            rejectionTitle={STRINGS.QUALITY_CONTROL.FORM_HEADER.REJECTION_REASON}
            theme={theme}
          />

          <QCForm
            batch={activeBatch}
            divisionAutoPopulateData={divisionAutoPopulateData}
            mixingQualityChecksByStage={mixingQualityChecksByStage}
            formData={formData}
            scopedFormData={scopedFormData}
            subDepartmentId={subDepartmentId}
            selectedDivision={selectedDivision}
            divisionsLoading={divisionsLoading}
            divisionNavTabs={divisionNavTabs}
            activeDivisionTabKey={activeDivisionTabKey}
            selectedRawMaterialType={selectedRawMaterialType}
            selectedProcessingType={selectedProcessingType}
            selectedPremix={selectedPremix}
            selectedMixingStage={selectedMixingStage}
            selectedStfMotorType={selectedStfMotorType}
            selectedMotorId={selectedMotorId}
            selectedHardwareProcesses={selectedHardwareProcesses}
            selectedTrimmingMotorCount={selectedTrimmingMotorCount}
            trimmingMotorReceivedDate={trimmingMotorReceivedDate}
            selectedPostCureOperation={selectedPostCureOperation}
            selectedInhibitorType={selectedInhibitorType}
            selectedPropellantProcess={selectedPropellantProcess}
            weightmentWeighscaleNo={weightmentWeighscaleNo}
            weightmentCalibrationDueDate={weightmentCalibrationDueDate}
            addedPremixNumbers={addedPremixNumbers}
            addedDivisionEntryKeys={addedDivisionEntryKeys}
            activeDivisionGroupIndex={activeDivisionGroupIndex}
            activeDivisionSubIndex={activeDivisionSubIndex}
            partialNavItems={partialNavItems}
            activePartialNavIndex={activePartialNavIndex}
            partialNavActive={partialNavActive}
            divisionGroupStatusByFlowKey={divisionGroupStatusByFlowKey}
            isPartialNavTabEnabled={isPartialNavTabEnabled}
            getPartialNavTabDisabledReason={getPartialNavTabDisabledReason}
            isDivisionNavTabEnabled={isDivisionNavTabEnabled}
            getDivisionNavTabDisabledReason={getDivisionNavTabDisabledReason}
            isEditMode={isEditMode}
            readOnly={readOnly}
            fieldsReadOnly={formReadOnly}
            canEditDivisionStructure={!readOnly && (partialNavActive || !isActiveDivisionReadOnly)}
            formLockMessage={formLockMessage}
            schemaLoading={schemaLoading}
            schemaError={schemaError}
            flowBarTheme={flowBarTheme}
            onDivisionNavTabChange={handleDivisionNavTabChange}
            onProcessingTypeChange={handleProcessingTypeChange}
            onPremixChange={handlePremixChange}
            onMixingStageChange={handleMixingStageChange}
            onStfMotorTypeChange={handleStfMotorTypeChange}
            onMotorIdChange={handleMotorIdChange}
            onHardwareProcessesChange={handleHardwareProcessesChange}
            onTrimmingMotorCountChange={handleTrimmingMotorCountChange}
            onTrimmingMotorReceivedDateChange={handleTrimmingMotorReceivedDateChange}
            onPostCureOperationChange={handlePostCureOperationChange}
            onInhibitorTypeChange={handleInhibitorTypeChange}
            onPropellantProcessChange={handlePropellantProcessChange}
            onWeightmentWeighscaleNoChange={handleWeightmentWeighscaleNoChange}
            onWeightmentCalibrationDueDateChange={handleWeightmentCalibrationDueDateChange}
            onLoadForm={handleLoadQcForm}
            onPartialNavIndexChange={handlePartialNavIndexChange}
            onActiveDivisionGroupIndexChange={setActiveDivisionGroupIndex}
            onActiveDivisionSubIndexChange={setActiveDivisionSubIndex}
            onDivisionEntryValuesChange={handleDivisionEntryValuesChange}
            onDivisionEntryLiquidValuesChange={handleDivisionEntryLiquidValuesChange}
            onMixingFinalMixDetailsChange={handleMixingFinalMixDetailsChange}
            onRemoveDivisionEntry={handleRemoveDivisionEntry}
            navApprovalActions={
              !readOnly
                ? {
                    show: true,
                    actionLoading,
                    // Locked divisions (waiting / approved) keep the button visible but disabled.
                    canSubmitDivision: canOpenDivisionDialog,
                    canSubmitFinalApproval: canOpenFinalDialog,
                    onSubmitDivision: () => {
                      if (partialNavActive) {
                        setDivisionDialogOpen(true);
                      } else {
                        setDivisionConfirmOpen(true);
                      }
                    },
                    onSubmitFinalApproval: () => setFinalDialogOpen(true),
                  }
                : null
            }
            unitActions={
              !readOnly
                ? {
                    show: true,
                    canAct,
                    actionLoading,
                    isEditMode,
                    onSaveDraft: () => setDraftConfirmOpen(true),
                    onSubmit: () => setSubmitConfirmOpen(true),
                  }
                : null
            }
            theme={theme}
          />

          {!readOnly ? (
            <>
              <ConfirmAlertDialog
                open={draftConfirmOpen}
                severity="info"
                title={strings.UNIT_DRAFT_CONFIRM_TITLE}
                message={strings.UNIT_DRAFT_CONFIRM_MESSAGE}
                confirmLabel={strings.DRAFT_CONFIRM_LABEL}
                cancelLabel={strings.CONFIRM_CANCEL_LABEL}
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
                  isEditMode
                    ? strings.UNIT_RESUBMIT_CONFIRM_TITLE
                    : strings.UNIT_SUBMIT_CONFIRM_TITLE
                }
                message={
                  isEditMode
                    ? strings.UNIT_RESUBMIT_CONFIRM_MESSAGE
                    : strings.UNIT_SUBMIT_CONFIRM_MESSAGE
                }
                confirmLabel={
                  isEditMode ? strings.RESUBMIT_CONFIRM_LABEL : strings.SUBMIT_CONFIRM_LABEL
                }
                cancelLabel={strings.CONFIRM_GO_BACK_LABEL}
                onConfirm={async () => {
                  setSubmitConfirmOpen(false);
                  await handleSubmit();
                }}
                onCancel={() => setSubmitConfirmOpen(false)}
              />
              <ConfirmAlertDialog
                open={divisionConfirmOpen}
                severity="warning"
                title={strings.DIVISION_CONFIRM_TITLE}
                message={strings.DIVISION_CONFIRM_MESSAGE}
                confirmLabel={strings.DIVISION_CONFIRM_LABEL}
                cancelLabel={strings.CONFIRM_CANCEL_LABEL}
                confirmDisabled={actionLoading}
                onConfirm={async () => {
                  setDivisionConfirmOpen(false);
                  await handleSubmitDivision();
                }}
                onCancel={() => setDivisionConfirmOpen(false)}
              />
              <DivisionApprovalUnitDialog
                open={divisionDialogOpen}
                rows={divisionApprovalRows}
                canProceed={canProceedDivisionSubmit}
                confirmDisabled={actionLoading}
                onClose={() => setDivisionDialogOpen(false)}
                onProceed={async () => {
                  setDivisionDialogOpen(false);
                  await handleSubmitDivision();
                }}
              />
              <FinalApprovalDivisionDialog
                open={finalDialogOpen}
                groups={finalApprovalGroups}
                canProceed={canProceedFinalApproval}
                confirmDisabled={actionLoading}
                onClose={() => setFinalDialogOpen(false)}
                onProceed={async () => {
                  setFinalDialogOpen(false);
                  await handleSubmitForFinalApproval();
                }}
              />
            </>
          ) : null}
        </>
      )}

      <ConfirmAlertDialog
        open={backConfirmOpen}
        severity="warning"
        title={strings.UNSAVED_BACK_TITLE}
        message={strings.UNSAVED_BACK_MESSAGE}
        confirmLabel={strings.UNSAVED_BACK_DISCARD}
        cancelLabel={strings.UNSAVED_BACK_CONFIRM}
        onConfirm={handleDiscardAndBack}
        onCancel={() => setBackConfirmOpen(false)}
      />
    </Box>
  );
};

export default QualityControlPage;
