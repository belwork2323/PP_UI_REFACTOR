import type { ReactNode } from "react";
import { Box, CircularProgress } from "@mui/material";

import { formatToIsoDateInput, formatToUiDate } from "@utils/dateUtils";
import AppDropdown from "@ui/components/common/AppDropdown";
import AppTextField from "@ui/components/common/AppTextField";
import DateField from "@ui/components/common/DateField";

export type FilterFieldOption = { value: string; label: ReactNode };

type StringKey<D> = Extract<keyof D, string>;

export type FilterField<D> =
  | {
      type: "text";
      key: StringKey<D>;
      label: string;
      placeholder?: string;
      minWidth?: number;
    }
  | {
      type: "select";
      key: StringKey<D>;
      label: string;
      options: FilterFieldOption[];
      /** Disables the field and shows a spinner while options load. */
      loading?: boolean;
      minWidth?: number;
    }
  | {
      type: "dateRange";
      fromKey: StringKey<D>;
      toKey: StringKey<D>;
      fromLabel: string;
      toLabel: string;
      errors?: { from?: string; to?: string } | null;
      minWidth?: number;
    };

export type FilterFieldsTheme = {
  palette: { primaryLight: string };
  batchList: { filterPanelField?: object; filterPanelMenuItem?: object };
};

type FilterFieldsProps<D> = {
  fields: FilterField<D>[];
  draft: D;
  onDraftChange: (patch: Partial<D>) => void;
  theme: FilterFieldsTheme;
};

const DEFAULT_MIN_WIDTH = 140;

const boxSx = (minWidth = DEFAULT_MIN_WIDTH) => ({
  flex: `1 1 ${minWidth}px`,
  minWidth: { xs: "100%", sm: minWidth },
  position: "relative",
});

/** Renders a subdepartment's filter field config inside `ListFilterPanel`. */
const FilterFields = <D,>({ fields, draft, onDraftChange, theme }: FilterFieldsProps<D>) => {
  const fieldSx = { ...(theme.batchList.filterPanelField ?? {}), mb: 0, width: "100%" };
  const menuProps = {
    PaperProps: { sx: { "& .MuiMenuItem-root": theme.batchList.filterPanelMenuItem } },
  };
  const spinnerSx = {
    position: "absolute",
    right: 28,
    bottom: 8,
    color: theme.palette.primaryLight,
  };
  const valueOf = (key: StringKey<D>) => String(draft[key] ?? "");
  const patch = (key: StringKey<D>, value: string) => onDraftChange({ [key]: value } as Partial<D>);

  return (
    <>
      {fields.map((field) => {
        if (field.type === "text") {
          return (
            <Box key={field.key} sx={boxSx(field.minWidth)}>
              <AppTextField
                filterPanel
                label={field.label}
                value={valueOf(field.key)}
                onChange={(event) => patch(field.key, event.target.value)}
                placeholder={field.placeholder}
                InputLabelProps={{ shrink: true }}
                sx={fieldSx}
              />
            </Box>
          );
        }

        if (field.type === "select") {
          return (
            <Box key={field.key} sx={boxSx(field.minWidth)}>
              <AppDropdown
                filterPanel
                label={field.label}
                value={valueOf(field.key)}
                onChange={(value) => patch(field.key, value)}
                options={field.options.map((option) => ({ value: option.value, label: option.label }))}
                disabled={field.loading}
                sx={fieldSx}
                MenuProps={menuProps}
              />
              {field.loading ? <CircularProgress size={16} sx={spinnerSx} /> : null}
            </Box>
          );
        }

        const from = valueOf(field.fromKey);
        return [
          <Box key={field.fromKey} sx={boxSx(field.minWidth)}>
            <DateField
              label={field.fromLabel}
              value={formatToUiDate(from)}
              onChange={(value) => patch(field.fromKey, formatToIsoDateInput(value))}
              compact
              error={Boolean(field.errors?.from)}
              helperText={field.errors?.from}
              sx={fieldSx}
            />
          </Box>,
          <Box key={field.toKey} sx={boxSx(field.minWidth)}>
            <DateField
              label={field.toLabel}
              value={formatToUiDate(valueOf(field.toKey))}
              minDate={formatToUiDate(from)}
              onChange={(value) => patch(field.toKey, formatToIsoDateInput(value))}
              compact
              error={Boolean(field.errors?.to)}
              helperText={field.errors?.to}
              sx={fieldSx}
            />
          </Box>,
        ];
      })}
    </>
  );
};

export default FilterFields;
