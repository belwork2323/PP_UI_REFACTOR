import { QCDivisionDetailsModel } from "../../../data/models/user/QCDivisionApiModel";
import {
  createDefaultQualityControlFormState,
  mapQCDivisionDetailsForDisplay,
  type QCDivisionDetailView,
  type QualityControlFormState,
} from "../../../data/models/user/QualityControlFormModel";
import {
  fetchQcSchema,
  hydrateQcValuesFromSections,
  type QcApiDivision,
  type QcApiSubType,
  type QcInhibitorType,
} from "../../../schema-engine/adapters/qc.adapter";
import type { SchemaDocumentV2, SchemaSectionSubmission } from "../../../schema-engine";
import { getQcSchemaCacheKey } from "./qcFlowConfig";
import {
  buildDivisionEntryLabel,
  buildMotorDivisionGroupKey,
  createDivisionEntryId,
  parseMotorDivisionGroupKey,
} from "./qcDivisionEntries";
import type { QcDivisionEntry, QcDivisionEntryValues } from "./qcDivisionEntryTypes";
import { getHardwareSectionIdForSubType } from "./qcHardwareConfig";
import { resolveQcSectionInhibitorType } from "./qcPostCureConfig";
import {
  groupMixingDetailSections,
  hydrateMixingFinalMixDetailsValues,
  QC_MIXING_PREMIX_SECTION_ID,
  QC_MIXING_VISCOSITY_SECTION_ID,
  sliceMixingFinalMixSchema,
} from "./qcMixingConfig";
import {
  createInitialRevalidationSchemaValues,
  hydrateRevalidationValuesFromSections,
} from "./qcRawMaterialRevalidationTable";
import { fetchQcSchemaWithInflightDedup, getCachedQcSchema, mapWithConcurrency } from "./qcSchemaFetchCache";

const getEntryKind = (
  division: QcApiDivision,
  subType: QcApiSubType,
): { flowKey: string; kind: QcDivisionEntry["kind"] } => {
  if (division === "RAW_MATERIAL_REVALIDATION") return { flowKey: "RAW_MATERIAL", kind: "REVALIDATION" };
  if (division === "RAW_MATERIAL_PROCESSING") {
    const kind =
      subType === "SOLID_PROCESSING"
        ? "SOLID_PREMIX"
        : subType === "LIQUID_PROCESSING"
          ? "LIQUID_PREMIX"
          : "BOTH_PREMIX";
    return { flowKey: "RAW_MATERIAL", kind };
  }
  if (division === "MIXING") {
    return {
      flowKey: "MIXING",
      kind: subType === "FINAL_MIX" ? "MIXING_FINAL_MIX" : "MIXING_PREMIX",
    };
  }
  if (division === "HARDWARE") return { flowKey: "HARDWARE", kind: "HARDWARE_PROCESS" };
  if (division === "CASTING") return { flowKey: "CASTING", kind: "CASTING_MOTOR" };
  if (division === "CURING") return { flowKey: "CURING", kind: "CURING_MOTOR" };
  if (division === "TRIMMING") return { flowKey: "TRIMMING", kind: "TRIMMING_MOTOR" };
  if (division === "DE_CORING") return { flowKey: "DE_CORING", kind: "DE_CORING_MOTOR" };
  if (division === "POST_CURE") return { flowKey: "POST_CURE", kind: "POST_CURE_MOTOR" };
  if (division === "NDT") return { flowKey: "NDT", kind: "NDT_MOTOR" };
  if (division === "PROPELLANT_PROPERTIES") return { flowKey: "QC", kind: "PROPELLANT_PROCESS" };
  if (division === "WEIGHTMENT") return { flowKey: "WEIGHTMENT", kind: "WEIGHTMENT_MOTOR" };
  if (division === "STATIC_TEST_FACILITY") return { flowKey: "STATIC_TEST_FACILITY", kind: "STF" };
  return { flowKey: division, kind: "SIMPLE" };
};

