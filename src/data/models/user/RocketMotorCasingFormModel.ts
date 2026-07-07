import type { DimensionalParameterModel } from "./SubdepartmentCommonModel";
import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import {
  buildMockTrialSectionPayload,
  createMockTrialInitialValues,
  hydrateMockTrialValuesFromSections,
  parseMockTrialSavedSections,
} from "../../../schema-engine/adapters/rocketMotorCasingMockTrial.adapter";

export type ReceiptStatus = "RECEIVED" | "NOT_RECEIVED";
export type CasingType = "COMPOSITE" | "METALLIC";
export type InsulationType = "ROCASIN" | "EPDM";
export type FormSubmissionType = "DRAFT" | "SUBMIT";

export type MechPropFormRow = {
  paramKey: string;
  paramName: string;
  reported: string;
  acemSpec: string;
  unit: string;
};

export type ThermalPropFormRow = {
  reported: string;
  acemSpec: string;
  unit: string;
};

export type UploadedFileRef = {
  fileName: string;
  fileUrl: string;
  mimeType: string;
};

export type VisualInspectionFormRow = {
  srNo: number;
  itemKey: string;
  description: string;
  observations: string;
  remark: string;
  mediaFile: File | null;
  /** @deprecated use mediaExisting — kept for backward compatibility */
  mediaUrl?: string | null;
  mediaExisting?: UploadedFileRef | null;
  requiresMedia?: boolean;
  subItems?: Array<{
    itemKey: string;
    description: string;
    observations: string;
    remark: string;
  }>;
};

export type DimensionalReadingFormRow = {
  paramId: string;
  paramName: string;
  side: string;
  sequenceNo: number;
  referenceRange: {
    minValue: number | null;
    maxValue: number | null;
    unit: string | null;
    source: string;
  };
  readings: {
    r2tR2b: string;
    r1rR1l: string;
    tlBr: string;
    trBl: string;
  };
  looseFlap: {
    arcLength: string;
    axialLength: string;
  };
  remarks: string;
};

/** Four dimensional reading columns — matches API v2 `readings` keys. */
export const DIM_READING_KEYS = ["r2tR2b", "r1rR1l", "tlBr", "trBl"] as const;
export type DimReadingKey = (typeof DIM_READING_KEYS)[number];
export type DimApiPairKey = DimReadingKey;

export const DIM_READING_LABELS: Record<DimReadingKey, string> = {
  r2tR2b: "R2T–R2B",
  r1rR1l: "R1R–R1L",
  tlBr: "TL–BR",
  trBl: "TR–BL",
};

export const EMPTY_DIM_READINGS = (): DimensionalReadingFormRow["readings"] => ({
  r2tR2b: "",
  r1rR1l: "",
  tlBr: "",
  trBl: "",
});

export const EMPTY_LOOSE_FLAP = (): DimensionalReadingFormRow["looseFlap"] => ({
  arcLength: "",
  axialLength: "",
});

export function isLooseFlapDimensionalParam(row: { paramName?: string }): boolean {
  return String(row.paramName ?? "").toLowerCase().includes("loose flap");
}

export type RocketMotorCasingFormData = {
  projectId: string;
  motorStageApi: string;
  /** User-entered motor ID (API `motorId`); casing ID is assigned by the server */
  motorId: string;
  /** Populated after first save; read-only in the form */
  motorCasingId: string;
  casingType: CasingType;
  receivingDate: string;
  itemsDescription: string;
  itemsDimension: string;
  itemsUnit: string;
  itemsReceiptStatus: ReceiptStatus;
  itemsObservations: string;
  greenCardStatus: ReceiptStatus;
  greenCardNo: string;
  clearanceDate: string;
  clearanceAuthority: string;
  clearanceDetails: string;
  insulationCuringDate: string;
  insulationType: InsulationType;
  insulationReportNo: string;
  insulationReceiptStatus: ReceiptStatus;
  insulationReportFile: File | null;
  /** @deprecated use insulationReportExisting */
  insulationReportUrl?: string | null;
  insulationReportExisting?: UploadedFileRef | null;
  mechanicalProperties: Record<string, MechPropFormRow>;
  thermalProperties: Record<string, ThermalPropFormRow>;
  postPptUtDate: string;
  ndtDate: string;
  ndtObservations: string;
  acemNdtObservations: string;
  projectRubberSurfaceObservations: string;
  otherDetails: string;
  visualInspection: VisualInspectionFormRow[];
  weightWithoutHarness: string;
  weightWithHarness: string;
  weighscaleEquipment: string;
  calibrationDueDate: string;
  dimensionalData: DimensionalReadingFormRow[];
  mockTrial: RocketMotorCasingMockTrialSlot;
};

