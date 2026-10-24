import React from "react";
import { Box, MenuItem } from "@mui/material";
import { icons } from "@app/theme/icons";
import getMotorManagementTheme from "@app/theme/custom_themes/admin/MotorManagement/motorManagement_theme";
import { STRINGS } from "@app/config/strings";
import { useAuthStore } from "@app/store/authStore";
import { useThemeStore } from "@app/store/themeStore";
import { normalizeRoleKey } from "@app/theme/roleConfig";
import FilterSelect from "@ui/components/common/FilterSelect";
import AppDropdown from "@ui/components/common/AppDropdown";
import FormInput from "@ui/components/common/FormInput";
import Input from "@ui/components/common/Input";
import RefreshIconButton from "@ui/components/common/RefreshIconButton";
import AdminManagementStatsGrid from "@ui/components/custom/admin/AdminManagementStatsGrid";
import AdminManagementPageHeader from "@ui/components/custom/admin/AdminManagementPageHeader";
import AdminListShell from "@ui/components/custom/admin/AdminListShell";
import AdminListFilterPanel from "@ui/components/custom/admin/AdminListFilterPanel";
import ConfirmAlertDialog from "@ui/components/common/ConfirmAlertDialog";
import useMotorManagementHook from "@hooks/admin/MotorManagement/useMotorManagementHook";
import MotorManagementList from "./MotorManagementList";
import MotorDetailsView from "./MotorDetailsView";
import FilterToggleButton from "@/ui/components/common/FilterToggleButton";
import DashboardDateFilter, {
  getDateFilterDisplayLabel,
} from "@/ui/components/custom/dashboard/DashboardDateFilter";
import getDashboardTheme from "@/app/theme/custom_themes/admin/Dashboard/dashboard_theme";

const S = STRINGS.MOTOR_MANAGEMENT;
const S1 = STRINGS.DASHBOARD_PAGE;
const AC = STRINGS.ADMIN_COMMON;

const STAT_ICONS: Record<string, React.ReactNode> = {
  total: <icons.motorMgmt.motorIcon sx={{ fontSize: 22 }} />,
  inProgress: <icons.motorMgmt.inProgressStatus sx={{ fontSize: 22 }} />,
  dispatched: <icons.batchMgmt.dispatchedStatus sx={{ fontSize: 22 }} />,
  discarded: <icons.batchMgmt.rejectedStatus sx={{ fontSize: 22 }} />,
};

const STAT_VALUE_KEYS: Record<string, "totalMotors" | "inProgress" | "dispatched" | "discarded"> = {
  total: "totalMotors",
  inProgress: "inProgress",
  dispatched: "dispatched",
  discarded: "discarded",
};

const MOTOR_STAGE_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

