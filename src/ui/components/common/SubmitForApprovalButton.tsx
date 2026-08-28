import { Button } from "@mui/material";
import type { ButtonProps, SxProps, Theme } from "@mui/material";
import { getWorkflowAccentOutlinedButtonSx } from "./workflowAccentButtonStyles";

type SubmitForApprovalButtonProps = Omit<ButtonProps, "variant" | "children" | "startIcon"> & {
  label: string;
};

const SubmitForApprovalButton = ({
  label,
  sx,
  disabled,
  size = "small",
  ...buttonProps
}: SubmitForApprovalButtonProps) => (
  <Button
    variant="outlined"
    size={size}
    disabled={disabled}
    sx={[
      getWorkflowAccentOutlinedButtonSx(),
      ...(Array.isArray(sx) ? sx : sx ? [sx as SxProps<Theme>] : []),
    ]}
    {...buttonProps}
  >
    {label}
  </Button>
);

export default SubmitForApprovalButton;
