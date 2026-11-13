import { Box } from "@mui/material";
import { useMemo } from "react";
import { STRINGS } from "@app/config/strings";
import { useThemeStore } from "@app/store/themeStore";
import { getRawMaterialSourcingPageTheme } from "@app/theme/custom_themes/user/sourcing/rms/rawMaterialSourcing_theme";
import type { MaterialBlock, RawMaterialFormBatch } from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";
import type { RawMaterialSourcingFormEntryMode } from "@hooks/user/sourcing/rms/useRawMaterialSourcingForm";
import UserWorkflowFormHeader from "@ui/components/custom/UserWorkflowFormHeader";
import { resolveWorkflowFormHeaderStatus } from "@ui/components/custom/workflowFormHeaderStatus";
import SpecificationFormBuilder from "@ui/pages/user/sourcing/rms/components/SpecificationFormBuilder";

type RawMaterialSourcingFormPageProps = {
  activeBatch: RawMaterialFormBatch;
  formEntryMode: RawMaterialSourcingFormEntryMode;
  formBlocks: MaterialBlock[];
  isEditMode: boolean;
  actionLoading: boolean;
  canDeleteActiveLot: boolean;
  deleteLoading: boolean;
  onBack: () => void;
  onBlocksChange: (blocks: MaterialBlock[]) => void;
  onSaveDraft: (blocks: MaterialBlock[]) => Promise<boolean>;
  onSubmit: (blocks: MaterialBlock[]) => Promise<boolean>;
  onDeleteLot: () => void;
};

const RawMaterialSourcingFormPage = ({
  activeBatch,
  formEntryMode,
  formBlocks,
  isEditMode,
  actionLoading,
  canDeleteActiveLot,
  deleteLoading,
  onBack,
  onBlocksChange,
  onSaveDraft,
  onSubmit,
  onDeleteLot,
}: RawMaterialSourcingFormPageProps) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getRawMaterialSourcingPageTheme(mode), [mode]);
  const strings = STRINGS.SOURCING.RAW_MATERIAL;

  const isCreateLot = !isEditMode && formEntryMode === "create";
  const headerStatus = resolveWorkflowFormHeaderStatus(activeBatch, {
    preferredStatusKeys: ["rmStatus"],
  });

  return (
    <Box>
      <UserWorkflowFormHeader
        mode={isCreateLot ? "create" : "update"}
        data={{
          title: isCreateLot
            ? strings.FORM_HEADER_CREATE_LOT_TITLE
            : String(activeBatch.lotId || activeBatch.batchId || "—"),
          subtitle: isCreateLot ? strings.FORM_HEADER_CREATE_LOT_SUBTITLE : undefined,
          statusLabel: headerStatus.statusLabel,
          statusVariant: headerStatus.statusVariant,
          rejectionReason: headerStatus.rejectionReason,
        }}
        onBack={onBack}
        theme={theme}
      />

      <SpecificationFormBuilder
        key={`rm-spec-${formEntryMode}-${activeBatch.lotId || activeBatch.sourcingId || "new"}`}
        initialBlocks={formEntryMode === "create" ? [] : formBlocks}
        isEditMode={isEditMode}
        createLotMode={formEntryMode === "create"}
        lockLotNo={formEntryMode !== "create"}
        onBlocksChange={onBlocksChange}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
        actionLoading={actionLoading}
        showDeleteLot={canDeleteActiveLot}
        onDeleteLot={onDeleteLot}
        deleteLoading={deleteLoading}
      />
    </Box>
  );
};

export default RawMaterialSourcingFormPage;
