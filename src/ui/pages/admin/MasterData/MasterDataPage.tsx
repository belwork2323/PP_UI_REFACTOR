import React, { useMemo } from "react";
import { Box, Button, Chip } from "@mui/material";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import { useThemeStore } from "@app/store/themeStore";
import MasterDataToggleConfirmDialog from "./components/MasterDataToggleConfirmDialog";
import AppDropdown from "@ui/components/common/AppDropdown";
import AdminManagementPageHeader from "@ui/components/custom/admin/AdminManagementPageHeader";
import getMasterDataTheme from "@app/theme/custom_themes/admin/MasterData/masterData_theme";
import useMasterDataHook from "@hooks/admin/MasterData/useMasterDataHook";
import useEquipmentTypeOptions from "@hooks/admin/MasterData/useEquipmentTypeOptions";
import useEnergyUnitOptions from "@hooks/admin/MasterData/useEnergyUnitOptions";
import { isNestedMasterDataType } from "@data/models/admin/MasterData/nestedMasterDataTypes";
import MasterDataList from "./MasterDataList";
import MaterialsMasterPanel from "./MaterialsMasterPanel";
import InsulationSpecMasterPanel from "./InsulationSpecMasterPanel";
import MixingCycleMasterPanel from "./MixingCycleMasterPanel";
import CuringCycleMasterPanel from "./CuringCycleMasterPanel";
import DimensionalParametersMasterPanel from "./DimensionalParametersMasterPanel";
import { getMasterDataAddButtonLabel, stripMasterTypeSuffix } from "./masterDataLabels";
import { masterDataStatusFilterChipProps } from "./components/masterDataStatusStyles";
import useProjectForMotorStageOptions from "@/hooks/admin/MasterData/useProjectForMotorStageOptions";

const S = STRINGS.MASTER_DATA;

const TYPE_NOUN: Record<string, string> = {
  mixers: "mixers",
  buildings: "buildings",
  ovens: "ovens",
  equipment: "equipment",
  "equipment-types": "equipment types",
  "beam-energy": "beam energies",
  units: "units",
  "casting-stations": "casting stations",
  "subscale-articles": "subscale articles",
  materials: "materials",
  "insulation-specifications": "insulation specs",
  "motor-stages": "motor stages",
  "dimensional-parameters": "dimensional parameters",
  "mixing-cycles": "mixing cycles",
  "curing-cycles": "curing cycles",
};

