import {
  Box,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { useMemo } from "react";
import { useThemeStore } from "../../../../../app/store/themeStore";
import { icons } from "../../../../../app/theme/icons";

const {
  grain: GrainRoundedIcon,
  blurLinear: BlurLinearRoundedIcon,
} = icons.user.manufacturing.rawMaterial.builderPage;

export type RawMaterialPrepSelectOption = {
  value: string;
  label: string;
  meta?: string;
  disabled?: boolean;
};

type RawMaterialPrepSelectProps = {
  label: string;
  value: string;
  placeholder: string;
  options: RawMaterialPrepSelectOption[];
  onChange: (value: string) => void;
  variant?: "premix" | "material";
  disabled?: boolean;
  width?: number | string;
  theme: any;
};

const RawMaterialPrepSelect = ({
  label,
  value,
  placeholder,
  options,
  onChange,
  variant = "premix",
  disabled = false,
  width = "100%",
  theme,
}: RawMaterialPrepSelectProps) => {
  const mode = useThemeStore((s) => s.mode);
  const rmTheme = theme.manufacturing.rawMaterialPrep;
  const accentColor = theme.palette.primaryLight ?? theme.palette.primary;
  const hasValue = String(value ?? "").trim().length > 0;

  const safeOptions = Array.isArray(options) ? options : [];

  const selectedOption = useMemo(
    () => safeOptions.find((o) => o.value === value),
    [safeOptions, value]
  );

  const StartIcon = variant === "material" ? GrainRoundedIcon : BlurLinearRoundedIcon;

  return (
    <Box sx={rmTheme.flowBar.selectField(width)}>
      <Typography component="label" sx={rmTheme.flowBar.selectLabel}>
        {label}
      </Typography>
      <TextField
        select
        fullWidth
        size="small"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(String(e.target.value))}
        sx={rmTheme.flowBar.selectInput(hasValue, accentColor)}
        SelectProps={{
          displayEmpty: true,
          IconComponent: ExpandMoreRoundedIcon,
          renderValue: (selected) => {
            if (!selected) {
              return <Typography sx={rmTheme.flowBar.selectPlaceholder}>{placeholder}</Typography>;
            }
            if (variant === "material" && selectedOption) {
              return (
                <Box component="span" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>
                  <Typography component="span" sx={{ fontWeight: 600, fontSize: "0.82rem" }}>
                    {selectedOption.label}
                  </Typography>
                  {selectedOption.meta ? (
                    <Typography component="span" sx={{ ml: 0.75, fontSize: "0.72rem", color: theme.palette.textSub }}>
                      {selectedOption.meta}
                    </Typography>
                  ) : null}
                </Box>
              );
            }
            return selectedOption?.label ?? String(selected);
          },
          MenuProps: {
            PaperProps: {
              sx: {
                ...rmTheme.flowBar.selectMenuPaper,
                boxShadow:
                  mode === "dark"
                    ? "0 10px 28px rgba(0,0,0,0.45)"
                    : rmTheme.flowBar.selectMenuPaper.boxShadow,
              },
            },
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <StartIcon
                sx={{
                  fontSize: 17,
                  color: hasValue ? accentColor : theme.palette.border,
                }}
              />
            </InputAdornment>
          ),
        }}
      >
        <MenuItem value="" disabled>
          <Typography sx={rmTheme.flowBar.selectPlaceholder}>{placeholder}</Typography>
        </MenuItem>
        {safeOptions
          .filter((o) => o.value !== "")
          .map((option) => {
            const selected = value === option.value;
            if (variant === "material") {
              return (
                <MenuItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  sx={rmTheme.flowBar.materialMenuItem(selected)}
                >
                  <Typography sx={rmTheme.flowBar.materialMenuPrimary(selected)}>
                    {option.label}
                  </Typography>
                  {option.meta ? (
                    <Typography sx={rmTheme.flowBar.materialMenuMeta}>{option.meta}</Typography>
                  ) : null}
                </MenuItem>
              );
            }
            return (
              <MenuItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                sx={rmTheme.flowBar.premixMenuItem(selected, accentColor)}
              >
                {option.label}
              </MenuItem>
            );
          })}
      </TextField>
    </Box>
  );
};

export default RawMaterialPrepSelect;
