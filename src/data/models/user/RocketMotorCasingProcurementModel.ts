import { INITIAL_ROCKET_FORM, RocketFormData, type RocketMotorBatch } from "../../../hooks/user/sourcing/sourcingWorkflowData";
import { OPERATION_STATUS, type OperationStatus } from "../../../hooks/operationStatus";
import {
  EPDM_MECH_KEYS,
  isLooseFlapDimensionalParam,
  parseSectionsToFormData,
  ROCASIN_MECH_KEYS,
  THERMAL_PROP_KEYS,
  type RocketMotorCasingFormData,
} from "./RocketMotorCasingFormModel";
import type { SchemaSectionSubmission } from "../../../schemaManagement/models/schema.types";

/** Soft-delete is allowed only while the casing form is still in progress (draft). */
export const canDeleteRocketMotorCasing = (status: string | null | undefined) =>
  status === OPERATION_STATUS.IN_PROGRESS;

export type RocketMotorCasingDeletePayload = {
  motorCasingId: string;
};

export type RocketMotorCasingDeleteResponse = {
  motorCasingId: string;
  status: string;
};

export type { RocketMotorCasingFormData, RocketMotorCasingFormPayload } from "./RocketMotorCasingFormModel";
export {
  buildCasingFormPayload,
  parseSectionsToFormData,
  INITIAL_ROCKET_MOTOR_CASING_FORM,
  validateCasingFormForSubmit,
  validateCasingFormStep,
  isCasingFormComplete,
  canSaveCasingDraft,
  CASING_FORM_STEP_COUNT,
  serializeCasingForm,
  dimensionalRowFromParameter,
  normalizeDimensionalRow,
  createInitialMechanicalProperties,
  createInitialVisualInspection,
  ROCASIN_MECH_KEYS,
  EPDM_MECH_KEYS,
  THERMAL_PROP_KEYS,
} from "./RocketMotorCasingFormModel";

type DimensionalRow = {
  paramId?: string;
  paramName?: string;
  referenceRange?: {
    minValue: number | null;
    maxValue: number | null;
    unit: string | null;
  };
  tb?: string | null;
  rl?: string | null;
  tlbr?: string | null;
  trbl?: string | null;
  remarks?: string;
  status?: string | null;
};

const OPERATION_STATUS_VALUES = Object.values(OPERATION_STATUS) as OperationStatus[];

/** API status enum → UI status labels */
export function normalizeRocketCasingListStatus(status: string): OperationStatus {
  const u = String(status ?? "").toUpperCase();
  const map: Record<string, OperationStatus> = {
    INITIATED: OPERATION_STATUS.INITIATED,
    IN_PROGRESS: OPERATION_STATUS.IN_PROGRESS,
    WAITING_FOR_APPROVAL: OPERATION_STATUS.WAITING_FOR_APPROVAL,
    APPROVED: OPERATION_STATUS.APPROVED,
    REJECTED: OPERATION_STATUS.REJECTED,
  };
  const fromApiKey = map[u];
  if (fromApiKey) return fromApiKey;
  const trimmed = String(status ?? "").trim();
  if (OPERATION_STATUS_VALUES.includes(trimmed as OperationStatus)) {
    return trimmed as OperationStatus;
  }
  return OPERATION_STATUS.INITIATED;
}

/** Column keys searched by the rocket motor casing list search bar */
export const ROCKET_MOTOR_CASING_SEARCH_FIELDS = [
  "motorCasingId",
  "projectId",
  "motorId",
  "motorStage",
  "casingType",
  "insulationType",
  "createdBy.fullName",
  "createdBy.id",
  "createdOn",
  "rmStatus",
] as const;

/** Match list row against free-text search across all visible table columns */
export function rocketMotorCasingMatchesSearch(row: RocketMotorBatch, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const parts: string[] = [
    row.motorCasingId ?? "",
    row.projectId ?? "",
    row.motorId,
    row.motorNo ?? "",
    row.motorStage ?? "",
    row.casingType ?? "",
    row.insulationType ?? "",
    row.rmStatus,
    row.createdBy?.fullName ?? "",
    row.createdBy?.id ?? "",
    row.assignedTo?.fullName ?? "",
  ];

  if (row.createdOn) {
    parts.push(row.createdOn);
    const d = new Date(row.createdOn);
    if (!Number.isNaN(d.getTime())) {
      parts.push(
        d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
      );
    }
  }

  return parts.some((part) => String(part).toLowerCase().includes(q));
}

