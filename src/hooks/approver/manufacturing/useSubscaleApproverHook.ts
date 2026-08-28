import { useCallback, useMemo, useState } from "react";

import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { STRINGS } from "../../../app/config/strings";
import subscaleApproverController from "../../../controllers/approver/subscaleApproverController";
import subscaleController from "../../../controllers/user/manufacturing/subscaleController";
import type { ApproverChangeStatusPayload } from "../../../data/api/approver/approverApi";
import {
  resolveApproverChangeStatusFromResponse,
} from "../../../data/models/approver/ApproverBatchListModel";
import {
  mapSubscaleDetailsForDisplay,
  type SubscaleDetailView,
} from "../../../data/models/user/SubscaleFormModel";
import useApproverFormAction from "../useApproverFormAction";

const DEPARTMENT = "manufacturing" as const;
const SUB_DEPARTMENT = "subscale";
const S = STRINGS.MANUFACTURING.SUBSCALE;

type ApproverListRow = Record<string, unknown> & {
  id?: number | string;
  formId?: string | null;
  batchId?: string | null;
  status?: string | null;
  ssStatus?: string | null;
};

export const useSubscaleApproverHook = () => {
  const showAlert = useAlertStore((state) => state.showAlert);
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<ApproverListRow[]>([]);
  const [selected, setSelected] = useState<ApproverListRow | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailView, setDetailView] = useState<SubscaleDetailView | null>(null);

  const subDepartmentId = useMemo(() => {
    const match =
      user?.allSubDepartments?.find(
        (item) => item.slugs?.dept === "manufacturing" && item.slugs?.subDept === SUB_DEPARTMENT,
      ) ??
      user?.allSubDepartments?.find((item) => item.slugs?.subDept === SUB_DEPARTMENT);
    return match?.subDepartmentId ?? null;
  }, [user]);

  const refreshSelectedDetails = useCallback(
    async (formId: string) => {
      if (!subDepartmentId) return null;
      const response = await subscaleController.fetchFormDetails({
        formId,
        subDepartmentId,
      });
      if (!response?.success || !response?.data) return null;
      return mapSubscaleDetailsForDisplay(response.data);
    },
    [subDepartmentId],
  );

  const submitFormChangeStatus = useCallback(
    async (payload: Record<string, unknown>) =>
      subscaleApproverController.submitFormStatusChange({
        formId: String(payload.formId ?? ""),
        subDepartmentId: Number(payload.subDepartmentId ?? 0),
        actionType: payload.actionType as ApproverChangeStatusPayload["actionType"],
        remarks: (payload.remarks as string | null | undefined) ?? null,
        rejectionReason: (payload.rejectionReason as string | null | undefined) ?? null,
      }),
    [],
  );

  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: DEPARTMENT,
    setItems,
    setSelected,
    subDepartment: SUB_DEPARTMENT,
    statusField: "ssStatus",
    submitChangeStatus: submitFormChangeStatus,
    onStatusChangeSuccess: async (item, response, actionType) => {
      const formId = String(item.formId ?? "").trim();
      if (!formId) return;

      setDetailsLoading(true);
      try {
        const refreshed = await refreshSelectedDetails(formId);
        const batchStatus = resolveApproverChangeStatusFromResponse(response, actionType);

        if (refreshed) setDetailView(refreshed);

        setSelected((current) =>
          current
            ? {
                ...current,
                status: batchStatus || current.status,
                ssStatus: batchStatus || current.ssStatus,
              }
            : current,
        );
      } finally {
        setDetailsLoading(false);
      }
    },
    closeSelectedOnSuccess: false,
  });

  const handleViewDetails = async (row: ApproverListRow) => {
    setSelected({ ...row });
    setDetailView(null);
    setDetailsLoading(true);

    const formId = String(row?.formId ?? "").trim();

    if (!formId) {
      setDetailsLoading(false);
      setSelected(null);
      showAlert(S.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    if (!subDepartmentId) {
      setDetailsLoading(false);
      setSelected(null);
      showAlert(S.SUB_DEPARTMENT_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    const response = await subscaleController.fetchFormDetails({
      formId,
      subDepartmentId,
    });

    setDetailsLoading(false);

    if (!response?.success || !response?.data) {
      const fallback = response?.statusCode === 404 ? S.DETAILS_NOT_FOUND : S.DETAILS_FETCH_ERROR;
      showAlert(response?.message || fallback, "error", { autoCloseMs: 3500 });
      setSelected(null);
      return;
    }

    const mapped = mapSubscaleDetailsForDisplay(response.data);
    setDetailView(mapped);
    setSelected({
      ...row,
      formId: mapped?.formId || formId,
      batchId: mapped?.batchId || row.batchId,
      status: mapped?.status ?? row.ssStatus ?? row.status,
      ssStatus: mapped?.status ?? row.ssStatus ?? row.status,
    });
  };

  const handleCloseDetail = () => {
    if (detailsLoading) return;
    setSelected(null);
    setDetailView(null);
  };

  return {
    items,
    selected,
    detailsLoading,
    detailView,
    dialogProps,
    requestApprove,
    requestReject,
    handleViewDetails,
    handleCloseDetail,
  };
};

export default useSubscaleApproverHook;
