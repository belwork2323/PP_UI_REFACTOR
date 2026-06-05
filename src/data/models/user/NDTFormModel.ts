export type NDTFileValue = File | string;

export type NDTObservation = {
  observation: string;
  files: NDTFileValue[];
};

export type NDTMechRow = {
  uts: string;
  elongation: string;
  eModulus: string;
  files: NDTFileValue[];
};

export type NDTIfaceRow = {
  peelStrength: string;
  tbs: string;
  sbs: string;
  files: NDTFileValue[];
};

export type NDTBurnRow = {
  burnRate: string;
  density: string;
  files: NDTFileValue[];
};

export type NDTDefects = {
  cracks: NDTObservation;
  voids: NDTObservation;
  debonds: NDTObservation;
  delamination: NDTObservation;
  porosity: NDTObservation;
  other: NDTObservation;
};

export type NDTFormState = {
  defects: NDTDefects;
  mechRows: NDTMechRow[];
  mechMean: { uts: string; elongation: string; eModulus: string };
  mechStdDev: { uts: string; elongation: string; eModulus: string };
  ifaceRows: NDTIfaceRow[];
  ifaceAvg: { peelStrength: string; tbs: string; sbs: string };
  ifaceStdDev: { peelStrength: string; tbs: string; sbs: string };
  burnRows: NDTBurnRow[];
  burnAvg: { burnRate: string; density: string };
};

export const createDefaultNDTFormState = (): NDTFormState => ({
  defects: {
    cracks: { observation: "", files: [] },
    voids: { observation: "", files: [] },
    debonds: { observation: "", files: [] },
    delamination: { observation: "", files: [] },
    porosity: { observation: "", files: [] },
    other: { observation: "", files: [] },
  },
  mechRows: [{ uts: "", elongation: "", eModulus: "", files: [] }],
  mechMean: { uts: "", elongation: "", eModulus: "" },
  mechStdDev: { uts: "", elongation: "", eModulus: "" },
  ifaceRows: [{ peelStrength: "", tbs: "", sbs: "", files: [] }],
  ifaceAvg: { peelStrength: "", tbs: "", sbs: "" },
  ifaceStdDev: { peelStrength: "", tbs: "", sbs: "" },
  burnRows: [{ burnRate: "", density: "", files: [] }],
  burnAvg: { burnRate: "", density: "" },
});

export const hasAnyNDTValue = (form: NDTFormState) => {
  const anyDefect = Object.values(form.defects).some(
    (value) => value.observation.trim().length > 0
  );
  const anyMech = form.mechRows.some(
    (row) => row.uts || row.elongation || row.eModulus
  );
  const anyInterface = form.ifaceRows.some(
    (row) => row.peelStrength || row.tbs || row.sbs
  );
  const anyBurn = form.burnRows.some((row) => row.burnRate || row.density);

  return anyDefect || anyMech || anyInterface || anyBurn;
};
