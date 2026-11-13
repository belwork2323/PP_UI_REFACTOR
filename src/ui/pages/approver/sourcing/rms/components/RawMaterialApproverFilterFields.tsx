import { useMemo } from "react";
import { CircularProgress, Stack } from "@mui/material";

import { STRINGS } from "@app/config/strings";
import { useThemeStore } from "@app/store/themeStore";
import { getListFilterPanelTheme, type ListFilterPanelPalette } from "@app/theme/custom_themes/shared/listFilterPanel_theme";
import { formatToIsoDateInput, formatToUiDate } from "@utils/dateUtils";
import AppDropdown from "@ui/components/common/AppDropdown";
import DateField from "@ui/components/common/DateField";
import getApproverSourcingFilterStyles from "@ui/pages/approver/sourcing/shared/approverSourcingFilterStyles";

const BL = STRINGS.SOURCING.BATCH_LIST;

export type RawMaterialApproverFilterDraft = {
  material: string;
  status: string;
  from: string;
  to: string;
};

type RawMaterialApproverFilterFieldsProps = {
  palette: ListFilterPanelPalette;
  draft: RawMaterialApproverFilterDraft;
  onDraftChange: (patch: Partial<RawMaterialApproverFilterDraft>) => void;
  filterAllLabel: string;
  materialOptions: { materialCode: string; materialName: string }[];
  materialsLoading: boolean;
  statusValues: string[];
  dateErrors?: { from?: string; to?: string } | null;
};

const RawMaterialApproverFilterFields = ({
  palette,
  draft,
  onDraftChange,
  filterAllLabel,
  materialOptions,
  materialsLoading,
  statusValues,
  dateErrors,
}: RawMaterialApproverFilterFieldsProps) => {
  const mode = useThemeStore((state) => state.mode);
  const filterStyles = useMemo(() => getApproverSourcingFilterStyles(mode), [mode]);
  const { panel } = useMemo(() => getListFilterPanelTheme(palette), [palette]);

  const materialDropdownOptions = useMemo(
    () => [
      { value: filterAllLabel, label: BL.FILTERS_ALL_MATERIALS },
      ...(materialsLoading
        ? []
        : materialOptions.map((material) => ({
            value: material.materialCode,
            label: `${material.materialCode} — ${material.materialName}`,
          }))),
    ],
    [filterAllLabel, materialOptions, materialsLoading],
  );

  const statusDropdownOptions = useMemo(
    () => statusValues.map((status) => ({ value: status, label: status })),
    [statusValues],
  );

  return (
    <>
      <Stack
        direction="row"
        spacing={1}
        alignItems="flex-start"
        sx={{ minWidth: { xs: "100%", sm: 180 }, flex: { lg: "0 0 auto" } }}
      >
        <AppDropdown
          filterPanel
          label={BL.FILTERS_MATERIAL}
          value={draft.material}
          onChange={(material) => onDraftChange({ material })}
          options={materialDropdownOptions}
          disabled={materialsLoading}
          sx={filterStyles.field}
          MenuProps={filterStyles.selectProps.MenuProps}
        />
        {materialsLoading ? <CircularProgress size={18} sx={panel.fieldSpinner} /> : null}
      </Stack>

      <AppDropdown
        filterPanel
        label={BL.FILTERS_STATUS}
        value={draft.status}
        onChange={(status) => onDraftChange({ status })}
        options={statusDropdownOptions}
        sx={filterStyles.fieldWide}
        MenuProps={filterStyles.selectProps.MenuProps}
      />

      <DateField
        label={BL.FILTERS_FROM_DATE}
        value={formatToUiDate(draft.from)}
        onChange={(value) => onDraftChange({ from: formatToIsoDateInput(value) })}
        compact
        error={Boolean(dateErrors?.from)}
        helperText={dateErrors?.from}
        sx={filterStyles.fieldDate}
      />
      <DateField
        label={BL.FILTERS_TO_DATE}
        value={formatToUiDate(draft.to)}
        minDate={formatToUiDate(draft.from)}
        onChange={(value) => onDraftChange({ to: formatToIsoDateInput(value) })}
        compact
        error={Boolean(dateErrors?.to)}
        helperText={dateErrors?.to}
        sx={filterStyles.fieldDate}
      />
    </>
  );
};

export default RawMaterialApproverFilterFields;
