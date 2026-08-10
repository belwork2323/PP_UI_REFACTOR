import {
  buildQcSectionPayload,
  createQcInitialValues,
  hydrateQcValuesFromSections,
  QC_SCHEMA_TYPE,
  type QcApiDivision,
  type QcApiSubType,
} from "../../../schema-engine/adapters/qc.adapter";
import { getQcSchemaCacheKey } from "../../../hooks/user/qualityControl/qcFlowConfig";
import {
  buildMixingPremixesPayload,
} from "../../../hooks/user/qualityControl/qcMixingTables";
import {
  getLiquidSchemaForBothEntry,
  getSchemaForDivisionEntry,
  getSolidSchemaForBothEntry,
} from "../../../hooks/user/qualityControl/qcDivisionEntries";
import { buildRevalidationMaterialsPayload, buildRevalidationSectionPayload, hasRevalidationTableData } from "../../../hooks/user/qualityControl/qcRawMaterialRevalidationTable";
import { buildProcessingPremixesPayload } from "../../../hooks/user/qualityControl/qcProcessingMaterials";
import type {
  QcDivisionEntry,
  QcDivisionEntryValues,
} from "../../../hooks/user/qualityControl/qcDivisionEntryTypes";
import type { QcProcessingSlot } from "../../../hooks/user/qualityControl/qcProcessingConfig";
import {
  schemaValuesHaveUserData,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../../schema-engine";

export type { QcDivisionEntry, QcDivisionEntryValues } from "../../../hooks/user/qualityControl/qcDivisionEntryTypes";

export type QcPremixEntry = {
  premixNo: number;
};

/** @deprecated Use QcPremixEntry */
export type QcSolidPremixEntry = QcPremixEntry;

export type QualityControlFormState = {
  schemaFormLoaded: boolean;
  division: QcApiDivision | null;
  subType: QcApiSubType;
  qcSchema: SchemaDocumentV2 | null;
  schemasByKey: Partial<Record<string, SchemaDocumentV2>>;
  schemaFormValues: SchemaFormValues;
  savedSections?: SchemaSectionSubmission[];
  divisionEntries?: QcDivisionEntry[];
  divisionEntryValues?: Record<string, QcDivisionEntryValues>;
  /** Shared final mix header/parameter table — common across all final mix entries. */
  mixingFinalMixDetailsValues?: SchemaFormValues;
  solidPremixEntries?: QcPremixEntry[];
  solidPremixValuesByNo?: Record<number, SchemaFormValues>;
  liquidPremixEntries?: QcPremixEntry[];
  liquidPremixValuesByNo?: Record<number, SchemaFormValues>;
};

export type QualityControlDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  division?: QcApiDivision | string | null;
  subType?: QcApiSubType | string | null;
  sections?: SchemaSectionSubmission[];
};

export const createDefaultQualityControlFormState = (): QualityControlFormState => ({
  schemaFormLoaded: false,
  division: null,
  subType: null,
  qcSchema: null,
  schemasByKey: {},
  schemaFormValues: {},
  savedSections: undefined,
  divisionEntries: [],
  divisionEntryValues: {},
  solidPremixEntries: [],
  solidPremixValuesByNo: {},
  liquidPremixEntries: [],
  liquidPremixValuesByNo: {},
});

export const mergeSchemaIntoFormCache = (
  state: QualityControlFormState,
  schema: SchemaDocumentV2,
  division: QcApiDivision,
  subType: QcApiSubType,
): QualityControlFormState => {
  const key = getQcSchemaCacheKey(division, subType);
  return {
    ...state,
    schemasByKey: {
      ...(state.schemasByKey ?? {}),
      [key]: schema,
    },
  };
};

export const getProcessingSchemaFromFormState = (
  form: QualityControlFormState,
  slot: QcProcessingSlot,
): SchemaDocumentV2 | null => {
  const key = getQcSchemaCacheKey("RAW_MATERIAL_PROCESSING", slot);
  return form.schemasByKey?.[key] ?? (form.subType === slot ? form.qcSchema : null);
};

