import React from "react";
import {
  Box, Button, Stack,
  FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip,
} from "@mui/material";
import { icons } from "@app/theme/icons";
import getBatchManagementTheme from "@app/theme/custom_themes/admin/BatchManagement/batchManagement_theme";
import { STRINGS } from "@app/config/strings";
import Input from "@ui/components/common/Input";
import FilterSelect from "@ui/components/common/FilterSelect";
import ConfirmAlertDialog from "@ui/components/common/ConfirmAlertDialog";
import AdminManagementStatsGrid from "@ui/components/custom/admin/AdminManagementStatsGrid";
import AdminManagementPageHeader from "@ui/components/custom/admin/AdminManagementPageHeader";
import AdminManagementToolbar from "@ui/components/custom/admin/AdminManagementToolbar";
import useBatchManagementHook from "@hooks/admin/BatchManagement/useBatchManagementHook";
import { getBatchId, getMotorId } from "@utils/batchManagementUtils";
import BatchManagementList from "./BatchManagementList";
import CreateBatchManagementForm from "./CreateBatchManagementForm";
import BatchImplementationForm from "./BatchImplementationForm";

const S = STRINGS.BATCH_MANAGEMENT;

const STAT_ICONS: Record<string, React.ReactNode> = {
  total: <icons.batchMgmt.batchIcon sx={{ fontSize: 22 }} />,
  inProgress: <icons.batchMgmt.inProgressStatus sx={{ fontSize: 22 }} />,
  completed: <icons.batchMgmt.completedStatus sx={{ fontSize: 22 }} />,
  pending: <icons.batchMgmt.pendingStatus sx={{ fontSize: 22 }} />,
  rejected: <icons.batchMgmt.rejectedStatus sx={{ fontSize: 22 }} />,
};

type BatchManagementPageProps = {
  mode?: "light" | "dark";
};

