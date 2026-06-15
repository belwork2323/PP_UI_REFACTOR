import type { SchemaDocument, SchemaFormValues, SchemaSectionSubmission } from "../../../schemaManagement";
import {
  buildCastingCuringSectionPayload,
  createCastingCuringInitialValues,
  hydrateCastingCuringValuesFromSections,
} from "../../../schemaManagement";
import { buildCastingSetupContext } from "../../../schemaManagement/utils/schemaSetupContext";
import type { SchemaSetupContext } from "../../../schemaManagement/utils/schemaSetupContext";
import { schemaValuesHaveUserData } from "../../../schemaManagement/models/schemaFormState";

export type CastingProcessSetup = {
  initialVacuum: string;
  castingVacuumPressure: string;
  soakingVacuumPressure: string;
  finalMixCount: string;
};

export type CuringProcessSetup = {
  oven: string;
  curingType: string;
  configuration: string;
  motorsToCureCount: number | "";
  ovensUtilized: string;
};

export type CastingCuringMotorSession = {
  motorId: string;
  motorReceivedAt: string;
  formValues: SchemaFormValues;
  curingSetup: CuringProcessSetup;
  curingFormLoaded?: boolean;
  curingFormValues?: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
};

export type CastingCuringFormState = {
  castingType: string;
  castingStation: string;
  castingSetup: CastingProcessSetup;
  castingFormLoaded: boolean;
  readyForCuring: boolean;
  castingSchema: SchemaDocument | null;
  curingSchema: SchemaDocument | null;
  motors: CastingCuringMotorSession[];
  curingFormValues: SchemaFormValues;
  curingSavedSections?: SchemaSectionSubmission[];
};

export type CastingCuringFormBody = {
  schemaVersion?: string;
  setup: {
    castingType: string;
    castingStation: string;
    initialVacuum?: string;
    castingVacuumPressure?: string;
    soakingVacuumPressure?: string;
    finalMixCount?: string;
  };
  motors: Array<{
    motorId: string;
    motorReceivedAt: string;
    sections: SchemaSectionSubmission[];
  }>;
  curingSections: SchemaSectionSubmission[];
};

export const createDefaultCastingProcessSetup = (): CastingProcessSetup => ({
  initialVacuum: "",
  castingVacuumPressure: "",
  soakingVacuumPressure: "",
  finalMixCount: "",
});

export const createDefaultCuringProcessSetup = (): CuringProcessSetup => ({
  oven: "",
  curingType: "",
  configuration: "",
  motorsToCureCount: "",
  ovensUtilized: "",
});

export const createDefaultCastingCuringFormState = (): CastingCuringFormState => ({
  castingType: "",
  castingStation: "",
  castingSetup: createDefaultCastingProcessSetup(),
  castingFormLoaded: false,
  readyForCuring: false,
  castingSchema: null,
  curingSchema: null,
  motors: [],
  curingFormValues: {},
});

export const createEmptyMotorSession = (
  motorId: string,
  motorReceivedAt: string,
  schema: SchemaDocument | null,
  setupContext?: SchemaSetupContext,
): CastingCuringMotorSession => ({
  motorId,
  motorReceivedAt,
  formValues: schema ? createCastingCuringInitialValues(schema, setupContext) : {},
  curingSetup: createDefaultCuringProcessSetup(),
  curingFormLoaded: false,
  savedSections: undefined,
});

const resolveDetailsPayload = (details: any) =>
  details?.castingCuringDetails ?? details?.preparationDetails ?? details ?? {};

export const mapCastingCuringDetailsToFormState = (details: any): CastingCuringFormState => {
  const payload = resolveDetailsPayload(details);
  const rawMotors = Array.isArray(payload?.motors) ? payload.motors : [];

  const motors = rawMotors
    .map((motor: any) => ({
      motorId: String(motor?.motorId ?? "").trim(),
      motorReceivedAt: String(motor?.motorReceivedAt ?? motor?.motorReceivedDate ?? "").trim(),
      formValues: {},
      curingSetup: {
        oven: String(motor?.curingSetup?.oven ?? ""),
        curingType: String(motor?.curingSetup?.curingType ?? ""),
        configuration: String(motor?.curingSetup?.configuration ?? ""),
        motorsToCureCount: Number(motor?.curingSetup?.motorsToCureCount ?? "") || "",
        ovensUtilized: String(motor?.curingSetup?.ovensUtilized ?? ""),
      },
      curingFormLoaded: Boolean(
        String(motor?.curingSetup?.oven ?? "").trim() &&
          String(motor?.curingSetup?.curingType ?? "").trim() &&
          String(motor?.curingSetup?.configuration ?? "").trim() &&
          String(motor?.curingSetup?.ovensUtilized ?? "").trim(),
      ),
      savedSections: Array.isArray(motor?.sections) ? motor.sections : undefined,
    }))
    .filter((motor) => motor.motorId.length > 0);

  const curingSections = Array.isArray(payload?.curingSections)
    ? payload.curingSections
    : Array.isArray(payload?.sections)
      ? payload.sections
      : undefined;

  return {
    castingType: String(payload?.setup?.castingType ?? payload?.castingType ?? ""),
    castingStation: String(payload?.setup?.castingStation ?? payload?.castingStation ?? ""),
    castingSetup: {
      initialVacuum: String(payload?.setup?.initialVacuum ?? payload?.initialVacuum ?? ""),
      castingVacuumPressure: String(
        payload?.setup?.castingVacuumPressure ?? payload?.castingVacuumPressure ?? "",
      ),
      soakingVacuumPressure: String(
        payload?.setup?.soakingVacuumPressure ?? payload?.soakingVacuumPressure ?? "",
      ),
      finalMixCount: String(payload?.setup?.finalMixCount ?? payload?.finalMixCount ?? ""),
    },
    castingFormLoaded: motors.length > 0,
    readyForCuring: Boolean(curingSections?.length),
    castingSchema: null,
    curingSchema: null,
    motors,
    curingFormValues: {},
    curingSavedSections: curingSections,
  };
};

