import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import {
  formatMasterDataDateTime,
  formatMasterDataPerson,
} from "./components/MasterDataAuditColumns";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

const S = STRINGS.MASTER_DATA;

type Props = {
  open: boolean;
  record: DimensionalParametersMasterRecord | null;
  motorStageOptions: AppDropdownOption[];
  onClose: () => void;
  t: any;
};

const DimensionalParametersMasterViewDialog = ({
  open,
  record,
  motorStageOptions,
  onClose,
  t,
}: Props) => {
  const { modal } = t;
  const recordLabel = record?.paramName || "record";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Zoom}
      maxWidth="sm"
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
        {record ? (
          <Box sx={{ display: "grid", gap: 1.25 }}>
            <Typography variant="body2">
              <strong>{S.DIMENSIONAL_PARAMETERS.COL_NAME}:</strong> {record.paramName}
            </Typography>
            <Typography variant="body2">
              <strong>{S.DIMENSIONAL_PARAMETERS.COL_MOTOR_STAGE}:</strong>{" "}
              {formatMotorStageLabel(record.motorType, motorStageOptions)}
            </Typography>
            <Typography variant="body2">
              <strong>{S.DIMENSIONAL_PARAMETERS.COL_RANGE}:</strong>{" "}
              {formatDimensionalRangeLabel(record.minValue, record.maxValue, record.unit)}
            </Typography>
            <Typography variant="body2">
              <strong>{S.DIMENSIONAL_PARAMETERS.COL_UNIT}:</strong> {record.unit || "—"}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" component="span">
                <strong>{S.TABLE.COL_ACTIVE}:</strong>
              </Typography>
              <MasterDataActiveStatusChip isActive={record.isActive} />
            </Box>
            <Typography variant="body2">
              <strong>{S.TABLE.COL_CREATED_BY}:</strong> {formatMasterDataPerson(record.createdBy)}
            </Typography>
            <Typography variant="body2">
              <strong>{S.TABLE.COL_CREATED_ON}:</strong> {formatMasterDataDateTime(record.createdOn)}
            </Typography>
            <Typography variant="body2">
              <strong>{S.TABLE.COL_UPDATED_BY}:</strong> {formatMasterDataPerson(record.updatedBy)}
            </Typography>
            <Typography variant="body2">
              <strong>{S.TABLE.COL_UPDATED_ON}:</strong> {formatMasterDataDateTime(record.updatedOn)}
            </Typography>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={modal.actions}>
        <Button onClick={onClose}>{S.FORM.CANCEL}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DimensionalParametersMasterViewDialog;
