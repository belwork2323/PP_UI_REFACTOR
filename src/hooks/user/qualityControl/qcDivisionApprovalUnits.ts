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

const normalizeStatus = (value: unknown): QcPartialItemStatus => {
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
  const fromObjects = asArray(data.motors)
    .map((row) => {
      const rec = asRecord(row);
      if (rec) {
        const motorId = pickString(rec.motorId, rec.id, rec.motor_id);
        if (!motorId) return null;
        return { motorId, status: rec.status ?? rec.motorSubmissionStatus };
      }
      const motorId = pickString(row);
      return motorId ? { motorId } : null;
    })
    .filter((row): row is { motorId: string; status?: unknown } => Boolean(row));

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
  const batch = asRecord(batchPayload);
  if (!batch) return 0;
  const sheet = asRecord(batch.identificationSheet);
  return (
    pickNumber(
      sheet?.numberOfPremix,
      sheet?.number_of_premix,
      batch.numberOfPremix,
      batch.premixCount,
    ) ?? 0
  );
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
        return { finalMixNo, status: rec.status ?? rec.mixSubmissionStatus };
      }
      const finalMixNo = pickNumber(row);
      return finalMixNo != null ? { finalMixNo } : null;
    })
    .filter((row): row is { finalMixNo: number; status?: unknown } => Boolean(row));

  if (fromObjects.length) return fromObjects;

  return asArray(data.finalMixNos ?? data.final_mix_nos)
    .map((row) => {
      const finalMixNo = pickNumber(row);
      return finalMixNo != null ? { finalMixNo } : null;
    })
    .filter((row): row is { finalMixNo: number } => Boolean(row));
};

export const isMotorBasedPartialFlow = (flowKey: string) => MOTOR_FLOW_KEYS.has(flowKey);

export const hasPartialChildNav = (items: QcPartialNavItem[] | null | undefined) =>
  (items ?? []).some(
    (item) => item.kind === "MOTOR" || item.kind === "PREMIX" || item.kind === "FINAL_MIX",
  );

export const isPartialItemReadOnly = (status: QcPartialItemStatus) =>
  status === "WAITING_FOR_APPROVAL" || status === "APPROVED";

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

  const motors = extractMotorIds(data);
  let premixes = extractPremixes(data);
  const finalMixes = extractFinalMixes(data);

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
      items.push({
        id: `motor:${motor.motorId}`,
        kind: "MOTOR",
        label: motor.motorId,
        status: normalizeStatus(motor.status),
        motorId: motor.motorId,
      });
    });
  }

  if (premixes.length > 0) {
    premixes.forEach((premix) => {
      items.push({
        id: `premix:${premix.premixNo}`,
        kind: "PREMIX",
        label: premix.label ?? `Premix ${premix.premixNo}`,
        status: normalizeStatus(premix.status),
        premixNo: premix.premixNo,
        processingType: premix.processingType ?? "SOLID_PROCESSING",
      });
    });
  }

  if (finalMixes.length > 0 || (flowKey === "MIXING" && finalMixes.length > 0)) {
    finalMixes.forEach((mix) => {
      items.push({
        id: `final-mix:${mix.finalMixNo}`,
        kind: "FINAL_MIX",
        label: `Final Mix ${mix.finalMixNo}`,
        status: normalizeStatus(mix.status),
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
): string[] => {
  if (!item) return [];
  const list = entries ?? [];

  if (item.kind === "MOTOR" && item.motorId) {
    return list.filter((entry) => entry.motorId === item.motorId).map((entry) => entry.entryId);
  }

  if (item.kind === "PREMIX" && item.premixNo != null) {
    return list
      .filter(
        (entry) =>
          entry.premixNo === item.premixNo &&
          entry.kind !== "MIXING_FINAL_MIX",
      )
      .map((entry) => entry.entryId);
  }

  if (item.kind === "FINAL_MIX") {
    const mixNo = item.finalMixNo ?? item.premixNo;
    return list
      .filter(
        (entry) => entry.kind === "MIXING_FINAL_MIX" && (mixNo == null || entry.premixNo === mixNo),
      )
      .map((entry) => entry.entryId);
  }

  if (item.kind === "DIVISION") {
    return list.map((entry) => entry.entryId);
  }

  return [];
};

export const scopeFormStateToPartialItem = (
  form: QualityControlFormState,
  item: QcPartialNavItem | null | undefined,
): QualityControlFormState => {
  if (!item || item.kind === "DIVISION") return form;
  const entryIds = new Set(resolveEntryIdsForPartialItem(form.divisionEntries, item));
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
  return "Item Navigation";
};

export const getPartialNavHint = (items: QcPartialNavItem[]): string => {
  if (items.some((item) => item.kind === "MOTOR")) {
    return "Select a motor to fill and submit its QC form individually.";
  }
  if (items.some((item) => item.kind === "PREMIX") || items.some((item) => item.kind === "FINAL_MIX")) {
    return "Select a premix or final mix to fill and submit its QC form individually.";
  }
  return "Select an item to continue.";
};
