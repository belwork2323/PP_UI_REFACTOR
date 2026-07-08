import {
  createPostCureData,
  formatPostCureMotorOperationLabel,
  isPostCureInhibitionOperation,
  mapPostCureInhibitorTypeToApi,
  mapPostCureOperationToApi,
} from "../../../hooks/user/manufacturing/postCureConfig";
import type { CasePrepDetailSection } from "./CasePreparationFormModel";
import {
  mapCastingCuringPersonLabel,
  parseCastingCuringSectionData,
} from "./CastingCuringFormModel";
import {
  buildPostCureSectionPayload,
  createPostCureInitialValues,
  hydratePostCureValuesFromSections,
  schemaValuesHaveUserData,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../schema-engine";

export type PostCureMotorSession = {
  motorId: string;
  motorReceiptDate: string;
  operation: string;
  inhibitorType: string;
  postCureSchema: SchemaDocumentV2 | null;
  schemaFormValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
};

export type PostCureFormState = ReturnType<typeof createPostCureData>;

export type PostCureDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  operationType?: string;
  status?: string;
  batchType?: string;
  createdBy?: string | null;
  createdAt?: string | null;
  submittedBy?: string | null;
  submittedAt?: string | null;
  lastUpdatedBy?: string | null;
  lastUpdatedAt?: string | null;
  motorId?: string;
  motorReceiptDate?: string;
  operation?: string;
  inhibitorType?: string;
  sections?: SchemaSectionSubmission[];
  motors?: Array<{
    motorId: string;
    motorReceiptDate?: string;
    operation?: string;
    inhibitorType?: string;
    operationType?: string;
    sections?: SchemaSectionSubmission[];
  }>;
};

export type PostCureMotorPayload = {
  motorId: string;
  motorReceiptDate: string;
  operationType: "LOOSE_FLAP_FILLING" | "INHIBITION" | null;
  sections: SchemaSectionSubmission[];
  inhibitorType?: "IR1" | "HEMCOAT_3K" | "NOT_APPLICABLE";
};

export type PostCureFormBody = {
  motors: PostCureMotorPayload[];
};

export const createDefaultPostCureFormState = (): PostCureFormState => createPostCureData();

export const createEmptyPostCureMotorSession = (
  motorId: string,
  motorReceiptDate: string,
  operation: string,
  inhibitorType: string,
  schema: SchemaDocumentV2,
): PostCureMotorSession => ({
  motorId,
  motorReceiptDate,
  operation,
  inhibitorType,
  postCureSchema: schema,
  schemaFormValues: createPostCureInitialValues(schema),
  savedSections: undefined,
});

export const hydratePostCureMotorSession = (
  motor: PostCureMotorSession,
  schema: SchemaDocumentV2,
): PostCureMotorSession => ({
  ...motor,
  postCureSchema: schema,
  schemaFormValues: motor.savedSections?.length
    ? hydratePostCureValuesFromSections(schema, motor.savedSections)
    : Object.keys(motor.schemaFormValues ?? {}).length > 0
      ? motor.schemaFormValues
      : createPostCureInitialValues(schema),
});

const mapApiOperationType = (operationType: string) => {
  if (operationType === "LOOSE_FLAP_FILLING") return "loose-flap-filling";
  if (operationType === "INHIBITION") return "inhibition";
  return "";
};

const mapApiInhibitorType = (inhibitorType: string) => {
  if (inhibitorType === "HEMCOAT_3K") return "Hemcoat-3K";
  if (inhibitorType === "NOT_APPLICABLE") return "not-applicable";
  return inhibitorType;
};

const mapDetailsMotorToSession = (
  motor: {
    motorId?: string;
    motorReceiptDate?: string;
    operation?: string;
    inhibitorType?: string;
    operationType?: string;
    sections?: SchemaSectionSubmission[];
  },
  fallback?: { operation?: string; inhibitorType?: string },
): PostCureMotorSession | null => {
  const motorId = String(motor?.motorId ?? "").trim();
  if (!motorId) return null;

  const operationType = String(motor?.operationType ?? "").trim();
  const operation =
    String(motor?.operation ?? "").trim() ||
    mapApiOperationType(operationType) ||
    String(fallback?.operation ?? "");

  const inhibitorType =
    mapApiInhibitorType(String(motor?.inhibitorType ?? "").trim()) ||
    String(fallback?.inhibitorType ?? "");

  return {
    motorId,
    motorReceiptDate: String(motor?.motorReceiptDate ?? ""),
    operation,
    inhibitorType,
    postCureSchema: null,
    schemaFormValues: {},
    savedSections: Array.isArray(motor?.sections) ? motor.sections : undefined,
  };
};

