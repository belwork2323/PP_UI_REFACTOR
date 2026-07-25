import {
  createStfInitialValues,
  hydrateStfValuesFromSections,
  mapStfSubType,
  schemaValuesHaveUserData,
  toSectionSubmissions,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
  type StfSubType,
} from "../../../schema-engine";

export type { StfSubType };

export const FORM_SECTIONS_KEY = "formSections";

// ============================================================================
// Core Form & Session Types
// ============================================================================

export type StfMotorSession = {
  motorId: string;
  subType: StfSubType;
  schemaFormValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
};

export const createEmptyStfMotorSession = (
  motorId: string,
  subType: StfSubType,
): StfMotorSession => ({
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
  motorId: null as string | null,
  bemNo: null as string | null,
  schemaFormValues: {} as SchemaFormValues,
});

export type StaticTestFacilityFormState = ReturnType<typeof createStfData>;

export const createDefaultStaticTestFacilityFormState = (): StaticTestFacilityFormState =>
  createStfData();

// ============================================================================
// Hydration Helpers
// ============================================================================

export const hydrateStfMotorSession = (
  motor: StfMotorSession,
  schema: SchemaDocumentV2,
): StfMotorSession => ({
  ...motor,
  schemaFormValues: motor.savedSections?.length
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
    schemaFormValues:
      state.motors && state.motors.length > 0
        ? state.motors[0].schemaFormValues
        : state.schemaFormValues,
    schemaFormLoaded:
      (state.motors ?? []).length > 0 || Object.keys(state.schemaFormValues ?? {}).length > 0,
  };
};

const extractSectionsFromMotorDetails = (
  details?: Record<string, unknown>,
): SchemaSectionSubmission[] | undefined => {
  const formSections = details?.[FORM_SECTIONS_KEY];
  if (Array.isArray(formSections) && formSections.length > 0) {
    return formSections as SchemaSectionSubmission[];
  }
  return undefined;
};

// ============================================================================
// 1. Generic STF Batch / Form Submission API Models & Mappers
// ============================================================================

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

export type StfBatchMotorItem = {
  motorId: string;
  subType: StfSubType;
  staticTestingDetails: {
    [FORM_SECTIONS_KEY]?: SchemaSectionSubmission[];
    [key: string]: unknown;
  };
};

/** Payload structure for POST /api/v1/user/stf/create */
export type CreateStfBatchFormPayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  motors: StfBatchMotorItem[];
};

/** Payload structure for PUT /api/v1/user/stf/update/{formId} */
export type UpdateStfBatchFormPayload = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  motors: StfBatchMotorItem[];
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
              : (subType ?? "MAIN_MOTOR");
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

export const mapFormStateToCreateStfBatchPayload = (params: {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  formState: StaticTestFacilityFormState;
}): CreateStfBatchFormPayload => {
  const motors = (params.formState.motors ?? []).filter((motor) => motor.motorId.trim());

  return {
    batchId: params.batchId,
    subDepartmentId: params.subDepartmentId,
    formSubmissionType: params.formSubmissionType,
    motors: motors.map((motor) => {
      const schema =
        params.formState.schemasBySubType?.[motor.subType] ?? params.formState.stfSchema;
      const sections = schema ? toSectionSubmissions(schema, motor.schemaFormValues ?? {}) : [];

      return {
        motorId: motor.motorId,
        subType: motor.subType,
        staticTestingDetails: { [FORM_SECTIONS_KEY]: sections },
      };
    }),
  };
};

export const mapFormStateToUpdateStfBatchPayload = (params: {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  formState: StaticTestFacilityFormState;
}): UpdateStfBatchFormPayload => {
  const batchPayload = mapFormStateToCreateStfBatchPayload(params);
  return {
    formId: params.formId,
    ...batchPayload,
  };
};

// ============================================================================
// 2. Standalone BEM Motor Master API Models & Mappers
// ============================================================================

/** Payload structure for POST /api/v1/user/stf/bem-motor/create */
export type CreateBemMotorPayload = {
  motorId: string;
  subType: "BEM" | string;
  formSubmissionType: "DRAFT" | "SUBMIT";
  staticTestingDetails: any;
};

/** Payload structure for PUT /api/v1/user/stf/bem-motor/update/{bemMotorId} */
export type UpdateBemMotorPayload = {
  motorId: string;
  subType: "BEM" | string;
  formSubmissionType: "DRAFT" | "SUBMIT";
  staticTestingDetails: any;
};

export type BemMotorDetailsResponse = {
  bemNo?: string;
  motorCode?: string;
  subDepartmentId?: number;
  subType?: string;
  status?: string;
  sections?: SchemaSectionSubmission[];
  staticTestingDetails?: {
    [FORM_SECTIONS_KEY]?: SchemaSectionSubmission[];
    [key: string]: unknown;
  };
  workflowInsights?: {
    rejectionReason?: string;
  };
  createdOn?: string;
  updatedBy?: string;
  updatedOn?: string;
};

export const mapFormStateToCreateBemPayload = (params: {
  subDepartmentId: number;
  bemNo: string;
  schema: SchemaDocumentV2;
  formValues: SchemaFormValues;
}): CreateBemMotorPayload => {
  const sections = toSectionSubmissions(params.schema, params.formValues ?? {});
  return {
    motorId: params.bemNo.trim(),
    subType: "BEM",
    formSubmissionType: "DRAFT",
    staticTestingDetails: {
      [FORM_SECTIONS_KEY]: sections,
    },
  };
};

