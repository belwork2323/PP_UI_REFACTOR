import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type JsonTreeViewerProps = {
  data: unknown;
  rootLabel?: string;
  /** Path prefixes expanded by default (e.g. `["root", "root.payload"]`). */
  defaultExpandedPaths?: string[];
  labelMap?: Record<string, string>;
};

const DEFAULT_LABEL_MAP: Record<string, string> = {
  createdAt: "Created At",
  expiresAt: "Expires At",
  id: "ID",
  issuer: "Issuer",
  lastAmendmentReason: "Last Amendment Reason",
  payload: "Payload",
  data: "Data",
  division: "Division",
  motorWeightDetails: "Motor Weight Details",
  approvedAt: "Approved At",
  approvedBy: "Approved By",
  fullName: "Full Name",
  motorId: "Motor ID",
  motorSubmissionStatus: "Motor Submission Status",
  motorSubmissionType: "Motor Submission Type",
  remarks: "Remarks",
  submittedAt: "Submitted At",
  submittedBy: "Submitted By",
  weights: "Weights",
  calculation: "Calculation",
  autoCalculate: "Auto Calculate",
  formula: "Formula",
  srNo: "Sr. No.",
  weightKg: "Weight (kg)",
  weightParameter: "Weight Parameter",
  weighscaleDetails: "Weighscale Details",
  calibrationDueDate: "Calibration Due Date",
  weighscaleNo: "Weighscale No.",
  payloadHash: "Payload Hash",
  revokeReason: "Revoke Reason",
  revokedAt: "Revoked At",
  schemaId: "Schema ID",
  status: "Status",
  subjectId: "Subject ID",
  subjectSecondaryId: "Subject Secondary ID",
  suspendedAt: "Suspended At",
  tags: "Tags",
  txId: "Transaction ID",
  updatedAt: "Updated At",
  version: "Version",
  batchId: "Batch ID",
  department: "Department",
  departmentName: "Department Name",
  success: "Success",
  code: "Code",
  message: "Message",
  timestamp: "Timestamp",
};

const prettifyKey = (key: string): string => {
  if (!key) return key;
  const withSpaces = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return withSpaces.replace(/\b\w/g, (c) => c.toUpperCase());
};

const resolveLabel = (key: string, labelMap: Record<string, string>): string =>
  labelMap[key] ?? DEFAULT_LABEL_MAP[key] ?? prettifyKey(key);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const formatPrimitive = (value: unknown): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && value.trim() === "") return "—";
  return String(value);
};

const collectExpandablePaths = (value: unknown, path: string, depth: number, maxDepth: number): string[] => {
  if (depth > maxDepth) return [];
  if (Array.isArray(value)) {
    const childPaths = value.flatMap((item, index) =>
      collectExpandablePaths(item, `${path}.${index}`, depth + 1, maxDepth),
    );
    return [path, ...childPaths];
  }
  if (isPlainObject(value)) {
    const childPaths = Object.entries(value).flatMap(([key, child]) =>
      collectExpandablePaths(child, `${path}.${key}`, depth + 1, maxDepth),
    );
    return [path, ...childPaths];
  }
  return [];
};

type NodeProps = {
  label: string;
  value: unknown;
  path: string;
  depth: number;
  expanded: Record<string, boolean>;
  onToggle: (path: string) => void;
  labelMap: Record<string, string>;
};

