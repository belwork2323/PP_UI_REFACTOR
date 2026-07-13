import type { ReactNode } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { icons } from "@app/theme/icons";

type AdminManagementFormHeaderProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClose: () => void;
  closeDisabled?: boolean;
  closeIcon?: ReactNode;
  theme: {
    modal: {
      header: {
        wrapper: object;
        titleRow: object;
        iconBadge: object;
        icon: object;
        title: object;
        subtitle: object;
        closeButton: object;
      };
    };
  };
};

const AdminManagementFormHeader = ({
  icon,
  title,
  subtitle,
  onClose,
  closeDisabled = false,
  closeIcon,
  theme,
}: AdminManagementFormHeaderProps) => {
  const { header } = theme.modal;

  return (
    <Box sx={header.wrapper}>
      <Box sx={header.titleRow}>
        <Box sx={header.iconBadge}>{icon}</Box>
        <Box>
          <Typography sx={header.title}>{title}</Typography>
          {subtitle && <Typography sx={header.subtitle}>{subtitle}</Typography>}
        </Box>
      </Box>
      <IconButton onClick={onClose} disabled={closeDisabled} sx={header.closeButton}>
        {closeIcon ?? <icons.userMgmt.close fontSize="small" />}
      </IconButton>
    </Box>
  );
};

export default AdminManagementFormHeader;
