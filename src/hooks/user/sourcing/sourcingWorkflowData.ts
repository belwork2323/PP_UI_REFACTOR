import { OPERATION_STATUS } from "../../operationStatus";

export type { MaterialBlock, SpecRow } from "../../../data/models/user/RawMaterialProcurementModel";

export const SOURCING_STATUS = OPERATION_STATUS;

export type SourcingStatus = (typeof SOURCING_STATUS)[keyof typeof SOURCING_STATUS];

export type RocketFormData = {
  /** Shown / edited for create; filled from list + details for edit */
  motorCasingId: string;
  motorStageApi: string;
  motorNoApi: string;
  casingType: string;
  receivingDate: string;
  itemsDescription: string;
  itemsDimension: string;
  itemsUnit: string;
  greenCardNo: string;
  clearanceAuthority: string;
  clearanceStatus: string;
  insulationType: string;
  insulationReportNo: string;
  weightWithoutHarness: string;
  weightWithHarness: string;
  calibrationRef: string;
  motorIdDetails: string;
  motorIdRemarks: string;
  motorClearanceDetails: string;
  motorClearanceRemarks: string;
  tensileStrengthDetails: string;
  tensileStrengthRemarks: string;
  elongationDetails: string;
  elongationRemarks: string;
  erosionRateDetails: string;
  erosionRateRemarks: string;
  thermalConductivityDetails: string;
  thermalConductivityRemarks: string;
  utNdtDetails: string;
  utNdtRemarks: string;
  waiversDetails: string;
  waiversRemarks: string;
  mediaFilePath: File | string | null;
  dimensionalData: Array<Record<string, any>>;
};

export type RocketMotorBatch = {
  id: number | string;
  formId?: string | null;
  procurementId?: string | null;
  motorCasingId?: string;
  projectId?: string;
  motorStage?: string;
  /** API list field `motorId`; kept as motorNo alias for form flows */
  motorNo?: string;
  casingType?: string;
  insulationType?: string;
  receivingDate?: string;
  nextStep?: string | null;
  /** Legacy aliases used by form/actions — synced from list API fields */
  batchId: string;
  batchType: string;
  motorId: string;
  motorType: string;
  priority: string;
  assignedTo: { fullName: string } | null;
  createdBy?: { id: string; fullName: string } | null;
  createdOn: string;
  rmStatus: SourcingStatus;
  draftData: RocketFormData | null;
  rejectionReason: string | null;
};

export function createEmptyRocketMotorBatch(): RocketMotorBatch {
  return {
    id: "new",
    formId: null,
    procurementId: null,
    motorCasingId: "",
    projectId: "",
    motorStage: "",
    motorNo: "",
    batchId: "—",
    batchType: "",
    motorId: "—",
    motorType: "",
    priority: "Medium",
    assignedTo: null,
    createdOn: new Date().toISOString(),
    rmStatus: SOURCING_STATUS.INITIATED,
    draftData: null,
    rejectionReason: null,
  };
}

/** Keep list/form header IDs aligned once the server assigns a motor casing ID */
export function applyRocketMotorCasingIdentity(
  batch: RocketMotorBatch,
  updates: Partial<
    Pick<
      RocketMotorBatch,
      | "motorCasingId"
      | "motorId"
      | "formId"
      | "procurementId"
      | "rmStatus"
      | "motorStage"
      | "motorNo"
      | "motorType"
    >
  >,
): RocketMotorBatch {
  const motorCasingId = String(updates.motorCasingId ?? batch.motorCasingId ?? "").trim();
  const motorIdRaw = String(updates.motorId ?? batch.motorId ?? "").trim();
  const motorId = motorIdRaw && motorIdRaw !== "—" ? motorIdRaw : batch.motorId;

  return {
    ...batch,
    ...updates,
    motorCasingId,
    motorId,
    motorNo: motorId !== "—" ? motorId : batch.motorNo,
    batchId: motorCasingId || batch.batchId,
  };
}

export const INITIAL_ROCKET_FORM: RocketFormData = {
  motorCasingId: "",
  motorStageApi: "",
  motorNoApi: "",
  casingType: "COMPOSITE",
  receivingDate: "",
  itemsDescription: "",
  itemsDimension: "",
  itemsUnit: "mm",
  greenCardNo: "",
  clearanceAuthority: "",
  clearanceStatus: "RECEIVED",
  insulationType: "ROCASIN",
  insulationReportNo: "",
  weightWithoutHarness: "",
  weightWithHarness: "",
  calibrationRef: "",
  motorIdDetails: "",
  motorIdRemarks: "",
  motorClearanceDetails: "",
  motorClearanceRemarks: "",
  tensileStrengthDetails: "",
  tensileStrengthRemarks: "",
  elongationDetails: "",
  elongationRemarks: "",
  erosionRateDetails: "",
  erosionRateRemarks: "",
  thermalConductivityDetails: "",
  thermalConductivityRemarks: "",
  utNdtDetails: "",
  utNdtRemarks: "",
  waiversDetails: "",
  waiversRemarks: "",
  mediaFilePath: null,
  dimensionalData: [],
};

export const SUB_DEPT_LABELS: Record<string, string> = {
  "raw-material": "Raw Material Procurement",
  "rocket-motor": "Rocket Motor Casing",
};
