import type {
  SchemaDocumentV2,
  SchemaFormValues,
  SchemaSectionSubmission,
} from "../../../schema-engine";
import { STRINGS } from "../../../app/config/strings";
import type { CasePrepDetailSection, CasePrepDetailTable } from "./CasePreparationFormModel";
import {
  mapCastingCuringPersonLabel,
  parseCastingCuringSectionData,
} from "./CastingCuringFormModel";
import {
  hasSubscaleStructuredApiPayload,
  mapSubscaleApiDetailsToFormValues,
  mapSubscaleFormValuesToApiPayload,
  normalizeSubscaleApiDetailsPayload,
  parseSubscaleDetailsApiResponse,
  resolveSubscaleApiSectionsForDisplay,
  type SubscaleApiPayloadBody,
  type SubscaleDetailsResponse,
} from "./subscaleApiPayloadMapper";
import { SUBSCALE_BATCH_FIELDS } from "../../../hooks/user/manufacturing/subscaleBatchConfig";
import { stableStringify } from "../../../utils/workflowFormSnapshot";

const SS = STRINGS.MANUFACTURING.SUBSCALE;
const HW = SS.HARDWARE;

const SUBSCALE_SECTION_LABELS: Record<string, string> = {
  SUBSCALE_DETAILS: "General Batch Information",
  HARDWARE_PREPARATION_DETAILS: HW.PREPARATION_TITLE,
  CASTING_DETAILS: "Casting Details",
  CURING_DETAILS: "Curing Details",
  NDT_DETAILS: "NDT Details",
  TRIMMING_DETAILS: "Trimming Details",
  INHIBITION_DETAILS: "Inhibition Details",
  STATIC_TESTING: "Static Testing Of BEM",
  MECHANICAL_INTERFACE_PROPERTIES: "Mechanical Interface Properties",
};

const SUBSCALE_FIELD_LABELS: Record<string, string> = {
  BATCH_SIZE: "Batch Size (KG)",
  MIXER_BLDG_NO: "Bldg No.",
  MIXER_TYPE: "Mixer Type",
  PREMIX_DATE: "Premix Date",
  FINAL_MIX_DATE: "Final Mix Date",
  NO_OF_40KG_BEMS: "No. of 40 kg BEMs",
  NO_OF_10KG_BEMS: "Number of 10 kg BEMs",
  NO_OF_2KG_BEMS: "Number of 2 kg BEMs",
  NO_OF_WHEEL_PEEL: "No. of Wheel Peel",
  NO_OF_SBS_TBS: "No. of SBS/TBS",
  NO_OF_CARTOONS: "No of Cartoons",
  LINER_TYPE: "Liner Type",
  LINER_BATCH_NO: "Batch No.",
  LINER_BATCH_DATE: "Batch Date",
  DATE_OF_CASTING: "Date of Casting",
  IR_BATCH_NO: "IR Batch No",
  DATE_OF_MANUFACTURING: "Date Of Manufacturing",
  DATE_OF_APPLICATION: "Date of Application",
  MOTOR_STAGE: "Motor Stage",
  MIXING_CYCLE_CODE: "Mixing Cycle Code",
  MIXING_CYCLE_NAME: "Mixing Cycle Name",
  MIXING_CYCLE_ID: "Mixing Cycle ID",
};

const SUBSCALE_TABLE_LABELS: Record<string, string> = {
  ARTICLE_TYPE_TABLE: "Article Type",
  CASTING_TABLE: "Casting Table",
  CURING_TABLE: "Curing Table",
  NDT_TABLE: "NDT Table",
  TRIMMING_TABLE: "Trimming Table",
  INHIBITION_TABLE: "Inhibition Table",
  STATIC_TESTING_TABLE: "Static Testing Table",
  MECHANICAL_PROPERTIES_TABLE: "Mechanical Interface Properties Table",
  PREMIX_PARTICULARS: "Premix Cycle Process Particulars",
  FINAL_MIX_PARTICULARS: "Final Mix Cycle Process Particulars",
  SUBSCALE_MIXING_CYCLES: "Mixing Cycle",
};

