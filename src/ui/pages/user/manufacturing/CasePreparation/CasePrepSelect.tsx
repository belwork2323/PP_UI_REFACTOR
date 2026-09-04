import { Box, InputAdornment, MenuItem, TextField, Typography } from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { useMemo } from "react";
import { icons } from "../../../../../app/theme/icons";
import { WorkflowReadOnlyText } from "../../../../components/common/WorkflowReadOnlyText";
import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";

const { input: InputRoundedIcon } = icons.user.manufacturing.casePreparation.form;

export type CasePrepSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type CasePrepSelectProps = {
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

const CasePrepSelect = ({
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
}: CasePrepSelectProps) => {
  const cpTheme = theme.manufacturing?.casePreparation;
  const flowBar = cpTheme?.flowBar ?? {};
  const accentColor = theme.palette.primaryLight ?? theme.palette.primary;
  const hasValue = String(value ?? "").trim().length > 0;
  const safeOptions = Array.isArray(options) ? options : [];

  const selectedOption = useMemo(
    () => safeOptions.find((o) => o.value === value),
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
        <TextField
          select
          fullWidth
          size="small"
          value={value}
          disabled={disabled}
          required={required}
          onChange={(e) => onChange(String(e.target.value))}
          sx={flowBar.selectInput?.(hasValue)}
          SelectProps={{
            displayEmpty: true,
            IconComponent: ExpandMoreRoundedIcon,
            renderValue: (selected) => {
              if (!selected) {
                return <Typography sx={flowBar.selectPlaceholder}>{placeholder}</Typography>;
              }
              return selectedOption?.label ?? String(selected);
            },
            MenuProps: {
              PaperProps: { sx: flowBar.selectMenuPaper },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <InputRoundedIcon sx={{ color: "rgba(21,101,192,0.55)", fontSize: 16 }} />
              </InputAdornment>
            ),
          }}
        >
          <MenuItem value="" disabled>
            <Typography sx={flowBar.selectPlaceholder}>{placeholder}</Typography>
          </MenuItem>
          {safeOptions.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              sx={flowBar.menuItem?.(option.value === value)}
            >
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    </Box>
  );
};

export default CasePrepSelect;
