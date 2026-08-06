import { useCallback, useState } from "react";

import { useAlertStore } from "../../../app/store/alertStore";
import { STRINGS } from "../../../app/config/strings";
import { normalizeApproverBatchStatus } from "../../../data/models/approver/ApproverBatchListModel";
import subscaleController from "../../../controllers/user/manufacturing/subscaleController";
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
  const [items, setItems] = useState<ApproverListRow[]>([]);
  const [selected, setSelected] = useState<ApproverListRow | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailView, setDetailView] = useState<SubscaleDetailView | null>(null);

  const refreshSelectedDetails = useCallback(async (formId: string) => {
    const response = await subscaleController.fetchFormDetails({
      formId,
      subDepartmentId: 0,
    });
    if (!response?.success || !response?.data) return null;
    return mapSubscaleDetailsForDisplay(response.data);
  }, []);

  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: DEPARTMENT,
    setItems,
    setSelected,
    subDepartment: SUB_DEPARTMENT,
    onStatusChangeSuccess: async (item, response) => {
      const formId = String(item.formId ?? "").trim();
      if (!formId) return;

      setDetailsLoading(true);
      try {
        const refreshed = await refreshSelectedDetails(formId);
        if (!refreshed) return;

        const batchStatus = normalizeApproverBatchStatus(
          (response.data as { batchStatus?: string })?.batchStatus ??
            (response.data as { status?: string })?.status ??
            refreshed.status,
        );

        setDetailView(refreshed);
        setSelected((current) =>
          current
            ? {
                ...current,
                status: batchStatus || current.status,
                ssStatus: batchStatus || current.ssStatus,
              }
            : current,
        );
        setItems((current) =>
          current.map((row) => {
            const isMatch =
              row.id === item.id ||
              (row.formId && item.formId && row.formId === item.formId) ||
              (row.batchId && item.batchId && row.batchId === item.batchId);
            if (!isMatch) return row;
            return {
              ...row,
              status: batchStatus || row.status,
              ssStatus: batchStatus || row.ssStatus,
            };
          }),
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

    const response = await subscaleController.fetchFormDetails({
      formId,
      subDepartmentId: 0,
    });

    setDetailsLoading(false);

    if (!response?.success || !response?.data) {
      const fallback = response?.statusCode === 404 ? S.DETAILS_NOT_FOUND : S.DETAILS_FETCH_ERROR;
      showAlert(response?.message || fallback, "error", { autoCloseMs: 3500 });
      setSelected(null);
      return;
    }

    setDetailView(mapSubscaleDetailsForDisplay(response.data));
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