const BatchManagementPage = ({ mode = "light" }: BatchManagementPageProps) => {
  const t = getBatchManagementTheme(mode);
  const { list, stats, lookups, form, implementation, delete: deleteSection } = useBatchManagementHook();

  const loadedStats = Array.isArray(stats.stats) ? stats.stats : [];
  const statRows = S.STATS.map((stat) => {
    const loadedStat = loadedStats.find((item: { variant?: string }) => item.variant === stat.variant);
    return {
      ...stat,
      value: stats.loading ? S.PAGE.LOADING_PLACEHOLDER : loadedStat?.value ?? "0",
      subLabel: stats.loading ? stat.subLabel : loadedStat?.subLabel ?? stat.subLabel,
      icon: STAT_ICONS[stat.variant],
    };
  });

  const deleteTarget = deleteSection.deleteTarget;
  const batchId = deleteTarget ? getBatchId(deleteTarget) : "";
  const motorId = deleteTarget ? getMotorId(deleteTarget) : "";
  const canDelete = !!deleteSection.deleteReason?.trim();

  return (
    <Box sx={t.page}>
      <AdminManagementPageHeader
        title={S.PAGE.TITLE}
        subtitle={S.PAGE.SUBTITLE}
        headerActions={
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={t.toolbar.filterSelect}>
              <InputLabel>{S.TOOLBAR.TIMEFRAME_LABEL}</InputLabel>
              <Select
                value={stats.filterType}
                label={S.TOOLBAR.TIMEFRAME_LABEL}
                onChange={stats.handleStatsFilterChange}
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
              onClick={form.openCreate}
              disabled={list.loading}
              sx={t.pageHeader.newBatchButton}
            >
              {S.PAGE.NEW_BATCH_BUTTON}
            </Button>
          </Stack>
        }
        theme={t}
      />

      <AdminManagementStatsGrid stats={statRows} theme={t} />

      <AdminManagementToolbar
        search={list.search}
        onSearchChange={(value) => list.setSearch(value)}
        searchPlaceholder={S.TOOLBAR.SEARCH_PLACEHOLDER}
        searchIcon={<icons.batchMgmt.search sx={t.toolbar.searchIcon} />}
        filterStartIcon={<icons.batchMgmt.filter />}
        filterOpen={list.filterOpen}
        onFilterToggle={() => list.setFilterOpen(!list.filterOpen)}
        filtersButtonLabel={
          list.activeFilters > 0
            ? S.TOOLBAR.FILTERS_BUTTON_WITH_COUNT(list.activeFilters)
            : S.TOOLBAR.FILTERS_BUTTON
        }
        toolbarEnd={
          <Tooltip title={S.PAGE.REFRESH_TOOLTIP}>
            <IconButton
              onClick={list.loadBatchList}
              disabled={list.loading}
              sx={{ color: list.loading ? "action.disabled" : "text.secondary" }}
            >
              <icons.batchMgmt.refresh />
            </IconButton>
          </Tooltip>
        }
        filterContent={
          <>
            <FilterSelect
              label={S.TOOLBAR.FILTER_STAGE_LABEL}
              value={list.filterStage}
              onChange={(e) => { list.setFilterStage(e.target.value); list.setPage(0); }}
              options={S.FILTER_OPTIONS.STAGES}
              sx={t.toolbar.filterSelect}
            />
            <FilterSelect
              label={S.TOOLBAR.FILTER_STATUS_LABEL}
              value={list.filterStatus}
              onChange={(e) => { list.setFilterStatus(e.target.value); list.setPage(0); }}
              options={S.FILTER_OPTIONS.STATUSES}
              sx={t.toolbar.filterSelect}
            />
            <FilterSelect
              label={S.TOOLBAR.FILTER_PRIORITY_LABEL}
              value={list.filterPriority}
              onChange={(e) => { list.setFilterPriority(e.target.value); list.setPage(0); }}
              options={S.FILTER_OPTIONS.PRIORITIES}
              sx={t.toolbar.filterSelect}
            />
            <FilterSelect
              label={S.TOOLBAR.FILTER_DEPT_LABEL}
              value={list.filterDept}
              onChange={(e) => { list.setFilterDept(e.target.value); list.setPage(0); }}
              options={["All", ...lookups.deptNames]}
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

      <BatchManagementList
        paginated={list.batches}
        loading={list.loading}
        t={t}
        page={list.page}
        totalCount={list.paginationData.totalRecords}
        rowsPerPage={list.rowsPerPage}
        onEdit={form.openEdit}
        onDelete={deleteSection.openDelete}
        onCompleteImplementation={form.openCompleteImplementation}
        onViewImplementation={form.openViewImplementation}
        onPageChange={(_, p) => list.setPage(p)}
        onRowsPerPageChange={(e) => { list.setRowsPerPage(+e.target.value); list.setPage(0); }}
      />

      <CreateBatchManagementForm
        open={form.modalOpen}
        onClose={() => {
          form.setModalOpen(false);
          lookups.clearApprovedMotors();
        }}
        onSave={form.handleSaveBatch}
        onOpenImplementation={form.openImplementationFromCreate}
        editTarget={form.editTarget}
        form={form.batchForm}
        onFormChange={form.handleBatchFormChange}
        onMotorIdsChange={form.handleMotorIdsChange}
        userOptions={lookups.userOptions}
        projectOptions={lookups.projectOptions}
        projectsLoading={lookups.loading}
        motorStageOptions={lookups.motorStageOptions}
        motorStagesLoading={lookups.loading}
        availableMotorOptions={lookups.availableMotorOptions}
        availableMotorsLoading={lookups.availableMotorsLoading}
        onFetchApprovedMotors={lookups.fetchApprovedMotors}
        onClearApprovedMotors={lookups.clearApprovedMotors}
        saving={form.saving}
        t={t}
      />

      <BatchImplementationForm
        open={form.implModalOpen}
        onClose={() => {
          form.setImplModalOpen(false);
          form.setImplViewOnly(false);
        }}
        onSave={form.handleSaveImplementation}
        editTarget={form.editImplTarget}
        form={form.implForm}
        onFormChange={form.handleImplFormChange}
        onMaterialsChange={form.handleMaterialsChange}
        readOnly={form.implViewOnly}
        saving={form.implSaving}
        t={t}
        materialOptions={implementation.materialOptions}
        loadingMaterials={implementation.loadingMaterials}
        loadingLots={implementation.loadingLots}
        getLotByMaterialAndId={implementation.getLotByMaterialAndId}
        getLotOptionsForRow={implementation.getLotOptionsForRow}
      />

      <ConfirmAlertDialog
        open={deleteSection.deleteOpen}
        severity="error"
        title={S.DELETE_DIALOG.TITLE}
        message={deleteTarget ? S.DELETE_DIALOG.BODY(batchId, motorId) : S.DELETE_DIALOG.TITLE}
        confirmLabel={deleteSection.deleting ? S.DELETE_DIALOG.DELETING : S.DELETE_DIALOG.CONFIRM}
        cancelLabel={S.DELETE_DIALOG.CANCEL}
        confirmDisabled={deleteSection.deleting || !canDelete}
        onConfirm={deleteSection.handleDelete}
        onCancel={() => !deleteSection.deleting && deleteSection.setDeleteOpen(false)}
      >
        <Input
          fullWidth
          multiline
          minRows={2}
          label={S.DELETE_DIALOG.REASON_LABEL}
          placeholder={S.DELETE_DIALOG.REASON_PLACEHOLDER}
          value={deleteSection.deleteReason}
          onChange={(e) => deleteSection.setDeleteReason(e.target.value)}
          sx={{ ...t.deleteDialog.deleteReasonInput, mt: 2 }}
          helperText={!canDelete ? S.DELETE_DIALOG.REASON_HELPER : undefined}
        />
      </ConfirmAlertDialog>
    </Box>
  );
};

export default BatchManagementPage;
