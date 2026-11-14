import type { ElementType, ReactNode } from "react";
import { Typography, type SxProps, type Theme } from "@mui/material";
import StackRow from "../common/StackRow";

type WorkflowInfoCalloutProps = {
  text?: ReactNode;
  children?: ReactNode;
  icon?: ElementType;
  /** Container styles — typically `theme.workflow.formElements.infoFooterNote` plus padding. */
  sx?: SxProps<Theme>;
  iconSx?: SxProps<Theme>;
  textSx?: SxProps<Theme>;
  gap?: number;
};

/** Info / readiness note row with optional leading icon. */
const WorkflowInfoCallout = ({
  text,
  children,
  icon: Icon,
  sx,
  iconSx,
  textSx,
  gap = 1,
}: WorkflowInfoCalloutProps) => (
  <StackRow gap={gap} sx={sx}>
    {Icon ? <Icon sx={iconSx} /> : null}
    {text != null ? <Typography sx={textSx}>{text}</Typography> : null}
    {children}
  </StackRow>
);

export default WorkflowInfoCallout;