export class RocketMotorCasingSubmitResponseModel {
  formId: string;
  procurementId: string;
  motorCasingId: string;
  status: string;
  nextStep: string;
  /** Legacy alias used by older UI */
  batchId: string;

  constructor(payload: {
    formId?: string;
    procurementId?: string;
    motorCasingId?: string;
    status?: string;
    nextStep?: string;
  }) {
    this.formId = payload?.formId ?? "";
    this.procurementId = payload?.procurementId ?? "";
    this.motorCasingId = payload?.motorCasingId ?? "";
    this.status = payload?.status ?? "";
    this.nextStep = payload?.nextStep ?? "";
    this.batchId = payload?.procurementId || payload?.formId || "";
  }

  static fromApi(apiResponse: any): RocketMotorCasingSubmitResponseModel {
    return new RocketMotorCasingSubmitResponseModel(apiResponse?.data ?? {});
  }
}

export class RocketMotorCasingDetailsModel {
  formId: string;
  projectId: string;
  subDepartmentId: number;
  motorStage: string;
  motorId: string;
  /** @deprecated API alias — same as motorId */
  motorNo: string;
  motorCasingId: string;
  status: string;
  sections: Record<string, unknown>;

  constructor(payload: any) {
    this.formId = String(payload?.formId ?? "");
    this.projectId = String(payload?.projectId ?? "");
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.motorStage = String(payload?.motorStage ?? "");
    this.motorId = String(payload?.motorId ?? payload?.motorNo ?? "");
    this.motorNo = this.motorId;
    this.motorCasingId = String(payload?.motorCasingId ?? "");
    this.status = String(payload?.status ?? "");
    this.sections = (payload?.sections && typeof payload.sections === "object" ? payload.sections : {}) as Record<
      string,
      unknown
    >;
  }

  static fromApi(apiResponse: any): RocketMotorCasingDetailsModel {
    return new RocketMotorCasingDetailsModel(apiResponse?.data ?? {});
  }

  static toFormData(model: RocketMotorCasingDetailsModel): RocketFormData {
    return mergeApiSectionsIntoFormData(model.sections, {
      motorStage: model.motorStage,
      motorId: model.motorId,
      motorCasingId: model.motorCasingId,
    });
  }

  static toCasingFormData(model: RocketMotorCasingDetailsModel): RocketMotorCasingFormData {
    return parseSectionsToFormData(model.sections, {
      projectId: model.projectId,
      motorStage: model.motorStage,
      motorId: model.motorId,
      motorCasingId: model.motorCasingId,
    });
  }

  static toDetailBlocks(model: RocketMotorCasingDetailsModel): CasingDetailBlock[] {
    return mapCasingFormDataToDetailBlocks(RocketMotorCasingDetailsModel.toCasingFormData(model));
  }
}

const parseNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

const firstMech = (sections: Record<string, unknown>, name: string) => {
  const mr = sections.motorReceipt as Record<string, unknown> | undefined;
  const ins = mr?.insulation as Record<string, unknown> | undefined;
  const arr = ins?.mechanicalProperties as Array<Record<string, unknown>> | undefined;
  const row = (arr ?? []).find((r) => String(r?.paramName ?? "").toLowerCase().includes(name.toLowerCase()));
  return row;
};

