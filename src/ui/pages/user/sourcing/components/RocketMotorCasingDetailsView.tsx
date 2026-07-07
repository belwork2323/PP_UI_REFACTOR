import { useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { icons } from "../../../../../app/theme/icons";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getSourcingTheme from "../../../../../app/theme/custom_themes/user/sourcing/sourcing_theme";
import { STRINGS } from "../../../../../app/config/strings";
import { getOperationStatusConfig, OPERATION_STATUS } from "../../../../../hooks/operationStatus";
import UserWorkflowStatusCell from "../../../../components/custom/UserWorkflowStatusCell";
import type {
  CasingDetailBlock,
  RocketMotorCasingDetailsContext,
} from "../../../../../data/models/user/RocketMotorCasingProcurementModel";
import DimensionalInspectionDetailTable from "./DimensionalInspectionDetailTable";
import MockTrialDetailTables from "./MockTrialDetailTables";

const BL = STRINGS.SOURCING.BATCH_LIST;
const FH = STRINGS.MANUFACTURING.FORM_HEADER;

const {
  visibility: VisibilityRoundedIcon,
  rocketLaunch: RocketLaunchRoundedIcon,
  description: DescriptionRoundedIcon,
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
} = icons.user.sourcing.rocketMotorBatchList;

const STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

type RocketMotorCasingDetailsViewProps = {
  row: RocketMotorCasingDetailsContext;
  blocks: CasingDetailBlock[];
  loading: boolean;
  onBack: () => void;
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const RocketMotorCasingDetailsView = ({ row, blocks, loading, onBack }: RocketMotorCasingDetailsViewProps) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getSourcingTheme(mode), [mode]);
  const dt = theme.sourcing.rocketMotor.casingDetails;

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(STATUS_CONFIG).map(([status, cfg]) => [
          status,
          { ...cfg, ...dt.bannerStatusConfig[status] },
        ])
      ),
    [dt]
  );

  const metaFields = [
    { label: BL.COL_MOTOR_CASING_ID, value: row.motorCasingId },
    { label: "Project ID", value: row.projectId || "—" },
    { label: BL.COL_MOTOR_ID, value: row.motorNo || "—" },
    { label: BL.COL_MOTOR_TYPE, value: row.motorStage || "—" },
    { label: BL.COL_BATCH_TYPE, value: row.casingType || "—" },
    { label: "Insulation type", value: row.insulationType || "—" },
    { label: "Receiving date", value: formatDate(row.receivingDate) },
    { label: BL.COL_CREATED_BY, value: row.createdBy?.fullName ?? BL.UNASSIGNED },
    { label: BL.COL_CREATED_ON, value: formatDate(row.createdOn) },
  ];

  const defaultColumns = [
    { label: "Section / Parameter" },
    { label: "Details" },
    { label: "Remarks" },
  ];

  return (
    <Box sx={dt.page}>
      <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
        <Button
          variant="text"
          size="small"
          startIcon={<ArrowBackRoundedIcon />}
          onClick={onBack}
          sx={theme.workflow.formHeader.backButton}
        >
          {FH.BACK_TO_LIST}
        </Button>
      </Stack>

      <Box sx={dt.document}>
        <Box sx={dt.banner}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" gap={2}>
            <Stack direction="row" alignItems="flex-start" gap={1.5}>
              <RocketLaunchRoundedIcon sx={dt.bannerIcon} />
              <Box>
                <Typography sx={dt.bannerTitle}>{BL.CASING_DETAILS_TITLE}</Typography>
                <Typography sx={dt.bannerSubtitle}>
                  {row.motorCasingId}
                  {row.motorStage ? ` · Stage ${row.motorStage}` : ""}
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

        <Box sx={dt.body}>
          {loading ? (
            <Box sx={dt.loadingBox}>
              <CircularProgress size={36} sx={{ color: theme.palette.primaryLight }} />
              <Typography sx={dt.emptyText}>{BL.CASING_DETAILS_LOADING}</Typography>
            </Box>
          ) : (
            <>
              <Box sx={dt.section}>
                <Typography sx={dt.sectionTitle}>
                  <DescriptionRoundedIcon sx={{ fontSize: 18 }} />
                  {BL.CASING_DETAILS_IDENTIFICATION_SECTION}
                </Typography>
                <Box sx={dt.metaGrid}>
                  {metaFields.map((field) => (
                    <Box key={field.label} sx={dt.metaItem}>
                      <Typography sx={dt.metaLabel}>{field.label}</Typography>
                      <Typography sx={dt.metaValue}>{field.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box sx={{ ...dt.section, mb: 0 }}>
                <Typography sx={dt.sectionTitle}>
                  <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                  {BL.CASING_DETAILS_SECTIONS}
                </Typography>
                {blocks.length ? (
                  blocks.map((block, bi) => {
                    const columns = block._columns ?? defaultColumns;
                    const isLast = bi === blocks.length - 1;
                    return (
                      <Box key={`${block.material}-${bi}`} sx={dt.blockWrapper(isLast)}>
                        <Stack direction="row" alignItems="center" gap={1} mb={1} flexWrap="wrap">
                          <Chip label={block.material} size="small" sx={dt.materialChip} />
                          {block.lotNo ? (
                            <Typography sx={dt.blockMeta}>
                              Ref:{" "}
                              <Box component="span" sx={dt.blockMetaStrong}>
                                {block.lotNo}
                              </Box>
                            </Typography>
                          ) : null}
                        </Stack>
                        {block.dimensionalTable?.length ? (
                          <DimensionalInspectionDetailTable rows={block.dimensionalTable} dt={dt} />
                        ) : block.mockTrialTables?.length ? (
                          <>
                            {block.rows.length > 0 ? (
                              <TableContainer sx={dt.tableContainer}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={dt.tableHeaderCell(true)}>Field</TableCell>
                                      <TableCell sx={dt.tableHeaderCell(false)}>Value</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {block.rows.map((specRow, ri) => (
                                      <TableRow key={`${specRow.specification}-${ri}`} sx={dt.tableRow(ri)}>
                                        <TableCell sx={{ ...dt.tableCell, ...dt.specText }}>
                                          {specRow.specification}
                                        </TableCell>
                                        <TableCell sx={{ ...dt.tableCell, ...dt.resultText }}>
                                          {specRow.analysedResult || "—"}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            ) : null}
                            <MockTrialDetailTables tables={block.mockTrialTables} dt={dt} />
                          </>
                        ) : (
                          <TableContainer sx={dt.tableContainer}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  {columns.map((col, i) => (
                                    <TableCell key={col.label} sx={dt.tableHeaderCell(i === 0)}>
                                      {col.label}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {block.rows.map((specRow, ri) => (
                                  <TableRow key={`${specRow.specification}-${ri}`} sx={dt.tableRow(ri)}>
                                    <TableCell sx={{ ...dt.tableCell, ...dt.specText }}>
                                      {specRow.specification}
                                    </TableCell>
                                    <TableCell sx={{ ...dt.tableCell, ...dt.resultText }}>
                                      {specRow.analysedResult || "—"}
                                    </TableCell>
                                    <TableCell sx={dt.tableCell}>
                                      <Typography sx={dt.remarksText}>
                                        {specRow.remarks?.trim() ? specRow.remarks : "—"}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Box>
                    );
                  })
                ) : (
                  <Typography sx={dt.emptyText}>{BL.CASING_DETAILS_EMPTY}</Typography>
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default RocketMotorCasingDetailsView;
