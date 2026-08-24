import type { DimensionalParameterModel } from "./SubdepartmentCommonModel";
import { formatToIsoDateInput } from "../../../utils/dateUtils";

/** API payload dates stay YYYY-MM-DD regardless of UI display format. */
const toPayloadDate = (value: string | null | undefined): string =>
  formatToIsoDateInput(value) || "";

const toPayloadDateOrNull = (value: string | null | undefined): string | null => {
  const iso = formatToIsoDateInput(value);
  return iso || null;
};
export type ReceiptStatus = "RECEIVED" | "NOT_RECEIVED";
export type CasingType = "COMPOSITE" | "METALLIC";
export type InsulationType = "ROCASIN" | "EPDM";
export type FormSubmissionType = "DRAFT" | "SUBMIT";

export type MechPropFormRow = {
  paramKey: string;
  paramName: string;
  specification: string;
  reported: string;
  acemSpec: string;
  unit: string;
};

export type ThermalPropFormRow = {
  specification: string;
  reported: string;
  acemSpec: string;
  unit: string;
};

export type CasingFileUploadStatus = "uploading" | "uploaded" | "failed";

export type UploadedFileRef = {
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  storedFileName?: string;
  originalFileName?: string;
  /** Shared file-service id after upload (preferred over pending-upload URLs). */
  fileId?: string | null;
  localId?: string;
  status?: CasingFileUploadStatus;
  /** 0–100 while status is uploading. */
  uploadProgress?: number;
  /** True until parent form create/update succeeds. */
  isTemp?: boolean;
  /** Local File kept for retry; never JSON-serialized. */
  file?: File | null;
};

