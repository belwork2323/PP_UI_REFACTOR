import { useState } from "react";
import {
  Box,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { icons } from "../../../../../app/theme/icons";
import type { CasePrepSelectOption } from "./CasePrepSelect";

const { input: InputRoundedIcon } = icons.user.manufacturing.casePreparation.form;

type CasePrepMultiSelectProps = {
  label: string;
  value: string[];
  placeholder: string;
  options: CasePrepSelectOption[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  width?: number | string;
  theme: any;
};

const CasePrepMultiSelect = ({
  label,
  value,
  placeholder,
  options,
  onChange,
  disabled = false,
  width = "100%",
  theme,
}: CasePrepMultiSelectProps) => {
  const flowBar = theme.manufacturing?.casePreparation?.flowBar ?? {};
  const safeValue = Array.isArray(value) ? value : [];
  const hasValue = safeValue.length > 0;
  const safeOptions = Array.isArray(options) ? options : [];
  const [open, setOpen] = useState(false);

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const next = event.target.value;
    onChange(typeof next === "string" ? next.split(",") : next);
    setOpen(false);
  };

  return (
    <Box sx={flowBar.selectField?.(width)}>
      <Typography component="label" sx={flowBar.selectLabel}>
        {label}
      </Typography>
      <TextField
        select
        fullWidth
        size="small"
        value={safeValue}
        disabled={disabled}
        sx={flowBar.selectInput?.(hasValue)}
        SelectProps={{
          multiple: true,
          displayEmpty: true,
          open,
          onChange: handleChange,
          onOpen: () => setOpen(true),
          onClose: () => setOpen(false),
          IconComponent: ExpandMoreRoundedIcon,
          renderValue: (selected) => {
            const picked = selected as string[];
            if (!picked.length) {
              return <Typography sx={flowBar.selectPlaceholder}>{placeholder}</Typography>;
            }
            return picked.join(", ");
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
        {safeOptions.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            sx={flowBar.menuItem?.(safeValue.includes(option.value))}
          >
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
};

export default CasePrepMultiSelect;
