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

export type TrimmingMotorSession = {
  motorId: string;
  motorStage: number;
  motorReceivedAt: string;
  schema: SchemaDocumentV2 | null;
  formValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
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
  const stageNum = resolveTrimmingMotorStageNumber({ motorStage: motorStage ?? state.selectedMotorStage });
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
    .map((motor) => ({
      motorId: String(motor?.motorId ?? "").trim(),
      motorStage: resolveTrimmingMotorStageNumber({
        motorStage: motor?.motorStage ?? motorStage,
      }),
      motorReceivedAt: String(motor?.motorReceivedAt ?? "").trim(),
      schema: null,
      formValues: {},
      savedSections: Array.isArray(motor?.sections) ? motor.sections : undefined,
    }))
    .filter((motor) => motor.motorId.length > 0);

  if (motors.length === 0 && savedSections?.length) {
    motors.push({
      motorId: "",
      motorStage: resolveTrimmingMotorStageNumber({ motorStage }),
      motorReceivedAt: "",
      schema: null,
      formValues: {},
      savedSections,
    });
  }

  return {
    ...defaults,
    schemaFormLoaded: Boolean(motors.some((motor) => motor.savedSections?.length) || savedSections?.length),
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
      return {
        motorId: motor.motorId,
        motorStage: motor.motorStage,
        motorReceivedAt: motor.motorReceivedAt,
        sections: schema ? buildTrimmingSectionPayload(schema, motor.formValues) : [],
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
    sections: fallbackSchema ? buildTrimmingSectionPayload(fallbackSchema, form.schemaFormValues) : [],
  };
};

export const hasAnyTrimmingValue = (form: TrimmingFormState) => {
  if ((form.motors ?? []).some((motor) => schemaValuesHaveUserData(motor.formValues ?? {}))) {
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
  formSubmissionType: string;
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
    formSubmissionType: String(details.formSubmissionType ?? ""),
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
