import type { MaterialItem } from "../../../data/models/admin/BatchManagement/BatchManagementModel";
import {
  createEmptyPremixProcessSession,
  hydratePremixProcessSlot,
  normalizeMaterialProcessSlot,
} from "../../../data/models/user/RawMaterialPreparationModel";
import { processFormHasUserData } from "../../../data/models/user/rmp/defaultSolidProcessForm";
import { findGradeInMaterial } from "../../../data/models/user/rmp/rmpProcessTypes";
import {
  materialSelectionKey,
  materialUsesApForm,
  normalizeMaterialsListResponse,
  type MaterialsListGrade,
  type MaterialsListItem,
} from "../../../data/models/user/MaterialsListModel";
import {
  AP_GRADE_OPTIONS,
  isApRmpFormTemplate,
  normalizeApGradeCode,
} from "../../../data/models/user/rmp/rmpMaterialUiRegistry";

export const PREMIX_COUNT = 15;

export const PREMIX_OPTIONS = Array.from({ length: PREMIX_COUNT }, (_, i) => i + 1);

export type RawMaterialPrepProcessKey = "solid" | "liquid";

export type RawMaterialPrepSelectedProcesses = Record<RawMaterialPrepProcessKey, boolean>;

export const DEFAULT_SELECTED_PROCESSES: RawMaterialPrepSelectedProcesses = {
  solid: false,
  liquid: false,
};

export type RawMaterialPrepMaterialGrade = MaterialsListGrade;

export type RawMaterialPrepMaterialOption = MaterialsListItem;

export const normalizeMaterialsList = normalizeMaterialsListResponse;

export const findPrepMaterialByCode = (
  materials: RawMaterialPrepMaterialOption[],
  materialCode: string
) =>
  materials.find((m) => m.materialCode.toUpperCase() === String(materialCode ?? "").toUpperCase());

export const getPrepMaterialGrades = (
  materials: RawMaterialPrepMaterialOption[],
  materialCode: string
) => findPrepMaterialByCode(materials, materialCode)?.grades ?? [];

export const materialRequiresGradeSelection = (
  materials: RawMaterialPrepMaterialOption[],
  materialCode: string
) => getPrepMaterialGrades(materials, materialCode).length > 0;

export const RAW_MATERIAL_PREP_PROCESSES = [
  { value: "solid" as const, label: "Solid ingredients processing" },
  { value: "liquid" as const, label: "Liquid ingredients processing" },
];

export const getPremixLabel = (n: number) => `Premix - ${n}`;

/** Premix material nav: `AP - COARSE` when a grade is present; otherwise material code only. */
export const formatRmpMaterialNavLabel = (entry: {
  solidMaterialCode?: string;
  liquidMaterialCode?: string;
  solidGradeCode?: string;
  solidGradeName?: string;
  materialCode?: string;
  gradeCode?: string;
  gradeName?: string;
}) => {
  const material = String(
    entry.solidMaterialCode || entry.liquidMaterialCode || entry.materialCode || "",
  ).trim();
  const gradeCode = String(entry.solidGradeCode || entry.gradeCode || "").trim();
  const normalizedAp = normalizeApGradeCode(gradeCode);
  const apOption = AP_GRADE_OPTIONS.find((option) => option.value === normalizedAp);
  const isApGrade = Boolean(apOption);
  const grade = isApGrade
    ? normalizedAp.replace(/_/g, " ")
    : String(entry.solidGradeName || entry.gradeName || gradeCode).trim();
  if (!material) return grade;
  if (!grade) return material;
  const materialUpper = material.toUpperCase();
  const gradeUpper = grade.toUpperCase();
  if (
    gradeUpper === materialUpper ||
    gradeUpper.startsWith(`${materialUpper} - `) ||
    gradeUpper.startsWith(`${materialUpper}-`)
  ) {
    return grade;
  }
  return `${material} - ${grade}`;
};

export const normalizeBatchScale = (batchType?: string) => {
  const normalized = String(batchType ?? "").toLowerCase().replace(/\s+/g, "");
  if (normalized.includes("sub")) return "subscale" as const;
  if (normalized.includes("main")) return "mainscale" as const;
  return null;
};

export const getBatchScaleLabel = (batchType?: string) => {
  const scale = normalizeBatchScale(batchType);
  if (scale === "mainscale") return "Main Scale";
  if (scale === "subscale") return "Sub Scale";
  return batchType || "—";
};