export function mergeApiSectionsIntoFormData(
  sections: Record<string, unknown>,
  ids: { motorStage?: string; motorId?: string; motorCasingId?: string }
): RocketFormData {
  const mr = (sections.motorReceipt ?? {}) as Record<string, unknown>;
  const items = (mr.itemsReceived ?? {}) as Record<string, unknown>;
  const clear = (mr.clearances ?? {}) as Record<string, unknown>;
  const ins = (mr.insulation ?? {}) as Record<string, unknown>;
  const thermal = (ins.thermalProperties ?? {}) as Record<string, unknown>;
  const tc = (thermal.thermalConductivity ?? {}) as Record<string, unknown>;
  const ar = (thermal.ablationRate ?? {}) as Record<string, unknown>;

  const ts = firstMech(sections, "tensile");
  const el = firstMech(sections, "elongation");

  const dimApi = Array.isArray(sections.dimensionalInspection) ? sections.dimensionalInspection : [];
  const dimensionalData: DimensionalRow[] = dimApi.map((d: any) => ({
    paramId: String(d?.paramId ?? ""),
    paramName: "",
    tb: d?.recordedValue != null ? String(d.recordedValue) : "",
    rl: "",
    tlbr: "",
    trbl: "",
    remarks: d?.isWithinRange === false ? "Out of range" : "",
    referenceRange: { minValue: null, maxValue: null, unit: d?.unit ?? null },
  }));

  const wm = (sections.weightment ?? {}) as Record<string, unknown>;
  const wwh = (wm.weightWithoutHarness ?? {}) as Record<string, unknown>;
  const wwh2 = (wm.weightWithHarness ?? {}) as Record<string, unknown>;

  const visual = Array.isArray(sections.visualInspection) ? sections.visualInspection : [];
  const firstVis = visual[0] as Record<string, unknown> | undefined;
  const mediaRef = firstVis?.media != null ? String(firstVis.media) : null;

  return {
    ...INITIAL_ROCKET_FORM,
    motorCasingId: ids.motorCasingId ?? "",
    motorStageApi: ids.motorStage ?? "",
    motorNoApi: ids.motorId ?? "",
    casingType: String(mr.casingType ?? "COMPOSITE"),
    receivingDate: String(mr.receivingDate ?? "").slice(0, 10),
    itemsDescription: String(items.description ?? ""),
    itemsDimension: String(items.dimension ?? ""),
    itemsUnit: String(items.unit ?? "mm"),
    greenCardNo: String(clear.greenCardNo ?? ""),
    clearanceAuthority: String(clear.authority ?? ""),
    clearanceStatus: String(clear.status ?? "RECEIVED"),
    insulationType: String(ins.type ?? "ROCASIN"),
    insulationReportNo: String(ins.reportNo ?? ""),
    weightWithoutHarness: wwh.value != null ? String(wwh.value) : "",
    weightWithHarness: wwh2.value != null ? String(wwh2.value) : "",
    calibrationRef: String(wm.calibrationRef ?? ""),
    motorIdDetails: String(items.description ?? INITIAL_ROCKET_FORM.motorIdDetails),
    motorIdRemarks: INITIAL_ROCKET_FORM.motorIdRemarks,
    motorClearanceDetails: String(clear.greenCardNo ?? INITIAL_ROCKET_FORM.motorClearanceDetails),
    motorClearanceRemarks: INITIAL_ROCKET_FORM.motorClearanceRemarks,
    tensileStrengthDetails: ts?.reported != null ? String(ts.reported) : INITIAL_ROCKET_FORM.tensileStrengthDetails,
    tensileStrengthRemarks: ts?.acem != null ? String(ts.acem) : INITIAL_ROCKET_FORM.tensileStrengthRemarks,
    elongationDetails: el?.reported != null ? String(el.reported) : INITIAL_ROCKET_FORM.elongationDetails,
    elongationRemarks: el?.acem != null ? String(el.acem) : INITIAL_ROCKET_FORM.elongationRemarks,
    erosionRateDetails: ar.value != null ? String(ar.value) : INITIAL_ROCKET_FORM.erosionRateDetails,
    erosionRateRemarks: String(ar.unit ?? INITIAL_ROCKET_FORM.erosionRateRemarks),
    thermalConductivityDetails: tc.value != null ? String(tc.value) : INITIAL_ROCKET_FORM.thermalConductivityDetails,
    thermalConductivityRemarks: String(tc.unit ?? INITIAL_ROCKET_FORM.thermalConductivityRemarks),
    utNdtDetails: INITIAL_ROCKET_FORM.utNdtDetails,
    utNdtRemarks: INITIAL_ROCKET_FORM.utNdtRemarks,
    waiversDetails: firstVis?.observation != null ? String(firstVis.observation) : INITIAL_ROCKET_FORM.waiversDetails,
    waiversRemarks: firstVis?.desc != null ? String(firstVis.desc) : INITIAL_ROCKET_FORM.waiversRemarks,
    mediaFilePath: mediaRef ?? INITIAL_ROCKET_FORM.mediaFilePath,
    dimensionalData,
  };
}

