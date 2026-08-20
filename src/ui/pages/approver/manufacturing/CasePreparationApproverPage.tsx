import React, { useMemo } from "react";

import { useThemeStore } from "../../../../app/store/themeStore";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { APPROVER_STATUS_META } from "../../../../app/theme/approver";
import useCasePreparationApproverHook from "../../../../hooks/approver/manufacturing/useCasePreparationApproverHook";
import ApproverSubdepartmentBatchListSection from "../components/ApproverSubdepartmentBatchListSection";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import CasePreparationApproverDetailDialog, {
  type CasePreparationApproverDetailItem,
} from "./CasePreparationApproverDetailDialog";

const BRAND = {
  primary: "#1B4F72",
  cp: "#1565C0",
  cpLight: "#1976D2",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  textSub: "#5D6D7E",
};

export const CP_STATUS_META = APPROVER_STATUS_META;

const CasePreparationApproverPage = () => {
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
  } = useCasePreparationApproverHook();

  return (
    <ApproverSubdepartmentBatchListSection
      department="manufacturing"
      subDepartment="case-preparation"
      items={items}
      statusMeta={CP_STATUS_META}
      onViewDetails={handleViewDetails}
      allowViewDetailsWhenApproved
      tableTheme={{
        accentMain: BRAND.cp,
        accentLight: BRAND.cpLight,
        borderColor: BRAND.border,
        surfaceColor: BRAND.surface,
        textSubColor: BRAND.textSub,
        primaryColor: BRAND.primary,
      }}
    >
      <CasePreparationApproverDetailDialog
        open={!!selected}
        onClose={handleCloseDetail}
        item={selected as CasePreparationApproverDetailItem | null}
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

export default CasePreparationApproverPage;
