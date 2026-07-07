import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import { STRINGS } from "../../../../../app/config/strings";

const S = STRINGS.MANUFACTURING;

const formatMotorSubtitle = (batch?: {
  motorId?: string;
  motorIds?: Array<string | number>;
} | null) => {
  const ids = Array.isArray(batch?.motorIds)
    ? batch.motorIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  if (ids.length > 0) return ids.join(" · ");
  return String(batch?.motorId ?? "").trim() || "—";
};

const PostCureHeader = ({ batch, isEdit, onBack, theme }: any) => {
  return (
    <UserWorkflowFormHeader
      batch={batch}
      isEdit={isEdit}
      onBack={onBack}
      newLabel={S.POST_CURE.NEW_LABEL}
      backLabel={S.FORM_HEADER.BACK_TO_LIST}
      editLabel={S.FORM_HEADER.EDITING_REJECTED}
      rejectionTitle={S.FORM_HEADER.REJECTION_REASON}
      batchHeadingOverride={{
        title: batch?.batchId ?? batch?.lotId ?? "—",
        subtitle: formatMotorSubtitle(batch),
      }}
      theme={theme}
    />
  );
};

export default PostCureHeader;
