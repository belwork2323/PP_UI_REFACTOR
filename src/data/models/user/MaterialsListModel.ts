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
