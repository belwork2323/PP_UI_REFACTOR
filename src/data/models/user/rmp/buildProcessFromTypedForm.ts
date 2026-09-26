import type { MaterialsListItem } from "../MaterialsListModel";
import {
  findGradeInMaterial,
  findMaterialInList,
  uiKeyToProcessType,
  type PreparationProcessEntry,
} from "./rmpProcessTypes";
import type { RmpMaterialUiKey } from "./rmpMaterialUiRegistry";
import type { RmpMaterialProcessForm } from "./defaultSolidProcessForm";
import { processFormToTypedFields } from "./processFormMapper";

/** Build typed API process entry from UI form. Liquid always emits an entry. */
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
}): PreparationProcessEntry | null => {
  const { uiKey, processForm, material, gradeCode, fallback } = params;

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

  const typed = processFormToTypedFields(processForm);

  return {
    materialId: resolvedMaterial.materialId,
    materialCode: resolvedMaterial.materialCode,
    materialName: resolvedMaterial.materialName,
    gradeId: grade?.gradeId ?? null,
    gradeCode: grade?.gradeCode ?? (gradeCode.trim() ? gradeCode : null),
    processType: typed.processType || uiKeyToProcessType(uiKey),
    lotDetails: typed.lotDetails ?? [],
    drying: typed.drying ?? null,
    sieving: typed.sieving ?? null,
    apCoarse: typed.apCoarse ?? null,
    apFine: typed.apFine ?? null,
    apUltraFine: typed.apUltraFine ?? null,
    aluminum: typed.aluminum ?? null,
    doa: typed.doa ?? null,
  };
};

export const resolveMaterialForProcess = (
  materials: MaterialsListItem[],
  materialCode: string,
): MaterialsListItem | undefined => findMaterialInList(materials, materialCode);
