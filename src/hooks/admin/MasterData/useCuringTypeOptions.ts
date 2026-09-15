import { CURING_TYPE_OPTIONS } from "@data/models/admin/MasterData/curingTypeOptions";

export default function useCuringTypeOptions() {
  return { options: CURING_TYPE_OPTIONS, loading: false };
}
