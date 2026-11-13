import { useMemo, useState } from "react";

import { STRINGS } from "@app/config/strings";
import { useAlertStore } from "@app/store/alertStore";
import { useAuthStore } from "@app/store/authStore";
import { useApproverListRefreshStore } from "@app/store/approverListRefreshStore";
import { isApproverActionableStatus } from "@app/theme/approver";
import rawMaterialSourcingController from "@controllers/user/sourcing/rms/rawMaterialSourcingController";
import type { ApproverFormActionType } from "@data/api/approver/approverApi";
import { RawMaterialLotDetailsModel } from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";
import { submitApproverFormStatusChange } from "@controllers/approver/approverController";

const DEPARTMENT_SLUG = "sourcing";
const SUB_DEPARTMENT_SLUG = "raw-material";

const S = STRINGS.SOURCING.SPECIFICATION_FORM;
const A = STRINGS.APPROVER.ACTION;

const getResponseMessage = (response: { message?: string; errorCode?: string | null }) =>
  response.message || response.errorCode || A.FAILED;

/** Selected lot details plus the approve / reject action dialog that refreshes them. */
export const useRawMaterialSourcingApproverDetails = () => {
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

  const subDepartmentId = useMemo(() => {
    const match =
      user?.allSubDepartments.find(
        (sd) => sd.slugs?.dept === DEPARTMENT_SLUG && sd.slugs?.subDept === SUB_DEPARTMENT_SLUG,
      ) ?? user?.allSubDepartments.find((sd) => sd.slugs?.subDept === SUB_DEPARTMENT_SLUG);

    return match?.subDepartmentId ?? null;
  }, [user]);

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
      nextActionType === "REJECTED"
        ? String(item.rejectionReason ?? "")
        : String(item.remarks ?? ""),
    );
    setDialogError("");
  };

  const handleConfirm = async () => {
    if (!dialogItem || !actionType || !subDepartmentId) return;

    const trimmedValue = dialogValue.trim();
    const lotId = String(dialogItem?.lotId ?? dialogItem?.batchId ?? "").trim();
    const sourcingId = String(dialogItem?.sourcingId ?? dialogItem?.formId ?? "").trim();

    if (actionType === "REJECTED" && !trimmedValue) {
      setDialogError(A.REJECTION_REASON_REQUIRED);
      return;
    }

    if (!lotId || !sourcingId) {
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
      const nextStatus =
        (response.data as { status?: string })?.status ??
        (actionType === "APPROVED" ? "Approved" : "Rejected");

      closeDialog();

      const lotIdForRefresh = lotId;
      setDetailsLoading(true);
      const detailsResponse = await rawMaterialSourcingController.fetchLotDetails({
        lotId: lotIdForRefresh,
      });
      setDetailsLoading(false);

      if (detailsResponse?.success && detailsResponse.data) {
        const model = detailsResponse.data as RawMaterialLotDetailsModel;
        setSelected((current) =>
          current
            ? {
                ...current,
                status: nextStatus,
                rejectionReason: model?.rejectionReason,
                lotId: model.lotId || lotIdForRefresh,
                batchId: lotIdForRefresh,
                formId: current.lotId ?? lotIdForRefresh,
                materialCode: model.materialCode || current.materialCode,
                qcBlocks: RawMaterialLotDetailsModel.toMaterialBlocks(model),
              }
            : current,
        );
      } else {
        setSelected((current) => (current ? { ...current, status: nextStatus } : current));
      }

      bumpListVersion();
      showAlert(getResponseMessage(response), "success", { autoCloseMs: 2000 });
      return;
    }

    showAlert(getResponseMessage(response), "error", { autoCloseMs: 3500 });
  };

  const handleViewDetails = async (row: any) => {
    setSelected({ ...row, qcBlocks: [], rejectionReason: row?.rejectionReason });
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

    const response = await rawMaterialSourcingController.fetchLotDetails({ lotId });
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
      sourcingId: row.sourcingId ?? "",
      batchId: lotId,
      formId: row.lotId,
      materialCode: model.materialCode || row.materialCode,
      materialName: row.materialName,
      rejectionReason: model?.rejectionReason,
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
      subdepartment: subDepartmentId ?? 0,
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
  };
};

export default useRawMaterialSourcingApproverDetails;
