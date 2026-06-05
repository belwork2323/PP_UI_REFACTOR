import {
  Drawer, Box, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Divider, Avatar,
} from "@mui/material";
import { useThemeStore }    from "../../../app/store/themeStore";
import { useAuthStore }     from "../../../app/store/authStore";
import { useLocation, useNavigate } from "react-router-dom";
import { STRINGS }          from "../../../app/config/strings";
import { icons }            from "../../../app/theme/icons";
import getDrawerTheme, {
  DRAWER_NAV,
}                           from "../../../app/theme/custom_themes/common/drawer_theme";

const S = STRINGS.APP_HEADER;

const ROLE_ICON_MAP = {
  ADMIN: icons.userMgmt.adminRole,
  SYSTEM_MANAGER: icons.userMgmt.managerRole,
  APPROVER: icons.userMgmt.approverRole,
  USER: icons.userMgmt.userRole,
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
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

// ─────────────────────────────────────────────────────────────────────────────
// Props
//   open      boolean
//   onClose   () => void
//   onLogout  () => void
//   (no more onNavSelect — navigation goes directly through the store)
// ─────────────────────────────────────────────────────────────────────────────
const AdminDrawer = ({ open, onClose, onLogout }) => {
  const mode       = useThemeStore((s) => s.mode);
  const user       = useAuthStore((s)  => s.user);
  const roleName   = user?.role ?? "";
  const username   = user?.username ?? "User";
  const userId     = user?.userId ?? "--";

  // ── Determine active route from location and navigate on click ───────────
  const navigate   = useNavigate();
  const location   = useLocation();
  const t          = getDrawerTheme(mode);
  const LogoutIcon = icons.drawerLogout;
  const RoleIcon   = ROLE_ICON_MAP[roleName] ?? icons.headerUser;
  const UserIdIcon = icons.userMgmt.userId;
  const displayRole = formatRoleLabel(roleName || "member");

  const activeView = DRAWER_NAV.find((item) => item.path === location.pathname)?.key ?? "";
  const handleNavClick = (path) => {
    onClose?.();
    if (path) navigate(path);
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: t.paper }}
    >
      {/* ── Header ── */}
      <Box sx={t.header.wrapper}>
        <Box sx={t.header.logoCircle}>
          <Box
            component="img"
            src="/src/assets/images/DRDO-logo.png"
            alt={S.DRDO_ALT}
            sx={t.header.logoImg}
          />
        </Box>
        <Box>
          <Typography sx={t.header.orgName}>{S.ORG_NAME}</Typography>
          <Typography sx={t.header.roleBadge}>{displayRole}</Typography>
        </Box>
      </Box>

      {/* ── Nav items ── */}
      <List sx={t.nav.list}>
        {DRAWER_NAV.map(({ key, label, Icon, path }) => {
          const isActive = activeView === key;
          return (
            <ListItem key={key} disablePadding>
              <ListItemButton
                selected={isActive}
                sx={t.nav.item}
                onClick={() => handleNavClick(path)}
              >
                <ListItemIcon sx={t.nav.icon}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={t.nav.labelProps}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* ── Footer ── */}
      <Box sx={t.footer.wrapper}>
        <Divider sx={t.divider} />

        <Box sx={t.profileCard.wrapper}>
          <Avatar sx={t.profileCard.avatar} src={user?.avatarUrl ?? undefined}>
            {getInitials(username)}
          </Avatar>

          <Box sx={t.profileCard.content}>
            <Typography sx={t.profileCard.username}>{username}</Typography>

            <Box sx={t.profileCard.roleRow}>
              <RoleIcon sx={t.profileCard.roleIcon} />
              <Typography sx={t.profileCard.roleText}>{displayRole}</Typography>
            </Box>

            <Box sx={t.profileCard.idRow}>
              <UserIdIcon sx={t.profileCard.idIcon} />
              <Typography sx={t.profileCard.idText}>User ID: {userId}</Typography>
            </Box>
          </Box>
        </Box>

        <List sx={t.logout.list}>
          <ListItem disablePadding>
            <ListItemButton
              sx={t.logout.item}
              onClick={() => { onClose?.(); onLogout?.(); }}
            >
              <ListItemIcon sx={t.logout.icon}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={S.LOGOUT_LABEL}
                primaryTypographyProps={t.logout.labelProps}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};

export default AdminDrawer;