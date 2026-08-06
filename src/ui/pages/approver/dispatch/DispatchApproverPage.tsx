import { useMemo } from "react";

import { useThemeStore } from "../../../../app/store/themeStore";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { APPROVER_STATUS_META } from "../../../../app/theme/approver";
import useDispatchApproverHook from "../../../../hooks/approver/useDispatchApproverHook";
import ApproverSubdepartmentBatchListSection from "../components/ApproverSubdepartmentBatchListSection";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import DispatchApproverDetailDialog, {
  type DispatchApproverDetailItem,
} from "./DispatchApproverDetailDialog";

const BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  textSub: "#5D6D7E",
};

export const DISPATCH_STATUS_META = APPROVER_STATUS_META;

const DispatchApproverPage = () => {
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
  } = useDispatchApproverHook();

  return (
    <ApproverSubdepartmentBatchListSection
      department="dispatch"
      subDepartment="dispatch"
      items={items}
      statusField="dispatchStatus"
      statusMeta={DISPATCH_STATUS_META}
      onViewDetails={handleViewDetails}
      allowViewDetailsWhenApproved
      tableTheme={{
        accentMain: BRAND.primary,
        accentLight: BRAND.primaryLight,
        borderColor: BRAND.border,
        surfaceColor: BRAND.surface,
        textSubColor: BRAND.textSub,
        primaryColor: BRAND.primary,
      }}
    >
      <DispatchApproverDetailDialog
        open={!!selected}
        onClose={handleCloseDetail}
        item={selected as DispatchApproverDetailItem | null}
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

export default DispatchApproverPage;
