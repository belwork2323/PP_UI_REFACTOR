import React from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { Code, Hub, Storage, SwapHoriz } from "@mui/icons-material";
import { icons } from "@app/theme/icons";
import getExploreBlockchainTheme from "@app/theme/custom_themes/admin/ExploreBlockchain/exploreBlockchain_theme";
import { STRINGS } from "@app/config/strings";
import { useThemeStore } from "@app/store/themeStore";
import AdminManagementPageHeader from "@ui/components/custom/admin/AdminManagementPageHeader";
import AdminManagementStatsGrid from "@ui/components/custom/admin/AdminManagementStatsGrid";
import RefreshIconButton from "@ui/components/common/RefreshIconButton";
import useBlockchainExplorerHook from "@hooks/admin/ExploreBlockchain/useBlockchainExplorerHook";

const S = STRINGS.BLOCKCHAIN_EXPLORER;
const AC = STRINGS.ADMIN_COMMON;

const COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b"];

const STAT_ICONS: Record<string, React.ReactNode> = {
  blocks: <Storage sx={{ fontSize: 22 }} />,
  transactions: <SwapHoriz sx={{ fontSize: 22 }} />,
  nodes: <Hub sx={{ fontSize: 22 }} />,
  chaincodes: <Code sx={{ fontSize: 22 }} />,
};

const STAT_VALUE_KEYS: Record<
  string,
  "latestBlock" | "txCount" | "peerCount" | "chaincodeCount"
> = {
  blocks: "latestBlock",
  transactions: "txCount",
  nodes: "peerCount",
  chaincodes: "chaincodeCount",
};

const BlockchainExplorerPage = () => {
  const mode = useThemeStore((s) => s.mode);
  const t = getExploreBlockchainTheme(mode);
  const ctrl = useBlockchainExplorerHook();

  const statRows = S.STATS.map((s) => ({
    ...s,
    value: ctrl.loading
      ? S.PAGE.LOADING_PLACEHOLDER
      : (ctrl.stats?.[STAT_VALUE_KEYS[s.variant]] ?? 0),
    icon: STAT_ICONS[s.variant],
  }));

  const chartTabs = [
    { label: S.CHARTS.BLOCKS_HOUR, value: "BLOCKS_HOUR" },
    { label: S.CHARTS.BLOCKS_MIN, value: "BLOCKS_MIN" },
    { label: S.CHARTS.TX_HOUR, value: "TX_HOUR" },
    { label: S.CHARTS.TX_MIN, value: "TX_MIN" },
  ];

  return (
    <Box sx={t.page}>
      <AdminManagementPageHeader
        title={S.PAGE.TITLE}
        subtitle={S.PAGE.SUBTITLE}
        primaryAction={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <FormControl size="small">
              <select
                value={ctrl.selectedChannel}
                onChange={(e) => ctrl.setSelectedChannel(e.target.value)}
                disabled={ctrl.loading || ctrl.channels.length === 0}
                style={{
                  minWidth: 240,
                  height: 36,
                  borderRadius: 8,
                  padding: "0 12px",
                  border: "1px solid rgba(0,0,0,0.23)",
                  background: "transparent",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                {ctrl.channels.length === 0 && (
                  <option value="">{S.PAGE.CHANNEL_PLACEHOLDER}</option>
                )}
                {ctrl.channels.map((ch) => (
                  <option key={ch.channel_genesis_hash} value={ch.channel_genesis_hash}>
                    {ch.channelname}
                  </option>
                ))}
              </select>
            </FormControl>
                       <RefreshIconButton
              onClick={ctrl.refresh}
              disabled={ctrl.loading}
              tooltip={S.PAGE.REFRESH_TOOLTIP || AC.REFRESH_TOOLTIP}
              icon={<SwapHoriz />}
            />
          </Box>
        }
        theme={t}
      />

      <AdminManagementStatsGrid stats={statRows} theme={t} />

      {/* Peers + Transactions by Org */}
      <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={t.sectionCard}>
            <CardContent>
              <Typography sx={t.sectionTitle}>{S.PEERS.TITLE}</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{S.PEERS.TABLE.PEER_NAME}</TableCell>
                    <TableCell>{S.PEERS.TABLE.STATUS}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ctrl.peers.length === 0 && !ctrl.loading && (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography variant="body2" color="text.secondary">
                          {S.PEERS.EMPTY}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {ctrl.peers.map((peer) => (
                    <TableRow key={peer.server_hostname}>
                      <TableCell>{peer.nodeName}</TableCell>
                      <TableCell>
                        <Box sx={t.statusDot(peer.status === "UP")} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={t.sectionCard}>
            <CardContent>
              <Typography sx={t.sectionTitle}>
                {S.TRANSACTIONS_BY_ORG.TITLE}
              </Typography>
              <Box sx={t.pieContainer}>
                {ctrl.pieData.length === 0 && !ctrl.loading ? (
                  <Typography variant="body2" color="text.secondary">
                    {S.TRANSACTIONS_BY_ORG.EMPTY}
                  </Typography>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ctrl.pieData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={90}
                        label
                      >
                        {ctrl.pieData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Time-series chart */}
      <Card sx={t.sectionCard}>
        <CardContent>
          <Box sx={t.chartTabs.container}>
            {chartTabs.map((tab) => (
              <Typography
                key={tab.value}
                onClick={() => ctrl.handleChartChange(tab.value)}
                sx={t.chartTabs.tab(ctrl.chartType === tab.value)}
              >
                {tab.label}
              </Typography>
            ))}
          </Box>
          <Box sx={t.chartContainer}>
            {ctrl.chartData.length === 0 && !ctrl.loading ? (
              <Typography variant="body2" color="text.secondary">
                {S.CHARTS.EMPTY}
              </Typography>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ctrl.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BlockchainExplorerPage;