const SUBSCALE_COLUMN_LABELS: Record<string, string> = {
  SR_NO: "Sr No",
  ARTICLE_TYPE: "Article Type",
  RUBBER_MATERIAL: "Rubber Material (EPDM/NBR)",
  SLEEVE_NO: "Sleeve No.",
  MOULD_NO: "Mould No.",
  SIZE_MM: "Size (mm)",
  THICKNESS_MM: "Thickness (mm)",
  LINER_APPLIED: "Liner Applied Quantity (Gms)",
  OBSERVATIONS: "Observations",
  BEM_MOULD_NO: "BEM Mould No",
  CASTING_PIT_NO: "Casting Pit No",
  CASTING_START_TIME: "Start Time",
  CASTING_END_TIME: "End Time",
  VACUUM_LEVEL: "Vacuum Level",
  REMARKS: "Remarks",
  CURING_START_DATE: "Curing Start Date",
  CURING_END_DATE: "Curing End Date",
  OVEN_NO: "Oven No",
  TEMPERATURE: "Temperature (°C)",
  HARDNESS: "Hardness",
  DECORING_DATE: "Decoring Date",
  DECORING_LOAD: "Decoring Load",
  GRAIN_SURFACE_OBSERVATIONS: "Grain Surface Obs.",
  BEM_NO: "BEM No",
  DATE_OF_NDT: "Date of NDT",
  HE_OD: "HE Side OD",
  HE_PORT_INNER: "HE Port Inner",
  HE_PORT_OUTER: "HE Port Outer",
  HE_BEFORE_INHIBITION_INNER: "HE Before Inhib. In",
  HE_BEFORE_INHIBITION_OUTER: "HE Before Inhib. Out",
  NE_OD: "NE Side OD",
  NE_PORT_INNER: "NE Port Inner",
  NE_PORT_OUTER: "NE Port Outer",
  NE_WEB_INNER: "NE Web Inner",
  NE_WEB_OUTER: "NE Web Outer",
  LENGTH_BEFORE_INHIBITION: "Length Before Inhib.",
  LINER_COATED_SLEEVE_WEIGHT: "Liner Coated Sleeve Wt (A)",
  WEIGHT_BEFORE_INHIBITION: "Wt Before Inhib. (B)",
  WEIGHT_AFTER_INHIBITION: "Wt After Inhib.",
  IR_APPLIED_WEIGHT: "Wt Of IR Applied",
  PROPELLANT_WEIGHT: "Propellant Wt (C-B-A)",
  PROPELLANT_MASS: "Prop Mass",
  DT: "Dt",
  WEB_THICKNESS: "Web Thk",
  N_VALUE: "n Value",
  PRESSURE_AVG: "Pr Avg",
  THRUST_AVG: "Th Avg",
  BURN_RATE: "Burn Rate",
  GRAPH_FILE: "Graph",
  GRAPH_UPLOAD: "Graph",
  TS: "TS",
  ELONGATION: "Elong",
  MODULUS: "Modulus",
  SBS: "SBS",
  TBS: "TBS",
  PEEL_STRENGTH: "Peel Strength",
  DENSITY: "Density",
  ACTOR: "Actor",
  OPERATION: "Operation",
  RPM: "RPM",
  TIME: "Time",
  TEMP: "Temp",
  VACUUM: "Vacuum",
};

/** Canonical column order so details tables always show the full schema, even when API sends nulls. */
const SUBSCALE_TABLE_COLUMNS: Record<string, string[]> = {
  ARTICLE_TYPE_TABLE: [
    "SR_NO",
    "ARTICLE_TYPE",
    "RUBBER_MATERIAL",
    "SLEEVE_NO",
    "MOULD_NO",
    "SIZE_MM",
    "THICKNESS_MM",
    "LINER_APPLIED",
    "OBSERVATIONS",
  ],
  CASTING_TABLE: [
    "SR_NO",
    "ARTICLE_TYPE",
    "BEM_MOULD_NO",
    "CASTING_PIT_NO",
    "CASTING_START_TIME",
    "CASTING_END_TIME",
    "VACUUM_LEVEL",
    "REMARKS",
  ],
  CURING_TABLE: [
    "SR_NO",
    "ARTICLE_TYPE",
    "BEM_MOULD_NO",
    "CURING_START_DATE",
    "CURING_END_DATE",
    "OVEN_NO",
    "TEMPERATURE",
    "HARDNESS",
    "DECORING_DATE",
    "DECORING_LOAD",
    "GRAIN_SURFACE_OBSERVATIONS",
  ],
  NDT_TABLE: ["SR_NO", "ARTICLE_TYPE", "BEM_NO", "DATE_OF_NDT", "OBSERVATIONS"],
  TRIMMING_TABLE: [
    "SR_NO",
    "ARTICLE_TYPE",
    "BEM_NO",
    "HE_OD",
    "HE_PORT_INNER",
    "HE_PORT_OUTER",
    "HE_BEFORE_INHIBITION_INNER",
    "HE_BEFORE_INHIBITION_OUTER",
    "NE_OD",
    "NE_PORT_INNER",
    "NE_PORT_OUTER",
    "NE_WEB_INNER",
    "NE_WEB_OUTER",
    "LENGTH_BEFORE_INHIBITION",
  ],
  INHIBITION_TABLE: [
    "SR_NO",
    "ARTICLE_TYPE",
    "BEM_NO",
    "LINER_COATED_SLEEVE_WEIGHT",
    "WEIGHT_BEFORE_INHIBITION",
    "WEIGHT_AFTER_INHIBITION",
    "IR_APPLIED_WEIGHT",
    "PROPELLANT_WEIGHT",
    "DATE_OF_APPLICATION",
    "REMARKS",
  ],
  STATIC_TESTING_TABLE: [
    "SR_NO",
    "ARTICLE_TYPE",
    "BEM_NO",
    "PROPELLANT_MASS",
    "DT",
    "WEB_THICKNESS",
    "N_VALUE",
    "PRESSURE_AVG",
    "THRUST_AVG",
    "BURN_RATE",
    "GRAPH_FILE",
  ],
  MECHANICAL_PROPERTIES_TABLE: [
    "SR_NO",
    "ARTICLE_TYPE",
    "BEM_NO",
    "TS",
    "ELONGATION",
    "MODULUS",
    "SBS",
    "TBS",
    "PEEL_STRENGTH",
    "DENSITY",
    "ACTOR",
  ],
  PREMIX_PARTICULARS: ["SR_NO", "OPERATION", "RPM", "TIME", "TEMP", "VACUUM"],
  FINAL_MIX_PARTICULARS: ["SR_NO", "OPERATION", "RPM", "TIME", "TEMP", "VACUUM"],
};

