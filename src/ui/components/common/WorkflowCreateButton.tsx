import { useMemo } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { alpha, Button } from "@mui/material";
import type { ButtonProps, SxProps, Theme } from "@mui/material";
import { useThemeStore } from "../../../app/store/themeStore";
import getSourcingTheme from "../../../app/theme/custom_themes/user/sourcing/sourcing_theme";

type WorkflowThemeTokens = {
  palette: { primary: string };
  batchList: {
    action: {
      primary: SxProps<Theme>;
    };
  };
};

export type WorkflowCreateButtonProps = Omit<ButtonProps, "children" | "variant" | "size"> & {
  label: string;
  themeTokens?: WorkflowThemeTokens;
  sx?: SxProps<Theme>;
};

export const buildWorkflowCreateButtonSx = (
  theme: WorkflowThemeTokens,
  mode: "light" | "dark",
  additionalSx?: SxProps<Theme>,
): SxProps<Theme> => {
  const primary = theme.palette.primary;
  const shadowAlpha = mode === "dark" ? 0.35 : 0.25;
  const hoverShadowAlpha = mode === "dark" ? 0.45 : 0.32;

  const primaryActionSx = theme.batchList.action.primary as Record<string, unknown>;

  return [
    theme.batchList.action.primary,
    {
      textTransform: "none",
      fontWeight: 800,
      fontSize: "0.8rem",
      px: 2,
      py: 0.75,
      minHeight: 34,
      borderRadius: 2,
      gap: 0.75,
      "& .MuiButton-startIcon": { ml: -0.25, mr: 0.25 },
      "& .MuiSvgIcon-root": { fontSize: 18 },
      boxShadow: `0 2px 10px ${alpha(primary, shadowAlpha)}`,
      "&:hover": {
        ...(primaryActionSx["&:hover"] as object),
        boxShadow: `0 4px 16px ${alpha(primary, hoverShadowAlpha)}`,
      },
    },
    additionalSx,
  ] as SxProps<Theme>;
};

const WorkflowCreateButton = ({
  label,
  themeTokens,
  sx,
  startIcon = <AddRoundedIcon />,
  ...buttonProps
}: WorkflowCreateButtonProps) => {
  const mode = useThemeStore((state) => state.mode);
  const defaultTheme = useMemo(() => getSourcingTheme(mode), [mode]);
  const theme = themeTokens ?? defaultTheme;

  const buttonSx = useMemo(
    () => buildWorkflowCreateButtonSx(theme as WorkflowThemeTokens, mode, sx),
    [theme, mode, sx],
  );

  return (
    <Button variant="contained" size="small" startIcon={startIcon} sx={buttonSx} {...buttonProps}>
      {label}
    </Button>
  );
};

export default WorkflowCreateButton;
