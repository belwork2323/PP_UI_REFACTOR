// src/data/models/SystemManagerModel.ts
// Models aligned to all 6 System Manager dashboard API response shapes.

/* ─────────────────────────────────────────────────────────────────────────────
   API 1: Dashboard Stats Model
───────────────────────────────────────────────────────────────────────────── */

/** Raw entry from data.{key} → { count, subValue } */
const STATS_CONFIG = [
  { key: "totalBatches",    label: "Total Batches",    subLabel: "All registered batches",   variant: "total" },
  { key: "inProgressBatches", label: "In Progress",    subLabel: "Currently active",          variant: "inProgress" },
  { key: "completedBatches",  label: "Completed",      subLabel: "Fully processed",           variant: "completed" },
  { key: "pendingApprovals",  label: "Pending",        subLabel: "Awaiting approval",         variant: "pending" },
  { key: "rejectedBatches",   label: "Rejected",       subLabel: "Requires attention",        variant: "rejected" },
];

export class SMStatsModel {
  /** Returns flat array of stat cards, one per variant */
  static fromApi(data: Record<string, any>) {
    return STATS_CONFIG.map(({ key, label, subLabel, variant }) => {
      const entry = data?.[key] ?? { count: 0, subValue: 0 };
      const subValue = entry.subValue ?? 0;
      const subText  = subValue > 0
        ? `+${subValue} this period`
        : subValue < 0 ? `${subValue} this period`
        : "No change this period";
      return {
        label,
        subLabel,
        variant,
        value:    entry.count   ?? 0,
        subValue: entry.subValue ?? 0,
        subText,
      };
    });
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   API 2: Chart Data Model
───────────────────────────────────────────────────────────────────────────── */

export class SMChartDataModel {
  filterType:         string;
  timeUnit:           string;
  totalActiveBatches: number;
  stageTotalBatches:  number;
  weeklyActivity:    { label: string; value: number }[];
  motorsProcessed:   { label: string; value: number }[];
  stageProcessed:    { stage: string; batchCount: number; percentage: number }[];

  constructor(data: Record<string, any>) {
    this.filterType         = data.filterType         ?? "week";
    this.timeUnit           = data.timeUnit           ?? "day";
    this.totalActiveBatches = data.totalActiveBatches ?? 0;
    this.weeklyActivity  = Array.isArray(data.weeklyActivity)  ? data.weeklyActivity  : [];
    this.motorsProcessed = Array.isArray(data.motorsProcessed) ? data.motorsProcessed : [];

    // API v2: stageProcessed is { totalBatches, stages: [{department, batchCount, percentage}] }
    // API v1: stageProcessed was a plain array [{stage, batchCount, percentage}]
    const sp = data.stageProcessed;
    const rawStages: any[] = sp?.stages ?? (Array.isArray(sp) ? sp : []);
    this.stageTotalBatches = sp?.totalBatches ?? this.totalActiveBatches;
    this.stageProcessed = rawStages.map((s: any) => ({
      stage:      s.department ?? s.stage ?? "",
      batchCount: s.batchCount ?? 0,
      percentage: s.percentage ?? 0,
    }));
  }

  /** Returns weeklyActivity with recharts-friendly key aliases */
  get barChartData() {
    return this.weeklyActivity.map((p) => ({ day: p.label, v: p.value }));
  }

  get lineChartData() {
    return this.motorsProcessed.map((p) => ({ m: p.label, v: p.value }));
  }

  static fromApi(data: Record<string, any>) {
    return new SMChartDataModel(data ?? {});
  }

  static empty() {
    return new SMChartDataModel({});
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   API 3: Active Batch Model
───────────────────────────────────────────────────────────────────────────── */

export class SMActiveBatchModel {
  batchId:            string;
  projectName:        string;
  motorId:            string;
  motorTypeName:      string;
  department:         string;
  subDepartments:     { subDepartmentId: number; subDepartmentName: string }[];
  priority:           string;
  status:             string;
  progressPercentage: number;
  createdDate:        string;
  lastUpdatedOn:      string;

  constructor(data: Record<string, any>) {
    this.batchId       = data.batchId      ?? "";
    this.projectName   = data.projectName  ?? "";
    this.motorId       = data.motorId      ?? "";
    this.motorTypeName = data.motorType?.motorTypeName ?? "";
    this.priority      = data.priority     ?? "Medium";
    this.status        = data.status       ?? "Pending";
    this.progressPercentage = data.progressPercentage ?? 0;
    this.createdDate   = data.createdDate  ?? "";
    this.lastUpdatedOn = data.lastUpdatedOn ?? "";

    const dept              = data.stage?.department ?? null;
    this.department         = dept?.departmentName   ?? "";
    this.subDepartments     = Array.isArray(dept?.subDepartments)
      ? dept.subDepartments
      : [];
  }

  get firstSubDept() {
    return this.subDepartments[0]?.subDepartmentName ?? "—";
  }

  get formattedLastUpdated() {
    if (!this.lastUpdatedOn) return "—";
    try { return new Date(this.lastUpdatedOn).toLocaleString(); } catch { return this.lastUpdatedOn; }
  }

  static fromApi(data: Record<string, any>) {
    return new SMActiveBatchModel(data);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   API 4: Alert Model
───────────────────────────────────────────────────────────────────────────── */

export class SMAlertModel {
  id:      string;
  type:    "error" | "warning" | "info";
  msg:     string;
  time:    string;
  batchId: string;
  motorId: string;
  stage:   string;

  constructor(data: Record<string, any>) {
    this.id      = data.id      ?? "";
    this.type    = (data.type   ?? "info") as "error" | "warning" | "info";
    this.msg     = data.msg     ?? data.message ?? "";
    this.time    = data.time    ?? data.timestamp ?? "";
    this.batchId = data.batchId ?? "";
    this.motorId = data.motorId ?? "";
    this.stage   = data.stage   ?? "";
  }

  static fromApi(data: Record<string, any>) {
    return new SMAlertModel(data);
  }
}

export class SMAlertSummaryModel {
  total:   number;
  error:   number;
  warning: number;
  info:    number;

  constructor(data: Record<string, any>) {
    this.total   = data.total   ?? 0;
    this.error   = data.error   ?? 0;
    this.warning = data.warning ?? 0;
    this.info    = data.info    ?? 0;
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   API 5: Batch Status List Model
───────────────────────────────────────────────────────────────────────────── */

export interface StageEntry {
  subDepartmentId:   number;
  subDepartmentName: string;
  status:            string;
  approvedBy:        string | null;
  approvedOn:        string | null;
  remarks:           string | null;
}

export class SMBatchStatusModel {
  batchId:            string;
  motorId:            string;
  projectName:        string;
  lastUpdatedStage:   StageEntry | null;
  currentStage:       StageEntry[];
  stageHistory:       StageEntry[];
  progressPercentage: number;
  createdDate:        string;
  lastUpdatedOn:      string;

  constructor(data: Record<string, any>) {
    this.batchId       = data.batchId      ?? "";
    this.motorId       = data.motorId      ?? "";
    this.projectName   = data.projectName  ?? "";
    this.progressPercentage = data.progressPercentage ?? 0;
    this.createdDate   = data.createdDate  ?? "";
    this.lastUpdatedOn = data.lastUpdatedOn ?? "";

    const stageData          = data.stage ?? {};
    this.lastUpdatedStage    = stageData.lastUpdatedStage ?? null;
    this.currentStage        = Array.isArray(stageData.currentStage)  ? stageData.currentStage  : [];
    this.stageHistory        = Array.isArray(stageData.stageHistory)  ? stageData.stageHistory  : [];
  }

  static fromApi(data: Record<string, any>) {
    return new SMBatchStatusModel(data);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   API 6: Blockchain Event Model
───────────────────────────────────────────────────────────────────────────── */

// Event type → display color
const EVENT_COLORS: Record<string, string> = {
  STAGE_UPDATED:       "#3b82f6",
  APPROVAL_COMPLETED:  "#22c55e",
  BATCH_CREATED:       "#06b6d4",
  BATCH_REJECTED:      "#ef4444",
  DISPATCH_COMPLETED:  "#8b5cf6",
};

const EVENT_ICONS: Record<string, string> = {
  STAGE_UPDATED:       "↑",
  APPROVAL_COMPLETED:  "✓",
  BATCH_CREATED:       "+",
  BATCH_REJECTED:      "✕",
  DISPATCH_COMPLETED:  "→",
};

export class SMBlockchainEventModel {
  transactionId:      string;
  batchId:            string;
  eventType:          string;
  eventStatusMessage: string;
  department:         string;
  subDepartment:      string;
  performedBy:        string;
  timestamp:          string;
  blockNumber:        number;
  channelName:        string;
  /** UI helpers */
  color:              string;
  icon:               string;

  constructor(data: Record<string, any>) {
    this.transactionId      = data.transactionId      ?? "";
    this.batchId            = data.batchId            ?? "";
    this.eventType          = data.eventType          ?? "";
    this.eventStatusMessage = data.eventStatusMessage ?? data.label ?? "";
    this.department         = data.department         ?? "";
    this.subDepartment      = data.subDepartment      ?? "";
    this.performedBy        = data.performedBy        ?? "";
    this.timestamp          = data.timestamp          ?? "";
    this.blockNumber        = data.blockNumber        ?? 0;
    this.channelName        = data.channelName        ?? "";
    this.color = EVENT_COLORS[data.eventType] ?? "#3b82f6";
    this.icon  = EVENT_ICONS[data.eventType]  ?? "✦";
  }

  static fromApi(data: Record<string, any>) {
    return new SMBlockchainEventModel(data);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   API 7: Batch Stages Model
───────────────────────────────────────────────────────────────────────────── */

export class SubDepartmentStageModel {
  subDepartmentId: number;
  name: string;
  status: string;
  completionPercentage: number;
  riskLevel: string;
  isDelayed: boolean;
  hasFailures: boolean;
  approvalPending: boolean;

  constructor(data: Record<string, any>) {
    this.subDepartmentId = data.subDepartmentId ?? 0;
    this.name = data.name ?? "";
    this.status = data.status ?? "Not Started";
    this.completionPercentage = data.completionPercentage ?? 0;
    this.riskLevel = data.riskLevel ?? "Low";
    this.isDelayed = Boolean(data.isDelayed);
    this.hasFailures = Boolean(data.hasFailures);
    this.approvalPending = Boolean(data.approvalPending);
  }

  static fromApi(data: Record<string, any>) {
    return new SubDepartmentStageModel(data);
  }
}

export class DepartmentStageModel {
  departmentId: number;
  departmentName: string;
  status: string;
  completionPercentage: number;
  riskLevel: string;
  isActive: boolean;
  subDepartments: SubDepartmentStageModel[];

  constructor(data: Record<string, any>) {
    this.departmentId = data.departmentId ?? 0;
    this.departmentName = data.departmentName ?? "";
    this.status = data.status ?? "Not Started";
    this.completionPercentage = data.completionPercentage ?? 0;
    this.riskLevel = data.riskLevel ?? "Low";
    this.isActive = Boolean(data.isActive);
    this.subDepartments = Array.isArray(data.subDepartments)
      ? data.subDepartments.map((s: any) => new SubDepartmentStageModel(s))
      : [];
  }

  static fromApi(data: Record<string, any>) {
    return new DepartmentStageModel(data);
  }
}

export class BatchStagesModel {
  batchId: string;
  motorId: string;
  batchType: string;
  priority: string;
  status: string;
  facility: string;
  assignedTo: { id: string; role: string; username: string };
  createdOn: string;
  ageInDays: number;
  overallProgress: number;
  stages: DepartmentStageModel[];

  constructor(data: Record<string, any>) {
    const batch = data.batch ?? {};
    this.batchId = batch.batchId ?? "";
    this.motorId = batch.motorId ?? "";
    this.batchType = batch.batchType ?? "";
    this.priority = batch.priority ?? "";
    this.status = batch.status ?? "In Progress";
    this.facility = batch.facility ?? "";
    this.assignedTo = batch.assignedTo ?? { id: "", role: "", username: "" };
    this.createdOn = batch.createdOn ?? "";
    this.ageInDays = batch.ageInDays ?? 0;
    this.overallProgress = batch.overallProgress ?? 0;
    this.stages = Array.isArray(data.stages)
      ? data.stages.map((s: any) => new DepartmentStageModel(s))
      : [];
  }

  static fromApi(data: Record<string, any>) {
    return new BatchStagesModel(data);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   API 8: Sub-Department Batch Details Model
───────────────────────────────────────────────────────────────────────────── */

export class BatchSubDeptDetailsModel {
  subDepartmentId:   number;
  name:              string;
  departmentId:      number;
  departmentName:    string;
  status:            string;
  submittedBy:       { id: string; role: string; username: string };
  submittedOn:       string | null;
  approvedBy:        { id: string; role: string; username: string } | null;
  approvedOn:        string | null;
  rejectedBy:        { id: string; role: string; username: string } | null;
  rejectedOn:        string | null;
  progressInsights:  {
    materialsCount: number; totalSpecs: number; filledSpecs: number;
    completionPercentage: number; allLotsEntered: boolean; isReadyForApproval: boolean;
  };
  qualityInsights: {
    totalTests: number; passed: number; failed: number;
    passRate: number; nonConformances: any[];
  };
  workflowInsights: {
    currentStatus: string; rejectionReason: string | null;
    approvalPending: boolean; reworkRequired: boolean; resubmissionCount: number;
  };
  riskInsights:  { riskLevel: string; riskScore: number; riskFactors: string[] };
  delayInsights: { isDelayed: boolean; delayInHours: number; delayReason: string | null };
  materialsSummary: {
    material: string; lotNo: string; totalSpecs: number;
    passedSpecs: number; failedSpecs: number; blockStatus: string; failures: any[];
  }[];
  summaryType: string | null;
  hasSummaryKey: boolean;
  alerts:   any[];
  timeline: { event: string; by: { id: string; role: string; username: string }; time: string }[];
  documents: {
    fileId: string; fileName: string; documentType: string;
    uploadedBy: { id: string; role: string; username: string }; uploadedOn: string;
  }[];

  constructor(data: Record<string, any>) {
    this.subDepartmentId  = data.subDepartmentId  ?? 0;
    this.name             = data.name             ?? "";
    this.departmentId     = data.departmentId     ?? 0;
    this.departmentName   = data.departmentName   ?? "";
    this.status           = data.status           ?? "";
    this.submittedBy      = data.submittedBy      ?? { id: "", role: "", username: "" };
    this.submittedOn      = data.submittedOn      ?? null;
    this.approvedBy       = data.approvedBy       ?? null;
    this.approvedOn       = data.approvedOn       ?? null;
    this.rejectedBy       = data.rejectedBy       ?? null;
    this.rejectedOn       = data.rejectedOn       ?? null;
    const normalizedSummary = BatchSubDeptDetailsModel.normalizeSummaryEntries(data);

    this.materialsSummary = normalizedSummary.entries;
    this.summaryType = normalizedSummary.type;
    this.hasSummaryKey = normalizedSummary.hasSummaryKey;

    const summaryTotals = this.materialsSummary.reduce(
      (acc, item) => {
        acc.total += item.totalSpecs;
        acc.filled += item.passedSpecs;
        return acc;
      },
      { total: 0, filled: 0 }
    );

    this.progressInsights = {
      materialsCount:       data.progressInsights?.materialsCount
        ?? data.progressInsights?.ingredientsCount
        ?? this.materialsSummary.length,
      totalSpecs:           data.progressInsights?.totalSpecs
        ?? data.progressInsights?.totalParams
        ?? data.progressInsights?.totalFields
        ?? summaryTotals.total,
      filledSpecs:          data.progressInsights?.filledSpecs
        ?? data.progressInsights?.filledParams
        ?? data.progressInsights?.filledFields
        ?? summaryTotals.filled,
      completionPercentage: data.progressInsights?.completionPercentage
        ?? (summaryTotals.total > 0 ? Math.round((summaryTotals.filled / summaryTotals.total) * 100) : 0),
      allLotsEntered:       data.progressInsights?.allLotsEntered
        ?? (
          this.summaryType === "materials" || this.summaryType === "casings"
            ? (this.materialsSummary.length > 0 && this.materialsSummary.every((m) => Boolean(m.lotNo)))
            : false
        ),
      isReadyForApproval:   data.progressInsights?.isReadyForApproval   ?? false,
    };
    this.qualityInsights = {
      totalTests:       data.qualityInsights?.totalTests       ?? 0,
      passed:           data.qualityInsights?.passed           ?? 0,
      failed:           data.qualityInsights?.failed           ?? 0,
      passRate:         data.qualityInsights?.passRate         ?? 0,
      nonConformances:  data.qualityInsights?.nonConformances  ?? [],
    };
    this.workflowInsights = {
      currentStatus:     data.workflowInsights?.currentStatus     ?? "",
      rejectionReason:   data.workflowInsights?.rejectionReason   ?? null,
      approvalPending:   data.workflowInsights?.approvalPending   ?? false,
      reworkRequired:    data.workflowInsights?.reworkRequired    ?? false,
      resubmissionCount: data.workflowInsights?.resubmissionCount ?? 0,
    };
    this.riskInsights  = {
      riskLevel:   data.riskInsights?.riskLevel   ?? "Low",
      riskScore:   data.riskInsights?.riskScore   ?? 0,
      riskFactors: data.riskInsights?.riskFactors ?? [],
    };
    this.delayInsights = {
      isDelayed:    data.delayInsights?.isDelayed    ?? false,
      delayInHours: data.delayInsights?.delayInHours ?? 0,
      delayReason:  data.delayInsights?.delayReason  ?? null,
    };
    this.alerts   = data.alerts   ?? [];
    this.timeline = Array.isArray(data.timeline)
      ? data.timeline.map((e: any) => ({
          event: e.event ?? "",
          by:    e.by    ?? { id: "", role: "", username: "" },
          time:  e.time  ?? "",
        }))
      : [];
    this.documents = Array.isArray(data.documents)
      ? data.documents.map((d: any) => ({
          fileId:       d.fileId       ?? "",
          fileName:     d.fileName     ?? "",
          documentType: d.documentType ?? "",
          uploadedBy:   d.uploadedBy   ?? { id: "", role: "", username: "" },
          uploadedOn:   d.uploadedOn   ?? "",
        }))
      : [];
  }

  static fromApi(data: Record<string, any>) {
    return new BatchSubDeptDetailsModel(data);
  }

  private static normalizeSummaryEntries(data: Record<string, any>) {
    const directFields = Array.isArray(data.progressInsights?.fieldsSummary)
      ? data.progressInsights.fieldsSummary
      : null;
    const directOperations = Array.isArray(data.operationsSummary) ? data.operationsSummary : null;
    const directProcesses = Array.isArray(data.processesSummary) ? data.processesSummary : null;
    const directSections = Array.isArray(data.sectionsSummary) ? data.sectionsSummary : null;
    const directIngredients = Array.isArray(data.ingredientsSummary) ? data.ingredientsSummary : null;
    const directCasings = Array.isArray(data.casingsSummary) ? data.casingsSummary : null;
    const directMaterials = Array.isArray(data.materialsSummary) ? data.materialsSummary : null;

    // Priority is intentional:
    // 1) department-specific arrays should drive UI labels
    // 2) materials is the generic fallback
    if (directFields !== null) {
      return {
        type: "fields",
        hasSummaryKey: true,
        entries: directFields.map((f: any, index: number) => {
          const totalSpecs = 1;
          const passedSpecs = f?.filled ? 1 : 0;

          return BatchSubDeptDetailsModel.toSummaryEntry(
            {
              material: f?.label ?? `Field ${index + 1}`,
              lotNo: f?.field ?? `F-${index + 1}`,
              totalSpecs,
              passedSpecs,
              failedSpecs: passedSpecs ? 0 : 1,
              blockStatus: f?.filled ? "Passed" : "Pending",
              failures: [],
              completionPercentage: f?.filled ? 100 : 0,
              hasIssues: !f?.filled,
            },
            undefined,
            `Field ${index + 1}`
          );
        }),
      };
    }

    if (directOperations !== null) {
      return {
        type: "operations",
        hasSummaryKey: true,
        entries: directOperations.map((op: any, index: number) => {
          const totalSpecs = op?.totalCount ?? 0;
          const passedSpecs = op?.filledCount ?? 0;
          const failures = op?.failures ?? [];

          return BatchSubDeptDetailsModel.toSummaryEntry(
            {
              material: op?.operation ?? `Operation ${index + 1}`,
              lotNo: `Parameters: ${Array.isArray(op?.parameters) ? op.parameters.length : 0}`,
              totalSpecs,
              passedSpecs,
              failedSpecs: Math.max(totalSpecs - passedSpecs, 0),
              blockStatus: op?.blockStatus,
              failures,
              completionPercentage: totalSpecs > 0 ? Math.round((passedSpecs / totalSpecs) * 100) : 0,
              hasIssues: op?.hasIssues ?? failures.length > 0,
            },
            undefined,
            `Operation ${index + 1}`
          );
        }),
      };
    }

    if (directProcesses !== null) {
      return {
        type: "processes",
        hasSummaryKey: true,
        entries: directProcesses.map((p: any, index: number) =>
          BatchSubDeptDetailsModel.toSummaryEntry(
            {
              material: p?.processLabel ?? `Process ${index + 1}`,
              lotNo: p?.type ?? "—",
              totalSpecs: p?.totalFields,
              passedSpecs: p?.filledFields,
              failedSpecs: p?.failedFields,
              blockStatus: p?.blockStatus,
              failures: p?.failures,
              completionPercentage: p?.completionPercentage,
              hasIssues: p?.hasIssues,
            },
            undefined,
            `Process ${index + 1}`
          )
        ),
      };
    }

    if (directSections !== null) {
      return {
        type: "sections",
        hasSummaryKey: true,
        entries: directSections.map((s: any, index: number) => {
          const totalSpecs = s?.totalFields
            ?? s?.totalActivities
            ?? s?.totalRows
            ?? s?.totalDefectTypes
            ?? s?.totalCount
            ?? s?.sampleRowsAdded
            ?? 0;
          const passedSpecs = s?.filledFields
            ?? s?.completedActivities
            ?? s?.filledRows
            ?? s?.filledDefectTypes
            ?? s?.filledCount
            ?? 0;
          const failedSpecs = s?.notOkCount ?? s?.failedSpecs ?? Math.max(totalSpecs - passedSpecs, 0);
          const label = s?.section ?? s?.activity ?? `Section ${index + 1}`;
          const sectionMeta = s?.totalRows != null
            ? `Rows: ${s.totalRows}`
            : s?.bowlsAdded != null
              ? `Bowls: ${s.bowlsAdded}`
              : s?.dynamicTIntervalsAdded != null
                ? `Intervals: ${s.dynamicTIntervalsAdded}`
                : label;

          return BatchSubDeptDetailsModel.toSummaryEntry(
            {
              material: label,
              lotNo: sectionMeta,
              totalSpecs,
              passedSpecs,
              failedSpecs,
              blockStatus: s?.blockStatus,
              failures: s?.failures,
              completionPercentage: s?.completionPercentage,
              hasIssues: s?.hasIssues ?? (s?.notOkCount ?? 0) > 0,
            },
            undefined,
            `Section ${index + 1}`
          );
        }),
      };
    }

    if (directIngredients !== null) {
      return {
        type: "ingredients",
        hasSummaryKey: true,
        entries: directIngredients.map((ing: any, index: number) =>
          BatchSubDeptDetailsModel.toSummaryEntry(
            {
              material: ing?.ingredient ?? `Ingredient ${index + 1}`,
              lotNo: ing?.lotNo ?? "—",
              totalSpecs: ing?.totalParams,
              passedSpecs: ing?.passedParams,
              failedSpecs: ing?.failedParams,
              blockStatus: ing?.blockStatus,
              failures: ing?.failures,
              completionPercentage: ing?.totalParams
                ? Math.round(((ing?.filledParams ?? 0) / ing.totalParams) * 100)
                : undefined,
              hasIssues: (ing?.failedParams ?? 0) > 0,
            },
            undefined,
            `Ingredient ${index + 1}`
          )
        ),
      };
    }

    if (directCasings !== null) {
      return {
        type: "casings",
        hasSummaryKey: true,
        entries: directCasings.map((c: any) => BatchSubDeptDetailsModel.toSummaryEntry(c, "casingId", "Casing")),
      };
    }

    if (directMaterials !== null) {
      return {
        type: "materials",
        hasSummaryKey: true,
        entries: directMaterials.map((m: any) => BatchSubDeptDetailsModel.toSummaryEntry(m)),
      };
    }

    const genericSummaryKey = Object.keys(data).find((k) => k.endsWith("Summary") && Array.isArray(data[k]));
    if (!genericSummaryKey) {
      return { type: null, hasSummaryKey: false, entries: [] };
    }

    const genericEntries = Array.isArray(data[genericSummaryKey]) ? data[genericSummaryKey] : [];
    const type = genericSummaryKey.replace(/Summary$/, "").toLowerCase() || "items";
    return {
      type,
      hasSummaryKey: true,
      entries: genericEntries.map((row: any, index: number) =>
        BatchSubDeptDetailsModel.toSummaryEntry(row, undefined, `Item ${index + 1}`)
      ),
    };
  }

  private static toSummaryEntry(
    row: any,
    preferredIdKey?: string,
    fallbackLabel = ""
  ) {
    const name = row?.material
      ?? (preferredIdKey ? row?.[preferredIdKey] : undefined)
      ?? row?.name
      ?? row?.id
      ?? row?.item
      ?? fallbackLabel;

    const lotOrRef = row?.lotNo
      ?? row?.batchNo
      ?? row?.referenceNo
      ?? (preferredIdKey ? row?.[preferredIdKey] : undefined)
      ?? "";

    const totalSpecs = row?.totalSpecs ?? 0;
    const passedSpecs = row?.passedSpecs ?? 0;
    const failedFromValues = row?.failedSpecs ?? Math.max(totalSpecs - passedSpecs, 0);
    const failures = row?.failures ?? [];
    const computedFailed = Math.max(failedFromValues, Array.isArray(failures) ? failures.length : 0);

    const blockStatus = row?.blockStatus
      ?? (row?.hasIssues ? "Failed" : undefined)
      ?? (row?.completionPercentage === 100 ? "Passed" : undefined)
      ?? (computedFailed > 0 ? "Failed" : "In Progress");

    return {
      material:    name ?? "",
      lotNo:       lotOrRef ?? "",
      totalSpecs,
      passedSpecs,
      failedSpecs: computedFailed,
      blockStatus,
      failures,
    };
  }
}