const resolveSubscaleTableColumnKey = (blockId: string) =>
  blockId.replace(/\s+\d+$/, "").replace(/\s*\(\d+\)$/, "");

const ensureSubscaleTableColumns = (table: CasePrepDetailTable): CasePrepDetailTable => {
  const baseId = resolveSubscaleTableColumnKey(table.blockId);
  const canonical = SUBSCALE_TABLE_COLUMNS[baseId];
  if (!canonical?.length) {
    return {
      ...table,
      label: SUBSCALE_TABLE_LABELS[baseId] ?? table.label,
      columnLabels: Object.fromEntries(
        Object.keys(table.columnLabels).map((column) => [
          column,
          SUBSCALE_COLUMN_LABELS[column] ?? table.columnLabels[column],
        ]),
      ),
    };
  }

  const rows = table.rows.map((row) => {
    const next: Record<string, unknown> = { ...row };
    canonical.forEach((column) => {
      if (next[column] === undefined || next[column] === null) next[column] = "";
    });
    return next;
  });

  return {
    ...table,
    label: SUBSCALE_TABLE_LABELS[baseId] ?? table.label,
    rows,
    columnLabels: Object.fromEntries(
      canonical.map((column) => [column, SUBSCALE_COLUMN_LABELS[column] ?? column]),
    ),
  };
};

export type SubscaleDetailView = {
  formId: string;
  batchId: string;
  batchType: string;
  status?: string;
  createdBy: string | null;
  createdAt: string | null;
  submittedBy: string | null;
  submittedAt: string | null;
  lastUpdatedBy: string | null;
  lastUpdatedAt: string | null;
  sections: CasePrepDetailSection[];
};

const parseSubscaleDisplaySections = (
  sections: unknown,
  payload?: Record<string, unknown>,
): CasePrepDetailSection[] =>
  resolveSubscaleApiSectionsForDisplay(sections, payload)
    .map((section) => {
      const parsed = parseCastingCuringSectionData(
        section.sectionId,
        section.sectionData as Record<string, unknown>[],
      );
      return {
        ...parsed,
        label: SUBSCALE_SECTION_LABELS[section.sectionId] ?? parsed.label,
        fields: parsed.fields.map((field) => ({
          ...field,
          label: SUBSCALE_FIELD_LABELS[field.key.split(".").pop() ?? ""] ?? field.label,
        })),
        tables: parsed.tables.map((table) => ensureSubscaleTableColumns(table)),
      };
    })
    .filter((section) => section.fields.length > 0 || section.tables.length > 0);

export const mapSubscaleDetailsForDisplay = (
  data: SubscaleDetailsResponse | Record<string, unknown> | null | undefined,
): SubscaleDetailView | null => {
  if (!data) return null;

  const payload =
    "subscaleProcessingId" in data || "subscaleDetails" in data
      ? (data as SubscaleDetailsResponse)
      : parseSubscaleDetailsApiResponse(data);

  const sectionsInput = Array.isArray(payload.sections) ? undefined : payload.sections;

  return {
    formId: String(payload.subscaleProcessingId ?? payload.formId ?? ""),
    batchId: String(payload.batchId ?? ""),
    batchType: String(payload.batchType ?? ""),
    status: payload.status != null ? String(payload.status) : undefined,
    createdBy: mapCastingCuringPersonLabel(payload.createdBy),
    createdAt: payload.createdAt != null ? String(payload.createdAt) : null,
    submittedBy: mapCastingCuringPersonLabel(payload.submittedBy),
    submittedAt: payload.submittedAt != null ? String(payload.submittedAt) : null,
    lastUpdatedBy: mapCastingCuringPersonLabel(payload.lastUpdatedBy),
    lastUpdatedAt: payload.lastUpdatedAt != null ? String(payload.lastUpdatedAt) : null,
    sections: parseSubscaleDisplaySections(sectionsInput, payload as Record<string, unknown>),
  };
};

