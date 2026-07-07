import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import { STRINGS } from "../../../../../app/config/strings";

const S = STRINGS.MANUFACTURING;

const SubscaleHeader = ({ batch, isEdit, onBack, theme }: any) => {
  return (
    <UserWorkflowFormHeader
      batch={batch}
      isEdit={isEdit}
      onBack={onBack}
      newLabel={S.SUBSCALE.NEW_LABEL}
      backLabel={S.FORM_HEADER.BACK_TO_LIST}
      editLabel={S.FORM_HEADER.EDITING_REJECTED}
      rejectionTitle={S.FORM_HEADER.REJECTION_REASON}
      batchHeadingOverride={{
        title: batch?.batchId ?? batch?.lotId ?? "—",
        subtitle: batch?.articleId ? `Article ${batch.articleId}` : batch?.motorId ?? "—",
      }}
      theme={theme}
    />
  );
};

export default SubscaleHeader;
