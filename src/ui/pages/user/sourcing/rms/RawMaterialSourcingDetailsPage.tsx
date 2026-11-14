import { useMemo } from "react";
import { icons } from "@app/theme/icons";
import { useThemeStore } from "@app/store/themeStore";
import { getRawMaterialSourcingPageTheme } from "@app/theme/custom_themes/user/sourcing/rms/rawMaterialSourcing_theme";
import { STRINGS } from "@app/config/strings";
import { getOperationStatusConfig } from "@hooks/operationStatus";
import UserWorkflowDetailsShell from "@ui/components/custom/UserWorkflowDetailsShell";
import WorkflowDetailsMetaSection from "@ui/components/custom/WorkflowDetailsMetaSection";
import useWorkflowDetailsStatusConfig from "@ui/components/custom/useWorkflowDetailsStatusConfig";
import type {
  MaterialBlock,
  RawMaterialLotDetailsContext,
} from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";
import { useFilePreview } from "@hooks/useFilePreview";
import FilePreviewDialog from "@ui/components/common/FilePreviewDialog";
import { formatDisplayDate, formatDisplayDateTime } from "@utils/dateUtils";
import LotDetailsSpecificationSection from "./components/LotDetailsSpecificationSection";
import LotDetailsCertificatesSection from "./components/LotDetailsCertificatesSection";

const BL = STRINGS.SOURCING.BATCH_LIST;
const FH = STRINGS.MANUFACTURING.FORM_HEADER;

const {
  inventory: InventoryRoundedIcon,
  description: DescriptionRoundedIcon,
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
} = icons.user.sourcing.rawMaterialBatchList;

const STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

type RawMaterialSourcingDetailsPageProps = {
  row: RawMaterialLotDetailsContext;
  blocks: MaterialBlock[];
  loading: boolean;
  onBack: () => void;
};

const RawMaterialSourcingDetailsPage = ({
  row,
  blocks,
  loading,
  onBack,
}: RawMaterialSourcingDetailsPageProps) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getRawMaterialSourcingPageTheme(mode), [mode]);
  const dt = theme.sourcing.rawMaterial.lotDetails;
  const { preview, openFile, closePreview, downloadCurrent } = useFilePreview();

  const statusConfig = useWorkflowDetailsStatusConfig(STATUS_CONFIG, dt.bannerStatusConfig);

  const block = blocks[0];
  const metaFields = [
    { label: BL.COL_LOT_ID, value: row.lotId },
    { label: BL.COL_SOURCING_ID, value: row.sourcingId || "—" },
    { label: BL.COL_MATERIAL_CODE, value: row.materialCode || block?.material || "—" },
    { label: BL.COL_MATERIAL_NAME, value: row.materialName || "—" },
    { label: BL.COL_SUPPLY_ORDER, value: block?.supplyOrderNo || row.supplyOrderNo || "—" },
    {
      label: BL.COL_RECEIPT_DATE,
      value: formatDisplayDate(block?.receiptDate || row.receiptDate),
    },
    { label: BL.COL_MANUFACTURER, value: block?.manufacturerName || row.manufacturerName || "—" },
    {
      label: BL.COL_CREATED_BY,
      value: row.createdBy?.fullName ?? BL.UNASSIGNED,
    },
    {
      label: BL.COL_CREATED_ON,
      value: formatDisplayDateTime(row.createdOn, row.createdOn || "—"),
    },
  ];

  const subtitle = `${row.lotId}${
    row.materialName || row.materialCode
      ? ` · ${row.materialName || row.materialCode}`
      : ""
  }`;

  return (
    <>
      <UserWorkflowDetailsShell
        dt={dt}
        theme={theme}
        title={BL.LOT_DETAILS_TITLE}
        subtitle={subtitle}
        icon={InventoryRoundedIcon}
        status={row.rmStatus}
        statusConfig={statusConfig}
        rejectionReason={row.rejectionReason ?? null}
        onBack={onBack}
        backLabel={FH.BACK_TO_LIST}
        loading={loading}
        loadingText={BL.LOT_DETAILS_LOADING}
      >
        <WorkflowDetailsMetaSection
          dt={dt}
          title={BL.LOT_DETAILS_PROCUREMENT_SECTION}
          icon={DescriptionRoundedIcon}
          fields={metaFields}
        />

        <LotDetailsSpecificationSection block={block} theme={theme} />
        <LotDetailsCertificatesSection
          certificates={block?.certificates}
          theme={theme}
          openFile={openFile}
        />
      </UserWorkflowDetailsShell>

      <FilePreviewDialog
        preview={preview}
        onClose={closePreview}
        onDownload={downloadCurrent}
        themeColor={theme.palette.primary}
        themeColorLight={theme.palette.primaryLight}
      />
    </>
  );
};

export default RawMaterialSourcingDetailsPage;
