import {
  getSchemaFieldRule,
  isFieldRequiredOnSubmit,
  type SchemaValidationMaterialContext,
} from "@/data/validation/configs/rawMaterialPreparation.validation.config";
import {
  lotDetailsHaveUserData,
  processFormHasUserData,
  sumLotDetailQuantities,
  type DefaultSolidProcessForm,
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

const isValidUiDate = (value: unknown): boolean => {
  const text = str(value);
  if (!text) return false;
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(text)) {
    const [d, m, y] = text.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return !Number.isNaN(Date.parse(text.slice(0, 10)));
  }
  return false;
};

const isValidUiDateTime = (value: unknown): boolean => {
  const text = str(value);
  if (!text) return false;
  if (/^\d{1,2}-\d{1,2}-\d{4}[ T]\d{1,2}:\d{2}/.test(text)) {
    const [datePart, timePart] = text.split(/[T ]/);
    if (!isValidUiDate(datePart)) return false;
    const tm = timePart.match(/^(\d{1,2}):(\d{2})/);
    if (!tm) return false;
    const h = Number(tm[1]);
    const mi = Number(tm[2]);
    return h >= 0 && h <= 23 && mi >= 0 && mi <= 59;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text)) {
    return !Number.isNaN(Date.parse(text));
  }
  if (/^\d{1,2}:\d{2}$/.test(text)) {
    const [h, m] = text.split(":").map(Number);
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
  }
  return isValidUiDate(text);
};

type DefaultSolidFieldSpec = {
  fieldId: string;
  path: string;
  fieldType: "text" | "number" | "datetime";
  label: string;
};

const DEFAULT_SOLID_FIELD_SPECS: DefaultSolidFieldSpec[] = [
  { fieldId: "OVEN_TYPE", path: "drying.ovenType", fieldType: "text", label: "Oven type" },
  { fieldId: "OVEN_NUMBER", path: "drying.ovenNumber", fieldType: "text", label: "Oven number" },
  {
    fieldId: "OVEN_SET_TEMPERATURE",
    path: "drying.ovenSetTemperature",
    fieldType: "number",
    label: "Set temperature",
  },
  {
    fieldId: "START_DATETIME",
    path: "drying.startDatetime",
    fieldType: "datetime",
    label: "Start date/time",
  },
  {
    fieldId: "END_DATETIME",
    path: "drying.endDatetime",
    fieldType: "datetime",
    label: "End date/time",
  },
  { fieldId: "MOISTURE", path: "drying.moisture", fieldType: "number", label: "Moisture" },
  {
    fieldId: "SIEVING_DISPATCH_DATETIME",
    path: "sieving.sievingDispatchDatetime",
    fieldType: "datetime",
    label: "Sieving / dispatch date/time",
  },
  {
    fieldId: "SIEVED_QUANTITY",
    path: "sieving.sievedQuantity",
    fieldType: "number",
    label: "Sieved quantity",
  },
  {
    fieldId: "SIEVE_MESH_SIZE",
    path: "sieving.sieveMeshSize",
    fieldType: "text",
    label: "Sieve mesh size",
  },
];

const readDefaultSolidPath = (form: DefaultSolidProcessForm, path: string): unknown => {
  const [section, field] = path.split(".");
  if (section === "drying" && field in form.drying) {
    return form.drying[field as keyof DefaultSolidProcessForm["drying"]];
  }
  if (section === "sieving" && field in form.sieving) {
    return form.sieving[field as keyof DefaultSolidProcessForm["sieving"]];
  }
  return "";
};

