import React, { useState, useEffect, useMemo } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Card from "@ui/components/common/Card";
import SectionHeader from "@ui/components/common/SectionHeader";
import FilterSelect from "@ui/components/common/FilterSelect";
import DateRangeRow from "@ui/components/common/DateRangeRow";
import AdminListShell from "@ui/components/custom/admin/AdminListShell";
import AdminListFilterPanel from "@ui/components/custom/admin/AdminListFilterPanel";
import { STRINGS } from "@app/config/strings";
import { fetchBlockchainBatchById } from "@/data/api/admin/blockchainEvent/bacthApi";
import getBatchManagementTheme from "@/app/theme/custom_themes/admin/BatchManagement/batchManagement_theme";
import ToggleTabs from "@/ui/components/common/ToggleTabs";
import { BlockchainTab } from "@/hooks/admin/BlockchainEvents/useBlockchainEventsHook";
import EastIcon from "@mui/icons-material/East";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

const AC = STRINGS.ADMIN_COMMON;

type DashboardBlockchainSectionProps = {
  th: any;
  t: typeof import("@app/config/strings").STRINGS.DASHBOARD_PAGE;
  filterMenuProps: any;
  filterMenuItemSx: any;
  batchesList: any[];
  batchesLoading: boolean;
  batchEventsCache: Record<string, { loading: boolean; events: any[]; error?: string }>;
  fetchEventsForBatch: (batchId: string) => void;
  eventsFilterOpen: boolean;
  toggleEventsFilterOpen: () => void;
  setEventsFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
  eventsSearchQuery: string;
  setEventsSearchQuery: (val: string) => void;
  eventsDraftFilters: {
    subDepartment: string;
    dateFrom: string;
    dateTo: string;
    currentMonthOnly: boolean;
  };
  setEventsDraftFilter: <K extends keyof DashboardBlockchainSectionProps["eventsDraftFilters"]>(
    field: K,
    value: DashboardBlockchainSectionProps["eventsDraftFilters"][K],
  ) => void;
  applyEventsFilters: () => void;
  eventsActiveFilterCount: number;
  clearEventsFilters: () => void;
  activeTab: BlockchainTab;
  setActiveTab: (tab: BlockchainTab) => void;
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  blockchainTabOptions: any;
};

const SUB_DEPT_MAP: Record<string, string> = {
  RMP: "Raw Material Preparation",
  CP: "Case Preparation",
  MIX: "Mixing",
  CC: "Casting and Curing",
  PC: "Post Cure Operations",
  SSP: "Subscale",
  TRIM: "Trimming",
  NDT: "NDT",
  QA: "Quality Assurance",
  QC: "Quality Assurance",
  STF: "Static Test Facility",
  DIS: "Dispatch",
};

const DIVISION_MAP: Record<string, string> = {
  RMR: "Raw Material Revalidation",
  RMP: "Raw Material Processing",
  MIX: "Mixing",
  HDW: "Hardware",
  CST: "Casting",
  CUR: "Curing",
  DEC: "De-coring",
  TRM: "Trimming",
  PSC: "Post Cure",
  NDT: "NDT",
  QC: "QC",
  WGT: "Weighment",
  STF: "Static Test Facility",
};

const SUB_DEPT_ORDER_MAP: Record<string, number> = {
  RMP: 1,
  CP: 2,
  MIX: 3,
  CC: 4,
  PC: 5,
  SSP: 6,
  TRIM: 7,
  NDT: 8,
  QA: 9,
  QC: 9,
  STF: 10,
  DIS: 11,
};

const DIVISION_ORDER_MAP: Record<string, number> = {
  RMR: 1,
  RMP: 2,
  MIX: 3,
  HDW: 4,
  CST: 5,
  CUR: 6,
  DEC: 7,
  TRM: 8,
  PSC: 9,
  NDT: 10,
  QC: 11,
  WGT: 12,
  STF: 13,
};

const resolveSubDeptName = (code?: string): string => {
  if (!code) return "";
  const upper = code.toUpperCase().trim();
  return SUB_DEPT_MAP[upper] || code;
};

const resolveDivisionName = (code?: string): string => {
  if (!code) return "";
  const upper = code.toUpperCase().trim();
  return DIVISION_MAP[upper] || code;
};

type ExplorerNode = {
  id: string;
  rawId: string;
  name: string;
  type: "batch" | "subdepartment" | "division" | "entity";
  payload?: any;
  children: ExplorerNode[];
};