const hydratePremixStateFromSections = (
  schema: SchemaDocumentV2,
  savedSections: SchemaSectionSubmission[] | undefined,
  processingSubType: QcProcessingSlot,
  formSubType?: QcApiSubType,
): Pick<QualityControlFormState, "solidPremixEntries" | "solidPremixValuesByNo"> => {
  const premixSections = (savedSections ?? []).filter((section) => {
    if (section.premixNo == null) return false;
    if (section.subType) return section.subType === processingSubType;
    return formSubType === processingSubType || (!formSubType && processingSubType === "SOLID_PROCESSING");
  });

  if (!premixSections.length) {
    return { solidPremixEntries: [], solidPremixValuesByNo: {} };
  }

  const solidPremixEntries: QcPremixEntry[] = [];
  const solidPremixValuesByNo: Record<number, SchemaFormValues> = {};

  premixSections.forEach((section) => {
    const premixNo = Number(section.premixNo);
    if (!premixNo) return;
    if (!solidPremixEntries.some((entry) => entry.premixNo === premixNo)) {
      solidPremixEntries.push({ premixNo });
    }
    const existing = solidPremixValuesByNo[premixNo] ?? createQcInitialValues(schema);
    solidPremixValuesByNo[premixNo] = {
      ...existing,
      ...hydrateQcValuesFromSections(schema, [section]),
    };
  });

  solidPremixEntries.sort((a, b) => a.premixNo - b.premixNo);
  return { solidPremixEntries, solidPremixValuesByNo };
};

const hydratePremixSlotState = (
  state: QualityControlFormState,
  schema: SchemaDocumentV2,
  subType: QcApiSubType,
  slot: QcProcessingSlot,
  entriesKey: "solidPremixEntries" | "liquidPremixEntries",
  valuesKey: "solidPremixValuesByNo" | "liquidPremixValuesByNo",
) => {
  if (subType !== slot) {
    return {
      [entriesKey]: state[entriesKey] ?? [],
      [valuesKey]: state[valuesKey] ?? {},
    };
  }

  if (state.savedSections?.length) {
    const hydrated = hydratePremixStateFromSections(schema, state.savedSections, slot, state.subType);
    return {
      [entriesKey]: hydrated.solidPremixEntries,
      [valuesKey]: hydrated.solidPremixValuesByNo,
    };
  }

  return {
    [entriesKey]: state[entriesKey] ?? [],
    [valuesKey]: state[valuesKey] ?? {},
  };
};

export const hydrateQualityControlFormState = (
  state: QualityControlFormState,
  schema: SchemaDocumentV2,
  division: QcApiDivision,
  subType: QcApiSubType,
): QualityControlFormState => {
  const key = getQcSchemaCacheKey(division, subType);
  const solidPremixState = hydratePremixSlotState(
    state,
    schema,
    subType,
    "SOLID_PROCESSING",
    "solidPremixEntries",
    "solidPremixValuesByNo",
  );
  const liquidPremixState = hydratePremixSlotState(
    state,
    schema,
    subType,
    "LIQUID_PROCESSING",
    "liquidPremixEntries",
    "liquidPremixValuesByNo",
  );

  const isPremixSubType = subType === "SOLID_PROCESSING" || subType === "LIQUID_PROCESSING";

  return {
    ...state,
    division,
    subType,
    qcSchema: schema,
    schemasByKey: {
      ...(state.schemasByKey ?? {}),
      [key]: schema,
    },
    schemaFormValues: isPremixSubType
      ? state.schemaFormValues
      : state.savedSections?.length
        ? hydrateQcValuesFromSections(schema, state.savedSections)
        : Object.keys(state.schemaFormValues ?? {}).length > 0
          ? state.schemaFormValues
          : createQcInitialValues(schema),
    schemaFormLoaded: true,
    ...solidPremixState,
    ...liquidPremixState,
  };
};

