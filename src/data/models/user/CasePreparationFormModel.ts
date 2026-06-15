import type { SchemaDocument, SchemaFormValues, SchemaSectionSubmission } from "../../../schemaManagement";
import {
  buildCasePrepMotorSubmission,
  buildCasePrepSectionPayload,
  createCasePrepInitialValues,
  hydrateCasePrepValuesFromSections,
  type CasePrepMotorSubmission,
} from "../../../schemaManagement";
import { schemaValuesHaveUserData } from "../../../schemaManagement/models/schemaFormState";

export type CasePrepMotorSession = {
  motorId: string;
  prrcClearanceDate: string;
  formValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
};

export type CasePreparationFormState = {
  schema: SchemaDocument | null;
  motors: CasePrepMotorSession[];
  subscaleFormValues: SchemaFormValues;
  subscaleSavedSections?: SchemaSectionSubmission[];
};

export type CasePreparationFormBody = {
  schemaVersion?: string;
  schemaType?: string;
  motors: CasePrepMotorSubmission[];
  sections?: SchemaSectionSubmission[];
};

export const createDefaultCasePreparationFormState = (): CasePreparationFormState => ({
  schema: null,
  motors: [],
  subscaleFormValues: {},
});

export const createEmptyMotorSession = (
  motorId: string,
  prrcClearanceDate: string,
  schema: SchemaDocument | null
): CasePrepMotorSession => ({
  motorId,
  prrcClearanceDate,
  formValues: schema ? createCasePrepInitialValues(schema) : {},
  savedSections: undefined,
});

const resolveCasePrepDetailsPayload = (details: any) =>
  details?.casePreparationDetails ?? details?.preparationDetails ?? details ?? {};

export const mapCasePreparationDetailsToFormState = (details: any): CasePreparationFormState => {
  const payload = resolveCasePrepDetailsPayload(details);
  const rawMotors = Array.isArray(payload?.motors) ? payload.motors : [];

  const motors = rawMotors
    .map((motor: any) => ({
      motorId: String(motor?.motorId ?? "").trim(),
      prrcClearanceDate: String(
        motor?.prrcClearanceDate ?? motor?.prrcDate ?? motor?.prrcClearance ?? "",
      ).trim(),
      formValues: {},
      savedSections: Array.isArray(motor?.sections)
        ? motor.sections
        : Array.isArray(motor?.motorSections)
          ? motor.motorSections
          : undefined,
    }))
    .filter((motor) => motor.motorId.length > 0);

  const sections = Array.isArray(payload?.sections)
    ? payload.sections
    : Array.isArray(details?.sections)
      ? details.sections
      : undefined;

  return {
    schema: null,
    motors,
    subscaleFormValues: {},
    subscaleSavedSections: sections,
  };
};

export const hydrateCasePreparationFormState = (
  state: CasePreparationFormState,
  schema: SchemaDocument | null
): CasePreparationFormState => {
  if (!schema) return state;

  const motors = (state.motors ?? []).map((motor) => ({
    ...motor,
    formValues: motor.savedSections?.length
      ? hydrateCasePrepValuesFromSections(schema, motor.savedSections)
      : Object.keys(motor.formValues ?? {}).length > 0
        ? motor.formValues
        : createCasePrepInitialValues(schema),
  }));

  const subscaleFormValues = state.subscaleSavedSections?.length
    ? hydrateCasePrepValuesFromSections(schema, state.subscaleSavedSections)
    : Object.keys(state.subscaleFormValues ?? {}).length > 0
      ? state.subscaleFormValues
      : createCasePrepInitialValues(schema);

  return {
    ...state,
    schema,
    motors,
    subscaleFormValues,
  };
};

export const mapCasePreparationFormStateToPayload = (
  form: CasePreparationFormState
): CasePreparationFormBody => {
  const schema = form.schema;

  if (!schema) {
    return {
      motors: [],
      sections: [],
    };
  }

  const motors = (form.motors ?? []).map((motor) =>
    buildCasePrepMotorSubmission(schema, motor.motorId, motor.prrcClearanceDate, motor.formValues)
  );

  return {
    schemaVersion: schema.schemaVersion,
    schemaType: schema.schemaType,
    motors,
    sections: motors.length === 0 ? buildCasePrepSectionPayload(schema, form.subscaleFormValues) : undefined,
  };
};

export const hasAnyCasePreparationValue = (form: CasePreparationFormState) => {
  if ((form.motors ?? []).some((motor) => schemaValuesHaveUserData(motor.formValues ?? {}))) {
    return true;
  }
  return schemaValuesHaveUserData(form.subscaleFormValues ?? {});
};

export class CasePreparationSubmitResponseModel {
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
    const payload = data?.data ?? data ?? {};
    return new CasePreparationSubmitResponseModel(payload);
  }
}

export class CasePreparationDetailsModel {
  static fromApi(data: any) {
    const payload = data?.data ?? data ?? {};
    const casePreparationDetails =
      payload?.casePreparationDetails ?? payload?.preparationDetails ?? null;

    return {
      formId: String(payload?.formId ?? ""),
      batchId: String(payload?.batchId ?? ""),
      batchType: String(payload?.batchType ?? ""),
      subDepartmentId: Number(payload?.subDepartmentId ?? 0),
      formSubmissionType: String(payload?.formSubmissionType ?? ""),
      casePreparationDetails,
      motors:
        casePreparationDetails?.motors ??
        payload?.motors ??
        [],
      sections:
        casePreparationDetails?.sections ??
        payload?.sections ??
        [],
      generalActivities:
        casePreparationDetails?.generalActivities ??
        payload?.generalActivities ??
        {},
      linearCoatingOperation:
        casePreparationDetails?.linearCoatingOperation ??
        payload?.linearCoatingOperation ??
        {},
    };
  }
}
