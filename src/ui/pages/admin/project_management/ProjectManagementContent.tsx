import React from "react";
import { Box, Typography, Button, Stack, Fade } from "@mui/material";
import Input from "../../../components/common/Input";
import { icons } from "../../../../app/theme/icons";
import getProjectManagementTheme from "../../../../app/theme/custom_themes/admin/projectManagement_theme";
import { STRINGS } from "../../../../app/config/strings";

import FilterSelect from "../../../components/common/FilterSelect";
import ProjectListTable from "./components/ProjectListTable";
import ProjectForm from "./components/ProjectForm";
import DeleteProjectDialog from "./components/DeleteProjectDialog";

import { useProjectList } from "../../../../hooks/admin/project_management/useProjectListHook";
import { useProjectStats } from "../../../../hooks/admin/project_management/useProjectStatsHook";
import { useProjectActions } from "../../../../hooks/admin/project_management/useProjectActionsHook";

const S = {
  PAGE: {
    TITLE: "Project Management",
    SUBTITLE: "Manage all projects in the system",
    NEW_PROJECT_BUTTON: "New Project",
  },
  TOOLBAR: {
    SEARCH_PLACEHOLDER: "Search projects...",
    FILTERS_BUTTON: "Filters",
    FILTERS_BUTTON_WITH_COUNT: (count: number) => `Filters (${count})`,
    FILTER_DATE_FROM_LABEL: "From Date",
    FILTER_DATE_TO_LABEL: "To Date",
    CLEAR_ALL: "Clear All",
  },
  STATS: [
    {
      label: "Total Projects",
      subLabel: "All projects",
      variant: "total",
    },
    {
      label: "Created Today",
      subLabel: "Today",
      variant: "today",
    },
    {
      label: "This Month",
      subLabel: "Current month",
      variant: "month",
    },
    {
      label: "Active",
      subLabel: "Active projects",
      variant: "active",
    },
    {
      label: "Idle",
      subLabel: "Idle projects",
      variant: "idle",
    },
  ],
};

const STAT_ICONS: Record<string, React.ReactNode> = {
  total: <icons.userMgmt.personOutline sx={{ fontSize: 22 }} />,
  today: <icons.userMgmt.activeStatus sx={{ fontSize: 22 }} />,
  month: <icons.userMgmt.activeStatus sx={{ fontSize: 22 }} />,
  active: <icons.userMgmt.activeStatus sx={{ fontSize: 22 }} />,
  idle: <icons.userMgmt.inactiveStatus sx={{ fontSize: 22 }} />,
};

