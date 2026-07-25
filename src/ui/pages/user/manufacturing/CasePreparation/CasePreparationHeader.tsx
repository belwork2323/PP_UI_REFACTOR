import { Chip } from "@mui/material";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import { STRINGS } from "../../../../../app/config/strings";
import { getBatchScaleLabel } from "../../../../../hooks/user/manufacturing/rawMaterialPrepFlowConfig";

const S = STRINGS.MANUFACTURING;

const CasePreparationHeader = ({ batch, isEdit, onBack, theme }: any) => {
  const batchTypeLabel = getBatchScaleLabel(batch?.batchType);
  const motorId = String(batch?.motorId ?? "").trim();

  return (
    <UserWorkflowFormHeader
      mode="update"
      data={{
        title: String(batch?.batchId ?? batch?.lotId ?? "—"),
        subtitle: motorId && motorId !== "—" ? motorId : undefined,
        statusLabel: isEdit ? S.FORM_HEADER.EDITING_REJECTED : S.CASE_PREP.NEW_LABEL,
        statusVariant: isEdit ? "edit" : "new",
        rejectionReason: batch?.rejectionReason,
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