function mechanicalRowsFromForm(form: RocketFormData): Array<{ paramName: string; reported: number; acem: number; unit: string }> {
  const rows: Array<{ paramName: string; reported: number; acem: number; unit: string }> = [];
  const ts = parseNum(form.tensileStrengthDetails);
  const tsA = parseNum(form.tensileStrengthRemarks);
  if (ts != null) {
    rows.push({
      paramName: "Tensile strength",
      reported: ts,
      acem: tsA ?? ts,
      unit: "ksc",
    });
  }
  const el = parseNum(form.elongationDetails);
  const elA = parseNum(form.elongationRemarks);
  if (el != null) {
    rows.push({
      paramName: "Elongation",
      reported: el,
      acem: elA ?? el,
      unit: "%",
    });
  }
  return rows;
}

export function buildRocketMotorCasingSectionsPayload(
  formData: RocketFormData,
  dimensionalParameters: Array<{ paramId?: string; paramName?: string; referenceRange?: { unit?: string | null } }>,
  options?: { includeVisualInspection?: boolean }
): Record<string, unknown> {
  const casingType = (formData.casingType || "COMPOSITE").toUpperCase();
  const receivingDate =
    (formData.receivingDate || "").trim() || new Date().toISOString().slice(0, 10);
  const itemsDescription = (formData.itemsDescription || formData.motorIdDetails || "").trim() || "—";
  const itemsDimension = (formData.itemsDimension || "—").trim();
  const itemsUnit = (formData.itemsUnit || "mm").trim();

  const greenCardNo = (formData.greenCardNo || formData.motorClearanceDetails || "").trim() || "—";
  const authority = (formData.clearanceAuthority || "—").trim();
  const clearanceStatus = (formData.clearanceStatus || "RECEIVED").toUpperCase();

  const insulationType = (formData.insulationType || "ROCASIN").toUpperCase();
  const reportNo = (formData.insulationReportNo || "—").trim();

  const tcVal = parseNum(formData.thermalConductivityDetails) ?? 0;
  const tcUnit = (formData.thermalConductivityRemarks || "cal/cm/s/K").trim() || "cal/cm/s/K";
  const arVal = parseNum(formData.erosionRateDetails) ?? 0;
  const arUnit = (formData.erosionRateRemarks || "mm/s @ 300W/cm2").trim() || "mm/s @ 300W/cm2";

  const w1 = parseNum(formData.weightWithoutHarness) ?? 0;
  const w2 = parseNum(formData.weightWithHarness) ?? 0;

  const dimensionalInspection = (formData.dimensionalData ?? []).map((row: any, idx: number) => {
    const param = dimensionalParameters[idx];
    const paramId = String(row?.paramId || param?.paramId || `DIM-${idx + 1}`);
    const vals = [parseNum(row?.tb), parseNum(row?.rl), parseNum(row?.tlbr), parseNum(row?.trbl)].filter(
      (n): n is number => n != null
    );
    const recordedValue = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const unit = String(row?.referenceRange?.unit || param?.referenceRange?.unit || "mm");
    return {
      paramId,
      recordedValue,
      unit,
      isWithinRange: true,
    };
  });

  const mechanical = mechanicalRowsFromForm(formData);

  const motorReceipt = {
    casingType,
    receivingDate,
    itemsReceived: {
      description: itemsDescription,
      dimension: itemsDimension,
      unit: itemsUnit,
    },
    clearances: {
      greenCardNo,
      authority,
      status: clearanceStatus,
    },
    insulation: {
      type: insulationType,
      reportNo,
      ...(mechanical.length > 0 ? { mechanicalProperties: mechanical } : {}),
      thermalProperties: {
        thermalConductivity: { value: tcVal, unit: tcUnit },
        ablationRate: { value: arVal, unit: arUnit },
      },
    },
  };

  const weightment: Record<string, unknown> = {
    weightWithoutHarness: { value: w1, unit: "kg" },
    weightWithHarness: { value: w2, unit: "kg" },
  };
  const cal = (formData.calibrationRef || "").trim();
  if (cal) weightment.calibrationRef = cal;

  const sections: Record<string, unknown> = {
    motorReceipt,
    dimensionalInspection,
    weightment,
  };

  if (options?.includeVisualInspection) {
    const desc = (formData.waiversRemarks || "").trim() || "Visual inspection";
    const obs = (formData.waiversDetails || "").trim() || "—";
    const media =
      typeof formData.mediaFilePath === "string" && formData.mediaFilePath.trim()
        ? formData.mediaFilePath.trim()
        : formData.mediaFilePath && typeof formData.mediaFilePath === "object" && "name" in formData.mediaFilePath
          ? (formData.mediaFilePath as File).name
          : "pending-media-upload";
    sections.visualInspection = [{ desc, observation: obs, media }];
  }

  return sections;
}