export const mapPostCureDetailsToFormState = (details: Partial<PostCureDetails>): PostCureFormState => {
  const defaults = createDefaultPostCureFormState();
  const fallback = {
    operation: String(details?.operation ?? ""),
    inhibitorType: mapApiInhibitorType(String(details?.inhibitorType ?? "").trim()),
  };

  const rawMotors = Array.isArray(details?.motors) ? details.motors : [];
  const motors =
    rawMotors.length > 0
      ? rawMotors
          .map((motor) => mapDetailsMotorToSession(motor, fallback))
          .filter((motor): motor is PostCureMotorSession => motor !== null)
      : details?.motorId
        ? [mapDetailsMotorToSession(details, fallback)].filter(
            (motor): motor is PostCureMotorSession => motor !== null,
          )
        : [];

  const hasSavedSections = motors.some((motor) => Boolean(motor.savedSections?.length));

  return {
    ...defaults,
    schemaFormLoaded: hasSavedSections,
    motors,
  };
};

export const mapPostCureFormStateToPayload = (form: PostCureFormState): PostCureFormBody => ({
  motors: (form.motors ?? []).map((motor) => {
    const operationType = mapPostCureOperationToApi(motor.operation);
    const inhibitorType = isPostCureInhibitionOperation(motor.operation)
      ? mapPostCureInhibitorTypeToApi(motor.inhibitorType)
      : null;

    return {
      motorId: String(motor.motorId ?? ""),
      motorReceiptDate: String(motor.motorReceiptDate ?? ""),
      operationType,
      sections: motor.postCureSchema
        ? buildPostCureSectionPayload(motor.postCureSchema, motor.schemaFormValues)
        : [],
      ...(inhibitorType ? { inhibitorType } : {}),
    };
  }),
});

export const hasAnyPostCureValue = (form: PostCureFormState) =>
  (form.motors ?? []).some(
    (motor) =>
      [motor.motorId, motor.motorReceiptDate, motor.operation, motor.inhibitorType].some(
        (value) => String(value ?? "").trim().length > 0,
      ) || schemaValuesHaveUserData(motor.schemaFormValues ?? {}),
  );

export type PostCureMotorDetailView = {
  motorId: string;
  motorReceiptDate: string;
  operationLabel: string;
  sections: CasePrepDetailSection[];
};

export type PostCureDetailView = {
  formId: string;
  batchId: string;
  batchType: string;
  status?: string;
  createdBy: string | null;
  createdAt: string | null;
  submittedBy: string | null;
  submittedAt: string | null;
  lastUpdatedBy: string | null;
  lastUpdatedAt: string | null;
  motors: PostCureMotorDetailView[];
};

const parsePostCureDisplaySections = (sections: unknown[] | undefined): CasePrepDetailSection[] =>
  (sections ?? [])
    .map((section) => {
      const block = section as { sectionId?: string; sectionData?: Record<string, unknown>[] };
      return parseCastingCuringSectionData(String(block.sectionId ?? ""), block.sectionData);
    })
    .filter((section) => section.fields.length > 0 || section.tables.length > 0);

const resolvePostCureMotorSections = (motor: Record<string, unknown>): CasePrepDetailSection[] => {
  if (Array.isArray(motor.sections)) {
    return parsePostCureDisplaySections(motor.sections as unknown[]);
  }

  const details = (motor.details ?? motor) as Record<string, unknown>;
  if (Array.isArray(details.sections)) {
    return parsePostCureDisplaySections(details.sections as unknown[]);
  }

  return [];
};