export const mapQualityControlDetailsToFormState = (
  details: Partial<QualityControlDetails>,
): QualityControlFormState => {
  const defaults = createDefaultQualityControlFormState();
  const savedSections = Array.isArray(details?.sections) ? details.sections : undefined;
  const division = (details?.division as QcApiDivision | null) ?? null;
  const subType = (details?.subType as QcApiSubType) ?? null;

  return {
    ...defaults,
    division,
    subType,
    schemaFormLoaded: Boolean(savedSections?.length),
    savedSections,
  };
};

const premixValuesHaveUserData = (valuesByNo?: Record<number, SchemaFormValues>) =>
  Object.values(valuesByNo ?? {}).some((values) => schemaValuesHaveUserData(values ?? {}));

export const hasAnyQualityControlValue = (form: QualityControlFormState) => {
  const entries = form.divisionEntries ?? [];
  const valuesById = form.divisionEntryValues ?? {};
  if (
    entries.some((entry) => {
      const entryValues = valuesById[entry.entryId];
      if (!entryValues) return false;
      if (entry.kind === "REVALIDATION") {
        return hasRevalidationTableData(entryValues.schemaValues);
      }
      return (
        schemaValuesHaveUserData(entryValues.schemaValues ?? {}) ||
        schemaValuesHaveUserData(entryValues.liquidSchemaValues ?? {})
      );
    }) ||
    Object.values(valuesById).some((entryValues) => {
      // Fallback for entries missing from divisionEntries list
      return (
        schemaValuesHaveUserData(entryValues.schemaValues ?? {}) ||
        schemaValuesHaveUserData(entryValues.liquidSchemaValues ?? {})
      );
    })
  ) {
    return true;
  }

  if (schemaValuesHaveUserData(form.mixingFinalMixDetailsValues ?? {})) return true;

  if (premixValuesHaveUserData(form.solidPremixValuesByNo)) return true;
  if (premixValuesHaveUserData(form.liquidPremixValuesByNo)) return true;
  return schemaValuesHaveUserData(form.schemaFormValues ?? {});
};

const buildPremixSections = (
  schema: SchemaDocumentV2,
  entries: QcPremixEntry[],
  valuesByNo: Record<number, SchemaFormValues> | undefined,
  processingSubType: QcProcessingSlot,
) =>
  entries.flatMap((entry) =>
    buildQcSectionPayload(schema, valuesByNo?.[entry.premixNo] ?? {}).map((section) => ({
      ...section,
      premixNo: entry.premixNo,
      subType: processingSubType,
    })),
  );

