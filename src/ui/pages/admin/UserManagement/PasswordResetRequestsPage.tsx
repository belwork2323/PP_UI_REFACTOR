import { useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useNavigate } from "react-router-dom";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import { useThemeStore } from "@app/store/themeStore";
import getUserManagementTheme from "@app/theme/custom_themes/admin/UserManagement/userManagement_theme";
import AdminManagementPageHeader from "@ui/components/custom/admin/AdminManagementPageHeader";
import AdminManagementDataTable from "@ui/components/custom/admin/AdminManagementDataTable";
import type { AdminManagementColumn } from "@ui/components/custom/admin/AdminManagementDataTable";
import FilterSelect from "@ui/components/common/FilterSelect";
import RefreshIconButton from "@ui/components/common/RefreshIconButton";
import TemporaryPasswordReveal from "@ui/components/common/TemporaryPasswordReveal";
import AdminListShell from "@ui/components/custom/admin/AdminListShell";
import AdminListFilterPanel from "@ui/components/custom/admin/AdminListFilterPanel";
import { usePasswordResetRequestsHook } from "@hooks/admin/UserManagement/usePasswordResetRequestsHook";

const S = STRINGS.USER_MANAGEMENT;
const PR = S.PASSWORD_REQUESTS;
const AC = STRINGS.ADMIN_COMMON;

const STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED"];

const statusColor = (status: string) => {
  const s = String(status || "").toUpperCase();
  if (s === "PENDING") return "warning";
  if (s === "APPROVED") return "success";
  if (s === "REJECTED") return "error";
  return "default";
};

const PasswordResetRequestsPage = () => {
  const navigate = useNavigate();
  const mode = useThemeStore((s) => s.mode);
  const t = getUserManagementTheme(mode);
  const {
    requests,
    loading,
    actionLoadingId,
    page,
    rowsPerPage,
    totalRecords,
    search,
    filterOpen,
    draftStatus,
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
    refresh,
    approve,
    reject,
  } = usePasswordResetRequestsHook();

  const columns = useMemo<AdminManagementColumn<any>[]>(
    () => [
      {
        id: "requestId",
        label: PR.COL_REQUEST_ID,
        render: (row) => (
          <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>{row.requestId}</Typography>
        ),
      },
      {
        id: "userId",
        label: PR.COL_USER_ID,
        render: (row) => (
          <Typography sx={{ fontFamily: "monospace", fontWeight: 600, color: "primary.main" }}>
            {row.userId}
          </Typography>
        ),
      },
      {
        id: "reason",
        label: PR.COL_REASON,
        render: (row) => (
          <Typography sx={{ fontSize: "0.85rem", maxWidth: 360 }}>{row.reason}</Typography>
        ),
      },
      {
        id: "status",
        label: PR.COL_STATUS,
        render: (row) => (
          <Chip
            size="small"
            label={row.status}
            color={statusColor(row.status) as any}
            sx={{ fontWeight: 700, fontSize: "0.72rem" }}
          />
        ),
      },
      {
        id: "temporaryPassword",
        label: PR.COL_TEMP_PASSWORD,
        render: (row) => {
          const isApproved = String(row.status).toUpperCase() === "APPROVED";
          const temp = row.temporaryPassword;
          if (!isApproved || !temp) {
            return <Typography sx={{ color: "text.disabled" }}>—</Typography>;
          }
          return <TemporaryPasswordReveal password={temp} fontSize="0.8rem" />;
        },
      },
      {
        id: "requestedAt",
        label: PR.COL_REQUESTED_AT,
        render: (row) => (
          <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
            {row.requestedAt || "—"}
          </Typography>
        ),
      },
      {
        id: "actions",
        label: PR.COL_ACTIONS,
        isActions: true,
        render: (row) => {
          const isPending = String(row.status).toUpperCase() === "PENDING";
          if (!isPending) return <Typography sx={{ color: "text.disabled" }}>—</Typography>;
          const busy = actionLoadingId === row.requestId;
          return (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="contained"
                color="success"
                disabled={busy}
                onClick={() => approve(row)}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.72rem" }}
              >
                {PR.APPROVE}
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={busy}
                onClick={() => reject(row)}
                sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.72rem" }}
              >
                {PR.REJECT}
              </Button>
            </Stack>
          );
        },
      },
    ],
    [actionLoadingId, approve, reject],
  );

  return (
    <Box sx={t.page}>
      <AdminManagementPageHeader
        title={PR.TITLE}
        subtitle={PR.SUBTITLE}
        headerActions={
          <Button
            variant="text"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate("/admin/users")}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {PR.BACK}
          </Button>
        }
        theme={t}
      />

      <AdminListShell
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(0);
        }}
        searchPlaceholder="Search by user ID…"
        filterOpen={filterOpen}
        onFilterToggle={toggleFilterOpen}
        activeFilterCount={activeFilterCount}
        filtersToggleLabel={
          activeFilterCount > 0
            ? S.TOOLBAR.FILTERS_BUTTON_WITH_COUNT(activeFilterCount)
            : S.TOOLBAR.FILTERS_BUTTON
        }
        resultText={AC.SHOWING_RECORDS(requests.length, totalRecords)}
        loading={loading}
        hasItems={requests.length > 0}
        emptyTitle={PR.EMPTY}
        toolbarEnd={
          <RefreshIconButton
            onClick={refresh}
            disabled={loading}
            tooltip={AC.REFRESH_TOOLTIP}
            icon={<icons.userMgmt.refresh />}
          />
        }
        filterExtension={
          <AdminListFilterPanel
            title={AC.FILTERS_TITLE}
            activeFilterCount={activeFilterCount}
            onClear={clearFilters}
            clearLabel={S.TOOLBAR.CLEAR_ALL}
            onClose={() => setFilterOpen(false)}
            onApply={applyFilters}
            closeLabel={AC.FILTERS_CLOSE}
            applyLabel={AC.FILTERS_APPLY}
            theme={t}
          >
            <FilterSelect
              label={PR.COL_STATUS}
              value={draftStatus === "ALL" ? "" : draftStatus}
              onChange={(e) => setDraftStatus(String(e.target.value) || "ALL")}
              options={STATUS_OPTIONS}
              filterPanel
              sx={{ ...t.filterPanel.field, ...t.filterPanel.fieldItem }}
            />
          </AdminListFilterPanel>
        }
        theme={t}
      >
        <AdminManagementDataTable
          columns={columns}
          rows={requests}
          rowKey={(row) => row.requestId}
          loading={loading}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={totalRecords}
          onPageChange={(_e, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          emptyState={{
            icon: <icons.userMgmt.lockIcon sx={t.table.emptyIcon} />,
            message: PR.EMPTY,
          }}
          theme={t}
        />
      </AdminListShell>

      <Dialog
        open={tempPasswordDialog.open}
        onClose={() => setTempPasswordDialog({ open: false, userId: "", password: "" })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{PR.TEMP_PASSWORD_TITLE}</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1.5 }}>
            Share this temporary password with{" "}
            <Box component="span" sx={{ fontWeight: 700 }}>
              {tempPasswordDialog.userId}
            </Box>
            . They must change it on next login.
          </Typography>
          <TemporaryPasswordReveal
            password={tempPasswordDialog.password}
            label={S.TABLE.TEMP_PASSWORD_LABEL}
            fontSize="0.95rem"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setTempPasswordDialog({ open: false, userId: "", password: "" })}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {PR.TEMP_PASSWORD_CLOSE}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PasswordResetRequestsPage;