const buildExplorerTree = (apiData: any, rootBatchId: string): ExplorerNode => {
  const cleanRoot = rootBatchId.replace(/^uid:(acem:asset\/)?/, "");
  const allNodesMap = new Map<string, any>();

  const collectNodes = (node: any) => {
    if (!node) return;
    const id = node.id || node.assetId;
    if (id) {
      allNodesMap.set(id, node);
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(collectNodes);
    }
  };

  collectNodes(apiData);

  const rootId = `uid:acem:asset/${cleanRoot}`;
  if (!allNodesMap.has(rootId) && !allNodesMap.has(cleanRoot)) {
    allNodesMap.set(rootId, apiData);
  }

  const rootNode: ExplorerNode = {
    id: rootId,
    rawId: rootId,
    name: cleanRoot,
    type: "batch",
    payload: apiData?.payload || apiData,
    children: [],
  };

  const nodeMap = new Map<string, ExplorerNode>();
  nodeMap.set(rootId, rootNode);
  nodeMap.set(cleanRoot, rootNode);

  const sortedIds = Array.from(allNodesMap.keys()).sort((a, b) => {
    const cleanA = a.replace(/^uid:(acem:asset\/)?/, "");
    const cleanB = b.replace(/^uid:(acem:asset\/)?/, "");
    const segA = cleanA
      .slice(cleanRoot.length)
      .replace(/^[:\/]+/, "")
      .split(/[:\/]/)
      .filter(Boolean).length;
    const segB = cleanB
      .slice(cleanRoot.length)
      .replace(/^[:\/]+/, "")
      .split(/[:\/]/)
      .filter(Boolean).length;
    return segA - segB;
  });

  sortedIds.forEach((fullId) => {
    if (fullId === rootId || fullId === cleanRoot) return;
    const rawNode = allNodesMap.get(fullId);
    const cleanId = fullId.replace(/^uid:(acem:asset\/)?/, "");
    let remainder = cleanId;
    if (cleanId.startsWith(cleanRoot)) {
      remainder = cleanId.slice(cleanRoot.length).replace(/^[:\/]+/, "");
    }
    const segments = remainder.split(/[:\/]/).filter(Boolean);
    if (segments.length === 0) return;

    let type: ExplorerNode["type"] = "entity";
    let name = segments[segments.length - 1];

    if (segments.length === 1) {
      type = "subdepartment";
      name = resolveSubDeptName(segments[0]);
    } else if (segments.length === 2) {
      const parentSub = segments[0].toUpperCase();
      const secondSeg = segments[1].toUpperCase();
      if ((parentSub === "QA" || parentSub === "QC") && DIVISION_MAP[secondSeg]) {
        type = "division";
        name = DIVISION_MAP[secondSeg];
      } else if (parentSub === "RMP") {
        type = "entity";
        name = segments[1];
      } else {
        type = "entity";
        name = segments[1];
      }
    } else if (segments.length >= 3) {
      const parentSub = segments[0].toUpperCase();
      const secondSeg = segments[1].toUpperCase();
      if ((parentSub === "QA" || parentSub === "QC") && DIVISION_MAP[secondSeg]) {
        if (segments.length === 3) {
          type = "entity";
          name = segments[2];
        } else {
          type = "division";
          name =
            DIVISION_MAP[segments[segments.length - 2]?.toUpperCase()] ||
            segments[segments.length - 2];
        }
      } else {
        type = "entity";
        name = segments[segments.length - 1];
      }
    }

    const businessPayload =
      rawNode?.data?.payload?.data ?? rawNode?.payload?.data ?? rawNode?.data ?? rawNode;

    const newNode: ExplorerNode = {
      id: fullId,
      rawId: fullId,
      name,
      type,
      payload: businessPayload,
      children: [],
    };

    nodeMap.set(fullId, newNode);
    nodeMap.set(cleanId, newNode);

    const parentSegments = segments.slice(0, segments.length - 1);
    let parentNode: ExplorerNode | undefined;

    if (parentSegments.length === 0) {
      parentNode = rootNode;
    } else {
      const parentClean = cleanRoot + ":" + parentSegments.join(":");
      const parentUid = `uid:acem:asset/${parentClean}`;
      parentNode = nodeMap.get(parentUid) || nodeMap.get(parentClean);

      if (!parentNode) {
        for (const [k, n] of nodeMap.entries()) {
          if (k.endsWith(parentSegments.join(":")) || k.includes(parentSegments.join(":"))) {
            parentNode = n;
            break;
          }
        }
      }
    }

    if (!parentNode) {
      parentNode = rootNode;
    }

    if (!parentNode.children.some((c) => c.id === newNode.id || c.name === newNode.name)) {
      parentNode.children.push(newNode);
    }
  });

  const sortTreeNodes = (node: ExplorerNode) => {
    if (node.type === "batch") {
      node.children.sort((a, b) => {
        const codeA =
          Object.keys(SUB_DEPT_MAP).find((k) => SUB_DEPT_MAP[k] === a.name || k === a.name) ||
          a.name;
        const codeB =
          Object.keys(SUB_DEPT_MAP).find((k) => SUB_DEPT_MAP[k] === b.name || k === b.name) ||
          b.name;
        return (
          (SUB_DEPT_ORDER_MAP[codeA.toUpperCase()] ?? 999) -
          (SUB_DEPT_ORDER_MAP[codeB.toUpperCase()] ?? 999)
        );
      });
    } else if (
      node.type === "subdepartment" &&
      (node.name.toUpperCase().includes("QUALITY") ||
        node.name.toUpperCase().includes("QA") ||
        node.name.toUpperCase().includes("QC"))
    ) {
      node.children.sort((a, b) => {
        const codeA =
          Object.keys(DIVISION_MAP).find((k) => DIVISION_MAP[k] === a.name || k === a.name) ||
          a.name;
        const codeB =
          Object.keys(DIVISION_MAP).find((k) => DIVISION_MAP[k] === b.name || k === b.name) ||
          b.name;
        return (
          (DIVISION_ORDER_MAP[codeA.toUpperCase()] ?? 999) -
          (DIVISION_ORDER_MAP[codeB.toUpperCase()] ?? 999)
        );
      });
    }
    node.children.forEach(sortTreeNodes);
  };

  sortTreeNodes(rootNode);

  return rootNode;
};

const TerminalJsonViewer = ({ data }: { data: any }) => {
  const jsonString = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data]);

  return (
    <Box
      sx={{
        bgcolor: "#000000",
        color: "#00FF00",
        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        p: 2.5,
        borderRadius: 2,
        overflow: "auto",
        maxHeight: "65vh",
        whiteSpace: "pre",
        fontSize: "0.85rem",
        border: "1px solid rgba(34, 197, 94, 0.3)",
        boxShadow: "inset 0 0 15px rgba(0,255,0,0.08)",
      }}
    >
      <Box component="pre" sx={{ m: 0, fontFamily: "inherit", color: "inherit" }}>
        {jsonString}
      </Box>
    </Box>
  );
};

