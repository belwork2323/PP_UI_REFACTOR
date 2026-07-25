import {
  FORM_SECTIONS_KEY,
  mapFormStateToCreateBemPayload,
  mapFormStateToCreateStfBatchPayload,
  mapFormStateToUpdateBemPayload,
  mapFormStateToUpdateStfBatchPayload,
  mapStaticTestFacilityDetailsToFormState,
  type BemMotorDetailsResponse,
  type CreateBemMotorPayload,
  type CreateStfBatchFormPayload,
  type StaticTestFacilityFormState,
  type UpdateBemMotorPayload,
  type UpdateStfBatchFormPayload,
} from "./StaticTestFacilityFormModel";
import type { SchemaDocumentV2, SchemaSectionSubmission } from "../../../schema-engine";
import { mapStfSubType } from "../../../schema-engine";
import {
  mapCastingCuringPersonLabel,
  parseCastingCuringSectionData,
} from "./CastingCuringFormModel";
import type { CasePrepDetailSection } from "./CasePreparationFormModel";

export type STFSubmissionType = "DRAFT" | "SUBMIT" | "UPDATE";

export type STFMotorPayload = {
  motorId: string;
  subType: string;
  staticTestingDetails: any;
};

// ============================================================================
// Response & Details Models
// ============================================================================

export class STFSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(payload: { formId?: string; batchId?: string; status?: string }) {
    this.formId = payload.formId ?? "";
    this.batchId = payload.batchId ?? "";
    this.status = payload.status ?? "";
  }

  static fromApi(apiResponse: any): STFSubmitResponseModel {
    return new STFSubmitResponseModel(apiResponse?.data ?? {});
  }
}

export class BEMSubmitResponseModel {
  bemMotorId: string;
  bemNo: string;
  status: string;

  constructor(payload: { bemMotorId?: string; bemNo?: string; status?: string }) {
    this.bemMotorId = payload.bemMotorId ?? "";
    this.bemNo = payload.bemNo ?? "";
    this.status = payload.status ?? "";
  }

  static fromApi(apiResponse: any): BEMSubmitResponseModel {
    return new BEMSubmitResponseModel(apiResponse?.data ?? {});
  }
}

export class STFDetailsModel {
  formId: string;
  batchId: string;
  batchType: string;
  subDepartmentId: number;
  formSubmissionType: string;
  subType: string;
  motorIdNo: string;
  sections: SchemaSectionSubmission[];
  motors: Array<{
    motorId: string;
    subType?: string;
    staticTestingDetails?: Record<string, unknown>;
  }>;
  createdBy: unknown;
  createdAt: string | null;
  submittedBy: unknown;
  submittedAt: string | null;
  lastUpdatedBy: unknown;
  lastUpdatedAt: string | null;
  workflowInsights: {
    currentStatus: string;
    rejectionReason: string | null;
  };

  constructor(payload: any) {
    this.formId = payload?.formId ?? "";
    this.batchId = payload?.batchId ?? "";
    this.batchType = payload?.batchType ?? "";
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.formSubmissionType = payload?.formSubmissionType ?? "";
    this.subType = payload?.subType ?? "";
    this.motorIdNo = payload?.motorIdNo ?? "";
    this.motors = extractMotorsFromPayload(payload);
    this.sections = extractSectionsFromPayload(payload);
    this.createdBy = payload?.createdBy ?? null;
    this.createdAt = payload?.createdAt ?? payload?.createdOn ?? null;
    this.submittedBy = payload?.submittedBy ?? null;
    this.submittedAt = payload?.submittedAt ?? payload?.submittedOn ?? null;
    this.lastUpdatedBy = payload?.lastUpdatedBy ?? payload?.updatedBy ?? null;
    this.lastUpdatedAt = payload?.lastUpdatedAt ?? payload?.updatedAt ?? payload?.updatedOn ?? null;

    this.workflowInsights = {
      currentStatus: payload?.workflowInsights?.currentStatus ?? "",
      rejectionReason: payload?.workflowInsights?.rejectionReason ?? null,
    };
  }

  static fromApi(apiResponse: any): STFDetailsModel {
    return new STFDetailsModel(apiResponse?.data ?? {});
  }

