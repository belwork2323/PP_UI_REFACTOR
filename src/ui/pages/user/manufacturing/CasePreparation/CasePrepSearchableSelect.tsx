import { Autocomplete, Box, InputAdornment, TextField, Typography } from "@mui/material";
import { useMemo } from "react";
import { icons } from "../../../../../app/theme/icons";
import { WorkflowReadOnlyText } from "../../../../components/common/WorkflowReadOnlyText";
import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";
import type { CasePrepSelectOption } from "./CasePrepSelect";

const { input: InputRoundedIcon } = icons.user.manufacturing.casePreparation.form;

type CasePrepSearchableSelectProps = {
  label: string;
  value: string;
  placeholder: string;
  options: CasePrepSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  width?: number | string;
  theme: any;
  required?: boolean;
};

const CasePrepSearchableSelect = ({
  label,
  value,
  placeholder,
  options,
  onChange,
  disabled = false,
  readOnly = false,
  width = "100%",
  theme,
  required = false,
}: CasePrepSearchableSelectProps) => {
  const cpTheme = theme?.manufacturing?.casePreparation;
  const flowBar = cpTheme?.flowBar ?? {};
  const safeOptions = Array.isArray(options) ? options : [];

  const selectedOption = useMemo(
    () => safeOptions.find((o) => o.value === value) ?? null,
    [safeOptions, value],
  );

  return (
    <Box sx={flowBar.selectField?.(width)}>
      <Typography component="label" sx={flowBar.selectLabel}>
        {required ? <FieldLabelWithAsterisk label={label} required /> : label}
      </Typography>
      {readOnly ? (
        <WorkflowReadOnlyText
          value={selectedOption?.label ?? value}
          sx={{ fontSize: "0.82rem", py: 0.75 }}
        />
      ) : (
        <Autocomplete
          size="small"
          disabled={disabled}
          options={safeOptions}
          value={selectedOption}
          onChange={(_event, option) => onChange(option?.value ?? "")}
          getOptionLabel={(option) => String(option.label ?? "")}
          isOptionEqualToValue={(option, current) => option.value === current.value}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={placeholder}
              required={required}
              sx={flowBar.selectInput?.(Boolean(value))}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <InputRoundedIcon sx={{ color: "rgba(21,101,192,0.55)", fontSize: 16 }} />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
          slotProps={{
            paper: { sx: flowBar.selectMenuPaper },
            listbox: { sx: { maxHeight: 280 } },
          }}
          noOptionsText="No matches"
        />
      )}
    </Box>
  );
};

export default CasePrepSearchableSelect;
