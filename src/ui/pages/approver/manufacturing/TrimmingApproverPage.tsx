import { useMemo } from "react";

import { useThemeStore } from "../../../../app/store/themeStore";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { TRIMMING_BRAND } from "../../../../app/theme/custom_themes/user/manufacturing/trimming_theme";
import { APPROVER_STATUS_META } from "../../../../app/theme/approver";
import useTrimmingApproverHook from "../../../../hooks/approver/manufacturing/useTrimmingApproverHook";
import ApproverSubdepartmentBatchListSection from "../components/ApproverSubdepartmentBatchListSection";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import TrimmingApproverDetailDialog, {
  type TrimmingApproverDetailItem,
} from "./TrimmingApproverDetailDialog";

const BRAND = {
  primary: TRIMMING_BRAND.primary,
  tr: TRIMMING_BRAND.tr,
  trLight: TRIMMING_BRAND.trLight,
  surface: TRIMMING_BRAND.surface,
  border: TRIMMING_BRAND.border,
  textSub: TRIMMING_BRAND.textSub,
};

export const TR_STATUS_META = APPROVER_STATUS_META;

const TrimmingApproverPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const approverTheme = useMemo(() => getRawMaterialPreparationApproverTheme(mode), [mode]);

  const {
    items,
    selected,
    detailsLoading,
    activeMotorId,
    dialogProps,
    formDialogProps,
    actionLoading,
    requestApprove,
    requestReject,
    requestFormApprove,
    requestFormReject,
    handleViewDetails,
    handleCloseDetail,
    handleActiveMotorChange,
  } = useTrimmingApproverHook();

  return (
    <ApproverSubdepartmentBatchListSection
      department="manufacturing"
      subDepartment="trimming"
      items={items}
      statusField="trStatus"
      statusMeta={TR_STATUS_META}
      onViewDetails={handleViewDetails}
      allowViewDetailsWhenApproved
      tableTheme={{
        accentMain: BRAND.tr,
        accentLight: BRAND.trLight,
        borderColor: BRAND.border,
        surfaceColor: BRAND.surface,
        textSubColor: BRAND.textSub,
        primaryColor: BRAND.primary,
      }}
    >
      <TrimmingApproverDetailDialog
        open={!!selected}
        onClose={handleCloseDetail}
        item={selected as TrimmingApproverDetailItem | null}
        loading={detailsLoading}
        activeMotorId={activeMotorId}
        onActiveMotorChange={handleActiveMotorChange}
        onApprove={requestApprove}
        onReject={requestReject}
        onApproveForm={requestFormApprove}
        onRejectForm={requestFormReject}
        actionLoading={actionLoading}
        theme={approverTheme}
      />
      <ApproverActionDialog {...dialogProps} />
      <ApproverActionDialog {...formDialogProps} />
    </ApproverSubdepartmentBatchListSection>
  );
};

export default TrimmingApproverPage;
