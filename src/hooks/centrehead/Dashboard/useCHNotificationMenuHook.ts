import { useCallback, useState } from "react";

export function useSMNotificationMenu(loadAlerts: () => Promise<any>) {
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);

  const handleNotifClose = useCallback(() => {
    setNotifAnchor(null);
  }, []);

  const handleNotifOpen = useCallback(async (e: React.MouseEvent<HTMLElement>) => {
    setNotifAnchor(e.currentTarget);
    await loadAlerts();
  }, [loadAlerts]);

  return {
    notifAnchor,
    handleNotifOpen,
    handleNotifClose,
  };
}

export default useSMNotificationMenu;