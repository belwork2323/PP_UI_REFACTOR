import { useMemo } from "react";

import { useThemeStore } from "../../../../app/store/themeStore";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { APPROVER_STATUS_META } from "../../../../app/theme/approver";
import usePostCureApproverHook from "../../../../hooks/approver/manufacturing/usePostCureApproverHook";
import ApproverSubdepartmentBatchListSection from "../components/ApproverSubdepartmentBatchListSection";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import PostCureApproverDetailDialog, {
  type PostCureApproverDetailItem,
} from "./PostCureApproverDetailDialog";

const BRAND = {
  primary: "#1B4F72",
  pc: "#1565C0",
  pcLight: "#1976D2",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  textSub: "#5D6D7E",
};

export const PC_STATUS_META = APPROVER_STATUS_META;

const PostCureApproverPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const approverTheme = useMemo(() => getRawMaterialPreparationApproverTheme(mode), [mode]);

  const {
    items,
    selected,
    detailsLoading,
    activeMotorId,
    dialogProps,
    actionLoading,
    requestApprove,
    requestReject,
    handleViewDetails,
    handleCloseDetail,
    handleActiveMotorChange,
  } = usePostCureApproverHook();

  return (
    <ApproverSubdepartmentBatchListSection
      department="manufacturing"
      subDepartment="post-cure-operations"
      items={items}
      statusField="pcStatus"
      statusMeta={PC_STATUS_META}
      onViewDetails={handleViewDetails}
      allowViewDetailsWhenApproved
      tableTheme={{
        accentMain: BRAND.pc,
        accentLight: BRAND.pcLight,
        borderColor: BRAND.border,
        surfaceColor: BRAND.surface,
        textSubColor: BRAND.textSub,
        primaryColor: BRAND.primary,
      }}
    >
      <PostCureApproverDetailDialog
        open={!!selected}
        onClose={handleCloseDetail}
        item={selected as PostCureApproverDetailItem | null}
        loading={detailsLoading}
        activeMotorId={activeMotorId}
        onActiveMotorChange={handleActiveMotorChange}
        onApprove={requestApprove}
        onReject={requestReject}
        actionLoading={actionLoading}
        theme={approverTheme}
      />
      <ApproverActionDialog {...dialogProps} />
    </ApproverSubdepartmentBatchListSection>
  );
};

export default PostCureApproverPage;
