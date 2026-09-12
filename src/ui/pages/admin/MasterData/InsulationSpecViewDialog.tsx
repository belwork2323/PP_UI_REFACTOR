import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
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
import { formatMasterDataReferenceRangeLabel } from "@data/models/admin/MasterData/nestedMasterDataTypes";
import type { InsulationSpecRecord } from "@data/models/admin/MasterData/InsulationSpecMasterModel";

const S = STRINGS.MASTER_DATA;

type Props = {
  open: boolean;
  record: InsulationSpecRecord | null;
  onClose: () => void;
  t: any;
};

const formatStatus = (isActive: boolean) => (isActive ? S.TABLE.YES : S.TABLE.NO);

const InsulationSpecViewDialog = ({ open, record, onClose, t }: Props) => {
  const { modal } = t;
  const recordLabel = String(record?.insulationType ?? "").trim() || "record";

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
          title={S.INSULATION_SPEC.VIEW_TITLE}
          subtitle={S.INSULATION_SPEC.VIEW_SUBTITLE(recordLabel)}
          onClose={onClose}
          theme={t}
        />
      </DialogTitle>

      <DialogContent sx={modal.content}>
        <Box sx={modal.headerGap} />
        {!record || record.specifications.length === 0 ? (
          <Typography color="text.secondary">{S.INSULATION_SPEC.VIEW_EMPTY}</Typography>
        ) : (
          <Stack spacing={2}>
            {record.specifications.map((category, categoryIndex) => (
              <Box
                key={`${category.category}-${categoryIndex}`}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  overflow: "hidden",
                  opacity: !category.isActive ? 0.72 : 1,
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1.25,
                    bgcolor: "action.hover",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography variant="subtitle2">{category.category || "—"}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>{S.INSULATION_SPEC.VIEW_COL_STATUS}:</strong>{" "}
                    {formatStatus(category.isActive)}
                  </Typography>
                </Box>
                <Divider />
                <Stack spacing={0} sx={{ px: 2, py: 1.5 }}>
                  {(category.parameters ?? []).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {S.INSULATION_SPEC.VIEW_NO_PARAMETERS}
                    </Typography>
                  ) : (
                    (category.parameters ?? []).map((param, paramIndex) => (
                      <Box
                        key={`${param.specificationCode}-${paramIndex}`}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                          gap: 1,
                          py: 1,
                          opacity: !param.isActive ? 0.72 : 1,
                          borderBottom:
                            paramIndex < (category.parameters?.length ?? 0) - 1
                              ? "1px solid"
                              : "none",
                          borderColor: "divider",
                        }}
                      >
                        <Typography variant="body2">
                          <strong>{S.INSULATION_SPEC.VIEW_COL_NAME}:</strong>{" "}
                          {param.specificationName || "—"}
                        </Typography>
                        <Typography variant="body2">
                          <strong>{S.INSULATION_SPEC.VIEW_COL_RANGE}:</strong>{" "}
                          {formatMasterDataReferenceRangeLabel(param.referenceRange)}
                        </Typography>
                        <Typography variant="body2" sx={{ gridColumn: { sm: "1 / -1" } }}>
                          <strong>{S.INSULATION_SPEC.VIEW_COL_STATUS}:</strong>{" "}
                          {formatStatus(param.isActive)}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={modal.actions}>
        <Button onClick={onClose} sx={modal.cancelButton}>
          {S.FORM.CANCEL}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InsulationSpecViewDialog;
