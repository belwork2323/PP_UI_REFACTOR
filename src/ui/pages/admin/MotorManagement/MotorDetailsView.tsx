import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Zoom,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import { getBatchTypeChipConfig } from "@app/theme/roleConfig";
import BatchTrackingPopover from "@ui/pages/admin/BatchManagement/BatchTrackingPopover";
import RocketCasingDetailDialog from "@ui/pages/approver/sourcing/components/RocketCasingDetailDialog";
import { getRocketMotorCasingApproverTheme } from "@app/theme/custom_themes/approver/sourcing/rocketMotorCasingApprover_theme";
import { useThemeStore } from "@app/store/themeStore";
import { useAlertStore } from "@app/store/alertStore";
import rocketMotorCasingController from "@controllers/user/sourcing/rocketMotorCasingController";
import { RocketMotorCasingDetailsModel } from "@data/models/user/RocketMotorCasingProcurementModel";

const S = STRINGS.MOTOR_MANAGEMENT.DETAILS;

const DISPLAY_STATUSES = new Set(["IN_PROGRESS", "DISPATCHED", "DISCARDED"]);

type MotorDetailsViewProps = {
  open: boolean;
  loading: boolean;
  details: any;
  onClose: () => void;
  onDiscard?: () => void;
  t: any;
};

const display = (value: unknown) => {
  if (value == null || value === "") return "—";
  return String(value);
};

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const personName = (value: unknown) => {
  if (value == null || value === "") return "—";
  if (typeof value === "string") return value.trim() || "—";
  const obj = value as { fullName?: string; name?: string; id?: string };
  return String(obj.fullName ?? obj.name ?? obj.id ?? "").trim() || "—";
};

const Section = ({
  title,
  icon,
  children,
  dt,
  isLast = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  dt: any;
  isLast?: boolean;
}) => (
  <Box sx={{ ...dt.section, mb: isLast ? 0 : 3 }}>
    <Typography sx={dt.sectionTitle}>
      {icon}
      {title}
    </Typography>
    {children}
  </Box>
);

