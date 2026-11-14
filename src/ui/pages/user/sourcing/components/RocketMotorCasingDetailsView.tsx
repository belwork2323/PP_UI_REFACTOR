import { useMemo } from "react";
import {
  Box,
  Chip,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { icons } from "../../../../../app/theme/icons";
import { useThemeStore } from "../../../../../app/store/themeStore";
import { useAuthStore } from "../../../../../app/store/authStore";
import { getRocketMotorCasingPageTheme } from "@app/theme/custom_themes/user/sourcing/rocketMotorCasing_theme";
import { STRINGS } from "../../../../../app/config/strings";
import { getOperationStatusConfig } from "../../../../../hooks/operationStatus";
import { formatDisplayDate, formatDisplayDateOrDateTime, formatDisplayDateTime } from "../../../../../utils/dateUtils";
import { useFilePreview } from "../../../../../hooks/useFilePreview";
import UserWorkflowDetailsShell from "../../../../components/custom/UserWorkflowDetailsShell";
import WorkflowDetailsMetaSection from "../../../../components/custom/WorkflowDetailsMetaSection";
import WorkflowDetailsSection from "../../../../components/custom/WorkflowDetailsSection";
import useWorkflowDetailsStatusConfig from "../../../../components/custom/useWorkflowDetailsStatusConfig";
import FilePreviewDialog from "../../../../components/common/FilePreviewDialog";
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

const RocketMotorCasingDetailsView = ({ row, blocks, loading, onBack }: RocketMotorCasingDetailsViewProps) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getRocketMotorCasingPageTheme(mode), [mode]);
  const dt = theme.sourcing.rocketMotor.casingDetails;
  const subDepartmentId = useAuthStore(
    (s) =>
      s.user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "rocket-motor")?.subDepartmentId,
  );
  const { preview, openFile, closePreview, downloadCurrent } = useFilePreview();

  const renderResultCell = (specRow: CasingDetailBlock["rows"][number]) => {
    const fileId = String(specRow.fileId ?? "").trim();
    const canOpen = Boolean(fileId && subDepartmentId);
    if (!canOpen) {
      return formatDisplayDateOrDateTime(specRow.analysedResult, specRow.analysedResult || "—");
    }
    return (
      <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
        <Typography component="span" sx={dt.resultText}>
          {formatDisplayDateOrDateTime(specRow.analysedResult, specRow.analysedResult || "—")}
        </Typography>
        <Link
          component="button"
          type="button"
          onClick={() =>
            void openFile(fileId, subDepartmentId!, specRow.fileName || specRow.analysedResult)
          }
          sx={{
            fontSize: "0.75rem",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 0.25,
            cursor: "pointer",
          }}
        >
          View
          <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
        </Link>
      </Stack>
    );
  };

  const statusConfig = useWorkflowDetailsStatusConfig(STATUS_CONFIG, dt.bannerStatusConfig);

  const metaFields = [
    { label: BL.COL_MOTOR_CASING_ID, value: row.motorCasingId },
    { label: "Project ID", value: row.projectId || "—" },
    { label: BL.COL_MOTOR_ID, value: row.motorNo || "—" },
    { label: BL.COL_MOTOR_STAGE, value: row.motorStage || "—" },
    { label: BL.COL_BATCH_TYPE, value: row.casingType || "—" },
    { label: "Insulation type", value: row.insulationType || "—" },
    { label: "Receiving date", value: formatDisplayDate(row.receivingDate) },
    { label: BL.COL_CREATED_BY, value: row.createdBy?.fullName ?? BL.UNASSIGNED },
    { label: BL.COL_CREATED_ON, value: formatDisplayDateTime(row.createdOn, row.createdOn || "—") },
  ];

  const defaultColumns = [
    { key: "specification", label: "Section / Parameter" },
    { key: "analysedResult", label: "Details" },
  ];

  return (
    <>
      <UserWorkflowDetailsShell
        dt={dt}
        theme={theme}
        title={BL.CASING_DETAILS_TITLE}
        subtitle={`${row.motorCasingId}${row.motorStage ? ` · Stage ${row.motorStage}` : ""}`}
        icon={RocketLaunchRoundedIcon}
        status={row.rmStatus}
        statusConfig={statusConfig}
        rejectionReason={row.rejectionReason ?? null}
        onBack={onBack}
        backLabel={FH.BACK_TO_LIST}
        loading={loading}
        loadingText={BL.CASING_DETAILS_LOADING}
      >
        <WorkflowDetailsMetaSection
          dt={dt}
          title={BL.CASING_DETAILS_IDENTIFICATION_SECTION}
          icon={DescriptionRoundedIcon}
          fields={metaFields}
        />

        <WorkflowDetailsSection
          dt={dt}
          title={BL.CASING_DETAILS_SECTIONS}
          icon={VisibilityRoundedIcon}
          sx={{ mb: 0 }}
        >
                {blocks.length ? (
                  blocks.map((block, bi) => {
                    const columns = block._columns ?? defaultColumns;
                    const showRemarks = columns.some(
                      (col) => col.key === "remarks" || col.label === "Remarks",
                    );
                    const nestedTables = block.mockTrialTables?.length
                      ? block.mockTrialTables
                      : block.radiographyPlanTables?.length
                        ? block.radiographyPlanTables
                        : block.insulationSpecTables?.length
                          ? block.insulationSpecTables
                          : [];
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
                        ) : nestedTables.length ? (
                          <>
                            {block.rows.length > 0 ? (
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
                                          {renderResultCell(specRow)}
                                        </TableCell>
                                        {showRemarks ? (
                                          <TableCell sx={dt.tableCell}>
                                            <Typography sx={dt.remarksText}>
                                              {specRow.remarks?.trim() ? specRow.remarks : "—"}
                                            </Typography>
                                          </TableCell>
                                        ) : null}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            ) : null}
                            <Box sx={block.rows.length ? dt.nestedTableGap : undefined}>
                              <MockTrialDetailTables tables={nestedTables} dt={dt} />
                            </Box>
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
                                      {renderResultCell(specRow)}
                                    </TableCell>
                                    {showRemarks ? (
                                      <TableCell sx={dt.tableCell}>
                                        <Typography sx={dt.remarksText}>
                                          {specRow.remarks?.trim() ? specRow.remarks : "—"}
                                        </Typography>
                                      </TableCell>
                                    ) : null}
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
        </WorkflowDetailsSection>
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

export default RocketMotorCasingDetailsView;
