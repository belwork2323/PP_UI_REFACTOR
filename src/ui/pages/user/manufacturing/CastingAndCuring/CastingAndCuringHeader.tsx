import React, { useMemo } from "react";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import { STRINGS } from "../../../../../app/config/strings";
import { useThemeStore } from "../../../../../app/store/themeStore";
import { getManufacturingTheme } from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";

const S = STRINGS.MANUFACTURING;

type Props = {
  batch: any;
  isEdit: boolean;
  onBack: () => void;
};

const CastingAndCuringHeader: React.FC<Props> = ({ batch, isEdit, onBack }) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const motorId = String(batch?.motorId ?? "").trim();

  return (
    <UserWorkflowFormHeader
      mode="update"
      data={{
        title: String(batch?.batchId ?? batch?.lotId ?? "—"),
        subtitle: motorId && motorId !== "—" ? motorId : undefined,
        statusLabel: isEdit ? S.FORM_HEADER.EDITING_REJECTED : S.CASTING_CURING.NEW_LABEL,
        statusVariant: isEdit ? "edit" : "new",
        rejectionReason: batch?.rejectionReason,
      }}
      onBack={onBack}
      backLabel={S.FORM_HEADER.BACK_TO_LIST}
      rejectionTitle={S.FORM_HEADER.REJECTION_REASON}
      theme={theme}
    />
  );
};

export default CastingAndCuringHeader;