  static toFormState(model: STFDetailsModel) {
    return mapStaticTestFacilityDetailsToFormState({
      formId: model.formId,
      batchId: model.batchId,
      subDepartmentId: model.subDepartmentId,
      formSubmissionType: model.formSubmissionType,
      subType: model.subType,
      motorIdNo: model.motorIdNo,
      sections: model.sections,
      motors: model.motors,
    });
  }
}

export class BEMMotorDetailsModel implements BemMotorDetailsResponse {
  bemMotorId: string;
  bemNo: string;
  motorCode?: string;
  subDepartmentId: number;
  subType: string;
  status: string;
  sections: SchemaSectionSubmission[];
  staticTestingDetails?: {
    [FORM_SECTIONS_KEY]?: SchemaSectionSubmission[];
    [key: string]: unknown;
  };
  createdBy: unknown;
  createdAt: string | null;
  submittedBy: unknown;
  submittedAt: string | null;
  lastUpdatedBy: unknown;
  lastUpdatedAt: string | null;
  workflowInsights: {
    currentStatus: string;
    rejectionReason: string | null;
  };

  constructor(payload: any) {
    this.bemMotorId = payload?.bemMotorId ?? payload?.id ?? "";
    this.bemNo = payload?.bemNo ?? payload?.motorCode ?? "";
    this.motorCode = payload?.motorCode;
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.subType = payload?.subType ?? "BEM";
    this.status = payload?.status ?? payload?.formStatus ?? "";
    this.sections = extractSectionsFromPayload(payload);
    this.staticTestingDetails = payload?.staticTestingDetails;
    this.createdBy = payload?.createdBy ?? null;
    this.createdAt = payload?.createdAt ?? payload?.createdOn ?? null;
    this.submittedBy = payload?.submittedBy ?? null;
    this.submittedAt = payload?.submittedAt ?? payload?.submittedOn ?? null;
    this.lastUpdatedBy = payload?.lastUpdatedBy ?? payload?.updatedBy ?? null;
    this.lastUpdatedAt = payload?.lastUpdatedAt ?? payload?.updatedAt ?? payload?.updatedOn ?? null;

    this.workflowInsights = {
      currentStatus: payload?.workflowInsights?.currentStatus ?? this.status,
      rejectionReason: payload?.workflowInsights?.rejectionReason ?? null,
    };
  }

  static fromApi(apiResponse: any): BEMMotorDetailsModel {
    return new BEMMotorDetailsModel(apiResponse?.data ?? {});
  }
}

// ============================================================================
// Payload Extraction & API Transformation Helpers
// ============================================================================

const extractMotorsFromPayload = (
  payload: any,
): Array<{ motorId: string; subType: string; staticTestingDetails: Record<string, unknown> }> => {
  const motors = payload?.motors;
  if (!Array.isArray(motors)) return [];

  return motors
    .map((motor) => {
      const motorId = String(motor?.motorId ?? "").trim();
      if (!motorId) return null;
      return {
        motorId,
        subType: String(motor?.subType ?? ""),
        staticTestingDetails: motor?.staticTestingDetails ?? {},
      };
    })
    .filter(
      (
        motor,
      ): motor is {
        motorId: string;
        subType: string;
        staticTestingDetails: Record<string, unknown>;
      } => Boolean(motor),
    );
};

const extractSectionsFromPayload = (payload: any): SchemaSectionSubmission[] => {
  if (Array.isArray(payload?.sections) && payload.sections.length > 0) {
    return payload.sections;
  }

  if (Array.isArray(payload?.staticTestingDetails?.formSections)) {
    return payload.staticTestingDetails.formSections;
  }

  const motors = extractMotorsFromPayload(payload);
  if (motors.length > 0) {
    const formSections = motors[0]?.staticTestingDetails?.[FORM_SECTIONS_KEY];
    if (Array.isArray(formSections) && formSections.length > 0) {
      return formSections as SchemaSectionSubmission[];
    }
  }

  return [];
};

/**
 * Creates payload for POST /api/v1/user/stf/create
 */
export const mapCreateSTFBatchPayload = (params: {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType?: STFSubmissionType;
  formState: StaticTestFacilityFormState;
}): CreateStfBatchFormPayload =>
  mapFormStateToCreateStfBatchPayload({
    batchId: params.batchId,
    subDepartmentId: params.subDepartmentId,
    formSubmissionType: params.formSubmissionType === "DRAFT" ? "DRAFT" : "SUBMIT",
    formState: params.formState,
  });