export const newCasingFileLocalId = (): string =>
  `casing-file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const isCasingFileUploadIncomplete = (ref: UploadedFileRef | null | undefined): boolean =>
  ref?.status === "uploading" || ref?.status === "failed";

export const isUploadedCasingFileReady = (ref: UploadedFileRef | null | undefined): boolean => {
  if (!ref || isCasingFileUploadIncomplete(ref)) return false;
  const fileId = String(ref.fileId ?? "").trim();
  if (fileId) return true;
  const url = String(ref.fileUrl ?? "").trim();
  return Boolean(url) && !/^pending-upload:\/\//i.test(url);
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

/** Matches NDT radiography plan details table columns. */
export type CasingRadiographyPlanRow = {
  srNo: number;
  sections: string;
  orientations: string;
  sfd: string;
  normalExposures: string;
  tangentialExposures: string;
  detectorType: string;
};

export const CASING_DETECTOR_TYPE_OPTIONS = [
  { value: "Imaging Plate", label: "Imaging Plate" },
  { value: "DR Panel", label: "DR Panel" },
  { value: "Film", label: "Film" },
] as const;

const CASING_DETECTOR_TO_API: Record<string, string> = {
  "Imaging Plate": "IMAGING_PLATE",
  "DR Panel": "DR",
  Film: "FILM",
  IMAGING_PLATE: "IMAGING_PLATE",
  DR: "DR",
  FILM: "FILM",
};

const CASING_DETECTOR_FROM_API: Record<string, string> = {
  IMAGING_PLATE: "Imaging Plate",
  DR: "DR Panel",
  FILM: "Film",
};

export const createEmptyRadiographyPlanRow = (srNo = 1): CasingRadiographyPlanRow => ({
  srNo,
  sections: "",
  orientations: "",
  sfd: "",
  normalExposures: "",
  tangentialExposures: "",
  detectorType: "",
});

export const createInitialRadiographyPlanRows = (): CasingRadiographyPlanRow[] => [
  createEmptyRadiographyPlanRow(1),
];

/** Mock trial — typed RMC form state aligned to API payload. */
export type MockTrialMotorDimensionRow = {
  srNo: number;
  lfRubberThicknessHe: string;
  heBossWidthWithoutLfRubber: string;
  heDiaId: string;
  heOuterToNeOuter: string;
  heInnerToNeInner: string;
  neOuterToHeInner: string;
};

export type MockTrialMandrelAssemblyRow = {
  srNo: number;
  mandrelRestOnDomeA: string;
  mandrelRestOnBottomCupB: string;
  bellowThicknessD: string;
};

export type RocketMotorCasingMockTrialData = {
  castingStation: string;
  mandrelId: string;
  bottomCupId: string;
  motorDimensions: MockTrialMotorDimensionRow[];
  mandrelAssemblyMeasurements: MockTrialMandrelAssemblyRow[];
};

export type MockTrialMeasuredMm = {
  value: number | null;
  unit: "mm";
};

export type RocketMotorCasingMockTrialPayload = {
  basicDetails: {
    castingStation: string;
    mandrelId: string;
    bottomCupId: string;
  };
  motorDimensions: Array<{
    srNo: number;
    lfRubberThicknessHe: MockTrialMeasuredMm;
    heBossWidthWithoutLfRubber: MockTrialMeasuredMm;
    heDiaId: MockTrialMeasuredMm;
    motorLength: {
      heOuterToNeOuter: MockTrialMeasuredMm;
      heInnerToNeInner: MockTrialMeasuredMm;
      neOuterToHeInner: MockTrialMeasuredMm;
    };
  }>;
  mandrelAssemblyMeasurements: Array<{
    srNo: number;
    mandrelRestOnDomeA: number | null;
    mandrelRestOnBottomCupB: number | null;
    differenceC: number | null;
    bellowThicknessD: number | null;
    mandrelLiftE: number | null;
  }>;
};

export const createEmptyMockTrialMotorDimensionRow = (
  srNo = 1,
): MockTrialMotorDimensionRow => ({
  srNo,
  lfRubberThicknessHe: "",
  heBossWidthWithoutLfRubber: "",
  heDiaId: "",
  heOuterToNeOuter: "",
  heInnerToNeInner: "",
  neOuterToHeInner: "",
});

export const createEmptyMockTrialMandrelAssemblyRow = (
  srNo = 1,
): MockTrialMandrelAssemblyRow => ({
  srNo,
  mandrelRestOnDomeA: "",
  mandrelRestOnBottomCupB: "",
  bellowThicknessD: "",
});

export const createEmptyMockTrialData = (): RocketMotorCasingMockTrialData => ({
  castingStation: "",
  mandrelId: "",
  bottomCupId: "",
  motorDimensions: [createEmptyMockTrialMotorDimensionRow(1)],
  mandrelAssemblyMeasurements: [createEmptyMockTrialMandrelAssemblyRow(1)],
});

const parseDecimalInput = (value: unknown): string => {
  if (value == null || value === "") return "";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return String(value).trim();
};

const parseNumOrNull = (value: string): number | null => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

const toMeasuredMm = (value: string): MockTrialMeasuredMm => ({
  value: parseNumOrNull(value),
  unit: "mm",
});

const fromMeasuredMm = (value: unknown): string => {
  if (value == null || value === "") return "";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "object") {
    return parseDecimalInput((value as { value?: unknown }).value);
  }
  return parseDecimalInput(value);
};

/** C = A − B (readonly formula in UI). */
export const computeMockTrialDifferenceC = (row: MockTrialMandrelAssemblyRow): string => {
  const a = parseNumOrNull(row.mandrelRestOnDomeA);
  const b = parseNumOrNull(row.mandrelRestOnBottomCupB);
  if (a == null || b == null) return "";
  return String(Number((a - b).toFixed(4)));
};

/** E = C − D (readonly formula in UI). */
export const computeMockTrialMandrelLiftE = (row: MockTrialMandrelAssemblyRow): string => {
  const c = parseNumOrNull(computeMockTrialDifferenceC(row));
  const d = parseNumOrNull(row.bellowThicknessD);
  if (c == null || d == null) return "";
  return String(Number((c - d).toFixed(4)));
};

export const buildMockTrialPayload = (
  mockTrial: RocketMotorCasingMockTrialData,
): RocketMotorCasingMockTrialPayload => ({
  basicDetails: {
    castingStation: String(mockTrial.castingStation ?? "").trim(),
    mandrelId: String(mockTrial.mandrelId ?? "").trim(),
    bottomCupId: String(mockTrial.bottomCupId ?? "").trim(),
  },
  motorDimensions: (mockTrial.motorDimensions ?? []).map((row, index) => ({
    srNo: index + 1,
    lfRubberThicknessHe: toMeasuredMm(row.lfRubberThicknessHe),
    heBossWidthWithoutLfRubber: toMeasuredMm(row.heBossWidthWithoutLfRubber),
    heDiaId: toMeasuredMm(row.heDiaId),
    motorLength: {
      heOuterToNeOuter: toMeasuredMm(row.heOuterToNeOuter),
      heInnerToNeInner: toMeasuredMm(row.heInnerToNeInner),
      neOuterToHeInner: toMeasuredMm(row.neOuterToHeInner),
    },
  })),
  mandrelAssemblyMeasurements: (mockTrial.mandrelAssemblyMeasurements ?? []).map((row, index) => ({
    srNo: index + 1,
    mandrelRestOnDomeA: parseNumOrNull(row.mandrelRestOnDomeA),
    mandrelRestOnBottomCupB: parseNumOrNull(row.mandrelRestOnBottomCupB),
    differenceC: parseNumOrNull(computeMockTrialDifferenceC(row)),
    bellowThicknessD: parseNumOrNull(row.bellowThicknessD),
    mandrelLiftE: parseNumOrNull(computeMockTrialMandrelLiftE(row)),
  })),
});

/** @deprecated Use buildMockTrialPayload */
export const buildMockTrialSectionPayload = buildMockTrialPayload;

const mapMotorDimensionRowFromApi = (
  row: Record<string, unknown>,
  index: number,
): MockTrialMotorDimensionRow => {
  const motorLength =
    row.motorLength && typeof row.motorLength === "object"
      ? (row.motorLength as Record<string, unknown>)
      : {};

  return {
    srNo: Number(row.srNo ?? index + 1),
    lfRubberThicknessHe: fromMeasuredMm(
      row.lfRubberThicknessHe ?? row.looseFlapThicknessRubberHe,
    ),
    heBossWidthWithoutLfRubber: fromMeasuredMm(
      row.heBossWidthWithoutLfRubber ?? row.metalWidth ?? row.heMetalPolarBossId,
    ),
    heDiaId: fromMeasuredMm(row.heDiaId ?? row.heRubberPolarBossId ?? row.rubberWidth),
    heOuterToNeOuter: fromMeasuredMm(
      motorLength.heOuterToNeOuter ?? row.heOuterToNeOuter,
    ),
    heInnerToNeInner: fromMeasuredMm(
      motorLength.heInnerToNeInner ?? row.heInnerToNeInner,
    ),
    neOuterToHeInner: fromMeasuredMm(
      motorLength.neOuterToHeInner ?? row.heInnerToNeOuter ?? row.neOuterToHeInner,
    ),
  };
};

const mapMandrelAssemblyRowFromApi = (
  row: Record<string, unknown>,
  index: number,
): MockTrialMandrelAssemblyRow => ({
  srNo: Number(row.srNo ?? index + 1),
  mandrelRestOnDomeA: fromMeasuredMm(row.mandrelRestOnDomeA),
  mandrelRestOnBottomCupB: fromMeasuredMm(row.mandrelRestOnBottomCupB),
  bellowThicknessD: fromMeasuredMm(row.bellowThicknessD),
});

export const parseMockTrialFromApi = (value: unknown): RocketMotorCasingMockTrialData => {
  const empty = createEmptyMockTrialData();
  if (!value || typeof value !== "object") return empty;

  // New object payload: { basicDetails, motorDimensions, mandrelAssemblyMeasurements }
  if (!Array.isArray(value) && !("sectionId" in (value as object))) {
    const root = value as Record<string, unknown>;
    const basic =
      root.basicDetails && typeof root.basicDetails === "object"
        ? (root.basicDetails as Record<string, unknown>)
        : root;
    const motorDimRows = Array.isArray(root.motorDimensions)
      ? (root.motorDimensions as Record<string, unknown>[])
      : [];
    const mandrelRows = Array.isArray(root.mandrelAssemblyMeasurements)
      ? (root.mandrelAssemblyMeasurements as Record<string, unknown>[])
      : [];

    return {
      castingStation: String(basic.castingStation ?? "").trim(),
      mandrelId: String(basic.mandrelId ?? "").trim(),
      bottomCupId: String(basic.bottomCupId ?? "").trim(),
      motorDimensions:
        motorDimRows.length > 0
          ? motorDimRows.map(mapMotorDimensionRowFromApi)
          : empty.motorDimensions,
      mandrelAssemblyMeasurements:
        mandrelRows.length > 0
          ? mandrelRows.map(mapMandrelAssemblyRowFromApi)
          : empty.mandrelAssemblyMeasurements,
    };
  }

  // Legacy schema section-array fallback
  if (!Array.isArray(value)) return empty;

  const sections = value
    .filter((item) => item && typeof item === "object" && "sectionId" in (item as object))
    .map((item) => {
      const row = item as { sectionId?: string; sectionData?: unknown[] };
      return {
        sectionId: String(row.sectionId ?? ""),
        sectionData: Array.isArray(row.sectionData) ? row.sectionData : [],
      };
    });

  if (!sections.length) return empty;

  const byId = Object.fromEntries(sections.map((s) => [s.sectionId, s]));
  const basicData = Array.isArray(byId.basicDetails?.sectionData)
    ? byId.basicDetails.sectionData[0]
    : null;
  const basic =
    basicData && typeof basicData === "object"
      ? (basicData as Record<string, unknown>)
      : {};

  const extractRows = (sectionId: string): Record<string, unknown>[] => {
    const section = byId[sectionId];
    if (!section) return [];
    const first = section.sectionData[0];
    if (first && typeof first === "object") {
      const nested = (first as Record<string, unknown>)[sectionId];
      if (Array.isArray(nested)) return nested as Record<string, unknown>[];
    }
    if (
      section.sectionData.length > 0 &&
      section.sectionData.every((row) => row && typeof row === "object")
    ) {
      return section.sectionData as Record<string, unknown>[];
    }
    return [];
  };

  const motorDimRows = extractRows("motorDimensions");
  const mandrelRows = extractRows("mandrelAssemblyMeasurements");

  return {
    castingStation: String(basic.castingStation ?? "").trim(),
    mandrelId: String(basic.mandrelId ?? "").trim(),
    bottomCupId: String(basic.bottomCupId ?? "").trim(),
    motorDimensions:
      motorDimRows.length > 0
        ? motorDimRows.map(mapMotorDimensionRowFromApi)
        : empty.motorDimensions,
    mandrelAssemblyMeasurements:
      mandrelRows.length > 0
        ? mandrelRows.map(mapMandrelAssemblyRowFromApi)
        : empty.mandrelAssemblyMeasurements,
  };
};

/** @deprecated Use parseMockTrialFromApi */
export const parseMockTrialFromSections = parseMockTrialFromApi;

const mapCasingDetectorTypeToApi = (value: string): string => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  return CASING_DETECTOR_TO_API[trimmed] ?? trimmed.toUpperCase().replace(/\s+/g, "_");
};

const mapCasingDetectorTypeFromApi = (value: string): string => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  return CASING_DETECTOR_FROM_API[trimmed] ?? trimmed;
};

const radiographyPlanRowHasData = (row: CasingRadiographyPlanRow): boolean =>
  Boolean(
    String(row.sections ?? "").trim() ||
    String(row.orientations ?? "").trim() ||
    String(row.sfd ?? "").trim() ||
    String(row.normalExposures ?? "").trim() ||
    String(row.tangentialExposures ?? "").trim() ||
    String(row.detectorType ?? "").trim(),
  );

const buildRadiographyDetailsPayload = (
  rows: CasingRadiographyPlanRow[],
  planId: string,
  planName: string,
) => {
  const radiographyPlanDetails = (Array.isArray(rows) ? rows : [])
    .filter(radiographyPlanRowHasData)
    .map((row) => ({
      numberOfSections: parseNum(row.sections) ?? 0,
      numberOfOrientations: parseNum(row.orientations) ?? 0,
      sfd: parseNum(row.sfd) ?? 0,
      numberOfNormalExposures: parseNum(row.normalExposures) ?? 0,
      numberOfTangentialExposures: parseNum(row.tangentialExposures) ?? 0,
      detectorType: mapCasingDetectorTypeToApi(row.detectorType),
    }));

  return {
    radiographyPlanId: String(planId ?? "").trim(),
    radiographyPlanName: String(planName ?? "").trim(),
    radiographyPlanDetails,
  };
};

const parseRadiographyPlanMetaFromSections = (
  sections: Record<string, unknown>,
): { radiographyPlanId: string; radiographyPlanName: string } => {
  const raw = sections.radiographyDetails;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { radiographyPlanId: "", radiographyPlanName: "" };
  }
  const asRecord = raw as Record<string, unknown>;
  return {
    radiographyPlanId: String(
      asRecord.radiographyPlanId ?? asRecord.planId ?? asRecord.radiography_plan_id ?? "",
    ).trim(),
    radiographyPlanName: String(
      asRecord.radiographyPlanName ?? asRecord.planName ?? asRecord.radiography_plan_name ?? "",
    ).trim(),
  };
};

const parseRadiographyPlanRowsFromSections = (
  sections: Record<string, unknown>,
): CasingRadiographyPlanRow[] => {
  const raw = sections.radiographyDetails;
  if (!raw) return createInitialRadiographyPlanRows();

  const asRecord =
    typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(asRecord?.radiographyPlanDetails)
      ? asRecord.radiographyPlanDetails
      : Array.isArray(asRecord?.planRows)
        ? asRecord.planRows
        : Array.isArray(asRecord?.rows)
          ? asRecord.rows
          : asRecord?.radiographyPlanDetails && typeof asRecord.radiographyPlanDetails === "object"
            ? [asRecord.radiographyPlanDetails]
            : [];

  if (list.length === 0) return createInitialRadiographyPlanRows();

  return list.map((entry: any, index: number) => ({
    srNo: Number(entry?.srNo ?? index + 1) || index + 1,
    sections: valueFromApiField(
      entry?.numberOfSections ?? entry?.sections ?? entry?.number_of_sections,
    ),
    orientations: valueFromApiField(
      entry?.numberOfOrientations ?? entry?.orientations ?? entry?.number_of_orientations,
    ),
    sfd: valueFromApiField(entry?.sfd),
    normalExposures: valueFromApiField(
      entry?.numberOfNormalExposures ?? entry?.normalExposures ?? entry?.number_of_normal_exposures,
    ),
    tangentialExposures: valueFromApiField(
      entry?.numberOfTangentialExposures ??
        entry?.tangentialExposures ??
        entry?.number_of_tangential_exposures,
    ),
    detectorType: mapCasingDetectorTypeFromApi(String(entry?.detectorType ?? "")),
  }));
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
  return String(row.paramName ?? "")
    .toLowerCase()
    .includes("loose flap");
}

export interface ReportUploadSection {
  ndtUtReport?: UploadedFileRef[];
  visualInspectionReport?: UploadedFileRef[];
  weighmentReport?: UploadedFileRef[];
  dimensionalInspectionReport?: UploadedFileRef[];
  mockTrialReport?: UploadedFileRef[];
  insulationLiningReport?: UploadedFileRef[];
}
export type RocketMotorCasingFormData = {
  projectId: string;
  projectName: string;
  motorStageApi: string;
  /** User-entered motor ID (API `motorId`); casing ID is assigned by the server */
  motorId: string;
  /** Populated after first save; read-only in the form */
  motorCasingId: string;
  casingType: CasingType | "";
  receivingDate: string;
  itemsDescription: string;
  itemsDimension: string;
  itemsUnit: string;
  itemsReceiptStatus: ReceiptStatus | "";
  itemsObservations: string;
  greenCardStatus: ReceiptStatus | "";
  greenCardNo: string;
  clearanceDate: string;
  clearanceAuthority: string;
  clearanceDetails: string;
  insulationCuringDate: string;
  insulationType: InsulationType | "";
  insulationReportNo: string;
  insulationReceiptStatus: ReceiptStatus | "";
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
  radiographyPlanId: string;
  radiographyPlanName: string;
  radiographyPlanRows: CasingRadiographyPlanRow[];
  visualInspection: VisualInspectionFormRow[];
  weightWithoutHarness: string;
  weightWithHarness: string;
  weighscaleEquipment: string;
  calibrationDueDate: string;
  dimensionalData: DimensionalReadingFormRow[];
  mockTrial: RocketMotorCasingMockTrialData;
  ndtUtReportFiles: File[];
  ndtUtReportExisting: UploadedFileRef[];

  visualInspectionReportFiles: File[];
  visualInspectionReportExisting: UploadedFileRef[];

  weighmentReportFiles: File[];
  weighmentReportExisting: UploadedFileRef[];

  dimensionalInspectionReportFiles: File[];
  dimensionalInspectionReportExisting: UploadedFileRef[];

  mockTrialReportFiles: File[];
  mockTrialReportExisting: UploadedFileRef[];

  insulationLiningReportFiles: File[];
  insulationLiningReportExisting: UploadedFileRef[];
  insulationSpecifications: InsulationSpecificationModel | null;
  reportUpload: ReportUploadSection | null;
};

export const createEmptyMockTrialSlot = (): RocketMotorCasingMockTrialData =>
  createEmptyMockTrialData();

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
  const fileId = String(o.fileId ?? "").trim() || null;
  const fileUrl = String(o.fileUrl ?? o.filePath ?? o.downloadUrl ?? fileId ?? "").trim();
  if (!fileUrl && !fileId) return null;
  const decodeName = (name: string) => {
    try {
      return decodeURIComponent(name);
    } catch {
      return name;
    }
  };
  const fileName =
    decodeName(String(o.fileName ?? o.originalFileName ?? "").trim()) ||
    decodeName(
      String(fileUrl.split("/").pop() || "file").replace(/^pending-upload:\/\//i, ""),
    );
  return {
    fileName,
    fileUrl: fileUrl || fileId || "",
    mimeType: String(o.mimeType ?? "").trim() || "application/octet-stream",
    storedFileName: String(o.storedFileName ?? "").trim() || undefined,
    originalFileName: String(o.originalFileName ?? "").trim() || undefined,
    fileId,
    localId: newCasingFileLocalId(),
    status: "uploaded",
    isTemp: false,
    file: null,
  };
};

/** Normalize a single ref or an array of refs from the API. */
export const parseUploadedFileRefs = (value: unknown): UploadedFileRef[] => {
  if (Array.isArray(value)) {
    return value.map(parseUploadedFileRef).filter((r): r is UploadedFileRef => Boolean(r));
  }
  const single = parseUploadedFileRef(value);
  return single ? [single] : [];
};

/** Emit media payload only for files already uploaded via file service (or legacy openable URLs). */
const fileToMediaRef = (_file: File | null, existing?: UploadedFileRef | null) => {
  if (!isUploadedCasingFileReady(existing)) return null;
  const fileId = String(existing?.fileId ?? "").trim() || null;
  return {
    ...(fileId ? { fileId } : {}),
    fileName: existing!.fileName,
    fileUrl: existing!.fileUrl || fileId || "",
    mimeType: String(existing!.mimeType ?? "").trim() || "application/octet-stream",
  };
};

/** Build report docs from uploaded refs only — local File[] must be uploaded before submit. */
const buildReportUpload = (documentType: string, _files: File[], existing: UploadedFileRef[]) =>
  (existing ?? [])
    .filter(isUploadedCasingFileReady)
    .map((file) => {
      const fileId = String(file.fileId ?? "").trim() || undefined;
      return {
        documentType,
        ...(fileId ? { fileId } : {}),
        originalFileName: file.fileName,
        filePath: file.fileUrl || fileId || "",
        storedFileName: file.storedFileName || fileId || file.fileUrl,
        mimeType: String(file.mimeType ?? "").trim() || "application/octet-stream",
      };
    });

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

export const VISUAL_INSPECTION_TEMPLATE: Omit<
  VisualInspectionFormRow,
  "observations" | "remark" | "mediaFile"
>[] = [
  {
    srNo: 1,
    itemKey: "MOTOR_OUTER_SURFACE",
    description: "Motor Outer Surface condition",
    requiresMedia: true,
  },
  {
    srNo: 2,
    itemKey: "LUGS_CONDITION",
    description: "Nos. of Lugs & Condition",
    requiresMedia: true,
  },
  { srNo: 3, itemKey: "TAPPED_HOLE_HE", description: "Condition of tapped hole at HE side" },
  { srNo: 4, itemKey: "TAPPED_HOLE_NE", description: "Condition of tapped hole at NE side" },
  { srNo: 5, itemKey: "POLAR_BOSS_HE", description: "Condition of Polar boss at HE side" },
  {
    srNo: 6,
    itemKey: "POLAR_BOSS_NE",
    description: "Condition of Polar boss at NE side",
    requiresMedia: true,
  },
  {
    srNo: 7,
    itemKey: "INSULATION_LINING_SURFACE",
    description: "Insulation Lining Surface Condition",
    subItems: [
      { itemKey: "INSULATION_FINISH", description: "Surface finish", observations: "", remark: "" },
      { itemKey: "INSULATION_COLOR", description: "Color", observations: "", remark: "" },
      { itemKey: "INSULATION_PATCHES", description: "Patches", observations: "", remark: "" },
      { itemKey: "INSULATION_PINHOLES", description: "Pinholes", observations: "", remark: "" },
      {
        itemKey: "INSULATION_DEPRESSION",
        description: "Depression if any",
        observations: "",
        remark: "",
      },
      {
        itemKey: "INSULATION_FOREIGN_MATERIAL",
        description: "Foreign materials on rubber surface",
        observations: "",
        remark: "",
      },
    ],
  },
  { srNo: 8, itemKey: "LOOSE_FLAP", description: "Loose Flap Condition" },
  {
    srNo: 9,
    itemKey: "BONDING_HE",
    description: "Bonding of rubber with HE polar boss",
    requiresMedia: true,
  },
  { srNo: 10, itemKey: "BONDING_NE", description: "Bonding of rubber with NE polar boss" },
  { srNo: 11, itemKey: "JOINTS_PATCHWORK", description: "Observation on Joints/Patch work" },
  { srNo: 12, itemKey: "OTHER", description: "Other observation if any" },
];

export function createInitialMechanicalProperties(
  specificationModel: InsulationSpecificationModel,
): Record<string, MechPropFormRow> {
  const mechanicalCategory = specificationModel.specifications.find(
    (x) => x.category === "Rubber Mechanical Properties",
  );

  return Object.fromEntries(
    (mechanicalCategory?.parameters ?? []).map((spec) => [
      spec.specificationCode,
      {
        paramKey: spec.specificationCode,
        paramName: spec.specificationName,
        specification: `${spec.referenceRange.minValue} - ${spec.referenceRange.maxValue}`,
        reported: "",
        acemSpec: "",
        unit: spec.referenceRange.unit ?? "",
      },
    ]),
  );
}

export function createInitialThermalProperties(
  specificationModel: InsulationSpecificationModel,
): Record<string, ThermalPropFormRow> {
  const thermalCategory = specificationModel.specifications.find(
    (x) => x.category === "Rubber Thermal Properties",
  );

  return Object.fromEntries(
    (thermalCategory?.parameters ?? []).map((spec) => [
      spec.specificationCode,
      {
        specification: `${spec.referenceRange.minValue} - ${spec.referenceRange.maxValue}`,
        reported: "",
        acemSpec: "",
        unit: spec.referenceRange.unit ?? "",
      },
    ]),
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

export function dimensionalRowFromParameter(
  param: DimensionalParameterModel,
  index: number,
): DimensionalReadingFormRow {
  const name = String(param.paramName ?? "").toLowerCase();
  return {
    paramId: param.paramId,
    paramName: param.paramName,
    side:
      name.includes("he") && !name.includes("ne") ? "HE" : name.includes("ne") ? "NE" : "COMMON",
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
  legacyRecorded?: unknown,
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
  const lf = (looseFlap && typeof looseFlap === "object" ? looseFlap : {}) as Record<
    string,
    unknown
  >;
  const arc = parseApiNumeric(lf.arcLength);
  const axial = parseApiNumeric(lf.axialLength);
  return {
    arcLength: arc != null ? String(arc) : "",
    axialLength: axial != null ? String(axial) : "",
  };
}

/** API v2 readings: `{ r2tR2b: 144.2, r1rR1l: 144.0, tlBr: 144.1, trBl: 144.3 }` */
export function buildApiDimReadings(
  readings: DimensionalReadingFormRow["readings"],
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
  projectName: "",
  motorStageApi: "",
  motorId: "",
  motorCasingId: "",
  casingType: "",
  receivingDate: "",
  itemsDescription: "Rubber Sheet",
  itemsDimension: "",
  itemsUnit: "mm",
  itemsReceiptStatus: "",
  itemsObservations: "",
  greenCardStatus: "",
  greenCardNo: "",
  clearanceDate: "",
  clearanceAuthority: "",
  clearanceDetails: "",
  insulationCuringDate: "",
  insulationType: "",
  insulationReportNo: "",
  insulationReceiptStatus: "",
  insulationReportFile: null,
  insulationReportExisting: null,
  mechanicalProperties: {},
  thermalProperties: {},
  postPptUtDate: "",
  ndtDate: "",
  ndtObservations: "",
  acemNdtObservations: "",
  projectRubberSurfaceObservations: "",
  otherDetails: "",
  radiographyPlanId: "",
  radiographyPlanName: "",
  radiographyPlanRows: createInitialRadiographyPlanRows(),
  visualInspection: createInitialVisualInspection(),
  weightWithoutHarness: "",
  weightWithHarness: "",
  weighscaleEquipment: "",
  calibrationDueDate: "",
  dimensionalData: [],
  mockTrial: createEmptyMockTrialSlot(),
  ndtUtReportFiles: [],
  ndtUtReportExisting: [],

  visualInspectionReportFiles: [],
  visualInspectionReportExisting: [],

  weighmentReportFiles: [],
  weighmentReportExisting: [],

  dimensionalInspectionReportFiles: [],
  dimensionalInspectionReportExisting: [],

  mockTrialReportFiles: [],
  mockTrialReportExisting: [],

  insulationLiningReportFiles: [],
  insulationLiningReportExisting: [],
  insulationSpecifications: null,
  reportUpload: null,
};

function buildMechRows(
  form: RocketMotorCasingFormData,
  keys: readonly { paramKey: string; paramName: string; unit: string }[],
) {
  return keys
    .map((def) => {
      const row = form.mechanicalProperties[def.paramKey];
      const reported = parseNum(row?.reported ?? "");
      const acemSpec = parseNum(row?.acemSpec ?? "");
      const specificationRaw = String(row?.specification ?? "").trim();
      const specificationNum = parseNum(specificationRaw);
      if (reported == null) return null;
      return {
        paramKey: def.paramKey,
        paramName: def.paramName,
        reported,
        specification: specificationNum != null ? specificationNum : specificationRaw || null,
        acemSpec: acemSpec ?? reported,
        unit: def.unit,
      };
    })
    .filter(Boolean);
}

function buildThermalProperties(form: RocketMotorCasingFormData) {
  const out: Record<
    string,
    { specification: number | string | null; reported: number; acemSpec: number; unit: string }
  > = {};
  for (const def of THERMAL_PROP_KEYS) {
    const row = form.thermalProperties[def.key];
    const reported = parseNum(row?.reported ?? "");
    const acemSpec = parseNum(row?.acemSpec ?? "");
    const specificationRaw = String(row?.specification ?? "").trim();
    const specificationNum = parseNum(specificationRaw);
    if (reported == null) continue;
    out[def.key] = {
      reported,
      specification: specificationNum != null ? specificationNum : specificationRaw || null,
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
  options?: { includeMotorCasingId?: boolean; motorCasingId?: string },
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
      radiographyDetails: buildRadiographyDetailsPayload(
        form.radiographyPlanRows,
        form.radiographyPlanId,
        form.radiographyPlanName,
      ),
      motorReceipt: {
        casingType: form.casingType,
        receivingDate: toPayloadDate(form.receivingDate) || new Date().toISOString().slice(0, 10),
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
          clearanceDate: toPayloadDateOrNull(form.clearanceDate),
          authority: form.clearanceAuthority.trim() || "—",
          detailsAndObservations: form.clearanceDetails.trim(),
        },
        insulation: {
          insulationCuringDate: toPayloadDateOrNull(form.insulationCuringDate),
          type: form.insulationType,
          reportNo: form.insulationReportNo.trim() || "—",
          receiptStatus: form.insulationReceiptStatus,
          reportUpload: fileToMediaRef(
            form.insulationReportFile,
            form.insulationReportExisting ?? null,
          ),
          insulationSpecification: buildInsulationSpecifications(form),
        },

        ndtUtReport: {
          postPptUtDate: toPayloadDateOrNull(form.postPptUtDate),
          ndtDate: toPayloadDateOrNull(form.ndtDate),
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
          calibrationDueDate: toPayloadDateOrNull(form.calibrationDueDate),
        },
      },
      dimensionalInspection,
      mockTrial: buildMockTrialPayload(form.mockTrial),
      reportUpload: {
        ndtUtReport: buildReportUpload(
          "NDT_UT_REPORT",
          form.ndtUtReportFiles,
          form.ndtUtReportExisting,
        ),
        visualInspectionReport: buildReportUpload(
          "VISUAL_INSPECTION_REPORT",
          form.visualInspectionReportFiles,
          form.visualInspectionReportExisting,
        ),
        weighmentReport: buildReportUpload(
          "WEIGHMENT_REPORT",
          form.weighmentReportFiles,
          form.weighmentReportExisting,
        ),
        dimensionalInspectionReport: buildReportUpload(
          "DIMENSIONAL_INSPECTION_REPORT",
          form.dimensionalInspectionReportFiles,
          form.dimensionalInspectionReportExisting,
        ),
        mockTrialReport: buildReportUpload(
          "MOCK_TRIAL_REPORT",
          form.mockTrialReportFiles,
          form.mockTrialReportExisting,
        ),
        insulationLiningReport: buildReportUpload(
          "INSULATION_LINING_REPORT",
          form.insulationLiningReportFiles,
          form.insulationLiningReportExisting,
        ),
      },
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
    specification: valueFromApiField(row.specification ?? row.spec),
    reported: valueFromApiField(row.reported),
    acemSpec: valueFromApiField(row.acemSpec ?? row.acem ?? row.testResultAcem),
    unit: String(row.unit ?? ""),
  };
}

function thermalRowFromApi(row: Record<string, unknown>, defaultUnit: string): ThermalPropFormRow {
  return {
    specification: valueFromApiField(row.specification ?? row.spec),
    reported: valueFromApiField(row.reported ?? row.value),
    acemSpec: valueFromApiField(row.acemSpec ?? row.acem ?? row.testResultAcem),
    unit: String(row.unit ?? defaultUnit),
  };
}

export function parseSectionsToFormData(
  sections: Record<string, unknown>,
  ids: {
    projectId?: string;
    projectName?: string;
    motorStage?: string;
    motorId?: string;
    motorCasingId?: string;
  },
): RocketMotorCasingFormData {
  const mr = (sections.motorReceipt ?? {}) as Record<string, unknown>;
  const items = (mr.itemsReceived ?? {}) as Record<string, unknown>;
  const clear = (mr.clearances ?? {}) as Record<string, unknown>;
  const ins = (mr.insulation ?? {}) as Record<string, unknown>;
  const thermal = (ins.thermalProperties ?? {}) as Record<string, unknown>;
  const ndt = (mr.ndtUtReport ?? {}) as Record<string, unknown>;
  const insReport = ins.reportUpload as Record<string, unknown> | null | undefined;
  const reportUpload = (sections.reportUpload ?? {}) as Record<string, unknown>;
  const mapReportFiles = (docs: unknown): UploadedFileRef[] => {
    if (!Array.isArray(docs)) return [];
    return docs
      .map((doc: any) =>
        parseUploadedFileRef({
          fileId: doc?.fileId,
          fileName: doc?.originalFileName ?? doc?.fileName,
          originalFileName: doc?.originalFileName,
          fileUrl: doc?.filePath ?? doc?.fileUrl ?? doc?.downloadUrl,
          mimeType: doc?.mimeType,
          storedFileName: doc?.storedFileName,
        }),
      )
      .filter((r): r is UploadedFileRef => Boolean(r));
  };
  const parseCasingType = (raw: unknown): CasingType | "" => {
    const v = String(raw ?? "")
      .trim()
      .toUpperCase();
    return v === "COMPOSITE" || v === "METALLIC" ? v : "";
  };
  const parseReceiptStatus = (raw: unknown): ReceiptStatus | "" => {
    const v = String(raw ?? "")
      .trim()
      .toUpperCase();
    return v === "RECEIVED" || v === "NOT_RECEIVED" ? v : "";
  };
  const parseInsulationType = (raw: unknown): InsulationType | "" => {
    const v = String(raw ?? "")
      .trim()
      .toUpperCase();
    return v === "ROCASIN" || v === "EPDM" ? v : "";
  };
  const insulationType = parseInsulationType(ins.type);

  // Specifications are loaded separately from the specification API.
  const mechanicalProperties: Record<string, MechPropFormRow> = {};
  const thermalProperties: Record<string, ThermalPropFormRow> = {};
  const insulationSpecification = (ins.insulationSpecification ?? {}) as Record<string, unknown>;

  const specificationCategories = Array.isArray(insulationSpecification.specifications)
    ? insulationSpecification.specifications
    : [];

  specificationCategories.forEach((category: any) => {
    const categoryName = String(category.category ?? "").toLowerCase();

    (category.parameters ?? []).forEach((param: any) => {
      const row = {
        specification: "",
        reported: valueFromApiField(param.reported),
        acemSpec: valueFromApiField(param.acemSpec),
        unit: "",
      };

      if (categoryName.includes("mechanical")) {
        mechanicalProperties[param.specificationCode] = {
          paramKey: param.specificationCode,
          paramName: param.specificationCode,
          ...row,
        };
      } else if (categoryName.includes("thermal")) {
        thermalProperties[param.specificationCode] = {
          ...row,
        };
      }
    });
  });
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

  const mockTrial = parseMockTrialFromApi(sections.mockTrial);

  const dimApi = Array.isArray(sections.dimensionalInspection)
    ? sections.dimensionalInspection
    : [];
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
    projectName: ids.projectName ?? "",
    motorStageApi: ids.motorStage ?? "",
    motorId: ids.motorId ?? "",
    motorCasingId: ids.motorCasingId ?? "",
    casingType: parseCasingType(mr.casingType),
    receivingDate: str(mr.receivingDate).slice(0, 10),
    itemsDescription: str(items.description) || "Rubber Sheet",
    itemsDimension: str(items.dimension),
    itemsUnit: str(items.unit) || "mm",
    itemsReceiptStatus: parseReceiptStatus(items.receiptStatus || clear.status),
    itemsObservations: str(items.observations),
    greenCardStatus: parseReceiptStatus(clear.greenCardStatus || clear.status),
    greenCardNo: str(clear.greenCardNo),
    clearanceDate: str(clear.clearanceDate).slice(0, 10),
    clearanceAuthority: str(clear.authority),
    clearanceDetails: str(clear.detailsAndObservations),
    insulationCuringDate: str(ins.insulationCuringDate).slice(0, 10),
    insulationType,
    insulationReportNo: str(ins.reportNo),
    insulationReceiptStatus: parseReceiptStatus(ins.receiptStatus),
    insulationReportFile: null,
    insulationReportExisting: parseUploadedFileRef(insReport),
    insulationReportUrl: parseUploadedFileRef(insReport)?.fileUrl ?? null,
    mechanicalProperties,
    thermalProperties,
    postPptUtDate: str(ndt.postPptUtDate).slice(0, 10),
    ndtDate: str(ndt.ndtDate).slice(0, 10),
    ndtObservations: str(ndt.observations),
    acemNdtObservations: str(mr.acemNdtObservations),
    projectRubberSurfaceObservations: str(mr.projectRubberSurfaceObservations),
    otherDetails: str(mr.otherDetails),
    ...parseRadiographyPlanMetaFromSections(sections),
    radiographyPlanRows: parseRadiographyPlanRowsFromSections(sections),
    visualInspection,
    weightWithoutHarness:
      parseApiNumeric(wwh.value) != null
        ? String(parseApiNumeric(wwh.value))
        : wwh.value != null
          ? String(wwh.value)
          : "",
    weightWithHarness:
      parseApiNumeric(wwh2.value) != null
        ? String(parseApiNumeric(wwh2.value))
        : wwh2.value != null
          ? String(wwh2.value)
          : "",
    weighscaleEquipment: str(cal.equipmentDetails),
    calibrationDueDate: str(cal.calibrationDueDate).slice(0, 10),
    dimensionalData,
    mockTrial,
    ndtUtReportFiles: [],
    ndtUtReportExisting: mapReportFiles(reportUpload.ndtUtReport),

    visualInspectionReportFiles: [],
    visualInspectionReportExisting: mapReportFiles(reportUpload.visualInspectionReport),

    weighmentReportFiles: [],
    weighmentReportExisting: mapReportFiles(reportUpload.weighmentReport),

    dimensionalInspectionReportFiles: [],
    dimensionalInspectionReportExisting: mapReportFiles(reportUpload.dimensionalInspectionReport),

    mockTrialReportFiles: [],
    mockTrialReportExisting: mapReportFiles(reportUpload.mockTrialReport),

    insulationLiningReportFiles: [],
    insulationLiningReportExisting: mapReportFiles(reportUpload.insulationLiningReport),
    reportUpload: {
      ndtUtReport: Array.isArray(reportUpload.ndtUtReport)
        ? reportUpload.ndtUtReport.map((f: any) => ({
            ...f,
            fileName: f.originalFileName,
          }))
        : [],

      visualInspectionReport: Array.isArray(reportUpload.visualInspectionReport)
        ? reportUpload.visualInspectionReport.map((f: any) => ({
            ...f,
            fileName: f.originalFileName,
          }))
        : [],

      weighmentReport: Array.isArray(reportUpload.weighmentReport)
        ? reportUpload.weighmentReport.map((f: any) => ({
            ...f,
            fileName: f.originalFileName,
          }))
        : [],

      dimensionalInspectionReport: Array.isArray(reportUpload.dimensionalInspectionReport)
        ? reportUpload.dimensionalInspectionReport.map((f: any) => ({
            ...f,
            fileName: f.originalFileName,
          }))
        : [],

      mockTrialReport: Array.isArray(reportUpload.mockTrialReport)
        ? reportUpload.mockTrialReport.map((f: any) => ({
            ...f,
            fileName: f.originalFileName,
          }))
        : [],

      insulationLiningReport: Array.isArray(reportUpload.insulationLiningReport)
        ? reportUpload.insulationLiningReport.map((f: any) => ({
            ...f,
            fileName: f.originalFileName,
          }))
        : [],
    },
  };
}

export const CASING_FORM_STEP_COUNT = 6;

const validateIdentification = (form: RocketMotorCasingFormData): string | null => {
  if (!form.projectId.trim()) return "Project is required.";
  if (!form.motorStageApi.trim()) return "Motor stage is required.";
  if (!form.motorId.trim()) return "Motor ID is required.";
  return null;
};

const validateReceiptAndInsulation = (form: RocketMotorCasingFormData): string | null => {
  if (!form.casingType) return "Casing type is required.";
  if (!form.receivingDate.trim()) return "Receiving date is required.";
  if (!form.itemsDimension.trim()) return "Rubber sheet dimension is required.";
  if (!form.itemsReceiptStatus) return "Rubber sheet receipt status is required.";
  if (!form.greenCardStatus) return "Green card status is required.";
  if (!form.greenCardNo.trim()) return "Green card no. is required.";
  if (!form.insulationType) return "Insulation type is required.";
  if (!form.insulationReceiptStatus) return "Insulation receipt status is required.";
  if (!form.insulationReportNo.trim()) return "Insulation report no. is required.";

  const mechKeys = form.insulationType === "EPDM" ? EPDM_MECH_KEYS : ROCASIN_MECH_KEYS;
  for (const k of mechKeys) {
    const row = form.mechanicalProperties[k.paramKey];
    if (!String(row?.reported ?? "").trim()) return `${k.paramName} (reported) is required.`;
  }

  return null;
};

/** Validates the current wizard step before moving forward (steps 0–4). */
export function validateCasingFormStep(
  form: RocketMotorCasingFormData,
  step: number,
): string | null {
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
  intent: FormSubmissionType,
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
  const serializeRef = (ref: UploadedFileRef | null | undefined) =>
    ref
      ? {
          fileName: ref.fileName,
          fileUrl: ref.fileUrl,
          mimeType: ref.mimeType ?? null,
          fileId: ref.fileId ?? null,
          status: ref.status ?? null,
          isTemp: ref.isTemp !== false,
        }
      : null;

  return JSON.stringify({
    ...form,
    insulationReportFile: form.insulationReportFile?.name ?? null,
    insulationReportExisting: serializeRef(form.insulationReportExisting),
    ndtUtReportFiles: form.ndtUtReportFiles.map((f) => f.name),
    ndtUtReportExisting: form.ndtUtReportExisting.map(serializeRef),
    visualInspectionReportFiles: form.visualInspectionReportFiles.map((f) => f.name),
    visualInspectionReportExisting: form.visualInspectionReportExisting.map(serializeRef),
    weighmentReportFiles: form.weighmentReportFiles.map((f) => f.name),
    weighmentReportExisting: form.weighmentReportExisting.map(serializeRef),
    dimensionalInspectionReportFiles: form.dimensionalInspectionReportFiles.map((f) => f.name),
    dimensionalInspectionReportExisting: form.dimensionalInspectionReportExisting.map(serializeRef),
    mockTrialReportFiles: form.mockTrialReportFiles.map((f) => f.name),
    mockTrialReportExisting: form.mockTrialReportExisting.map(serializeRef),
    insulationLiningReportFiles: form.insulationLiningReportFiles.map((f) => f.name),
    insulationLiningReportExisting: form.insulationLiningReportExisting.map(serializeRef),
    visualInspection: form.visualInspection.map((v) => ({
      ...v,
      mediaFile: v.mediaFile?.name ?? null,
      mediaExisting: serializeRef(v.mediaExisting),
    })),
    mockTrial: form.mockTrial,
  });
}

export const REPORT_UPLOADS = [
  {
    key: "ndtUtReport",
    filesField: "ndtUtReportFiles",
    existingField: "ndtUtReportExisting",
    label: "NDT / UT Report",
  },
  {
    key: "visualInspectionReport",
    filesField: "visualInspectionReportFiles",
    existingField: "visualInspectionReportExisting",
    label: "Visual Inspection Report",
  },
  {
    key: "weighmentReport",
    filesField: "weighmentReportFiles",
    existingField: "weighmentReportExisting",
    label: "Weighment Details Report",
  },
  {
    key: "dimensionalInspectionReport",
    filesField: "dimensionalInspectionReportFiles",
    existingField: "dimensionalInspectionReportExisting",
    label: "Dimensional Inspection Report",
  },
  {
    key: "mockTrialReport",
    filesField: "mockTrialReportFiles",
    existingField: "mockTrialReportExisting",
    label: "Mock Trial Report",
  },
  {
    key: "insulationLiningReport",
    filesField: "insulationLiningReportFiles",
    existingField: "insulationLiningReportExisting",
    label: "Insulation Lining Report",
  },
] as const;

export const collectCasingFileRefs = (form: RocketMotorCasingFormData): UploadedFileRef[] => {
  const refs: UploadedFileRef[] = [];
  for (const entry of REPORT_UPLOADS) {
    const list = form[entry.existingField] as UploadedFileRef[] | undefined;
    if (Array.isArray(list)) refs.push(...list);
  }
  if (form.insulationReportExisting) refs.push(form.insulationReportExisting);
  for (const row of form.visualInspection ?? []) {
    if (row.mediaExisting) refs.push(row.mediaExisting);
  }
  return refs;
};

export const hasIncompleteCasingUploads = (form: RocketMotorCasingFormData): boolean =>
  collectCasingFileRefs(form).some(isCasingFileUploadIncomplete);

export const collectTempFileIdsFromCasingForm = (form: RocketMotorCasingFormData): string[] =>
  [
    ...new Set(
      collectCasingFileRefs(form)
        .filter((ref) => ref.isTemp !== false)
        .map((ref) => String(ref.fileId ?? "").trim())
        .filter(Boolean),
    ),
  ];

export interface InsulationSpecificationRequest {
  insulationType: "ROCASIN" | "EPDM";
}

export interface ReferenceRange {
  minValue: number;
  maxValue: number;
  unit: string;
}

export interface SpecificationParameter {
  specificationCode: string;
  specificationName: string;
  referenceRange: ReferenceRange;
}

export interface SpecificationCategory {
  category: string;
  parameters: SpecificationParameter[];
}

export interface InsulationSpecificationModel {
  insulationType: "ROCASIN" | "EPDM";
  specifications: SpecificationCategory[];
}

export class InsulationSpecificationModel {
  insulationType: "ROCASIN" | "EPDM" = "ROCASIN";
  specifications: SpecificationCategory[] = [];

  static fromApi(data: any): InsulationSpecificationModel {
    return {
      insulationType: data?.insulationType ?? "ROCASIN",
      specifications:
        data?.specifications?.map((category: any) => ({
          category: category.category,
          parameters:
            category.parameters?.map((param: any) => ({
              specificationCode: param.specificationCode,
              specificationName: param.specificationName,
              referenceRange: {
                minValue: param.referenceRange?.minValue,
                maxValue: param.referenceRange?.maxValue,
                unit: param.referenceRange?.unit,
              },
            })) ?? [],
        })) ?? [],
    };
  }
}

export function buildInsulationSpecifications(form: RocketMotorCasingFormData) {
  const specModel = form.insulationSpecifications;

  if (!specModel) return null;

  return {
    insulationType: specModel.insulationType,
    specifications: specModel.specifications.map((category) => ({
      category: category.category,
      parameters: category.parameters.map((param) => {
        const mech = form.mechanicalProperties[param.specificationCode];
        const thermal = form.thermalProperties[param.specificationCode];

        return {
          specificationCode: param.specificationCode,
          reported: parseNum(mech?.reported ?? thermal?.reported),
          acemSpec: parseNum(mech?.acemSpec ?? thermal?.acemSpec),
        };
      }),
    })),
  };
}
