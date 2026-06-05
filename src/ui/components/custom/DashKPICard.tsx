import { Box, Typography, Avatar, Stack, SxProps, Theme } from '@mui/material';
import { icons } from '../../../app/theme';
import Card from '../../../ui/components/common/Card';
import StackRow from '../../../ui/components/common/StackRow';

// ── Live card ────────────────────────────────────────────────────────────────
interface DashKPICardProps {
  label: string;
  value: string | number | null | undefined;
  sub?: string;
  Icon: React.ElementType;
  bg: string;
  cardSx: SxProps<Theme>;
  labelProps: { variant?: any; sx?: object };
  valueProps: { variant?: any; sx?: object };
  subRowSx: (positive: boolean) => SxProps<Theme>;
  trendIconSx: SxProps<Theme>;
  avatarSx: (bg: string) => SxProps<Theme>;
  iconSx: SxProps<Theme>;
}

export const DashKPICard = ({
  label, value, sub, Icon, bg,
  cardSx, labelProps, valueProps,
  subRowSx, trendIconSx, avatarSx, iconSx,
}: DashKPICardProps) => (
  <Card sx={cardSx}>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Box>
        <Typography {...labelProps}>{label}</Typography>
        <Typography {...valueProps}>{value ?? '0'}</Typography>
        <StackRow gap={0.3} mt={1} sx={subRowSx(sub?.startsWith('+') ?? false)}>
          {sub?.startsWith('+') && <icons.trendingUp sx={trendIconSx} />}
          <Typography variant="caption" color="inherit">{sub ?? '—'}</Typography>
        </StackRow>
      </Box>
      <Avatar sx={avatarSx(bg)}>
        <Icon sx={iconSx} />
      </Avatar>
    </Stack>
  </Card>
);

// ── Skeleton card ────────────────────────────────────────────────────────────
interface DashKPICardSkeletonProps {
  cardSx: SxProps<Theme>;
  labelProps: { variant?: any; sx?: object };
  valueProps: { variant?: any; sx?: object };
  skeleton: {
    label: object;
    value: object;
    sub: SxProps<Theme>;
    avatarBg: string;
    avatar: object;
  };
  avatarSx: (bg: string) => SxProps<Theme>;
}

export const DashKPICardSkeleton = ({
  cardSx, labelProps, valueProps, skeleton, avatarSx,
}: DashKPICardSkeletonProps) => (
  <Card sx={cardSx}>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Box sx={{ flex: 1 }}>
        <Typography {...labelProps} sx={{ ...labelProps.sx, ...skeleton.label }}>&nbsp;</Typography>
        <Typography {...valueProps} sx={{ ...valueProps.sx, ...skeleton.value }}>&nbsp;</Typography>
        <Box sx={skeleton.sub} />
      </Box>
      <Box sx={{ ...avatarSx(skeleton.avatarBg) as object, ...skeleton.avatar }}>&nbsp;</Box>
    </Stack>
  </Card>
);
