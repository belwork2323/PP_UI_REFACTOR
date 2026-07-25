import type { ReactNode } from "react";
import { Box, Button, Chip, Divider, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

/** Shared header card data — create and update both pass this shape. */
export type WorkflowFormHeaderMetaItem = {
  label: string;
  value: string;
};

export type WorkflowFormHeaderData = {
  /** Primary heading (create title, or motor casing / batch id when updating). */
  title: string;
  /** Optional secondary line (create subtitle, or motor id when updating). */
  subtitle?: string;
  /** Optional tertiary caption (e.g. project name · id) — not the visual highlight. */
  caption?: string;
  /** Chip on the top-right (e.g. New Submission / Continuing draft / Editing…). */
  statusLabel: string;
  /** Visual style for the status chip. */
  statusVariant?: "new" | "edit";
  /** When set, replaces the default status chip (use for themed form-status chips). */
  statusNode?: ReactNode;
  /** Shown on the right when editing a rejected record. */
  rejectionReason?: string | null;
  /** Extra chips on the right before the status chip (e.g. Main Scale). */
  extraChips?: ReactNode;
  /**
   * Optional labeled identity rows under the title
   * (prefer title/subtitle/caption for primary identity instead).
   */
  metaItems?: WorkflowFormHeaderMetaItem[];
};

type LegacyBatchInfo = {
  lotId?: string;
  batchId?: string;
  motorId?: string;
  motorType?: string;
  priority?: string;
  rejectionReason?: string | null;
};

type UserWorkflowFormHeaderProps = {
  /** create = new submission heading; update = existing batch/lot context. */
  mode?: "create" | "update";
  /** Preferred: pass display data explicitly. */
  data?: WorkflowFormHeaderData;
  onBack: () => void;
  backLabel?: string;
  rejectionTitle?: string;
  footerContent?: ReactNode;
  headerContentSx?: any;
  headerBanner?: ReactNode;
  theme: any;

  /**
   * Legacy props — still accepted so existing call sites keep working.
   * Prefer `mode` + `data` for new usage.
   */
  batch?: LegacyBatchInfo;
  isEdit?: boolean;
  newLabel?: string;
  editLabel?: string;
  batchHeadingOverride?: { title: string; subtitle?: string };
  additionalChips?: ReactNode;
  /** @deprecated Motor type chip is no longer shown in the shared header. */
  includeMotorType?: boolean;
  /** @deprecated Priority chip is no longer shown in the shared header. */
  showPriority?: boolean;
  statusChipAlign?: "inline" | "end";
  compact?: boolean;
};

const resolveHeaderData = (props: UserWorkflowFormHeaderProps): WorkflowFormHeaderData => {
  if (props.data) return props.data;

  const batch = props.batch ?? {};
  const isEdit = Boolean(props.isEdit);
  const title =
    props.batchHeadingOverride?.title?.trim() ||
    String(batch.batchId || batch.lotId || "—").trim() ||
    "—";
  const subtitle =
    props.batchHeadingOverride?.subtitle?.trim() ||
    (props.mode === "create"
      ? undefined
      : String(batch.motorId ?? "").trim() && String(batch.motorId).trim() !== "—"
        ? String(batch.motorId).trim()
        : undefined);

  return {
    title,
    subtitle: subtitle || undefined,
    statusLabel: isEdit
      ? props.editLabel || "Editing Rejected Submission"
      : props.newLabel || "New Submission",
    statusVariant: isEdit ? "edit" : "new",
    rejectionReason: isEdit ? batch.rejectionReason ?? null : null,
    extraChips: props.additionalChips,
  };
};

/**
 * Shared top form header card for all user subdepartments.
 *
 * - create: title/subtitle from caller (e.g. "Create Motor Casing")
 * - update: title = batch/lot id, subtitle = motor id (no type / priority)
 * - Status chip always top-right; compact height by default
 */
const UserWorkflowFormHeader = ({
  mode = "update",
  data,
  onBack,
  backLabel = "Back to List",
  rejectionTitle = "Rejection Reason",
  footerContent,
  headerContentSx,
  headerBanner,
  theme,
  batch,
  isEdit = false,
  newLabel,
  editLabel,
  batchHeadingOverride,
  additionalChips,
}: UserWorkflowFormHeaderProps) => {
  const resolved = resolveHeaderData({
    mode,
    data,
    onBack,
    batch,
    isEdit,
    newLabel,
    editLabel,
    batchHeadingOverride,
    additionalChips,
    theme,
  });

  const isEditStatus = resolved.statusVariant === "edit" || isEdit;
  const showRejection = Boolean(isEditStatus && resolved.rejectionReason);

  const statusChip = resolved.statusNode ? (
    resolved.statusNode
  ) : isEditStatus ? (
    <Chip
      icon={
        <EditRoundedIcon
          sx={{ fontSize: "12px !important", color: `${theme.palette.danger} !important` }}
        />
      }
      label={resolved.statusLabel}
      size="small"
      sx={theme.workflow.formHeader.chips.edit}
    />
  ) : (
    <Chip label={resolved.statusLabel} size="small" sx={theme.workflow.formHeader.chips.new} />
  );

  return (
    <Box sx={theme.workflow.formHeader.container(isEditStatus)}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ sm: "center" }}
        gap={1}
        justifyContent="space-between"
        sx={headerContentSx}
      >
        <Stack direction="row" alignItems="center" gap={1} minWidth={0} flex={1}>
          <Button
            variant="text"
            size="small"
            startIcon={<ArrowBackRoundedIcon sx={{ fontSize: "16px !important" }} />}
            onClick={onBack}
            sx={theme.workflow.formHeader.backButton}
          >
            {backLabel}
          </Button>

          <Divider orientation="vertical" flexItem sx={theme.workflow.formHeader.divider} />

          <Stack gap={0} minWidth={0}>
            <Typography sx={theme.workflow.formHeader.batchId} noWrap title={resolved.title}>
              {resolved.title}
            </Typography>
            {resolved.subtitle ? (
              <Typography sx={theme.workflow.formHeader.motorId} noWrap title={resolved.subtitle}>
                {resolved.subtitle}
              </Typography>
            ) : null}
            {resolved.caption ? (
              <Typography
                sx={{
                  fontSize: "0.68rem",
                  fontWeight: 500,
                  color: theme.palette.textSub,
                  mt: 0.15,
                }}
                noWrap
                title={resolved.caption}
              >
                {resolved.caption}
              </Typography>
            ) : null}
            {resolved.metaItems && resolved.metaItems.length > 0 ? (
              <Stack direction="row" flexWrap="wrap" useFlexGap gap={1.5} sx={{ mt: 0.35 }}>
                {resolved.metaItems.map((item) => (
                  <Stack key={item.label} direction="row" alignItems="baseline" gap={0.5} minWidth={0}>
                    <Typography
                      sx={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        color: theme.palette.textSub,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: theme.palette.text,
                        maxWidth: 220,
                      }}
                      noWrap
                      title={item.value}
                    >
                      {item.value || "—"}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            ) : null}
            {headerBanner}
          </Stack>
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          gap={0.75}
          flexShrink={0}
          flexWrap="wrap"
          justifyContent={{ xs: "flex-start", sm: "flex-end" }}
        >
          {resolved.extraChips}
          {statusChip}
          {showRejection ? (
            <Box sx={theme.workflow.formHeader.rejectionBox}>
              <Typography sx={theme.workflow.formHeader.rejectionTitle}>{rejectionTitle}</Typography>
              <Typography sx={theme.workflow.formHeader.rejectionText}>
                {resolved.rejectionReason}
              </Typography>
            </Box>
          ) : null}
        </Stack>
      </Stack>

      {footerContent}
    </Box>
  );
};

export default UserWorkflowFormHeader;
