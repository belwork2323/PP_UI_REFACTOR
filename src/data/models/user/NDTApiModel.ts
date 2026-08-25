import {
  createDefaultNDTFormState,
  normalizeNDTFormState,
  normalizeNDTMotorSession,
  mapNDTMotorStatusesFromApi,
  type NDTFormState,
  type NDTMotorSession,
  type NDTMotorStatusMeta,
  type NDTMotorSubmissionType,
  type NDTRadiographyPlanRow,
  type NDTVisualInspectionRow,
} from "./NDTFormModel";
import { mapCastingCuringPersonLabel } from "./CastingCuringFormModel";
import { parseFileRef, parseFileRefs, toFileIdListPayload, toFileIdPayloadOrNull } from "../common/FileUploadModel";
import { NDT_VISUAL_INSPECTION_PRESETS } from "../../../hooks/user/qualityControl/ndtFlowConfig";
import {
  NDT_CUSTOM_OBSERVATION_TYPE,
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
        files: parseFileRefs(apiRow?.uploadedImages),
      };
      continue;
    }

    const observationText = String(apiRow?.observation ?? apiRow?.observationType ?? "").trim();
    if (
      !observationText &&
      !apiRow?.sectionNumber &&
      !apiRow?.orientation &&
      !apiRow?.uploadedImages?.length
    ) {
      continue;
    }

    customRows.push({
      observation: observationText,
      isPreset: false,
      section: String(apiRow?.sectionNumber ?? ""),
      orientation: mapNdtOrientationFromApi(apiRow?.orientation ?? ""),
      files: parseFileRefs(apiRow?.uploadedImages),
    });
  }

  return [...presets, ...customRows];
};

const extractRadiographyDetails = (
  motor: any,
): {
  equipment: string[];
  beamEnergies: string[];
  radiographyPlan: string;
  radiographyPlanName: string;
  radiographyPlanRows: NDTRadiographyPlanRow[];
} => {
  const rd = motor?.radiographyDetails;
  if (!rd) {
    return {
      equipment: [],
      beamEnergies: [],
      radiographyPlan: "",
      radiographyPlanName: "",
      radiographyPlanRows: [],
    };
  }

  const planDetails = rd.radiographyPlanDetails;
  const detailsList = Array.isArray(planDetails)
    ? planDetails
    : planDetails && typeof planDetails === "object"
      ? [planDetails]
      : [];

  const planRows: NDTRadiographyPlanRow[] = detailsList.map((entry: any, index: number) => ({
    srNo: Number(entry?.srNo ?? index + 1) || index + 1,
    sections: String(entry?.numberOfSections ?? entry?.sections ?? ""),
    orientations: String(entry?.numberOfOrientations ?? entry?.orientations ?? ""),
    sfd: String(entry?.sfd ?? ""),
    normalExposures: String(entry?.numberOfNormalExposures ?? entry?.normalExposures ?? ""),
    tangentialExposures: String(
      entry?.numberOfTangentialExposures ?? entry?.tangentialExposures ?? "",
    ),
    detectorType: mapNdtDetectorTypeFromApi(String(entry?.detectorType ?? "")),
  }));

  const planId = String(rd.radiographyPlanId ?? "").trim();
  const planName = String(rd.radiographyPlanName ?? "").trim();

  return {
    equipment: mapNdtEquipmentFromApi(rd.equipmentUtilized ?? []),
    beamEnergies: mapNdtBeamEnergiesFromApi(rd.xrayBeamEnergies),
    radiographyPlan: mapNdtRadiographyPlanFromApi(planId) || planId,
    radiographyPlanName: planName,
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
    radiographyPlanName: radiography.radiographyPlanName,
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
      files: parseFileRefs(row.uploadedImages),
    })),
    visualInspectionRows: mergeVisualInspectionFromApi(motor?.visualInspectionDetails),
    visualInspectionMedia: parseFileRefs(motor?.uploadedVideos),
    signedReport:
      parseFileRef(
        motor?.signedNdtReport?.documentId ??
          motor?.signedNdtReport?.report ??
          motor?.signedNdtReport,
      ) ?? null,
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
    observation: row.isPreset ? (row.observationNotes ?? "") : (row.observation ?? ""),
    uploadedImages: toFileIdListPayload(row.files ?? []),
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
  const rows = motor.radiographyPlanRows ?? [];
  if (!rows.length || !String(motor.radiographyPlan ?? "").trim()) return false;
  return rows.some((row) =>
    Boolean(
      Number(row.sections) ||
        Number(row.orientations) ||
        Number(row.sfd) ||
        Number(row.normalExposures) ||
        Number(row.tangentialExposures) ||
        String(row.detectorType ?? "").trim(),
    ),
  );
};

