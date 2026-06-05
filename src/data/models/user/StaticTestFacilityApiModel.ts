import type { StaticTestFacilityFormState } from "./StaticTestFacilityFormModel";

export type STFSubmissionType = "DRAFT" | "SUBMIT" | "UPDATE";

export class STFSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;
  propellantWeight: string;

  constructor(payload: {
    formId?: string;
    batchId?: string;
    status?: string;
    propellantWeight?: string;
  }) {
    this.formId = payload.formId ?? "";
    this.batchId = payload.batchId ?? "";
    this.status = payload.status ?? "";
    this.propellantWeight = payload.propellantWeight ?? "";
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
  motorNo: string;
  emptyMotorWeight: string;
  rubberDustWeight: string;
  linearCoatingWeight: string;
  looseFlapFillWeight: string;
  extraRubberWeight: string;
  inhibitionWeight: string;
  finalMotorWeight: string;
  propellantWeight: string;
  workflowInsights: {
    currentStatus: string;
    rejectionReason: string | null;
  };

  constructor(payload: any) {
    this.formId = payload?.formId ?? "";
    this.batchId = payload?.batchId ?? "";
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.formSubmissionType = payload?.formSubmissionType ?? "";
    this.motorNo = payload?.motorNo ?? "";
    this.emptyMotorWeight = payload?.emptyMotorWeight ?? "";
    this.rubberDustWeight = payload?.rubberDustWeight ?? "";
    this.linearCoatingWeight = payload?.linearCoatingWeight ?? "";
    this.looseFlapFillWeight = payload?.looseFlapFillWeight ?? "";
    this.extraRubberWeight = payload?.extraRubberWeight ?? "";
    this.inhibitionWeight = payload?.inhibitionWeight ?? "";
    this.finalMotorWeight = payload?.finalMotorWeight ?? "";
    this.propellantWeight = payload?.propellantWeight ?? "";
    this.workflowInsights = {
      currentStatus: payload?.workflowInsights?.currentStatus ?? "",
      rejectionReason: payload?.workflowInsights?.rejectionReason ?? null,
    };
  }

  static fromApi(apiResponse: any): STFDetailsModel {
    return new STFDetailsModel(apiResponse?.data ?? {});
  }

  static toFormState(model: STFDetailsModel): StaticTestFacilityFormState {
    return {
      motorNo: model.motorNo ?? "",
      a_emptyMotor: model.emptyMotorWeight ?? "",
      b_rubberDust: model.rubberDustWeight ?? "",
      c_linearCoating: model.linearCoatingWeight ?? "",
      d_looseFlapFill: model.looseFlapFillWeight ?? "",
      e_extraRubber: model.extraRubberWeight ?? "",
      f_inhibition: model.inhibitionWeight ?? "",
      g_finalWeight: model.finalMotorWeight ?? "",
      h_propellent: model.propellantWeight ?? "",
    };
  }
}

export const mapSTFPayload = (form: StaticTestFacilityFormState) => ({
  motorNo: form?.motorNo ?? "",
  emptyMotorWeight: form?.a_emptyMotor ?? "",
  rubberDustWeight: form?.b_rubberDust ?? "",
  linearCoatingWeight: form?.c_linearCoating ?? "",
  looseFlapFillWeight: form?.d_looseFlapFill ?? "",
  extraRubberWeight: form?.e_extraRubber ?? "",
  inhibitionWeight: form?.f_inhibition ?? "",
  finalMotorWeight: form?.g_finalWeight ?? "",
  propellantWeight: form?.h_propellent ?? "",
});
