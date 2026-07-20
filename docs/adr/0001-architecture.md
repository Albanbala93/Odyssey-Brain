# ADR-0001: Single Next.js app instead of a multi-package monorepo

## Status

Accepted (2026-07-20).

## Context

`ODYSSEY_MASTER_PROMPT_CODEX.md` §8 suggests a monorepo layout
(`apps/web`, `packages/ui`, `packages/domain`, `packages/ai`,
`packages/config`) as an _acceptable_ option, while also instructing: "Do
not introduce complexity without benefit." The repository started
completely empty — no existing monorepo tooling to preserve.

## Decision

Build a single Next.js application at `apps/web`, with the requested
separation of concerns implemented as internal directories
(`src/domain`, `src/ai`, `src/components/ui`) rather than separately
versioned/published pnpm packages. A root `pnpm-workspace.yaml` +
root `package.json` still exist so the project _can_ grow into a real
multi-package workspace later without restructuring the git history —
adding `packages/*` is additive, not a rewrite.

## Consequences

- Faster iteration: no cross-package build/watch pipeline, no package
  version bumping, one `tsconfig.json`, one lint/test config.
- Import boundaries (e.g. "domain must not import React") are enforced by
  convention and code review today, not by package boundaries. If this
  becomes a real problem (accidental coupling), the corresponding
  directory can be extracted into its own workspace package — the internal
  structure already matches 1:1 what a future `packages/domain`,
  `packages/ai`, `packages/ui` would look like.
- The only scenario that would force an earlier split is a second
  consumer of the domain/AI layer (e.g. a React Native app or a worker
  process) needing to import them outside of Next.js's bundler. That
  hasn't happened yet.

## Revisit when

A second application needs to import `src/domain` or `src/ai`, or the
`apps/web` build time becomes a real bottleneck.
