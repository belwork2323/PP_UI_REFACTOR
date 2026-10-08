export type RmpProcessSlot = "solid" | "liquid";

export type RmpFormTemplate =
  | "DEFAULT"
  | "AP"
  | "ALUMINUM"
  | "DOA"
  | "HTPB"
  | "TDI"
  | "CC"
  | "IO"
  | "NONOX_D";

export type RmpMaterialUiKey =
  | "defaultSolid"
  | "defaultLiquid"
  | "apCoarse"
  | "apFine"
  | "apUltraFine"
  | "aluminum"
  | "doa"
  | "htpb"
  | "tdi"
  | "cc"
  | "io"
  | "nonoxD";

export type ResolveMaterialUiKeyParams = {
  materialCode: string;
  slot: RmpProcessSlot;
  gradeCode?: string | null;
  materialType?: string | null;
  /** From material master. Missing → DEFAULT (default solid/liquid by slot). */
  rmpFormTemplate?: string | null;
};

export const AP_GRADE_OPTIONS = [
  { value: "COARSE", label: "AP Coarse" },
  { value: "FINE", label: "AP Fine" },
  { value: "ULTRA_FINE", label: "AP Ultra Fine" },
] as const;

export type ApGradeCode = (typeof AP_GRADE_OPTIONS)[number]["value"];

export const parseRmpFormTemplate = (raw: string | null | undefined): RmpFormTemplate => {
  const value = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");
  if (value === "AP") return "AP";
  if (value === "ALUMINUM" || value === "ALUMINIUM" || value === "AL") return "ALUMINUM";
  if (value === "DOA") return "DOA";
  if (value === "HTPB") return "HTPB";
  if (value === "TDI" || value === "TBI") return "TDI";
  if (value === "CC" || value === "COPPER_CHROMITE") return "CC";
  if (value === "IO" || value === "IRON_OXIDE") return "IO";
  if (value === "NONOX_D" || value === "NONOXD" || value === "NONOX") return "NONOX_D";
  if (value === "DEFAULT" || value === "STANDARD") return "DEFAULT";
  return "DEFAULT";
};

/** Resolve template from master field only. Missing → DEFAULT (no materialCode guessing). */
export const resolveRmpFormTemplate = (params: {
  rmpFormTemplate?: string | null;
}): RmpFormTemplate => {
  const raw = String(params.rmpFormTemplate ?? "").trim();
  if (raw) return parseRmpFormTemplate(raw);
  return "DEFAULT";
};

export const isApRmpFormTemplate = (template: string | null | undefined): boolean =>
  resolveRmpFormTemplate({ rmpFormTemplate: template }) === "AP";

export const normalizeApGradeCode = (gradeCode: string | null | undefined): string => {
  const raw = String(gradeCode ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
  if (!raw) return "";
  if (
    raw === "APC" ||
    raw === "AP_C" ||
    raw === "AP_COARSE" ||
    raw.includes("COARSE")
  ) {
    return "COARSE";
  }
  if (
    raw === "APUF" ||
    raw === "AP_UF" ||
    raw === "AP_ULTRA_FINE" ||
    raw === "UF" ||
    raw === "ULTRAFINE" ||
    raw.includes("ULTRA")
  ) {
    return "ULTRA_FINE";
  }
  if (
    raw === "APF" ||
    raw === "AP_F" ||
    raw === "AP_FINE" ||
    (raw.includes("FINE") && !raw.includes("COARSE"))
  ) {
    return "FINE";
  }
  return raw;
};

export const resolveMaterialUiKey = ({
  slot,
  gradeCode,
  rmpFormTemplate,
}: ResolveMaterialUiKeyParams): RmpMaterialUiKey => {
  const template = resolveRmpFormTemplate({ rmpFormTemplate });

  if (template === "AP") {
    const grade = normalizeApGradeCode(gradeCode);
    if (grade === "COARSE") return "apCoarse";
    if (grade === "FINE") return "apFine";
    if (grade === "ULTRA_FINE") return "apUltraFine";
    return "defaultSolid";
  }
  if (template === "ALUMINUM") return "aluminum";
  if (template === "DOA") return "doa";
  if (template === "HTPB") return "htpb";
  if (template === "TDI") return "tdi";
  if (template === "CC") return "cc";
  if (template === "IO") return "io";
  if (template === "NONOX_D") return "nonoxD";

  if (slot === "liquid") return "defaultLiquid";
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
  uiKey === "doa" ||
  uiKey === "htpb" ||
  uiKey === "tdi" ||
  uiKey === "cc" ||
  uiKey === "io" ||
  uiKey === "nonoxD";

/** Typed panels routed through ApGradeMaterialProcessPanel (AP / Al / liquid dispatch). */
export const isTypedSolidUiKey = (
  uiKey: RmpMaterialUiKey,
): uiKey is
  | "apCoarse"
  | "apFine"
  | "apUltraFine"
  | "aluminum"
  | "doa"
  | "htpb"
  | "tdi" =>
  uiKey === "apCoarse" ||
  uiKey === "apFine" ||
  uiKey === "apUltraFine" ||
  uiKey === "aluminum" ||
  uiKey === "doa" ||
  uiKey === "htpb" ||
  uiKey === "tdi";
