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
  type QualityCheckRecord,
} from "@data/models/admin/MasterData/QualityCheckMasterModel";
import { formatMixTypeLabel } from "@data/models/admin/MasterData/mixTypeOptions";
import MasterDataActiveStatusChip from "./components/MasterDataActiveStatusChip";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

const S = STRINGS.MASTER_DATA;

type Props = {
  open: boolean;
  record: QualityCheckRecord | null;
  motorStageOptions: AppDropdownOption[];
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

const QualityCheckMasterViewDialog = ({ open, record, motorStageOptions, onClose, t }: Props) => {
  const { modal, table } = t;
  const recordLabel = record
    ? `${formatMixTypeLabel(record.mixType)} · ${formatMotorStageLabel(record.motorStage, motorStageOptions)}`
    : "record";

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
          title={S.QUALITY_CHECKS.VIEW_TITLE}
          subtitle={S.QUALITY_CHECKS.VIEW_SUBTITLE(recordLabel)}
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
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                gap: 1.5,
              }}
            >
              <DetailItem label={S.QUALITY_CHECKS.COL_MIX_TYPE}>
                <Typography variant="body2" fontWeight={600}>
                  {formatMixTypeLabel(record.mixType)}
                </Typography>
              </DetailItem>
              <DetailItem label={S.QUALITY_CHECKS.COL_MOTOR_STAGE}>
                <Typography variant="body2" fontWeight={600}>
                  {formatMotorStageLabel(record.motorStage, motorStageOptions)}
                </Typography>
              </DetailItem>
              <DetailItem label={S.TABLE.COL_ACTIVE}>
                <MasterDataActiveStatusChip isActive={record.isActive} />
              </DetailItem>
            </Box>

            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1.5,
                overflow: "hidden",
              }}
            >
              <Box sx={{ px: 2, py: 1.25, bgcolor: "action.hover" }}>
                <Typography variant="subtitle2">{S.QUALITY_CHECKS.PARAMETERS}</Typography>
              </Box>
              <Divider />
              {record.qualityChecks.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
                  {S.QUALITY_CHECKS.VIEW_NO_PARAMETERS}
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={table?.headerRow}>
                        <TableCell sx={table?.headerCell}>{S.QUALITY_CHECKS.PARAM_NAME}</TableCell>
                        <TableCell sx={table?.headerCell}>{S.QUALITY_CHECKS.PARAM_MIN}</TableCell>
                        <TableCell sx={table?.headerCell}>{S.QUALITY_CHECKS.PARAM_MAX}</TableCell>
                        <TableCell sx={table?.headerCell}>{S.QUALITY_CHECKS.PARAM_UNIT}</TableCell>
                        <TableCell sx={table?.headerCell}>{S.QUALITY_CHECKS.PARAM_SAMPLES}</TableCell>
                        <TableCell sx={table?.headerCell} align="right">
                          {S.TABLE.COL_ACTIVE}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {record.qualityChecks.map((param, index) => (
                        <TableRow
                          key={`${param.parameterId || "param"}-${index}`}
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
            </Box>
          </Stack>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default QualityCheckMasterViewDialog;
