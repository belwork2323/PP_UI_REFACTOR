import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Collapse,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ConfirmAlertDialog from "../../../../../components/common/ConfirmAlertDialog";
import { STRINGS } from "../../../../../../app/config/strings";
import {
  PARTIAL_ITEM_STATUS_CHIP,
  type QcFinalApprovalDivisionGroup,
  type QcPartialItemStatus,
} from "../../../../../../hooks/user/qualityControl/qcDivisionApprovalUnits";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

type FinalApprovalDivisionDialogProps = {
  open: boolean;
  groups: QcFinalApprovalDivisionGroup[];
  canProceed: boolean;
  confirmDisabled?: boolean;
  hideConfirm?: boolean;
  onClose: () => void;
  onProceed: () => void;
};

const StatusChip = ({ status }: { status: QcPartialItemStatus }) => {
  const chip = PARTIAL_ITEM_STATUS_CHIP[status] ?? PARTIAL_ITEM_STATUS_CHIP.TO_BE_INITIATED;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        px: 1,
        py: 0.3,
        borderRadius: 1,
        fontSize: "0.7rem",
        fontWeight: 700,
        bgcolor: chip.bg,
        color: chip.color,
        border: `1px solid ${chip.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {chip.label}
    </Box>
  );
};

const unitColumnLabel = (group: QcFinalApprovalDivisionGroup): string => {
  if (group.units.some((unit) => unit.kind === "MOTOR")) {
    return S.FINAL_APPROVAL_COL_MOTOR || "Motor";
  }
  if (
    group.units.some((unit) => unit.kind === "FINAL_MIX") &&
    group.units.some((unit) => unit.kind === "PREMIX")
  ) {
    return "Unit";
  }
  if (group.units.some((unit) => unit.kind === "FINAL_MIX")) return "Final Mix";
  if (group.units.some((unit) => unit.kind === "PREMIX")) {
    return S.FINAL_APPROVAL_COL_PREMIX || "Premix";
  }
  return S.FINAL_APPROVAL_COL_UNIT || "Unit";
};

const FinalApprovalDivisionDialog = ({
  open,
  groups,
  canProceed,
  confirmDisabled = false,
  hideConfirm = false,
  onClose,
  onProceed,
}: FinalApprovalDivisionDialogProps) => {
  const safeGroups = useMemo(() => (Array.isArray(groups) ? groups : []), [groups]);
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({});

  // Reset to collapsed whenever the dialog opens or the group list changes.
  useEffect(() => {
    if (!open) return;
    const next: Record<string, boolean> = {};
    safeGroups.forEach((group) => {
      next[group.id] = false;
    });
    setExpandedById(next);
  }, [open, safeGroups]);

  const toggleGroup = (groupId: string) => {
    setExpandedById((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <ConfirmAlertDialog
      open={open}
      title={S.FINAL_APPROVAL_DIALOG_TITLE}
      message={S.FINAL_APPROVAL_DIALOG_INFO}
      severity="info"
      maxWidth="lg"
      confirmLabel={S.FINAL_APPROVAL_PROCEED}
      cancelLabel={S.FINAL_APPROVAL_CLOSE}
      confirmDisabled={!canProceed || confirmDisabled}
      hideConfirm={hideConfirm}
      onConfirm={onProceed}
      onCancel={onClose}
    >
      <Box
        sx={{
          mt: 1.5,
          maxHeight: "65vh",
          overflowY: "auto",
          pr: 0.5,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1.5,
        }}
      >
        <Stack spacing={0}>
          {safeGroups.map((group, index) => {
            const hasUnits = group.units.length > 0;
            const expanded = Boolean(expandedById[group.id]);
            return (
              <Box
                key={group.id}
                sx={{
                  borderBottom: index < safeGroups.length - 1 ? "1px solid" : "none",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                  onClick={hasUnits ? () => toggleGroup(group.id) : undefined}
                  sx={{
                    px: 1.5,
                    py: 1.1,
                    bgcolor: "grey.50",
                    cursor: hasUnits ? "pointer" : "default",
                    "&:hover": hasUnits ? { bgcolor: "action.hover" } : undefined,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
                    {hasUnits ? (
                      <IconButton
                        size="small"
                        aria-label={expanded ? "Collapse division" : "Expand division"}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleGroup(group.id);
                        }}
                        sx={{ color: "text.secondary" }}
                      >
                        {expanded ? (
                          <ExpandLessRoundedIcon fontSize="small" />
                        ) : (
                          <ExpandMoreRoundedIcon fontSize="small" />
                        )}
                      </IconButton>
                    ) : (
                      <Box sx={{ width: 34 }} />
                    )}
                    <Typography
                      sx={{
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {group.divisionLabel}
                    </Typography>
                  </Stack>
                  <StatusChip status={group.divisionStatus} />
                </Stack>

                {hasUnits ? (
                  <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <TableContainer sx={{ px: 1.5, pb: 1.25, pt: 0.25 }}>
                      <Table
                        size="small"
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          overflow: "hidden",
                          "& th, & td": { borderColor: "divider" },
                        }}
                      >
                        <TableHead>
                          <TableRow sx={{ bgcolor: "action.hover" }}>
                            <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", width: "55%" }}>
                              {unitColumnLabel(group)}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                              {S.FINAL_APPROVAL_COL_STATUS}
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {group.units.map((unit) => (
                            <TableRow key={`${group.id}:${unit.id}`} hover>
                              <TableCell sx={{ fontSize: "0.82rem", fontWeight: 600 }}>
                                {unit.label}
                              </TableCell>
                              <TableCell>
                                <StatusChip status={unit.status} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Collapse>
                ) : null}
              </Box>
            );
          })}
        </Stack>
      </Box>

      {!hideConfirm && !canProceed ? (
        <Box sx={{ mt: 1.25, fontSize: "0.78rem", color: "text.secondary", fontWeight: 600 }}>
          {S.FINAL_APPROVAL_NOT_READY}
        </Box>
      ) : null}
    </ConfirmAlertDialog>
  );
};

export default FinalApprovalDivisionDialog;
