import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UserModel } from "../../data/models/user/UserModel";
import type { DepartmentModel } from "../../data/models/user/DepartmentModel";
import type { SubDepartmentModel } from "../../data/models/user/SubDepartmentModel";

export type AuthStore = {
  user: UserModel | null;
  isAuthenticated: boolean;
  login: (userModelOrPlain: UserModel | Record<string, unknown>) => void;
  logout: () => void;
  getRole: () => string | null;
  getUsername: () => string | null;
  getDepartments: () => DepartmentModel[];
  getAllSubDepartments: () => SubDepartmentModel[];
  getHeaderDeptOptions: () => unknown[];
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  hasSubDeptAccess: (subDeptId: string | number) => boolean;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: (userModelOrPlain) => {
        const user =
          userModelOrPlain instanceof UserModel
            ? userModelOrPlain
            : UserModel.fromJSON(userModelOrPlain);
        set({ user, isAuthenticated: true });
      },

      logout: () => set({ user: null, isAuthenticated: false }),

      getRole: () => get().user?.role ?? null,

      getUsername: () => get().user?.username ?? null,

      getDepartments: () => get().user?.departments ?? [],

      getAllSubDepartments: () => get().user?.allSubDepartments ?? [],

      getHeaderDeptOptions: () => get().user?.headerDeptOptions ?? [],

      getAccessToken: () => get().user?.accessToken ?? null,

      getRefreshToken: () => get().user?.refreshToken ?? null,

      hasSubDeptAccess: (subDeptId) =>
        get().user?.hasSubDeptAccess(subDeptId) ?? false,
    }),
    {
      name: "auth-session",
      storage: createJSONStorage(() => localStorage),

      serialize: (state) =>
        JSON.stringify({
          state: {
            user: state.state.user ? state.state.user.toJSON() : null,
          },
          version: state.version,
        }),

      deserialize: (str) => {
        const parsed = JSON.parse(str) as {
          state: { user: unknown };
          version?: number;
        };
        const user = parsed.state.user
          ? UserModel.fromJSON(parsed.state.user)
          : null;
        return {
          ...parsed,
          state: {
            ...parsed.state,
            user,
            isAuthenticated: !!user,
          },
        };
      },
    },
  ),
);
