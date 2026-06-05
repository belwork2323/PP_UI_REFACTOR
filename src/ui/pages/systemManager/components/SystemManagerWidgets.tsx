// src/pages/system_manager/components/shared.jsx
//
// Shared UI primitives consumed by DashboardPage and BatchDetailPopup.
// Every component receives the theme object `t` (from getSystemManagerTheme)
// instead of importing the old hard-coded `C` tokens.

import React from "react";
import { Box, Stack, Typography, Tooltip } from "@mui/material";
import { icons } from "../../../../app/theme/icons";

const {
  CheckCircle,
  Warning,
  FiberManualRecord,
  Error: ErrorIcon,
  Schedule,
} = icons.systemManager;

// ── Panel wrapper ─────────────────────────────────────────────────────────────
export const Panel = ({ children, sx = {}, t }) => (
  <Box sx={{ ...t.panel.wrapper, ...sx }}>
    {children}
  </Box>
);

// ── Panel header bar ──────────────────────────────────────────────────────────
export const PanelHeader = ({ title, meta = null, action = null, t }) => (
  <Box sx={t.panel.header.wrapper}>
    <Typography sx={t.panel.header.title}>{title}</Typography>
    <Stack direction="row" alignItems="center" gap={1}>
      {meta}
      {action}
    </Stack>
  </Box>
);

// ── Inline status chip ────────────────────────────────────────────────────────
export const StatusChip = ({ status, t }) => (
  <Box sx={t.statusChip.box(status)}>
    <FiberManualRecord sx={t.statusChip.dot(status)} />
    <Typography sx={t.statusChip.text(status)}>{status}</Typography>
  </Box>
);

// ── Alert type icon ───────────────────────────────────────────────────────────
export const AlertIcon = ({ type, t }) => {
  const color = t.alerts.iconColor[type] ?? t.alerts.iconColor.info;
  if (type === "error")   return <ErrorIcon  sx={{ fontSize: 15, color }} />;
  if (type === "warning") return <Warning    sx={{ fontSize: 15, color }} />;
  return                         <CheckCircle sx={{ fontSize: 15, color }} />;
};

// ── Mini lifecycle stepper ────────────────────────────────────────────────────
export const LifecycleStepper = ({ pct, t }) => {
  const labels = ["Sourcing", "Manufacturing", "QC", "Dispatch"];
  const active  = pct < 25 ? 0 : pct < 50 ? 1 : pct < 75 ? 2 : 3;
  const ld      = t.lifecycleDot;

  return (
    <Stack direction="row" alignItems="center" gap={0}>
      {labels.map((label, i) => (
        <React.Fragment key={label}>
          <Tooltip title={label}>
            <Box sx={ld.dot(i, active)}>
              {i < active  && <CheckCircle       sx={ld.doneIcon}   />}
              {i === active && <FiberManualRecord sx={ld.activeIcon} />}
            </Box>
          </Tooltip>
          {i < labels.length - 1 && (
            <Box sx={ld.connector(i, active)} />
          )}
        </React.Fragment>
      ))}
    </Stack>
  );
};