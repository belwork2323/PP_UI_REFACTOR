import type { SchemaDocumentV2, SchemaFormValues } from "../../../schema-engine";
import type { QualityControlFormState } from "../../../data/models/user/QualityControlFormModel";
import { parseFileRefs } from "../../../data/models/common/FileUploadModel";
import type { QcDivisionEntry, QcDivisionEntryValues } from "./qcDivisionEntryTypes";
import { getQcSchemaCacheKey, type QcDivisionCatalogNavTab } from "./qcFlowConfig";
import {
  isRawMaterialProcessingType,
  isRawMaterialRevalidationType,
} from "./qcProcessingConfig";
import { collectTempFileIdsFromQcNdtValues } from "./qcNdtTables";
import { collectTempFileIdsFromQcPropellantValues } from "./qcPropellantTables";
import { collectTempFileIdsFromQcHardwareValues } from "./qcHardwareTables";
import { collectTempFileIdsFromQcPostCureValues } from "./qcPostCureTables";
import { collectTempFileIdsFromQcRevalidationValues } from "./qcRawMaterialRevalidationTable";
import { collectTempFileIdsFromQcWeighmentValues } from "./qcWeighmentTables";
import { collectTempFileIdsFromQcTrimmingValues } from "./qcTrimmingTables";

export type QcDivisionScopedFormState = {
  divisionEntries: QcDivisionEntry[];
  divisionEntryValues: Record<string, QcDivisionEntryValues>;
  schemasByKey: Partial<Record<string, SchemaDocumentV2>>;
  mixingFinalMixDetailsValues?: SchemaFormValues;
};

export const entryMatchesDivisionTab = (
  entry: QcDivisionEntry,
  tab: QcDivisionCatalogNavTab,
): boolean => {
  if (entry.flowKey !== tab.flowKey) return false;
  if (!tab.rawMaterialType) return true;
  if (isRawMaterialRevalidationType(tab.rawMaterialType)) {
    return entry.kind === "REVALIDATION";
  }
  if (isRawMaterialProcessingType(tab.rawMaterialType)) {
    return (
      entry.kind === "PROCESSING_MATERIAL" ||
      entry.kind === "SOLID_PREMIX" ||
      entry.kind === "LIQUID_PREMIX" ||
      entry.kind === "BOTH_PREMIX"
    );
  }
  return true;
};

const collectSchemaKeysForEntry = (entry: QcDivisionEntry, keys: Set<string>) => {
  if (entry.schemaCacheKey) {
    keys.add(entry.schemaCacheKey);
  }
  keys.add(getQcSchemaCacheKey(entry.apiDivision, entry.subType, entry.inhibitorType));
};

const collectSchemaKeysForEntries = (entries: QcDivisionEntry[]): Set<string> => {
  const keys = new Set<string>();
  for (const entry of entries) {
    collectSchemaKeysForEntry(entry, keys);
  }
  return keys;
};

const isMixingDivisionTab = (tab: QcDivisionCatalogNavTab) =>
  tab.flowKey === "MIXING" || tab.tabKey === "MIXING";

export const scopeFormStateToDivisionTab = (
  form: QualityControlFormState,
  tab: QcDivisionCatalogNavTab,
): QcDivisionScopedFormState => {
  const divisionEntries = (form.divisionEntries ?? []).filter((entry) =>
    entryMatchesDivisionTab(entry, tab),
  );
  const entryIds = new Set(divisionEntries.map((entry) => entry.entryId));
  const divisionEntryValues = Object.fromEntries(
    Object.entries(form.divisionEntryValues ?? {}).filter(([entryId]) => entryIds.has(entryId)),
  );

  const schemaKeys = collectSchemaKeysForEntries(divisionEntries);
  const schemasByKey: Partial<Record<string, SchemaDocumentV2>> = {};
  for (const key of schemaKeys) {
    const schema = form.schemasByKey?.[key];
    if (schema) schemasByKey[key] = schema;
  }

  return {
    divisionEntries,
    divisionEntryValues,
    schemasByKey,
    ...(isMixingDivisionTab(tab)
      ? { mixingFinalMixDetailsValues: form.mixingFinalMixDetailsValues }
      : {}),
  };
};

/** Full form state limited to one division catalog tab — use for save/submit payloads. */
export const scopeQualityControlFormToDivisionTab = (
  form: QualityControlFormState,
  tab: QcDivisionCatalogNavTab,
): QualityControlFormState => {
  const scoped = scopeFormStateToDivisionTab(form, tab);
  return {
    ...form,
    divisionEntries: scoped.divisionEntries,
    divisionEntryValues: scoped.divisionEntryValues,
    schemasByKey: scoped.schemasByKey,
    mixingFinalMixDetailsValues: isMixingDivisionTab(tab)
      ? scoped.mixingFinalMixDetailsValues
      : undefined,
  };
};

const stableSortEntries = (entries: QcDivisionEntry[]) =>
  [...entries].sort((a, b) => a.entryId.localeCompare(b.entryId));

const stableScopedPayload = (scoped: QcDivisionScopedFormState) => ({
  divisionEntries: stableSortEntries(scoped.divisionEntries),
  divisionEntryValues: Object.fromEntries(
    Object.keys(scoped.divisionEntryValues)
      .sort()
      .map((entryId) => [entryId, scoped.divisionEntryValues[entryId]]),
  ),
  schemasByKey: Object.fromEntries(
    Object.keys(scoped.schemasByKey ?? {})
      .sort()
      .map((key) => [key, scoped.schemasByKey?.[key]]),
  ),
  ...(scoped.mixingFinalMixDetailsValues != null
    ? { mixingFinalMixDetailsValues: scoped.mixingFinalMixDetailsValues }
    : {}),
});

