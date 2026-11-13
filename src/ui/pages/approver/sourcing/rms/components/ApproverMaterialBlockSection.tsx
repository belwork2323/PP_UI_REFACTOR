import { useMemo } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";

import { STRINGS } from "@app/config/strings";
import { icons } from "@app/theme/icons";
import type { getRawMaterialSourcingApproverTheme } from "@app/theme/custom_themes/approver/sourcing/rms/rawMaterialSourcingApprover_theme";
import { formatDisplayDate } from "@utils/dateUtils";
import type { MaterialBlock } from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";
import DocumentAttachmentList from "@ui/components/custom/DocumentAttachmentList";
import SpecificationResultTable, {
  type SpecificationResultRow,
  type SpecificationResultTableStyles,
} from "@ui/components/custom/SpecificationResultTable";
import { toLotCertificateAttachments } from "@ui/pages/user/sourcing/rms/components/lotCertificateAttachments";
import LotPreparationDetails from "./LotPreparationDetails";

const BL = STRINGS.SOURCING.BATCH_LIST;
const SF = STRINGS.SOURCING.SPECIFICATION_FORM;
const { insertDriveFile: InsertDriveFileOutlinedIcon } = icons.user.sourcing.rawMaterialBatchList;

type ApproverMaterialBlockSectionProps = {
  block: MaterialBlock;
  isLast: boolean;
  theme: ReturnType<typeof getRawMaterialSourcingApproverTheme>;
  subDepartmentId?: number | null;
  openFile: (fileId: string, subDepartmentId: number, fileName?: string) => unknown;
};

/** One material lot inside the approver details dialog: meta line, preparation, specs, certificates. */
const ApproverMaterialBlockSection = ({
  block,
  isLast,
  theme,
  subDepartmentId,
  openFile,
}: ApproverMaterialBlockSectionProps) => {
  const { dialog, chips } = theme;

  const styles = useMemo<SpecificationResultTableStyles>(
    () => ({
      container: dialog.innerTableContainer,
      headerCell: (columnIndex) => dialog.innerHeaderCell(columnIndex === 0),
      row: (index) => dialog.innerRow(index),
      refChip: chips.refRange,
      cells: {
        specification: dialog.innerSpecText,
        refRange: dialog.innerCell,
        analysedResult: () => dialog.innerResultText,
        acemQcResult: dialog.innerRemarksText,
      },
    }),
    [dialog, chips],
  );

  const leadingColumns = useMemo(
    () => [
      {
        key: "material",
        header: "Material",
        cellSx: dialog.innerCell,
        render: (_row: SpecificationResultRow, index: number) =>
          index === 0 ? (
            <Chip label={block.material} size="small" sx={chips.inlineMaterial} />
          ) : null,
      },
      {
        key: "lotNo",
        header: "Man. Lot/Batch No.",
        cellSx: dialog.innerLotText,
        render: (_row: SpecificationResultRow, index: number) =>
          index === 0 ? block.lotNo || "—" : "",
      },
    ],
    [block.material, block.lotNo, dialog, chips],
  );

  const rows = useMemo<SpecificationResultRow[]>(
    () =>
      block.rows.map((row: any, index: number) => ({
        key: String(index),
        specification: row.specification,
        refRange: row.refRange,
        analysedResult: row.analysedResult,
        acemQcResult: row.acemQcResult,
      })),
    [block.rows],
  );

  const attachments = useMemo(
    () =>
      toLotCertificateAttachments(block.certificates ?? [], {
        subDepartmentId,
        openFile,
        resolveFileName: (cert) => cert.fileName || "Document",
      }),
    [block.certificates, subDepartmentId, openFile],
  );

  const metaItems = [
    { label: "SUPPLY ORDER NO", value: block.supplyOrderNo || "-" },
    { label: "MANUFACTURER", value: block.manufacturerName || "-" },
    { label: "RECEIPT DATE ", value: formatDisplayDate(block.receiptDate, "-") },
  ];

  return (
    <Box sx={dialog.blockWrapper(isLast)}>
      <Stack direction="row" alignItems="center" gap={1} mb={1}>
        <Chip label={block.material} size="small" sx={chips.material} />
        <Typography sx={dialog.blockMeta}>
          Man. Lot/Batch No.:{" "}
          <Box component="span" sx={dialog.blockMetaStrong}>
            {block.lotNo || "—"}
          </Box>
        </Typography>
      </Stack>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} mb={1}>
        {metaItems.map((item) => (
          <Typography key={item.label} sx={dialog.blockMeta}>
            {item.label}:{" "}
            <Box component="span" sx={dialog.blockMetaStrong}>
              {item.value}
            </Box>
          </Typography>
        ))}
      </Stack>
      <LotPreparationDetails block={block} palette={theme.palette} />
      <SpecificationResultTable rows={rows} styles={styles} leadingColumns={leadingColumns} />

      {attachments.length ? (
        <Box sx={dialog.certificatesSection}>
          <Typography sx={dialog.certificatesTitle}>
            <InsertDriveFileOutlinedIcon sx={dialog.certificatesTitleIcon} />
            {BL.LOT_DETAILS_CERTIFICATES_SECTION}
          </Typography>
          <DocumentAttachmentList items={attachments} palette={theme.palette} typeLabel={SF.CERT_TYPE} />
        </Box>
      ) : null}
    </Box>
  );
};

export default ApproverMaterialBlockSection;
