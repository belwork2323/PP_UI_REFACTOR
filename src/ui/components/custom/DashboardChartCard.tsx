import { ReactNode } from 'react';
import { Box, Typography, Divider, SxProps, Theme } from '@mui/material';
import { icons } from '../../../app/theme';
import Card from '../../../ui/components/common/Card';
import StackRow from '../../../ui/components/common/StackRow';

interface DashboardChartCardProps {
  cardSx: SxProps<Theme>;
  headerBoxSx: SxProps<Theme>;
  contentSx: SxProps<Theme>;
  title: string;
  subtitle?: string;
  highlight?: string;
  timestamp: string;
  titleProps: object;
  subtitleProps?: object;
  highlightProps?: object;
  dividerProps: object;
  clockIconSx: SxProps<Theme>;
  timestampProps: object;
  children: ReactNode;
}

const DashboardChartCard = ({
  cardSx, headerBoxSx, contentSx,
  title, subtitle, highlight, timestamp,
  titleProps, subtitleProps, highlightProps, dividerProps,
  clockIconSx, timestampProps,
  children,
}: DashboardChartCardProps) => (
  <Card sx={cardSx}>
    <Box sx={headerBoxSx}>
      {children}
    </Box>
    <Box sx={contentSx}>
      <Typography {...(titleProps as any)}>{title}</Typography>
      {highlight && highlightProps && <Typography {...(highlightProps as any)}>{highlight}</Typography>}
      {subtitle && subtitleProps && <Typography {...(subtitleProps as any)}>{subtitle}</Typography>}
      <Divider {...(dividerProps as any)} />
      <StackRow spacing={0.5}>
        <icons.clock sx={clockIconSx} />
        <Typography {...(timestampProps as any)}>{timestamp}</Typography>
      </StackRow>
    </Box>
  </Card>
);

export default DashboardChartCard;
