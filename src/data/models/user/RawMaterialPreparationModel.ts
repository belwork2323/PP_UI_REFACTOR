import { materialSelectionKey, type MaterialsListItem } from "./MaterialsListModel";
import {
  findGradeInMaterial,
  findMaterialInList,
  uiKeyToProcessType,
  type PreparationPremixEntry,
  type PreparationProcessEntry,
} from "./rmp/rmpProcessTypes";
import { buildProcessFromTypedForm } from "./rmp/buildProcessFromTypedForm";
import {
  createEmptyProcessFormForUiKey,
  processFormHasUserData,
  type RmpMaterialProcessForm,
} from "./rmp/defaultSolidProcessForm";
import {
  hydrateProcessFormFromEntry,
  typedProcessToDisplaySections,
} from "./rmp/processFormMapper";
import {
  resolveMaterialUiKey,
  type RmpMaterialUiKey,
  type RmpProcessSlot,
} from "./rmp/rmpMaterialUiRegistry";
import { formatToIsoDateInput } from "../../../utils/dateUtils";
import { OPERATION_STATUS, formatApiStatusForDisplay } from "../../../hooks/operationStatus";
import { normalizeSubdepartmentBatchStatus } from "./SubdepartmentBatchModel";
import { formatDateTimeForApi, toCamelCaseKey } from "./rawMaterialPreparationApiMapper";
import { weightmentHasMaterialData } from "./rawMaterialWeightmentValidation";
import { cloneValue } from "@/data/models/shared/sectionFormTypes";
import type { SchemaSectionSubmission } from "@/data/models/shared/sectionFormTypes";

export type PremixSubmissionType = "DRAFT" | "SUBMIT";
export type PremixSubmissionStatus =
  "TO_BE_INITIATED" | "IN_PROGRESS" | "WAITING_FOR_APPROVAL" | "APPROVED" | "REJECTED";

export type PremixStatusMeta = {
  premixSubmissionType?: PremixSubmissionType;
  premixSubmissionStatus: PremixSubmissionStatus;
  submittedAt?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  remarks?: string | null;
  rejectionReason?: string | null;
};

export const isPremixLocked = (status: PremixSubmissionStatus | undefined): boolean =>
  status === "WAITING_FOR_APPROVAL" || status === "APPROVED";

export const isPremixEditable = (status: PremixSubmissionStatus | undefined): boolean =>
  !status || status === "TO_BE_INITIATED" || status === "IN_PROGRESS" || status === "REJECTED";

/**
 * Weightment is shared across premixes. Lock it once any premix is submitted for
 * approval or already approved; keep editable while all are still draftable.
 */
export const isWeightmentSheetEditable = (
  premixStatusByNo: Record<number, PremixStatusMeta> | undefined | null,
): boolean => {
  const statuses = Object.values(premixStatusByNo ?? {});
  if (statuses.length === 0) return true;
  return statuses.every((meta) => isPremixEditable(meta?.premixSubmissionStatus));
};

/** True once any premix has been saved (draft/submit) — list `formId` may exist earlier. */
export const hasRawMaterialPrepPersistedData = (
  premixStatusByNo: Record<number, PremixStatusMeta> | undefined | null,
): boolean =>
  Object.values(premixStatusByNo ?? {}).some((meta) => {
    const status = meta?.premixSubmissionStatus ?? "TO_BE_INITIATED";
    return status !== "TO_BE_INITIATED";
  });

export const isPremixApproverTabDisabled = (status: PremixSubmissionStatus | undefined): boolean =>
  !status || status === "TO_BE_INITIATED";

export const isPremixApproverActionable = (status: PremixSubmissionStatus | undefined): boolean => {
  const normalized = String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return normalized === "WAITING_FOR_APPROVAL" || normalized === "IN_PROGRESS";
};

/** Entire form can be approved/rejected once submitted and every premix is approved. */
export const canApproverActionEntireRawMaterialPrepForm = (params: {
  formSubmissionType?: string | null;
  status?: string | null;
  premixes?: Array<{ premixSubmissionStatus?: PremixSubmissionStatus | string | null }>;
}): boolean => {
  const formType = String(params.formSubmissionType ?? "")
    .trim()
    .toUpperCase();
  if (formType !== "SUBMIT") return false;

  const premixes = params.premixes ?? [];
  if (premixes.length === 0) return false;
  const allPremixesApproved = premixes.every(
    (premix) => String(premix.premixSubmissionStatus ?? "").toUpperCase() === "APPROVED",
  );
  if (!allPremixesApproved) return false;

  const status = String(params.status ?? "").trim();
  const statusUpper = status.toUpperCase().replace(/\s+/g, "_");

  // Already decided — do not show Approve / Reject Form again.
  if (
    statusUpper === "APPROVED" ||
    statusUpper === "REJECTED" ||
    statusUpper === "COMPLETELY_APPROVED" ||
    status === OPERATION_STATUS.APPROVED ||
    status === OPERATION_STATUS.REJECTED ||
    status === OPERATION_STATUS.COMPLETELY_APPROVED
  ) {
    return false;
  }

  return (
    statusUpper === "WAITING_FOR_APPROVAL" ||
    statusUpper === "WAITING_FOR_COMPLETE_APPROVAL" ||
    status === OPERATION_STATUS.WAITING_FOR_APPROVAL
  );
};

export const getPremixStatusLabel = (
  status: PremixSubmissionStatus | string | undefined,
): string => {
  const trimmed = String(status ?? "").trim();
  if (!trimmed) return "To Be Initiated";
  return formatApiStatusForDisplay(trimmed) || "To Be Initiated";
};

/** Batch-level workflow status from details/list APIs (includes partial approval). */
export const getRawMaterialPrepBatchStatusLabel = (status: unknown): string =>
  String(normalizeSubdepartmentBatchStatus(status));

export type PremixCounts = {
  pendingPremixCount: number;
  approvedPremixCount: number;
  rejectedPremixCount: number;
  inProgressPremixCount: number;
  totalPremixCount: number;
};

export type RawMaterialPreparationSubmitResponse = {
  formId: string;
  batchId: string;
  status: string;
  formSubmissionType?: string;
  premixCount?: number;
  totalSolidMaterials?: number;
  totalLiquidMaterials?: number;
  weightmentSheetIncluded?: boolean;
  submittedBy?: string;
  submittedAt?: string;
  batchStatus?: string;
  allPremixesApproved?: boolean;
  premixStatuses?: Array<{
    premixNo: number;
    premixSubmissionStatus: PremixSubmissionStatus;
  }>;
  pendingPremixCount?: number;
  approvedPremixCount?: number;
  rejectedPremixCount?: number;
  inProgressPremixCount?: number;
  totalPremixCount?: number;
};

export type RawMaterialPrepWeightmentDetail = {
  materialCode: string;
  materialName: string;
  /** Premix this row belongs to — weighment is per material × premix. */
  premixNo?: number | null;
  /**
   * Stable UI scope for per-material tabs. Lets users edit `materialCode` without
   * the row disappearing from the active material filter. Not sent to API.
   */
  scopeMaterialCode?: string | null;
  percentage: string;
  weightTransferred: string;
  containerType: string;
  containerNumber: string;
  weighScaleNumber: string;
  weighingDateTime: string;
};

export type RawMaterialPrepWeightmentSheet = {
  mixerBuildingNumber: string;
  weightmentDetails: RawMaterialPrepWeightmentDetail[];
  validation: {
    compareWithIdentificationSheet: boolean;
    deviationFound: boolean;
    deviationMessage: string;
  };
};

export const createEmptyWeightmentDetail = (
  seed?: Partial<RawMaterialPrepWeightmentDetail>,
): RawMaterialPrepWeightmentDetail => ({
  materialCode: "",
  materialName: "",
  premixNo: null,
  scopeMaterialCode: null,
  percentage: "",
  weightTransferred: "",
  containerType: "",
  containerNumber: "",
  weighScaleNumber: "",
  weighingDateTime: "",
  ...seed,
});

