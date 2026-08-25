import React from "react";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import { resolveWorkflowFormHeaderStatus } from "../../../../components/custom/workflowFormHeaderStatus";
import { STRINGS } from "../../../../../app/config/strings";

interface OtherBemFormHeaderProps {
  theme: any;
  onBack: () => void;
  batchId?: string;
  bemNo?: string;
  status?: string | null;
  rejectionReason?: string | null;
}

export const OtherBemFormHeader: React.FC<OtherBemFormHeaderProps> = ({
  theme,
  onBack,
  batchId,
  bemNo,
  status,
  rejectionReason,
}) => {
  const headerStatus = resolveWorkflowFormHeaderStatus({
    status,
    rejectionReason,
  });

  return (
    <UserWorkflowFormHeader
      theme={theme}
      mode="update"
      onBack={onBack}
      backLabel={STRINGS.MANUFACTURING.FORM_HEADER.BACK_TO_LIST}
      rejectionTitle={STRINGS.MANUFACTURING.FORM_HEADER.REJECTION_REASON}
      data={{
        title: batchId || "Other BEM Motor",
        subtitle: bemNo ? `BEM No: ${bemNo}` : undefined,
        statusLabel: headerStatus.statusLabel,
        statusVariant: headerStatus.statusVariant,
        rejectionReason: headerStatus.rejectionReason,
      }}
    />
  );
};
