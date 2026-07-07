import { STRINGS } from "../../../app/config/strings";
import { getQcDivisionDefinition } from "./qcDivisionRegistry";
import {
  getDivisionNavTabLabel,
  getMixingFinalMixEntries,
  type QcDivisionNavTab,
} from "./qcMixingConfig";
import type { QcDivisionEntry } from "./qcDivisionEntryTypes";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

const MOTOR_BASED_FLOW_KEYS = new Set([
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

export type QcMotorNavTab = {
  motorId: string;
  entries: QcDivisionEntry[];
};

export type QcDivisionNavGroup =
  | { kind: "motor-based"; flowKey: string; label: string; motorTabs: QcMotorNavTab[] }
  | { kind: "mixing"; flowKey: string; label: string; tabs: QcDivisionNavTab[] }
  | { kind: "entries"; flowKey: string; label: string; entries: QcDivisionEntry[] };

export type QcActiveNavContent =
  | { type: "final-mix-details" }
  | { type: "entry"; entry: QcDivisionEntry }
  | { type: "motor-entries"; flowKey: string; motorId: string; entries: QcDivisionEntry[] };

const groupEntriesByMotor = (entries: QcDivisionEntry[]): QcMotorNavTab[] => {
  const motorTabs: QcMotorNavTab[] = [];
  const indexByMotor = new Map<string, number>();

  entries.forEach((entry) => {
    const motorId = entry.motorId ?? "";
    if (!motorId) return;

    const existingIndex = indexByMotor.get(motorId);
    if (existingIndex !== undefined) {
      motorTabs[existingIndex].entries.push(entry);
      return;
    }

    motorTabs.push({ motorId, entries: [entry] });
    indexByMotor.set(motorId, motorTabs.length - 1);
  });

  return motorTabs;
};

export const buildDivisionNavGroups = (entries: QcDivisionEntry[] = []): QcDivisionNavGroup[] => {
  const byFlowKey = new Map<string, QcDivisionEntry[]>();
  const order: string[] = [];

  entries.forEach((entry) => {
    if (!byFlowKey.has(entry.flowKey)) {
      order.push(entry.flowKey);
      byFlowKey.set(entry.flowKey, []);
    }
    byFlowKey.get(entry.flowKey)!.push(entry);
  });

  return order.map((flowKey) => {
    const groupEntries = byFlowKey.get(flowKey)!;
    const label = getQcDivisionDefinition(flowKey)?.label ?? flowKey;

    if (flowKey === "MIXING") {
      const finalMixEntries = getMixingFinalMixEntries(groupEntries);
      const otherMixing = groupEntries.filter((entry) => entry.kind !== "MIXING_FINAL_MIX");
      const tabs: QcDivisionNavTab[] = [
        ...(finalMixEntries.length > 0 ? [{ kind: "final-mix-details" as const }] : []),
        ...finalMixEntries.map((entry) => ({ kind: "entry" as const, entry })),
        ...otherMixing.map((entry) => ({ kind: "entry" as const, entry })),
      ];
      return { kind: "mixing", flowKey, label, tabs };
    }

    if (MOTOR_BASED_FLOW_KEYS.has(flowKey)) {
      return { kind: "motor-based", flowKey, label, motorTabs: groupEntriesByMotor(groupEntries) };
    }

    return { kind: "entries", flowKey, label, entries: groupEntries };
  });
};

export const getSubNavCount = (group: QcDivisionNavGroup | null | undefined) => {
  if (!group) return 0;
  if (group.kind === "motor-based") return group.motorTabs.length;
  if (group.kind === "mixing") return group.tabs.length;
  return group.entries.length;
};

export const shouldShowSubNav = (group: QcDivisionNavGroup | null | undefined) => {
  if (!group) return false;
  if (group.kind === "motor-based" || group.kind === "mixing") {
    return getSubNavCount(group) > 0;
  }
  return getSubNavCount(group) > 1;
};

export const getSubNavLabel = (group: QcDivisionNavGroup, subIndex: number) => {
  if (group.kind === "motor-based") {
    return group.motorTabs[subIndex]?.motorId ?? "";
  }
  if (group.kind === "mixing") {
    const tab = group.tabs[subIndex];
    return tab ? getDivisionNavTabLabel(tab) : "";
  }
  return group.entries[subIndex]?.label ?? "";
};

export const getSubNavKey = (group: QcDivisionNavGroup, subIndex: number) => {
  if (group.kind === "motor-based") {
    return `motor-${group.flowKey}-${group.motorTabs[subIndex]?.motorId ?? subIndex}`;
  }
  if (group.kind === "mixing") {
    const tab = group.tabs[subIndex];
    if (!tab) return `mixing-${subIndex}`;
    return tab.kind === "final-mix-details" ? "final-mix-details" : tab.entry.entryId;
  }
  return group.entries[subIndex]?.entryId ?? `entry-${subIndex}`;
};

export const resolveActiveNavContent = (
  groups: QcDivisionNavGroup[],
  groupIndex: number,
  subIndex: number,
): QcActiveNavContent | null => {
  const group = groups[groupIndex];
  if (!group) return null;

  if (group.kind === "motor-based") {
    const tab = group.motorTabs[subIndex];
    if (!tab) return null;
    return {
      type: "motor-entries",
      flowKey: group.flowKey,
      motorId: tab.motorId,
      entries: tab.entries,
    };
  }

  if (group.kind === "mixing") {
    const tab = group.tabs[subIndex];
    if (!tab) return null;
    if (tab.kind === "final-mix-details") return { type: "final-mix-details" };
    return { type: "entry", entry: tab.entry };
  }

  const entry = group.entries[subIndex];
  if (!entry) return null;
  return { type: "entry", entry };
};

export const resolveNavIndicesForEntry = (
  entries: QcDivisionEntry[],
  entryId: string,
): { groupIndex: number; subIndex: number } => {
  const groups = buildDivisionNavGroups(entries);

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const group = groups[groupIndex];

    if (group.kind === "motor-based") {
      const subIndex = group.motorTabs.findIndex((tab) =>
        tab.entries.some((entry) => entry.entryId === entryId),
      );
      if (subIndex >= 0) return { groupIndex, subIndex };
      continue;
    }

    if (group.kind === "mixing") {
      const subIndex = group.tabs.findIndex(
        (tab) => tab.kind === "entry" && tab.entry.entryId === entryId,
      );
      if (subIndex >= 0) return { groupIndex, subIndex };
      continue;
    }

    const subIndex = group.entries.findIndex((entry) => entry.entryId === entryId);
    if (subIndex >= 0) return { groupIndex, subIndex };
  }

  return { groupIndex: 0, subIndex: 0 };
};

export const getDivisionNavSubHint = (group: QcDivisionNavGroup | null | undefined) => {
  if (!group) return S.SUBDIVISION_NAV_HINT;
  if (group.kind === "motor-based" && group.flowKey === "HARDWARE") {
    return S.HARDWARE_MOTOR_NAV_HINT;
  }
  if (group.kind === "motor-based" && group.flowKey === "CASTING") {
    return S.CASTING_MOTOR_NAV_HINT;
  }
  if (group.kind === "motor-based" && group.flowKey === "CURING") {
    return S.CURING_MOTOR_NAV_HINT;
  }
  if (group.kind === "motor-based" && group.flowKey === "TRIMMING") {
    return S.TRIMMING_MOTOR_NAV_HINT;
  }
  if (group.kind === "motor-based" && group.flowKey === "DE_CORING") {
    return S.DE_CORING_MOTOR_NAV_HINT;
  }
  if (group.kind === "motor-based" && group.flowKey === "POST_CURE") {
    return S.POST_CURE_MOTOR_NAV_HINT;
  }
  if (group.kind === "motor-based" && group.flowKey === "NDT") {
    return S.NDT_MOTOR_NAV_HINT;
  }
  if (group.kind === "motor-based" && group.flowKey === "QC") {
    return S.PROPELLANT_MOTOR_NAV_HINT;
  }
  if (group.kind === "motor-based" && group.flowKey === "WEIGHTMENT") {
    return S.WEIGHTMENT_MOTOR_NAV_HINT;
  }
  if (group.kind === "mixing") {
    const tab = group.tabs[0];
    return tab?.kind === "final-mix-details"
      ? S.MIXING_FINAL_MIX_SHARED_DETAILS_HINT
      : S.SUBDIVISION_NAV_HINT;
  }
  return S.SUBDIVISION_NAV_HINT;
};