/**
 * Creates payload for PUT /api/v1/user/stf/update/{formId}
 */
export const mapUpdateSTFBatchPayload = (params: {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType?: STFSubmissionType;
  formState: StaticTestFacilityFormState;
}): UpdateStfBatchFormPayload =>
  mapFormStateToUpdateStfBatchPayload({
    formId: params.formId,
    batchId: params.batchId,
    subDepartmentId: params.subDepartmentId,
    formSubmissionType: params.formSubmissionType === "DRAFT" ? "DRAFT" : "SUBMIT",
    formState: params.formState,
  });

/**
 * Creates payload for POST /api/v1/user/stf/bem-motor/create
 */
export const mapCreateBEMPayload = (params: {
  subDepartmentId: number;
  bemNo: string;
  schema: SchemaDocumentV2;
  formValues: Record<string, unknown>;
}): CreateBemMotorPayload =>
  mapFormStateToCreateBemPayload({
    subDepartmentId: params.subDepartmentId,
    bemNo: params.bemNo,
    schema: params.schema,
    formValues: params.formValues,
  });

/**
 * Creates payload for PUT /api/v1/user/stf/bem-motor/update/{bemMotorId}
 */
export const mapUpdateBEMPayload = (params: {
  bemMotorId: string;
  subDepartmentId: number;
  bemNo: string;
  schema: SchemaDocumentV2;
  formValues: Record<string, unknown>;
  formSubmissionType?: STFSubmissionType;
}): UpdateBemMotorPayload =>
  mapFormStateToUpdateBemPayload({
    bemMotorId: params.bemMotorId,
    subDepartmentId: params.subDepartmentId,
    bemNo: params.bemNo,
    schema: params.schema,
    formValues: params.formValues,
    formSubmissionType: params.formSubmissionType === "DRAFT" ? "DRAFT" : "SUBMIT",
  });

// ============================================================================
// STF & BEM Display Transformation Helpers
// ============================================================================

export type StfMotorDetailView = {
  motorId: string;
  subType: string;
  subTypeLabel: string;
  sections: CasePrepDetailSection[];
};

export type StfDetailView = {
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
  motors: StfMotorDetailView[];
};

const parseStfDisplaySections = (sections: unknown[] | undefined): CasePrepDetailSection[] =>
  (sections ?? [])
    .map((section) => {
      const block = section as { sectionId?: string; sectionData?: unknown };
      return parseCastingCuringSectionData(String(block.sectionId ?? ""), block.sectionData);
    })
    .filter((section) => section.fields.length > 0 || section.tables.length > 0);

const parseStfStructuredDetails = (details: Record<string, unknown>): CasePrepDetailSection[] =>
  Object.entries(details)
    .filter(([key]) => key !== FORM_SECTIONS_KEY)
    .map(([key, value]) => {
      if (Array.isArray(value)) return parseCastingCuringSectionData(key, value);
      if (value && typeof value === "object") return parseCastingCuringSectionData(key, [value]);
      return parseCastingCuringSectionData(key, [{ [key]: value }]);
    })
    .filter((section) => section.fields.length > 0 || section.tables.length > 0);

const resolveStfMotorSections = (
  motor: { staticTestingDetails?: Record<string, unknown> },
  legacySections?: SchemaSectionSubmission[],
): CasePrepDetailSection[] => {
  const details = motor.staticTestingDetails ?? {};
  const formSections = details[FORM_SECTIONS_KEY];

  if (Array.isArray(formSections) && formSections.length > 0) {
    return parseStfDisplaySections(formSections as unknown[]);
  }

  if (legacySections?.length) {
    return parseStfDisplaySections(legacySections as unknown[]);
  }

  const structuredKeys = Object.keys(details).filter((key) => key !== FORM_SECTIONS_KEY);
  if (structuredKeys.length > 0) {
    return parseStfStructuredDetails(details);
  }

  return [];
};

const formatStfSubTypeLabel = (subType?: string | null) => {
  const normalized = subType ? mapStfSubType(subType) : null;
  if (normalized === "BEM") return "BEM";
  if (normalized === "MAIN_MOTOR") return "Main Motor";
  return subType ? String(subType) : "Motor";
};

