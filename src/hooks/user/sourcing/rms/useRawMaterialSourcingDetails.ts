import { useCallback, useState } from "react";
import { STRINGS } from "@app/config/strings";
import { useAlertStore } from "@app/store/alertStore";
import rawMaterialSourcingController from "@controllers/user/sourcing/rms/rawMaterialSourcingController";
import {
  MaterialBlock,
  RawMaterialLotDetailsContext,
  RawMaterialLotDetailsModel,
  RawMaterialLotListRow,
} from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";
import { getRawMaterialSourcingErrorMessage } from "@hooks/user/sourcing/rms/rawMaterialSourcingErrors";
import {
  buildDetailsRowFromListRow,
  buildDetailsRowFromLotModel,
  resolveLotDetailsFetchErrorFallback,
} from "@hooks/user/sourcing/rms/rawMaterialSourcingDetailsHelpers";

type UseRawMaterialSourcingDetailsArgs = {
  /** Called before the details request starts. */
  onOpen: () => void;
  onClose: () => void;
  /** Called when the details request fails. */
  onError: () => void;
};

export const useRawMaterialSourcingDetails = ({
  onOpen,
  onClose,
  onError,
}: UseRawMaterialSourcingDetailsArgs) => {
  const [detailsRow, setDetailsRow] = useState<RawMaterialLotDetailsContext | null>(null);
  const [detailsBlocks, setDetailsBlocks] = useState<MaterialBlock[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const showAlert = useAlertStore((state) => state.showAlert);

  const resetDetails = useCallback(() => {
    setDetailsRow(null);
    setDetailsBlocks([]);
    setLoadingDetails(false);
  }, []);

  const handleViewLotDetails = useCallback(
    async (row: RawMaterialLotListRow) => {
      const lotId = String(row?.lotId ?? "").trim();
      if (!lotId) {
        showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.BATCH_ID_MISSING, "error");
        return;
      }

      setDetailsRow(buildDetailsRowFromListRow(row, lotId));
      setDetailsBlocks([]);
      onOpen();
      setLoadingDetails(true);

      try {
        const detailsResponse = await rawMaterialSourcingController.fetchLotDetails({ lotId });
        if (!detailsResponse?.success || !detailsResponse.data) {
          const fallback = resolveLotDetailsFetchErrorFallback(detailsResponse?.statusCode);
          showAlert(getRawMaterialSourcingErrorMessage(detailsResponse, fallback), "error");
          onError();
          return;
        }

        const model = detailsResponse.data;
        const blocks = RawMaterialLotDetailsModel.toMaterialBlocks(model);

        setDetailsBlocks(blocks);
        setDetailsRow(buildDetailsRowFromLotModel(model, row, lotId));
      } finally {
        setLoadingDetails(false);
      }
    },
    [onError, onOpen, showAlert],
  );

  const handleBackFromDetails = useCallback(() => {
    resetDetails();
    onClose();
  }, [onClose, resetDetails]);

  return {
    detailsRow,
    detailsBlocks,
    loadingDetails,
    handleViewLotDetails,
    handleBackFromDetails,
    resetDetails,
  };
};

export default useRawMaterialSourcingDetails;
