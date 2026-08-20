import { useMemo } from "react";

import { useThemeStore } from "../../../../app/store/themeStore";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { APPROVER_STATUS_META } from "../../../../app/theme/approver";
import useCastingAndCuringApproverHook from "../../../../hooks/approver/manufacturing/useCastingAndCuringApproverHook";
import ApproverSubdepartmentBatchListSection from "../components/ApproverSubdepartmentBatchListSection";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import CastingAndCuringApproverDetailDialog, {
  type CastingAndCuringApproverDetailItem,
} from "./CastingAndCuringApproverDetailDialog";

const BRAND = {
  primary: "#1B4F72",
  cc: "#1565C0",
  ccLight: "#1976D2",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  textSub: "#5D6D7E",
};

export const CC_STATUS_META = APPROVER_STATUS_META;

const CastingAndCuringApproverPage = () => {
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
  } = useCastingAndCuringApproverHook();

  return (
    <ApproverSubdepartmentBatchListSection
      department="manufacturing"
      subDepartment="casting-and-curing"
      items={items}
      statusMeta={CC_STATUS_META}
      onViewDetails={handleViewDetails}
      allowViewDetailsWhenApproved
      tableTheme={{
        accentMain: BRAND.cc,
        accentLight: BRAND.ccLight,
        borderColor: BRAND.border,
        surfaceColor: BRAND.surface,
        textSubColor: BRAND.textSub,
        primaryColor: BRAND.primary,
      }}
    >
      <CastingAndCuringApproverDetailDialog
        open={!!selected}
        onClose={handleCloseDetail}
        item={selected as CastingAndCuringApproverDetailItem | null}
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

export default CastingAndCuringApproverPage;