export const mapPostCureDetailsForDisplay = (
  data: Record<string, unknown> | null | undefined,
): PostCureDetailView | null => {
  if (!data) return null;

  const details = (data.postCureDetails ?? data) as Record<string, unknown>;
  const rawMotors = Array.isArray(details.motors) ? details.motors : [];

  const motors: PostCureMotorDetailView[] = rawMotors
    .map((motor) => {
      const entry = motor as Record<string, unknown>;
      const src = (entry.details ?? entry) as Record<string, unknown>;
      const operation =
        String(src.operation ?? "").trim() ||
        mapApiOperationType(String(src.operationType ?? "").trim());
      const inhibitorType =
        mapApiInhibitorType(String(src.inhibitorType ?? "").trim()) ||
        String(src.inhibitorType ?? "").trim();

      return {
        motorId: String(entry.motorId ?? src.motorId ?? "").trim(),
        motorReceiptDate: String(src.motorReceiptDate ?? "").trim(),
        operationLabel: formatPostCureMotorOperationLabel(operation, inhibitorType),
        sections: resolvePostCureMotorSections(entry),
      };
    })
    .filter((motor) => motor.motorId.length > 0);

  return {
    formId: String(data.formId ?? details.formId ?? ""),
    batchId: String(data.batchId ?? details.batchId ?? ""),
    batchType: String(data.batchType ?? details.batchType ?? ""),
    status: data.status != null ? String(data.status) : details.status != null ? String(details.status) : undefined,
    createdBy: mapCastingCuringPersonLabel(data.createdBy ?? details.createdBy),
    createdAt:
      data.createdAt != null
        ? String(data.createdAt)
        : details.createdAt != null
          ? String(details.createdAt)
          : null,
    submittedBy: mapCastingCuringPersonLabel(data.submittedBy ?? details.submittedBy),
    submittedAt:
      data.submittedAt != null
        ? String(data.submittedAt)
        : details.submittedAt != null
          ? String(details.submittedAt)
          : null,
    lastUpdatedBy: mapCastingCuringPersonLabel(data.lastUpdatedBy ?? details.lastUpdatedBy),
    lastUpdatedAt:
      data.lastUpdatedAt != null
        ? String(data.lastUpdatedAt)
        : details.lastUpdatedAt != null
          ? String(details.lastUpdatedAt)
          : null,
    motors,
  };
};

export class PostCureSubmitResponseModel {
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
    return new PostCureSubmitResponseModel(data);
  }
}

export class PostCureDetailsModel {
  static fromApi(data: any): PostCureDetails {
    const payload = data?.data ?? data ?? {};
    const operationType = String(payload?.operationType ?? "").trim();
    const inhibitorType = String(payload?.inhibitorType ?? "").trim();

    const operation = mapApiOperationType(operationType) || String(payload?.operation ?? "");
    const mappedInhibitorType = mapApiInhibitorType(inhibitorType) || String(payload?.inhibitorType ?? "");

    const rawMotors = Array.isArray(payload?.motors) ? payload.motors : [];

    return {
      formId: String(payload?.formId ?? ""),
      batchId: String(payload?.batchId ?? ""),
      subDepartmentId: Number(payload?.subDepartmentId ?? 0),
      formSubmissionType: String(payload?.formSubmissionType ?? ""),
      operationType: operationType || undefined,
      status: payload?.status != null ? String(payload.status) : undefined,
      batchType: payload?.batchType != null ? String(payload.batchType) : undefined,
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
      motorId: String(payload?.motorId ?? ""),
      motorReceiptDate: String(payload?.motorReceiptDate ?? ""),
      operation,
      inhibitorType: mappedInhibitorType,
      sections: Array.isArray(payload?.sections) ? payload.sections : undefined,
      motors:
        rawMotors.length > 0
          ? rawMotors.map((motor: any) => ({
              motorId: String(motor?.motorId ?? ""),
              motorReceiptDate: String(motor?.motorReceiptDate ?? ""),
              operation: mapApiOperationType(String(motor?.operationType ?? "")) || operation,
              inhibitorType:
                mapApiInhibitorType(String(motor?.inhibitorType ?? "")) || mappedInhibitorType,
              operationType: String(motor?.operationType ?? ""),
              sections: Array.isArray(motor?.sections) ? motor.sections : undefined,
            }))
          : undefined,
    };
  }
}