export const hydrateCastingCuringFormState = (
  state: CastingCuringFormState,
  castingSchema: SchemaDocument | null,
  curingSchema: SchemaDocument | null,
): CastingCuringFormState => {
  const setupContext = buildCastingSetupContext(state.castingSetup);
  const motors = (state.motors ?? []).map((motor) => ({
    ...motor,
    curingSetup: motor.curingSetup ?? createDefaultCuringProcessSetup(),
    curingFormLoaded: Boolean(motor.curingFormLoaded),
    curingFormValues:
      curingSchema && motor.curingFormLoaded
        ? Object.keys(motor.curingFormValues ?? {}).length > 0
          ? motor.curingFormValues
          : createCastingCuringInitialValues(curingSchema, setupContext)
        : motor.curingFormValues,
    formValues: castingSchema
      ? motor.savedSections?.length
        ? hydrateCastingCuringValuesFromSections(castingSchema, motor.savedSections, setupContext)
        : Object.keys(motor.formValues ?? {}).length > 0
          ? motor.formValues
          : createCastingCuringInitialValues(castingSchema, setupContext)
      : motor.formValues,
  }));

  const curingFormValues = curingSchema
    ? state.curingSavedSections?.length
      ? hydrateCastingCuringValuesFromSections(curingSchema, state.curingSavedSections, setupContext)
      : Object.keys(state.curingFormValues ?? {}).length > 0
        ? state.curingFormValues
        : createCastingCuringInitialValues(curingSchema, setupContext)
    : state.curingFormValues;

  return {
    ...state,
    castingSchema,
    curingSchema,
    motors,
    curingFormValues,
  };
};

export const mapCastingCuringFormStateToPayload = (
  form: CastingCuringFormState,
): CastingCuringFormBody => {
  const castingSchema = form.castingSchema;
  const curingSchema = form.curingSchema;

  return {
    schemaVersion: curingSchema?.schemaVersion ?? castingSchema?.schemaVersion,
    setup: {
      castingType: String(form.castingType ?? ""),
      castingStation: String(form.castingStation ?? ""),
      initialVacuum: String(form.castingSetup?.initialVacuum ?? ""),
      castingVacuumPressure: String(form.castingSetup?.castingVacuumPressure ?? ""),
      soakingVacuumPressure: String(form.castingSetup?.soakingVacuumPressure ?? ""),
      finalMixCount: String(form.castingSetup?.finalMixCount ?? ""),
    },
    motors: castingSchema
      ? (form.motors ?? []).map((motor) => ({
          motorId: motor.motorId,
          motorReceivedAt: motor.motorReceivedAt,
          sections: buildCastingCuringSectionPayload(castingSchema, motor.formValues),
        }))
      : [],
    curingSections: curingSchema
      ? buildCastingCuringSectionPayload(curingSchema, form.curingFormValues)
      : [],
  };
};

export const hasAnyCastingCuringValue = (form: CastingCuringFormState) => {
  if (String(form.castingType ?? "").trim() || String(form.castingStation ?? "").trim()) {
    return true;
  }

  if (
    String(form.castingSetup?.initialVacuum ?? "").trim() ||
    String(form.castingSetup?.castingVacuumPressure ?? "").trim() ||
    String(form.castingSetup?.soakingVacuumPressure ?? "").trim() ||
    String(form.castingSetup?.finalMixCount ?? "").trim()
  ) {
    return true;
  }

  if ((form.motors ?? []).some((motor) => schemaValuesHaveUserData(motor.formValues ?? {}))) {
    return true;
  }

  return schemaValuesHaveUserData(form.curingFormValues ?? {});
};

export class CastingCuringSubmitResponseModel {
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
    return new CastingCuringSubmitResponseModel(data);
  }
}

export class CastingCuringDetailsModel {
  static fromApi(data: any) {
    const payload = data?.data ?? data ?? {};
    return {
      formId: String(payload?.formId ?? ""),
      batchId: String(payload?.batchId ?? ""),
      subDepartmentId: Number(payload?.subDepartmentId ?? 0),
      formSubmissionType: String(payload?.formSubmissionType ?? ""),
      castingCuringDetails: payload?.castingCuringDetails ?? payload,
    };
  }
}
