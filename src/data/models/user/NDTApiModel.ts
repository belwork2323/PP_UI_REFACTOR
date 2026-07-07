import {
  createDefaultNDTFormState,
  normalizeNDTFormState,
  normalizeNDTMotorSession,
  type NDTFileValue,
  type NDTFormState,
  type NDTMotorSession,
  type NDTRadiographyPlanRow,
  type NDTVisualInspectionRow,
} from "./NDTFormModel";
import { NDT_VISUAL_INSPECTION_PRESETS } from "../../../hooks/user/qualityControl/ndtFlowConfig";
import {
  NDT_CUSTOM_OBSERVATION_TYPE,
  fileToNdtApiRef,
  filesToNdtApiRefs,
  mapNdtBeamEnergiesFromApi,
  mapNdtBeamEnergiesToApi,
  mapNdtDetectorTypeFromApi,
  mapNdtDetectorTypeToApi,
  mapNdtEquipmentFromApi,
  mapNdtEquipmentToApi,
  mapNdtObservationTypeFromApi,
  mapNdtObservationTypeToApi,
  mapNdtOrientationFromApi,
  mapNdtOrientationToApi,
  mapNdtRadiographyPlanFromApi,
  mapNdtRadiographyPlanToApi,
  parseNdtPositiveInt,
} from "../../../hooks/user/qualityControl/ndtApiMappings";

export type NDTSubmissionType = "DRAFT" | "SUBMIT" | "UPDATE";

const createPresetVisualRows = (): NDTVisualInspectionRow[] =>
  NDT_VISUAL_INSPECTION_PRESETS.map((observation) => ({
    observation,
    isPreset: true,
    section: "",
    orientation: "",
    files: [],
  }));

const mergeVisualInspectionFromApi = (apiRows: any[] = []): NDTVisualInspectionRow[] => {
  const presets = createPresetVisualRows();

  if (!Array.isArray(apiRows) || apiRows.length === 0) {
    return presets;
  }

  const customRows: NDTVisualInspectionRow[] = [];

  for (const apiRow of apiRows) {
    const presetLabel = mapNdtObservationTypeFromApi(String(apiRow?.observationType ?? ""));
    const presetIndex = presets.findIndex((row) => row.observation === presetLabel);

    if (presetIndex >= 0) {
      presets[presetIndex] = {
        ...presets[presetIndex],
        section: String(apiRow?.sectionNumber ?? ""),
        orientation: mapNdtOrientationFromApi(apiRow?.orientation ?? ""),
        observationNotes: apiRow?.observation ?? "",
        files: Array.isArray(apiRow?.uploadedImages) ? apiRow.uploadedImages : [],
      };
      continue;
    }

    const observationText = String(apiRow?.observation ?? apiRow?.observationType ?? "").trim();
    if (!observationText && !apiRow?.sectionNumber && !apiRow?.orientation && !apiRow?.uploadedImages?.length) {
      continue;
    }

    customRows.push({
      observation: observationText,
      isPreset: false,
      section: String(apiRow?.sectionNumber ?? ""),
      orientation: mapNdtOrientationFromApi(apiRow?.orientation ?? ""),
      files: Array.isArray(apiRow?.uploadedImages) ? apiRow.uploadedImages : [],
    });
  }

  return [...presets, ...customRows];
};

const extractRadiographyDetails = (motor: any): {
  equipment: string;
  beamEnergies: string[];
  radiographyPlan: string;
  radiographyPlanRows: NDTRadiographyPlanRow[];
} => {
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
        detectorType: mapNdtDetectorTypeFromApi(planDetails.detectorType ?? ""),
      }]
    : [];

  return {
    equipment: mapNdtEquipmentFromApi(rd.equipmentUtilized ?? ""),
    beamEnergies: mapNdtBeamEnergiesFromApi(rd.xrayBeamEnergies),
    radiographyPlan: mapNdtRadiographyPlanFromApi(rd.radiographyPlanId ?? ""),
    radiographyPlanRows: planRows,
  };
};

const mapMotorSessionFromApi = (motor: any): NDTMotorSession => {
  const radiography = extractRadiographyDetails(motor);

  return normalizeNDTMotorSession({
    motorId: String(motor?.motorId ?? ""),
    equipment: radiography.equipment,
    beamEnergies: radiography.beamEnergies,
    radiographyPlan: radiography.radiographyPlan,
    radiographyPlanRows: radiography.radiographyPlanRows,
    additionalExposureRows: (motor?.additionalExposureDetails ?? []).map((row: any) => ({
      sectionNumber: String(row.sectionNumber ?? ""),
      orientation: mapNdtOrientationFromApi(row.orientation ?? ""),
      exposureCount: String(row.numberOfExposure ?? ""),
    })),
    radiographyObservationRows: (motor?.radiographyObservations ?? []).map((row: any) => ({
      section: String(row.sectionNumber ?? ""),
      orientation: mapNdtOrientationFromApi(row.orientation ?? ""),
      observations: row.observation ?? "",
      files: Array.isArray(row.uploadedImages) ? row.uploadedImages : [],
    })),
    visualInspectionRows: mergeVisualInspectionFromApi(motor?.visualInspectionDetails),
    visualInspectionMedia: Array.isArray(motor?.uploadedVideos) ? motor.uploadedVideos : [],
    signedReport: motor?.signedNdtReport?.documentId ?? null,
    additionalRemarks: motor?.additionalRemarks ?? "",
  });
};

