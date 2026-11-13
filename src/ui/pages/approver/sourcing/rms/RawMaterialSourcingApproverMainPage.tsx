import { useMemo } from "react";

import { useThemeStore } from "@app/store/themeStore";
import { getRawMaterialSourcingApproverTheme } from "@app/theme/custom_themes/approver/sourcing/rms/rawMaterialSourcingApprover_theme";
import { useRawMaterialSourcingApproverList } from "@hooks/approver/sourcing/rms/useRawMaterialSourcingApproverList";
import { useRawMaterialSourcingApproverDetails } from "@hooks/approver/sourcing/rms/useRawMaterialSourcingApproverDetails";
import ApproverActionDialog from "@ui/components/custom/ApproverActionDialog";
import RawMaterialSourcingApproverListPage from "./RawMaterialSourcingApproverListPage";
import RawMaterialSourcingApproverDetailsPage from "./RawMaterialSourcingApproverDetailsPage";

const RawMaterialSourcingApproverMainPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getRawMaterialSourcingApproverTheme(mode), [mode]);

  const list = useRawMaterialSourcingApproverList();
  const {
    selected,
    detailsLoading,
    dialogProps,
    requestApprove,
    requestReject,
    handleViewDetails,
    handleCloseDetail,
  } = useRawMaterialSourcingApproverDetails();

  return (
    <RawMaterialSourcingApproverListPage
      list={list}
      theme={theme}
      onViewDetails={handleViewDetails}
      overlays={
        <>
          <RawMaterialSourcingApproverDetailsPage
            open={!!selected}
            onClose={handleCloseDetail}
            item={selected}
            loading={detailsLoading}
            onApprove={requestApprove}
            onReject={requestReject}
            theme={theme}
          />

          <ApproverActionDialog {...dialogProps} />
        </>
      }
    />
  );
};

export default RawMaterialSourcingApproverMainPage;