export type RocketMotorCasingMockTrialSlot = {
  schema: SchemaDocumentV2 | null;
  schemaLoading: boolean;
  schemaError: string | null;
  formValues: SchemaFormValues;
  /** Persisted section rows from API until schema is fetched */
  savedSections?: SchemaSectionSubmission[];
};

export const createEmptyMockTrialSlot = (): RocketMotorCasingMockTrialSlot => ({
  schema: null,
  schemaLoading: false,
  schemaError: null,
  formValues: {},
  savedSections: undefined,
});

export type RocketMotorCasingFormPayload = {
  subDepartmentId: number;
  projectId: string;
  motorStage: number | string;
  motorId: string;
  motorCasingId?: string;
  formSubmissionType: FormSubmissionType;
  sections: Record<string, unknown>;
};

const parseNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

/** Resolves API numeric fields that may be a scalar or `{ source, parsedValue }`. */
const parseApiNumeric = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (o.parsedValue != null) return parseNum(o.parsedValue);
    if (o.source != null) return parseNum(o.source);
    if (o.value != null) return parseApiNumeric(o.value);
  }
  return parseNum(v);
};

const str = (v: unknown) => String(v ?? "").trim();

const valueFromApiField = (v: unknown): string => {
  const n = parseApiNumeric(v);
  return n != null ? String(n) : v != null && typeof v !== "object" ? String(v) : "";
};