const BatchHierarchicalExplorer = ({ batchId, data }: { batchId: string; data: any; th: any }) => {
  const rootNode = useMemo(() => {
    if (!data) return null;
    return buildExplorerTree(data, batchId);
  }, [data, batchId]);

  const [navPath, setNavPath] = useState<ExplorerNode[]>([]);
  const [showBatchJson, setShowBatchJson] = useState(false);

  useEffect(() => {
    if (rootNode) {
      setNavPath([rootNode]);
      setShowBatchJson(false);
    }
  }, [rootNode]);

  if (!rootNode) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: "center" }}>
        No hierarchical data available for this batch.
      </Typography>
    );
  }

  const currentNode = navPath[navPath.length - 1] || rootNode;
  const isRootBatch = currentNode.type === "batch";

  const handleNavigateToChild = (child: ExplorerNode) => {
    setShowBatchJson(false);
    setNavPath((prev) => [...prev, child]);
  };

  const handleBreadcrumbClick = (index: number) => {
    setShowBatchJson(false);
    setNavPath((prev) => prev.slice(0, index + 1));
  };

  const handleBack = () => {
    setShowBatchJson(false);
    if (navPath.length > 1) {
      setNavPath((prev) => prev.slice(0, prev.length - 1));
    }
  };

  const hasChildren = currentNode.children && currentNode.children.length > 0;
  const isEntityOrTerminal = currentNode.type === "entity" || !hasChildren;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 1 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
          p: 1.5,
          bgcolor: "#f8fafc",
          borderRadius: 2,
          border: "1px solid rgba(148,163,184,0.2)",
        }}
      >
        {navPath.length > 1 && (
          <Button
            size="small"
            variant="outlined"
            onClick={handleBack}
            startIcon={<ArrowBackIosNewIcon sx={{ fontSize: "0.7rem !important" }} />}
            sx={{
              mr: 1,
              textTransform: "none",
              fontSize: "0.75rem",
              fontWeight: 600,
              py: 0.5,
              px: 1.25,
              borderColor: "rgba(148, 163, 184, 0.3)",
              color: "#334155",
              bgcolor: "#ffffff",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "#2E86C1",
                bgcolor: "rgba(46, 134, 193, 0.04)",
                color: "#2E86C1",
              },
            }}
          >
            Back
          </Button>
        )}
        {navPath.map((node, index) => {
          const isLast = index === navPath.length - 1;
          return (
            <React.Fragment key={node.id + index}>
              {index > 0 && (
                <Typography sx={{ color: "#94a3b8", fontSize: "0.8rem" }}>/</Typography>
              )}
              <Chip
                label={node.name}
                size="small"
                onClick={() => handleBreadcrumbClick(index)}
                sx={{
                  fontWeight: isLast ? 700 : 500,
                  bgcolor: isLast ? "#2E86C1" : "#e2e8f0",
                  color: isLast ? "#ffffff" : "#1e293b",
                  cursor: isLast ? "default" : "pointer",
                  "&:hover": {
                    bgcolor: isLast ? "#2E86C1" : "#cbd5e1",
                  },
                }}
              />
            </React.Fragment>
          );
        })}
      </Box>

      {/* Root Batch Level: Clickable Grid Card + Optional JSON Viewer, followed by subdepartments */}
      {isRootBatch && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155", px: 0.5 }}>
            Batch Info
          </Typography>
          <Paper
            elevation={0}
            onClick={() => setShowBatchJson((prev) => !prev)}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: showBatchJson ? "rgba(46, 134, 193, 0.04)" : "#ffffff",
              border: "1px solid",
              borderColor: showBatchJson ? "#2E86C1" : "rgba(148,163,184,0.25)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "#2E86C1",
                boxShadow: "0 4px 12px rgba(46, 134, 193, 0.15)",
                transform: "translateY(-2px)",
              },
              display: "flex",
              flexDirection: "column",
              gap: 0.75,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                {currentNode.name}
              </Typography>
              <Chip
                label="BATCH"
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  bgcolor: "#2E86C1",
                  color: "#fff",
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: "#64748b", wordBreak: "break-all" }}>
              {currentNode.rawId}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#2E86C1",
                fontWeight: 600,
                mt: 0.75,
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <span>{showBatchJson ? "Hide Batch data" : "View Batch data"}</span>
              <EastIcon
                sx={{
                  fontSize: "0.85rem",
                  transform: showBatchJson ? "rotate(90deg)" : "none",
                  transition: "transform 0.2s ease",
                }}
              />
            </Typography>
          </Paper>

          {showBatchJson && (
            <Box sx={{ mt: 1 }}>
              <TerminalJsonViewer data={currentNode.payload || currentNode} />
            </Box>
          )}

          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#334155", px: 0.5, mt: 1 }}
          >
            Select Subdepartment
          </Typography>
        </Box>
      )}

      {hasChildren && !isEntityOrTerminal ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: 1.5,
          }}
        >
          {currentNode.children.map((child) => (
            <Paper
              key={child.id}
              elevation={0}
              onClick={() => handleNavigateToChild(child)}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "#ffffff",
                border: "1px solid rgba(148,163,184,0.25)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "#2E86C1",
                  boxShadow: "0 4px 12px rgba(46, 134, 193, 0.15)",
                  transform: "translateY(-2px)",
                },
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                  {child.name}
                </Typography>
                <Chip
                  label={child.type.toUpperCase()}
                  size="small"
                  sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600, bgcolor: "#f1f5f9" }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: "#64748b", wordBreak: "break-all" }}>
                {child.rawId}
              </Typography>
              {child.children?.length > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "#2E86C1",
                    fontWeight: 600,
                    mt: 0.75,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                    "& svg": {
                      transition: "transform 0.2s ease",
                    },
                    "&:hover svg": {
                      transform: "translateX(4px)",
                    },
                  }}
                >
                  <span>{child.children.length} sub-items</span>
                  <EastIcon sx={{ fontSize: "0.85rem" }} />
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      ) : !isRootBatch ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 0.5 }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155" }}>
              Asset Payload Data ({currentNode.name})
            </Typography>
            <Chip
              label={currentNode.rawId}
              size="small"
              sx={{ fontFamily: "monospace", fontSize: "0.7rem", height: 22 }}
            />
          </Box>
          <TerminalJsonViewer data={currentNode.payload || currentNode} />
        </Box>
      ) : null}
    </Box>
  );
};

