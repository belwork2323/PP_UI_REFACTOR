import { useCallback, useState } from "react";
import { STRINGS } from "@app/config/strings";
import { useAlertStore } from "@app/store/alertStore";
import rawMaterialSourcingController from "@controllers/user/sourcing/rms/rawMaterialSourcingController";
import {
  MaterialBlock,
  normalizeRawMaterialLotListStatus,
  RawMaterialLotDetailsContext,
  RawMaterialLotDetailsModel,
  RawMaterialLotListRow,
} from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";
import { getRawMaterialSourcingErrorMessage } from "@hooks/user/sourcing/rms/rawMaterialSourcingErrors";

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

  const handleViewLotDetails = async (row: RawMaterialLotListRow) => {
    const lotId = String(row?.lotId ?? "").trim();
    if (!lotId) {
      showAlert(STRINGS.SOURCING.SPECIFICATION_FORM.BATCH_ID_MISSING, "error");
      return;
    }

    setDetailsRow({
      lotId,
      sourcingId: row.sourcingId,
      materialCode: row.materialCode,
      materialName: row.materialName,
      grade: row.grade ?? null,
      supplyOrderNo: row.supplyOrderNo,
      receiptDate: row.receiptDate,
      manufacturerName: row.manufacturerName,
      rmStatus: row.rmStatus,
      createdBy: row.createdBy,
      createdOn: row.createdOn,
      rejectionReason: row?.rejectionReason,
    });
    setDetailsBlocks([]);
    onOpen();
    setLoadingDetails(true);

    try {
      const detailsResponse = await rawMaterialSourcingController.fetchLotDetails({ lotId });
      if (!detailsResponse?.success || !detailsResponse.data) {
        const fallback =
          detailsResponse?.statusCode === 404
            ? STRINGS.SOURCING.SPECIFICATION_FORM.DETAILS_NOT_FOUND
            : STRINGS.SOURCING.SPECIFICATION_FORM.DETAILS_FETCH_ERROR;
        showAlert(getRawMaterialSourcingErrorMessage(detailsResponse, fallback), "error");
        onError();
        return;
      }

      const model = detailsResponse.data;
      const wf = model.workflowInsights;
      const blocks = RawMaterialLotDetailsModel.toMaterialBlocks(model);

      setDetailsBlocks(blocks);
      setDetailsRow({
        lotId: model.lotId || lotId,
        sourcingId: row.sourcingId,
        materialCode: model.materialCode || row.materialCode,
        materialName: row.materialName,
        grade:
          row.grade ??
          (model.grade ? { gradeId: 0, gradeCode: model.grade, gradeName: model.grade } : null),
        supplyOrderNo: model.supplyOrderNo || row.supplyOrderNo,
        receiptDate: model.receiptDate || row.receiptDate,
        manufacturerName: model.manufacturerName || row.manufacturerName,
        rmStatus: normalizeRawMaterialLotListStatus(wf?.currentStatus || row.rmStatus),
        createdBy: row.createdBy,
        createdOn: row.createdOn,
        rejectionReason: wf?.rejectionReason ?? null,
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBackFromDetails = () => {
    resetDetails();
    onClose();
  };

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
