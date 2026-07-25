import React, { useEffect, useMemo } from "react";
import { alpha } from "@mui/material/styles";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Stack,
  MenuItem,
  CircularProgress,
  Zoom,
  Chip,
} from "@mui/material";

import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import {
  IDENTIFICATION_SHEET_STATUS,
  buildArticlesFromSelection,
  getArticleSelectionCodes,
} from "@data/models/admin/BatchManagement/BatchManagementModel";
import AppTextField from "@ui/components/common/AppTextField";
import AppDropdown from "@ui/components/common/AppDropdown";
import AdminManagementFormHeader from "@ui/components/custom/admin/AdminManagementFormHeader";
import MultiSelect from "@/ui/components/common/MultiSelectCheckbox";

const S = STRINGS.BATCH_MANAGEMENT.FORM;
const MAX_MOTORS_PER_BATCH = 10;

const BATCH_TYPE_OPTIONS = [
  { value: "MAIN", label: "Main Batch" },
  { value: "SUBSCALE", label: "Subscale Batch" },
];

const SUB_BATCH_TYPE_OPTIONS = ["QUALIFICATION", "EXPERIMENTAL"];

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
  mixingCycleOptions = [],
  mixingCyclesLoading = false,
  onFetchMixingCycles,
  onClearMixingCycles,
  articleOptions = [],
  articlesLoading = false,
  saving,
  canSaveBatchChanges = true,
  t,
}: any) => {
  const { modal, input } = t;

  const isMain = form.batchType === "MAIN";
  const isSubscale = form.batchType === "SUBSCALE";
  const isQualification = form.subBatchType === "QUALIFICATION";
  const isExperimental = form.subBatchType === "EXPERIMENTAL";
  const hasSubBatchTypeSelected = Boolean(String(form.subBatchType ?? "").trim());
  // For subscale, hide project / motors / implementation until subtype is chosen.
  const canShowBatchDetails = isMain || (isSubscale && hasSubBatchTypeSelected);
  const showsMotorStage = !isSubscale || isQualification;
  const hasMotorStageSelected = Boolean(String(form.motorStage ?? "").trim());
  const showsMixingCycleField = showsMotorStage && Boolean(form.batchType);
  const mixingCycleLocked =
    hasMotorStageSelected && !mixingCyclesLoading && mixingCycleOptions.length === 1;
  const mixingCycleDisabled =
    !hasMotorStageSelected ||
    mixingCyclesLoading ||
    mixingCycleLocked ||
    (hasMotorStageSelected && !mixingCyclesLoading && mixingCycleOptions.length === 0);
  const motorDetailsValid = isExperimental
    ? true
    : (form.motorIds?.length ?? 0) > 0 &&
      form.motorIds.every((id: string) => id?.trim());
  const mixingCycleValid =
    !showsMotorStage ||
    (hasMotorStageSelected && Boolean(String(form.mixingCycleCode ?? "").trim()));
  const basicFormValid =
    !!form.batchType &&
    (isSubscale ? hasSubBatchTypeSelected : true) &&
    motorDetailsValid &&
    mixingCycleValid &&
    !!form.systemManagerId &&
    (isMain || isSubscale ? !!form.projectId : true) &&
    (showsMotorStage ? !!form.motorStage : true) &&
    (isExperimental ? !!form.objective?.trim() && form.articles.length > 0 : true);

  const isIdentificationComplete =
    String(form.identificationSheetStatus ?? "").toUpperCase() ===
    IDENTIFICATION_SHEET_STATUS.COMPLETED;

  const formValid = basicFormValid;

  const selectedProject = projectOptions.find(
    (project: { projectId: string }) => project.projectId === form.projectId,
  );

  const renderProjectValue = (projectId: string) => {
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
    onMotorIdsChange([]);
    onFormChange("numberOfMotors")({ target: { value: "" } });
  };

  const handleProjectChange = (projectId: string) => {
    onFormChange("projectId")({ target: { value: projectId } });
    onFormChange("motorStage")({ target: { value: "" } });
    onFormChange("mixingCycleCode")({ target: { value: "" } });
    resetMotorIdSlots();
    onClearApprovedMotors?.();
    onClearMixingCycles?.();
  };

  const handleMotorStageChange = (motorStage: string) => {
    onFormChange("motorStage")({ target: { value: motorStage } });
    onFormChange("mixingCycleCode")({ target: { value: "" } });
    resetMotorIdSlots();
    onClearApprovedMotors?.();
    onClearMixingCycles?.();
  };

  const handleMixingCycleChange = (mixingCycleCode: string) => {
    onFormChange("mixingCycleCode")({ target: { value: mixingCycleCode } });
  };

  const handleBatchTypeChange = (batchType: string) => {
    if (batchType === form.batchType) return;
    onFormChange("batchType")({ target: { value: batchType } });
    onClearApprovedMotors?.();
    onClearMixingCycles?.();
  };

  const motorsLookupReady =
    Boolean(String(form.projectId ?? "").trim()) &&
    Boolean(String(form.motorStage ?? "").trim());

  const motorIdsPrerequisitesMet = motorsLookupReady;

  useEffect(() => {
    if (!open) return;
    if (!motorsLookupReady) {
      onClearApprovedMotors?.();
      return;
    }
    void onFetchApprovedMotors?.(form.projectId, form.motorStage);
  }, [
    open,
    motorsLookupReady,
    form.projectId,
    form.motorStage,
    onFetchApprovedMotors,
    onClearApprovedMotors,
  ]);

  useEffect(() => {
    if (!open) {
      onClearMixingCycles?.();
      return;
    }
    const stage = String(form.motorStage ?? "").trim();
    if (!stage || !showsMotorStage) {
      onClearMixingCycles?.();
      return;
    }
    void onFetchMixingCycles?.(stage);
  }, [open, form.motorStage, showsMotorStage, onFetchMixingCycles, onClearMixingCycles]);

  useEffect(() => {
    if (!open || !showsMotorStage || !hasMotorStageSelected || mixingCyclesLoading) return;

    if (!mixingCycleOptions.length) {
      if (form.mixingCycleCode) {
        onFormChange("mixingCycleCode")({ target: { value: "" } });
      }
      return;
    }

    const current = String(form.mixingCycleCode ?? "").trim();
    const codes = mixingCycleOptions.map((cycle: { mixingCycleCode: string }) =>
      String(cycle.mixingCycleCode ?? "").trim(),
    );
    const firstCode = codes[0] ?? "";

    if (mixingCycleOptions.length === 1) {
      if (current !== firstCode) {
        onFormChange("mixingCycleCode")({ target: { value: firstCode } });
      }
      return;
    }

    if (!current || !codes.includes(current)) {
      onFormChange("mixingCycleCode")({ target: { value: firstCode } });
    }
  }, [
    open,
    showsMotorStage,
    hasMotorStageSelected,
    mixingCyclesLoading,
    mixingCycleOptions,
    form.mixingCycleCode,
    onFormChange,
  ]);

  const getMixingCyclePlaceholder = () => {
    if (!hasMotorStageSelected) return S.SELECT_MOTOR_STAGE_FOR_MIXING_CYCLE;
    if (mixingCyclesLoading) return S.LOADING_MIXING_CYCLES;
    if (mixingCycleOptions.length) return S.SELECT_MIXING_CYCLE;
    return S.NO_MIXING_CYCLES;
  };

  const renderMixingCycleValue = (code: string) => {
    const selected =
      mixingCycleOptions.find(
        (cycle: { mixingCycleCode: string }) => cycle.mixingCycleCode === code,
      ) ?? null;
    if (!selected) return code;
    return selected.mixingCycleName && selected.mixingCycleName !== code
      ? `${selected.mixingCycleName} (${code})`
      : selected.mixingCycleName || code;
  };

  const renderMotorStageValue = (motorStage: string) => `Stage ${motorStage}`;

  const renderSystemManagerValue = (systemManagerId: string) => {
    const manager = (userOptions || []).find((user: { id: string }) => user.id === systemManagerId);
    if (!manager) return systemManagerId;
    const name = manager.fullName || manager.username || systemManagerId;
    return manager.id ? `${name} (${manager.id})` : name;
  };

  const handleMotorIdChange = (index: number, value: string) => {
    const newMotorIds = [...form.motorIds];
    newMotorIds[index] = value;
    onMotorIdsChange(newMotorIds);
  };

  const getMotorOptionsForSlot = (index: number) => {
    const selectedElsewhere = new Set(
      form.motorIds
        .map((id: string, idx: number) => (idx !== index ? String(id ?? "").trim() : ""))
        .filter(Boolean),
    );

    let list = availableMotorOptions.filter(
      (motor: { motorId: string }) =>
        Boolean(motor.motorId) && !selectedElsewhere.has(motor.motorId),
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
    if (!motorsLookupReady) {
      return "Select project and motor stage first";
    }
    if (availableMotorsLoading) return "Loading approved motors...";
    if (availableMotorOptions.length === 0) return "No approved motors for this project and stage";
    return "Select motor";
  }, [motorsLookupReady, availableMotorsLoading, availableMotorOptions.length]);

  /** Append new motor ID slots; existing rows stay until Delete is used. */
  const addMotorIdField = () => {
    const typedCount = Math.floor(Number(form.numberOfMotors));
    if (!Number.isFinite(typedCount) || typedCount <= 0) return;

    const existing = Array.isArray(form.motorIds) ? form.motorIds : [];
    const roomLeft = MAX_MOTORS_PER_BATCH - existing.length;
    if (roomLeft <= 0) return;

    const toAdd = Math.min(typedCount, roomLeft);
    onMotorIdsChange([...existing, ...Array.from({ length: toAdd }, () => "")]);
    onFormChange("numberOfMotors")({ target: { value: "" } });
  };

  /** Typing the count does not create motor rows — only updates the number field. */
  const handleNumberOfMotorsInput = (raw: string) => {
    if (raw === "") {
      onFormChange("numberOfMotors")({ target: { value: "" } });
      return;
    }
    const next = Math.floor(Number(raw));
    if (!Number.isFinite(next) || next < 0) return;
    onFormChange("numberOfMotors")({
      target: { value: Math.min(next, MAX_MOTORS_PER_BATCH) },
    });
  };

  const removeMotorIdField = (index: number) => {
    const nextMotorIds = (form.motorIds ?? []).filter((_: string, idx: number) => idx !== index);
    onMotorIdsChange(nextMotorIds);
  };

  const handleArticleChange = (selectedCodes: string[]) =>
    onFormChange("articles")({
      target: { value: buildArticlesFromSelection(selectedCodes, articleOptions) },
    });

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
        <AdminManagementFormHeader
          icon={<icons.batchMgmt.batchIcon sx={modal.header.icon} />}
          title={editTarget ? S.EDIT_BATCH_DETAILS : S.CREATE_NEW_BATCH}
          subtitle={
            editTarget
              ? S.EDIT_SUBTITLE(editTarget.batchId || editTarget.id)
              : S.CREATE_SUBTITLE_BASIC
          }
          onClose={() => !saving && onClose()}
          closeDisabled={saving}
          closeIcon={<icons.batchMgmt.close fontSize="small" />}
          theme={t}
        />
      </DialogTitle>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <DialogContent sx={modal.content}>
        <Box sx={modal.headerGap} />
        <Stack spacing={modal.stackSpacing}>
          {/* Batch Type & Sub-Type */}
          <Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={modal.fieldRowSpacing}>
              <AppDropdown
                label="Batch Type"
                value={form.batchType}
                onChange={handleBatchTypeChange}
                placeholder={S.SELECT_BATCH_TYPE}
                disabled={!!editTarget}
                options={BATCH_TYPE_OPTIONS}
                sx={{ mb: 0, ...input }}
                MenuProps={t.menuPaper}
              />

              {form.batchType === "SUBSCALE" && (
                <AppDropdown
                  label="Sub-Batch Type"
                  value={form.subBatchType}
                  onChange={(value) => onFormChange("subBatchType")({ target: { value } })}
                  placeholder={S.SELECT_SUB_BATCH_TYPE}
                  disabled={!!editTarget}
                  options={SUB_BATCH_TYPE_OPTIONS.map((option) => ({
                    value: option,
                    label: option,
                  }))}
                  sx={{ mb: 0, ...input }}
                  MenuProps={t.menuPaper}
                />
              )}
            </Stack>
          </Box>

          {canShowBatchDetails && (
            <>
              {/* Project / Purpose / Motor Information */}
              <Box>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={modal.fieldRowSpacing}>
                  <AppDropdown
                    label="Project Name"
                    value={form.projectId}
                    onChange={handleProjectChange}
                    placeholder={projectsLoading ? "Loading projects..." : S.SELECT_PROJECT}
                    loading={projectsLoading}
                    disabled={projectsLoading}
                    renderValue={renderProjectValue}
                    sx={{ mb: 0, flex: 1, ...input }}
                    MenuProps={t.menuPaper}
                  >
                    {projectOptions.map((project: { projectId: string; projectName: string }) => (
                      <MenuItem key={project.projectId} value={project.projectId}>
                        <Box sx={modal.projectOption}>
                          <Typography sx={modal.projectOptionName}>{project.projectName}</Typography>
                          <Typography sx={modal.projectOptionId}>{project.projectId}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </AppDropdown>

                  {(!isSubscale || isQualification) && (
                    <AppDropdown
                      label="Motor Type / Stage"
                      value={form.motorStage}
                      onChange={handleMotorStageChange}
                      placeholder={motorStagesLoading ? "Loading motor stages..." : S.SELECT_MOTOR_STAGE}
                      loading={motorStagesLoading}
                      disabled={motorStagesLoading}
                      renderValue={renderMotorStageValue}
                      sx={{ mb: 0, flex: 1, ...input }}
                      MenuProps={t.menuPaper}
                    >
                      {motorStageOptions.map(
                        (stage: {
                          motorStage: string;
                          noOfmotors: number;
                          motorTypeId: number;
                        }) => (
                          <MenuItem key={stage.motorStage} value={stage.motorStage}>
                            <Box sx={modal.motorStageOption}>
                              <Typography sx={modal.motorStageLabel}>
                                Stage {stage.motorStage}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ),
                      )}
                    </AppDropdown>
                  )}

                  {isExperimental && (
                    <AppDropdown
                      label="System Manager"
                      value={form.systemManagerId}
                      onChange={(value) => onFormChange("systemManagerId")({ target: { value } })}
                      placeholder={S.SELECT_SYSTEM_MANAGER}
                      renderValue={renderSystemManagerValue}
                      sx={{ mb: 0, flex: 1, ...input }}
                      MenuProps={t.menuPaper}
                    >
                      {(userOptions || []).map((u: any) => (
                        <MenuItem key={u.id} value={u.id}>
                          {u.fullName || u.username}
                          {u.id ? ` (${u.id})` : ""}
                        </MenuItem>
                      ))}
                    </AppDropdown>
                  )}
                </Stack>

                {!isExperimental && (
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={modal.fieldRowSpacing}
                    sx={{ mt: modal.fieldRowSpacing }}
                  >
                    {showsMixingCycleField && (
                      <AppDropdown
                        label={S.MIXING_CYCLE_LABEL}
                        value={form.mixingCycleCode ?? ""}
                        onChange={handleMixingCycleChange}
                        placeholder={getMixingCyclePlaceholder()}
                        loading={mixingCyclesLoading}
                        disabled={mixingCycleDisabled}
                        renderValue={renderMixingCycleValue}
                        sx={{ mb: 0, flex: 1, ...input }}
                        MenuProps={t.menuPaper}
                      >
                        {mixingCycleOptions.map(
                          (cycle: {
                            mixingCycleId: number;
                            mixingCycleCode: string;
                            mixingCycleName: string;
                          }) => (
                            <MenuItem
                              key={`cycle-${cycle.mixingCycleId}-${cycle.mixingCycleCode}`}
                              value={cycle.mixingCycleCode}
                            >
                              <Box sx={modal.motorStageOption}>
                                <Typography sx={modal.motorStageLabel}>
                                  {cycle.mixingCycleName || cycle.mixingCycleCode}
                                </Typography>
                                {cycle.mixingCycleName &&
                                cycle.mixingCycleName !== cycle.mixingCycleCode ? (
                                  <Typography sx={modal.motorStageMeta}>
                                    {cycle.mixingCycleCode}
                                  </Typography>
                                ) : null}
                              </Box>
                            </MenuItem>
                          ),
                        )}
                      </AppDropdown>
                    )}

                    <AppDropdown
                      label="System Manager"
                      value={form.systemManagerId}
                      onChange={(value) => onFormChange("systemManagerId")({ target: { value } })}
                      placeholder={S.SELECT_SYSTEM_MANAGER}
                      renderValue={renderSystemManagerValue}
                      sx={{ mb: 0, flex: 1, ...input }}
                      MenuProps={t.menuPaper}
                    >
                      {(userOptions || []).map((u: any) => (
                        <MenuItem key={u.id} value={u.id}>
                          {u.fullName || u.username}
                          {u.id ? ` (${u.id})` : ""}
                        </MenuItem>
                      ))}
                    </AppDropdown>
                  </Stack>
                )}
              </Box>

              {isExperimental && (
                <Box>
                  <Typography sx={modal.fieldLabel}>Experiment Details</Typography>
                  <AppTextField
                    fullWidth
                    label="Objective of Experiment"
                    value={form.objective}
                    onChange={onFormChange("objective")}
                    placeholder="Enter objective"
                    sx={{ mb: 0, ...input }}
                  />
                </Box>
              )}

              {isExperimental && (
                <Box>
                  <Typography sx={modal.fieldLabel}>Subscale Articles</Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={modal.fieldRowSpacing}>
                    <MultiSelect
                      label="Articles"
                      placeholder={
                        articlesLoading
                          ? "Loading articles..."
                          : articleOptions.length === 0
                            ? "No articles available"
                            : "Select articles"
                      }
                      options={articleOptions}
                      value={getArticleSelectionCodes(form.articles)}
                      onChange={handleArticleChange}
                      disabled={articlesLoading || articleOptions.length === 0}
                      sx={{ mb: 0, flex: 1, ...input }}
                      MenuProps={t.menuPaper}
                    />
                    {/* Spacer keeps Articles the same width as Project Name */}
                    <Box sx={{ flex: 1, display: { xs: "none", sm: "block" } }} />
                  </Stack>
                </Box>
              )}

              {(isMain || isQualification) && (
                <>
                  <Box>
                    <Typography sx={modal.fieldLabel}>{S.NUMBER_OF_MOTORS_LABEL}</Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 1 }}>
                      {S.NUMBER_OF_MOTORS_COUNT(form.motorIds?.length ?? 0)}
                    </Typography>
                    <Stack direction="row" spacing={1.25} alignItems="flex-end">
                      <AppTextField
                        label={S.NUMBER_OF_MOTORS_PLACEHOLDER}
                        type="number"
                        value={form.numberOfMotors > 0 ? form.numberOfMotors : ""}
                        onChange={(e) => handleNumberOfMotorsInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (["e", "E", "+", "-", "."].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        inputProps={{ min: 0, max: MAX_MOTORS_PER_BATCH, step: 1 }}
                        sx={{
                          mb: 0,
                          width: 160,
                          minWidth: 160,
                          maxWidth: 160,
                          ...input,
                        }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={addMotorIdField}
                        disabled={
                          !motorsLookupReady ||
                          !(Number(form.numberOfMotors) > 0) ||
                          (form.motorIds?.length ?? 0) >= MAX_MOTORS_PER_BATCH
                        }
                        sx={{
                          height: 40,
                          minHeight: 40,
                          mb: 0,
                          px: 2,
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {S.ADD_MOTOR_ID}
                      </Button>
                    </Stack>
                  </Box>

                  <Box>
                    <Stack spacing={1}>
                      {(form.motorIds ?? []).map((motorId: string, index: number) => {
                        const slotOptions = getMotorOptionsForSlot(index);
                        return (
                          <Box
                            key={`motor-slot-${index}`}
                            sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}
                          >
                            <AppDropdown
                              label={`${S.MOTOR_ID_LABEL} ${index + 1}`}
                              value={motorId}
                              onChange={(value) => handleMotorIdChange(index, value)}
                              placeholder={motorsEmptyHint}
                              loading={availableMotorsLoading}
                              disabled={!motorIdsPrerequisitesMet || availableMotorsLoading}
                              renderValue={(value) => {
                                const match = availableMotorOptions.find(
                                  (m: { motorId: string }) => m.motorId === value,
                                );
                                return match ? renderMotorOptionLabel(match) : value;
                              }}
                              sx={{ mb: 0, flex: 1, ...input }}
                              MenuProps={t.menuPaper}
                            >
                              {slotOptions.map(
                                (motor: { motorId: string; motorCasingId: string }) => (
                                  <MenuItem
                                    key={motor.motorCasingId || motor.motorId}
                                    value={motor.motorId}
                                  >
                                    {renderMotorOptionLabel(motor)}
                                  </MenuItem>
                                ),
                              )}
                            </AppDropdown>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => removeMotorIdField(index)}
                              sx={{ mt: 3.25, flexShrink: 0, textTransform: "none", fontWeight: 700 }}
                            >
                              {S.REMOVE_MOTOR_ID}
                            </Button>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                </>
              )}

              {(isMain || isQualification || isExperimental) && (
                  <Box
                    sx={(theme) => ({
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      px: 1.5,
                      py: 1.2,
                      bgcolor: isIdentificationComplete
                        ? alpha(theme.palette.success.main, 0.08)
                        : alpha(theme.palette.warning.main, 0.08),
                      border: "1px dashed",
                      borderColor: isIdentificationComplete ? "success.light" : "warning.light",
                      borderRadius: "8px",
                    })}
                  >
                    {isIdentificationComplete ? (
                      <icons.batchMgmt.completedStatus
                        sx={{ fontSize: 16, color: "success.main", flexShrink: 0, mt: 0.15 }}
                      />
                    ) : (
                      <icons.userMgmt.info
                        sx={{ fontSize: 14, color: "warning.main", flexShrink: 0 }}
                      />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{ fontSize: "0.8rem", color: "text.primary", fontWeight: 600, mb: 0.5 }}
                      >
                        {S.IMPLEMENTATION_DETAILS_TITLE}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mb: 0.75, flexWrap: "wrap", gap: 0.75 }}
                      >
                        <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                          {S.IDENTIFICATION_STATUS_LABEL}:
                        </Typography>
                        <Chip
                          label={
                            isIdentificationComplete
                              ? S.IDENTIFICATION_STATUS_COMPLETE
                              : S.IDENTIFICATION_STATUS_PENDING
                          }
                          size="small"
                          color={isIdentificationComplete ? "success" : "warning"}
                          variant="outlined"
                          sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700 }}
                        />
                      </Stack>
                      <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mb: 1 }}>
                        {isIdentificationComplete
                          ? S.IMPLEMENTATION_DETAILS_COMPLETE
                          : S.IMPLEMENTATION_DETAILS_PENDING}
                      </Typography>
                      {isIdentificationComplete ? (
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onOpenImplementation?.({ viewOnly: true })}
                          >
                            {S.VIEW_IDENTIFICATION_SHEET}
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => onOpenImplementation?.({ viewOnly: false })}
                          >
                            {S.EDIT_IDENTIFICATION_SHEET}
                          </Button>
                        </Stack>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => onOpenImplementation?.({ viewOnly: false })}
                          disabled={!basicFormValid}
                        >
                          {S.COMPLETE_IDENTIFICATION_NOW}
                        </Button>
                      )}
                    </Box>
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
          disabled={!formValid || saving || (editTarget && !canSaveBatchChanges)}
          sx={modal.saveButton}
        >
          {saving ? (
            <>
              <CircularProgress size={14} sx={modal.savingSpinner} />
              {S.SAVING}
            </>
          ) : editTarget ? (
            S.SAVE_CHANGES
          ) : (
            S.CREATE_BATCH
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchFormModal;
