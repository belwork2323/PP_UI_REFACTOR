import { useMemo } from "react";

import { useThemeStore } from "../../../../app/store/themeStore";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { APPROVER_STATUS_META } from "../../../../app/theme/approver";
import useQCDivisionApproverHook from "../../../../hooks/approver/qualityControl/useQCDivisionApproverHook";
import ApproverSubdepartmentBatchListSection from "../components/ApproverSubdepartmentBatchListSection";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import QCDivisionApproverDetailDialog from "./QCDivisionApproverDetailDialog";

const BRAND = {
  primary: "#1B4F72",
  qc: "#1565C0",
  qcLight: "#1976D2",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  textSub: "#5D6D7E",
};

export const QC_STATUS_META = APPROVER_STATUS_META;

const QCDivisionApproverPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const approverTheme = useMemo(() => getRawMaterialPreparationApproverTheme(mode), [mode]);

  const {
    items,
    selected,
    detailsLoading,
    schemaLoading,
    detailView,
    formData,
    activeDivisionGroupIndex,
    activeDivisionSubIndex,
    setActiveDivisionGroupIndex,
    setActiveDivisionSubIndex,
    activePartialNavIndex,
    setActivePartialNavIndex,
    partialNavItems,
    activeDivisionTabKey,
    divisionNavTabs,
    setActiveDivisionTabKey,
    divisionStatusByFlowKey,
    divisionApprovalRows,
    finalApprovalGroups,
    finalApprovalRows,
    subDepartmentId,
    dialogProps,
    actionLoading,
    requestApprove,
    requestReject,
    handleViewDetails,
    handleCloseDetail,
  } = useQCDivisionApproverHook();

  return (
    <ApproverSubdepartmentBatchListSection
      department="qualityControl"
      subDepartment="qc-division"
      items={items}
      statusField="qcDivStatus"
      statusMeta={QC_STATUS_META}
      onViewDetails={handleViewDetails}
      allowViewDetailsWhenApproved
      tableTheme={{
        accentMain: BRAND.qc,
        accentLight: BRAND.qcLight,
        borderColor: BRAND.border,
        surfaceColor: BRAND.surface,
        textSubColor: BRAND.textSub,
        primaryColor: BRAND.primary,
      }}
    >
      <QCDivisionApproverDetailDialog
        open={!!selected}
        onClose={handleCloseDetail}
        item={selected}
        detailView={detailView}
        formData={formData}
        subDepartmentId={subDepartmentId}
        loading={detailsLoading}
        schemaLoading={schemaLoading}
        activeDivisionGroupIndex={activeDivisionGroupIndex}
        activeDivisionSubIndex={activeDivisionSubIndex}
        onActiveDivisionGroupIndexChange={setActiveDivisionGroupIndex}
        onActiveDivisionSubIndexChange={setActiveDivisionSubIndex}
        divisionNavTabs={divisionNavTabs}
        activeDivisionTabKey={activeDivisionTabKey}
        onActiveDivisionTabKeyChange={setActiveDivisionTabKey}
        partialNavItems={partialNavItems}
        activePartialNavIndex={activePartialNavIndex}
        onActivePartialNavIndexChange={setActivePartialNavIndex}
        divisionStatusByFlowKey={divisionStatusByFlowKey}
        divisionApprovalRows={divisionApprovalRows}
        finalApprovalGroups={finalApprovalGroups}
        finalApprovalRows={finalApprovalRows}
        onApprove={requestApprove}
        onReject={requestReject}
        actionLoading={actionLoading}
        theme={approverTheme}
      />
      <ApproverActionDialog {...dialogProps} />
    </ApproverSubdepartmentBatchListSection>
  );
};

export default QCDivisionApproverPage;
