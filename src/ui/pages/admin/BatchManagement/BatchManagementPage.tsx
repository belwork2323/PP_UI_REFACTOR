import React from "react";
import {
  Box,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  TextField,
} from "@mui/material";
import { icons } from "@app/theme/icons";
import getBatchManagementTheme from "@app/theme/custom_themes/admin/BatchManagement/batchManagement_theme";
import { STRINGS } from "@app/config/strings";
import { useThemeStore } from "@app/store/themeStore";
import FilterSelect from "@ui/components/common/FilterSelect";
import ConfirmAlertDialog from "@ui/components/common/ConfirmAlertDialog";
import RefreshIconButton from "@ui/components/common/RefreshIconButton";
import Input from "@ui/components/common/Input";
import AdminManagementStatsGrid from "@ui/components/custom/admin/AdminManagementStatsGrid";
import AdminManagementPageHeader from "@ui/components/custom/admin/AdminManagementPageHeader";
import AdminListShell from "@ui/components/custom/admin/AdminListShell";
import AdminFilterPanel from "@ui/components/custom/admin/AdminFilterPanel";
import useBatchManagementHook from "@hooks/admin/BatchManagement/useBatchManagementHook";
import { getBatchId, getMotorId } from "@utils/batchManagementUtils";
import BatchManagementList from "./BatchManagementList";
import CreateBatchManagementForm from "./CreateBatchManagementForm";
import BatchImplementationForm from "./BatchImplementationForm";
import BatchDetailsView from "./BatchDetailsView";
import FilterToggleButton from "@/ui/components/common/FilterToggleButton";
import DashboardDateFilter, {
  getDateFilterDisplayLabel,
} from "@/ui/components/custom/dashboard/DashboardDateFilter";
import getDashboardTheme from "@/app/theme/custom_themes/admin/Dashboard/dashboard_theme";

const S = STRINGS.BATCH_MANAGEMENT;
const S1 = STRINGS.DASHBOARD_PAGE;
const AC = STRINGS.ADMIN_COMMON;

const STAT_ICONS: Record<string, React.ReactNode> = {
  total: <icons.batchMgmt.batchIcon sx={{ fontSize: 22 }} />,
  inProgress: <icons.batchMgmt.inProgressStatus sx={{ fontSize: 22 }} />,
  completed: <icons.batchMgmt.completedStatus sx={{ fontSize: 22 }} />,
  pending: <icons.batchMgmt.pendingStatus sx={{ fontSize: 22 }} />,
  rejected: <icons.batchMgmt.rejectedStatus sx={{ fontSize: 22 }} />,
};

