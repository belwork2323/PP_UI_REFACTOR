import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import { Button, alpha } from "@mui/material";
import type { ButtonProps, SxProps, Theme } from "@mui/material";

const ACCENT = "#0F766E";

type ViewStatusButtonProps = Omit<ButtonProps, "variant" | "size" | "children" | "startIcon"> & {
  label: string;
  sx?: SxProps<Theme>;
};

const ViewStatusButton = ({ label, sx, disabled, ...buttonProps }: ViewStatusButtonProps) => (
  <Button
    variant="outlined"
    size="small"
    disabled={disabled}
    startIcon={<FactCheckRoundedIcon />}
    sx={[
      {
        textTransform: "none",
        fontWeight: 800,
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
        px: 1.5,
        color: ACCENT,
        borderColor: alpha(ACCENT, 0.55),
        borderWidth: 1.5,
        background: alpha(ACCENT, 0.1),
        boxShadow: `inset 0 0 0 1px ${alpha(ACCENT, 0.06)}`,
        "& .MuiButton-startIcon": { mr: 0.6 },
        "& .MuiSvgIcon-root": { fontSize: 18 },
        "&:hover": {
          borderWidth: 1.5,
          borderColor: ACCENT,
          background: alpha(ACCENT, 0.18),
          color: ACCENT,
        },
        "&.Mui-disabled": {
          color: alpha(ACCENT, 0.45),
          borderColor: alpha(ACCENT, 0.22),
          background: alpha(ACCENT, 0.05),
        },
      },
      ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
    ]}
    {...buttonProps}
  >
    {label}
  </Button>
);

export default ViewStatusButton;