export const mapStfDetailsForDisplay = (
  data: Record<string, unknown> | STFDetailsModel | null | undefined,
): StfDetailView | null => {
  if (!data) return null;

  const root = data as Record<string, unknown>;
  const legacySections = Array.isArray(root.sections)
    ? (root.sections as SchemaSectionSubmission[])
    : undefined;
  const rawMotors = Array.isArray(root.motors) ? root.motors : [];
  const workflowInsights = root.workflowInsights as Record<string, unknown> | undefined;

  const motors: StfMotorDetailView[] = rawMotors
    .map((motor, index) => {
      const entry = motor as {
        motorId?: string;
        subType?: string;
        staticTestingDetails?: Record<string, unknown>;
      };
      const motorId = String(entry.motorId ?? "").trim();
      if (!motorId) return null;

      const subType = String(entry.subType ?? root.subType ?? "").trim();
      const sections = resolveStfMotorSections(entry, index === 0 ? legacySections : undefined);

      return {
        motorId,
        subType,
        subTypeLabel: formatStfSubTypeLabel(subType),
        sections,
      };
    })
    .filter((motor): motor is StfMotorDetailView => Boolean(motor));

  if (!motors.length && legacySections?.length) {
    const legacyMotorId = String(root.motorIdNo ?? root.motorId ?? "Motor").trim();
    motors.push({
      motorId: legacyMotorId,
      subType: String(root.subType ?? ""),
      subTypeLabel: formatStfSubTypeLabel(String(root.subType ?? "")),
      sections: parseStfDisplaySections(legacySections as unknown[]),
    });
  }

  return {
    formId: String(root.formId ?? ""),
    batchId: String(root.batchId ?? ""),
    batchType: root.batchType != null ? String(root.batchType) : "",
    status: String(root.formStatus ?? workflowInsights?.currentStatus ?? root.status ?? ""),
    createdBy: mapCastingCuringPersonLabel(root.createdBy),
    createdAt:
      root.createdAt != null
        ? String(root.createdAt)
        : root.createdOn != null
          ? String(root.createdOn)
          : null,
    submittedBy: mapCastingCuringPersonLabel(root.submittedBy),
    submittedAt:
      root.submittedAt != null
        ? String(root.submittedAt)
        : root.submittedOn != null
          ? String(root.submittedOn)
          : null,
    lastUpdatedBy: mapCastingCuringPersonLabel(root.lastUpdatedBy ?? root.updatedBy),
    lastUpdatedAt:
      root.lastUpdatedAt != null
        ? String(root.lastUpdatedAt)
        : root.updatedAt != null
          ? String(root.updatedAt)
          : root.updatedOn != null
            ? String(root.updatedOn)
            : null,
    motors,
  };
};

export const mapBemDetailsForDisplay = (
  data: Record<string, unknown> | BEMMotorDetailsModel | null | undefined,
): StfDetailView | null => {
  if (!data) return null;

  const root = data as Record<string, unknown>;
  const bemNo = String(root.bemNo ?? root.motorCode ?? "BEM Motor").trim();
  const rawSections = Array.isArray(root.sections)
    ? root.sections
    : (root.staticTestingDetails as Record<string, unknown> | undefined)?.formSections;

  const displaySections = parseStfDisplaySections(Array.isArray(rawSections) ? rawSections : []);

  return {
    formId: String(root.bemMotorId ?? root.id ?? ""),
    batchId: "",
    batchType: "BEM",
    status: String(
      root.status ??
        (root.workflowInsights as Record<string, unknown> | undefined)?.currentStatus ??
        "",
    ),
    createdBy: mapCastingCuringPersonLabel(root.createdBy),
    createdAt:
      root.createdAt != null
        ? String(root.createdAt)
        : root.createdOn != null
          ? String(root.createdOn)
          : null,
    submittedBy: mapCastingCuringPersonLabel(root.submittedBy),
    submittedAt:
      root.submittedAt != null
        ? String(root.submittedAt)
        : root.submittedOn != null
          ? String(root.submittedOn)
          : null,
    lastUpdatedBy: mapCastingCuringPersonLabel(root.lastUpdatedBy ?? root.updatedBy),
    lastUpdatedAt:
      root.lastUpdatedAt != null
        ? String(root.lastUpdatedAt)
        : root.updatedAt != null
          ? String(root.updatedAt)
          : root.updatedOn != null
            ? String(root.updatedOn)
            : null,
    motors: [
      {
        motorId: bemNo,
        subType: "BEM",
        subTypeLabel: "BEM",
        sections: displaySections,
      },
    ],
  };
};
