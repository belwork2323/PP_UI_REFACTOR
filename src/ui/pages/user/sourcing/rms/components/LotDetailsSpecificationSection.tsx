import { useMemo } from "react";
import { Typography } from "@mui/material";

import { STRINGS } from "@app/config/strings";
import { icons } from "@app/theme/icons";
import type { getRawMaterialSourcingPageTheme } from "@app/theme/custom_themes/user/sourcing/rms/rawMaterialSourcing_theme";
import {
  formatSpecStatusDisplayLabel,
  type MaterialBlock,
} from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";
import SpecificationResultTable, {
  type SpecificationResultRow,
  type SpecificationResultTableStyles,
} from "@ui/components/custom/SpecificationResultTable";
import WorkflowDetailsSection from "@ui/components/custom/WorkflowDetailsSection";

const BL = STRINGS.SOURCING.BATCH_LIST;
const { visibility: VisibilityRoundedIcon } = icons.user.sourcing.rawMaterialBatchList;

type LotDetailsSpecificationSectionProps = {
  block?: MaterialBlock;
  theme: ReturnType<typeof getRawMaterialSourcingPageTheme>;
};

const LotDetailsSpecificationSection = ({ block, theme }: LotDetailsSpecificationSectionProps) => {
  const rmTheme = theme.sourcing.rawMaterial.lotDetails;

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
        status: rmTheme.tableCell,
      },
      statusChip: rmTheme.specStatusChip,
    }),
    [rmTheme],
  );

  const rows = useMemo<SpecificationResultRow[]>(
    () =>
      (block?.rows ?? []).map((specRow, index) => ({
        key: `${specRow.specificationCode ?? index}`,
        specification: specRow.specification || specRow.specificationName || "—",
        refRange: specRow.refRange || "—",
        analysedResult: specRow.analysedResult,
        acemQcResult: specRow.acemQcResult,
        failed: Boolean(specRow.isOutOfRange),
        statusLabel: formatSpecStatusDisplayLabel(specRow.status, specRow.isOutOfRange),
      })),
    [block],
  );

  return (
    <WorkflowDetailsSection
      dt={rmTheme}
      title={BL.LOT_DETAILS_SPEC_SECTION}
      icon={VisibilityRoundedIcon}
    >
      {rows.length ? (
        <SpecificationResultTable rows={rows} styles={styles} showStatus />
      ) : (
        <Typography sx={rmTheme.emptyText}>{BL.LOT_DETAILS_EMPTY}</Typography>
      )}
    </WorkflowDetailsSection>
  );
};

export default LotDetailsSpecificationSection;
