export type DispatchSupportingFile = {
  name: string;
  size?: number;
  type?: string;
  file?: File | null;
  filePath?: string;
  fileType?: string;
};

export type DispatchFormState = {
  castingDate: string;
  finalWeight: string;
  waiversIfAny: string;
  ndtCommitteeMomNumber: string;
  finalAcceptanceMomNumber: string;
  deviationDetails: string;
  dispatchDate: string;
  dispatchLocation: string;
  supportingFiles: DispatchSupportingFile[];
};

export const createDefaultDispatchFormState = (): DispatchFormState => ({
  castingDate: "",
  finalWeight: "",
  waiversIfAny: "",
  ndtCommitteeMomNumber: "",
  finalAcceptanceMomNumber: "",
  deviationDetails: "",
  dispatchDate: "",
  dispatchLocation: "",
  supportingFiles: [],
});

export const hasAnyDispatchValue = (form: DispatchFormState) => {
  const hasText = [
    form.castingDate,
    form.finalWeight,
    form.waiversIfAny,
    form.ndtCommitteeMomNumber,
    form.finalAcceptanceMomNumber,
    form.deviationDetails,
    form.dispatchDate,
    form.dispatchLocation,
  ].some((value) => String(value ?? "").trim().length > 0);

  return hasText || (form.supportingFiles?.length ?? 0) > 0;
};