const toThreeDigit = (n: number) => String(n).padStart(3, "0");

const resolveParamId = (row: any, idx: number, motorType: string) => {
  if (row?.paramId) return row.paramId;
  if (!motorType) return `DIM-UNK-${toThreeDigit(idx + 1)}`;
  return `DIM-${motorType}-${toThreeDigit(idx + 1)}`;
};

/** @deprecated Prefer buildRocketMotorCasingSectionsPayload for API v1 */
export const mapRocketFormToCasingPayload = (formData: RocketFormData, motorType: string) => {
  const targetCount = formData?.dimensionalData?.length ?? 0;
  const dimensionalData = Array.from({ length: targetCount }, (_, idx) => {
    const row = formData?.dimensionalData?.[idx] ?? {};

    return {
      paramId: resolveParamId(row, idx, motorType),
      tb: row?.tb ?? "",
      rl: row?.rl ?? "",
      tlbr: row?.tlbr ?? "",
      trbl: row?.trbl ?? "",
      remarks: row?.remarks ?? "",
    };
  });

  return {
    motorIdDetails: formData.motorIdDetails ?? "",
    motorIdRemarks: formData.motorIdRemarks ?? "",
    motorClearanceDetails: formData.motorClearanceDetails ?? "",
    motorClearanceRemarks: formData.motorClearanceRemarks ?? "",
    tensileStrengthDetails: formData.tensileStrengthDetails ?? "",
    tensileStrengthRemarks: formData.tensileStrengthRemarks ?? "",
    elongationDetails: formData.elongationDetails ?? "",
    elongationRemarks: formData.elongationRemarks ?? "",
    erosionRateDetails: formData.erosionRateDetails ?? "",
    erosionRateRemarks: formData.erosionRateRemarks ?? "",
    thermalConductivityDetails: formData.thermalConductivityDetails ?? "",
    thermalConductivityRemarks: formData.thermalConductivityRemarks ?? "",
    utNdtDetails: formData.utNdtDetails ?? "",
    utNdtRemarks: formData.utNdtRemarks ?? "",
    waiversDetails: formData.waiversDetails ?? "",
    waiversRemarks: formData.waiversRemarks ?? "",
    mediaFilePath:
      formData.mediaFilePath && typeof formData.mediaFilePath !== "string"
        ? formData.mediaFilePath.name
        : formData.mediaFilePath ?? null,
    dimensionalData,
  };
};

export type CasingDetailColumn = { key: string; label: string; width?: string };

export type CasingDimensionalTableRow = {
  paramName: string;
  paramId: string;
  side: string;
  sequenceNo: number;
  specRange: string;
  readings: {
    r2tR2b: string;
    r1rR1l: string;
    tlBr: string;
    trBl: string;
  };
  looseFlap: { arcLength: string; axialLength: string };
  remarks: string;
  isLooseFlap: boolean;
};

