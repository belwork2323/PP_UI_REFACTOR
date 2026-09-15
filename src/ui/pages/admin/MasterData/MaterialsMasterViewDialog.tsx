import React from "react";
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
  getRawMaterialCategoryLabel,
  type MaterialSpecForm,
  type MaterialsMasterRecord,
} from "@data/models/admin/MasterData/MaterialsMasterModel";
import { formatMasterDataReferenceRangeLabel } from "@data/models/admin/MasterData/nestedMasterDataTypes";
import MasterDataActiveStatusChip from "./components/MasterDataActiveStatusChip";

const S = STRINGS.MASTER_DATA;

const ActiveStatusField = ({ isActive }: { isActive: boolean }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
    <Typography variant="body2" component="span">
      <strong>{S.TABLE.COL_ACTIVE}:</strong>
    </Typography>
    <MasterDataActiveStatusChip isActive={isActive} />
  </Box>
);

type Props = {
  open: boolean;
  record: MaterialsMasterRecord | null;
  onClose: () => void;
  t: any;
};

const renderSpecRow = (
  spec: MaterialSpecForm,
  index: number,
  total: number,
  showActive = true,
) => (
  <Box
    key={`${spec.specificationCode}-${spec.specificationName}-${index}`}
    sx={{
      display: "grid",
      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
      gap: 1,
      py: 1,
      borderBottom: index < total - 1 ? "1px solid" : "none",
      borderColor: "divider",
    }}
  >
    <Typography variant="body2">
      <strong>{S.MATERIALS.VIEW_COL_NAME}:</strong> {spec.specificationName || "—"}
    </Typography>
    <Typography variant="body2">
      <strong>{S.MATERIALS.VIEW_COL_RANGE}:</strong>{" "}
      {formatMasterDataReferenceRangeLabel(spec.referenceRange)}
    </Typography>
    {showActive ? (
      <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
        <ActiveStatusField isActive={spec.isActive} />
      </Box>
    ) : null}
  </Box>
);

const MaterialsMasterViewDialog = ({ open, record, onClose, t }: Props) => {
  const { modal } = t;
  const recordLabel = String(record?.materialName ?? record?.materialCode ?? "").trim() || "record";
  const hasContent =
    (record?.specifications.length ?? 0) > 0 || (record?.grades.length ?? 0) > 0;

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
          title={S.MATERIALS.VIEW_TITLE}
          subtitle={S.MATERIALS.VIEW_SUBTITLE(recordLabel)}
          onClose={onClose}
          theme={t}
        />
      </DialogTitle>

      <DialogContent sx={modal.content}>
        <Box sx={modal.headerGap} />
        {!record ? (
          <Typography color="text.secondary">{S.MATERIALS.VIEW_EMPTY}</Typography>
        ) : (
          <Stack spacing={2}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
              <Typography variant="body2">
                <strong>Code:</strong> {record.materialCode || "—"}
              </Typography>
              <Typography variant="body2">
                <strong>Type:</strong> {record.materialType || "—"}
              </Typography>
              <Typography variant="body2">
                <strong>Category:</strong> {getRawMaterialCategoryLabel(record.rawMaterialType)}
              </Typography>
              {record.rawMaterialType === "ACEM" && record.preparationType ? (
                <Typography variant="body2">
                  <strong>Preparation:</strong> {record.preparationType}
                </Typography>
              ) : null}
              <ActiveStatusField isActive={record.isActive} />
            </Box>

            {!hasContent ? (
              <Typography color="text.secondary">{S.MATERIALS.VIEW_EMPTY}</Typography>
            ) : null}

            {record.specifications.length > 0 ? (
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  overflow: "hidden",
                }}
              >
                <Box sx={{ px: 2, py: 1.25, bgcolor: "action.hover" }}>
                  <Typography variant="subtitle2">{S.MATERIALS.VIEW_TOP_LEVEL_SPECS}</Typography>
                </Box>
                <Divider />
                <Stack spacing={0} sx={{ px: 2, py: 1.5 }}>
                  {record.specifications.map((spec, index) =>
                    renderSpecRow(spec, index, record.specifications.length),
                  )}
                </Stack>
              </Box>
            ) : null}

            {record.grades.map((grade) => (
              <Box
                key={grade.gradeId || grade.gradeCode}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  overflow: "hidden",
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
                    opacity: !grade.isActive ? 0.72 : 1,
                  }}
                >
                  <Typography variant="subtitle2">
                    {grade.gradeCode} — {grade.gradeName}
                  </Typography>
                  <ActiveStatusField isActive={grade.isActive} />
                </Box>
                <Divider />
                <Stack spacing={0} sx={{ px: 2, py: 1.5 }}>
                  {grade.specifications.length > 0 ? (
                    grade.specifications.map((spec, index) =>
                      renderSpecRow(spec, index, grade.specifications.length, true),
                    )
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {S.MATERIALS.VIEW_NO_SPECS}
                    </Typography>
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MaterialsMasterViewDialog;
