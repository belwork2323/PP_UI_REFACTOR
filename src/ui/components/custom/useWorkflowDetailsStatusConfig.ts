import { useMemo } from "react";

type StatusStyle = { color?: string; bg?: string; border?: string; label?: string; [key: string]: unknown };

/**
 * Merge operation status icon config with details banner color tokens.
 * Same pattern used by Mixing / casing details views.
 */
export const useWorkflowDetailsStatusConfig = <T extends Record<string, StatusStyle>>(
  statusConfig: T,
  bannerStatusConfig: Record<string, StatusStyle> | undefined,
) =>
  useMemo(
    () =>
      Object.fromEntries(
        Object.entries(statusConfig).map(([status, cfg]) => [
          status,
          { ...cfg, ...(bannerStatusConfig?.[status] ?? {}) },
        ]),
      ) as T,
    [statusConfig, bannerStatusConfig],
  );

export default useWorkflowDetailsStatusConfig;