export const parseUploadedFileRef = (value: unknown): UploadedFileRef | null => {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const fileUrl = String(o.fileUrl ?? "").trim();
  if (!fileUrl) return null;
  const decodeName = (name: string) => {
    try {
      return decodeURIComponent(name);
    } catch {
      return name;
    }
  };
  const fileName =
    decodeName(String(o.fileName ?? "").trim()) ||
    decodeName(String(fileUrl.split("/").pop() || "file").replace(/^pending-upload:\/\//i, ""));
  return {
    fileName,
    fileUrl,
    mimeType: String(o.mimeType ?? "application/octet-stream"),
  };
};

const fileToMediaRef = (file: File | null, existing?: UploadedFileRef | null) => {
  if (file) {
    return {
      fileName: file.name,
      fileUrl: `pending-upload://${encodeURIComponent(file.name)}`,
      mimeType: file.type || "application/octet-stream",
    };
  }
  if (existing?.fileUrl) {
    return {
      fileName: existing.fileName,
      fileUrl: existing.fileUrl,
      mimeType: existing.mimeType || "application/octet-stream",
    };
  }
  return null;
};

const isWithinRange = (value: number | null, min: number | null, max: number | null): boolean => {
  if (value == null) return false;
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
};

export const ROCASIN_MECH_KEYS = [
  { paramKey: "TENSILE_STRENGTH", paramName: "Tensile strength, ksc", unit: "ksc" },
  { paramKey: "ELONGATION", paramName: "Elongation, %", unit: "%" },
  { paramKey: "DENSITY", paramName: "Density, g/cc", unit: "g/cc" },
  { paramKey: "HARDNESS_SHORE_A", paramName: "Hardness, Shore A", unit: "Shore A" },
] as const;

export const EPDM_MECH_KEYS = [
  { paramKey: "TENSILE_STRENGTH_WARP", paramName: "Tensile strength, ksc, warp", unit: "ksc" },
  { paramKey: "TENSILE_STRENGTH_WEFT", paramName: "Tensile strength, ksc, weft", unit: "ksc" },
  { paramKey: "ELONGATION_WARP", paramName: "Elongation, %, warp", unit: "%" },
  { paramKey: "ELONGATION_WEFT", paramName: "Elongation, %, weft", unit: "%" },
  { paramKey: "DENSITY", paramName: "Density, g/cc", unit: "g/cc" },
  { paramKey: "HARDNESS_SHORE_A", paramName: "Hardness, Shore A", unit: "Shore A" },
] as const;

export const THERMAL_PROP_KEYS = [
  { key: "thermalConductivity", label: "Thermal conductivity", unit: "cal/cm/s/K" },
  { key: "specificHeat", label: "Specific heat", unit: "cal/g/K" },
  { key: "coefficientOfThermalExpansion", label: "Co-efficient of thermal expansion", unit: "1/K" },
  { key: "ablationRate", label: "Ablation rate", unit: "mm/s @ 300W/cm2" },
] as const;

export const VISUAL_INSPECTION_TEMPLATE: Omit<VisualInspectionFormRow, "observations" | "remark" | "mediaFile">[] = [
  { srNo: 1, itemKey: "MOTOR_OUTER_SURFACE", description: "Motor Outer Surface condition", requiresMedia: true },
  { srNo: 2, itemKey: "LUGS_CONDITION", description: "Nos. of Lugs & Condition", requiresMedia: true },
  { srNo: 3, itemKey: "TAPPED_HOLE_HE", description: "Condition of tapped hole at HE side" },
  { srNo: 4, itemKey: "TAPPED_HOLE_NE", description: "Condition of tapped hole at NE side" },
  { srNo: 5, itemKey: "POLAR_BOSS_HE", description: "Condition of Polar boss at HE side" },
  { srNo: 6, itemKey: "POLAR_BOSS_NE", description: "Condition of Polar boss at NE side", requiresMedia: true },
  {
    srNo: 7,
    itemKey: "INSULATION_LINING_SURFACE",
    description: "Insulation Lining Surface Condition",
    subItems: [
      { itemKey: "INSULATION_FINISH", description: "Surface finish", observations: "", remark: "" },
      { itemKey: "INSULATION_COLOR", description: "Color", observations: "", remark: "" },
      { itemKey: "INSULATION_PATCHES", description: "Patches", observations: "", remark: "" },
      { itemKey: "INSULATION_PINHOLES", description: "Pinholes", observations: "", remark: "" },
      { itemKey: "INSULATION_DEPRESSION", description: "Depression if any", observations: "", remark: "" },
      {
        itemKey: "INSULATION_FOREIGN_MATERIAL",
        description: "Foreign materials on rubber surface",
        observations: "",
        remark: "",
      },
    ],
  },
  { srNo: 8, itemKey: "LOOSE_FLAP", description: "Loose Flap Condition" },
  { srNo: 9, itemKey: "BONDING_HE", description: "Bonding of rubber with HE polar boss", requiresMedia: true },
  { srNo: 10, itemKey: "BONDING_NE", description: "Bonding of rubber with NE polar boss" },
  { srNo: 11, itemKey: "JOINTS_PATCHWORK", description: "Observation on Joints/Patch work" },
  { srNo: 12, itemKey: "OTHER", description: "Other observation if any" },
];

export function createInitialMechanicalProperties(type: InsulationType): Record<string, MechPropFormRow> {
  const keys = type === "EPDM" ? EPDM_MECH_KEYS : ROCASIN_MECH_KEYS;
  return Object.fromEntries(
    keys.map((k) => [
      k.paramKey,
      { paramKey: k.paramKey, paramName: k.paramName, reported: "", acemSpec: "", unit: k.unit },
    ])
  );
}

export function createInitialThermalProperties(): Record<string, ThermalPropFormRow> {
  return Object.fromEntries(
    THERMAL_PROP_KEYS.map((k) => [k.key, { reported: "", acemSpec: "", unit: k.unit }])
  );
}

export function createInitialVisualInspection(): VisualInspectionFormRow[] {
  return VISUAL_INSPECTION_TEMPLATE.map((t) => ({
    ...t,
    observations: "",
    remark: "",
    mediaFile: null,
    mediaExisting: null,
    subItems: t.subItems?.map((s) => ({ ...s })),
  }));
}

export function dimensionalRowFromParameter(param: DimensionalParameterModel, index: number): DimensionalReadingFormRow {
  const name = String(param.paramName ?? "").toLowerCase();
  return {
    paramId: param.paramId,
    paramName: param.paramName,
    side: name.includes("he") && !name.includes("ne") ? "HE" : name.includes("ne") ? "NE" : "COMMON",
    sequenceNo: index + 1,
    referenceRange: {
      minValue: param.referenceRange?.minValue ?? null,
      maxValue: param.referenceRange?.maxValue ?? null,
      unit: param.referenceRange?.unit ?? "mm",
      source: "ACEM",
    },
    readings: EMPTY_DIM_READINGS(),
    looseFlap: EMPTY_LOOSE_FLAP(),
    remarks: "",
  };
}

export function normalizeDimensionalRow(row: DimensionalReadingFormRow): DimensionalReadingFormRow {
  const base = parseDimReadingsFromApi((row.readings ?? {}) as Record<string, unknown>);
  for (const key of DIM_READING_KEYS) {
    const v = row.readings[key];
    if (v != null && String(v).trim() !== "") base[key] = String(v);
  }
  return {
    ...row,
    readings: base,
    looseFlap: row.looseFlap ?? EMPTY_LOOSE_FLAP(),
  };
}

/** API v2: each reading is a scalar; legacy payloads may send `{ minValue, maxValue }`. */
const parseApiReadingScalar = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    const min = parseApiNumeric(o.minValue ?? o.min);
    const max = parseApiNumeric(o.maxValue ?? o.max);
    if (min != null && max != null) return (min + max) / 2;
    if (min != null || max != null) return min ?? max;
    return parseApiNumeric(o.parsedValue ?? o.source ?? o.value);
  }
  return parseApiNumeric(v);
};

