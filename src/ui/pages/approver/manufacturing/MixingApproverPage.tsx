import { useMemo } from "react";

import { useThemeStore } from "../../../../app/store/themeStore";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { APPROVER_STATUS_META } from "../../../../app/theme/approver";
import useMixingApproverHook from "../../../../hooks/approver/manufacturing/useMixingApproverHook";
import ApproverSubdepartmentBatchListSection from "../components/ApproverSubdepartmentBatchListSection";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import MixingApproverDetailDialog, {
  type MixingApproverDetailItem,
} from "./MixingApproverDetailDialog";

const BRAND = {
  primary: "#1B4F72",
  mx: "#1565C0",
  mxLight: "#1976D2",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  textSub: "#5D6D7E",
};

export const MIX_STATUS_META = APPROVER_STATUS_META;

const MixingApproverPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const approverTheme = useMemo(() => getRawMaterialPreparationApproverTheme(mode), [mode]);

  const {
    items,
    selected,
    detailsLoading,
    activeMixCardId,
    dialogProps,
    actionLoading,
    requestApprove,
    requestReject,
    handleViewDetails,
    handleCloseDetail,
    handleActiveMixCardChange,
  } = useMixingApproverHook();

  return (
    <ApproverSubdepartmentBatchListSection
      department="manufacturing"
      subDepartment="mixing"
      items={items}
      statusMeta={MIX_STATUS_META}
      onViewDetails={handleViewDetails}
      allowViewDetailsWhenApproved
      tableTheme={{
        accentMain: BRAND.mx,
        accentLight: BRAND.mxLight,
        borderColor: BRAND.border,
        surfaceColor: BRAND.surface,
        textSubColor: BRAND.textSub,
        primaryColor: BRAND.primary,
      }}
    >
      <MixingApproverDetailDialog
        open={!!selected}
        onClose={handleCloseDetail}
        item={selected as MixingApproverDetailItem | null}
        loading={detailsLoading}
        activeMixCardId={activeMixCardId}
        onActiveMixCardChange={handleActiveMixCardChange}
        onApprove={requestApprove}
        onReject={requestReject}
        actionLoading={actionLoading}
        theme={approverTheme}
      />
      <ApproverActionDialog {...dialogProps} />
    </ApproverSubdepartmentBatchListSection>
  );
};

export default MixingApproverPage;