const getAssetHeaderLabel = (subDeptName?: string): string => {
  const lower = (subDeptName || "").toLowerCase().trim();
  if (lower.includes("raw material preparation") || lower.includes("rmp")) return "Premix";
  if (lower.includes("case preparation") || lower.includes("cp")) return "Motor";
  if (lower.includes("mixing") || lower.includes("mix")) return "Premix and Final Mix";
  if (lower.includes("casting and curing") || lower.includes("cc")) return "Motor";
  if (lower.includes("post cure") || lower.includes("pc")) return "Motor";
  if (lower.includes("subscale") || lower.includes("ssp")) return "Batch";
  if (lower.includes("Batch") || lower.includes("batch")) return "Batch";
  if (lower.includes("trimming") || lower.includes("trim")) return "Motor";
  if (lower.includes("ndt")) return "Motor";
  if (lower.includes("quality") || lower.includes("qc") || lower.includes("qa")) return "Motor";
  if (lower.includes("static test") || lower.includes("stf")) return "Main Motor and BEM motor";
  if (lower.includes("dispatch") || lower.includes("dis")) return "Motor";
  return "Asset ID";
};

const extractLastSegment = (id?: string): string => {
  if (!id) return "—";
  const cleanId = id.startsWith("uid:") ? id.replace("uid:", "") : id;
  const parts = cleanId.split(/[:/]/).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : cleanId;
};

