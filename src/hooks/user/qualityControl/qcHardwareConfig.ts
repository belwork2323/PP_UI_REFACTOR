import { STRINGS } from "../../../app/config/strings";
import type { QcApiSubType } from "../../../schema-engine/adapters/qc.adapter";
import type { QcDivisionEntry } from "./qcDivisionEntryTypes";
import { buildDivisionEntryDedupKey } from "./qcDivisionEntries";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

export const QC_HARDWARE_PROCESS_OPTIONS = [
  { value: "ABRADING", label: S.HARDWARE_PROCESS_ABRADING },
  { value: "PREHEATING", label: S.HARDWARE_PROCESS_PREHEATING },
  { value: "LINEAR_COATING", label: S.HARDWARE_PROCESS_LINEAR_COATING },
  { value: "DISPATCH", label: S.HARDWARE_PROCESS_DISPATCH },
] as const;

export type QcHardwareProcessSubType = (typeof QC_HARDWARE_PROCESS_OPTIONS)[number]["value"];

export const isQcHardwareProcessSubType = (value: string): value is QcHardwareProcessSubType =>
  QC_HARDWARE_PROCESS_OPTIONS.some((option) => option.value === value);

export const getQcHardwareProcessLabel = (subType: string) =>
  QC_HARDWARE_PROCESS_OPTIONS.find((option) => option.value === subType)?.label ?? subType;

export const QC_HARDWARE_SECTION_IDS: Record<QcHardwareProcessSubType, string> = {
  ABRADING: "ABRADING_DETAILS",
  PREHEATING: "PREHEATING_DETAILS",
  LINEAR_COATING: "LINEAR_COATING_DETAILS",
  DISPATCH: "DISPATCH_DETAILS",
};

export const getHardwareSectionIdForSubType = (subType: string) =>
  isQcHardwareProcessSubType(subType) ? QC_HARDWARE_SECTION_IDS[subType] : undefined;

export const resolveQcHardwareMotorOptions = (
  batch?: { motorId?: string; motorIds?: Array<string | number> } | null,
) => {
  const fromArray = Array.isArray(batch?.motorIds)
    ? batch.motorIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  if (fromArray.length > 0) {
    const unique = Array.from(new Set(fromArray.filter((id) => !id.includes(","))));
    return unique.map((value) => ({ value, label: value }));
  }

  const singleId = String(batch?.motorId ?? "").trim();
  if (!singleId) return [];

  const parsed = singleId
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (parsed.length > 1) {
    return parsed.map((value) => ({ value, label: value }));
  }

  return [{ value: singleId, label: singleId }];
};

export const resolveQcMotorIdOptions = resolveQcHardwareMotorOptions;

export const getAddedHardwareProcessKeysForMotor = (
  entries: QcDivisionEntry[] = [],
  motorId: string,
) =>
  entries
    .filter((entry) => entry.kind === "HARDWARE_PROCESS" && entry.motorId === motorId)
    .map((entry) =>
      buildDivisionEntryDedupKey({
        flowKey: entry.flowKey,
        kind: "HARDWARE_PROCESS",
        motorId: entry.motorId,
        subType: entry.subType,
      }),
    );

export const getPendingHardwareProcesses = (
  motorId: string,
  selectedProcesses: string[],
  addedDivisionEntryKeys: string[],
  flowKey: string,
): QcHardwareProcessSubType[] =>
  selectedProcesses
    .filter(isQcHardwareProcessSubType)
    .filter(
      (process) =>
        !addedDivisionEntryKeys.includes(
          buildDivisionEntryDedupKey({
            flowKey,
            kind: "HARDWARE_PROCESS",
            motorId,
            subType: process as QcApiSubType,
          }),
        ),
    );
