import { Chip } from "@mui/material";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import { resolveWorkflowFormHeaderStatus } from "../../../../components/custom/workflowFormHeaderStatus";
import { STRINGS } from "../../../../../app/config/strings";
import { getBatchScaleLabel } from "../../../../../hooks/user/manufacturing/rawMaterialPrepFlowConfig";
import type { MotorStatusMeta } from "../../../../../data/models/user/CasePreparationFormModel";

const S = STRINGS.MANUFACTURING;

const CasePreparationHeader = ({
  batch,
  onBack,
  theme,
  activeMotorId,
}: {
  batch?: Record<string, unknown> | null;
  onBack: () => void;
  theme: any;
  motorStatusById?: Record<string, MotorStatusMeta>;
  activeMotorId?: string | null;
}) => {
  const batchTypeLabel = getBatchScaleLabel(batch?.batchType as string | undefined);
  const motorId = String(activeMotorId ?? batch?.motorId ?? "").trim();
  // Per-motor rejection reason is shown under the motor card title, not in the form header.
  const headerStatus = resolveWorkflowFormHeaderStatus(batch, {
    preferredStatusKeys: ["cpStatus"],
  });

  return (
    <UserWorkflowFormHeader
      mode="update"
      data={{
        title: String(batch?.batchId ?? batch?.lotId ?? "—"),
        subtitle: motorId && motorId !== "—" ? motorId : undefined,
        statusLabel: headerStatus.statusLabel,
        statusVariant: headerStatus.statusVariant,
        rejectionReason: null,
        extraChips: batch?.batchType ? (
          <Chip label={batchTypeLabel} size="small" sx={theme.batchList.batchTypeChip} />
        ) : null,
      }}
      onBack={onBack}
      backLabel={S.FORM_HEADER.BACK_TO_LIST}
      rejectionTitle={S.FORM_HEADER.REJECTION_REASON}
      theme={theme}
    />
  );
};

export default CasePreparationHeader;
