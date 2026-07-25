import {
  buildTrimmingSectionPayload,
  createTrimmingInitialValues,
  hydrateTrimmingValuesFromSections,
  mapTrimmingMotorStage,
  resolveTrimmingMotorStageNumber,
  schemaValuesHaveUserData,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../schema-engine";
import type { CasePrepDetailSection } from "./CasePreparationFormModel";
import {
  mapCastingCuringPersonLabel,
  parseCastingCuringSectionData,
} from "./CastingCuringFormModel";

const TRIMMING_SECTION_LABELS: Record<string, string> = {
  TRIMMING_DETAILS: "Trimming Details",
  DIMENSIONS_AFTER_TRIMMING: "Dimensions After Trimming",
};

export type TrimmingDetailsRow = {
  machineDetails: string;
  startDate: string;
  completionDate: string;
  arborSize: string;
  cutterSize: string;
  remarks: string;
};

export type TrimmingCommonFormatStage = {
  stageName: string; // e.g., "Before Trimming", "After Trimming"
  readings: Record<string, string>;
};

export type TrimmingCommonFormatParameter = {
  parameterId?: string; // UNIQUE IDENTIFIER FOR DB / REACT KEY
  parameterName: string;
  stages: TrimmingCommonFormatStage[];
};

// NEW: Structured document metadata for report files
export type TrimmingReportFile = {
  documentType: string;
  originalFileName: string;
  filePath: string;
  storedFileName: string;
  mimeType: string;
  fileSize: number;
};

export type TrimmingMotorSession = {
  motorId: string;
  motorStage: number;
  motorReceivedAt: string;
  schema: SchemaDocumentV2 | null;
  formValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
  trimmingDetails: TrimmingDetailsRow[];
  commonFormatParameters: TrimmingCommonFormatParameter[];
  motorRemarks: string;
  reportFile?: TrimmingReportFile | null; // UPDATED to structured file object
  reportLink?: string; // Fallback / legacy support
};

export const createTrimmingData = () => ({
  schemaFormLoaded: false,
  trimmingSchema: null as SchemaDocumentV2 | null,
  schemasByStage: {} as Record<number, SchemaDocumentV2>,
  selectedMotorStage: null as string | null,
  motors: [] as TrimmingMotorSession[],
  schemaFormValues: {} as SchemaFormValues,
  savedSections: undefined as SchemaSectionSubmission[] | undefined,
});

export type TrimmingFormState = ReturnType<typeof createTrimmingData>;

export type TrimmingDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  status?: string;
  batchType?: string;
  motorReceivedDate?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
  submittedBy?: string | null;
  submittedAt?: string | null;
  lastUpdatedBy?: string | null;
  lastUpdatedAt?: string | null;
  motorStage?: number | string;
  motors?: Array<{
    motorId?: string;
    motorStage?: number | string;
    motorReceivedAt?: string;
    sections?: SchemaSectionSubmission[];
  }>;
  sections?: SchemaSectionSubmission[];
};

export type TrimmingMotorSubmission = {
  motorId: string;
  motorStage: number;
  motorReceivedAt: string;
  sections: SchemaSectionSubmission[];
};

export type TrimmingFormBody = {
  motorStage?: number;
  motors?: TrimmingMotorSubmission[];
  sections?: SchemaSectionSubmission[];
};

export const createDefaultTrimmingFormState = (): TrimmingFormState => createTrimmingData();

const createDefaultTrimmingDetailsRows = (): TrimmingDetailsRow[] => [
  {
    machineDetails: "",
    startDate: "",
    completionDate: "",
    arborSize: "",
    cutterSize: "",
    remarks: "",
  },
];

const createDefaultCommonFormatParameters = (): TrimmingCommonFormatParameter[] => [
  {
    parameterId: "PARAM-001",
    parameterName: "Parameter 1",
    stages: [
      {
        stageName: "Before Trimming",
        readings: { R2T: "", R2B: "", R1R: "", R1L: "" },
      },
      {
        stageName: "After Trimming",
        readings: { R2T: "", R2B: "", R1R: "", R1L: "" },
      },
    ],
  },
  {
    parameterId: "PARAM-002",
    parameterName: "Parameter 2",
    stages: [
      {
        stageName: "Before Trimming",
        readings: { R2T: "", R2B: "", R1R: "", R1L: "" },
      },
      {
        stageName: "After Trimming",
        readings: { R2T: "", R2B: "", R1R: "", R1L: "" },
      },
    ],
  },
];