const mapVisualInspectionRowToApi = (row: NDTVisualInspectionRow) => {
  const sectionNumber = parseNdtPositiveInt(row.section);
  return {
    observationType: row.isPreset
      ? mapNdtObservationTypeToApi(row.observation)
      : NDT_CUSTOM_OBSERVATION_TYPE,
    sectionNumber: sectionNumber ?? 0,
    orientation: mapNdtOrientationToApi(row.orientation),
    observation: row.isPreset ? row.observationNotes ?? "" : row.observation ?? "",
    uploadedImages: filesToNdtApiRefs(row.files ?? []),
  };
};

const visualInspectionRowHasValue = (row: NDTVisualInspectionRow) => {
  const hasText = (value?: string) => Boolean(String(value ?? "").trim());
  return (
    hasText(row.section) ||
    hasText(row.orientation) ||
    (row.files?.length ?? 0) > 0 ||
    hasText(row.observationNotes) ||
    (!row.isPreset && hasText(row.observation))
  );
};

const hasRadiographyPlanDetails = (motor: NDTMotorSession) => {
  const firstRow = motor.radiographyPlanRows?.[0];
  if (!firstRow || !motor.radiographyPlan?.trim()) return false;
  return Boolean(
    Number(firstRow.sections) ||
      Number(firstRow.orientations) ||
      Number(firstRow.sfd) ||
      Number(firstRow.normalExposures) ||
      Number(firstRow.tangentialExposures) ||
      String(firstRow.detectorType ?? "").trim(),
  );
};

const mapMotorSessionToApi = (motor: NDTMotorSession) => {
  const normalized = normalizeNDTMotorSession(motor);
  const includePlanDetails = hasRadiographyPlanDetails(normalized);

  return {
    motorId: normalized.motorId ?? "",
    radiographyDetails: {
      equipmentUtilized: mapNdtEquipmentToApi(normalized.equipment ?? ""),
      xrayBeamEnergies: mapNdtBeamEnergiesToApi(normalized.beamEnergies ?? []),
      radiographyPlanId: mapNdtRadiographyPlanToApi(normalized.radiographyPlan ?? ""),
      ...(includePlanDetails
        ? {
            radiographyPlanDetails: {
              numberOfSections: Number(normalized.radiographyPlanRows[0].sections) || 0,
              numberOfOrientations: Number(normalized.radiographyPlanRows[0].orientations) || 0,
              sfd: Number(normalized.radiographyPlanRows[0].sfd) || 0,
              numberOfNormalExposures: Number(normalized.radiographyPlanRows[0].normalExposures) || 0,
              numberOfTangentialExposures: Number(normalized.radiographyPlanRows[0].tangentialExposures) || 0,
              detectorType: mapNdtDetectorTypeToApi(normalized.radiographyPlanRows[0].detectorType ?? ""),
            },
          }
        : {}),
    },
    additionalExposureDetails: (normalized.additionalExposureRows ?? [])
      .filter((row) => parseNdtPositiveInt(row.sectionNumber) !== null)
      .map((row) => ({
        sectionNumber: parseNdtPositiveInt(row.sectionNumber)!,
        orientation: mapNdtOrientationToApi(row.orientation),
        numberOfExposure: parseNdtPositiveInt(row.exposureCount) ?? 0,
      })),
    radiographyObservations: (normalized.radiographyObservationRows ?? [])
      .filter((row) => parseNdtPositiveInt(row.section) !== null)
      .map((row) => ({
        sectionNumber: parseNdtPositiveInt(row.section)!,
        orientation: mapNdtOrientationToApi(row.orientation),
        observation: row.observations ?? "",
        uploadedImages: filesToNdtApiRefs(row.files ?? []),
      })),
    visualInspectionDetails: (normalized.visualInspectionRows ?? [])
      .filter(visualInspectionRowHasValue)
      .filter((row) => {
        const sectionText = String(row.section ?? "").trim();
        return !sectionText || parseNdtPositiveInt(row.section) !== null;
      })
      .map(mapVisualInspectionRowToApi),
    uploadedVideos: filesToNdtApiRefs(normalized.visualInspectionMedia ?? []),
    additionalRemarks: normalized.additionalRemarks ?? "",
    signedNdtReport: {
      documentId: fileToNdtApiRef(normalized.signedReport) ?? "",
    },
  };
};

const hydrateFormState = (payload: any): NDTFormState => {
  if (Array.isArray(payload?.motors) && payload.motors.length > 0) {
    const motors = payload.motors.map(mapMotorSessionFromApi);
    const firstMotor = motors[0];

    return normalizeNDTFormState({
      batchId: payload?.batchId ?? "",
      formLoaded: true,
      equipment: firstMotor?.equipment ?? "",
      beamEnergies: firstMotor?.beamEnergies ?? [],
      radiographyPlan: firstMotor?.radiographyPlan ?? "",
      radiographyPlanRows: firstMotor?.radiographyPlanRows ?? [],
      motors,
      motorId: payload?.motorId ?? motors[0]?.motorId,
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

  constructor(payload: { formId?: string; batchId?: string; status?: string; formStatus?: string }) {
    this.formId = payload.formId ?? "";
    this.batchId = payload.batchId ?? "";
    this.status = payload.formStatus ?? payload.status ?? "";
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
  const motors = (normalized.motors ?? [])
    .filter((motor) => String(motor.motorId ?? "").trim())
    .map((motor) => mapMotorSessionToApi(motor));

  return { motors };
};

export { createDefaultNDTFormState };
