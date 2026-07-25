import React, { useState } from "react";
import { Box, Stack, Typography, CircularProgress, Collapse } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ProgressBar from "../../../../components/common/ProgressBar";
import StatusChip from "../../../../components/common/StatusChip";
import {
  BatchSubDeptStagesModel,
  SubDeptStageItemModel,
  SubDeptTimelineEntry,
} from "../../../../../data/models/SystemManagerModel";
import { STRINGS } from "../../../../../app/config/strings";

const S = STRINGS.SYSTEM_MANAGER.BATCH_DETAILS;

const fmtDate = (value?: string | null) => {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return dt.toLocaleString();
};

function DetailRow({ label, value, tl }: { label: string; value: string; tl: any }) {
  return (
    <Box sx={tl.auditRow}>
      <Typography component="span" sx={tl.auditLabel}>
        {label}:
      </Typography>
      <Typography component="span" sx={tl.auditValue}>
        {value}
      </Typography>
    </Box>
  );
}

function AuditDetailsSection({ item, tl }: { item: SubDeptStageItemModel; tl: any }) {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={tl.auditPanel}>
      <Box sx={tl.auditToggle} onClick={() => setOpen((prev) => !prev)}>
        <Typography sx={tl.auditPanelTitle}>{S.AUDIT_DETAILS_SECTION_TITLE}</Typography>
        <KeyboardArrowDownIcon sx={tl.auditExpandIcon(open)} />
      </Box>
      <Collapse in={open} timeout={200} unmountOnExit>
        <Box sx={tl.auditBody}>
          <DetailRow label={S.SUBMITTED_BY} value={item.submittedBy?.displayName ?? "—"} tl={tl} />
          <DetailRow label={S.SUBMITTED_ON} value={fmtDate(item.submittedOn)} tl={tl} />
          <DetailRow label={S.APPROVED_BY} value={item.approvedBy?.displayName ?? "—"} tl={tl} />
          <DetailRow label={S.APPROVED_ON} value={fmtDate(item.approvedOn)} tl={tl} />
          <DetailRow label={S.APPROVER_REMARKS} value={item.remarks ?? "—"} tl={tl} />
        </Box>
      </Collapse>
    </Box>
  );
}

function StageHighlightSummary({ item, tl }: { item: SubDeptStageItemModel; tl: any }) {
  return (
    <Box sx={tl.currentStageItem}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} mb={0.5}>
        <Typography sx={tl.entryTitle}>{item.subDepartmentName}</Typography>
        <StatusChip status={item.status} size="small" />
      </Stack>
      <Typography sx={tl.metaText}>
        {S.SUBMITTED_BY}: {item.submittedBy?.displayName ?? "—"} · {S.APPROVED_BY}:{" "}
        {item.approvedBy?.displayName ?? "—"}
      </Typography>
      {item.remarks ? (
        <Typography sx={{ ...tl.metaText, mt: 0.35 }}>
          {S.APPROVER_REMARKS}: {item.remarks}
        </Typography>
      ) : null}
    </Box>
  );
}

