import { useEffect, useMemo, useState } from "react";
import { alpha } from "@mui/material";

import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useApproverListRefreshStore } from "../../../app/store/approverListRefreshStore";
import { APPROVER_STATUS_META, APPROVER_PRIORITY_META, isApproverActionableStatus } from "../../../app/theme/approver";
import rawMaterialProcurementController from "../../../controllers/user/sourcing/rawMaterialProcurementController";
import type { ApproverFormActionType } from "../../../data/api/approver/approverApi";
import {
  RawMaterialLotDetailsModel,
} from "../../../data/models/user/RawMaterialProcurementModel";
import {
  toMaterialCodeNameOptions,
  type MaterialsListItem,
} from "../../../data/models/user/MaterialsListModel";
import { RAW_MATERIAL_APPROVER_STATUS_TABS } from "../../../data/models/approver/RawMaterialProcurementApproverModel";
import { OPERATION_STATUS } from "../../operationStatus";
import { operationsController } from "../../../controllers/user/operationsController";
import { submitApproverFormStatusChange } from "../../../controllers/approver/approverController";

const DEPARTMENT_SLUG = "sourcing";
const SUB_DEPARTMENT_SLUG = "raw-material";
const FILTER_ALL = STRINGS.APPROVER.COMMON.STATUS_ALL;

export type RawMaterialApproverAppliedFilters = {
  materialCode: string;
  fromDate: string;
  toDate: string;
};

const emptyAppliedFilters: RawMaterialApproverAppliedFilters = {
  materialCode: "",
  fromDate: "",
  toDate: "",
};

type SubdeptMaterialOption = {
  materialCode: string;
  materialName: string;
};

const normalizeMaterialsList = (items: MaterialsListItem[]): SubdeptMaterialOption[] =>
  toMaterialCodeNameOptions(items);

const RAW_MATERIAL_APPROVER_STATUS_META = {
  ...APPROVER_STATUS_META,
  [OPERATION_STATUS.INITIATED]: {
    bg: alpha("#5D6D7E", 0.08),
    color: "#2E4053",
    border: alpha("#5D6D7E", 0.2),
  },
  [OPERATION_STATUS.IN_PROGRESS]: {
    bg: alpha("#2E86C1", 0.1),
    color: "#1A5276",
    border: alpha("#2E86C1", 0.3),
  },
};

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
  const [appliedFilters, setAppliedFilters] = useState<RawMaterialApproverAppliedFilters>(emptyAppliedFilters);
  const [materialOptions, setMaterialOptions] = useState<SubdeptMaterialOption[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  const subDepartmentId = useMemo(() => {
    const match =
      user?.allSubDepartments.find(
        (sd) => sd.slugs?.dept === DEPARTMENT_SLUG && sd.slugs?.subDept === SUB_DEPARTMENT_SLUG,
      ) ??
      user?.allSubDepartments.find((sd) => sd.slugs?.subDept === SUB_DEPARTMENT_SLUG);

    return match?.subDepartmentId ?? null;
  }, [user]);

  const [statusFilter, setStatusFilter] = useState(FILTER_ALL);

  useEffect(() => {
    let active = true;

    const loadMaterials = async () => {
      setMaterialsLoading(true);
      try {
        const response = await operationsController.fetchAllMaterialsList();
        if (!active) return;
        if (response?.success && Array.isArray(response.data) && response.data.length > 0) {
          setMaterialOptions(normalizeMaterialsList(response.data));
          return;
        }
        setMaterialOptions([]);
      } catch {
        if (active) setMaterialOptions([]);
      } finally {
        if (active) setMaterialsLoading(false);
      }
    };

    void loadMaterials();

    return () => {
      active = false;
    };
  }, []);

  const listFiltersRecord = useMemo(
    () => ({
      materialCode: appliedFilters.materialCode || FILTER_ALL,
      fromDate: appliedFilters.fromDate,
      toDate: appliedFilters.toDate,
    }),
    [appliedFilters],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.materialCode) count += 1;
    if (appliedFilters.fromDate) count += 1;
    if (appliedFilters.toDate) count += 1;
    if (statusFilter !== FILTER_ALL) count += 1;
    return count;
  }, [appliedFilters, statusFilter]);

  const applyListFilters = (next: RawMaterialApproverAppliedFilters) => {
    setAppliedFilters(next);
  };

  const applyPanelFilters = (next: RawMaterialApproverAppliedFilters & { status: string }) => {
    setAppliedFilters({
      materialCode: next.materialCode,
      fromDate: next.fromDate,
      toDate: next.toDate,
    });
    setStatusFilter(next.status || FILTER_ALL);
  };

  const clearListFilters = () => {
    setAppliedFilters(emptyAppliedFilters);
    setStatusFilter(FILTER_ALL);
  };

  const statusTabs = useMemo(() => [FILTER_ALL, ...RAW_MATERIAL_APPROVER_STATUS_TABS], []);

  const statusDropdownValues = useMemo(
    () => [FILTER_ALL, ...RAW_MATERIAL_APPROVER_STATUS_TABS],
    [],
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
      materialName: row.materialName,
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
    statusMeta: RAW_MATERIAL_APPROVER_STATUS_META,
    priorityMeta: APPROVER_PRIORITY_META,
    appliedFilters,
    applyListFilters,
    applyPanelFilters,
    clearListFilters,
    activeFilterCount,
    listFiltersRecord,
    materialOptions,
    materialsLoading,
    statusFilter,
    setStatusFilter,
    statusTabs,
    statusDropdownValues,
    filterAllLabel: FILTER_ALL,
  };
};

export default useRawMaterialApproverHook;
