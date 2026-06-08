import React from "react";
import {
  Box, Typography, Button, Stack, Fade,
  FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip,
} from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import getBatchManagementTheme from "../../../../../app/theme/custom_themes/admin/batchManagement_theme";
import { STRINGS } from "../../../../../app/config/strings";

import Input        from "../../../../components/common/Input";
import FilterSelect from "../../../../components/common/FilterSelect";
import BatchListTable    from "./components/BatchListTable";
import BatchFormModal    from "./components/BatchFormModal";
import BatchImplementationModal from "./components/BatchImplementationModal";
import DeleteBatchDialog from "./components/DeleteBatchDialog";

import { useBatchList }    from "../../../../../hooks/admin/batch_management/useBatchListHook";
import { useBatchStats }   from "../../../../../hooks/admin/batch_management/useBatchStatHook";
import { useBatchLookups } from "../../../../../hooks/admin/batch_management/useBatchLookupsHook";
import { useBatchActions } from "../../../../../hooks/admin/batch_management/useBatchActionsHook";

const S = STRINGS.BATCH_MANAGEMENT;

/* ── Stat icon map keyed by variant (same pattern as UserManagementPage) ── */
const STAT_ICONS: Record<string, React.ReactNode> = {
  total:      <icons.batchMgmt.batchIcon   sx={{ fontSize: 22 }} />,
  inProgress: <icons.batchMgmt.inProgressStatus sx={{ fontSize: 22 }} />,
  completed:  <icons.batchMgmt.completedStatus  sx={{ fontSize: 22 }} />,
  pending:    <icons.batchMgmt.pendingStatus    sx={{ fontSize: 22 }} />,
  rejected:   <icons.batchMgmt.rejectedStatus   sx={{ fontSize: 22 }} />,
};

