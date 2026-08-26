import {
  alpha,
  Box,
  Button,
  Card,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { keyframes } from "@mui/material/styles";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { STRINGS } from "../../../../app/config/strings";
import { motorStageLabel } from "../../../../data/models/admin/BatchManagement/BatchManagementModel";
import { formatSubdepartmentBatchTypeLabel } from "../../../../data/models/user/SubdepartmentBatchModel";
import {
  canApproverViewBatchDetails,
  type ApproverStatusMeta,
} from "../../../../app/theme/approver";
import {
  normalizeApproverBatchStatus,
  getApproverBatchStatusDisplayLabel,
} from "../../../../data/models/approver/ApproverBatchListModel";
import { useMemo } from "react";
import getManufacturingTheme from "@/app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { useThemeStore } from "@/app/store/themeStore";
import { icons } from "@app/theme/icons";
import {
  uniformTableBodyCellSx,
  uniformTableHeaderCellSx,
} from "@app/theme/custom_themes/shared/data_table_theme";

const BL = STRINGS.MANUFACTURING.BATCH_LIST;

const slideUp = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

export type ApproverSubdepartmentBatchListRow = Record<string, unknown> & {
  id?: string | number;
  batchId?: string;
  batchType?: string;
  project?: {
    projectId: string;
    projectName: string;
  };
  motorId?: string;
  motorStage?: string | number;
  motorType?: string;
  submittedBy?: string;
  createdOn?: string;
  status?: string;
};

export type ApproverSubdepartmentBatchListTableProps = {
  rows: ApproverSubdepartmentBatchListRow[];
  accentMain: string;
  accentLight?: string;
  statusMeta: ApproverStatusMeta;
  onViewDetails: (row: ApproverSubdepartmentBatchListRow) => void;
  borderColor?: string;
  surfaceColor?: string;
  textSubColor?: string;
  primaryColor?: string;
  /** When true, approved batches also show an enabled View Details button. */
  allowViewDetailsWhenApproved?: boolean;
};

const formatCreatedOn = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const headerCellSx = (accentMain: string, accentLight: string) =>
  uniformTableHeaderCellSx(accentMain, accentLight ?? accentMain, {
    headerFontSize: "0.68rem",
    headerLetterSpacing: "0.07em",
    headerPaddingY: "10px",
    headerPaddingX: "14px",
  });

const bodyCellSx = (borderColor: string) =>
  uniformTableBodyCellSx(
    { border: borderColor, text: "#1C2833" },
    {
      bodyFontSize: "0.82rem",
      bodyPaddingY: "10px",
      bodyPaddingX: "14px",
    },
  );

const ApproverSubdepartmentBatchListTable = ({
  rows,
  accentMain,
  accentLight,
  statusMeta,
  onViewDetails,
  borderColor = "#D5D8DC",
  surfaceColor = "#F4F6F8",
  textSubColor = "#5D6D7E",
  primaryColor = "#1B4F72",
  allowViewDetailsWhenApproved = false,
}: ApproverSubdepartmentBatchListTableProps) => {
  const headerAccent = accentLight ?? accentMain;
  const thSx = headerCellSx(accentMain, headerAccent);
  const tdSx = bodyCellSx(borderColor);
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${borderColor}`,
        boxShadow: `0 2px 12px ${alpha(primaryColor, 0.06)}`,
        overflow: "hidden",
      }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={thSx}>{BL.COL_BATCH_ID}</TableCell>
              <TableCell sx={thSx}>{BL.COL_PROJECT}</TableCell>
              <TableCell sx={thSx}>{BL.COL_BATCH_TYPE}</TableCell>
              <TableCell sx={thSx}>{BL.COL_MOTOR_ID}</TableCell>
              <TableCell sx={thSx}>{BL.COL_MOTOR_STAGE}</TableCell>
              <TableCell sx={thSx}>{BL.COL_SUBMITTED_BY}</TableCell>
              <TableCell sx={thSx}>{BL.COL_CREATED_ON}</TableCell>
              <TableCell sx={thSx}>Status</TableCell>
              <TableCell sx={{ ...thSx, textAlign: "center" }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, idx) => {
              const status = normalizeApproverBatchStatus(row.status);
              const canViewDetails = canApproverViewBatchDetails(status, {
                allowWhenApproved: allowViewDetailsWhenApproved,
              });
              const meta = statusMeta[status];
              console.log(row);

              return (
                <TableRow
                  key={String(row.id ?? row.batchId ?? row.formId ?? idx)}
                  sx={{
                    background: idx % 2 === 0 ? "#fff" : alpha(surfaceColor, 0.5),
                    "&:hover": { background: alpha(accentMain, 0.04) },
                    "&:last-child td": { borderBottom: "none" },
                    animation: `${slideUp} 0.3s ease ${idx * 0.04}s both`,
                  }}
                >
                  <TableCell sx={tdSx}>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: accentMain }}>
                      {String(row.batchId ?? "—")}
                    </Typography>
                  </TableCell>
                  <TableCell sx={tdSx}>
                    <Box sx={theme.batchList.projectCell}>
                      <icons.batchMgmt.projectId sx={theme.batchList.projectIcon} />
                      <Box sx={theme.batchList.projectInfo}>
                        <Typography sx={theme.batchList.projectName}>
                          {String(row.project.projectName || "—")}
                        </Typography>
                        <Typography sx={theme.batchList.projectId}>
                          {String(row.project.projectId || "—")}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={tdSx}>
                    <Chip
                      label={formatSubdepartmentBatchTypeLabel(row.batchType)}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        background: alpha(headerAccent, 0.1),
                        color: headerAccent,
                        border: `1px solid ${alpha(headerAccent, 0.2)}`,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ ...tdSx, fontSize: "0.78rem", color: textSubColor }}>
                    {String(row.motorId ?? "—")}
                  </TableCell>
                  <TableCell sx={tdSx}>
                    <Chip
                      label={motorStageLabel(row.motorStage ?? row.motorType)}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        background: alpha(headerAccent, 0.1),
                        color: headerAccent,
                        border: `1px solid ${alpha(headerAccent, 0.2)}`,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ ...tdSx, fontSize: "0.78rem" }}>
                    {String(row.submittedBy ?? "—")}
                  </TableCell>
                  <TableCell
                    sx={{ ...tdSx, color: textSubColor, fontSize: "0.76rem", whiteSpace: "nowrap" }}
                  >
                    {formatCreatedOn(row.createdOn)}
                  </TableCell>
                  <TableCell sx={tdSx}>
                    <Chip
                      label={getApproverBatchStatusDisplayLabel(status) || "—"}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        background: meta?.bg,
                        color: meta?.color,
                        border: `1px solid ${meta?.border ?? alpha(borderColor, 0.6)}`,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ ...tdSx, textAlign: "center" }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityRoundedIcon sx={{ fontSize: "13px !important" }} />}
                      onClick={() => onViewDetails(row)}
                      disabled={!canViewDetails}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        textTransform: "none",
                        px: 1.5,
                        py: 0.6,
                        borderColor: canViewDetails ? accentMain : borderColor,
                        color: canViewDetails ? accentMain : alpha(textSubColor, 0.4),
                        "&:hover": { background: alpha(accentMain, 0.06) },
                        "&:disabled": { borderColor },
                      }}
                    >
                      {STRINGS.APPROVER.COMMON.VIEW_DETAILS}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default ApproverSubdepartmentBatchListTable;
