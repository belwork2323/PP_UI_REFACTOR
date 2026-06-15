import { create } from "zustand";

export type AlertSeverity = "info" | "success" | "warning" | "error";

export type AlertShowOptions = {
  loading?: boolean;
  onCloseAction?: (() => void) | null;
  autoCloseMs?: number;
};

export type AlertState = {
  open: boolean;
  message: string;
  severity: AlertSeverity;
  loading: boolean;
  onCloseAction: (() => void) | null;
  showAlert: (
    message: string,
    severity?: AlertSeverity,
    options?: AlertShowOptions,
  ) => void;
  hideAlert: () => void;
};

let alertTimer: ReturnType<typeof setTimeout> | null = null;

export const useAlertStore = create<AlertState>()((set, get) => ({
  open: false,
  message: "",
  severity: "info",
  loading: false,
  onCloseAction: null,

  showAlert: (message, severity = "info", options = {}) => {
    const effectiveOptions = { autoCloseMs: 2000, ...options };

    if (alertTimer) {
      clearTimeout(alertTimer);
      alertTimer = null;
    }

    set({
      open: true,
      message,
      severity,
      loading: effectiveOptions.loading || false,
      onCloseAction: effectiveOptions.onCloseAction || null,
    });

    if (effectiveOptions.autoCloseMs && !effectiveOptions.loading) {
      alertTimer = setTimeout(() => {
        const state = get();

        if (typeof state.onCloseAction === "function") {
          state.onCloseAction();
        }

        set({
          open: false,
          message: "",
          severity: "info",
          loading: false,
          onCloseAction: null,
        });

        alertTimer = null;
      }, effectiveOptions.autoCloseMs);
    }
  },

  hideAlert: () => {
    if (alertTimer) {
      clearTimeout(alertTimer);
      alertTimer = null;
    }

    const state = get();

    if (typeof state.onCloseAction === "function") {
      state.onCloseAction();
    }

    set({
      open: false,
      message: "",
      severity: "info",
      loading: false,
      onCloseAction: null,
    });
  },
}));
