import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import { STRINGS } from "../../../../../app/config/strings";

const S = STRINGS.MANUFACTURING;

const MixingHeader = ({ batch, isEdit, onBack, theme }: any) => {
  return (
    <UserWorkflowFormHeader
      batch={batch}
      isEdit={isEdit}
      onBack={onBack}
      newLabel={S.MIXING.NEW_LABEL}
      backLabel={S.FORM_HEADER.BACK_TO_LIST}
      editLabel={S.FORM_HEADER.EDITING_REJECTED}
      rejectionTitle={S.FORM_HEADER.REJECTION_REASON}
      batchHeadingOverride={{
        title: batch?.batchId ?? batch?.lotId ?? "—",
        subtitle: [batch?.motorId, batch?.motorType ? `Type ${batch.motorType}` : null]
          .filter(Boolean)
          .join(" · "),
      }}
      theme={theme}
    />
  );
};

export default MixingHeader;
