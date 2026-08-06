import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import {
  PARTIAL_ITEM_STATUS_CHIP,
  getPartialNavHint,
  getPartialNavTitle,
  type QcPartialNavItem,
} from "../../../../../hooks/user/qualityControl/qcDivisionApprovalUnits";

type QCPartialItemNavigationProps = {
  items: QcPartialNavItem[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  loading?: boolean;
};

const QCPartialItemNavigation = ({
  items,
  activeIndex,
  onActiveIndexChange,
  loading = false,
}: QCPartialItemNavigationProps) => {
  const BRAND = QC_DIVISION_BRAND;
  if (!items.length) return null;

  const safeIndex = Math.min(Math.max(activeIndex, 0), items.length - 1);
  const atStart = safeIndex <= 0;
  const atEnd = safeIndex >= items.length - 1;
  const active = items[safeIndex];
  const title = getPartialNavTitle(items);
  const hint = getPartialNavHint(items);
  const isMotorNav = items.some((item) => item.kind === "MOTOR");

  return (
    <Stack spacing={1.25} sx={{ mt: 2, opacity: loading ? 0.7 : 1 }}>
      {items.length > 1 ? (
        <Box
          sx={{
            border: `1px solid ${BRAND.border}`,
            borderRadius: 2,
            px: 1.5,
            py: 1.1,
            background: BRAND.surface,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
            <Button
              variant="outlined"
              size="small"
              disabled={atStart || loading}
              onClick={() => onActiveIndexChange(Math.max(0, safeIndex - 1))}
              sx={{ textTransform: "none", minWidth: 80, fontWeight: 700 }}
            >
              Back
            </Button>
            <Stack alignItems="center" spacing={0.25} sx={{ minWidth: 0, px: 1 }}>
              <Typography
                sx={{
                  fontSize: "0.86rem",
                  fontWeight: 800,
                  color: BRAND.primary,
                  textAlign: "center",
                }}
              >
                {active?.label}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: BRAND.textSub }}>
                {isMotorNav ? "Motor" : "Item"} {safeIndex + 1} of {items.length}
              </Typography>
            </Stack>
            <Button
              variant="outlined"
              size="small"
              disabled={atEnd || loading}
              onClick={() => onActiveIndexChange(Math.min(items.length - 1, safeIndex + 1))}
              sx={{ textTransform: "none", minWidth: 80, fontWeight: 700 }}
            >
              Next
            </Button>
          </Stack>
        </Box>
      ) : null}

      <Box
        sx={{
          border: `1px solid ${BRAND.border}`,
          borderRadius: 2,
          px: 1.5,
          py: 1.1,
          background: BRAND.surface,
        }}
      >
        <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: BRAND.primary, mb: 0.4 }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mb: 1 }}>{hint}</Typography>
        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
          {items.map((item, index) => {
            const activeChip = index === safeIndex;
            const tone = PARTIAL_ITEM_STATUS_CHIP[item.status];
            return (
              <Button
                key={item.id}
                size="small"
                variant={activeChip ? "contained" : "outlined"}
                disabled={loading}
                onClick={() => onActiveIndexChange(index)}
                sx={{
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  textTransform: "none",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  ...(activeChip
                    ? {
                        background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
                        "&:hover": {
                          background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
                        },
                      }
                    : {}),
                }}
              >
                {item.label}
                <Chip
                  label={tone.label}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    background: activeChip ? "rgba(255,255,255,0.22)" : tone.bg,
                    color: activeChip ? "#fff" : tone.color,
                    border: activeChip ? "1px solid rgba(255,255,255,0.35)" : `1px solid ${tone.border}`,
                    "& .MuiChip-label": { px: 0.6 },
                  }}
                />
              </Button>
            );
          })}
        </Stack>
      </Box>
    </Stack>
  );
};

export default QCPartialItemNavigation;
