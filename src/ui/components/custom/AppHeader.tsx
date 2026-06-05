// src/ui/components/layout/AppHeader.jsx
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Select,
  FormControl,
  MenuItem,
  Tooltip,
  Avatar,
  Stack,
  Menu,
  Divider,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useState } from "react";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import getAppHeaderTheme from "../../../app/theme/custom_themes/common/appHeader_theme";
import { icons } from "../../../app/theme/icons";
import { useThemeStore } from "../../../app/store/themeStore";
import { STRINGS } from "../../../app/config/strings";
import { useAuthStore } from "../../../app/store/authStore";
import AdminDrawer from "./AppDrawer";
import ConfirmAlertDialog from "../common/ConfirmAlertDialog";

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
    .replace(/\s+/g, "_")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const normalizeRoleKey = (role = "") =>
  String(role)
    .trim()
    .replace(/\s+/g, "_")
    .toUpperCase();

const AppHeader = ({ title = S.DEFAULT_TITLE, onLogout, onNavSelect }) => {
  const mode = useThemeStore((s) => s.mode);
  const toggleMode = useThemeStore((s) => s.toggleMode);
  const t = getAppHeaderTheme(mode);
  const navigate = useNavigate();
  const location = useLocation();
  const { subDept } = useParams();

  // Pull directly from UserModel stored in authStore
  // user.headerDeptOptions → [{ value: "rocket-motor", label: "Sourcing - Rocket Motor Casing", dept: "sourcing" }]
  const user = useAuthStore((s) => s.user);
  const userName = user?.username ?? "";
  const userId = user?.userId ?? "--";
  const roleName = user?.role ?? "";
  const roleKey = normalizeRoleKey(roleName);
  const headerDeptOptions = user?.headerDeptOptions ?? []; // computed getter on UserModel

  const showDeptDropdown = roleKey === "USER" || roleKey === "APPROVER";
  const showDrawer = roleKey === "ADMIN";
  const showProfileMenu =
    roleKey === "USER" || roleKey === "APPROVER" || roleKey === "SYSTEM_MANAGER";

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingOption, setPendingOption] = useState(null); // { value, label, dept }
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  const RoleIcon = ROLE_ICON_MAP[roleKey] ?? icons.headerUser;
  const displayName = userName || "User";
  const displayRole = formatRoleLabel(roleKey || "MEMBER");
  const themeToggleLabel = mode === "dark" ? "Switch to light mode" : "Switch to dark mode";

  // Show confirmation dialog before switching sub-department
  const handleSubDeptChange = (e: SelectChangeEvent<string>) => {
    const newSlug = e.target.value;
    if (newSlug === subDept) return;

    const option = headerDeptOptions.find((o) => o.value === newSlug);
    if (!option) return;

    setPendingOption(option);
    setConfirmOpen(true);
  };

  const handleConfirmSwitch = () => {
    setConfirmOpen(false);
    if (!pendingOption) return;

    // Rebuild URL: /<role-segment>/<dept>/<subDept>
    const segments = location.pathname.split("/").filter(Boolean);
    if (segments.length >= 3) {
      segments[1] = pendingOption.dept;
      segments[2] = pendingOption.value;
      navigate("/" + segments.join("/"));
    } else {
      const roleSegment = segments[0] ?? "user";
      navigate(`/${roleSegment}/${pendingOption.dept}/${pendingOption.value}`);
    }

    setPendingOption(null);
  };

  const handleCancelSwitch = () => {
    setConfirmOpen(false);
    setPendingOption(null);
  };

  const handleProfileMenuOpen = (event) => {
    if (!showProfileMenu) return;
    setProfileAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchor(null);
  };

  const handleProfileLogout = () => {
    handleProfileMenuClose();
    onLogout?.();
  };

  const ThemeIcon = mode === "dark" ? icons.lightModeToggleIcon : icons.darkModeToggleIcon;
  const barText = mode === "dark" ? "#ffffff" : "#000000";

  return (
    <>
      <AppBar position="fixed" elevation={0} sx={t.appBar}>
        <Toolbar sx={t.toolbar}>
          {/* Left */}
          <Box sx={t.leftSection.wrapper}>
            {showDrawer && (
              <Tooltip title="Menu" arrow>
                <IconButton onClick={() => setDrawerOpen(true)} size="small" sx={t.rightSection.themeToggle}>
                  <icons.menuIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Box sx={t.leftSection.logoCircle}>
              <Box component="img" src="/src/assets/images/DRDO-logo.png" alt={S.DRDO_ALT} sx={t.leftSection.logoImg} />
            </Box>
            <Box sx={t.leftSection.orgWrapper}>
              <Typography sx={t.leftSection.orgName}>{S.ORG_NAME}</Typography>
              <Typography sx={t.leftSection.orgCountry}>{S.ORG_COUNTRY}</Typography>
            </Box>
          </Box>

          {/* Center */}
          <Typography variant="subtitle1" sx={t.centerTitle}>
            {title}
          </Typography>

          {/* Right */}
          <Box sx={t.rightSection.wrapper}>
            {user && (
              <Box
                sx={{
                  ...t.rightSection.userCard,
                  ...(showProfileMenu ? t.rightSection.userCardInteractive : {}),
                }}
                onClick={handleProfileMenuOpen}
              >
                <Avatar
                  sx={t.rightSection.userAvatar}
                  alt={displayName}
                  src={user?.avatarUrl}
                >
                  {getInitials(displayName)}
                </Avatar>

                <Stack spacing={0.45} sx={t.rightSection.userMeta}>
                  <Typography sx={t.rightSection.userName}>{displayName}</Typography>

                  <Box sx={t.rightSection.roleBadge}>
                    <RoleIcon sx={t.rightSection.roleIcon} />
                    <Typography component="span" sx={t.rightSection.userRole}>
                      {displayRole}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}

            {/* Sub-department switcher — driven by user's API-granted access list */}
            {showDeptDropdown && headerDeptOptions.length > 0 && (
              <FormControl size="small" variant="outlined">
                <Select
                  value={subDept ?? ""}
                  onChange={handleSubDeptChange}
                  IconComponent={icons.headerDeptArrow}
                  MenuProps={{ PaperProps: { sx: t.rightSection.menuPaper } }}
                  sx={t.rightSection.select}
                  inputProps={{ style: { color: barText, WebkitTextFillColor: barText } }}
                >
                  {headerDeptOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Tooltip title={themeToggleLabel} arrow>
              <IconButton onClick={toggleMode} size="small" sx={t.rightSection.themeToggle}>
                <ThemeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Toolbar sx={t.spacer} />

      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={handleProfileMenuClose}
        PaperProps={{ sx: t.userMenuPaper }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box sx={t.profileMenu.card}>
          <Avatar sx={t.profileMenu.avatar} src={user?.avatarUrl ?? undefined}>
            {getInitials(displayName)}
          </Avatar>

          <Box sx={t.profileMenu.content}>
            <Typography sx={t.profileMenu.username}>{displayName}</Typography>

            <Box sx={t.profileMenu.roleRow}>
              <RoleIcon sx={t.profileMenu.roleIcon} />
              <Typography sx={t.profileMenu.roleText}>{displayRole}</Typography>
            </Box>

            <Box sx={t.profileMenu.idRow}>
              <icons.userMgmt.userId sx={t.profileMenu.idIcon} />
              <Typography sx={t.profileMenu.idText}>User ID: {userId}</Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={t.profileMenu.divider} />

        <MenuItem onClick={handleProfileLogout} sx={t.profileMenu.logoutItem}>
          <ListItemIcon sx={t.profileMenu.logoutIcon}>
            <icons.headerLogout fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={S.LOGOUT_LABEL} primaryTypographyProps={t.profileMenu.logoutLabelProps} />
        </MenuItem>
      </Menu>

      {showDrawer && (
        <AdminDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onLogout={onLogout}
        />
      )}

      <ConfirmAlertDialog
        open={confirmOpen}
        severity="warning"
        title="Switching Sub-Department?"
        message="Any unsaved data will be lost. Please go back, save your work, and then continue."
        confirmLabel="Switch"
        cancelLabel="Go Back"
        onConfirm={handleConfirmSwitch}
        onCancel={handleCancelSwitch}
      />
    </>
  );
};

export default AppHeader;
