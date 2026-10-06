/** API response from POST /post-cure/ingredients */
export type PostCureIngredientsApiResponse = {
  recipeType?: string;
  fixedPartsByWeight?: boolean;
  ingredients?: Array<{
    ingredient?: string;
    aliases?: string[];
    partsByWeight?: string | null;
    materialId?: number | null;
    materialCode?: string | null;
  }>;
};

export const POST_CURE_RECIPE_TYPES = {
  LOOSE_FLAP_EPOXY: "LOOSE_FLAP_EPOXY",
  IR1_PREMIX: "IR1_PREMIX",
  IR1_FINAL_MIX: "IR1_FINAL_MIX",
  HEMCOAT_3K_PREMIX: "HEMCOAT_3K_PREMIX",
  HEMCOAT_3K_FINAL_MIX: "HEMCOAT_3K_FINAL_MIX",
} as const;

export type PostCureRecipeType =
  (typeof POST_CURE_RECIPE_TYPES)[keyof typeof POST_CURE_RECIPE_TYPES];

const normalizeIngredientKey = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

type QtyKey = "quantity" | "qtyTaken";

/**
 * Build ingredient rows from the post-cure ingredients API.
 * Preserves mfgLot / qty from existing rows matched by ingredient name or materialCode
 * (Case Prep style: saved `ingredient` may be a master code).
 */
export const buildPostCureIngredientRowsFromApi = <T extends Record<string, unknown>>(
  api: PostCureIngredientsApiResponse | null | undefined,
  qtyKey: QtyKey,
  existing?: T[] | null,
): T[] => {
  const ingredients = Array.isArray(api?.ingredients) ? api!.ingredients! : [];
  if (!ingredients.length) return (existing ?? []) as T[];

  const existingRows = Array.isArray(existing) ? existing : [];
  const existingByKey = new Map<string, T>();
  for (const row of existingRows) {
    const ingredientKey = normalizeIngredientKey(
      (row as { ingredient?: unknown; INGREDIENT?: unknown }).ingredient ??
        (row as { INGREDIENT?: unknown }).INGREDIENT,
    );
    const codeKey = normalizeIngredientKey(
      (row as { materialCode?: unknown }).materialCode,
    );
    if (ingredientKey) existingByKey.set(ingredientKey, row);
    if (codeKey) existingByKey.set(codeKey, row);
  }

  const prevTotal = existingRows.find((row) => {
    const sr = String(
      (row as { srNo?: unknown; SR_NO?: unknown }).srNo ??
        (row as { SR_NO?: unknown }).SR_NO ??
        "",
    )
      .trim()
      .toUpperCase();
    return sr === "TOTAL";
  });

  const rows: T[] = ingredients
    .filter((raw) => String(raw.ingredient ?? "").trim())
    .map((raw, index) => {
      const ingredient = String(raw.ingredient ?? "").trim();
      const materialCode = String(raw.materialCode ?? "").trim() || null;
      const nameKey = normalizeIngredientKey(ingredient);
      const codeKey = normalizeIngredientKey(materialCode);
      const prev =
        (nameKey ? existingByKey.get(nameKey) : undefined) ??
        (codeKey ? existingByKey.get(codeKey) : undefined);
      const materialId =
        raw.materialId != null && Number.isFinite(Number(raw.materialId))
          ? Number(raw.materialId)
          : null;
      const partsByWeight = String(raw.partsByWeight ?? "").trim();
      const prevMfgLot = String(
        (prev as { mfgLot?: unknown; MFG_LOT?: unknown } | undefined)?.mfgLot ??
          (prev as { MFG_LOT?: unknown } | undefined)?.MFG_LOT ??
          "",
      );
      const prevQty = String(
        (prev as Record<string, unknown> | undefined)?.[qtyKey] ??
          (prev as { quantity?: unknown; qtyTaken?: unknown } | undefined)?.quantity ??
          (prev as { qtyTaken?: unknown } | undefined)?.qtyTaken ??
          "",
      );

      return {
        srNo: index + 1,
        ingredient,
        materialId,
        materialCode,
        mfgLot: prevMfgLot,
        partsByWeight,
        [qtyKey]: prevQty,
      } as unknown as T;
    });

  const totalQty = String(
    (prevTotal as Record<string, unknown> | undefined)?.[qtyKey] ??
      (prevTotal as { quantity?: unknown; qtyTaken?: unknown } | undefined)?.quantity ??
      (prevTotal as { qtyTaken?: unknown } | undefined)?.qtyTaken ??
      "",
  );

  rows.push({
    srNo: "TOTAL",
    ingredient: "Total Quantity",
    materialId: null,
    materialCode: null,
    mfgLot: "",
    partsByWeight: "",
    [qtyKey]: totalQty,
  } as unknown as T);

  return rows;
};
