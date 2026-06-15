export const STAGE_CONFIG: Record<string, { label: string; color: string; italic?: boolean }> = {
  casting: { label: "Casting", color: "#6D4C41" },
  curing: { label: "Curing", color: "#1565C0" },
  "casting & curing": { label: "Casting & Curing", color: "#4A235A" },
  "casting-curing": { label: "Casting & Curing", color: "#4A235A" },
  "not selected yet": { label: "Not Selected Yet", color: "#616A6B", italic: true },
};

export const getStageCfg = (value: string) =>
  STAGE_CONFIG[String(value ?? "").toLowerCase()] ?? { label: value ?? "—", color: "#555" };
