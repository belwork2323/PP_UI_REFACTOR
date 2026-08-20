import React, { useMemo, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import WorkflowFormOpeningLoader from "../../../../components/common/WorkflowFormOpeningLoader";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import STFList from "./StaticTestFacilityList";
import STFForm from "./StaticTestFacilityForm";
import STFDetailsView from "./StaticTestFacilityDetailsView";
import OtherBemList from "./OtherBemList";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { STATIC_TEST_FACILITY_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import { STRINGS } from "../../../../../app/config/strings";
import ToggleTabs, { ToggleTabOption } from "@/ui/components/common/ToggleTabs";
import useOtherBEMMotorHook from "@/hooks/user/qualityControl/useOtherBEMMotorHook";
import useACEMMotorHook from "@/hooks/user/qualityControl/useACEMMotorHook";

const STF_TABS: ToggleTabOption[] = [
  { label: "ACEM Motors", value: "ACEM" },
  { label: "Other BEM Motors", value: "OTHER_BEM" },
];

const STFPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getQualityControlTheme(mode), [mode]);
  const flowBarTheme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const strings = STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY;

  const [motorDraftConfirmOpen, setMotorDraftConfirmOpen] = useState(false);
  const [motorSubmitConfirmOpen, setMotorSubmitConfirmOpen] = useState(false);
  const [pendingMotorId, setPendingMotorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>("ACEM");

  const acemHook = useACEMMotorHook(activeTab === "ACEM");
  const bemHook = useOtherBEMMotorHook(activeTab === "OTHER_BEM");

  const hookState = activeTab === "ACEM" ? acemHook : bemHook;

  const {
    loading,
    view,
    activeBatch,
    isEditMode,
    formData,
    selectedMotorType,
    motorCount,
    draftMotorIds,
    draftBemNo,
    addedMotors,
    batchMotorEntries,
    motorStatusById,
    getMotorStatus,
    isMotorEditable,
    previousStageGate,
    isStfTestNoLocked,
    availableMotorOptions,
    availableBemMotorOptions,
    maxMotorCount,
    approvedMotorsLoading,
    loadingFormDetails,
    schemaLoading,
    schemaError,
    actionLoading,
    backConfirmOpen,
    subDepartmentId,
    setBackConfirmOpen,
    handleBack,
    handleDiscardAndBack,
    handleMotorTypeChange,
    handleMotorCountChange,
    handleDraftMotorIdChange,
    handleDraftBemNoChange,
    handleLoadStfForm,
    handleAddMotors,
    handleFormValuesChange,
    handleStfTestNoChange,
    handleRemoveMotor,
    handleSaveMotorDraft,
    handleSubmitMotor,
    detailsRow,
    detailsData,
    detailsLoading,
    handleBackFromDetails,
  } = hookState;

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
  };

  const handleBemBack = () => {
    setActiveTab("OTHER_BEM");
    handleBack();
  };

  const listLoading = loading && !loadingFormDetails && view === "list";

  if (activeTab === "OTHER_BEM") {
    return (
      <Box sx={theme.workflow.animatedContainer}>
        <WorkflowFormOpeningLoader
          open={Boolean(bemHook.loadingFormDetails)}
          title={strings.OTHER_BEM_FORM_OPENING_TITLE}
          message={strings.OTHER_BEM_FORM_OPENING_MESSAGE}
          color={STATIC_TEST_FACILITY_BRAND.primary}
          accentColor={STATIC_TEST_FACILITY_BRAND.primaryLight}
        />
        {bemHook.view === "list" && (
          <ToggleTabs value={activeTab} options={STF_TABS} onChange={handleTabChange} />
        )}
        {!(bemHook.view === "form" && bemHook.loadingFormDetails) && (
          <OtherBemList hookState={bemHook} handleBemBack={handleBemBack} />
        )}
      </Box>
    );
  }

  return (
    <Box sx={theme.workflow.animatedContainer}>
      <WorkflowFormOpeningLoader
        open={listLoading || Boolean(loadingFormDetails)}
        title={loadingFormDetails ? strings.FORM_OPENING_TITLE : strings.TITLE}
        message={
          loadingFormDetails
            ? strings.FORM_OPENING_MESSAGE
            : "Loading static test facility batches…"
        }
        color={STATIC_TEST_FACILITY_BRAND.primary}
        accentColor={STATIC_TEST_FACILITY_BRAND.primaryLight}
      />

      {view === "list" && !listLoading && (
        <>
          <ToggleTabs value={activeTab} options={STF_TABS} onChange={handleTabChange} />
          <STFList key={activeTab} hookState={hookState} activeTab={activeTab} />
        </>
      )}

      {view === "details" && detailsRow && (
        <STFDetailsView
          row={detailsRow}
          data={detailsData}
          loading={detailsLoading}
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

          <STFForm
            batch={activeBatch}
            formData={formData}
            subDepartmentId={subDepartmentId}
            selectedMotorType={selectedMotorType}
            motorCount={motorCount}
            draftMotorIds={draftMotorIds}
            draftBemNo={draftBemNo}
            addedMotors={addedMotors}
            autoMotorEntries={batchMotorEntries}
            availableMotorOptions={availableMotorOptions}
            availableBemMotorOptions={availableBemMotorOptions}
            maxMotorCount={maxMotorCount}
            approvedMotorsLoading={approvedMotorsLoading}
            motorStatusById={motorStatusById}
            getMotorStatus={getMotorStatus}
            isMotorEditable={isMotorEditable}
            previousStageGate={previousStageGate}
            isStfTestNoLocked={isStfTestNoLocked}
            actionLoading={actionLoading}
            isEditMode={isEditMode}
            schemaLoading={schemaLoading}
            schemaError={schemaError}
            flowBarTheme={flowBarTheme}
            onMotorTypeChange={handleMotorTypeChange}
            onMotorCountChange={handleMotorCountChange}
            onDraftMotorIdChange={handleDraftMotorIdChange}
            onDraftBemNoChange={handleDraftBemNoChange}
            onLoadStfForm={handleLoadStfForm}
            onAddMotors={handleAddMotors}
            onFormValuesChange={handleFormValuesChange}
            onStfTestNoChange={handleStfTestNoChange}
            onRemoveMotor={handleRemoveMotor}
            onSaveMotorDraft={(motorId) => {
              setPendingMotorId(motorId);
              setMotorDraftConfirmOpen(true);
            }}
            onSubmitMotor={(motorId) => {
              setPendingMotorId(motorId);
              setMotorSubmitConfirmOpen(true);
            }}
            theme={theme}
          />
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

      <ConfirmAlertDialog
        open={motorDraftConfirmOpen}
        severity="warning"
        title={strings.MOTOR_DRAFT_CONFIRM_TITLE}
        message={strings.MOTOR_DRAFT_CONFIRM_MESSAGE(pendingMotorId ?? "")}
        confirmLabel={
          pendingMotorId ? strings.SAVE_MOTOR_DRAFT(pendingMotorId) : strings.MOTOR_DRAFT_CONFIRM_TITLE
        }
        cancelLabel={strings.CONFIRM_CANCEL_LABEL}
        onConfirm={async () => {
          const motorId = pendingMotorId;
          setMotorDraftConfirmOpen(false);
          setPendingMotorId(null);
          if (motorId) await handleSaveMotorDraft(motorId);
        }}
        onCancel={() => {
          setMotorDraftConfirmOpen(false);
          setPendingMotorId(null);
        }}
      />

      <ConfirmAlertDialog
        open={motorSubmitConfirmOpen}
        severity="warning"
        title={strings.MOTOR_SUBMIT_CONFIRM_TITLE}
        message={strings.MOTOR_SUBMIT_CONFIRM_MESSAGE(pendingMotorId ?? "")}
        confirmLabel={
          pendingMotorId ? strings.SUBMIT_MOTOR(pendingMotorId) : strings.MOTOR_SUBMIT_CONFIRM_TITLE
        }
        cancelLabel={strings.CONFIRM_CANCEL_LABEL}
        onConfirm={async () => {
          const motorId = pendingMotorId;
          setMotorSubmitConfirmOpen(false);
          setPendingMotorId(null);
          if (motorId) await handleSubmitMotor(motorId);
        }}
        onCancel={() => {
          setMotorSubmitConfirmOpen(false);
          setPendingMotorId(null);
        }}
      />
    </Box>
  );
};

export default STFPage;
