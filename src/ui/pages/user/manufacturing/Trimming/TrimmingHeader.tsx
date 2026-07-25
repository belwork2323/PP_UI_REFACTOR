import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import { STRINGS } from "../../../../../app/config/strings";

const S = STRINGS.MANUFACTURING;

const TrimmingHeader = ({ batch, isEdit, onBack, theme }: any) => {
  const motorId = String(batch?.motorId ?? "").trim();

  return (
    <UserWorkflowFormHeader
      mode="update"
      data={{
        title: String(batch?.batchId ?? batch?.lotId ?? "—"),
        subtitle: motorId && motorId !== "—" ? motorId : undefined,
        statusLabel: isEdit ? S.FORM_HEADER.EDITING_REJECTED : S.TRIMMING.NEW_LABEL,
        statusVariant: isEdit ? "edit" : "new",
        rejectionReason: batch?.rejectionReason,
      }}
      onBack={onBack}
      backLabel={S.FORM_HEADER.BACK_TO_LIST}
      rejectionTitle={S.FORM_HEADER.REJECTION_REASON}
      theme={theme}
    />
  );
};

export default TrimmingHeader;