const buildDivisionEntrySections = (
  form: QualityControlFormState,
  entry: QcDivisionEntry,
) => {
  const entryValues = form.divisionEntryValues?.[entry.entryId];
  if (!entryValues) return [];

  if (entry.kind === "REVALIDATION") {
    return buildRevalidationSectionPayload(entryValues.schemaValues);
  }

  // PROCESSING_MATERIAL entries are serialized via buildProcessingPremixesPayload (RMP sections).
  if (entry.kind === "PROCESSING_MATERIAL") {
    return [];
  }

  if (entry.kind === "BOTH_PREMIX" && entry.premixNo) {
    const solidSchema = getSolidSchemaForBothEntry(form);
    const liquidSchema = getLiquidSchemaForBothEntry(form);
    if (!solidSchema || !liquidSchema) return [];

    return [
      ...buildPremixSections(
        solidSchema,
        [{ premixNo: entry.premixNo }],
        { [entry.premixNo]: entryValues.schemaValues },
        "SOLID_PROCESSING",
      ),
      ...buildPremixSections(
        liquidSchema,
        [{ premixNo: entry.premixNo }],
        { [entry.premixNo]: entryValues.liquidSchemaValues ?? {} },
        "LIQUID_PROCESSING",
      ),
    ];
  }

  // MIXING entries are serialized via buildMixingPremixesPayload (domain premixDetails/finalMixDetails).
  if (entry.kind === "MIXING_PREMIX" || entry.kind === "MIXING_FINAL_MIX") {
    return [];
  }

  const schema = getSchemaForDivisionEntry(form, entry);
  if (!schema) return [];

  if (entry.kind === "HARDWARE_PROCESS") {
    return buildQcSectionPayload(schema, entryValues.schemaValues).map((section) => ({
      ...section,
      motorId: entry.motorId,
      subType: entry.subType ?? undefined,
    }));
  }

  if (entry.kind === "CASTING_MOTOR") {
    return buildQcSectionPayload(schema, entryValues.schemaValues).map((section) => ({
      ...section,
      motorId: entry.motorId,
    }));
  }

  if (entry.kind === "CURING_MOTOR") {
    return buildQcSectionPayload(schema, entryValues.schemaValues).map((section) => ({
      ...section,
      motorId: entry.motorId,
      subType: entry.subType ?? undefined,
    }));
  }

  if (entry.kind === "TRIMMING_MOTOR") {
    return buildQcSectionPayload(schema, entryValues.schemaValues).map((section) => ({
      ...section,
      motorId: entry.motorId,
      motorCount: entry.motorCount,
      motorReceivedDate: entry.motorReceivedDate,
      subType: entry.subType ?? undefined,
    }));
  }

  if (entry.kind === "DE_CORING_MOTOR") {
    return buildQcSectionPayload(schema, entryValues.schemaValues).map((section) => ({
      ...section,
      motorId: entry.motorId,
    }));
  }

  if (entry.kind === "POST_CURE_MOTOR") {
    return buildQcSectionPayload(schema, entryValues.schemaValues).map((section) => ({
      ...section,
      motorId: entry.motorId,
      subType: entry.subType ?? undefined,
      inhibitorType: entry.inhibitorType ?? undefined,
    }));
  }

  if (entry.kind === "NDT_MOTOR") {
    return buildQcSectionPayload(schema, entryValues.schemaValues).map((section) => ({
      ...section,
      motorId: entry.motorId,
    }));
  }

  if (entry.kind === "PROPELLANT_PROCESS") {
    return buildQcSectionPayload(schema, entryValues.schemaValues).map((section) => ({
      ...section,
      motorId: entry.motorId,
      subType: entry.subType ?? undefined,
    }));
  }

  if (entry.kind === "WEIGHTMENT_MOTOR") {
    return buildQcSectionPayload(schema, entryValues.schemaValues).map((section) => ({
      ...section,
      motorId: entry.motorId,
      weighscaleNo: entry.weighscaleNo,
      calibrationDueDate: entry.calibrationDueDate,
    }));
  }

  if (entry.premixNo != null) {
    const slot =
      entry.kind === "LIQUID_PREMIX" || entry.subType === "LIQUID_PROCESSING"
        ? "LIQUID_PROCESSING"
        : "SOLID_PROCESSING";
    return buildPremixSections(
      schema,
      [{ premixNo: entry.premixNo }],
      { [entry.premixNo]: entryValues.schemaValues },
      slot,
    );
  }

  return buildQcSectionPayload(schema, entryValues.schemaValues);
};

export type QcUnitSubmissionType = "DRAFT" | "SUBMIT";

export type MapQualityControlPayloadOptions = {
  /** Unit-level DRAFT/SUBMIT (motor or premix). Root formSubmissionType stays DRAFT for unit saves. */
  unitSubmissionType?: QcUnitSubmissionType | null;
  /** Division-level DRAFT/SUBMIT (e.g. revalidation or division proceed). */
  divisionSubmissionType?: QcUnitSubmissionType | null;
};

