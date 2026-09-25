import type { ReactNode } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
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
import { formatMasterDataReferenceRangeLabel } from "@data/models/admin/MasterData/nestedMasterDataTypes";
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

const renderOperations = (title: string, ops: MixingCycleRecord["cycles"]["premixOperations"]) => (
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
    <Stack spacing={0.75} sx={{ px: 2, py: 1.5 }}>
      {ops.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {S.MIXING_CYCLES.VIEW_NO_OPERATIONS}
        </Typography>
      ) : (
        ops.map((op, index) => (
          <Box
            key={`${op.operationId ?? "op"}-${index}`}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              opacity: op.isActive ? 1 : 0.72,
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {op.sequenceNo != null ? `${op.sequenceNo}. ` : ""}
              {op.operationName}
            </Typography>
            <MasterDataActiveStatusChip isActive={op.isActive} />
          </Box>
        ))
      )}
    </Stack>
  </Box>
);

const renderQualityChecks = (
  title: string,
  params: MixingCycleRecord["cycles"]["premixQualityChecks"],
) => (
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
    <Stack spacing={0.75} sx={{ px: 2, py: 1.5 }}>
      {params.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {S.MIXING_CYCLES.VIEW_NO_QUALITY_CHECKS}
        </Typography>
      ) : (
        params.map((param, index) => (
          <Box
            key={`${param.parameterId || "qc"}-${index}`}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              opacity: param.isActive ? 1 : 0.72,
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {param.parameterName}
              {param.noOfSamples !== "" ? ` · ${param.noOfSamples} samples` : ""}
              {" · "}
              {formatMasterDataReferenceRangeLabel(param.specification)}
            </Typography>
            <MasterDataActiveStatusChip isActive={param.isActive} />
          </Box>
        ))
      )}
    </Stack>
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
  const { modal } = t;
  const projectLabel =
    projectOptions.find((o) => o.value === record?.projectId)?.label ||
    record?.projectId ||
    "—";
  const recordLabel = record?.mixingCycleName || record?.mixingCycleCode || "record";

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

            {renderOperations(S.MIXING_CYCLES.VIEW_PREMIX, record.cycles.premixOperations)}
            {renderQualityChecks(S.MIXING_CYCLES.VIEW_PREMIX_QC, record.cycles.premixQualityChecks)}
            {renderOperations(S.MIXING_CYCLES.VIEW_FINAL_MIX, record.cycles.finalMixOperations)}
            {renderQualityChecks(
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
