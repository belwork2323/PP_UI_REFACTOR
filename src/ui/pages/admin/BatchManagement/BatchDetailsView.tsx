import React, { useMemo } from "react";
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
  Typography,
  Zoom,
} from "@mui/material";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import type { BatchListItemModel } from "@data/models/admin/BatchManagement/BatchManagementModel";
import {
  getBatchId,
  getMotorId,
  getMotorStage,
  getPriority,
  getStatus,
  getSystemManagerLabel,
} from "@utils/batchManagementUtils";
import { mixingCycleLabel, formatArticlesForDisplay } from "@data/models/admin/BatchManagement/BatchManagementModel";

const S = STRINGS.BATCH_MANAGEMENT.DETAILS;

type MetaField = { label: string; value: React.ReactNode };

type BatchDetailsViewProps = {
  open: boolean;
  loading: boolean;
  batch: BatchListItemModel | null;
  onClose: () => void;
  t: any;
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const displayValue = (value: unknown): string => {
  if (value == null || value === "") return "—";
  return String(value);
};

const MetaGrid = ({ fields, dt }: { fields: MetaField[]; dt: any }) => (
  <Box sx={dt.metaGrid}>
    {fields.map((field) => (
      <Box key={field.label} sx={dt.metaItem}>
        <Typography sx={dt.metaLabel}>{field.label}</Typography>
        <Typography sx={dt.metaValue}>{field.value}</Typography>
      </Box>
    ))}
  </Box>
);

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

const BatchDetailsView = ({ open, loading, batch, onClose, t }: BatchDetailsViewProps) => {
  const dt = t.details;

  const batchId = batch ? getBatchId(batch) : "";
  const status = batch ? getStatus(batch) : "";
  const sheet = batch?.identificationSheet ?? null;
  const materials = sheet?.materials ?? [];

  const projectLabel = useMemo(() => {
    if (!batch) return "—";
    if (batch.projectName && batch.projectId) return `${batch.projectName} (${batch.projectId})`;
    return displayValue(batch.projectName || batch.projectId);
  }, [batch]);

  const subDeptLabel = useMemo(() => {
    if (!batch?.subDepartments?.length) return "—";
    return batch.subDepartments.map((sd) => sd.subDepartmentName).filter(Boolean).join(", ") || "—";
  }, [batch]);

  const isSubscale = Boolean(batch && String(batch.batchType).toUpperCase() !== "MAIN");

  const batchInfoFields: MetaField[] = batch
    ? [
        { label: S.BATCH_ID, value: displayValue(batch.batchId) },
        { label: S.BATCH_TYPE, value: displayValue(batch.batchType) },
        ...(isSubscale
          ? [{ label: S.SUB_BATCH_TYPE, value: displayValue(batch.subBatchType) }]
          : []),
        { label: S.PROJECT, value: projectLabel },
        { label: S.MOTOR_STAGE, value: displayValue(getMotorStage(batch)) },
        { label: S.MIXING_CYCLE, value: mixingCycleLabel(batch.mixingCycle) },
        { label: S.MOTOR_COUNT, value: displayValue(batch.numberOfMotors) },
        { label: S.MOTOR_IDS, value: displayValue(getMotorId(batch) || batch.motorIds?.join(", ")) },
        { label: S.PRIORITY, value: displayValue(getPriority(batch)) },
        { label: S.SYSTEM_MANAGER, value: displayValue(getSystemManagerLabel(batch)) },
        ...(isSubscale
          ? [
              { label: S.OBJECTIVE, value: displayValue(batch.objective) },
              {
                label: S.ARTICLES,
                value: formatArticlesForDisplay(batch.articles) || "—",
              },
            ]
          : []),
      ]
    : [];

  const workflowFields: MetaField[] = batch
    ? [
        {
          label: S.DEPARTMENT,
          value: displayValue(batch.department?.departmentName),
        },
        { label: S.SUB_DEPARTMENT, value: subDeptLabel },
        {
          label: S.IDENTIFICATION_STATUS,
          value: displayValue(batch.identificationSheetStatus),
        },
      ]
    : [];

  const identificationFields: MetaField[] = sheet
    ? [
        { label: S.SHEET_DATE, value: formatDate(sheet.date) },
        { label: S.BATCH_SIZE, value: displayValue(sheet.batchSize) },
        { label: S.BONDING_SHEET_NO, value: displayValue(sheet.bondingSheetNo) },
        { label: S.MIXER_TYPE, value: displayValue(sheet.mixerType ?? sheet.mixerDetails) },
        { label: S.BUILDING_NO, value: displayValue(sheet.BldgNo) },
        { label: S.NUMBER_OF_PREMIX, value: displayValue(sheet.numberOfPremix) },
        { label: S.PRC_APPROVAL_DATE, value: formatDate(sheet.prcApprovalDate) },
        { label: S.REMARKS, value: displayValue(sheet.remarks) },
      ]
    : [];

  const auditFields: MetaField[] = batch
    ? [
        {
          label: S.CREATED_BY,
          value: displayValue(batch.createdBy?.name || batch.createdBy?.id),
        },
        { label: S.CREATED_ON, value: formatDateTime(batch.createdOn) },
        {
          label: S.UPDATED_BY,
          value: displayValue(batch.updatedBy?.name || batch.updatedBy?.id),
        },
        { label: S.UPDATED_ON, value: formatDateTime(batch.updatedOn) },
      ]
    : [];

  return (
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
          maxWidth: "1800px",
          height: "90vh",
          overflow: "hidden",
          background: "transparent",
          boxShadow: "none",
        },
      }}
    >
      <DialogContent sx={{ p: 0, overflow: "hidden", height: "100%" }}>
        <Box sx={{ ...dt.document, height: "100%", display: "flex", flexDirection: "column" }}>
          <Box sx={dt.banner}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ sm: "center" }}
              justifyContent="space-between"
              gap={2}
            >
              <Stack direction="row" alignItems="flex-start" gap={1.5}>
                <icons.batchMgmt.batchIcon sx={dt.bannerIcon} />
                <Box>
                  <Typography sx={dt.bannerTitle}>{S.TITLE}</Typography>
                  <Typography sx={dt.bannerSubtitle}>
                    {batchId ? S.SUBTITLE(batchId) : S.LOADING}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" alignItems="center" gap={1.5}>
                {status ? (
                  <Chip label={status.replace(/_/g, " ")} size="small" sx={dt.statusChip} />
                ) : null}
                <IconButton
                  onClick={onClose}
                  size="small"
                  sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.12)", "&:hover": { bgcolor: "rgba(255,255,255,0.22)" } }}
                >
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          </Box>

          <Box sx={{ ...dt.body, flex: 1 }}>
            {loading || !batch ? (
              <Box sx={dt.loadingBox}>
                <CircularProgress size={36} />
                <Typography sx={dt.emptyText}>{S.LOADING}</Typography>
              </Box>
            ) : (
              <>
                <Section
                  title={S.BATCH_INFO_SECTION}
                  icon={<DescriptionRoundedIcon sx={{ fontSize: 18 }} />}
                  dt={dt}
                >
                  <MetaGrid fields={batchInfoFields} dt={dt} />
                </Section>

                <Section
                  title={S.WORKFLOW_SECTION}
                  icon={<AccountTreeRoundedIcon sx={{ fontSize: 18 }} />}
                  dt={dt}
                >
                  <MetaGrid fields={workflowFields} dt={dt} />
                </Section>

                <Section
                  title={S.IMPLEMENTATION_SECTION}
                  icon={<VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
                  dt={dt}
                >
                  {sheet ? (
                    <MetaGrid fields={identificationFields} dt={dt} />
                  ) : (
                    <Typography sx={dt.emptyText}>{S.NO_IDENTIFICATION}</Typography>
                  )}
                </Section>

                <Section
                  title={S.MATERIALS_SECTION}
                  icon={<icons.batchMgmt.sourcingStage sx={{ fontSize: 18 }} />}
                  dt={dt}
                >
                  {materials.length === 0 ? (
                    <Typography sx={dt.emptyText}>{S.NO_MATERIALS}</Typography>
                  ) : (
                    <TableContainer sx={dt.tableContainer}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            {S.MATERIAL_COLS.map((col, idx) => (
                              <TableCell key={col} sx={dt.tableHeaderCell(idx === 0)}>
                                {col}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {materials.map((material, idx) => (
                            <TableRow
                              key={`${material.materialCode}-${material.lotId}-${idx}`}
                              sx={dt.tableRow(idx)}
                            >
                              <TableCell sx={dt.tableCell}>{material.srNo || idx + 1}</TableCell>
                              <TableCell sx={dt.tableCell}>
                                {displayValue(material.materialCode)}
                              </TableCell>
                              <TableCell sx={dt.tableCell}>
                                {displayValue(material.materialName)}
                              </TableCell>
                              <TableCell sx={dt.tableCell}>
                                {displayValue(material.gradeName || material.gradeCode)}
                              </TableCell>
                              <TableCell sx={dt.tableCell}>
                                {displayValue(material.lotId)}
                              </TableCell>
                              <TableCell sx={dt.tableCell}>
                                {displayValue(material.make || material.manufacturerName)}
                              </TableCell>
                              <TableCell sx={dt.tableCell}>
                                {displayValue(material.requiredComposition)}
                              </TableCell>
                              <TableCell sx={dt.tableCell}>
                                {displayValue(material.quantityPerPremix)}
                              </TableCell>
                              <TableCell sx={dt.tableCell}>
                                {formatDate(material.revalidationFromDate)}
                              </TableCell>
                              <TableCell sx={dt.tableCell}>
                                {formatDate(material.revalidationToDate)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Section>

                <Section
                  title={S.AUDIT_SECTION}
                  icon={<HistoryRoundedIcon sx={{ fontSize: 18 }} />}
                  dt={dt}
                  isLast
                >
                  <MetaGrid fields={auditFields} dt={dt} />
                </Section>
              </>
            )}
          </Box>

          <Box sx={dt.actions}>
            <Button variant="contained" onClick={onClose}>
              {S.CLOSE}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default BatchDetailsView;
