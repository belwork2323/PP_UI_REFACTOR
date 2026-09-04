import { STRINGS } from "@/app/config/strings";
import { ALPHA_NUM } from "../fieldValidators";

const M = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.VALIDATION;

export type MaterialScopeMode = "fieldList" | "allExceptOptional";

export type MaterialMandatoryScope = {
  mode: MaterialScopeMode;
  fields?: string[];
};

export type SchemaFieldRule = {
  valueType: "text" | "number" | "datetime";
  pattern?: RegExp;
  requiredMessage?: string;
  invalidMessage?: string;
};

/** Shared rules keyed by schema field/column id — same rule everywhere the id appears. */
export const rawMaterialPrepSchemaFieldRules: Record<string, SchemaFieldRule> = {
  LOT_NUMBER: {
    valueType: "text",
    pattern: ALPHA_NUM,
    requiredMessage: M.lotNumber.required,
    invalidMessage: M.lotNumber.invalid,
  },
  MFG_BATCH_LOT_NUMBER: {
    valueType: "text",
    pattern: ALPHA_NUM,
    requiredMessage: M.mfgBatchLotNumber.required,
    invalidMessage: M.mfgBatchLotNumber.invalid,
  },
  QUANTITY: {
    valueType: "number",
    requiredMessage: M.quantity.required,
    invalidMessage: M.quantity.invalid,
  },
  TOTAL_QUANTITY: {
    valueType: "number",
    requiredMessage: M.totalQuantity.required,
    invalidMessage: M.totalQuantity.invalid,
  },
  ACTUAL_PARAMETER: {
    valueType: "number",
    requiredMessage: M.actualParameter.required,
    invalidMessage: M.actualParameter.invalid,
  },
  START_TIME: {
    valueType: "datetime",
    requiredMessage: M.startTime.required,
    invalidMessage: M.startTime.invalid,
  },
  END_TIME: {
    valueType: "datetime",
    requiredMessage: M.endTime.required,
    invalidMessage: M.endTime.invalid,
  },
  START_DATETIME: {
    valueType: "datetime",
    requiredMessage: M.startDatetime.required,
    invalidMessage: M.startDatetime.invalid,
  },
  END_DATETIME: {
    valueType: "datetime",
    requiredMessage: M.endDatetime.required,
    invalidMessage: M.endDatetime.invalid,
  },
  BIN_NUMBER: {
    valueType: "text",
    pattern: ALPHA_NUM,
    requiredMessage: M.binNumber.required,
    invalidMessage: M.binNumber.invalid,
  },
  FILLED_QUANTITY: {
    valueType: "number",
    requiredMessage: M.filledQuantity.required,
    invalidMessage: M.filledQuantity.invalid,
  },
  RESULT: {
    valueType: "number",
    requiredMessage: M.result.required,
    invalidMessage: M.result.invalid,
  },
  EQUIPMENT_ID: {
    valueType: "text",
    pattern: ALPHA_NUM,
    requiredMessage: M.equipmentId.required,
    invalidMessage: M.equipmentId.invalid,
  },
  VALUE: {
    valueType: "number",
    requiredMessage: M.rpm.required,
    invalidMessage: M.rpm.invalid,
  },
  SET_PRESSURE: {
    valueType: "number",
    requiredMessage: M.setPressure.required,
    invalidMessage: M.setPressure.invalid,
  },
  SET_RPM: {
    valueType: "number",
    requiredMessage: M.rpm.required,
    invalidMessage: M.rpm.invalid,
  },
  SCREW_FEEDER_RPM: {
    valueType: "number",
    requiredMessage: M.rpm.required,
    invalidMessage: M.rpm.invalid,
  },
  FEED_PRESSURE: {
    valueType: "number",
    requiredMessage: M.setPressure.required,
    invalidMessage: M.setPressure.invalid,
  },
  GRINDING_PRESSURE: {
    valueType: "number",
    requiredMessage: M.setPressure.required,
    invalidMessage: M.setPressure.invalid,
  },
  OVEN_TYPE: {
    valueType: "text",
    requiredMessage: M.ovenType.required,
    invalidMessage: M.ovenType.invalid,
  },
  OVEN_NUMBER: {
    valueType: "text",
    pattern: ALPHA_NUM,
    requiredMessage: M.ovenNumber.required,
    invalidMessage: M.ovenNumber.invalid,
  },
  OVEN_SET_TEMPERATURE: {
    valueType: "number",
    requiredMessage: M.ovenSetTemperature.required,
    invalidMessage: M.ovenSetTemperature.invalid,
  },
  MOISTURE: {
    valueType: "number",
    requiredMessage: M.moisture.required,
    invalidMessage: M.moisture.invalid,
  },
  SIEVING_DISPATCH_DATETIME: {
    valueType: "datetime",
    requiredMessage: M.sievingDatetime.required,
    invalidMessage: M.sievingDatetime.invalid,
  },
  SIEVING_DATETIME: {
    valueType: "datetime",
    requiredMessage: M.sievingDatetime.required,
    invalidMessage: M.sievingDatetime.invalid,
  },
  SIEVED_QUANTITY: {
    valueType: "number",
    requiredMessage: M.sievedQuantity.required,
    invalidMessage: M.sievedQuantity.invalid,
  },
  OVERSIZE_QUANTITY: {
    valueType: "number",
    requiredMessage: M.oversizeQuantity.required,
    invalidMessage: M.oversizeQuantity.invalid,
  },
  UNDERSIZE_QUANTITY: {
    valueType: "number",
    requiredMessage: M.undersizeQuantity.required,
    invalidMessage: M.undersizeQuantity.invalid,
  },
  SIEVE_MESH_SIZE: {
    valueType: "text",
    pattern: ALPHA_NUM,
    requiredMessage: M.sieveMeshSize.required,
    invalidMessage: M.sieveMeshSize.invalid,
  },
  AMOUNT_OF_MATERIAL: {
    valueType: "number",
    requiredMessage: M.amountOfMaterial.required,
    invalidMessage: M.amountOfMaterial.invalid,
  },
  TOTAL_QUANTITY_SENT_FOR_PREMIX: {
    valueType: "number",
    requiredMessage: M.totalQuantitySentForPremix.required,
    invalidMessage: M.totalQuantitySentForPremix.invalid,
  },
  PARTICLE_SIZE: {
    valueType: "number",
    requiredMessage: M.particleSize.required,
    invalidMessage: M.particleSize.invalid,
  },
  QUALIFIED_QUANTITY: {
    valueType: "number",
    requiredMessage: M.qualifiedQuantity.required,
    invalidMessage: M.qualifiedQuantity.invalid,
  },
  NUMBER_OF_DRUMS: {
    valueType: "number",
    requiredMessage: M.numberOfDrums.required,
    invalidMessage: M.numberOfDrums.invalid,
  },
  AGITATOR_RPM: {
    valueType: "number",
    requiredMessage: M.agitatorRpm.required,
    invalidMessage: M.agitatorRpm.invalid,
  },
  PROCESS_TEMPERATURE: {
    valueType: "number",
    requiredMessage: M.processTemperature.required,
    invalidMessage: M.processTemperature.invalid,
  },
  JACKET_TEMPERATURE: {
    valueType: "number",
    requiredMessage: M.jacketTemperature.required,
    invalidMessage: M.jacketTemperature.invalid,
  },
  DISPATCH_DATETIME: {
    valueType: "datetime",
    requiredMessage: M.dispatchDatetime.required,
    invalidMessage: M.dispatchDatetime.invalid,
  },
  DISPATCH_TIME: {
    valueType: "datetime",
    requiredMessage: M.dispatchDatetime.required,
    invalidMessage: M.dispatchDatetime.invalid,
  },
};

