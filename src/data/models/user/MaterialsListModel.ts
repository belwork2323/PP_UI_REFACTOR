export type MaterialsListMaterialType = "SOLID" | "LIQUID" | "BOTH";

export type MaterialsListRequest = {
  materialType: MaterialsListMaterialType;
};

export type MaterialsListGrade = {
  gradeId: number;
  gradeCode: string;
  gradeName: string;
};

export type MaterialsListItem = {
  materialId: number;
  materialCode: string;
  materialName: string;
  specCount: number;
  grades: MaterialsListGrade[];
};

export const findMaterialByCode = (
  items: MaterialsListItem[],
  materialCode: string,
): MaterialsListItem | undefined =>
  items.find((item) => item.materialCode === String(materialCode ?? "").trim());

export const getMaterialGrades = (
  items: MaterialsListItem[],
  materialCode: string,
): MaterialsListGrade[] => findMaterialByCode(items, materialCode)?.grades ?? [];

export const materialRequiresGradeSelection = (
  items: MaterialsListItem[],
  materialCode: string,
): boolean => getMaterialGrades(items, materialCode).length > 0;

export const materialSelectionKey = (materialCode: string, gradeCode?: string | null) => {
  const code = String(materialCode ?? "").trim();
  const grade = String(gradeCode ?? "").trim();
  return grade ? `${code}::${grade}` : code;
};

export const isMaterialSelectionUsed = (
  items: MaterialsListItem[],
  materialCode: string,
  usedKeys: Set<string>,
): boolean => {
  const material = findMaterialByCode(items, materialCode);
  if (!material) return true;
  if (material.grades.length > 0) {
    return material.grades.every((grade) =>
      usedKeys.has(materialSelectionKey(material.materialCode, grade.gradeCode)),
    );
  }
  return usedKeys.has(material.materialCode);
};

/** Normalize `data` array from POST /user/subdepartment/materials-list. */
export const normalizeMaterialsListResponse = (data: unknown): MaterialsListItem[] => {
  const list = Array.isArray(data) ? data : [];

  return list
    .map((item: Record<string, unknown>) => {
      const gradesRaw = Array.isArray(item?.grades) ? item.grades : [];
      const grades: MaterialsListGrade[] = gradesRaw
        .map((g: Record<string, unknown>) => ({
          gradeId: Number(g?.gradeId ?? 0),
          gradeCode: String(g?.gradeCode ?? "").trim(),
          gradeName: String(g?.gradeName ?? "").trim(),
        }))
        .filter((g) => g.gradeCode.length > 0);

      return {
        materialId: Number(item?.materialId ?? 0),
        materialCode: String(item?.materialCode ?? "").trim(),
        materialName: String(item?.materialName ?? "").trim(),
        specCount: Number(item?.specCount ?? 0),
        grades,
      };
    })
    .filter((item) => item.materialCode.length > 0);
};

export const toMaterialCodeNameOptions = (items: MaterialsListItem[]) =>
  items.map(({ materialCode, materialName }) => ({ materialCode, materialName }));
