# AGENTS.md

Node/Express 5 + Drizzle ORM (node-postgres) CRM backend. ESM only (`"type": "module"`), pnpm. No test, lint, or typecheck suite exists — verify changes by booting the server and/or `pnpm db:push` output.

## Commands

```bash
docker compose up -d   # postgres:17 container "crm-postgres" must be running first
pnpm dev               # nodemon server.js (PORT defaults to 5000)
pnpm db:push           # apply schema changes — this is the workflow, NOT db:generate/db:migrate
pnpm newadmin <user> <pass>   # create first admin user
pnpm passwd <user> <newpass>  # reset a user password
```

`startup.sh` bootstraps a fresh machine: writes `.env`, installs, starts docker, pushes schema, runs dev, creates admin.

## Gotchas

- **DB schema flow is `db:push`, not migrations.** `drizzle/` is gitignored; there are no tracked migrations. Never run `db:generate`/`db:migrate`.
- **New tables must be exported from `schema/index.js`** or `db:push` silently ignores them. This has bitten before (only `users` was exported initially).
- `.env` is required and zod-validated at boot (`config/env.js`) — process exits(1) on invalid vars. `JWT_SECRET` ≥ 32 chars.
- Import paths use the `#/*` alias → repo root (package.json `"imports"`). Use `#/schema/index.js`, not relative paths.
- `pnpm-workspace.yaml` `allowBuilds` gates bcrypt native build (needed by `scripts/createAdmin.js`, which uses `bcrypt`, not `bcryptjs` used in controllers).

## Conventions

- Resource layout: `controllers/<resource>/{<resource>Controller,<resource>Queries,<resource>Validator}.js` + `routes/<resource>Routes.js`. Routes mount under `/api` in `routes/index.js`.
- Validators: `drizzle-zod` `createInsertSchema`/`createUpdateSchema` from the table + overrides; omit `id`/timestamps. Validate with `parseBody(schema, req.body)` (throws 400).
- Controllers throw `HttpError(status, message)` — never `next(err)`; central `errorHandler` catches.
- Queries: never `db.select()` users blindly — whitelist via `safeColumns` (password hash must never leave a query). `findUserByUsername` returns the hash for auth only; label it "internal use only".
- PATCH flow: `comparator()` from `utils/patcher.js` diffs payload vs existing record; reject empty change objects.
- Pagination/search: `paginateAndSearch` / `fromTable` / `join` helpers in `utils/queryhelper.js`.
- Auth: signed cookie `accessToken` (JWT). Middleware: `authenticateUser`, then `authorizePermissions("admin")` for admin-only routes. Roles: `admin`, `editor`.
- Schema tables: camelCase JS props, snake_case DB columns, `pkid`/`timestamps` spreads from `schema/helpers.js`.

## Session
 opencode -s ses_f647ddb01ffeWm4dfqLqIQkFKV
