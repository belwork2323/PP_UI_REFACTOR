import { useMemo } from "react";

import { useThemeStore } from "../../../../app/store/themeStore";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { APPROVER_STATUS_META } from "../../../../app/theme/approver";
import useNDTApproverHook from "../../../../hooks/approver/qualityControl/useNDTApproverHook";
import ApproverSubdepartmentBatchListSection from "../components/ApproverSubdepartmentBatchListSection";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import NDTApproverDetailDialog, {
  type NDTApproverDetailItem,
} from "./NDTApproverDetailDialog";

const BRAND = {
  primary: "#1B4F72",
  nd: "#1565C0",
  ndLight: "#1976D2",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  textSub: "#5D6D7E",
};

export const QC_STATUS_META = APPROVER_STATUS_META;

const NDTApproverPage = () => {
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
  } = useNDTApproverHook();

  return (
    <ApproverSubdepartmentBatchListSection
      department="qualityControl"
      subDepartment="ndt"
      items={items}
      statusField="ndtStatus"
      statusMeta={QC_STATUS_META}
      onViewDetails={handleViewDetails}
      allowViewDetailsWhenApproved
      tableTheme={{
        accentMain: BRAND.nd,
        accentLight: BRAND.ndLight,
        borderColor: BRAND.border,
        surfaceColor: BRAND.surface,
        textSubColor: BRAND.textSub,
        primaryColor: BRAND.primary,
      }}
    >
      <NDTApproverDetailDialog
        open={!!selected}
        onClose={handleCloseDetail}
        item={selected as NDTApproverDetailItem | null}
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

export default NDTApproverPage;
