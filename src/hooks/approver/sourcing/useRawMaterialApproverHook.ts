import { useMemo, useState } from "react";

import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useApproverListRefreshStore } from "../../../app/store/approverListRefreshStore";
import { APPROVER_STATUS_META, APPROVER_PRIORITY_META, isApproverActionableStatus } from "../../../app/theme/approver";
import rawMaterialProcurementController from "../../../controllers/user/sourcing/rawMaterialProcurementController";
import rawMaterialProcurementApproverController from "../../../controllers/approver/rawMaterialProcurementApproverController";
import type { ApproverFormActionType } from "../../../data/api/approver/approverApi";
import {
  RawMaterialLotDetailsModel,
} from "../../../data/models/user/RawMaterialProcurementModel";
import { submitApproverFormStatusChange } from "../../../controllers/approver/approverController";

const DEPARTMENT_SLUG = "sourcing";
const SUB_DEPARTMENT_SLUG = "raw-material";

const S = STRINGS.SOURCING.SPECIFICATION_FORM;
const A = STRINGS.APPROVER.ACTION;

const getResponseMessage = (response: { message?: string; errorCode?: string | null }) =>
  response.message || response.errorCode || A.FAILED;

export const useRawMaterialApproverHook = () => {
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
    if (!subDepartmentId) {
      showAlert(A.SUBDEPARTMENT_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    const lotId = String(item?.lotId ?? item?.batchId ?? "").trim();

    if (!lotId) {
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
    const lotId = String(dialogItem?.lotId ?? dialogItem?.batchId ?? "").trim();
    const procurementId = String(dialogItem?.procurementId ?? dialogItem?.formId ?? "").trim();

    if (actionType === "REJECTED" && !trimmedValue) {
      setDialogError(A.REJECTION_REASON_REQUIRED);
      return;
    }

    if (!lotId || !procurementId) {
      showAlert(A.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    setSubmitting(true);
    showAlert(actionType === "APPROVED" ? A.APPROVING : A.REJECTING, "info", { loading: true });

    const response = await submitApproverFormStatusChange({
      formId: lotId,
      subDepartmentId,
      actionType,
      remarks: actionType === "APPROVED" ? trimmedValue || null : null,
      rejectionReason: actionType === "REJECTED" ? trimmedValue : null,
    });

    setSubmitting(false);

    if (response.success) {
      const nextStatus = (response.data as { status?: string })?.status
        ?? (actionType === "APPROVED" ? "Approved" : "Rejected");

      setSelected(null);
      closeDialog();
      bumpListVersion();
      showAlert(getResponseMessage(response), "success", { autoCloseMs: 2000 });
      return;
    }

    showAlert(getResponseMessage(response), "error", { autoCloseMs: 3500 });
  };

  const handleViewDetails = async (row: any) => {
    setSelected({ ...row, qcBlocks: [] });
    setDetailsLoading(true);

    if (!subDepartmentId) {
      setDetailsLoading(false);
      setSelected(null);
      showAlert(A.SUBDEPARTMENT_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    const lotId = String(row?.lotId ?? row?.batchId ?? "").trim();

    if (!lotId) {
      setDetailsLoading(false);
      setSelected(null);
      showAlert(S.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    const response = await rawMaterialProcurementController.fetchLotDetails({ lotId });
    setDetailsLoading(false);

    if (!response?.success || !response.data) {
      showAlert(response?.message || S.DETAILS_FETCH_ERROR, "error", { autoCloseMs: 3500 });
      setSelected(null);
      return;
    }

    const model = response.data as RawMaterialLotDetailsModel;
    setSelected({
      ...row,
      lotId: model.lotId || lotId,
      procurementId: row.procurementId ?? "",
      batchId: lotId,
      formId: row.lotId,
      materialCode: model.materialCode || row.materialCode,
      materialName: model.materialName || row.materialName,
      qcBlocks: RawMaterialLotDetailsModel.toMaterialBlocks(model),
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
      batchId: dialogItem?.lotId ?? dialogItem?.batchId ?? null,
      idLabel: A.LOT_ID_LABEL,
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

export default useRawMaterialApproverHook;