export const createSubscaleData = () => ({
  schemaFormLoaded: false,
  subscaleSchema: null as SchemaDocumentV2 | null,
  schemaFormValues: {
    NO_OF_40KG_BEMS: "",
    NO_OF_10KG_BEMS: "",
    NO_OF_2KG_BEMS: "",
    NO_OF_WHEEL_PEEL: "",
    NO_OF_SBS_TBS: "",
    NO_OF_CARTOONS: "",
    LINER_TYPE: "",
    LINER_BATCH_NO: "",
    LINER_BATCH_DATE: "",
    ARTICLE_TYPE_TABLE: [],
    CASTING_TABLE: [],
    CURING_TABLE: [],
    NDT_TABLE: [],
    TRIMMING_TABLE: [],
    INHIBITION_TABLE: [],
    STATIC_TESTING_TABLE: [],
    MECHANICAL_PROPERTIES_TABLE: [],
    SUBSCALE_MIXING_CYCLES: [],
  },
  savedSections: undefined as SchemaSectionSubmission[] | undefined,
});

export type SubscaleFormState = ReturnType<typeof createSubscaleData>;

export type SubscaleDetails = SubscaleDetailsResponse;

export type SubscaleFormBody = SubscaleApiPayloadBody;

export const createDefaultSubscaleFormState = (): SubscaleFormState => createSubscaleData();

export const hydrateSubscaleFormState = (
  state: SubscaleFormState,
  schema: SchemaDocumentV2,
): SubscaleFormState => {
  const hasSavedValues = Object.keys(state.schemaFormValues ?? {}).length > 0;

  return {
    ...state,
    subscaleSchema: schema,
    schemaFormValues: hasSavedValues ? state.schemaFormValues : {},
  };
};

export const mapSubscaleDetailsToFormState = (
  details: Partial<SubscaleDetails>,
): SubscaleFormState => {
  const defaults = createDefaultSubscaleFormState();
  const payload = normalizeSubscaleApiDetailsPayload(details as Record<string, unknown>);

  const hasStructuredApiPayload = hasSubscaleStructuredApiPayload(payload);
  const schemaFormValues = hasStructuredApiPayload
    ? mapSubscaleApiDetailsToFormValues(payload)
    : {};

  const rawSections = (details as Record<string, unknown>).sections;
  const savedSections =
    hasStructuredApiPayload || !Array.isArray(rawSections)
      ? undefined
      : (rawSections as SchemaSectionSubmission[]);

  return {
    ...defaults,
    schemaFormLoaded: hasStructuredApiPayload || Boolean(savedSections?.length),
    schemaFormValues,
    savedSections,
  };
};

export const mapSubscaleFormStateToPayload = (
  formState: SubscaleFormState,
  batchType?: string | null,
): SubscaleApiPayloadBody =>
  mapSubscaleFormValuesToApiPayload(formState.schemaFormValues || {}, batchType);

/** Stable API payload snapshot for dirty tracking (baseline from details vs current edits). */
export const buildSubscalePayloadSnapshot = (
  formState: SubscaleFormState,
  batchType?: string | null,
): string => stableStringify(mapSubscaleFormStateToPayload(formState, batchType));

export const hasAnySubscaleValue = (form: SubscaleFormState) => {
  const values = form.schemaFormValues ?? {};
  return Object.entries(values).some(([key, value]) => {
    if (key.startsWith("_")) return false;
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "number" || typeof value === "boolean") return true;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value as object).length > 0;
    return false;
  });
};

export class SubscaleSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;
  batchStatus: string;
  formSubmissionType: string;

  constructor(data: any = {}) {
    const payload = data?.data ?? data;
    this.formId = String(payload?.formId ?? payload?.subscaleProcessingId ?? "");
    this.batchId = String(payload?.batchId ?? "");
    this.status = String(payload?.formStatus ?? payload?.status ?? "");
    this.batchStatus = String(payload?.batchStatus ?? payload?.batchStageStatus ?? "");
    this.formSubmissionType = String(payload?.formSubmissionType ?? "");
  }

  static fromApi(data: any) {
    return new SubscaleSubmitResponseModel(data);
  }
}

export class SubscaleDetailsModel {
  static fromApi(data: unknown): SubscaleDetailsResponse {
    return parseSubscaleDetailsApiResponse(data);
  }
}