const MasterDataPage = () => {
  const mode = useThemeStore((s) => s.mode);
  const t = getMasterDataTheme(mode);
  const hook = useMasterDataHook();
  const equipmentTypeOptions = useEquipmentTypeOptions(hook.selectedType === "equipment");
  const energyUnitOptions = useEnergyUnitOptions(hook.selectedType === "beam-energy");
  const projectOptions = useProjectForMotorStageOptions(hook.selectedType === "motor-stages");
  const dynamicAttributeOptions = useMemo(() => {
    const options: Record<string, typeof equipmentTypeOptions.options> = {};
    if (hook.selectedType === "equipment" && equipmentTypeOptions.options.length > 0) {
      options.equipmentType = equipmentTypeOptions.options;
    }
    if (hook.selectedType === "beam-energy" && energyUnitOptions.options.length > 0) {
      options.energyUnit = energyUnitOptions.options;
    }
    if (hook.selectedType === "motor-stages" && projectOptions.options.length > 0) {
      options.projectId = projectOptions.options;
    }
    return Object.keys(options).length > 0 ? options : undefined;
  }, [
    hook.selectedType,
    equipmentTypeOptions.options,
    energyUnitOptions.options,
    projectOptions.options,
  ]);
  const projectSelectOptions =
    hook.selectedType === "motor-stages" ? projectOptions.projects : undefined;
  const projectSelectLoading =
    hook.selectedType === "motor-stages" ? projectOptions.loading : false;

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

  const addButtonLabel = useMemo(
    () => getMasterDataAddButtonLabel(hook.selectedType, hook.types),
    [hook.selectedType, hook.types],
  );

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
      </Box>

      {typeSelected ? (
        <Box sx={t.content}>
          <Box sx={t.statusRowAboveTable}>
            <Chip
              {...masterDataStatusFilterChipProps(
                "ALL",
                hook.activeFilter === "ALL",
                () => hook.setActiveFilter("ALL"),
                t.statusChip,
              )}
              label={S.PAGE.STAT_TOTAL(noun, total)}
            />
            <Chip
              {...masterDataStatusFilterChipProps(
                "ACTIVE",
                hook.activeFilter === "ACTIVE",
                () => hook.setActiveFilter("ACTIVE"),
                t.statusChip,
              )}
              label={S.PAGE.STAT_ACTIVE(noun, active)}
            />
            <Chip
              {...masterDataStatusFilterChipProps(
                "INACTIVE",
                hook.activeFilter === "INACTIVE",
                () => hook.setActiveFilter("INACTIVE"),
                t.statusChip,
              )}
              label={S.PAGE.STAT_INACTIVE(noun, inactive)}
            />
          </Box>

          {hook.selectedType === "materials" ? (
            <MaterialsMasterPanel
              activeFilter={hook.activeFilter}
              refreshKey={hook.nestedRefreshKey}
              addButtonLabel={addButtonLabel}
              t={t}
              onStatsChange={hook.setStats}
              onRefresh={hook.refresh}
              refreshDisabled={hook.loadingList}
            />
          ) : hook.selectedType === "insulation-specifications" ? (
            <InsulationSpecMasterPanel
              activeFilter={hook.activeFilter}
              refreshKey={hook.nestedRefreshKey}
              addButtonLabel={addButtonLabel}
              t={t}
              onStatsChange={hook.setStats}
              onRefresh={hook.refresh}
              refreshDisabled={hook.loadingList}
            />
          ) : hook.selectedType === "dimensional-parameters" ? (
            <DimensionalParametersMasterPanel
              activeFilter={hook.activeFilter}
              refreshKey={hook.nestedRefreshKey}
              addButtonLabel={addButtonLabel}
              t={t}
              onStatsChange={hook.setStats}
              onRefresh={hook.refresh}
              refreshDisabled={hook.loadingList}
            />
          ) : hook.selectedType === "mixing-cycles" ? (
            <MixingCycleMasterPanel
              activeFilter={hook.activeFilter}
              refreshKey={hook.nestedRefreshKey}
              addButtonLabel={addButtonLabel}
              t={t}
              onStatsChange={hook.setStats}
              onRefresh={hook.refresh}
              refreshDisabled={hook.loadingList}
            />
          ) : hook.selectedType === "curing-cycles" ? (
            <CuringCycleMasterPanel
              activeFilter={hook.activeFilter}
              refreshKey={hook.nestedRefreshKey}
              addButtonLabel={addButtonLabel}
              t={t}
              onStatsChange={hook.setStats}
              onRefresh={hook.refresh}
              refreshDisabled={hook.loadingList}
            />
          ) : (
            <>
              <MasterDataList
                rows={hook.paginated}
                loading={hook.loadingList}
                page={hook.page}
                totalCount={hook.filteredItems.length}
                rowsPerPage={hook.rowsPerPage}
                attributeFields={attributeFields}
                schema={hook.schema}
                selectedType={hook.selectedType}
                inlineMode={hook.inlineMode}
                form={hook.form}
                saving={hook.saving}
                togglingStatus={hook.disabling || hook.enabling}
                search={hook.search}
                onSearchChange={hook.setSearch}
                onRefresh={hook.refresh}
                refreshDisabled={hook.loadingList}
                t={t}
                onFormChange={hook.onFormChange}
                onToggleActive={hook.handleToggleActive}
                onSaveInline={hook.saveForm}
                onCancelInline={hook.closeInline}
                onPageChange={(_e, page) => hook.setPage(page)}
                onRowsPerPageChange={(e) => hook.setRowsPerPage(Number(e.target.value))}
                dynamicAttributeOptions={dynamicAttributeOptions}
                projectSelectOptions={projectSelectOptions}
                projectSelectLoading={projectSelectLoading}
                projectFilter={hook.projectFilter}
                onProjectFilterChange={hook.setProjectFilter}
                motorStageFilter={hook.motorStageFilter}
                onMotorStageFilterChange={hook.setMotorStageFilter}
                motorStageFilterOptions={hook.motorStageFilterOptions}
              />

              <Box sx={t.addRowBar}>
                <Button
                  variant="contained"
                  startIcon={<icons.projectMgmt.add />}
                  onClick={hook.openCreate}
                  disabled={
                    hook.loadingList || !hook.selectedType || hook.inlineMode != null || isNested
                  }
                  sx={t.pageHeader.newProjectButton}
                >
                  {addButtonLabel}
                </Button>
              </Box>
            </>
          )}
        </Box>
      ) : null}

      {!isNested ? (
        <MasterDataToggleConfirmDialog
          target={
            hook.toggleTarget
              ? {
                  name: hook.toggleTarget.record.name || hook.toggleTarget.record.code,
                  nextActive: hook.toggleTarget.nextActive,
                }
              : null
          }
          busy={hook.disabling || hook.enabling}
          onConfirm={() => void hook.confirmToggle()}
          onCancel={hook.cancelToggle}
        />
      ) : null}
    </Box>
  );
};

export default MasterDataPage;