const ProjectManagementPage = ({ mode = "light" }: any) => {
  const t = getProjectManagementTheme(mode);

  const listParams = useProjectList();
  const statsWrap = useProjectStats();
  const actions = useProjectActions(() => {
    listParams.loadProjectsList();
    statsWrap.loadStats();
  });

  const stats = S.STATS.map((s) => ({
    ...s,
    value: statsWrap.loading ? "..." : (statsWrap.stats as any)[
      s.variant === "total"   ? "totalProjects"           :
      s.variant === "today"   ? "projectsCreatedToday"    :
      s.variant === "month"   ? "projectsCreatedThisMonth":
      s.variant === "active"  ? "activeProjects"          :
                                "idleProjects"
    ],
    icon: STAT_ICONS[s.variant],
  }));

  return (
    <Box sx={t.page}>
      {/* Page Header */}
      <Box sx={t.pageHeader.wrapper}>
        <Box>
          <Typography sx={t.pageHeader.title}>{S.PAGE.TITLE}</Typography>
          <Typography sx={t.pageHeader.subtitle}>{S.PAGE.SUBTITLE}</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<icons.userMgmt.add />}
          onClick={actions.openCreate}
          disabled={listParams.loading}
          sx={t.pageHeader.newProjectButton}
        >
          {S.PAGE.NEW_PROJECT_BUTTON}
        </Button>
      </Box>

      {/* Stats Banner */}
      <Box sx={{ ...t.statsGrid.outerWrap, mb: 3 }}>
        <Box sx={t.statsGrid.bgDecor} />
        <Stack direction="row" spacing={2} sx={{ width: "100%", flexWrap: "wrap" }}>
          {stats.map((stat) => {
            const sc: any = t.statsGrid.colors[stat.variant as keyof typeof t.statsGrid.colors];
            return (
              <Box key={stat.label} sx={{ ...t.statsGrid.card, flex: "1 1 auto", minWidth: 150 }}>
                <Box sx={{ ...t.statsGrid.accentBar, background: sc.accent }} />
                <Box sx={{ ...t.statsGrid.iconWrap, bgcolor: sc.iconBg, boxShadow: `0 0 0 1px ${sc.iconBorder}` }}>
                  <Box sx={{ color: sc.iconColor }}>{stat.icon}</Box>
                </Box>
                <Box sx={t.statsGrid.textWrap}>
                  <Typography sx={{ ...t.statsGrid.value, color: sc.value }}>
                    {stat.value}
                  </Typography>
                  <Typography sx={t.statsGrid.label}>{stat.label}</Typography>
                  <Typography sx={t.statsGrid.subLabel}>{stat.subLabel}</Typography>
                </Box>
                <Box sx={{ ...t.statsGrid.cornerDot, background: sc.accent }} />
              </Box>
            );
          })}
        </Stack>
      </Box>

      {/* Toolbar */}
      <Box sx={t.toolbar.wrapper}>
        <Input
          size="small"
          placeholder={S.TOOLBAR.SEARCH_PLACEHOLDER}
          value={listParams.search}
          onChange={(e: any) => { listParams.setSearch(e.target.value); listParams.setPage(0); }}
          sx={t.toolbar.searchField}
          icon={<icons.userMgmt.search sx={t.toolbar.searchIcon} />}
        />

        <Button
          variant={listParams.filterOpen ? "contained" : "outlined"}
          startIcon={<icons.userMgmt.filter />}
          onClick={() => listParams.setFilterOpen(prev => !prev)}
          sx={listParams.filterOpen ? t.toolbar.filterButtonActive : t.toolbar.filterButtonInactive}
        >
          {listParams.activeFilters > 0
            ? S.TOOLBAR.FILTERS_BUTTON_WITH_COUNT(listParams.activeFilters)
            : S.TOOLBAR.FILTERS_BUTTON}
        </Button>

        {listParams.filterOpen && (
          <Fade in>
            <Stack direction="row" sx={t.toolbar.filterRow}>
              <Input
                label={S.TOOLBAR.FILTER_DATE_FROM_LABEL}
                type="date"
                value={listParams.fromDate}
                onChange={(e: any) => { listParams.setFromDate(e.target.value); listParams.setPage(0); }}
                sx={t.toolbar.filterSelect}
                InputLabelProps={{ shrink: true }}
              />
              <Input
                label={S.TOOLBAR.FILTER_DATE_TO_LABEL}
                type="date"
                value={listParams.toDate}
                onChange={(e: any) => { listParams.setToDate(e.target.value); listParams.setPage(0); }}
                sx={t.toolbar.filterSelect}
                InputLabelProps={{ shrink: true }}
              />
              {listParams.activeFilters > 0 && (
                <Button
                  size="small"
                  onClick={listParams.handleClearFilters}
                  sx={t.toolbar.clearButton}
                >
                  {S.TOOLBAR.CLEAR_ALL}
                </Button>
              )}
            </Stack>
          </Fade>
        )}
      </Box>

      {/* Table */}
      <ProjectListTable
        data={listParams.projects}
        loading={listParams.loading}
        page={listParams.page}
        totalCount={listParams.paginationData.totalRecords}
        rowsPerPage={listParams.limit}
        t={t}
        onEdit={actions.openEdit}
        onDelete={actions.openDelete}
        onPageChange={(_: any, p: number) => listParams.setPage(p)}
        onRowsPerPageChange={(e: any) => { listParams.setLimit(+e.target.value); listParams.setPage(0); }}
      />

      {/* Modals */}
      <ProjectForm
        open={actions.modalOpen}
        onClose={() => actions.setModalOpen(false)}
        onSave={actions.handleSave}
        editTarget={actions.editTarget}
        form={actions.form}
        onFormChange={actions.handleFormChange}
        saving={actions.saving}
        t={t}
      />

      <DeleteProjectDialog
        open={actions.deleteOpen}
        onClose={() => actions.setDeleteOpen(false)}
        onConfirm={actions.handleDelete}
        deleteTarget={actions.deleteTarget}
        deleting={actions.deleting}
        t={t}
      />
    </Box>
  );
};

export default ProjectManagementPage;