export default function DashboardBlockchainSection({
  th,
  t,
  filterMenuProps,
  filterMenuItemSx,
  batchesList,
  batchesLoading,
  batchEventsCache,
  fetchEventsForBatch,
  eventsFilterOpen,
  toggleEventsFilterOpen,
  setEventsFilterOpen,
  eventsSearchQuery,
  setEventsSearchQuery,
  eventsDraftFilters,
  setEventsDraftFilter,
  applyEventsFilters,
  eventsActiveFilterCount,
  clearEventsFilters,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  activeTab,
  setActiveTab,
  blockchainTabOptions,
}: DashboardBlockchainSectionProps) {
  const shellTheme = {
    batchListShell: th.batchListShell,
    filterToggle: th.filterToggle,
  };
  const { tableCell } = getBatchManagementTheme();

  const [dialogId, setDialogId] = useState<string | null>(null);
  const [dialogSubDept, setDialogSubDept] = useState<string | null>(null);
  const [dialogBatchId, setDialogBatchId] = useState<string>("");
  const [dialogIsTopLevel, setDialogIsTopLevel] = useState(false);
  const [dialogData, setDialogData] = useState<any>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [activeSubDeptKey, setActiveSubDeptKey] = useState<string | null>(null);
  const [activeDivisionKey, setActiveDivisionKey] = useState<string | null>(null);

  const resultSummary =
    batchesList.length === 0
      ? "0 batches"
      : `${totalCount || batchesList.length} batch${(totalCount || batchesList.length) === 1 ? "" : "es"}`;

  const handleFetchDetails = async (
    arg: string | { batchId: string; assetId?: string },
    subDeptName?: string,
  ) => {
    let batchId: string;
    let assetId: string | undefined;

    if (typeof arg === "string") {
      const trimmed = arg?.trim();
      if (!trimmed || trimmed === "—") return;
      batchId = trimmed;
    } else {
      batchId = arg?.batchId?.trim();
      assetId = arg?.assetId?.trim() || undefined;
      if (!batchId || batchId === "—") return;
    }

    const isTopLevel = !assetId;

    setDialogOpen(true);
    setDialogId(assetId || batchId);
    setDialogBatchId(batchId);
    setDialogIsTopLevel(isTopLevel);
    setDialogSubDept(subDeptName || null);
    setDialogData(null);
    setDialogError("");
    setDialogLoading(true);

    try {
      const response = await fetchBlockchainBatchById({
        batchId,
        assetId,
        _t: Date.now(),
      } as any);

      if (response?.success === false) {
        throw response;
      }
      const data = response?.data ?? response?.batch ?? response;
      setDialogData(data);
    } catch (error: any) {
      setDialogData(null);
      setDialogError(error?.message || "Failed to fetch details from blockchain.");
    } finally {
      setDialogLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogId(null);
    setDialogSubDept(null);
    setDialogBatchId("");
    setDialogIsTopLevel(false);
    setDialogData(null);
    setDialogError("");
    setDialogLoading(false);
  };

  const parseTimestamp = (ts: any) => {
    if (!ts) return "—";
    const dateVal = ts?.$date || ts;
    const parsed = new Date(dateVal);
    return Number.isNaN(parsed.getTime()) ? String(dateVal) : parsed.toLocaleString();
  };

  const gridTemplate =
    "40px minmax(140px, 1.2fr) minmax(90px, 0.8fr) minmax(100px, 0.8fr) minmax(120px, 1fr) minmax(130px, 1fr) minmax(110px, 0.9fr) 56px";

  return (
    <Card sx={th.dashboard.blockchainCard}>
      <SectionHeader
        title={t.BLOCKCHAIN_EVENTS.SECTION_TITLE}
        titleSx={th.timeline.sectionTitle.sx}
      />
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            border: "1px solid rgba(148,163,184,0.2)",
            bgcolor: "#ffffff",
            color: "#0f172a",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
            px: 3,
            py: 2,
            borderBottom: "1px solid rgba(148,163,184,0.18)",
            background: "#ffffff",
            color: "#0f172a",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
              Details — {dialogId || "Unknown"}
            </Typography>
          </Box>
          <IconButton
            aria-label="close details"
            onClick={handleCloseDialog}
            size="small"
            sx={{
              color: "#334155",
              border: "1px solid rgba(148,163,184,0.28)",
              backgroundColor: "rgba(248,250,252,0.9)",
              "&:hover": { backgroundColor: "rgba(226,232,240,0.8)", color: "#0f172a" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{ bgcolor: "#ffffff", color: "#0f172a", minHeight: 220, p: 2.5 }}
        >
          {dialogLoading ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="body2" sx={{ color: "#475569" }}>
                Fetching details…
              </Typography>
            </Stack>
          ) : dialogError ? (
            <Typography variant="body2" color="error">
              {dialogError}
            </Typography>
          ) : dialogData ? (
            dialogIsTopLevel ? (
              <BatchHierarchicalExplorer batchId={dialogBatchId} data={dialogData} th={th} />
            ) : (
              <TerminalJsonViewer
                data={
                  dialogData?.data?.payload?.data ??
                  dialogData?.payload?.data ??
                  dialogData?.data ??
                  dialogData
                }
              />
            )
          ) : (
            <Typography variant="body2" color="text.secondary">
              No data available.
            </Typography>
          )}
        </DialogContent>
        <DialogActions
          sx={{ px: 3, py: 2, bgcolor: "#ffffff", borderTop: "1px solid rgba(148,163,184,0.18)" }}
        >
          <Button onClick={handleCloseDialog} variant="contained" sx={{ minWidth: 120 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <ToggleTabs
        value={activeTab}
        onChange={(value) => setActiveTab(value as BlockchainTab)}
        options={blockchainTabOptions}
      />

      <AdminListShell
        search={eventsSearchQuery}
        onSearchChange={setEventsSearchQuery}
        searchPlaceholder={t.PLACEHOLDERS.EVENT_SEARCH}
        filterOpen={eventsFilterOpen}
        onFilterToggle={toggleEventsFilterOpen}
        activeFilterCount={eventsActiveFilterCount}
        filtersToggleLabel={t.FILTERS.BUTTON}
        resultText={resultSummary}
        loading={batchesLoading}
        hasItems={batchesList.length > 0}
        emptyTitle={t.EMPTY_STATES.NO_EVENTS}
        filterExtension={
          <AdminListFilterPanel
            title={t.FILTERS.TIMELINE_LABEL}
            activeFilterCount={eventsActiveFilterCount}
            onClear={clearEventsFilters}
            clearLabel={t.FILTERS.CLEAR_ALL}
            onClose={() => setEventsFilterOpen(false)}
            onApply={applyEventsFilters}
            closeLabel={AC.FILTERS_CLOSE}
            applyLabel={AC.FILTERS_APPLY}
            theme={th}
          >
            <FilterSelect
              label={t.FILTERS.DEPARTMENT}
              value={eventsDraftFilters.subDepartment}
              onChange={(e) => setEventsDraftFilter("subDepartment", e.target.value)}
              options={t.EVENT_FILTERS.SUB_DEPTS}
              menuProps={filterMenuProps}
              itemSx={filterMenuItemSx}
              showAllOption={true}
              filterPanel
              sx={{ ...th.filterPanel.field, ...th.filterPanel.fieldItem }}
            />

            <DateRangeRow
              from={eventsDraftFilters.dateFrom}
              to={eventsDraftFilters.dateTo}
              onFromChange={(v) => {
                setEventsDraftFilter("dateFrom", v);
                setEventsDraftFilter("currentMonthOnly", false);
              }}
              onToChange={(v) => {
                setEventsDraftFilter("dateTo", v);
                setEventsDraftFilter("currentMonthOnly", false);
              }}
              currentMonthOnly={eventsDraftFilters.currentMonthOnly}
              fromLabel={t.FILTERS.FROM}
              toLabel={t.FILTERS.TO}
              separatorLabel={t.FILTERS.DATE_SEPARATOR}
              showLeadingIcon={false}
              nowrap
              alignInputs="filter"
              controlHeight={32}
              calendarIconSx={th.table.calendarIcon}
              datePickerSx={th.filterPanel.field}
              containerSx={{ ...th.filterPanel.fieldItem, flex: "2 1 320px" }}
              separatorSx={th.table.filterDateSeparator}
              textFieldProps={th.table.dateInputProps}
            />
          </AdminListFilterPanel>
        }
        theme={shellTheme}
      >
        <Box sx={{ position: "relative", minHeight: 120 }}>
          {batchesLoading && (
            <Box sx={th.timeline.loadingOverlay}>
              <CircularProgress size={32} />
            </Box>
          )}

          {batchesList.length === 0 && !batchesLoading ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">{t.EMPTY_STATES.NO_EVENTS}</Typography>
            </Box>
          ) : (
            <Stack spacing={1.25} sx={{ minWidth: 760 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: gridTemplate,
                  gap: 1.5,
                  alignItems: "center",
                  px: 2,
                  py: 1,
                  background: "linear-gradient(180deg, #2E86C1 0%, #1B4F72 100%)",
                  borderRadius: 1.5,
                  border: "1px solid rgba(148,163,184,0.2)",
                  color: "#fff",
                }}
              >
                <Box />
                <Typography
                  sx={{
                    ...th.table.header,
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    color: "inherit",
                  }}
                >
                  Batch ID
                </Typography>
                <Typography
                  sx={{
                    ...th.table.header,
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    color: "inherit",
                  }}
                >
                  Type
                </Typography>
                <Typography
                  sx={{
                    ...th.table.header,
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    color: "inherit",
                  }}
                >
                  Motor ID
                </Typography>
                <Typography
                  sx={{
                    ...th.table.header,
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    color: "inherit",
                  }}
                >
                  Project Name
                </Typography>
                <Typography
                  sx={{
                    ...th.table.header,
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    color: "inherit",
                  }}
                >
                  System Manager
                </Typography>
                <Typography
                  sx={{
                    ...th.table.header,
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    color: "inherit",
                  }}
                >
                  Created Date
                </Typography>
                <Typography
                  align="right"
                  sx={{
                    ...th.table.header,
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    color: "inherit",
                  }}
                >
                  View
                </Typography>
              </Box>

              {batchesList?.map((batchItem) => {
                const batchId = batchItem?.batchId || batchItem?.id || "—";
                const batchType = batchItem?.batchType || batchItem?.type || "—";
                const motorId = batchItem?.motorId || "—";
                const projectName = batchItem?.projectName || "—";
                const managerName =
                  batchItem?.systemManager?.fullName || batchItem?.systemManager?.id || "—";
                const createdDate =
                  batchItem?.date || batchItem?.createdOn || batchItem?.createdAt || "";
                const expanded = activeBatchId === batchId;
                const cacheEntry = batchEventsCache[batchId];

                const eventsBySubDept: Record<string, any[]> = {};
                if (cacheEntry?.events) {
                  cacheEntry.events.forEach((ev) => {
                    const subDeptCode = ev?.subDepartment || ev?.department || "Batch";
                    const resolvedSubDeptName = resolveSubDeptName(subDeptCode);
                    if (!eventsBySubDept[resolvedSubDeptName]) {
                      eventsBySubDept[resolvedSubDeptName] = [];
                    }
                    eventsBySubDept[resolvedSubDeptName].push(ev);
                  });
                }

                return (
                  <Accordion
                    key={batchId}
                    disableGutters
                    elevation={0}
                    expanded={expanded}
                    onChange={(_event, isExpanded) => {
                      setActiveBatchId(isExpanded ? batchId : null);
                      setActiveSubDeptKey(null);
                      setActiveDivisionKey(null);

                      if (isExpanded) {
                        fetchEventsForBatch(batchId);
                      }
                    }}
                    sx={{
                      border: "1px solid rgba(148,163,184,0.22)",
                      borderRadius: "10px !important",
                      overflow: "hidden",
                      bgcolor: "#ffffff",
                      "&::before": { display: "none" },
                      "&.Mui-expanded": {
                        borderColor: "rgba(59,130,246,0.35)",
                        boxShadow: "0 0 0 1px rgba(59,130,246,0.08)",
                      },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={
                        expanded ? <RemoveIcon fontSize="small" /> : <AddIcon fontSize="small" />
                      }
                      sx={{
                        px: 1.5,
                        py: 0.25,
                        flexDirection: "row-reverse",
                        background: expanded
                          ? "linear-gradient(180deg, #f0f7ff 0%, #e0f2fe 100%)"
                          : "#f8fafc",
                        "& .MuiAccordionSummary-expandIconWrapper": { mr: 1.5, ml: 0 },
                        "& .MuiAccordionSummary-content": {
                          my: 1,
                          mr: 1,
                          overflow: "hidden",
                          ml: 0,
                        },
                        cursor: "pointer",
                      }}
                    >
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: gridTemplate,
                          gap: 1.5,
                          alignItems: "center",
                          width: "100%",
                          minWidth: 0,
                        }}
                      >
                        <Box />
                        <Typography sx={{ fontWeight: 700 }} title={batchId}>
                          {batchId}
                        </Typography>
                        <Chip
                          size="small"
                          label={batchType}
                          sx={{
                            height: 22,
                            fontWeight: 600,
                            width: "fit-content",
                            color: "inherit",
                          }}
                        />
                        <Typography title={motorId}>{motorId}</Typography>
                        <Typography title={projectName}>{projectName}</Typography>
                        <Typography title={managerName}>{managerName}</Typography>
                        <Typography>
                          {createdDate ? new Date(createdDate).toLocaleDateString() : "—"}
                        </Typography>
                        <Box
                          sx={{ display: "flex", justifyContent: "flex-end", color: "inherit" }}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Tooltip title="View Batch Details" arrow placement="top">
                            <IconButton
                              size="small"
                              onClick={() => handleFetchDetails(batchId)}
                              sx={{ ...tableCell.editButton, color: "inherit" }}
                            >
                              <VisibilityOutlinedIcon sx={{ ...tableCell.editIcon }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </AccordionSummary>

                    <AccordionDetails
                      sx={{
                        px: 2,
                        pt: 1.5,
                        pb: 2,
                        bgcolor: "#ffffff",
                        borderTop: "1px solid rgba(148,163,184,0.18)",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "text.secondary",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          mb: 1.5,
                          pl: 1,
                        }}
                      >
                        Sub-Departments & Events · {batchId}
                      </Typography>

                      {cacheEntry?.loading ? (
                        <Box sx={{ p: 3, textAlign: "center" }}>
                          <CircularProgress size={24} />
                          <Typography
                            variant="caption"
                            sx={{ display: "block", mt: 1, color: "text.secondary" }}
                          >
                            Loading sub-departments...
                          </Typography>
                        </Box>
                      ) : cacheEntry?.error ? (
                        <Typography variant="body2" color="error" sx={{ p: 2 }}>
                          {cacheEntry.error}
                        </Typography>
                      ) : Object.keys(eventsBySubDept).length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                          No sub-department events found for this batch.
                        </Typography>
                      ) : (
                        <Stack spacing={1.5} sx={{ pl: 2.5, pr: 1 }}>
                          {Object.entries(eventsBySubDept).map(([subDeptName, subDeptEvents]) => {
                            const subDeptKey = `${batchId}-${subDeptName}`;
                            const isSubExpanded = activeSubDeptKey === subDeptKey;
                            const lowerSubDept = subDeptName.toLowerCase();
                            const isQcDept =
                              lowerSubDept.includes("qc") ||
                              lowerSubDept.includes("quality") ||
                              lowerSubDept.includes("qa");

                            const eventsByDivision: Record<string, any[]> = {};
                            if (isQcDept) {
                              subDeptEvents.forEach((ev) => {
                                const divCode = ev?.division || ev?.divisionName || "-";
                                const resolvedDivName = resolveDivisionName(divCode);
                                if (!eventsByDivision[resolvedDivName]) {
                                  eventsByDivision[resolvedDivName] = [];
                                }
                                eventsByDivision[resolvedDivName].push(ev);
                              });
                            }

                            return (
                              <Accordion
                                key={subDeptKey}
                                disableGutters
                                elevation={0}
                                expanded={isSubExpanded}
                                onChange={(_e, expandedState) => {
                                  setActiveSubDeptKey(expandedState ? subDeptKey : null);
                                  setActiveDivisionKey(null);
                                }}
                                sx={{
                                  border: "1px solid rgba(148,163,184,0.22)",
                                  borderRadius: "8px !important",
                                  overflow: "hidden",
                                  bgcolor: "#fafafa",
                                  maxWidth: "97%",
                                  ml: "auto",
                                  "&::before": { display: "none" },
                                }}
                              >
                                <AccordionSummary
                                  expandIcon={
                                    isSubExpanded ? (
                                      <RemoveIcon fontSize="small" color="primary" />
                                    ) : (
                                      <AddIcon fontSize="small" color="primary" />
                                    )
                                  }
                                  sx={{
                                    px: 2,
                                    minHeight: 42,
                                    flexDirection: "row-reverse",
                                    background: isSubExpanded
                                      ? "linear-gradient(180deg, #f0f7ff 0%, #e0f2fe 100%)"
                                      : "#f8fafc",
                                    "& .MuiAccordionSummary-expandIconWrapper": { mr: 1, ml: 0 },
                                    "& .MuiAccordionSummary-content": { my: 0.5, ml: 0 },
                                  }}
                                >
                                  <Stack
                                    direction="row"
                                    spacing={1.5}
                                    alignItems="center"
                                    width="100%"
                                  >
                                    <Typography
                                      sx={{
                                        fontWeight: 600,
                                        fontSize: "0.82rem",
                                        color: "text.primary",
                                      }}
                                    >
                                      {subDeptName}
                                    </Typography>
                                  </Stack>
                                </AccordionSummary>

                                <AccordionDetails
                                  sx={{ p: isQcDept ? 1.5 : 0, bgcolor: "#ffffff" }}
                                >
                                  {isQcDept ? (
                                    <Stack spacing={1.5} sx={{ pl: 4, pr: 1 }}>
                                      <Typography
                                        sx={{
                                          fontSize: "0.75rem",
                                          fontWeight: 700,
                                          color: "text.secondary",
                                          letterSpacing: "0.04em",
                                          textTransform: "uppercase",
                                          mb: 1.5,
                                          pl: 1,
                                        }}
                                      >
                                        Quality Assurance Divisions and Events
                                      </Typography>
                                      {Object.entries(eventsByDivision).map(
                                        ([divisionName, divisionEvents]) => {
                                          const divisionKey = `${subDeptKey}-${divisionName}`;
                                          const isDivExpanded = activeDivisionKey === divisionKey;
                                          const dynamicAssetHeader =
                                            getAssetHeaderLabel(divisionName);

                                          return (
                                            <Accordion
                                              key={divisionKey}
                                              disableGutters
                                              elevation={0}
                                              expanded={isDivExpanded}
                                              onChange={(_e, divExpandedState) => {
                                                setActiveDivisionKey(
                                                  divExpandedState ? divisionKey : null,
                                                );
                                              }}
                                              sx={{
                                                border: "1px solid rgba(148,163,184,0.2)",
                                                borderRadius: "6px !important",
                                                overflow: "hidden",
                                                width: "90%",
                                                bgcolor: "#ffffff",
                                                "&::before": { display: "none" },
                                              }}
                                            >
                                              <AccordionSummary
                                                expandIcon={
                                                  isDivExpanded ? (
                                                    <RemoveIcon fontSize="small" color="primary" />
                                                  ) : (
                                                    <AddIcon fontSize="small" color="primary" />
                                                  )
                                                }
                                                sx={{
                                                  px: 2,
                                                  minHeight: 38,
                                                  flexDirection: "row-reverse",
                                                  bgcolor: isDivExpanded ? "#e2e8f0" : "#f1f5f9",
                                                  "& .MuiAccordionSummary-expandIconWrapper": {
                                                    mr: 1,
                                                    ml: 0,
                                                  },
                                                  "& .MuiAccordionSummary-content": {
                                                    my: 0.25,
                                                    ml: 0,
                                                  },
                                                }}
                                              >
                                                <Typography
                                                  sx={{
                                                    fontWeight: 600,
                                                    fontSize: "0.78rem",
                                                    color: "text.primary",
                                                  }}
                                                >
                                                  {divisionName}
                                                </Typography>
                                              </AccordionSummary>

                                              <AccordionDetails sx={{ p: 0, bgcolor: "#ffffff" }}>
                                                <TableContainer
                                                  sx={{ maxWidth: "100%", mx: "auto" }}
                                                >
                                                  <Box
                                                    sx={{
                                                      maxWidth: "92%",
                                                      mx: "auto",
                                                      my: 1.5,
                                                      border: "1px solid rgba(148, 163, 184, 0.25)",
                                                      borderRadius: 2,
                                                      overflow: "hidden",
                                                    }}
                                                  >
                                                    <Table size="small">
                                                      <TableHead>
                                                        <TableRow
                                                          sx={{ backgroundColor: "#ccd0d4" }}
                                                        >
                                                          <TableCell
                                                            sx={{
                                                              ...th.table.header,
                                                              fontWeight: 700,
                                                              fontSize: "0.76rem",
                                                            }}
                                                          >
                                                            {dynamicAssetHeader}
                                                          </TableCell>
                                                          <TableCell
                                                            sx={{
                                                              ...th.table.header,
                                                              fontWeight: 700,
                                                              fontSize: "0.76rem",
                                                            }}
                                                          >
                                                            Performed By
                                                          </TableCell>
                                                          <TableCell
                                                            sx={{
                                                              ...th.table.header,
                                                              fontWeight: 700,
                                                              fontSize: "0.76rem",
                                                            }}
                                                          >
                                                            Timestamp
                                                          </TableCell>
                                                          <TableCell
                                                            align="right"
                                                            sx={{
                                                              ...th.table.header,
                                                              fontWeight: 700,
                                                              fontSize: "0.76rem",
                                                              width: 80,
                                                            }}
                                                          >
                                                            View
                                                          </TableCell>
                                                        </TableRow>
                                                      </TableHead>
                                                      <TableBody>
                                                        {divisionEvents.map(
                                                          (eventItem: any, eventIndex: number) => {
                                                            const rawAssetId =
                                                              eventItem?.assetId || "—";
                                                            const performedBy =
                                                              eventItem?.performedBy || "—";
                                                            const timestamp = parseTimestamp(
                                                              eventItem?.timestamp,
                                                            );
                                                            const displayIdentifier =
                                                              extractLastSegment(rawAssetId);

                                                            return (
                                                              <TableRow
                                                                key={
                                                                  eventItem?.transactionId ||
                                                                  eventIndex
                                                                }
                                                                hover
                                                                sx={{
                                                                  bgcolor:
                                                                    eventIndex % 2 === 1
                                                                      ? "rgba(248,250,252,0.9)"
                                                                      : "transparent",
                                                                }}
                                                              >
                                                                <TableCell sx={th.table.cell}>
                                                                  <Tooltip
                                                                    title={`Full Asset ID: ${rawAssetId}`}
                                                                    arrow
                                                                    placement="top"
                                                                  >
                                                                    <Typography
                                                                      variant="body2"
                                                                      component="span"
                                                                      sx={{
                                                                        fontWeight: 600,
                                                                        color: "#0f172a",
                                                                      }}
                                                                    >
                                                                      {displayIdentifier}
                                                                    </Typography>
                                                                  </Tooltip>
                                                                </TableCell>
                                                                <TableCell sx={th.table.cell}>
                                                                  {performedBy}
                                                                </TableCell>
                                                                <TableCell sx={th.table.cellDate}>
                                                                  {timestamp}
                                                                </TableCell>
                                                                <TableCell
                                                                  align="right"
                                                                  sx={{
                                                                    ...th.table.cell,
                                                                    width: 80,
                                                                    p: 1,
                                                                  }}
                                                                >
                                                                  <Tooltip
                                                                    title="View Asset Details"
                                                                    arrow
                                                                    placement="top"
                                                                  >
                                                                    <IconButton
                                                                      size="small"
                                                                      onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        handleFetchDetails(
                                                                          {
                                                                            batchId,
                                                                            assetId: rawAssetId,
                                                                          },
                                                                          subDeptName,
                                                                        );
                                                                      }}
                                                                      sx={tableCell.editButton}
                                                                    >
                                                                      <VisibilityOutlinedIcon
                                                                        sx={tableCell.editIcon}
                                                                      />
                                                                    </IconButton>
                                                                  </Tooltip>
                                                                </TableCell>
                                                              </TableRow>
                                                            );
                                                          },
                                                        )}
                                                      </TableBody>
                                                    </Table>
                                                  </Box>
                                                </TableContainer>
                                              </AccordionDetails>
                                            </Accordion>
                                          );
                                        },
                                      )}
                                    </Stack>
                                  ) : (
                                    <TableContainer sx={{ maxWidth: "100%", mx: "auto" }}>
                                      <Box
                                        sx={{
                                          maxWidth: "90%",
                                          mx: "auto",
                                          my: 2,
                                          border: "1px solid rgba(148, 163, 184, 0.25)",
                                          borderRadius: 2,
                                          overflow: "hidden",
                                        }}
                                      >
                                        <Table size="small">
                                          <TableHead>
                                            <TableRow sx={{ backgroundColor: "#ccd0d4" }}>
                                              <TableCell
                                                sx={{
                                                  ...th.table.header,
                                                  fontWeight: 700,
                                                  fontSize: "0.76rem",
                                                }}
                                              >
                                                {getAssetHeaderLabel(subDeptName)}
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  ...th.table.header,
                                                  fontWeight: 700,
                                                  fontSize: "0.76rem",
                                                }}
                                              >
                                                Performed By
                                              </TableCell>
                                              <TableCell
                                                sx={{
                                                  ...th.table.header,
                                                  fontWeight: 700,
                                                  fontSize: "0.76rem",
                                                }}
                                              >
                                                Timestamp
                                              </TableCell>
                                              <TableCell
                                                align="right"
                                                sx={{
                                                  ...th.table.header,
                                                  fontWeight: 700,
                                                  fontSize: "0.76rem",
                                                  width: 80,
                                                }}
                                              >
                                                View
                                              </TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {subDeptEvents.map(
                                              (eventItem: any, eventIndex: number) => {
                                                const rawAssetId = eventItem?.assetId || "—";
                                                const performedBy = eventItem?.performedBy || "—";
                                                const timestamp = parseTimestamp(
                                                  eventItem?.timestamp,
                                                );
                                                const rowBatchId = eventItem?.batchId || batchId;
                                                const displayIdentifier =
                                                  lowerSubDept.includes("subscale") ||
                                                  lowerSubDept.includes("batch")
                                                    ? rowBatchId
                                                    : extractLastSegment(rawAssetId);

                                                return (
                                                  <TableRow
                                                    key={eventItem?.transactionId || eventIndex}
                                                    hover
                                                    sx={{
                                                      bgcolor:
                                                        eventIndex % 2 === 1
                                                          ? "rgba(248,250,252,0.9)"
                                                          : "transparent",
                                                    }}
                                                  >
                                                    <TableCell sx={th.table.cell}>
                                                      <Tooltip
                                                        title={
                                                          lowerSubDept.includes("subscale")
                                                            ? `Batch ID: ${rowBatchId}`
                                                            : `Full Asset ID: ${rawAssetId}`
                                                        }
                                                        arrow
                                                        placement="top"
                                                      >
                                                        <Typography
                                                          variant="body2"
                                                          component="span"
                                                          sx={{ fontWeight: 600, color: "#0f172a" }}
                                                        >
                                                          {displayIdentifier}
                                                        </Typography>
                                                      </Tooltip>
                                                    </TableCell>
                                                    <TableCell sx={th.table.cell}>
                                                      {performedBy}
                                                    </TableCell>
                                                    <TableCell sx={th.table.cellDate}>
                                                      {timestamp}
                                                    </TableCell>
                                                    <TableCell
                                                      align="right"
                                                      sx={{ ...th.table.cell, width: 80, p: 1 }}
                                                    >
                                                      <Tooltip
                                                        title="View Asset Details"
                                                        arrow
                                                        placement="top"
                                                      >
                                                        <IconButton
                                                          size="small"
                                                          onClick={(event) => {
                                                            event.stopPropagation();
                                                            handleFetchDetails(
                                                              {
                                                                batchId,
                                                                assetId: rawAssetId,
                                                              },
                                                              subDeptName,
                                                            );
                                                          }}
                                                          sx={tableCell.editButton}
                                                        >
                                                          <VisibilityOutlinedIcon
                                                            sx={tableCell.editIcon}
                                                          />
                                                        </IconButton>
                                                      </Tooltip>
                                                    </TableCell>
                                                  </TableRow>
                                                );
                                              },
                                            )}
                                          </TableBody>
                                        </Table>
                                      </Box>
                                    </TableContainer>
                                  )}
                                </AccordionDetails>
                              </Accordion>
                            );
                          })}
                        </Stack>
                      )}
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Stack>
          )}

          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={onPageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={onRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </Box>
      </AdminListShell>
    </Card>
  );
}
