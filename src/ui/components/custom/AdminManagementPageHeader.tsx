import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

type AdminManagementPageHeaderProps = {
  title: string;
  subtitle: string;
  primaryAction?: ReactNode;
  headerActions?: ReactNode;
  theme: {
    pageHeader: {
      wrapper: object;
      title: object;
      subtitle: object;
    };
  };
};

const AdminManagementPageHeader = ({
  title,
  subtitle,
  primaryAction,
  headerActions,
  theme,
}: AdminManagementPageHeaderProps) => (
  <Box sx={theme.pageHeader.wrapper}>
    <Box>
      <Typography sx={theme.pageHeader.title}>{title}</Typography>
      <Typography sx={theme.pageHeader.subtitle}>{subtitle}</Typography>
    </Box>
    {headerActions ?? primaryAction}
  </Box>
);

export default AdminManagementPageHeader;
