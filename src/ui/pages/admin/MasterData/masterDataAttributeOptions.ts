import type { MasterDataFieldDef } from "@data/models/admin/MasterData/MasterDataModel";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

export const CASTING_STATION_TYPE_OPTIONS: AppDropdownOption[] = [
  { value: "HORIZONTAL_CASTING", label: "Horizontal Casting" },
  { value: "VERTICAL_CASTING", label: "Vertical Casting" },
];

const UNIT_CATEGORY_OPTIONS: AppDropdownOption[] = [
  { value: "ENERGY", label: "Energy" },
  { value: "LENGTH", label: "Length" },
  { value: "MASS_AREA", label: "Mass Area" },
  { value: "MASS_VOLUME", label: "Mass Volume" },
  { value: "DENSITY", label: "Density" },
  { value: "CONCENTRATION", label: "Concentration" },
  { value: "SPEED", label: "Speed" },
  { value: "ROTATIONAL_SPEED", label: "Rotational Speed" },
  { value: "FLOW_RATE", label: "Flow Rate" },
  { value: "DOSE_RATE", label: "Dose Rate" },
  { value: "ACTIVITY_CONCENTRATION", label: "Activity Concentration" },
  { value: "POWER_AREA", label: "Power Area" },
  { value: "POWER_VOLUME", label: "Power Volume" },
  { value: "SPECIFIC_ENERGY", label: "Specific Energy" },
  { value: "DOSE_AREA", label: "Dose Area" },
  { value: "PRESSURE", label: "Pressure" },
  { value: "VISCOSITY", label: "Viscosity" },
  { value: "ELECTRIC_FIELD", label: "Electric Field" },
  { value: "CURRENT_DENSITY", label: "Current Density" },
  { value: "RESISTIVITY", label: "Resistivity" },
  { value: "ENERGY_AREA", label: "Energy Area" },
  { value: "ENERGY_GRADIENT", label: "Energy Gradient" },
];

const ATTRIBUTE_OPTIONS_BY_TYPE: Record<string, Record<string, AppDropdownOption[]>> = {
  "casting-stations": {
    stationType: CASTING_STATION_TYPE_OPTIONS,
  },
  units: {
    category: UNIT_CATEGORY_OPTIONS,
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
