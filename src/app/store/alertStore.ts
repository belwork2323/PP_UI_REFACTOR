import { create } from "zustand";

export type AlertSeverity = "info" | "success" | "warning" | "error";

export type AlertDisplay = "dialog" | "snackbar";

export type AlertShowOptions = {
  loading?: boolean;
  onCloseAction?: (() => void) | null;
  autoCloseMs?: number;
  display?: AlertDisplay;
};

export type AlertState = {
  open: boolean;
  message: string;
  severity: AlertSeverity;
  loading: boolean;
  display: AlertDisplay;
  onCloseAction: (() => void) | null;
  showAlert: (
    message: string,
    severity?: AlertSeverity,
    options?: AlertShowOptions,
  ) => void;
  showValidationAlert: (message: string) => void;
  hideAlert: () => void;
};

let alertTimer: ReturnType<typeof setTimeout> | null = null;

export const useAlertStore = create<AlertState>()((set, get) => ({
  open: false,
  message: "",
  severity: "info",
  loading: false,
  display: "dialog",
  onCloseAction: null,

  showAlert: (message, severity = "info", options = {}) => {
    const effectiveOptions = {
      autoCloseMs: 2000,
      display: "dialog" as AlertDisplay,
      ...options,
    };

    if (alertTimer) {
      clearTimeout(alertTimer);
      alertTimer = null;
    }

    set({
      open: true,
      message,
      severity,
      loading: effectiveOptions.loading || false,
      display: effectiveOptions.display,
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
          display: "dialog",
          onCloseAction: null,
        });

        alertTimer = null;
      }, effectiveOptions.autoCloseMs);
    }
  },

  showValidationAlert: (message) => {
    get().showAlert(message, "error", { display: "snackbar", autoCloseMs: 4000 });
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
      display: "dialog",
      onCloseAction: null,
    });
  },
}));
