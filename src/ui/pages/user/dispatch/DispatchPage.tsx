import React from "react";
import { Box, CircularProgress } from "@mui/material";
import ConfirmAlertDialog from "../../../components/common/ConfirmAlertDialog";
import UserWorkflowFormHeader from "../../../components/custom/UserWorkflowFormHeader";
import { STRINGS } from "../../../../app/config/strings";
import DispatchList from "./DispatchList";
import DispatchForm from "./DispatchForm";
import useDispatchHook from "../../../../hooks/user/dispatch/useDispatchWorkflowHook";

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
  const hookState = useDispatchHook();
  const {
    loading,
    view,
    activeBatch,
    isEditMode,
    formData,
    loadingFormDetails,
    actionLoading,
    backConfirmOpen,
    setBackConfirmOpen,
    handleBack,
    handleFormChange,
    handleDiscardAndBack,
    handleSaveDraft,
    handleSubmit,
  } = hookState;

  if (loading)
    return (
      <Box sx={dispatchTheme.workflow.loadingContainer}>
        <CircularProgress size={32} />
      </Box>
    );

  if (view === "list")
    return (
      <Box sx={dispatchTheme.workflow.animatedContainer}>
        <DispatchList hookState={hookState} />
      </Box>
    );

  return (
    <Box sx={dispatchTheme.workflow.animatedContainer}>
      {activeBatch && (
        <UserWorkflowFormHeader
          batch={activeBatch}
          isEdit={isEditMode}
          onBack={handleBack}
          newLabel={STRINGS.DISPATCH.NEW_LABEL}
          includeMotorType
          backLabel={STRINGS.QUALITY_CONTROL.FORM_HEADER.BACK_TO_LIST}
          editLabel={STRINGS.QUALITY_CONTROL.FORM_HEADER.EDITING_REJECTED}
          rejectionTitle={STRINGS.QUALITY_CONTROL.FORM_HEADER.REJECTION_REASON}
          theme={dispatchTheme}
        />
      )}

      {!loadingFormDetails && activeBatch && (
        <DispatchForm
          initialData={formData}
          isEditMode={isEditMode}
          onDataChange={handleFormChange}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          actionLoading={actionLoading}
        />
      )}

      <ConfirmAlertDialog
        open={backConfirmOpen}
        severity="warning"
        title={STRINGS.DISPATCH.UNSAVED_BACK_TITLE}
        message={STRINGS.DISPATCH.UNSAVED_BACK_MESSAGE}
        confirmLabel={STRINGS.DISPATCH.UNSAVED_BACK_DISCARD}
        cancelLabel={STRINGS.DISPATCH.UNSAVED_BACK_CONFIRM}
        onConfirm={handleDiscardAndBack}
        onCancel={() => setBackConfirmOpen(false)}
      />
    </Box>
  );
};

export default DispatchPage;
