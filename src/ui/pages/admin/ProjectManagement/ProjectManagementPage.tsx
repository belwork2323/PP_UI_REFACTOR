import React from "react";
import { Box, Button } from "@mui/material";
import Input from "@ui/components/common/Input";
import { icons } from "@app/theme/icons";
import getProjectManagementTheme from "@app/theme/custom_themes/admin/ProjectManagement/projectManagement_theme";
import { STRINGS } from "@app/config/strings";
import ConfirmAlertDialog from "@ui/components/common/ConfirmAlertDialog";
import AdminManagementStatsGrid from "@ui/components/custom/admin/AdminManagementStatsGrid";
import AdminManagementPageHeader from "@ui/components/custom/admin/AdminManagementPageHeader";
import AdminManagementToolbar from "@ui/components/custom/admin/AdminManagementToolbar";
import useProjectManagementHook from "@hooks/admin/ProjectManagement/useProjectManagementHook";
import { getProjectName } from "@utils/projectManagementUtils";
import ProjectManagementList from "./ProjectManagementList";
import CreateProjectManagementForm from "./CreateProjectManagementForm";

const S = STRINGS.PROJECT_MANAGEMENT;

const STAT_ICONS: Record<string, React.ReactNode> = {
  total: <icons.userMgmt.personOutline sx={{ fontSize: 22 }} />,
  today: <icons.userMgmt.activeStatus sx={{ fontSize: 22 }} />,
  month: <icons.userMgmt.activeStatus sx={{ fontSize: 22 }} />,
  active: <icons.userMgmt.activeStatus sx={{ fontSize: 22 }} />,
  idle: <icons.userMgmt.inactiveStatus sx={{ fontSize: 22 }} />,
};

const STAT_VALUE_KEYS: Record<string, "totalProjects" | "projectsCreatedToday" | "projectsCreatedThisMonth" | "activeProjects" | "idleProjects"> = {
  total: "totalProjects",
  today: "projectsCreatedToday",
  month: "projectsCreatedThisMonth",
  active: "activeProjects",
  idle: "idleProjects",
};

type ProjectManagementPageProps = {
  mode?: "light" | "dark";
};

const ProjectManagementPage = ({ mode = "light" }: ProjectManagementPageProps) => {
  const t = getProjectManagementTheme(mode);
  const { list, stats, form, delete: deleteSection } = useProjectManagementHook();

  const statRows = S.STATS.map((s) => ({
    ...s,
    value: stats.loading
      ? S.PAGE.LOADING_PLACEHOLDER
      : stats.stats[STAT_VALUE_KEYS[s.variant]],
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
            sx={t.pageHeader.newProjectButton}
          >
            {S.PAGE.NEW_PROJECT_BUTTON}
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
        onFilterToggle={() => list.setFilterOpen((prev) => !prev)}
        filtersButtonLabel={
          list.activeFilters > 0
            ? S.TOOLBAR.FILTERS_BUTTON_WITH_COUNT(list.activeFilters)
            : S.TOOLBAR.FILTERS_BUTTON
        }
        filterContent={
          <>
            <Input
              type="date"
              label={S.TOOLBAR.FILTER_DATE_FROM_LABEL}
              value={list.fromDate}
              onChange={(e) => { list.setFromDate(e.target.value); list.setPage(0); }}
              size="small"
              sx={t.toolbar.filterSelect}
              InputLabelProps={{ shrink: true }}
            />
            <Input
              type="date"
              label={S.TOOLBAR.FILTER_DATE_TO_LABEL}
              value={list.toDate}
              onChange={(e) => { list.setToDate(e.target.value); list.setPage(0); }}
              size="small"
              sx={t.toolbar.filterSelect}
              InputLabelProps={{ shrink: true }}
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
        onRowsPerPageChange={(e) => { list.setRowsPerPage(+e.target.value); list.setPage(0); }}
      />

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
