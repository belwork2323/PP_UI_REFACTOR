import { getOperationsTheme } from "../../shared/operations_theme";
import { getCasePreparationTheme } from "./casePreparation_theme";
import { getMixingTheme } from "./mixing_theme";
import { getRawMaterialPreparationTheme } from "./rawMaterialPreparation_theme";
import { getCastingAndCuringTheme } from "./castingAndCuring_theme";
import { getPostCureTheme } from "./postCure_theme";

export const getManufacturingTheme = (mode = "light") => {
	const baseTheme = getOperationsTheme(mode);

	return {
		...baseTheme,
		manufacturing: {
			dashboard: {
				departmentName: "Manufacturing Department",
			},
			casePreparation: getCasePreparationTheme(baseTheme),
			castingAndCuring: getCastingAndCuringTheme(baseTheme),
			mixing: getMixingTheme(baseTheme),
			rawMaterialPrep: getRawMaterialPreparationTheme(baseTheme),
			postCure: getPostCureTheme(baseTheme),
		},
	};
};

export default getManufacturingTheme;
