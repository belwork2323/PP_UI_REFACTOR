import { Chip } from "@mui/material";
import { STRINGS } from "../../../../../app/config/strings";
import { getBatchScaleLabel } from "../../../../../hooks/user/manufacturing/rawMaterialPrepFlowConfig";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";

const RM = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP;
const S = STRINGS.MANUFACTURING;

const RawMaterialPreparationHeader = ({ batch, isEdit, onBack, theme }: any) => {
  const rmTheme = theme.manufacturing.rawMaterialPrep;
  const scaleLabel = getBatchScaleLabel(batch.batchType);

  return (
    <UserWorkflowFormHeader
      batch={batch}
      isEdit={isEdit}
      onBack={onBack}
      newLabel={RM.NEW_LABEL}
      backLabel={S.FORM_HEADER.BACK_TO_LIST}
      editLabel={S.FORM_HEADER.EDITING_REJECTED}
      rejectionTitle={S.FORM_HEADER.REJECTION_REASON}
      batchHeadingOverride={{
        title: batch.batchId ?? batch.lotId,
        subtitle: `${batch.motorId}${batch.motorType ? ` · Type ${batch.motorType}` : ""}`,
      }}
      additionalChips={
        batch.batchType ? (
          <Chip label={scaleLabel} size="small" sx={rmTheme.header.scaleChip(theme.palette.primary)} />
        ) : null
      }
      headerContentSx={rmTheme.header.contentPadding}
      theme={theme}
    />
  );
};

export default RawMaterialPreparationHeader;