/** Always optional on SUBMIT unless explicitly in a fieldList scope. */
export const globallyOptionalFieldIds = new Set([
  "BIN_CAPACITY",
  "OBSERVATION",
  "DRUM_NUMBER",
  "QUALIFIED_QUANTITY",
  "DISPATCH_TIME",
  "DISPATCH_DATETIME",
]);

export const materialMandatoryScopes: Record<string, MaterialMandatoryScope> = {
  "AP:COARSE": {
    mode: "fieldList",
    fields: [
      "LOT_NUMBER",
      "QUANTITY",
      "ACTUAL_PARAMETER",
      "START_TIME",
      "END_TIME",
      "BIN_NUMBER",
      "FILLED_QUANTITY",
      "RESULT",
    ],
  },
  "AP:FINE": {
    mode: "fieldList",
    fields: [
      "LOT_NUMBER",
      "TOTAL_QUANTITY",
      "EQUIPMENT_ID",
      "VALUE",
      "SET_PRESSURE",
      "START_DATETIME",
      "END_DATETIME",
      "RESULT",
      "OVEN_TYPE",
      "OVEN_NUMBER",
      "OVEN_SET_TEMPERATURE",
      "MOISTURE",
      "SIEVING_DISPATCH_DATETIME",
      "SIEVED_QUANTITY",
      "SIEVE_MESH_SIZE",
      "OVERSIZE_QUANTITY",
      "UNDERSIZE_QUANTITY",
    ],
  },
  "AP:ULTRA_FINE": { mode: "allExceptOptional" },
  "CC:_": { mode: "fieldList", fields: ["AMOUNT_OF_MATERIAL"] },
  "AL:_": { mode: "fieldList", fields: ["TOTAL_QUANTITY"] },
  "HTPB:_": { mode: "allExceptOptional" },
  "TDI:_": { mode: "fieldList", fields: ["TOTAL_QUANTITY_SENT_FOR_PREMIX"] },
  "IO:_": { mode: "fieldList", fields: ["SIEVING_DATETIME"] },
};

