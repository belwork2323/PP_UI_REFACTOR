import type { MasterDataFieldDef } from "@data/models/admin/MasterData/MasterDataModel";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

export const CASTING_STATION_TYPE_OPTIONS: AppDropdownOption[] = [
  { value: "HORIZONTAL_CASTING", label: "Horizontal Casting" },
  { value: "VERTICAL_CASTING", label: "Vertical Casting" },
];

const ATTRIBUTE_OPTIONS_BY_TYPE: Record<string, Record<string, AppDropdownOption[]>> = {
  "casting-stations": {
    stationType: CASTING_STATION_TYPE_OPTIONS,
  },
};

const isCastingStationTypeField = (selectedType: string, field: MasterDataFieldDef) =>
  selectedType === "casting-stations" &&
  (field.key === "stationType" || /station\s*type/i.test(field.label));

export const getMasterDataAttributeOptions = (
  selectedType: string,
  field: MasterDataFieldDef,
  dynamicOptions?: Record<string, AppDropdownOption[]>,
): AppDropdownOption[] | null => {
  if (dynamicOptions?.[field.key]?.length) {
    return dynamicOptions[field.key];
  }
  if (isCastingStationTypeField(selectedType, field)) return CASTING_STATION_TYPE_OPTIONS;
  return ATTRIBUTE_OPTIONS_BY_TYPE[selectedType]?.[field.key] ?? null;
};

const findAttributeOption = (
  options: AppDropdownOption[] | null | undefined,
  value: string,
): AppDropdownOption | undefined => {
  if (!options?.length) return undefined;
  const normalized = value.toUpperCase();
  return options.find(
    (opt) =>
      opt.value === value ||
      opt.value.toUpperCase() === normalized ||
      opt.label === value ||
      opt.label.toUpperCase() === normalized,
  );
};

export const formatMasterDataAttributeValue = (
  selectedType: string,
  field: MasterDataFieldDef,
  raw: unknown,
  dynamicOptions?: Record<string, AppDropdownOption[]>,
): string => {
  const value = String(raw ?? "").trim();
  if (!value) return "—";
  const options = getMasterDataAttributeOptions(selectedType, field, dynamicOptions);
  const match = findAttributeOption(options, value);
  return match ? String(match.label) : value;
};
