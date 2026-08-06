// ==========================================
// PAYLOAD INTERFACES
// ==========================================

export interface OtherBemListPayload {
  page: number;
  limit: number;
  filters?: {
    status?: string;
    search?: string;
  };
  sort?: {
    field: string;
    direction: "ASC" | "DESC";
  };
}

export interface OtherBemDetailsPayload {
  motorId: string;
}

// ==========================================
// RESPONSE RECORD INTERFACES
// ==========================================

export interface OtherBemApiListRecord {
  motorId: string;
  motorCode: string;
  status: string;
  subType: string;
  stfTestNo: string;
  createdBy: string;
  createdOn: string;
  createdAt: string;
}

export interface ConditioningDetails {
  fromDateTime: string;
  toDateTime: string;
  temperature: number;
  rh: number;
  observation: string;
}

export interface GrainDimensionItem {
  side: string;
  od: number;
  a: number;
  b: number;
  c: number;
  length: number;
  weight: number;
}

export interface HardwareDetails {
  headEndNo: string;
  nozzleEndNo: string;
  retainerRingNo: string;
  casingNo: string;
  casingOD: number;
  casingID: number;
  length: number;
  firingNo: string;
}

export interface OtherBemDetailRawData {
  motorId: string;
  motorCode: string;
  status: string;
  stfTestNo: string;
  conditioningDetails: ConditioningDetails;
  grainDimension: GrainDimensionItem[];
  hardwareDetails: HardwareDetails;
  createdBy: string;
  createdOn: string;
  updatedBy: string;
  updatedOn: string;
}

// ==========================================
// API WRAPPER RESPONSES
// ==========================================

export interface OtherBemListApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    motors: OtherBemApiListRecord[];
  };
}

export interface OtherBemDetailsApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: OtherBemDetailRawData;
}

// ==========================================
// UI MAPPED STRUCTURES
// ==========================================

export interface OtherBemApproverListRow {
  bemNo: string;
  motorId: string;
  motorCode: string;
  status: string;
  bemStatus: string;
  createdBy: string;
  createdOn: string;
  raw: OtherBemApiListRecord;
  [key: string]: unknown; // <--- Add index signature here
}
export interface OtherBemTestParameter {
  parameterId: string | number;
  parameterName: string;
  specifiedValue: string | number;
  observedValue: string | number;
  unit: string;
  result: string;
  remarks?: string;
}
export interface OtherBemDetailView {
  // Required fields expected by STFApproverDetailDialog / StfDetailView
  formId: string;
  batchId: string;
  batchType: string;
  status: string;
  bemStatus: string;
  createdAt: string;
  updatedAt: string;
  submittedBy: string;
  submittedAt: string;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
  motors: Array<Record<string, unknown>>;
  remarks: string;
  rejectionReason: string | null;
  overviewSections: { label: string; value: string | number }[];
  parameters: OtherBemTestParameter[];

  // BEM Motor Specific Payload Data
  motorId: string;
  motorCode: string;
  createdBy: string;
  createdOn: string;
  updatedBy: string;
  updatedOn: string;
  conditioningDetails: ConditioningDetails | null;
  grainDimension: GrainDimensionItem[];
  hardwareDetails: HardwareDetails | null;

  // Flexible Index Signature to satisfy any extra UI properties
  [key: string]: unknown;
}

// ==========================================
// MAPPERS
// ==========================================

export const mapOtherBemListRow = (row: OtherBemApiListRecord): OtherBemApproverListRow => ({
  bemNo: row.motorId ?? "",
  motorId: row.motorId ?? "",
  motorCode: row.motorCode ?? "",
  subType: row.subType ?? "",
  stfTestNo: row.stfTestNo ?? "",
  status: row.status ?? "SUBMITTED",
  bemStatus: row.status ?? "SUBMITTED",
  createdBy: row.createdBy ?? "",
  createdOn: row.createdOn || row.createdAt || "",
  raw: row,
});

export const mapOtherBemDetailsForDisplay = (data: OtherBemDetailRawData): OtherBemDetailView => {
  const motorId = data?.motorId ?? "-";
  const motorCode = data?.motorCode ?? "-";
  const stfTestNo = data?.stfTestNo ?? "-";
  const createdBy = data?.createdBy ?? "N/A";
  const createdOn = data?.createdOn ?? "-";
  const updatedBy = data?.updatedBy ?? createdBy;
  const updatedOn = data?.updatedOn ?? createdOn;

  return {
    // 1. Mandatory StfDetailView properties
    formId: motorId,
    batchId: motorCode,
    batchType: "BEM Motor",
    status: data?.status ?? "SUBMITTED",
    bemStatus: data?.status ?? "SUBMITTED",
    createdAt: createdOn,
    updatedAt: updatedOn,
    submittedBy: createdBy,
    submittedAt: createdOn,
    lastUpdatedBy: updatedBy,
    lastUpdatedAt: updatedOn,
    motors: [
      {
        motorId,
        motorCode,
        status: data?.status ?? "-",
      },
    ],
    remarks: "",
    rejectionReason: null,
    parameters: [],

    // 2. Motor-Specific JSON Payload Fields
    motorId,
    motorCode,
    createdBy,
    createdOn,
    updatedBy,
    updatedOn,
    conditioningDetails: data?.conditioningDetails ?? null,
    grainDimension: Array.isArray(data?.grainDimension) ? data.grainDimension : [],
    hardwareDetails: data?.hardwareDetails ?? null,

    // 3. Overview Section Key-Values
    overviewSections: [
      { label: "Motor ID", value: motorId },
      { label: "Motor Code", value: motorCode },
      { label: "STF Test No", value: stfTestNo },
      { label: "Status", value: data?.status ?? "-" },
      { label: "Created By", value: createdBy },
      { label: "Created On", value: createdOn },
      { label: "Updated By", value: updatedBy },
      { label: "Updated On", value: updatedOn },
    ],
  };
};
