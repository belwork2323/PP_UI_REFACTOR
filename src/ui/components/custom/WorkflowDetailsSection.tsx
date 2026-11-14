import type { ElementType, ReactNode } from "react";
import { Box, Typography } from "@mui/material";

type SectionTheme = {
  section?: object;
  sectionTitle?: object;
  sectionTitleIcon?: object;
};

type WorkflowDetailsSectionProps = {
  dt: SectionTheme;
  title: string;
  icon?: ElementType;
  /** When false, omits bottom margin (e.g. last section). */
  sx?: object;
  children?: ReactNode;
};

/** Titled details section card — same chrome as manufacturing/QC details bodies. */
const WorkflowDetailsSection = ({
  dt,
  title,
  icon: Icon,
  sx,
  children,
}: WorkflowDetailsSectionProps) => (
  <Box sx={{ ...dt.section, ...sx }}>
    <Typography sx={dt.sectionTitle}>
      {Icon ? <Icon sx={dt.sectionTitleIcon} /> : null}
      {title}
    </Typography>
    {children}
  </Box>
);

export default WorkflowDetailsSection;