const MotorDetailsView = ({
  open,
  loading,
  details,
  onClose,
  onDiscard,
  t,
}: MotorDetailsViewProps) => {
  const dt = t.details;
  const linkedBatches = Array.isArray(details?.linkedBatches) ? details.linkedBatches : [];
  const motorId = details?.motorId || "";
  const motorCasingId = String(details?.motorCasingId ?? "").trim();
  const discarded =
    Boolean(details?.discarded) ||
    String(details?.workflowStatus ?? "").toUpperCase() === "DISCARDED" ||
    linkedBatches.some((b: any) => String(b?.workflowStatus ?? "").toUpperCase() === "DISCARDED");

  const headerStatus = discarded
    ? "DISCARDED"
    : String(details?.workflowStatus ?? "").toUpperCase();

  const mode = useThemeStore((s) => s.mode);
  const casingTheme = useMemo(() => getRocketMotorCasingApproverTheme(mode), [mode]);

  const [trackingTarget, setTrackingTarget] = useState<{
    anchor: HTMLElement;
    batchId: string;
  } | null>(null);

  const [casingOpen, setCasingOpen] = useState(false);
  const [casingLoading, setCasingLoading] = useState(false);
  const [casingItem, setCasingItem] = useState<any | null>(null);

  const openCasingDetails = async () => {
    if (!motorCasingId) {
      useAlertStore.getState().showAlert(S.CASING_ID_MISSING, "error");
      return;
    }

    setCasingOpen(true);
    setCasingLoading(true);
    setCasingItem({
      motorCasingId,
      batchId: motorCasingId,
      motorId: details?.motorId,
      projectId: details?.projectId,
      motorStage: details?.motorStage,
      status: details?.casingStatus,
      casingBlocks: [],
    });

    try {
      const response = await rocketMotorCasingController.fetchFormDetails({ motorCasingId });
      if (!response?.success || !response?.data) {
        useAlertStore
          .getState()
          .showAlert(
            (response as any)?.error?.details ||
              response?.message ||
              STRINGS.MOTOR_MANAGEMENT.ERRORS.LOAD_DETAILS_FAILED,
            "error",
          );
        setCasingOpen(false);
        setCasingItem(null);
        return;
      }

      const model = response.data as RocketMotorCasingDetailsModel;
      const header = RocketMotorCasingDetailsModel.toDetailHeaderFields(model, {
        casingType: details?.casingType,
        insulationType: details?.insulationType,
        receivingDate: details?.receivingDate,
        submittedBy: details?.submittedBy,
        createdOn: details?.createdOn,
        createdBy: details?.createdBy,
      });
      setCasingItem({
        motorCasingId,
        batchId: motorCasingId,
        formId: motorCasingId,
        subDepartmentId: model.subDepartmentId || undefined,
        motorId: details?.motorId ?? model.motorId,
        projectId: details?.projectId ?? model.projectId,
        motorStage: details?.motorStage ?? model.motorStage,
        status: details?.casingStatus ?? model.status,
        casingType: header.casingType,
        insulationType: header.insulationType,
        receivingDate: header.receivingDate,
        submittedBy: header.submittedBy,
        createdOn: header.createdOn,
        casingBlocks: RocketMotorCasingDetailsModel.toDetailBlocks(model),
      });
    } catch (err: any) {
      useAlertStore
        .getState()
        .showAlert(
          err?.response?.data?.message || STRINGS.MOTOR_MANAGEMENT.ERRORS.LOAD_DETAILS_FAILED,
          "error",
        );
      setCasingOpen(false);
      setCasingItem(null);
    } finally {
      setCasingLoading(false);
    }
  };

  const closeCasingDetails = () => {
    if (casingLoading) return;
    setCasingOpen(false);
    setCasingItem(null);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        TransitionComponent={Zoom}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "20px",
            width: "95vw",
            maxWidth: 1100,
            maxHeight: "90vh",
            overflow: "hidden",
            background: "transparent",
            boxShadow: "none",
          },
        }}
      >
        <DialogContent sx={{ p: 0, overflow: "hidden", maxHeight: "90vh" }}>
          <Box sx={{ ...dt.document, display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
            <Box sx={dt.banner}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ sm: "center" }}
                justifyContent="space-between"
                gap={2}
              >
                <Stack direction="row" alignItems="flex-start" gap={1.5}>
                  <icons.motorMgmt.motorIcon sx={dt.bannerIcon} />
                  <Box>
                    <Typography sx={dt.bannerTitle}>{S.TITLE}</Typography>
                    <Typography sx={dt.bannerSubtitle}>
                      {motorId ? S.SUBTITLE(motorId) : loading ? S.LOADING : "—"}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" alignItems="center" gap={1.5}>
                  {DISPLAY_STATUSES.has(headerStatus) ? (
                    <Chip
                      label={headerStatus.replace(/_/g, " ")}
                      size="small"
                      sx={dt.statusChip}
                    />
                  ) : details?.casingStatus && !discarded ? (
                    <Chip
                      label={String(details.casingStatus).replace(/_/g, " ")}
                      size="small"
                      sx={dt.statusChip}
                    />
                  ) : discarded ? (
                    <Chip label="DISCARDED" size="small" sx={dt.statusChip} />
                  ) : null}
                  <IconButton
                    onClick={onClose}
                    size="small"
                    aria-label={S.CLOSE}
                    sx={{
                      color: "#fff",
                      bgcolor: "rgba(255,255,255,0.12)",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                    }}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            </Box>

            <Box sx={{ ...dt.body, flex: 1 }}>
              {loading || !details ? (
                <Box sx={dt.loadingBox}>
                  <CircularProgress size={36} />
                  <Typography sx={dt.emptyText}>{S.LOADING}</Typography>
                </Box>
              ) : (
                <Section
                  title={S.LINKED_BATCHES}
                  icon={<AccountTreeRoundedIcon sx={{ fontSize: 18 }} />}
                  dt={dt}
                  isLast
                >
                  {linkedBatches.length === 0 ? (
                    <Typography sx={dt.emptyText}>{S.NO_LINKED_BATCHES}</Typography>
                  ) : (
                    <TableContainer sx={dt.tableContainer}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={dt.tableHeaderCell(true)}>{S.COLS.BATCH_ID}</TableCell>
                            <TableCell sx={dt.tableHeaderCell(false)}>
                              {S.COLS.BATCH_TYPE}
                            </TableCell>
                            <TableCell sx={dt.tableHeaderCell(false)}>{S.COLS.PROJECT}</TableCell>
                            <TableCell sx={dt.tableHeaderCell(false)}>
                              {S.COLS.MOTOR_STAGE}
                            </TableCell>
                            <TableCell sx={dt.tableHeaderCell(false)}>{S.COLS.CREATED_AT}</TableCell>
                            <TableCell sx={dt.tableHeaderCell(false)}>{S.COLS.CREATED_BY}</TableCell>
                            <TableCell sx={dt.tableHeaderCell(false)}>{S.COLS.STATUS}</TableCell>
                            <TableCell sx={dt.tableHeaderCell(false)}>{S.COLS.ACTIONS}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {linkedBatches.map((batch: any) => {
                            const typeCfg = getBatchTypeChipConfig({ batchType: batch.batchType });
                            return (
                              <TableRow key={batch.batchId}>
                                <TableCell
                                  sx={{
                                    ...dt.tableCell,
                                    fontFamily: "monospace",
                                    fontWeight: 600,
                                  }}
                                >
                                  {display(batch.batchId)}
                                </TableCell>
                                <TableCell sx={dt.tableCell}>
                                  {batch.batchType ? (
                                    <Chip
                                      size="small"
                                      label={batch.batchType}
                                      icon={typeCfg?.Icon ? <typeCfg.Icon /> : undefined}
                                    />
                                  ) : (
                                    "—"
                                  )}
                                </TableCell>
                                <TableCell sx={dt.tableCell}>
                                  {display(batch.projectId)}
                                </TableCell>
                                <TableCell sx={dt.tableCell}>
                                  {batch.motorStage != null
                                    ? `Stage ${batch.motorStage}`
                                    : "—"}
                                </TableCell>
                                <TableCell sx={dt.tableCell}>
                                  {formatDateTime(batch.createdAt)}
                                </TableCell>
                                <TableCell sx={dt.tableCell}>
                                  {personName(batch.createdBy)}
                                </TableCell>
                                <TableCell sx={dt.tableCell}>
                                  <Tooltip title={S.TRACK_BATCH_TOOLTIP}>
                                    <IconButton
                                      size="small"
                                      aria-label={S.TRACK_BATCH_TOOLTIP}
                                      disabled={!batch.batchId}
                                      onClick={(event) =>
                                        setTrackingTarget({
                                          anchor: event.currentTarget,
                                          batchId: String(batch.batchId),
                                        })
                                      }
                                      sx={{ color: "primary.main" }}
                                    >
                                      <TrackChangesRoundedIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                                <TableCell sx={dt.tableCell}>
                                  <Tooltip title={S.VIEW_CASING_DETAILS_TOOLTIP}>
                                    <span>
                                      <IconButton
                                        size="small"
                                        aria-label={S.VIEW_CASING_DETAILS_TOOLTIP}
                                        disabled={!motorCasingId || casingLoading}
                                        onClick={() => void openCasingDetails()}
                                        sx={{ color: "primary.main" }}
                                      >
                                        <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Section>
              )}
            </Box>

            <Box sx={dt.actions}>
              <Stack direction="row" justifyContent="flex-end" gap={1.5}>
                {onDiscard ? (
                  <Button
                    onClick={onDiscard}
                    variant="outlined"
                    color="error"
                    disabled={loading || !details || discarded}
                  >
                    {discarded ? S.DISCARD_DISABLED : S.DISCARD_BUTTON}
                  </Button>
                ) : null}
                <Button onClick={onClose} variant="outlined">
                  {S.CLOSE}
                </Button>
              </Stack>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <BatchTrackingPopover
        open={Boolean(trackingTarget)}
        anchorEl={trackingTarget?.anchor ?? null}
        batchId={trackingTarget?.batchId ?? ""}
        onClose={() => setTrackingTarget(null)}
      />

      <RocketCasingDetailDialog
        open={casingOpen}
        onClose={closeCasingDetails}
        item={casingItem}
        loading={casingLoading}
        theme={casingTheme}
      />
    </>
  );
};

export default MotorDetailsView;
