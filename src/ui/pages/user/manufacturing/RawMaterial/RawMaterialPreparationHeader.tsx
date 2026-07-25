import { Chip } from "@mui/material";
import { STRINGS } from "../../../../../app/config/strings";
import { getBatchScaleLabel } from "../../../../../hooks/user/manufacturing/rawMaterialPrepFlowConfig";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";

const RM = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP;
const S = STRINGS.MANUFACTURING;

const RawMaterialPreparationHeader = ({ batch, isEdit, onBack, theme }: any) => {
  const rmTheme = theme.manufacturing.rawMaterialPrep;
  const scaleLabel = getBatchScaleLabel(batch.batchType);
  const motorId = String(batch.motorId ?? "").trim();

  return (
    <UserWorkflowFormHeader
      mode="update"
      data={{
        title: String(batch.batchId ?? batch.lotId ?? "—"),
        subtitle: motorId && motorId !== "—" ? motorId : undefined,
        statusLabel: isEdit ? S.FORM_HEADER.EDITING_REJECTED : RM.NEW_LABEL,
        statusVariant: isEdit ? "edit" : "new",
        rejectionReason: batch.rejectionReason,
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