export const createEmptyTrimmingMotorSession = (
  motorId: string,
  motorStage: number | string,
  motorReceivedAt: string,
  schema: SchemaDocumentV2 | null,
): TrimmingMotorSession => ({
  motorId,
  motorStage: resolveTrimmingMotorStageNumber({ motorStage }),
  motorReceivedAt,
  schema,
  formValues: schema ? createTrimmingInitialValues(schema) : {},
  savedSections: undefined,
  trimmingDetails: createDefaultTrimmingDetailsRows(),
  commonFormatParameters: createDefaultCommonFormatParameters(),
  motorRemarks: "",
  reportFile: null,
  reportLink: "",
});

export const hydrateTrimmingMotorSession = (
  motor: TrimmingMotorSession,
  schema: SchemaDocumentV2 | null,
): TrimmingMotorSession => {
  if (!schema) return motor;

  return {
    ...motor,
    schema,
    formValues: motor.savedSections?.length
      ? hydrateTrimmingValuesFromSections(schema, motor.savedSections)
      : Object.keys(motor.formValues ?? {}).length > 0
        ? motor.formValues
        : createTrimmingInitialValues(schema),
  };
};

export const hydrateTrimmingFormState = (
  state: TrimmingFormState,
  schema: SchemaDocumentV2,
  motorStage?: number | string,
): TrimmingFormState => {
  const stageNum = resolveTrimmingMotorStageNumber({
    motorStage: motorStage ?? state.selectedMotorStage,
  });
  const schemasByStage = {
    ...(state.schemasByStage ?? {}),
    [stageNum]: schema,
  };

  const motors = (state.motors ?? []).map((motor) =>
    motor.motorStage === stageNum ? hydrateTrimmingMotorSession(motor, schema) : motor,
  );

  return {
    ...state,
    trimmingSchema: schema,
    schemasByStage,
    motors,
    schemaFormLoaded: true,
  };
};

export const mapTrimmingDetailsToFormState = (
  details: Partial<TrimmingDetails>,
): TrimmingFormState => {
  const defaults = createDefaultTrimmingFormState();
  const rawMotors = Array.isArray(details?.motors) ? details.motors : [];
  const savedSections = Array.isArray(details?.sections) ? details.sections : undefined;
  const motorStage = details?.motorStage;

  const motors: TrimmingMotorSession[] = rawMotors
    .map((motor) => {
      const motorSections = Array.isArray(motor?.sections) ? motor.sections : [];

      // Extract section-specific data if available
      const detailsSection = motorSections.find((s) => s.sectionId === "TRIMMING_DETAILS");
      const commonSection = motorSections.find((s) => s.sectionId === "TRIMMING_COMMON_FORMAT");
      const remarksSection = motorSections.find((s) => s.sectionId === "TRIMMING_REMARKS");

      const remarksData = (remarksSection?.sectionData?.[0] as any) ?? {};

      return {
        motorId: String(motor?.motorId ?? "").trim(),
        motorStage: resolveTrimmingMotorStageNumber({
          motorStage: motor?.motorStage ?? motorStage,
        }),
        motorReceivedAt: String(motor?.motorReceivedAt ?? "").trim(),
        schema: null,
        formValues: {},
        savedSections: motorSections.length > 0 ? motorSections : undefined,
        trimmingDetails:
          (detailsSection?.sectionData as TrimmingDetailsRow[]) ??
          createDefaultTrimmingDetailsRows(),
        commonFormatParameters:
          (commonSection?.sectionData as TrimmingCommonFormatParameter[]) ??
          createDefaultCommonFormatParameters(),
        motorRemarks: remarksData.remarks ?? "",
        reportFile: remarksData.reportFile ?? null,
        reportLink: remarksData.reportLink ?? "",
      };
    })
    .filter((motor) => motor.motorId.length > 0);

  if (motors.length === 0 && savedSections?.length) {
    motors.push({
      motorId: "",
      motorStage: resolveTrimmingMotorStageNumber({ motorStage }),
      motorReceivedAt: "",
      schema: null,
      formValues: {},
      savedSections,
      trimmingDetails: createDefaultTrimmingDetailsRows(),
      commonFormatParameters: createDefaultCommonFormatParameters(),
      motorRemarks: "",
      reportFile: null,
      reportLink: "",
    });
  }

  return {
    ...defaults,
    schemaFormLoaded: Boolean(
      motors.some((motor) => motor.savedSections?.length) || savedSections?.length,
    ),
    selectedMotorStage: motorStage != null ? String(motorStage) : null,
    motors,
    savedSections,
  };
};