const JsonTreeNode = ({
  label,
  value,
  path,
  depth,
  expanded,
  onToggle,
  labelMap,
}: NodeProps): ReactNode => {
  const isArray = Array.isArray(value);
  const isObject = isPlainObject(value);
  const isExpandable = isArray || isObject;
  const isOpen = Boolean(expanded[path]);
  const paddingLeft = depth * 1.5;

  if (!isExpandable) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 0.75,
          pl: paddingLeft,
          py: 0.35,
          minHeight: 28,
        }}
      >
        <Box sx={{ width: 28, flexShrink: 0 }} />
        <Typography
          component="span"
          sx={{ fontSize: "0.9rem", color: "#0f172a", lineHeight: 1.5, wordBreak: "break-word" }}
        >
          <Box component="span" sx={{ fontWeight: 700 }}>
            {label}:
          </Box>{" "}
          <Box component="span" sx={{ fontWeight: 400, color: "#334155" }}>
            {formatPrimitive(value)}
          </Box>
        </Typography>
      </Box>
    );
  }

  const entries = isArray
    ? (value as unknown[]).map((item, index) => ({
        key: String(index),
        label: String(index + 1),
        child: item,
      }))
    : Object.entries(value as Record<string, unknown>).map(([key, child]) => ({
        key,
        label: resolveLabel(key, labelMap),
        child,
      }));

  const emptyHint = isArray ? "(empty list)" : "(empty)";

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.25,
          pl: paddingLeft,
          py: 0.25,
          minHeight: 30,
          cursor: "pointer",
          borderRadius: 1,
          "&:hover": { backgroundColor: "rgba(148, 163, 184, 0.08)" },
        }}
        onClick={() => onToggle(path)}
      >
        <IconButton
          size="small"
          aria-label={isOpen ? `Collapse ${label}` : `Expand ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(path);
          }}
          sx={{ p: 0.25, color: "#475569" }}
        >
          {isOpen ? (
            <KeyboardArrowDownIcon sx={{ fontSize: 20 }} />
          ) : (
            <KeyboardArrowRightIcon sx={{ fontSize: 20 }} />
          )}
        </IconButton>
        <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>
          {label}
          {isArray ? (
            <Box component="span" sx={{ fontWeight: 500, color: "#64748b", ml: 0.75 }}>
              [{entries.length}]
            </Box>
          ) : null}
        </Typography>
      </Box>

      {isOpen &&
        (entries.length === 0 ? (
          <Box sx={{ pl: paddingLeft + 3.5, py: 0.25 }}>
            <Typography variant="body2" sx={{ color: "#94a3b8", fontStyle: "italic" }}>
              {emptyHint}
            </Typography>
          </Box>
        ) : (
          entries.map(({ key, label: childLabel, child }) => (
            <JsonTreeNode
              key={`${path}.${key}`}
              label={childLabel}
              value={child}
              path={`${path}.${key}`}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              labelMap={labelMap}
            />
          ))
        ))}
    </Box>
  );
};

/**
 * Expandable tree view for arbitrary JSON with human-readable field labels.
 */
export default function JsonTreeViewer({
  data,
  rootLabel = "JSON Data",
  defaultExpandedPaths,
  labelMap = {},
}: JsonTreeViewerProps) {
  const mergedLabelMap = useMemo(() => ({ ...DEFAULT_LABEL_MAP, ...labelMap }), [labelMap]);

  const initialExpanded = useMemo(() => {
    const paths =
      defaultExpandedPaths ??
      collectExpandablePaths(data as JsonValue, "root", 0, 2);
    return Object.fromEntries(paths.map((p) => [p, true]));
  }, [data, defaultExpandedPaths]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(initialExpanded);

  // Reset expansion when a new payload is shown
  const dataIdentity = useMemo(() => {
    try {
      return JSON.stringify(data);
    } catch {
      return String(data);
    }
  }, [data]);

  useEffect(() => {
    setExpanded(initialExpanded);
  }, [dataIdentity, initialExpanded]);

  const handleToggle = (path: string) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <Box
      sx={{
        bgcolor: "#ffffff",
        color: "#0f172a",
        borderRadius: 1.5,
        border: "1px solid rgba(148,163,184,0.25)",
        p: { xs: 1.25, sm: 2 },
        maxHeight: "60vh",
        overflow: "auto",
      }}
    >
      <JsonTreeNode
        label={rootLabel}
        value={data}
        path="root"
        depth={0}
        expanded={expanded}
        onToggle={handleToggle}
        labelMap={mergedLabelMap}
      />
    </Box>
  );
}
