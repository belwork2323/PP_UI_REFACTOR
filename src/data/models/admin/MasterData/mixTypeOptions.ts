import { STRINGS } from "@app/config/strings";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

const S = STRINGS.MANUFACTURING.MIXING;

export const MIX_TYPE_VALUES = ["PREMIX", "FINAL_MIX"] as const;

export type MixTypeValue = (typeof MIX_TYPE_VALUES)[number];

export const MIX_TYPE_OPTIONS: AppDropdownOption[] = [
  { value: "PREMIX", label: S.STAGE_PREMIX },
  { value: "FINAL_MIX", label: S.STAGE_FINAL_MIX },
];

export const isMixTypeValue = (value: string): value is MixTypeValue =>
  MIX_TYPE_VALUES.includes(value as MixTypeValue);

export const formatMixTypeLabel = (value: string): string => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "—";
  const match = MIX_TYPE_OPTIONS.find((option) => option.value === trimmed);
  return match?.label ?? trimmed;
};
