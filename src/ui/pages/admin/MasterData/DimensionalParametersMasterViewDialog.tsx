import type { ReactNode } from "react";
import { useMemo } from "react";
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
  formatDimensionalRangeLabel,
  formatMotorStageLabel,
  type DimensionalParametersMasterRecord,
} from "@data/models/admin/MasterData/DimensionalParametersMasterModel";
import MasterDataActiveStatusChip from "./components/MasterDataActiveStatusChip";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

const S = STRINGS.MASTER_DATA;

type Props = {
  open: boolean;
  record: DimensionalParametersMasterRecord | null;
  /** All parameters for the same project + motor stage (falls back to `[record]`). */
  stageRecords?: DimensionalParametersMasterRecord[];
  motorStageOptions: AppDropdownOption[];
  projectOptions?: AppDropdownOption[];
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

const DimensionalParametersMasterViewDialog = ({
  open,
  record,
  stageRecords,
  motorStageOptions,
  projectOptions = [],
  onClose,
  t,
}: Props) => {
  const { modal, table } = t;

  const parameters = useMemo(() => {
    if (stageRecords && stageRecords.length > 0) return stageRecords;
    return record ? [record] : [];
  }, [record, stageRecords]);

  const projectLabel = String(
    projectOptions.find((o) => o.value === record?.projectId)?.label ||
      record?.projectId ||
      "—",
  );
  const stageLabel = record
    ? formatMotorStageLabel(record.motorType, motorStageOptions)
    : "—";
  const recordLabel = record ? `${String(projectLabel)} · ${stageLabel}` : "record";
  const activeCount = parameters.filter((item) => item.isActive).length;

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
          title={S.DIMENSIONAL_PARAMETERS.VIEW_TITLE}
          subtitle={S.DIMENSIONAL_PARAMETERS.VIEW_SUBTITLE(recordLabel)}
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
                  md: "repeat(3, 1fr)",
                },
                gap: 1.5,
              }}
            >
              <DetailItem label={S.DIMENSIONAL_PARAMETERS.COL_PROJECT}>
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
              <DetailItem label={S.DIMENSIONAL_PARAMETERS.COL_MOTOR_STAGE}>
                <Typography variant="body2" fontWeight={600}>
                  {stageLabel}
                </Typography>
              </DetailItem>
              <DetailItem label={S.TABLE.COL_ACTIVE}>
                <Typography variant="body2" fontWeight={600}>
                  {activeCount} / {parameters.length} active
                </Typography>
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
                <Typography variant="subtitle2">
                  {S.DIMENSIONAL_PARAMETERS.VIEW_PARAMETERS}
                </Typography>
              </Box>
              <Divider />
              {parameters.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
                  {S.DIMENSIONAL_PARAMETERS.VIEW_NO_PARAMETERS}
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={table?.headerRow}>
                        <TableCell sx={table?.headerCell}>
                          {S.DIMENSIONAL_PARAMETERS.COL_NAME}
                        </TableCell>
                        <TableCell sx={table?.headerCell}>
                          {S.DIMENSIONAL_PARAMETERS.COL_MIN}
                        </TableCell>
                        <TableCell sx={table?.headerCell}>
                          {S.DIMENSIONAL_PARAMETERS.COL_MAX}
                        </TableCell>
                        <TableCell sx={table?.headerCell}>
                          {S.DIMENSIONAL_PARAMETERS.COL_UNIT}
                        </TableCell>
                        <TableCell sx={table?.headerCell}>
                          {S.DIMENSIONAL_PARAMETERS.COL_RANGE}
                        </TableCell>
                        <TableCell sx={table?.headerCell} align="right">
                          {S.TABLE.COL_ACTIVE}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {parameters.map((param) => (
                        <TableRow
                          key={param.parameterId}
                          sx={{
                            ...table?.row,
                            opacity: param.isActive ? 1 : 0.72,
                            bgcolor:
                              record.parameterId === param.parameterId
                                ? "action.selected"
                                : undefined,
                          }}
                        >
                          <TableCell sx={table?.cell}>
                            <Typography sx={table?.bodyText} fontWeight={600}>
                              {param.paramName || "—"}
                            </Typography>
                            {param.paramId ? (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {param.paramId}
                              </Typography>
                            ) : null}
                          </TableCell>
                          <TableCell sx={table?.cell}>
                            <Typography sx={table?.bodyText}>{param.minValue ?? "—"}</Typography>
                          </TableCell>
                          <TableCell sx={table?.cell}>
                            <Typography sx={table?.bodyText}>{param.maxValue ?? "—"}</Typography>
                          </TableCell>
                          <TableCell sx={table?.cell}>
                            <Typography sx={table?.bodyText}>{param.unit || "—"}</Typography>
                          </TableCell>
                          <TableCell sx={table?.cell}>
                            <Typography sx={table?.bodyText}>
                              {formatDimensionalRangeLabel(
                                param.minValue,
                                param.maxValue,
                                param.unit,
                              )}
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

export default DimensionalParametersMasterViewDialog;