const validateDefaultSolidField = (
  spec: DefaultSolidFieldSpec,
  raw: unknown,
  intent: MaterialProcessValidationIntent,
  errors: Record<string, string>,
  materialContext?: SchemaValidationMaterialContext,
) => {
  const text = str(raw);
  const rule = getSchemaFieldRule(spec.fieldId);
  const required =
    intent === "SUBMIT" &&
    isFieldRequiredOnSubmit(spec.fieldId, spec.fieldType, materialContext, {
      validation: { required: spec.fieldId === "OBSERVATION" ? false : undefined },
      label: spec.label,
    });

  if (!text) {
    if (required) {
      errors[spec.path] = rule?.requiredMessage ?? `${spec.label} is required.`;
    }
    return;
  }

  if (spec.fieldType === "number") {
    if (!isFiniteNumber(text)) {
      errors[spec.path] = rule?.invalidMessage ?? `${spec.label} must be numeric.`;
    }
    return;
  }

  if (spec.fieldType === "datetime") {
    if (!isValidUiDateTime(text)) {
      errors[spec.path] = rule?.invalidMessage ?? `${spec.label} must be a valid date/time.`;
    }
    return;
  }

  if (rule?.pattern && !rule.pattern.test(text)) {
    errors[spec.path] = rule.invalidMessage ?? `${spec.label} is invalid.`;
  }
};

