import type { SchemaValidationMaterialContext } from "@/data/validation/configs/rawMaterialPreparation.validation.config";
import {
  lotDetailsHaveUserData,
  sumLotDetailQuantities,
  type LotDetailFormRow,
  type RmpMaterialProcessForm,
} from "./defaultSolidProcessForm";
import type { RmpMaterialUiKey } from "./rmpMaterialUiRegistry";

export type MaterialProcessValidationIntent = "DRAFT" | "SUBMIT";

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

const isFiniteNumber = (value: unknown): boolean => {
  const text = str(value).replace(/,/g, "");
  return Boolean(text) && Number.isFinite(Number(text));
};

const validateLotDetails = (
  rows: LotDetailFormRow[] | undefined,
  intent: MaterialProcessValidationIntent,
  quantityPerPremix: number | undefined,
  errors: Record<string, string>,
  options?: { requireAtLeastOne?: boolean },
) => {
  const list = rows ?? [];
  const requireAtLeastOne = Boolean(options?.requireAtLeastOne) && intent === "SUBMIT";
  const requireLots = intent === "SUBMIT" || lotDetailsHaveUserData(list);
  if (!requireLots && !requireAtLeastOne) return;

  if (requireAtLeastOne) {
    const hasComplete = list.some((row) => {
      const lotId = str(row.lotId);
      const qty = str(row.quantity).replace(/,/g, "");
      return Boolean(lotId) && isFiniteNumber(qty) && Number(qty) > 0;
    });
    if (!hasComplete) {
      errors["lotDetails.0.lotId"] = errors["lotDetails.0.lotId"] ?? "This Field is required";
      errors["lotDetails.0.quantity"] =
        errors["lotDetails.0.quantity"] ?? "This Field is required";
    }
  }

  const seen = new Set<string>();
  list.forEach((row, index) => {
    const lotId = str(row.lotId);
    const qty = str(row.quantity).replace(/,/g, "");
    const prefix = `lotDetails.${index}`;

    if (!lotId) {
      if (intent === "SUBMIT" || qty) {
        errors[`${prefix}.lotId`] = errors[`${prefix}.lotId`] ?? "This Field is required";
      }
    } else if (seen.has(lotId)) {
      errors[`${prefix}.lotId`] = "Duplicate lot selected.";
    } else {
      seen.add(lotId);
    }

    if (!qty) {
      if (intent === "SUBMIT" || lotId) {
        errors[`${prefix}.quantity`] = errors[`${prefix}.quantity`] ?? "This Field is required";
      }
    } else if (!isFiniteNumber(qty) || Number(qty) <= 0) {
      errors[`${prefix}.quantity`] = "Quantity must be a positive number.";
    }
  });

  const limit = Number(quantityPerPremix);
  if (Number.isFinite(limit) && limit > 0) {
    const sum = sumLotDetailQuantities(list);
    if (sum > limit + 1e-9) {
      errors["lotDetails.sum"] =
        `Total lot quantity (${sum}) exceeds quantity per premix (${limit}).`;
    }
  }
};

/** Lots-only helper (SUBMIT requires ≥1 complete lot row). */
export const validateLotDetailsForPremix = (
  rows: LotDetailFormRow[] | undefined,
  intent: MaterialProcessValidationIntent,
  quantityPerPremix?: number,
): Record<string, string> => {
  const errors: Record<string, string> = {};
  validateLotDetails(rows, intent, quantityPerPremix, errors, {
    requireAtLeastOne: intent === "SUBMIT",
  });
  return errors;
};

/**
 * RMP material process validation:
 * - DRAFT: no required gates
 * - SUBMIT: lot details only (drying / sieving / process tables are never required)
 */
export const validateMaterialProcessForm = (
  _uiKey: RmpMaterialUiKey,
  processForm: RmpMaterialProcessForm,
  intent: MaterialProcessValidationIntent,
  materialContext?: SchemaValidationMaterialContext & {
    quantityPerPremix?: number;
  },
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const validationIntent = intent === "SUBMIT" ? "SUBMIT" : "DRAFT";

  if (
    processForm.uiKey === "defaultLiquid" ||
    processForm.uiKey === "defaultSolid" ||
    processForm.uiKey === "apCoarse" ||
    processForm.uiKey === "apFine" ||
    processForm.uiKey === "apUltraFine" ||
    processForm.uiKey === "aluminum" ||
    processForm.uiKey === "doa" ||
    processForm.uiKey === "htpb" ||
    processForm.uiKey === "tdi" ||
    processForm.uiKey === "cc" ||
    processForm.uiKey === "io" ||
    processForm.uiKey === "nonoxD"
  ) {
    validateLotDetails(
      processForm.lotDetails,
      validationIntent,
      materialContext?.quantityPerPremix,
      errors,
      { requireAtLeastOne: validationIntent === "SUBMIT" },
    );
  }

  return errors;
};
