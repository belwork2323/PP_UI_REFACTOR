import {
  FORM_SECTIONS_KEY,
  mapStaticTestFacilityDetailsToFormState,
  mapStaticTestFacilityFormStateToPayload,
  type StaticTestFacilityFormState,
} from "./StaticTestFacilityFormModel";
import type { SchemaSectionSubmission } from "../../../schema-engine";

export type STFSubmissionType = "DRAFT" | "SUBMIT" | "UPDATE";

export type STFMotorPayload = {
  motorId: string;
  staticTestingDetails: Record<string, unknown>;
};

export class STFSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(payload: {
    formId?: string;
    batchId?: string;
    status?: string;
  }) {
    this.formId = payload.formId ?? "";
    this.batchId = payload.batchId ?? "";
    this.status = payload.status ?? "";
  }

  static fromApi(apiResponse: any): STFSubmitResponseModel {
    return new STFSubmitResponseModel(apiResponse?.data ?? {});
  }
}

export class STFDetailsModel {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  subType: string;
  motorIdNo: string;
  sections: SchemaSectionSubmission[];
  workflowInsights: {
    currentStatus: string;
    rejectionReason: string | null;
  };

  constructor(payload: any) {
    this.formId = payload?.formId ?? "";
    this.batchId = payload?.batchId ?? "";
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.formSubmissionType = payload?.formSubmissionType ?? "";
    this.subType = payload?.subType ?? "";
    this.motorIdNo = payload?.motorIdNo ?? "";

    this.sections = extractSectionsFromPayload(payload);

    this.workflowInsights = {
      currentStatus: payload?.workflowInsights?.currentStatus ?? "",
      rejectionReason: payload?.workflowInsights?.rejectionReason ?? null,
    };
  }

  static fromApi(apiResponse: any): STFDetailsModel {
    return new STFDetailsModel(apiResponse?.data ?? {});
  }

  static toFormState(model: STFDetailsModel) {
    return mapStaticTestFacilityDetailsToFormState({
      formId: model.formId,
      batchId: model.batchId,
      subDepartmentId: model.subDepartmentId,
      formSubmissionType: model.formSubmissionType,
      subType: model.subType,
      motorIdNo: model.motorIdNo,
      sections: model.sections,
    });
  }
}

const extractSectionsFromPayload = (payload: any): SchemaSectionSubmission[] => {
  if (Array.isArray(payload?.sections) && payload.sections.length > 0) {
    return payload.sections;
  }

  const motors = payload?.motors;
  if (Array.isArray(motors) && motors.length > 0) {
    const formSections = motors[0]?.staticTestingDetails?.[FORM_SECTIONS_KEY];
    if (Array.isArray(formSections) && formSections.length > 0) {
      return formSections as SchemaSectionSubmission[];
    }
  }

  return [];
};

export const mapSTFPayload = (form: StaticTestFacilityFormState) =>
  mapStaticTestFacilityFormStateToPayload(form);