const legacyPairToScalar = (r: Record<string, unknown>, a: string, b: string): number | null => {
  const va = parseApiNumeric(r[a]);
  const vb = parseApiNumeric(r[b]);
  if (va == null && vb == null) return null;
  if (va != null && vb != null) return (va + vb) / 2;
  return va ?? vb;
};

export function parseDimReadingsFromApi(
  readings: Record<string, unknown>,
  legacyRecorded?: unknown
): DimensionalReadingFormRow["readings"] {
  const out = EMPTY_DIM_READINGS();
  const r = readings ?? {};

  for (const key of DIM_READING_KEYS) {
    const scalar = parseApiReadingScalar(r[key]);
    if (scalar != null) out[key] = String(scalar);
  }

  if (!out.r2tR2b) {
    const legacy = legacyPairToScalar(r, "r2t", "r2b") ?? parseApiReadingScalar(legacyRecorded);
    if (legacy != null) out.r2tR2b = String(legacy);
  }
  if (!out.r1rR1l) {
    const legacy = legacyPairToScalar(r, "r1r", "r1l");
    if (legacy != null) out.r1rR1l = String(legacy);
  }
  if (!out.tlBr) {
    const legacy = legacyPairToScalar(r, "tl", "br");
    if (legacy != null) out.tlBr = String(legacy);
  }
  if (!out.trBl) {
    const legacy = legacyPairToScalar(r, "tr", "bl");
    if (legacy != null) out.trBl = String(legacy);
  }

  return out;
}

export function parseLooseFlapFromApi(looseFlap: unknown): DimensionalReadingFormRow["looseFlap"] {
  const lf = (looseFlap && typeof looseFlap === "object" ? looseFlap : {}) as Record<string, unknown>;
  const arc = parseApiNumeric(lf.arcLength);
  const axial = parseApiNumeric(lf.axialLength);
  return {
    arcLength: arc != null ? String(arc) : "",
    axialLength: axial != null ? String(axial) : "",
  };
}

/** API v2 readings: `{ r2tR2b: 144.2, r1rR1l: 144.0, tlBr: 144.1, trBl: 144.3 }` */
export function buildApiDimReadings(
  readings: DimensionalReadingFormRow["readings"]
): Record<DimApiPairKey, number | null> {
  const out = {} as Record<DimApiPairKey, number | null>;
  for (const key of DIM_READING_KEYS) {
    out[key] = parseNum(readings[key]);
  }
  return out;
}

const computeDimensionalRowWithinRange = (row: DimensionalReadingFormRow): boolean => {
  if (isLooseFlapDimensionalParam(row)) return true;

  const specMin = row.referenceRange.minValue;
  const specMax = row.referenceRange.maxValue;
  if (specMin == null && specMax == null) return true;

  for (const key of DIM_READING_KEYS) {
    const scalar = parseNum(row.readings[key]);
    if (scalar != null && !isWithinRange(scalar, specMin, specMax)) return false;
  }
  return true;
};

