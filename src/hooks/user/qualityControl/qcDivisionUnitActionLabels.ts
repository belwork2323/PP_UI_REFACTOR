import { STRINGS } from "../../../app/config/strings";
import type { QcPartialNavItem } from "./qcDivisionApprovalUnits";
import type { QcDivisionEntry, QcDivisionEntryKind } from "./qcDivisionEntryTypes";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

export type QcUnitActionLabels = {
  saveDraftLabel: string;
  submitLabel: string;
  draftConfirmTitle: string;
  draftConfirmMessage: string;
  submitConfirmTitle: string;
  submitConfirmMessage: string;
};

const MOTOR_ENTRY_KINDS = new Set<QcDivisionEntryKind>([
  "HARDWARE_PROCESS",
  "CASTING_MOTOR",
  "CURING_MOTOR",
  "TRIMMING_MOTOR",
  "DE_CORING_MOTOR",
  "POST_CURE_MOTOR",
  "NDT_MOTOR",
  "PROPELLANT_MOTOR",
  "PROPELLANT_PROCESS",
  "WEIGHTMENT_MOTOR",
]);

const PREMIX_ENTRY_KINDS = new Set<QcDivisionEntryKind>([
  "SOLID_PREMIX",
  "LIQUID_PREMIX",
  "BOTH_PREMIX",
  "PROCESSING_MATERIAL",
  "MIXING_PREMIX",
]);

const genericLabels = (): QcUnitActionLabels => ({
  saveDraftLabel: S.SAVE_UNIT_DRAFT,
  submitLabel: S.SUBMIT_UNIT,
  draftConfirmTitle: S.UNIT_DRAFT_CONFIRM_TITLE,
  draftConfirmMessage: S.UNIT_DRAFT_CONFIRM_MESSAGE,
  submitConfirmTitle: S.UNIT_SUBMIT_CONFIRM_TITLE,
  submitConfirmMessage: S.UNIT_SUBMIT_CONFIRM_MESSAGE,
});

const premixLabels = (premixNo: number | string): QcUnitActionLabels => ({
  saveDraftLabel: S.SAVE_PREMIX_DRAFT(premixNo),
  submitLabel: S.SUBMIT_PREMIX(premixNo),
  draftConfirmTitle: S.PREMIX_DRAFT_CONFIRM_TITLE,
  draftConfirmMessage: S.PREMIX_DRAFT_CONFIRM_MESSAGE(Number(premixNo)),
  submitConfirmTitle: S.PREMIX_SUBMIT_CONFIRM_TITLE,
  submitConfirmMessage: S.PREMIX_SUBMIT_CONFIRM_MESSAGE(Number(premixNo)),
});

const finalMixLabels = (mixNo: number | string): QcUnitActionLabels => ({
  saveDraftLabel: S.SAVE_FINAL_MIX_DRAFT(mixNo),
  submitLabel: S.SUBMIT_FINAL_MIX(mixNo),
  draftConfirmTitle: S.FINAL_MIX_DRAFT_CONFIRM_TITLE,
  draftConfirmMessage: S.FINAL_MIX_DRAFT_CONFIRM_MESSAGE(Number(mixNo)),
  submitConfirmTitle: S.FINAL_MIX_SUBMIT_CONFIRM_TITLE,
  submitConfirmMessage: S.FINAL_MIX_SUBMIT_CONFIRM_MESSAGE(Number(mixNo)),
});

const motorLabels = (motorId: string): QcUnitActionLabels => ({
  saveDraftLabel: S.SAVE_MOTOR_DRAFT(motorId),
  submitLabel: S.SUBMIT_MOTOR(motorId),
  draftConfirmTitle: S.MOTOR_DRAFT_CONFIRM_TITLE,
  draftConfirmMessage: S.MOTOR_DRAFT_CONFIRM_MESSAGE(motorId),
  submitConfirmTitle: S.MOTOR_SUBMIT_CONFIRM_TITLE,
  submitConfirmMessage: S.MOTOR_SUBMIT_CONFIRM_MESSAGE(motorId),
});

export const resolveQcUnitActionLabelsFromPartialItem = (
  item: QcPartialNavItem | null | undefined,
): QcUnitActionLabels => {
  if (!item) return genericLabels();

  if (item.kind === "FINAL_MIX") {
    const mixNo = item.finalMixNo ?? item.premixNo;
    if (mixNo != null && mixNo > 0) return finalMixLabels(mixNo);
  }

  if (item.kind === "PREMIX") {
    if (item.premixNo != null && item.premixNo > 0) return premixLabels(item.premixNo);
  }

  if (item.kind === "MOTOR") {
    const motorId = String(item.motorId ?? "").trim();
    if (motorId) return motorLabels(motorId);
  }

  return genericLabels();
};

export const resolveQcUnitActionLabelsFromEntry = (
  entry: QcDivisionEntry | null | undefined,
): QcUnitActionLabels => {
  if (!entry) return genericLabels();

  if (entry.kind === "MIXING_FINAL_MIX") {
    if (entry.premixNo != null && entry.premixNo > 0) return finalMixLabels(entry.premixNo);
  }

  if (PREMIX_ENTRY_KINDS.has(entry.kind)) {
    if (entry.premixNo != null && entry.premixNo > 0) return premixLabels(entry.premixNo);
  }

  if (MOTOR_ENTRY_KINDS.has(entry.kind)) {
    const motorId = String(entry.motorId ?? "").trim();
    if (motorId) return motorLabels(motorId);
  }

  return genericLabels();
};

export const resolveQcUnitActionLabels = (params: {
  partialItem?: QcPartialNavItem | null;
  entry?: QcDivisionEntry | null;
}): QcUnitActionLabels => {
  const fromPartial = resolveQcUnitActionLabelsFromPartialItem(params.partialItem);
  if (fromPartial.saveDraftLabel !== S.SAVE_UNIT_DRAFT) return fromPartial;
  return resolveQcUnitActionLabelsFromEntry(params.entry);
};
