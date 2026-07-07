import {
  mapDispatchDetailsToFormState,
  mapDispatchFormStateToPayload,
  type DispatchFormState,
} from "./DispatchFormModel";
import type { SchemaSectionSubmission } from "../../../schema-engine";

export type DispatchSubmissionType = "DRAFT" | "SUBMIT";

export class DispatchSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(payload: { formId?: string; batchId?: string; status?: string }) {
    this.formId = payload.formId ?? "";
    this.batchId = payload.batchId ?? "";
    this.status = payload.status ?? "";
  }

  static fromApi(apiResponse: any): DispatchSubmitResponseModel {
    return new DispatchSubmitResponseModel(apiResponse?.data ?? {});
  }
}

export class DispatchDetailsModel {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  motorStage: string;
  motorId: string;
  castingDate: string;
  dispatchDate: string;
  dispatchLocation: string;
  ndtClearance: string;
  ndtMomNo: string;
  finalAcceptanceClearance: string;
  finalAcceptanceMomNo: string;
  schemaValues: Record<string, any>;
  workflowInsights: {
    currentStatus: string;
    rejectionReason: string | null;
  };

  constructor(payload: any) {
    this.formId = payload?.formId ?? "";
    this.batchId = payload?.batchId ?? "";
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.formSubmissionType = payload?.formSubmissionType ?? payload?.formStatus ?? "";
    
    // Safely extract the first motor's nested dispatch details from backend schema
    const motorObj = Array.isArray(payload?.motors) ? payload.motors[0] : null;
    const details = motorObj?.dispatchDetails ?? {};

    this.motorId = motorObj?.motorId ?? "";
    this.motorStage = details?.stage ? details.stage.replace("STAGE_", "") : "";
    this.castingDate = details?.castingDate ?? "";
    this.dispatchDate = details?.dispatchDate ?? "";
    this.dispatchLocation = details?.dispatchLocation ?? "";
    
    this.ndtClearance = details?.ndtClearance?.accorded ?? "NO";
    this.ndtMomNo = details?.ndtClearance?.momNo ?? "";
    
    this.finalAcceptanceClearance = details?.finalAcceptanceCommitteeClearance?.accorded ?? "NO";
    this.finalAcceptanceMomNo = details?.finalAcceptanceCommitteeClearance?.momNo ?? "";
    
    // Package nested JSON arrays up for the dynamic form state engine
    this.schemaValues = {
      projectName: details?.projectName ?? "",
      propellantProperties: details?.propellantProperties ?? [],
      waiverDetails: details?.waiverDetails ?? null,
      rocketMotorInspection: details?.rocketMotorInspection ?? [],
      vehicleDetails: details?.vehicleDetails ?? [],
      rocketMotorPackingDetails: details?.rocketMotorPackingDetails ?? [],
      uploadDispatchPhotos: details?.uploadDispatchPhotos ?? [],
      safetyClearance: details?.safetyClearance ?? null,
      dispatchTeam: details?.dispatchTeam ?? null,
    };

    this.workflowInsights = {
      currentStatus: payload?.formStatus ?? "",
      rejectionReason: payload?.rejectionReason ?? null,
    };
  }

  static fromApi(apiResponse: any): DispatchDetailsModel {
    return new DispatchDetailsModel(apiResponse?.data ?? {});
  }

  static toFormState(model: DispatchDetailsModel): DispatchFormState {
    return mapDispatchDetailsToFormState({
      formId: model.formId,
      batchId: model.batchId,
      subDepartmentId: model.subDepartmentId,
      formSubmissionType: model.formSubmissionType,
      motorStage: model.motorStage,
      motorId: model.motorId,
      castingDate: model.castingDate,
      dispatchDate: model.dispatchDate,
      dispatchLocation: model.dispatchLocation,
      ndtClearance: model.ndtClearance,
      ndtMomNo: model.ndtMomNo,
      finalAcceptanceClearance: model.finalAcceptanceClearance,
      finalAcceptanceMomNo: model.finalAcceptanceMomNo,
      schemaValues: model.schemaValues,
    });
  }
}

export const mapDispatchPayload = (form: DispatchFormState) =>
  mapDispatchFormStateToPayload(form);
