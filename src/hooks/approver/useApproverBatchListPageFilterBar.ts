import { useMemo } from "react";

import { useThemeStore } from "../../app/store/themeStore";
import getManufacturingTheme from "../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { useApproverSubdepartmentBatchListFilterBar } from "../../ui/pages/approver/components/ApproverSubdepartmentBatchListFilterPanel";
import { ApproverDepartmentKey } from "@/app/theme/approver";
type UseApproverBatchListPageFilterBarArgs = {
  department: ApproverDepartmentKey;
  subDepartment: string;
  items?: Record<string, unknown>[];
};
export const useApproverBatchListPageFilterBar = ({
  department,
  subDepartment,
  items = [],
}: UseApproverBatchListPageFilterBarArgs) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);

  return useApproverSubdepartmentBatchListFilterBar({
    mode,
    theme,
    department,
    subDepartment,
    items,
  });
};

export default useApproverBatchListPageFilterBar;
