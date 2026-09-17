import { useEffect, useState } from "react";
import { fetchUnitList } from "@data/api/common/generalAPI";

/** Unit dropdown options always use string labels (compatible with AppDropdown and CasePrep selects). */
export type UnitMasterOption = {
  value: string;
  label: string;
};

export default function useUnitMasterOptions(enabled: boolean) {
  const [options, setOptions] = useState<UnitMasterOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setOptions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchUnitList()
      .then((items) => {
        if (cancelled) return;
        setOptions(
          items.map((item) => ({
            value: String(item.id),
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
