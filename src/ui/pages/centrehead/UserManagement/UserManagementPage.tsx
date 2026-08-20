import React from "react";
import { Box, Button, Stack } from "@mui/material";
import { icons } from "@app/theme/icons";
import getUserManagementTheme from "@app/theme/custom_themes/admin/UserManagement/userManagement_theme";
import { STRINGS } from "@app/config/strings";
import { useThemeStore } from "@app/store/themeStore";
import FilterSelect from "@ui/components/common/FilterSelect";
import RefreshIconButton from "@ui/components/common/RefreshIconButton";
import AdminManagementStatsGrid from "@ui/components/custom/admin/AdminManagementStatsGrid";
import AdminManagementPageHeader from "@ui/components/custom/admin/AdminManagementPageHeader";
import AdminListShell from "@ui/components/custom/admin/AdminListShell";
import AdminListFilterPanel from "@ui/components/custom/admin/AdminListFilterPanel";
import useUserManagementHook from "@hooks/centrehead/UserManagement/useUserManagementHook";
import UserManagementList from "./UserManagementList";
import FilterToggleButton from "@/ui/components/common/FilterToggleButton";
import DashboardDateFilter, {
  getDateFilterDisplayLabel,
} from "@/ui/components/custom/dashboard/DashboardDateFilter";
import getDashboardTheme from "@/app/theme/custom_themes/admin/Dashboard/dashboard_theme";

const S = STRINGS.USER_MANAGEMENT;
const AC = STRINGS.ADMIN_COMMON;

const STAT_ICONS: Record<string, React.ReactNode> = {
  total: <icons.userMgmt.personOutline sx={{ fontSize: 22 }} />,
  active: <icons.userMgmt.activeStatus sx={{ fontSize: 22 }} />,
  inactive: <icons.userMgmt.inactiveStatus sx={{ fontSize: 22 }} />,
  reset: <icons.userMgmt.lockIcon sx={{ fontSize: 22 }} />,
};

