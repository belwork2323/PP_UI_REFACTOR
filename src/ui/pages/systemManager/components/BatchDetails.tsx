// src/pages/system_manager/components/BatchDetailPopup.jsx
//
// All data (stage config + batch detail) is now fetched via the controller.
// The component receives:
//   • batch       — the active-batch row object (id, status, pct, color)
//   • stageConfig — stage config fetched by the dashboard hook
//   • onClose     — close handler
//   • t           — theme tokens

import React, { useState, useEffect } from "react";
import {
  Box, Stack, Typography, IconButton, CircularProgress, Collapse,
} from "@mui/material";
import Modal from "@mui/material/Modal";
import { icons } from "../../../../app/theme/icons";
import { STRINGS } from "../../../../app/config/strings";
import useBatchStages from "../../../../hooks/system_manager/useBatchStagesHook";
import useBatchSubDeptDetails from "../../../../hooks/system_manager/useBatchSubDeptDetailsHook";
import StatusChip from "../../../components/common/StatusChip";
import ProgressBar from "../../../components/common/ProgressBar";
import SectionHeader from "../../../components/common/SectionHeader";
import SubDeptDetails from "./SubDeptDetails";

const {
  Close,
  FiberManualRecord,
  Inventory2,
} = icons.systemManager;

// ── Stage status badge ────────────────────────────────────────────────────────
function StageStatusBadge({ status, t }) {
  const sb = t.stageBadge;
  return (
    <Box sx={sb.box(status)}>
      <FiberManualRecord sx={sb.dot(status)} />
      <Typography sx={sb.text(status)}>{status}</Typography>
    </Box>
  );
}

