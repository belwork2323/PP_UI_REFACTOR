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

export const resolveQcHardwareMotorOptions = (
  batch?: { motorId?: string; motorIds?: string[] } | null,
) => {
  const ids = [
    ...(Array.isArray(batch?.motorIds) ? batch.motorIds : []),
    batch?.motorId ?? "",
  ]
    .map((id) => String(id ?? "").trim())
    .filter(Boolean);

  return Array.from(new Set(ids)).map((value) => ({ value, label: value }));
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