const MotorManagementPage = () => {
  const mode = useThemeStore((s) => s.mode);
  const t = getMotorManagementTheme(mode);
  const th = getDashboardTheme(mode);
  const roleKey = normalizeRoleKey(useAuthStore((s) => s.user?.role) ?? "");
  const canDiscardMotors = roleKey === "ADMIN";
  const { list, stats, lookups, details, discard, refresh } = useMotorManagementHook();
  const canDiscard = !!discard.discardReason?.trim();
  const discardMotorId = discard.discardTarget?.motorId || "";
  const [discardSureOpen, setDiscardSureOpen] = React.useState(false);

  const closeDiscardFlow = () => {
    if (discard.discarding) return;
    setDiscardSureOpen(false);
    discard.closeDiscard();
  };

  const statRows = S.STATS.map((s) => ({
    ...s,
    value: stats.loading ? S.PAGE.LOADING_PLACEHOLDER : stats.stats[STAT_VALUE_KEYS[s.variant]],
    icon: STAT_ICONS[s.variant],
  }));

  const { draftFilters } = list;
  const total = list.paginationData.totalRecords;
  const shown = list.motors.length;

  return (
    <Box sx={t.page}>
      <AdminManagementPageHeader title={S.PAGE.TITLE} subtitle={S.PAGE.SUBTITLE} theme={t} />

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
        hasItems={list.motors.length > 0}
        emptyTitle={S.TABLE.EMPTY}
        toolbarEnd={
          <RefreshIconButton
            onClick={refresh}
            disabled={list.loading}
            tooltip={AC.REFRESH_TOOLTIP}
            icon={<icons.motorMgmt.refresh />}
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
            <FormInput
              label={S.TOOLBAR.FILTER_BATCH_ID_LABEL}
              value={draftFilters.batchId}
              onChange={(e) => list.setDraftFilter("batchId", e.target.value)}
              placeholder={S.TOOLBAR.FILTER_BATCH_ID_PLACEHOLDER}
              filterPanel
              sx={{ ...t.filterPanel.field, ...t.filterPanel.fieldItemGrow }}
            />

            <AppDropdown
              label={S.TOOLBAR.FILTER_PROJECT_LABEL}
              value={draftFilters.projectId}
              onChange={(value) => list.setDraftFilter("projectId", value)}
              loading={lookups.loading}
              loadingPlaceholder="Loading projects..."
              disabled={lookups.loading}
              filterPanel
              sx={{ ...t.filterPanel.field, ...t.filterPanel.fieldItem }}
              MenuProps={t.menuPaper}
              itemSx={t.filterPanel.menuItem}
            >
              <MenuItem value="All">All</MenuItem>
              {lookups.projectOptions.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  {p.label}
                </MenuItem>
              ))}
            </AppDropdown>

            <AppDropdown
              label={S.TOOLBAR.FILTER_STAGE_LABEL}
              value={draftFilters.motorStage}
              onChange={(value) => list.setDraftFilter("motorStage", value)}
              filterPanel
              sx={{ ...t.filterPanel.field, ...t.filterPanel.fieldItem }}
              MenuProps={t.menuPaper}
              itemSx={t.filterPanel.menuItem}
            >
              <MenuItem value="All">All</MenuItem>
              {MOTOR_STAGE_OPTIONS.map((stage) => (
                <MenuItem key={stage} value={stage}>
                  Stage {stage}
                </MenuItem>
              ))}
            </AppDropdown>

            <FilterSelect
              label={S.TOOLBAR.FILTER_STATUS_LABEL}
              value={draftFilters.workflowStatus}
              onChange={(e) => list.setDraftFilter("workflowStatus", e.target.value)}
              options={S.FILTER_OPTIONS.WORKFLOW_STATUS}
              filterPanel
              sx={{ ...t.filterPanel.field, ...t.filterPanel.fieldItem }}
              menuProps={t.menuPaper}
              itemSx={t.filterPanel.menuItem}
            />
          </AdminListFilterPanel>
        }
        theme={t}
      >
        <MotorManagementList
          paginated={list.motors}
          loading={list.loading}
          t={t}
          page={list.page}
          totalCount={list.paginationData.totalRecords}
          rowsPerPage={list.rowsPerPage}
          onView={(motor) => details.openDetails(motor.motorId)}
          onDiscard={
            canDiscardMotors ? (motor) => discard.openDiscard(motor.motorId) : undefined
          }
          onPageChange={(_, p) => list.setPage(p)}
          onRowsPerPageChange={(e) => {
            list.setRowsPerPage(+e.target.value);
            list.setPage(0);
          }}
        />
      </AdminListShell>

      <MotorDetailsView
        open={details.open}
        loading={details.loading}
        details={details.details}
        onClose={details.closeDetails}
        onDiscard={
          canDiscardMotors
            ? () => {
                if (details.details?.motorId) discard.openDiscard(details.details.motorId);
              }
            : undefined
        }
        t={t}
      />

      {canDiscardMotors ? (
        <>
          <ConfirmAlertDialog
            open={discard.discardOpen}
            severity="error"
            title={S.DISCARD_DIALOG.TITLE}
            message={
              discardMotorId ? S.DISCARD_DIALOG.BODY(discardMotorId) : S.DISCARD_DIALOG.TITLE
            }
            confirmLabel={S.DISCARD_DIALOG.CONFIRM}
            cancelLabel={S.DISCARD_DIALOG.CANCEL}
            confirmDisabled={discard.discarding || !canDiscard || discardSureOpen}
            onConfirm={() => setDiscardSureOpen(true)}
            onCancel={closeDiscardFlow}
          >
            <Input
              fullWidth
              multiline
              minRows={2}
              label={S.DISCARD_DIALOG.REASON_LABEL}
              placeholder={S.DISCARD_DIALOG.REASON_PLACEHOLDER}
              value={discard.discardReason}
              onChange={(e) => discard.setDiscardReason(e.target.value)}
              sx={{ mt: 2 }}
              helperText={!canDiscard ? S.DISCARD_DIALOG.REASON_HELPER : undefined}
            />
          </ConfirmAlertDialog>

          <ConfirmAlertDialog
            open={discardSureOpen}
            severity="error"
            title={S.DISCARD_DIALOG.SURE_TITLE}
            message={
              discardMotorId
                ? S.DISCARD_DIALOG.SURE_BODY(discardMotorId)
                : S.DISCARD_DIALOG.SURE_TITLE
            }
            confirmLabel={
              discard.discarding ? S.DISCARD_DIALOG.DISCARDING : S.DISCARD_DIALOG.SURE_CONFIRM
            }
            cancelLabel={S.DISCARD_DIALOG.CANCEL}
            confirmDisabled={discard.discarding || !canDiscard}
            onConfirm={async () => {
              const ok = await discard.handleDiscard();
              if (ok) setDiscardSureOpen(false);
            }}
            onCancel={() => {
              if (discard.discarding) return;
              setDiscardSureOpen(false);
            }}
          />
        </>
      ) : null}
    </Box>
  );
};

export default MotorManagementPage;
