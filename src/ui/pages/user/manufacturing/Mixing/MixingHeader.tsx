import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import { resolveWorkflowFormHeaderStatus } from "../../../../components/custom/workflowFormHeaderStatus";
import { STRINGS } from "../../../../../app/config/strings";

const S = STRINGS.MANUFACTURING;

const MixingHeader = ({ batch, onBack, theme }: any) => {
  const motorId = String(batch?.motorId ?? "").trim();
  const headerStatus = resolveWorkflowFormHeaderStatus(batch, {
    preferredStatusKeys: ["mxStatus"],
  });

  return (
    <UserWorkflowFormHeader
      mode="update"
      data={{
        title: String(batch?.batchId ?? batch?.lotId ?? "—"),
        subtitle: motorId && motorId !== "—" ? motorId : undefined,
        statusLabel: headerStatus.statusLabel,
        statusVariant: headerStatus.statusVariant,
        // Per-mix-card rejection reason is shown under the mix card title.
        rejectionReason: null,
      }}
      onBack={onBack}
      backLabel={S.FORM_HEADER.BACK_TO_LIST}
      rejectionTitle={S.FORM_HEADER.REJECTION_REASON}
      theme={theme}
    />
  );
};

export default MixingHeader;