export type CasingDetailBlock = {
  material: string;
  lotNo?: string;
  rows: Array<{ specification: string; analysedResult: string; remarks: string }>;
  _columns?: CasingDetailColumn[];
  /** When set, UI renders a multi-column dimensional readings table */
  dimensionalTable?: CasingDimensionalTableRow[];
};

export type RocketMotorCasingDetailsContext = {
  formId: string;
  projectId: string;
  motorCasingId: string;
  procurementId: string;
  motorStage: string;
  motorNo: string;
  casingType: string;
  insulationType: string;
  receivingDate: string;
  rmStatus: string;
  createdBy?: { fullName: string } | null;
  createdOn: string;
  rejectionReason?: string | null;
};

const CASING_DETAIL_COLS: CasingDetailColumn[] = [
  { key: "specification", label: "Section / Parameter", width: "35%" },
  { key: "analysedResult", label: "Details", width: "35%" },
  { key: "remarks", label: "Remarks", width: "30%" },
];

const detailRow = (specification: string, analysedResult: string, remarks = "—") => ({
  specification,
  analysedResult: analysedResult?.trim() ? analysedResult : "—",
  remarks: remarks?.trim() ? remarks : "—",
});

const formatSpecRange = (ref: RocketMotorCasingFormData["dimensionalData"][0]["referenceRange"]) => {
  const { minValue, maxValue, unit, source } = ref;
  const range =
    minValue != null || maxValue != null
      ? `${minValue ?? "—"} – ${maxValue ?? "—"}${unit ? ` ${unit}` : ""}`.trim()
      : "—";
  return source && range !== "—" ? `${range} (${source})` : range;
};

const mapDimensionalTableRows = (form: RocketMotorCasingFormData): CasingDimensionalTableRow[] =>
  (form.dimensionalData ?? []).map((d) => ({
    paramName: d.paramName || d.paramId || "—",
    paramId: d.paramId,
    side: d.side && d.side !== "COMMON" ? d.side : "—",
    sequenceNo: d.sequenceNo,
    specRange: formatSpecRange(d.referenceRange),
    readings: { ...d.readings },
    looseFlap: { ...d.looseFlap },
    remarks: d.remarks?.trim() || "—",
    isLooseFlap: isLooseFlapDimensionalParam(d),
  }));

/**
 * Builds detail rows from mock trial saved sections.
 * Expands all section data for comprehensive display.
 */
