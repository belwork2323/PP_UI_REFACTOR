import { STRINGS } from "@app/config/strings";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

const S = STRINGS.MANUFACTURING.CASTING_CURING;

export const CURING_TYPE_VALUES = [
  "NORMAL_CURING",
  "CONFINED_CURING",
  "NITROGEN_PRESSURE_CURING",
] as const;

export type CuringTypeValue = (typeof CURING_TYPE_VALUES)[number];

export const CURING_TYPE_OPTIONS: AppDropdownOption[] = [
  { value: "NORMAL_CURING", label: S.CURING_TYPE_NORMAL },
  { value: "CONFINED_CURING", label: S.CURING_TYPE_CONFINED },
  { value: "NITROGEN_PRESSURE_CURING", label: S.CURING_TYPE_NITROGEN_PRESSURE },
];

export const isCuringTypeValue = (value: string): value is CuringTypeValue =>
  CURING_TYPE_VALUES.includes(value as CuringTypeValue);
