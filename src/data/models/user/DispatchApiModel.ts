import type {
  DispatchFormState,
  DispatchSupportingFile,
} from "./DispatchFormModel";

export type DispatchSubmissionType = "DRAFT" | "SUBMIT" | "UPDATE";

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
  castingDate: string;
  finalWeight: string;
  waiversIfAny: string;
  ndtCommitteeMomNumber: string;
  finalAcceptanceMomNumber: string;
  deviationDetails: string;
  dispatchDate: string;
  dispatchLocation: string;
  supportingFiles: Array<{ name: string; filePath: string; fileType: string }>;
  workflowInsights: {
    currentStatus: string;
    rejectionReason: string | null;
  };

  constructor(payload: any) {
    this.formId = payload?.formId ?? "";
    this.batchId = payload?.batchId ?? "";
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.formSubmissionType = payload?.formSubmissionType ?? "";
    this.castingDate = payload?.castingDate ?? "";
    this.finalWeight = payload?.finalWeight ?? "";
    this.waiversIfAny = payload?.waiversIfAny ?? "";
    this.ndtCommitteeMomNumber = payload?.ndtCommitteeMomNumber ?? "";
    this.finalAcceptanceMomNumber = payload?.finalAcceptanceMomNumber ?? "";
    this.deviationDetails = payload?.deviationDetails ?? "";
    this.dispatchDate = payload?.dispatchDate ?? "";
    this.dispatchLocation = payload?.dispatchLocation ?? "";
    this.supportingFiles = (payload?.supportingFiles ?? []).map((file: any) => ({
      name: file?.name ?? "",
      filePath: file?.filePath ?? "",
      fileType: file?.fileType ?? "",
    }));
    this.workflowInsights = {
      currentStatus: payload?.workflowInsights?.currentStatus ?? "",
      rejectionReason: payload?.workflowInsights?.rejectionReason ?? null,
    };
  }

  static fromApi(apiResponse: any): DispatchDetailsModel {
    return new DispatchDetailsModel(apiResponse?.data ?? {});
  }

  static toFormState(model: DispatchDetailsModel): DispatchFormState {
    return {
      castingDate: model.castingDate ?? "",
      finalWeight: model.finalWeight ?? "",
      waiversIfAny: model.waiversIfAny ?? "",
      ndtCommitteeMomNumber: model.ndtCommitteeMomNumber ?? "",
      finalAcceptanceMomNumber: model.finalAcceptanceMomNumber ?? "",
      deviationDetails: model.deviationDetails ?? "",
      dispatchDate: model.dispatchDate ?? "",
      dispatchLocation: model.dispatchLocation ?? "",
      supportingFiles: (model.supportingFiles ?? []).map((file) => ({
        name: file.name,
        filePath: file.filePath,
        fileType: file.fileType,
        type: file.fileType,
      })),
    };
  }
}

const normalizeSupportingFiles = (files: DispatchSupportingFile[] = []) =>
  files.map((file) => ({
    name: file?.name ?? "",
    filePath: file?.filePath ?? file?.name ?? "",
    fileType: file?.fileType ?? file?.type ?? file?.file?.type ?? "",
  }));

export const mapDispatchPayload = (form: DispatchFormState) => ({
  castingDate: form?.castingDate ?? "",
  finalWeight: form?.finalWeight ?? "",
  waiversIfAny: form?.waiversIfAny ?? "",
  ndtCommitteeMomNumber: form?.ndtCommitteeMomNumber ?? "",
  finalAcceptanceMomNumber: form?.finalAcceptanceMomNumber ?? "",
  deviationDetails: form?.deviationDetails ?? "",
  dispatchDate: form?.dispatchDate ?? "",
  dispatchLocation: form?.dispatchLocation ?? "",
  supportingFiles: normalizeSupportingFiles(form?.supportingFiles ?? []),
});
