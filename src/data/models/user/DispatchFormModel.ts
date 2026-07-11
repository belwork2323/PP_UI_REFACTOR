import {
  buildDispatchSectionPayload,
  createDispatchInitialValues,
  DISPATCH_SCHEMA_TYPE,
  mapDispatchDetailsToSchemaValues,
  mapDispatchSchemaValuesToDispatchDetails,
  schemaValuesHaveUserData,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../schema-engine";

export type DispatchMotorSetup = {
  motorStage: string;
  castingDate: string;
  dispatchDate: string;
  dispatchLocation: string;
  ndtClearance: string;
  ndtMomNo: string;
  finalAcceptanceClearance: string;
  finalAcceptanceMomNo: string;
};

export type DispatchMotorSession = {
  motorId: string;
  setup: DispatchMotorSetup;
  schemaFormValues: SchemaFormValues;
  savedSchemaValues?: Record<string, unknown>;
};

export const createDefaultDispatchMotorSetup = (): DispatchMotorSetup => ({
  motorStage: "",
  castingDate: "",
  dispatchDate: "",
  dispatchLocation: "",
  ndtClearance: "NO",
  ndtMomNo: "",
  finalAcceptanceClearance: "NO",
  finalAcceptanceMomNo: "",
});

export const createEmptyDispatchMotorSession = (motorId: string): DispatchMotorSession => ({
  motorId,
  setup: createDefaultDispatchMotorSetup(),
  schemaFormValues: {},
});

export const hydrateDispatchMotorSession = (
  motorId: string,
  schema: SchemaDocumentV2,
  setup: DispatchMotorSetup,
  savedSchemaValues?: Record<string, unknown>,
): DispatchMotorSession => ({
  motorId,
  setup,
  schemaFormValues: savedSchemaValues
    ? mapDispatchDetailsToSchemaValues(schema, savedSchemaValues)
    : createDispatchInitialValues(schema),
  savedSchemaValues,
});

export const createDispatchData = () => ({
  motorStage: "",
  castingDate: "",
  dispatchDate: "",
  dispatchLocation: "",
  ndtClearance: "NO",
  ndtMomNo: "",
  finalAcceptanceClearance: "NO",
  finalAcceptanceMomNo: "",
  schemaFormLoaded: false,
  dispatchSchema: null as SchemaDocumentV2 | null,
  motors: [] as DispatchMotorSession[],
});

export type DispatchFormState = ReturnType<typeof createDispatchData>;

export const snapshotDispatchSetupFromForm = (form: DispatchFormState): DispatchMotorSetup => ({
  motorStage: String(form.motorStage ?? ""),
  castingDate: String(form.castingDate ?? ""),
  dispatchDate: String(form.dispatchDate ?? ""),
  dispatchLocation: String(form.dispatchLocation ?? ""),
  ndtClearance: String(form.ndtClearance ?? "NO"),
  ndtMomNo: String(form.ndtMomNo ?? ""),
  finalAcceptanceClearance: String(form.finalAcceptanceClearance ?? "NO"),
  finalAcceptanceMomNo: String(form.finalAcceptanceMomNo ?? ""),
});

export const clearDispatchFormSetup = (form: DispatchFormState): DispatchFormState => ({
  ...form,
  castingDate: "",
  dispatchDate: "",
  dispatchLocation: "",
  ndtClearance: "NO",
  ndtMomNo: "",
  finalAcceptanceClearance: "NO",
  finalAcceptanceMomNo: "",
});

export type DispatchDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  motorStage?: string;
  motorId?: string;
  castingDate?: string;
  dispatchDate?: string;
  dispatchLocation?: string;
  ndtClearance?: string;
  ndtMomNo?: string;
  finalAcceptanceClearance?: string;
  finalAcceptanceMomNo?: string;
  motors?: Array<{
    motorId: string;
    schemaValues?: Record<string, unknown>;
    setup?: DispatchMotorSetup;
  }>;
  sections?: SchemaSectionSubmission[];
};

export type DispatchFormBody = {
  schemaVersion?: string;
  schemaType?: string;
  motorStage?: string;
  motorId?: string;
  castingDate?: string;
  dispatchDate?: string;
  dispatchLocation?: string;
  ndtClearance?: string;
  ndtMomNo?: string;
  finalAcceptanceClearance?: string;
  finalAcceptanceMomNo?: string;
  sections: SchemaSectionSubmission[];
};

export const createDefaultDispatchFormState = (): DispatchFormState => createDispatchData();

export const appendDispatchMotorToState = (
  state: DispatchFormState,
  schema: SchemaDocumentV2,
  motorId: string,
  savedSchemaValues?: Record<string, unknown>,
  setupOverride?: DispatchMotorSetup,
): DispatchFormState => {
  const trimmedId = String(motorId ?? "").trim();
  if (!trimmedId) return state;

  const existing = state.motors ?? [];
  if (existing.some((motor) => motor.motorId === trimmedId)) return state;

  const setup = setupOverride ?? snapshotDispatchSetupFromForm(state);
  const clearedState = clearDispatchFormSetup(state);

  return {
    ...clearedState,
    dispatchSchema: clearedState.dispatchSchema ?? schema,
    motors: [
      ...existing,
      hydrateDispatchMotorSession(trimmedId, schema, setup, savedSchemaValues),
    ],
    schemaFormLoaded: true,
  };
};

