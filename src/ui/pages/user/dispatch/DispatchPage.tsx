import React, { useMemo, useState } from "react";
import { Box, Button, CircularProgress, Stack } from "@mui/material";
import ConfirmAlertDialog from "../../../components/common/ConfirmAlertDialog";
import UserWorkflowFormHeader from "../../../components/custom/UserWorkflowFormHeader";
import { STRINGS } from "../../../../app/config/strings";
import DispatchList from "./DispatchList";
import DispatchForm from "./DispatchForm";
import useDispatchHook from "../../../../hooks/user/dispatch/useDispatchWorkflowHook";
import getManufacturingTheme from "../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import DispatchDetailsView from "./DispatchDetailsView";

const dispatchTheme = {
  palette: {
    primary: "#1B4F72",
    primaryLight: "#2E86C1",
    success: "#0E6655",
    danger: "#C0392B",
    warning: "#D4AC0D",
    border: "#D5D8DC",
    text: "#1C2833",
    textSub: "#5D6D7E",
    surface: "#F4F6F8",
  },
  workflow: {
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      py: 8,
    },
    animatedContainer: {
      animation: "fadeIn 0.3s ease",
      "@keyframes fadeIn": {
        from: { opacity: 0, transform: "translateY(10px)" },
        to: { opacity: 1, transform: "translateY(0)" },
      },
    },
    formHeader: {
      container: (isEdit: boolean) => ({
        mb: 3,
        borderRadius: 3,
        overflow: "hidden",
        background: isEdit
          ? "linear-gradient(135deg,rgba(192,57,43,0.06),rgba(192,57,43,0.02))"
          : "linear-gradient(135deg,rgba(27,79,114,0.06),rgba(46,134,193,0.03))",
        border: isEdit
          ? "1.5px solid rgba(192,57,43,0.2)"
          : "1.5px solid rgba(46,134,193,0.25)",
      }),
      backButton: {
        fontWeight: 700,
        fontSize: "0.78rem",
        textTransform: "none",
        color: "#5D6D7E",
        px: 1.5,
        py: 0.8,
        borderRadius: 2,
        flexShrink: 0,
        "&:hover": {
          background: "rgba(213,216,220,0.5)",
          color: "#1C2833",
        },
      },
      divider: {
        borderColor: "rgba(213,216,220,0.6)",
      },
      batchId: {
        fontWeight: 800,
        fontSize: "0.9rem",
        color: "#1C2833",
      },
      bullet: {
        fontSize: "0.78rem",
        color: "#5D6D7E",
      },
      motorId: {
        fontSize: "0.78rem",
        color: "#5D6D7E",
      },
      chips: {
        new: {
          height: 20,
          fontSize: "0.65rem",
          fontWeight: 700,
          background: "rgba(27,79,114,0.08)",
          color: "#1B4F72",
          border: "1px solid rgba(27,79,114,0.2)",
        },
        edit: {
          height: 20,
          fontSize: "0.65rem",
          fontWeight: 700,
          background: "rgba(192,57,43,0.08)",
          color: "#C0392B",
          border: "1px solid rgba(192,57,43,0.22)",
        },
        motorType: {
          height: 20,
          fontSize: "0.65rem",
          fontWeight: 600,
          background: "rgba(46,134,193,0.08)",
          color: "#1A5276",
          border: "1px solid rgba(46,134,193,0.2)",
        },
        priority: {
          height: 20,
          fontSize: "0.65rem",
          fontWeight: 600,
          background: "rgba(212,172,13,0.1)",
          color: "#7D6608",
        },
      },
      rejectionBox: {
        px: 2,
        py: 1,
        borderRadius: 2,
        maxWidth: 340,
        background: "rgba(192,57,43,0.05)",
        border: "1px solid rgba(192,57,43,0.15)",
      },
      rejectionTitle: {
        fontSize: "0.7rem",
        fontWeight: 700,
        color: "#C0392B",
        mb: 0.2,
      },
      rejectionText: {
        fontSize: "0.75rem",
        color: "#C0392B",
        lineHeight: 1.5,
      },
    },
  },
};

const DispatchPage = () => {
  const flowBarTheme = useMemo(() => getManufacturingTheme("light"), []);
  const strings = STRINGS.DISPATCH;
  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

  const hookState = useDispatchHook();
  const {
    loading,
    view,
    activeBatch,
    isEditMode,
    formData,
    // loadingFormDetails,
    schemaLoading,
    schemaError,
    actionLoading,
    backConfirmOpen,
    subDepartmentId,
    setBackConfirmOpen,
    handleBack,
    handleDiscardAndBack,
    updateSetupField,
    handleLoadDispatchForm,
    handleFormValuesChange,
    handleSaveDraft,
    handleSubmit,
    detailsRow,
    detailsData,
    detailsLoading,
    handleBackFromDetails,
  } = hookState;

  const canAct = formData.schemaFormLoaded;

  if (loading) {
    return (
      <Box sx={dispatchTheme.workflow.loadingContainer}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (view === "list") {
    return (
      <Box sx={dispatchTheme.workflow.animatedContainer}>
        <DispatchList hookState={hookState} />
      </Box>
    );
  }
  if (view === "details") {
    return (
      <DispatchDetailsView
        row={detailsRow}
        data={detailsData}
        loading={detailsLoading}
        onBack={handleBackFromDetails}
      />
    );
  }
  return (
    <Box sx={dispatchTheme.workflow.animatedContainer}>
      {activeBatch ? (
        <>
          <UserWorkflowFormHeader
            batch={{
              ...activeBatch,
              lotId: activeBatch.batchId,
            }}
            isEdit={isEditMode}
            onBack={handleBack}
            newLabel={strings.NEW_LABEL}
            batchHeadingOverride={{
              title: activeBatch.batchId,
              subtitle: [activeBatch.projectName, activeBatch.projectId]
                .filter(Boolean)
                .join(" · "),
            }}
            backLabel={STRINGS.QUALITY_CONTROL.FORM_HEADER.BACK_TO_LIST}
            editLabel={STRINGS.QUALITY_CONTROL.FORM_HEADER.EDITING_REJECTED}
            rejectionTitle={STRINGS.QUALITY_CONTROL.FORM_HEADER.REJECTION_REASON}
            theme={dispatchTheme}
          />

          {/* {!loadingFormDetails ? (
            <DispatchForm
              batch={activeBatch}
              formData={formData}
              subDepartmentId={subDepartmentId}
              isEditMode={isEditMode}
              schemaLoading={schemaLoading}
              schemaError={schemaError}
              flowBarTheme={flowBarTheme}
              onSetupChange={updateSetupField}
              onLoadDispatchForm={handleLoadDispatchForm}
              onFormValuesChange={handleFormValuesChange}
              theme={dispatchTheme}
            />
          ) : null} */}

          {/* {!loadingFormDetails ? (
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
          ) : null} */}
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

export default DispatchPage;