export const INITIAL_ROCKET_MOTOR_CASING_FORM: RocketMotorCasingFormData = {
  projectId: "",
  motorStageApi: "",
  motorId: "",
  motorCasingId: "",
  casingType: "COMPOSITE",
  receivingDate: "",
  itemsDescription: "Rubber Sheet",
  itemsDimension: "",
  itemsUnit: "mm",
  itemsReceiptStatus: "RECEIVED",
  itemsObservations: "",
  greenCardStatus: "RECEIVED",
  greenCardNo: "",
  clearanceDate: "",
  clearanceAuthority: "",
  clearanceDetails: "",
  insulationCuringDate: "",
  insulationType: "ROCASIN",
  insulationReportNo: "",
  insulationReceiptStatus: "RECEIVED",
  insulationReportFile: null,
  insulationReportExisting: null,
  mechanicalProperties: createInitialMechanicalProperties("ROCASIN"),
  thermalProperties: createInitialThermalProperties(),
  postPptUtDate: "",
  ndtDate: "",
  ndtObservations: "",
  acemNdtObservations: "",
  projectRubberSurfaceObservations: "",
  otherDetails: "",
  visualInspection: createInitialVisualInspection(),
  weightWithoutHarness: "",
  weightWithHarness: "",
  weighscaleEquipment: "",
  calibrationDueDate: "",
  dimensionalData: [],
  mockTrial: createEmptyMockTrialSlot(),
};

function buildMechRows(
  form: RocketMotorCasingFormData,
  keys: readonly { paramKey: string; paramName: string; unit: string }[]
) {
  return keys
    .map((def) => {
      const row = form.mechanicalProperties[def.paramKey];
      const reported = parseNum(row?.reported ?? "");
      const acemSpec = parseNum(row?.acemSpec ?? "");
      if (reported == null) return null;
      return {
        paramKey: def.paramKey,
        paramName: def.paramName,
        reported,
        acemSpec: acemSpec ?? reported,
        unit: def.unit,
      };
    })
    .filter(Boolean);
}

function buildThermalProperties(form: RocketMotorCasingFormData) {
  const out: Record<string, { reported: number; acemSpec: number; unit: string }> = {};
  for (const def of THERMAL_PROP_KEYS) {
    const row = form.thermalProperties[def.key];
    const reported = parseNum(row?.reported ?? "");
    const acemSpec = parseNum(row?.acemSpec ?? "");
    if (reported == null) continue;
    out[def.key] = {
      reported,
      acemSpec: acemSpec ?? reported,
      unit: (row?.unit || def.unit).trim() || def.unit,
    };
  }
  return out;
}

export function buildCasingFormPayload(
  form: RocketMotorCasingFormData,
  subDepartmentId: number,
  formSubmissionType: FormSubmissionType,
  options?: { includeMotorCasingId?: boolean; motorCasingId?: string }
): RocketMotorCasingFormPayload {
  const mechKeys = form.insulationType === "EPDM" ? EPDM_MECH_KEYS : ROCASIN_MECH_KEYS;
  const mechanicalProperties = buildMechRows(form, mechKeys);
  const thermalProperties = buildThermalProperties(form);

  const dimensionalInspection = form.dimensionalData.map((row) => {
    const min = row.referenceRange.minValue;
    const max = row.referenceRange.maxValue;
    const looseFlap = isLooseFlapDimensionalParam(row)
      ? {
          arcLength: parseNum(row.looseFlap?.arcLength ?? ""),
          axialLength: parseNum(row.looseFlap?.axialLength ?? ""),
        }
      : { arcLength: null, axialLength: null };

    return {
      paramId: row.paramId,
      paramName: row.paramName,
      side: row.side,
      sequenceNo: row.sequenceNo,
      specifiedDimension: {
        minValue: min,
        maxValue: max,
        unit: row.referenceRange.unit || "mm",
        source: row.referenceRange.source || "ACEM",
      },
      readings: isLooseFlapDimensionalParam(row)
        ? { r2tR2b: null, r1rR1l: null, tlBr: null, trBl: null }
        : buildApiDimReadings(row.readings),
      looseFlap,
      remarks: row.remarks || "",
      isWithinRange: computeDimensionalRowWithinRange(row),
    };
  });

  const visualInspection = form.visualInspection.map((row) => ({
    srNo: row.srNo,
    itemKey: row.itemKey,
    description: row.description,
    observations: row.observations || "—",
    remark: row.remark || "",
    media: fileToMediaRef(row.mediaFile, row.mediaExisting ?? null),
    ...(row.subItems?.length ? { subItems: row.subItems } : {}),
  }));

  const w1 = parseNum(form.weightWithoutHarness) ?? 0;
  const w2 = parseNum(form.weightWithHarness) ?? 0;

  const stageRaw = form.motorStageApi.trim();
  const stageNum = Number(stageRaw);
  const motorStage = stageRaw !== "" && Number.isFinite(stageNum) ? stageNum : stageRaw;

  const payload: RocketMotorCasingFormPayload = {
    subDepartmentId,
    projectId: form.projectId.trim(),
    motorStage,
    motorId: form.motorId.trim(),
    formSubmissionType,
    sections: {
      motorReceipt: {
        casingType: form.casingType,
        receivingDate: form.receivingDate || new Date().toISOString().slice(0, 10),
        itemsReceived: {
          itemType: "RUBBER_SHEET",
          description: form.itemsDescription.trim() || "Rubber Sheet",
          dimension: form.itemsDimension.trim() || "—",
          unit: form.itemsUnit.trim() || "mm",
          receiptStatus: form.itemsReceiptStatus,
          observations: form.itemsObservations.trim(),
        },
        clearances: {
          greenCardStatus: form.greenCardStatus,
          greenCardNo: form.greenCardNo.trim() || "—",
          clearanceDate: form.clearanceDate || null,
          authority: form.clearanceAuthority.trim() || "—",
          detailsAndObservations: form.clearanceDetails.trim(),
        },
        insulation: {
          insulationCuringDate: form.insulationCuringDate || null,
          type: form.insulationType,
          reportNo: form.insulationReportNo.trim() || "—",
          receiptStatus: form.insulationReceiptStatus,
          reportUpload: fileToMediaRef(form.insulationReportFile, form.insulationReportExisting ?? null),
          mechanicalProperties,
          thermalProperties,
        },
        ndtUtReport: {
          postPptUtDate: form.postPptUtDate || null,
          ndtDate: form.ndtDate || null,
          observations: form.ndtObservations.trim(),
        },
        acemNdtObservations: form.acemNdtObservations.trim(),
        projectRubberSurfaceObservations: form.projectRubberSurfaceObservations.trim(),
        otherDetails: form.otherDetails.trim(),
      },
      visualInspection,
      weightment: {
        weightWithoutHarness: { value: w1, unit: "kg" },
        weightWithHarness: { value: w2, unit: "kg" },
        weighscaleCalibration: {
          equipmentDetails: form.weighscaleEquipment.trim(),
          calibrationDueDate: form.calibrationDueDate || null,
        },
      },
      dimensionalInspection,
      ...(form.mockTrial.schema
        ? {
            mockTrial: buildMockTrialSectionPayload(form.mockTrial.schema, form.mockTrial.formValues),
          }
        : {}),
    },
  };

  const casingId = String(options?.motorCasingId ?? form.motorCasingId ?? "").trim();
  if (options?.includeMotorCasingId && casingId) {
    payload.motorCasingId = casingId;
  }

  return payload;
}

