import { useMemo, useState } from "react";

import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { STRINGS } from "../../../app/config/strings";
import mixingController from "../../../controllers/user/manufacturing/mixingController";
import {
  mapMixingDetailsForDisplay,
  type MixingDetailView,
} from "../../../data/models/user/MixingFormModel";
import useApproverFormAction from "../useApproverFormAction";

const DEPARTMENT = "manufacturing" as const;
const SUB_DEPARTMENT = "mixing";
const S = STRINGS.MANUFACTURING.MIXING;

type ApproverListRow = Record<string, unknown> & {
  id?: number | string;
  formId?: string | null;
  batchId?: string | null;
  motorId?: string | null;
  status?: string | null;
  mxStatus?: string | null;
};

export const useMixingApproverHook = () => {
  const showAlert = useAlertStore((state) => state.showAlert);
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<ApproverListRow[]>([]);
  const [selected, setSelected] = useState<ApproverListRow | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailView, setDetailView] = useState<MixingDetailView | null>(null);

  const subDepartmentId = useMemo(() => {
    const match =
      user?.allSubDepartments?.find(
        (item) => item.slugs?.dept === "manufacturing" && item.slugs?.subDept === SUB_DEPARTMENT,
      ) ??
      user?.allSubDepartments?.find((item) => item.slugs?.subDept === SUB_DEPARTMENT);
    return match?.subDepartmentId ?? null;
  }, [user]);

  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: DEPARTMENT,
    setItems,
    setSelected,
    subDepartment: SUB_DEPARTMENT,
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

    const response = await mixingController.fetchFormDetails({ formId, subDepartmentId });

    setDetailsLoading(false);

    if (!response?.success || !response?.data) {
      const fallback =
        response?.statusCode === 404 ? S.DETAILS_NOT_FOUND : S.DETAILS_FETCH_ERROR;
      showAlert(response?.message || fallback, "error", { autoCloseMs: 3500 });
      setSelected(null);
      return;
    }

    setDetailView(
      mapMixingDetailsForDisplay(response.data as unknown as Record<string, unknown>),
    );
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

export default useMixingApproverHook;
