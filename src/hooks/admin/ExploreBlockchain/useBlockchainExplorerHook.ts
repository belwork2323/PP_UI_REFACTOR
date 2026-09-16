import { useCallback, useEffect, useState } from "react";
import { BLOCKCHAIN_EXPLORER } from "@data/api/endPoints";
import { get, post } from "@data/api/httpClient";
export type ChartType = "BLOCKS_HOUR" | "BLOCKS_MIN" | "TX_HOUR" | "TX_MIN";

export type Channel = {
  channelname: string;
  channel_genesis_hash: string;
};

export type Peer = {
  server_hostname: string;
  nodeName: string;
  status: "UP" | "DOWN";
};

export type BlockchainStats = {
  latestBlock: number;
  txCount: number;
  peerCount: number;
  chaincodeCount: number;
};

export type PieDatum = {
  name: string;
  value: number;
};

export type ChartDatum = {
  time: string;
  value: number;
};

/** Unwrap AcemResponse-style payload: { data: T, message, ... } or raw T */
const unwrap = <T>(res: any): T => {
  if (res == null) return res;
  // axios: res.data is the HTTP body
  const body = res.data !== undefined ? res.data : res;
  // AcemResponse: { success, message, data }
  if (body && typeof body === "object" && "data" in body) {
    return body.data as T;
  }
  return body as T;
};

const mapChannels = (raw: any): Channel[] => {
  const list = Array.isArray(raw) ? raw : raw?.channels ?? [];
  return list.map((ch: any) => ({
    channelname: ch.channelname ?? ch.channelName ?? ch.name ?? "",
    channel_genesis_hash:
      ch.channel_genesis_hash ?? ch.channelGenesisHash ?? ch.genesisHash ?? ch.hash ?? "",
  }));
};

const mapStats = (raw: any): BlockchainStats => ({
  latestBlock: Number(raw?.latestBlock ?? raw?.blockHeight ?? raw?.height ?? 0),
  txCount: Number(raw?.txCount ?? raw?.transactionCount ?? raw?.tx_count ?? 0),
  peerCount: Number(raw?.peerCount ?? raw?.peers ?? raw?.peer_count ?? 0),
  chaincodeCount: Number(
    raw?.chaincodeCount ?? raw?.chaincodes ?? raw?.chaincode_count ?? 0,
  ),
});

const mapPeers = (raw: any): Peer[] => {
  const list = Array.isArray(raw) ? raw : raw?.peers ?? [];
  return list.map((p: any) => {
    const host = p.server_hostname ?? p.serverHostname ?? p.name ?? p.peerName ?? "";
    const statusRaw = String(p.status ?? p.state ?? "DOWN").toUpperCase();
    return {
      server_hostname: host,
      nodeName: p.nodeName ?? p.requests ?? host.split(".")[0] ?? host,
      status: statusRaw === "UP" || statusRaw === "RUNNING" ? "UP" : "DOWN",
    };
  });
};

const mapPie = (raw: any): PieDatum[] => {
  const list = Array.isArray(raw) ? raw : raw?.rows ?? [];
  return list.map((row: any) => ({
    name: row.creator_msp_id ?? row.name ?? row.org ?? row.organization ?? "Unknown",
    value: Number(row.count ?? row.value ?? row.txCount ?? 0),
  }));
};

