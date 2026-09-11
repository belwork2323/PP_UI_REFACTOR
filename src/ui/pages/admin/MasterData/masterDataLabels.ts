import { STRINGS } from "@app/config/strings";
import type { MasterDataFieldDef } from "@data/models/admin/MasterData/MasterDataModel";

const S = STRINGS.MASTER_DATA;

const ATTRIBUTE_FIELD_LABEL_OVERRIDES: Record<string, Record<string, string>> = {
  ovens: {
    noOfOvenAvailable: "Number of Ovens Available",
    noOfOvenAdded: "Number of Ovens Available",
  },
};

export const getMasterDataFieldLabel = (
  selectedType: string,
  field: MasterDataFieldDef,
): string => {
  const byKey = ATTRIBUTE_FIELD_LABEL_OVERRIDES[selectedType]?.[field.key];
  if (byKey) return byKey;
  if (selectedType === "ovens" && /ovens?\s*available/i.test(field.label)) {
    return "Number of Ovens Available";
  }
  return field.label;
};

export const stripMasterTypeSuffix = (label: string) => label.replace(/\s+Master$/i, "").trim();

export const getMasterDataAddButtonLabel = (
  selectedType: string,
  types: Array<{ type: string; label: string }>,
): string => {
  const match = types.find((type) => type.type === selectedType);
  if (!match?.label) return S.PAGE.NEW_BUTTON;
  return S.PAGE.NEW_BUTTON_FOR_TYPE(stripMasterTypeSuffix(match.label));
};
