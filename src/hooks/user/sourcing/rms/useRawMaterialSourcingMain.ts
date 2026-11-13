import { useCallback, useMemo, useRef, useState } from "react";
import { STRINGS } from "@app/config/strings";
import { useAlertStore } from "@app/store/alertStore";
import { useAuthStore } from "@app/store/authStore";
import rawMaterialSourcingController from "@controllers/user/sourcing/rms/rawMaterialSourcingController";
import {
  canDeleteRawMaterialLot,
  RawMaterialLotListRow,
} from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";
import { useRawMaterialSourcingList } from "@hooks/user/sourcing/rms/useRawMaterialSourcingList";
import { useRawMaterialSourcingForm } from "@hooks/user/sourcing/rms/useRawMaterialSourcingForm";
import { useRawMaterialSourcingDetails } from "@hooks/user/sourcing/rms/useRawMaterialSourcingDetails";
import { getRawMaterialSourcingErrorMessage } from "@hooks/user/sourcing/rms/rawMaterialSourcingErrors";

export type RawMaterialSourcingView = "list" | "form" | "details";

const SUCCESS_ALERT_MS = 2200;

/** Coordinates the list, form and details pages and the delete-lot flow shared by list and form. */
export const useRawMaterialSourcingMain = () => {
  const [view, setView] = useState<RawMaterialSourcingView>("list");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetLotId, setDeleteTargetLotId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const user = useAuthStore((s) => s.user);
  const showAlert = useAlertStore((state) => state.showAlert);

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "raw-material")?.subDepartmentId,
    [user],
  );

  const resetAllRef = useRef<() => void>(() => {});
  const exitToList = useCallback(() => resetAllRef.current(), []);
  const openForm = useCallback(() => setView("form"), []);
  const openDetails = useCallback(() => setView("details"), []);
  const showList = useCallback(() => setView("list"), []);

  const list = useRawMaterialSourcingList();
  const form = useRawMaterialSourcingForm({
    isOpen: view === "form",
    subDepartmentId,
    onOpen: openForm,
    onExit: exitToList,
    refreshList: list.refreshUserBatches,
  });
  const details = useRawMaterialSourcingDetails({
    onOpen: openDetails,
    onClose: showList,
    onError: exitToList,
  });

  resetAllRef.current = () => {
    form.resetForm();
    details.resetDetails();
    setView("list");
  };

  const closeDeleteLotConfirm = useCallback(() => {
    if (deleteLoading) return;
    setDeleteConfirmOpen(false);
    setDeleteTargetLotId(null);
  }, [deleteLoading]);

  const openDeleteLotConfirm = useCallback((lotId: string) => {
    setDeleteTargetLotId(lotId);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteLotFromList = useCallback(
    (row: RawMaterialLotListRow) => {
      if (!canDeleteRawMaterialLot(row.rmStatus)) {
        showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.DELETE_NOT_ALLOWED, "warning");
        return;
      }
      openDeleteLotConfirm(row.lotId);
    },
    [openDeleteLotConfirm, showAlert],
  );

  const { activeBatch } = form;
  const handleDeleteLotFromForm = useCallback(() => {
    const lotId = (activeBatch?.lotId ?? "").trim();
    if (!lotId || !canDeleteRawMaterialLot(activeBatch?.rmStatus)) {
      showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.DELETE_NOT_ALLOWED, "warning");
      return;
    }
    openDeleteLotConfirm(lotId);
  }, [activeBatch, openDeleteLotConfirm, showAlert]);

  const { refreshUserBatches } = list;
  const handleConfirmDeleteLot = useCallback(async () => {
    const lotId = deleteTargetLotId?.trim();
    if (!lotId || deleteLoading) return;

    setDeleteLoading(true);
    try {
      const response = await rawMaterialSourcingController.deleteLot({ lotId });

      if (!response?.success) {
        showAlert(
          getRawMaterialSourcingErrorMessage(
            response,
            STRINGS.SOURCING.SPECIFICATION_FORM.DELETE_FAILED,
          ),
          "error",
        );
        return;
      }

      setDeleteConfirmOpen(false);
      setDeleteTargetLotId(null);

      const wasOnForm = view === "form";
      if (wasOnForm) exitToList();

      showAlert(response.message || STRINGS.SOURCING.SPECIFICATION_FORM.DELETE_SUCCESS, "success", {
        autoCloseMs: SUCCESS_ALERT_MS,
        onCloseAction: () => {
          void refreshUserBatches();
        },
      });

      if (!wasOnForm) {
        void refreshUserBatches();
      }
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteLoading, deleteTargetLotId, exitToList, refreshUserBatches, showAlert, view]);

  return {
    view,
    ...list,
    ...form,
    ...details,
    deleteConfirmOpen,
    deleteLoading,
    closeDeleteLotConfirm,
    handleConfirmDeleteLot,
    handleDeleteLotFromList,
    handleDeleteLotFromForm,
  };
};

export type RawMaterialSourcingMainState = ReturnType<typeof useRawMaterialSourcingMain>;

export default useRawMaterialSourcingMain;
