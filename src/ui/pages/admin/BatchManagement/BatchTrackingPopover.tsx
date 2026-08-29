import React, { useEffect } from "react";
import {
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";

import { STRINGS } from "@app/config/strings";
import { useThemeStore } from "@app/store/themeStore";
import getSystemManagerTheme from "@app/theme/custom_themes/system_manager/sysDashboard_theme";
import StatusChip from "@ui/components/common/StatusChip";
import ProgressBar from "@ui/components/common/ProgressBar";
import useBatchTracking from "@hooks/admin/BatchManagement/useBatchTrackingHook";

const S = STRINGS.BATCH_MANAGEMENT.TRACKING;

type BatchTrackingPopoverProps = {
  open: boolean;
  anchorEl: HTMLElement | null;
  batchId: string;
  onClose: () => void;
};

const BatchTrackingPopover = ({ open, anchorEl, batchId, onClose }: BatchTrackingPopoverProps) => {
  const mode = useThemeStore((s) => s.mode);
  const smTheme = getSystemManagerTheme(mode);
  const getStatusColor = smTheme.popup.statusColor;
  const { loading, error, tracking, loadTracking, resetTracking } = useBatchTracking();

  useEffect(() => {
    if (!open || !batchId) return;
    void loadTracking(batchId);
  }, [open, batchId, loadTracking]);

  useEffect(() => {
    if (!open) {
      resetTracking();
    }
  }, [open, resetTracking]);

  const progressBar = smTheme.popup.header.progressBar;

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{
        paper: {
          sx: {
            width: 360,
            maxWidth: "92vw",
            maxHeight: 420,
            borderRadius: 2,
            border: (theme) =>
              `1px solid ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "#E5E7EB"}`,
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 16px 40px rgba(0,0,0,0.45)"
                : "0 12px 32px rgba(15,23,42,0.12)",
            overflow: "hidden",
          },
        },
      }}
    >
      <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Stack direction="row" alignItems="center" gap={1} minWidth={0}>
            <TrackChangesRoundedIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
            <Box minWidth={0}>
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, lineHeight: 1.2 }}>
                {S.TITLE}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  color: "text.secondary",
                  fontFamily: "monospace",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {batchId}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={onClose} aria-label={S.CLOSE}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ p: 2, overflowY: "auto", maxHeight: 340 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Typography sx={{ fontSize: "0.8rem", color: "error.main" }}>{error}</Typography>
        ) : !tracking ? (
          <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{S.EMPTY}</Typography>
        ) : (
          <Stack spacing={2}>
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.75}>
                <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", fontWeight: 600 }}>
                  {S.OVERALL_PROGRESS}
                </Typography>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700 }}>
                  {Math.round(tracking.overallProgress)}%
                </Typography>
              </Stack>
              <ProgressBar
                value={tracking.overallProgress}
                color={progressBar.color}
                trackColor={progressBar.trackColor}
                valueColor={progressBar.valueColor}
                showValue={false}
                height={6}
              />
            </Box>

            {tracking.departments.length === 0 ? (
              <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{S.NO_STAGES}</Typography>
            ) : (
              tracking.departments.map((department, index) => {
                const deptColor = getStatusColor(department.status);
                return (
                  <Box key={department.id || department.name}>
                    {index > 0 ? <Divider sx={{ mb: 1.5 }} /> : null}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} mb={1}>
                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>{department.name}</Typography>
                      <StatusChip status={department.status} size="small" />
                    </Stack>

                    {department.subDepartments.length === 0 ? (
                      <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", pl: 1.5 }}>
                        {S.NO_SUBDEPARTMENTS}
                      </Typography>
                    ) : (
                      <Stack spacing={1} sx={{ pl: 1.5, borderLeft: `2px solid ${deptColor}33` }}>
                        {department.subDepartments.map((subDept) => (
                          <Box key={`${department.id}-${subDept.id}-${subDept.name}`}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                              gap={1}
                              mb={0.35}
                            >
                              <Typography sx={{ fontSize: "0.74rem", fontWeight: 600, minWidth: 0 }}>
                                {subDept.name}
                              </Typography>
                              <StatusChip status={subDept.status} size="small" />
                            </Stack>
                            {subDept.progress > 0 ? (
                              <ProgressBar
                                value={subDept.progress}
                                color={deptColor}
                                trackColor={progressBar.trackColor}
                                valueColor={progressBar.valueColor}
                                showValue={false}
                                height={4}
                              />
                            ) : null}
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Box>
                );
              })
            )}
          </Stack>
        )}
      </Box>
    </Popover>
  );
};

export default BatchTrackingPopover;
