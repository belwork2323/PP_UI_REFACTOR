import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const examplesDir = path.resolve(__dirname, "..");

const PRESETS = {
  V_REQUIRED: { required: true },
  V_OPTIONAL: { required: false },
  V_ALPHA_REQUIRED: {
    required: true,
    pattern: "^[A-Za-z0-9][A-Za-z0-9 /_-]*$",
    message: "Must be alphanumeric.",
  },
  V_NUMBER_REQUIRED: { required: true, min: 0 },
  V_DATETIME_REQUIRED: { required: true },
  V_RESULT_VS_SPEC: { required: true, min: 0 },
};

const STRUCTURAL_IDS = new Set([
  "srNo",
  "OPERATION",
  "SET_PARAMETER",
  "PSD_REQUIREMENT",
  "SPECIFICATION",
  "PARAMETER",
  "REQUIREMENT",
]);

const ALPHA_IDS = new Set([
  "LOT_NUMBER",
  "MFG_BATCH_LOT_NUMBER",
  "BIN_NUMBER",
  "EQUIPMENT_ID",
  "ACM_EQUIPMENT_ID",
  "SIEVE_MESH_SIZE",
]);

const DATETIME_IDS = new Set([
  "START_TIME",
  "END_TIME",
  "START_DATETIME",
  "END_DATETIME",
  "SIEVING_DISPATCH_DATETIME",
  "SIEVING_DATETIME",
  "DISPATCH_DATETIME",
  "DISPATCH_TIME",
  "WEIGHING_DATETIME",
]);

const OPTIONAL_IDS = new Set(["OBSERVATION", "BIN_CAPACITY", "DRUM_NUMBER", "NUMBER_OF_DRUMS"]);

const MATERIAL_FILES = [
  { file: "rmp-ap-coarse.api.json", key: "AP:COARSE" },
  { file: "rmp-ap-fine.api.json", key: "AP:FINE" },
  { file: "rmp-ap-ultrafine.api.json", key: "AP:ULTRA_FINE" },
  { file: "rmp-cc.api.json", key: "CC" },
  { file: "rmp-al.api.json", key: "AL" },
  { file: "rmp-htpb.api.json", key: "HTPB" },
  { file: "rmp-tdi.api.json", key: "TDI" },
  { file: "rmp-io.api.json", key: "IO" },
];

const AP_COARSE_REQUIRED = new Set([
  "LOT_NUMBER",
  "QUANTITY",
  "ACTUAL_PARAMETER",
  "START_TIME",
  "END_TIME",
  "BIN_NUMBER",
  "FILLED_QUANTITY",
  "RESULT",
]);

const AP_FINE_REQUIRED = new Set([
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
]);

const AP_FINE_OPTIONAL = new Set([
  "OBSERVATION",
  "DRUM_NUMBER",
  "START_TIME",
  "END_TIME",
]);

const FIELD_LIST_SCOPES = {
  CC: { required: new Set(["AMOUNT_OF_MATERIAL"]) },
  AL: { required: new Set(["TOTAL_QUANTITY"]) },
  TDI: { required: new Set(["TOTAL_QUANTITY_SENT_FOR_PREMIX"]) },
  IO: { required: new Set(["SIEVING_DATETIME"]) },
  "AP:COARSE": { required: AP_COARSE_REQUIRED, optional: new Set(["BIN_CAPACITY", "OBSERVATION"]) },
  "AP:FINE": { required: AP_FINE_REQUIRED, optional: AP_FINE_OPTIONAL },
};

function presetForId(id, parentTableId) {
  if (id === "RESULT") return PRESETS.V_RESULT_VS_SPEC;
  if (ALPHA_IDS.has(id)) return PRESETS.V_ALPHA_REQUIRED;
  if (DATETIME_IDS.has(id)) return PRESETS.V_DATETIME_REQUIRED;
  if (id === "OVEN_TYPE") return PRESETS.V_REQUIRED;
  if (OPTIONAL_IDS.has(id)) return PRESETS.V_OPTIONAL;
  if (parentTableId === "STORAGE_TRAY_OVEN" && DATETIME_IDS.has(id)) return PRESETS.V_OPTIONAL;
  return PRESETS.V_NUMBER_REQUIRED;
}

function resolveValidation(materialKey, node, parentTableId) {
  const { type, id, fieldType } = node;
  if (!id || (type !== "field" && type !== "column")) return undefined;
  if (STRUCTURAL_IDS.has(id)) return undefined;
  if (fieldType === "serial" || fieldType === "static") return undefined;

  if (materialKey === "AP:ULTRA_FINE" || materialKey === "HTPB") {
    if (OPTIONAL_IDS.has(id)) return PRESETS.V_OPTIONAL;
    if (id === "RESULT") return PRESETS.V_RESULT_VS_SPEC;
    if (ALPHA_IDS.has(id) || id === "OVEN_TYPE") return presetForId(id, parentTableId);
    if (DATETIME_IDS.has(id)) return PRESETS.V_DATETIME_REQUIRED;
    return PRESETS.V_NUMBER_REQUIRED;
  }

  const scope = FIELD_LIST_SCOPES[materialKey];
  if (!scope) return undefined;

  if (scope.optional?.has(id)) return PRESETS.V_OPTIONAL;
  if (!scope.required.has(id)) {
    if (materialKey === "CC" || materialKey === "AL" || materialKey === "TDI" || materialKey === "IO") {
      return PRESETS.V_OPTIONAL;
    }
    return undefined;
  }

  if (id === "RESULT" && parentTableId && !parentTableId.includes("PSD") && !parentTableId.includes("QC")) {
    return PRESETS.V_NUMBER_REQUIRED;
  }

  return presetForId(id, parentTableId);
}

function walk(node, materialKey, parentTableId = null) {
  if (!node || typeof node !== "object") return;

  if (node.type === "table") {
    const tableId = node.id ?? parentTableId;
    for (const child of node.columns ?? node.children ?? []) {
      walk(child, materialKey, tableId);
    }
    return;
  }

  const validation = resolveValidation(materialKey, node, parentTableId);
  if (validation) {
    node.validation = validation;
  }

  for (const child of node.children ?? []) {
    walk(child, materialKey, parentTableId);
  }
}

for (const { file, key } of MATERIAL_FILES) {
  const filePath = path.join(examplesDir, file);
  const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));
  for (const section of doc.data?.sections ?? []) {
    walk(section, key);
  }
  fs.writeFileSync(filePath, `${JSON.stringify(doc, null, 2)}\n`);
  console.log(`Updated ${file}`);
}
