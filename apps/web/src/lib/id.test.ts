import { describe, expect, it } from "vitest";
import { createId } from "./id";

// Every id produced here is written, unchanged, into a Postgres `uuid`
// column once Supabase persistence is active (see id.ts comment) — a
// prefixed or otherwise non-UUID id causes "invalid input syntax for type
// uuid" on save.
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("createId", () => {
  it("returns a valid v4 UUID", () => {
    expect(createId()).toMatch(UUID_V4_PATTERN);
  });

  it("returns distinct values on repeated calls", () => {
    expect(createId()).not.toBe(createId());
  });
});