function TimelineEntryCard({
  entry,
  isLast,
  tl,
  progressColors,
}: {
  entry: SubDeptTimelineEntry;
  isLast: boolean;
  tl: any;
  progressColors: { color: string; track: string; value: string };
}) {
  const { item, variant, name } = entry;
  const progress = item.displayProgress;

  return (
    <Box sx={tl.timelineItem}>
      <Box sx={tl.timelineRail}>
        {variant === "done" ? (
          <Box sx={tl.timelineDotDone} />
        ) : (
          <Box sx={tl.timelineDotActive}>
            <Box sx={tl.timelineDotActiveInner} />
          </Box>
        )}
        {!isLast && <Box sx={tl.timelineConnector(variant)} />}
      </Box>

      <Box sx={tl.entryCard(variant)}>
        <Box sx={tl.entryHeader}>
          <Typography sx={tl.entryTitle}>{name}</Typography>
          <StatusChip status={item.status} size="small" />
        </Box>

        {progress > 0 ? (
          <Box sx={tl.entryProgressTrack}>
            <Stack direction="row" justifyContent="space-between" mb={0.5}>
              <Typography sx={tl.metaText}>{S.PROGRESS}</Typography>
              <Typography sx={tl.entryPct}>{progress}%</Typography>
            </Stack>
            <ProgressBar
              value={progress}
              color={progressColors.color}
              trackColor={progressColors.track}
              valueColor={progressColors.value}
              showValue={false}
              height={6}
            />
          </Box>
        ) : null}

        {(item.formId || item.formStatus) && (
          <Box sx={tl.metaChipsRow}>
            {item.formId ? (
              <Box component="span" sx={tl.metaChip}>
                {S.FORM_ID}: {item.formId}
              </Box>
            ) : null}
            {item.formStatus ? (
              <Box component="span" sx={tl.metaChip}>
                {S.FORM_STATUS}: {item.formStatus}
              </Box>
            ) : null}
          </Box>
        )}

        <AuditDetailsSection item={item} tl={tl} />
      </Box>
    </Box>
  );
}

type Props = {
  data: BatchSubDeptStagesModel | null;
  loading: boolean;
  error: string | null;
  t: any;
  accentColor?: string;
};

export default function BatchSubDeptTimeline({ data, loading, error, t, accentColor }: Props) {
  const tl = t.popup.detail.subDeptTimeline;
  const ph = t.popup.header.progressBar;
  const progressColors = {
    color: accentColor ?? ph.color,
    track: ph.trackColor,
    value: ph.valueColor,
  };

  if (loading) {
    return (
      <Box sx={t.popup.detail.loadingBox}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return <Typography sx={t.popup.detail.noStageDataText}>{error}</Typography>;
  }

  if (!data) {
    return <Typography sx={t.popup.detail.noStageDataText}>{S.NO_STAGE_DATA}</Typography>;
  }

  const entries = data.timelineEntries;

  return (
    <Box>
      <Stack direction="row" gap={2} flexWrap="wrap" sx={tl.metaRow}>
        <Typography sx={tl.metaText}>
          {S.PROGRESS}: {Math.round(data.progressPercentage)}%
        </Typography>
        <Typography sx={tl.metaText}>
          {S.CREATED_ON}: {fmtDate(data.createdOn)}
        </Typography>
        <Typography sx={tl.metaText}>
          {S.LAST_UPDATED_ON}: {fmtDate(data.lastUpdatedOn)}
        </Typography>
      </Stack>

      {data.currentStage.length > 0 ? (
        <Box sx={tl.currentStageBanner}>
          <Typography sx={tl.currentStageLabel}>{S.CURRENT_STAGE}</Typography>
          {data.currentStage.map((item) => (
            <StageHighlightSummary key={`current-${item.subDepartmentId}`} item={item} tl={tl} />
          ))}
        </Box>
      ) : null}

      {data.lastUpdatedStage ? (
        <Box sx={tl.lastUpdatedBanner}>
          <Typography sx={tl.lastUpdatedLabel}>{S.LAST_UPDATED_STAGE}</Typography>
          <StageHighlightSummary
            key={`last-updated-${data.lastUpdatedStage.subDepartmentId}`}
            item={data.lastUpdatedStage}
            tl={tl}
          />
        </Box>
      ) : null}

      <Box sx={tl.timelineWrap}>
        <Typography sx={tl.timelineHeader}>{S.STAGE_TIMELINE}</Typography>

        {entries.length === 0 ? (
          <Typography sx={t.popup.detail.noStageDataText}>{S.NO_STAGE_DATA}</Typography>
        ) : (
          entries.map((entry, index) => (
            <TimelineEntryCard
              key={entry.key}
              entry={entry}
              isLast={index === entries.length - 1}
              tl={tl}
              progressColors={progressColors}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
