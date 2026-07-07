import {
  buildTrimmingSectionPayload,
  createTrimmingInitialValues,
  hydrateTrimmingValuesFromSections,
  resolveTrimmingMotorStageNumber,
  schemaValuesHaveUserData,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../schema-engine";

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

    return {
      formId: String(payload?.formId ?? ""),
      batchId: String(payload?.batchId ?? ""),
      subDepartmentId: Number(payload?.subDepartmentId ?? 0),
      formSubmissionType: String(payload?.formSubmissionType ?? ""),
      motorStage: payload?.motorStage,
      motors: Array.isArray(payload?.motors) ? payload.motors : undefined,
      sections: Array.isArray(payload?.sections) ? payload.sections : undefined,
    };
  }
}
