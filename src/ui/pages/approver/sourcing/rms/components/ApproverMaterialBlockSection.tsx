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
import WorkflowDetailsSection from "@ui/components/custom/WorkflowDetailsSection";
import { toLotCertificateAttachments } from "@ui/pages/user/sourcing/rms/components/lotCertificateAttachments";
import LotPreparationDetails from "./LotPreparationDetails";

const BL = STRINGS.SOURCING.BATCH_LIST;
const SF = STRINGS.SOURCING.SPECIFICATION_FORM;
const {
  insertDriveFile: InsertDriveFileOutlinedIcon,
  visibility: VisibilityRoundedIcon,
} = icons.user.sourcing.rawMaterialBatchList;

type ApproverMaterialBlockSectionProps = {
  block: MaterialBlock;
  isLast: boolean;
  theme: ReturnType<typeof getRawMaterialSourcingApproverTheme>;
  subDepartmentId?: number | null;
  openFile: (fileId: string, subDepartmentId: number, fileName?: string) => unknown;
};

/** One material lot inside Approver details: meta, preparation, specs, certificates. */
const ApproverMaterialBlockSection = ({
  block,
  isLast,
  theme,
  subDepartmentId,
  openFile,
}: ApproverMaterialBlockSectionProps) => {
  const rmTheme = theme.lotDetails;
  const { dialog, chips, palette } = theme;

  const styles = useMemo<SpecificationResultTableStyles>(
    () => ({
      container: rmTheme.tableContainer,
      headerCell: rmTheme.tableHeaderCell,
      row: (index, failed) => rmTheme.tableRow(index, failed),
      refChip: rmTheme.refChip,
      cells: {
        specification: { ...rmTheme.tableCell, ...rmTheme.specText },
        refRange: rmTheme.tableCell,
        analysedResult: (failed) => ({
          ...rmTheme.tableCell,
          ...(failed ? rmTheme.failedResult : rmTheme.resultText),
        }),
        acemQcResult: { ...rmTheme.tableCell, ...rmTheme.remarksText },
      },
    }),
    [rmTheme],
  );

  const leadingColumns = useMemo(
    () => [
      {
        key: "material",
        header: "Material",
        cellSx: rmTheme.tableCell,
        render: (_row: SpecificationResultRow, index: number) =>
          index === 0 ? (
            <Chip label={block.material} size="small" sx={chips.inlineMaterial} />
          ) : null,
      },
      {
        key: "lotNo",
        header: "Lot ID / Lot No.",
        cellSx: { ...rmTheme.tableCell, color: palette.textSub },
        render: (_row: SpecificationResultRow, index: number) =>
          index === 0 ? block.lotNo || "—" : "",
      },
    ],
    [block.material, block.lotNo, rmTheme, chips, palette.textSub],
  );

  const rows = useMemo<SpecificationResultRow[]>(
    () =>
      block.rows.map((row: any, index: number) => ({
        key: String(index),
        specification: row.specification,
        refRange: row.refRange,
        analysedResult: row.analysedResult,
        acemQcResult: row.acemQcResult,
        failed: Boolean(row.isOutOfRange),
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
          Lot ID / Lot No.:{" "}
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

      <WorkflowDetailsSection
        dt={rmTheme}
        title={BL.LOT_DETAILS_SPEC_SECTION}
        icon={VisibilityRoundedIcon}
      >
        {rows.length ? (
          <SpecificationResultTable rows={rows} styles={styles} leadingColumns={leadingColumns} />
        ) : (
          <Typography sx={rmTheme.emptyText}>{BL.LOT_DETAILS_EMPTY}</Typography>
        )}
      </WorkflowDetailsSection>

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
