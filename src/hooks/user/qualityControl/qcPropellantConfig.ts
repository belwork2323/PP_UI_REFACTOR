import { STRINGS } from "../../../app/config/strings";
import type { QcApiSubType } from "../../../schema-engine/adapters/qc.adapter";
import type { QcDivisionEntry } from "./qcDivisionEntryTypes";
import { buildDivisionEntryDedupKey } from "./qcDivisionEntries";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

export const QC_PROPELLANT_PROCESS_OPTIONS = [
  { value: "MECHANICAL_PROPERTIES", label: S.PROPELLANT_PROCESS_MECHANICAL },
  { value: "INTERFACE_PROPERTIES", label: S.PROPELLANT_PROCESS_INTERFACE },
  { value: "SSBR_UBR_BURN_RATE", label: S.PROPELLANT_PROCESS_SSBR_UBR },
  { value: "BALLISTIC_EVALUATION", label: S.PROPELLANT_PROCESS_BALLISTIC },
] as const;

export type QcPropellantProcessSubType = (typeof QC_PROPELLANT_PROCESS_OPTIONS)[number]["value"];

export const isQcPropellantProcessSubType = (value: string): value is QcPropellantProcessSubType =>
  QC_PROPELLANT_PROCESS_OPTIONS.some((option) => option.value === value);

export const getQcPropellantProcessLabel = (subType: string) =>
  QC_PROPELLANT_PROCESS_OPTIONS.find((option) => option.value === subType)?.label ?? subType;

export const mapQcPropellantProcessToApi = (
  process: string,
): QcApiSubType | null => (isQcPropellantProcessSubType(process) ? process : null);

export const isPropellantProcessAlreadyAdded = (
  motorId: string,
  process: string,
  addedDivisionEntryKeys: string[],
  flowKey: string,
) =>
  addedDivisionEntryKeys.includes(
    buildDivisionEntryDedupKey({
      flowKey,
      kind: "PROPELLANT_PROCESS",
      motorId,
      subType: mapQcPropellantProcessToApi(process) ?? undefined,
    }),
  );

export const getAddedPropellantProcessKeysForMotor = (
  entries: QcDivisionEntry[] = [],
  motorId: string,
) =>
  entries
    .filter((entry) => entry.kind === "PROPELLANT_PROCESS" && entry.motorId === motorId)
    .map((entry) =>
      buildDivisionEntryDedupKey({
        flowKey: entry.flowKey,
        kind: "PROPELLANT_PROCESS",
        motorId: entry.motorId,
        subType: entry.subType,
      }),
    );
