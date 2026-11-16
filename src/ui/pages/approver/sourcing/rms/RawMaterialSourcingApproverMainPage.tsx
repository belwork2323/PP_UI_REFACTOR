import ApproverWorkflowMainPage from "@ui/pages/approver/components/ApproverWorkflowMainPage";
import { useRawMaterialSourcingApproverDetails } from "@hooks/approver/sourcing/rms/useRawMaterialSourcingApproverDetails";
import { useRmsApproverListConfig } from "./rmsApproverListConfig";
import RawMaterialSourcingApproverDetailsPage from "./RawMaterialSourcingApproverDetailsPage";

const RawMaterialSourcingApproverMainPage = () => {
  const listConfig = useRmsApproverListConfig();

  return (
    <ApproverWorkflowMainPage
      listConfig={listConfig}
      DetailsPage={RawMaterialSourcingApproverDetailsPage}
      useDetails={useRawMaterialSourcingApproverDetails}
    />
  );
};

export default RawMaterialSourcingApproverMainPage;
