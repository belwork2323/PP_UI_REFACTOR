import { alpha, Box, Typography } from "@mui/material";
import { STRINGS } from "@app/config/strings";
import type {
  AdductPreparationDetails,
  BlendingStylePreparationDetails,
  MaterialBlock,
} from "@data/models/user/RawMaterialProcurementModel";
import {
  isAcemAdductMaterial,
  isAcemApFineMaterial,
  isAcemApUltrafineMaterial,
  isAcemHtpbBlendingMaterial,
} from "@data/models/user/RawMaterialProcurementModel";
import { formatDisplayDate } from "@/utils/dateUtils";

const ADDUCT = STRINGS.SOURCING.SPECIFICATION_FORM.ADDUCT_PREPARATION;
const HTPB = STRINGS.SOURCING.SPECIFICATION_FORM.HTPB_BLENDING_PREPARATION;
const AP_FINE = STRINGS.SOURCING.SPECIFICATION_FORM.AP_FINE_PREPARATION;
const AP_ULTRAFINE = STRINGS.SOURCING.SPECIFICATION_FORM.AP_ULTRAFINE_PREPARATION;

type Palette = {
  primary: string;
  text: string;
  textSub: string;
  border: string;
  white?: string;
};

type ReadOnlyField = {
  label: string;
  value?: string | number | null;
  span?: boolean;
};

const displayValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "—";
  const trimmed = String(value).trim();
  return trimmed || "—";
};

const DetailItem = ({
  label,
  value,
  palette,
}: {
  label: string;
  value: string;
  palette: Palette;
}) => (
  <Box>
    <Typography
      sx={{
        fontSize: "0.68rem",
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: palette.textSub,
        mb: 0.35,
      }}
    >
      {label}
    </Typography>
    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: palette.text }}>{value}</Typography>
  </Box>
);

const PreparationSection = ({
  title,
  fields,
  palette,
}: {
  title: string;
  fields: ReadOnlyField[];
  palette: Palette;
}) => (
  <Box
    sx={{
      mt: 2,
      mb: 1,
      p: 2,
      borderRadius: 1.5,
      border: `1px solid ${alpha(palette.border, 0.8)}`,
      bgcolor: alpha(palette.white ?? "#fff", 0.9),
    }}
  >
    <Typography
      sx={{
        fontSize: "0.72rem",
        fontWeight: 800,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: palette.textSub,
        mb: 1.5,
      }}
    >
      {title}
    </Typography>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
        gap: 2,
      }}
    >
      {fields.map((field) => (
        <Box
          key={field.label}
          sx={field.span ? { gridColumn: { xs: "1 / -1", md: "1 / -1" } } : undefined}
        >
          <DetailItem label={field.label} value={displayValue(field.value)} palette={palette} />
        </Box>
      ))}
    </Box>
  </Box>
);

const buildAdductFields = (details: AdductPreparationDetails): ReadOnlyField[] => [
  { label: ADDUCT.ADDUCT_BATCH_PREP_DATE, value: formatDisplayDate(details.adductBatchPrepDate) },
  { label: ADDUCT.TMP_MFG_LOT_NO, value: details.tmpMfgLotNo },
  { label: ADDUCT.TMP_TOTAL_QTY_GM, value: details.tmpTotalQtyGm },
  { label: ADDUCT.NBD_MFG_LOT_NO, value: details.nbdMfgLotNo },
  { label: ADDUCT.NBD_TOTAL_QTY_GM, value: details.nbdTotalQtyGm },
  { label: ADDUCT.RPM, value: details.rpm },
  { label: ADDUCT.PROCESS_TEMP, value: details.processTemp },
  { label: ADDUCT.JACKET_TEMP, value: details.jacketTemp },
  { label: ADDUCT.PROCESS_START_TIME, value: details.processStartTime },
  { label: ADDUCT.PROCESS_END_TIME, value: details.processEndTime },
  { label: ADDUCT.FINAL_ADDUCT_QTY, value: details.finalAdductQty },
  { label: ADDUCT.DISPATCH_DATE_TIME, value: details.dispatchDateTime },
];

const buildBlendingStyleFields = (
  labels: typeof HTPB,
  details: BlendingStylePreparationDetails,
): ReadOnlyField[] => [
  { label: labels.MFG_BATCH_LOT_NO, value: details.mfgBatchLotNo },
  { label: labels.TOTAL_QTY, value: details.totalQty },
  { label: labels.EQUIPMENT_ID, value: details.equipmentId },
  { label: labels.AGITATOR_RPM, value: details.agitatorRpm },
  { label: labels.PROCESS_TEMP, value: details.processTemp },
  { label: labels.JACKET_TEMP, value: details.jacketTemp },
  { label: labels.PROCESS_START_TIME, value: details.processStartTime },
  { label: labels.PROCESS_END_TIME, value: details.processEndTime },
  {
    label: labels.OTHER_OBSERVATIONS,
    value: details.otherObservations,
    span: true,
  },
];

const buildHtpbBlendingFields = (details: BlendingStylePreparationDetails): ReadOnlyField[] =>
  buildBlendingStyleFields(HTPB, details);
type RawMaterialPreparationDetailsViewProps = {
  block: MaterialBlock;
  palette: Palette;
};

const RawMaterialPreparationDetailsView = ({
  block,
  palette,
}: RawMaterialPreparationDetailsViewProps) => {
  const showAdduct =
    Boolean(block.adductPreparation) &&
    isAcemAdductMaterial(block.rawMaterialType, block.preparationType);
  const showHtpb =
    Boolean(block.htpbBlendingPreparation) &&
    isAcemHtpbBlendingMaterial(block.rawMaterialType, block.preparationType);
  const showApFine =
    Boolean(block.apFinePreparation) &&
    isAcemApFineMaterial(block.rawMaterialType, block.preparationType);
  const showApUltrafine =
    Boolean(block.apUltrafinePreparation) &&
    isAcemApUltrafineMaterial(block.rawMaterialType, block.preparationType);

  if (!showAdduct && !showHtpb && !showApFine && !showApUltrafine) {
    return null;
  }

  return (
    <>
      {showAdduct && block.adductPreparation ? (
        <PreparationSection
          title={ADDUCT.SECTION_TITLE}
          fields={buildAdductFields(block.adductPreparation)}
          palette={palette}
        />
      ) : null}
      {showHtpb && block.htpbBlendingPreparation ? (
        <PreparationSection
          title={HTPB.SECTION_TITLE}
          fields={buildHtpbBlendingFields(block.htpbBlendingPreparation)}
          palette={palette}
        />
      ) : null}
      {showApFine && block.apFinePreparation ? (
        <PreparationSection
          title={AP_FINE.SECTION_TITLE}
          fields={buildBlendingStyleFields(AP_FINE, block.apFinePreparation)}
          palette={palette}
        />
      ) : null}
      {showApUltrafine && block.apUltrafinePreparation ? (
        <PreparationSection
          title={AP_ULTRAFINE.SECTION_TITLE}
          fields={buildBlendingStyleFields(AP_ULTRAFINE, block.apUltrafinePreparation)}
          palette={palette}
        />
      ) : null}
    </>
  );
};

export default RawMaterialPreparationDetailsView;
