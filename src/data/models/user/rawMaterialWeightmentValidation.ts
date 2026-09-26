import type { MaterialItem } from "../admin/BatchManagement/BatchManagementModel";
import type { RawMaterialPrepWeightmentDetail } from "./RawMaterialPreparationModel";

export type WeightmentRowFieldErrors = {
  materialCode?: string;
  materialName?: string;
  percentage?: string;
  weightTransferred?: string;
};

const PERCENTAGE_TOLERANCE = 0.01;
const WEIGHT_TOLERANCE_KG = 0.001;

const str = (value: unknown) => (value == null ? "" : String(value)).trim();

const isFiniteNumber = (value: unknown): boolean => {
  const text = str(value).replace(/,/g, "");
  return Boolean(text) && Number.isFinite(Number(text));
};

const WEIGHTMENT_ROW_REQUIRED_FIELDS: Array<keyof RawMaterialPrepWeightmentDetail> = [
  "materialCode",
  "percentage",
  "weightTransferred",
  "containerType",
  "containerNumber",
  "weighScaleNumber",
  "weighingDateTime",
];

/** True when a weightment row has every required field filled with valid values. */
export const weightmentRowHasCompleteData = (row: RawMaterialPrepWeightmentDetail): boolean => {
  const hasAny =
    WEIGHTMENT_ROW_REQUIRED_FIELDS.some((key) => str(row[key])) || str(row.materialName);
  if (!hasAny) return false;

  return WEIGHTMENT_ROW_REQUIRED_FIELDS.every((key) => {
    const text = str(row[key]);
    if (!text) return false;
    if (key === "percentage" || key === "weightTransferred") {
      return isFiniteNumber(text);
    }
    return true;
  });
};

/** True when the shared weightment sheet has a complete row for the material code. */
export const weightmentHasMaterialData = (
  sheet: RawMaterialPrepWeightmentDetail[] | { weightmentDetails?: RawMaterialPrepWeightmentDetail[] },
  materialCode: string,
): boolean => {
  const code = str(materialCode).toUpperCase();
  if (!code) return false;
  const rows = Array.isArray(sheet)
    ? sheet
    : Array.isArray(sheet.weightmentDetails)
      ? sheet.weightmentDetails
      : [];
  return rows.some(
    (row) => str(row.materialCode).toUpperCase() === code && weightmentRowHasCompleteData(row),
  );
};

export const numbersApproximatelyEqual = (
  a: number,
  b: number,
  epsilon = WEIGHT_TOLERANCE_KG,
): boolean => Math.abs(a - b) <= epsilon;

export const formatSheetMaterialLabel = (material: MaterialItem): string => {
  const code = String(material.materialCode ?? "").trim();
  const name = String(material.materialName ?? code).trim();
  const grade = String(material.gradeCode ?? material.gradeName ?? "").trim();
  return grade ? `${code} — ${name} (${grade})` : `${code} — ${name}`;
};

/** API may send plain numbers or `{ source, parsedValue }` wrappers. */
export const unwrapSheetNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const rec = value as Record<string, unknown>;
    if (rec.parsedValue != null && rec.parsedValue !== "") {
      const parsed = Number(rec.parsedValue);
      if (Number.isFinite(parsed)) return parsed;
    }
    if (rec.source != null && rec.source !== "") {
      const fromSource = Number(String(rec.source).replace(/,/g, "").trim());
      if (Number.isFinite(fromSource)) return fromSource;
    }
  }
  const text = String(value ?? "")
    .replace(/,/g, "")
    .trim();
  if (!text) return 0;
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
};

export const normalizeSheetMaterialsForWeightmentCompare = (
  materials: unknown,
): MaterialItem[] => {
  if (!Array.isArray(materials)) return [];
  return materials
    .map((raw, index) => {
      if (!raw || typeof raw !== "object") return null;
      const m = raw as Record<string, unknown>;
      const materialCode = String(m.materialCode ?? m.material_code ?? "").trim();
      if (!materialCode) return null;
      return {
        srNo: Number(m.srNo ?? m.sr_no ?? index + 1) || index + 1,
        materialCode,
        materialName: String(m.materialName ?? m.material_name ?? materialCode).trim(),
        gradeCode: String(m.gradeCode ?? m.grade_code ?? "").trim() || undefined,
        gradeName: String(m.gradeName ?? m.grade_name ?? "").trim() || undefined,
        lotId: String(m.lotId ?? m.lot_id ?? "").trim(),
        make: String(m.make ?? m.manufacturerName ?? "").trim(),
        manufacturerName: String(m.manufacturerName ?? m.make ?? "").trim(),
        requiredComposition: unwrapSheetNumber(m.requiredComposition ?? m.required_composition),
        quantityPerPremix: unwrapSheetNumber(m.quantityPerPremix ?? m.quantity_per_premix),
        revalidationFromDate: String(m.revalidationFromDate ?? "").trim(),
        revalidationToDate: String(m.revalidationToDate ?? "").trim(),
        revalidationDate: String(m.revalidationDate ?? m.revalidationFromDate ?? "").trim(),
      } as MaterialItem;
    })
    .filter(Boolean) as MaterialItem[];
};

