import {
  createDefaultNDTFormState,
  normalizeNDTFormState,
  normalizeNDTMotorSession,
  type NDTFileValue,
  type NDTFormState,
  type NDTMotorSession,
  type NDTRadiographyPlanRow,
} from "./NDTFormModel";

export type NDTSubmissionType = "DRAFT" | "SUBMIT" | "UPDATE";

const normalizeFilePaths = (files: NDTFileValue[] = []): string[] =>
  files
    .map((file) => (typeof file === "string" ? file : ""))
    .filter((path) => path.trim().length > 0);

const normalizeSingleFilePath = (file: NDTFileValue | null | undefined): string | null => {
  if (!file) return null;
  return typeof file === "string" ? file : null;
};

const extractRadiographyDetails = (motor: any): { equipment: string; beamEnergies: string[]; radiographyPlan: string; radiographyPlanRows: NDTRadiographyPlanRow[] } => {
  const rd = motor?.radiographyDetails;
  if (!rd) return { equipment: "", beamEnergies: [], radiographyPlan: "", radiographyPlanRows: [] };

  const planDetails = rd.radiographyPlanDetails;
  const planRows: NDTRadiographyPlanRow[] = planDetails
    ? [{
        srNo: 1,
        sections: String(planDetails.numberOfSections ?? ""),
        orientations: String(planDetails.numberOfOrientations ?? ""),
        sfd: String(planDetails.sfd ?? ""),
        normalExposures: String(planDetails.numberOfNormalExposures ?? ""),
        tangentialExposures: String(planDetails.numberOfTangentialExposures ?? ""),
        detectorType: planDetails.detectorType ?? "",
      }]
    : [];

  return {
    equipment: rd.equipmentUtilized ?? "",
    beamEnergies: Array.isArray(rd.xrayBeamEnergies) ? rd.xrayBeamEnergies : [],
    radiographyPlan: rd.radiographyPlanId ?? "",
    radiographyPlanRows: planRows,
  };
};

const mapMotorSessionFromApi = (motor: any): NDTMotorSession =>
  normalizeNDTMotorSession({
    motorId: String(motor?.motorId ?? ""),
    additionalExposureRows: (motor?.additionalExposureDetails ?? []).map((row: any) => ({
      sectionNumber: String(row.sectionNumber ?? ""),
      orientation: row.orientation ?? "",
      exposureCount: String(row.numberOfExposure ?? ""),
    })),
    radiographyObservationRows: (motor?.radiographyObservations ?? []).map((row: any) => ({
      section: String(row.sectionNumber ?? ""),
      orientation: row.orientation ?? "",
      observations: row.observation ?? "",
      files: Array.isArray(row.uploadedImages) ? row.uploadedImages : [],
    })),
    visualInspectionRows: (motor?.visualInspectionDetails ?? []).map((row: any) => ({
      observation: row.observationType ?? "",
      isPreset: false,
      section: String(row.sectionNumber ?? ""),
      orientation: row.orientation ?? "",
      files: Array.isArray(row.uploadedImages) ? row.uploadedImages : [],
    })),
    visualInspectionMedia: Array.isArray(motor?.uploadedVideos) ? motor.uploadedVideos : [],
    signedReport: motor?.signedNdtReport?.documentId ?? null,
    additionalRemarks: motor?.additionalRemarks ?? "",
  });