const BatchManagementPage = ({ mode = "light" }: any) => {
  const t = getBatchManagementTheme(mode);

  const listParams = useBatchList();
  const statsWrap  = useBatchStats("month");
  const lookups    = useBatchLookups();
  const actions    = useBatchActions(lookups.userOptions, () => {
    listParams.loadBatchList();
  });

  const loadedStats = Array.isArray(statsWrap.stats) ? statsWrap.stats : [];

  /* Merge static card copy with normalized API stats. */
  const stats = S.STATS.map((stat) => {
    const loadedStat = loadedStats.find((item: any) => item.variant === stat.variant);

    return {
      ...stat,
      value: statsWrap.loading ? S.PAGE.LOADING_PLACEHOLDER : loadedStat?.value ?? "0",
      subLabel: statsWrap.loading ? stat.subLabel : loadedStat?.subLabel ?? stat.subLabel,
      icon: STAT_ICONS[stat.variant],
    };
  });

  return (
    <Box sx={t.page}>
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <Box sx={t.pageHeader.wrapper}>
        <Box>
          <Typography sx={t.pageHeader.title}>{S.PAGE.TITLE}</Typography>
          <Typography sx={t.pageHeader.subtitle}>{S.PAGE.SUBTITLE}</Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Timeframe selector */}
          <FormControl size="small" sx={t.toolbar.filterSelect}>
            <InputLabel>{S.TOOLBAR.TIMEFRAME_LABEL}</InputLabel>
            <Select
              value={statsWrap.filterType}
              label={S.TOOLBAR.TIMEFRAME_LABEL}
              onChange={statsWrap.handleStatsFilterChange}
              MenuProps={t.menuPaper}
            >
              <MenuItem value="day">{S.TOOLBAR.TODAY}</MenuItem>
              <MenuItem value="week">{S.TOOLBAR.THIS_WEEK}</MenuItem>
              <MenuItem value="month">{S.TOOLBAR.THIS_MONTH}</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<icons.batchMgmt.add />}
            onClick={actions.openCreate}
            disabled={listParams.loading}
            sx={t.pageHeader.newBatchButton}
          >
            {S.PAGE.NEW_BATCH_BUTTON}
          </Button>
        </Stack>
      </Box>

      {/* ── Rich Stats Banner ─────────────────────────────────────────── */}
      <Box sx={t.statsGrid.outerWrap}>
        <Box sx={t.statsGrid.bgDecor} />
        <Box sx={t.statsGrid.innerGrid}>
          {stats.map(stat => {
            const sc: any = t.statsGrid.colors[stat.variant as keyof typeof t.statsGrid.colors];
            return (
              <Box key={stat.label} sx={t.statsGrid.card}>
                <Box sx={{ ...t.statsGrid.accentBar, background: sc.accent }} />
                <Box sx={{ ...t.statsGrid.iconWrap, bgcolor: sc.iconBg, boxShadow: `0 0 0 1px ${sc.iconBorder}` }}>
                  <Box sx={{ color: sc.iconColor }}>{stat.icon}</Box>
                </Box>
                <Box sx={t.statsGrid.textWrap}>
                  <Typography sx={{ ...t.statsGrid.value, color: sc.value }}>{stat.value}</Typography>
                  <Typography sx={t.statsGrid.label}>{stat.label}</Typography>
                  <Typography sx={t.statsGrid.subLabel}>{stat.subLabel}</Typography>
                </Box>
                <Box sx={{ ...t.statsGrid.cornerDot, background: sc.accent }} />
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <Box sx={t.toolbar.wrapper}>
        <Input
          size="small"
          placeholder={S.TOOLBAR.SEARCH_PLACEHOLDER}
          value={listParams.search}
          onChange={(e: any) => listParams.setSearch(e.target.value)}
          sx={t.toolbar.searchField}
          icon={<icons.batchMgmt.search sx={t.toolbar.searchIcon} />}
        />

        <Button
          variant={listParams.filterOpen ? "contained" : "outlined"}
          startIcon={<icons.batchMgmt.filter />}
          onClick={() => listParams.setFilterOpen(!listParams.filterOpen)}
          sx={listParams.filterOpen ? t.toolbar.filterButtonActive : t.toolbar.filterButtonInactive}
        >
          {listParams.activeFilters > 0
            ? S.TOOLBAR.FILTERS_BUTTON_WITH_COUNT(listParams.activeFilters)
            : S.TOOLBAR.FILTERS_BUTTON}
        </Button>

        <Tooltip title={S.PAGE.REFRESH_TOOLTIP}>
          <IconButton onClick={listParams.loadBatchList} disabled={listParams.loading}
            sx={{ color: listParams.loading ? "action.disabled" : "text.secondary" }}>
            <icons.batchMgmt.refresh />
          </IconButton>
        </Tooltip>

        {listParams.filterOpen && (
          <Fade in>
            <Stack direction="row" sx={t.toolbar.filterRow}>
              <FilterSelect
                label={S.TOOLBAR.FILTER_STAGE_LABEL}
                value={listParams.filterStage}
                onChange={(e: any) => { listParams.setFilterStage(e.target.value); listParams.setPage(0); }}
                options={S.FILTER_OPTIONS.STAGES}
                sx={t.toolbar.filterSelect}
              />
              <FilterSelect
                label={S.TOOLBAR.FILTER_STATUS_LABEL}
                value={listParams.filterStatus}
                onChange={(e: any) => { listParams.setFilterStatus(e.target.value); listParams.setPage(0); }}
                options={S.FILTER_OPTIONS.STATUSES}
                sx={t.toolbar.filterSelect}
              />
              <FilterSelect
                label={S.TOOLBAR.FILTER_PRIORITY_LABEL}
                value={listParams.filterPriority}
                onChange={(e: any) => { listParams.setFilterPriority(e.target.value); listParams.setPage(0); }}
                options={S.FILTER_OPTIONS.PRIORITIES}
                sx={t.toolbar.filterSelect}
              />
              <FilterSelect
                label={S.TOOLBAR.FILTER_DEPT_LABEL}
                value={listParams.filterDept}
                onChange={(e: any) => { listParams.setFilterDept(e.target.value); listParams.setPage(0); }}
                options={["All", ...lookups.deptNames]}
                sx={t.toolbar.filterSelect}
              />
              {listParams.activeFilters > 0 && (
                <Button size="small" onClick={listParams.handleClearFilters} sx={t.toolbar.clearButton}>
                  {S.TOOLBAR.CLEAR_ALL}
                </Button>
              )}
            </Stack>
          </Fade>
        )}
      </Box>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <BatchListTable
        paginated={listParams.batches}
        filtered={listParams.batches}
        loading={listParams.loading}
        departments={lookups.departments}
        t={t}
        page={listParams.page}
        totalCount={listParams.paginationData.totalRecords}
        rowsPerPage={listParams.rowsPerPage}
        onEdit={actions.openEdit}
        onDelete={actions.openDelete}
        onCompleteImplementation={actions.openCompleteImplementation}
        onViewImplementation={actions.openViewImplementation}
        onPageChange={(_: any, p: number) => listParams.setPage(p)}
        onRowsPerPageChange={(e: any) => { listParams.setRowsPerPage(+e.target.value); listParams.setPage(0); }}
      />

      {/* ── Modals ────────────────────────────────────────────────────── */}
      <BatchFormModal
        open={actions.modalOpen}
        onClose={() => {
          actions.setModalOpen(false);
          lookups.clearApprovedMotors();
        }}
        onSave={actions.handleSaveBatch}
        onOpenImplementation={actions.openImplementationFromCreate}
        editTarget={actions.editTarget}
        form={actions.batchForm}
        onFormChange={actions.handleBatchFormChange}
        onMotorIdsChange={actions.handleMotorIdsChange}
        userOptions={lookups.userOptions}
        projectOptions={lookups.projectOptions}
        projectsLoading={lookups.loading}
        motorStageOptions={lookups.motorStageOptions}
        motorStagesLoading={lookups.loading}
        availableMotorOptions={lookups.availableMotorOptions}
        availableMotorsLoading={lookups.availableMotorsLoading}
        onFetchApprovedMotors={lookups.fetchApprovedMotors}
        onClearApprovedMotors={lookups.clearApprovedMotors}
        saving={actions.saving}
        t={t}
      />

      <BatchImplementationModal
        open={actions.implModalOpen}
        onClose={() => {
          actions.setImplModalOpen(false);
          actions.setImplViewOnly(false);
        }}
        onSave={actions.handleSaveImplementation}
        editTarget={actions.editImplTarget}
        form={actions.implForm}
        onFormChange={actions.handleImplFormChange}
        onMaterialsChange={actions.handleMaterialsChange}
        readOnly={actions.implViewOnly}
        saving={actions.implSaving}
        t={t}
      />

      <DeleteBatchDialog
        open={actions.deleteOpen}
        onClose={() => actions.setDeleteOpen(false)}
        onConfirm={actions.handleDelete}
        deleteTarget={actions.deleteTarget}
        deleteReason={actions.deleteReason}
        onReasonChange={(e: any) => actions.setDeleteReason(e.target.value)}
        deleting={actions.deleting}
        t={t}
      />
    </Box>
  );
};

export default BatchManagementPage;