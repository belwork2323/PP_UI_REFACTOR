import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { STRINGS } from "../../../../../app/config/strings";
import { MIXING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";
import { isQuadObservedLayout } from "../../../../../hooks/user/manufacturing/mixingConfig";
import type { QualityCheckRow } from "../../../../../data/models/user/MixingFormModel";
import { MixingTableInput } from "./MixingFormFields";

const S = STRINGS.MANUFACTURING.MIXING;
const BRAND = MIXING_BRAND;
const observedGroupBorder = `2px solid ${alpha(BRAND.mx, 0.22)}`;
const QUALITY_OBSERVED_COLS = 4;

const TH = styled(TableCell)({
  background: "linear-gradient(135deg, #1565C0, #1976D2)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.7rem",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  padding: "11px 14px",
  whiteSpace: "nowrap",
  borderBottom: "none",
  verticalAlign: "middle",
});

const TD = styled(TableCell)({
  padding: "10px 12px",
  borderBottom: "1px solid rgba(213,216,220,0.5)",
  verticalAlign: "middle",
});

const tableShellSx = {
  overflowX: "auto" as const,
  border: `1px solid ${alpha(BRAND.border, 0.85)}`,
  borderRadius: 2,
  background: "#fff",
};

const SpecificationCell = ({ value }: { value: string }) =>
  value ? (
    <Box
      sx={{
        display: "inline-flex",
        px: 1.1,
        py: 0.45,
        borderRadius: 1,
        background: alpha(BRAND.mx, 0.08),
        border: `1px solid ${alpha(BRAND.mx, 0.22)}`,
      }}
    >
      <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: BRAND.mx }}>{value}</Typography>
    </Box>
  ) : (
    <Typography sx={{ fontSize: "0.76rem", color: BRAND.textSub, fontStyle: "italic" }}>
      {S.PLACEHOLDER_SPEC_NA}
    </Typography>
  );

type MixingQualityChecksTableProps = {
  rows: QualityCheckRow[];
  onChange: (
    parameter: string,
    field: "observed1" | "observed2" | "observed3" | "observed4",
    value: string,
  ) => void;
};

const MixingQualityChecksTable = ({ rows, onChange }: MixingQualityChecksTableProps) => (
  <TableContainer sx={tableShellSx}>
    <Table size="small" sx={{ minWidth: 720, tableLayout: "fixed" }}>
      <colgroup>
        <col style={{ width: "22%" }} />
        <col style={{ width: "16%" }} />
        <col style={{ width: "15.5%" }} />
        <col style={{ width: "15.5%" }} />
        <col style={{ width: "15.5%" }} />
        <col style={{ width: "15.5%" }} />
      </colgroup>
      <TableHead>
        <TableRow>
          <TH sx={{ minWidth: 140 }}>{S.COL_PARAMETER}</TH>
          <TH sx={{ minWidth: 120 }}>{S.COL_SPECIFICATION}</TH>
          <TH colSpan={QUALITY_OBSERVED_COLS} align="center" sx={{ borderLeft: observedGroupBorder }}>
            {S.COL_OBSERVED_VALUES}
          </TH>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, rowIdx) => (
          <TableRow
            key={row.parameter}
            sx={{ background: rowIdx % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.55) }}
          >
            <TD>
              <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: BRAND.text }}>
                {row.parameter}
              </Typography>
            </TD>
            <TD>
              <SpecificationCell value={row.specification} />
            </TD>
            {isQuadObservedLayout(row.observedLayout) ? (
              (["observed1", "observed2", "observed3", "observed4"] as const).map((field, index) => (
                <TD
                  key={field}
                  sx={{
                    borderLeft: index === 0 ? observedGroupBorder : `1px solid ${alpha(BRAND.border, 0.45)}`,
                    background: alpha(BRAND.mx, 0.02),
                  }}
                >
                  <MixingTableInput
                    value={row[field]}
                    placeholder={S.PLACEHOLDER_OBSERVED_VALUE}
                    onChange={(value) => onChange(row.parameter, field, value)}
                  />
                </TD>
              ))
            ) : (
              <TD
                colSpan={QUALITY_OBSERVED_COLS}
                sx={{ borderLeft: observedGroupBorder, background: alpha(BRAND.mx, 0.02) }}
              >
                <MixingTableInput
                  value={row.observed1}
                  placeholder={S.PLACEHOLDER_OBSERVED_VALUE}
                  onChange={(value) => onChange(row.parameter, "observed1", value)}
                />
              </TD>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export default MixingQualityChecksTable;