export const serializeDivisionSnapshot = (scoped: QcDivisionScopedFormState): string =>
  JSON.stringify(stableScopedPayload(scoped));

export const isDivisionSnapshotDirty = (current: string, baseline: string): boolean =>
  current !== baseline;

export const parseDivisionSnapshot = (snapshot: string): QcDivisionScopedFormState => {
  try {
    return JSON.parse(snapshot) as QcDivisionScopedFormState;
  } catch {
    return {
      divisionEntries: [],
      divisionEntryValues: {},
      schemasByKey: {},
    };
  }
};

export const mergeDivisionBaselineIntoForm = (
  fullForm: QualityControlFormState,
  tab: QcDivisionCatalogNavTab,
  baselineScoped: QcDivisionScopedFormState,
): QualityControlFormState => {
  const tabEntries = (fullForm.divisionEntries ?? []).filter((entry) =>
    entryMatchesDivisionTab(entry, tab),
  );
  const remainingEntries = (fullForm.divisionEntries ?? []).filter(
    (entry) => !entryMatchesDivisionTab(entry, tab),
  );
  const remainingEntryIds = new Set(remainingEntries.map((entry) => entry.entryId));
  const remainingValues = Object.fromEntries(
    Object.entries(fullForm.divisionEntryValues ?? {}).filter(([entryId]) =>
      remainingEntryIds.has(entryId),
    ),
  );

  const tabSchemaKeys = collectSchemaKeysForEntries(tabEntries);
  const otherSchemaKeys = collectSchemaKeysForEntries(remainingEntries);
  const nextSchemas = { ...(fullForm.schemasByKey ?? {}) };
  for (const key of tabSchemaKeys) {
    if (!otherSchemaKeys.has(key)) {
      delete nextSchemas[key];
    }
  }
  for (const [key, schema] of Object.entries(baselineScoped.schemasByKey ?? {})) {
    if (schema) nextSchemas[key] = schema;
  }

  return {
    ...fullForm,
    divisionEntries: [...remainingEntries, ...(baselineScoped.divisionEntries ?? [])],
    divisionEntryValues: {
      ...remainingValues,
      ...(baselineScoped.divisionEntryValues ?? {}),
    },
    schemasByKey: nextSchemas,
    mixingFinalMixDetailsValues: isMixingDivisionTab(tab)
      ? baselineScoped.mixingFinalMixDetailsValues
      : fullForm.mixingFinalMixDetailsValues,
  };
};

const collectTempFileIdsFromSchemaValues = (
  values: SchemaFormValues | null | undefined,
): string[] => {
  const ids: string[] = [];
  const walk = (value: unknown) => {
    if (Array.isArray(value)) {
      if (
        value.length > 0 &&
        value.every(
          (item) => item && typeof item === "object" && ("fileName" in item || "fileId" in item),
        )
      ) {
        for (const ref of parseFileRefs(value)) {
          const fileId = String(ref.fileId ?? "").trim();
          if (fileId && ref.isTemp !== false) ids.push(fileId);
        }
        return;
      }
      value.forEach(walk);
      return;
    }
    if (value && typeof value === "object") {
      Object.values(value as Record<string, unknown>).forEach(walk);
    }
  };
  walk(values);
  return ids;
};

const collectTempFileIdsFromEntryValues = (
  entry: QcDivisionEntry,
  values: QcDivisionEntryValues | undefined,
): string[] => {
  if (!values) return [];
  const schemaValues = values.schemaValues;
  const liquidValues = values.liquidSchemaValues;
  const ids: string[] = [];

  if (entry.kind === "NDT_MOTOR") {
    ids.push(...collectTempFileIdsFromQcNdtValues(schemaValues));
  } else if (entry.kind === "PROPELLANT_MOTOR" || entry.kind === "PROPELLANT_PROCESS") {
    ids.push(...collectTempFileIdsFromQcPropellantValues(schemaValues));
  } else if (entry.kind === "HARDWARE_PROCESS") {
    ids.push(...collectTempFileIdsFromQcHardwareValues(schemaValues));
  } else if (entry.kind === "POST_CURE_MOTOR") {
    ids.push(...collectTempFileIdsFromQcPostCureValues(schemaValues));
  } else if (entry.kind === "REVALIDATION") {
    ids.push(...collectTempFileIdsFromQcRevalidationValues(schemaValues));
  } else if (entry.kind === "WEIGHTMENT_MOTOR") {
    ids.push(...collectTempFileIdsFromQcWeighmentValues(schemaValues));
  } else if (entry.kind === "TRIMMING_MOTOR") {
    ids.push(...collectTempFileIdsFromQcTrimmingValues(schemaValues));
  } else {
    ids.push(...collectTempFileIdsFromSchemaValues(schemaValues));
  }

  if (liquidValues) {
    ids.push(...collectTempFileIdsFromSchemaValues(liquidValues));
  }

  return ids;
};

export const collectTempFileIdsFromDivisionScope = (
  scoped: QcDivisionScopedFormState,
): string[] => {
  const ids: string[] = [];
  for (const entry of scoped.divisionEntries ?? []) {
    ids.push(...collectTempFileIdsFromEntryValues(entry, scoped.divisionEntryValues[entry.entryId]));
  }
  if (scoped.mixingFinalMixDetailsValues) {
    ids.push(...collectTempFileIdsFromSchemaValues(scoped.mixingFinalMixDetailsValues));
  }
  return [...new Set(ids)];
};