function mechRowFromApi(row: Record<string, unknown>): MechPropFormRow {
  return {
    paramKey: String(row.paramKey ?? ""),
    paramName: String(row.paramName ?? ""),
    reported: valueFromApiField(row.reported),
    acemSpec: valueFromApiField(row.acemSpec ?? row.acem),
    unit: String(row.unit ?? ""),
  };
}

function thermalRowFromApi(row: Record<string, unknown>, defaultUnit: string): ThermalPropFormRow {
  return {
    reported: valueFromApiField(row.reported ?? row.value),
    acemSpec: valueFromApiField(row.acemSpec),
    unit: String(row.unit ?? defaultUnit),
  };
}

export function parseSectionsToFormData(
  sections: Record<string, unknown>,
  ids: { projectId?: string; motorStage?: string; motorId?: string; motorCasingId?: string }
): RocketMotorCasingFormData {
  const mr = (sections.motorReceipt ?? {}) as Record<string, unknown>;
  const items = (mr.itemsReceived ?? {}) as Record<string, unknown>;
  const clear = (mr.clearances ?? {}) as Record<string, unknown>;
  const ins = (mr.insulation ?? {}) as Record<string, unknown>;
  const thermal = (ins.thermalProperties ?? {}) as Record<string, unknown>;
  const ndt = (mr.ndtUtReport ?? {}) as Record<string, unknown>;
  const reportUpload = ins.reportUpload as Record<string, unknown> | null | undefined;

  const insulationType = (String(ins.type ?? "ROCASIN").toUpperCase() as InsulationType) || "ROCASIN";
  const mechApi = Array.isArray(ins.mechanicalProperties) ? ins.mechanicalProperties : [];
  const mechanicalProperties = createInitialMechanicalProperties(insulationType);
  for (const row of mechApi) {
    const parsed = mechRowFromApi(row as Record<string, unknown>);
    if (parsed.paramKey) mechanicalProperties[parsed.paramKey] = parsed;
  }

  const thermalProperties = createInitialThermalProperties();
  for (const def of THERMAL_PROP_KEYS) {
    const row = thermal[def.key] as Record<string, unknown> | undefined;
    if (row) thermalProperties[def.key] = thermalRowFromApi(row, def.unit);
  }

  const visualApi = Array.isArray(sections.visualInspection) ? sections.visualInspection : [];
  const visualInspection =
    visualApi.length > 0
      ? visualApi.map((v: any, i: number) => {
          const mediaExisting = parseUploadedFileRef(v.media);
          return {
            srNo: Number(v.srNo ?? i + 1),
            itemKey: String(v.itemKey ?? ""),
            description: String(v.description ?? ""),
            observations: String(v.observations ?? ""),
            remark: String(v.remark ?? ""),
            mediaFile: null,
            mediaExisting,
            mediaUrl: mediaExisting?.fileUrl ?? null,
            subItems: Array.isArray(v.subItems)
              ? v.subItems.map((s: any) => ({
                  itemKey: String(s.itemKey ?? ""),
                  description: String(s.description ?? ""),
                  observations: String(s.observations ?? ""),
                  remark: String(s.remark ?? ""),
                }))
              : undefined,
          };
        })
      : createInitialVisualInspection();

  const mockTrialSaved = parseMockTrialSavedSections(sections.mockTrial);

  const dimApi = Array.isArray(sections.dimensionalInspection) ? sections.dimensionalInspection : [];
  const dimensionalData: DimensionalReadingFormRow[] = dimApi.map((d: any, idx: number) => {
    const spec = d.specifiedDimension ?? d.referenceRange ?? {};
    const name = String(d.paramName ?? "").toLowerCase();
    return {
      paramId: String(d.paramId ?? ""),
      paramName: String(d.paramName ?? ""),
      side: String(d.side ?? (name.includes("he") ? "HE" : name.includes("ne") ? "NE" : "COMMON")),
      sequenceNo: Number(d.sequenceNo ?? idx + 1),
      referenceRange: {
        minValue: parseApiNumeric(spec.minValue),
        maxValue: parseApiNumeric(spec.maxValue),
        unit: spec.unit != null ? String(spec.unit) : "mm",
        source: String(spec.source ?? "ACEM"),
      },
      readings: parseDimReadingsFromApi(d.readings ?? {}, d.recordedValue),
      looseFlap: parseLooseFlapFromApi(d.looseFlap),
      remarks: String(d.remarks ?? ""),
    };
  });

  const wm = (sections.weightment ?? {}) as Record<string, unknown>;
  const wwh = (wm.weightWithoutHarness ?? {}) as Record<string, unknown>;
  const wwh2 = (wm.weightWithHarness ?? {}) as Record<string, unknown>;
  const cal = (wm.weighscaleCalibration ?? {}) as Record<string, unknown>;

  return {
    ...INITIAL_ROCKET_MOTOR_CASING_FORM,
    projectId: ids.projectId ?? "",
    motorStageApi: ids.motorStage ?? "",
    motorId: ids.motorId ?? "",
    motorCasingId: ids.motorCasingId ?? "",
    casingType: (String(mr.casingType ?? "COMPOSITE").toUpperCase() as CasingType) || "COMPOSITE",
    receivingDate: str(mr.receivingDate).slice(0, 10),
    itemsDescription: str(items.description) || "Rubber Sheet",
    itemsDimension: str(items.dimension),
    itemsUnit: str(items.unit) || "mm",
    itemsReceiptStatus: (str(items.receiptStatus || clear.status).toUpperCase() as ReceiptStatus) || "RECEIVED",
    itemsObservations: str(items.observations),
    greenCardStatus: (str(clear.greenCardStatus || clear.status).toUpperCase() as ReceiptStatus) || "RECEIVED",
    greenCardNo: str(clear.greenCardNo),
    clearanceDate: str(clear.clearanceDate).slice(0, 10),
    clearanceAuthority: str(clear.authority),
    clearanceDetails: str(clear.detailsAndObservations),
    insulationCuringDate: str(ins.insulationCuringDate).slice(0, 10),
    insulationType,
    insulationReportNo: str(ins.reportNo),
    insulationReceiptStatus: (str(ins.receiptStatus).toUpperCase() as ReceiptStatus) || "RECEIVED",
    insulationReportFile: null,
    insulationReportExisting: parseUploadedFileRef(reportUpload),
    insulationReportUrl: parseUploadedFileRef(reportUpload)?.fileUrl ?? null,
    mechanicalProperties,
    thermalProperties,
    postPptUtDate: str(ndt.postPptUtDate).slice(0, 10),
    ndtDate: str(ndt.ndtDate).slice(0, 10),
    ndtObservations: str(ndt.observations),
    acemNdtObservations: str(mr.acemNdtObservations),
    projectRubberSurfaceObservations: str(mr.projectRubberSurfaceObservations),
    otherDetails: str(mr.otherDetails),
    visualInspection,
    weightWithoutHarness:
      parseApiNumeric(wwh.value) != null ? String(parseApiNumeric(wwh.value)) : wwh.value != null ? String(wwh.value) : "",
    weightWithHarness:
      parseApiNumeric(wwh2.value) != null ? String(parseApiNumeric(wwh2.value)) : wwh2.value != null ? String(wwh2.value) : "",
    weighscaleEquipment: str(cal.equipmentDetails),
    calibrationDueDate: str(cal.calibrationDueDate).slice(0, 10),
    dimensionalData,
    mockTrial: {
      ...createEmptyMockTrialSlot(),
      savedSections: mockTrialSaved,
    },
  };
}

