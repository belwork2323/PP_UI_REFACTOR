import type { StfBemStaticTestingDetailsApi } from "@/data/models/user/StfMotorDataModel";

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
  formId: string;
  motorId: string;
  motorCode: string;
  status: string;
  subType: string;
  stfTestNo: string;
  createdBy: { id: string; fullName: string };
  createdOn: string;
  createdAt: string;
}

/** Raw Other BEM details — nested staticTestingDetails (new BEM sheet shape). */
export interface OtherBemDetailRawData {
  formId?: string;
  motorId: string;
  motorCode?: string;
  bemNo?: string;
  status: string;
  subType?: string;
  stfTestNo?: string;
  staticTestingDetails?: StfBemStaticTestingDetailsApi;
  createdBy?: string | { id?: string; fullName?: string };
  createdOn?: string;
  createdAt?: string;
  updatedBy?: string | { id?: string; fullName?: string };
  updatedOn?: string;
  updatedAt?: string;
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
  formId: string;
  bemNo: string;
  motorId: string;
  motorCode: string;
  status: string;
  bemStatus: string;
  createdBy: {};
  createdOn: string;
  raw: OtherBemApiListRecord;
  [key: string]: unknown;
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
  stfTestNo?: string;
  createdBy: string;
  createdOn: string;
  updatedBy: string;
  updatedOn: string;
  staticTestingDetails: StfBemStaticTestingDetailsApi | null;

  // Flexible Index Signature to satisfy any extra UI properties
  [key: string]: unknown;
}

// ==========================================
// MAPPERS
// ==========================================

const personLabel = (value: unknown): string => {
  if (value == null) return "N/A";
  if (typeof value === "string") return value || "N/A";
  if (typeof value === "object") {
    const record = value as { fullName?: string; id?: string };
    return String(record.fullName ?? record.id ?? "N/A");
  }
  return "N/A";
};

export const mapOtherBemListRow = (row: OtherBemApiListRecord): OtherBemApproverListRow => ({
  formId: row.formId ?? "",
  bemNo: row.motorId ?? "",
  motorId: row.motorId ?? "",
  motorCode: row.motorCode ?? "",
  subType: row.subType ?? "",
  stfTestNo: row.stfTestNo ?? "",
  status: row.status ?? "WAITING_FOR_APPROVAL",
  bemStatus: row.status ?? "WAITING_FOR_APPROVAL",
  createdBy: row.createdBy ?? row.createdBy.fullName ?? "",
  createdOn: row.createdOn || row.createdAt || "",
  createdAt: row.createdAt || row.createdOn || "",
  raw: row,
});

export const mapOtherBemDetailsForDisplay = (data: OtherBemDetailRawData): OtherBemDetailView => {
  const motorId = data?.motorId ?? "-";
  const motorCode = data?.motorCode ?? data?.bemNo ?? "-";
  const stfTestNo = data?.stfTestNo ?? "-";
  const createdBy = personLabel(data?.createdBy);
  const createdOn = data?.createdOn ?? data?.createdAt ?? "-";
  const updatedBy = personLabel(data?.updatedBy) !== "N/A" ? personLabel(data?.updatedBy) : createdBy;
  const updatedOn = data?.updatedOn ?? data?.updatedAt ?? createdOn;
  const staticTestingDetails = data?.staticTestingDetails ?? null;

  return {
    // 1. Mandatory StfDetailView properties
    formId: data?.formId ?? motorId,
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
        subType: data?.subType ?? "BEM",
        stfTestNo,
        status: data?.status ?? "-",
        staticTestingDetails: staticTestingDetails ?? {},
      },
    ],
    remarks: "",
    rejectionReason: null,
    parameters: [],

    // 2. Motor-Specific JSON Payload Fields
    motorId,
    motorCode,
    stfTestNo,
    createdBy,
    createdOn,
    updatedBy,
    updatedOn,
    staticTestingDetails,

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
