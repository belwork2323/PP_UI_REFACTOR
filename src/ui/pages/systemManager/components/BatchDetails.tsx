// src/pages/system_manager/components/BatchDetailPopup.jsx
//
// Batch row opens the popup; department stages load from batch-dept-stages API.
// Clicking a department loads sub-department timeline from batch-subdept-stages API.

import React, { useState, useEffect } from "react";
import { Box, Stack, Typography, IconButton, CircularProgress } from "@mui/material";
import Modal from "@mui/material/Modal";
import { icons } from "../../../../app/theme/icons";
import { STRINGS } from "../../../../app/config/strings";
import useBatchStages from "../../../../hooks/system_manager/useBatchStagesHook";
import useBatchSubDeptStages from "../../../../hooks/system_manager/useBatchSubDeptStagesHook";
import StatusChip from "../../../components/common/StatusChip";
import ProgressBar from "../../../components/common/ProgressBar";
import BatchSubDeptTimeline from "./BatchSubDeptTimeline";

const { Close, FiberManualRecord, Inventory2, Science, Verified, LocalShipping } =
  icons.systemManager;

const STAGE_ICON_MAP = {
  Inventory2,
  Science,
  Verified,
  LocalShipping,
};

const toDeptKey = (departmentName = "") => {
  const normalized = departmentName.toLowerCase();
  if (normalized.includes("source")) return "sourcing";
  if (normalized.includes("manufact")) return "manufacturing";
  if (normalized.includes("quality") || normalized.includes("qc")) return "quality";
  if (normalized.includes("dispatch")) return "dispatch";
  return normalized;
};

function resolveStageIcon(iconKey: string) {
  return STAGE_ICON_MAP[iconKey as keyof typeof STAGE_ICON_MAP] ?? Inventory2;
}

function StageStatusBadge({ status, t }) {
  const sb = t.stageBadge;
  return (
    <Box sx={sb.box(status)}>
      <FiberManualRecord sx={sb.dot(status)} />
      <Typography sx={sb.text(status)}>{status}</Typography>
    </Box>
  );
}

