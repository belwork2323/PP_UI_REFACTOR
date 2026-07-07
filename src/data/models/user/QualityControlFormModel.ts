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
  getMixingFinalMixEntries,
  sliceMixingFinalMixSchema,
} from "../../../hooks/user/qualityControl/qcMixingConfig";
import {
  getLiquidSchemaForBothEntry,
  getSchemaForDivisionEntry,
  getSolidSchemaForBothEntry,
} from "../../../hooks/user/qualityControl/qcDivisionEntries";
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
  const divisionValues = Object.values(form.divisionEntryValues ?? {});
  if (
    divisionValues.some(
      (entry) =>
        schemaValuesHaveUserData(entry.schemaValues ?? {}) ||
        schemaValuesHaveUserData(entry.liquidSchemaValues ?? {}),
    )
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

  const schema = getSchemaForDivisionEntry(form, entry);
  if (!schema) return [];

  if (entry.kind === "MIXING_FINAL_MIX") {
    const viscositySchema = sliceMixingFinalMixSchema(schema, "viscosity");
    if (!viscositySchema) return [];

    return buildQcSectionPayload(viscositySchema, entryValues.schemaValues).map((section) => ({
      ...section,
      premixNo: entry.premixNo,
      subType: entry.subType ?? undefined,
    }));
  }

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
    if (entry.kind === "MIXING_PREMIX") {
      return buildQcSectionPayload(schema, entryValues.schemaValues).map((section) => ({
        ...section,
        premixNo: entry.premixNo,
        subType: entry.subType ?? undefined,
      }));
    }

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

export const mapQualityControlPayload = (
  form: QualityControlFormState,
): {
  divisionDetails: Array<{
    division: QcApiDivision;
    subType: QcApiSubType;
    data: Record<string, unknown>;
  }>;
} => {
  const divisionEntries = form.divisionEntries ?? [];

  const buildDivisionDetail = (
    division: QcApiDivision,
    subType: QcApiSubType,
    sections: SchemaSectionSubmission[],
  ) => ({
    division,
    subType,
    data: { sections },
  });

  if (divisionEntries.length > 0) {
    const finalMixEntries = getMixingFinalMixEntries(divisionEntries);
    const primaryFinalMixEntry = finalMixEntries[0];
    const finalMixSchema = primaryFinalMixEntry
      ? getSchemaForDivisionEntry(form, primaryFinalMixEntry)
      : null;
    const sharedFinalMixDetails =
      finalMixSchema && form.mixingFinalMixDetailsValues
        ? buildQcSectionPayload(
            sliceMixingFinalMixSchema(finalMixSchema, "details") ?? finalMixSchema,
            form.mixingFinalMixDetailsValues,
          )
        : [];

    const grouped = new Map<QcApiDivision, QcDivisionEntry[]>();
    for (const entry of divisionEntries) {
      const entries = grouped.get(entry.apiDivision);
      if (entries) {
        entries.push(entry);
      } else {
        grouped.set(entry.apiDivision, [entry]);
      }
    }

    const divisionDetails = Array.from(grouped.entries()).map(([division, entries]) => {
      const sections = [
        ...(division === "MIXING" ? sharedFinalMixDetails : []),
        ...entries.flatMap((entry) => buildDivisionEntrySections(form, entry)),
      ];
      const hasMixedSubTypes = entries.some((e) => e.subType !== entries[0].subType);
      return buildDivisionDetail(
        division,
        hasMixedSubTypes ? null : entries[0].subType,
        sections,
      );
    });

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
    ];

    const division: QcApiDivision = form.division ?? "RAW_MATERIAL_PROCESSING";
    const subType: QcApiSubType = hasSolidPremix && hasLiquidPremix ? null : hasSolidPremix ? "SOLID_PROCESSING" : "LIQUID_PROCESSING";

    return {
      divisionDetails: [buildDivisionDetail(division, subType, sections)],
    };
  }

  return {
    divisionDetails: [
      buildDivisionDetail(
        form.division ?? "RAW_MATERIAL_REVALIDATION",
        form.subType,
        form.qcSchema ? buildQcSectionPayload(form.qcSchema, form.schemaFormValues) : [],
      ),
    ],
  };
};
