import React from "react";
import { Box, Button } from "@mui/material";
import { icons } from "@app/theme/icons";
import getProjectManagementTheme from "@app/theme/custom_themes/admin/ProjectManagement/projectManagement_theme";
import { STRINGS } from "@app/config/strings";
import { useThemeStore } from "@app/store/themeStore";
import ConfirmAlertDialog from "@ui/components/common/ConfirmAlertDialog";
import DateRangeRow from "@ui/components/common/DateRangeRow";
import RefreshIconButton from "@ui/components/common/RefreshIconButton";
import AdminManagementStatsGrid from "@ui/components/custom/admin/AdminManagementStatsGrid";
import AdminManagementPageHeader from "@ui/components/custom/admin/AdminManagementPageHeader";
import AdminListShell from "@ui/components/custom/admin/AdminListShell";
import AdminFilterPanel from "@ui/components/custom/admin/AdminFilterPanel";
import useProjectManagementHook from "@hooks/admin/ProjectManagement/useProjectManagementHook";
import { getProjectName } from "@utils/projectManagementUtils";
import ProjectManagementList from "./ProjectManagementList";
import CreateProjectManagementForm from "./CreateProjectManagementForm";
import FilterToggleButton from "@/ui/components/common/FilterToggleButton";
import DashboardDateFilter, {
  getDateFilterDisplayLabel,
} from "@/ui/components/custom/dashboard/DashboardDateFilter";
import getDashboardTheme from "@/app/theme/custom_themes/admin/Dashboard/dashboard_theme";

const S = STRINGS.PROJECT_MANAGEMENT;
const AC = STRINGS.ADMIN_COMMON;

const STAT_ICONS: Record<string, React.ReactNode> = {
  total: <icons.projectMgmt.projectIcon sx={{ fontSize: 22 }} />,
  today: <icons.projectMgmt.activeStatus sx={{ fontSize: 22 }} />,
  month: <icons.projectMgmt.activeStatus sx={{ fontSize: 22 }} />,
  active: <icons.projectMgmt.activeStatus sx={{ fontSize: 22 }} />,
  idle: <icons.projectMgmt.idleStatus sx={{ fontSize: 22 }} />,
};

const STAT_VALUE_KEYS: Record<
  string,
  | "totalProjects"
  | "projectsCreatedToday"
  | "projectsCreatedThisMonth"
  | "activeProjects"
  | "idleProjects"
> = {
  total: "totalProjects",
  today: "projectsCreatedToday",
  month: "projectsCreatedThisMonth",
  active: "activeProjects",
  idle: "idleProjects",
};

const ProjectManagementPage = () => {
  const mode = useThemeStore((s) => s.mode);
  const t = getProjectManagementTheme(mode);
  const { list, stats, form, delete: deleteSection, refresh } = useProjectManagementHook();
  const th = getDashboardTheme(mode);

  const statRows = S.STATS.map((s) => ({
    ...s,
    value: stats.loading ? S.PAGE.LOADING_PLACEHOLDER : stats.stats[STAT_VALUE_KEYS[s.variant]],
    icon: STAT_ICONS[s.variant],
  }));

  const deleteTarget = deleteSection.deleteTarget;
  const { draftFilters } = list;
  const total = list.paginationData.totalRecords;
  const shown = list.projects.length;

  return (
    <Box sx={t.page}>
      <AdminManagementPageHeader
        title={S.PAGE.TITLE}
        subtitle={S.PAGE.SUBTITLE}
        primaryAction={
          <Button
            variant="contained"
            startIcon={<icons.projectMgmt.add />}
            onClick={form.openCreate}
            disabled={list.loading}
            sx={t.pageHeader.newProjectButton}
          >
            {S.PAGE.NEW_PROJECT_BUTTON}
          </Button>
        }
        theme={t}
      />
      <Box sx={{ mb: 2 }}>
        <FilterToggleButton
          label="Date Filter"
          count={stats.filterType !== S.DATE_FILTER.VALUES.MONTH ? 1 : 0}
          isOpen={stats.dateFilterOpen}
          onClick={stats.toggleDateFilter}
          sx={th.table.filterBtn(
            stats.dateFilterOpen || stats.filterType !== S.DATE_FILTER.VALUES.MONTH,
          )}
          iconSx={th.table.filterBtnIcon}
          textSx={th.table.filterBtnText}
          badgeSx={th.table.filterBadgePill}
          chevronSx={th.table.filterBtnChevron}
          selectedValue={getDateFilterDisplayLabel(stats.filterType, S.DATE_FILTER)}
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
            loading={stats.loading}
            strings={S.DATE_FILTER}
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
        hasItems={list.projects.length > 0}
        emptyTitle={S.TABLE.EMPTY}
        toolbarEnd={
          <RefreshIconButton
            onClick={refresh}
            disabled={list.loading}
            tooltip={AC.REFRESH_TOOLTIP}
            icon={<icons.projectMgmt.refresh />}
          />
        }
        filterExtension={
          <AdminFilterPanel
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
            <DateRangeRow
              from={draftFilters.fromDate}
              to={draftFilters.toDate}
              onFromChange={(value) => list.setDraftFilter("fromDate", value)}
              onToChange={(value) => list.setDraftFilter("toDate", value)}
              fromLabel={S.TOOLBAR.FILTER_DATE_FROM_LABEL}
              toLabel={S.TOOLBAR.FILTER_DATE_TO_LABEL}
              datePickerSx={t.filterPanel.field}
            />
          </AdminFilterPanel>
        }
        theme={t}
      >
        <ProjectManagementList
          paginated={list.projects}
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

      <CreateProjectManagementForm
        open={form.modalOpen}
        onClose={() => form.setModalOpen(false)}
        onSave={form.handleSave}
        editTarget={form.editTarget}
        form={form.form}
        onFormChange={form.handleFormChange}
        saving={form.saving}
        t={t}
      />

      <ConfirmAlertDialog
        open={deleteSection.deleteOpen}
        severity="error"
        title={S.DELETE_DIALOG.TITLE}
        message={
          deleteTarget
            ? S.DELETE_DIALOG.BODY(getProjectName(deleteTarget))
            : S.DELETE_DIALOG.FALLBACK_MESSAGE
        }
        cancelLabel={S.DELETE_DIALOG.CANCEL}
        confirmLabel={deleteSection.deleting ? S.DELETE_DIALOG.DELETING : S.DELETE_DIALOG.CONFIRM}
        onCancel={() => deleteSection.setDeleteOpen(false)}
        onConfirm={deleteSection.handleDelete}
        confirmDisabled={deleteSection.deleting}
      />
    </Box>
  );
};

export default ProjectManagementPage;
