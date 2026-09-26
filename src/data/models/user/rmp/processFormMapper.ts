import type { SchemaSectionSubmission } from "../../../schema-engine";
import type { RmpMaterialUiKey } from "./rmpMaterialUiRegistry";
import {
  createEmptyProcessFormForUiKey,
  type RmpMaterialProcessForm,
} from "./defaultSolidProcessForm";
import {
  defaultSolidToSections,
  hydrateDefaultSolidFromSectionsOrEmpty,
} from "./defaultSolidProcessMapper";

export const hydrateProcessFormFromSections = (
  uiKey: RmpMaterialUiKey,
  sections: SchemaSectionSubmission[] | undefined,
): RmpMaterialProcessForm => {
  if (uiKey === "defaultLiquid") {
    return createEmptyProcessFormForUiKey("defaultLiquid");
  }
  return hydrateDefaultSolidFromSectionsOrEmpty(sections);
};

export const processFormToSections = (form: RmpMaterialProcessForm): SchemaSectionSubmission[] => {
  if (form.uiKey === "defaultLiquid") return [];
  return defaultSolidToSections(form);
};
