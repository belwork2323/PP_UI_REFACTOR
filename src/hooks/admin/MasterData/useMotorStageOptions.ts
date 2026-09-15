import { useEffect, useState } from "react";
import { operationsController } from "@controllers/user/operationsController";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

export default function useMotorStageOptions(enabled: boolean) {
  const [options, setOptions] = useState<AppDropdownOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setOptions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void operationsController
      .fetchMotorsStageList()
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
  }, [enabled]);

  return { options, loading };
}
