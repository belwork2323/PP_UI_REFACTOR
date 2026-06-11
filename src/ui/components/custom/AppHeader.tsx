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
import getAppHeaderTheme from "@app/theme/custom_themes/common/appHeader_theme";
import { icons } from "@app/theme/icons";
import colors from "@app/theme/colors";
import { useThemeStore } from "@app/store/themeStore";
import { STRINGS } from "@app/config/strings";
import { APP_IMAGES } from "@app/assets/images";
import AdminDrawer from "./AppDrawer";
import ConfirmAlertDialog from "../common/ConfirmAlertDialog";
import { useAppHeaderHook } from "@hooks/custom/useAppHeaderHook";

const S = STRINGS.APP_HEADER;
const ML = STRINGS.MAIN_LAYOUT;

type AppHeaderProps = {
  title?: string;
  onLogout?: () => void;
  onNavSelect?: (key: string) => void;
};

const AppHeader = ({ title = S.DEFAULT_TITLE, onLogout }: AppHeaderProps) => {
  const mode = useThemeStore((s) => s.mode);
  const toggleMode = useThemeStore((s) => s.toggleMode);
  const t = getAppHeaderTheme(mode);
  const headerColors = colors.header[mode as "light" | "dark"] ?? colors.header.light;
  const barText = headerColors.barText;

  const {
    user,
    userId,
    showDeptDropdown,
    showDrawer,
    showProfileMenu,
    drawerOpen,
    confirmOpen,
    profileAnchor,
    RoleIcon,
    displayName,
    displayRole,
    subDept,
    headerDeptOptions,
    getInitials,
    handleSubDeptChange,
    handleConfirmSwitch,
    handleCancelSwitch,
    handleProfileMenuOpen,
    handleProfileMenuClose,
    openDrawer,
    closeDrawer,
  } = useAppHeaderHook();

  const ThemeIcon = mode === "dark" ? icons.lightModeToggleIcon : icons.darkModeToggleIcon;
  const themeToggleLabel = mode === "dark" ? "Switch to light mode" : "Switch to dark mode";

  const handleProfileLogout = () => {
    handleProfileMenuClose();
    onLogout?.();
  };

  return (
    <>
      <AppBar position="fixed" elevation={0} sx={t.appBar}>
        <Toolbar sx={t.toolbar}>
          <Box sx={t.leftSection.wrapper}>
            {showDrawer && (
              <Tooltip title="Menu" arrow>
                <IconButton onClick={openDrawer} size="small" sx={t.rightSection.themeToggle}>
                  <icons.menuIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Box sx={t.leftSection.logoCircle}>
              <Box
                component="img"
                src={APP_IMAGES.drdoLogo}
                alt={S.DRDO_ALT}
                sx={t.leftSection.logoImg}
              />
            </Box>
            <Box sx={t.leftSection.orgWrapper}>
              <Typography sx={t.leftSection.orgName}>{S.ORG_NAME}</Typography>
              <Typography sx={t.leftSection.orgCountry}>{S.ORG_COUNTRY}</Typography>
            </Box>
          </Box>

          <Typography variant="subtitle1" sx={t.centerTitle}>
            {title}
          </Typography>

          <Box sx={t.rightSection.wrapper}>
            {user && (
              <Box
                sx={{
                  ...t.rightSection.userCard,
                  ...(showProfileMenu ? t.rightSection.userCardInteractive : {}),
                }}
                onClick={handleProfileMenuOpen}
              >
                <Avatar sx={t.rightSection.userAvatar} alt={displayName} src={user?.avatarUrl}>
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
          <ListItemText
            primary={S.LOGOUT_LABEL}
            primaryTypographyProps={t.profileMenu.logoutLabelProps}
          />
        </MenuItem>
      </Menu>

      {showDrawer && (
        <AdminDrawer open={drawerOpen} onClose={closeDrawer} onLogout={onLogout} />
      )}

      <ConfirmAlertDialog
        open={confirmOpen}
        severity="warning"
        title={ML.SUBDEPT_SWITCH_TITLE}
        message={ML.SUBDEPT_SWITCH_MESSAGE}
        confirmLabel={ML.SUBDEPT_SWITCH_CONFIRM}
        cancelLabel={ML.SUBDEPT_SWITCH_CANCEL}
        onConfirm={handleConfirmSwitch}
        onCancel={handleCancelSwitch}
      />
    </>
  );
};

export default AppHeader;
