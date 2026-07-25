import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import ConfirmAlertDialog from "../../../../../components/common/ConfirmAlertDialog";
import { STRINGS } from "../../../../../../app/config/strings";
import {
  buildMixingApproverCards,
  type MixCardStatusMeta,
  type MixCardSubmissionStatus,
  type MixingFormState,
} from "../../../../../../data/models/user/MixingFormModel";
import PremixStatusChip, {
  type PremixStatusThemeConfig,
} from "../../RawMaterial/components/PremixStatusChip";

const S = STRINGS.MANUFACTURING.MIXING;

export type FinalApprovalMixCardRow = {
  mixCardId: string;
  label: string;
  stageType: string;
  mixCardSubmissionStatus: MixCardSubmissionStatus | string;
  mixCardSubmissionType?: string | null;
};

type FinalApprovalMixCardDialogProps = {
  open: boolean;
  rows: FinalApprovalMixCardRow[];
  statusConfig: PremixStatusThemeConfig;
  allMixCardsApproved: boolean;
  confirmDisabled?: boolean;
  onClose: () => void;
  onProceed: () => void;
};

export const buildFinalApprovalMixCardRows = (
  formData: MixingFormState | null | undefined,
  mixCardStatusById: Record<string, MixCardStatusMeta> | undefined,
): FinalApprovalMixCardRow[] => {
  const cards = buildMixingApproverCards({
    premixCards: (formData?.premixCards ?? []).map((card) => {
      const mixCardId = `PREMIX-${String(card.premixNo).trim()}`;
      return {
        ...card,
        mixCardSubmissionStatus:
          mixCardStatusById?.[mixCardId]?.mixCardSubmissionStatus ??
          card.mixCardSubmissionStatus ??
          "TO_BE_INITIATED",
      };
    }),
    finalMixCards: (formData?.finalMixCards ?? []).map((card) => {
      const mixCardId = `FINAL_MIX-${String(card.mixNo).trim()}`;
      return {
        ...card,
        mixCardSubmissionStatus:
          mixCardStatusById?.[mixCardId]?.mixCardSubmissionStatus ??
          card.mixCardSubmissionStatus ??
          "TO_BE_INITIATED",
      };
    }),
  });

  return cards.map((card) => ({
    mixCardId: card.mixCardId,
    label: card.label,
    stageType: card.stageType === "FINAL_MIX" ? "Final Mix" : "Premix",
    mixCardSubmissionStatus: card.mixCardSubmissionStatus,
    mixCardSubmissionType: mixCardStatusById?.[card.mixCardId]?.mixCardSubmissionType ?? null,
  }));
};

export const areAllMixCardsApproved = (rows: FinalApprovalMixCardRow[]): boolean =>
  rows.length > 0 &&
  rows.every((row) => String(row.mixCardSubmissionStatus).toUpperCase() === "APPROVED");

const FinalApprovalMixCardDialog = ({
  open,
  rows,
  statusConfig,
  allMixCardsApproved,
  confirmDisabled = false,
  onClose,
  onProceed,
}: FinalApprovalMixCardDialogProps) => (
  <ConfirmAlertDialog
    open={open}
    title={S.FINAL_APPROVAL_DIALOG_TITLE}
    message={S.FINAL_APPROVAL_DIALOG_INFO}
    severity="info"
    maxWidth="sm"
    confirmLabel={S.FINAL_APPROVAL_PROCEED}
    cancelLabel={S.FINAL_APPROVAL_CLOSE}
    confirmDisabled={!allMixCardsApproved || confirmDisabled}
    onConfirm={onProceed}
    onCancel={onClose}
  >
    <Box
      sx={{
        mt: 1.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1.5,
        overflow: "hidden",
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "action.hover" }}>
            <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
              {S.FINAL_APPROVAL_COL_CARD}
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
              {S.FINAL_APPROVAL_COL_TYPE}
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
              {S.FINAL_APPROVAL_COL_STATUS}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.mixCardId}>
              <TableCell sx={{ fontSize: "0.78rem", fontWeight: 600 }}>{row.label}</TableCell>
              <TableCell sx={{ fontSize: "0.74rem" }}>{row.stageType}</TableCell>
              <TableCell>
                <PremixStatusChip
                  status={row.mixCardSubmissionStatus as any}
                  statusConfig={statusConfig}
                  variant="embedded"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  </ConfirmAlertDialog>
);

export default FinalApprovalMixCardDialog;
