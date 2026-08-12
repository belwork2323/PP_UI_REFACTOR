import {
  Box,
  Stack,
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
import SchemaFileField, {
  parseSchemaFileList,
} from "../../../../components/common/SchemaFileField";
import { FILE_PICKER_ACCEPT } from "../../../../../utils/FileUtils";
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

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;
const BRAND = QC_DIVISION_BRAND;
const TABLE_BORDER = alpha(BRAND.primary, 0.18);
const HEADER_CELL_BORDER = alpha("#fff", 0.22);

const TH = {
  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.68rem",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  padding: "10px 12px",
  whiteSpace: "nowrap" as const,
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
              const value = uploads[uploadType];
              const fileNames = parseSchemaFileList(value);

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
                    {readOnly ? (
                      fileNames.length ? (
                        <Stack spacing={0.35}>
                          {fileNames.map((name) => (
                            <QCDivisionReadOnlyValue key={`${uploadType}-${name}`} value={name} />
                          ))}
                        </Stack>
                      ) : (
                        <QCDivisionReadOnlyValue value="" muted />
                      )
                    ) : (
                      <Box sx={{ minWidth: 220, maxWidth: 420 }}>
                        <SchemaFileField
                          value={value}
                          onChange={(next) =>
                            onChange(setHardwareUploadValue(values, uploadType, next))
                          }
                          compact
                          multiple
                          accept={FILE_PICKER_ACCEPT.IMAGE_VIDEO_PDF}
                          emptyLabel={S.HARDWARE_UPLOAD_ACTION}
                          addLabel={S.HARDWARE_UPLOAD_ADD_MORE}
                        />
                      </Box>
                    )}
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
