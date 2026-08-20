import React, { useMemo } from "react";

import { useThemeStore } from "../../../../app/store/themeStore";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { APPROVER_STATUS_META } from "../../../../app/theme/approver";
import useRawMaterialPreparationApproverHook from "../../../../hooks/approver/manufacturing/useRawMaterialPreparationApproverHook";
import ApproverSubdepartmentBatchListSection from "../components/ApproverSubdepartmentBatchListSection";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import RawMaterialPreparationApproverDetailDialog, {
  type RawMaterialPreparationApproverDetailItem,
} from "./RawMaterialPreparationApproverDetailDialog";

const BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  textSub: "#5D6D7E",
};

export const RMP_STATUS_META = APPROVER_STATUS_META;

const RawMaterialPreparationApproverPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const approverTheme = useMemo(() => getRawMaterialPreparationApproverTheme(mode), [mode]);

  const {
    items,
    selected,
    detailsLoading,
    activePremixNo,
    dialogProps,
    actionLoading,
    requestApprove,
    requestReject,
    handleViewDetails,
    handleCloseDetail,
    handleActivePremixChange,
  } = useRawMaterialPreparationApproverHook();

  return (
    <ApproverSubdepartmentBatchListSection
      department="manufacturing"
      subDepartment="raw-material-prep"
      items={items}
      statusMeta={RMP_STATUS_META}
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
      <RawMaterialPreparationApproverDetailDialog
        open={!!selected}
        onClose={handleCloseDetail}
        item={selected as RawMaterialPreparationApproverDetailItem | null}
        loading={detailsLoading}
        activePremixNo={activePremixNo}
        onActivePremixChange={handleActivePremixChange}
        onApprove={requestApprove}
        onReject={requestReject}
        actionLoading={actionLoading}
        theme={approverTheme}
      />
      <ApproverActionDialog {...dialogProps} />
    </ApproverSubdepartmentBatchListSection>
  );
};

export default RawMaterialPreparationApproverPage;
