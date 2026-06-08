import React, { useEffect, useMemo } from "react";
import { alpha } from "@mui/material/styles";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, IconButton, Stack,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Zoom,
} from "@mui/material";

import { icons }      from "../../../../../../app/theme";
import { STRINGS }    from "../../../../../../app/config/strings";
import Input          from "../../../../../components/common/Input";
import { priorityConfig } from "./BatchConfigs";

const S = STRINGS.BATCH_MANAGEMENT.FORM;

const BATCH_TYPE_OPTIONS = [
  { value: "MAIN", label: "Main Batch" },
  { value: "SUBSCALE", label: "Subscale Batch" },
];

const SUB_BATCH_TYPE_OPTIONS = ["QUALIFICATION", "EXPERIMENTAL"];
const ARTICLE_OPTIONS = [
  "Ballistic Evaluation Motor",
  "Wheel peels",
  "Cartons",
  "Control grains",
];

const MOTOR_COUNT_OPTIONS = [1, 2, 3];

const BatchFormModal = ({
  open,
  onClose,
  onSave,
  onOpenImplementation,
  editTarget,
  form,
  onFormChange,
  onMotorIdsChange,
  userOptions,
  projectOptions = [],
  projectsLoading = false,
  motorStageOptions = [],
  motorStagesLoading = false,
  availableMotorOptions = [],
  availableMotorsLoading = false,
  onFetchApprovedMotors,
  onClearApprovedMotors,
  saving,
  t,
}: any) => {
  const { modal, input } = t;

  const isMain = form.batchType === "MAIN";
  const isSubscale = form.batchType === "SUBSCALE";
  const isQualification = form.subBatchType === "QUALIFICATION";
  const isExperimental = form.subBatchType === "EXPERIMENTAL";

  const basicFormValid =
    form.batchType &&
    form.numberOfMotors > 0 &&
    form.motorIds.length === form.numberOfMotors &&
    form.motorIds.every((id: string) => id && id.trim()) &&
    form.priority &&
    form.systemManagerId &&
    ((isMain || isQualification) ? !!form.projectId : true) &&
    ((!isSubscale || isQualification) ? !!form.motorStage : true) &&
    (!(isExperimental) || !!form.objective?.trim());

  const formValid = basicFormValid;

  const selectedProject = projectOptions.find(
    (project: { projectId: string }) => project.projectId === form.projectId
  );

  const renderProjectValue = (projectId: string) => {
    if (!projectId) {
      return <em>{projectsLoading ? "Loading projects..." : "Select project"}</em>;
    }
    const project =
      projectOptions.find((item: { projectId: string }) => item.projectId === projectId) ??
      (selectedProject?.projectId === projectId ? selectedProject : null);
    if (!project) return projectId;
    return (
      <Box sx={modal.projectOptionSelected}>
        <Typography component="span" sx={modal.projectOptionName} noWrap>
          {project.projectName}
        </Typography>
        <Typography component="span" sx={modal.projectOptionId} noWrap>
          {project.projectId}
        </Typography>
      </Box>
    );
  };

  const resetMotorIdSlots = () => {
    const count = Math.max(1, form.numberOfMotors || 1);
    onMotorIdsChange(Array.from({ length: count }, () => ""));
  };

  const handleProjectChange = (projectId: string) => {
    onFormChange("projectId")({ target: { value: projectId } });
    onFormChange("motorStage")({ target: { value: "" } });
    resetMotorIdSlots();
    onClearApprovedMotors?.();
  };

  const handleMotorStageChange = (motorStage: string) => {
    onFormChange("motorStage")({ target: { value: motorStage } });
    resetMotorIdSlots();
    onClearApprovedMotors?.();
  };

  const motorIdsPrerequisitesMet =
    Boolean(String(form.projectId ?? "").trim()) &&
    Boolean(String(form.motorStage ?? "").trim()) &&
    (form.numberOfMotors ?? 0) > 0;

  useEffect(() => {
    if (!open) return;
    if (!motorIdsPrerequisitesMet) {
      onClearApprovedMotors?.();
      return;
    }
    void onFetchApprovedMotors?.(form.projectId, form.motorStage);
  }, [
    open,
    motorIdsPrerequisitesMet,
    form.projectId,
    form.motorStage,
    form.numberOfMotors,
    onFetchApprovedMotors,
    onClearApprovedMotors,
  ]);

  const handleMotorIdChange = (index: number, value: string) => {
    const newMotorIds = [...form.motorIds];
    newMotorIds[index] = value;
    onMotorIdsChange(newMotorIds);
  };

  const getMotorOptionsForSlot = (index: number) => {
    const selectedElsewhere = new Set(
      form.motorIds
        .map((id: string, idx: number) => (idx !== index ? String(id ?? "").trim() : ""))
        .filter(Boolean)
    );

    let list = availableMotorOptions.filter(
      (motor: { motorId: string }) =>
        Boolean(motor.motorId) && !selectedElsewhere.has(motor.motorId)
    );

    const current = String(form.motorIds[index] ?? "").trim();
    if (current && !list.some((m: { motorId: string }) => m.motorId === current)) {
      list = [
        {
          motorId: current,
          motorCasingId: "",
          motorStage: "",
          motorNo: current,
          projectId: "",
          status: "",
        },
        ...list,
      ];
    }

    return list;
  };

  const renderMotorOptionLabel = (motor: {
    motorId: string;
    motorCasingId?: string;
    motorStage?: string;
  }) => {
    const parts = [
      motor.motorId,
      motor.motorCasingId ? `Casing ${motor.motorCasingId}` : "",
      motor.motorStage ? `Stage ${motor.motorStage}` : "",
    ].filter(Boolean);
    return parts.join(" · ");
  };

  const motorsEmptyHint = useMemo(() => {
    if (!motorIdsPrerequisitesMet) {
      return "Select project, motor stage, and number of motors first";
    }
    if (availableMotorsLoading) return "Loading approved motors...";
    if (availableMotorOptions.length === 0) return "No approved motors for this project and stage";
    return "Select motor";
  }, [motorIdsPrerequisitesMet, availableMotorsLoading, availableMotorOptions.length]);

  const handleNumberOfMotorsChange = (value: number) => {
    const nextValue = Math.min(3, Math.max(1, value));
    const nextMotorIds = Array.from({ length: nextValue }, (_, idx) => form.motorIds[idx] || "");
    onFormChange("numberOfMotors")({ target: { value: nextValue } });
    onMotorIdsChange(nextMotorIds);
  };

  const removeMotorIdField = (index: number) => {
    const nextMotorIds = form.motorIds.filter((_: string, idx: number) => idx !== index);
    const nextCount = Math.max(1, nextMotorIds.length);
    onFormChange("numberOfMotors")({ target: { value: nextCount } });
    onMotorIdsChange(nextMotorIds);
  };

  const handleArticleChange = (items: string[]) =>
    onFormChange("articles")({ target: { value: items } });

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      TransitionComponent={Zoom}
      maxWidth={false}
      fullWidth
      PaperProps={{ sx: modal.paper }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={modal.header.wrapper}>
          <Box sx={modal.header.titleRow}>
            <Box sx={modal.header.iconBadge}>
              <icons.batchMgmt.batchIcon sx={modal.header.icon} />
            </Box>
            <Box>
              <Typography sx={modal.header.title}>
                {editTarget ? "Edit Batch Details" : "Create New Batch"}
              </Typography>
              <Typography sx={modal.header.subtitle}>
                {editTarget
                  ? `Batch: ${editTarget.batchId || editTarget.id}`
                  : "Fill in the basic batch information"}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => !saving && onClose()} sx={modal.header.closeButton}>
            <icons.batchMgmt.close fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <DialogContent sx={modal.content}>
        <Box sx={modal.headerGap} />
        <Stack spacing={modal.stackSpacing}>

          {/* Batch Type & Sub-Type */}
          <Box>
            <Typography sx={modal.fieldLabel}>Batch Type</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={modal.fieldRowSpacing}>
              <FormControl fullWidth size="small" sx={input}>
                <InputLabel>Batch Type</InputLabel>
                <Select value={form.batchType} label="Batch Type"
                  onChange={onFormChange("batchType")} MenuProps={t.menuPaper} disabled={!!editTarget}>
                  <MenuItem value=""><em>Select batch type</em></MenuItem>
                  {BATCH_TYPE_OPTIONS.map((bt: any) => (
                    <MenuItem key={bt.value} value={bt.value}>{bt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {form.batchType === "SUBSCALE" && (
                <FormControl fullWidth size="small" sx={input}>
                  <InputLabel>Sub-Batch Type</InputLabel>
                  <Select value={form.subBatchType} label="Sub-Batch Type"
                    onChange={onFormChange("subBatchType")} MenuProps={t.menuPaper} disabled={!!editTarget}>
                    {SUB_BATCH_TYPE_OPTIONS.map((sbt: string) => (
                      <MenuItem key={sbt} value={sbt}>{sbt}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>
          </Box>

          {form.batchType && (
            <>
              {/* Project / Purpose / Motor Information */}
              <Box>
                <Typography sx={modal.fieldLabel}>Batch Details</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={modal.fieldRowSpacing}>
              {(isMain || isQualification) ? (
                <FormControl fullWidth size="small" sx={input}>
                  <InputLabel>Project Name</InputLabel>
                  <Select
                    value={form.projectId}
                    label="Project Name"
                    onChange={(e) => handleProjectChange(e.target.value)}
                    MenuProps={t.menuPaper}
                    disabled={projectsLoading}
                    renderValue={renderProjectValue}
                  >
                    <MenuItem value="">
                      <em>{projectsLoading ? "Loading projects..." : "Select project"}</em>
                    </MenuItem>
                    {projectOptions.map((project: { projectId: string; projectName: string }) => (
                      <MenuItem key={project.projectId} value={project.projectId}>
                        <Box sx={modal.projectOption}>
                          <Typography sx={modal.projectOptionName}>{project.projectName}</Typography>
                          <Typography sx={modal.projectOptionId}>{project.projectId}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : isExperimental ? (
                <Input
                  fullWidth label="Project Name (if applicable)" value={form.projectId}
                  onChange={onFormChange("projectId")} placeholder="Optional"
                  size="small" sx={input}
                />
              ) : null}

              {isSubscale && (
                <FormControl fullWidth size="small" sx={input}>
                  <InputLabel>Purpose</InputLabel>
                  <Select value={form.subBatchType} label="Purpose"
                    onChange={onFormChange("subBatchType")} MenuProps={t.menuPaper} disabled={!!editTarget}>
                    {SUB_BATCH_TYPE_OPTIONS.map((sbt: string) => (
                      <MenuItem key={sbt} value={sbt}>{sbt}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {(!isSubscale || isQualification) && (
                <FormControl fullWidth size="small" sx={input}>
                  <InputLabel>Motor Type / Stage</InputLabel>
                  <Select
                    value={form.motorStage}
                    label="Motor Type / Stage"
                    onChange={(event) => handleMotorStageChange(event.target.value)}
                    MenuProps={t.menuPaper}
                    disabled={motorStagesLoading}
                  >
                    <MenuItem value="">
                      <em>{motorStagesLoading ? "Loading motor stages..." : "Select motor stage"}</em>
                    </MenuItem>
                    {motorStageOptions.map(
                      (stage: { motorStage: string; noOfmotors: number; motorTypeId: number }) => (
                        <MenuItem key={stage.motorStage} value={stage.motorStage}>
                          <Box sx={modal.motorStageOption}>
                            <Typography sx={modal.motorStageLabel}>
                              Stage {stage.motorStage}
                            </Typography>
                            <Typography sx={modal.motorStageMeta}>
                              {stage.noOfmotors} motor{stage.noOfmotors === 1 ? "" : "s"}
                            </Typography>
                          </Box>
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              )}
            </Stack>
          </Box>

          {isExperimental && (
            <Box>
              <Typography sx={modal.fieldLabel}>Experiment Details</Typography>
              <Input
                fullWidth label="Objective of Experiment"
                value={form.objective}
                onChange={onFormChange("objective")}
                placeholder="Enter objective"
                size="small" sx={input}
              />
            </Box>
          )}

          {isExperimental && (
            <Box>
              <Typography sx={modal.fieldLabel}>Subscale Articles</Typography>
              <FormControl fullWidth size="small" sx={input}>
                <InputLabel>Articles</InputLabel>
                <Select
                  multiple
                  value={form.articles}
                  label="Articles"
                  onChange={(e: any) => handleArticleChange(e.target.value)}
                  MenuProps={t.menuPaper}
                >
                  {ARTICLE_OPTIONS.map((article: string) => (
                    <MenuItem key={article} value={article}>{article}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {(!isExperimental || isMain || isQualification) && (
            <>
              <Box>
                <Typography sx={modal.fieldLabel}>No. of Motors to Process</Typography>
                <FormControl fullWidth size="small" sx={input}>
                  <InputLabel>Number of Motors</InputLabel>
                  <Select value={form.numberOfMotors} label="Number of Motors"
                    onChange={(e: any) => handleNumberOfMotorsChange(Number(e.target.value))}>
                    {MOTOR_COUNT_OPTIONS.map((count) => (
                      <MenuItem key={count} value={count}>{count}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography sx={modal.fieldLabel}>Motor IDs</Typography>
                  <Button
                    size="small"
                    onClick={() => handleNumberOfMotorsChange(form.numberOfMotors + 1)}
                    disabled={form.numberOfMotors >= 3}
                  >
                    + Add Motor ID
                  </Button>
                </Box>
                <Stack spacing={1}>
                  {form.motorIds.map((motorId: string, index: number) => {
                    const slotOptions = getMotorOptionsForSlot(index);
                    return (
                      <Box key={index} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                        <FormControl fullWidth size="small" sx={input}>
                          <InputLabel>{`Motor ID ${index + 1}`}</InputLabel>
                          <Select
                            value={motorId}
                            label={`Motor ID ${index + 1}`}
                            onChange={(e) => handleMotorIdChange(index, e.target.value)}
                            MenuProps={t.menuPaper}
                            disabled={!motorIdsPrerequisitesMet || availableMotorsLoading}
                            renderValue={(value) => {
                              if (!value) {
                                return <em>{motorsEmptyHint}</em>;
                              }
                              const match = availableMotorOptions.find(
                                (m: { motorId: string }) => m.motorId === value
                              );
                              return match ? renderMotorOptionLabel(match) : value;
                            }}
                          >
                            <MenuItem value="">
                              <em>{motorsEmptyHint}</em>
                            </MenuItem>
                            {slotOptions.map((motor: { motorId: string; motorCasingId: string }) => (
                              <MenuItem
                                key={motor.motorCasingId || motor.motorId}
                                value={motor.motorId}
                              >
                                {renderMotorOptionLabel(motor)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {form.motorIds.length > 1 && (
                          <Button
                            size="small"
                            color="error"
                            onClick={() => removeMotorIdField(index)}
                            sx={{ mt: 0.5, flexShrink: 0 }}
                          >
                            Remove
                          </Button>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              </Box>

              <Box sx={(theme) => ({ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1.2, bgcolor: alpha(theme.palette.warning.main, 0.08), border: "1px dashed", borderColor: "warning.light", borderRadius: "8px" })}>
                <icons.userMgmt.info sx={{ fontSize: 14, color: "warning.main", flexShrink: 0 }} />
                <Box>
                  <Typography sx={{ fontSize: "0.8rem", color: "text.primary", fontWeight: 600, mb: 0.5 }}>
                    Implementation details
                  </Typography>
                  <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mb: 1 }}>
                    Implementation sheet is required to complete this batch, but you may fill it now or later after creating the batch.
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={onOpenImplementation}
                    disabled={!basicFormValid}
                  >
                    Complete implementation sheet now
                  </Button>
                </Box>
              </Box>
            </>
          )}

          {form.batchType && (
            <Box>
              <Typography sx={modal.fieldLabel}>Priority & Assignment</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={modal.fieldRowSpacing}>
                <FormControl fullWidth size="small" sx={input}>
                  <InputLabel>Priority</InputLabel>
                  <Select value={form.priority} label="Priority"
                    onChange={onFormChange("priority")} MenuProps={t.menuPaper}>
                    {S.PRIORITIES.map((p: string) => {
                      const pc = priorityConfig[p];
                      return (
                        <MenuItem key={p} value={p}>
                          <Box sx={modal.menuItemRow}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: pc?.color, flexShrink: 0 }} />
                            {p}
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" sx={input}>
                  <InputLabel>System Manager</InputLabel>
                  <Select value={form.systemManagerId} label="System Manager"
                    onChange={onFormChange("systemManagerId")} MenuProps={t.menuPaper}>
                    <MenuItem value=""><em>Unassigned</em></MenuItem>
                    {(userOptions || []).map((u: any) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.fullName || u.username}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Box>
          )}

          </>
          )}

        </Stack>
      </DialogContent>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <DialogActions sx={modal.actions}>
        <Button onClick={() => !saving && onClose()} sx={modal.cancelButton}>
          {S.CANCEL}
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={!formValid || saving}
          sx={modal.saveButton}
        >
          {saving ? (
            <><CircularProgress size={14} sx={modal.savingSpinner} />{S.SAVING}</>
          ) : editTarget ? "Save Changes" : "Create Batch"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchFormModal;