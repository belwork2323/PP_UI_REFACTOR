import { useState } from "react";

import { useAlertStore } from "../../app/store/alertStore";
import { STRINGS } from "../../app/config/strings";
import dispatchController from "../../controllers/user/dispatch/dispatchController";
import {
  mapDispatchDetailsForDisplay,
  type DispatchDetailView,
} from "../../data/models/user/DispatchApiModel";
import useApproverFormAction from "./useApproverFormAction";

const DEPARTMENT = "dispatch" as const;
const SUB_DEPARTMENT = "dispatch";
const S = STRINGS.DISPATCH;

type ApproverListRow = Record<string, unknown> & {
  id?: number | string;
  formId?: string | null;
  batchId?: string | null;
  batchType?: string | null;
  status?: string | null;
  dispatchStatus?: string | null;
};

export const useDispatchApproverHook = () => {
  const showAlert = useAlertStore((state) => state.showAlert);
  const [items, setItems] = useState<ApproverListRow[]>([]);
  const [selected, setSelected] = useState<ApproverListRow | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailView, setDetailView] = useState<DispatchDetailView | null>(null);

  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: DEPARTMENT,
    setItems,
    setSelected,
    subDepartment: SUB_DEPARTMENT,
    statusField: "dispatchStatus",
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

    const response = await dispatchController.fetchFormDetails({ formId });

    setDetailsLoading(false);

    if (!response?.success || !response?.data) {
      const fallback = response?.statusCode === 404 ? S.DETAILS_NOT_FOUND : S.DETAILS_FETCH_ERROR;
      showAlert(response?.message || fallback, "error", { autoCloseMs: 3500 });
      setSelected(null);
      return;
    }

    setDetailView(mapDispatchDetailsForDisplay(response.data));
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

export default useDispatchApproverHook;