/** @deprecated Use appendDispatchMotorToState */
export const hydrateDispatchFormState = (
  state: DispatchFormState,
  schema: SchemaDocumentV2,
): DispatchFormState => appendDispatchMotorToState(state, schema, state.motors[0]?.motorId ?? "", state.motors[0]?.savedSchemaValues);

const buildDispatchDetailsPayload = (
  schema: SchemaDocumentV2,
  setup: DispatchMotorSetup,
  schemaValues: SchemaFormValues,
) => mapDispatchSchemaValuesToDispatchDetails(schema, schemaValues, setup);

export const mapDispatchDetailsToFormState = (details: DispatchDetails): DispatchFormState => {
  const defaults = createDefaultDispatchFormState();
  const motors = Array.isArray(details?.motors) ? details.motors : [];
  const fallbackSetup: DispatchMotorSetup = {
    motorStage: String(details?.motorStage ?? ""),
    castingDate: String(details?.castingDate ?? ""),
    dispatchDate: String(details?.dispatchDate ?? ""),
    dispatchLocation: String(details?.dispatchLocation ?? ""),
    ndtClearance: String(details?.ndtClearance ?? "NO"),
    ndtMomNo: String(details?.ndtMomNo ?? ""),
    finalAcceptanceClearance: String(details?.finalAcceptanceClearance ?? "NO"),
    finalAcceptanceMomNo: String(details?.finalAcceptanceMomNo ?? ""),
  };

  return {
    ...defaults,
    motors: motors
      .map((motor) => ({
        motorId: String(motor?.motorId ?? "").trim(),
        setup: motor.setup ?? fallbackSetup,
        schemaFormValues: {},
        savedSchemaValues: motor?.schemaValues,
      }))
      .filter((motor) => motor.motorId.length > 0),
    schemaFormLoaded: motors.length > 0,
  };
};

export const mapDispatchFormStateToBackendPayload = (
  form: DispatchFormState,
  batchId: string,
  subDepartmentId: number,
  intent: "DRAFT" | "SUBMIT",
) => {
  const schema = form.dispatchSchema;
  if (!schema) {
    return {
      batchId,
      subDepartmentId,
      formSubmissionType: intent,
      motors: [],
    };
  }

  return {
    batchId,
    subDepartmentId,
    formSubmissionType: intent,
    motors: (form.motors ?? []).map((motor) => ({
      motorId: motor.motorId,
      dispatchDetails: buildDispatchDetailsPayload(
        schema,
        motor.setup ?? createDefaultDispatchMotorSetup(),
        motor.schemaFormValues ?? {},
      ),
    })),
  };
};

export const mapDispatchFormStateToUpdatePayload = (
  form: DispatchFormState,
  formId: string,
  batchId: string,
  subDepartmentId: number,
  intent: "DRAFT" | "SUBMIT",
) => ({
  formId,
  ...mapDispatchFormStateToBackendPayload(form, batchId, subDepartmentId, intent),
});

export const mapDispatchFormStateToPayload = (form: DispatchFormState): DispatchFormBody => {
  const schema = form.dispatchSchema;
  const primaryMotor = form.motors[0];
  const primarySetup = primaryMotor?.setup ?? snapshotDispatchSetupFromForm(form);

  return {
    schemaVersion: schema?.schemaVersion,
    schemaType: schema?.schemaType ?? DISPATCH_SCHEMA_TYPE,
    motorStage: primarySetup.motorStage || undefined,
    motorId: primaryMotor?.motorId || undefined,
    castingDate: primarySetup.castingDate || undefined,
    dispatchDate: primarySetup.dispatchDate || undefined,
    dispatchLocation: primarySetup.dispatchLocation || undefined,
    ndtClearance: primarySetup.ndtClearance || undefined,
    ndtMomNo: primarySetup.ndtClearance === "YES" ? primarySetup.ndtMomNo || undefined : undefined,
    finalAcceptanceClearance: primarySetup.finalAcceptanceClearance || undefined,
    finalAcceptanceMomNo:
      primarySetup.finalAcceptanceClearance === "YES"
        ? primarySetup.finalAcceptanceMomNo || undefined
        : undefined,
    sections:
      schema && primaryMotor
        ? buildDispatchSectionPayload(schema, primaryMotor.schemaFormValues ?? {})
        : [],
  };
};

const hasDispatchSetupValue = (setup: DispatchMotorSetup) =>
  [
    setup.motorStage,
    setup.castingDate,
    setup.dispatchDate,
    setup.dispatchLocation,
  ].some((value) => String(value ?? "").trim().length > 0) ||
  (setup.ndtClearance === "YES" && String(setup.ndtMomNo ?? "").trim().length > 0) ||
  (setup.finalAcceptanceClearance === "YES" &&
    String(setup.finalAcceptanceMomNo ?? "").trim().length > 0);

const hasSetupValue = (form: DispatchFormState) =>
  hasDispatchSetupValue(snapshotDispatchSetupFromForm(form)) ||
  (form.motors ?? []).some((motor) => hasDispatchSetupValue(motor.setup ?? createDefaultDispatchMotorSetup()));

export const hasAnyDispatchValue = (form: DispatchFormState) =>
  hasSetupValue(form) ||
  (form.motors ?? []).some((motor) => schemaValuesHaveUserData(motor.schemaFormValues ?? {}));