const CHUserManagementPage = () => {
  const mode = useThemeStore((s) => s.mode);
  const t = getUserManagementTheme(mode);
  const { list, stats, lookups, form, delete: deleteSection, refresh } = useUserManagementHook();
  const th = getDashboardTheme(mode);
  const S1 = STRINGS.DASHBOARD_PAGE;
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
  const { draftFilters } = list;
  const total = list.paginationData.totalRecords;
  const shown = list.users.length;

  return (
    <Box sx={t.page}>
      <AdminManagementPageHeader
        title={S.PAGE.TITLE}
        subtitle={S.PAGE.SUBTITLE}
        // primaryAction={
        //   <Button
        //     variant="contained"
        //     startIcon={<icons.userMgmt.add />}
        //     onClick={form.openCreate}
        //     disabled={list.loading}
        //     sx={t.pageHeader.newUserButton}
        //   >
        //     {S.PAGE.NEW_USER_BUTTON}
        //   </Button>
        // }
        theme={t}
      />
      <Box sx={{ mb: 2 }}>
        <FilterToggleButton
          label="Date Filter"
          count={stats.filterType !== S1.DATE_FILTER.VALUES.ONE_YEAR ? 1 : 0}
          isOpen={stats.dateFilterOpen}
          onClick={stats.toggleDateFilter}
          sx={th.table.filterBtn(
            stats.dateFilterOpen || stats.filterType !== S1.DATE_FILTER.VALUES.ONE_YEAR,
          )}
          iconSx={th.table.filterBtnIcon}
          textSx={th.table.filterBtnText}
          badgeSx={th.table.filterBadgePill}
          chevronSx={th.table.filterBtnChevron}
          selectedValue={getDateFilterDisplayLabel(stats.filterType, S1.DATE_FILTER)}
        />
        {stats.dateFilterOpen && (
          <DashboardDateFilter
            filterType={stats.filterType}
            onFilterChange={stats.handleFilterTypeChange}
            customStartDate={stats.customStartDate}
            customEndDate={stats.customEndDate}
            onStartChange={stats.setCustomStartDate}
            onEndChange={stats.setCustomEndDate}
            onApplyCustom={stats.applyCustomDateFilter}
            onClearFilter={stats.clearDateFilter}
            loading={stats.loading || list.loading}
            strings={S1.DATE_FILTER}
            containerSx={th.dashboard.dateRangeBar}
            selectSx={{ minWidth: 150, ...th.filterInputSx }}
            menuProps={th.filterMenuProps}
            menuItemSx={th.filterMenuItemSx}
            textFieldSx={th.filterInputSx}
          />
        )}
      </Box>
      <AdminManagementStatsGrid stats={statRows} theme={t} />

      <AdminListShell
        search={list.search}
        onSearchChange={(value) => {
          list.setSearch(value);
          list.setPage(0);
        }}
        searchPlaceholder={S.TOOLBAR.SEARCH_PLACEHOLDER}
        filterOpen={list.filterOpen}
        onFilterToggle={list.toggleFilterOpen}
        activeFilterCount={list.activeFilterCount}
        filtersToggleLabel={
          list.activeFilterCount > 0
            ? S.TOOLBAR.FILTERS_BUTTON_WITH_COUNT(list.activeFilterCount)
            : S.TOOLBAR.FILTERS_BUTTON
        }
        resultText={AC.SHOWING_RECORDS(shown, total)}
        loading={list.loading}
        hasItems={list.users.length > 0}
        emptyTitle={S.TABLE.EMPTY}
        toolbarEnd={
          <RefreshIconButton
            onClick={refresh}
            disabled={list.loading}
            tooltip={AC.REFRESH_TOOLTIP}
            icon={<icons.userMgmt.refresh />}
          />
        }
        filterExtension={
          <AdminListFilterPanel
            title={AC.FILTERS_TITLE}
            activeFilterCount={list.activeFilterCount}
            onClear={list.clearFilters}
            clearLabel={S.TOOLBAR.CLEAR_ALL}
            onClose={() => list.setFilterOpen(false)}
            onApply={list.applyFilters}
            closeLabel={AC.FILTERS_CLOSE}
            applyLabel={AC.FILTERS_APPLY}
            theme={t}
          >
            <FilterSelect
              label={S.TOOLBAR.FILTER_ROLE_LABEL}
              value={draftFilters.role}
              onChange={(e) => list.setDraftFilter("role", e.target.value)}
              options={lookups.roleNames}
              filterPanel
              sx={{ ...t.filterPanel.field, ...t.filterPanel.fieldItem }}
            />
            <FilterSelect
              label={S.TOOLBAR.FILTER_DEPT_LABEL}
              value={draftFilters.dept}
              onChange={(e) => list.setDraftFilter("dept", e.target.value)}
              options={lookups.deptNames}
              filterPanel
              sx={{ ...t.filterPanel.field, ...t.filterPanel.fieldItem }}
            />
            <FilterSelect
              label={S.TOOLBAR.FILTER_SUB_DEPT_LABEL}
              value={draftFilters.subDept}
              onChange={(e) => list.setDraftFilter("subDept", e.target.value)}
              optionItems={lookups.subDeptOptions}
              filterPanel
              sx={{ ...t.filterPanel.field, ...t.filterPanel.fieldItem }}
            />
            <FilterSelect
              label={S.TOOLBAR.FILTER_STATUS_LABEL}
              value={draftFilters.status}
              onChange={(e) => list.setDraftFilter("status", e.target.value)}
              options={S.STATUS}
              filterPanel
              sx={{ ...t.filterPanel.field, ...t.filterPanel.fieldItem }}
            />
          </AdminListFilterPanel>
        }
        theme={t}
      >
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
          onRowsPerPageChange={(e) => {
            list.setRowsPerPage(+e.target.value);
            list.setPage(0);
          }}
        />
      </AdminListShell>
      {/*
      <CreateUserManagementForm
        open={form.modalOpen}
        onClose={() => form.setModalOpen(false)}
        onSave={form.handleSave}
        editTarget={form.editTarget}
        form={form.form}
        onFormChange={form.handleFormChange}
        onSubDeptsChange={form.handleSubDeptsChange}
        availableRoles={lookups.roles}
        availableDepartments={lookups.departments}
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
        cancelLabel={S.DELETE_DIALOG.CANCEL}
        confirmLabel={deleteSection.deleting ? S.DELETE_DIALOG.DELETING : S.DELETE_DIALOG.CONFIRM}
        onCancel={() => deleteSection.setDeleteOpen(false)}
        onConfirm={deleteSection.handleDelete}
        confirmDisabled={deleteSection.deleting}
      /> */}
    </Box>
  );
};

export default CHUserManagementPage;
