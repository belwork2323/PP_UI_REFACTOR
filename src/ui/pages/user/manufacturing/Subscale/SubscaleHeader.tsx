import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import { STRINGS } from "../../../../../app/config/strings";

const S = STRINGS.MANUFACTURING;

const SubscaleHeader = ({ batch, isEdit, onBack, theme }: any) => {
  const articleId = String(batch?.articleId ?? "").trim();
  const motorId = String(batch?.motorId ?? "").trim();

  return (
    <UserWorkflowFormHeader
      mode="update"
      data={{
        title: String(batch?.batchId ?? batch?.lotId ?? "—"),
        subtitle: articleId
          ? `Article ${articleId}`
          : motorId && motorId !== "—"
            ? motorId
            : undefined,
        statusLabel: isEdit ? S.FORM_HEADER.EDITING_REJECTED : S.SUBSCALE.NEW_LABEL,
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

export default SubscaleHeader;
