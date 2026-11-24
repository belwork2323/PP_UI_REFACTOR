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
  motorStatusById?: Record<
    string,
    { motorSubmissionStatus?: string | null; rejectionReason?: string | null }
  >;
  activeMotorId?: string | null;
};

const CastingAndCuringHeader: React.FC<Props> = ({
  batch,
  onBack,
  activeMotorId,
}) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const motorId = String(activeMotorId ?? batch?.motorId ?? "").trim();
  // Per-motor rejection reason is shown under the motor card title, not in the form header.
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
        rejectionReason: null,
      }}
      onBack={onBack}
      backLabel={S.FORM_HEADER.BACK_TO_LIST}
      rejectionTitle={S.FORM_HEADER.REJECTION_REASON}
      theme={theme}
    />
  );
};

export default CastingAndCuringHeader;
