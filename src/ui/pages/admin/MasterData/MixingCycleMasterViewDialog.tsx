import type { ReactNode } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
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
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import AdminManagementFormHeader from "@ui/components/custom/admin/AdminManagementFormHeader";
import {
  formatMotorStageLabel,
  type MixingCycleRecord,
} from "@data/models/admin/MasterData/MixingCycleMasterModel";
import MasterDataActiveStatusChip from "./components/MasterDataActiveStatusChip";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

const S = STRINGS.MASTER_DATA;

type Props = {
  open: boolean;
  record: MixingCycleRecord | null;
  projectOptions?: AppDropdownOption[];
  motorStageOptions?: AppDropdownOption[];
  onClose: () => void;
  t: any;
};

const DetailItem = ({ label, children }: { label: string; children: ReactNode }) => (
  <Box
    sx={{
      px: 1.5,
      py: 1.25,
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 1.5,
      bgcolor: "background.paper",
      minHeight: 56,
    }}
  >
    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
      {label}
    </Typography>
    <Box sx={{ display: "flex", alignItems: "center", minHeight: 24 }}>{children}</Box>
  </Box>
);

const formatSamples = (value: number | "" | null | undefined) => {
  if (value === "" || value == null) return "—";
  return String(value);
};

const SectionShell = ({ title, children }: { title: string; children: ReactNode }) => (
  <Box
    sx={{
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 1.5,
      overflow: "hidden",
    }}
  >
    <Box sx={{ px: 2, py: 1.25, bgcolor: "action.hover" }}>
      <Typography variant="subtitle2">{title}</Typography>
    </Box>
    <Divider />
    {children}
  </Box>
);