const mapChart = (raw: any): ChartDatum[] => {
  const list = Array.isArray(raw) ? raw : raw?.rows ?? [];
  return list.map((row: any) => {
    const timeRaw =
      row.datetime ?? row.time ?? row.timestamp ?? row.label ?? row.hour ?? row.minute ?? "";
    let time = String(timeRaw);
    // try to show only HH:mm if full ISO
    if (time.includes("T") || time.length > 12) {
      try {
        time = new Date(time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        // keep original
      }
    }
    return {
      time,
      value: Number(row.count ?? row.value ?? row.total ?? 0),
    };
  });
};

const chartTypeToRequest = (chartType: ChartType) => {
  if (chartType === "BLOCKS_HOUR") return { type: "BLOCKS", interval: "HOUR" };
  if (chartType === "BLOCKS_MIN") return { type: "BLOCKS", interval: "MIN" };
  if (chartType === "TX_HOUR") return { type: "TX", interval: "HOUR" };
  return { type: "TX", interval: "MIN" };
};

const useBlockchainExplorerHook = () => {
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [stats, setStats] = useState<BlockchainStats | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [pieData, setPieData] = useState<PieDatum[]>([]);
  const [chartType, setChartType] = useState<ChartType>("BLOCKS_HOUR");
  const [chartData, setChartData] = useState<ChartDatum[]>([]);

  const fetchChannels = useCallback(async (): Promise<Channel[]> => {
    const res = await get(BLOCKCHAIN_EXPLORER.CHANNELS);
    return mapChannels(unwrap(res));
  }, []);

  const fetchStats = useCallback(async (genesisHash: string): Promise<BlockchainStats> => {
    const res = await post(BLOCKCHAIN_EXPLORER.STATS, { genesisHash });
    return mapStats(unwrap(res));
  }, []);

  const fetchPeers = useCallback(async (genesisHash: string): Promise<Peer[]> => {
    const res = await post(BLOCKCHAIN_EXPLORER.PEERS, { genesisHash });
    return mapPeers(unwrap(res));
  }, []);

  const fetchPie = useCallback(async (genesisHash: string): Promise<PieDatum[]> => {
    const res = await post(BLOCKCHAIN_EXPLORER.TX_BY_ORG, { genesisHash });
    return mapPie(unwrap(res));
  }, []);

  const fetchChart = useCallback(
    async (genesisHash: string, type: ChartType): Promise<ChartDatum[]> => {
      const { type: t, interval } = chartTypeToRequest(type);
      const res = await post(BLOCKCHAIN_EXPLORER.CHART, {
        hash: genesisHash,
        type: t,
        interval,
      });
      return mapChart(unwrap(res));
    },
    [],
  );

  const loadAll = useCallback(
    async (channelHash?: string, nextChartType?: ChartType) => {
      setLoading(true);
      try {
        const channelList = await fetchChannels();
        setChannels(channelList);

        const hash =
          channelHash ||
          selectedChannel ||
          channelList[0]?.channel_genesis_hash ||
          "";

        if (!hash) {
          setStats(null);
          setPeers([]);
          setPieData([]);
          setChartData([]);
          return;
        }

        setSelectedChannel(hash);
        const activeChart = nextChartType ?? chartType;

        const [statsRes, peersRes, pieRes, chartRes] = await Promise.all([
          fetchStats(hash),
          fetchPeers(hash),
          fetchPie(hash),
          fetchChart(hash, activeChart),
        ]);

        setStats(statsRes);
        setPeers(peersRes);
        setPieData(pieRes);
        setChartData(chartRes);
      } catch (err) {
        console.error("[useBlockchainExplorerHook] load failed", err);
        // keep previous data; optionally clear on hard failure
      } finally {
        setLoading(false);
      }
    },
    [
      fetchChannels,
      fetchStats,
      fetchPeers,
      fetchPie,
      fetchChart,
      selectedChannel,
      chartType,
    ],
  );

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChannelChange = useCallback(
    (hash: string) => {
      setSelectedChannel(hash);
      loadAll(hash);
    },
    [loadAll],
  );

  const handleChartChange = useCallback(
    (type: string) => {
      const t = type as ChartType;
      setChartType(t);
      if (selectedChannel) {
        setLoading(true);
        fetchChart(selectedChannel, t)
          .then(setChartData)
          .catch((err) => console.error("[chart] failed", err))
          .finally(() => setLoading(false));
      }
    },
    [selectedChannel, fetchChart],
  );

  const refresh = useCallback(() => {
    loadAll(selectedChannel);
  }, [loadAll, selectedChannel]);

  return {
    loading,
    channels,
    selectedChannel,
    setSelectedChannel: handleChannelChange,
    stats,
    peers,
    pieData,
    chartType,
    chartData,
    handleChartChange,
    refresh,
  };
};

export default useBlockchainExplorerHook;
