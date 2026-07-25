import { useMemo, useState } from "react";

import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { STRINGS } from "../../../app/config/strings";
import stfController from "../../../controllers/user/quality_control/stfController";
import {
  mapStfDetailsForDisplay,
  type StfDetailView,
} from "../../../data/models/user/StaticTestFacilityApiModel";
import useApproverFormAction from "../useApproverFormAction";

const DEPARTMENT = "qualityControl" as const;
const SUB_DEPARTMENT = "static-test-facility";
const S = STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY;

type ApproverListRow = Record<string, unknown> & {
  id?: number | string;
  formId?: string | null;
  batchId?: string | null;
  batchType?: string | null;
  status?: string | null;
  stfStatus?: string | null;
};

export const useStfApproverHook = () => {
  const showAlert = useAlertStore((state) => state.showAlert);
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<ApproverListRow[]>([]);
  const [selected, setSelected] = useState<ApproverListRow | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailView, setDetailView] = useState<StfDetailView | null>(null);

  const subDepartmentId = useMemo(() => {
    const match =
      user?.allSubDepartments?.find(
        (item) => item.slugs?.dept === "quality" && item.slugs?.subDept === SUB_DEPARTMENT,
      ) ?? user?.allSubDepartments?.find((item) => item.slugs?.subDept === SUB_DEPARTMENT);
    return match?.subDepartmentId ?? null;
  }, [user]);

  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: DEPARTMENT,
    setItems,
    setSelected,
    subDepartment: SUB_DEPARTMENT,
    statusField: "stfStatus",
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

    const response = await stfController.fetchFormDetails({ formId, subDepartmentId });

    setDetailsLoading(false);

    if (!response?.success || !response?.data) {
      const fallback = response?.statusCode === 404 ? S.DETAILS_NOT_FOUND : S.DETAILS_FETCH_ERROR;
      showAlert(response?.message || fallback, "error", { autoCloseMs: 3500 });
      setSelected(null);
      return;
    }

    setDetailView(mapStfDetailsForDisplay(response.data as unknown as Record<string, unknown>));
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

export default useStfApproverHook;