export const resolveMaterialScopeKey = (
  materialCode: string,
  gradeCode?: string | null,
): string => {
  const code = String(materialCode ?? "").trim().toUpperCase();
  const grade = String(gradeCode ?? "").trim().toUpperCase();
  if (grade) return `${code}:${grade}`;
  return `${code}:_`;
};

export const getSchemaFieldRule = (fieldId: string): SchemaFieldRule | undefined =>
  rawMaterialPrepSchemaFieldRules[fieldId];

export const isGloballyOptionalFieldId = (fieldId: string): boolean =>
  globallyOptionalFieldIds.has(fieldId);

export type SchemaValidationMaterialContext = {
  materialCode?: string;
  gradeCode?: string | null;
};

export const isFieldInMaterialSubmitScope = (
  fieldId: string,
  context?: SchemaValidationMaterialContext,
): boolean => {
  if (!context?.materialCode) return false;

  const scopeKey = resolveMaterialScopeKey(context.materialCode, context.gradeCode);
  const scope = materialMandatoryScopes[scopeKey];
  if (!scope) return false;

  if (scope.mode === "allExceptOptional") {
    return !isGloballyOptionalFieldId(fieldId);
  }

  return (scope.fields ?? []).includes(fieldId);
};

export const isFieldRequiredOnSubmit = (
  fieldId: string,
  fieldType: string,
  context: SchemaValidationMaterialContext | undefined,
  block?: {
    validation?: { required?: boolean };
    required?: boolean;
    ui?: { required?: boolean };
    label?: string;
  },
): boolean => {
  if (block?.validation?.required === false) return false;
  if (block?.validation?.required === true || block?.required || block?.ui?.required) return true;

  if (isGloballyOptionalFieldId(fieldId)) {
    return isFieldInMaterialSubmitScope(fieldId, context);
  }

  if (context?.materialCode) {
    return isFieldInMaterialSubmitScope(fieldId, context);
  }

  const t = fieldType.toLowerCase();
  return (
    t === "number" ||
    t === "decimal" ||
    t === "date" ||
    t === "time" ||
    t === "datetime" ||
    t === "text" ||
    t === "textarea" ||
    t === "dropdown" ||
    t === "string"
  );
};

/** AP Coarse submit requires weightment mixer building when any coarse material is on premix. */
export const premixRequiresWeightmentOnSubmit = (
  selections: Array<{ solidMaterialCode?: string; solidGradeCode?: string }>,
): boolean =>
  selections.some(
    (entry) =>
      String(entry.solidMaterialCode ?? "").toUpperCase() === "AP" &&
      String(entry.solidGradeCode ?? "").toUpperCase() === "COARSE",
  );
