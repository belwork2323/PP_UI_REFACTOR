import { useMemo, useState } from "react";

import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { STRINGS } from "../../../app/config/strings";
import qcDivisionController from "../../../controllers/user/quality_control/qcDivisionController";
import { QCDivisionDetailsModel } from "../../../data/models/user/QCDivisionApiModel";
import type { QCDivisionDetailView } from "../../../data/models/user/QualityControlFormModel";
import type { QualityControlFormState } from "../../../data/models/user/QualityControlFormModel";
import { createDefaultQualityControlFormState } from "../../../data/models/user/QualityControlFormModel";
import useApproverFormAction from "../useApproverFormAction";
import { loadQcDivisionDetailsViewState } from "../../user/qualityControl/qcDivisionDetailsHydration";

const DEPARTMENT = "qualityControl" as const;
const SUB_DEPARTMENT = "qc-division";
const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

type ApproverListRow = Record<string, unknown> & {
  id?: number | string;
  formId?: string | null;
  batchId?: string | null;
  status?: string | null;
  qcDivStatus?: string | null;
  subDepartmentId?: number | null;
};

const resolveSubDepartmentId = (
  user: ReturnType<typeof useAuthStore.getState>["user"],
  row?: ApproverListRow | null,
) => {
  const fromRow = Number(row?.subDepartmentId ?? 0);
  if (fromRow > 0) return fromRow;

  const match =
    user?.allSubDepartments?.find(
      (item) => item.slugs?.dept === "quality" && item.slugs?.subDept === SUB_DEPARTMENT,
    ) ??
    user?.allSubDepartments?.find((item) => item.slugs?.subDept === SUB_DEPARTMENT);

  return match?.subDepartmentId ?? null;
};

export const useQCDivisionApproverHook = () => {
  const showAlert = useAlertStore((state) => state.showAlert);
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<ApproverListRow[]>([]);
  const [selected, setSelected] = useState<ApproverListRow | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [detailView, setDetailView] = useState<QCDivisionDetailView | null>(null);
  const [formData, setFormData] = useState<QualityControlFormState>(createDefaultQualityControlFormState());
  const [activeDivisionGroupIndex, setActiveDivisionGroupIndex] = useState(0);
  const [activeDivisionSubIndex, setActiveDivisionSubIndex] = useState(0);
  const [resolvedSubDepartmentId, setResolvedSubDepartmentId] = useState<number | null>(null);

  const subDepartmentId = useMemo(() => resolveSubDepartmentId(user), [user]);

  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: DEPARTMENT,
    setItems,
    setSelected,
    subDepartment: SUB_DEPARTMENT,
    statusField: "qcDivStatus",
  });

  const handleViewDetails = async (row: ApproverListRow) => {
    setSelected({ ...row });
    setDetailView(null);
    setFormData(createDefaultQualityControlFormState());
    setActiveDivisionGroupIndex(0);
    setActiveDivisionSubIndex(0);
    setDetailsLoading(true);
    setSchemaLoading(false);

    const formId = String(row?.formId ?? "").trim();
    const rowSubDepartmentId = resolveSubDepartmentId(user, row);

    if (!formId) {
      setDetailsLoading(false);
      setSelected(null);
      showAlert(S.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    if (!rowSubDepartmentId) {
      setDetailsLoading(false);
      setSelected(null);
      showAlert(S.SUB_DEPARTMENT_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    try {
      const response = await qcDivisionController.fetchFormDetails({
        formId,
        subDepartmentId: rowSubDepartmentId,
      });

      if (!response?.success || !response?.data) {
        const fallback = response?.statusCode === 404 ? S.DETAILS_NOT_FOUND : S.DETAILS_FETCH_ERROR;
        showAlert(response?.message || fallback, "error", { autoCloseMs: 3500 });
        setSelected(null);
        return;
      }

      const effectiveSubDepartmentId = Number(response.data.subDepartmentId || rowSubDepartmentId);
      setResolvedSubDepartmentId(effectiveSubDepartmentId);
      setSchemaLoading(true);

      const { formData: hydratedFormData, detailView: hydratedDetailView } =
        await loadQcDivisionDetailsViewState(response.data, effectiveSubDepartmentId);

      setFormData(hydratedFormData);
      setDetailView(hydratedDetailView);
    } catch {
      showAlert(S.DETAILS_FETCH_ERROR, "error", { autoCloseMs: 3500 });
      setSelected(null);
      setDetailView(null);
      setFormData(createDefaultQualityControlFormState());
    } finally {
      setSchemaLoading(false);
      setDetailsLoading(false);
    }
  };

  const handleCloseDetail = () => {
    if (detailsLoading || schemaLoading) return;
    setSelected(null);
    setDetailView(null);
    setFormData(createDefaultQualityControlFormState());
    setActiveDivisionGroupIndex(0);
    setActiveDivisionSubIndex(0);
    setResolvedSubDepartmentId(null);
  };

  return {
    items,
    selected,
    detailsLoading,
    schemaLoading,
    detailView,
    formData,
    activeDivisionGroupIndex,
    activeDivisionSubIndex,
    setActiveDivisionGroupIndex,
    setActiveDivisionSubIndex,
    subDepartmentId: resolvedSubDepartmentId ?? subDepartmentId,
    dialogProps,
    requestApprove,
    requestReject,
    handleViewDetails,
    handleCloseDetail,
  };
};

export default useQCDivisionApproverHook;