const mapMotorSessionToApi = (
  motor: NDTMotorSession,
  formEquipment: string,
  formBeamEnergies: string[],
  formRadiographyPlan: string,
  formRadiographyPlanRows: NDTRadiographyPlanRow[],
) => {
  const firstRow = formRadiographyPlanRows[0];

  return {
    motorId: motor.motorId ?? "",
    radiographyDetails: {
      equipmentUtilized: formEquipment,
      xrayBeamEnergies: formBeamEnergies,
      radiographyPlanId: formRadiographyPlan,
      ...(firstRow
        ? {
            radiographyPlanDetails: {
              numberOfSections: Number(firstRow.sections) || 0,
              numberOfOrientations: Number(firstRow.orientations) || 0,
              sfd: Number(firstRow.sfd) || 0,
              numberOfNormalExposures: Number(firstRow.normalExposures) || 0,
              numberOfTangentialExposures: Number(firstRow.tangentialExposures) || 0,
              detectorType: firstRow.detectorType ?? "",
            },
          }
        : {}),
    },
    additionalExposureDetails: (motor.additionalExposureRows ?? []).map((row) => ({
      sectionNumber: Number(row.sectionNumber) || 0,
      orientation: row.orientation ?? "",
      numberOfExposure: Number(row.exposureCount) || 0,
    })),
    radiographyObservations: (motor.radiographyObservationRows ?? []).map((row) => ({
      sectionNumber: Number(row.section) || 0,
      orientation: row.orientation ?? "",
      observation: row.observations ?? "",
      uploadedImages: normalizeFilePaths(row.files ?? []),
    })),
    visualInspectionDetails: (motor.visualInspectionRows ?? [])
      .filter((row) => row.section || row.orientation || row.files?.length)
      .map((row) => ({
        observationType: row.observation ?? "",
        sectionNumber: Number(row.section) || 0,
        orientation: row.orientation ?? "",
        observation: "",
        uploadedImages: normalizeFilePaths(row.files ?? []),
      })),
    uploadedVideos: normalizeFilePaths(motor.visualInspectionMedia ?? []),
    additionalRemarks: motor.additionalRemarks ?? "",
    signedNdtReport: {
      documentId: normalizeSingleFilePath(motor.signedReport) ?? "",
    },
  };
};

const hydrateFormState = (payload: any): NDTFormState => {
  if (Array.isArray(payload?.motors) && payload.motors.length > 0) {
    const rd = extractRadiographyDetails(payload.motors[0]);

    return normalizeNDTFormState({
      batchId: payload?.batchId ?? "",
      formLoaded: true,
      equipment: rd.equipment,
      beamEnergies: rd.beamEnergies,
      radiographyPlan: rd.radiographyPlan,
      radiographyPlanRows: rd.radiographyPlanRows,
      motors: payload.motors.map(mapMotorSessionFromApi),
      motorId: payload?.motorId ?? payload.motors[0]?.motorId,
    });
  }

  return normalizeNDTFormState({
    batchId: payload?.batchId,
    motorId: payload?.motorId,
    equipment: payload?.equipment,
    beamEnergies: payload?.beamEnergies,
    radiographyPlan: payload?.radiographyPlan,
    radiographyPlanRows: payload?.radiographyPlanRows,
    additionalExposureRows: payload?.additionalExposureRows,
    radiographyObservationRows: payload?.radiographyObservationRows,
    visualInspectionRows: payload?.visualInspectionRows,
    visualInspectionMedia: payload?.visualInspectionMediaFilePaths ?? payload?.visualInspectionMedia,
    signedReport: payload?.signedReportFilePath ?? payload?.signedReport,
    additionalRemarks: payload?.additionalRemarks,
    formLoaded: true,
  });
};

export class NDTSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(payload: { formId?: string; batchId?: string; status?: string }) {
    this.formId = payload.formId ?? "";
    this.batchId = payload.batchId ?? "";
    this.status = payload.status ?? "";
  }

  static fromApi(apiResponse: any): NDTSubmitResponseModel {
    return new NDTSubmitResponseModel(apiResponse?.data ?? {});
  }
}

export class NDTDetailsModel {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  data: NDTFormState;
  workflowInsights: {
    currentStatus: string;
    rejectionReason: string | null;
  };

  constructor(payload: any) {
    this.formId = payload?.formId ?? "";
    this.batchId = payload?.batchId ?? "";
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.formSubmissionType = payload?.formSubmissionType ?? "";
    this.data = hydrateFormState(payload);
    this.workflowInsights = {
      currentStatus: payload?.workflowInsights?.currentStatus ?? "",
      rejectionReason: payload?.workflowInsights?.rejectionReason ?? null,
    };
  }

  static fromApi(apiResponse: any): NDTDetailsModel {
    return new NDTDetailsModel(apiResponse?.data ?? {});
  }

  static toFormState(model: NDTDetailsModel): NDTFormState {
    return model.data;
  }
}

export const mapNDTPayload = (form: NDTFormState) => {
  const normalized = normalizeNDTFormState(form);

  return {
    motors: normalized.motors.map((motor) =>
      mapMotorSessionToApi(
        motor,
        normalized.equipment ?? "",
        normalized.beamEnergies ?? [],
        normalized.radiographyPlan ?? "",
        normalized.radiographyPlanRows ?? [],
      ),
    ),
  };
};

export { createDefaultNDTFormState };
