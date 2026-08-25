import React, { useMemo, useState } from "react";
import { Box } from "@mui/material";
import ConfirmAlertDialog from "../../../components/common/ConfirmAlertDialog";
import WorkflowFormOpeningLoader from "../../../components/common/WorkflowFormOpeningLoader";
import UserWorkflowFormHeader from "../../../components/custom/UserWorkflowFormHeader";
import { resolveWorkflowFormHeaderStatus } from "../../../components/custom/workflowFormHeaderStatus";
import { STRINGS } from "../../../../app/config/strings";
import DispatchList from "./DispatchList";
import DispatchForm from "./DispatchForm";
import useDispatchHook from "../../../../hooks/user/dispatch/useDispatchWorkflowHook";
import getManufacturingTheme from "../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { resolveDispatchMotorOptions } from "../../../../hooks/user/dispatch/dispatchFlowConfig";
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
        border: isEdit ? "1.5px solid rgba(192,57,43,0.2)" : "1.5px solid rgba(46,134,193,0.25)",
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

const formatMotorSubtitle = (batch?: {
  motorId?: string;
  motorIds?: Array<string | number>;
  projectName?: string;
  projectId?: string;
} | null) => {
  const project = [batch?.projectName, batch?.projectId].filter(Boolean).join(" · ");
  const ids = Array.isArray(batch?.motorIds)
    ? batch.motorIds.map((id) => String(id).trim()).filter(Boolean)
    : [];
  const motors = ids.length > 0 ? ids.join(" · ") : String(batch?.motorId ?? "").trim();
  return [project, motors && motors !== "—" ? motors : ""].filter(Boolean).join(" · ") || undefined;
};

const DispatchPage = () => {
  const flowBarTheme = useMemo(() => getManufacturingTheme("light"), []);
  const strings = STRINGS.DISPATCH;
  const [motorDraftConfirmOpen, setMotorDraftConfirmOpen] = useState(false);
  const [motorSubmitConfirmOpen, setMotorSubmitConfirmOpen] = useState(false);
  const [pendingMotorId, setPendingMotorId] = useState<string | null>(null);

  const hookState = useDispatchHook();
  const {
    loading,
    loadingFormDetails,
    view,
    activeBatch,
    isEditMode,
    formData,
    draftMotorId,
    addedMotors,
    batchMotorEntries,
    motorStatusById,
    getMotorStatus,
    isMotorEditable,
    previousStageGate,
    actionLoading,
    backConfirmOpen,
    subDepartmentId,
    setBackConfirmOpen,
    handleBack,
    handleDiscardAndBack,
    updateSetupField,
    handleDraftMotorIdChange,
    handleLoadDispatchForm,
    handleMotorDataChange,
    handleSaveMotorDraft,
    handleSubmitMotor,
    detailsRow,
    detailsData,
    detailsLoading,
    handleBackFromDetails,
  } = hookState;

  const availableMotors = useMemo(() => resolveDispatchMotorOptions(activeBatch), [activeBatch]);
  const listLoading = loading && !loadingFormDetails && view === "list";

  return (
    <Box sx={dispatchTheme.workflow.animatedContainer}>
      <WorkflowFormOpeningLoader
        open={listLoading || Boolean(loadingFormDetails)}
        title={loadingFormDetails ? strings.FORM_OPENING_TITLE : strings.TITLE}
        message={
          loadingFormDetails
            ? strings.FORM_OPENING_MESSAGE
            : "Loading dispatch batches…"
        }
        color={dispatchTheme.palette.primaryLight}
        accentColor={dispatchTheme.palette.primary}
      />

      {view === "list" && !listLoading && <DispatchList hookState={hookState} />}

      {view === "details" && detailsRow && (
        <DispatchDetailsView
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
              title: String(activeBatch.batchId ?? "—"),
              subtitle: formatMotorSubtitle(activeBatch),
              ...(() => {
                const hs = resolveWorkflowFormHeaderStatus(activeBatch, {
                  preferredStatusKeys: ["dispatchStatus"],
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
            theme={dispatchTheme}
          />

          <DispatchForm
              batch={activeBatch}
              formData={formData}
              draftMotorId={draftMotorId}
              addedMotors={addedMotors}
              autoMotorEntries={batchMotorEntries}
              motorStatusById={motorStatusById}
              getMotorStatus={getMotorStatus}
              isMotorEditable={isMotorEditable}
              previousStageGate={previousStageGate}
              actionLoading={actionLoading}
              subDepartmentId={subDepartmentId}
              isEditMode={isEditMode}
              flowBarTheme={flowBarTheme}
              availableMotors={availableMotors}
              onSetupChange={updateSetupField}
              onDraftMotorIdChange={handleDraftMotorIdChange}
              onLoadDispatchForm={handleLoadDispatchForm}
              onMotorDataChange={handleMotorDataChange}
              onSaveMotorDraft={(motorId) => {
                setPendingMotorId(motorId);
                setMotorDraftConfirmOpen(true);
              }}
              onSubmitMotor={(motorId) => {
                setPendingMotorId(motorId);
                setMotorSubmitConfirmOpen(true);
              }}
              theme={dispatchTheme}
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

export default DispatchPage;
