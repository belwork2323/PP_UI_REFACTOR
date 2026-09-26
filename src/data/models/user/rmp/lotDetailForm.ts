import type { RmpMaterialUiKey } from "./rmpMaterialUiRegistry";

export type LotDetailFormRow = {
  lotId: string;
  quantity: string;
};

export const createEmptyLotDetailRow = (): LotDetailFormRow => ({
  lotId: "",
  quantity: "",
});

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

export const lotDetailsHaveUserData = (rows: LotDetailFormRow[] | undefined): boolean =>
  (rows ?? []).some((row) => str(row.lotId) || str(row.quantity));

export const sumLotDetailQuantities = (rows: LotDetailFormRow[] | undefined): number =>
  (rows ?? []).reduce((sum, row) => {
    const n = Number(String(row.quantity ?? "").replace(/,/g, "").trim());
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
