import { useCallback, useEffect, useMemo, useState } from "react";
import { userManagementController } from "@controllers/admin/UserManagement/userManagementController";
import { useAlertStore } from "@app/store/alertStore";
import { STRINGS } from "@app/config/strings";

const S = STRINGS.USER_MANAGEMENT.PASSWORD_REQUESTS;

export type PasswordResetRequestRow = {
  requestId: string;
  userId: string;
  reason: string;
  status: string;
  requestedAt: string | null;
  reviewedAt?: string | null;
  remarks?: string | null;
  temporaryPassword?: string | null;
};

export function usePasswordResetRequestsHook() {
  const { showAlert } = useAlertStore();
  const [requests, setRequests] = useState<PasswordResetRequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [draftStatus, setDraftStatus] = useState("ALL");
  const [tempPasswordDialog, setTempPasswordDialog] = useState<{
    open: boolean;
    userId: string;
    password: string;
  }>({ open: false, userId: "", password: "" });

  const activeFilterCount = useMemo(
    () => (statusFilter !== "ALL" ? 1 : 0),
    [statusFilter],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const resp = await userManagementController.getPasswordResetRequests({
      search: search.trim(),
      status: statusFilter,
      page: page + 1,
      pageSize: rowsPerPage,
    });

    if (resp.success) {
      const data = resp.data as any;
      setRequests(Array.isArray(data?.requests) ? data.requests : []);
      setTotalRecords(Number(data?.pagination?.totalRecords ?? 0));
    } else {
      showAlert(resp.message || S.LOAD_FAILED, "error");
      setRequests([]);
      setTotalRecords(0);
    }
    setLoading(false);
  }, [search, statusFilter, page, rowsPerPage, showAlert]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFilterOpen = useCallback(() => {
    setFilterOpen((open) => {
      if (!open) setDraftStatus(statusFilter);
      return !open;
    });
  }, [statusFilter]);

  const applyFilters = useCallback(() => {
    setStatusFilter(draftStatus);
    setPage(0);
    setFilterOpen(false);
  }, [draftStatus]);

  const clearFilters = useCallback(() => {
    setDraftStatus("ALL");
    setStatusFilter("ALL");
    setPage(0);
  }, []);

  const handleChangeStatus = useCallback(
    async (requestId: string, action: "APPROVE" | "REJECT", userId: string) => {
      setActionLoadingId(requestId);
      const resp = await userManagementController.changePasswordResetStatus({
        requestId,
        action,
      });

      if (resp.success) {
        const data = resp.data as any;
        if (action === "APPROVE") {
          const temp = data?.temporaryPassword ?? "";
          showAlert(S.APPROVE_SUCCESS, "success");
          if (temp) {
            setTempPasswordDialog({ open: true, userId, password: temp });
          }
        } else {
          showAlert(S.REJECT_SUCCESS, "success");
        }
        await load();
      } else {
        showAlert(resp.message || S.ACTION_FAILED, "error");
      }
      setActionLoadingId(null);
    },
    [load, showAlert],
  );

  return {
    requests,
    loading,
    actionLoadingId,
    page,
    rowsPerPage,
    totalRecords,
    search,
    filterOpen,
    draftStatus,
    statusFilter,
    activeFilterCount,
    tempPasswordDialog,
    setSearch,
    setDraftStatus,
    setPage,
    setRowsPerPage,
    setTempPasswordDialog,
    setFilterOpen,
    toggleFilterOpen,
    applyFilters,
    clearFilters,
    refresh: load,
    approve: (row: PasswordResetRequestRow) =>
      handleChangeStatus(row.requestId, "APPROVE", row.userId),
    reject: (row: PasswordResetRequestRow) =>
      handleChangeStatus(row.requestId, "REJECT", row.userId),
  };
}