export const mapTrimmingFormStateToPayload = (form: TrimmingFormState): TrimmingFormBody => {
  const motors = (form.motors ?? [])
    .filter((motor) => motor.motorId.trim().length > 0)
    .map((motor) => {
      const schema = motor.schema ?? form.schemasByStage?.[motor.motorStage] ?? form.trimmingSchema;
      const sections: SchemaSectionSubmission[] = [];

      // 1. Trimming Details
      if (motor.trimmingDetails?.length) {
        sections.push({ sectionId: "TRIMMING_DETAILS", sectionData: motor.trimmingDetails });
      }

      // 2. Trimming Common Format
      if (motor.commonFormatParameters?.length) {
        sections.push({
          sectionId: "TRIMMING_COMMON_FORMAT",
          sectionData: motor.commonFormatParameters,
        });
      }

      // 3. Trimming Remarks & File Upload
      if (motor.motorRemarks?.trim() || motor.reportFile || motor.reportLink?.trim()) {
        const remarksPayload: Record<string, any> = {
          remarks: motor.motorRemarks ?? "",
        };

        if (motor.reportFile) {
          remarksPayload.reportFile = motor.reportFile;
        } else if (motor.reportLink) {
          remarksPayload.reportLink = motor.reportLink;
        }

        sections.push({
          sectionId: "TRIMMING_REMARKS",
          sectionData: [remarksPayload],
        });
      }

      // 4. Schema Engine Fields
      if (schema) {
        sections.push(...buildTrimmingSectionPayload(schema, motor.formValues));
      }

      return {
        motorId: motor.motorId,
        motorStage: motor.motorStage,
        motorReceivedAt: motor.motorReceivedAt,
        sections,
      };
    });

  if (motors.length > 0) {
    return {
      motorStage: motors[0]?.motorStage,
      motors,
    };
  }

  const fallbackSchema = form.trimmingSchema;
  return {
    motorStage: resolveTrimmingMotorStageNumber({ motorStage: form.selectedMotorStage }),
    sections: fallbackSchema
      ? buildTrimmingSectionPayload(fallbackSchema, form.schemaFormValues)
      : [],
  };
};

export const hasAnyTrimmingValue = (form: TrimmingFormState) => {
  const hasMotorData = (motor: TrimmingMotorSession) => {
    if (schemaValuesHaveUserData(motor.formValues ?? {})) return true;
    if (motor.motorRemarks?.trim() || motor.reportFile || motor.reportLink?.trim()) return true;

    if (
      motor.trimmingDetails?.some((row) =>
        [
          row.machineDetails,
          row.startDate,
          row.completionDate,
          row.arborSize,
          row.cutterSize,
          row.remarks,
        ].some((value) => String(value ?? "").trim().length > 0),
      )
    ) {
      return true;
    }

    if (
      motor.commonFormatParameters?.some((param) =>
        param.stages.some((stage) =>
          Object.values(stage.readings).some((value) => String(value ?? "").trim().length > 0),
        ),
      )
    ) {
      return true;
    }
    return false;
  };

  if ((form.motors ?? []).some((motor) => hasMotorData(motor))) {
    return true;
  }

  return schemaValuesHaveUserData(form.schemaFormValues ?? {});
};

export type TrimmingMotorDetailView = {
  motorId: string;
  motorStageLabel: string;
  motorReceivedAt: string;
  sections: CasePrepDetailSection[];
};

export type TrimmingDetailView = {
  formId: string;
  batchId: string;
  batchType: string;
  status?: string;
  createdBy: string | null;
  createdAt: string | null;
  submittedBy: string | null;
  submittedAt: string | null;
  lastUpdatedBy: string | null;
  lastUpdatedAt: string | null;
  motors: TrimmingMotorDetailView[];
};

const parseTrimmingDisplaySections = (sections: unknown[] | undefined): CasePrepDetailSection[] =>
  (sections ?? [])
    .map((section) => {
      const block = section as { sectionId?: string; sectionData?: Record<string, unknown>[] };
      const parsed = parseCastingCuringSectionData(
        String(block.sectionId ?? ""),
        block.sectionData as Record<string, unknown>[] | undefined,
      );
      return {
        ...parsed,
        label: TRIMMING_SECTION_LABELS[parsed.sectionId] ?? parsed.label,
      };
    })
    .filter((section) => section.fields.length > 0 || section.tables.length > 0);

