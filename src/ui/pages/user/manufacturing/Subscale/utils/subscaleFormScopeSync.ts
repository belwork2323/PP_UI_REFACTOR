import { scopedFormKey, type SchemaFormValues } from "../../../../../../schema-engine";
import { ARTICLE_TYPE_TABLE_ID, HARDWARE_SECTION_ID } from "../../../../../../hooks/user/manufacturing/subscaleHardwareConfig";

const PROCESS_TABLE_SECTION_IDS: Record<string, string> = {
  CASTING_TABLE: "CASTING_DETAILS",
  CURING_TABLE: "CURING_DETAILS",
  NDT_TABLE: "NDT_DETAILS",
  TRIMMING_TABLE: "TRIMMING_DETAILS",
  INHIBITION_TABLE: "INHIBITION_DETAILS",
  STATIC_TESTING_TABLE: "STATIC_TESTING",
  MECHANICAL_PROPERTIES_TABLE: "MECHANICAL_INTERFACE_PROPERTIES",
};

const PROCESS_SCALAR_SECTION_IDS: Record<string, string> = {
  DATE_OF_CASTING: "CASTING_DETAILS",
  IR_BATCH_NO: "INHIBITION_DETAILS",
  DATE_OF_MANUFACTURING: "INHIBITION_DETAILS",
  DATE_OF_MFG: "INHIBITION_DETAILS",
  DATE_OF_APPLICATION: "INHIBITION_DETAILS",
};

export const syncProcessTableScope = (
  values: SchemaFormValues,
  tableId: string,
  tableRows: unknown[],
): SchemaFormValues => {
  const next: SchemaFormValues = { ...values, [tableId]: tableRows };
  const sectionId = PROCESS_TABLE_SECTION_IDS[tableId];
  if (sectionId) {
    next[scopedFormKey(sectionId, tableId)] = tableRows;
  }
  if (tableId === ARTICLE_TYPE_TABLE_ID) {
    next[scopedFormKey(HARDWARE_SECTION_ID, ARTICLE_TYPE_TABLE_ID)] = tableRows;
  }
  return next;
};

export const syncProcessFieldScope = (
  values: SchemaFormValues,
  fieldId: string,
  value: unknown,
): SchemaFormValues => {
  const next: SchemaFormValues = { ...values, [fieldId]: value };
  const sectionId = PROCESS_SCALAR_SECTION_IDS[fieldId];
  if (!sectionId) return next;

  next[scopedFormKey(sectionId, fieldId)] = value;
  if (fieldId === "DATE_OF_MFG") {
    next.DATE_OF_MANUFACTURING = value;
    next[scopedFormKey(sectionId, "DATE_OF_MANUFACTURING")] = value;
  }
  return next;
};

export const applySubscaleFormScopePatch = (
  values: SchemaFormValues,
  patch: Partial<SchemaFormValues>,
): SchemaFormValues => {
  let next: SchemaFormValues = { ...values, ...patch };

  Object.entries(patch).forEach(([key, value]) => {
    if (Array.isArray(value) && (key.endsWith("_TABLE") || key === ARTICLE_TYPE_TABLE_ID)) {
      next = syncProcessTableScope(next, key, value);
      return;
    }
    if (key in PROCESS_SCALAR_SECTION_IDS) {
      next = syncProcessFieldScope(next, key, value);
    }
  });

  return next;
};
