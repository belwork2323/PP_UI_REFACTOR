import React, { useMemo } from "react";
import UserWorkflowFormHeader from "../../../../components/custom/UserWorkflowFormHeader";
import { resolveWorkflowFormHeaderStatus } from "../../../../components/custom/workflowFormHeaderStatus";
import { STRINGS } from "../../../../../app/config/strings";
import { useThemeStore } from "../../../../../app/store/themeStore";
import { getManufacturingTheme } from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";

const S = STRINGS.MANUFACTURING;

type Props = {
  batch: any;
  isEdit?: boolean;
  onBack: () => void;
};

const CastingAndCuringHeader: React.FC<Props> = ({ batch, onBack }) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const motorId = String(batch?.motorId ?? "").trim();
  const headerStatus = resolveWorkflowFormHeaderStatus(batch, {
    preferredStatusKeys: ["ccStatus"],
  });

  return (
    <UserWorkflowFormHeader
      mode="update"
      data={{
        title: String(batch?.batchId ?? batch?.lotId ?? "—"),
        subtitle: motorId && motorId !== "—" ? motorId : undefined,
        statusLabel: headerStatus.statusLabel,
        statusVariant: headerStatus.statusVariant,
        rejectionReason: headerStatus.rejectionReason,
      }}
      onBack={onBack}
      backLabel={S.FORM_HEADER.BACK_TO_LIST}
      rejectionTitle={S.FORM_HEADER.REJECTION_REASON}
      theme={theme}
    />
  );
};

export default CastingAndCuringHeader;
