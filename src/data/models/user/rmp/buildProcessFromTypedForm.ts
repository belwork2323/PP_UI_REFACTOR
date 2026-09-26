import type { MaterialsListItem } from "../MaterialsListModel";
import type { PreparationProcessEntry } from "../../../schema-engine/adapters/rawMaterialPreparation.adapter";
import {
  RMP_SCHEMA_TYPE,
  RMP_SCHEMA_VERSION,
  findGradeInMaterial,
  findMaterialInList,
} from "../../../schema-engine/adapters/rawMaterialPreparation.adapter";
import { normalizeSectionsForApiPayload } from "../rawMaterialPreparationApiMapper";
import type { RmpMaterialUiKey } from "./rmpMaterialUiRegistry";
import { processFormHasUserData, type RmpMaterialProcessForm } from "./defaultSolidProcessForm";
import { processFormToSections } from "./processFormMapper";

export const buildProcessFromTypedForm = (params: {
  uiKey: RmpMaterialUiKey;
  processForm: RmpMaterialProcessForm;
  material: MaterialsListItem | undefined;
  gradeCode: string;
  fallback?: {
    materialId?: number;
    materialCode?: string;
    materialName?: string;
    gradeId?: number;
  };
  allowEmptyValues?: boolean;
}): PreparationProcessEntry | null => {
  const {
    uiKey,
    processForm,
    material,
    gradeCode,
    fallback,
    allowEmptyValues = false,
  } = params;

  if (uiKey === "defaultLiquid") {
    return null;
  }

  if (!allowEmptyValues && !processFormHasUserData(processForm)) {
    return null;
  }

  const sections = processFormToSections(processForm);
  if (!allowEmptyValues && sections.length === 0) {
    return null;
  }

  const resolvedMaterial: MaterialsListItem | undefined =
    material ??
    (fallback?.materialId && fallback.materialCode
      ? {
          materialId: fallback.materialId,
          materialCode: fallback.materialCode,
          materialName: fallback.materialName ?? fallback.materialCode,
          specCount: 0,
          grades: [],
        }
      : undefined);

  if (!resolvedMaterial) return null;

  const grade =
    findGradeInMaterial(resolvedMaterial, gradeCode) ??
    (fallback?.gradeId
      ? {
          gradeId: fallback.gradeId,
          gradeCode,
          gradeName: gradeCode,
        }
      : undefined);

  const normalizedSections = normalizeSectionsForApiPayload(sections);

  return {
    materialId: resolvedMaterial.materialId,
    materialCode: resolvedMaterial.materialCode,
    materialName: resolvedMaterial.materialName,
    gradeId: grade?.gradeId ?? null,
    gradeCode: grade?.gradeCode ?? (gradeCode.trim() ? gradeCode : null),
    schemaVersion: RMP_SCHEMA_VERSION,
    schemaType: RMP_SCHEMA_TYPE,
    sections: normalizedSections.map((section) => ({
      sectionId: section.sectionId,
      sectionData: section.sectionData,
    })),
  };
};

export const resolveMaterialForProcess = (
  materials: MaterialsListItem[],
  materialCode: string,
): MaterialsListItem | undefined => findMaterialInList(materials, materialCode);
