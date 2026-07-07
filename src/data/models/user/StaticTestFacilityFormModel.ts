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

export const createStfData = () => ({
  schemaFormLoaded: false,
  subType: null as StfSubType | null,
  motorIdNo: "",
  stfSchema: null as SchemaDocumentV2 | null,
  schemasBySubType: {} as Partial<Record<StfSubType, SchemaDocumentV2>>,
  schemaFormValues: {} as SchemaFormValues,
  savedSections: undefined as SchemaSectionSubmission[] | undefined,
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
};

export type StaticTestFacilityMotor = {
  motorId: string;
  staticTestingDetails: Record<string, unknown>;
};

export type StaticTestFacilityFormBody = {
  motors: StaticTestFacilityMotor[];
};

export const createDefaultStaticTestFacilityFormState = (): StaticTestFacilityFormState =>
  createStfData();

export const hydrateStaticTestFacilityFormState = (
  state: StaticTestFacilityFormState,
  schema: SchemaDocumentV2,
  subType: StfSubType,
): StaticTestFacilityFormState => ({
  ...state,
  subType,
  stfSchema: schema,
  schemasBySubType: {
    ...(state.schemasBySubType ?? {}),
    [subType]: schema,
  },
  schemaFormValues: state.savedSections?.length
    ? hydrateStfValuesFromSections(schema, state.savedSections)
    : Object.keys(state.schemaFormValues ?? {}).length > 0
      ? state.schemaFormValues
      : createStfInitialValues(schema),
  schemaFormLoaded: true,
});

const extractSections = (
  details: Partial<StaticTestFacilityDetails>,
): SchemaSectionSubmission[] | undefined => {
  if (Array.isArray(details?.sections) && details.sections.length > 0) {
    return details.sections;
  }
  return undefined;
};

export const mapStaticTestFacilityDetailsToFormState = (
  details: Partial<StaticTestFacilityDetails>,
): StaticTestFacilityFormState => {
  const defaults = createDefaultStaticTestFacilityFormState();
  const savedSections = extractSections(details);
  const subType = details?.subType ? mapStfSubType(details.subType) : null;

  return {
    ...defaults,
    subType,
    motorIdNo: String(details?.motorIdNo ?? ""),
    schemaFormLoaded: Boolean(savedSections?.length),
    savedSections,
  };
};

const FORM_SECTIONS_KEY = "formSections";

export const mapStaticTestFacilityFormStateToPayload = (
  form: StaticTestFacilityFormState,
): StaticTestFacilityFormBody => {
  const schema = form.stfSchema;
  const motorId = form.motorIdNo?.trim() || "MOTOR-001";

  if (!schema) {
    return { motors: [{ motorId, staticTestingDetails: {} }] };
  }

  const sections = toSectionSubmissions(schema, form.schemaFormValues);

  return {
    motors: [
      {
        motorId,
        staticTestingDetails: { [FORM_SECTIONS_KEY]: sections },
      },
    ],
  };
};

export const hasAnyStaticTestFacilityValue = (form: StaticTestFacilityFormState) =>
  schemaValuesHaveUserData(form.schemaFormValues ?? {});

export { FORM_SECTIONS_KEY };