export const CASING_FORM_STEP_COUNT = 5;

const validateIdentification = (form: RocketMotorCasingFormData): string | null => {
  if (!form.projectId.trim()) return "Project is required.";
  if (!form.motorStageApi.trim()) return "Motor stage is required.";
  if (!form.motorId.trim()) return "Motor ID is required.";
  return null;
};

const validateReceiptAndInsulation = (form: RocketMotorCasingFormData): string | null => {
  if (!form.receivingDate.trim()) return "Receiving date is required.";
  if (!form.itemsDimension.trim()) return "Rubber sheet dimension is required.";
  if (!form.greenCardNo.trim()) return "Green card no. is required.";
  if (!form.insulationReportNo.trim()) return "Insulation report no. is required.";

  const mechKeys = form.insulationType === "EPDM" ? EPDM_MECH_KEYS : ROCASIN_MECH_KEYS;
  for (const k of mechKeys) {
    const row = form.mechanicalProperties[k.paramKey];
    if (!String(row?.reported ?? "").trim()) return `${k.paramName} (reported) is required.`;
  }

  return null;
};

/** Validates the current wizard step before moving forward (steps 0–4). */
export function validateCasingFormStep(form: RocketMotorCasingFormData, step: number): string | null {
  switch (step) {
    case 0:
      return validateIdentification(form);
    case 1:
    case 2:
    case 3:
      return null;
    case 4:
      return null;
    default:
      return null;
  }
}

