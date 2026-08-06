import React from "react";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";

interface OtherBemFormHeaderProps {
  theme: any;
  onBack: () => void;
  batchId?: string;
  bemNo?: string;
  isEditMode?: boolean;
  rejectionReason?: string | null;
}

export const OtherBemFormHeader: React.FC<OtherBemFormHeaderProps> = ({
  theme,
  onBack,
  batchId,
  bemNo,
  isEditMode = false,
  rejectionReason,
}) => {
  return (
    <UserWorkflowFormHeader
      theme={theme}
      mode="update"
      onBack={onBack}
      backLabel="Back to Other BEM List"
      data={{
        title: batchId || "Other BEM Motor",
        subtitle: bemNo ? `BEM No: ${bemNo}` : undefined,
        statusLabel: isEditMode ? "Editing Rejected Submission" : "New Submission",
        statusVariant: isEditMode ? "edit" : "new",
        rejectionReason: rejectionReason,
      }}
    />
  );
};
