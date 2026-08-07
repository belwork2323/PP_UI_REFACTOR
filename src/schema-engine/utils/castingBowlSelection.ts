import type {
  SchemaBlock,
  SchemaDataSource,
  SchemaDocumentV2,
  SchemaTableBlock,
  SchemaTableColumn,
} from "../types";
import type { SchemaFormValues } from "../state/formState";
import { scopedFormKey } from "../state/formState";
import { isWrappedTableValue, isTrailingTablePresetRow } from "./tableRowUtils";
import { flattenTableColumns } from "./schemaUtils";

export const CASTING_BOWL_LABEL_TEMPLATE = "FINAL_MIX {premixNo} / {bowlId}";

export const CASTING_BOWL_TABLE_CONFIGS = [
  { tableId: "FINAL_MIX_BOWL_DETAILS", sectionId: "CASTING_PROCESS", bowlColumnId: "BOWL_ID", autoKey: "SR_NO" },
  {
    tableId: "CASTING_FROM_BOWL_DETAILS",
    sectionId: "CASTING_PROCESS",
    bowlColumnId: "BOWL_ID",
    autoKey: "SR_NO",
  },
  {
    tableId: "SLURRY_CAST_FROM_BOWLS",
    sectionId: "SLURRY_CAST_DETAILS",
    bowlColumnId: "FM_MOTOR_LABEL",
    autoKey: "ROW_KEY",
  },
] as const;

export type CastingBowlTableConfig = (typeof CASTING_BOWL_TABLE_CONFIGS)[number];

export const CASTING_BOWL_DROPDOWN_DATA_SOURCE: SchemaDataSource = {
  type: "api",
  api: {
    endpoint: "/api/v1/admin/batch/details",
    method: "POST",
    requestBody: { batchId: "{{batchId}}" },
    responsePath: "data.batch.identificationSheet.metadata.mixing.stages",
    nestedOptionsKey: "premixes",
    parentMatchField: "stageType",
    parentMatchContextKey: "mixingStageType",
    optionLabelTemplate: CASTING_BOWL_LABEL_TEMPLATE,
    optionValueTemplate: CASTING_BOWL_LABEL_TEMPLATE,
    optionFilterField: "bowlId",
  },
};

export const formatCastingBowlLabel = (premixNo: unknown, bowlId: unknown): string =>
  `FINAL_MIX ${String(premixNo ?? "").trim()} / ${String(bowlId ?? "").trim()}`
    .replace(/\s*\/\s*$/, "")
    .trim();

export const parseCastingBowlLabel = (
  label: string,
): { premixNo: string; bowlId: string } | null => {
  const match = /^FINAL_MIX\s+(\S+)\s+\/\s*(.+)$/i.exec(String(label ?? "").trim());
  if (!match) return null;
  return { premixNo: match[1], bowlId: match[2] };
};

export const extractRawTableRows = (value: unknown): Record<string, unknown>[] => {
  if (isWrappedTableValue(value)) return value.rows;
  if (Array.isArray(value)) return value;
  return [];
};

const normalizeMotorId = (motorId: string) => String(motorId).trim();

const patchBowlColumn = (column: SchemaTableColumn): SchemaTableColumn => ({
  ...column,
  fieldType: "dropdown",
  readonly: false,
  dataSource: CASTING_BOWL_DROPDOWN_DATA_SOURCE,
  ui: {
    ...column.ui,
    bowlSelection: true,
    placeholder: column.ui?.placeholder ?? "Select bowl",
  },
});

const patchCastingBowlTable = (table: SchemaTableBlock, bowlColumnId: string): SchemaTableBlock => {
  const patchColumnSlot = (slot: SchemaTableBlock["columns"][number]) => {
    if ("columns" in slot) {
      return {
        ...slot,
        columns: slot.columns.map((col) => (col.id === bowlColumnId ? patchBowlColumn(col) : col)),
      };
    }
    return slot.id === bowlColumnId ? patchBowlColumn(slot) : slot;
  };

  const { populateFromApi: _removed, ...rowsWithoutPopulate } = table.rows ?? {};
  const autoKey = rowsWithoutPopulate.autoIncrementKey ?? "srNo";
  const presetRows = rowsWithoutPopulate.presetRows ?? [];
  const trailingPresets = presetRows.filter((preset) => isTrailingTablePresetRow(preset, autoKey));
  const leadingPresets = presetRows.filter((preset) => !isTrailingTablePresetRow(preset, autoKey));
  const nextPresetRows =
    trailingPresets.length && !leadingPresets.length
      ? [{}, ...trailingPresets]
      : presetRows;

  return {
    ...table,
    columns: table.columns.map(patchColumnSlot),
    rows: {
      ...rowsWithoutPopulate,
      allowAdd: true,
      allowDelete: true,
      defaultCount: rowsWithoutPopulate.defaultCount ?? 1,
      min: rowsWithoutPopulate.min ?? 1,
      presetRows: nextPresetRows,
    },
  };
};

