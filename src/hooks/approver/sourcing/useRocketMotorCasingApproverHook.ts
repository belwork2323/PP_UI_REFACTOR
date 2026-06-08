import { useMemo, useState } from "react";

import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useApproverListRefreshStore } from "../../../app/store/approverListRefreshStore";
import {
  APPROVER_STATUS_META,
  APPROVER_PRIORITY_META,
  isApproverActionableStatus,
} from "../../../app/theme/approver";
import rocketMotorCasingController from "../../../controllers/user/sourcing/rocketMotorCasingController";
import rocketMotorCasingApproverController from "../../../controllers/approver/rocketMotorCasingApproverController";
import type { ApproverFormActionType } from "../../../data/api/approver/approverApi";
import { RocketMotorCasingDetailsModel } from "../../../data/models/user/RocketMotorCasingProcurementModel";
import { submitApproverFormStatusChange } from "../../../controllers/approver/approverController";

const DEPARTMENT_SLUG = "sourcing";
const SUB_DEPARTMENT_SLUG = "rocket-motor";

const S = STRINGS.SOURCING.CASING_FORM;
const A = STRINGS.APPROVER.ACTION;

const getResponseMessage = (response: { message?: string; errorCode?: string | null }) =>
  response.message || response.errorCode || A.FAILED;

export const useRocketMotorCasingApproverHook = () => {
  const user = useAuthStore((state) => state.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpListVersion = useApproverListRefreshStore((state) => state.bumpVersion);
  const [selected, setSelected] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [actionType, setActionType] = useState<ApproverFormActionType | null>(null);
  const [dialogItem, setDialogItem] = useState<any | null>(null);
  const [dialogValue, setDialogValue] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find(
        (sd) => sd.slugs?.dept === DEPARTMENT_SLUG && sd.slugs?.subDept === SUB_DEPARTMENT_SLUG,
      )?.subDepartmentId ?? null,
    [user],
  );

  const closeDialog = () => {
    if (submitting) return;
    setActionType(null);
    setDialogItem(null);
    setDialogValue("");
    setDialogError("");
  };

  const requestAction = (item: any, nextActionType: ApproverFormActionType) => {

    console.log("ITEM", item);
    console.log("motorCasingId", item?.motorCasingId);
    console.log("procurementId", item?.procurementId);
    console.log("formId", item?.formId);
    if (!subDepartmentId) {
      showAlert(A.SUBDEPARTMENT_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    const motorCasingId = String(item?.motorCasingId ?? item?.batchId ?? "").trim();

    if (!motorCasingId) {
      showAlert(A.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    if (!isApproverActionableStatus(item.status)) {
      showAlert(A.INVALID_STATUS, "warning", { autoCloseMs: 3000 });
      return;
    }

    setActionType(nextActionType);
    setDialogItem(item);
    setDialogValue(
      nextActionType === "REJECTED" ? String(item.rejectionReason ?? "") : String(item.remarks ?? ""),
    );
    setDialogError("");
  };

  const handleConfirm = async () => {
    if (!dialogItem || !actionType || !subDepartmentId) return;
    
    const trimmedValue = dialogValue.trim();
    const motorCasingId = String(dialogItem?.motorCasingId ?? dialogItem?.batchId ?? "").trim();
    
    if (actionType === "REJECTED" && !trimmedValue) {
      setDialogError(A.REJECTION_REASON_REQUIRED);
      return;
    }
    
    if (!motorCasingId) {
      showAlert(A.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }
    
    setSubmitting(true);
    showAlert(actionType === "APPROVED" ? A.APPROVING : A.REJECTING, "info", { loading: true });
    
    const response = await submitApproverFormStatusChange({
      formId: motorCasingId,
      subDepartmentId,
      actionType,
      remarks: actionType === "APPROVED" ? trimmedValue || null : null,
      rejectionReason: actionType === "REJECTED" ? trimmedValue : null,
    });
    
    setSubmitting(false);

    if (response.success) {
      setSelected(null);
      closeDialog();
      bumpListVersion();
      showAlert(getResponseMessage(response), "success", { autoCloseMs: 2000 });
      return;
    }

    showAlert(getResponseMessage(response), "error", { autoCloseMs: 3500 });
  };

  const handleViewDetails = async (row: any) => {
    setSelected({ ...row, casingBlocks: [] });
    setDetailsLoading(true);

    const motorCasingId = String(row?.motorCasingId ?? row?.batchId ?? "").trim();
    if (!motorCasingId) {
      setDetailsLoading(false);
      setSelected(null);
      showAlert(S.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    const response = await rocketMotorCasingController.fetchFormDetails({
      motorCasingId,
    });

    setDetailsLoading(false);

    if (!response?.success || !response?.data) {
      const err = response?.error as { details?: string } | undefined;
      showAlert(err?.details || response?.message || S.DETAILS_FETCH_ERROR, "error", { autoCloseMs: 3500 });
      setSelected(null);
      return;
    }

    const model = response.data as RocketMotorCasingDetailsModel;

    setSelected({
      ...row,
      motorCasingId,
      procurementId: row.procurementId ?? "",
      batchId: motorCasingId,
      formId: motorCasingId,
      casingBlocks: RocketMotorCasingDetailsModel.toDetailBlocks(model),
    });
  };

  const handleCloseDetail = () => {
    if (detailsLoading) return;
    setSelected(null);
  };

  return {
    selected,
    detailsLoading,
    dialogProps: {
      actionType,
      batchId: dialogItem?.motorCasingId ?? dialogItem?.batchId ?? null,
      idLabel: STRINGS.APPROVER.ACTION.MOTOR_CASING_ID_LABEL,
      confirmDisabled: actionType === "REJECTED" ? dialogValue.trim().length === 0 : false,
      helperText: dialogError,
      onCancel: closeDialog,
      onConfirm: handleConfirm,
      onValueChange: (value: string) => {
        setDialogValue(value);
        if (dialogError) setDialogError("");
      },
      open: Boolean(actionType && dialogItem),
      submitting,
      value: dialogValue,
    },
    requestApprove: (item: any) => requestAction(item, "APPROVED"),
    requestReject: (item: any) => requestAction(item, "REJECTED"),
    handleViewDetails,
    handleCloseDetail,
    statusMeta: APPROVER_STATUS_META,
    priorityMeta: APPROVER_PRIORITY_META,
  };
};

export default useRocketMotorCasingApproverHook;