export const mapFormStateToUpdateBemPayload = (params: {
  bemMotorId: string;
  subDepartmentId: number;
  bemNo: string;
  schema: SchemaDocumentV2;
  formValues: SchemaFormValues;
  formSubmissionType?: "DRAFT" | "SUBMIT";
}): UpdateBemMotorPayload => {
  const sections = toSectionSubmissions(params.schema, params.formValues ?? {});
  return {
    motorId: params.bemNo.trim(),
    subType: "BEM",
    formSubmissionType: params.formSubmissionType ?? "SUBMIT",
    staticTestingDetails: {
      [FORM_SECTIONS_KEY]: sections,
    },
  };
};

export const mapBemDetailsResponseToFormState = (
  data: BemMotorDetailsResponse,
  schema?: SchemaDocumentV2,
): StaticTestFacilityFormState => {
  const defaults = createDefaultStaticTestFacilityFormState();
  const bemNo = data.bemNo ?? data.motorCode ?? "";
  const savedSections = data.staticTestingDetails?.[FORM_SECTIONS_KEY] ?? data.sections ?? [];

  const schemaFormValues =
    schema && savedSections.length > 0 ? hydrateStfValuesFromSections(schema, savedSections) : {};

  const bemMotorSession: StfMotorSession = {
    motorId: bemNo,
    subType: "BEM",
    schemaFormValues,
    savedSections,
  };

  return {
    ...defaults,
    bemNo,
    subType: "BEM",
    stfSchema: schema ?? null,
    schemasBySubType: schema ? { BEM: schema } : {},
    motors: [bemMotorSession],
    schemaFormValues,
    schemaFormLoaded: Boolean(schema && savedSections.length > 0),
  };
};

// ============================================================================
// General Form Helper Functions
// ============================================================================

export const resolveStfFormSubTypes = (form: StaticTestFacilityFormState): StfSubType[] => {
  const subTypes = new Set<StfSubType>();
  if (form.subType) subTypes.add(form.subType);
  for (const motor of form.motors ?? []) {
    if (motor.motorId.trim()) subTypes.add(motor.subType);
  }
  return Array.from(subTypes);
};

export const hasAnyStaticTestFacilityValue = (form: StaticTestFacilityFormState): boolean => {
  if (schemaValuesHaveUserData(form.schemaFormValues ?? {})) return true;
  return (form.motors ?? []).some((motor) =>
    schemaValuesHaveUserData(motor.schemaFormValues ?? {}),
  );
};

export const buildStfAddedMotors = (
  form: StaticTestFacilityFormState,
): Array<{ motorId: string; subType: StfSubType }> => {
  const motors = (form.motors ?? []).filter((motor) => motor.motorId.trim());
  if (motors.length > 0) {
    return motors.map((motor) => ({ motorId: motor.motorId, subType: motor.subType }));
  }
  if (form.bemNo?.trim()) {
    return [{ motorId: form.bemNo.trim(), subType: "BEM" }];
  }
  return [];
};

export interface FormSectionPayload {
  sectionId: string;
  sectionData: Record<string, any>[];
}

export interface StaticTestingDetailsPayload {
  formSections: FormSectionPayload[];
}

/**
 * Recursively strips UI metadata keys (starting with '_') from object or array items
 */
const sanitizeData = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  if (data !== null && typeof data === "object") {
    const cleanObject: Record<string, any> = {};

    Object.entries(data).forEach(([key, value]) => {
      // Omit UI configuration metadata (e.g., _readonly, _readonlyColumns)
      if (key.startsWith("_")) return;

      cleanObject[key] = sanitizeData(value);
    });

    return cleanObject;
  }

  return data;
};

export const buildStaticTestingDetails = (
  schemaValues: Record<string, any> = {},
): StaticTestingDetailsPayload => {
  const sectionsMap: Record<string, Record<string, any>> = {};

  // Group incoming flat schemaValues (`SECTION_ID::FIELD_NAME`) by SECTION_ID
  Object.entries(schemaValues).forEach(([key, value]) => {
    if (!key.includes("::")) return;

    const [sectionId, fieldName] = key.split("::");

    if (!sectionsMap[sectionId]) {
      sectionsMap[sectionId] = {};
    }

    // Sanitize values (removes _readonly, _readonlyColumns, etc.)
    sectionsMap[sectionId][fieldName] = sanitizeData(value);
  });

  // Transform grouped map into the required formSections array structure
  const formSections: FormSectionPayload[] = Object.entries(sectionsMap).map(
    ([sectionId, fields]) => {
      // If the section contains an array matching the sectionId (e.g., GRAIN_DIMENSION)
      if (Array.isArray(fields[sectionId])) {
        return {
          sectionId,
          sectionData: [{ [sectionId]: fields[sectionId] }],
        };
      }

      return {
        sectionId,
        sectionData: [fields],
      };
    },
  );

  return { formSections };
};
// Main mapper supporting both batch motors and single BEM payload
export const mapStaticTestFacilityFormStateToPayload = (form: StaticTestFacilityFormState) => {
  const motors = (form.motors ?? []).filter((motor) => motor.motorId?.trim());

  return {
    motors: motors.map((motor) => {
      const values = motor.schemaFormValues ?? form.schemaFormValues ?? {};
      return {
        motorId: motor.motorId,
        subType: motor.subType,
        staticTestingDetails: buildStaticTestingDetails(values),
      };
    }),
  };
};