export const getExpectedWeightmentForSheetMaterial = (material: MaterialItem) => {
  const percentage = unwrapSheetNumber(material.requiredComposition);
  const expectedWeightKg = Number(unwrapSheetNumber(material.quantityPerPremix).toFixed(3));

  return { percentage, expectedWeightKg };
};

export const findSheetMaterialForWeightmentRow = (
  row: RawMaterialPrepWeightmentDetail,
  sheetMaterials: MaterialItem[],
): MaterialItem | undefined => {
  const code = String(row.materialCode ?? "").trim().toUpperCase();
  if (!code) return undefined;

  const matches = sheetMaterials.filter(
    (material) => String(material.materialCode ?? "").trim().toUpperCase() === code,
  );
  if (matches.length === 0) return undefined;
  if (matches.length === 1) return matches[0];

  const name = String(row.materialName ?? "").trim().toUpperCase();
  if (name) {
    const byName = matches.filter(
      (material) => String(material.materialName ?? "").trim().toUpperCase() === name,
    );
    if (byName.length === 1) return byName[0];
  }

  const gradeHint = name.match(/\(([^)]+)\)$/)?.[1]?.trim().toUpperCase();
  if (gradeHint) {
    const byGrade = matches.filter((material) => {
      const grade = String(material.gradeCode ?? material.gradeName ?? "")
        .trim()
        .toUpperCase();
      return grade === gradeHint;
    });
    if (byGrade.length === 1) return byGrade[0];
  }

  return matches[0];
};

export const getWeightmentRowSheetKey = (
  row: RawMaterialPrepWeightmentDetail,
  sheetMaterials: MaterialItem[],
): string => {
  const material = findSheetMaterialForWeightmentRow(row, sheetMaterials);
  return material ? String(material.srNo) : "";
};

export const validateWeightmentRowAgainstSheet = (
  row: RawMaterialPrepWeightmentDetail,
  sheetMaterials: MaterialItem[],
  messages: {
    materialNotInSheet: string;
    nameMismatch?: (expected: string) => string;
    percentageMismatch: (expected: number) => string;
    weightMismatch: (expected: number) => string;
  },
): WeightmentRowFieldErrors => {
  const errors: WeightmentRowFieldErrors = {};
  const materialCode = String(row.materialCode ?? "").trim();

  if (!materialCode) {
    return errors;
  }

  // Avoid false "not listed" errors while identification materials are still loading.
  if (!sheetMaterials.length) {
    return errors;
  }

  const sheetMaterial = findSheetMaterialForWeightmentRow(row, sheetMaterials);
  if (!sheetMaterial) {
    errors.materialCode = messages.materialNotInSheet;
    return errors;
  }

  const sheetName = String(sheetMaterial.materialName ?? sheetMaterial.materialCode ?? "").trim();
  const enteredName = String(row.materialName ?? "").trim();
  if (
    messages.nameMismatch &&
    enteredName &&
    sheetName &&
    enteredName.toUpperCase() !== sheetName.toUpperCase()
  ) {
    errors.materialName = messages.nameMismatch(sheetName);
  }

  // Percentage column removed; multi-bin rows may each be less than sheet quantityPerPremix,
  // so do not flag per-row percentage/weight against the full sheet expected values.

  return errors;
};

export const weightmentRowsHaveSheetDeviations = (
  rows: RawMaterialPrepWeightmentDetail[],
  sheetMaterials: MaterialItem[],
  messages: {
    materialNotInSheet: string;
    percentageMismatch: (expected: number) => string;
    weightMismatch: (expected: number) => string;
  },
): boolean =>
  rows.some((row) => {
    const errors = validateWeightmentRowAgainstSheet(row, sheetMaterials, messages);
    return Object.keys(errors).length > 0;
  });

export const validateWeightmentSheetAgainstIdentification = (
  rows: RawMaterialPrepWeightmentDetail[],
  sheetMaterials: MaterialItem[],
  compareEnabled: boolean,
  messages: {
    materialNotInSheet: string;
    percentageMismatch: (expected: number) => string;
    weightMismatch: (expected: number) => string;
    deviationMessageRequired: string;
    incompleteRow: string;
  },
  validation: { deviationFound: boolean; deviationMessage: string },
): string | null => {
  if (!compareEnabled) return null;

  const filledRows = rows.filter(
    (row) =>
      String(row.materialCode ?? "").trim() ||
      String(row.percentage ?? "").trim() ||
      String(row.weightTransferred ?? "").trim(),
  );

  let hasAnyDeviation = false;

  for (const row of filledRows) {
    if (!String(row.materialCode ?? "").trim()) {
      return messages.incompleteRow;
    }

    const errors = validateWeightmentRowAgainstSheet(row, sheetMaterials, messages);
    if (Object.keys(errors).length > 0) {
      hasAnyDeviation = true;
    }
  }

  if (!hasAnyDeviation) return null;

  if (!validation.deviationFound || !String(validation.deviationMessage ?? "").trim()) {
    return messages.deviationMessageRequired;
  }

  return null;
};
