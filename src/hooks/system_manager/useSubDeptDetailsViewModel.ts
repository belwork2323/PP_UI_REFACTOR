import { BatchSubDeptDetailsModel } from "../../data/models/SystemManagerModel";
import { STRINGS } from "../../app/config/strings";

const EMPTY_DETAILS = BatchSubDeptDetailsModel.fromApi({});
const SDL = STRINGS.SYSTEM_MANAGER.BATCH_DETAILS.SUB_DEPT;

function hasText(value?: string | null) {
  return Boolean(value && String(value).trim());
}

function toActorLabel(actor?: { username?: string; role?: string } | null) {
  if (!actor?.username) return "—";
  return actor.role ? `${actor.username} (${actor.role})` : actor.username;
}

function getApprovalState(details: BatchSubDeptDetailsModel) {
  if (details.approvedBy) return "Approved";
  if (details.rejectedBy) return "Rejected";
  if (details.workflowInsights.approvalPending) return "Pending Approval";
  return details.status || "Not Started";
}

function getSubmissionState(details: BatchSubDeptDetailsModel) {
  if (details.rejectedBy) return "Rejected";
  if (details.approvedBy) return "Approved";
  if (details.submittedOn) return "Submitted";
  return "Awaiting Submission";
}

function resolveSummaryLabels(summaryType: string | null) {
  if (summaryType === "fields") {
    return {
      sectionTitle: SDL.FIELDS_SUMMARY,
      trackedLabel: SDL.FIELDS_TRACKED,
      rowMetaPrefix: "Field",
    };
  }

  if (summaryType === "operations") {
    return {
      sectionTitle: SDL.OPERATIONS_SUMMARY,
      trackedLabel: SDL.OPERATIONS_TRACKED,
      rowMetaPrefix: "Operation Meta",
    };
  }

  if (summaryType === "ingredients") {
    return {
      sectionTitle: SDL.INGREDIENTS_SUMMARY,
      trackedLabel: SDL.INGREDIENTS_TRACKED,
      rowMetaPrefix: "Lot",
    };
  }

  if (summaryType === "sections") {
    return {
      sectionTitle: SDL.SECTIONS_SUMMARY,
      trackedLabel: SDL.SECTIONS_TRACKED,
      rowMetaPrefix: "Section",
    };
  }

  if (summaryType === "processes") {
    return {
      sectionTitle: SDL.PROCESSES_SUMMARY,
      trackedLabel: SDL.PROCESSES_TRACKED,
      rowMetaPrefix: "Type",
    };
  }

  if (summaryType === "casings") {
    return {
      sectionTitle: SDL.CASINGS_SUMMARY,
      trackedLabel: SDL.CASINGS_TRACKED,
      rowMetaPrefix: "Casing ID",
    };
  }

  if (summaryType === "materials") {
    return {
      sectionTitle: SDL.MATERIALS_SUMMARY,
      trackedLabel: SDL.MATERIALS_TRACKED,
      rowMetaPrefix: "Lot",
    };
  }

  return {
    sectionTitle: SDL.ITEMS_SUMMARY,
    trackedLabel: SDL.ITEMS_TRACKED,
    rowMetaPrefix: "Reference",
  };
}

export function useSubDeptDetailsViewModel(details: BatchSubDeptDetailsModel | null) {
  const safeDetails = details ?? EMPTY_DETAILS;
  const lastTimelineEvent = safeDetails.timeline[safeDetails.timeline.length - 1] ?? null;
  const totalMaterialFailures = safeDetails.materialsSummary.reduce(
    (count, material) => count + material.failures.length,
    0
  );
  const summaryLabels = resolveSummaryLabels(safeDetails.summaryType);

  const hasAnyData = Boolean(
    details && (
      details.subDepartmentId ||
      hasText(details.name) ||
      hasText(details.departmentName) ||
      hasText(details.status) ||
      hasText(details.submittedBy?.username) ||
      Boolean(details.submittedOn) ||
      Boolean(details.approvedBy?.username) ||
      Boolean(details.rejectedBy?.username) ||
      details.progressInsights.totalSpecs > 0 ||
      details.qualityInsights.totalTests > 0 ||
      details.materialsSummary.length > 0 ||
      details.timeline.length > 0 ||
      details.documents.length > 0
    )
  );

  return {
    safeDetails,
    hasAnyData,
    title: safeDetails.name || "Sub-Department Details",
    subtitle: safeDetails.departmentName || "Workflow details unavailable",
    status: safeDetails.status || "Not Started",
    approvalState: getApprovalState(safeDetails),
    submissionState: getSubmissionState(safeDetails),
    submittedByLabel: toActorLabel(safeDetails.submittedBy),
    approvedByLabel: toActorLabel(safeDetails.approvedBy),
    rejectedByLabel: toActorLabel(safeDetails.rejectedBy),
    summaryType: safeDetails.summaryType,
    hasSummarySection: safeDetails.hasSummaryKey,
    summarySectionTitle: summaryLabels.sectionTitle,
    trackedSummaryLabel: summaryLabels.trackedLabel,
    summaryRowMetaPrefix: summaryLabels.rowMetaPrefix,
    materialsTracked: safeDetails.progressInsights.materialsCount || safeDetails.materialsSummary.length,
    testsExecuted: safeDetails.qualityInsights.totalTests,
    timelineEvents: safeDetails.timeline.length,
    documentCount: safeDetails.documents.length,
    materialFailures: totalMaterialFailures,
    lastActivity: lastTimelineEvent?.event || "—",
    lastActor: toActorLabel(lastTimelineEvent?.by),
    readiness: {
      readyForApproval: safeDetails.progressInsights.isReadyForApproval,
      allLotsEntered: safeDetails.progressInsights.allLotsEntered,
      approvalPending: safeDetails.workflowInsights.approvalPending,
      reworkRequired: safeDetails.workflowInsights.reworkRequired,
      resubmissionCount: safeDetails.workflowInsights.resubmissionCount,
    },
  };
}

export default useSubDeptDetailsViewModel;