# Architecture

This project follows **MVC with feature-wise grouping inside each role**. Auth (`auth/login`) is the gold-standard template for file count and structure.

## Layers

| Layer | Folder | Responsibility |
|-------|--------|----------------|
| **Model (API)** | `src/data/api/{role}/{dept}/{feature}/` | HTTP calls — one `{feature}Api.ts` per feature |
| **Model (types)** | `src/data/models/{role}/{dept}/{feature}/` | Domain types — 2–3 models per feature |
| **Controller** | `src/controllers/{role}/{dept}/{feature}/` | Business orchestration — one `{feature}Controller.ts` |
| **Presenter** | `src/hooks/{role}/{dept}/{feature}/` | React state + View↔Controller bridge — 2–3 hooks max |
| **View** | `src/ui/pages/{role}/{dept}/{feature}/` | Pages + minimal `components/` |
| **Shared UI** | `src/ui/components/common/` | Reusable primitives (Button, Input, Card, etc.) |
| **Custom UI** | `src/ui/components/custom/` | Composed widgets (Header, Drawer, dashboards, workflow shells) |
| **Infrastructure** | `src/app/` | Routes, store, theme, config, assets |

## Import direction

```
View → Presenter (hooks) → Controller → Model (api + models)
View → ui/components/custom → ui/components/common
Custom components must not import @data/api/
```

Views must **not** import `@data/api/` directly.

## Custom UI composition rules

- **Custom components** (`ui/components/custom/`) compose **`ui/components/common/`** primitives (Button, Card, Input, ConfirmAlertDialog, StatusChip, etc.).
- Direct `@mui/material` usage belongs in `common/` wrappers or where MUI is the primitive layer.
- Icons: import only from `@app/theme` (`icons.ts`).
- Colors: import from `colors.ts` / theme tokens — no raw hex in component files.
- Images: import from `@app/assets/images.ts`.

## Theme file convention

| Component type | Theme path |
|----------------|------------|
| App chrome (header, footer, drawer, main layout) | `custom_themes/common/{name}_theme.ts` |
| Role/feature UI | `custom_themes/{role}/{feature}/{name}_theme.ts` |
| Cross-role shared widgets | `custom_themes/shared/` |

Each theme file exports `get{Name}Theme(mode)` and imports `colors`, `fonts`, `spacing`, `layout`, `common_css_theme`.

Role/feature accent colors live in `src/app/theme/roleConfig.ts` (not inside feature theme files consumed by custom components).

## Custom component hooks

Layout and chrome hooks live under `hooks/custom/` (not under feature hooks):

```
hooks/custom/useLogoutHook.ts
hooks/custom/useMainLayoutHook.ts
hooks/custom/useAppHeaderHook.ts
```

## Per-feature file caps

| Layer | Max files |
|-------|-----------|
| API | 1 |
| Controller | 1 |
| Models | 2–3 |
| Hooks | 2–3 |
| Pages | 3–4 (dept main, sub-dept main, list, create) |
| Feature components | 2–5 (only when not covered by `common/`) |

Feature folders use **kebab-case** (e.g. `raw-material-procurement`, `batch-management`).

## Auth reference template (implemented)

```
data/api/auth/login/loginApi.ts
data/models/auth/login/          (CaptchaModel, LoginCredentialsModel, LoginLookupsModel)
controllers/auth/login/loginController.ts   (authLoginController object API)
hooks/auth/login/useLoginHook.ts
hooks/auth/login/useResetPasswordHook.ts
hooks/auth/login/useCaptchaHook.ts
ui/pages/auth/login/LoginPage.tsx
ui/pages/auth/login/components/CaptchaField.tsx
ui/pages/auth/login/components/ResetPasswordForm.tsx
```

## Path aliases

| Alias | Path |
|-------|------|
| `@/*` | `src/*` |
| `@app/*` | `src/app/*` |
| `@data/*` | `src/data/*` |
| `@controllers/*` | `src/controllers/*` |
| `@hooks/*` | `src/hooks/*` |
| `@ui/*` | `src/ui/*` |
| `@utils/*` | `src/utils/*` |
| `@schema/*` | `src/schemaManagement/*` |

## Shared modules

- `schemaManagement/` — schema-driven forms (internal MVC, barrel export at `index.ts`)
- `utils/` — cross-cutting helpers (`errorMapper`, `dateUtils`, `roleMapper`)
- `app/assets/images.ts` — centralized logo/image paths
- `app/theme/roleConfig.ts` — role/status chip colors and icons

## Migration phases

See the restructuring plan in `.cursor/plans/` for incremental migration by role/feature.
