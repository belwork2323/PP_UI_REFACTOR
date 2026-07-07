import {
  buildDispatchSectionPayload,
  createDispatchInitialValues,
  DISPATCH_SCHEMA_TYPE,
  schemaValuesHaveUserData,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../schema-engine";

export const createDispatchData = () => ({
  motorStage: "",
  motorId: "",
  castingDate: "",
  dispatchDate: "",
  dispatchLocation: "",
  ndtClearance: "NO", // Initialized to default option matching UI selections
  ndtMomNo: "",
  finalAcceptanceClearance: "NO", // Initialized to default option matching UI selections
  finalAcceptanceMomNo: "",
  schemaFormLoaded: false,
  dispatchSchema: null as SchemaDocumentV2 | null,
  schemaFormValues: {} as SchemaFormValues,
  savedSchemaValues: undefined as Record<string, any> | undefined,
});

export type DispatchFormState = ReturnType<typeof createDispatchData>;

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

export const hydrateDispatchFormState = (
  state: DispatchFormState,
  schema: SchemaDocumentV2,
): DispatchFormState => ({
  ...state,
  dispatchSchema: schema,
  schemaFormValues: state.savedSchemaValues
    ? { ...createDispatchInitialValues(schema), ...state.savedSchemaValues }
    : Object.keys(state.schemaFormValues ?? {}).length > 0
      ? state.schemaFormValues
      : createDispatchInitialValues(schema),
  schemaFormLoaded: true,
});

export const mapDispatchDetailsToFormState = (details: any): DispatchFormState => {
  const defaults = createDefaultDispatchFormState();
  return {
    ...defaults,
    motorStage: String(details?.motorStage ?? ""),
    motorId: String(details?.motorId ?? ""),
    castingDate: String(details?.castingDate ?? ""),
    dispatchDate: String(details?.dispatchDate ?? ""),
    dispatchLocation: String(details?.dispatchLocation ?? ""),
    ndtClearance: String(details?.ndtClearance ?? "NO"),
    ndtMomNo: String(details?.ndtMomNo ?? ""),
    finalAcceptanceClearance: String(details?.finalAcceptanceClearance ?? "NO"),
    finalAcceptanceMomNo: String(details?.finalAcceptanceMomNo ?? ""),
    schemaFormLoaded: Boolean(details?.schemaValues),
    savedSchemaValues: details?.schemaValues,
  };
};

// Generates structural creation payload object layout matching deep backend expectations
export const mapDispatchFormStateToBackendPayload = (
  form: DispatchFormState,
  batchId: string,
  subDepartmentId: number,
  intent: "DRAFT" | "SUBMIT",
) => {
  const schemaValues = form.schemaFormValues ?? {};

  return {
    batchId: batchId,
    subDepartmentId: subDepartmentId,
    formSubmissionType: intent,
    motors: [
      {
        motorId: form.motorId,
        dispatchDetails: {
          projectName: schemaValues.projectName || "",
          stage: form.motorStage ? `STAGE_${form.motorStage}` : "",
          castingDate: form.castingDate || "",
          dispatchDate: form.dispatchDate || "",
          dispatchLocation: form.dispatchLocation || "",
          ndtClearance: {
            accorded: form.ndtClearance || "NO",
            momNo: form.ndtClearance === "YES" ? form.ndtMomNo || "" : "",
          },
          finalAcceptanceCommitteeClearance: {
            accorded: form.finalAcceptanceClearance || "NO",
            momNo: form.finalAcceptanceClearance === "YES" ? form.finalAcceptanceMomNo || "" : "",
          },
          propellantProperties: schemaValues.propellantProperties ?? [],
          waiverDetails: schemaValues.waiverDetails ?? { available: false, details: "", uploadedDocuments: [] },
          rocketMotorInspection: schemaValues.rocketMotorInspection ?? [],
          vehicleDetails: schemaValues.vehicleDetails ?? [],
          rocketMotorPackingDetails: schemaValues.rocketMotorPackingDetails ?? [],
          uploadDispatchPhotos: schemaValues.uploadDispatchPhotos ?? [],
          safetyClearance: schemaValues.safetyClearance ?? { accorded: "NO", clearanceCertificate: "" },
          dispatchTeam: schemaValues.dispatchTeam ?? { qaRepresentative: "", safetyRepresentative: "", projectRepresentative: "" }
        }
      }
    ]
  };
};

// Generates update variant mapping including the required explicit root-level formId key
export const mapDispatchFormStateToUpdatePayload = (
  form: DispatchFormState,
  formId: string,
  batchId: string,
  subDepartmentId: number,
  intent: "DRAFT" | "SUBMIT",
) => {
  return {
    formId, // Explicitly extracted by .remove("formId") inside Java Controller Map Layer
    ...mapDispatchFormStateToBackendPayload(form, batchId, subDepartmentId, intent)
  };
};

export const mapDispatchFormStateToPayload = (form: DispatchFormState): DispatchFormBody => {
  const schema = form.dispatchSchema;

  return {
    schemaVersion: schema?.schemaVersion,
    schemaType: schema?.schemaType ?? DISPATCH_SCHEMA_TYPE,
    motorStage: form.motorStage || undefined,
    motorId: form.motorId || undefined,
    castingDate: form.castingDate || undefined,
    dispatchDate: form.dispatchDate || undefined,
    dispatchLocation: form.dispatchLocation || undefined,
    ndtClearance: form.ndtClearance || undefined,
    ndtMomNo: form.ndtClearance === "YES" ? form.ndtMomNo || undefined : undefined,
    finalAcceptanceClearance: form.finalAcceptanceClearance || undefined,
    finalAcceptanceMomNo:
      form.finalAcceptanceClearance === "YES" ? form.finalAcceptanceMomNo || undefined : undefined,
    sections: schema ? buildDispatchSectionPayload(schema, form.schemaFormValues) : [],
  };
};

const hasSetupValue = (form: DispatchFormState) =>
  [
    form.motorStage,
    form.motorId,
    form.castingDate,
    form.dispatchDate,
    form.dispatchLocation,
  ].some((value) => String(value ?? "").trim().length > 0) ||
  (form.ndtClearance === "YES" && String(form.ndtMomNo ?? "").trim().length > 0) ||
  (form.finalAcceptanceClearance === "YES" && String(form.finalAcceptanceMomNo ?? "").trim().length > 0);

export const hasAnyDispatchValue = (form: DispatchFormState) =>
  hasSetupValue(form) || schemaValuesHaveUserData(form.schemaFormValues ?? {});