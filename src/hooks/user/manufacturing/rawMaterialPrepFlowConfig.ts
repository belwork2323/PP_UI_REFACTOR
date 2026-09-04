import type { MaterialItem } from "../../../data/models/admin/BatchManagement/BatchManagementModel";
import { createEmptyPremixSchemaSession } from "../../../data/models/user/RawMaterialPreparationModel";
import {
  buildRawMaterialSchemaRequestFromCodes,
  findGradeInMaterial,
} from "../../../schema-engine/adapters/rawMaterialPreparation.adapter";
import {
  materialSelectionKey,
  normalizeMaterialsListResponse,
  type MaterialsListGrade,
  type MaterialsListItem,
} from "../../../data/models/user/MaterialsListModel";

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

type RawMaterialPrepPremixSession = ReturnType<typeof createEmptyPremixSchemaSession>;

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

export const buildPremixMaterialOptions = (
  sheetMaterials: MaterialItem[],
  solidMaterials: RawMaterialPrepMaterialOption[],
  liquidMaterials: RawMaterialPrepMaterialOption[],
): PremixMaterialOption[] =>
  (() => {
    const distinctMaterialCodes = Array.from(
      new Set(
        (sheetMaterials ?? [])
          .map((row) => String(row.materialCode ?? "").trim())
          .filter(Boolean)
          .map((c) => c.toUpperCase()),
      ),
    );

    const options: PremixMaterialOption[] = [];

    distinctMaterialCodes.forEach((materialCodeUpper) => {
      const materialCode = materialCodeUpper; // keep upper for stable matching

      const solidMat = findPrepMaterialByCode(solidMaterials, materialCode);
      const liquidMat = findPrepMaterialByCode(liquidMaterials, materialCode);
      const listMat = solidMat ?? liquidMat;
      if (!listMat) return;

      const processType = resolveMaterialProcessType(
        materialCode,
        solidMaterials,
        liquidMaterials,
      );

      const resolvedProcessType: PremixMaterialOption["processType"] =
        processType.solid && processType.liquid
          ? "both"
          : processType.solid
            ? "solid"
            : "liquid";

      options.push({
        key: materialSelectionKey(materialCode, undefined),
        materialCode,
        materialName: listMat.materialName ?? materialCode,
        gradeCode: "",
        gradeName: "",
        materialId: listMat.materialId,
        gradeId: undefined,
        processType: resolvedProcessType,
      });
    });

    // De-dupe by key (last write wins, but order is stable enough here)
    const byKey = new Map<string, PremixMaterialOption>();
    options.forEach((o) => byKey.set(o.key, o));
    return Array.from(byKey.values());
  })();

