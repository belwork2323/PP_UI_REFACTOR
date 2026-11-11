import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  Zoom,
} from "@mui/material";
import { useAuthStore } from "../../../app/store/authStore";
import { useThemeStore } from "../../../app/store/themeStore";
import { icons } from "../../../app/theme/icons";
import { STRINGS } from "../../../app/config/strings";
import { getAdminCommonTheme } from "../../../app/theme/custom_themes/admin/admin_common_theme";
import AdminManagementFormHeader from "../custom/admin/AdminManagementFormHeader";
import ChangePasswordDialog from "./ChangePasswordDialog";
import type { DepartmentModel } from "../../../data/models/user/DepartmentModel";
import { useState } from "react";

const S = STRINGS.APP_HEADER;

const ROLE_ICON_MAP: Record<string, typeof icons.userMgmt.userRole> = {
  ADMIN: icons.userMgmt.adminRole,
  SYSTEM_MANAGER: icons.userMgmt.managerRole,
  APPROVER: icons.userMgmt.approverRole,
  USER: icons.userMgmt.userRole,
  CENTRE_HEAD: icons.userMgmt.centreHeadRole,
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatRoleLabel = (role = "") =>
  String(role)
    .toLowerCase()
    .replace(/\s+/g, "_")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const normalizeRoleKey = (role = "") => String(role).trim().replace(/\s+/g, "_").toUpperCase();

type ProfileDialogProps = {
  open: boolean;
  onClose: () => void;
};

const ProfileDialog = ({ open, onClose }: ProfileDialogProps) => {
  const user = useAuthStore((s) => s.user);
  const mode = useThemeStore((s) => s.mode);
  const t = getAdminCommonTheme(mode);
  const { modal } = t;
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const username = user?.username ?? "User";
  const userId = user?.userId ?? "--";
  const roleKey = normalizeRoleKey(user?.role ?? "");
  const displayRole = formatRoleLabel(roleKey || "MEMBER");
  const RoleIcon = ROLE_ICON_MAP[roleKey] ?? icons.headerUser;
  const departments: DepartmentModel[] = user?.departments ?? [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Zoom}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          ...modal.paper,
          width: { xs: "92vw", sm: "720px", md: "820px" },
          maxWidth: "92vw",
          height: "auto",
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <AdminManagementFormHeader
          icon={<icons.userMgmt.personOutline sx={modal.header.icon} />}
          title={S.PROFILE_DETAILS_TITLE}
          subtitle={username}
          onClose={onClose}
          theme={t}
        />
      </DialogTitle>

      <DialogContent sx={{ ...modal.contentMd, pt: 2.5, pb: 2 }}>
        <Stack spacing={2}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 2.5,
              px: 2,
              py: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1.5,
              bgcolor: "background.paper",
            }}
          >
            <Avatar
              sx={{
                width: 72,
                height: 72,
                fontWeight: 700,
                fontSize: "1.35rem",
                bgcolor: t.accentBlue,
              }}
              src={user?.avatarUrl ?? undefined}
            >
              {getInitials(username)}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "1.15rem", color: "text.primary" }}>
                {username}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.75 }}>
                <RoleIcon sx={{ fontSize: 18, color: t.accentBlue }} />
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: "text.primary" }}>
                  {displayRole}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5 }}>
                <icons.userMgmt.userId sx={{ fontSize: 18, color: "text.secondary" }} />
                <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
                  {S.PROFILE_USER_ID_LABEL}: {userId}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={() => setChangePasswordOpen(true)}
              sx={{
                ...modal.saveButton,
                flexShrink: 0,
                alignSelf: "flex-start",
                whiteSpace: "nowrap",
              }}
            >
              {S.CHANGE_PASSWORD_LABEL}
            </Button>
          </Box>

          <Box>
            <Typography sx={{ ...modal.fieldLabel, mb: 1 }}>{S.PROFILE_ACCESS_SECTION}</Typography>

            {departments.length === 0 ? (
              <Typography sx={{ fontSize: "0.9rem", color: "text.secondary" }}>
                {S.PROFILE_NO_SUB_DEPTS}
              </Typography>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: 1.25,
                }}
              >
                {departments.map((dept) => {
                  const subs = dept.subDepartments ?? [];
                  return (
                    <Box
                      key={String(dept.departmentId)}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1.5,
                        px: 1.5,
                        py: 1.25,
                        bgcolor: "background.paper",
                        minHeight: 0,
                      }}
                    >
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, mb: 0.75 }}>
                        {dept.departmentName || S.PROFILE_UNKNOWN_DEPT}
                      </Typography>
                      {subs.length === 0 ? (
                        <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                          {S.PROFILE_NO_SUB_DEPTS}
                        </Typography>
                      ) : (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.65 }}>
                          {subs.map((sub) => (
                            <Chip
                              key={String(sub.subDepartmentId)}
                              size="small"
                              label={sub.subDepartmentName}
                              sx={{
                                fontWeight: 600,
                                fontSize: "0.7rem",
                                height: 24,
                                bgcolor: t.accentBlueMuted,
                                color: t.accentBlue,
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={modal.actions}>
        <Button onClick={onClose} sx={modal.cancelButton}>
          Close
        </Button>
      </DialogActions>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </Dialog>
  );
};

export default ProfileDialog;
