// src/ui/pages/systemManager/components/SubDeptDetails.tsx
// Sub-Department Batch Details panel — all styles from t.sd (theme tokens).
// Rendered inside BatchDetails when a sub-department is expanded.

import React from "react";
import { Box, Stack, Typography, CircularProgress } from "@mui/material";
import StatusChip from "../../../components/common/StatusChip";
import ProgressBar from "../../../components/common/ProgressBar";
import { STRINGS } from "../../../../app/config/strings";
import { BatchSubDeptDetailsModel } from "../../../../data/models/SystemManagerModel";
import useSubDeptDetailsViewModel from "../../../../hooks/system_manager/useSubDeptDetailsViewModel";

const BD = STRINGS.SYSTEM_MANAGER.BATCH_DETAILS;
const NO_DATA_TEXT = BD.NO_DATA_AVAILABLE;
const SDL = BD.SUB_DEPT;

// ── helpers ──────────────────────────────────────────────────────────────────
function fmt(isoDate: string | null) {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatActor(actor: { username?: string; role?: string } | null) {
  if (!actor?.username) return "—";
  return actor.role ? `${actor.username} (${actor.role})` : actor.username;
}

function DetailSection({ title, empty, sd, children }: {
  title: string;
  empty: boolean;
  sd: any;
  children: React.ReactNode;
}) {
  return (
    <Box sx={sd.sectionCard}>
      <Typography sx={sd.sectionTitle}>{title}</Typography>
      {empty && <Typography sx={sd.emptyText}>{NO_DATA_TEXT}</Typography>}
      {children}
    </Box>
  );
}

function NoticeBanner({ tone, title, body, sd, action }: {
  tone: "warn" | "failed";
  title: string;
  body: string;
  sd: any;
  action?: React.ReactNode;
}) {
  return (
    <Box sx={sd.noticeBox(tone)}>
      <Typography sx={sd.noticeTitle(tone)}>{title}</Typography>
      <Typography sx={sd.noticeText}>{body}</Typography>
      {action}
    </Box>
  );
}

function SnapshotSection({ viewModel, sd }: { viewModel: ReturnType<typeof useSubDeptDetailsViewModel>; sd: any }) {
  return (
    <Box sx={sd.heroCard}>
      <Box sx={sd.heroHeader}>
        <Box sx={sd.heroTitleBlock}>
          <Typography sx={sd.heroTitle}>{viewModel.title}</Typography>
          <Typography sx={sd.heroSubtitle}>{viewModel.subtitle || SDL.SUBTITLE}</Typography>
        </Box>
        <StatusChip status={viewModel.status} size="small" />
      </Box>

      <Box sx={sd.heroMetaRow}>
        <Box sx={sd.heroMetaCard}>
          <Typography sx={sd.heroMetaLabel}>{SDL.CURRENT_STATUS}</Typography>
          <Typography sx={sd.heroMetaValue}>{viewModel.status}</Typography>
        </Box>
        <Box sx={sd.heroMetaCard}>
          <Typography sx={sd.heroMetaLabel}>{SDL.APPROVAL_STATE}</Typography>
          <Typography sx={sd.heroMetaValue}>{viewModel.approvalState}</Typography>
        </Box>
        <Box sx={sd.heroMetaCard}>
          <Typography sx={sd.heroMetaLabel}>{SDL.SUBMISSION_STATE}</Typography>
          <Typography sx={sd.heroMetaValue}>{viewModel.submissionState}</Typography>
        </Box>
        <Box sx={sd.heroMetaCard}>
          <Typography sx={sd.heroMetaLabel}>{SDL.LAST_ACTIVITY}</Typography>
          <Typography sx={sd.heroMetaValue}>{viewModel.lastActivity}</Typography>
        </Box>
      </Box>

      <Box sx={sd.summaryGrid}>
        <Box sx={sd.summaryCard("info")}>
          <Typography sx={sd.summaryValue("info")}>{viewModel.materialsTracked}</Typography>
          <Typography sx={sd.summaryLabel}>{viewModel.trackedSummaryLabel}</Typography>
          <Typography sx={sd.summaryMeta}>{viewModel.safeDetails.progressInsights.filledSpecs}/{viewModel.safeDetails.progressInsights.totalSpecs || 0} {SDL.FILLED_SPECS.toLowerCase()}</Typography>
        </Box>
        <Box sx={sd.summaryCard("passed")}>
          <Typography sx={sd.summaryValue("passed")}>{viewModel.testsExecuted}</Typography>
          <Typography sx={sd.summaryLabel}>{SDL.TESTS_EXECUTED}</Typography>
          <Typography sx={sd.summaryMeta}>{viewModel.safeDetails.qualityInsights.passRate}% {SDL.PASS_RATE.toLowerCase()}</Typography>
        </Box>
        <Box sx={sd.summaryCard("warn")}>
          <Typography sx={sd.summaryValue("warn")}>{viewModel.timelineEvents}</Typography>
          <Typography sx={sd.summaryLabel}>{SDL.TIMELINE_EVENTS}</Typography>
          <Typography sx={sd.summaryMeta}>{viewModel.lastActor}</Typography>
        </Box>
        <Box sx={sd.summaryCard("neutral")}>
          <Typography sx={sd.summaryValue("neutral")}>{viewModel.documentCount}</Typography>
          <Typography sx={sd.summaryLabel}>{SDL.DOCUMENT_COUNT}</Typography>
          <Typography sx={sd.summaryMeta}>{viewModel.safeDetails.documents[0]?.documentType || NO_DATA_TEXT}</Typography>
        </Box>
        <Box sx={sd.summaryCard(viewModel.materialFailures > 0 ? "failed" : "passed")}>
          <Typography sx={sd.summaryValue(viewModel.materialFailures > 0 ? "failed" : "passed")}>{viewModel.materialFailures}</Typography>
          <Typography sx={sd.summaryLabel}>{SDL.MATERIAL_FAILURES}</Typography>
          <Typography sx={sd.summaryMeta}>{viewModel.safeDetails.riskInsights.riskLevel} risk</Typography>
        </Box>
      </Box>
    </Box>
  );
}

function OverviewSection({ data, viewModel, sd }: {
  data: BatchSubDeptDetailsModel;
  viewModel: ReturnType<typeof useSubDeptDetailsViewModel>;
  sd: any;
}) {
  return (
    <Box sx={sd.overviewGrid}>
      <Box sx={sd.overviewCard}>
        <Typography sx={sd.overviewTitle}>{SDL.SUBMISSION_INFO}</Typography>
        <InfoRow label={SDL.SUBMITTED_BY} value={viewModel.submittedByLabel} sd={sd} />
        <InfoRow label={SDL.SUBMITTED_ON} value={fmt(data.submittedOn)} sd={sd} />
        <InfoRow label={SDL.APPROVED_BY} value={viewModel.approvedByLabel} sd={sd} />
        <InfoRow label={SDL.APPROVED_ON} value={fmt(data.approvedOn)} sd={sd} />
        <InfoRow label={SDL.REJECTED_BY} value={viewModel.rejectedByLabel} sd={sd} />
        <InfoRow label={SDL.REJECTED_ON} value={fmt(data.rejectedOn)} sd={sd} />
      </Box>

      <Box sx={sd.overviewCard}>
        <Typography sx={sd.overviewTitle}>{SDL.READINESS}</Typography>
        <Box sx={sd.readinessGrid}>
          <Box sx={sd.readinessItem("passed", viewModel.readiness.readyForApproval)}>
            <Typography sx={sd.readinessLabel}>{SDL.READY_FOR_APPROVAL}</Typography>
            <Typography sx={sd.readinessValue("passed")}>
              {viewModel.readiness.readyForApproval ? SDL.READY_FOR_APPROVAL : SDL.NOT_READY_FOR_APPROVAL}
            </Typography>
          </Box>
          <Box sx={sd.readinessItem("info", viewModel.readiness.allLotsEntered)}>
            <Typography sx={sd.readinessLabel}>{SDL.ALL_LOTS_ENTERED}</Typography>
            <Typography sx={sd.readinessValue("info")}>
              {viewModel.readiness.allLotsEntered ? SDL.ALL_LOTS_ENTERED : SDL.LOTS_PENDING}
            </Typography>
          </Box>
          <Box sx={sd.readinessItem("warn", viewModel.readiness.approvalPending)}>
            <Typography sx={sd.readinessLabel}>{SDL.APPROVAL_PENDING}</Typography>
            <Typography sx={sd.readinessValue("warn")}>
              {viewModel.readiness.approvalPending ? SDL.APPROVAL_PENDING : SDL.APPROVAL_NOT_PENDING}
            </Typography>
          </Box>
          <Box sx={sd.readinessItem(viewModel.readiness.reworkRequired ? "failed" : "passed", viewModel.readiness.reworkRequired)}>
            <Typography sx={sd.readinessLabel}>{SDL.REWORK_REQUIRED}</Typography>
            <Typography sx={sd.readinessValue(viewModel.readiness.reworkRequired ? "failed" : "passed")}>
              {viewModel.readiness.reworkRequired ? SDL.REWORK_REQUIRED : SDL.NO_REWORK_REQUIRED}
            </Typography>
          </Box>
        </Box>
        <InfoRow label={SDL.RESUBMISSIONS} value={viewModel.readiness.resubmissionCount} sd={sd} />
      </Box>
    </Box>
  );
}

export function InfoRow({ label, value, sd }: { label: string; value: React.ReactNode; sd: any }) {
  return (
    <Box sx={sd.infoRow}>
      <Typography sx={sd.infoLabel}>{label}</Typography>
      <Typography sx={sd.infoValue}>{value}</Typography>
    </Box>
  );
}

// ── Progress Insights section ─────────────────────────────────────────────────
export function ProgressSection({ data, sd }: { data: BatchSubDeptDetailsModel; sd: any }) {
  const pi = data.progressInsights;
  const hasProgressData = pi.totalSpecs > 0 || pi.materialsCount > 0 || pi.filledSpecs > 0;
  return (
    <DetailSection title={SDL.PROGRESS_INSIGHTS} empty={!hasProgressData} sd={sd}>
      <Box sx={sd.kpiGrid}>
        <Box sx={sd.kpiBox(sd.colors.info)}>
          <Typography sx={sd.kpiValue(sd.colors.info)}>{pi.filledSpecs}</Typography>
          <Typography sx={sd.kpiLabel}>{SDL.FILLED_SPECS} / {pi.totalSpecs}</Typography>
        </Box>
        <Box sx={sd.kpiBox(sd.colors.passed)}>
          <Typography sx={sd.kpiValue(sd.colors.passed)}>{pi.completionPercentage}%</Typography>
          <Typography sx={sd.kpiLabel}>{SDL.COMPLETION}</Typography>
        </Box>
        <Box sx={sd.kpiBox(sd.colors.warn)}>
          <Typography sx={sd.kpiValue(sd.colors.warn)}>{pi.materialsCount}</Typography>
          <Typography sx={sd.kpiLabel}>{SDL.MATERIALS}</Typography>
        </Box>
      </Box>
      <Box sx={sd.progressWrap}>
        <ProgressBar
          value={pi.completionPercentage}
          color={sd.colors.passed}
          trackColor={sd.colors.progressTrack}
          valueColor={sd.colors.neutral}
          height={6}
          showValue={false}
        />
      </Box>
      <Stack direction="row" gap={1} sx={sd.flagRow}>
        {pi.allLotsEntered && (
          <Typography sx={sd.flagText(sd.colors.passed)}>✓ All Lots Entered</Typography>
        )}
        {pi.isReadyForApproval && (
          <Typography sx={sd.flagText(sd.colors.info)}>✓ Ready for Approval</Typography>
        )}
      </Stack>
    </DetailSection>
  );
}

// ── Quality Insights section ──────────────────────────────────────────────────
export function QualitySection({ data, sd }: { data: BatchSubDeptDetailsModel; sd: any }) {
  const qi = data.qualityInsights;
  const failColor = qi.failed > 0 ? sd.colors.failed : sd.colors.neutral;
  const hasQualityData = qi.totalTests > 0 || qi.passed > 0 || qi.failed > 0 || qi.nonConformances.length > 0;
  return (
    <DetailSection title={SDL.QUALITY_INSIGHTS} empty={!hasQualityData} sd={sd}>
      <Box sx={sd.kpiGrid}>
        <Box sx={sd.kpiBox(sd.colors.info)}>
          <Typography sx={sd.kpiValue(sd.colors.info)}>{qi.totalTests}</Typography>
          <Typography sx={sd.kpiLabel}>{SDL.TOTAL_TESTS}</Typography>
        </Box>
        <Box sx={sd.kpiBox(sd.colors.passed)}>
          <Typography sx={sd.kpiValue(sd.colors.passed)}>{qi.passed}</Typography>
          <Typography sx={sd.kpiLabel}>{SDL.PASSED}</Typography>
        </Box>
        <Box sx={sd.kpiBox(failColor)}>
          <Typography sx={sd.kpiValue(failColor)}>{qi.failed}</Typography>
          <Typography sx={sd.kpiLabel}>{SDL.FAILED}</Typography>
        </Box>
      </Box>
      <Box sx={sd.progressWrap}>
        <ProgressBar
          value={qi.passRate}
          color={sd.colors.passed}
          trackColor={sd.colors.progressTrack}
          valueColor={sd.colors.neutral}
          height={6}
          showValue={false}
        />
      </Box>
      <Typography sx={sd.noteText}>{SDL.PASS_RATE}: {qi.passRate}%</Typography>
      {qi.nonConformances.length > 0 && (
        <Box sx={sd.flagBoxLargeMargin(sd.colors.failed)}>
          <Typography sx={sd.flagText(sd.colors.failed)}>⚠ {qi.nonConformances.length} Non-Conformance(s)</Typography>
        </Box>
      )}
    </DetailSection>
  );
}

// ── Workflow & Risk section ───────────────────────────────────────────────────
export function WorkflowRiskSection({ data, sd }: { data: BatchSubDeptDetailsModel; sd: any }) {
  const wi = data.workflowInsights;
  const ri  = data.riskInsights;
  const di  = data.delayInsights;
  const hasWorkflowData = Boolean(
    wi.currentStatus ||
    wi.rejectionReason ||
    wi.reworkRequired ||
    wi.resubmissionCount > 0 ||
    di.isDelayed ||
    ri.riskFactors.length > 0
  );
  return (
    <DetailSection title={SDL.WORKFLOW_AND_RISK} empty={!hasWorkflowData} sd={sd}>
      <Box sx={sd.infoRow}>
        <Typography sx={sd.infoLabel}>{SDL.CURRENT_STATUS}</Typography>
        <StatusChip status={wi.currentStatus} size="small" />
      </Box>
      <InfoRow label="Risk Level" value={
        <Box component="span" sx={sd.riskScoreBadge(ri.riskLevel)}>
          {ri.riskLevel} ({ri.riskScore})
        </Box>
      } sd={sd} />
      {wi.rejectionReason && (
        <Box sx={sd.flagBoxWithMargin(sd.colors.failed)}>
          <Typography sx={sd.flagText(sd.colors.failed)}>✕ Rejected: {wi.rejectionReason}</Typography>
        </Box>
      )}
      {wi.reworkRequired && (
        <Box sx={sd.flagBoxWithMargin(sd.colors.warn)}>
          <Typography sx={sd.flagText(sd.colors.warn)}>⟳ Rework Required</Typography>
        </Box>
      )}
      {wi.resubmissionCount > 0 && (
        <Box sx={sd.flagBoxWithMargin(sd.colors.warn)}>
          <Typography sx={sd.flagText(sd.colors.warn)}>Resubmissions: {wi.resubmissionCount}</Typography>
        </Box>
      )}
      {di.isDelayed && (
        <Box sx={sd.flagBoxWithMargin(sd.colors.failed)}>
          <Typography sx={sd.flagText(sd.colors.failed)}>
            ⏱ Delayed {di.delayInHours}h{di.delayReason ? ` — ${di.delayReason}` : ""}
          </Typography>
        </Box>
      )}
      {ri.riskFactors.length > 0 && (
        <Box sx={sd.flagList}>
          {ri.riskFactors.map((f: string, i: number) => (
            <Typography key={i} sx={sd.flagListItem(sd.colors.warn)}>• {f}</Typography>
          ))}
        </Box>
      )}
      {!ri.riskFactors.length && <Typography sx={sd.noteText}>{SDL.NO_RISK_FACTORS}</Typography>}
    </DetailSection>
  );
}

// ── Generic Summary section (materials/casings/processes/sections/ingredients) ──
export function SummarySection({ data, viewModel, sd }: {
  data: BatchSubDeptDetailsModel;
  viewModel: ReturnType<typeof useSubDeptDetailsViewModel>;
  sd: any;
}) {
  return (
    <DetailSection title={viewModel.summarySectionTitle} empty={!data.materialsSummary.length} sd={sd}>
      <Stack spacing={1}>
        {data.materialsSummary.map((m, i) => (
          <Box key={i} sx={sd.matRow(m.blockStatus === "Passed")}>
            <Box sx={sd.matHeaderRow}>
              <Box>
                <Typography sx={sd.matName}>{m.material}</Typography>
                <Typography sx={sd.matMeta}>{viewModel.summaryRowMetaPrefix}: {m.lotNo || "—"}</Typography>
              </Box>
              <Stack direction="row" alignItems="center" sx={sd.matStatsRow}>
                <Typography sx={sd.infoLabel}>{m.passedSpecs}/{m.totalSpecs} specs</Typography>
                <Box component="span" sx={sd.matBadge(m.blockStatus)}>{m.blockStatus}</Box>
              </Stack>
            </Box>
            <Box sx={sd.matProgressWrap}>
              <ProgressBar
                value={m.totalSpecs ? Math.round((m.passedSpecs / m.totalSpecs) * 100) : 0}
                color={m.blockStatus === "Passed" ? sd.colors.passed : sd.colors.failed}
                trackColor={sd.colors.progressTrack}
                valueColor={sd.colors.neutral}
                height={5}
                showValue={false}
              />
            </Box>
            {m.failures.length > 0 && (
              <Box sx={sd.matFailureWrap}>
                {m.failures.map((f: any, fi: number) => (
                  <Typography key={fi} sx={sd.flagText(sd.colors.failed)}>• {String(f)}</Typography>
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Stack>
    </DetailSection>
  );
}

// ── Timeline section ──────────────────────────────────────────────────────────
export function TimelineSection({ data, sd }: { data: BatchSubDeptDetailsModel; sd: any }) {
  return (
    <DetailSection title={SDL.TIMELINE} empty={!data.timeline.length} sd={sd}>
      <Box sx={sd.timelineList}>
        {data.timeline.map((item, i) => {
          const isLast  = i === data.timeline.length - 1;
          const color   = sd.timelineColor(item.event);
          return (
            <Box key={i} sx={sd.timelineItem}>
              <Box sx={sd.timelineMarkerWrap}>
                <Box sx={sd.timelineDot(isLast, color)} />
                {!isLast && <Box sx={sd.timelineConnector(isLast)} />}
              </Box>
              <Box sx={sd.timelineContent}>
                <Typography sx={sd.timelineEvent}>{item.event}</Typography>
                <Typography sx={sd.timelineUser}>{formatActor(item.by)}</Typography>
                <Typography sx={sd.timelineTime}>{fmt(item.time)}</Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </DetailSection>
  );
}

// ── Documents section ─────────────────────────────────────────────────────────
export function DocumentsSection({ data, sd }: { data: BatchSubDeptDetailsModel; sd: any }) {
  return (
    <DetailSection title={SDL.DOCUMENTS} empty={!data.documents.length} sd={sd}>
      <Stack spacing={1}>
        {data.documents.map((doc, i) => (
          <Box key={i} sx={sd.docRow}>
            <Box>
              <Typography sx={sd.docName}>{doc.fileName}</Typography>
              <Typography sx={sd.docType}>{doc.documentType} • {doc.fileId || "—"}</Typography>
            </Box>
            <Box sx={sd.docMetaColumn}>
              <Typography sx={sd.docMeta}>{doc.uploadedBy.username}</Typography>
              <Typography sx={sd.docMeta}>{fmt(doc.uploadedOn)}</Typography>
            </Box>
          </Box>
        ))}
      </Stack>
    </DetailSection>
  );
}

// ── Submission Info section ───────────────────────────────────────────────────
export function SubmissionSection({ data, sd }: { data: BatchSubDeptDetailsModel; sd: any }) {
  const hasSubmissionData = Boolean(
    data.submittedBy?.username ||
    data.submittedOn ||
    data.approvedBy?.username ||
    data.approvedOn ||
    data.rejectedBy?.username ||
    data.rejectedOn
  );

  return (
    <DetailSection title={SDL.SUBMISSION_INFO} empty={!hasSubmissionData} sd={sd}>
      <InfoRow label={SDL.SUBMITTED_BY}  value={formatActor(data.submittedBy)} sd={sd} />
      <InfoRow label={SDL.SUBMITTED_ON}  value={fmt(data.submittedOn)} sd={sd} />
      {data.approvedBy && (
        <>
          <InfoRow label={SDL.APPROVED_BY}  value={formatActor(data.approvedBy)} sd={sd} />
          <InfoRow label={SDL.APPROVED_ON}  value={fmt(data.approvedOn)} sd={sd} />
        </>
      )}
      {data.rejectedBy && (
        <>
          <InfoRow label={SDL.REJECTED_BY}  value={formatActor(data.rejectedBy)} sd={sd} />
          <InfoRow label={SDL.REJECTED_ON}  value={fmt(data.rejectedOn)} sd={sd} />
        </>
      )}
    </DetailSection>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
interface SubDeptDetailsProps {
  details: BatchSubDeptDetailsModel | null;
  loading: boolean;
  error:   string | null;
  onRetry: () => void;
  t:       any;
}

export default function SubDeptDetails({ details, loading, error, onRetry, t }: SubDeptDetailsProps) {
  const sd = t.sd;
  const viewModel = useSubDeptDetailsViewModel(details);
  const safeDetails = viewModel.safeDetails;

  if (loading) {
    return (
      <Box sx={sd.centerBox}>
        <CircularProgress size={32} />
        <Typography sx={sd.infoLabel}>Loading details…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={sd.panel}>
      <SnapshotSection viewModel={viewModel} sd={sd} />

      {error && (
        <NoticeBanner
          tone="failed"
          title={error}
          body={SDL.ERROR_NOTICE}
          sd={sd}
          action={
            <Box component="button" onClick={onRetry} sx={sd.retryBtn}>
              {SDL.REQUEST_RETRY}
            </Box>
          }
        />
      )}

      {!viewModel.hasAnyData && (
        <NoticeBanner tone="warn" title={NO_DATA_TEXT} body={SDL.EMPTY_NOTICE} sd={sd} />
      )}

      <OverviewSection data={safeDetails} viewModel={viewModel} sd={sd} />

      <ProgressSection data={safeDetails} sd={sd} />
      <QualitySection  data={safeDetails} sd={sd} />
      <WorkflowRiskSection data={safeDetails} sd={sd} />
      {viewModel.hasSummarySection && (
        <SummarySection  data={safeDetails} viewModel={viewModel} sd={sd} />
      )}
      <SubmissionSection data={safeDetails} sd={sd} />
      <TimelineSection   data={safeDetails} sd={sd} />
      <DocumentsSection  data={safeDetails} sd={sd} />
    </Box>
  );
}
