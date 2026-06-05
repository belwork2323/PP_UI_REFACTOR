import React from "react";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import { STRINGS } from "../../../../../app/config/strings";
import { useThemeStore } from "../../../../../app/store/themeStore";
import { getManufacturingTheme } from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { useMemo } from "react";

const S = STRINGS.MANUFACTURING;

type Props = {
  batch: any;
  isEdit: boolean;
  onBack: () => void;
};

const CastingAndCuringHeader: React.FC<Props> = ({ batch, isEdit, onBack }) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);

  return (
    <UserWorkflowFormHeader
      batch={batch}
      isEdit={isEdit}
      onBack={onBack}
      newLabel={S.CASTING_CURING.NEW_LABEL}
      backLabel={S.FORM_HEADER.BACK_TO_LIST}
      editLabel={S.FORM_HEADER.EDITING_REJECTED}
      rejectionTitle={S.FORM_HEADER.REJECTION_REASON}
      theme={theme}
    />
  );
};

export default CastingAndCuringHeader;
