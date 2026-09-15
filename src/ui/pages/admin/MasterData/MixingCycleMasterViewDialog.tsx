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
import MasterDataActiveStatusChip from "./components/MasterDataActiveStatusChip";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

const S = STRINGS.MASTER_DATA;

type Props = {
  open: boolean;
  record: MixingCycleRecord | null;
  motorStageOptions: AppDropdownOption[];
  onClose: () => void;
  t: any;
};

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

const MixingCycleMasterViewDialog = ({ open, record, motorStageOptions, onClose, t }: Props) => {
  const { modal } = t;
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
          <Stack spacing={2}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
                gap: 2,
              }}
            >
              <Typography variant="body2">
                <strong>{S.MIXING_CYCLES.COL_CODE}:</strong> {record.mixingCycleCode}
              </Typography>
              <Typography variant="body2">
                <strong>{S.MIXING_CYCLES.COL_NAME}:</strong> {record.mixingCycleName}
              </Typography>
              <Typography variant="body2">
                <strong>{S.MIXING_CYCLES.COL_MOTOR_STAGE}:</strong>{" "}
                {formatMotorStageLabel(record.motorStage, motorStageOptions)}
              </Typography>
              <Typography variant="body2">
                <strong>{S.MIXING_CYCLES.LABEL_DESCRIPTION}:</strong> {record.description || "—"}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" component="span">
                  <strong>{S.TABLE.COL_ACTIVE}:</strong>
                </Typography>
                <MasterDataActiveStatusChip isActive={record.isActive} />
              </Box>
            </Box>
            {renderOperations(S.MIXING_CYCLES.VIEW_PREMIX, record.cycles.premixOperations)}
            {renderOperations(S.MIXING_CYCLES.VIEW_FINAL_MIX, record.cycles.finalMixOperations)}
          </Stack>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default MixingCycleMasterViewDialog;
