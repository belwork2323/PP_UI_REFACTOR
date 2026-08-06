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
  const motorId = String(batch?.motorId ?? "").trim();
  return motorId && motorId !== "—" ? motorId : undefined;
};

const resolveStatusLabel = (batch: any, isEdit: boolean) => {
  if (isEdit) return S.FORM_HEADER.EDITING_REJECTED;

  const status = String(batch?.pcStatus ?? batch?.status ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  const inProgress =
    status === "in_progress" ||
    status === "waiting_for_partial_approval" ||
    Boolean(batch?.formId);

  return inProgress ? S.FORM_HEADER.DRAFT : S.POST_CURE.NEW_LABEL;
};

const PostCureHeader = ({ batch, isEdit, onBack, theme }: any) => {
  return (
    <UserWorkflowFormHeader
      mode="update"
      data={{
        title: String(batch?.batchId ?? batch?.lotId ?? "—"),
        subtitle: formatMotorSubtitle(batch),
        statusLabel: resolveStatusLabel(batch, isEdit),
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

export default PostCureHeader;
