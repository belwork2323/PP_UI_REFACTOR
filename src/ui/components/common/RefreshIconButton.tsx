import type { ReactNode } from "react";
import { IconButton, Tooltip } from "@mui/material";

type RefreshIconButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  tooltip: string;
  icon: ReactNode;
};

const RefreshIconButton = ({
  onClick,
  disabled = false,
  tooltip,
  icon,
}: RefreshIconButtonProps) => (
  <Tooltip title={tooltip}>
    <span>
      <IconButton
        onClick={onClick}
        disabled={disabled}
        size="small"
        sx={{ color: disabled ? "action.disabled" : "text.secondary", flexShrink: 0 }}
      >
        {icon}
      </IconButton>
    </span>
  </Tooltip>
);

export default RefreshIconButton;
