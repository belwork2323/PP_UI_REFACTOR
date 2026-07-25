import type { MaterialItem } from "../admin/BatchManagement/BatchManagementModel";
import type { RawMaterialPrepWeightmentDetail } from "./RawMaterialPreparationModel";

export type WeightmentRowFieldErrors = {
  materialCode?: string;
  percentage?: string;
  weightTransferred?: string;
};

const PERCENTAGE_TOLERANCE = 0.01;
const WEIGHT_TOLERANCE_KG = 0.001;

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

export const getExpectedWeightmentForSheetMaterial = (material: MaterialItem) => {
  const percentage = Number(material.requiredComposition ?? 0);
  const expectedWeightKg = Number(Number(material.quantityPerPremix ?? 0).toFixed(3));

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
    percentageMismatch: (expected: number) => string;
    weightMismatch: (expected: number) => string;
  },
): WeightmentRowFieldErrors => {
  const errors: WeightmentRowFieldErrors = {};
  const materialCode = String(row.materialCode ?? "").trim();

  if (!materialCode) {
    return errors;
  }

  const sheetMaterial = findSheetMaterialForWeightmentRow(row, sheetMaterials);
  if (!sheetMaterial) {
    errors.materialCode = messages.materialNotInSheet;
    return errors;
  }

  const { percentage, expectedWeightKg } = getExpectedWeightmentForSheetMaterial(sheetMaterial);

  if (String(row.percentage ?? "").trim()) {
    const enteredPercentage = Number(row.percentage);
    if (
      !Number.isFinite(enteredPercentage) ||
      !numbersApproximatelyEqual(enteredPercentage, percentage, PERCENTAGE_TOLERANCE)
    ) {
      errors.percentage = messages.percentageMismatch(percentage);
    }
  }

  if (String(row.weightTransferred ?? "").trim()) {
    const enteredWeight = Number(row.weightTransferred);
    if (
      !Number.isFinite(enteredWeight) ||
      !numbersApproximatelyEqual(enteredWeight, expectedWeightKg, WEIGHT_TOLERANCE_KG)
    ) {
      errors.weightTransferred = messages.weightMismatch(expectedWeightKg);
    }
  }

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
