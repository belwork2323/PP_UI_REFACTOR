import type { MaterialsListItem } from "../MaterialsListModel";
import type { CasePrepIngredientRow, LinerTypeValue } from "./CasePrepMotorDataModel";

export type CasePrepLinerRecipeIngredient = {
  /** Display name shown in the Ingredient column. */
  name: string;
  /** Alternate names used to match materials master. */
  aliases?: string[];
  /** Fixed parts-by-weight when known (PEDCOAT); omit for ACEM-shared. */
  partsByWeight?: string;
};

export type CasePrepLinerRecipe = {
  premix: CasePrepLinerRecipeIngredient[];
  finalMix: CasePrepLinerRecipeIngredient[];
  /** When true, parts-by-weight come from the recipe and are read-only. */
  fixedPartsByWeight: boolean;
};

const PEDCOAT_RECIPE: CasePrepLinerRecipe = {
  fixedPartsByWeight: true,
  premix: [
    { name: "HTPB", partsByWeight: "100.00" },
    { name: "TMP", partsByWeight: "1.00" },
    { name: "V2O5", aliases: ["V₂O₅", "V2O5"], partsByWeight: "1.60" },
    { name: "Carbon Black", aliases: ["CARBON BLACK"], partsByWeight: "10.00" },
  ],
  finalMix: [
    { name: "Liner Premix", aliases: ["LINER PREMIX"], partsByWeight: "100.00" },
    { name: "TDI", partsByWeight: "10.64" },
    { name: "CH2Cl2", aliases: ["CH₂Cl₂", "CH2CL2", "Dichloromethane"], partsByWeight: "110.64" },
  ],
};

const HEMCOAT_RECIPE: CasePrepLinerRecipe = {
  fixedPartsByWeight: false,
  premix: [
    { name: "HTPB" },
    { name: "nBD", aliases: ["NBD", "n-BD"] },
    { name: "Hexane Triol", aliases: ["HEXANE TRIOL", "Hexanetriol"] },
    { name: "Carbon Black", aliases: ["CARBON BLACK"] },
  ],
  finalMix: [
    { name: "Liner Premix", aliases: ["LINER PREMIX"] },
    { name: "TDI" },
    { name: "CH2Cl2", aliases: ["CH₂Cl₂", "CH2CL2", "Dichloromethane"] },
  ],
};

export const CASE_PREP_LINER_RECIPES: Partial<Record<LinerTypeValue, CasePrepLinerRecipe>> = {
  PEDCOAT: PEDCOAT_RECIPE,
  HEMCOAT_3L: HEMCOAT_RECIPE,
  HEMCOAT_3L_M: HEMCOAT_RECIPE,
};

export const CASE_PREP_ENTER_LOT_VALUE = "__ENTER_LOT__";

const normalizeNameKey = (value: string): string =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[₂]/g, "2")
    .replace(/[₅]/g, "5")
    .replace(/[^a-z0-9]+/g, "");

export const findMaterialByRecipeName = (
  materials: MaterialsListItem[],
  ingredient: CasePrepLinerRecipeIngredient,
): MaterialsListItem | undefined => {
  const candidates = [ingredient.name, ...(ingredient.aliases ?? [])].map(normalizeNameKey);
  const candidateSet = new Set(candidates.filter(Boolean));
  return materials.find((item) => {
    const nameKey = normalizeNameKey(item.materialName);
    const codeKey = normalizeNameKey(item.materialCode);
    return candidateSet.has(nameKey) || candidateSet.has(codeKey);
  });
};

export const isRecipeLinerType = (linerType: string | null | undefined): boolean => {
  const key = String(linerType ?? "").trim().toUpperCase() as LinerTypeValue;
  return Boolean(CASE_PREP_LINER_RECIPES[key]);
};

const recipeIngredientToRow = (
  ingredient: CasePrepLinerRecipeIngredient,
  index: number,
  materials: MaterialsListItem[],
  fixedPartsByWeight: boolean,
): CasePrepIngredientRow => {
  const master = findMaterialByRecipeName(materials, ingredient);
  const materialId =
    master?.materialId != null && Number.isFinite(Number(master.materialId))
      ? Number(master.materialId)
      : null;
  const materialCode = String(master?.materialCode ?? "").trim() || null;
  const materialName = String(master?.materialName ?? ingredient.name).trim() || ingredient.name;

  return {
    srNo: index + 1,
    materialId,
    materialCode,
    materialName,
    ingredient: ingredient.name,
    mfgLot: "",
    partsByWeight: fixedPartsByWeight ? String(ingredient.partsByWeight ?? "") : "",
    quantityTaken: "",
    totalQuantity: "",
  };
};

/** Build premix + final mix rows for a recipe liner type. */
export const buildLinerIngredientTables = (
  linerType: string | null | undefined,
  materials: MaterialsListItem[],
): { premixIngredients: CasePrepIngredientRow[]; finalMixIngredients: CasePrepIngredientRow[] } => {
  const key = String(linerType ?? "").trim().toUpperCase() as LinerTypeValue;
  const recipe = CASE_PREP_LINER_RECIPES[key];
  if (!recipe) {
    return { premixIngredients: [], finalMixIngredients: [] };
  }

  return {
    premixIngredients: recipe.premix.map((row, index) =>
      recipeIngredientToRow(row, index, materials, recipe.fixedPartsByWeight),
    ),
    finalMixIngredients: recipe.finalMix.map((row, index) =>
      recipeIngredientToRow(row, index, materials, recipe.fixedPartsByWeight),
    ),
  };
};

export const linerRecipeHasFixedParts = (linerType: string | null | undefined): boolean => {
  const key = String(linerType ?? "").trim().toUpperCase() as LinerTypeValue;
  return Boolean(CASE_PREP_LINER_RECIPES[key]?.fixedPartsByWeight);
};

/**
 * Re-attach materialId/code onto hydrated rows by matching ingredient / materialName
 * against the materials master (does not clear mfgLot or quantities).
 */
export const enrichIngredientRowsFromMaterials = (
  rows: CasePrepIngredientRow[],
  materials: MaterialsListItem[],
): CasePrepIngredientRow[] =>
  rows.map((row) => {
    if (row.materialCode) return row;
    const matchByName = findMaterialByRecipeName(materials, {
      name: row.ingredient || row.materialName,
      aliases: [row.materialName, row.ingredient].filter(Boolean),
    });
    if (matchByName) {
      return {
        ...row,
        materialId: Number(matchByName.materialId) || null,
        materialCode: String(matchByName.materialCode ?? "").trim() || null,
        materialName:
          String(matchByName.materialName ?? row.materialName).trim() || row.materialName,
      };
    }

    const codeCandidate = String(row.ingredient ?? row.materialName ?? "").trim();
    if (!codeCandidate) return row;
    const matchByCode = materials.find(
      (item) =>
        String(item.materialCode ?? "").trim().toUpperCase() === codeCandidate.toUpperCase(),
    );
    if (!matchByCode) return row;
    return {
      ...row,
      materialId: Number(matchByCode.materialId) || null,
      materialCode: String(matchByCode.materialCode ?? "").trim() || null,
      materialName:
        String(matchByCode.materialName ?? row.materialName).trim() || row.materialName,
      ingredient: String(row.materialName || matchByCode.materialName || row.ingredient).trim(),
    };
  });