const BatchManagementPage = () => {
  const mode = useThemeStore((s) => s.mode);
  const t = getBatchManagementTheme(mode);
  const {
    list,
    stats,
    lookups,
    form,
    implementation,
    delete: deleteSection,
    filter,
  } = useBatchManagementHook();
  const th = getDashboardTheme(mode);
  const loadedStats = Array.isArray(stats.stats) ? stats.stats : [];
  const statRows = S.STATS.map((stat) => {
    const loadedStat = loadedStats.find(
      (item: { variant?: string }) => item.variant === stat.variant,
    );
    return {
      ...stat,
      value: stats.loading ? S.PAGE.LOADING_PLACEHOLDER : (loadedStat?.value ?? "0"),
      subLabel: stats.loading ? stat.subLabel : (loadedStat?.subLabel ?? stat.subLabel),
      icon: STAT_ICONS[stat.variant],
    };
  });

  const deleteTarget = deleteSection.deleteTarget;
  const batchId = deleteTarget ? getBatchId(deleteTarget) : "";
  const motorId = deleteTarget ? getMotorId(deleteTarget) : "";
  const canDelete = !!deleteSection.deleteReason?.trim();
  const { draftFilters } = list;
  const total = list.paginationData.totalRecords;
  const shown = list.batches.length;
  const compositionTotal =
    form.implForm.identificationSheet?.materials?.reduce(
      (sum, m) => sum + (Number(m.requiredComposition) || 0),
      0,
    ) ?? 0;
  return (
    <Box sx={t.page}>
      <AdminManagementPageHeader
        title={S.PAGE.TITLE}
        subtitle={S.PAGE.SUBTITLE}
        headerActions={
          <Stack direction="row" spacing={2} alignItems="center">
            {/* <FormControl size="small" sx={t.toolbar.filterSelect}>
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
            </FormControl> */}

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
      <Box sx={{ mb: 2 }}>
        <FilterToggleButton
          label="Date Filter"
          count={filter.filterType !== S1.DATE_FILTER.VALUES.MONTH ? 1 : 0}
          isOpen={stats.dateFilterOpen}
          onClick={stats.toggleDateFilter}
          sx={th.table.filterBtn(
            stats.dateFilterOpen || filter.filterType !== S1.DATE_FILTER.VALUES.MONTH,
          )}
          iconSx={th.table.filterBtnIcon}
          textSx={th.table.filterBtnText}
          badgeSx={th.table.filterBadgePill}
          chevronSx={th.table.filterBtnChevron}
          selectedValue={getDateFilterDisplayLabel(filter.filterType, S1.DATE_FILTER)}
        />
        {stats.dateFilterOpen && (
          <DashboardDateFilter
            filterType={filter.filterType}
            onFilterChange={filter.handleFilterTypeChange}
            customStartDate={filter.customStartDate}
            customEndDate={filter.customEndDate}
            onStartChange={filter.setCustomStartDate}
            onEndChange={filter.setCustomEndDate}
            onApplyCustom={filter.applyCustomDateFilter}
            onClearFilter={filter.clearDateFilter}
            loading={stats.loading}
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
        onSearchChange={(value) => list.setSearch(value)}
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
        hasItems={list.batches.length > 0}
        emptyTitle={S.TABLE.EMPTY}
        toolbarEnd={
          <RefreshIconButton
            onClick={list.loadBatchList}
            disabled={list.loading}
            tooltip={S.PAGE.REFRESH_TOOLTIP}
            icon={<icons.batchMgmt.refresh />}
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
            <Stack direction="row" gap={1.5} flexWrap="wrap">
              <TextField
                size="small"
                label={S.TOOLBAR.SEARCH_MOTOR_PLACEHOLDER}
                value={draftFilters.motorIds.join(", ")}
                onChange={(e) =>
                  list.setDraftFilter(
                    "motorIds",
                    e.target.value
                      .split(",")
                      .map((id) => id.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="e.g. MTR-445, MTR-446"
                sx={{ ...t.filterPanel.field, minWidth: 240 }}
              />
              <FormControl size="small" sx={t.filterPanel.field}>
                <InputLabel>{S.TOOLBAR.FILTER_STAGE_LABEL}</InputLabel>

                <Select
                  value={draftFilters.stage}
                  label={S.TOOLBAR.FILTER_STAGE_LABEL}
                  onChange={(e) => list.setDraftFilter("stage", e.target.value)}
                  MenuProps={t.menuPaper}
                  disabled={lookups.loading}
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value="All">
                    <em>{lookups.loading ? "Loading motor stages..." : "All"}</em>
                  </MenuItem>

                  {lookups.motorStageOptions.map((stage) => (
                    <MenuItem key={stage.motorStage} value={String(stage.motorStage)}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        width="100%"
                      >
                        <Typography>Stage {stage.motorStage}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FilterSelect
                label={S.TOOLBAR.FILTER_STATUS_LABEL}
                value={draftFilters.status}
                onChange={(e) => list.setDraftFilter("status", e.target.value)}
                options={S.FILTER_OPTIONS.STATUS}
                sx={t.filterPanel.field}
              />
              <FilterSelect
                label={S.TOOLBAR.FILTER_SUB_DEPT_LABEL}
                value={draftFilters.subDept}
                onChange={(e) => list.setDraftFilter("subDept", e.target.value)}
                options={[...lookups.subDeptNames]}
                sx={t.filterPanel.field}
              />
            </Stack>
          </AdminFilterPanel>
        }
        theme={t}
      >
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
          onViewDetails={form.openViewDetails}
          onPageChange={(_, p) => list.setPage(p)}
          onRowsPerPageChange={(e) => {
            list.setRowsPerPage(+e.target.value);
            list.setPage(0);
          }}
        />
      </AdminListShell>

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
        setConfirmOpen={form.setConfirmOpen}
      />

      <BatchDetailsView
        open={form.detailsOpen}
        loading={form.detailsLoading}
        batch={form.detailsBatch}
        onClose={form.closeViewDetails}
        t={t}
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
      <ConfirmAlertDialog
        open={form.confirmOpen}
        severity="warning"
        title="Composition Percentage Warning"
        message={
          compositionTotal < 100
            ? `The total composition is ${compositionTotal.toFixed(2)}%. ${(
                100 - compositionTotal
              ).toFixed(2)}% is still remaining. Do you want to continue?`
            : `The total composition is ${compositionTotal.toFixed(2)}%. It exceeds the limit by ${(
                compositionTotal - 100
              ).toFixed(2)}%. Do you want to continue?`
        }
        confirmLabel="Yes"
        cancelLabel="No"
        onCancel={() => form.setConfirmOpen(false)}
        onConfirm={() => {
          form.setConfirmOpen(false);
          form.handleSaveImplementation();
        }}
      >
        <Box
          sx={{
            mt: 2,
            ml: "52px",
            p: 1.5,
            borderRadius: 1,
            fontWeight: 500,
            fontSize: "0.875rem",
          }}
        >
          You can still continue, but please verify the material composition before completing the
          implementation.
        </Box>
      </ConfirmAlertDialog>
    </Box>
  );
};

export default BatchManagementPage;
