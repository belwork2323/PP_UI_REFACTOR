import type { SchemaDocument, SchemaMaterialDetails } from "../models/schema.types";
import type { SchemaDataPayload, SchemaNode } from "../models/schema.v1.types";
import { isV1NodeTree, nodesToSections } from "./nodesToSections";
import { normalizeCasePrepSection } from "./casePreparationSchema";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

const isSchemaDataPayloadCandidate = (value: Record<string, unknown>): boolean =>
  Array.isArray(value.nodes) ||
  Boolean(value.meta) ||
  Boolean(value.layout) ||
  Boolean(value.designSystem) ||
  Boolean(value.context);

const isSchemaEnvelope = (record: Record<string, unknown>) =>
  record.schemaVersion != null || record.schemaType != null || record.functionality != null;

const resolveSchemaDataPayload = (record: Record<string, unknown>): SchemaDataPayload | null => {
  // Nested PP-Schema envelope: { schemaVersion, schemaType, data: { nodes, ... } }
  if (
    isRecord(record.data) &&
    isSchemaEnvelope(record) &&
    isSchemaDataPayloadCandidate(record.data)
  ) {
    return record.data as SchemaDataPayload;
  }

  if (isSchemaDataPayloadCandidate(record)) {
    return record as SchemaDataPayload;
  }

  return null;
};

export const extractSchemaDataPayload = (payload: unknown): SchemaDataPayload | null => {
  if (!isRecord(payload)) return null;

  if (isRecord(payload.data)) {
    const fromApi = resolveSchemaDataPayload(payload.data);
    if (fromApi) return fromApi;
  }

  return resolveSchemaDataPayload(payload);
};

const resolveEnvelopeMetadata = (
  payload: Record<string, unknown>,
  data: SchemaDataPayload,
): { schemaVersion: string; schemaType: string; functionality: string } => {
  const apiData = isRecord(payload.data) ? payload.data : null;
  const ctx = readContextRecord(data);

  return {
    schemaVersion: String(payload.schemaVersion ?? apiData?.schemaVersion ?? "1.0"),
    schemaType: String(
      payload.schemaType ?? apiData?.schemaType ?? ctx.schemaType ?? "SCHEMA",
    ).toUpperCase(),
    functionality: String(payload.functionality ?? apiData?.functionality ?? ""),
  };
};

export const resolveSchemaNodes = (data: SchemaDataPayload): SchemaNode[] => {
  if (!Array.isArray(data.nodes)) return [];
  if (data.nodes.length === 0) return [];
  return isV1NodeTree(data.nodes) ? data.nodes : [];
};

const readContextRecord = (data: SchemaDataPayload): Record<string, unknown> =>
  data.context && typeof data.context === "object" && !Array.isArray(data.context)
    ? (data.context as Record<string, unknown>)
    : {};

const buildRawMaterialDetails = (
  schemaType: string,
  data: SchemaDataPayload,
): SchemaMaterialDetails => {
  const meta = data.meta;
  const ctx = readContextRecord(data);
  const normalizedType = schemaType.toUpperCase();

  const gradeRaw = ctx.grade;
  const grade =
    gradeRaw && typeof gradeRaw === "object" && !Array.isArray(gradeRaw)
      ? {
          gradeId: Number((gradeRaw as Record<string, unknown>).gradeId ?? 0),
          gradeCode: String((gradeRaw as Record<string, unknown>).gradeCode ?? "").trim(),
          gradeName: String((gradeRaw as Record<string, unknown>).gradeName ?? "").trim(),
        }
      : null;

  const fromContext: SchemaMaterialDetails = {
    materialId: Number(ctx.materialId ?? 0),
    materialCode: String(ctx.materialCode ?? "").trim(),
    materialName: String(ctx.materialName ?? meta?.title ?? "").trim(),
    materialType: String(ctx.materialType ?? normalizedType).trim(),
    grade,
  };

  if (fromContext.materialCode) return fromContext;

  if (normalizedType === "MOCK_TRIAL") {
    return {
      materialId: 0,
      materialCode: "MOCK_TRIAL",
      materialName: String(meta?.title ?? "Mock Trial").trim(),
      materialType: "MOCK_TRIAL",
      grade: null,
    };
  }

  if (normalizedType === "CASE_PREPARATION") {
    return {
      materialId: 0,
      materialCode: "CASE_PREPARATION",
      materialName: String(meta?.title ?? "Case Preparation").trim(),
      materialType: "CASE_PREPARATION",
      grade: null,
    };
  }

  if (normalizedType === "CASTING" || normalizedType === "CURING") {
    return {
      materialId: 0,
      materialCode: normalizedType,
      materialName: String(meta?.title ?? (normalizedType === "CASTING" ? "Casting" : "Curing")).trim(),
      materialType: normalizedType,
      grade: null,
    };
  }

  return {
    materialId: 0,
    materialCode: normalizedType || "SCHEMA",
    materialName: String(meta?.title ?? normalizedType).trim(),
    materialType: normalizedType,
    grade: null,
  };
};

export const normalizeV1SchemaDocument = (payload: unknown): SchemaDocument | null => {
  if (!isRecord(payload)) return null;

  const data = extractSchemaDataPayload(payload);
  if (!data) return null;

  const meta = data.meta;
  const hasPlaceholder = Boolean(meta?.title || meta?.description);
  const nodes = resolveSchemaNodes(data);

  if (!nodes.length && !hasPlaceholder) return null;

  const { schemaVersion, schemaType, functionality } = resolveEnvelopeMetadata(payload, data);
  const isCasePreparation = schemaType === "CASE_PREPARATION";

  const sections = nodes.length
    ? nodesToSections(nodes).map((section) =>
        isCasePreparation ? normalizeCasePrepSection(section) : section,
      )
    : [];

  if (!sections.length && !hasPlaceholder) return null;

  const rawMaterialDetails = buildRawMaterialDetails(schemaType, data);

  return {
    schemaVersion,
    schemaType,
    functionality,
    layout: data.layout ?? { type: "flat" },
    formDetails: meta
      ? {
          title: meta.title?.trim() || undefined,
          description: meta.description?.trim() || undefined,
        }
      : undefined,
    rawMaterialDetails,
    sections,
    nodes: nodes.length ? nodes : undefined,
    designSystem: data.designSystem,
    meta,
    context: data.context,
  };
};
