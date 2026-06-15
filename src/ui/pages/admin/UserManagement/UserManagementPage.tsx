import React from "react";
import { Box, Button, Stack } from "@mui/material";
import Input from "@ui/components/common/Input";
import { icons } from "@app/theme/icons";
import getUserManagementTheme from "@app/theme/custom_themes/admin/UserManagement/userManagement_theme";
import { STRINGS } from "@app/config/strings";
import FilterSelect from "@ui/components/common/FilterSelect";
import ConfirmAlertDialog from "@ui/components/common/ConfirmAlertDialog";
import AdminManagementStatsGrid from "@ui/components/custom/AdminManagementStatsGrid";
import AdminManagementPageHeader from "@ui/components/custom/AdminManagementPageHeader";
import AdminManagementToolbar from "@ui/components/custom/AdminManagementToolbar";
import useUserManagementHook from "@hooks/admin/UserManagement/useUserManagementHook";
import { getDisplayName, getUsername } from "@utils/userManagementUtils";
import UserManagementList from "./UserManagementList";
import CreateUserManagementForm from "./CreateUserManagementForm";

const S = STRINGS.USER_MANAGEMENT;

const STAT_ICONS: Record<string, React.ReactNode> = {
  total: <icons.userMgmt.personOutline sx={{ fontSize: 22 }} />,
  active: <icons.userMgmt.activeStatus sx={{ fontSize: 22 }} />,
  inactive: <icons.userMgmt.inactiveStatus sx={{ fontSize: 22 }} />,
  reset: <icons.userMgmt.lockIcon sx={{ fontSize: 22 }} />,
};

type UserManagementPageProps = {
  mode?: "light" | "dark";
};

const UserManagementPage = ({ mode = "light" }: UserManagementPageProps) => {
  const t = getUserManagementTheme(mode);
  const { list, stats, lookups, form, delete: deleteSection } = useUserManagementHook();

  const statRows = S.STATS.map((s) => ({
    ...s,
    value: stats.loading
      ? S.PAGE.LOADING_PLACEHOLDER
      : (stats.stats as Record<string, number>)[
          s.variant === "total"
            ? "totalUsers"
            : s.variant === "active"
              ? "activeUsers"
              : s.variant === "inactive"
                ? "inactiveUsers"
                : "pendingResetRequests"
        ],
    icon: STAT_ICONS[s.variant],
  }));

  const deleteTarget = deleteSection.deleteTarget;

  return (
    <Box sx={t.page}>
      <AdminManagementPageHeader
        title={S.PAGE.TITLE}
        subtitle={S.PAGE.SUBTITLE}
        primaryAction={
          <Button
            variant="contained"
            startIcon={<icons.userMgmt.add />}
            onClick={form.openCreate}
            disabled={list.loading}
            sx={t.pageHeader.newUserButton}
          >
            {S.PAGE.NEW_USER_BUTTON}
          </Button>
        }
        theme={t}
      />

      <AdminManagementStatsGrid stats={statRows} theme={t} />

      <AdminManagementToolbar
        search={list.search}
        onSearchChange={(value) => { list.setSearch(value); list.setPage(0); }}
        searchPlaceholder={S.TOOLBAR.SEARCH_PLACEHOLDER}
        searchIcon={<icons.userMgmt.search sx={t.toolbar.searchIcon} />}
        filterOpen={list.filterOpen}
        onFilterToggle={() => list.setFilterOpen((prev: boolean) => !prev)}
        filtersButtonLabel={
          list.activeFilters > 0
            ? S.TOOLBAR.FILTERS_BUTTON_WITH_COUNT(list.activeFilters)
            : S.TOOLBAR.FILTERS_BUTTON
        }
        filterContent={
          <>
            <FilterSelect
              label={S.TOOLBAR.FILTER_ROLE_LABEL}
              value={list.filterRole}
              onChange={(e) => { list.setFilterRole(e.target.value); list.setPage(0); }}
              options={lookups.roleNames}
              sx={t.toolbar.filterSelect}
            />
            <FilterSelect
              label={S.TOOLBAR.FILTER_DEPT_LABEL}
              value={list.filterDept}
              onChange={(e) => { list.setFilterDept(e.target.value); list.setPage(0); }}
              options={lookups.deptNames}
              sx={t.toolbar.filterSelect}
            />
            <FilterSelect
              label={S.TOOLBAR.FILTER_STATUS_LABEL}
              value={list.filterStatus}
              onChange={(e) => { list.setFilterStatus(e.target.value); list.setPage(0); }}
              options={S.STATUSES}
              sx={t.toolbar.filterSelect}
            />
            {list.activeFilters > 0 && (
              <Button size="small" onClick={list.handleClearFilters} sx={t.toolbar.clearButton}>
                {S.TOOLBAR.CLEAR_ALL}
              </Button>
            )}
          </>
        }
        theme={t}
      />

      <UserManagementList
        paginated={list.users}
        loading={list.loading}
        page={list.page}
        totalCount={list.paginationData.totalRecords}
        rowsPerPage={list.rowsPerPage}
        t={t}
        onEdit={form.openEdit}
        onDelete={deleteSection.openDelete}
        onPageChange={(_, p) => list.setPage(p)}
        onRowsPerPageChange={(e) => { list.setRowsPerPage(+e.target.value); list.setPage(0); }}
      />

      <CreateUserManagementForm
        open={form.modalOpen}
        onClose={() => form.setModalOpen(false)}
        onSave={form.handleSave}
        editTarget={form.editTarget}
        form={form.form}
        onFormChange={form.handleFormChange}
        onSubDeptsChange={form.handleSubDeptsChange}
        availableRoles={lookups.roles}
        availableSubDepts={lookups.allSubDepts}
        saving={form.saving}
        t={t}
      />

      <ConfirmAlertDialog
        open={deleteSection.deleteOpen}
        severity="error"
        title={S.DELETE_DIALOG.TITLE}
        message={
          deleteTarget
            ? S.DELETE_DIALOG.BODY(getDisplayName(deleteTarget), getUsername(deleteTarget))
            : S.DELETE_DIALOG.FALLBACK_MESSAGE
        }
        confirmLabel={deleteSection.deleting ? S.DELETE_DIALOG.DELETING : S.DELETE_DIALOG.CONFIRM}
        cancelLabel={S.DELETE_DIALOG.CANCEL}
        confirmDisabled={deleteSection.deleting}
        onConfirm={deleteSection.handleDelete}
        onCancel={() => !deleteSection.deleting && deleteSection.setDeleteOpen(false)}
      />
    </Box>
  );
};

export default UserManagementPage;
