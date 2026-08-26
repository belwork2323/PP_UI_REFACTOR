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
import { STRINGS } from "../../../../../app/config/strings";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type { SchemaFormValues } from "../../../../../schema-engine";
import QCDivisionFileField from "./QCDivisionFileField";
import {
  QC_HARDWARE_UPLOAD_GRAPH_KEY,
  QC_HARDWARE_UPLOAD_PHOTO_KEY,
  QC_HARDWARE_UPLOAD_REPORT_KEY,
  QC_HARDWARE_UPLOAD_TYPES,
  getHardwareUploadValues,
  setHardwareUploadValue,
  type QcHardwareUploadType,
} from "../../../../../hooks/user/qualityControl/qcHardwareTables";
import {
  QCDivisionReadOnlyValue,
  qcReadOnlyBodyCellSx,
  qcReadOnlyTableContainerSx,
  qcReadOnlyTableHeaderCellSx,
} from "./components/QCDivisionReadOnlyValue";
import { uniformTableHeaderCellSx } from "@app/theme/custom_themes/shared/data_table_theme";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;
const BRAND = QC_DIVISION_BRAND;
const TABLE_BORDER = alpha(BRAND.primary, 0.18);
const HEADER_CELL_BORDER = alpha("#fff", 0.22);

const TH = {
  ...uniformTableHeaderCellSx(BRAND.primary, BRAND.primaryLight, {
    headerFontSize: "0.68rem",
    headerLetterSpacing: "0.06em",
    headerPaddingY: "10px",
    headerPaddingX: "12px",
  }),
  border: `1px solid ${HEADER_CELL_BORDER}`,
};

const cellSx = {
  fontSize: "0.72rem",
  py: 0.85,
  px: 0.75,
  verticalAlign: "middle",
  border: `1px solid ${TABLE_BORDER}`,
};

const UPLOAD_LABELS: Record<QcHardwareUploadType, string> = {
  [QC_HARDWARE_UPLOAD_REPORT_KEY]: S.HARDWARE_UPLOAD_REPORT,
  [QC_HARDWARE_UPLOAD_GRAPH_KEY]: S.HARDWARE_UPLOAD_GRAPH,
  [QC_HARDWARE_UPLOAD_PHOTO_KEY]: S.HARDWARE_UPLOAD_PHOTO,
};

type QCHardwareAttachmentUploadProps = {
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
};

const QCHardwareAttachmentUpload = ({
  values,
  onChange,
  readOnly = false,
}: QCHardwareAttachmentUploadProps) => {
  const uploads = getHardwareUploadValues(values);
  const headerSx = readOnly ? qcReadOnlyTableHeaderCellSx : TH;
  const bodyCellSx = readOnly ? qcReadOnlyBodyCellSx : cellSx;

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${BRAND.border}`,
        background: BRAND.surface,
        px: 1.5,
        py: 1.25,
      }}
    >
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: BRAND.primary, mb: 0.75 }}>
        {S.HARDWARE_UPLOAD_SECTION_TITLE}
      </Typography>
      {!readOnly ? (
        <Typography sx={{ fontSize: "0.68rem", color: BRAND.textSub, mb: 1 }}>
          {S.HARDWARE_UPLOAD_SECTION_HINT}
        </Typography>
      ) : null}
      <TableContainer
        sx={
          readOnly
            ? qcReadOnlyTableContainerSx
            : {
                overflow: "hidden",
                overflowX: "auto",
                border: `1px solid ${TABLE_BORDER}`,
                borderRadius: 2,
                background: "#fff",
              }
        }
      >
        <Table size="small" sx={{ minWidth: 520, borderCollapse: "collapse" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...headerSx, width: "28%" }}>{S.HARDWARE_UPLOAD_COL_TYPE}</TableCell>
              <TableCell sx={headerSx}>{S.HARDWARE_UPLOAD_COL_FILES}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {QC_HARDWARE_UPLOAD_TYPES.map((uploadType, index) => {
              const files = uploads[uploadType] ?? [];

              return (
                <TableRow
                  key={uploadType}
                  sx={{
                    background: readOnly
                      ? index % 2 === 1
                        ? alpha(BRAND.primary, 0.03)
                        : "#fff"
                      : index % 2 === 0
                        ? "#fff"
                        : alpha(BRAND.surface, 0.55),
                  }}
                >
                  <TableCell sx={bodyCellSx}>
                    {readOnly ? (
                      <QCDivisionReadOnlyValue value={UPLOAD_LABELS[uploadType]} />
                    ) : (
                      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: BRAND.text }}>
                        {UPLOAD_LABELS[uploadType]}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    <Box sx={{ minWidth: 220, maxWidth: 420 }}>
                      <QCDivisionFileField
                        files={files}
                        onChange={(next) =>
                          onChange(setHardwareUploadValue(values, uploadType, next))
                        }
                        readOnly={readOnly}
                        compact
                        multiple
                        acceptMode="imageVideoPdf"
                        emptyLabel={S.HARDWARE_UPLOAD_ACTION}
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default QCHardwareAttachmentUpload;