const MixingCycleMasterViewDialog = ({
  open,
  record,
  projectOptions = [],
  motorStageOptions = [],
  onClose,
  t,
}: Props) => {
  const { modal, table } = t;
  const projectLabel =
    projectOptions.find((o) => o.value === record?.projectId)?.label ||
    record?.projectId ||
    "—";
  const recordLabel = record?.mixingCycleName || record?.mixingCycleCode || "record";

  const renderOperationsTable = (
    title: string,
    ops: MixingCycleRecord["cycles"]["premixOperations"],
  ) => (
    <SectionShell title={title}>
      {ops.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
          {S.MIXING_CYCLES.VIEW_NO_OPERATIONS}
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={table?.headerRow}>
                <TableCell sx={table?.headerCell}>{S.MIXING_CYCLES.OP_SEQUENCE}</TableCell>
                <TableCell sx={table?.headerCell}>{S.MIXING_CYCLES.OP_NAME}</TableCell>
                <TableCell sx={table?.headerCell} align="right">
                  {S.TABLE.COL_ACTIVE}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ops.map((op, index) => (
                <TableRow
                  key={`${op.operationId ?? "op"}-${index}`}
                  sx={{
                    ...table?.row,
                    opacity: op.isActive ? 1 : 0.72,
                  }}
                >
                  <TableCell sx={table?.cell}>
                    <Typography sx={table?.bodyText}>
                      {op.sequenceNo != null ? String(op.sequenceNo) : "—"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={table?.cell}>
                    <Typography sx={table?.bodyText}>{op.operationName || "—"}</Typography>
                  </TableCell>
                  <TableCell sx={table?.cell} align="right">
                    <Box sx={{ display: "inline-flex" }}>
                      <MasterDataActiveStatusChip isActive={op.isActive} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </SectionShell>
  );

  const renderQualityChecksTable = (
    title: string,
    params: MixingCycleRecord["cycles"]["premixQualityChecks"],
  ) => (
    <SectionShell title={title}>
      {params.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
          {S.MIXING_CYCLES.VIEW_NO_QUALITY_CHECKS}
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={table?.headerRow}>
                <TableCell sx={table?.headerCell}>{S.MIXING_CYCLES.QC_PARAM_NAME}</TableCell>
                <TableCell sx={table?.headerCell}>{S.MIXING_CYCLES.QC_MIN}</TableCell>
                <TableCell sx={table?.headerCell}>{S.MIXING_CYCLES.QC_MAX}</TableCell>
                <TableCell sx={table?.headerCell}>{S.MIXING_CYCLES.QC_UNIT}</TableCell>
                <TableCell sx={table?.headerCell}>{S.MIXING_CYCLES.QC_SAMPLES}</TableCell>
                <TableCell sx={table?.headerCell} align="right">
                  {S.TABLE.COL_ACTIVE}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {params.map((param, index) => (
                <TableRow
                  key={`${param.parameterId || "qc"}-${index}`}
                  sx={{
                    ...table?.row,
                    opacity: param.isActive ? 1 : 0.72,
                  }}
                >
                  <TableCell sx={table?.cell}>
                    <Typography sx={table?.bodyText}>{param.parameterName || "—"}</Typography>
                  </TableCell>
                  <TableCell sx={table?.cell}>
                    <Typography sx={table?.bodyText}>
                      {param.specification?.minValue ?? "—"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={table?.cell}>
                    <Typography sx={table?.bodyText}>
                      {param.specification?.maxValue ?? "—"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={table?.cell}>
                    <Typography sx={table?.bodyText}>
                      {param.specification?.unit || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={table?.cell}>
                    <Typography sx={table?.bodyText}>
                      {formatSamples(param.noOfSamples)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={table?.cell} align="right">
                    <Box sx={{ display: "inline-flex" }}>
                      <MasterDataActiveStatusChip isActive={param.isActive} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </SectionShell>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Zoom}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: modal.paper }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <AdminManagementFormHeader
          icon={<icons.visibility sx={modal.header.icon} />}
          title={S.MIXING_CYCLES.VIEW_TITLE}
          subtitle={S.MIXING_CYCLES.VIEW_SUBTITLE(recordLabel)}
          onClose={onClose}
          theme={t}
        />
      </DialogTitle>

      <DialogContent sx={modal.content}>
        <Box sx={modal.headerGap} />
        {record ? (
          <Stack spacing={2.5}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 1.5,
              }}
            >
              <DetailItem label={S.MIXING_CYCLES.COL_PROJECT}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {String(projectLabel)}
                  </Typography>
                  {record.projectId ? (
                    <Typography variant="caption" color="text.secondary">
                      {record.projectId}
                    </Typography>
                  ) : null}
                </Box>
              </DetailItem>
              <DetailItem label={S.MIXING_CYCLES.COL_MOTOR_STAGE}>
                <Typography variant="body2" fontWeight={600}>
                  {formatMotorStageLabel(record.motorStage, motorStageOptions)}
                </Typography>
              </DetailItem>
              <DetailItem label={S.MIXING_CYCLES.COL_NAME}>
                <Typography variant="body2" fontWeight={600}>
                  {record.mixingCycleName || "—"}
                </Typography>
              </DetailItem>
              <DetailItem label={S.TABLE.COL_ACTIVE}>
                <MasterDataActiveStatusChip isActive={record.isActive} />
              </DetailItem>
            </Box>

            {record.description ? (
              <Typography variant="body2" color="text.secondary">
                <strong>{S.MIXING_CYCLES.LABEL_DESCRIPTION}:</strong> {record.description}
              </Typography>
            ) : null}

            {renderOperationsTable(S.MIXING_CYCLES.VIEW_PREMIX, record.cycles.premixOperations)}
            {renderQualityChecksTable(
              S.MIXING_CYCLES.VIEW_PREMIX_QC,
              record.cycles.premixQualityChecks,
            )}
            {renderOperationsTable(S.MIXING_CYCLES.VIEW_FINAL_MIX, record.cycles.finalMixOperations)}
            {renderQualityChecksTable(
              S.MIXING_CYCLES.VIEW_FINAL_MIX_QC,
              record.cycles.finalMixQualityChecks,
            )}
          </Stack>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default MixingCycleMasterViewDialog;
