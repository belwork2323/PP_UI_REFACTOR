import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { STRINGS } from "../../../../../../app/config/strings";

const S = STRINGS.SOURCING.CASING_CREATE;

type CasingFormStepNavProps = {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  canGoBack: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  stepError: string | null;
  nextDisabledHint?: string | null;
  canNavigateToStep: (stepIndex: number) => boolean;
  onStepClick: (stepIndex: number) => void;
  onBack: () => void;
  onNext: () => void;
  theme: any;
  cf: any;
};

const CasingFormStepNav = ({
  currentStep,
  totalSteps,
  stepLabels,
  canGoBack,
  canGoNext,
  isLastStep,
  stepError,
  nextDisabledHint = null,
  canNavigateToStep,
  onStepClick,
  onBack,
  onNext,
  theme,
  cf,
}: CasingFormStepNavProps) => (
  <Box sx={cf.stepNav.root}>
    <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" gap={1.5}>
      <Box>
        <Typography sx={cf.stepNav.stepCounter}>
          {S.STEP_OF.replace("{current}", String(currentStep + 1)).replace("{total}", String(totalSteps))}
        </Typography>
        <Stack direction="row" gap={0.75} flexWrap="wrap" mt={0.75}>
          {stepLabels.map((label, idx) => {
            const navigable = canNavigateToStep(idx);
            return (
              <Chip
                key={label}
                label={label}
                size="small"
                clickable={navigable}
                onClick={navigable ? () => onStepClick(idx) : undefined}
                sx={cf.stepNav.stepChip(idx === currentStep, idx < currentStep, theme, navigable)}
              />
            );
          })}
        </Stack>
      </Box>

      <Stack alignItems={{ xs: "stretch", sm: "flex-end" }} gap={0.75} flexShrink={0}>
        <Stack direction="row" gap={1} justifyContent={{ xs: "stretch", sm: "flex-end" }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={onBack}
            disabled={!canGoBack}
            sx={cf.stepNav.backButton(theme)}
          >
            {S.BACK}
          </Button>
          {!isLastStep && (
            <Button
              variant="contained"
              endIcon={<ArrowForwardRoundedIcon />}
              onClick={onNext}
              disabled={!canGoNext}
              sx={cf.stepNav.nextButton(theme, Boolean(stepError))}
            >
              {S.NEXT}
            </Button>
          )}
        </Stack>

        {stepError ? (
          <Box sx={cf.stepNav.errorBanner(theme)} role="alert">
            <ErrorOutlineRoundedIcon sx={cf.stepNav.errorIcon(theme)} />
            <Typography sx={cf.stepNav.stepError(theme)}>{stepError}</Typography>
          </Box>
        ) : nextDisabledHint ? (
          <Typography sx={cf.stepNav.hint(theme)}>{nextDisabledHint}</Typography>
        ) : isLastStep ? (
          <Typography sx={cf.stepNav.hint(theme)}>{S.COMPLETE_ALL_STEPS}</Typography>
        ) : null}
      </Stack>
    </Stack>
  </Box>
);

export default CasingFormStepNav;
