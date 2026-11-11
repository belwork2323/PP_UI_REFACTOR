import { focusFieldByDataAttr } from "@/data/validation/utils/focusFieldByDataAttr";
import type {
  CasePrepAbradingDetailsRow,
  CasePrepIngredientRow,
  CasePrepMotorData,
  CasePrepObservationRow,
  CasePrepParameterRow,
  CasePrepQualificationParameterRow,
} from "./CasePrepMotorDataModel";
import { assertFromToOrder } from "@/data/validation/dateRangeValidation";

export type CasePrepSubmissionIntent = "DRAFT" | "SUBMIT";
export type CasePrepValidationErrors = Record<string, string>;

const ALPHA_NUM = /^[A-Za-z0-9][A-Za-z0-9 /-]*$/;
const ALPHA_NUM_LOOSE = /^[A-Za-z0-9][A-Za-z0-9 \-_/.,()]*$/i;

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

const isFiniteNumber = (value: unknown): boolean => {
  const text = str(value).replace(/,/g, "");
  if (!text) return false;
  return Number.isFinite(Number(text));
};

const parseNum = (value: unknown): number | null => {
  const text = str(value).replace(/,/g, "");
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
};

const isValidUiDate = (value: unknown): boolean => {
  const text = str(value);
  if (!text) return false;
  const dmy = text.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    const d = new Date(year, month - 1, day);
    return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const d = new Date(text.slice(0, 10));
    return !Number.isNaN(d.getTime());
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
    const m = Number(tm[2]);
    return h >= 0 && h <= 23 && m >= 0 && m <= 59;
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

const isAbradingHeader = (
  row: CasePrepAbradingDetailsRow,
): row is Extract<CasePrepAbradingDetailsRow, { type: "header" }> =>
  (row as { type?: string }).type === "header";

const meetsSpecification = (result: number, specification: string): boolean => {
  const spec = str(specification).replace(/\s+/g, "");
  if (!spec) return true;
  const match = spec.match(/^(>=|<=|>|<|=|==)?(-?\d+(?:\.\d+)?)$/);
  if (!match) return true;
  const op = match[1] || ">=";
  const bound = Number(match[2]);
  if (!Number.isFinite(bound)) return true;
  switch (op) {
    case ">=":
      return result >= bound;
    case "<=":
      return result <= bound;
    case ">":
      return result > bound;
    case "<":
      return result < bound;
    case "=":
    case "==":
      return result === bound;
    default:
      return result >= bound;
  }
};

type AddHelpers = {
  required: boolean;
  addText: (
    path: string,
    value: unknown,
    label: string,
    mandatory: boolean,
    alpha?: boolean,
  ) => void;
  addNumber: (path: string, value: unknown, label: string, mandatory: boolean) => void;
  addDate: (path: string, value: unknown, label: string, mandatory: boolean) => void;
  addDateTime: (path: string, value: unknown, label: string, mandatory: boolean) => void;
};

const createAddHelpers = (errors: CasePrepValidationErrors, required: boolean): AddHelpers => {
  const addText = (
    path: string,
    value: unknown,
    label: string,
    mandatory: boolean,
    alpha = false,
  ) => {
    const text = str(value);
    if (!text) {
      if (required && mandatory) errors[path] = "This field is required.";
      return;
    }
    if (alpha && !ALPHA_NUM.test(text) && !ALPHA_NUM_LOOSE.test(text)) {
      errors[path] = "Invalid value.";
    }
  };

  const addNumber = (path: string, value: unknown, label: string, mandatory: boolean) => {
    const text = str(value);
    if (!text) {
      if (required && mandatory) errors[path] = "This field is required.";
      return;
    }
    if (!isFiniteNumber(text)) errors[path] = "Invalid value.";
  };

  const addDate = (path: string, value: unknown, label: string, mandatory: boolean) => {
    const text = str(value);
    if (!text) {
      if (required && mandatory) errors[path] = "This field is required.";
      return;
    }
    if (!isValidUiDate(text)) errors[path] = "Invalid value.";
  };

  const addDateTime = (path: string, value: unknown, label: string, mandatory: boolean) => {
    const text = str(value);
    if (!text) {
      if (required && mandatory) errors[path] = "This field is required.";
      return;
    }
    if (!isValidUiDateTime(text)) errors[path] = "Invalid value.";
  };

  return { required, addText, addNumber, addDate, addDateTime };
};

const validateParameterRows = (
  rows: CasePrepParameterRow[],
  pathPrefix: string,
  helpers: AddHelpers,
  options?: { valueMandatory?: boolean; useFieldType?: boolean },
) => {
  const valueMandatory = options?.valueMandatory !== false;
  (rows ?? []).forEach((row, index) => {
    const label = str(row.parameter) || `Row ${index + 1}`;
    const type = String(row.valueFieldType ?? "text").toLowerCase();
    const path = `${pathPrefix}.${index}.value`;
    if (options?.useFieldType) {
      if (type === "number") helpers.addNumber(path, row.value, label, valueMandatory);
      else if (type === "date") helpers.addDate(path, row.value, label, valueMandatory);
      else if (type === "datetime" || type === "time")
        helpers.addDateTime(path, row.value, label, valueMandatory);
      else helpers.addText(path, row.value, label, valueMandatory);
    } else {
      helpers.addText(path, row.value, label, valueMandatory);
    }
  });
};

const validateObservationRows = (
  rows: CasePrepObservationRow[],
  pathPrefix: string,
  helpers: AddHelpers,
) => {
  (rows ?? []).forEach((row, index) => {
    const label = str(row.parameter) || `Observation ${index + 1}`;
    helpers.addText(
      `${pathPrefix}.${index}.observations`,
      row.observations,
      `${label} observation`,
      true,
      true,
    );
  });
};

const validateIngredientRows = (
  rows: CasePrepIngredientRow[],
  pathPrefix: string,
  helpers: AddHelpers,
  listLabel: string,
) => {
  (rows ?? []).forEach((row, index) => {
    const base = `${pathPrefix}.${index}`;
    helpers.addText(`${base}.materialName`, row.materialName, `${listLabel} material name`, false);
    helpers.addText(`${base}.ingredient`, row.ingredient, `${listLabel} ingredient`, false);
    helpers.addText(`${base}.mfgLot`, row.mfgLot, `${listLabel} mfg lot`, false, true);
    helpers.addNumber(
      `${base}.partsByWeight`,
      row.partsByWeight,
      `${listLabel} parts by weight`,
      false,
    );
    helpers.addNumber(
      `${base}.quantityTaken`,
      row.quantityTaken,
      `${listLabel} quantity taken`,
      false,
    );
    helpers.addNumber(
      `${base}.totalQuantity`,
      row.totalQuantity,
      `${listLabel} total quantity`,
      false,
    );
  });
};

const validateQualificationRows = (
  rows: CasePrepQualificationParameterRow[],
  pathPrefix: string,
  helpers: AddHelpers,
  errors: CasePrepValidationErrors,
) => {
  (rows ?? []).forEach((row, index) => {
    const base = `${pathPrefix}.${index}`;
    const label = str(row.parameter) || `Parameter ${index + 1}`;
    helpers.addText(`${base}.parameter`, row.parameter, "Qualification parameter", true);
    helpers.addText(`${base}.specification`, row.specification, `${label} specification`, true);
    helpers.addNumber(`${base}.result`, row.result, `${label} result`, true);

    if (helpers.required && isFiniteNumber(row.result) && str(row.specification)) {
      const n = parseNum(row.result);
      if (n != null && !meetsSpecification(n, row.specification)) {
        errors[`${base}.result`] = `Result must satisfy specification (${row.specification}).`;
      }
    }
  });
};

const validateAbradingDetails = (rows: CasePrepAbradingDetailsRow[], helpers: AddHelpers) => {
  (rows ?? []).forEach((row, index) => {
    if (isAbradingHeader(row)) return;
    const operation = str(row.operation);
    const path = `abradingOperation.abradingDetails.${index}.value`;
    const type = String(row.valueFieldType ?? "text").toLowerCase();
    const isTotal = /total dust/i.test(operation);
    const mandatory = !isTotal;

    if (type === "number") helpers.addNumber(path, row.value, operation || "Value", mandatory);
    else if (type === "datetime" || type === "date" || type === "time")
      helpers.addDateTime(path, row.value, operation || "Value", mandatory);
    else helpers.addText(path, row.value, operation || "Value", mandatory);
  });
};

const validateDateTimePair = (
  from: unknown,
  to: unknown,
  fromPath: string,
  toPath: string,
  errors: CasePrepValidationErrors,
) => {
  assertFromToOrder({
    from,
    to,
    fromPath,
    toPath,
    errors,
    mode: "datetime",
  });
};

const validateAbradingDateTimeOrder = (
  rows: CasePrepAbradingDetailsRow[],
  errors: CasePrepValidationErrors,
) => {
  let start: { value: string; index: number } | null = null;
  let end: { value: string; index: number } | null = null;

  const validateCut = () => {
    if (!start || !end) return;
    validateDateTimePair(
      start.value,
      end.value,
      `abradingOperation.abradingDetails.${start.index}.value`,
      `abradingOperation.abradingDetails.${end.index}.value`,
      errors,
    );
  };

  (rows ?? []).forEach((row, index) => {
    if (isAbradingHeader(row)) {
      validateCut();
      start = null;
      end = null;
      return;
    }

    const operation = str(row.operation).toLowerCase();
    if (operation === "start date & time") start = { value: row.value, index };
    if (operation === "end date & time") end = { value: row.value, index };
  });

  validateCut();
};

const validateParameterDateTimeOrder = (
  rows: CasePrepParameterRow[],
  fromParameter: string,
  toParameter: string,
  pathPrefix: string,
  errors: CasePrepValidationErrors,
) => {
  let from: { value: string; index: number } | null = null;
  let to: { value: string; index: number } | null = null;
  (rows ?? []).forEach((row, index) => {
    const parameter = str(row.parameter).toLowerCase();
    if (parameter === fromParameter.toLowerCase()) from = { value: row.value, index };
    if (parameter === toParameter.toLowerCase()) to = { value: row.value, index };
  });
  if (!from || !to) return;
  validateDateTimePair(
    from.value,
    to.value,
    `${pathPrefix}.${from.index}.value`,
    `${pathPrefix}.${to.index}.value`,
    errors,
  );
};

const validateCrossSectionDateTimeOrder = (
  fromRows: CasePrepParameterRow[],
  fromParameter: string,
  fromPathPrefix: string,
  toRows: CasePrepParameterRow[],
  toParameter: string,
  toPathPrefix: string,
  errors: CasePrepValidationErrors,
) => {
  const fromIndex = (fromRows ?? []).findIndex(
    (row) => str(row.parameter).toLowerCase() === fromParameter.toLowerCase(),
  );
  const toIndex = (toRows ?? []).findIndex(
    (row) => str(row.parameter).toLowerCase() === toParameter.toLowerCase(),
  );
  if (fromIndex < 0 || toIndex < 0) return;
  validateDateTimePair(
    fromRows[fromIndex].value,
    toRows[toIndex].value,
    `${fromPathPrefix}.${fromIndex}.value`,
    `${toPathPrefix}.${toIndex}.value`,
    errors,
  );
};

/** Validate one motor's typed Case Prep data. */
export function validateCasePrepMotorData(
  data: CasePrepMotorData,
  intent: CasePrepSubmissionIntent,
): CasePrepValidationErrors {
  const errors: CasePrepValidationErrors = {};
  const required = intent === "SUBMIT";
  const h = createAddHelpers(errors, required);

  const abrading = data.abradingOperation ?? ({} as CasePrepMotorData["abradingOperation"]);
  const bellow = data.bellowBonding ?? ({} as CasePrepMotorData["bellowBonding"]);
  const tce = data.tceCleaning ?? ({} as CasePrepMotorData["tceCleaning"]);
  const preHeating = data.preHeating ?? ({} as CasePrepMotorData["preHeating"]);
  const liner = data.linerCoatingOperation ?? ({} as CasePrepMotorData["linerCoatingOperation"]);
  const dispatch = data.dispatchToCasting ?? ({} as CasePrepMotorData["dispatchToCasting"]);

  h.addText("abradingOperation.typeOfCasing", abrading.typeOfCasing, "Type of Casing", true);
  h.addText(
    "abradingOperation.typeOfInsulation",
    abrading.typeOfInsulation,
    "Type of Insulation",
    true,
  );
  h.addText(
    "abradingOperation.abradingWheelType",
    abrading.abradingWheelType,
    "Abrading Wheel Type",
    true,
    true,
  );
  validateAbradingDetails(abrading.abradingDetails ?? [], h);
  validateAbradingDateTimeOrder(abrading.abradingDetails ?? [], errors);

  h.addText("bellowBonding.adhesiveDetails", bellow.adhesiveDetails, "Adhesive Details", false);
  h.addText(
    "bellowBonding.heBellowDimension",
    bellow.heBellowDimension,
    "HE Bellow Dimension",
    true,
  );
  h.addDateTime(
    "bellowBonding.heMotorPastingDateTime",
    bellow.heMotorPastingDateTime,
    "HE Motor Pasting Date & Time",
    true,
  );
  h.addText(
    "bellowBonding.neBellowDimension",
    bellow.neBellowDimension,
    "NE Bellow Dimension",
    true,
  );
  h.addDateTime(
    "bellowBonding.neMotorPastingDateTime",
    bellow.neMotorPastingDateTime,
    "NE Motor Pasting Date & Time",
    true,
  );
  h.addNumber("bellowBonding.numberOfSpacers", bellow.numberOfSpacers, "Number of Spacers", true);
  h.addText("bellowBonding.pastingDetails", bellow.pastingDetails, "Pasting Details", false);
  h.addText("bellowBonding.remarks", bellow.remarks, "Remarks", false);

  h.addDateTime(
    "tceCleaning.tceCleaningDateTime",
    tce.tceCleaningDateTime,
    "TCE Cleaning Date & Time",
    true,
  );
  h.addNumber("tceCleaning.solventUsedQtyKg", tce.solventUsedQtyKg, "Solvent Used Qty (kg)", true);
  h.addText("tceCleaning.observation", tce.observation, "Observation", true, true);

  h.addText(
    "preHeating.vacuumBaggingApplied",
    preHeating.vacuumBaggingApplied,
    "Vacuum Bagging Applied",
    true,
  );
  if (str(preHeating.vacuumBaggingApplied).toUpperCase() === "YES") {
    h.addNumber("preHeating.vacuumApplied", preHeating.vacuumApplied, "Vacuum Applied", true);
  }

  h.addText("preHeating.preHeatingRecipe", preHeating.preHeatingRecipe, "Pre-heating Recipe", true);
  if (str(preHeating.preHeatingRecipe).toUpperCase() === "OTHERS") {
    h.addText(
      "preHeating.otherTemperature",
      preHeating.otherTemperature,
      "Other Temperature",
      true,
    );
    h.addNumber("preHeating.otherDuration", preHeating.otherDuration, "Other Duration (hrs)", true);
  }
  h.addDateTime(
    "preHeating.preHeatingDateTime",
    preHeating.preHeatingDateTime,
    "Pre-heating Date & Time",
    false,
  );
  validateParameterRows(preHeating.temperatureDuration ?? [], "preHeating.temperatureDuration", h, {
    valueMandatory: true,
    useFieldType: true,
  });
  validateParameterRows(
    preHeating.preHeatingMonitoring ?? [],
    "preHeating.preHeatingMonitoring",
    h,
    { valueMandatory: true, useFieldType: true },
  );
  validateParameterDateTimeOrder(
    preHeating.preHeatingMonitoring ?? [],
    "Cycle Start Date & Time",
    "Cycle End Date & Time",
    "preHeating.preHeatingMonitoring",
    errors,
  );

  h.addText("linerCoatingOperation.linerType", liner.linerType, "Liner Type", true);
  if (str(liner.linerType).toUpperCase() === "OTHERS") {
    h.addText(
      "linerCoatingOperation.otherLinerType",
      liner.otherLinerType,
      "Other Liner Type",
      true,
      true,
    );
  }
  h.addText("linerCoatingOperation.batchNo", liner.batchNo, "Batch No", true, true);
  h.addNumber("linerCoatingOperation.batchSize", liner.batchSize, "Batch Size", false);
  h.addText(
    "linerCoatingOperation.qualifyingSubscaleBatchNo",
    liner.qualifyingSubscaleBatchNo,
    "Qualifying Subscale Batch No",
    true,
    true,
  );
  h.addDateTime(
    "linerCoatingOperation.linerCoatingDateTime",
    liner.linerCoatingDateTime,
    "Liner Coating Date & Time",
    false,
  );

  validateIngredientRows(
    liner.premixIngredients ?? [],
    "linerCoatingOperation.premixIngredients",
    h,
    "Premix",
  );
  validateIngredientRows(
    liner.finalMixIngredients ?? [],
    "linerCoatingOperation.finalMixIngredients",
    h,
    "Final mix",
  );
  validateQualificationRows(
    liner.qualificationParameters ?? [],
    "linerCoatingOperation.qualificationParameters",
    h,
    errors,
  );
  validateParameterRows(
    liner.linerApplicationLog ?? [],
    "linerCoatingOperation.linerApplicationLog",
    h,
    { valueMandatory: true, useFieldType: true },
  );
  validateCrossSectionDateTimeOrder(
    preHeating.preHeatingMonitoring ?? [],
    "Oven Start Date & Time",
    "preHeating.preHeatingMonitoring",
    liner.linerApplicationLog ?? [],
    "Oven Out Date & Time",
    "linerCoatingOperation.linerApplicationLog",
    errors,
  );
  validateParameterDateTimeOrder(
    liner.linerApplicationLog ?? [],
    "Start Date & Time",
    "End Date & Time",
    "linerCoatingOperation.linerApplicationLog",
    errors,
  );
  validateParameterDateTimeOrder(
    liner.linerApplicationLog ?? [],
    "Rotation Start Date & Time",
    "Rotation End Date & Time",
    "linerCoatingOperation.linerApplicationLog",
    errors,
  );

  validateObservationRows(
    dispatch.dispatchVisualObservations ?? [],
    "dispatchToCasting.dispatchVisualObservations",
    h,
  );
  validateParameterRows(
    dispatch.dispatchToCastingDetails ?? [],
    "dispatchToCasting.dispatchToCastingDetails",
    h,
    { valueMandatory: true, useFieldType: true },
  );

  return errors;
}

export function firstCasePrepValidationError(errors: CasePrepValidationErrors): string | null {
  const focusPath = resolveFirstCasePrepValidationFocus(errors);
  if (!focusPath) return null;
  return errors[focusPath] ?? Object.values(errors)[0] ?? null;
}

/** Preferred section order for scroll/focus after failed SUBMIT. */
const CASE_PREP_FOCUS_PREFIX_ORDER = [
  "prrcClearanceDate",
  "abradingOperation.",
  "bellowBonding.",
  "tceCleaning.",
  "preHeating.",
  "linerCoatingOperation.",
  "dispatchToCasting.",
  "data",
] as const;

/** First error field path for Case Prep focus/scroll (stable section order). */
export function resolveFirstCasePrepValidationFocus(
  errors: CasePrepValidationErrors | null | undefined,
): string | null {
  if (!errors) return null;
  const keys = Object.keys(errors);
  if (!keys.length) return null;

  for (const prefix of CASE_PREP_FOCUS_PREFIX_ORDER) {
    const match = keys
      .filter((key) => key === prefix || key.startsWith(prefix))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];
    if (match) return match;
  }

  return keys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0] ?? null;
}

