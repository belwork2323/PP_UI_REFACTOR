import { STRINGS } from "../../../app/config/strings";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

export const QC_CASTING_SECTION_IDS = {
  SELECTION: "CASTING_SELECTION",
  FINAL_ASSEMBLY: "FINAL_ASSEMBLY",
  PROPELLANT_CASTING: "PROPELLANT_CASTING",
  WEIGHTMENT: "WEIGHTMENT_DETAILS",
  POST_CAST: "POST_CAST_OPERATION",
} as const;

export const QC_CASTING_TYPE_OPTIONS = [
  { value: "SINGLE", label: "Single" },
  { value: "PAIR", label: "Pair" },
  { value: "TRIPLE", label: "Triple" },
] as const;

export const QC_CASTING_BOWL_OPTIONS = Array.from({ length: 20 }, (_, index) => {
  const label = `Bowl No.${index + 1}`;
  return { value: label, label };
});

export const QC_CASTING_YES_NO_OPTIONS = [
  { value: "YES", label: "Yes" },
  { value: "NO", label: "No" },
] as const;

export const QC_CASTING_SECTION_TITLES: Record<string, string> = {
  [QC_CASTING_SECTION_IDS.SELECTION]: "Casting Selection",
  [QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY]: "Final Assembly",
  [QC_CASTING_SECTION_IDS.PROPELLANT_CASTING]: "Propellant Casting",
  [QC_CASTING_SECTION_IDS.WEIGHTMENT]: "Weighment Details",
  [QC_CASTING_SECTION_IDS.POST_CAST]: "Post Cast Operations",
};

export const getQcCastingMotorLabel = (motorId?: string | null) =>
  motorId?.trim() || S.CASTING_MOTOR_ID_LABEL;
