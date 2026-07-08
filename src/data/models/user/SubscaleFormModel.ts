import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import { STRINGS } from "../../../app/config/strings";
import type { CasePrepDetailSection } from "./CasePreparationFormModel";
import {
  mapCastingCuringPersonLabel,
  parseCastingCuringSectionData,
} from "./CastingCuringFormModel";
import {
  hasSubscaleStructuredApiPayload,
  mapSubscaleApiDetailsToFormValues,
  mapSubscaleFormValuesToApiPayload,
  normalizeSubscaleApiDetailsPayload,
  resolveSubscaleApiSectionsForDisplay,
  type SubscaleApiPayloadBody,
} from "./subscaleApiPayloadMapper";

const SS = STRINGS.MANUFACTURING.SUBSCALE;
const HW = SS.HARDWARE;

const SUBSCALE_SECTION_LABELS: Record<string, string> = {
  HARDWARE_PREPARATION_DETAILS: HW.PREPARATION_TITLE,
  CASTING_DETAILS: "Casting Details",
  CURING_DETAILS: "Curing Details",
  NDT_DETAILS: "NDT Details",
  TRIMMING_DETAILS: "Trimming Details",
  INHIBITION_DETAILS: "Inhibition Details",
  STATIC_TESTING: "Static Testing",
  MECHANICAL_INTERFACE_PROPERTIES: "Mechanical Interface Properties",
};

export type SubscaleDetailView = {
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
  sections: CasePrepDetailSection[];
};

const parseSubscaleDisplaySections = (
  sections: unknown,
  payload?: Record<string, unknown>,
): CasePrepDetailSection[] =>
  resolveSubscaleApiSectionsForDisplay(sections, payload)
    .map((section) => {
      const parsed = parseCastingCuringSectionData(
        section.sectionId,
        section.sectionData as Record<string, unknown>[],
      );
      return {
        ...parsed,
        label: SUBSCALE_SECTION_LABELS[section.sectionId] ?? parsed.label,
      };
    })
    .filter((section) => section.fields.length > 0 || section.tables.length > 0);

export const mapSubscaleDetailsForDisplay = (
  data: Record<string, unknown> | null | undefined,
): SubscaleDetailView | null => {
  if (!data) return null;

  const sectionsInput =
    data.sections && typeof data.sections === "object" && !Array.isArray(data.sections)
      ? data.sections
      : undefined;

  return {
    formId: String(data.subscaleProcessingId ?? data.formId ?? ""),
    batchId: String(data.batchId ?? ""),
    batchType: String(data.batchType ?? ""),
    status: data.status != null ? String(data.status) : undefined,
    createdBy: mapCastingCuringPersonLabel(data.createdBy),
    createdAt: data.createdAt != null ? String(data.createdAt) : null,
    submittedBy: mapCastingCuringPersonLabel(data.submittedBy),
    submittedAt: data.submittedAt != null ? String(data.submittedAt) : null,
    lastUpdatedBy: mapCastingCuringPersonLabel(data.lastUpdatedBy),
    lastUpdatedAt: data.lastUpdatedAt != null ? String(data.lastUpdatedAt) : null,
    sections: parseSubscaleDisplaySections(sectionsInput, data),
  };
};

export const createSubscaleData = () => ({
  schemaFormLoaded: false,
  subscaleSchema: null as SchemaDocumentV2 | null,
  schemaFormValues: {} as SchemaFormValues,
  savedSections: undefined as SchemaSectionSubmission[] | undefined,
});

export type SubscaleFormState = ReturnType<typeof createSubscaleData>;

export type SubscaleDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  batchType?: string;
  sections?: SchemaSectionSubmission[];
  [key: string]: unknown;
};

export type SubscaleFormBody = SubscaleApiPayloadBody;

export const createDefaultSubscaleFormState = (): SubscaleFormState => createSubscaleData();

export const hydrateSubscaleFormState = (
  state: SubscaleFormState,
  schema: SchemaDocumentV2,
): SubscaleFormState => {
  const hasSavedValues = Object.keys(state.schemaFormValues ?? {}).length > 0;

  return {
    ...state,
    subscaleSchema: schema,
    schemaFormValues: hasSavedValues ? state.schemaFormValues : {},
  };
};

export const mapSubscaleDetailsToFormState = (details: Partial<SubscaleDetails>): SubscaleFormState => {
  const defaults = createDefaultSubscaleFormState();
  const payload = normalizeSubscaleApiDetailsPayload(details as Record<string, unknown>);

  const hasStructuredApiPayload = hasSubscaleStructuredApiPayload(payload);
  const schemaFormValues = hasStructuredApiPayload
    ? mapSubscaleApiDetailsToFormValues(payload)
    : {};

  const rawSections = (details as Record<string, unknown>).sections;
  const savedSections =
    hasStructuredApiPayload || !Array.isArray(rawSections)
      ? undefined
      : (rawSections as SchemaSectionSubmission[]);

  return {
    ...defaults,
    schemaFormLoaded: hasStructuredApiPayload || Boolean(savedSections?.length),
    schemaFormValues,
    savedSections,
  };
};

export const mapSubscaleFormStateToPayload = (
  form: SubscaleFormState,
  batchType?: string | null,
): SubscaleFormBody => mapSubscaleFormValuesToApiPayload(form.schemaFormValues ?? {}, batchType);

export const hasAnySubscaleValue = (form: SubscaleFormState) => {
  const values = form.schemaFormValues ?? {};
  return Object.entries(values).some(([key, value]) => {
    if (key.startsWith("_")) return false;
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "number" || typeof value === "boolean") return true;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value as object).length > 0;
    return false;
  });
};

export class SubscaleSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(data: any = {}) {
    const payload = data?.data ?? data;
    this.formId = String(payload?.formId ?? payload?.subscaleProcessingId ?? "");
    this.batchId = String(payload?.batchId ?? "");
    this.status = String(payload?.formStatus ?? payload?.status ?? "");
  }

  static fromApi(data: any) {
    return new SubscaleSubmitResponseModel(data);
  }
}

export class SubscaleDetailsModel {
  static fromApi(data: any): SubscaleDetails {
    const raw = (data?.data ?? data ?? {}) as Record<string, unknown>;
    const payload = normalizeSubscaleApiDetailsPayload(raw);

    return {
      ...payload,
      formId: String(payload?.formId ?? payload?.subscaleProcessingId ?? ""),
      batchId: String(payload?.batchId ?? ""),
      subDepartmentId: Number(payload?.subDepartmentId ?? 0),
      formSubmissionType: String(
        payload?.formSubmissionType ?? payload?.formStatus ?? payload?.status ?? "",
      ),
      batchType: payload?.batchType != null ? String(payload.batchType) : undefined,
      sections: resolveSubscaleApiSectionsForDisplay(raw.sections, raw),
    };
  }
}
