import { useState } from "react";
import { Box, Switch, Typography } from "@mui/material";
import { STRINGS } from "@app/config/strings";
import ConfirmAlertDialog from "@ui/components/common/ConfirmAlertDialog";
import { masterDataActiveSwitchSx } from "./MasterDataActiveSwitch";

const S = STRINGS.MASTER_DATA;

type Props = {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  /** Label shown in the confirmation dialog. */
  confirmName?: string;
  /** When false, toggles apply immediately without confirmation. */
  requireConfirmation?: boolean;
  labelVariant?: "body2" | "caption";
  minWidth?: number;
};

/** Label stacked above the enable/disable switch for master data forms. */
const MasterDataEnableDisableField = ({
  checked,
  disabled = false,
  onChange,
  confirmName,
  requireConfirmation = true,
  labelVariant = "body2",
  minWidth = 88,
}: Props) => {
  const [pending, setPending] = useState<boolean | null>(null);
  const itemLabel = confirmName?.trim() || "this item";

  const requestChange = (next: boolean) => {
    if (disabled) return;
    if (!requireConfirmation) {
      onChange(next);
      return;
    }
    setPending(next);
  };

  const enabling = pending === true;

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
          minWidth,
        }}
      >
        <Typography
          variant={labelVariant}
          color="text.secondary"
          sx={{
            textAlign: "center",
            fontSize: "0.72rem",
            fontWeight: 600,
            lineHeight: 1.25,
            mb: 0.25,
            whiteSpace: "nowrap",
          }}
        >
          {S.FORM.ACTIVE_LABEL}
        </Typography>
        <Switch
          size="small"
          checked={checked}
          disabled={disabled}
          onChange={(e) => requestChange(e.target.checked)}
          sx={masterDataActiveSwitchSx(checked)}
        />
      </Box>

      <ConfirmAlertDialog
        open={pending !== null}
        title={enabling ? S.TOGGLE_ITEM_DIALOG.ENABLE_TITLE : S.TOGGLE_ITEM_DIALOG.DISABLE_TITLE}
        message={
          enabling
            ? S.TOGGLE_ITEM_DIALOG.ENABLE_BODY(itemLabel)
            : S.TOGGLE_ITEM_DIALOG.DISABLE_BODY(itemLabel)
        }
        confirmLabel={
          enabling ? S.TOGGLE_ITEM_DIALOG.CONFIRM_ENABLE : S.TOGGLE_ITEM_DIALOG.CONFIRM_DISABLE
        }
        cancelLabel={S.TOGGLE_ITEM_DIALOG.CANCEL}
        onConfirm={() => {
          if (pending !== null) onChange(pending);
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
    </>
  );
};

export default MasterDataEnableDisableField;