const patchBlocks = (blocks: SchemaBlock[]): SchemaBlock[] =>
  blocks.map((block) => {
    if (block.type === "table") {
      const config = CASTING_BOWL_TABLE_CONFIGS.find((entry) => entry.tableId === block.id);
      if (config) return patchCastingBowlTable(block, config.bowlColumnId);
      return block;
    }
    if ("children" in block && Array.isArray(block.children)) {
      return { ...block, children: patchBlocks(block.children) };
    }
    return block;
  });

/** Runtime patch: convert static bowl columns to selectable dropdowns sourced from batch metadata. */
export const patchCastingSchemaForBowlSelection = (
  schema: SchemaDocumentV2,
): SchemaDocumentV2 => ({
  ...schema,
  data: {
    ...schema.data,
    sections: schema.data.sections.map((section) => ({
      ...section,
      children: patchBlocks(section.children),
    })),
  },
});

export const getExcludedBowlSelectionsForRow = (
  rows: Record<string, unknown>[],
  bowlColumnId: string,
  autoKey: string,
  rowIndex: number,
  additionalExcluded: string[] = [],
): string[] => {
  const excluded = new Set(additionalExcluded.map((value) => value.trim()).filter(Boolean));

  rows.forEach((row, index) => {
    if (index === rowIndex) return;
    if (isTrailingTablePresetRow(row, autoKey)) return;
    const value = String(row[bowlColumnId] ?? "").trim();
    if (value) excluded.add(value);
  });

  return Array.from(excluded);
};

export const collectCrossMotorExcludedBowlSelections = (
  motorCastingValuesById: Record<string, SchemaFormValues>,
  currentMotorId: string,
): string[] => {
  const excluded = new Set<string>();
  const normalizedCurrent = normalizeMotorId(currentMotorId);

  Object.entries(motorCastingValuesById).forEach(([motorId, values]) => {
    if (normalizeMotorId(motorId) === normalizedCurrent) return;

    CASTING_BOWL_TABLE_CONFIGS.forEach(({ sectionId, tableId, bowlColumnId, autoKey }) => {
      extractRawTableRows(values[scopedFormKey(sectionId, tableId)]).forEach((row) => {
        if (isTrailingTablePresetRow(row, autoKey)) return;
        const value = String(row[bowlColumnId] ?? "").trim();
        if (value) excluded.add(value);
      });
    });
  });

  return Array.from(excluded);
};

export const collectSameMotorOtherTableBowlSelections = (
  formValues: SchemaFormValues,
  currentTableId: string,
): string[] => {
  const excluded: string[] = [];

  CASTING_BOWL_TABLE_CONFIGS.forEach(({ sectionId, tableId, bowlColumnId, autoKey }) => {
    if (tableId === currentTableId) return;

    extractRawTableRows(formValues[scopedFormKey(sectionId, tableId)]).forEach((row) => {
      if (isTrailingTablePresetRow(row, autoKey)) return;
      const value = String(row[bowlColumnId] ?? "").trim();
      if (value) excluded.push(value);
    });
  });

  return excluded;
};

export const countAssignedBowlsInMotor = (formValues: SchemaFormValues): number => {
  const assigned = new Set<string>();

  CASTING_BOWL_TABLE_CONFIGS.forEach(({ sectionId, tableId, bowlColumnId, autoKey }) => {
    extractRawTableRows(formValues[scopedFormKey(sectionId, tableId)]).forEach((row) => {
      if (isTrailingTablePresetRow(row, autoKey)) return;
      const value = String(row[bowlColumnId] ?? "").trim();
      if (value) assigned.add(value);
    });
  });

  return assigned.size;
};

export const syncBowlSelectionRowFields = (
  row: Record<string, unknown>,
  bowlColumnId: string,
  selectedValue: string,
  flatColumns: SchemaTableColumn[],
  motorId?: string,
): Record<string, unknown> => {
  const next = { ...row, [bowlColumnId]: selectedValue };
  const parsed = parseCastingBowlLabel(selectedValue);

  if (flatColumns.some((col) => col.id === "PREMIX_NO")) {
    next.PREMIX_NO = parsed?.premixNo ?? "";
  }
  if (flatColumns.some((col) => col.id === "BOWL_NO")) {
    next.BOWL_NO = parsed?.bowlId ?? "";
  }
  if (motorId && flatColumns.some((col) => col.id === "MOTOR_ID")) {
    next.MOTOR_ID = motorId;
  }

  return next;
};

export const isCastingBowlSelectionColumn = (column: SchemaTableColumn): boolean =>
  column.ui?.bowlSelection === true;

export const findCastingBowlSelectionColumn = (
  table: SchemaTableBlock,
): SchemaTableColumn | undefined =>
  flattenTableColumns(table.columns).find(isCastingBowlSelectionColumn);
