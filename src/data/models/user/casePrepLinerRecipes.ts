import type { CasePrepIngredientRow } from "./CasePrepMotorDataModel";

/** API response from POST /case-preparation/liner-ingredients */
export type CasePrepLinerIngredientsApiResponse = {
  linerType?: string;
  fixedPartsByWeight?: boolean;
  premixIngredients?: Array<{
    ingredient?: string;
    aliases?: string[];
    partsByWeight?: string | null;
    materialId?: number | null;
    materialCode?: string | null;
  }>;
  finalMixIngredients?: Array<{
    ingredient?: string;
    aliases?: string[];
    partsByWeight?: string | null;
    materialId?: number | null;
    materialCode?: string | null;
  }>;
};

/** Known recipe liner types (API returns non-empty ingredient lists for these). */
export const CASE_PREP_RECIPE_LINER_TYPES = new Set<string>([
  "PEDCOAT",
  "HEMCOAT_3L",
  "HEMCOAT_3L_M",
]);

export const isRecipeLinerType = (linerType: string | null | undefined): boolean => {
  const key = String(linerType ?? "").trim().toUpperCase();
  return CASE_PREP_RECIPE_LINER_TYPES.has(key);
};

const apiIngredientToRow = (
  raw: {
    ingredient?: string;
    partsByWeight?: string | null;
    materialId?: number | null;
    materialCode?: string | null;
  },
  index: number,
  fixedPartsByWeight: boolean,
): CasePrepIngredientRow => {
  const ingredient = String(raw.ingredient ?? "").trim();
  const materialId =
    raw.materialId != null && Number.isFinite(Number(raw.materialId))
      ? Number(raw.materialId)
      : null;
  const materialCode = String(raw.materialCode ?? "").trim() || null;

  return {
    srNo: index + 1,
    materialId,
    materialCode,
    materialName: ingredient,
    ingredient,
    mfgLot: "",
    partsByWeight: fixedPartsByWeight ? String(raw.partsByWeight ?? "") : "",
    quantityTaken: "",
    totalQuantity: "",
  };
};

/** Build premix + final mix rows from liner-ingredients API (materialId/code already resolved). */
export const buildLinerIngredientTablesFromApi = (
  api: CasePrepLinerIngredientsApiResponse | null | undefined,
): {
  premixIngredients: CasePrepIngredientRow[];
  finalMixIngredients: CasePrepIngredientRow[];
  fixedPartsByWeight: boolean;
} => {
  if (!api) {
    return { premixIngredients: [], finalMixIngredients: [], fixedPartsByWeight: false };
  }
  const fixed = Boolean(api.fixedPartsByWeight);
  const premix = Array.isArray(api.premixIngredients) ? api.premixIngredients : [];
  const finalMix = Array.isArray(api.finalMixIngredients) ? api.finalMixIngredients : [];

  return {
    fixedPartsByWeight: fixed,
    premixIngredients: premix
      .filter((row) => String(row.ingredient ?? "").trim())
      .map((row, index) => apiIngredientToRow(row, index, fixed)),
    finalMixIngredients: finalMix
      .filter((row) => String(row.ingredient ?? "").trim())
      .map((row, index) => apiIngredientToRow(row, index, fixed)),
  };
};
