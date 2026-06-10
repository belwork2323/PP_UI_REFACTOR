import type { SchemaDocument, SchemaFormValues, SchemaSectionSubmission } from "../../../schemaManagement";
import {
  buildCasePrepMotorSubmission,
  buildCasePrepSectionPayload,
  createCasePrepInitialValues,
  hydrateCasePrepValuesFromSections,
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

export const mapCasePreparationDetailsToFormState = (details: any): CasePreparationFormState => {
  const motors = Array.isArray(details?.motors)
    ? details.motors.map((motor: any) => ({
        motorId: String(motor?.motorId ?? ""),
        prrcClearanceDate: String(motor?.prrcClearanceDate ?? ""),
        formValues: {},
        savedSections: Array.isArray(motor?.sections) ? motor.sections : undefined,
      }))
    : [];

  return {
    schema: null,
    motors,
    subscaleFormValues: {},
    subscaleSavedSections: Array.isArray(details?.sections) ? details.sections : undefined,
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

export const mapCasePreparationFormStateToPayload = (form: CasePreparationFormState) => {
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
    this.formId = String(data.formId ?? "");
    this.batchId = String(data.batchId ?? "");
    this.status = String(data.status ?? "");
  }

  static fromApi(data: any) {
    return new CasePreparationSubmitResponseModel(data);
  }
}

export class CasePreparationDetailsModel {
  static fromApi(data: any) {
    return {
      formId: String(data?.formId ?? ""),
      batchId: String(data?.batchId ?? ""),
      subDepartmentId: Number(data?.subDepartmentId ?? 0),
      formSubmissionType: String(data?.formSubmissionType ?? ""),
      motors: data?.motors ?? [],
      sections: data?.sections ?? [],
      generalActivities: data?.generalActivities ?? {},
      linearCoatingOperation: data?.linearCoatingOperation ?? {},
    };
  }
}
