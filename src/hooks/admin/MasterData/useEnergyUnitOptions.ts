import { useEffect, useState } from "react";
import { fetchEnergyUnitList } from "@data/api/common/generalAPI";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

export default function useEnergyUnitOptions(enabled: boolean) {
  const [options, setOptions] = useState<AppDropdownOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setOptions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchEnergyUnitList()
      .then((items) => {
        if (cancelled) return;
        setOptions(
          items.map((item) => ({
            value: item.unitCode,
            label: item.symbol || item.name || item.unitCode,
          })),
        );
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
