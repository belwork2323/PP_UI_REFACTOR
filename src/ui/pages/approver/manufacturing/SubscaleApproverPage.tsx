import { useMemo } from "react";

import { useThemeStore } from "../../../../app/store/themeStore";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { SUBSCALE_BRAND } from "../../../../app/theme/custom_themes/user/manufacturing/subscale_theme";
import { APPROVER_STATUS_META } from "../../../../app/theme/approver";
import useSubscaleApproverHook from "../../../../hooks/approver/manufacturing/useSubscaleApproverHook";
import ApproverSubdepartmentBatchListSection from "../components/ApproverSubdepartmentBatchListSection";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import SubscaleApproverDetailDialog from "./SubscaleApproverDetailDialog";

const BRAND = {
  primary: SUBSCALE_BRAND.primary,
  ss: SUBSCALE_BRAND.ss,
  ssLight: SUBSCALE_BRAND.ssLight,
  surface: SUBSCALE_BRAND.surface,
  border: SUBSCALE_BRAND.border,
  textSub: SUBSCALE_BRAND.textSub,
};

export const SS_STATUS_META = APPROVER_STATUS_META;

const SubscaleApproverPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const approverTheme = useMemo(() => getRawMaterialPreparationApproverTheme(mode), [mode]);

  const {
    items,
    selected,
    detailsLoading,
    detailView,
    dialogProps,
    requestApprove,
    requestReject,
    handleViewDetails,
    handleCloseDetail,
  } = useSubscaleApproverHook();

  return (
    <ApproverSubdepartmentBatchListSection
      department="manufacturing"
      subDepartment="subscale"
      items={items}
      statusField="ssStatus"
      statusMeta={SS_STATUS_META}
      onViewDetails={handleViewDetails}
      allowViewDetailsWhenApproved
      tableTheme={{
        accentMain: BRAND.ss,
        accentLight: BRAND.ssLight,
        borderColor: BRAND.border,
        surfaceColor: BRAND.surface,
        textSubColor: BRAND.textSub,
        primaryColor: BRAND.primary,
      }}
    >
      <SubscaleApproverDetailDialog
        open={!!selected}
        onClose={handleCloseDetail}
        item={selected}
        detailView={detailView}
        loading={detailsLoading}
        onApprove={requestApprove}
        onReject={requestReject}
        theme={approverTheme}
      />
      <ApproverActionDialog {...dialogProps} />
    </ApproverSubdepartmentBatchListSection>
  );
};

export default SubscaleApproverPage;
