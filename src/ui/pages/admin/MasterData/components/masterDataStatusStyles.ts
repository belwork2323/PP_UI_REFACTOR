import type { SxProps, Theme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";

export type MasterDataStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export const masterDataActiveSwitchSx = (_checked?: boolean): SxProps<Theme> => ({
  "& .MuiSwitch-switchBase": {
    color: "error.main",
    "& + .MuiSwitch-track": {
      backgroundColor: "error.main",
      opacity: 0.5,
    },
    "&.Mui-checked": {
      color: "success.main",
      "& + .MuiSwitch-track": {
        backgroundColor: "success.main",
        opacity: 0.5,
      },
    },
  },
});

export const masterDataActiveStatusChipSx = (isActive: boolean): SxProps<Theme> => ({
  height: 24,
  minWidth: 48,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.2,
  borderRadius: 999,
  ...(isActive
    ? {
        bgcolor: "success.main",
        color: "success.contrastText",
        border: "1px solid",
        borderColor: "success.dark",
      }
    : {
        bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
        color: "error.main",
        border: "1px solid",
        borderColor: "error.main",
      }),
});

export const masterDataStatusFilterChipProps = (
  filter: MasterDataStatusFilter,
  selected: boolean,
  onClick: () => void,
  baseSx?: SxProps<Theme>,
) => {
  const common = {
    size: "small" as const,
    variant: selected ? ("filled" as const) : ("outlined" as const),
    onClick,
    sx: {
      height: 28,
      fontSize: 12,
      fontWeight: 600,
      borderRadius: 1.5,
      cursor: "pointer",
      transition: "all 0.15s ease",
      ...(baseSx as object),
      ...(selected ? { boxShadow: 1 } : { opacity: 0.95 }),
    },
  };

  if (filter === "ACTIVE") {
    return {
      ...common,
      sx: {
        ...common.sx,
        ...(selected
          ? {
              bgcolor: "success.main",
              color: "success.contrastText",
              borderColor: "success.main",
            }
          : {
              color: "success.main",
              borderColor: "success.main",
              "&:hover": {
                bgcolor: (theme: Theme) => alpha(theme.palette.success.main, 0.08),
              },
            }),
      },
    };
  }

  if (filter === "INACTIVE") {
    return {
      ...common,
      sx: {
        ...common.sx,
        ...(selected
          ? {
              bgcolor: "error.main",
              color: "error.contrastText",
              borderColor: "error.main",
            }
          : {
              color: "error.main",
              borderColor: "error.main",
              "&:hover": {
                bgcolor: (theme: Theme) => alpha(theme.palette.error.main, 0.08),
              },
            }),
      },
    };
  }

  return {
    ...common,
    color: selected ? ("primary" as const) : ("default" as const),
    sx: {
      ...common.sx,
      "&:hover": {
        bgcolor: (theme: Theme) => alpha(theme.palette.action.active, 0.08),
      },
    },
  };
};
