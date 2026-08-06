import React, { useMemo, useState } from "react";
import { Box, Button, Stack } from "@mui/material";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import WorkflowFormOpeningLoader from "../../../../components/common/WorkflowFormOpeningLoader";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import QCDivisionList from "./QCDivisionList";
import QCForm from "./QCForm";
import QCDivisionDetailsView from "./QCDivisionDetailsView";
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

  const hookState = useQCDivisionHook();
  const {
    loading,
    view,
    activeBatch,
    isEditMode,
    formData,
    selectedDivision,
    divisionOptions,
    divisionsLoading,
    selectedRawMaterialType,
    rawMaterialTypeOptions,
    selectedProcessingType,
    selectedPremix,
    selectedMixingStage,
    selectedStfMotorType,
    selectedMotorId,
    selectedHardwareProcesses,
    selectedCuringType,
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
    actionLoading,
    backConfirmOpen,
    subDepartmentId,
    setBackConfirmOpen,
    handleBack,
    handleDiscardAndBack,
    handleDivisionChange,
    handleRawMaterialTypeChange,
    handleProcessingTypeChange,
    handlePremixChange,
    handleMixingStageChange,
    handleStfMotorTypeChange,
    handleMotorIdChange,
    handleHardwareProcessesChange,
    handleCuringTypeChange,
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
    handleBackFromDetails,
    detailsRow,
    detailsData,
    detailsLoading,
    scopedFormData,
    partialNavItems,
    activePartialNavIndex,
    partialNavActive,
    isActivePartialReadOnly,
    divisionGroupStatusByFlowKey,
  } = hookState;

  const formReadOnly = readOnly || isActivePartialReadOnly;

  const canAct =
    !isActivePartialReadOnly &&
    ((scopedFormData.divisionEntries?.length ?? 0) > 0 ||
      scopedFormData.schemaFormLoaded ||
      (scopedFormData.solidPremixEntries?.length ?? 0) > 0 ||
      (scopedFormData.liquidPremixEntries?.length ?? 0) > 0);

  const listLoading = loading && !loadingFormDetails && view === "list";

  return (
    <Box sx={theme.workflow.animatedContainer}>
      <WorkflowFormOpeningLoader
        open={listLoading || Boolean(loadingFormDetails)}
        title={loadingFormDetails ? strings.FORM_OPENING_TITLE : strings.TITLE}
        message={
          loadingFormDetails
            ? strings.FORM_OPENING_MESSAGE
            : "Loading quality control batches…"
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
            formData={formData}
            scopedFormData={scopedFormData}
            subDepartmentId={subDepartmentId}
            selectedDivision={selectedDivision}
            divisionOptions={divisionOptions}
            divisionsLoading={divisionsLoading}
            selectedRawMaterialType={selectedRawMaterialType}
            rawMaterialTypeOptions={rawMaterialTypeOptions}
            selectedProcessingType={selectedProcessingType}
            selectedPremix={selectedPremix}
            selectedMixingStage={selectedMixingStage}
            selectedStfMotorType={selectedStfMotorType}
            selectedMotorId={selectedMotorId}
            selectedHardwareProcesses={selectedHardwareProcesses}
            selectedCuringType={selectedCuringType}
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
            isEditMode={isEditMode}
            readOnly={readOnly}
            fieldsReadOnly={formReadOnly}
            schemaLoading={schemaLoading}
            schemaError={schemaError}
            flowBarTheme={flowBarTheme}
            onDivisionChange={handleDivisionChange}
            onRawMaterialTypeChange={handleRawMaterialTypeChange}
            onProcessingTypeChange={handleProcessingTypeChange}
            onPremixChange={handlePremixChange}
            onMixingStageChange={handleMixingStageChange}
            onStfMotorTypeChange={handleStfMotorTypeChange}
            onMotorIdChange={handleMotorIdChange}
            onHardwareProcessesChange={handleHardwareProcessesChange}
            onCuringTypeChange={handleCuringTypeChange}
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
            theme={theme}
          />

          {!formReadOnly ? (
            <>
              <Box
                sx={{
                  mt: 2,
                  p: "12px 16px",
                  borderRadius: 2,
                  background: "#fff",
                  border: "1.5px solid #D5D8DC",
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ sm: "center" }}
                  justifyContent="space-between"
                  gap={1.5}
                >
                  <Box>
                    <Box component="span" sx={{ fontSize: "0.76rem", fontWeight: 700, color: "#1C2833" }}>
                      {canAct ? strings.READY_TO_SUBMIT : strings.NOT_READY_TO_SUBMIT}
                    </Box>
                  </Box>
                  <Stack direction="row" gap={1}>
                    <Button
                      variant="outlined"
                      disabled={!canAct || actionLoading}
                      onClick={() => setDraftConfirmOpen(true)}
                    >
                      {strings.SAVE_DRAFT_LABEL}
                    </Button>
                    <Button
                      variant="contained"
                      disabled={!canAct || actionLoading}
                      onClick={() => setSubmitConfirmOpen(true)}
                    >
                      {isEditMode ? strings.RESUBMIT_LABEL : strings.SUBMIT_LABEL}
                    </Button>
                  </Stack>
                </Stack>
              </Box>

              <ConfirmAlertDialog
                open={draftConfirmOpen}
                severity="info"
                title={strings.DRAFT_CONFIRM_TITLE}
                message={strings.DRAFT_CONFIRM_MESSAGE}
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
                title={isEditMode ? strings.RESUBMIT_CONFIRM_TITLE : strings.SUBMIT_CONFIRM_TITLE}
                message={isEditMode ? strings.RESUBMIT_CONFIRM_MESSAGE : strings.SUBMIT_CONFIRM_MESSAGE}
                confirmLabel={isEditMode ? strings.RESUBMIT_CONFIRM_LABEL : strings.SUBMIT_CONFIRM_LABEL}
                cancelLabel={strings.CONFIRM_GO_BACK_LABEL}
                onConfirm={async () => {
                  setSubmitConfirmOpen(false);
                  await handleSubmit();
                }}
                onCancel={() => setSubmitConfirmOpen(false)}
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
