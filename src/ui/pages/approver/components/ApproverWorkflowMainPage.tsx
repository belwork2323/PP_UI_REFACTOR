import ApproverActionDialog from "@ui/components/custom/ApproverActionDialog";
import ApproverWorkflowListPage from "./ApproverWorkflowListPage";
import type { ApproverWorkflowMainPageProps } from "./approverWorkflowTypes";

/**
 * Shared Approver Main: list ↔ details view switch + ApproverActionDialog.
 * List chrome is common; Details body comes from the subdepartment registry.
 */
const ApproverWorkflowMainPage = ({
  listConfig,
  DetailsPage,
  useDetails,
}: ApproverWorkflowMainPageProps) => {
  const {
    selected,
    detailsLoading,
    dialogProps,
    requestApprove,
    requestReject,
    handleViewDetails,
    handleCloseDetail,
  } = useDetails();

  if (selected) {
    return (
      <>
        <DetailsPage
          item={selected}
          loading={detailsLoading}
          onBack={handleCloseDetail}
          onApprove={requestApprove}
          onReject={requestReject}
        />
        <ApproverActionDialog {...dialogProps} />
      </>
    );
  }

  return (
    <>
      <ApproverWorkflowListPage config={listConfig} onViewDetails={handleViewDetails} />
      <ApproverActionDialog {...dialogProps} />
    </>
  );
};

export default ApproverWorkflowMainPage;