type SectionWithUnitMeta = SchemaSectionSubmission & {
  motorId?: string;
  premixNo?: number;
  subType?: string | null;
  motorCount?: number;
  motorReceivedDate?: string;
  inhibitorType?: string;
  weighscaleNo?: string;
  calibrationDueDate?: string;
};

const stripUnitKeysFromSection = (section: SectionWithUnitMeta): SchemaSectionSubmission => {
  const {
    motorId: _motorId,
    premixNo: _premixNo,
    motorCount: _motorCount,
    motorReceivedDate: _motorReceivedDate,
    inhibitorType: _inhibitorType,
    weighscaleNo: _weighscaleNo,
    calibrationDueDate: _calibrationDueDate,
    ...rest
  } = section;
  return rest;
};

const wrapDivisionDataFromSections = (
  sections: SectionWithUnitMeta[],
  options?: MapQualityControlPayloadOptions,
): Record<string, unknown> => {
  const motorsById = new Map<string, SectionWithUnitMeta[]>();
  const premixesByKey = new Map<string, { premixNo: number; stageType?: string; sections: SectionWithUnitMeta[] }>();
  const plainSections: SchemaSectionSubmission[] = [];

  sections.forEach((section) => {
    const motorId = String(section.motorId ?? "").trim();
    const premixNo = Number(section.premixNo);
    if (motorId) {
      const list = motorsById.get(motorId) ?? [];
      list.push(section);
      motorsById.set(motorId, list);
      return;
    }
    if (Number.isFinite(premixNo) && premixNo > 0) {
      const stageType =
        String(section.subType ?? "")
          .trim()
          .toUpperCase() === "FINAL_MIX"
          ? "FINAL_MIX"
          : String(section.subType ?? "")
                .trim()
                .toUpperCase() === "PREMIX"
            ? "PREMIX"
            : undefined;
      const key = `${premixNo}:${stageType ?? "DEFAULT"}`;
      const existing = premixesByKey.get(key) ?? { premixNo, stageType, sections: [] };
      existing.sections.push(section);
      premixesByKey.set(key, existing);
      return;
    }
    plainSections.push(stripUnitKeysFromSection(section));
  });

  const data: Record<string, unknown> = {};
  const unitType = options?.unitSubmissionType ?? null;

  if (motorsById.size > 0) {
    data.motors = Array.from(motorsById.entries()).map(([motorId, motorSections]) => {
      const first = motorSections[0];
      return {
        motorId,
        ...(unitType ? { motorSubmissionType: unitType } : {}),
        ...(first?.motorCount != null ? { motorCount: first.motorCount } : {}),
        ...(first?.motorReceivedDate ? { motorReceivedDate: first.motorReceivedDate } : {}),
        ...(first?.inhibitorType ? { inhibitorType: first.inhibitorType } : {}),
        ...(first?.weighscaleNo ? { weighscaleNo: first.weighscaleNo } : {}),
        ...(first?.calibrationDueDate ? { calibrationDueDate: first.calibrationDueDate } : {}),
        sections: motorSections.map(stripUnitKeysFromSection),
      };
    });
  }

  if (premixesByKey.size > 0) {
    data.premixes = Array.from(premixesByKey.values()).map((entry) => ({
      premixNo: entry.premixNo,
      ...(entry.stageType ? { stageType: entry.stageType } : {}),
      ...(unitType ? { premixSubmissionType: unitType } : {}),
      sections: entry.sections.map(stripUnitKeysFromSection),
    }));
  }

  if (plainSections.length > 0 || (!motorsById.size && !premixesByKey.size)) {
    data.sections = plainSections;
  }

  return data;
};