const buildMockTrialDetailRows = (
  sections: SchemaSectionSubmission[] | undefined
): CasingDetailBlock["rows"] => {
  if (!Array.isArray(sections) || sections.length === 0) {
    return [detailRow("No mock trial data recorded", "—")];
  }

  const rows: CasingDetailBlock["rows"] = [];

  for (const section of sections) {
    const sectionId = String(section.sectionId ?? "").toLowerCase();
    const sectionData = Array.isArray(section.sectionData) ? section.sectionData : [];

    if (sectionData.length === 0) continue;

    if (sectionId === "basicdetails") {
      const data = sectionData[0] as Record<string, unknown> | undefined;
      if (data) {
        rows.push(detailRow("Basic details — Casting station", String(data.castingStation ?? "—")));
        rows.push(detailRow("Basic details — Mandrel ID", String(data.mandrelId ?? "—")));
        rows.push(detailRow("Basic details — Bottom cup ID", String(data.bottomCupId ?? "—")));
      }
    } else if (sectionId === "mockassydetails") {
      for (let i = 0; i < sectionData.length; i++) {
        const data = sectionData[i] as Record<string, unknown> | undefined;
        if (!data) continue;
        const prefix = `Mock assy details (row ${i + 1})`;
        rows.push(detailRow(`${prefix} — Sr. No.`, String(data.srNo ?? "—")));
        rows.push(detailRow(`${prefix} — Mandrel rest on dome (A)`, String(data.mandrelRestOnDomeA ?? "—")));
        rows.push(detailRow(`${prefix} — Mandrel rest on bottom cup (B)`, String(data.mandrelRestOnBottomCupB ?? "—")));
        rows.push(detailRow(`${prefix} — Difference (C)`, String(data.differenceC ?? "—")));
        rows.push(detailRow(`${prefix} — Bellow thickness (D)`, String(data.bellowThicknessD ?? "—")));
        rows.push(detailRow(`${prefix} — Mandrel lift (E)`, String(data.mandrelLiftE ?? "—")));
      }
    } else if (sectionId === "motorlengthmeasurements") {
      for (let i = 0; i < sectionData.length; i++) {
        const data = sectionData[i] as Record<string, unknown> | undefined;
        if (!data) continue;
        const prefix = `Motor length measurements (row ${i + 1})`;
        rows.push(detailRow(`${prefix} — Sr. No.`, String(data.srNo ?? "—")));
        rows.push(detailRow(`${prefix} — LF rubber thickness (HE)`, String(data.lfRubberThicknessHe ?? "—")));
        rows.push(detailRow(`${prefix} — HE boss width without LF rubber`, String(data.heBossWidthWithoutLfRubber ?? "—")));
        rows.push(detailRow(`${prefix} — HE dia ID`, String(data.heDiaId ?? "—")));
        rows.push(detailRow(`${prefix} — HE outer to NE outer`, String(data.heOuterToNeOuter ?? "—")));
        rows.push(detailRow(`${prefix} — HE inner to NE inner`, String(data.heInnerToNeInner ?? "—")));
        rows.push(detailRow(`${prefix} — NE outer to HE inner`, String(data.neOuterToHeInner ?? "—")));
      }
    } else if (sectionId === "mandrelassembly") {
      for (let i = 0; i < sectionData.length; i++) {
        const data = sectionData[i] as Record<string, unknown> | undefined;
        if (!data) continue;
        const prefix = `Mandrel assembly (row ${i + 1})`;
        rows.push(detailRow(`${prefix} — Sr. No.`, String(data.srNo ?? "—")));
        rows.push(detailRow(`${prefix} — Reading without cup`, String(data.readingWithoutCup ?? "—")));
        rows.push(detailRow(`${prefix} — Reading with bottom cup & gasket`, String(data.readingWithBottomCupAndGasket ?? "—")));
      }
    }
  }

  return rows.length > 0 ? rows : [detailRow("No mock trial data recorded", "—")];
};

