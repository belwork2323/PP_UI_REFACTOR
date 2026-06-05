import React from "react";
import { Box, Typography, Button, Stack, Fade } from "@mui/material";
import Input from "../../../../components/common/Input";
import { icons } from "../../../../../app/theme/icons";
import getUserManagementTheme from "../../../../../app/theme/custom_themes/admin/userManagement_theme";
import { STRINGS } from "../../../../../app/config/strings";

import FilterSelect from "../../../../components/common/FilterSelect";
import UserListTable from "./components/UserListTable";
import UserFormModal from "./components/UserForm";
import DeleteUserDialog from "./components/DeleteUserDialog";

import { useUserList } from "../../../../../hooks/admin/user_management/useUserListHook";
import { useUserStats } from "../../../../../hooks/admin/user_management/useUserStatsHook";
import { useUserLookups } from "../../../../../hooks/admin/user_management/useUserLookupsHook";
import { useUserActions } from "../../../../../hooks/admin/user_management/useUserActionsHook";

const S = STRINGS.USER_MANAGEMENT;

/* ── Stat icon map (keyed by variant) ────────────────────────────────────── */
const STAT_ICONS: Record<string, React.ReactNode> = {
  total:    <icons.userMgmt.personOutline sx={{ fontSize: 22 }} />,
  active:   <icons.userMgmt.activeStatus  sx={{ fontSize: 22 }} />,
  inactive: <icons.userMgmt.inactiveStatus sx={{ fontSize: 22 }} />,
  reset:    <icons.userMgmt.lockIcon      sx={{ fontSize: 22 }} />,
};

const UserManagementPage = ({ mode = "light" }: any) => {
  const t = getUserManagementTheme(mode);

  const lookups    = useUserLookups();
  const listParams = useUserList();
  const statsWrap  = useUserStats();
  const actions    = useUserActions(lookups.roles, () => {
    listParams.loadUsersList();
    statsWrap.loadStats();
  });

  /* Build stat rows from centralised STRINGS config */
  const stats = S.STATS.map((s) => ({
    ...s,
    value: statsWrap.loading ? S.PAGE.LOADING_PLACEHOLDER : (statsWrap.stats as any)[
      s.variant === "total"    ? "totalUsers"           :
      s.variant === "active"   ? "activeUsers"          :
      s.variant === "inactive" ? "inactiveUsers"        :
                                 "pendingResetRequests"
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
          sx={t.pageHeader.newUserButton}
        >
          {S.PAGE.NEW_USER_BUTTON}
        </Button>
      </Box>

      {/* ── Rich Stats Banner ── */}
      <Box sx={t.statsGrid.outerWrap}>
        <Box sx={t.statsGrid.bgDecor} />
        <Box sx={t.statsGrid.innerGrid}>
          {stats.map((stat) => {
            const sc: any = t.statsGrid.colors[stat.variant as keyof typeof t.statsGrid.colors];
            return (
              <Box key={stat.label} sx={t.statsGrid.card}>
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
        </Box>
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
              <FilterSelect
                label={S.TOOLBAR.FILTER_ROLE_LABEL}
                value={listParams.filterRole}
                onChange={(e: any) => { listParams.setFilterRole(e.target.value); listParams.setPage(0); }}
                options={lookups.roleNames}
                sx={t.toolbar.filterSelect}
              />
              <FilterSelect
                label={S.TOOLBAR.FILTER_DEPT_LABEL}
                value={listParams.filterDept}
                onChange={(e: any) => { listParams.setFilterDept(e.target.value); listParams.setPage(0); }}
                options={lookups.deptNames}
                sx={t.toolbar.filterSelect}
              />
              <FilterSelect
                label={S.TOOLBAR.FILTER_STATUS_LABEL}
                value={listParams.filterStatus}
                onChange={(e: any) => { listParams.setFilterStatus(e.target.value); listParams.setPage(0); }}
                options={S.STATUSES}
                sx={t.toolbar.filterSelect}
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
      <UserListTable
        paginated={listParams.users}
        filtered={listParams.users}
        loading={listParams.loading}
        departments={lookups.departments}
        page={listParams.page}
        totalCount={listParams.paginationData.totalRecords}
        rowsPerPage={listParams.rowsPerPage}
        t={t}
        onEdit={actions.openEdit}
        onDelete={actions.openDelete}
        onPageChange={(_: any, p: number) => listParams.setPage(p)}
        onRowsPerPageChange={(e: any) => { listParams.setRowsPerPage(+e.target.value); listParams.setPage(0); }}
      />

      {/* Modals */}
      <UserFormModal
        open={actions.modalOpen}
        onClose={() => actions.setModalOpen(false)}
        onSave={actions.handleSave}
        editTarget={actions.editTarget}
        form={actions.form}
        onFormChange={actions.handleFormChange}
        onSubDeptsChange={actions.handleSubDeptsChange}
        availableRoles={lookups.roles}
        availableSubDepts={lookups.allSubDepts}
        saving={actions.saving}
        t={t}
      />

      <DeleteUserDialog
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

export default UserManagementPage;