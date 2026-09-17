import { useEffect, useState } from "react";
import { fetchEquipmentTypeList } from "@data/api/common/generalAPI";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

export default function useEquipmentTypeOptions(enabled: boolean) {
  const [options, setOptions] = useState<AppDropdownOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setOptions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchEquipmentTypeList()
      .then((items) => {
        if (cancelled) return;
        setOptions(
          items
            .filter((item) => Boolean(item.typeCode))
            .map((item) => ({
              value: item.typeCode,
              label: item.name || item.typeCode,
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
