import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import { resolveWorkflowFormHeaderStatus } from "../../../../components/custom/workflowFormHeaderStatus";
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

const PostCureHeader = ({
  batch,
  onBack,
  theme,
}: {
  batch?: any;
  onBack: () => void;
  theme: any;
  motorStatusById?: Record<
    string,
    { motorSubmissionStatus?: string | null; rejectionReason?: string | null }
  >;
  activeMotorId?: string | null;
}) => {
  // Per-motor rejection reason is shown under the motor card title, not in the form header.
  const headerStatus = resolveWorkflowFormHeaderStatus(batch, {
    preferredStatusKeys: ["pcStatus"],
  });

  return (
    <UserWorkflowFormHeader
      mode="update"
      data={{
        title: String(batch?.batchId ?? batch?.lotId ?? "—"),
        subtitle: formatMotorSubtitle(batch),
        statusLabel: headerStatus.statusLabel,
        statusVariant: headerStatus.statusVariant,
        rejectionReason: null,
      }}
      onBack={onBack}
      backLabel={S.FORM_HEADER.BACK_TO_LIST}
      rejectionTitle={S.FORM_HEADER.REJECTION_REASON}
      theme={theme}
    />
  );
};

export default PostCureHeader;
