import React from "react";
import { Box, Typography, Paper, Chip } from "@mui/material";

type JsonBoxViewerProps = {
  data: unknown;
  /** Optional custom overrides if specific labels are required externally */
  labelMap?: Record<string, string>;
};

/**
 * Dynamically converts any camelCase, snake_case, or kebab-case key into a clean Title Case label.
 */
const prettifyKey = (key: string): string => {
  if (!key) return key;
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const resolveLabel = (key: string, labelMap: Record<string, string>): string =>
  labelMap[key] ?? prettifyKey(key);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const formatPrimitive = (value: unknown): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && value.trim() === "") return "—";
  return String(value);
};

/**
 * Recursively formats nested objects or arrays into clean box layouts.
 */
const formatNestedValue = (val: unknown, labelMap: Record<string, string>): React.ReactNode => {
  if (val === null || val === undefined) return "—";

  if (Array.isArray(val)) {
    if (val.length === 0) return "—";
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 0.75 }}>
        {val.map((item, idx) => (
          <Box
            key={idx}
            sx={{
              p: 1.25,
              borderRadius: 1.5,
              bgcolor: "#f8fafc",
              border: "1px solid rgba(148, 163, 184, 0.2)",
            }}
          >
            {isPlainObject(item) ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                  gap: 1,
                }}
              >
                {Object.entries(item).map(([k, v]) => (
                  <Box key={k} sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748b" }}>
                      {resolveLabel(k, labelMap)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 500 }}>
                      {isPlainObject(v) || Array.isArray(v)
                        ? formatNestedValue(v, labelMap)
                        : formatPrimitive(v)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              String(item)
            )}
          </Box>
        ))}
      </Box>
    );
  }

  if (isPlainObject(val)) {
    const entries = Object.entries(val);
    if (entries.length === 0) return "—";
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
          gap: 1,
          mt: 0.75,
          p: 1.25,
          bgcolor: "#f8fafc",
          borderRadius: 1.5,
          border: "1px solid rgba(148,163,184,0.2)",
        }}
      >
        {entries.map(([k, v]) => (
          <Box
            key={k}
            sx={{
              display: "flex",
              flexDirection: "column",
              gridColumn: isPlainObject(v) || Array.isArray(v) ? "1 / -1" : "auto",
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748b" }}>
              {resolveLabel(k, labelMap)}
            </Typography>
            <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 500 }}>
              {isPlainObject(v) || Array.isArray(v)
                ? formatNestedValue(v, labelMap)
                : formatPrimitive(v)}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }

  return formatPrimitive(val);
};

/**
 * Dynamically unwraps standard wrapper layers (like payload -> data)
 * while preserving top-level metadata.
 */
const unwrapCoreData = (data: unknown): Record<string, unknown> => {
  if (!isPlainObject(data)) return {};
  let current: Record<string, unknown> = data;

  while (isPlainObject(current)) {
    if ("payload" in current && isPlainObject(current.payload)) {
      current = current.payload as Record<string, unknown>;
      continue;
    }
    if ("data" in current && isPlainObject(current.data)) {
      current = current.data as Record<string, unknown>;
      continue;
    }
    break;
  }
  return current;
};

export default function JsonBoxViewer({ data, labelMap = {} }: JsonBoxViewerProps) {
  const rootObj = isPlainObject(data) ? data : {};
  const topId = rootObj.id ? String(rootObj.id) : null;
  const txId = rootObj.txId ? String(rootObj.txId) : null;
  const payloadHash = rootObj.payloadHash ? String(rootObj.payloadHash) : null;

  const coreData = unwrapCoreData(data);

  const primitiveFields: [string, unknown][] = [];
  const sectionObjects: [string, Record<string, unknown>][] = [];
  const arrayFields: [string, unknown[]][] = [];

  Object.entries(coreData).forEach(([key, val]) => {
    if (Array.isArray(val)) {
      arrayFields.push([key, val]);
    } else if (isPlainObject(val)) {
      sectionObjects.push([key, val as Record<string, unknown>]);
    } else {
      primitiveFields.push([key, val]);
    }
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 1 }}>
      {/* Top Identifier Header */}
      {(topId || txId || payloadHash) && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "#f8fafc",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {topId && (
            <Typography variant="body2" sx={{ color: "#0f172a", wordBreak: "break-all" }}>
              <Box component="span" sx={{ fontWeight: 700, color: "#475569" }}>
                ID:{" "}
              </Box>
              {topId}
            </Typography>
          )}
          {txId && (
            <Typography variant="caption" sx={{ color: "#64748b", wordBreak: "break-all" }}>
              <Box component="span" sx={{ fontWeight: 600 }}>
                Tx ID:{" "}
              </Box>
              {txId}
            </Typography>
          )}
          {payloadHash && (
            <Typography variant="caption" sx={{ color: "#64748b", wordBreak: "break-all" }}>
              <Box component="span" sx={{ fontWeight: 600 }}>
                Payload Hash:{" "}
              </Box>
              {payloadHash}
            </Typography>
          )}
        </Paper>
      )}

      {/* Overview Details (Primitives) */}
      {primitiveFields.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "#ffffff",
            border: "1px solid rgba(148, 163, 184, 0.25)",
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "0.85rem",
              color: "#334155",
              mb: 1.5,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            Overview Details
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: 1.5,
            }}
          >
            {primitiveFields.map(([key, val]) => (
              <Box key={key} sx={{ display: "flex", flexDirection: "column" }}>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                  {resolveLabel(key, labelMap)}
                </Typography>
                <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 500 }}>
                  {formatPrimitive(val)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Dynamic Section Boxes (Objects) */}
      {sectionObjects.map(([sectionKey, sectionVal]) => (
        <Paper
          key={sectionKey}
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "#ffffff",
            border: "1px solid rgba(148, 163, 184, 0.25)",
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "0.85rem",
              color: "#1e293b",
              mb: 1.5,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              borderBottom: "1px solid #f1f5f9",
              pb: 1,
            }}
          >
            {resolveLabel(sectionKey, labelMap)}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: 1.5,
            }}
          >
            {Object.entries(sectionVal).map(([subKey, subVal]) => (
              <Box
                key={subKey}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gridColumn: isPlainObject(subVal) || Array.isArray(subVal) ? "1 / -1" : "auto",
                }}
              >
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                  {resolveLabel(subKey, labelMap)}
                </Typography>
                <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 500 }}>
                  {formatNestedValue(subVal, labelMap)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      ))}

      {/* Dynamic Array Boxes (Card Boxes instead of Tables) */}
      {arrayFields.map(([arrayKey, arrayVal]) => {
        if (arrayVal.length === 0) return null;

        return (
          <Paper
            key={arrayKey}
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "#ffffff",
              border: "1px solid rgba(148, 163, 184, 0.25)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1.5,
                borderBottom: "1px solid #f1f5f9",
                pb: 1,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "#1e293b",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                {resolveLabel(arrayKey, labelMap)}
              </Typography>
              <Chip
                label={`${arrayVal.length} items`}
                size="small"
                sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600 }}
              />
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {arrayVal.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 1.75,
                    borderRadius: 1.5,
                    bgcolor: "#f8fafc",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: "#475569",
                      mb: 1,
                      display: "block",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {resolveLabel(arrayKey, labelMap).replace(/s$/, "")} #{index + 1}
                  </Typography>
                  {isPlainObject(item) ? (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                        gap: 1.25,
                      }}
                    >
                      {Object.entries(item).map(([k, v]) => (
                        <Box
                          key={k}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gridColumn: isPlainObject(v) || Array.isArray(v) ? "1 / -1" : "auto",
                          }}
                        >
                          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                            {resolveLabel(k, labelMap)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 500 }}>
                            {formatNestedValue(v, labelMap)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 500 }}>
                      {formatPrimitive(item)}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
}