export const mapQualityControlPayload = (
  form: QualityControlFormState,
  options?: MapQualityControlPayloadOptions,
): {
  divisionDetails: Array<{
    division: QcApiDivision;
    subType: QcApiSubType;
    divisionSubmissionType?: QcUnitSubmissionType;
    data: Record<string, unknown>;
  }>;
} => {
  const divisionEntries = form.divisionEntries ?? [];
  // Always send divisionSubmissionType on create/update (default DRAFT).
  const divisionSubmissionType: QcUnitSubmissionType =
    options?.divisionSubmissionType ?? "DRAFT";

  const buildDivisionDetail = (
    division: QcApiDivision,
    subType: QcApiSubType,
    sections: SectionWithUnitMeta[],
  ) => ({
    division,
    subType,
    divisionSubmissionType,
    data: wrapDivisionDataFromSections(sections, options),
  });

  if (divisionEntries.length > 0) {
    const divisionDetails: Array<{
      division: QcApiDivision;
      subType: QcApiSubType;
      divisionSubmissionType?: QcUnitSubmissionType;
      data: Record<string, unknown>;
    }> = [];

    // RAW_MATERIAL · REVALIDATION → data.materials (no schema sections)
    const revalidationEntries = divisionEntries.filter((entry) => entry.kind === "REVALIDATION");
    if (revalidationEntries.length > 0) {
      const materials = revalidationEntries.flatMap((entry) => {
        const values = form.divisionEntryValues?.[entry.entryId]?.schemaValues;
        return buildRevalidationMaterialsPayload(values);
      });
      if (materials.length > 0) {
        divisionDetails.push({
          division: "RAW_MATERIAL",
          subType: "RAW_MATERIAL_REVALIDATION",
          divisionSubmissionType,
          data: { materials },
        });
      }
    }

    // RAW_MATERIAL · PROCESSING → data.premixes[{ solidProcess, liquidProcess }] (RMP-style sections)
    const processingMaterialEntries = divisionEntries.filter(
      (entry) => entry.kind === "PROCESSING_MATERIAL",
    );
    if (processingMaterialEntries.length > 0) {
      divisionDetails.push({
        division: "RAW_MATERIAL",
        subType: "RAW_MATERIAL_PROCESSING",
        divisionSubmissionType,
        data: {
          premixes: buildProcessingPremixesPayload(form, processingMaterialEntries, {
            unitSubmissionType: options?.unitSubmissionType ?? null,
          }),
        },
      });
    }

    // MIXING → data.premixes[{ premixDetails, finalMixDetails }]
    const mixingEntries = divisionEntries.filter(
      (entry) => entry.kind === "MIXING_PREMIX" || entry.kind === "MIXING_FINAL_MIX",
    );
    if (mixingEntries.length > 0 || form.mixingFinalMixDetailsValues) {
      const premixes = buildMixingPremixesPayload(form, mixingEntries, {
        unitSubmissionType: options?.unitSubmissionType ?? null,
      });
      if (premixes.length > 0) {
        divisionDetails.push({
          division: "MIXING",
          subType: null,
          divisionSubmissionType,
          data: { premixes },
        });
      }
    }

    const grouped = new Map<QcApiDivision, QcDivisionEntry[]>();
    for (const entry of divisionEntries) {
      if (
        entry.kind === "REVALIDATION" ||
        entry.kind === "PROCESSING_MATERIAL" ||
        entry.kind === "MIXING_PREMIX" ||
        entry.kind === "MIXING_FINAL_MIX"
      ) {
        continue;
      }
      const entries = grouped.get(entry.apiDivision);
      if (entries) {
        entries.push(entry);
      } else {
        grouped.set(entry.apiDivision, [entry]);
      }
    }

    divisionDetails.push(
      ...Array.from(grouped.entries()).map(([division, entries]) => {
        const sections = entries.flatMap((entry) =>
          buildDivisionEntrySections(form, entry),
        ) as SectionWithUnitMeta[];
        const hasMixedSubTypes = entries.some((e) => e.subType !== entries[0].subType);
        return buildDivisionDetail(
          division,
          hasMixedSubTypes ? null : entries[0].subType,
          sections,
        );
      }),
    );

    return { divisionDetails };
  }

  const solidSchema = getProcessingSchemaFromFormState(form, "SOLID_PROCESSING");
  const liquidSchema = getProcessingSchemaFromFormState(form, "LIQUID_PROCESSING");
  const solidEntries = form.solidPremixEntries ?? [];
  const liquidEntries = form.liquidPremixEntries ?? [];
  const hasSolidPremix = solidEntries.length > 0 && Boolean(solidSchema);
  const hasLiquidPremix = liquidEntries.length > 0 && Boolean(liquidSchema);

  if (hasSolidPremix || hasLiquidPremix) {
    const sections = [
      ...(hasSolidPremix
        ? buildPremixSections(solidSchema!, solidEntries, form.solidPremixValuesByNo, "SOLID_PROCESSING")
        : []),
      ...(hasLiquidPremix
        ? buildPremixSections(liquidSchema!, liquidEntries, form.liquidPremixValuesByNo, "LIQUID_PROCESSING")
        : []),
    ] as SectionWithUnitMeta[];

    return {
      divisionDetails: [
        buildDivisionDetail("RAW_MATERIAL", "RAW_MATERIAL_PROCESSING", sections),
      ],
    };
  }

  return {
    divisionDetails: [
      buildDivisionDetail(
        form.division ?? "RAW_MATERIAL_REVALIDATION",
        form.subType,
        (form.qcSchema ? buildQcSectionPayload(form.qcSchema, form.schemaFormValues) : []) as SectionWithUnitMeta[],
      ),
    ],
  };
};