/** Scroll + focus the control tagged with `data-cp-field`. */
export function focusCasePrepField(fieldPath: string, root: ParentNode = document): boolean {
  return focusFieldByDataAttr("cp-field", fieldPath, root);
}

export function validateCasePrepMotorSession(
  session: { prrcClearanceDate?: string; data?: CasePrepMotorData | null },
  intent: CasePrepSubmissionIntent,
): CasePrepValidationErrors {
  const errors: CasePrepValidationErrors = {};
  const required = intent === "SUBMIT";
  const date = str(session.prrcClearanceDate);

  if (!date) {
    if (required) errors.prrcClearanceDate = "This field is required.";
  } else if (!isValidUiDate(date)) {
    errors.prrcClearanceDate = "Invalid value.";
  }

  if (session.data) {
    Object.assign(errors, validateCasePrepMotorData(session.data, intent));
  } else if (required) {
    errors["data"] = "This field is required.";
  }

  return errors;
}

export function casePrepFieldError(
  errors: CasePrepValidationErrors | null | undefined,
  path: string,
): string | undefined {
  if (!errors) return undefined;
  return errors[path];
}

export function casePrepSectionHasError(
  errors: CasePrepValidationErrors | null | undefined,
  pathPrefix: string,
): boolean {
  if (!errors) return false;
  const prefix = pathPrefix.endsWith(".") ? pathPrefix : `${pathPrefix}.`;
  return Object.keys(errors).some((k) => k === pathPrefix || k.startsWith(prefix));
}
