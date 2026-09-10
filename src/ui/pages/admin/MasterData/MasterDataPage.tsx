import React, { useMemo } from "react";
import { Box, Button, Chip } from "@mui/material";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import { useThemeStore } from "@app/store/themeStore";
import ConfirmAlertDialog from "@ui/components/common/ConfirmAlertDialog";
import RefreshIconButton from "@ui/components/common/RefreshIconButton";
import AppDropdown from "@ui/components/common/AppDropdown";
import AdminManagementPageHeader from "@ui/components/custom/admin/AdminManagementPageHeader";
import getMasterDataTheme from "@app/theme/custom_themes/admin/MasterData/masterData_theme";
import useMasterDataHook from "@hooks/admin/MasterData/useMasterDataHook";
import { isNestedMasterDataType } from "@data/models/admin/MasterData/nestedMasterDataTypes";
import MasterDataList from "./MasterDataList";
import MaterialsMasterPanel from "./MaterialsMasterPanel";
import InsulationSpecMasterPanel from "./InsulationSpecMasterPanel";
import MixingCycleMasterPanel from "./MixingCycleMasterPanel";
import CuringCycleMasterPanel from "./CuringCycleMasterPanel";
import QualityCheckMasterPanel from "./QualityCheckMasterPanel";
import QcDivisionMasterPanel from "./QcDivisionMasterPanel";

const S = STRINGS.MASTER_DATA;

const TYPE_NOUN: Record<string, string> = {
  mixers: "mixers",
  buildings: "buildings",
  ovens: "ovens",
  equipment: "equipment",
  "beam-energy": "beam energies",
  "casting-stations": "casting stations",
  "subscale-articles": "subscale articles",
  materials: "materials",
  "insulation-specifications": "insulation specs",
  "motor-stages": "motor stages",
  "dimensional-parameters": "dimensional parameters",
  "mixing-cycles": "mixing cycles",
  "curing-cycles": "curing cycles",
  "quality-checks": "quality checks",
  "qc-divisions": "QC divisions",
};

const stripMasterTypeSuffix = (label: string) => label.replace(/\s+Master$/i, "").trim();

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

