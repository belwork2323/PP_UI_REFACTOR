import React from "react";
import { Box, Stack, Typography, IconButton, Collapse } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ProgressBar from "../../../components/common/ProgressBar";
import StatusChip from "../../../components/common/StatusChip";

type StageItem = {
  subDepartmentId?: number;
  subDepartmentName?: string;
  status?: string;
};

type BatchStatusRow = {
  batchId?: string;
  motorId?: string;
  projectName?: string;
  progressPercentage?: number;
  createdDate?: string;
  lastUpdatedOn?: string | null;
  lastUpdatedStage?: StageItem | null;
  currentStage?: StageItem[];
  stageHistory?: StageItem[];
};

type Props = {
  rows: BatchStatusRow[];
  t: any;
  strings: any;
  expandedBatchId: string | null;
  onToggle: (batchId: string) => void;
};

type TimelineEntry = {
  name: string;
  status: string;
  variant: "done" | "active";
};

const fmtDate = (value?: string | null) => {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return dt.toLocaleString();
};

function buildTimeline(history: StageItem[], current: StageItem[]): TimelineEntry[] {
  return [
    ...history.map((s) => ({
      name: s.subDepartmentName || "-",
      status: s.status || "-",
      variant: "done" as const,
    })),
    ...current.map((s) => ({
      name: s.subDepartmentName || "-",
      status: s.status || "-",
      variant: "active" as const,
    })),
  ];
}

function isFirstStageBatch(
  history: StageItem[],
  current: StageItem[],
  last: StageItem | null | undefined
): boolean {
  if (history.length > 0 || !current.length) return false;
  // No history at all → first stage. Confirm by checking last-updated
  // matches one of the current-stage entries (same sub-dept).
  if (!last) return true;
  return current.some(
    (s) =>
      (s.subDepartmentId && s.subDepartmentId === last.subDepartmentId) ||
      s.subDepartmentName === last.subDepartmentName
  );
}

// ── Timeline renderer ─────────────────────────────────────────────────────────
function StageTimeline({
  entries,
  showFirstBadgeAt,
  sd,
  strings,
}: {
  entries: TimelineEntry[];
  showFirstBadgeAt: number | null;
  sd: any;
  strings: any;
}) {
  if (!entries.length) {
    return <Typography sx={sd.timelineEmpty}>{strings.NO_STAGE_DATA}</Typography>;
  }

  return (
    <Box>
      {entries.map((entry, i) => {
        const isLast = i === entries.length - 1;
        return (
          <Box key={i} sx={sd.timelineItem}>
            {/* Rail: dot + connector */}
            <Box sx={sd.timelineRail}>
              {entry.variant === "done" ? (
                <Box sx={sd.timelineDotDone} />
              ) : (
                <Box sx={sd.timelineDotActive}>
                  <Box sx={sd.timelineDotActiveInner} />
                </Box>
              )}
              {!isLast && <Box sx={sd.timelineConnector(entry.variant)} />}
            </Box>

            {/* Content */}
            <Box sx={sd.timelineContent(isLast)}>
              <Typography sx={sd.timelineStageName}>{entry.name}</Typography>
              <Box sx={sd.timelineStageRow}>
                <StatusChip status={entry.status} size="small" />
                {i === showFirstBadgeAt && (
                  <Box component="span" sx={sd.timelineFirstBadge}>
                    {strings.FIRST_STAGE_BADGE}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function BatchStatusDetailsPanel({
  rows,
  t,
  strings,
  expandedBatchId,
  onToggle,
}: Props) {
  const sd = t.batchStatusDetails;

  if (!rows.length) {
    return <Typography sx={sd.emptyText}>{strings.EMPTY}</Typography>;
  }

  return (
    <Stack spacing={1.25}>
      {rows.map((row, idx) => {
        const batchId = row.batchId || `batch-${idx}`;
        const history = Array.isArray(row.stageHistory) ? row.stageHistory : [];
        const current = Array.isArray(row.currentStage) ? row.currentStage : [];
        const last = row.lastUpdatedStage;
        const isOpen = expandedBatchId === batchId;

        const entries = buildTimeline(history, current);
        const isFirst = isFirstStageBatch(history, current, last);
        // The first active node index in the merged entries array
        const firstActiveIdx = isFirst ? history.length : null;

        return (
          <Box key={batchId} sx={sd.card}>
            {/* ── Card header ── */}
            <Box sx={sd.cardHeader}>
              <Box>
                <Typography sx={sd.batchId}>{row.batchId || "-"}</Typography>
                <Typography sx={sd.metaText}>
                  {strings.MOTOR_ID}: {row.motorId || "-"}
                </Typography>
                <Typography sx={sd.metaText}>{row.projectName || "-"}</Typography>
              </Box>

              <Stack direction="row" alignItems="center" gap={1}>
                <Typography sx={sd.progressText}>
                  {Math.round(row.progressPercentage || 0)}%
                </Typography>
                <IconButton
                  size="small"
                  sx={sd.expandBtn}
                  onClick={() => onToggle(batchId)}
                >
                  <KeyboardArrowDownIcon sx={sd.expandIcon(isOpen)} />
                </IconButton>
              </Stack>
            </Box>

            {/* ── Progress bar ── */}
            <Box sx={sd.progressWrap}>
              <ProgressBar
                value={row.progressPercentage || 0}
                color={sd.progressBar.color}
                trackColor={sd.progressBar.trackColor}
                valueColor={sd.progressBar.valueColor}
                showValue={false}
                height={6}
              />
            </Box>

            {/* ── Date meta row ── */}
            <Stack direction="row" gap={2} flexWrap="wrap" sx={sd.topMetaRow}>
              <Typography sx={sd.metaText}>
                {strings.CREATED_ON}: {fmtDate(row.createdDate)}
              </Typography>
              <Typography sx={sd.metaText}>
                {strings.LAST_UPDATED_ON}: {fmtDate(row.lastUpdatedOn)}
              </Typography>
            </Stack>

            {/* ── Expandable stage timeline ── */}
            <Collapse in={isOpen} timeout={200} unmountOnExit>
              <Box sx={sd.timelineWrap}>
                <Typography sx={sd.timelineHeader}>{strings.STAGE_TIMELINE}</Typography>
                <StageTimeline
                  entries={entries}
                  showFirstBadgeAt={firstActiveIdx}
                  sd={sd}
                  strings={strings}
                />
              </Box>
            </Collapse>
          </Box>
        );
      })}
    </Stack>
  );
}