const resolveTrimmingMotorSections = (motor: Record<string, unknown>): CasePrepDetailSection[] => {
  if (Array.isArray(motor.sections)) {
    return parseTrimmingDisplaySections(motor.sections as unknown[]);
  }

  const details = (motor.details ?? motor) as Record<string, unknown>;
  if (Array.isArray(details.sections)) {
    return parseTrimmingDisplaySections(details.sections as unknown[]);
  }

  return [];
};

export const mapTrimmingDetailsForDisplay = (
  data: Record<string, unknown> | null | undefined,
): TrimmingDetailView | null => {
  if (!data) return null;

  const details = (data.trimmingDetails ?? data) as Record<string, unknown>;
  const rawMotors = Array.isArray(details.motors) ? details.motors : [];

  const motors: TrimmingMotorDetailView[] = rawMotors
    .map((motor) => {
      const entry = motor as Record<string, unknown>;
      const src = (entry.details ?? entry) as Record<string, unknown>;
      const motorStage = src.motorStage ?? entry.motorStage;

      return {
        motorId: String(entry.motorId ?? src.motorId ?? "").trim(),
        motorStageLabel: mapTrimmingMotorStage(motorStage),
        motorReceivedAt: String(src.motorReceivedAt ?? entry.motorReceivedAt ?? "").trim(),
        sections: resolveTrimmingMotorSections(entry),
      };
    })
    .filter((motor) => motor.motorId.length > 0);

  return {
    formId: String(details.formId ?? ""),
    batchId: String(details.batchId ?? ""),
    batchType: details.batchType != null ? String(details.batchType) : "",
    status: details.status != null ? String(details.status) : undefined,
    createdBy: mapCastingCuringPersonLabel(details.createdBy),
    createdAt: details.createdAt != null ? String(details.createdAt) : null,
    submittedBy: mapCastingCuringPersonLabel(details.submittedBy),
    submittedAt: details.submittedAt != null ? String(details.submittedAt) : null,
    lastUpdatedBy: mapCastingCuringPersonLabel(details.lastUpdatedBy ?? details.updatedBy),
    lastUpdatedAt:
      details.lastUpdatedAt != null
        ? String(details.lastUpdatedAt)
        : details.updatedAt != null
          ? String(details.updatedAt)
          : null,
    motors,
  };
};

export class TrimmingSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(data: any = {}) {
    const payload = data?.data ?? data;
    this.formId = String(payload?.formId ?? "");
    this.batchId = String(payload?.batchId ?? "");
    this.status = String(payload?.status ?? "");
  }

  static fromApi(data: any) {
    return new TrimmingSubmitResponseModel(data);
  }
}

export class TrimmingDetailsModel {
  static fromApi(data: any): TrimmingDetails {
    const payload = data?.data ?? data ?? {};
    const rawMotors = Array.isArray(payload?.motors) ? payload.motors : [];

    return {
      formId: String(payload?.formId ?? ""),
      batchId: String(payload?.batchId ?? ""),
      subDepartmentId: Number(payload?.subDepartmentId ?? 0),
      formSubmissionType: String(payload?.formSubmissionType ?? ""),
      status: payload?.status != null ? String(payload.status) : undefined,
      batchType: payload?.batchType != null ? String(payload.batchType) : undefined,
      motorReceivedDate:
        payload?.motorReceivedDate != null ? String(payload.motorReceivedDate) : null,
      createdBy: mapCastingCuringPersonLabel(payload?.createdBy),
      createdAt: payload?.createdAt != null ? String(payload.createdAt) : null,
      submittedBy: mapCastingCuringPersonLabel(payload?.submittedBy),
      submittedAt: payload?.submittedAt != null ? String(payload.submittedAt) : null,
      lastUpdatedBy: mapCastingCuringPersonLabel(payload?.lastUpdatedBy ?? payload?.updatedBy),
      lastUpdatedAt:
        payload?.lastUpdatedAt != null
          ? String(payload.lastUpdatedAt)
          : payload?.updatedAt != null
            ? String(payload.updatedAt)
            : null,
      motorStage: payload?.motorStage,
      motors: rawMotors.length > 0 ? rawMotors : undefined,
      sections: Array.isArray(payload?.sections) ? payload.sections : undefined,
    };
  }
}
