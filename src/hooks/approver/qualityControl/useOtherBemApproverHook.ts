import { useCallback, useEffect, useMemo, useState } from "react";
import { useAlertStore } from "../../../app/store/alertStore";
import { STRINGS } from "../../../app/config/strings";

import otherBemController from "@/controllers/approver/otherBemController";
import {
  mapOtherBemListRow,
  OtherBemApproverListRow,
} from "@/data/models/approver/OtherBemApiModel";
import {
  BEMMotorDetailsModel,
  mapBemDetailsForDisplay,
  StfDetailView,
} from "@/data/models/user/StaticTestFacilityApiModel";
import { toOperationStatusApiValue } from "../../operationStatus";

const S = STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY;
const FILTER_ALL = STRINGS.USER_BATCH_LIST.FILTER_ALL;

export const useOtherBemApproverHook = () => {
  const showAlert = useAlertStore((state) => state.showAlert);

  const [items, setItems] = useState<OtherBemApproverListRow[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [selected, setSelected] = useState<OtherBemApproverListRow | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [remarks, setRemarks] = useState("");

  const [detailView, setDetailView] = useState<StfDetailView | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState(FILTER_ALL);
  const [search, setSearch] = useState("");

  // Confirmation dialog state for Approve / Reject actions
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: "APPROVE" | "REJECTED" | null;
    item: OtherBemApproverListRow | null;
  }>({
    open: false,
    type: null,
    item: null,
  });

  const mapDetailsPayload = (payload: unknown): StfDetailView | null => {
    const model =
      payload instanceof BEMMotorDetailsModel
        ? payload
        : BEMMotorDetailsModel.fromApi({ data: payload });
    return mapBemDetailsForDisplay(model);
  };

  // Fetch List
  const fetchList = useCallback(
    async (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
      setListLoading(true);

      const nextStatus = params?.status ?? statusFilter;
      const apiStatus = toOperationStatusApiValue(nextStatus, FILTER_ALL);

      const response = await otherBemController.fetchOtherBemList({
        page: params?.page ?? page,
        limit: params?.limit ?? limit,
        filters: {
          status: apiStatus || undefined,
          search: params?.search ?? search,
        },
        sort: {
          field: "createdOn",
          direction: "DESC",
        },
      });

      setListLoading(false);

      if (response?.success && Array.isArray(response?.data?.motors)) {
        setItems(response.data.motors.map(mapOtherBemListRow));
        const pagination = (response.data as { pagination?: Record<string, number> }).pagination
          ? (response.data as { pagination: Record<string, number> }).pagination
          : (response.data as unknown as Record<string, number>);
        setTotalRecords(Number(pagination?.totalRecords ?? response.data.totalRecords ?? 0));
        setTotalPages(Number(pagination?.totalPages ?? response.data.totalPages ?? 0));
        const counts = (response.data as { statusCounts?: Record<string, number> }).statusCounts;
        if (counts) {
          setStatusCounts(counts);
        }
      } else {
        showAlert(response?.message || "Failed to fetch list", "error", { autoCloseMs: 3000 });
      }
    },
    [page, limit, statusFilter, search, showAlert],
  );

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Fetch Details
  const handleViewDetails = async (row: OtherBemApproverListRow) => {
    setSelected({ ...row });
    setDetailView(null);
    setDetailsLoading(true);

    const motorId = String(row?.motorId ?? row?.id ?? "").trim();

    if (!motorId) {
      setDetailsLoading(false);
      setSelected(null);
      showAlert(S.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    const response = await otherBemController.fetchFormDetails({ motorId });

    setDetailsLoading(false);

    if (!response?.success || !response?.data) {
      const fallback = response?.statusCode === 404 ? S.DETAILS_NOT_FOUND : S.DETAILS_FETCH_ERROR;
      showAlert(response?.message || fallback, "error", { autoCloseMs: 3500 });
      setSelected(null);
      return;
    }

    setDetailView(mapDetailsPayload(response.data));
  };

  const handleCloseDetail = () => {
    if (detailsLoading || actionLoading) return;
    setSelected(null);
    setDetailView(null);
  };

  // Trigger Confirmation Dialogs
  const requestApprove = (item?: OtherBemApproverListRow | null) => {
    const targetItem = item || selected;
    if (!targetItem) return;
    setRemarks("");
    setActionDialog({ open: true, type: "APPROVE", item: targetItem });
  };

  const requestReject = (item?: OtherBemApproverListRow | null) => {
    const targetItem = item || selected;
    if (!targetItem) return;
    setRemarks("");
    setActionDialog({ open: true, type: "REJECTED", item: targetItem });
  };

  const closeActionDialog = () => {
    if (actionLoading) return;
    setActionDialog({ open: false, type: null, item: null });
    setRemarks("");
  };

  // Perform API Action (Approve / Reject) with custom motorId payload
  const confirmAction = async () => {
    const { type, item } = actionDialog;
    if (!type || !item) return;

    const motorId = String(item.motorId ?? item.id ?? "").trim();
    if (!motorId) {
      showAlert("Motor ID is missing", "error", { autoCloseMs: 3000 });
      return;
    }

    setActionLoading(true);

    const payload = {
      motorId,
      remarks: remarks || "",
      actionType: type === "APPROVE" ? "APPROVED" : "REJECTED",
    };

    const response = await otherBemController.approveForm(payload);
    setActionLoading(false);

    if (response?.success) {
      showAlert(
        `Other BEM ${type === "APPROVE" ? "Approved" : "Rejected"} successfully`,
        "success",
        { autoCloseMs: 3000 },
      );

      closeActionDialog();

      // Refresh form details so detail panel shows latest status, then refresh list.
      setDetailsLoading(true);
      const detailsResponse = await otherBemController.fetchFormDetails({ motorId });
      setDetailsLoading(false);

      if (detailsResponse?.success && detailsResponse?.data) {
        const refreshed = mapDetailsPayload(detailsResponse.data);
        setDetailView(refreshed);
        setSelected((current) =>
          current
            ? {
                ...current,
                status: refreshed?.status || current.status,
                bemStatus: refreshed?.status || current.bemStatus,
              }
            : current,
        );
      }

      await fetchList();
    } else {
      showAlert(response?.message || `Failed to ${type.toLowerCase()} motor`, "error", {
        autoCloseMs: 3500,
      });
    }
  };

  // Formatted exact props expected by ApproverActionDialogProps
  const dialogProps = useMemo(
    () => ({
      open: actionDialog.open,
      actionType: actionDialog.type === "REJECTED" ? ("REJECTED" as const) : ("APPROVED" as const),
      submitting: actionLoading,
      value: remarks,
      onValueChange: setRemarks,
      onCancel: closeActionDialog,
      onConfirm: confirmAction,
      batchId: String(actionDialog.item?.motorId ?? actionDialog.item?.id ?? ""),
      idLabel: "Motor ID",
    }),
    [actionDialog.open, actionDialog.type, actionDialog.item, actionLoading, remarks],
  );

  return {
    items,
    setItems,
    listLoading,
    totalRecords,
    totalPages,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    statusCounts,
    fetchList,
    selected,
    detailsLoading,
    detailView,
    actionLoading,
    actionDialog,
    dialogProps,
    requestApprove,
    requestReject,
    closeActionDialog,
    confirmAction,
    handleViewDetails,
    handleCloseDetail,
  };
};

export default useOtherBemApproverHook;
