import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import { STRINGS } from "../../../../../app/config/strings";
import { resolveTrimmingMotorStage } from "../../../../../schema-engine";

const S = STRINGS.MANUFACTURING;

const TrimmingHeader = ({ batch, isEdit, onBack, theme }: any) => {
  const motorStage = resolveTrimmingMotorStage(batch);

  return (
    <UserWorkflowFormHeader
      batch={batch}
      isEdit={isEdit}
      onBack={onBack}
      newLabel={S.TRIMMING.NEW_LABEL}
      backLabel={S.FORM_HEADER.BACK_TO_LIST}
      editLabel={S.FORM_HEADER.EDITING_REJECTED}
      rejectionTitle={S.FORM_HEADER.REJECTION_REASON}
      batchHeadingOverride={{
        title: batch?.batchId ?? batch?.lotId ?? "—",
        subtitle: batch?.motorId
          ? `${S.TRIMMING.MOTOR_STAGE_LABEL} ${motorStage} · ${batch.motorId}`
          : `${S.TRIMMING.MOTOR_STAGE_LABEL} ${motorStage}`,
      }}
      theme={theme}
    />
  );
};

export default TrimmingHeader;
