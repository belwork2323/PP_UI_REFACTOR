import React, { useMemo, useState } from "react";
import { Box } from "@mui/material";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import WorkflowFormOpeningLoader from "../../../../components/common/WorkflowFormOpeningLoader";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import { resolveWorkflowFormHeaderStatus } from "../../../../components/custom/workflowFormHeaderStatus";
import QCDivisionList from "./QCDivisionList";
import QCForm from "./QCForm";
import QCDivisionDetailsView from "./QCDivisionDetailsView";
import FinalApprovalDivisionDialog from "./components/FinalApprovalDivisionDialog";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import { STRINGS } from "../../../../../app/config/strings";
import useQCDivisionHook from "../../../../../hooks/user/qualityControl/useQCDivisionHook";
import { resolveQcUnitActionLabelsFromPartialItem } from "../../../../../hooks/user/qualityControl/qcDivisionUnitActionLabels";

const QualityControlPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getQualityControlTheme(mode), [mode]);
  const flowBarTheme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const strings = STRINGS.QUALITY_CONTROL.QC_DIVISION;
  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
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
    addedPremixNumbers,
    addedDivisionEntryKeys,
    activeDivisionGroupIndex,
    activeDivisionSubIndex,
    loadingFormDetails,
    batchBootstrapLoading,
    divisionUiMode,
    divisionBlockedReason,
    divisionSetupDefinition,
    canLoadSetupForm,
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
    handleLoadQcForm,
    handleLoadQcSetupForm,
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
    canProceedDivisionSubmit,
    finalApprovalGroups,
    finalApprovalRows,
    handleBackFromDetails,
    handleViewDetails,
    detailsRow,
    detailsData,
    detailsLoading,
    scopedFormData,
    partialNavItems,
    activePartialNavIndex,
    activePartialItem,
    partialNavActive,
    isActivePartialReadOnly,
    isActiveDivisionReadOnly,
    isFormFieldsLocked,
    isFormFieldsReadOnly,
    formLockMessage,
    divisionGroupStatusByFlowKey,
    isPartialNavTabEnabled,
    getPartialNavTabDisabledReason,
    isDivisionNavTabEnabled,
    getDivisionNavTabDisabledReason,
  } = hookState;

  const formDetailsTheme = isFormFieldsReadOnly;
  const formFieldsDisabled = isFormFieldsLocked;
  const unitActionsLocked = isActivePartialReadOnly || (!partialNavActive && isActiveDivisionReadOnly);

  const canAct =
    !readOnly &&
    !unitActionsLocked &&
    ((scopedFormData.divisionEntries?.length ?? 0) > 0 ||
      scopedFormData.schemaFormLoaded ||
      (scopedFormData.solidPremixEntries?.length ?? 0) > 0 ||
      (scopedFormData.liquidPremixEntries?.length ?? 0) > 0);

  const isRevalidationDivision =
    activeDivisionTabKey === "RAW_MATERIAL_REVALIDATION" ||
    selectedDivision === "RAW_MATERIAL_REVALIDATION" ||
    selectedRawMaterialType === "RAW_MATERIAL_REVALIDATION";

  const canOpenDivisionDialog =
    isRevalidationDivision &&
    !readOnly &&
    (partialNavActive || !isActiveDivisionReadOnly) &&
    (Boolean(activeBatch?.formId) ||
      (scopedFormData.divisionEntries?.length ?? 0) > 0 ||
      scopedFormData.schemaFormLoaded ||
      partialNavItems.length > 0);

  const canOpenFinalDialog = Boolean(activeBatch?.formId);
  /** View Status should stay available while filling — shows division/unit progress. */
  const canViewStatus = Boolean(activeBatch);

  const unitActionLabels = useMemo(
    () => resolveQcUnitActionLabelsFromPartialItem(activePartialItem),
    [activePartialItem],
  );

  const listLoading = loading && !loadingFormDetails && view === "list";
  const formOpening = Boolean(loadingFormDetails || batchBootstrapLoading);

  return (
    <Box sx={theme.workflow.animatedContainer}>
      <WorkflowFormOpeningLoader
        open={listLoading || formOpening}
        title={formOpening ? strings.FORM_OPENING_TITLE : strings.TITLE}
        message={
          formOpening ? strings.FORM_OPENING_MESSAGE : "Loading quality control batches…"
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

      {view === "form" && activeBatch && !formOpening && (
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
              ...(() => {
                const hs = resolveWorkflowFormHeaderStatus(activeBatch, {
                  preferredStatusKeys: ["qcStatus"],
                });
                return {
                  statusLabel: hs.statusLabel,
                  statusVariant: hs.statusVariant,
                  rejectionReason: hs.rejectionReason,
                };
              })(),
            }}
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
            addedPremixNumbers={addedPremixNumbers}
            addedDivisionEntryKeys={addedDivisionEntryKeys}
            activeDivisionGroupIndex={activeDivisionGroupIndex}
            activeDivisionSubIndex={activeDivisionSubIndex}
            partialNavItems={partialNavItems}
            activePartialNavIndex={activePartialNavIndex}
            activePartialItem={activePartialItem}
            partialNavActive={partialNavActive}
            divisionGroupStatusByFlowKey={divisionGroupStatusByFlowKey}
            isPartialNavTabEnabled={isPartialNavTabEnabled}
            getPartialNavTabDisabledReason={getPartialNavTabDisabledReason}
            isDivisionNavTabEnabled={isDivisionNavTabEnabled}
            getDivisionNavTabDisabledReason={getDivisionNavTabDisabledReason}
            isEditMode={isEditMode}
            readOnly={readOnly}
            fieldsReadOnly={formDetailsTheme}
            fieldsDisabled={formFieldsDisabled}
            canEditDivisionStructure={!readOnly && (partialNavActive || !isActiveDivisionReadOnly)}
            formLockMessage={formLockMessage}
            divisionUiMode={divisionUiMode}
            divisionBlockedReason={divisionBlockedReason}
            divisionSetupDefinition={divisionSetupDefinition}
            canLoadSetupForm={canLoadSetupForm}
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
            onLoadForm={handleLoadQcForm}
            onLoadSetupForm={handleLoadQcSetupForm}
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
                    showSubmitDivision: isRevalidationDivision,
                    canSubmitDivision: canOpenDivisionDialog,
                    canViewStatus,
                    showSaveDraft: isRevalidationDivision,
                    canSaveDraft: canAct,
                    onSaveDraft: () => setDraftConfirmOpen(true),
                    onSubmitDivision: () => setDivisionConfirmOpen(true),
                    onViewStatus: () => setFinalDialogOpen(true),
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
                    saveDraftLabel: unitActionLabels.saveDraftLabel,
                    submitLabel: unitActionLabels.submitLabel,
                    draftConfirmTitle: unitActionLabels.draftConfirmTitle,
                    draftConfirmMessage: unitActionLabels.draftConfirmMessage,
                    submitConfirmTitle: unitActionLabels.submitConfirmTitle,
                    submitConfirmMessage: unitActionLabels.submitConfirmMessage,
                    showViewDetails: true,
                    canViewDetails: canOpenFinalDialog,
                    viewDetailsLabel: strings.VIEW_DETAILS,
                    onSaveDraft: () => setDraftConfirmOpen(true),
                    onSubmit: () => setSubmitConfirmOpen(true),
                    onViewDetails: () => {
                      if (activeBatch) void handleViewDetails(activeBatch);
                    },
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
                title={
                  isRevalidationDivision
                    ? strings.DRAFT_CONFIRM_TITLE
                    : unitActionLabels.draftConfirmTitle
                }
                message={
                  isRevalidationDivision
                    ? strings.DRAFT_CONFIRM_MESSAGE
                    : unitActionLabels.draftConfirmMessage
                }
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
                title={unitActionLabels.submitConfirmTitle}
                message={unitActionLabels.submitConfirmMessage}
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
              <FinalApprovalDivisionDialog
                open={finalDialogOpen}
                groups={finalApprovalGroups}
                canProceed={false}
                hideConfirm
                onClose={() => setFinalDialogOpen(false)}
                onProceed={() => undefined}
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