// ── Main popup ────────────────────────────────────────────────────────────────
export default function BatchDetailPopup({ batch, stageConfig, onClose, t }) {
  const { batchStages, loading, fetchBatchStages } = useBatchStages();
  const { details: subDeptDetails, loading: subDeptLoading, error: subDeptError, fetchDetails, reset: resetSubDept } = useBatchSubDeptDetails();
  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [expandedSubDeptId, setExpandedSubDeptId] = useState<number | null>(null);

  // Fetch batch stages when batch ID changes
  useEffect(() => {
    if (batch?.id || batch?.batchId) {
      const batchId = batch.batchId || batch.id;
      fetchBatchStages(batchId);
    }
  }, [batch?.id, batch?.batchId, fetchBatchStages]);

  const ph = t.popup.header;
  const ps = t.popup.sidebar;
  const pd = t.popup.detail;

  if (!batch || loading) {
    return (
      <Modal open onClose={onClose} sx={t.popup.modal}>
        <Box onClick={(e) => e.stopPropagation()} sx={t.popup.paper}>
          <Box sx={pd.loadingBox}>
            <CircularProgress />
          </Box>
        </Box>
      </Modal>
    );
  }

  const data = batchStages ?? batch;
  const stages = batchStages?.stages ?? [];
  const activeStageMeta = stages[activeStageIdx];
  const getStatusColor = t.popup.statusColor;

  const toggleSubDept = (subDeptId: number) => {
    if (expandedSubDeptId === subDeptId) {
      setExpandedSubDeptId(null);
      resetSubDept();
    } else {
      setExpandedSubDeptId(subDeptId);
      const batchId = data.batchId || batch?.batchId || batch?.id;
      if (batchId) fetchDetails(batchId, subDeptId);
    }
  };

  return (
    <Modal open onClose={onClose} sx={t.popup.modal}>
      <Box onClick={(e) => e.stopPropagation()} sx={t.popup.paper}>
        {/* ── Header ── */}
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
                <Typography sx={ph.motorLabel}>{STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.MOTOR_ID}: {data.motorId}</Typography>
                <Typography sx={ph.bullet}>•</Typography>
                <Typography sx={ph.motorTypeLabel}>{STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.MOTOR_TYPE}: {data.batchType || "—"}</Typography>
                <Typography sx={ph.bullet}>•</Typography>
                <Typography sx={ph.batchTypeLabel}>{STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.BATCH_TYPE}: {data.batchType || "—"}</Typography>
                <Typography sx={ph.bullet}>•</Typography>
                <Typography sx={ph.assignedToLabel}>{STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.ASSIGNED_TO}: {data.assignedTo?.name || data.assignedTo?.username || "—"}</Typography>
                <Typography sx={ph.bullet}>•</Typography>
                <Typography sx={ph.createdOnLabel}>{STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.CREATED_ON}: {data.createdOn ? new Date(data.createdOn).toLocaleDateString() : "—"}</Typography>
                <Typography sx={ph.bullet}>•</Typography>
                <Typography sx={ph.batchAgeLabel}>{STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.BATCH_AGE}: {data.ageInDays || 0} days</Typography>
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" gap={2}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Typography sx={ph.progressLabel}>{STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.OVERALL_PROGRESS}</Typography>
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

        {/* ── Body ── */}
        <Box sx={t.popup.body}>
          {/* ── Department Sidebar ── */}
          <Box sx={ps.wrapper}>
            <Typography sx={ps.sectionLabel}>{STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.DEPARTMENTS}</Typography>

            {stages.map((stage, idx) => {
              const isActive = activeStageIdx === idx;
              const stageColor = getStatusColor(stage.status);

              return (
                <Box key={stage.departmentId} onClick={() => setActiveStageIdx(idx)} sx={ps.item(isActive, stageColor)}>
                  <Stack direction="row" alignItems="center" gap={1.5} mb={0.8}>
                    <Box sx={ps.iconBox(stageColor)}>
                      <Inventory2 sx={ps.icon(isActive, stageColor)} />
                    </Box>
                    <Typography sx={ps.label(isActive)}>{stage.departmentName}</Typography>
                  </Stack>
                  <Box sx={ps.statusWrap}>
                    <StageStatusBadge status={stage.status} t={t} />
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* ── Stage Detail Pane ── */}
          <Box sx={pd.wrapper}>
            {activeStageMeta ? (
              <>
                {/* Department Header */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                  <Stack direction="row" alignItems="center" gap={1.5}>
                    <Box sx={pd.stageIconBox(getStatusColor(activeStageMeta.status))}>
                      <Inventory2 sx={pd.stageIcon(getStatusColor(activeStageMeta.status))} />
                    </Box>
                    <Box>
                      <Typography sx={pd.stageTitle}>{activeStageMeta.departmentName}</Typography>
                      <Typography sx={pd.stageDate}>{activeStageMeta.completionPercentage}{STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.COMPLETE}</Typography>
                    </Box>
                  </Stack>
                  <StageStatusBadge status={activeStageMeta.status} t={t} />
                </Stack>

                {/* Risk Level & Status */}
                <Stack direction="row" gap={2} mb={2.5}>
                  <Box sx={pd.riskLevelBox}>
                    <Typography sx={pd.riskLevelLabel}>{STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.RISK_LEVEL}</Typography>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Box sx={pd.riskLevelDot(getStatusColor(activeStageMeta.riskLevel))} />
                      <Typography sx={pd.riskLevelValue}>{activeStageMeta.riskLevel}</Typography>
                    </Stack>
                  </Box>
                </Stack>

                {/* Sub-Departments */}
                <SectionHeader title={STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.SUB_STAGES} titleSx={pd.subSectionHeader} />
                <Stack spacing={1}>
                  {activeStageMeta.subDepartments.map((subDept) => (
                    <Box key={subDept.subDepartmentId}>
                      <Box
                        onClick={() => toggleSubDept(subDept.subDepartmentId)}
                        sx={pd.subDeptItemBox(expandedSubDeptId === subDept.subDepartmentId)}
                      >
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" gap={1.5}>
                            <Box sx={pd.subDeptItemDot(getStatusColor(subDept.status))} />
                            <Typography sx={pd.subDeptItemName}>{subDept.name}</Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" gap={1}>
                            <Typography sx={pd.subDeptItemPercentage}>{subDept.completionPercentage}%</Typography>
                            <Typography sx={pd.subDeptItemToggle(expandedSubDeptId === subDept.subDepartmentId)}>
                              {expandedSubDeptId === subDept.subDepartmentId ? "−" : "+"}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Box>

                      {/* Sub-Department Details Panel */}
                      <Collapse in={expandedSubDeptId === subDept.subDepartmentId} timeout={200}>
                        <Box sx={pd.subDeptDetailsWrapper}>
                          <SubDeptDetails
                            details={subDeptDetails}
                            loading={subDeptLoading}
                            error={subDeptError}
                            onRetry={() => {
                              const batchId = data.batchId || batch?.batchId || batch?.id;
                              if (batchId) fetchDetails(batchId, subDept.subDepartmentId);
                            }}
                            t={t}
                          />
                        </Box>
                      </Collapse>
                    </Box>
                  ))}
                </Stack>
              </>
            ) : (
              <Typography sx={pd.noStageDataText}>{STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.NO_STAGE_DATA}</Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}