const mapMotorSessionToApi = (motor: NDTMotorSession) => {
  const normalized = normalizeNDTMotorSession(motor);
  const includePlanDetails = hasRadiographyPlanDetails(normalized);
  const planDetails = includePlanDetails
    ? (normalized.radiographyPlanRows ?? [])
        .filter(
          (row) =>
            Number(row.sections) ||
            Number(row.orientations) ||
            Number(row.sfd) ||
            Number(row.normalExposures) ||
            Number(row.tangentialExposures) ||
            String(row.detectorType ?? "").trim(),
        )
        .map((row) => ({
          numberOfSections: Number(row.sections) || 0,
          numberOfOrientations: Number(row.orientations) || 0,
          sfd: Number(row.sfd) || 0,
          numberOfNormalExposures: Number(row.normalExposures) || 0,
          numberOfTangentialExposures: Number(row.tangentialExposures) || 0,
          detectorType: mapNdtDetectorTypeToApi(row.detectorType ?? ""),
        }))
    : [];

  return {
    motorId: normalized.motorId ?? "",
    radiographyDetails: {
      equipmentUtilized: mapNdtEquipmentToApi(normalized.equipment ?? []),
      xrayBeamEnergies: mapNdtBeamEnergiesToApi(normalized.beamEnergies ?? []),
      radiographyPlanId: mapNdtRadiographyPlanToApi(normalized.radiographyPlan ?? ""),
      ...(String(normalized.radiographyPlanName ?? "").trim()
        ? { radiographyPlanName: String(normalized.radiographyPlanName).trim() }
        : {}),
      ...(planDetails.length > 0 ? { radiographyPlanDetails: planDetails } : {}),
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
        uploadedImages: toFileIdListPayload(row.files ?? []),
      })),
    visualInspectionDetails: (normalized.visualInspectionRows ?? [])
      .filter(visualInspectionRowHasValue)
      .filter((row) => {
        const sectionText = String(row.section ?? "").trim();
        return !sectionText || parseNdtPositiveInt(row.section) !== null;
      })
      .map(mapVisualInspectionRowToApi),
    uploadedVideos: toFileIdListPayload(normalized.visualInspectionMedia ?? []),
    additionalRemarks: normalized.additionalRemarks ?? "",
    signedNdtReport: (() => {
      const ready = toFileIdPayloadOrNull(normalized.signedReport);
      if (ready) {
        return {
          documentId: ready.fileId,
          report: ready,
        };
      }
      return { documentId: "" };
    })(),
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
    visualInspectionMedia: parseFileRefs(
      payload?.visualInspectionMediaFilePaths ?? payload?.visualInspectionMedia,
    ),
    signedReport:
      parseFileRef(payload?.signedReportFilePath ?? payload?.signedReport) ?? null,
    additionalRemarks: payload?.additionalRemarks,
    formLoaded: true,
  });
};

