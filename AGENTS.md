# AGENTS.md

## Scope

This file defines guidance for coding agents working in the `kisara-api` backend repository.
Apply these rules for all changes in this repo unless a task explicitly says otherwise.

## Project Summary

- Runtime: Node.js + TypeScript
- HTTP framework: Fastify
- ORM: Mikro-ORM (PostgreSQL)
- Auth model:
  - JWT (`Authorization: Bearer ...`) for internal web-session flows
  - API key (`X-API-Key`) for consumer API access
- API schema/docs: TypeBox route schemas + Fastify Swagger (`/openapi.json`, `/openapi.yaml`)

## Important Directories

- `src/index.ts`: startup entrypoint
- `src/app.ts`: Fastify setup, plugins, route registration, global hooks
- `src/config/`: environment, DB, Mikro-ORM, API docs
- `src/router/`: route contracts (schemas + handlers)
- `src/controllers/`: request orchestration layer
- `src/services/`: business logic
- `src/repositories/`: DB access abstraction
- `src/entities/`: ORM entities
- `src/middlewares/`: auth/error middleware
- `src/models/validation/`: TypeBox validation schemas
- `migrations/`: DB migration files
- `mintlify/openapi/openapi.json`: generated OpenAPI artifact tracked by git

## Request + Layering Rules

When adding/changing behavior, keep layer boundaries clear:

1. Router: define endpoint path, schema, auth preHandler
2. Controller: parse request, call services/repos, format response
3. Service: domain/business rules
4. Repository: persistence details only

Do not move heavy business logic into route files.

## Auth and Security Rules

- Use `authenticateJwt` when endpoint should only allow JWT.
- Use `authenticate` when endpoint may accept JWT or API key.
- Use `authorizeRoles([...])` only for explicit role restrictions.
- Keep error messages safe; do not leak secrets/tokens in logs or responses.
- Preserve existing cookie/session behavior for OAuth and refresh-token flows.

## Response and Error Shape

- Success responses should use `AppResponse` helpers in `src/utils/app-response.ts`.
- Keep route response schemas aligned with actual payload shape.
- Use `AppError` for controlled failures and proper status code mapping.
- Keep existing metadata/error format from `error.middleware.ts`.

## Database and Migration Rules

- Do not create auto-generated migration files manually.
- For entity changes, generate migration via script:
  - `pnpm migrate:create`
- Apply and inspect with:
  - `pnpm migrate:up`
  - `pnpm migrate:status`
- Production migration commands must use `:prod` variants.

## OpenAPI + Git Hook Awareness

- Pre-push hook (`.husky/pre-push`) runs `pnpm generate:openapi`.
- If OpenAPI output changes, hook may amend the last commit automatically.
- If route schemas change, expect `mintlify/openapi/openapi.json` to change too.

## Commands for Validation

Prefer these checks after edits:

1. TypeScript build: `pnpm build`
2. Targeted diagnostics via editor/tooling
3. Optional lint: `pnpm lint` (if configured and stable in current environment)

## Coding Conventions

- Match existing TypeScript style and naming conventions.
- Keep files ASCII unless file already uses non-ASCII content.
- Avoid broad refactors when task is scoped.
- Avoid editing unrelated files.
- Never modify `dist/` as source-of-truth changes.

## Safe Change Checklist

Before finishing, verify:

1. Route schema, controller behavior, and response payload are consistent.
2. Auth preHandler matches intended endpoint access pattern.
3. DB-affecting changes include migration workflow notes.
4. OpenAPI generation impact is considered.
5. No secrets/tokens are logged or hardcoded.

## Notes for Multi-Repo Work

This backend is often paired with frontend repo `kisara-v3`.
When implementing cross-repo features, keep backend contracts stable and explicitly document any API contract changes that frontend must follow.