export type PremixMaterialOption = {
  key: string;
  materialCode: string;
  materialName: string;
  gradeCode: string;
  gradeName: string;
  materialId?: number;
  gradeId?: number;
  processType: RawMaterialPrepProcessKey | "both";
};

type RawMaterialPrepPremixSession = ReturnType<typeof createEmptyPremixProcessSession>;

export const resolveMaterialProcessType = (
  materialCode: string,
  solidMaterials: RawMaterialPrepMaterialOption[],
  liquidMaterials: RawMaterialPrepMaterialOption[],
): { solid: boolean; liquid: boolean } => {
  const code = String(materialCode ?? "").trim().toUpperCase();
  const inSolid = solidMaterials.some((m) => m.materialCode.toUpperCase() === code);
  const inLiquid = liquidMaterials.some((m) => m.materialCode.toUpperCase() === code);
  return { solid: inSolid, liquid: inLiquid };
};

/** Classify from identification-sheet materialType (preferred over materials-list). */
export const resolveSheetMaterialProcessType = (
  materialType: string | null | undefined,
): { solid: boolean; liquid: boolean } => {
  const type = String(materialType ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (type === "SOLID") return { solid: true, liquid: false };
  if (type === "LIQUID") return { solid: false, liquid: true };
  if (type === "BOTH") return { solid: true, liquid: true };
  // Prefer solid when type is missing — never default unknown sheet materials to liquid.
  return { solid: true, liquid: false };
};

export const sheetMaterialToPrepOption = (
  row: MaterialItem,
): RawMaterialPrepMaterialOption => {
  const materialCode = String(row.materialCode ?? "").trim();
  const gradeCode = String(row.gradeCode ?? row.gradeName ?? "").trim();
  const template = String(row.rmpFormTemplate ?? "").trim().toUpperCase();
  const inferredAp = ["COARSE", "FINE", "ULTRA_FINE"].includes(
    normalizeApGradeCode(gradeCode),
  );
  const isAp = template === "AP" || inferredAp;
  return {
    materialId: Number(row.materialId ?? 0),
    materialCode,
    materialName: String(row.materialName ?? materialCode).trim() || materialCode,
    rawMaterialType: "NORMAL",
    preparationType: null,
    rmpFormTemplate: template || (inferredAp ? "AP" : "DEFAULT"),
    specCount: 0,
    grades: isAp
      ? [
          { gradeId: 1, gradeCode: "COARSE", gradeName: "AP Coarse" },
          { gradeId: 2, gradeCode: "FINE", gradeName: "AP Fine" },
          { gradeId: 3, gradeCode: "ULTRA_FINE", gradeName: "AP Ultra Fine" },
        ]
      : gradeCode
        ? [{ gradeId: 0, gradeCode, gradeName: String(row.gradeName ?? gradeCode) }]
        : [],
  };
};

export const buildSheetDerivedMaterialLists = (
  sheetMaterials: MaterialItem[],
): {
  solidMaterials: RawMaterialPrepMaterialOption[];
  liquidMaterials: RawMaterialPrepMaterialOption[];
} => {
  const solidByCode = new Map<string, RawMaterialPrepMaterialOption>();
  const liquidByCode = new Map<string, RawMaterialPrepMaterialOption>();

  (sheetMaterials ?? []).forEach((row) => {
    const code = String(row.materialCode ?? "").trim();
    if (!code) return;
    const option = sheetMaterialToPrepOption(row);
    const { solid, liquid } = resolveSheetMaterialProcessType(row.materialType);
    const key = code.toUpperCase();
    if (solid) solidByCode.set(key, option);
    if (liquid) liquidByCode.set(key, option);
  });

  return {
    solidMaterials: Array.from(solidByCode.values()),
    liquidMaterials: Array.from(liquidByCode.values()),
  };
};

export const buildPremixMaterialOptions = (
  sheetMaterials: MaterialItem[],
  _solidMaterials?: RawMaterialPrepMaterialOption[],
  _liquidMaterials?: RawMaterialPrepMaterialOption[],
): PremixMaterialOption[] =>
  (() => {
    const options: PremixMaterialOption[] = [];

    (sheetMaterials ?? []).forEach((row) => {
      const materialCode = String(row.materialCode ?? "").trim();
      if (!materialCode) return;

      const { solid, liquid } = resolveSheetMaterialProcessType(row.materialType);
      if (!solid && !liquid) return;

      const resolvedProcessType: PremixMaterialOption["processType"] =
        solid && liquid ? "both" : solid ? "solid" : "liquid";
      const gradeCode = String(row.gradeCode ?? row.gradeName ?? "").trim();
      const key = materialSelectionKey(materialCode, gradeCode || undefined) || materialCode;

      options.push({
        key,
        materialCode,
        materialName: String(row.materialName ?? materialCode).trim() || materialCode,
        gradeCode,
        gradeName: String(row.gradeName ?? gradeCode).trim(),
        materialId: row.materialId,
        processType: resolvedProcessType,
      });
    });

    const byKey = new Map<string, PremixMaterialOption>();
    options.forEach((option) => {
      if (!byKey.has(option.key)) byKey.set(option.key, option);
    });
    return Array.from(byKey.values());
  })();

export const createEmptyPremixSelection = (premix: number) => ({
  premix,
  premixDate: "",
  materialKey: "",
  sheetSrNo: 0,
  materialName: "",
  lotId: "",
  lotIds: [] as string[],
  make: "",
  quantityPerPremix: 0,
  requiredComposition: 0,
  selectedProcesses: { solid: false, liquid: false },
  solidMaterialCode: "",
  solidGradeCode: "",
  solidGradeName: "",
  solidMaterialId: undefined as number | undefined,
  solidRmpFormTemplate: null as string | null,
  liquidMaterialCode: "",
  liquidMaterialId: undefined as number | undefined,
  liquidRmpFormTemplate: null as string | null,
});

export const getSheetMaterialKey = (
  row: MaterialItem,
  solidMaterial?: RawMaterialPrepMaterialOption,
) => {
  const materialCode = String(row.materialCode ?? "").trim();
  const resolved = solidMaterial
    ? resolveGradeFromSheetRow(row, solidMaterial).gradeCode
    : String(row.gradeCode ?? row.gradeName ?? "").trim();
  return (
    materialSelectionKey(materialCode, resolved || undefined) || `sr-${row.srNo}`
  );
};

export const getPremixMaterialSessionKey = (premix: number, materialKey: string) =>
  `${premix}:${materialKey}`;

/** Re-key legacy sessions (`1:AP:COARSE`) to canonical keys (`1:AP::COARSE`). */
export const normalizePremixSessionKeys = <
  T extends {
    pendingSolidSections?: unknown;
    pendingLiquidSections?: unknown;
    pendingSolidProcess?: unknown;
    pendingLiquidProcess?: unknown;
  },
>(
  sessions: Record<string, T>,
): Record<string, T> => {
  const normalized: Record<string, T> = {};

  Object.entries(sessions).forEach(([rawKey, session]) => {
    const sep = rawKey.indexOf(":");
    if (sep <= 0) {
      normalized[rawKey] = session;
      return;
    }

    const premixPart = rawKey.slice(0, sep);
    const materialPart = rawKey.slice(sep + 1);

    if (materialPart.includes("::")) {
      normalized[rawKey] = session;
      return;
    }

    const gradeSep = materialPart.indexOf(":");
    if (gradeSep > 0) {
      const code = materialPart.slice(0, gradeSep);
      const grade = materialPart.slice(gradeSep + 1);
      const canonicalKey = getPremixMaterialSessionKey(
        Number(premixPart),
        materialSelectionKey(code, grade || undefined),
      );
      const existing = normalized[canonicalKey];
      normalized[canonicalKey] = existing
        ? {
            ...existing,
            ...session,
            pendingSolidProcess:
              (session as { pendingSolidProcess?: unknown }).pendingSolidProcess ??
              (existing as { pendingSolidProcess?: unknown }).pendingSolidProcess,
            pendingLiquidProcess:
              (session as { pendingLiquidProcess?: unknown }).pendingLiquidProcess ??
              (existing as { pendingLiquidProcess?: unknown }).pendingLiquidProcess,
            pendingSolidSections:
              (session as { pendingSolidSections?: unknown }).pendingSolidSections ??
              (existing as { pendingSolidSections?: unknown }).pendingSolidSections,
            pendingLiquidSections:
              (session as { pendingLiquidSections?: unknown }).pendingLiquidSections ??
              (existing as { pendingLiquidSections?: unknown }).pendingLiquidSections,
          }
        : session;
      return;
    }

    normalized[rawKey] = session;
  });

  return normalized;
};

const resolveGradeFromSheetRow = (
  row: MaterialItem,
  solidMaterial: RawMaterialPrepMaterialOption | undefined,
) => {
  const raw = String(row.gradeCode ?? row.gradeName ?? "").trim();
  if (!raw) return { gradeCode: "", gradeName: "", gradeId: undefined as number | undefined };

  const grades = solidMaterial?.grades ?? [];
  const match = grades.find(
    (grade) =>
      grade.gradeCode.toUpperCase() === raw.toUpperCase() ||
      grade.gradeName.toUpperCase() === raw.toUpperCase(),
  );

  const isAp =
    isApRmpFormTemplate(row.rmpFormTemplate) ||
    isApRmpFormTemplate(solidMaterial?.rmpFormTemplate);
  if (isAp) {
    const normalized = normalizeApGradeCode(match?.gradeCode || raw);
    const apOption = AP_GRADE_OPTIONS.find((option) => option.value === normalized);
    return {
      gradeCode: normalized || (match?.gradeCode ?? raw),
      gradeName: apOption?.label ?? match?.gradeName ?? String(row.gradeName ?? raw).trim(),
      gradeId: match?.gradeId,
    };
  }

  if (match) {
    return {
      gradeCode: match.gradeCode,
      gradeName: match.gradeName ?? match.gradeCode,
      gradeId: match.gradeId,
    };
  }

  return {
    gradeCode: raw,
    gradeName: String(row.gradeName ?? raw).trim(),
    gradeId: undefined as number | undefined,
  };
};

export const buildMaterialSelectionFromSheetRow = (
  row: MaterialItem,
  premix: number,
  _solidMaterials?: RawMaterialPrepMaterialOption[],
  _liquidMaterials?: RawMaterialPrepMaterialOption[],
): ReturnType<typeof createEmptyPremixSelection> & {
  materialKey: string;
  sheetSrNo: number;
  materialName: string;
  lotId: string;
  lotIds: string[];
  make: string;
  quantityPerPremix: number;
  requiredComposition: number;
  solidMaterialId?: number;
  solidGradeId?: number;
  liquidMaterialId?: number;
} => {
  const materialCode = String(row.materialCode ?? "").trim();
  const selectedProcesses = resolveSheetMaterialProcessType(row.materialType);
  const sheetOption = sheetMaterialToPrepOption(row);
  const grade = resolveGradeFromSheetRow(row, sheetOption);
  const materialKey =
    materialSelectionKey(materialCode, grade.gradeCode || undefined) || `sr-${row.srNo}`;
  const lotIds = (row.lotIds ?? [])
    .map((id) => String(id ?? "").trim())
    .filter(Boolean);
  const inferredAp = ["COARSE", "FINE", "ULTRA_FINE"].includes(
    normalizeApGradeCode(grade.gradeCode),
  );
  const template =
    String(row.rmpFormTemplate ?? "").trim() || (inferredAp ? "AP" : "DEFAULT");
  const materialId =
    row.materialId != null && Number.isFinite(Number(row.materialId))
      ? Number(row.materialId)
      : undefined;

  return {
    premix,
    premixDate: "",
    materialKey,
    sheetSrNo: Number(row.srNo ?? 0),
    materialName: String(row.materialName ?? materialCode).trim(),
    lotId: lotIds.join(", "),
    lotIds,
    make: String(row.make ?? row.manufacturerName ?? "").trim(),
    quantityPerPremix: Number(row.quantityPerPremix ?? 0),
    requiredComposition: Number(row.requiredComposition ?? 0),
    selectedProcesses,
    solidMaterialCode: selectedProcesses.solid ? materialCode : "",
    solidGradeCode: selectedProcesses.solid ? grade.gradeCode : "",
    solidGradeName: selectedProcesses.solid ? grade.gradeName : "",
    solidMaterialId: selectedProcesses.solid ? materialId : undefined,
    solidGradeId: grade.gradeId,
    solidRmpFormTemplate: selectedProcesses.solid ? template : null,
    liquidMaterialCode: selectedProcesses.liquid ? materialCode : "",
    liquidMaterialId: selectedProcesses.liquid ? materialId : undefined,
    liquidRmpFormTemplate: selectedProcesses.liquid ? template : null,
  };
};

export const buildPremixMaterialSelectionsFromSheet = (
  sheet: { materials?: MaterialItem[] } | null | undefined,
  premixCount: number,
  solidMaterials: RawMaterialPrepMaterialOption[],
  liquidMaterials: RawMaterialPrepMaterialOption[],
) => {
  const sheetMaterials = Array.isArray(sheet?.materials) ? sheet.materials : [];
  const selections: Array<ReturnType<typeof buildMaterialSelectionFromSheetRow>> = [];

  for (let premix = 1; premix <= Math.max(0, premixCount); premix += 1) {
    sheetMaterials.forEach((row) => {
      const selection = buildMaterialSelectionFromSheetRow(
        row,
        premix,
        solidMaterials,
        liquidMaterials,
      );
      if (selection.solidMaterialCode || selection.liquidMaterialCode) {
        selections.push(selection);
      }
    });
  }

  return selections;
};

export const buildPremixMaterialSessionsFromSelections = (
  selections: Array<{
    premix: number;
    materialKey: string;
    selectedProcesses: { solid: boolean; liquid: boolean };
    solidMaterialCode: string;
    solidGradeCode: string;
    liquidMaterialCode: string;
    solidRmpFormTemplate?: string | null;
    liquidRmpFormTemplate?: string | null;
  }>,
  solidMaterials: RawMaterialPrepMaterialOption[],
  existing: Record<string, RawMaterialPrepPremixSession> = {},
  liquidMaterials: RawMaterialPrepMaterialOption[] = [],
) => {
  const sessions = { ...existing };

  selections.forEach((entry) => {
    const key = getPremixMaterialSessionKey(entry.premix, entry.materialKey);
    if (sessions[key]) return;

    const solidMaterial = findPrepMaterialByCode(solidMaterials, entry.solidMaterialCode);
    const liquidMaterial = findPrepMaterialByCode(liquidMaterials, entry.liquidMaterialCode);

    const gradesRequired =
      entry.selectedProcesses.solid &&
      materialRequiresGradeSelection(solidMaterials, entry.solidMaterialCode);
    const solidMaterialReady =
      entry.selectedProcesses.solid && (!gradesRequired || Boolean(entry.solidGradeCode));

    sessions[key] = {
      ...createEmptyPremixProcessSession(),
      selectedProcesses: entry.selectedProcesses,
      solidMaterialCode: entry.solidMaterialCode,
      solidGradeCode: entry.solidGradeCode,
      liquidMaterialCode: entry.liquidMaterialCode,
      solidRmpFormTemplate: solidMaterial?.rmpFormTemplate ?? entry.solidRmpFormTemplate ?? null,
      liquidRmpFormTemplate: liquidMaterial?.rmpFormTemplate ?? entry.liquidRmpFormTemplate ?? null,
      solid: normalizeMaterialProcessSlot(
        "solid",
        solidMaterialReady ? entry.solidMaterialCode : "",
        null,
        entry.solidGradeCode,
        solidMaterial?.rmpFormTemplate ?? entry.solidRmpFormTemplate,
      ),
      liquid: entry.selectedProcesses.liquid
        ? normalizeMaterialProcessSlot(
            "liquid",
            entry.liquidMaterialCode,
            null,
            "",
            liquidMaterial?.rmpFormTemplate ?? entry.liquidRmpFormTemplate,
          )
        : normalizeMaterialProcessSlot("liquid", ""),
      apGradeSlots:
        materialUsesApForm(solidMaterial) ||
        String(entry.solidRmpFormTemplate ?? "").toUpperCase() === "AP"
          ? entry.solidGradeCode
            ? [
                {
                  gradeCode: entry.solidGradeCode,
                  slot: normalizeMaterialProcessSlot(
                    "solid",
                    entry.solidMaterialCode,
                    null,
                    entry.solidGradeCode,
                    solidMaterial?.rmpFormTemplate ?? entry.solidRmpFormTemplate ?? "AP",
                  ),
                },
              ]
            : []
          : undefined,
    };
  });

  return alignPremixSessionsToSelections(sessions, selections);
};

/**
 * Move pending API sections onto canonical selection keys when grade aliases diverge
 * (e.g. sheet "AP Coarse" vs API/catalog "COARSE").
 */
export const alignPremixSessionsToSelections = (
  sessions: Record<string, RawMaterialPrepPremixSession>,
  selections: Array<{
    premix: number;
    materialKey: string;
    solidMaterialCode: string;
    solidGradeCode: string;
    liquidMaterialCode: string;
    selectedProcesses?: { solid: boolean; liquid: boolean };
  }>,
) => {
  const next = { ...sessions };

  selections.forEach((selection) => {
    const key = getPremixMaterialSessionKey(selection.premix, selection.materialKey);
    const current = next[key];
    const hasPending =
      Boolean(current?.pendingSolidProcess) ||
      Boolean(current?.pendingLiquidProcess) ||
      Boolean(current?.pendingSolidSections?.length) ||
      Boolean(current?.pendingLiquidSections?.length);
    if (hasPending) return;

    const orphanEntry = Object.entries(next).find(([sessionKey, session]) => {
      if (sessionKey === key) return false;
      const sep = sessionKey.indexOf(":");
      if (sep <= 0) return false;
      if (Number(sessionKey.slice(0, sep)) !== selection.premix) return false;

      if (
        selection.solidMaterialCode &&
        String(session.solidMaterialCode ?? "").toUpperCase() ===
          selection.solidMaterialCode.toUpperCase() &&
        (Boolean(session.pendingSolidProcess) || Boolean(session.pendingSolidSections?.length))
      ) {
        return true;
      }

      if (
        selection.liquidMaterialCode &&
        String(session.liquidMaterialCode ?? "").toUpperCase() ===
          selection.liquidMaterialCode.toUpperCase() &&
        (Boolean(session.pendingLiquidProcess) || Boolean(session.pendingLiquidSections?.length))
      ) {
        return true;
      }

      return false;
    });

    if (!orphanEntry) return;
    const [, orphan] = orphanEntry;

    next[key] = {
      ...(current ?? createEmptyPremixProcessSession()),
      selectedProcesses: selection.selectedProcesses ??
        orphan.selectedProcesses ??
        current?.selectedProcesses ?? { solid: false, liquid: false },
      solidMaterialCode: selection.solidMaterialCode || orphan.solidMaterialCode,
      solidGradeCode: selection.solidGradeCode || orphan.solidGradeCode,
      liquidMaterialCode: selection.liquidMaterialCode || orphan.liquidMaterialCode,
      pendingSolidProcess: orphan.pendingSolidProcess ?? current?.pendingSolidProcess,
      pendingLiquidProcess: orphan.pendingLiquidProcess ?? current?.pendingLiquidProcess,
      pendingSolidSections: orphan.pendingSolidSections
        ? orphan.pendingSolidSections.map((section) => ({
            ...section,
            sectionData: Array.isArray(section.sectionData)
              ? section.sectionData.map((row) =>
                  row && typeof row === "object" ? { ...(row as Record<string, unknown>) } : row,
                )
              : section.sectionData,
          }))
        : current?.pendingSolidSections,
      pendingLiquidSections: orphan.pendingLiquidSections
        ? orphan.pendingLiquidSections.map((section) => ({
            ...section,
            sectionData: Array.isArray(section.sectionData)
              ? section.sectionData.map((row) =>
                  row && typeof row === "object" ? { ...(row as Record<string, unknown>) } : row,
                )
              : section.sectionData,
          }))
        : current?.pendingLiquidSections,
      solid:
        current?.solid && processFormHasUserData(current.solid.processForm)
          ? current.solid
          : hydratePremixProcessSlot(
              "solid",
              String(selection.solidMaterialCode || orphan.solidMaterialCode || ""),
              orphan.pendingSolidProcess ?? current?.pendingSolidProcess,
              selection.solidGradeCode || orphan.solidGradeCode,
            ),
      liquid:
        current?.liquid && processFormHasUserData(current.liquid.processForm)
          ? current.liquid
          : hydratePremixProcessSlot(
              "liquid",
              String(selection.liquidMaterialCode || orphan.liquidMaterialCode || ""),
              orphan.pendingLiquidProcess ?? current?.pendingLiquidProcess,
            ),
    };
  });

  return next;
};

export const mergePremixMaterialSelections = (
  existing: Array<ReturnType<typeof buildMaterialSelectionFromSheetRow>>,
  sheet: { materials?: MaterialItem[] } | null | undefined,
  premixCount: number,
  solidMaterials: RawMaterialPrepMaterialOption[],
  liquidMaterials: RawMaterialPrepMaterialOption[],
) => {
  const target = buildPremixMaterialSelectionsFromSheet(
    sheet,
    premixCount,
    solidMaterials,
    liquidMaterials,
  );
  const existingByKey = new Map(
    existing.map((entry) => [getPremixMaterialSessionKey(entry.premix, entry.materialKey), entry]),
  );

  return target.map((entry) => {
    const prev = existingByKey.get(getPremixMaterialSessionKey(entry.premix, entry.materialKey));
    if (!prev) return entry;

    return {
      ...entry,
      premixDate: prev.premixDate || entry.premixDate,
      solidMaterialId: prev.solidMaterialId ?? entry.solidMaterialId,
      solidGradeId: prev.solidGradeId ?? entry.solidGradeId,
      liquidMaterialId: prev.liquidMaterialId ?? entry.liquidMaterialId,
      solidGradeCode: prev.solidGradeCode || entry.solidGradeCode,
    };
  });
};

export const groupPremixSelectionsByPremix = <
  T extends { premix: number; premixDate?: string },
>(
  selections: T[],
) => {
  const grouped = new Map<number, T[]>();
  selections.forEach((entry) => {
    const list = grouped.get(entry.premix) ?? [];
    list.push(entry);
    grouped.set(entry.premix, list);
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([premix, materials]) => ({
      premix,
      premixDate: materials[0]?.premixDate ?? "",
      materials,
    }));
};

export const getPremixMaterialCode = (entry: {
  solidMaterialCode: string;
  liquidMaterialCode: string;
}) => entry.solidMaterialCode || entry.liquidMaterialCode || "";

export const getPremixMaterialSelectionKey = (entry: {
  solidMaterialCode: string;
  solidGradeCode: string;
  liquidMaterialCode: string;
}) => {
  if (entry.solidMaterialCode) {
    return materialSelectionKey(entry.solidMaterialCode, entry.solidGradeCode || undefined);
  }
  if (entry.liquidMaterialCode) {
    return entry.liquidMaterialCode;
  }
  return "";
};

export const findPremixMaterialOption = (
  options: PremixMaterialOption[],
  materialCode: string,
) =>
  options.find(
    (option) =>
      option.materialCode.toUpperCase() === String(materialCode ?? "").trim().toUpperCase() &&
      !option.gradeCode,
  );

export const buildPremixMaterialOptionWithGrade = (
  baseOption: PremixMaterialOption,
  gradeCode: string,
  solidMaterials: RawMaterialPrepMaterialOption[],
): PremixMaterialOption => {
  const solidMaterial = findPrepMaterialByCode(solidMaterials, baseOption.materialCode);
  const grade = findGradeInMaterial(solidMaterial, gradeCode);

  return {
    ...baseOption,
    key: materialSelectionKey(baseOption.materialCode, gradeCode),
    gradeCode,
    gradeName: grade?.gradeName ?? gradeCode,
    gradeId: grade?.gradeId,
  };
};

export const resolvePremixMaterialOptionFromEntry = (
  entry: {
    solidMaterialCode: string;
    solidGradeCode: string;
    liquidMaterialCode: string;
  },
  options: PremixMaterialOption[],
  solidMaterials: RawMaterialPrepMaterialOption[],
): PremixMaterialOption | undefined => {
  const materialCode = getPremixMaterialCode(entry);
  if (!materialCode) return undefined;

  const baseOption = findPremixMaterialOption(options, materialCode);
  if (!baseOption) return undefined;

  if (entry.solidMaterialCode && entry.solidGradeCode) {
    return buildPremixMaterialOptionWithGrade(baseOption, entry.solidGradeCode, solidMaterials);
  }

  return baseOption;
};

export const resolveProcessSlotForProcessType = (
  processType: PremixMaterialOption["processType"],
): RawMaterialPrepProcessKey => (processType === "liquid" ? "liquid" : "solid");

export const buildPremixSessionsFromSelections = (
  selections: Array<{ premix: number }>,
  existing: Record<number, RawMaterialPrepPremixSession> = {},
) => {
  const sessions = { ...existing };
  selections.forEach((entry) => {
    if (!sessions[entry.premix]) {
      sessions[entry.premix] = createEmptyPremixProcessSession();
    }
  });
  return sessions;
};

export const mergeMaterialsLists = (
  solidMaterials: RawMaterialPrepMaterialOption[],
  liquidMaterials: RawMaterialPrepMaterialOption[],
): RawMaterialPrepMaterialOption[] => {
  const byCode = new Map<string, RawMaterialPrepMaterialOption>();
  [...solidMaterials, ...liquidMaterials].forEach((material) => {
    byCode.set(material.materialCode.toUpperCase(), material);
  });
  return Array.from(byCode.values());
};

export const resolvePremixProcessesForMaterial = (
  materialCode: string,
  solidMaterials: RawMaterialPrepMaterialOption[],
  liquidMaterials: RawMaterialPrepMaterialOption[],
  fallbackProcessType: PremixMaterialOption["processType"] = "solid",
  sheetMaterialType?: string | null,
) => {
  if (sheetMaterialType != null && String(sheetMaterialType).trim()) {
    return resolveSheetMaterialProcessType(sheetMaterialType);
  }
  const processType = resolveMaterialProcessType(materialCode, solidMaterials, liquidMaterials);
  if (processType.solid && processType.liquid) {
    return { solid: true, liquid: true };
  }
  if (processType.solid) {
    return { solid: true, liquid: false };
  }
  if (processType.liquid) {
    return { solid: false, liquid: true };
  }

  return {
    solid: fallbackProcessType === "solid" || fallbackProcessType === "both",
    liquid: fallbackProcessType === "liquid" || fallbackProcessType === "both",
  };
};

export const applyMaterialOptionToPremix = (
  premix: number,
  option: PremixMaterialOption,
  solidMaterials: RawMaterialPrepMaterialOption[],
  liquidMaterials: RawMaterialPrepMaterialOption[],
) => {
  const selectedProcesses = resolvePremixProcessesForMaterial(
    option.materialCode,
    solidMaterials,
    liquidMaterials,
    option.processType,
  );
  const { solid: hasSolid, liquid: hasLiquid } = selectedProcesses;
  const solidMaterial = hasSolid
    ? findPrepMaterialByCode(solidMaterials, option.materialCode)
    : undefined;
  const liquidMaterial = hasLiquid
    ? findPrepMaterialByCode(liquidMaterials, option.materialCode)
    : undefined;
  const listMaterial =
    solidMaterial ??
    liquidMaterial ??
    findPrepMaterialByCode(mergeMaterialsLists(solidMaterials, liquidMaterials), option.materialCode);
  const solidGrade = solidMaterial
    ? findGradeInMaterial(solidMaterial, option.gradeCode)
    : undefined;
  const gradesRequired = hasSolid && (solidMaterial?.grades?.length ?? 0) > 0;
  const solidMaterialReady = hasSolid && (!gradesRequired || Boolean(option.gradeCode));

  const entry = {
    premix,
    premixDate: "",
    selectedProcesses,
    solidMaterialCode: hasSolid ? option.materialCode : "",
    solidGradeCode: hasSolid ? option.gradeCode : "",
    solidGradeName: hasSolid ? option.gradeName || solidGrade?.gradeName || "" : "",
    solidMaterialId: option.materialId ?? solidMaterial?.materialId ?? listMaterial?.materialId,
    solidGradeId: option.gradeId ?? solidGrade?.gradeId,
    liquidMaterialCode: hasLiquid ? option.materialCode : "",
    liquidMaterialId: option.materialId ?? liquidMaterial?.materialId ?? listMaterial?.materialId,
  };

  const session = {
    ...createEmptyPremixProcessSession(),
    selectedProcesses,
    solidMaterialCode: hasSolid ? option.materialCode : "",
    solidGradeCode: hasSolid ? option.gradeCode : "",
    liquidMaterialCode: hasLiquid ? option.materialCode : "",
    solidRmpFormTemplate: solidMaterial?.rmpFormTemplate ?? null,
    liquidRmpFormTemplate: liquidMaterial?.rmpFormTemplate ?? null,
    solid: normalizeMaterialProcessSlot(
      "solid",
      hasSolid && solidMaterialReady ? option.materialCode : "",
      null,
      hasSolid ? option.gradeCode : "",
      solidMaterial?.rmpFormTemplate,
    ),
    liquid: hasLiquid
      ? normalizeMaterialProcessSlot(
          "liquid",
          option.materialCode,
          null,
          "",
          liquidMaterial?.rmpFormTemplate,
        )
      : normalizeMaterialProcessSlot("liquid", ""),
    apGradeSlots: materialUsesApForm(solidMaterial)
      ? option.gradeCode
        ? [
            {
              gradeCode: option.gradeCode,
              slot: normalizeMaterialProcessSlot(
                "solid",
                option.materialCode,
                null,
                option.gradeCode,
                solidMaterial?.rmpFormTemplate ?? "AP",
              ),
            },
          ]
        : []
      : undefined,
  };

  return { entry, session };
};

export const buildPremixSelectionsFromCount = (count: number) =>
  Array.from({ length: Math.max(0, count) }, (_, index) =>
    createEmptyPremixSelection(index + 1),
  );
