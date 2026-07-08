import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogActions } from "@mui/material";
import AdminManagementFormHeader from "@ui/components/custom/admin/AdminManagementFormHeader";

type AdminManagementFormHeaderProps = React.ComponentProps<typeof AdminManagementFormHeader>;

type AdminManagementFormDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  children: ReactNode;
  actions: ReactNode;
  theme: {
    modal: {
      paper: object;
      content: object;
      actions: object;
      header: {
        wrapper: object;
        titleRow: object;
        iconBadge?: object;
        icon?: object;
        title: object;
        subtitle?: object;
        closeButton: object;
      };
    };
  };
  maxWidth?: false | "xs" | "sm" | "md" | "lg" | "xl";
};

const AdminManagementFormDialog = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  actions,
  theme,
  maxWidth = false,
}: AdminManagementFormDialogProps) => {
  const { modal } = theme;

  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth PaperProps={{ sx: modal.paper }}>
      <AdminManagementFormHeader
        title={title}
        subtitle={subtitle ?? ""}
        icon={icon}
        onClose={onClose}
        theme={{ modal: modal as AdminManagementFormHeaderProps["theme"]["modal"] }}
      />
      <DialogContent sx={modal.content}>{children}</DialogContent>
      <DialogActions sx={modal.actions}>{actions}</DialogActions>
    </Dialog>
  );
};

export default AdminManagementFormDialog;
