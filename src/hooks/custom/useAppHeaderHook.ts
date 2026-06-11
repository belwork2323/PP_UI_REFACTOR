import { useState, useCallback } from "react";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuthStore } from "@app/store/authStore";
import { icons } from "@app/theme/icons";
import {
  ROLE_ICON_MAP,
  normalizeRoleKey,
  getInitials,
  formatRoleLabel,
} from "@app/theme/roleConfig";

type HeaderDeptOption = {
  value: string;
  label: string;
  dept: string;
};

export function useAppHeaderHook() {
  const navigate = useNavigate();
  const location = useLocation();
  const { subDept } = useParams();

  const user = useAuthStore((s) => s.user);
  const userName = user?.username ?? "";
  const userId = user?.userId ?? "--";
  const roleName = user?.role ?? "";
  const roleKey = normalizeRoleKey(roleName);
  const headerDeptOptions = (user?.headerDeptOptions ?? []) as HeaderDeptOption[];

  const showDeptDropdown = roleKey === "USER" || roleKey === "APPROVER";
  const showDrawer = roleKey === "ADMIN";
  const showProfileMenu =
    roleKey === "USER" || roleKey === "APPROVER" || roleKey === "SYSTEM_MANAGER";

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingOption, setPendingOption] = useState<HeaderDeptOption | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  const RoleIcon = ROLE_ICON_MAP[roleKey] ?? icons.headerUser;
  const displayName = userName || "User";
  const displayRole = formatRoleLabel(roleKey || "MEMBER");

  const handleSubDeptChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      const newSlug = e.target.value;
      if (newSlug === subDept) return;

      const option = headerDeptOptions.find((o) => o.value === newSlug);
      if (!option) return;

      setPendingOption(option);
      setConfirmOpen(true);
    },
    [headerDeptOptions, subDept],
  );

  const handleConfirmSwitch = useCallback(() => {
    setConfirmOpen(false);
    if (!pendingOption) return;

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
  }, [location.pathname, navigate, pendingOption]);

  const handleCancelSwitch = useCallback(() => {
    setConfirmOpen(false);
    setPendingOption(null);
  }, []);

  const handleProfileMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!showProfileMenu) return;
      setProfileAnchor(event.currentTarget);
    },
    [showProfileMenu],
  );

  const handleProfileMenuClose = useCallback(() => {
    setProfileAnchor(null);
  }, []);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return {
    user,
    userId,
    roleKey,
    headerDeptOptions,
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
    getInitials,
    handleSubDeptChange,
    handleConfirmSwitch,
    handleCancelSwitch,
    handleProfileMenuOpen,
    handleProfileMenuClose,
    openDrawer,
    closeDrawer,
  };
}
