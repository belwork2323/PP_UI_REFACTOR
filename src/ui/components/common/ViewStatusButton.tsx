import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import { Button } from "@mui/material";
import type { ButtonProps, SxProps, Theme } from "@mui/material";
import { getWorkflowAccentOutlinedButtonSx } from "./workflowAccentButtonStyles";

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
      getWorkflowAccentOutlinedButtonSx({ fontWeight: 800 }),
      ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
    ]}
    {...buttonProps}
  >
    {label}
  </Button>
);

export default ViewStatusButton;
