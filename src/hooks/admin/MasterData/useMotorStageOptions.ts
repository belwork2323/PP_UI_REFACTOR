import { useEffect, useState } from "react";
import { operationsController } from "@controllers/user/operationsController";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

/**
 * @param enabled When false, clears options.
 * @param projectId
 *   - `undefined`: load all stages (curing/quality/etc.)
 *   - `""`: no project selected yet — empty options
 *   - non-empty: stages for that project only
 */
export default function useMotorStageOptions(enabled: boolean, projectId?: string) {
  const [options, setOptions] = useState<AppDropdownOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setOptions([]);
      return;
    }
    if (projectId === "") {
      setOptions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void operationsController
      .fetchMotorsStageList(projectId ? { projectId } : undefined)
      .then((response) => {
        if (cancelled) return;
        const stages = response?.success && response.data ? response.data.stages ?? [] : [];
        const seen = new Set<string>();
        const next: AppDropdownOption[] = [];
        for (const stage of stages) {
          const value = String(stage.motorStage ?? "").trim();
          if (!value || seen.has(value)) continue;
          seen.add(value);
          next.push({ value, label: `Stage ${value}` });
        }
        next.sort((a, b) => Number(a.value) - Number(b.value));
        setOptions(next);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, projectId]);

  return { options, loading };
}
