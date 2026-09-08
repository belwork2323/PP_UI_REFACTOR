import { STRINGS } from "@/app/config/strings";
import type { CastingMotorData } from "@/data/models/user/CastingMotorDataModel";
import type { SubDeptValidationConfig } from "../runValidation";
import type { ValidationTier } from "../submissionIntent";
import { VALIDATIONSTRING } from "./validationString";

const S = VALIDATIONSTRING;

export const castingCuringFieldRules = {
  feedReading: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  // Mandrel measurements (assembly details)
  mandrelAMock: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  mandrelBMock: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  mandrelBFinal: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  mandrelBellowsThicknessD: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  emptyMotorWeight: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  bowlId: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  bowlReceiptTime: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  initialWeight: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  finalWeight: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  //  -----------------------
  ballValveOpenTime: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: {
      required: S.REQUIRED,
      invalid: S.INVALID,
    },
  },

  slurryDepthAfterDc: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: {
      required: S.REQUIRED,
      invalid: S.INVALID,
    },
  },

  dcCloseTime: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: {
      required: S.REQUIRED,
      invalid: S.INVALID,
    },
  },

  dcOpenTime: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: {
      required: S.REQUIRED,
      invalid: S.INVALID,
    },
  },
  timeInterval: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  rh: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  viscosity: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  slurryCast: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  flowRate: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  valveOpening: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  vacuumLevel: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  initialVacuum: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  vacuumPressureCasting: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  vacuumPressureSoaking: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  fmMotorLabel: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  postActivity: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  postDetails: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  // Curing — cycle rows (with specific custom messages)
  curingTemperature: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  curingTime: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  curingStartDate: {
    valueType: "date" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  curingStartTime: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  curingEndDate: {
    valueType: "date" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  curingEndTime: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  propellantPressure: {
    valueType: "number" as const,
    requiredIn: [],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  hotWaterStatus: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  // Post-curing details
  postOtherObservations: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  postVisualObservation: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  pressurePlateRemovalDateTime: {
    valueType: "text" as const,
    requiredIn: [],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  shoreAHardness: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  deCoringDispatchDateTime: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  // De-coring details
  deCoringDate: {
    valueType: "date" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  buildingNo: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  deCoringLoad: {
    valueType: "number" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  deCoringRemarks: {
    valueType: "text" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
  deCoringVisualObservation: {
    valueType: "file" as const,
    requiredIn: ["UNIT", "SUBMIT"],
    messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
  },
};

function resolveFieldPaths(data: any) {
  const paths: Array<{ path: string; value: unknown; ruleKey: string }> = [];

  // feed readings
  const casing = data.FINAL_ASSEMBLY_DETAILS?.motorCasing?.[0];
  if (casing) {
    (casing.MANDREL_MEASUREMENTS ?? []).forEach((row: any, i: number) => {
      paths.push({
        path: `FINAL_ASSEMBLY_DETAILS.motorCasing.0.MANDREL_MEASUREMENTS.${i}.A_MOCK`,
        value: row.A_MOCK,
        ruleKey: "mandrelAMock",
      });
      paths.push({
        path: `FINAL_ASSEMBLY_DETAILS.motorCasing.0.MANDREL_MEASUREMENTS.${i}.B_MOCK`,
        value: row.B_MOCK,
        ruleKey: "mandrelBMock",
      });
      paths.push({
        path: `FINAL_ASSEMBLY_DETAILS.motorCasing.0.MANDREL_MEASUREMENTS.${i}.B_FINAL`,
        value: row.B_FINAL,
        ruleKey: "mandrelBFinal",
      });
      paths.push({
        path: `FINAL_ASSEMBLY_DETAILS.motorCasing.0.MANDREL_MEASUREMENTS.${i}.BELLOWS_THICKNESS_D`,
        value: row.BELLOWS_THICKNESS_D,
        ruleKey: "mandrelBellowsThicknessD",
      });
    });

    paths.push({
      path: `FINAL_ASSEMBLY_DETAILS.motorCasing.0.EMPTY_MOTOR_WEIGHT`,
      value: casing.EMPTY_MOTOR_WEIGHT,
      ruleKey: "emptyMotorWeight",
    });
    const feed = casing.FEED_PIPE_DISTANCE?.[0];
    if (feed) {
      paths.push({
        path: `FINAL_ASSEMBLY_DETAILS.motorCasing.0.FEED_PIPE_DISTANCE.0.READING_1`,
        value: feed.READING_1,
        ruleKey: "feedReading",
      });
      paths.push({
        path: `FINAL_ASSEMBLY_DETAILS.motorCasing.0.FEED_PIPE_DISTANCE.0.READING_2`,
        value: feed.READING_2,
        ruleKey: "feedReading",
      });
      // paths.push({
      //   path: `FINAL_ASSEMBLY_DETAILS.motorCasing.0.FEED_PIPE_DISTANCE.0.EMPTY_MOTOR_WEIGHT`,
      //   value: feed.EMPTY_MOTOR_WEIGHT,
      //   ruleKey: "emptyMotorWeight",
      // });
    }
  }

  // final mix bowl details
  (data.CASTING_PROCESS?.FINAL_MIX_BOWL_DETAILS ?? []).forEach((row, i) => {
    paths.push({
      path: `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${i}.BOWL_ID`,
      value: row.BOWL_ID,
      ruleKey: "bowlId",
    });
    paths.push({
      path: `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${i}.BOWL_RECEIPT_TIME`,
      value: row.BOWL_RECEIPT_TIME,
      ruleKey: "bowlReceiptTime",
    });
    paths.push({
      path: `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${i}.INITIAL_WEIGHT`,
      value: row.INITIAL_WEIGHT,
      ruleKey: "initialWeight",
    });
    paths.push({
      path: `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${i}.FINAL_WEIGHT`,
      value: row.FINAL_WEIGHT,
      ruleKey: "finalWeight",
    });
    paths.push({
      path: `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${i}.DC_OPEN_TIME`,
      value: row.DC_OPEN_TIME,
      ruleKey: "dcOpenTime",
    });
    paths.push({
      path: `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${i}.DC_CLOSE_TIME`,
      value: row.DC_CLOSE_TIME,
      ruleKey: "dcCloseTime",
    });
    paths.push({
      path: `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${i}.SLURRY_DEPTH_AFTER_DC`,
      value: row.SLURRY_DEPTH_AFTER_DC,
      ruleKey: "slurryDepthAfterDc",
    });
    paths.push({
      path: `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${i}.BALL_VALVE_OPEN_TIME`,
      value: row.BALL_VALVE_OPEN_TIME,
      ruleKey: "ballValveOpenTime",
    });
  });

  // casting from bowl details
  (data.CASTING_PROCESS?.CASTING_FROM_BOWL_DETAILS ?? []).forEach((row, i) => {
    paths.push({
      path: `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${i}.BOWL_ID`,
      value: row.BOWL_ID,
      ruleKey: "bowlId",
    });
    paths.push({
      path: `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${i}.TIME_INTERVAL`,
      value: row.TIME_INTERVAL,
      ruleKey: "timeInterval",
    });
    paths.push({
      path: `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${i}.RH`,
      value: row.RH,
      ruleKey: "rh",
    });
    paths.push({
      path: `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${i}.VISCOSITY`,
      value: row.VISCOSITY,
      ruleKey: "viscosity",
    });
    paths.push({
      path: `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${i}.MOTOR_ID`,
      value: row.MOTOR_ID,
      ruleKey: "fmMotorLabel",
    });
    paths.push({
      path: `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${i}.SLURRY_DEPTH`,
      value: row.SLURRY_DEPTH,
      ruleKey: "slurryDepth",
    });
    paths.push({
      path: `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${i}.SLURRY_CAST`,
      value: row.SLURRY_CAST,
      ruleKey: "slurryCast",
    });
    paths.push({
      path: `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${i}.FLOW_RATE`,
      value: row.FLOW_RATE,
      ruleKey: "flowRate",
    });
    paths.push({
      path: `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${i}.VALVE_OPENING`,
      value: row.VALVE_OPENING,
      ruleKey: "valveOpening",
    });
    paths.push({
      path: `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${i}.VACUUM_LEVEL`,
      value: row.VACUUM_LEVEL,
      ruleKey: "vacuumLevel",
    });
  });
  // console.log("check error ", data);

  // casting process level fields
  // paths.push({
  //   path: `CASTING_PROCESS.INITIAL_VACUUM`,
  //   value: data.CASTING_PROCESS?.INITIAL_VACUUM,
  //   ruleKey: "initialVacuum",
  // });
  // paths.push({
  //   path: `CASTING_PROCESS.VACUUM_PRESSURE_CASTING`,
  //   value: data.CASTING_PROCESS?.VACUUM_PRESSURE_CASTING,
  //   ruleKey: "vacuumPressureCasting",
  // });
  // paths.push({
  //   path: `CASTING_PROCESS.VACUUM_PRESSURE_SOAKING`,
  //   value: data.CASTING_PROCESS?.VACUUM_PRESSURE_SOAKING,
  //   ruleKey: "vacuumPressureSoaking",
  // });

  // slurry cast rows
  (data.SLURRY_CAST_DETAILS?.SLURRY_CAST_FROM_BOWLS ?? []).forEach((row, i) => {
    paths.push({
      path: `SLURRY_CAST_DETAILS.SLURRY_CAST_FROM_BOWLS.${i}.FM_MOTOR_LABEL`,
      value: row.FM_MOTOR_LABEL,
      ruleKey: "fmMotorLabel",
    });
    paths.push({
      path: `SLURRY_CAST_DETAILS.SLURRY_CAST_FROM_BOWLS.${i}.SLURRY_CAST`,
      value: row.SLURRY_CAST,
      ruleKey: "slurryCast",
    });
  });

  // post cast operations
  (data.POST_CAST_OPERATIONS?.POST_CAST_TABLE ?? []).forEach((row, i) => {
    paths.push({
      path: `POST_CAST_OPERATIONS.POST_CAST_TABLE.${i}.ACTIVITY`,
      value: row.ACTIVITY,
      ruleKey: "postActivity",
    });
    paths.push({
      path: `POST_CAST_OPERATIONS.POST_CAST_TABLE.${i}.DETAILS`,
      value: row.DETAILS,
      ruleKey: "postDetails",
    });
  });

  // curing cycles table
  (data.CURING_CYCLES?.CURING_TABLE ?? []).forEach((row: any, i: number) => {
    paths.push({
      path: `CURING_CYCLES.CURING_TABLE.${i}.TEMPERATURE`,
      value: row.TEMPERATURE,
      ruleKey: "curingTemperature",
    });
    paths.push({
      path: `CURING_CYCLES.CURING_TABLE.${i}.TIME`,
      value: row.TIME,
      ruleKey: "curingTime",
    });
    paths.push({
      path: `CURING_CYCLES.CURING_TABLE.${i}.START_DATE`,
      value: row.START_DATE,
      ruleKey: "curingStartDate",
    });
    paths.push({
      path: `CURING_CYCLES.CURING_TABLE.${i}.START_TIME`,
      value: row.START_TIME,
      ruleKey: "curingStartTime",
    });
    paths.push({
      path: `CURING_CYCLES.CURING_TABLE.${i}.END_DATE`,
      value: row.END_DATE,
      ruleKey: "curingEndDate",
    });
    paths.push({
      path: `CURING_CYCLES.CURING_TABLE.${i}.END_TIME`,
      value: row.END_TIME,
      ruleKey: "curingEndTime",
    });
    paths.push({
      path: `CURING_CYCLES.CURING_TABLE.${i}.PROPELLANT_PRESSURE`,
      value: row.PROPELLANT_PRESSURE,
      ruleKey: "propellantPressure",
    });
    paths.push({
      path: `CURING_CYCLES.CURING_TABLE.${i}.HOT_WATER_STATUS`,
      value: row.HOT_WATER_STATUS,
      ruleKey: "hotWaterStatus",
    });
  });

  // post-curing details
  const postCuring = data.POST_CURING_DETAILS;
  if (postCuring) {
    paths.push({
      path: `POST_CURING_DETAILS.OTHER_OBSERVATIONS`,
      value: postCuring.OTHER_OBSERVATIONS,
      ruleKey: "postOtherObservations",
    });
    paths.push({
      path: `POST_CURING_DETAILS.VISUAL_OBSERVATION`,
      value: postCuring.VISUAL_OBSERVATION,
      ruleKey: "postVisualObservation",
    });
    paths.push({
      path: `POST_CURING_DETAILS.PRESSURE_PLATE_REMOVAL_DATE_TIME`,
      value: postCuring.PRESSURE_PLATE_REMOVAL_DATE_TIME,
      ruleKey: "pressurePlateRemovalDateTime",
    });
    paths.push({
      path: `POST_CURING_DETAILS.SHORE_A_HARDNESS`,
      value: postCuring.SHORE_A_HARDNESS,
      ruleKey: "shoreAHardness",
    });
    paths.push({
      path: `POST_CURING_DETAILS.DE_CORING_DISPATCH_DATE_TIME`,
      value: postCuring.DE_CORING_DISPATCH_DATE_TIME,
      ruleKey: "deCoringDispatchDateTime",
    });
  }

  // decoring details
  const decoring = data.DECORING_DETAILS;
  if (decoring) {
    paths.push({
      path: `DECORING_DETAILS.DECORING_DATE`,
      value: decoring.DECORING_DATE,
      ruleKey: "deCoringDate",
    });
    paths.push({
      path: `DECORING_DETAILS.BUILDING_NO`,
      value: decoring.BUILDING_NO,
      ruleKey: "buildingNo",
    });
    paths.push({
      path: `DECORING_DETAILS.DECORING_LOAD`,
      value: decoring.DECORING_LOAD,
      ruleKey: "deCoringLoad",
    });
    paths.push({
      path: `DECORING_DETAILS.DECORING_REMARKS`,
      value: decoring.DECORING_REMARKS,
      ruleKey: "deCoringRemarks",
    });
    paths.push({
      path: `DECORING_DETAILS.DECORING_VISUAL_OBSERVATION`,
      value: decoring.DECORING_VISUAL_OBSERVATION,
      ruleKey: "deCoringVisualObservation",
    });
  }
  return paths;
}

export const castingCuringValidationConfig: SubDeptValidationConfig<CastingMotorData> = {
  id: "castingCuring",
  fields: castingCuringFieldRules as any,
  resolveFieldPaths,
  customRules: [],
};

export default castingCuringValidationConfig;
