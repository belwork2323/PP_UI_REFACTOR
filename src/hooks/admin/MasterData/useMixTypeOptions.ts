import { MIX_TYPE_OPTIONS } from "@data/models/admin/MasterData/mixTypeOptions";

export default function useMixTypeOptions() {
  return { options: MIX_TYPE_OPTIONS, loading: false };
}
