import React, { useMemo, useState } from "react";
import { Box, Button, CircularProgress, Stack } from "@mui/material";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import STFList from "./StaticTestFacilityList";
import STFForm from "./StaticTestFacilityForm";
import STFDetailsView from "./StaticTestFacilityDetailsView";
import OtherBemList from "./OtherBemList";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
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

  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
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
    bemMotors,
    selectedMotorType,
    motorCount,
    draftMotorIds,
    draftBemNo,
    addedMotors,
    availableMotorOptions,
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
    handleRemoveMotor,
    handleFormValuesChange,
    handleSaveDraft,
    handleSubmit,
    detailsRow,
    detailsData,
    detailsLoading,
    handleBackFromDetails,
  } = hookState;
  console.log(bemMotors);

  const canAct = (formData?.motors ?? []).length > 0 && Boolean(formData?.schemaFormLoaded);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
  };
  const handleBemBack = () => {
    setActiveTab("OTHER_BEM");
    handleBack();
  };
  if (loading) {
    return (
      <Box sx={theme.workflow.loadingContainer}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (activeTab === "OTHER_BEM") {
    return (
      <Box sx={theme.workflow.animatedContainer}>
        <ToggleTabs value={activeTab} options={STF_TABS} onChange={handleTabChange} />
        <OtherBemList hookState={bemHook} handleBemBack={handleBemBack} />
      </Box>
    );
  }

  if (view === "list") {
    return (
      <Box sx={theme.workflow.animatedContainer}>
        <ToggleTabs value={activeTab} options={STF_TABS} onChange={handleTabChange} />
        <STFList key={activeTab} hookState={hookState} activeTab={activeTab} />
      </Box>
    );
  }

  if (view === "details" && detailsRow) {
    return (
      <STFDetailsView
        row={detailsRow}
        data={detailsData}
        loading={detailsLoading}
        onBack={handleBackFromDetails}
      />
    );
  }

  // ACEM Motor Form View
  return (
    <Box sx={theme.workflow.animatedContainer}>
      {activeBatch ? (
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
          {!loadingFormDetails ? (
            <STFForm
              batch={activeBatch}
              formData={formData}
              subDepartmentId={subDepartmentId}
              selectedMotorType={selectedMotorType}
              motorCount={motorCount}
              draftMotorIds={draftMotorIds}
              draftBemNo={draftBemNo}
              addedMotors={addedMotors}
              availableMotorOptions={availableMotorOptions}
              maxMotorCount={maxMotorCount}
              approvedMotorsLoading={approvedMotorsLoading}
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
              onRemoveMotor={handleRemoveMotor}
              onFormValuesChange={handleFormValuesChange}
              theme={theme}
            />
          ) : null}

          {!loadingFormDetails ? (
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
                    <Box
                      component="span"
                      sx={{ fontSize: "0.76rem", fontWeight: 700, color: "#1C2833" }}
                    >
                      {canAct ? strings.READY_TO_SUBMIT : strings.NOT_READY_TO_SUBMIT}
                    </Box>
                  </Box>
                  <Stack direction="row" gap={1}>
                    <Button
                      variant="outlined"
                      disabled={!canAct || actionLoading}
                      onClick={() => setDraftConfirmOpen(true)}
                      startIcon={
                        actionLoading ? <CircularProgress size={16} color="inherit" /> : null
                      }
                    >
                      {strings.SAVE_DRAFT_LABEL}
                    </Button>
                    <Button
                      variant="contained"
                      disabled={!canAct || actionLoading}
                      onClick={() => setSubmitConfirmOpen(true)}
                      startIcon={
                        actionLoading ? <CircularProgress size={16} color="inherit" /> : null
                      }
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
                message={
                  isEditMode ? strings.RESUBMIT_CONFIRM_MESSAGE : strings.SUBMIT_CONFIRM_MESSAGE
                }
                confirmLabel={
                  isEditMode ? strings.RESUBMIT_CONFIRM_LABEL : strings.SUBMIT_CONFIRM_LABEL
                }
                cancelLabel={strings.CONFIRM_GO_BACK_LABEL}
                onCancel={() => setSubmitConfirmOpen(false)}
                onConfirm={async () => {
                  setSubmitConfirmOpen(false);
                  await handleSubmit();
                }}
              />
            </>
          ) : null}
        </>
      ) : null}

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

export default STFPage;
