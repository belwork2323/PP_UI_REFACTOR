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
        setOptions(
          stages.map((stage) => {
            const value = String(stage.motorStage ?? "");
            return { value, label: `Stage ${value}` };
          }),
        );
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