export const createEmptyWeightmentSheet = (): RawMaterialPrepWeightmentSheet => ({
  mixerBuildingNumber: "",
  weightmentDetails: [],
  validation: {
    compareWithIdentificationSheet: false,
    deviationFound: false,
    deviationMessage: "",
  },
});

const formatDateTimeLocal = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/.test(raw)) return raw;

  const pad = (part: number) => String(part).padStart(2, "0");
  const toUiFormat = (date: Date) =>
    `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) {
    const date = new Date(raw.length === 16 ? `${raw}:00` : raw);
    if (!Number.isNaN(date.getTime())) return toUiFormat(date);
  }

  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) return toUiFormat(date);
  return raw;
};

/** Opt-in flags must be explicit true — avoid Boolean("false") / truthy junk from API. */
const parseOptInFlag = (value: unknown): boolean => {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
};

const unwrapApiScalar = (value: unknown): unknown => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if ("parsedValue" in obj && obj.parsedValue !== undefined) return obj.parsedValue;
    if ("source" in obj && obj.source !== undefined && obj.source !== "") return obj.source;
  }
  return value;
};

const mapWeightmentDetailFromApi = (
  row: Record<string, unknown>,
): RawMaterialPrepWeightmentDetail => {
  const premixRaw = row.premixNo ?? row.premix_no;
  const premixNo =
    premixRaw == null || premixRaw === ""
      ? null
      : Number.isFinite(Number(premixRaw))
        ? Number(premixRaw)
        : null;
  return {
    materialCode: String(row.materialCode ?? ""),
    materialName: String(row.materialName ?? row.materialCode ?? ""),
    premixNo,
    percentage:
      unwrapApiScalar(row.percentage) != null ? String(unwrapApiScalar(row.percentage)) : "",
    weightTransferred:
      unwrapApiScalar(row.weightTransferred) != null
        ? String(unwrapApiScalar(row.weightTransferred))
        : "",
    containerType: String(row.containerType ?? ""),
    containerNumber: String(row.containerNumber ?? ""),
    weighScaleNumber: String(row.weighScaleNumber ?? ""),
    weighingDateTime: formatDateTimeLocal(row.weighingDateTime),
  };
};

export const mapWeightmentSheetFromApi = (value: unknown): RawMaterialPrepWeightmentSheet => {
  if (!value || typeof value !== "object") return createEmptyWeightmentSheet();

  const sheet = value as Record<string, unknown>;
  const validation = (sheet.validation ?? {}) as Record<string, unknown>;
  const rows = Array.isArray(sheet.weightmentDetails) ? sheet.weightmentDetails : [];

  return {
    mixerBuildingNumber: String(sheet.mixerBuildingNumber ?? ""),
    weightmentDetails: rows.map((row) =>
      mapWeightmentDetailFromApi(row as Record<string, unknown>),
    ),
    validation: {
      compareWithIdentificationSheet: parseOptInFlag(validation.compareWithIdentificationSheet),
      deviationFound: parseOptInFlag(validation.deviationFound),
      deviationMessage: String(validation.deviationMessage ?? ""),
    },
  };
};

export const mapWeightmentSheetToApi = (
  sheet: RawMaterialPrepWeightmentSheet | null | undefined,
) => {
  if (!sheet) return {};

  const rows = (sheet.weightmentDetails ?? []).filter((row) => {
    const code = String(row.materialCode ?? "").trim();
    const name = String(row.materialName ?? "").trim();
    const weight = String(row.weightTransferred ?? "").trim();
    const percentage = String(row.percentage ?? "").trim();
    return Boolean(code || name || weight || percentage);
  });

  const mixer = String(sheet.mixerBuildingNumber ?? "").trim();
  if (!mixer && rows.length === 0) {
    return {};
  }

  return {
    mixerBuildingNumber: mixer || null,
    weightmentDetails: rows.map((row) => ({
      materialCode: String(row.materialCode ?? "").trim(),
      materialName: String(row.materialName ?? "").trim() || String(row.materialCode ?? "").trim(),
      ...(row.premixNo != null && Number.isFinite(Number(row.premixNo))
        ? { premixNo: Number(row.premixNo) }
        : {}),
      percentage: String(row.percentage ?? "").trim() ? Number(row.percentage) : null,
      weightTransferred: String(row.weightTransferred ?? "").trim()
        ? Number(row.weightTransferred)
        : null,
      containerType: String(row.containerType ?? "").trim() || null,
      containerNumber: String(row.containerNumber ?? "").trim() || null,
      weighScaleNumber: String(row.weighScaleNumber ?? "").trim() || null,
      weighingDateTime: formatDateTimeForApi(row.weighingDateTime),
      // scopeMaterialCode is UI-only — intentionally omitted from API payload
    })),
    validation: {
      compareWithIdentificationSheet: sheet.validation.compareWithIdentificationSheet === true,
      deviationFound: sheet.validation.deviationFound === true,
      deviationMessage: String(sheet.validation.deviationMessage ?? "").trim() || null,
    },
  };
};

export type RawMaterialPrepPremixSelection = {
  premix: number;
  premixDate: string;
  materialKey: string;
  sheetSrNo: number;
  materialName: string;
  lotId: string;
  lotIds: string[];
  make: string;
  quantityPerPremix: number;
  requiredComposition: number;
  selectedProcesses: { solid: boolean; liquid: boolean };
  solidMaterialCode: string;
  solidGradeCode: string;
  solidMaterialId?: number;
  solidGradeId?: number;
  liquidMaterialCode: string;
  liquidMaterialId?: number;
};

export type RawMaterialPrepMaterialProcessSlot = {
  uiKey: RmpMaterialUiKey;
  processForm: RmpMaterialProcessForm;
};

export type RawMaterialPrepPremixSession = {
  selectedProcesses: { solid: boolean; liquid: boolean };
  solidMaterialCode: string;
  solidGradeCode: string;
  liquidMaterialCode: string;
  solid: RawMaterialPrepMaterialProcessSlot;
  liquid: RawMaterialPrepMaterialProcessSlot;
  /**
   * AP multi-grade process cards (Coarse / Fine / Ultra Fine).
   * When present, payload emits one solidProcess entry per card.
   */
  apGradeSlots?: Array<{
    gradeCode: string;
    slot: RawMaterialPrepMaterialProcessSlot;
  }>;
  /** Saved API process when local form was never edited (locked premixes). */
  pendingSolidProcess?: PreparationProcessEntry;
  pendingLiquidProcess?: PreparationProcessEntry;
  /** @deprecated Prefer pendingSolidProcess */
  pendingSolidSections?: SchemaSectionSubmission[];
  /** @deprecated Prefer pendingLiquidProcess */
  pendingLiquidSections?: SchemaSectionSubmission[];
};

export type RawMaterialPreparationDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  status?: string;
  createdBy?: string | null;
  createdAt?: string | null;
  pendingPremixCount?: number;
  approvedPremixCount?: number;
  rejectedPremixCount?: number;
  inProgressPremixCount?: number;
  totalPremixCount?: number;
  premixStatuses?: Array<{
    premixNo: number;
    premixSubmissionType?: PremixSubmissionType;
    premixSubmissionStatus?: PremixSubmissionStatus;
    submittedAt?: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    remarks?: string | null;
    rejectionReason?: string | null;
  }>;
  preparationDetails?: {
    premixes?: Array<{
      premixNo: number;
      premixDate?: string;
      materialType: string;
      premixSubmissionType?: PremixSubmissionType;
      premixSubmissionStatus?: PremixSubmissionStatus;
      submittedAt?: string | null;
      reviewedBy?: string | null;
      reviewedAt?: string | null;
      remarks?: string | null;
      rejectionReason?: string | null;
      solidProcess?: PreparationProcessEntry[];
      liquidProcess?: PreparationProcessEntry[];
    }>;
    weightmentSheet?: unknown;
  };
};

const emptyProcessSlot = (
  slot: RmpProcessSlot,
  materialCode = "",
  gradeCode = "",
): RawMaterialPrepMaterialProcessSlot => {
  const uiKey = resolveMaterialUiKey({ materialCode, slot, gradeCode });
  return {
    uiKey,
    processForm: createEmptyProcessFormForUiKey(uiKey),
  };
};

export const createEmptyPremixProcessSession = (): RawMaterialPrepPremixSession => ({
  selectedProcesses: { solid: false, liquid: false },
  solidMaterialCode: "",
  solidGradeCode: "",
  liquidMaterialCode: "",
  solid: emptyProcessSlot("solid"),
  liquid: emptyProcessSlot("liquid"),
});

export const hydratePremixProcessSlot = (
  slot: RmpProcessSlot,
  materialCode: string,
  entry: PreparationProcessEntry | undefined,
  gradeCode?: string,
): RawMaterialPrepMaterialProcessSlot => {
  const resolvedGrade = gradeCode ?? entry?.gradeCode ?? "";
  const uiKey = entry?.processType
    ? (() => {
        const fromType = String(entry.processType).toUpperCase();
        if (fromType === "AP_COARSE") return "apCoarse" as const;
        if (fromType === "AP_FINE") return "apFine" as const;
        if (fromType === "AP_ULTRA_FINE") return "apUltraFine" as const;
          if (fromType === "ALUMINUM" || fromType === "ALUMINIUM") return "aluminum" as const;
          if (fromType === "DOA") return "doa" as const;
          if (fromType === "DEFAULT_LIQUID" || fromType === "LIQUID") return "defaultLiquid" as const;
        return resolveMaterialUiKey({ materialCode, slot, gradeCode: resolvedGrade });
      })()
    : resolveMaterialUiKey({ materialCode, slot, gradeCode: resolvedGrade });
  return {
    uiKey,
    processForm: hydrateProcessFormFromEntry(uiKey, entry),
  };
};

export const normalizeMaterialProcessSlot = (
  slot: RmpProcessSlot,
  materialCode: string,
  partial?: Partial<RawMaterialPrepMaterialProcessSlot> | null,
  gradeCode = "",
): RawMaterialPrepMaterialProcessSlot => {
  const code = String(materialCode ?? "").trim();
  const uiKey = partial?.uiKey ?? resolveMaterialUiKey({ materialCode: code, slot, gradeCode });
  const processForm = partial?.processForm
    ? (cloneValue(partial.processForm) as RmpMaterialProcessForm)
    : createEmptyProcessFormForUiKey(uiKey);
  return { uiKey, processForm };
};

/** Prefer saved API process when local process form was never hydrated (locked premixes). */
const buildProcessFromPending = (
  pending: PreparationProcessEntry | undefined,
  fallback: {
    materialId?: number;
    materialCode?: string;
    materialName?: string;
    gradeId?: number;
    gradeCode?: string;
  },
  processType: string,
): PreparationProcessEntry | null => {
  if (!pending) return null;
  const materialCode = String(fallback.materialCode ?? pending.materialCode ?? "").trim();
  if (!materialCode) return null;

  return {
    materialId: Number(fallback.materialId ?? pending.materialId ?? 0),
    materialCode,
    materialName:
      String(fallback.materialName ?? pending.materialName ?? materialCode).trim() || materialCode,
    gradeId: fallback.gradeId ?? pending.gradeId ?? null,
    gradeCode: fallback.gradeCode?.trim() ? fallback.gradeCode : (pending.gradeCode ?? null),
    processType: pending.processType || processType,
    lotDetails: pending.lotDetails ?? [],
    drying: pending.drying ?? null,
    sieving: pending.sieving ?? null,
    apCoarse: pending.apCoarse ?? null,
    apFine: pending.apFine ?? null,
    apUltraFine: pending.apUltraFine ?? null,
    aluminum: pending.aluminum ?? null,
    doa: pending.doa ?? null,
  };
};

/** Materials with empty process data still appear on the premix when weightment is recorded. */
const buildWeightmentOnlyProcessEntry = (
  fallback: {
    materialId?: number;
    materialCode?: string;
    materialName?: string;
    gradeId?: number;
    gradeCode?: string;
  },
  processType: string,
): PreparationProcessEntry | null => {
  const materialCode = String(fallback.materialCode ?? "").trim();
  if (!materialCode) return null;

  return {
    materialId: Number(fallback.materialId ?? 0),
    materialCode,
    materialName: String(fallback.materialName ?? materialCode).trim() || materialCode,
    gradeId: fallback.gradeId ?? null,
    gradeCode: fallback.gradeCode?.trim() ? fallback.gradeCode : null,
    processType,
    lotDetails: [],
    drying: null,
    sieving: null,
    apCoarse: null,
    apFine: null,
    apUltraFine: null,
    aluminum: null,
    doa: null,
  };
};

/**
 * Rebuild update/create preparationDetails from a fetched form-details response.
 * Used for final approval so we do not drop solid/liquid data that was never hydrated in local sessions.
 */
export const mapPreparationDetailsFromSavedForm = (
  details: RawMaterialPreparationDetails,
  options?: {
    premixStatusByNo?: Record<number, PremixStatusMeta>;
  },
) => {
  const statuses = options?.premixStatusByNo ?? {};
  const premixes = (details.preparationDetails?.premixes ?? []).map((premix) => {
    const premixNo = Number(premix.premixNo ?? 0);
    const statusMeta = statuses[premixNo];
    const solidProcess = Array.isArray(premix.solidProcess) ? premix.solidProcess : [];
    const liquidProcess = Array.isArray(premix.liquidProcess) ? premix.liquidProcess : [];
    const hasSolid = solidProcess.length > 0;
    const hasLiquid = liquidProcess.length > 0;
    const materialTypeRaw = String(premix.materialType ?? "")
      .trim()
      .toUpperCase();
    const materialType =
      materialTypeRaw === "SOLID" || materialTypeRaw === "LIQUID" || materialTypeRaw === "BOTH"
        ? materialTypeRaw
        : hasSolid && hasLiquid
          ? "BOTH"
          : hasSolid
            ? "SOLID"
            : hasLiquid
              ? "LIQUID"
              : "BOTH";

    return {
      premixNo,
      premixDate:
        formatToIsoDateInput(String(premix.premixDate ?? "").trim()) ||
        String(premix.premixDate ?? ""),
      materialType: materialType as "SOLID" | "LIQUID" | "BOTH",
      premixSubmissionType:
        statusMeta?.premixSubmissionType ??
        premix.premixSubmissionType ??
        ("SUBMIT" as PremixSubmissionType),
      solidProcess,
      liquidProcess,
    };
  });

  return {
    preparationDetails: {
      premixes,
      weightmentSheet: mapWeightmentSheetToApi(
        mapWeightmentSheetFromApi(details.preparationDetails?.weightmentSheet),
      ),
    },
  };
};

export const mapPreparationDetailsPayload = (params: {
  addedPremixSelections: RawMaterialPrepPremixSelection[];
  premixSessions: Record<string, RawMaterialPrepPremixSession>;
  solidMaterials: MaterialsListItem[];
  liquidMaterials: MaterialsListItem[];
  weightmentSheet?: RawMaterialPrepWeightmentSheet | null;
  targetPremixNos?: number[];
  premixSubmissionType?: PremixSubmissionType;
  includeEmptyPremixes?: boolean;
}) => {
  const premixes: PreparationPremixEntry[] = [];
  const grouped = new Map<number, RawMaterialPrepPremixSelection[]>();

  params.addedPremixSelections.forEach((entry) => {
    const list = grouped.get(entry.premix) ?? [];
    list.push(entry);
    grouped.set(entry.premix, list);
  });

  grouped.forEach((entries, premixNo) => {
    if (params.targetPremixNos?.length && !params.targetPremixNos.includes(premixNo)) return;
    const solidProcess: PreparationProcessEntry[] = [];
    const liquidProcess: PreparationProcessEntry[] = [];
    const weightmentSheet = params.weightmentSheet ?? createEmptyWeightmentSheet();

    entries.forEach((entry) => {
      const sessionKey = `${entry.premix}:${entry.materialKey}`;
      const session = params.premixSessions[sessionKey] ?? createEmptyPremixProcessSession();
      const solidMaterial = findMaterialInList(params.solidMaterials, entry.solidMaterialCode);
      const liquidMaterial = findMaterialInList(params.liquidMaterials, entry.liquidMaterialCode);

      if (entry.selectedProcesses.solid) {
        const solidFallback = {
          materialId: entry.solidMaterialId ?? solidMaterial?.materialId,
          materialCode: entry.solidMaterialCode,
          materialName: solidMaterial?.materialName ?? entry.materialName,
          gradeId: entry.solidGradeId,
          gradeCode: entry.solidGradeCode,
        };

        const apSlots = session.apGradeSlots;
        const isAp =
          String(entry.solidMaterialCode ?? "")
            .trim()
            .toUpperCase() === "AP";

        if (isAp && Array.isArray(apSlots)) {
          // Host-managed AP grades (may be empty after user deleted all).
          apSlots.forEach((gradeSlot) => {
            const gradeCode = String(gradeSlot.gradeCode ?? "").trim();
            const process =
              buildProcessFromTypedForm({
                uiKey: gradeSlot.slot.uiKey,
                processForm: gradeSlot.slot.processForm,
                material: solidMaterial,
                gradeCode,
                fallback: {
                  materialId: entry.solidMaterialId,
                  materialCode: entry.solidMaterialCode,
                  materialName: solidMaterial?.materialName ?? entry.materialName,
                  gradeId: entry.solidGradeId,
                },
              }) ??
              (weightmentHasMaterialData(weightmentSheet, entry.solidMaterialCode)
                ? buildWeightmentOnlyProcessEntry(
                    { ...solidFallback, gradeCode },
                    uiKeyToProcessType(gradeSlot.slot.uiKey),
                  )
                : null);
            if (process) solidProcess.push(process);
          });
          // If all grades deleted but weightment exists, keep a weightment-only identity row.
          if (
            apSlots.length === 0 &&
            weightmentHasMaterialData(weightmentSheet, entry.solidMaterialCode)
          ) {
            const process = buildWeightmentOnlyProcessEntry(solidFallback, "DEFAULT_SOLID");
            if (process) solidProcess.push(process);
          }
        } else {
          const process =
            buildProcessFromTypedForm({
              uiKey: session.solid.uiKey,
              processForm: session.solid.processForm,
              material: solidMaterial,
              gradeCode: entry.solidGradeCode,
              fallback: {
                materialId: entry.solidMaterialId,
                materialCode: entry.solidMaterialCode,
                materialName: solidMaterial?.materialName ?? entry.materialName,
                gradeId: entry.solidGradeId,
              },
            }) ??
            buildProcessFromPending(
              session.pendingSolidProcess,
              solidFallback,
              uiKeyToProcessType(session.solid.uiKey),
            ) ??
            (weightmentHasMaterialData(weightmentSheet, entry.solidMaterialCode)
              ? buildWeightmentOnlyProcessEntry(
                  solidFallback,
                  uiKeyToProcessType(session.solid.uiKey),
                )
              : null);

          if (process) {
            solidProcess.push(process);
          }
        }
      }

      if (entry.selectedProcesses.liquid) {
        const liquidFallback = {
          materialId: entry.liquidMaterialId ?? liquidMaterial?.materialId,
          materialCode: entry.liquidMaterialCode,
          materialName: liquidMaterial?.materialName ?? entry.materialName,
        };
        const process =
          buildProcessFromTypedForm({
            uiKey: session.liquid.uiKey,
            processForm: session.liquid.processForm,
            material: liquidMaterial,
            gradeCode: "",
            fallback: {
              materialId: entry.liquidMaterialId,
              materialCode: entry.liquidMaterialCode,
              materialName: liquidMaterial?.materialName ?? entry.materialName,
            },
          }) ??
          buildProcessFromPending(
            session.pendingLiquidProcess,
            liquidFallback,
            uiKeyToProcessType(session.liquid.uiKey),
          ) ??
          (weightmentHasMaterialData(weightmentSheet, entry.liquidMaterialCode)
            ? buildWeightmentOnlyProcessEntry(
                liquidFallback,
                uiKeyToProcessType(session.liquid.uiKey),
              )
            : null);

        if (process) {
          liquidProcess.push(process);
        }
      }
    });

    if (solidProcess.length === 0 && liquidProcess.length === 0 && !params.includeEmptyPremixes)
      return;

    const premixDate = String(entries[0]?.premixDate ?? "").trim();
    const hasSolid = entries.some((entry) => entry.selectedProcesses.solid);
    const hasLiquid = entries.some((entry) => entry.selectedProcesses.liquid);
    const materialType =
      hasSolid && hasLiquid ? "BOTH" : hasSolid ? "SOLID" : hasLiquid ? "LIQUID" : "BOTH";

    premixes.push({
      premixNo,
      premixDate: formatToIsoDateInput(premixDate) || premixDate,
      materialType,
      ...(params.premixSubmissionType ? { premixSubmissionType: params.premixSubmissionType } : {}),
      solidProcess,
      liquidProcess,
    });
  });

  return {
    preparationDetails: {
      premixes,
      weightmentSheet: mapWeightmentSheetToApi(params.weightmentSheet),
    },
  };
};

export const mapPreparationDetailsFromApi = (
  details: RawMaterialPreparationDetails,
  sheet?: {
    materials?: Array<{
      srNo: number;
      materialCode: string;
      materialName?: string;
      gradeCode?: string;
      gradeName?: string;
      lotId: string;
      make: string;
      requiredComposition: number;
      quantityPerPremix: number;
    }>;
  } | null,
  premixCount = 0,
  solidMaterials: MaterialsListItem[] = [],
  liquidMaterials: MaterialsListItem[] = [],
): {
  addedPremixSelections: RawMaterialPrepPremixSelection[];
  premixSessions: Record<string, RawMaterialPrepPremixSession>;
  weightmentSheet: RawMaterialPrepWeightmentSheet;
  premixStatusByNo: Record<number, PremixStatusMeta>;
} => {
  const apiPremixes = details.preparationDetails?.premixes ?? [];
  const addedPremixSelections: RawMaterialPrepPremixSelection[] = [];
  const premixSessions: Record<string, RawMaterialPrepPremixSession> = {};

  const gradesReferToSame = (
    left: string,
    right: string,
    material?: MaterialsListItem,
  ): boolean => {
    const a = left.trim().toUpperCase();
    const b = right.trim().toUpperCase();
    if (!a || !b) return true;
    if (a === b) return true;

    const grades = material?.grades ?? [];
    if (!grades.length) return false;

    const resolve = (raw: string) =>
      grades.find(
        (grade) => grade.gradeCode.toUpperCase() === raw || grade.gradeName.toUpperCase() === raw,
      );

    const leftGrade = resolve(a);
    const rightGrade = resolve(b);
    if (leftGrade && rightGrade) return leftGrade.gradeId === rightGrade.gradeId;
    if (leftGrade) {
      return leftGrade.gradeCode.toUpperCase() === b || leftGrade.gradeName.toUpperCase() === b;
    }
    if (rightGrade) {
      return rightGrade.gradeCode.toUpperCase() === a || rightGrade.gradeName.toUpperCase() === a;
    }
    return false;
  };

  const matchProcessToSelection = (
    process: PreparationProcessEntry | undefined,
    selection: RawMaterialPrepPremixSelection,
    slot: "solid" | "liquid",
  ) => {
    if (!process) return false;
    const code = String(process.materialCode ?? "")
      .trim()
      .toUpperCase();
    const selectionCode = String(
      slot === "solid" ? selection.solidMaterialCode : selection.liquidMaterialCode,
    )
      .trim()
      .toUpperCase();
    if (!code || code !== selectionCode) return false;

    if (slot === "solid" && selection.solidGradeCode) {
      const processGrade = String(process.gradeCode ?? "").trim();
      const selectionGrade = selection.solidGradeCode.trim();
      if (
        processGrade &&
        selectionGrade &&
        !gradesReferToSame(
          processGrade,
          selectionGrade,
          findMaterialInList(solidMaterials, selection.solidMaterialCode),
        )
      ) {
        return false;
      }
    }

    return true;
  };

  const buildSelectionsForPremix = (premixNo: number, premixDate: string) => {
    const sheetMaterials = Array.isArray(sheet?.materials) ? sheet.materials : [];
    return sheetMaterials.map((row) => {
      const materialCode = String(row.materialCode ?? "").trim();
      const gradeRaw = String(row.gradeCode ?? row.gradeName ?? "").trim();
      const inSolid = solidMaterials.some(
        (material) => material.materialCode.toUpperCase() === materialCode.toUpperCase(),
      );
      const inLiquid = liquidMaterials.some(
        (material) => material.materialCode.toUpperCase() === materialCode.toUpperCase(),
      );
      const selectedProcesses = {
        solid: inSolid,
        liquid: inLiquid,
      };

      const solidMaterial = inSolid ? findMaterialInList(solidMaterials, materialCode) : undefined;
      const liquidMaterial = inLiquid
        ? findMaterialInList(liquidMaterials, materialCode)
        : undefined;
      const gradeMatch = findGradeInMaterial(solidMaterial, gradeRaw);
      const resolvedGradeCode = gradeMatch?.gradeCode ?? gradeRaw;
      const materialKey =
        materialSelectionKey(materialCode, resolvedGradeCode || undefined) || `sr-${row.srNo}`;
      const lotIds = (row.lotIds ?? []).map((id) => String(id ?? "").trim()).filter(Boolean);

      return {
        premix: premixNo,
        premixDate,
        materialKey,
        sheetSrNo: Number(row.srNo ?? 0),
        materialName: String(row.materialName ?? materialCode).trim(),
        lotId: lotIds.join(", "),
        lotIds,
        make: String(row.make ?? "").trim(),
        quantityPerPremix: Number(row.quantityPerPremix ?? 0),
        requiredComposition: Number(row.requiredComposition ?? 0),
        selectedProcesses,
        solidMaterialCode: selectedProcesses.solid ? materialCode : "",
        solidGradeCode: selectedProcesses.solid ? resolvedGradeCode : "",
        solidMaterialId: solidMaterial?.materialId,
        solidGradeId: gradeMatch?.gradeId,
        liquidMaterialCode: selectedProcesses.liquid ? materialCode : "",
        liquidMaterialId: liquidMaterial?.materialId,
      } satisfies RawMaterialPrepPremixSelection;
    });
  };

  const resolveProcessSessionKey = (
    premixNo: number,
    process: PreparationProcessEntry,
    selections: RawMaterialPrepPremixSelection[],
    slot: "solid" | "liquid",
  ) => {
    const matched = selections.find((selection) =>
      matchProcessToSelection(process, selection, slot),
    );
    if (matched) return `${premixNo}:${matched.materialKey}`;

    const code = String(process.materialCode ?? "").trim();
    const gradeRaw = String(process.gradeCode ?? "").trim();
    if (slot === "solid") {
      const material = findMaterialInList(solidMaterials, code);
      const gradeMatch = findGradeInMaterial(material, gradeRaw);
      const resolvedGrade = gradeMatch?.gradeCode ?? gradeRaw;
      return `${premixNo}:${materialSelectionKey(code, resolvedGrade || undefined)}`;
    }
    return `${premixNo}:${materialSelectionKey(code)}`;
  };

  const premixNumbers =
    premixCount > 0
      ? Array.from({ length: premixCount }, (_, index) => index + 1)
      : apiPremixes.map((premix) => Number(premix.premixNo ?? 0)).filter(Boolean);

  premixNumbers.forEach((premixNo) => {
    const apiPremix = apiPremixes.find((premix) => Number(premix.premixNo ?? 0) === premixNo);
    const premixDate = String(apiPremix?.premixDate ?? "").trim();
    const selections = buildSelectionsForPremix(premixNo, premixDate);

    selections.forEach((selection) => {
      if (!selection.solidMaterialCode && !selection.liquidMaterialCode) return;

      addedPremixSelections.push(selection);

      const solidEntry = apiPremix?.solidProcess?.find((process) =>
        matchProcessToSelection(process, selection, "solid"),
      );
      const liquidEntry = apiPremix?.liquidProcess?.find((process) =>
        matchProcessToSelection(process, selection, "liquid"),
      );

      const pendingSolid = solidEntry
        ? (JSON.parse(JSON.stringify(solidEntry)) as PreparationProcessEntry)
        : undefined;
      const pendingLiquid = liquidEntry
        ? (JSON.parse(JSON.stringify(liquidEntry)) as PreparationProcessEntry)
        : undefined;

      const solidSlot = hydratePremixProcessSlot(
        "solid",
        selection.solidMaterialCode,
        pendingSolid,
        selection.solidGradeCode,
      );

      let apGradeSlots:
        Array<{ gradeCode: string; slot: RawMaterialPrepMaterialProcessSlot }> | undefined;
      if (
        String(selection.solidMaterialCode ?? "")
          .trim()
          .toUpperCase() === "AP"
      ) {
        const apProcesses = (apiPremix?.solidProcess ?? []).filter(
          (process) =>
            String(process.materialCode ?? "")
              .trim()
              .toUpperCase() === "AP",
        );
        if (apProcesses.length > 0) {
          apGradeSlots = apProcesses.map((process) => {
            const gradeCode = String(
              process.gradeCode ?? selection.solidGradeCode ?? "COARSE",
            ).trim();
            return {
              gradeCode,
              slot: hydratePremixProcessSlot("solid", "AP", process, gradeCode),
            };
          });
        } else if (selection.solidGradeCode) {
          apGradeSlots = [
            {
              gradeCode: selection.solidGradeCode,
              slot: solidSlot,
            },
          ];
        }
      }

      premixSessions[`${premixNo}:${selection.materialKey}`] = {
        ...createEmptyPremixProcessSession(),
        selectedProcesses: selection.selectedProcesses,
        solidMaterialCode: selection.solidMaterialCode,
        solidGradeCode: apGradeSlots?.[0]?.gradeCode ?? selection.solidGradeCode,
        liquidMaterialCode: selection.liquidMaterialCode,
        solid: apGradeSlots?.[0]?.slot ?? solidSlot,
        liquid: hydratePremixProcessSlot("liquid", selection.liquidMaterialCode, pendingLiquid),
        apGradeSlots,
        pendingSolidProcess: pendingSolid,
        pendingLiquidProcess: pendingLiquid,
      };
    });

    (apiPremix?.solidProcess ?? []).forEach((process) => {
      const code = String(process.materialCode ?? "").trim();
      const hasTyped =
        (process.lotDetails?.length ?? 0) > 0 ||
        Boolean(process.drying) ||
        Boolean(process.sieving) ||
        Boolean(process.apCoarse) ||
        Boolean(process.apFine) ||
        Boolean(process.apUltraFine) ||
        Boolean(process.aluminum) ||
        Boolean(process.doa) ||
        (process.sections?.length ?? 0) > 0;
      if (!code || !hasTyped) return;
      const grade = String(process.gradeCode ?? "").trim();
      const sessionKey = resolveProcessSessionKey(premixNo, process, selections, "solid");
      const pendingSolid = JSON.parse(JSON.stringify(process)) as PreparationProcessEntry;
      premixSessions[sessionKey] = {
        ...(premixSessions[sessionKey] ?? {
          ...createEmptyPremixProcessSession(),
          selectedProcesses: { solid: true, liquid: false },
          solidMaterialCode: code,
          solidGradeCode: grade,
          liquidMaterialCode: "",
        }),
        solidMaterialCode: premixSessions[sessionKey]?.solidMaterialCode || code,
        solidGradeCode: premixSessions[sessionKey]?.solidGradeCode || grade,
        solid: hydratePremixProcessSlot("solid", code, pendingSolid, grade),
        pendingSolidProcess: pendingSolid,
      };
    });

    (apiPremix?.liquidProcess ?? []).forEach((process) => {
      const code = String(process.materialCode ?? "").trim();
      const hasTyped =
        (process.lotDetails?.length ?? 0) > 0 ||
        Boolean(process.drying) ||
        Boolean(process.sieving) ||
        (process.sections?.length ?? 0) > 0;
      if (!code || !hasTyped) return;
      const sessionKey = resolveProcessSessionKey(premixNo, process, selections, "liquid");
      const pendingLiquid = JSON.parse(JSON.stringify(process)) as PreparationProcessEntry;
      premixSessions[sessionKey] = {
        ...(premixSessions[sessionKey] ?? {
          ...createEmptyPremixProcessSession(),
          selectedProcesses: { solid: false, liquid: true },
          solidMaterialCode: "",
          solidGradeCode: "",
          liquidMaterialCode: code,
        }),
        liquidMaterialCode: premixSessions[sessionKey]?.liquidMaterialCode || code,
        liquid: hydratePremixProcessSlot("liquid", code, pendingLiquid),
        pendingLiquidProcess: pendingLiquid,
      };
    });
  });

  const premixStatusByNo: Record<number, PremixStatusMeta> = {};
  const rootPremixStatuses = details.premixStatuses ?? [];

  rootPremixStatuses.forEach((entry) => {
    if (!entry?.premixNo) return;
    premixStatusByNo[entry.premixNo] = {
      premixSubmissionType: entry.premixSubmissionType,
      premixSubmissionStatus: entry.premixSubmissionStatus ?? "TO_BE_INITIATED",
      submittedAt: entry.submittedAt ?? null,
      reviewedBy: typeof entry.reviewedBy === "string" ? entry.reviewedBy : null,
      reviewedAt: entry.reviewedAt ?? null,
      remarks: entry.remarks ?? null,
      rejectionReason: entry.rejectionReason ?? null,
    };
  });

  apiPremixes.forEach((premix) => {
    const premixNo = Number(premix.premixNo ?? 0);
    if (!premixNo) return;
    premixStatusByNo[premixNo] = {
      ...premixStatusByNo[premixNo],
      premixSubmissionType:
        premix.premixSubmissionType ?? premixStatusByNo[premixNo]?.premixSubmissionType,
      premixSubmissionStatus:
        premix.premixSubmissionStatus ??
        premixStatusByNo[premixNo]?.premixSubmissionStatus ??
        "TO_BE_INITIATED",
      submittedAt: premix.submittedAt ?? premixStatusByNo[premixNo]?.submittedAt ?? null,
      reviewedBy:
        typeof premix.reviewedBy === "string"
          ? premix.reviewedBy
          : (premixStatusByNo[premixNo]?.reviewedBy ?? null),
      reviewedAt: premix.reviewedAt ?? premixStatusByNo[premixNo]?.reviewedAt ?? null,
      remarks: premix.remarks ?? premixStatusByNo[premixNo]?.remarks ?? null,
      rejectionReason:
        premix.rejectionReason ?? premixStatusByNo[premixNo]?.rejectionReason ?? null,
    };
  });
  for (let i = 1; i <= premixCount; i++) {
    if (!premixStatusByNo[i]) {
      premixStatusByNo[i] = { premixSubmissionStatus: "TO_BE_INITIATED" };
    }
  }

  return {
    addedPremixSelections,
    premixSessions,
    weightmentSheet: mapWeightmentSheetFromApi(details.preparationDetails?.weightmentSheet),
    premixStatusByNo,
  };
};

export const premixSessionHasData = (session: RawMaterialPrepPremixSession) => {
  const solidFilled =
    session.selectedProcesses.solid && processFormHasUserData(session.solid.processForm);
  const liquidFilled =
    session.selectedProcesses.liquid && processFormHasUserData(session.liquid.processForm);
  return solidFilled || liquidFilled;
};

export class RawMaterialPreparationSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;
  formSubmissionType: string;
  premixCount: number;
  totalSolidMaterials: number;
  totalLiquidMaterials: number;
  weightmentSheetIncluded: boolean;
  submittedBy: string;
  submittedAt: string;
  batchStatus: string;
  allPremixesApproved: boolean;
  premixStatuses: Array<{ premixNo: number; premixSubmissionStatus: string }>;

  constructor(data: Partial<RawMaterialPreparationSubmitResponse> = {}) {
    this.formId = data.formId ?? "";
    this.batchId = data.batchId ?? "";
    this.status = data.status ?? "";
    this.formSubmissionType = data.formSubmissionType ?? "";
    this.premixCount = Number(data.premixCount ?? 0);
    this.totalSolidMaterials = Number(data.totalSolidMaterials ?? 0);
    this.totalLiquidMaterials = Number(data.totalLiquidMaterials ?? 0);
    this.weightmentSheetIncluded = Boolean(data.weightmentSheetIncluded);
    this.submittedBy = data.submittedBy ?? "";
    this.submittedAt = data.submittedAt ?? "";
    this.batchStatus = data.batchStatus ?? "";
    this.allPremixesApproved = Boolean(data.allPremixesApproved);
    this.premixStatuses = Array.isArray(data.premixStatuses) ? data.premixStatuses : [];
  }

  static fromApi(apiResponse: any) {
    const data = apiResponse?.data ?? apiResponse;
    return new RawMaterialPreparationSubmitResponseModel({
      formId: data?.formId,
      batchId: data?.batchId,
      status: data?.status,
      formSubmissionType: data?.formSubmissionType,
      premixCount: data?.premixCount,
      totalSolidMaterials: data?.totalSolidMaterials,
      totalLiquidMaterials: data?.totalLiquidMaterials,
      weightmentSheetIncluded: data?.weightmentSheetIncluded,
      submittedBy: data?.submittedBy,
      submittedAt: data?.submittedAt,
      batchStatus: data?.batchStatus,
      allPremixesApproved: data?.allPremixesApproved,
      premixStatuses: data?.premixStatuses,
    });
  }
}

const mapPrepPersonFromApi = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    const person = value as { fullName?: string; name?: string; id?: string };
    return String(person.fullName ?? person.name ?? person.id ?? "").trim();
  }
  return String(value).trim();
};

const mergePremixStatusesOntoDetails = (
  premixes: Array<{
    premixNo: number;
    premixDate?: string;
    materialType?: string;
    premixSubmissionType?: PremixSubmissionType;
    premixSubmissionStatus?: PremixSubmissionStatus;
    submittedAt?: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    remarks?: string | null;
    rejectionReason?: string | null;
    solidProcess?: PreparationProcessEntry[];
    liquidProcess?: PreparationProcessEntry[];
    [key: string]: unknown;
  }> = [],
  premixStatuses: RawMaterialPreparationDetails["premixStatuses"] = [],
  totalPremixCount = 0,
) => {
  const premixByNo = new Map(
    (premixes ?? []).map((premix) => [Number(premix.premixNo ?? 0), premix]),
  );
  const statusByNo = new Map(
    (premixStatuses ?? []).map((entry) => [Number(entry.premixNo ?? 0), entry]),
  );

  const allPremixNos = new Set<number>();
  premixByNo.forEach((_, premixNo) => {
    if (premixNo > 0) allPremixNos.add(premixNo);
  });
  statusByNo.forEach((_, premixNo) => {
    if (premixNo > 0) allPremixNos.add(premixNo);
  });
  if (totalPremixCount > 0) {
    for (let i = 1; i <= totalPremixCount; i += 1) {
      allPremixNos.add(i);
    }
  }

  const sortedPremixNos = [...allPremixNos].sort((a, b) => a - b);
  if (sortedPremixNos.length === 0) {
    return (premixes ?? []).map((premix) => {
      const statusEntry = statusByNo.get(Number(premix.premixNo ?? 0));
      return {
        ...premix,
        materialType: String(premix.materialType ?? ""),
        premixSubmissionType: premix.premixSubmissionType ?? statusEntry?.premixSubmissionType,
        premixSubmissionStatus:
          premix.premixSubmissionStatus ?? statusEntry?.premixSubmissionStatus ?? "TO_BE_INITIATED",
        submittedAt: premix.submittedAt ?? statusEntry?.submittedAt ?? null,
        reviewedBy:
          typeof premix.reviewedBy === "string"
            ? premix.reviewedBy
            : typeof statusEntry?.reviewedBy === "string"
              ? statusEntry.reviewedBy
              : null,
        reviewedAt: premix.reviewedAt ?? statusEntry?.reviewedAt ?? null,
        remarks: premix.remarks ?? statusEntry?.remarks ?? null,
        rejectionReason: premix.rejectionReason ?? statusEntry?.rejectionReason ?? null,
      };
    });
  }

  return sortedPremixNos.map((premixNo) => {
    const premix = premixByNo.get(premixNo);
    const statusEntry = statusByNo.get(premixNo);

    return {
      premixNo,
      premixDate: String(premix?.premixDate ?? ""),
      materialType: String(premix?.materialType ?? ""),
      solidProcess: premix?.solidProcess ?? [],
      liquidProcess: premix?.liquidProcess ?? [],
      premixSubmissionType: premix?.premixSubmissionType ?? statusEntry?.premixSubmissionType,
      premixSubmissionStatus:
        premix?.premixSubmissionStatus ?? statusEntry?.premixSubmissionStatus ?? "TO_BE_INITIATED",
      submittedAt: premix?.submittedAt ?? statusEntry?.submittedAt ?? null,
      reviewedBy:
        typeof premix?.reviewedBy === "string"
          ? premix.reviewedBy
          : typeof statusEntry?.reviewedBy === "string"
            ? statusEntry.reviewedBy
            : null,
      reviewedAt: premix?.reviewedAt ?? statusEntry?.reviewedAt ?? null,
      remarks: premix?.remarks ?? statusEntry?.remarks ?? null,
      rejectionReason: premix?.rejectionReason ?? statusEntry?.rejectionReason ?? null,
    };
  });
};

export class RawMaterialPreparationDetailsModel {
  static fromApi(apiResponse: any): RawMaterialPreparationDetails {
    const data = apiResponse?.data ?? apiResponse;
    const root = data?.form && typeof data.form === "object" ? data.form : data;
    const premixStatuses = Array.isArray(root?.premixStatuses ?? data?.premixStatuses)
      ? (root?.premixStatuses ?? data?.premixStatuses)
      : [];
    const preparationDetails = root?.preparationDetails ??
      data?.preparationDetails ?? { premixes: [] };
    const mergedPremixes = mergePremixStatusesOntoDetails(
      preparationDetails?.premixes,
      premixStatuses,
      Number(root?.totalPremixCount ?? data?.totalPremixCount ?? 0),
    );

    return {
      formId: String(root?.formId ?? data?.formId ?? ""),
      batchId: String(root?.batchId ?? data?.batchId ?? ""),
      subDepartmentId: Number(root?.subDepartmentId ?? data?.subDepartmentId ?? 0),
      formSubmissionType: String(root?.formSubmissionType ?? data?.formSubmissionType ?? ""),
      status:
        root?.status != null
          ? String(root.status)
          : data?.status != null
            ? String(data.status)
            : undefined,
      createdBy: mapPrepPersonFromApi(root?.createdBy ?? data?.createdBy) || null,
      createdAt:
        root?.createdAt != null
          ? String(root.createdAt)
          : data?.createdAt != null
            ? String(data.createdAt)
            : null,
      pendingPremixCount: Number(root?.pendingPremixCount ?? data?.pendingPremixCount ?? 0),
      approvedPremixCount: Number(root?.approvedPremixCount ?? data?.approvedPremixCount ?? 0),
      rejectedPremixCount: Number(root?.rejectedPremixCount ?? data?.rejectedPremixCount ?? 0),
      inProgressPremixCount: Number(
        root?.inProgressPremixCount ?? data?.inProgressPremixCount ?? 0,
      ),
      totalPremixCount: Number(root?.totalPremixCount ?? data?.totalPremixCount ?? 0),
      premixStatuses,
      preparationDetails: {
        ...preparationDetails,
        premixes: mergedPremixes,
      },
    };
  }
}

export type RawMaterialPrepApproverSectionView = {
  sectionId: string;
  sectionData: Record<string, unknown>[];
};

export type RawMaterialPrepApproverProcessView = {
  materialCode: string;
  materialName: string;
  gradeCode: string | null;
  sections: RawMaterialPrepApproverSectionView[];
};

export type RawMaterialPrepApproverPremixView = {
  premixNo: number;
  premixDate: string;
  materialType: string;
  premixSubmissionType?: PremixSubmissionType;
  premixSubmissionStatus?: PremixSubmissionStatus;
  submittedAt?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  remarks?: string | null;
  rejectionReason?: string | null;
  solidProcesses: RawMaterialPrepApproverProcessView[];
  liquidProcesses: RawMaterialPrepApproverProcessView[];
};

export type RawMaterialPrepApproverDetailView = {
  formId: string;
  batchId: string;
  status?: string;
  formSubmissionType?: string;
  createdBy?: string | null;
  createdAt?: string | null;
  premixCounts?: PremixCounts;
  premixes: RawMaterialPrepApproverPremixView[];
  weightmentSheet: Record<string, unknown> | null;
};

const PREP_SECTION_ACRONYMS = new Set([
  "AP",
  "PSD",
  "RVD",
  "TDI",
  "HTPB",
  "DOA",
  "IO",
  "CC",
  "NA",
  "Kg",
  "ID",
]);

const titleCasePrepToken = (token: string): string => {
  const trimmed = token.trim();
  if (!trimmed) return "";
  const upper = trimmed.toUpperCase();
  if (PREP_SECTION_ACRONYMS.has(upper)) return upper;
  if (/^\d+$/.test(trimmed)) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

/** Human-readable label from schema section / field ids (FEED_MATERIAL_DETAILS → Feed Material Details). */
export const formatPrepSectionLabel = (sectionId: string): string => {
  const raw = String(sectionId ?? "").trim();
  if (!raw) return "";

  const knownLabels: Record<string, string> = {
    srNo: "Sr No.",
  };
  if (knownLabels[raw]) return knownLabels[raw];

  const words = raw
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  return words.map(titleCasePrepToken).join(" ");
};

export const formatPrepSectionCellValue = (value: unknown): string => {
  const unwrapped = unwrapApiScalar(value);
  if (unwrapped === null || unwrapped === undefined || unwrapped === "") return "—";
  if (typeof unwrapped === "object") {
    if (Array.isArray(unwrapped)) {
      return unwrapped.length > 0
        ? unwrapped.map((entry) => formatPrepSectionCellValue(entry)).join(", ")
        : "—";
    }
    const entries = Object.entries(unwrapped as Record<string, unknown>).filter(
      ([key, entryValue]) =>
        !key.startsWith("_") &&
        entryValue !== null &&
        entryValue !== undefined &&
        entryValue !== "",
    );
    if (entries.length === 0) return "—";
    return entries
      .map(
        ([key, entryValue]) =>
          `${formatPrepSectionLabel(key)}: ${formatPrepSectionCellValue(entryValue)}`,
      )
      .join("; ");
  }
  return String(unwrapped);
};

/** Expand nested repeat/table blocks (e.g. FEED_LOTS) into flat table rows for read-only views. */
const prepSectionRowHasContent = (row: Record<string, unknown>): boolean =>
  Object.entries(row).some(
    ([key, value]) =>
      !key.startsWith("_") &&
      value !== null &&
      value !== undefined &&
      value !== "" &&
      !(
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.keys(value as object).length === 0
      ),
  );

export const expandRawMaterialPrepSectionRows = (
  sectionData: Record<string, unknown>[] | undefined,
): Record<string, unknown>[] => {
  if (!Array.isArray(sectionData)) return [];

  const rows: Record<string, unknown>[] = [];

  sectionData.forEach((dataRow) => {
    if (!dataRow || typeof dataRow !== "object") return;

    const entries = Object.entries(dataRow).filter(([key]) => !key.startsWith("_"));
    const arrayEntries = entries.filter(([, value]) => Array.isArray(value));
    const scalarEntries = entries.filter(([, value]) => !Array.isArray(value));

    if (arrayEntries.length === 1 && scalarEntries.length === 0) {
      (arrayEntries[0][1] as unknown[]).forEach((item) => {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          const row = item as Record<string, unknown>;
          if (prepSectionRowHasContent(row)) rows.push(row);
        }
      });
      return;
    }

    if (prepSectionRowHasContent(dataRow)) {
      rows.push(dataRow);
    }
  });

  return rows;
};

export const isPrepSectionNestedTableValue = (value: unknown): value is Record<string, unknown>[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((entry) => entry && typeof entry === "object" && !Array.isArray(entry));

/** Nested table blocks embedded in a section row (e.g. qcChecks inside blending). */
export const extractPrepSectionNestedTableKeys = (rows: Record<string, unknown>[]): string[] => {
  const keys = new Set<string>();
  rows.forEach((row) => {
    Object.entries(row).forEach(([key, value]) => {
      if (!key.startsWith("_") && isPrepSectionNestedTableValue(value)) {
        keys.add(key);
      }
    });
  });
  return [...keys];
};

export const collectPrepSectionNestedTableRows = (
  rows: Record<string, unknown>[],
  nestedKey: string,
): Record<string, unknown>[] =>
  rows.flatMap((row) => {
    const nested = row[nestedKey];
    return isPrepSectionNestedTableValue(nested) ? nested : [];
  });

const mapProcessSections = (
  process: PreparationProcessEntry,
): RawMaterialPrepApproverProcessView => ({
  materialCode: String(process.materialCode ?? ""),
  materialName: String(process.materialName ?? process.materialCode ?? ""),
  gradeCode: process.gradeCode ?? null,
  sections: typedProcessToDisplaySections(process).filter(
    (section) => expandRawMaterialPrepSectionRows(section.sectionData).length > 0,
  ),
});

export const mapRawMaterialPreparationApproverDetailView = (
  details: RawMaterialPreparationDetails,
): RawMaterialPrepApproverDetailView => ({
  formId: details.formId,
  batchId: details.batchId,
  status: getRawMaterialPrepBatchStatusLabel(details.status),
  formSubmissionType: String(details.formSubmissionType ?? "").trim() || undefined,
  createdBy: details.createdBy ?? null,
  createdAt: details.createdAt ?? null,
  premixCounts: {
    pendingPremixCount: details.pendingPremixCount ?? 0,
    approvedPremixCount: details.approvedPremixCount ?? 0,
    rejectedPremixCount: details.rejectedPremixCount ?? 0,
    inProgressPremixCount: details.inProgressPremixCount ?? 0,
    totalPremixCount: details.totalPremixCount ?? 0,
  },
  premixes: (details.preparationDetails?.premixes ?? []).map((premix) => ({
    premixNo: Number(premix.premixNo ?? 0),
    premixDate: String(premix.premixDate ?? "").trim(),
    materialType: String(premix.materialType ?? ""),
    premixSubmissionType: premix.premixSubmissionType,
    premixSubmissionStatus: premix.premixSubmissionStatus,
    submittedAt: premix.submittedAt ?? null,
    reviewedBy: typeof premix.reviewedBy === "string" ? premix.reviewedBy : null,
    reviewedAt: premix.reviewedAt ?? null,
    remarks: premix.remarks ?? null,
    rejectionReason: premix.rejectionReason ?? null,
    solidProcesses: (premix.solidProcess ?? []).map(mapProcessSections),
    liquidProcesses: (premix.liquidProcess ?? []).map(mapProcessSections),
  })),
  weightmentSheet:
    details.preparationDetails?.weightmentSheet &&
    typeof details.preparationDetails.weightmentSheet === "object"
      ? (details.preparationDetails.weightmentSheet as Record<string, unknown>)
      : null,
});

/** Preferred column order for schema-driven section tables (matches RMP schema field order). */
export const orderPrepSectionColumns = (columns: string[]): string[] => {
  const priority = [
    // Common / identity
    "srNo",
    "lotNumber",
    "mfgBatchLotNumber",
    "quantity",
    "totalQuantity",
    "quantitySieved",

    // Process / set vs actual
    "operation",
    "parameter",
    "setParameter",
    "actualParameter",
    "value",
    "equipmentId",
    "setRpm",
    "agitatorRpm",
    "screwFeederRpm",
    "processTemperature",
    "jacketTemperature",
    "setPressure",
    "feedPressure",
    "grindingPressure",

    // Oven / drying (schema order)
    "ovenType",
    "ovenNumber",
    "ovenSetTemperature",

    // Time fields — start before end
    "startTime",
    "startDatetime",
    "endTime",
    "endDatetime",
    "sievingDatetime",
    "sievingDispatchDatetime",
    "dispatchDatetime",
    "dispatchTime",

    // Sieving / PSD / results
    "sievedQuantity",
    "sieveMeshSize",
    "oversizeQuantity",
    "undersizeQuantity",
    "sizeRange",
    "particleSize",
    "psdRequirement",
    "specification",
    "result",
    "moisture",
    "observation",
    "qualifiedQuantity",
    "totalQuantitySentForPremix",

    // Unload / dispatch / mixing
    "binNumber",
    "binCapacity",
    "filledQuantity",
    "numberOfDrums",
    "drumNumber",
    "amountOfMaterial",
  ];
  const normalize = (column: string) => toCamelCaseKey(column);
  const originalIndex = new Map(columns.map((column, index) => [column, index]));

  return [...columns].sort((a, b) => {
    const ai = priority.indexOf(normalize(a));
    const bi = priority.indexOf(normalize(b));
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    // Preserve API/schema insertion order for unknown fields (avoid A–Z reordering).
    return (originalIndex.get(a) ?? 0) - (originalIndex.get(b) ?? 0);
  });
};

/** Single entry point for user + approver detail views. */
export const mapRawMaterialPreparationDetailsForDisplay = (
  details: RawMaterialPreparationDetails | null | undefined,
) => {
  if (!details) {
    return {
      detailView: null as RawMaterialPrepApproverDetailView | null,
      weightmentSheet: createEmptyWeightmentSheet(),
    };
  }

  const detailView = mapRawMaterialPreparationApproverDetailView(details);
  const weightmentSheet = mapWeightmentSheetFromApi(
    detailView.weightmentSheet ?? details.preparationDetails?.weightmentSheet,
  );

  return { detailView, weightmentSheet };
};
