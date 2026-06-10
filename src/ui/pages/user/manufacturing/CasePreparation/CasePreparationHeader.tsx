import { Chip } from "@mui/material";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import { STRINGS } from "../../../../../app/config/strings";
import { motorStageLabel } from "../../../../../data/models/admin/BatchManagementModel";
import { getBatchScaleLabel } from "../../../../../hooks/user/manufacturing/rawMaterialPrepFlowConfig";

const S = STRINGS.MANUFACTURING;

const CasePreparationHeader = ({ batch, isEdit, onBack, theme }: any) => {
  const motorStage = motorStageLabel(batch?.motorStage ?? batch?.motorType);
  const batchTypeLabel = getBatchScaleLabel(batch?.batchType);

  return (
    <UserWorkflowFormHeader
      batch={batch}
      isEdit={isEdit}
      onBack={onBack}
      newLabel={S.CASE_PREP.NEW_LABEL}
      backLabel={S.FORM_HEADER.BACK_TO_LIST}
      editLabel={S.FORM_HEADER.EDITING_REJECTED}
      rejectionTitle={S.FORM_HEADER.REJECTION_REASON}
      batchHeadingOverride={{
        title: batch?.batchId ?? batch?.lotId ?? "—",
        subtitle: [batch?.motorId, motorStage !== "—" ? motorStage : null].filter(Boolean).join(" · "),
      }}
      additionalChips={
        batch?.batchType ? (
          <Chip label={batchTypeLabel} size="small" sx={theme.batchList.batchTypeChip} />
        ) : null
      }
      theme={theme}
    />
  );
};

export default CasePreparationHeader;
