import { useMemo, useState } from "react";

import { STRINGS } from "../../app/config/strings";
import { useApproverListRefreshStore } from "../../app/store/approverListRefreshStore";
import { useAuthStore } from "../../app/store/authStore";
import type { ApproverDepartmentKey } from "../../app/theme/approver";
import { isApproverActionableStatus } from "../../app/theme/approver";
import { normalizeApproverBatchStatus } from "../../data/models/approver/ApproverBatchListModel";
import { useAlertStore } from "../../app/store/alertStore";
import type { ApproverFormActionType } from "../../data/api/approver/approverApi";
import { submitApproverFormStatusChange } from "../../controllers/approver/approverController";

type ActionableApproverItem = {
  id?: number | string;
  formId?: string | null;
  batchId?: string | null;
  status?: string | null;
  remarks?: string | null;
  rejectionReason?: string | null;
  [key: string]: unknown;
};

type UseApproverFormActionArgs<T extends ActionableApproverItem> = {
  department: ApproverDepartmentKey;
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  setSelected: React.Dispatch<React.SetStateAction<T | null>>;
  subDepartment: string;
};

const DEPARTMENT_SLUGS: Record<ApproverDepartmentKey, string> = {
  sourcing: "sourcing",
  manufacturing: "manufacturing",
  dispatch: "dispatch",
  qualityControl: "quality",
};

const getResponseMessage = (response: { message?: string; errorCode?: string | null }) =>
  response.message || response.errorCode || STRINGS.APPROVER.ACTION.FAILED;

export const useApproverFormAction = <T extends ActionableApproverItem>({
  department,
  setItems,
  setSelected,
  subDepartment,
}: UseApproverFormActionArgs<T>) => {
  const user = useAuthStore((state) => state.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpListVersion = useApproverListRefreshStore((state) => state.bumpVersion);

  const [actionType, setActionType] = useState<ApproverFormActionType | null>(null);
  const [dialogItem, setDialogItem] = useState<T | null>(null);
  const [dialogValue, setDialogValue] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedSubDepartment = useMemo(() => {
    const deptSlug = DEPARTMENT_SLUGS[department];

    return (
      user?.allSubDepartments.find(
        (item) => item.slugs?.dept === deptSlug && item.slugs?.subDept === subDepartment,
      ) ?? null
    );
  }, [department, subDepartment, user]);

  const closeDialog = () => {
    if (submitting) {
      return;
    }

    setActionType(null);
    setDialogItem(null);
    setDialogValue("");
    setDialogError("");
  };

  const requestAction = (item: T, nextActionType: ApproverFormActionType) => {
    if (!selectedSubDepartment?.subDepartmentId) {
      showAlert(STRINGS.APPROVER.ACTION.SUBDEPARTMENT_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    if (!item?.formId) {
      showAlert(STRINGS.APPROVER.ACTION.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    if (!isApproverActionableStatus(item.status)) {
      showAlert(STRINGS.APPROVER.ACTION.INVALID_STATUS, "warning", { autoCloseMs: 3000 });
      return;
    }

    setActionType(nextActionType);
    setDialogItem(item);
    setDialogValue(nextActionType === "REJECTED" ? String(item.rejectionReason ?? "") : String(item.remarks ?? ""));
    setDialogError("");
  };

  const handleConfirm = async () => {
    if (!dialogItem || !actionType) {
      return;
    }

    const trimmedValue = dialogValue.trim();

    if (actionType === "REJECTED" && !trimmedValue) {
      setDialogError(STRINGS.APPROVER.ACTION.REJECTION_REASON_REQUIRED);
      return;
    }

    if (!selectedSubDepartment?.subDepartmentId) {
      showAlert(STRINGS.APPROVER.ACTION.SUBDEPARTMENT_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    if (!dialogItem.formId) {
      showAlert(STRINGS.APPROVER.ACTION.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    setSubmitting(true);
    showAlert(
      actionType === "APPROVED" ? STRINGS.APPROVER.ACTION.APPROVING : STRINGS.APPROVER.ACTION.REJECTING,
      "info",
      { loading: true },
    );

    const response = await submitApproverFormStatusChange({
      actionType,
      formId: dialogItem.formId,
      subDepartmentId: selectedSubDepartment.subDepartmentId,
      remarks: actionType === "APPROVED" ? (trimmedValue || null) : null,
      rejectionReason: actionType === "REJECTED" ? trimmedValue : null,
    });

    setSubmitting(false);

    if (response.success) {
      const nextStatus =
        actionType === "APPROVED" ? "Approved" : "Rejected";

      setItems((current) =>
        current.map((item) => {
          const isMatch =
            item.id === dialogItem.id ||
            (item.formId && dialogItem.formId && item.formId === dialogItem.formId) ||
            (item.batchId && dialogItem.batchId && item.batchId === dialogItem.batchId);

          if (!isMatch) {
            return item;
          }

          return {
            ...item,
            status: normalizeApproverBatchStatus(
              (response.data as { status?: string })?.status ?? nextStatus,
            ),
            remarks: actionType === "APPROVED" ? (trimmedValue || null) : item.remarks ?? null,
            rejectionReason: actionType === "REJECTED" ? trimmedValue : null,
          };
        }),
      );

      setSelected(null);
      closeDialog();
      bumpListVersion();
      showAlert(getResponseMessage(response), "success", { autoCloseMs: 2000 });
      return;
    }

    showAlert(getResponseMessage(response), "error", { autoCloseMs: 3500 });
  };

  return {
    dialogProps: {
      actionType,
      batchId: dialogItem?.batchId ?? null,
      confirmDisabled: actionType === "REJECTED" ? dialogValue.trim().length === 0 : false,
      helperText: dialogError,
      onCancel: closeDialog,
      onConfirm: handleConfirm,
      onValueChange: (value: string) => {
        setDialogValue(value);
        if (dialogError) {
          setDialogError("");
        }
      },
      open: Boolean(actionType && dialogItem),
      submitting,
      value: dialogValue,
    },
    requestApprove: (item: T) => requestAction(item, "APPROVED"),
    requestReject: (item: T) => requestAction(item, "REJECTED"),
  };
};

export default useApproverFormAction;