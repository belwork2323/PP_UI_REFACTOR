export type OvenSelectOption = {
  value: string;
  label: string;
  noOfOvenAvailable?: number;
};

type OvenApiRow = {
  code?: string;
  name?: string;
  noOfOvenAvailable?: number;
  noOfOvenAdded?: number;
};

/** Map oven master API rows to select options (value = code, label = name). */
export const mapOvensToOptions = (rows: unknown): OvenSelectOption[] => {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((item) => {
      const oven = (item ?? {}) as OvenApiRow;
      const code = String(oven.code ?? oven.name ?? "").trim();
      const available = Number(oven.noOfOvenAvailable ?? oven.noOfOvenAdded ?? 0);
      return {
        value: code,
        label: String(oven.name ?? code).trim() || code,
        noOfOvenAvailable:
          Number.isFinite(available) && available > 0 ? available : undefined,
      } satisfies OvenSelectOption;
    })
    .filter((option) => Boolean(option.value));
};

/** Resolve stored oven code to display name; fall back to the raw code. */
export const resolveOvenLabel = (
  code: string | null | undefined,
  options: OvenSelectOption[] | null | undefined,
): string => {
  const trimmed = String(code ?? "").trim();
  if (!trimmed) return "";
  const match = (options ?? []).find((option) => option.value === trimmed);
  return String(match?.label ?? trimmed).trim() || trimmed;
};