export class NDTSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(payload: {
    formId?: string;
    batchId?: string;
    status?: string;
    formStatus?: string;
  }) {
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
  batchType: string | null;
  subDepartmentId: number;
  formSubmissionType: string;
  formStatus: string;
  createdBy: string | null;
  createdAt: string | null;
  submittedBy: string | null;
  submittedAt: string | null;
  lastUpdatedBy: string | null;
  lastUpdatedAt: string | null;
  data: NDTFormState;
  motorStatuses: Record<string, NDTMotorStatusMeta>;
  motorCounts?: {
    pendingMotorCount?: number;
    approvedMotorCount?: number;
    rejectedMotorCount?: number;
    inProgressMotorCount?: number;
    totalMotorCount?: number;
  };
  workflowInsights: {
    currentStatus: string;
    rejectionReason: string | null;
  };

  constructor(payload: any) {
    this.formId = payload?.formId ?? "";
    this.batchId = payload?.batchId ?? "";
    this.batchType = payload?.batchType != null ? String(payload.batchType) : null;
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.formSubmissionType = payload?.formSubmissionType ?? "";
    this.formStatus = String(payload?.formStatus ?? payload?.status ?? "");
    this.createdBy = mapCastingCuringPersonLabel(payload?.createdBy);
    this.createdAt =
      payload?.createdAt != null
        ? String(payload.createdAt)
        : payload?.createdOn != null
          ? String(payload.createdOn)
          : null;
    this.submittedBy = mapCastingCuringPersonLabel(payload?.submittedBy);
    this.submittedAt =
      payload?.submittedAt != null
        ? String(payload.submittedAt)
        : payload?.submittedOn != null
          ? String(payload.submittedOn)
          : null;
    this.lastUpdatedBy = mapCastingCuringPersonLabel(payload?.lastUpdatedBy ?? payload?.updatedBy);
    this.lastUpdatedAt =
      payload?.lastUpdatedAt != null
        ? String(payload.lastUpdatedAt)
        : payload?.updatedAt != null
          ? String(payload.updatedAt)
          : payload?.updatedOn != null
            ? String(payload.updatedOn)
            : null;
    this.data = hydrateFormState(payload);
    this.motorStatuses = mapNDTMotorStatusesFromApi(payload);
    this.motorCounts = payload?.motorCounts;
    this.workflowInsights = {
      currentStatus: payload?.workflowInsights?.currentStatus ?? this.formStatus ?? "",
      rejectionReason:
        payload?.workflowInsights?.rejectionReason ?? payload?.rejectionReason ?? null,
    };
  }

  static fromApi(apiResponse: any): NDTDetailsModel {
    return new NDTDetailsModel(apiResponse?.data ?? {});
  }

  static toFormState(model: NDTDetailsModel): NDTFormState {
    return model.data;
  }
}

export const mapNDTPayload = (
  form: NDTFormState,
  options?: {
    targetMotorIds?: string[];
    motorSubmissionType?: NDTMotorSubmissionType;
  },
) => {
  const normalized = normalizeNDTFormState(form);
  const targetIds = options?.targetMotorIds?.length
    ? new Set(options.targetMotorIds.map((id) => String(id).trim()).filter(Boolean))
    : null;

  const motors = (normalized.motors ?? [])
    .filter((motor) => String(motor.motorId ?? "").trim())
    .filter((motor) => !targetIds || targetIds.has(motor.motorId))
    .map((motor) => ({
      ...mapMotorSessionToApi(motor),
      ...(options?.motorSubmissionType
        ? { motorSubmissionType: options.motorSubmissionType }
        : {}),
    }));

  return { motors };
};

/** Build final-approval payload from latest saved form details (all motors). */
export const mapNDTDetailsFromSavedForm = (
  details: any,
  options?: { motorStatusById?: Record<string, NDTMotorStatusMeta> },
) => {
  const model =
    details instanceof NDTDetailsModel ? details : new NDTDetailsModel(details?.data ?? details);
  const payload = mapNDTPayload(model.data);
  const statusById =
    options?.motorStatusById ??
    (Object.keys(model.motorStatuses ?? {}).length > 0
      ? model.motorStatuses
      : mapNDTMotorStatusesFromApi(details));

  return {
    motors: payload.motors.map((motor) => ({
      ...motor,
      motorSubmissionType: statusById[motor.motorId]?.motorSubmissionType ?? "SUBMIT",
    })),
  };
};

export { createDefaultNDTFormState };
