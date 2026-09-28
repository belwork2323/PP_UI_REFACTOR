import type { RmpMaterialUiKey } from "./rmpMaterialUiRegistry";
import {
  createEmptyLotDetailRow,
  lotDetailsHaveUserData,
  type LotDetailFormRow,
} from "./lotDetailForm";

/** Shared DOA-format fields (dispatch / observation / total qty). Used by DOA, HTPB, TDI. */
export type LiquidDispatchUiKey = "doa" | "htpb" | "tdi";

export type DoaProcessForm = {
  uiKey: LiquidDispatchUiKey;
  lotDetails: LotDetailFormRow[];
  dispatchDatetime: string;
  observation: string;
  totalQtySentForPremix: string;
};

export const createEmptyDoaProcessForm = (
  uiKey: LiquidDispatchUiKey = "doa",
): DoaProcessForm => ({
  uiKey,
  lotDetails: [createEmptyLotDetailRow()],
  dispatchDatetime: "",
  observation: "",
  totalQtySentForPremix: "",
});

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

export const doaFormHasUserData = (form: DoaProcessForm): boolean => {
  if (lotDetailsHaveUserData(form.lotDetails)) return true;
  return [form.dispatchDatetime, form.observation, form.totalQtySentForPremix].some((v) =>
    str(v),
  );
};

export const isLiquidDispatchUiKey = (
  uiKey: RmpMaterialUiKey,
): uiKey is LiquidDispatchUiKey =>
  uiKey === "doa" || uiKey === "htpb" || uiKey === "tdi";

/** @deprecated Prefer isLiquidDispatchUiKey */
export const isDoaUiKey = isLiquidDispatchUiKey;

export const liquidDispatchSectionTitle = (uiKey: LiquidDispatchUiKey): string => {
  if (uiKey === "htpb") return "HTPB";
  if (uiKey === "tdi") return "TDI";
  return "DOA";
};
