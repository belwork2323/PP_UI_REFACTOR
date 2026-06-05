import type { ReactNode } from "react";

import { Button } from "@mui/material";
import type { ButtonProps } from "@mui/material";

type AppButtonProps = ButtonProps & {
  children: ReactNode;
};

const AppButton = ({
  children,
  variant = "contained",
  size = "large",
  startIcon,
  fullWidth = true,
  onClick,
  ...rest
}: AppButtonProps) => {
  return (
    <Button variant={variant} size={size} startIcon={startIcon} fullWidth={fullWidth} onClick={onClick} {...rest}>
      {children}
    </Button>
  );
};

export default AppButton;
