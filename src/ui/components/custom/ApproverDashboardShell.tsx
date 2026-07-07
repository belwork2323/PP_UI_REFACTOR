import { useMemo, type ElementType, type ReactNode } from "react";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import {
  Box,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

import { STRINGS } from "../../../app/config/strings";
import {
  approverSpacing,
  approverTypography,
  getApproverBrand,
  type ApproverDepartmentKey,
} from "../../../app/theme/approver";
import useApproverDepartmentHeaderHook from "../../../hooks/approver/useApproverDepartmentHeaderHook";
import useApproverDepartmentOverviewStats from "../../../hooks/approver/useApproverDepartmentOverviewStats";
import type { ApproverDashboardSubDepartment } from "../../../hooks/approver/useApproverDashboard";
import { useApproverDashboard } from "../../../hooks/approver/useApproverDashboard";
import Card from "../common/Card";
import AppButton from "../common/Button";
import DepartmentHeader from "./DepartmentHeader";
import ApproverSectionLabel from "./ApproverSectionLabel";

type ApproverDashboardShellProps = {
  department: ApproverDepartmentKey;
  departmentName: string;
  emptyIcon: ElementType;
  renderSubPage: (subDepartment: string) => ReactNode;
  routeBase: string;
  sectionTitle: string;
  subDepartment?: string;
  subDepartments: Array<
    ApproverDashboardSubDepartment & {
      color: string;
      icon: ElementType;
      sectionLabel: string;
    }
  >;
};

const OVERVIEW_STATS_SKIP_KEYS: string[] = [];

const ApproverDashboardShell = ({
  department,
  departmentName,
  emptyIcon: EmptyIcon,
  renderSubPage,
  routeBase,
  sectionTitle,
  subDepartment,
  subDepartments,
}: ApproverDashboardShellProps) => {
  const brand = getApproverBrand(department);
  const navigate = useNavigate();
  const subDeptKeys = useMemo(() => subDepartments.map((item) => item.key), [subDepartments]);
  const overviewStatsKeys = subDepartment ? OVERVIEW_STATS_SKIP_KEYS : subDeptKeys;
  const statsByKey = useApproverDepartmentOverviewStats(department, overviewStatsKeys);

  const enrichedSubDepartments = useMemo(
    () =>
      subDepartments.map((item) => {
        const liveStats = statsByKey[item.key];
        return {
          ...item,
          allocated: liveStats?.allocated ?? item.allocated ?? 0,
          pending: liveStats?.pending ?? item.pending ?? 0,
          approved: liveStats?.approved ?? item.approved ?? 0,
          rejected: liveStats?.rejected ?? item.rejected ?? 0,
        };
      }),
    [statsByKey, subDepartments],
  );

  const { labels, totals } = useApproverDashboard(enrichedSubDepartments);
  const { statItems, userName, userRole } = useApproverDepartmentHeaderHook({
    department,
    subDeptSlug: subDepartment,
  });

  const currentSubDepartment = subDepartment ? labels[subDepartment] ?? subDepartment : null;

  const kpis = [
    {
      label: STRINGS.APPROVER.DASHBOARD.KPI.TOTAL_ALLOCATED,
      value: totals.allocated,
      color: brand.primary,
      background: alpha(brand.primary, 0.07),
    },
    {
      label: STRINGS.APPROVER.DASHBOARD.KPI.TOTAL_PENDING,
      value: totals.pending,
      color: "#7D6608",
      background: alpha("#D4AC0D", 0.09),
    },
    {
      label: STRINGS.APPROVER.DASHBOARD.KPI.TOTAL_APPROVED,
      value: totals.approved,
      color: "#0E6655",
      background: alpha("#148F77", 0.09),
    },
    {
      label: STRINGS.APPROVER.DASHBOARD.KPI.TOTAL_REJECTED,
      value: totals.rejected,
      color: "#922B21",
      background: alpha("#C0392B", 0.09),
    },
  ];

  const validRoutes = subDepartments.map((item) => `${routeBase}/${item.key}`);

  return (
    <Box
      sx={{
        p: 3,
        background: brand.background,
        minHeight: "100vh",
      }}
    >
      <DepartmentHeader
        deptName={departmentName}
        subDeptName={currentSubDepartment ?? STRINGS.APPROVER.COMMON.OVERVIEW}
        userName={userName}
        userRole={userRole}
        statItems={statItems}
      />

      <Box sx={{ mt: approverSpacing.sectionGap }}>
        {subDepartment ? (
          labels[subDepartment] ? (
            <>
              <ApproverSectionLabel
                department={department}
                label={
                  subDepartments.find((item) => item.key === subDepartment)?.sectionLabel ??
                  labels[subDepartment]
                }
              />
              {renderSubPage(subDepartment)}
            </>
          ) : (
            <Box sx={{ textAlign: "center", py: 8, color: brand.textSub }}>
              <EmptyIcon sx={{ fontSize: 40, mb: 1.5, opacity: 0.25 }} />
              <Typography sx={{ ...approverTypography.title, color: brand.text, fontSize: "0.9rem" }}>
                {STRINGS.APPROVER.COMMON.UNKNOWN_SUB_DEPARTMENT(subDepartment)}
              </Typography>
              <Typography sx={{ ...approverTypography.caption, mt: 0.5, opacity: 0.7 }}>
                {STRINGS.APPROVER.COMMON.VALID_ROUTES(validRoutes)}
              </Typography>
            </Box>
          )
        ) : (
          <>
            <Stack direction="row" gap={1.5} flexWrap="wrap" mb={3}>
              {kpis.map((kpi) => (
                <Box
                  key={kpi.label}
                  sx={{
                    px: 2.5,
                    py: 1.25,
                    borderRadius: 2.5,
                    background: kpi.background,
                    border: `1px solid ${alpha(kpi.color, 0.2)}`,
                    minWidth: 110,
                    textAlign: "center",
                  }}
                >
                  <Typography sx={{ fontSize: "1.6rem", fontWeight: 900, color: kpi.color, lineHeight: 1.1 }}>
                    {kpi.value}
                  </Typography>
                  <Typography sx={{ ...approverTypography.caption, color: brand.textSub, mt: 0.2 }}>
                    {kpi.label}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <ApproverSectionLabel department={department} label={sectionTitle} />

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
              }}
            >
              {enrichedSubDepartments.map((item) => {
                const Icon = item.icon;
                const pendingCount = item.pending ?? 0;
                const hasPending = pendingCount > 0;

                return (
                  <Card
                    key={item.key}
                    disableContent
                    sx={{
                      borderRadius: 3,
                      border: `1px solid ${hasPending ? alpha(item.color, 0.3) : brand.border}`,
                      boxShadow: hasPending
                        ? `0 3px 16px ${alpha(item.color, 0.12)}`
                        : `0 2px 8px ${alpha(brand.primary, 0.05)}`,
                      cursor: "pointer",
                      transition: "box-shadow 0.2s, transform 0.2s",
                      "&:hover": {
                        boxShadow: `0 6px 24px ${alpha(item.color, 0.18)}`,
                        transform: "translateY(-2px)",
                      },
                    }}
                    onClick={() => navigate(`${routeBase}/${item.key}`)}
                  >
                    <Box
                      sx={{
                        height: 5,
                        background: `linear-gradient(90deg, ${item.color}, ${alpha(item.color, 0.4)})`,
                      }}
                    />

                    <Box sx={{ p: 2.5 }}>
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
                        <Stack direction="row" alignItems="center" gap={1.25}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 2,
                              background: alpha(item.color, 0.1),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Icon sx={{ fontSize: 19, color: item.color }} />
                          </Box>

                          <Box>
                            <Typography sx={{ ...approverTypography.title, color: brand.text, fontSize: "0.88rem", lineHeight: 1.2 }}>
                              {item.label}
                            </Typography>
                            <Typography sx={{ ...approverTypography.caption, color: brand.textSub, mt: 0.3 }}>
                              {item.description}
                            </Typography>
                          </Box>
                        </Stack>

                        {hasPending && (
                          <Chip
                            label={STRINGS.APPROVER.DASHBOARD.PENDING_BADGE(pendingCount)}
                            size="small"
                            icon={<HourglassEmptyRoundedIcon sx={{ fontSize: "11px !important" }} />}
                            sx={{
                              height: 22,
                              fontSize: "0.62rem",
                              fontWeight: 700,
                              background: alpha(brand.warn, 0.12),
                              color: "#7D6608",
                              border: `1px solid ${alpha(brand.warn, 0.35)}`,
                              flexShrink: 0,
                              "& .MuiChip-icon": { color: "#7D6608" },
                            }}
                          />
                        )}
                      </Stack>

                      <Stack direction="row" gap={2} alignItems="center" sx={{ mt: 2 }}>
                        {[
                          {
                            label: STRINGS.APPROVER.COMMON.STATUS_PENDING,
                            value: pendingCount,
                            color: "#7D6608",
                            IconComponent: HourglassEmptyRoundedIcon,
                          },
                          {
                            label: STRINGS.APPROVER.COMMON.STATUS_APPROVED,
                            value: item.approved ?? 0,
                            color: "#0E6655",
                            IconComponent: CheckCircleOutlineRoundedIcon,
                          },
                          {
                            label: STRINGS.APPROVER.COMMON.STATUS_REJECTED,
                            value: item.rejected ?? 0,
                            color: "#922B21",
                            IconComponent: CancelOutlinedIcon,
                          },
                        ].map(({ IconComponent, color, label, value }) => (
                          <Stack key={label} direction="row" alignItems="center" gap={0.5}>
                            <IconComponent sx={{ fontSize: 13, color }} />
                            <Typography sx={{ ...approverTypography.caption, color, fontWeight: 700 }}>
                              {value}
                            </Typography>
                            <Typography sx={{ ...approverTypography.caption, color: brand.textSub }}>
                              {label}
                            </Typography>
                          </Stack>
                        ))}

                        <Box sx={{ flex: 1 }} />

                        <AppButton
                          fullWidth={false}
                          size="small"
                          variant="outlined"
                          endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: "13px !important" }} />}
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`${routeBase}/${item.key}`);
                          }}
                          sx={{
                            borderRadius: 2,
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            px: 1.5,
                            py: "4px",
                            textTransform: "none",
                            color: item.color,
                            borderColor: alpha(item.color, 0.3),
                            "&:hover": {
                              background: alpha(item.color, 0.07),
                              borderColor: item.color,
                            },
                          }}
                        >
                          {STRINGS.APPROVER.COMMON.VIEW}
                        </AppButton>
                      </Stack>
                    </Box>
                  </Card>
                );
              })}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default ApproverDashboardShell;
