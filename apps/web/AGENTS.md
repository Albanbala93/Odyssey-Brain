<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version (Next.js 16, App Router, Turbopack by default) has breaking
changes versus older training data — notably: `params`/`searchParams` are
async everywhere, Turbopack is the default bundler for `dev` and `build`,
and `middleware.ts` is being renamed to `proxy.ts`. Read the relevant guide
in `node_modules/next/dist/docs/` before relying on memory.

Project rules, stack decisions, and the phase plan live at the repository
root: `../../AGENTS.md` and `../../docs/IMPLEMENTATION_PLAN.md`. This file
only carries Next.js-version-specific warnings.
<!-- END:nextjs-agent-rules -->
