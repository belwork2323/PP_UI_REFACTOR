import {
  createStfInitialValues,
  hydrateStfValuesFromSections,
  mapStfSubType,
  schemaValuesHaveUserData,
  toSectionSubmissions,
  type StfSubType,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../schema-engine";

export type { StfSubType };

export type StfMotorSession = {
  motorId: string;
  subType: StfSubType;
  schemaFormValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
};

export const createEmptyStfMotorSession = (motorId: string, subType: StfSubType): StfMotorSession => ({
  motorId,
  subType,
  schemaFormValues: {},
});

export const normalizeStfMotorSession = (
  motor: Partial<StfMotorSession> & { motorId: string; subType: StfSubType },
): StfMotorSession => ({
  motorId: motor.motorId,
  subType: motor.subType,
  schemaFormValues: motor.schemaFormValues ?? {},
  savedSections: motor.savedSections,
});

export const createStfData = () => ({
  schemaFormLoaded: false,
  subType: null as StfSubType | null,
  stfSchema: null as SchemaDocumentV2 | null,
  schemasBySubType: {} as Partial<Record<StfSubType, SchemaDocumentV2>>,
  motors: [] as StfMotorSession[],
});

export type StaticTestFacilityFormState = ReturnType<typeof createStfData>;

export type StaticTestFacilityDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  subType?: StfSubType | string | null;
  motorIdNo?: string | null;
  sections?: SchemaSectionSubmission[];
  motors?: Array<{
    motorId?: string;
    subType?: StfSubType | string | null;
    staticTestingDetails?: Record<string, unknown>;
  }>;
};

export type StaticTestFacilityMotor = {
  motorId: string;
  subType: StfSubType;
  staticTestingDetails: Record<string, unknown>;
};

export type StaticTestFacilityFormBody = {
  motors: StaticTestFacilityMotor[];
};

export const createDefaultStaticTestFacilityFormState = (): StaticTestFacilityFormState =>
  createStfData();

export const hydrateStfMotorSession = (
  motor: StfMotorSession,
  schema: SchemaDocumentV2,
): StfMotorSession => ({
  ...motor,
  schemaFormValues:
    motor.savedSections?.length
      ? hydrateStfValuesFromSections(schema, motor.savedSections)
      : Object.keys(motor.schemaFormValues ?? {}).length > 0
        ? motor.schemaFormValues
        : createStfInitialValues(schema),
});

export const hydrateStaticTestFacilityFormState = (
  state: StaticTestFacilityFormState,
  schema: SchemaDocumentV2,
  subType: StfSubType,
  motorIds?: string[],
): StaticTestFacilityFormState => {
  const targetIds = motorIds?.length ? new Set(motorIds) : null;

  return {
    ...state,
    subType: state.subType ?? subType,
    stfSchema: schema,
    schemasBySubType: {
      ...(state.schemasBySubType ?? {}),
      [subType]: schema,
    },
    motors: (state.motors ?? []).map((motor) => {
      if (targetIds && !targetIds.has(motor.motorId)) return motor;
      if (motor.subType !== subType) return motor;
      return hydrateStfMotorSession(motor, schema);
    }),
    schemaFormLoaded: (state.motors ?? []).length > 0,
  };
};

const extractSectionsFromMotorDetails = (
  details?: Record<string, unknown>,
): SchemaSectionSubmission[] | undefined => {
  const formSections = details?.formSections;
  if (Array.isArray(formSections) && formSections.length > 0) {
    return formSections as SchemaSectionSubmission[];
  }
  return undefined;
};

export const mapStaticTestFacilityDetailsToFormState = (
  details: Partial<StaticTestFacilityDetails>,
): StaticTestFacilityFormState => {
  const defaults = createDefaultStaticTestFacilityFormState();
  const subType = details?.subType ? mapStfSubType(details.subType) : null;

  const motorsFromApi = Array.isArray(details?.motors) ? details.motors : [];
  const motors: StfMotorSession[] =
    motorsFromApi.length > 0
      ? motorsFromApi
          .map((motor) => {
            const motorId = String(motor?.motorId ?? "").trim();
            if (!motorId) return null;
            const motorSubType = motor?.subType
              ? mapStfSubType(motor.subType)
              : subType ?? "MAIN_MOTOR";
            const savedSections = extractSectionsFromMotorDetails(motor?.staticTestingDetails);
            return normalizeStfMotorSession({
              motorId,
              subType: motorSubType,
              schemaFormValues: {},
              ...(savedSections?.length ? { savedSections } : {}),
            });
          })
          .filter((motor): motor is StfMotorSession => Boolean(motor))
      : [];

  const legacySections = Array.isArray(details?.sections) ? details.sections : undefined;
  const legacyMotorId = String(details?.motorIdNo ?? "").trim();

  if (!motors.length && legacySections?.length && legacyMotorId) {
    motors.push(
      normalizeStfMotorSession({
        motorId: legacyMotorId,
        subType: subType ?? "MAIN_MOTOR",
        schemaFormValues: {},
        savedSections: legacySections,
      }),
    );
  }

  return {
    ...defaults,
    subType,
    schemaFormLoaded: motors.some((motor) => (motor.savedSections?.length ?? 0) > 0),
    motors,
  };
};

const FORM_SECTIONS_KEY = "formSections";

export const mapStaticTestFacilityFormStateToPayload = (
  form: StaticTestFacilityFormState,
): StaticTestFacilityFormBody => {
  const motors = (form.motors ?? []).filter((motor) => motor.motorId.trim());

  return {
    motors: motors.map((motor) => {
      const schema = form.schemasBySubType?.[motor.subType] ?? form.stfSchema;
      if (!schema) {
        return {
          motorId: motor.motorId,
          subType: motor.subType,
          staticTestingDetails: {},
        };
      }

      const sections = toSectionSubmissions(schema, motor.schemaFormValues ?? {});
      return {
        motorId: motor.motorId,
        subType: motor.subType,
        staticTestingDetails: { [FORM_SECTIONS_KEY]: sections },
      };
    }),
  };
};

export const resolveStfFormSubTypes = (form: StaticTestFacilityFormState): StfSubType[] => {
  const subTypes = new Set<StfSubType>();
  for (const motor of form.motors ?? []) {
    if (motor.motorId.trim()) subTypes.add(motor.subType);
  }
  return Array.from(subTypes);
};

export const hasAnyStaticTestFacilityValue = (form: StaticTestFacilityFormState) =>
  (form.motors ?? []).some((motor) => schemaValuesHaveUserData(motor.schemaFormValues ?? {}));

export const buildStfAddedMotors = (form: StaticTestFacilityFormState) =>
  (form.motors ?? [])
    .filter((motor) => motor.motorId.trim())
    .map((motor) => ({ motorId: motor.motorId, subType: motor.subType }));

export { FORM_SECTIONS_KEY };
