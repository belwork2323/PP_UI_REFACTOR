export type RmpProcessSlot = "solid" | "liquid";

export type RmpMaterialUiKey =
  | "defaultSolid"
  | "defaultLiquid"
  | "apCoarse"
  | "apFine"
  | "apUltraFine"
  | "aluminum"
  | "doa";

export type ResolveMaterialUiKeyParams = {
  materialCode: string;
  slot: RmpProcessSlot;
  gradeCode?: string | null;
  materialType?: string | null;
};

export const AP_GRADE_OPTIONS = [
  { value: "COARSE", label: "AP Coarse" },
  { value: "FINE", label: "AP Fine" },
  { value: "ULTRA_FINE", label: "AP Ultra Fine" },
] as const;

export type ApGradeCode = (typeof AP_GRADE_OPTIONS)[number]["value"];

export const isApMaterialCode = (materialCode: string | null | undefined): boolean =>
  String(materialCode ?? "")
    .trim()
    .toUpperCase() === "AP";

export const isAluminumMaterialCode = (materialCode: string | null | undefined): boolean => {
  const code = String(materialCode ?? "")
    .trim()
    .toUpperCase();
  return code === "AL" || code === "ALUMINIUM" || code === "ALUMINUM";
};

export const normalizeApGradeCode = (gradeCode: string | null | undefined): string => {
  const raw = String(gradeCode ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (!raw) return "";
  if (raw.includes("ULTRA")) return "ULTRA_FINE";
  if (raw.includes("FINE") && !raw.includes("COARSE")) return "FINE";
  if (raw.includes("COARSE")) return "COARSE";
  if (raw === "UF" || raw === "ULTRAFINE") return "ULTRA_FINE";
  return raw;
};

/** Per-material custom UIs keyed by uppercase material code. */
const MATERIAL_UI_REGISTRY: Record<string, RmpMaterialUiKey> = {
  AL: "aluminum",
  ALUMINIUM: "aluminum",
  ALUMINUM: "aluminum",
  DOA: "doa",
};

export const resolveMaterialUiKey = ({
  materialCode,
  slot,
  gradeCode,
}: ResolveMaterialUiKeyParams): RmpMaterialUiKey => {
  const code = String(materialCode ?? "")
    .trim()
    .toUpperCase();
  if (MATERIAL_UI_REGISTRY[code]) {
    return MATERIAL_UI_REGISTRY[code];
  }
  if (slot === "liquid") return "defaultLiquid";

  if (isApMaterialCode(code)) {
    const grade = normalizeApGradeCode(gradeCode);
    if (grade === "COARSE") return "apCoarse";
    if (grade === "FINE") return "apFine";
    if (grade === "ULTRA_FINE") return "apUltraFine";
    return "defaultSolid";
  }

  return "defaultSolid";
};

/** Solid, liquid, and custom typed materials show a process panel. */
export const rmpUiKeyShowsProcessPanel = (uiKey: RmpMaterialUiKey): boolean =>
  uiKey === "defaultSolid" ||
  uiKey === "defaultLiquid" ||
  uiKey === "apCoarse" ||
  uiKey === "apFine" ||
  uiKey === "apUltraFine" ||
  uiKey === "aluminum" ||
  uiKey === "doa";

export const isTypedSolidUiKey = (
  uiKey: RmpMaterialUiKey,
): uiKey is "apCoarse" | "apFine" | "apUltraFine" | "aluminum" | "doa" =>
  uiKey === "apCoarse" ||
  uiKey === "apFine" ||
  uiKey === "apUltraFine" ||
  uiKey === "aluminum" ||
  uiKey === "doa";
