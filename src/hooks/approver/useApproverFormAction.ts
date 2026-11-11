import { useMemo, useState } from "react";

import { STRINGS } from "../../app/config/strings";
import { useApproverListRefreshStore } from "../../app/store/approverListRefreshStore";
import { useAuthStore } from "../../app/store/authStore";
import type { ApproverDepartmentKey } from "../../app/theme/approver";
import { isApproverActionableStatus } from "../../app/theme/approver";
import {
  mirrorApproverSubdepartmentStatusFields,
  resolveApproverChangeStatusFromResponse,
} from "../../data/models/approver/ApproverBatchListModel";
import { useAlertStore } from "../../app/store/alertStore";
import type {
  ApproverChangeStatusPayload,
  ApproverFormActionType,
} from "../../data/api/approver/approverApi";
import { submitApproverFormStatusChange } from "../../controllers/approver/approverController";
import type { ApiResponseModel } from "../../data/models/common/ApiResponseModel";

type ActionableApproverItem = {
  id?: number | string;
  formId?: string | null;
  batchId?: string | null;
  status?: string | null;
  remarks?: string | null;
  rejectionReason?: string | null;
  [key: string]: unknown;
};

type ApproverChangeStatusRequest = ApproverChangeStatusPayload & Record<string, unknown>;

type UseApproverFormActionArgs<T extends ActionableApproverItem> = {
  department: ApproverDepartmentKey;
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  setSelected: React.Dispatch<React.SetStateAction<T | null>>;
  subDepartment: string;
  statusField?: string;
  /**
   * Override form-row actionable gate. Motor workflows may stay actioning while form
   * status is IN_PROGRESS after a sibling unit was approved.
   */
  isItemActionable?: (item: T) => boolean;
  buildChangeStatusPayload?: (item: T) => Partial<ApproverChangeStatusRequest>;
  /** Override dialog prefill. For REJECTED, return "" to avoid stale batch rejectionReason. */
  getInitialDialogValue?: (item: T, actionType: ApproverFormActionType) => string;
  /** When true, successful reject/approve does not write remarks/rejectionReason onto list rows. */
  skipListRemarkMirror?: boolean;
  submitChangeStatus?: (payload: ApproverChangeStatusRequest) => Promise<ApiResponseModel<unknown>>;
  onStatusChangeSuccess?: (
    item: T,
    response: ApiResponseModel<unknown>,
    actionType: ApproverFormActionType,
  ) => void | Promise<void>;
  closeSelectedOnSuccess?: boolean;
};

const DEPARTMENT_SLUGS: Record<ApproverDepartmentKey, string> = {
  sourcing: "sourcing",
  manufacturing: "manufacturing",
  dispatch: "dispatch",
  qualityControl: "quality",
};

const getResponseMessage = (
  response?: {
    message?: string;
    errorCode?: string | null;
    statusCode?: number;
    code?: number;
  } | null,
) => {
  if (!response) return STRINGS.SYSTEM.SERVER_ERROR;
  const statusCode = Number(response.statusCode ?? response.code ?? 0);
  const errorCode = String(response.errorCode ?? "").toUpperCase();
  if (
    statusCode >= 500 ||
    errorCode === "INTERNAL_SERVER_ERROR" ||
    /unexpected server error/i.test(String(response.message ?? ""))
  ) {
    return STRINGS.SYSTEM.SERVER_ERROR;
  }
  return response.message || response.errorCode || STRINGS.APPROVER.ACTION.FAILED;
};

export const useApproverFormAction = <T extends ActionableApproverItem>({
  department,
  setItems,
  setSelected,
  subDepartment,
  statusField = "status",
  isItemActionable,
  buildChangeStatusPayload,
  getInitialDialogValue,
  skipListRemarkMirror = false,
  submitChangeStatus,
  onStatusChangeSuccess,
  closeSelectedOnSuccess = true,
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
      ) ??
      user?.allSubDepartments.find((item) => item.slugs?.subDept === subDepartment) ??
      null
    );
  }, [department, subDepartment, user]);

  const resolveItemStatus = (item: T) => {
    const fieldValue = String(item[statusField] ?? "").trim();
    return fieldValue || String(item.status ?? "").trim();
  };

  const closeDialog = (options?: { force?: boolean }) => {
    if (submitting && !options?.force) {
      return;
    }

    setSubmitting(false);
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
    console.log(resolveItemStatus(item));

    const actionable = isItemActionable
      ? isItemActionable(item)
      : isApproverActionableStatus(resolveItemStatus(item));
    if (!actionable) {
      showAlert(STRINGS.APPROVER.ACTION.INVALID_STATUS, "warning", { autoCloseMs: 3000 });
      return;
    }

    setActionType(nextActionType);
    setDialogItem(item);
    const initialValue = getInitialDialogValue
      ? getInitialDialogValue(item, nextActionType)
      : nextActionType === "REJECTED"
        ? String(item.rejectionReason ?? "")
        : String(item.remarks ?? "");
    setDialogValue(initialValue);
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
      actionType === "APPROVED"
        ? STRINGS.APPROVER.ACTION.APPROVING
        : STRINGS.APPROVER.ACTION.REJECTING,
      "info",
      { loading: true },
    );

    const payload: ApproverChangeStatusRequest = {
      formId: dialogItem.formId,
      subDepartmentId: selectedSubDepartment.subDepartmentId,
      ...(buildChangeStatusPayload?.(dialogItem) ?? {}),
      actionType,
      remarks: actionType === "APPROVED" ? trimmedValue || null : null,
      rejectionReason: actionType === "REJECTED" ? trimmedValue : null,
    };

    try {
      const response = submitChangeStatus
        ? await submitChangeStatus(payload)
        : await submitApproverFormStatusChange(payload);

      setSubmitting(false);

      if (response?.success) {
        const resolvedStatus = resolveApproverChangeStatusFromResponse(response, actionType);
        const statusMirrors = mirrorApproverSubdepartmentStatusFields(resolvedStatus);

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
              status: resolvedStatus,
              ...statusMirrors,
              ...(skipListRemarkMirror
                ? {}
                : {
                    remarks:
                      actionType === "APPROVED" ? trimmedValue || null : (item.remarks ?? null),
                    rejectionReason: actionType === "REJECTED" ? trimmedValue : null,
                  }),
            };
          }),
        );

        try {
          await onStatusChangeSuccess?.(dialogItem, response, actionType);
        } catch (error) {
          console.error("Approver post-action details refresh failed", error);
        }

        if (closeSelectedOnSuccess) {
          setSelected(null);
        }
        closeDialog({ force: true });
        bumpListVersion();
        showAlert(getResponseMessage(response), "success", { autoCloseMs: 2000 });
        return;
      }

      // Close action dialog first so GlobalAlert is not covered by it.
      closeDialog({ force: true });
      showAlert(getResponseMessage(response), "error", { autoCloseMs: 4000 });
    } catch (error) {
      closeDialog({ force: true });
      const status =
        error && typeof error === "object" && "status" in error
          ? Number((error as { status?: unknown }).status ?? 0)
          : 0;
      const rawMessage =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message ?? "")
          : "";
      const message =
        status >= 500 || !rawMessage || /unexpected server error/i.test(rawMessage)
          ? STRINGS.SYSTEM.SERVER_ERROR
          : rawMessage;
      showAlert(message, "error", { autoCloseMs: 4000 });
    }
  };

  return {
    dialogProps: {
      subdepartment: selectedSubDepartment?.subDepartmentId ?? 0,
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
