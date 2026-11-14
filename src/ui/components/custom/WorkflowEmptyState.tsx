import type { ElementType, ReactNode } from "react";
import { Box, Typography, type SxProps, type Theme } from "@mui/material";

type WorkflowEmptyStateProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ElementType;
  /** Container styles — typically `theme.workflow.formElements.emptyStateBox`. */
  sx?: SxProps<Theme>;
  iconSx?: SxProps<Theme>;
  titleSx?: SxProps<Theme>;
  subtitleSx?: SxProps<Theme>;
  children?: ReactNode;
};

/** Dashed empty placeholder used on create / fill workflow forms. */
const WorkflowEmptyState = ({
  title,
  subtitle,
  icon: Icon,
  sx,
  iconSx,
  titleSx,
  subtitleSx,
  children,
}: WorkflowEmptyStateProps) => (
  <Box sx={sx}>
    {Icon ? <Icon sx={iconSx} /> : null}
    {title ? <Typography sx={titleSx}>{title}</Typography> : null}
    {subtitle ? <Typography sx={subtitleSx}>{subtitle}</Typography> : null}
    {children}
  </Box>
);

export default WorkflowEmptyState;