const validateLotDetails = (
  rows: LotDetailFormRow[] | undefined,
  intent: MaterialProcessValidationIntent,
  quantityPerPremix: number | undefined,
  errors: Record<string, string>,
) => {
  const list = rows ?? [];
  const requireLots = intent === "SUBMIT" || lotDetailsHaveUserData(list);
  if (!requireLots) return;

  const seen = new Set<string>();
  list.forEach((row, index) => {
    const lotId = str(row.lotId);
    const qty = str(row.quantity).replace(/,/g, "");
    const prefix = `lotDetails.${index}`;

    if (!lotId) {
      if (intent === "SUBMIT" || qty) {
        errors[`${prefix}.lotId`] = "Lot is required.";
      }
    } else if (seen.has(lotId)) {
      errors[`${prefix}.lotId`] = "Duplicate lot selected.";
    } else {
      seen.add(lotId);
    }

    if (!qty) {
      if (intent === "SUBMIT" || lotId) {
        errors[`${prefix}.quantity`] = "Quantity is required.";
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

export const validateMaterialProcessForm = (
  uiKey: RmpMaterialUiKey,
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
    processForm.uiKey === "doa"
  ) {
    validateLotDetails(
      processForm.lotDetails,
      validationIntent,
      materialContext?.quantityPerPremix,
      errors,
    );
  }

  if (uiKey === "apCoarse" && processForm.uiKey === "apCoarse") {
    if (validationIntent === "SUBMIT") {
      processForm.blendingDryingParameters.forEach((row, index) => {
        if (!str(row.actualParameter)) {
          errors[`blendingDryingParameters.${index}.actualParameter`] =
            "Actual parameter is required.";
        }
      });
      processForm.dryingOperationRvd.forEach((row, index) => {
        if (!str(row.actualParameter)) {
          errors[`dryingOperationRvd.${index}.actualParameter`] = "Actual parameter is required.";
        }
        if (!str(row.startTime)) {
          errors[`dryingOperationRvd.${index}.startTime`] = "Start time is required.";
        }
        if (!str(row.endTime)) {
          errors[`dryingOperationRvd.${index}.endTime`] = "End time is required.";
        }
      });
      processForm.particleSizeDistribution.forEach((row, index) => {
        if (!str(row.result)) {
          errors[`particleSizeDistribution.${index}.result`] = "Result is required.";
        }
      });
    }
    return errors;
  }

  if (uiKey === "apFine" && processForm.uiKey === "apFine") {
    if (validationIntent === "SUBMIT") {
      if (!str(processForm.acmEquipmentId)) {
        errors.acmEquipmentId = "ACM Equipment Id is required.";
      }
      (["millRpm", "classifierRpm", "screwFeederRpm", "idFanRpm"] as const).forEach((key) => {
        if (!str(processForm[key])) {
          errors[key] = "Required.";
        }
      });
      if (!str(processForm.setPressure)) {
        errors.setPressure = "Set Pressure is required.";
      }
      if (!str(processForm.grindingStartDatetime)) {
        errors.grindingStartDatetime = "Start Date/Time is required.";
      }
      if (!str(processForm.grindingEndDatetime)) {
        errors.grindingEndDatetime = "End Date/Time is required.";
      }
      processForm.particleSizeDistribution.forEach((row, index) => {
        if (!str(row.result)) {
          errors[`particleSizeDistribution.${index}.result`] = "Result is required.";
        }
      });
      if (!str(processForm.qtyKgQualified)) {
        errors.qtyKgQualified = "Qty. (kg) qualified is required.";
      }
      processForm.blendingDryingParameters.forEach((row, index) => {
        if (!str(row.actualParameter)) {
          errors[`blendingDryingParameters.${index}.actualParameter`] =
            "Actual parameter is required.";
        }
      });
      processForm.dryingOperationRvd.forEach((row, index) => {
        if (!str(row.actualParameter)) {
          errors[`dryingOperationRvd.${index}.actualParameter`] = "Actual parameter is required.";
        }
        if (!str(row.startTime)) {
          errors[`dryingOperationRvd.${index}.startTime`] = "Start time is required.";
        }
        if (!str(row.endTime)) {
          errors[`dryingOperationRvd.${index}.endTime`] = "End time is required.";
        }
      });
    }
    return errors;
  }

  if (uiKey === "apUltraFine" && processForm.uiKey === "apUltraFine") {
    if (validationIntent === "SUBMIT") {
      if (!str(processForm.equipmentId)) {
        errors.equipmentId = "Equipment Id is required.";
      }
      if (!str(processForm.screwFeederRpm)) {
        errors.screwFeederRpm = "Screw Feeder RPM is required.";
      }
      if (!str(processForm.feedPressure)) {
        errors.feedPressure = "Feed Pressure is required.";
      }
      if (!str(processForm.grindingPressure)) {
        errors.grindingPressure = "Grinding Pressure is required.";
      }
      if (!str(processForm.grindingStartDatetime)) {
        errors.grindingStartDatetime = "Start Date/Time is required.";
      }
      if (!str(processForm.grindingEndDatetime)) {
        errors.grindingEndDatetime = "End Date/Time is required.";
      }
      if (!str(processForm.particleSizeResult)) {
        errors.particleSizeResult = "Particle Size is required.";
      }
      if (!str(processForm.qtyKgQualified)) {
        errors.qtyKgQualified = "Qty. (kg) qualified is required.";
      }
    }
    return errors;
  }

  if (uiKey === "aluminum" && processForm.uiKey === "aluminum") {
    if (validationIntent === "SUBMIT") {
      if (!str(processForm.equipmentId)) {
        errors.equipmentId = "Equipment Id is required.";
      }
      if (!str(processForm.setRpm)) {
        errors.setRpm = "Set RPM is required.";
      }
      if (!str(processForm.startDatetime)) {
        errors.startDatetime = "Start Date/Time is required.";
      }
      if (!str(processForm.endDatetime)) {
        errors.endDatetime = "End Date/Time is required.";
      }
      if (!str(processForm.qtyKgQualified)) {
        errors.qtyKgQualified = "Qty. (kg) qualified is required.";
      }
      if (!str(processForm.dispatchDatetime)) {
        errors.dispatchDatetime = "Date/Time of dispatch is required.";
      }
    }
    return errors;
  }

  if (uiKey === "doa" && processForm.uiKey === "doa") {
    if (validationIntent === "SUBMIT") {
      if (!str(processForm.dispatchDatetime)) {
        errors.dispatchDatetime = "Date/Time of dispatch is required.";
      }
      if (!str(processForm.totalQtySentForPremix)) {
        errors.totalQtySentForPremix = "Total Quantity sent for premix is required.";
      }
    }
    return errors;
  }

  if (uiKey !== "defaultSolid" || processForm.uiKey !== "defaultSolid") {
    return errors;
  }

  if (!processFormHasUserData(processForm) && validationIntent === "DRAFT") {
    return errors;
  }

  DEFAULT_SOLID_FIELD_SPECS.forEach((spec) => {
    const raw = readDefaultSolidPath(processForm, spec.path);
    if (validationIntent === "DRAFT" && !str(raw)) return;
    validateDefaultSolidField(spec, raw, validationIntent, errors, materialContext);
  });

  return errors;
};
