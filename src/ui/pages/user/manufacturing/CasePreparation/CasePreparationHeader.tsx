import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import { STRINGS } from "../../../../../app/config/strings";

const S = STRINGS.MANUFACTURING;

const CasePreparationHeader = ({ batch, isEdit, onBack, theme }: any) => {
  return (
    <UserWorkflowFormHeader
      batch={batch}
      isEdit={isEdit}
      onBack={onBack}
      newLabel={S.CASE_PREP.NEW_LABEL}
      backLabel={S.FORM_HEADER.BACK_TO_LIST}
      editLabel={S.FORM_HEADER.EDITING_REJECTED}
      rejectionTitle={S.FORM_HEADER.REJECTION_REASON}
      theme={theme}
    />
  );
};

export default CasePreparationHeader;