const MasterDataPage = () => {
  const mode = useThemeStore((s) => s.mode);
  const t = getMasterDataTheme(mode);
  const hook = useMasterDataHook();

  const attributeFields = useMemo(
    () => (hook.schema?.fields ?? []).filter((f) => f.attribute),
    [hook.schema],
  );

  const isNested = isNestedMasterDataType(hook.selectedType);
  const typeSelected = Boolean(hook.selectedType);
  const noun = TYPE_NOUN[hook.selectedType] || "records";
  const total = hook.loadingList && !isNested ? S.PAGE.LOADING_PLACEHOLDER : hook.stats.total;
  const active = hook.loadingList && !isNested ? S.PAGE.LOADING_PLACEHOLDER : hook.stats.active;
  const inactive = hook.loadingList && !isNested ? S.PAGE.LOADING_PLACEHOLDER : hook.stats.inactive;

  const typeOptions = useMemo(
    () =>
      hook.types.map((type) => ({
        value: type.type,
        label: stripMasterTypeSuffix(type.label),
      })),
    [hook.types],
  );

  const statusChipProps = (filter: StatusFilter, color?: "success" | "default") => {
    const selected = hook.activeFilter === filter;
    return {
      size: "small" as const,
      variant: selected ? ("filled" as const) : ("outlined" as const),
      color,
      onClick: () => hook.setActiveFilter(filter),
      sx: {
        ...t.statusChip,
        cursor: "pointer",
        ...(selected ? { boxShadow: 1 } : { opacity: 0.9 }),
      },
    };
  };

  return (
    <Box sx={t.page}>
      <AdminManagementPageHeader title={S.PAGE.TITLE} subtitle={S.PAGE.SUBTITLE} theme={t} />

      <Box sx={t.toolbarRow}>
        <Box sx={t.toolbarTypeSelect}>
          <AppDropdown
            label={S.PAGE.TYPE_LABEL}
            value={hook.selectedType}
            options={typeOptions}
            disabled={hook.loadingTypes}
            onChange={(value) => hook.setSelectedType(value)}
            placeholder={S.PAGE.TYPE_PLACEHOLDER}
          />
        </Box>

        <RefreshIconButton
          onClick={hook.refresh}
          disabled={!typeSelected || hook.loadingList}
          tooltip="Refresh"
          icon={<icons.projectMgmt.refresh />}
        />
      </Box>

      {typeSelected ? (
      <Box sx={t.content}>
        <Box sx={t.statusRowAboveTable}>
          <Chip
            {...statusChipProps("ALL")}
            label={S.PAGE.STAT_TOTAL(noun, total)}
          />
          <Chip
            {...statusChipProps("ACTIVE", "success")}
            label={S.PAGE.STAT_ACTIVE(noun, active)}
          />
          <Chip
            {...statusChipProps("INACTIVE", "default")}
            label={S.PAGE.STAT_INACTIVE(noun, inactive)}
          />
        </Box>

        {hook.selectedType === "materials" ? (
          <MaterialsMasterPanel
            activeFilter={hook.activeFilter}
            refreshKey={hook.nestedRefreshKey}
            t={t}
            onStatsChange={hook.setStats}
          />
        ) : hook.selectedType === "insulation-specifications" ? (
          <InsulationSpecMasterPanel
            activeFilter={hook.activeFilter}
            refreshKey={hook.nestedRefreshKey}
            t={t}
            onStatsChange={hook.setStats}
          />
        ) : hook.selectedType === "mixing-cycles" ? (
          <MixingCycleMasterPanel
            activeFilter={hook.activeFilter}
            refreshKey={hook.nestedRefreshKey}
            t={t}
            onStatsChange={hook.setStats}
          />
        ) : hook.selectedType === "curing-cycles" ? (
          <CuringCycleMasterPanel
            activeFilter={hook.activeFilter}
            refreshKey={hook.nestedRefreshKey}
            t={t}
            onStatsChange={hook.setStats}
          />
        ) : hook.selectedType === "quality-checks" ? (
          <QualityCheckMasterPanel
            activeFilter={hook.activeFilter}
            refreshKey={hook.nestedRefreshKey}
            t={t}
            onStatsChange={hook.setStats}
          />
        ) : hook.selectedType === "qc-divisions" ? (
          <QcDivisionMasterPanel
            activeFilter={hook.activeFilter}
            refreshKey={hook.nestedRefreshKey}
            t={t}
            onStatsChange={hook.setStats}
          />
        ) : (
          <>
            <MasterDataList
              rows={hook.paginated}
              loading={hook.loadingList}
              page={hook.page}
              totalCount={hook.items.length}
              rowsPerPage={hook.rowsPerPage}
              attributeFields={attributeFields}
              schema={hook.schema}
              inlineMode={hook.inlineMode}
              editTarget={hook.editTarget}
              form={hook.form}
              saving={hook.saving}
              search={hook.search}
              onSearchChange={hook.setSearch}
              t={t}
              onFormChange={hook.onFormChange}
              onEdit={hook.openEdit}
              onDisable={hook.setDisableTarget}
              onSaveInline={hook.saveForm}
              onCancelInline={hook.closeInline}
              onPageChange={(_e, page) => hook.setPage(page)}
              onRowsPerPageChange={(e) => hook.setRowsPerPage(Number(e.target.value))}
            />

            <Box sx={t.addRowBar}>
              <Button
                variant="contained"
                startIcon={<icons.projectMgmt.add />}
                onClick={hook.openCreate}
                disabled={hook.loadingList || !hook.selectedType || hook.inlineMode != null || isNested}
                sx={t.pageHeader.newProjectButton}
              >
                {S.PAGE.NEW_BUTTON}
              </Button>
            </Box>
          </>
        )}
      </Box>
      ) : null}

      {!isNested ? (
        <ConfirmAlertDialog
          open={!!hook.disableTarget}
          title={S.DISABLE_DIALOG.TITLE}
          message={
            hook.disableTarget
              ? S.DISABLE_DIALOG.BODY(hook.disableTarget.name || hook.disableTarget.code)
              : ""
          }
          confirmLabel={hook.disabling ? S.DISABLE_DIALOG.DISABLING : S.DISABLE_DIALOG.CONFIRM}
          cancelLabel={S.DISABLE_DIALOG.CANCEL}
          onConfirm={hook.confirmDisable}
          onCancel={() => !hook.disabling && hook.setDisableTarget(null)}
          confirmDisabled={hook.disabling}
        />
      ) : null}
    </Box>
  );
};

export default MasterDataPage;