export async function hydrateQcDivisionFormFromDetails(
  detailsData: QCDivisionDetailsModel,
  subDepartmentId: number,
): Promise<QualityControlFormState> {
  const effectiveSubDepartmentId = Number(detailsData.subDepartmentId || subDepartmentId);
  const rawDivisionDetails = detailsData.divisionDetails;
  const hasDivisionDetails = Array.isArray(rawDivisionDetails) && rawDivisionDetails.length > 0;

  if (!hasDivisionDetails || !effectiveSubDepartmentId) {
    return QCDivisionDetailsModel.toFormState(detailsData);
  }

  let resolvedData = QCDivisionDetailsModel.toFormState(detailsData);
  const entries: QcDivisionEntry[] = [];
  const entryValues: Record<string, QcDivisionEntryValues> = {};
  const schemasByKey: Record<string, SchemaDocumentV2> = {};
  const schemaFetchQueue = new Map<
    string,
    { division: QcApiDivision; subType: QcApiSubType; inhibitorType?: QcInhibitorType }
  >();
  const mixingFinalMixDetailSections: SchemaSectionSubmission[] = [];

  const enqueueSchema = (
    division: QcApiDivision,
    subType: QcApiSubType,
    inhibitorType?: QcInhibitorType,
  ) => {
    if (division === "MIXING" && subType == null) return "";
    const key = getQcSchemaCacheKey(division, subType, inhibitorType);
    if (!schemaFetchQueue.has(key)) {
      schemaFetchQueue.set(key, { division, subType, inhibitorType });
    }
    return key;
  };

  const rawMaterialTypeForLabel = (division: QcApiDivision): string => {
    if (division === "RAW_MATERIAL_REVALIDATION") return "RAW_MATERIAL_REVALIDATION";
    if (division === "RAW_MATERIAL_PROCESSING") return "RAW_MATERIAL_PROCESSING";
    return "";
  };

  const processingTypeForLabel = (_division: QcApiDivision, subType: QcApiSubType): string => {
    if (subType === "SOLID_PROCESSING" || subType === "LIQUID_PROCESSING") return subType;
    return "";
  };

  for (const detail of rawDivisionDetails) {
    const division = detail.division as QcApiDivision;
    const detailSubType = detail.subType as QcApiSubType;
    const sections: SchemaSectionSubmission[] =
      detail.data?.sections ?? (detail as { sections?: SchemaSectionSubmission[] }).sections ?? [];

    const makeEntry = (
      entryKind: QcDivisionEntry["kind"],
      entrySubType: QcApiSubType,
      entrySections: SchemaSectionSubmission[],
      premixNo?: number,
      motorId?: string,
      inhibitorType?: string,
    ) => {
      const entryId = createDivisionEntryId();
      const label = buildDivisionEntryLabel({
        flowKey: getEntryKind(division, entrySubType).flowKey,
        kind: entryKind,
        rawMaterialType: rawMaterialTypeForLabel(division),
        processingType: processingTypeForLabel(division, entrySubType),
        premixNo,
        subType: entrySubType,
        motorId,
      });
      const entry: QcDivisionEntry = {
        entryId,
        flowKey: getEntryKind(division, entrySubType).flowKey,
        kind: entryKind,
        apiDivision: division,
        subType: entrySubType,
        label,
        savedSections: entrySections,
        ...(premixNo != null && { premixNo }),
        ...(motorId && { motorId }),
        ...(inhibitorType && { inhibitorType }),
      };
      entries.push(entry);
      return { entryId, entrySections };
    };

    if (division === "MIXING") {
      const grouped = groupMixingDetailSections(sections, detailSubType);
      grouped.schemaSubTypes.forEach((subType) => enqueueSchema(division, subType));

      grouped.premixEntries.forEach(({ premixNo, sections: preSections }) => {
        const { entryId } = makeEntry("MIXING_PREMIX", "PREMIX", preSections, premixNo);
        entryValues[entryId] = { schemaValues: {} };
      });

      grouped.finalMixEntries.forEach(({ premixNo, sections: visSections }) => {
        const { entryId } = makeEntry("MIXING_FINAL_MIX", "FINAL_MIX", visSections, premixNo);
        entryValues[entryId] = { schemaValues: {} };
      });

      if (grouped.finalMixDetailSections.length) {
        mixingFinalMixDetailSections.push(...grouped.finalMixDetailSections);
      }
      continue;
    }

    const sectionsByPremix = new Map<string, SchemaSectionSubmission[]>();
    const sectionsByMotor = new Map<string, SchemaSectionSubmission[]>();
    const simpleSections: SchemaSectionSubmission[] = [];

    for (const section of sections) {
      if (section.premixNo != null) {
        const sectionSubType = (section.subType ?? detailSubType) as QcApiSubType;
        enqueueSchema(division, sectionSubType);
        const groupKey = `${section.premixNo}:${sectionSubType}`;
        const list = sectionsByPremix.get(groupKey) ?? [];
        list.push(section);
        sectionsByPremix.set(groupKey, list);
      } else if ((section as { motorId?: string }).motorId) {
        const sectionSubType = (section.subType ?? detailSubType) as QcApiSubType;
        const sectionInhibitorType = resolveQcSectionInhibitorType(
          division,
          sectionSubType,
          (section as { inhibitorType?: string }).inhibitorType,
        );
        enqueueSchema(division, sectionSubType, sectionInhibitorType);
        const motorId = String((section as { motorId?: string }).motorId);
        const groupKey = buildMotorDivisionGroupKey(motorId, sectionSubType, {
          division,
          inhibitorType: sectionInhibitorType,
        });
        const list = sectionsByMotor.get(groupKey) ?? [];
        list.push(section);
        sectionsByMotor.set(groupKey, list);
      } else {
        if (division !== "RAW_MATERIAL_REVALIDATION") {
          enqueueSchema(division, detailSubType);
        }
        simpleSections.push(section);
      }
    }

    if (sectionsByPremix.size > 0) {
      for (const [groupKey, preSections] of sectionsByPremix) {
        const colonIdx = groupKey.lastIndexOf(":");
        const premixNo = parseInt(groupKey.slice(0, colonIdx), 10);
        const sectionSubType = groupKey.slice(colonIdx + 1) as QcApiSubType;
        const { kind } = getEntryKind(division, sectionSubType);
        const { entryId } = makeEntry(kind, sectionSubType, preSections, premixNo);
        entryValues[entryId] = { schemaValues: {} };
      }
    } else if (sectionsByMotor.size > 0) {
      for (const [groupKey, motSections] of sectionsByMotor) {
        const parsed = parseMotorDivisionGroupKey(groupKey);
        const { kind } = getEntryKind(division, parsed.subType);
        const { entryId } = makeEntry(
          kind,
          parsed.subType,
          motSections,
          undefined,
          parsed.motorId,
          parsed.inhibitorType,
        );
        entryValues[entryId] = { schemaValues: {} };
      }
    } else if (simpleSections.length > 0) {
      const { kind } = getEntryKind(division, detailSubType);
      const { entryId } = makeEntry(kind, detailSubType, simpleSections);
      entryValues[entryId] = {
        schemaValues:
          kind === "REVALIDATION"
            ? hydrateRevalidationValuesFromSections(simpleSections)
            : {},
      };
    }
  }

  const schemaRequests = Array.from(schemaFetchQueue.values());
  for (const request of schemaRequests) {
    const cacheKey = getQcSchemaCacheKey(request.division, request.subType, request.inhibitorType);
    const cached = getCachedQcSchema(cacheKey);
    if (cached) {
      schemasByKey[cacheKey] = cached;
    }
  }

  const pendingSchemaRequests = schemaRequests.filter((request) => {
    const cacheKey = getQcSchemaCacheKey(request.division, request.subType, request.inhibitorType);
    return !schemasByKey[cacheKey];
  });

  await mapWithConcurrency(pendingSchemaRequests, 4, async (request) => {
    const cacheKey = getQcSchemaCacheKey(request.division, request.subType, request.inhibitorType);
    try {
      const schema = await fetchQcSchemaWithInflightDedup(cacheKey, async () => {
        const response = await fetchQcSchema({
          subDepartmentId: effectiveSubDepartmentId,
          division: request.division,
          subType: request.subType,
          inhibitorType: request.inhibitorType,
        });
        return response?.success ? response.data ?? null : null;
      });
      if (schema) {
        schemasByKey[cacheKey] = schema;
      }
    } catch {
      // individual schema fetch failure should not abort hydration
    }
  });

  for (const entry of entries) {
    if (entry.kind === "REVALIDATION") {
      const sectionsToHydrate =
        entry.savedSections ??
        (resolvedData.savedSections ?? []).filter(
          (s) => s.sectionId === "RAW_MATERIAL_DETAILS",
        );
      if (sectionsToHydrate.length > 0) {
        entryValues[entry.entryId] = {
          schemaValues: hydrateRevalidationValuesFromSections(sectionsToHydrate),
        };
      } else if (
        !entryValues[entry.entryId]?.schemaValues ||
        Object.keys(entryValues[entry.entryId].schemaValues).length === 0
      ) {
        entryValues[entry.entryId] = {
          schemaValues: createInitialRevalidationSchemaValues(),
        };
      }
      continue;
    }

    const cacheKey = getQcSchemaCacheKey(entry.apiDivision, entry.subType, entry.inhibitorType);
    const schema = schemasByKey[cacheKey];
    if (!schema) continue;

    const sectionsToHydrate =
      entry.savedSections ??
      (resolvedData.savedSections ?? []).filter((s) => {
        if (entry.kind === "REVALIDATION" && s.sectionId !== "RAW_MATERIAL_DETAILS") return false;
        if (entry.kind === "MIXING_PREMIX" && s.sectionId !== QC_MIXING_PREMIX_SECTION_ID) return false;
        if (entry.kind === "MIXING_FINAL_MIX" && s.sectionId !== QC_MIXING_VISCOSITY_SECTION_ID) return false;
        if (entry.kind === "HARDWARE_PROCESS" && entry.subType) {
          const expectedSectionId = getHardwareSectionIdForSubType(String(entry.subType));
          if (expectedSectionId && s.sectionId !== expectedSectionId) return false;
        }
        if (entry.premixNo != null) {
          if (s.premixNo !== entry.premixNo) return false;
          if (entry.subType && (s as { subType?: string }).subType && (s as { subType?: string }).subType !== entry.subType) {
            return false;
          }
          return true;
        }
        if (entry.motorId != null) {
          if ((s as { motorId?: string }).motorId !== entry.motorId) return false;
          if (
            entry.subType &&
            (s as { subType?: string }).subType &&
            (s as { subType?: string }).subType !== entry.subType
          ) {
            return false;
          }
          if (
            entry.inhibitorType &&
            (s as { inhibitorType?: string }).inhibitorType &&
            (s as { inhibitorType?: string }).inhibitorType !== entry.inhibitorType
          ) {
            return false;
          }
          return true;
        }
        return s.premixNo == null && !(s as { motorId?: string }).motorId;
      });

    if (sectionsToHydrate.length > 0) {
      const hydrationSchema =
        entry.kind === "MIXING_FINAL_MIX"
          ? sliceMixingFinalMixSchema(schema, "viscosity") ?? schema
          : schema;
      entryValues[entry.entryId] = {
        schemaValues: hydrateQcValuesFromSections(hydrationSchema, sectionsToHydrate),
      };
    }
  }

  const finalMixSchema = schemasByKey[getQcSchemaCacheKey("MIXING", "FINAL_MIX")];
  const mixingFinalMixDetailsValues =
    finalMixSchema && mixingFinalMixDetailSections.length
      ? hydrateMixingFinalMixDetailsValues(finalMixSchema, mixingFinalMixDetailSections)
      : undefined;

  return {
    ...resolvedData,
    divisionEntries: entries,
    divisionEntryValues: entryValues,
    schemasByKey,
    savedSections:
      mixingFinalMixDetailSections.length > 0
        ? mixingFinalMixDetailSections
        : resolvedData.savedSections,
    ...(mixingFinalMixDetailsValues && { mixingFinalMixDetailsValues }),
  };
}

export async function hydrateQcDivisionFormFromDetailsResponse(
  detailsData: QCDivisionDetailsModel | null | undefined,
  subDepartmentId: number,
): Promise<QualityControlFormState> {
  if (!detailsData) return createDefaultQualityControlFormState();
  return hydrateQcDivisionFormFromDetails(detailsData, subDepartmentId);
}

export async function loadQcDivisionDetailsViewState(
  detailsData: QCDivisionDetailsModel,
  subDepartmentId: number,
): Promise<{
  formData: QualityControlFormState;
  detailView: QCDivisionDetailView | null;
}> {
  const formData = await hydrateQcDivisionFormFromDetails(detailsData, subDepartmentId);
  const detailView = mapQCDivisionDetailsForDisplay(QCDivisionDetailsModel.toPlainRecord(detailsData));
  return { formData, detailView };
}
