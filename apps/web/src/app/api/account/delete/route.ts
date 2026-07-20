import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server";

/**
 * Deletes the authenticated user's account and all associated data
 * (ODYSSEY_MASTER_PROMPT_CODEX.md §5.11). Every per-user table has
 * `on delete cascade` from `profiles.auth_user_id -> auth.users`, so
 * deleting the auth user is sufficient — no separate row-by-row cleanup.
 */
export async function POST(): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 501 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const serviceRoleClient = createSupabaseServiceRoleClient();
    const { error } = await serviceRoleClient.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("[account/delete] failed to delete user", error);
      return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[account/delete] service role client unavailable", error);
    return NextResponse.json(
      { error: "Account deletion is not available on this deployment" },
      { status: 501 },
    );
  }
}
