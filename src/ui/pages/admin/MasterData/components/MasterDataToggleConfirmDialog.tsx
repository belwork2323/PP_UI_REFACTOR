import React from "react";
import { STRINGS } from "@app/config/strings";
import ConfirmAlertDialog from "@ui/components/common/ConfirmAlertDialog";

const S = STRINGS.MASTER_DATA;

export type MasterDataToggleConfirmTarget = {
  name: string;
  nextActive: boolean;
};

type Props = {
  target: MasterDataToggleConfirmTarget | null;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const MasterDataToggleConfirmDialog = ({ target, busy = false, onConfirm, onCancel }: Props) => {
  const enabling = Boolean(target?.nextActive);
  const label = target?.name?.trim() || "this record";

  return (
    <ConfirmAlertDialog
      open={target != null}
      title={enabling ? S.ENABLE_DIALOG.TITLE : S.DISABLE_DIALOG.TITLE}
      message={enabling ? S.ENABLE_DIALOG.BODY(label) : S.DISABLE_DIALOG.BODY(label)}
      confirmLabel={
        busy
          ? enabling
            ? S.ENABLE_DIALOG.ENABLING
            : S.DISABLE_DIALOG.DISABLING
          : enabling
            ? S.ENABLE_DIALOG.CONFIRM
            : S.DISABLE_DIALOG.CONFIRM
      }
      cancelLabel={S.DISABLE_DIALOG.CANCEL}
      onConfirm={onConfirm}
      onCancel={() => !busy && onCancel()}
      confirmDisabled={busy}
    />
  );
};

export default MasterDataToggleConfirmDialog;
