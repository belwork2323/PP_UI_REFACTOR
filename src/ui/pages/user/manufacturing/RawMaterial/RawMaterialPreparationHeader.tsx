import { Chip } from "@mui/material";
import { STRINGS } from "../../../../../app/config/strings";
import { getBatchScaleLabel } from "../../../../../hooks/user/manufacturing/rawMaterialPrepFlowConfig";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import { resolveWorkflowFormHeaderStatus } from "../../../../components/custom/workflowFormHeaderStatus";

const S = STRINGS.MANUFACTURING;

const RawMaterialPreparationHeader = ({ batch, onBack, theme }: any) => {
  const rmTheme = theme.manufacturing.rawMaterialPrep;
  const scaleLabel = getBatchScaleLabel(batch.batchType);
  const motorId = String(batch.motorId ?? "").trim();
  const headerStatus = resolveWorkflowFormHeaderStatus(batch, {
    preferredStatusKeys: ["rmStatus"],
  });

  return (
    <UserWorkflowFormHeader
      mode="update"
      data={{
        title: String(batch.batchId ?? batch.lotId ?? "—"),
        subtitle: motorId && motorId !== "—" ? motorId : undefined,
        statusLabel: headerStatus.statusLabel,
        statusVariant: headerStatus.statusVariant,
        rejectionReason: headerStatus.rejectionReason,
        extraChips: batch.batchType ? (
          <Chip label={scaleLabel} size="small" sx={rmTheme.header.scaleChip(theme.palette.primary)} />
        ) : null,
      }}
      onBack={onBack}
      backLabel={S.FORM_HEADER.BACK_TO_LIST}
      rejectionTitle={S.FORM_HEADER.REJECTION_REASON}
      theme={theme}
    />
  );
};

export default RawMaterialPreparationHeader;