export default function BatchDetailPopup({ batch, stageConfig, onClose, t }) {
  const { batchStages, loading, error, fetchBatchStages } = useBatchStages();
  const {
    subDeptStages,
    loading: subDeptLoading,
    error: subDeptError,
    fetchSubDeptStages,
    reset: resetSubDeptStages,
  } = useBatchSubDeptStages();
  const [activeStageIdx, setActiveStageIdx] = useState(0);

  useEffect(() => {
    if (batch?.id || batch?.batchId) {
      const batchId = batch.batchId || batch.id;
      fetchBatchStages(batchId);
    }
  }, [batch?.id, batch?.batchId, fetchBatchStages]);

  useEffect(() => {
    setActiveStageIdx(0);
    resetSubDeptStages();
  }, [batch?.id, batch?.batchId, resetSubDeptStages]);

  const ph = t.popup.header;
  const ps = t.popup.sidebar;
  const pd = t.popup.detail;

  const data = batch
    ? {
        ...batch,
        ...(batchStages ?? {}),
        batchId: batchStages?.batchId || batch.batchId || batch.id,
        overallProgress:
          batchStages?.overallProgress ??
          batch.completion ??
          batch.pct ??
          batch.overallProgress ??
          0,
        createdOn: batchStages?.createdOn || batch.createdOn || batch.createdDate || "",
        ageInDays: batchStages?.ageInDays ?? batch.ageInDays ?? 0,
        status: batch.status || batchStages?.status || "In Progress",
        motorId: batch.motorId || batchStages?.motorId || "—",
        batchType: batch.batchType || batchStages?.batchType || batch.motorType || "—",
      }
    : null;

  const stages = batchStages?.stages ?? [];
  const activeStageMeta = stages[activeStageIdx];

  useEffect(() => {
    if (!data?.batchId || !activeStageMeta?.departmentId) {
      resetSubDeptStages();
      return;
    }
    fetchSubDeptStages(data.batchId, activeStageMeta.departmentId);
  }, [
    data?.batchId,
    activeStageMeta?.departmentId,
    fetchSubDeptStages,
    resetSubDeptStages,
  ]);

  if (!batch || !data) return null;

  const getStatusColor = t.popup.statusColor;

  const resolveStageVisuals = (departmentName: string) => {
    const key = toDeptKey(departmentName);
    const cfg = stageConfig?.find((item) => item.key === key);
    return {
      color: cfg?.color ?? getStatusColor("In Progress"),
      Icon: resolveStageIcon(cfg?.iconKey ?? "Inventory2"),
    };
  };

  const handleStageSelect = (idx: number) => {
    setActiveStageIdx(idx);
  };

  const activeVisuals = activeStageMeta
    ? resolveStageVisuals(activeStageMeta.departmentName)
    : null;

  return (
    <Modal open disableAutoFocus onClose={onClose} sx={t.popup.modal}>
      <Box
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        sx={t.popup.paper}
      >
        <Box sx={ph.wrapper}>
          <Stack direction="row" alignItems="center" gap={2}>
            <Box sx={ph.iconBox}>
              <Inventory2 sx={ph.icon} />
            </Box>
            <Box>
              <Stack direction="row" alignItems="center" gap={1.5}>
                <Typography sx={ph.batchId}>{data.batchId}</Typography>
                <StatusChip status={data.status} size="small" />
              </Stack>
              <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} mt={0.3}>
                <Typography sx={ph.motorLabel}>
                  {STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.MOTOR_ID}: {data.motorId}
                </Typography>
                <Typography sx={ph.bullet}>•</Typography>
                <Typography sx={ph.batchTypeLabel}>
                  {STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.BATCH_TYPE}: {data.batchType}
                </Typography>
                <Typography sx={ph.bullet}>•</Typography>
                <Typography sx={ph.createdOnLabel}>
                  {STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.CREATED_ON}:{" "}
                  {data.createdOn ? new Date(data.createdOn).toLocaleDateString() : "—"}
                </Typography>
                <Typography sx={ph.bullet}>•</Typography>
                <Typography sx={ph.batchAgeLabel}>
                  {STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.BATCH_AGE}: {data.ageInDays || 0} days
                </Typography>
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" gap={2}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography sx={ph.progressLabel}>
                {STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.OVERALL_PROGRESS}
              </Typography>
              <Typography sx={ph.progressValue}>{Math.round(data.overallProgress)}%</Typography>
            </Stack>
            <Box sx={ph.progressTrack}>
              <ProgressBar
                value={data.overallProgress}
                color={ph.progressBar.color}
                trackColor={ph.progressBar.trackColor}
                valueColor={ph.progressBar.valueColor}
                showValue={false}
                height={8}
              />
            </Box>
            <IconButton onClick={onClose} size="small" sx={ph.closeButton}>
              <Close sx={ph.closeIcon} />
            </IconButton>
          </Stack>
        </Box>

        <Box sx={t.popup.body}>
          <Box sx={ps.wrapper}>
            <Typography sx={ps.sectionLabel}>
              {STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.DEPARTMENTS}
            </Typography>

            {loading ? (
              <Box sx={pd.loadingBox}>
                <CircularProgress size={24} />
              </Box>
            ) : error ? (
              <Typography sx={pd.noStageDataText}>{error}</Typography>
            ) : (
              stages.map((stage, idx) => {
                const isActive = activeStageIdx === idx;
                const stageColor = getStatusColor(stage.status);
                const { Icon } = resolveStageVisuals(stage.departmentName);

                return (
                  <Box
                    key={stage.departmentId}
                    onClick={() => handleStageSelect(idx)}
                    sx={ps.item(isActive, stageColor)}
                  >
                    <Stack direction="row" alignItems="center" gap={1.5} mb={0.8}>
                      <Box sx={ps.iconBox(stageColor)}>
                        <Icon sx={ps.icon(isActive, stageColor)} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={ps.label(isActive)}>{stage.departmentName}</Typography>
                        <Typography sx={pd.stageDate}>
                          {stage.completionPercentage}
                          {STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.COMPLETE}
                        </Typography>
                      </Box>
                    </Stack>
                    <Box sx={ps.statusWrap}>
                      <StageStatusBadge status={stage.status} t={t} />
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>

          <Box sx={pd.wrapper}>
            {loading ? (
              <Box sx={pd.loadingBox}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Typography sx={pd.noStageDataText}>{error}</Typography>
            ) : activeStageMeta ? (
              <>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                  <Stack direction="row" alignItems="center" gap={1.5}>
                    {activeVisuals ? (
                      <Box sx={pd.stageIconBox(activeVisuals.color)}>
                        <activeVisuals.Icon sx={pd.stageIcon(activeVisuals.color)} />
                      </Box>
                    ) : null}
                    <Box>
                      <Typography sx={pd.stageTitle}>{activeStageMeta.departmentName}</Typography>
                      <Typography sx={pd.stageDate}>
                        {subDeptStages?.progressPercentage ?? activeStageMeta.completionPercentage}
                        {STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.COMPLETE}
                      </Typography>
                    </Box>
                  </Stack>
                  <StageStatusBadge status={activeStageMeta.status} t={t} />
                </Stack>

                <Box sx={{ mb: 3 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography sx={pd.riskLevelLabel}>
                      {STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.PROGRESS}
                    </Typography>
                    <Typography sx={pd.riskLevelValue}>
                      {subDeptStages?.progressPercentage ?? activeStageMeta.completionPercentage}%
                    </Typography>
                  </Stack>
                  <ProgressBar
                    value={subDeptStages?.progressPercentage ?? activeStageMeta.completionPercentage}
                    color={activeVisuals?.color ?? ph.progressBar.color}
                    trackColor={ph.progressBar.trackColor}
                    valueColor={ph.progressBar.valueColor}
                    showValue={false}
                    height={8}
                  />
                </Box>

                <BatchSubDeptTimeline
                  data={subDeptStages}
                  loading={subDeptLoading}
                  error={subDeptError}
                  t={t}
                  accentColor={activeVisuals?.color}
                />
              </>
            ) : (
              <Typography sx={pd.noStageDataText}>
                {STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.NO_STAGE_DATA}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
