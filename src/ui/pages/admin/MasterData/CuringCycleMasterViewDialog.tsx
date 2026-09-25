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
  type CuringCycleRecord,
} from "@data/models/admin/MasterData/CuringCycleMasterModel";
import { formatCuringTypeLabel } from "@hooks/user/manufacturing/castingCuringFlowConfig";
import MasterDataActiveStatusChip from "./components/MasterDataActiveStatusChip";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

const S = STRINGS.MASTER_DATA;

type Props = {
  open: boolean;
  record: CuringCycleRecord | null;
  projectOptions?: AppDropdownOption[];
  motorStageOptions: AppDropdownOption[];
  onClose: () => void;
  t: any;
};

const formatValue = (value: number | "" | null | undefined, suffix = "") => {
  if (value === "" || value == null) return "—";
  return `${value}${suffix}`;
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

const CuringCycleMasterViewDialog = ({
  open,
  record,
  projectOptions = [],
  motorStageOptions,
  onClose,
  t,
}: Props) => {
  const { modal, table } = t;
  const projectLabel =
    projectOptions.find((o) => o.value === record?.projectId)?.label ||
    record?.projectId ||
    "—";
  const recordLabel = record
    ? `${formatMotorStageLabel(record.motorStage, motorStageOptions)} · ${formatCuringTypeLabel(record.curingType)}`
    : "record";
  const showPressure = Boolean(record?.showPropellantPressure);

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
          title={S.CURING_CYCLES.VIEW_TITLE}
          subtitle={S.CURING_CYCLES.VIEW_SUBTITLE(recordLabel)}
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
                  md: showPressure ? "repeat(5, 1fr)" : "repeat(4, 1fr)",
                },
                gap: 1.5,
              }}
            >
              <DetailItem label={S.CURING_CYCLES.COL_PROJECT}>
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
              <DetailItem label={S.CURING_CYCLES.COL_MOTOR_STAGE}>
                <Typography variant="body2" fontWeight={600}>
                  {formatMotorStageLabel(record.motorStage, motorStageOptions)}
                </Typography>
              </DetailItem>
              <DetailItem label={S.CURING_CYCLES.COL_CURING_TYPE}>
                <Typography variant="body2" fontWeight={600}>
                  {formatCuringTypeLabel(record.curingType)}
                </Typography>
              </DetailItem>
              <DetailItem label={S.CURING_CYCLES.LABEL_SHOW_PRESSURE}>
                <Typography variant="body2" fontWeight={600}>
                  {record.showPropellantPressure ? "Yes" : "No"}
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
                <Typography variant="subtitle2">{S.CURING_CYCLES.CYCLE_STEPS}</Typography>
              </Box>
              <Divider />
              {record.cycles.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
                  {S.CURING_CYCLES.VIEW_NO_STEPS}
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={table?.headerRow}>
                        <TableCell sx={table?.headerCell}>{S.CURING_CYCLES.STEP_TEMPERATURE}</TableCell>
                        <TableCell sx={table?.headerCell}>{S.CURING_CYCLES.STEP_DURATION}</TableCell>
                        {showPressure ? (
                          <TableCell sx={table?.headerCell}>{S.CURING_CYCLES.STEP_PRESSURE}</TableCell>
                        ) : null}
                        <TableCell sx={table?.headerCell} align="right">
                          {S.TABLE.COL_ACTIVE}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {record.cycles.map((step, index) => (
                        <TableRow
                          key={`${step.stepId ?? "step"}-${index}`}
                          sx={{
                            ...table?.row,
                            opacity: step.isActive ? 1 : 0.72,
                          }}
                        >
                          <TableCell sx={table?.cell}>
                            <Typography sx={table?.bodyText}>
                              {formatValue(step.temperature, "°")}
                            </Typography>
                          </TableCell>
                          <TableCell sx={table?.cell}>
                            <Typography sx={table?.bodyText}>
                              {formatValue(step.durationMinutes, " min")}
                            </Typography>
                          </TableCell>
                          {showPressure ? (
                            <TableCell sx={table?.cell}>
                              <Typography sx={table?.bodyText}>
                                {formatValue(step.propellantPressure)}
                              </Typography>
                            </TableCell>
                          ) : null}
                          <TableCell sx={table?.cell} align="right">
                            <Box sx={{ display: "inline-flex" }}>
                              <MasterDataActiveStatusChip isActive={step.isActive} />
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

export default CuringCycleMasterViewDialog;