/** Division-only proceed payload (no unit body). */
export const mapQualityControlDivisionSubmitPayload = (params: {
  division: QcApiDivision;
  subType?: QcApiSubType;
}): {
  divisionDetails: Array<{
    division: QcApiDivision;
    subType: QcApiSubType;
    divisionSubmissionType: "SUBMIT";
    data: Record<string, unknown>;
  }>;
} => {
  let division = params.division;
  let subType = params.subType ?? null;

  // Normalize legacy / UI keys to create-update contract.
  if (division === "RAW_MATERIAL_REVALIDATION") {
    division = "RAW_MATERIAL";
    subType = "RAW_MATERIAL_REVALIDATION";
  } else if (division === "RAW_MATERIAL_PROCESSING") {
    division = "RAW_MATERIAL";
    subType = "RAW_MATERIAL_PROCESSING";
  } else if (division === "POST_CURE") {
    division = "POST_CURE_OPERATION";
  }

  return {
    divisionDetails: [
      {
        division,
        subType,
        divisionSubmissionType: "SUBMIT",
        data: {},
      },
    ],
  };
};


export type QCDivisionDetailView = {
  formId: string;
  batchId: string;
  status: string;
  formSubmissionType: string;
  submittedBy: string;
  submittedAt: string;
  createdBy: string;
  createdAt: string;
  divisionCount: number;
};

export const mapQCDivisionDetailsForDisplay = (
  data: Record<string, unknown> | null | undefined,
): QCDivisionDetailView | null => {
  if (!data) return null;

  const submittedByRaw = data.submittedBy;
  const submittedBy =
    typeof submittedByRaw === "object" && submittedByRaw !== null && "fullName" in submittedByRaw
      ? String((submittedByRaw as { fullName?: string }).fullName ?? "")
      : String(submittedByRaw ?? "");

  const workflowInsights = data.workflowInsights as { currentStatus?: string } | undefined;
  const divisionDetails = data.divisionDetails;

  return {
    formId: String(data.formId ?? ""),
    batchId: String(data.batchId ?? ""),
    status: String(data.status ?? workflowInsights?.currentStatus ?? ""),
    formSubmissionType: String(data.formSubmissionType ?? ""),
    submittedBy,
    submittedAt: String(data.submittedAt ?? ""),
    createdBy: String(data.createdBy ?? ""),
    createdAt: String(data.createdAt ?? ""),
    divisionCount: Array.isArray(divisionDetails) ? divisionDetails.length : 0,
  };
};
