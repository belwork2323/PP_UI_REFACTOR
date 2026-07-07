export const STAGE_CONFIG: Record<string, { label: string; color: string; italic?: boolean }> = {
  casting: { label: "Casting", color: "#6D4C41" },
  curing: { label: "Curing", color: "#1565C0" },
  "casting & curing": { label: "Casting & Curing", color: "#4A235A" },
  "casting-curing": { label: "Casting & Curing", color: "#4A235A" },
  "not selected yet": { label: "Not Selected Yet", color: "#616A6B", italic: true },
};

export const getStageCfg = (value: unknown) => {
  const normalized =
    typeof value === "string"
      ? value
      : value && typeof value === "object"
        ? String(
            (value as { subDepartmentName?: string; departmentName?: string; label?: string })
              .subDepartmentName ??
              (value as { departmentName?: string }).departmentName ??
              (value as { label?: string }).label ??
              "",
          )
        : String(value ?? "");

  const key = normalized.trim().toLowerCase();
  return STAGE_CONFIG[key] ?? { label: normalized.trim() || "—", color: "#555" };
};