export function isCasingIdentificationComplete(form: RocketMotorCasingFormData): boolean {
  return validateIdentification(form) === null;
}

export function canSaveCasingDraft(form: RocketMotorCasingFormData): boolean {
  return isCasingIdentificationComplete(form);
}

export function isCasingFormComplete(form: RocketMotorCasingFormData): boolean {
  for (let step = 0; step < CASING_FORM_STEP_COUNT; step += 1) {
    const err = validateCasingFormStep(form, step);
    if (err) return false;
  }
  return validateCasingFormForSubmit(form, "SUBMIT") === null;
}

export function validateCasingFormForSubmit(
  form: RocketMotorCasingFormData,
  intent: FormSubmissionType
): string | null {
  const identificationErr = validateIdentification(form);
  if (identificationErr) return identificationErr;

  if (intent === "DRAFT") return null;

  const receiptErr = validateReceiptAndInsulation(form);
  if (receiptErr) return receiptErr;
  if (!form.weightWithoutHarness.trim() || !form.weightWithHarness.trim()) {
    return "Weighment values are required.";
  }
  if (form.dimensionalData.length === 0) {
    return "Dimensional inspection parameters are required for the selected motor stage.";
  }
  return null;
}

export function serializeCasingForm(form: RocketMotorCasingFormData): string {
  return JSON.stringify({
    ...form,
    insulationReportFile: form.insulationReportFile?.name ?? null,
    insulationReportExisting: form.insulationReportExisting?.fileName ?? null,
    visualInspection: form.visualInspection.map((v) => ({
      ...v,
      mediaFile: v.mediaFile?.name ?? null,
      mediaExisting: v.mediaExisting?.fileName ?? null,
    })),
    mockTrial: {
      schema: null,
      schemaLoading: false,
      schemaError: form.mockTrial.schemaError,
      formValues: form.mockTrial.formValues,
      savedSections: form.mockTrial.savedSections,
    },
  });
}
