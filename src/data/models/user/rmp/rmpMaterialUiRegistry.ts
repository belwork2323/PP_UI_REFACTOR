export type RmpProcessSlot = "solid" | "liquid";

export type RmpMaterialUiKey = "defaultSolid" | "defaultLiquid";

export type ResolveMaterialUiKeyParams = {
  materialCode: string;
  slot: RmpProcessSlot;
  materialType?: string | null;
};

/** Per-material custom UIs register here in follow-up work. */
const MATERIAL_UI_REGISTRY: Record<string, RmpMaterialUiKey> = {};

export const resolveMaterialUiKey = ({
  materialCode,
  slot,
}: ResolveMaterialUiKeyParams): RmpMaterialUiKey => {
  const code = String(materialCode ?? "")
    .trim()
    .toUpperCase();
  if (MATERIAL_UI_REGISTRY[code]) {
    return MATERIAL_UI_REGISTRY[code];
  }
  if (slot === "liquid") return "defaultLiquid";
  return "defaultSolid";
};

export const rmpUiKeyShowsProcessPanel = (uiKey: RmpMaterialUiKey): boolean =>
  uiKey === "defaultSolid";
