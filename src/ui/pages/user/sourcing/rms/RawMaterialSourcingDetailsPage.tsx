import { useMemo } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { icons } from "@app/theme/icons";
import { useThemeStore } from "@app/store/themeStore";
import { getRawMaterialSourcingPageTheme } from "@app/theme/custom_themes/user/sourcing/rms/rawMaterialSourcing_theme";
import { STRINGS } from "@app/config/strings";
import { getOperationStatusConfig, OPERATION_STATUS } from "@hooks/operationStatus";
import UserWorkflowStatusCell from "@ui/components/custom/UserWorkflowStatusCell";
import AppButton from "@ui/components/common/Button";
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
  const rmTheme = theme.sourcing.rawMaterial.lotDetails;
  const { preview, openFile, closePreview, downloadCurrent } = useFilePreview();

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(STATUS_CONFIG).map(([status, cfg]) => [
          status,
          { ...cfg, ...theme.batchList.statusConfig[status] },
        ]),
      ),
    [theme],
  );

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

  return (
    <Box sx={rmTheme.page}>
      <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
        <AppButton
          variant="text"
          size="small"
          fullWidth={false}
          startIcon={<ArrowBackRoundedIcon />}
          onClick={onBack}
          sx={theme.workflow.formHeader.backButton}
        >
          {FH.BACK_TO_LIST}
        </AppButton>
      </Stack>

      <Box sx={rmTheme.document}>
        <Box sx={rmTheme.banner}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ sm: "center" }}
            justifyContent="space-between"
            gap={2}
          >
            <Stack direction="row" alignItems="flex-start" gap={1.5}>
              <InventoryRoundedIcon sx={rmTheme.bannerIcon} />
              <Box>
                <Typography sx={rmTheme.bannerTitle}>{BL.LOT_DETAILS_TITLE}</Typography>
                <Typography sx={rmTheme.bannerSubtitle}>
                  {row.lotId}
                  {row.materialName || row.materialCode
                    ? ` · ${row.materialName || row.materialCode}`
                    : ""}
                </Typography>
              </Box>
            </Stack>
            <UserWorkflowStatusCell
              status={row.rmStatus}
              statusConfig={statusConfig}
              rejectedStatus={OPERATION_STATUS.REJECTED}
              rejectionReason={row.rejectionReason ?? null}
              theme={theme}
            />
          </Stack>
        </Box>

        <Box sx={rmTheme.body}>
          {loading ? (
            <Box sx={rmTheme.loadingBox}>
              <CircularProgress size={36} sx={{ color: theme.palette.primaryLight }} />
              <Typography sx={rmTheme.emptyText}>{BL.LOT_DETAILS_LOADING}</Typography>
            </Box>
          ) : (
            <>
              <Box sx={rmTheme.section}>
                <Typography sx={rmTheme.sectionTitle}>
                  <DescriptionRoundedIcon sx={rmTheme.sectionTitleIcon} />
                  {BL.LOT_DETAILS_PROCUREMENT_SECTION}
                </Typography>
                <Box sx={rmTheme.metaGrid}>
                  {metaFields.map((field) => (
                    <Box key={field.label} sx={rmTheme.metaItem}>
                      <Typography sx={rmTheme.metaLabel}>{field.label}</Typography>
                      <Typography sx={rmTheme.metaValue}>{field.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              <LotDetailsSpecificationSection block={block} theme={theme} />
              <LotDetailsCertificatesSection
                certificates={block?.certificates}
                theme={theme}
                openFile={openFile}
              />
            </>
          )}
        </Box>
      </Box>

      <FilePreviewDialog
        preview={preview}
        onClose={closePreview}
        onDownload={downloadCurrent}
        themeColor={theme.palette.primary}
        themeColorLight={theme.palette.primaryLight}
      />
    </Box>
  );
};

export default RawMaterialSourcingDetailsPage;
