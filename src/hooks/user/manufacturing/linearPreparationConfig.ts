export const LINEAR_PREP_TEXT = {
  SECTION_TITLE: "Linear Preparation",
  SECTION_SUBTITLE: "Record premix and final mix preparation parameters",
  PART_A_TITLE: "Premix",
  PART_A_SUBTITLE: "Initial ingredient mixing stage",
  PART_B_TITLE: "Final Mix",
  PART_B_SUBTITLE: "Final TDI addition and mixing stage",
  PART_A_TAG: "Part A",
  PART_B_TAG: "Part B",
  ALL_FILLED: "All filled",
  FILLED_SUFFIX: "filled",
  TIME_PLACEHOLDER: "e.g. 30",
  REMARKS_PLACEHOLDER: "Remarks or Lab Ref No.",
  STEP_A_OPERATION: "Addition of Ingredients Mixing",
  STEP_B_OPERATION: "Addition of TDI and Mixing",
} as const;

export const createLinearPreparationData = () => ({
  premix: {
    timeA: "",
    remarksA: "",
    timeB: "",
    remarksB: "",
    timeC: "",
    remarksC: "",
  },
  finalMix: {
    timeA: "",
    remarksA: "",
    timeB: "",
    remarksB: "",
  },
});

export const countFilledLinearFields = (obj: Record<string, unknown>) =>
  Object.values(obj).filter((v) => String(v ?? "").trim() !== "").length;
