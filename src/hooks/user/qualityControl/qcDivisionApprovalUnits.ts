import type { QualityControlFormState } from "../../../data/models/user/QualityControlFormModel";
import type { QcDivisionEntry } from "./qcDivisionEntryTypes";

export type QcPartialItemStatus =
  | "TO_BE_INITIATED"
  | "IN_PROGRESS"
  | "WAITING_FOR_APPROVAL"
  | "APPROVED"
  | "REJECTED";

export type QcPartialNavKind = "MOTOR" | "PREMIX" | "FINAL_MIX" | "DIVISION";

export type QcPartialNavItem = {
  id: string;
  kind: QcPartialNavKind;
  label: string;
  status: QcPartialItemStatus;
  /** Status from `/qc-division/division-details` — prerequisite for enabling QC on this unit. */
  divisionDetailsStatus?: QcPartialItemStatus;
  motorId?: string;
  premixNo?: number;
  finalMixNo?: number;
  /** Raw Material Processing: SOLID_PROCESSING | LIQUID_PROCESSING | BOTH */
  processingType?: string;
  rejectionReason?: string | null;
};

export const PARTIAL_ITEM_STATUS_CHIP: Record<
  QcPartialItemStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  TO_BE_INITIATED: {
    label: "To Be Initiated",
    bg: "rgba(100,116,139,0.12)",
    color: "#475569",
    border: "rgba(100,116,139,0.28)",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "rgba(37,99,235,0.12)",
    color: "#1d4ed8",
    border: "rgba(37,99,235,0.28)",
  },
  WAITING_FOR_APPROVAL: {
    label: "Waiting for Approval",
    bg: "rgba(217,119,6,0.12)",
    color: "#b45309",
    border: "rgba(217,119,6,0.28)",
  },
  APPROVED: {
    label: "Approved",
    bg: "rgba(22,163,74,0.12)",
    color: "#15803d",
    border: "rgba(22,163,74,0.28)",
  },
  REJECTED: {
    label: "Rejected",
    bg: "rgba(220,38,38,0.12)",
    color: "#b91c1c",
    border: "rgba(220,38,38,0.28)",
  },
};

const MOTOR_FLOW_KEYS = new Set([
  "HARDWARE",
  "CASTING",
  "CURING",
  "TRIMMING",
  "DE_CORING",
  "POST_CURE",
  "NDT",
  "QC",
  "WEIGHTMENT",
]);

export const normalizePartialItemStatus = (value: unknown): QcPartialItemStatus => {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (
    raw === "IN_PROGRESS" ||
    raw === "WAITING_FOR_APPROVAL" ||
    raw === "APPROVED" ||
    raw === "REJECTED" ||
    raw === "TO_BE_INITIATED"
  ) {
    return raw;
  }
  if (raw.includes("PARTIAL") || raw === "WAITING_FOR_PARTIAL_APPROVAL") {
    return "WAITING_FOR_APPROVAL";
  }
  return "TO_BE_INITIATED";
};

const normalizeStatus = normalizePartialItemStatus;

