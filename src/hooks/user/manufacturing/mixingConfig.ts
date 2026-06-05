import { STRINGS } from "../../../app/config/strings";

const S = STRINGS.MANUFACTURING.MIXING;

const mkFixed = (operation: string) => ({ operation, rpm: "", time: "", temp: "", vacuum: "" });

export const MIX_TYPE_CONFIG: Record<string, { color: string; italic?: boolean }> = {
  composite: { color: "#4A235A" },
  solid: { color: "#6D4C41" },
  liquid: { color: "#1565C0" },
  "not selected yet": { color: "#616A6B", italic: true },
};

export const getMixTypeConfig = (value: string) =>
  MIX_TYPE_CONFIG[String(value ?? "").toLowerCase()] ?? { color: "#555" };

export const MIX_TYPE_OPTIONS = [
  S.MIX_TYPE_COMPOSITE,
  S.MIX_TYPE_SOLID,
  S.MIX_TYPE_LIQUID,
  S.MIX_TYPE_NOT_SELECTED,
];

export const createMixingData = () => ({
  pre: {
    fixed: [
      mkFixed(S.PRE_ROW_1),
      mkFixed(S.PRE_ROW_2),
      mkFixed(S.PRE_ROW_3),
      mkFixed(S.PRE_ROW_4),
    ],
    dynamic: [],
    sampling: mkFixed(S.PRE_SAMPLING_ROW),
  },
  final: {
    tdi: mkFixed(S.FINAL_ROW_1),
    viscosity: mkFixed(S.FINAL_ROW_2),
  },
});

export const countMixingRowFields = (row: Record<string, unknown>) =>
  ["rpm", "time", "temp", "vacuum"].filter(
    (key) => String(row[key] ?? "").trim() !== ""
  ).length;

export const countMixingTotalFilled = (fixedRows: any[], dynamicRows: any[]) =>
  [...fixedRows, ...dynamicRows].reduce((sum, row) => sum + countMixingRowFields(row), 0);

export const countMixingTotalFields = (fixedRows: any[], dynamicRows: any[]) =>
  (fixedRows.length + dynamicRows.length) * 4;