export const createEmptyPremixSelection = (premix: number) => ({
  premix,
  premixDate: "",
  materialKey: "",
  sheetSrNo: 0,
  materialName: "",
  lotId: "",
  make: "",
  quantityPerPremix: 0,
  requiredComposition: 0,
  selectedProcesses: { solid: false, liquid: false },
  solidMaterialCode: "",
  solidGradeCode: "",
  liquidMaterialCode: "",
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
  solidMaterials: RawMaterialPrepMaterialOption[],
  liquidMaterials: RawMaterialPrepMaterialOption[],
): ReturnType<typeof createEmptyPremixSelection> & {
  materialKey: string;
  sheetSrNo: number;
  materialName: string;
  lotId: string;
  make: string;
  quantityPerPremix: number;
  requiredComposition: number;
  solidMaterialId?: number;
  solidGradeId?: number;
  liquidMaterialId?: number;
} => {
  const materialCode = String(row.materialCode ?? "").trim();
  const selectedProcesses = resolvePremixProcessesForMaterial(
    materialCode,
    solidMaterials,
    liquidMaterials,
  );
  const solidMaterial = selectedProcesses.solid
    ? findPrepMaterialByCode(solidMaterials, materialCode)
    : undefined;
  const liquidMaterial = selectedProcesses.liquid
    ? findPrepMaterialByCode(liquidMaterials, materialCode)
    : undefined;
  const listMaterial =
    solidMaterial ??
    liquidMaterial ??
    findPrepMaterialByCode(mergeMaterialsLists(solidMaterials, liquidMaterials), materialCode);
  const grade = resolveGradeFromSheetRow(row, solidMaterial);
  const materialKey =
    materialSelectionKey(materialCode, grade.gradeCode || undefined) || `sr-${row.srNo}`;

  return {
    premix,
    premixDate: "",
    materialKey,
    sheetSrNo: Number(row.srNo ?? 0),
    materialName: String(row.materialName ?? listMaterial?.materialName ?? materialCode).trim(),
    lotId: String(row.lotId ?? "").trim(),
    make: String(row.make ?? row.manufacturerName ?? "").trim(),
    quantityPerPremix: Number(row.quantityPerPremix ?? 0),
    requiredComposition: Number(row.requiredComposition ?? 0),
    selectedProcesses,
    solidMaterialCode: selectedProcesses.solid ? materialCode : "",
    solidGradeCode: selectedProcesses.solid ? grade.gradeCode : "",
    solidMaterialId: solidMaterial?.materialId ?? listMaterial?.materialId,
    solidGradeId: grade.gradeId,
    liquidMaterialCode: selectedProcesses.liquid ? materialCode : "",
    liquidMaterialId: liquidMaterial?.materialId ?? listMaterial?.materialId,
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
  }>,
  solidMaterials: RawMaterialPrepMaterialOption[],
  existing: Record<string, RawMaterialPrepPremixSession> = {},
) => {
  const sessions = { ...existing };

  selections.forEach((entry) => {
    const key = getPremixMaterialSessionKey(entry.premix, entry.materialKey);
    if (sessions[key]) return;

    const gradesRequired =
      entry.selectedProcesses.solid &&
      materialRequiresGradeSelection(solidMaterials, entry.solidMaterialCode);
    const solidSchemaReady =
      entry.selectedProcesses.solid && (!gradesRequired || Boolean(entry.solidGradeCode));

    sessions[key] = {
      ...createEmptyPremixSchemaSession(),
      selectedProcesses: entry.selectedProcesses,
      solidMaterialCode: entry.solidMaterialCode,
      solidGradeCode: entry.solidGradeCode,
      liquidMaterialCode: entry.liquidMaterialCode,
      solid: solidSchemaReady
        ? { schema: null, schemaLoading: true, schemaError: null, formValues: {} }
        : { schema: null, schemaLoading: false, schemaError: null, formValues: {} },
      liquid: entry.selectedProcesses.liquid
        ? { schema: null, schemaLoading: true, schemaError: null, formValues: {} }
        : { schema: null, schemaLoading: false, schemaError: null, formValues: {} },
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
        Boolean(session.pendingSolidSections?.length)
      ) {
        return true;
      }

      if (
        selection.liquidMaterialCode &&
        String(session.liquidMaterialCode ?? "").toUpperCase() ===
          selection.liquidMaterialCode.toUpperCase() &&
        Boolean(session.pendingLiquidSections?.length)
      ) {
        return true;
      }

      return false;
    });

    if (!orphanEntry) return;
    const [, orphan] = orphanEntry;

    next[key] = {
      ...(current ?? createEmptyPremixSchemaSession()),
      selectedProcesses: selection.selectedProcesses ??
        orphan.selectedProcesses ??
        current?.selectedProcesses ?? { solid: false, liquid: false },
      solidMaterialCode: selection.solidMaterialCode || orphan.solidMaterialCode,
      solidGradeCode: selection.solidGradeCode || orphan.solidGradeCode,
      liquidMaterialCode: selection.liquidMaterialCode || orphan.liquidMaterialCode,
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
      solid: current?.solid
        ? { ...current.solid, formValues: { ...(current.solid.formValues ?? {}) } }
        : {
            ...orphan.solid,
            formValues: { ...(orphan.solid?.formValues ?? {}) },
          },
      liquid: current?.liquid
        ? { ...current.liquid, formValues: { ...(current.liquid.formValues ?? {}) } }
        : {
            ...orphan.liquid,
            formValues: { ...(orphan.liquid?.formValues ?? {}) },
          },
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

export const resolveSchemaSlotForProcessType = (
  processType: PremixMaterialOption["processType"],
): RawMaterialPrepProcessKey => (processType === "liquid" ? "liquid" : "solid");

export const resolvePremixSchemaParams = (
  option: PremixMaterialOption,
  subDepartmentId: number,
) => {
  const slot = resolveSchemaSlotForProcessType(option.processType);
  const materialId = Number(option.materialId ?? 0);
  if (!option.materialCode || !subDepartmentId || !materialId) return null;

  return {
    slot,
    request: buildRawMaterialSchemaRequestFromCodes({
      subDepartmentId,
      materialId,
      materialCode: option.materialCode,
      gradeId: slot === "solid" ? option.gradeId ?? null : null,
      gradeCode: slot === "solid" ? option.gradeCode || null : null,
    }),
  };
};

export const buildPremixSessionsFromSelections = (
  selections: Array<{ premix: number }>,
  existing: Record<number, RawMaterialPrepPremixSession> = {},
) => {
  const sessions = { ...existing };
  selections.forEach((entry) => {
    if (!sessions[entry.premix]) {
      sessions[entry.premix] = createEmptyPremixSchemaSession();
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
  fallbackProcessType: PremixMaterialOption["processType"] = "liquid",
) => {
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
  const solidSchemaReady = hasSolid && (!gradesRequired || Boolean(option.gradeCode));

  const entry = {
    premix,
    premixDate: "",
    selectedProcesses,
    solidMaterialCode: hasSolid ? option.materialCode : "",
    solidGradeCode: hasSolid ? option.gradeCode : "",
    solidMaterialId: option.materialId ?? solidMaterial?.materialId ?? listMaterial?.materialId,
    solidGradeId: option.gradeId ?? solidGrade?.gradeId,
    liquidMaterialCode: hasLiquid ? option.materialCode : "",
    liquidMaterialId: option.materialId ?? liquidMaterial?.materialId ?? listMaterial?.materialId,
  };

  const session = {
    ...createEmptyPremixSchemaSession(),
    selectedProcesses,
    solidMaterialCode: hasSolid ? option.materialCode : "",
    solidGradeCode: hasSolid ? option.gradeCode : "",
    liquidMaterialCode: hasLiquid ? option.materialCode : "",
    solid: solidSchemaReady
      ? { schema: null, schemaLoading: true, schemaError: null, formValues: {} }
      : { schema: null, schemaLoading: false, schemaError: null, formValues: {} },
    liquid: hasLiquid
      ? { schema: null, schemaLoading: true, schemaError: null, formValues: {} }
      : { schema: null, schemaLoading: false, schemaError: null, formValues: {} },
  };

  return { entry, session };
};

export const buildPremixSelectionsFromCount = (count: number) =>
  Array.from({ length: Math.max(0, count) }, (_, index) =>
    createEmptyPremixSelection(index + 1),
  );