/** Match QC division keys across legacy and contract shapes. */
export const qcDivisionStatusKeysMatch = (
  left: string | null | undefined,
  right: string | null | undefined,
): boolean => {
  const a = String(left ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  const b = String(right ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (!a || !b) return false;
  if (a === b) return true;
  if (
    (a === "POST_CURE" && b === "POST_CURE_OPERATION") ||
    (b === "POST_CURE" && a === "POST_CURE_OPERATION")
  ) {
    return true;
  }
  if (
    (a === "QC" && b === "PROPELLANT_PROPERTIES") ||
    (b === "QC" && a === "PROPELLANT_PROPERTIES")
  ) {
    return true;
  }
  return false;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const pickNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
};

const pickString = (...values: unknown[]): string => {
  for (const value of values) {
    const s = String(value ?? "").trim();
    if (s) return s;
  }
  return "";
};

const extractMotorIds = (data: Record<string, unknown>): Array<{ motorId: string; status?: unknown }> => {
  const fromObjects = [
    ...asArray(data.motorDetails),
    ...asArray(data.motors),
    ...asArray(data.curingDetails),
    ...asArray(data.deCoringDetails),
    ...asArray(data.decoringDetails),
    ...asArray(data.trimmingDetails),
    ...asArray(data.postCureMotorDetails),
    ...asArray(data.weighmentDetails),
    ...asArray(data.motorWeightDetails),
  ]
    .map((row) => {
      const rec = asRecord(row);
      if (rec) {
        const motorId = pickString(rec.motorIdNo, rec.motorId, rec.id, rec.motor_id);
        if (!motorId) return null;
        return {
          motorId,
          status:
            rec.status ??
            rec.motorSubmissionStatus ??
            rec.motor_submission_status,
        };
      }
      const motorId = pickString(row);
      return motorId ? { motorId } : null;
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (fromObjects.length) return fromObjects;

  return asArray(data.motorIds ?? data.motor_ids)
    .map((row) => {
      const motorId = pickString(row);
      return motorId ? { motorId } : null;
    })
    .filter((row): row is { motorId: string } => Boolean(row));
};

const normalizeProcessingType = (value: unknown): string | undefined => {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (!raw) return undefined;
  if (raw === "LIQUID_PROCESSING" || raw === "LIQUID") return "LIQUID_PROCESSING";
  if (raw === "SOLID_PROCESSING" || raw === "SOLID") return "SOLID_PROCESSING";
  if (raw === "BOTH") return "BOTH";
  if (raw.includes("LIQUID")) return "LIQUID_PROCESSING";
  if (raw.includes("SOLID")) return "SOLID_PROCESSING";
  return undefined;
};

const extractBatchPremixCount = (batchPayload: unknown): number => {
  const root = asRecord(batchPayload);
  if (!root) return 0;
  const batch = asRecord(root.__batchDetails) ?? root;
  const sheet = asRecord(batch.identificationSheet);
  const count =
    pickNumber(
      sheet?.numberOfPremix,
      sheet?.number_of_premix,
      batch.numberOfPremix,
      batch.premixCount,
    ) ?? 0;
  if (count > 0) return count;
  if (asArray(sheet?.materials).length > 0) return 1;
  return 0;
};

/** Motor IDs from batch details when division-details returns no motors. */
export const extractBatchMotorIds = (
  batchPayload: unknown,
): Array<{ motorId: string; status?: unknown }> => {
  const root = asRecord(batchPayload);
  if (!root) return [];
  const batch = asRecord(root.__batchDetails) ?? root;

  const fromArray = Array.isArray(batch.motorIds)
    ? batch.motorIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  if (fromArray.length > 0) {
    const unique = Array.from(new Set(fromArray.filter((id) => !id.includes(","))));
    return unique.map((motorId) => ({ motorId }));
  }

  const singleId = String(batch.motorId ?? "").trim();
  if (!singleId) return [];

  const parsed = singleId
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (parsed.length > 1) {
    return parsed.map((motorId) => ({ motorId }));
  }

  return [{ motorId: singleId }];
};

export { extractBatchPremixCount };

/** Build unit tabs strictly from batch details (motorIds, premix count). */
export const mapBatchUnitsToPartialNav = (params: {
  flowKey: string;
  rawMaterialType?: string;
  batchPayload?: unknown;
}): QcPartialNavItem[] => {
  const flowKey = String(params.flowKey ?? "").trim();
  const isRawMaterialProcessing =
    String(params.rawMaterialType ?? "").trim() === "RAW_MATERIAL_PROCESSING";
  const items: QcPartialNavItem[] = [];

  const motors = extractBatchMotorIds(params.batchPayload);
  const premixCount = extractBatchPremixCount(params.batchPayload);

  if (motors.length > 0 && isMotorBasedPartialFlow(flowKey)) {
    motors.forEach((motor) => {
      items.push({
        id: `motor:${motor.motorId}`,
        kind: "MOTOR",
        label: motor.motorId,
        status: "TO_BE_INITIATED",
        motorId: motor.motorId,
      });
    });
  }

  if (flowKey === "MIXING" && premixCount > 0) {
    Array.from({ length: premixCount }, (_, index) => index + 1).forEach((premixNo) => {
      items.push({
        id: `premix:${premixNo}`,
        kind: "PREMIX",
        label: `Premix ${premixNo}`,
        status: "TO_BE_INITIATED",
        premixNo,
        processingType: "SOLID_PROCESSING",
      });
      items.push({
        id: `final-mix:${premixNo}`,
        kind: "FINAL_MIX",
        label: `Final Mix ${premixNo}`,
        status: "TO_BE_INITIATED",
        finalMixNo: premixNo,
        premixNo,
      });
    });
  } else if (isRawMaterialProcessing && flowKey === "RAW_MATERIAL" && premixCount > 0) {
    Array.from({ length: premixCount }, (_, index) => index + 1).forEach((premixNo) => {
      items.push({
        id: `premix:${premixNo}`,
        kind: "PREMIX",
        label: `Premix ${premixNo}`,
        status: "TO_BE_INITIATED",
        premixNo,
        processingType: "SOLID_PROCESSING",
      });
    });
  }

  return items;
};

/** True when /qc-division/division-details returned no unit rows (empty premixes/motors/stages). */
export const isEmptyManufacturingDivisionDetailsPayload = (payload: unknown): boolean => {
  if (!payload || typeof payload !== "object") return true;
  const root = payload as Record<string, unknown>;
  if (root.__qcFormDivisionData) return false;

  const manufacturing = asRecord(root.__manufacturingDivisionData) ?? root;
  const data = asRecord(manufacturing.data) ?? manufacturing;

  if (asArray(data.premixes).length > 0) return false;
  if (asArray(data.materials).length > 0) return false;
  if (asArray(data.ingredients).length > 0) return false;
  if (extractMotorIds(data).length > 0) return false;

  const mixingUnits = extractMixingStagesUnits(data);
  if (mixingUnits.premixes.length > 0 || mixingUnits.finalMixes.length > 0) return false;

  return true;
};

const extractPremixes = (
  data: Record<string, unknown>,
): Array<{ premixNo: number; status?: unknown; processingType?: string; label?: string }> => {
  const rows: Array<{ premixNo: number; status?: unknown; processingType?: string; label?: string }> = [];

  const pushRows = (source: unknown[], defaultProcessingType?: string) => {
    source.forEach((row) => {
      const rec = asRecord(row);
      if (rec) {
        const premixNo = pickNumber(rec.premixNo, rec.premix_no, rec.no, rec.id, rec.number);
        if (premixNo == null) return;
        rows.push({
          premixNo,
          status: rec.status ?? rec.premixSubmissionStatus ?? rec.premix_submission_status,
          processingType:
            normalizeProcessingType(
              rec.processingType ??
                rec.processing_type ??
                rec.subType ??
                rec.sub_type ??
                rec.materialType ??
                rec.material_type,
            ) ?? defaultProcessingType,
          label: pickString(rec.label, rec.premixLabel, rec.premix_label) || undefined,
        });
        return;
      }
      const premixNo = pickNumber(row);
      if (premixNo != null) {
        rows.push({ premixNo, processingType: defaultProcessingType });
      }
    });
  };

  pushRows(asArray(data.premixes));
  pushRows(asArray(data.premixDetails));
  pushRows(asArray(data.premix_details));
  pushRows(asArray(data.solidPremixes), "SOLID_PROCESSING");
  pushRows(asArray(data.solid_premixes), "SOLID_PROCESSING");
  pushRows(asArray(data.liquidPremixes), "LIQUID_PROCESSING");
  pushRows(asArray(data.liquid_premixes), "LIQUID_PROCESSING");

  if (rows.length) {
    const byNo = new Map<number, { premixNo: number; status?: unknown; processingType?: string; label?: string }>();
    rows.forEach((row) => {
      const existing = byNo.get(row.premixNo);
      byNo.set(row.premixNo, {
        premixNo: row.premixNo,
        status: row.status ?? existing?.status,
        processingType: row.processingType ?? existing?.processingType,
        label: row.label ?? existing?.label,
      });
    });
    return Array.from(byNo.values()).sort((a, b) => a.premixNo - b.premixNo);
  }

  return asArray(data.premixNos ?? data.premix_nos)
    .map((row) => {
      const premixNo = pickNumber(row);
      return premixNo != null ? { premixNo } : null;
    })
    .filter((row): row is { premixNo: number } => Boolean(row));
};

const extractFinalMixes = (
  data: Record<string, unknown>,
): Array<{ finalMixNo: number; status?: unknown }> => {
  const fromObjects = asArray(data.finalMixes ?? data.final_mixes)
    .map((row) => {
      const rec = asRecord(row);
      if (rec) {
        const finalMixNo = pickNumber(
          rec.finalMixNo,
          rec.final_mix_no,
          rec.mixNo,
          rec.premixNo,
          rec.no,
          rec.id,
          rec.number,
        );
        if (finalMixNo == null) return null;
        return {
          finalMixNo,
          status:
            rec.status ??
            rec.mixSubmissionStatus ??
            rec.premixSubmissionStatus ??
            rec.premix_submission_status,
        };
      }
      const finalMixNo = pickNumber(row);
      return finalMixNo != null ? { finalMixNo } : null;
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (fromObjects.length) return fromObjects;

  return asArray(data.finalMixNos ?? data.final_mix_nos)
    .map((row) => {
      const finalMixNo = pickNumber(row);
      return finalMixNo != null ? { finalMixNo } : null;
    })
    .filter((row): row is { finalMixNo: number } => Boolean(row));
};

/** Mixing `/qc-division/division-details` nests premix/final-mix units under `stages`. */
const extractMixingStagesUnits = (data: Record<string, unknown>) => {
  const premixes: Array<{ premixNo: number; status?: unknown }> = [];
  const finalMixes: Array<{ finalMixNo: number; status?: unknown }> = [];

  asArray(data.stages).forEach((stageRow) => {
    const stage = asRecord(stageRow);
    if (!stage) return;
    const stageType = String(stage.stageType ?? "").trim().toUpperCase();
    asArray(stage.premixes).forEach((entryRow) => {
      const entry = asRecord(entryRow);
      if (!entry) return;
      const no = pickNumber(entry.premixNo, entry.finalMixNo, entry.mixNo, entry.no);
      if (no == null) return;
      const details = asRecord(entry.details);
      const status =
        entry.premixSubmissionStatus ??
        entry.status ??
        details?.premixSubmissionStatus ??
        details?.status;
      if (stageType === "FINAL_MIX") {
        finalMixes.push({ finalMixNo: no, status });
        return;
      }
      if (stageType === "PREMIX") {
        premixes.push({ premixNo: no, status });
      }
    });
  });

  return { premixes, finalMixes };
};

export const isMotorBasedPartialFlow = (flowKey: string) => MOTOR_FLOW_KEYS.has(flowKey);

export const hasPartialChildNav = (items: QcPartialNavItem[] | null | undefined) =>
  (items ?? []).some(
    (item) => item.kind === "MOTOR" || item.kind === "PREMIX" || item.kind === "FINAL_MIX",
  );

/** Same lock rule as RMP premix / Case Prep motor / Mixing mix-card. */
export const isQcUnitLocked = (status?: QcPartialItemStatus | string | null) => {
  const normalized = normalizePartialItemStatus(status);
  return normalized === "WAITING_FOR_APPROVAL" || normalized === "APPROVED";
};

/** Details theme applies only after approval — not while waiting for approval. */
export const isQcUnitApproved = (status?: QcPartialItemStatus | string | null) =>
  normalizePartialItemStatus(status) === "APPROVED";

export const isQcUnitEditable = (status?: QcPartialItemStatus | string | null) =>
  !isQcUnitLocked(status);

/** Unit must be Approved in division-details before QC can open/fill it. */
export const isQcPartialItemEnabledByDivisionDetails = (
  item: QcPartialNavItem | null | undefined,
): boolean => {
  if (!item || item.kind === "DIVISION") return true;
  const qcStatus = normalizePartialItemStatus(item.status);
  // QC unit already started or resubmitted — keep accessible regardless of seed status.
  if (qcStatus !== "TO_BE_INITIATED" && qcStatus !== "REJECTED") return true;
  const prerequisite = item.divisionDetailsStatus ?? item.status;
  return normalizePartialItemStatus(prerequisite) === "APPROVED";
};

export const isQcPartialItemEnabledForWorkflow = (
  item: QcPartialNavItem | null | undefined,
  gate: { approvedPremixNos?: Set<number>; approvedMotorIds?: Set<string>; enableAll?: boolean } | null | undefined,
): boolean => {
  if (!isQcPartialItemEnabledByDivisionDetails(item)) return false;
  if (!item || item.kind === "DIVISION") return true;
  if (!gate || gate.enableAll) return true;
  if (item.kind === "PREMIX" || item.kind === "FINAL_MIX") {
    const premixNo = item.premixNo ?? item.finalMixNo;
    if (premixNo == null) return true;
    return gate.approvedPremixNos?.has(premixNo) ?? false;
  }
  if (item.kind === "MOTOR" && item.motorId) {
    return gate.approvedMotorIds?.has(item.motorId) ?? false;
  }
  return true;
};

export const getQcPartialNavDivisionDetailsDisabledReason = (
  item: QcPartialNavItem | undefined,
  messages: {
    motor?: string;
    premix?: string;
    premixDivisionLabel?: string;
  } = {},
): string | undefined => {
  if (!item || isQcPartialItemEnabledByDivisionDetails(item)) return undefined;
  if (item.kind === "PREMIX" || item.kind === "FINAL_MIX") {
    const template =
      messages.premix ??
      "This premix was not approved in {division} and cannot be filled in QC yet.";
    return template.replace("{division}", messages.premixDivisionLabel ?? "division details");
  }
  return (
    messages.motor ??
    "This motor was not approved in division details and cannot be filled in QC yet."
  );
};

export const findFirstEnabledPartialNavIndex = (
  items: QcPartialNavItem[],
  isEnabled: (index: number) => boolean,
): number => {
  const index = items.findIndex((_, itemIndex) => isEnabled(itemIndex));
  return index >= 0 ? index : 0;
};

/** @deprecated Prefer isQcUnitLocked — kept for existing call sites. */
export const isPartialItemReadOnly = (status: QcPartialItemStatus) => isQcUnitLocked(status);

export const aggregatePartialNavStatus = (
  items: QcPartialNavItem[] | null | undefined,
): QcPartialItemStatus => {
  const list = items ?? [];
  if (!list.length) return "TO_BE_INITIATED";
  if (list.some((item) => item.status === "REJECTED")) return "REJECTED";
  if (list.some((item) => item.status === "WAITING_FOR_APPROVAL")) return "WAITING_FOR_APPROVAL";
  if (list.some((item) => item.status === "IN_PROGRESS")) return "IN_PROGRESS";
  if (list.every((item) => item.status === "APPROVED")) return "APPROVED";
  return "TO_BE_INITIATED";
};

/**
 * Normalize division-details API payload into partial-approval nav items.
 * Prefer motors / premixes / final mixes when present; otherwise empty (classic single-division flow).
 */
export const mapDivisionDetailsToPartialNav = (
  payload: unknown,
  options: {
    flowKey: string;
    divisionLabel?: string;
    rawMaterialType?: string;
    batchPayload?: unknown;
  },
): QcPartialNavItem[] => {
  const root = asRecord(payload) ?? {};
  const data = asRecord(root.data) ?? root;
  const flowKey = String(options.flowKey ?? "").trim();
  const isRawMaterialProcessing =
    String(options.rawMaterialType ?? "").trim() === "RAW_MATERIAL_PROCESSING";

  const motorsFromDetails = extractMotorIds(data);
  let motors =
    motorsFromDetails.length > 0 || !isMotorBasedPartialFlow(flowKey)
      ? motorsFromDetails
      : extractBatchMotorIds(options.batchPayload);
  let premixes = extractPremixes(data);
  let finalMixes = extractFinalMixes(data);

  if (flowKey === "MIXING") {
    const fromStages = extractMixingStagesUnits(data);
    if (!premixes.length && fromStages.premixes.length) {
      premixes = fromStages.premixes;
    }
    if (!finalMixes.length && fromStages.finalMixes.length) {
      finalMixes = fromStages.finalMixes;
    }
    if (!premixes.length || !finalMixes.length) {
      const batchCount = extractBatchPremixCount(options.batchPayload);
      if (batchCount > 0) {
        if (!premixes.length) {
          premixes = Array.from({ length: batchCount }, (_, index) => ({
            premixNo: index + 1,
          }));
        }
        if (!finalMixes.length) {
          finalMixes = Array.from({ length: batchCount }, (_, index) => ({
            finalMixNo: index + 1,
          }));
        }
      }
    }
  }

  if (!premixes.length && isRawMaterialProcessing && flowKey === "RAW_MATERIAL") {
    const batchCount = extractBatchPremixCount(options.batchPayload);
    if (batchCount > 0) {
      premixes = Array.from({ length: batchCount }, (_, index) => ({
        premixNo: index + 1,
        processingType: "SOLID_PROCESSING",
      }));
    }
  }

  const items: QcPartialNavItem[] = [];

  if (motors.length > 0 && (isMotorBasedPartialFlow(flowKey) || !premixes.length)) {
    motors.forEach((motor) => {
      const divisionDetailsStatus = normalizeStatus(motor.status);
      items.push({
        id: `motor:${motor.motorId}`,
        kind: "MOTOR",
        label: motor.motorId,
        // Manufacturing / previous-stage status is a gate only — QC chips start TO_BE_INITIATED.
        status: "TO_BE_INITIATED",
        divisionDetailsStatus,
        motorId: motor.motorId,
      });
    });
  }

  if (premixes.length > 0) {
    premixes.forEach((premix) => {
      const divisionDetailsStatus = normalizeStatus(premix.status);
      items.push({
        id: `premix:${premix.premixNo}`,
        kind: "PREMIX",
        label: premix.label ?? `Premix ${premix.premixNo}`,
        status: "TO_BE_INITIATED",
        divisionDetailsStatus,
        premixNo: premix.premixNo,
        processingType: premix.processingType ?? "SOLID_PROCESSING",
      });
    });
  }

  if (finalMixes.length > 0) {
    finalMixes.forEach((mix) => {
      const divisionDetailsStatus = normalizeStatus(mix.status);
      items.push({
        id: `final-mix:${mix.finalMixNo}`,
        kind: "FINAL_MIX",
        label: `Final Mix ${mix.finalMixNo}`,
        status: "TO_BE_INITIATED",
        divisionDetailsStatus,
        finalMixNo: mix.finalMixNo,
        premixNo: mix.finalMixNo,
      });
    });
  }

  return items;
};

export const resolveEntryIdsForPartialItem = (
  entries: QcDivisionEntry[] | undefined,
  item: QcPartialNavItem | null | undefined,
  options?: { flowKey?: string | null },
): string[] => {
  if (!item) return [];
  const list = entries ?? [];
  const flowKey = String(options?.flowKey ?? "")
    .trim()
    .toUpperCase();

  if (item.kind === "MOTOR" && item.motorId) {
    return list
      .filter((entry) => {
        if (entry.motorId !== item.motorId) return false;
        if (flowKey && String(entry.flowKey ?? "").trim().toUpperCase() !== flowKey) return false;
        return true;
      })
      .map((entry) => entry.entryId);
  }

  if (item.kind === "PREMIX" && item.premixNo != null) {
    return list
      .filter((entry) => {
        if (entry.premixNo !== item.premixNo) return false;
        if (entry.kind === "MIXING_FINAL_MIX") return false;
        if (flowKey === "MIXING") return entry.kind === "MIXING_PREMIX";
        if (flowKey === "RAW_MATERIAL") {
          return (
            entry.kind === "PROCESSING_MATERIAL" ||
            entry.kind === "SOLID_PREMIX" ||
            entry.kind === "LIQUID_PREMIX" ||
            entry.kind === "BOTH_PREMIX"
          );
        }
        if (flowKey) return String(entry.flowKey ?? "").trim().toUpperCase() === flowKey;
        return true;
      })
      .map((entry) => entry.entryId);
  }

  if (item.kind === "FINAL_MIX") {
    const mixNo = item.finalMixNo ?? item.premixNo;
    return list
      .filter(
        (entry) =>
          entry.kind === "MIXING_FINAL_MIX" && (mixNo == null || entry.premixNo === mixNo),
      )
      .map((entry) => entry.entryId);
  }

  if (item.kind === "DIVISION") {
    return list
      .filter((entry) =>
        flowKey ? String(entry.flowKey ?? "").trim().toUpperCase() === flowKey : true,
      )
      .map((entry) => entry.entryId);
  }

  return [];
};

export const scopeFormStateToPartialItem = (
  form: QualityControlFormState,
  item: QcPartialNavItem | null | undefined,
  options?: { flowKey?: string | null },
): QualityControlFormState => {
  if (!item || item.kind === "DIVISION") return form;
  const entryIds = new Set(resolveEntryIdsForPartialItem(form.divisionEntries, item, options));
  if (!entryIds.size) {
    return {
      ...form,
      divisionEntries: [],
    };
  }

  const divisionEntries = (form.divisionEntries ?? []).filter((entry) =>
    entryIds.has(entry.entryId),
  );
  const divisionEntryValues = Object.fromEntries(
    Object.entries(form.divisionEntryValues ?? {}).filter(([entryId]) => entryIds.has(entryId)),
  );

  return {
    ...form,
    divisionEntries,
    divisionEntryValues,
    mixingFinalMixDetailsValues:
      item.kind === "FINAL_MIX" ? form.mixingFinalMixDetailsValues : undefined,
  };
};

export const updatePartialNavStatus = (
  items: QcPartialNavItem[],
  itemId: string,
  status: QcPartialItemStatus,
): QcPartialNavItem[] =>
  items.map((item) => (item.id === itemId ? { ...item, status } : item));

export const getPartialNavTitle = (items: QcPartialNavItem[]): string => {
  if (items.some((item) => item.kind === "MOTOR")) return "Motor Navigation";
  if (items.some((item) => item.kind === "FINAL_MIX") && items.some((item) => item.kind === "PREMIX")) {
    return "Mix Navigation";
  }
  if (items.some((item) => item.kind === "FINAL_MIX")) return "Final Mix Navigation";
  if (items.some((item) => item.kind === "PREMIX")) return "Premix Navigation";
  if (items.some((item) => item.kind === "DIVISION")) return "Division Navigation";
  return "Division Navigation";
};

export const getPartialNavHint = (items: QcPartialNavItem[]): string => {
  if (items.some((item) => item.kind === "MOTOR")) {
    return "Select a motor to fill and submit its QC form individually.";
  }
  if (items.some((item) => item.kind === "PREMIX") || items.some((item) => item.kind === "FINAL_MIX")) {
    return "Select a premix or final mix to fill and submit its QC form individually.";
  }
  if (items.some((item) => item.kind === "DIVISION")) {
    return "Select a division to continue.";
  }
  return "Select a division to continue.";
};

export type QcApprovalTableRow = {
  id: string;
  divisionLabel: string;
  unitLabel: string;
  unitKind: QcPartialNavKind | "DIVISION";
  submissionType: string;
  status: QcPartialItemStatus;
};

/** One division card for final-approval dialog — units nested, division not repeated. */
export type QcFinalApprovalDivisionGroup = {
  id: string;
  divisionKey: string;
  divisionLabel: string;
  divisionStatus: QcPartialItemStatus;
  units: Array<{
    id: string;
    label: string;
    kind: QcPartialNavKind;
    status: QcPartialItemStatus;
  }>;
};

export const areAllPartialItemsApproved = (items: QcPartialNavItem[] | null | undefined) => {
  const list = items ?? [];
  return list.length > 0 && list.every((item) => item.status === "APPROVED");
};

export const buildDivisionApprovalRows = (
  items: QcPartialNavItem[],
  divisionLabel: string,
): QcApprovalTableRow[] => {
  if (!items.length) {
    return [
      {
        id: `division:${divisionLabel || "current"}`,
        divisionLabel: divisionLabel || "—",
        unitLabel: "—",
        unitKind: "DIVISION",
        submissionType: "—",
        status: "TO_BE_INITIATED",
      },
    ];
  }

  return items.map((item) => ({
    id: item.id,
    divisionLabel: divisionLabel || "—",
    unitLabel: item.label,
    unitKind: item.kind,
    submissionType:
      item.kind === "MOTOR"
        ? "MOTOR"
        : item.kind === "FINAL_MIX"
          ? "FINAL_MIX"
          : item.kind === "PREMIX"
            ? "PREMIX"
            : "DIVISION",
    status: item.status,
  }));
};

export const buildFinalApprovalDivisionGroups = (
  divisions: Array<{
    divisionKey: string;
    divisionLabel: string;
    divisionStatus?: QcPartialItemStatus;
    units: QcPartialNavItem[];
  }>,
): QcFinalApprovalDivisionGroup[] =>
  divisions.map((division) => ({
    id: `division:${division.divisionKey || division.divisionLabel}`,
    divisionKey: division.divisionKey || division.divisionLabel,
    divisionLabel: division.divisionLabel,
    divisionStatus: division.divisionStatus ?? "TO_BE_INITIATED",
    units: division.units.map((item) => ({
      id: item.id,
      label: item.label,
      kind: item.kind,
      status: item.status,
    })),
  }));

/** @deprecated Prefer buildFinalApprovalDivisionGroups for dialog UI. */
export const buildFinalApprovalRows = (
  divisions: Array<{
    divisionLabel: string;
    divisionStatus?: QcPartialItemStatus;
    units: QcPartialNavItem[];
  }>,
): QcApprovalTableRow[] => {
  const rows: QcApprovalTableRow[] = [];
  divisions.forEach((division) => {
    if (!division.units.length) {
      rows.push({
        id: `division-only:${division.divisionLabel}`,
        divisionLabel: division.divisionLabel,
        unitLabel: "—",
        unitKind: "DIVISION",
        submissionType: "DIVISION",
        status: division.divisionStatus ?? "TO_BE_INITIATED",
      });
      return;
    }
    division.units.forEach((item) => {
      rows.push({
        id: `${division.divisionLabel}:${item.id}`,
        divisionLabel: division.divisionLabel,
        unitLabel: item.label,
        unitKind: item.kind,
        submissionType:
          item.kind === "MOTOR"
            ? "MOTOR"
            : item.kind === "FINAL_MIX"
              ? "FINAL_MIX"
              : item.kind === "PREMIX"
                ? "PREMIX"
                : "DIVISION",
        status: item.status,
      });
    });
  });
  return rows;
};

export const areAllFinalApprovalRowsApproved = (rows: QcApprovalTableRow[]) =>
  rows.length > 0 && rows.every((row) => row.status === "APPROVED");

export const areAllFinalApprovalGroupsApproved = (groups: QcFinalApprovalDivisionGroup[]) =>
  groups.length > 0 &&
  groups.every((group) =>
    group.units.length > 0
      ? group.units.every((unit) => unit.status === "APPROVED")
      : group.divisionStatus === "APPROVED",
  );

/**
 * Merge `/qc-division/details` premixStatuses + finalMixStatuses.
 * Final mix is a separate array; force stageType FINAL_MIX when missing.
 * Also backfills from split MIXING divisionDetails (PREMIX / FINAL_MIX subTypes).
 */
export const collectQcMixUnitStatusRows = (payload: {
  premixStatuses?: unknown;
  finalMixStatuses?: unknown;
  divisionDetails?: unknown;
}): Record<string, unknown>[] => {
  const rows: Record<string, unknown>[] = [];

  asArray(payload.premixStatuses).forEach((row) => {
    const rec = asRecord(row);
    if (rec) rows.push(rec);
  });

  asArray(payload.finalMixStatuses).forEach((row) => {
    const rec = asRecord(row);
    if (!rec) return;
    const stage = String(rec.stageType ?? rec.stage_type ?? "")
      .trim()
      .toUpperCase();
    if (stage === "FINAL_MIX") {
      rows.push(rec);
      return;
    }
    rows.push({
      ...rec,
      stageType: "FINAL_MIX",
      stage_type: "FINAL_MIX",
    });
  });

  // Fallback: split Mixing divisionDetails carry per-unit submission status on nested details.
  asArray(payload.divisionDetails).forEach((detail) => {
    const rec = asRecord(detail);
    if (!rec) return;
    const division = String(rec.division ?? "")
      .trim()
      .toUpperCase();
    if (division !== "MIXING") return;
    const subType = String(rec.subType ?? rec.sub_type ?? "")
      .trim()
      .toUpperCase();
    const data = asRecord(rec.data) ?? rec;

    asArray(data.premixes).forEach((item) => {
      const premix = asRecord(item);
      if (!premix) return;
      const premixNo = pickNumber(premix.premixNo, premix.premix_no, premix.finalMixNo);
      if (premixNo == null) return;

      const premixDetails = asRecord(premix.premixDetails);
      const finalMixDetails = asRecord(premix.finalMixDetails);

      if (subType === "FINAL_MIX" || finalMixDetails) {
        const status =
          finalMixDetails?.premixSubmissionStatus ??
          finalMixDetails?.status ??
          premix.premixSubmissionStatus ??
          premix.status;
        if (status != null && String(status).trim()) {
          rows.push({
            division: "MIXING",
            stageType: "FINAL_MIX",
            premixNo,
            premixSubmissionStatus: status,
          });
        }
      }

      if (subType === "PREMIX" || premixDetails) {
        const status =
          premixDetails?.premixSubmissionStatus ??
          premixDetails?.status ??
          premix.premixSubmissionStatus ??
          premix.status;
        if (status != null && String(status).trim()) {
          rows.push({
            division: "MIXING",
            stageType: "PREMIX",
            premixNo,
            premixSubmissionStatus: status,
          });
        }
      }
    });
  });

  return rows;
};

export const applyStatusMapsToPartialNav = (
  items: QcPartialNavItem[],
  payload: {
    motorStatuses?: unknown;
    premixStatuses?: unknown;
    finalMixStatuses?: unknown;
    divisionDetails?: unknown;
    division?: string;
  },
): QcPartialNavItem[] => {
  const motors = asArray(payload.motorStatuses);
  const premixes = collectQcMixUnitStatusRows(payload);
  const divisionFilter = String(payload.division ?? "").trim();

  const motorStatusById = new Map<string, QcPartialItemStatus>();
  motors.forEach((row) => {
    const rec = asRecord(row);
    if (!rec) return;
    const division = String(rec.division ?? "").trim();
    if (
      divisionFilter &&
      division &&
      !qcDivisionStatusKeysMatch(division, divisionFilter)
    ) {
      return;
    }
    const motorId = pickString(rec.motorId, rec.motor_id, rec.motorIdNo);
    if (!motorId) return;
    motorStatusById.set(motorId, normalizeStatus(rec.motorSubmissionStatus ?? rec.status));
  });

  const statusRank = (status: QcPartialItemStatus): number => {
    switch (status) {
      case "APPROVED":
        return 5;
      case "WAITING_FOR_APPROVAL":
        return 4;
      case "REJECTED":
        return 3;
      case "IN_PROGRESS":
        return 2;
      default:
        return 1;
    }
  };

  const premixStatusByKey = new Map<string, QcPartialItemStatus>();
  premixes.forEach((rec) => {
    const division = String(rec.division ?? "").trim();
    const subType = String(rec.subType ?? rec.sub_type ?? "").trim();
    if (divisionFilter) {
      const matchesDivision =
        !division ||
        qcDivisionStatusKeysMatch(division, divisionFilter) ||
        qcDivisionStatusKeysMatch(subType, divisionFilter) ||
        // Contract shape: division=RAW_MATERIAL, subType=RAW_MATERIAL_PROCESSING
        (divisionFilter.toUpperCase().includes("PROCESSING") &&
          (division.toUpperCase() === "RAW_MATERIAL" ||
            subType.toUpperCase() === "RAW_MATERIAL_PROCESSING" ||
            division.toUpperCase() === "RAW_MATERIAL_PROCESSING"));
      if (!matchesDivision) return;
    }
    const premixNo = pickNumber(rec.premixNo, rec.premix_no);
    if (premixNo == null) return;
    const stage = String(rec.stageType ?? rec.stage_type ?? "")
      .trim()
      .toUpperCase();
    const key = stage === "FINAL_MIX" ? `final-mix:${premixNo}` : `premix:${premixNo}`;
    const nextStatus = normalizeStatus(rec.premixSubmissionStatus ?? rec.status);
    const existing = premixStatusByKey.get(key);
    if (!existing || statusRank(nextStatus) >= statusRank(existing)) {
      premixStatusByKey.set(key, nextStatus);
    }
  });

  return items.map((item) => {
    const divisionDetailsStatus = item.divisionDetailsStatus ?? item.status;
    if (item.kind === "MOTOR" && item.motorId && motorStatusById.has(item.motorId)) {
      return {
        ...item,
        divisionDetailsStatus,
        status: motorStatusById.get(item.motorId)!,
      };
    }
    if (item.kind === "PREMIX" && item.premixNo != null) {
      const key = `premix:${item.premixNo}`;
      if (premixStatusByKey.has(key)) {
        return { ...item, divisionDetailsStatus, status: premixStatusByKey.get(key)! };
      }
    }
    if (item.kind === "FINAL_MIX") {
      const mixNo = item.finalMixNo ?? item.premixNo;
      if (mixNo != null) {
        const key = `final-mix:${mixNo}`;
        if (premixStatusByKey.has(key)) {
          return { ...item, divisionDetailsStatus, status: premixStatusByKey.get(key)! };
        }
      }
    }
    return { ...item, divisionDetailsStatus };
  });
};

