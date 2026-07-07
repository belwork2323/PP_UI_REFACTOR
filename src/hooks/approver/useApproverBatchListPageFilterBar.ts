import { useMemo } from "react";

import { useThemeStore } from "../../app/store/themeStore";
import getManufacturingTheme from "../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { useApproverSubdepartmentBatchListFilterBar } from "../../ui/pages/approver/components/ApproverSubdepartmentBatchListFilterPanel";

export const useApproverBatchListPageFilterBar = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);

  return useApproverSubdepartmentBatchListFilterBar({ mode, theme });
};

export default useApproverBatchListPageFilterBar;
