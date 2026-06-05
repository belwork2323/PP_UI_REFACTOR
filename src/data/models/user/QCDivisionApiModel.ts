import type { QCDivisionFormState } from "./QCDivisionFormModel";

export type QCDivisionSubmissionType = "DRAFT" | "SUBMIT" | "UPDATE";

export class QCDivisionSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(payload: { formId?: string; batchId?: string; status?: string }) {
    this.formId = payload.formId ?? "";
    this.batchId = payload.batchId ?? "";
    this.status = payload.status ?? "";
  }

  static fromApi(apiResponse: any): QCDivisionSubmitResponseModel {
    return new QCDivisionSubmitResponseModel(apiResponse?.data ?? {});
  }
}

export class QCDivisionDetailsModel {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  inProcessChecks: QCDivisionFormState;
  workflowInsights: {
    currentStatus: string;
    rejectionReason: string | null;
  };

  constructor(payload: any) {
    this.formId = payload?.formId ?? "";
    this.batchId = payload?.batchId ?? "";
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.formSubmissionType = payload?.formSubmissionType ?? "";
    this.inProcessChecks = {
      rm_particleSize: payload?.inProcessChecks?.rm_particleSize ?? "",
      rm_moisture: payload?.inProcessChecks?.rm_moisture ?? "",
      mx_pre_homogeneity: payload?.inProcessChecks?.mx_pre_homogeneity ?? "",
      mx_pre_moisture: payload?.inProcessChecks?.mx_pre_moisture ?? "",
      mx_fin_viscosity: payload?.inProcessChecks?.mx_fin_viscosity ?? "",
      lp_moisture: payload?.inProcessChecks?.lp_moisture ?? "",
      cast_flowRate: payload?.inProcessChecks?.cast_flowRate ?? "",
      cast_viscosity: payload?.inProcessChecks?.cast_viscosity ?? "",
      dc_load: payload?.inProcessChecks?.dc_load ?? "",
      tr_dimension: payload?.inProcessChecks?.tr_dimension ?? "",
      lf_mechProps: payload?.inProcessChecks?.lf_mechProps ?? "",
      ir_mechProps: payload?.inProcessChecks?.ir_mechProps ?? "",
    };
    this.workflowInsights = {
      currentStatus: payload?.workflowInsights?.currentStatus ?? "",
      rejectionReason: payload?.workflowInsights?.rejectionReason ?? null,
    };
  }

  static fromApi(apiResponse: any): QCDivisionDetailsModel {
    return new QCDivisionDetailsModel(apiResponse?.data ?? {});
  }

  static toFormState(model: QCDivisionDetailsModel): QCDivisionFormState {
    return {
      rm_particleSize: model.inProcessChecks?.rm_particleSize ?? "",
      rm_moisture: model.inProcessChecks?.rm_moisture ?? "",
      mx_pre_homogeneity: model.inProcessChecks?.mx_pre_homogeneity ?? "",
      mx_pre_moisture: model.inProcessChecks?.mx_pre_moisture ?? "",
      mx_fin_viscosity: model.inProcessChecks?.mx_fin_viscosity ?? "",
      lp_moisture: model.inProcessChecks?.lp_moisture ?? "",
      cast_flowRate: model.inProcessChecks?.cast_flowRate ?? "",
      cast_viscosity: model.inProcessChecks?.cast_viscosity ?? "",
      dc_load: model.inProcessChecks?.dc_load ?? "",
      tr_dimension: model.inProcessChecks?.tr_dimension ?? "",
      lf_mechProps: model.inProcessChecks?.lf_mechProps ?? "",
      ir_mechProps: model.inProcessChecks?.ir_mechProps ?? "",
    };
  }
}

export const mapQCDivisionPayload = (form: QCDivisionFormState): QCDivisionFormState => ({
  rm_particleSize: form?.rm_particleSize ?? "",
  rm_moisture: form?.rm_moisture ?? "",
  mx_pre_homogeneity: form?.mx_pre_homogeneity ?? "",
  mx_pre_moisture: form?.mx_pre_moisture ?? "",
  mx_fin_viscosity: form?.mx_fin_viscosity ?? "",
  lp_moisture: form?.lp_moisture ?? "",
  cast_flowRate: form?.cast_flowRate ?? "",
  cast_viscosity: form?.cast_viscosity ?? "",
  dc_load: form?.dc_load ?? "",
  tr_dimension: form?.tr_dimension ?? "",
  lf_mechProps: form?.lf_mechProps ?? "",
  ir_mechProps: form?.ir_mechProps ?? "",
});