/** Read-only document blocks from parsed API form data (v2 sections) */
export function mapCasingFormDataToDetailBlocks(form: RocketMotorCasingFormData): CasingDetailBlock[] {
  const mechKeyDefs = form.insulationType === "EPDM" ? EPDM_MECH_KEYS : ROCASIN_MECH_KEYS;
  const mechRows = mechKeyDefs
    .map((def) => {
      const r = form.mechanicalProperties[def.paramKey];
      if (!r) return null;
      const reported = (r.reported ?? "").trim();
      const acem = (r.acemSpec ?? "").trim();
      if (!reported && !acem) return null;
      return detailRow(
        r.paramName || def.paramName,
        reported ? `${reported} ${r.unit || def.unit}`.trim() : "—",
        acem ? `ACEM spec: ${acem} ${r.unit || def.unit}`.trim() : "—"
      );
    })
    .filter((r): r is NonNullable<typeof r> => r != null);

  const thermalRows = THERMAL_PROP_KEYS.map((def) => {
    const r = form.thermalProperties[def.key];
    if (!r) return null;
    const reported = (r.reported ?? "").trim();
    const acem = (r.acemSpec ?? "").trim();
    if (!reported && !acem) return null;
    return detailRow(
      def.label,
      reported ? `${reported} ${r.unit || def.unit}`.trim() : "—",
      acem ? `ACEM spec: ${acem} ${r.unit || def.unit}`.trim() : "—"
    );
  }).filter((r): r is NonNullable<typeof r> => r != null);

  const insulationRows: CasingDetailBlock["rows"] = [
    detailRow("Insulation curing date", form.insulationCuringDate),
    detailRow("Insulation type", form.insulationType),
    detailRow("Report no.", form.insulationReportNo),
    detailRow("Receipt status", form.insulationReceiptStatus),
    ...(form.insulationReportExisting
      ? [
        detailRow(
          "Report upload",
          form.insulationReportExisting.fileName,
          form.insulationReportExisting.fileUrl
        ),
      ]
      : []),
    ...mechRows,
    ...thermalRows,
  ];

  const visualRows =
    form.visualInspection?.length > 0
      ? form.visualInspection.flatMap((v) => {
        const base = detailRow(
          v.description || v.itemKey,
          v.observations,
          v.remark || (v.mediaExisting?.fileUrl ? v.mediaExisting.fileUrl : "—")
        );
        const mediaRow = v.mediaExisting
          ? detailRow("Attached media", v.mediaExisting.fileName, v.mediaExisting.fileUrl)
          : null;
        const subRows =
          v.subItems?.map((s) =>
            detailRow(s.description || s.itemKey, s.observations, s.remark)
          ) ?? [];
        return [base, ...(mediaRow ? [mediaRow] : []), ...subRows];
      })
      : [detailRow("No visual inspection recorded", "—")];

  const dimensionalTable = mapDimensionalTableRows(form);

  const blocks: CasingDetailBlock[] = [
    {
      material: "Motor receipt",
      lotNo: form.motorCasingId || undefined,
      rows: [
        detailRow("Project ID", form.projectId),
        detailRow("Motor stage", form.motorStageApi),
        detailRow("Motor ID", form.motorId),
        ...(form.motorCasingId
          ? [detailRow("Motor casing ID", form.motorCasingId)]
          : []),
        detailRow("Casing type", form.casingType),
        detailRow("Receiving date", form.receivingDate),
        detailRow("Item type / description", form.itemsDescription),
        detailRow("Dimension", form.itemsDimension, form.itemsUnit),
        detailRow("Receipt status", form.itemsReceiptStatus),
        detailRow("Observations", form.itemsObservations),
      ],
      _columns: CASING_DETAIL_COLS,
    },
    {
      material: "Clearances",
      rows: [
        detailRow("Green card status", form.greenCardStatus),
        detailRow("Green card no.", form.greenCardNo),
        detailRow("Clearance date", form.clearanceDate),
        detailRow("Authority", form.clearanceAuthority),
        detailRow("Details & observations", form.clearanceDetails),
      ],
      _columns: CASING_DETAIL_COLS,
    },
    {
      material: "Insulation",
      lotNo: form.insulationReportNo || undefined,
      rows: insulationRows,
      _columns: CASING_DETAIL_COLS,
    },
    {
      material: "NDT / UT report",
      rows: [
        detailRow("Post-PPT UT date", form.postPptUtDate),
        detailRow("NDT date", form.ndtDate),
        detailRow("NDT observations", form.ndtObservations),
        detailRow("ACEM NDT observations", form.acemNdtObservations),
        detailRow("Project rubber surface observations", form.projectRubberSurfaceObservations),
        detailRow("Other details", form.otherDetails),
      ],
      _columns: CASING_DETAIL_COLS,
    },
    {
      material: "Visual inspection",
      rows: visualRows,
      _columns: CASING_DETAIL_COLS,
    },
    {
      material: "Weighment",
      rows: [
        detailRow("Weight without harness", form.weightWithoutHarness ? `${form.weightWithoutHarness} kg` : "—"),
        detailRow("Weight with harness", form.weightWithHarness ? `${form.weightWithHarness} kg` : "—"),
        detailRow("Weighscale equipment", form.weighscaleEquipment),
        detailRow("Calibration due date", form.calibrationDueDate),
      ],
      _columns: CASING_DETAIL_COLS,
    },
    {
      material: "Dimensional inspection",
      rows: dimensionalTable.length ? [] : [detailRow("No dimensional data recorded", "—")],
      dimensionalTable: dimensionalTable.length ? dimensionalTable : undefined,
    },
    ...(form.mockTrial?.savedSections && form.mockTrial.savedSections.length > 0
      ? [
        {
          material: "Mock trial",
          rows: buildMockTrialDetailRows(form.mockTrial.savedSections),
          _columns: CASING_DETAIL_COLS,
        },
      ]
      : []),
  ];

  return blocks;
}
