import type { createClient } from "@/lib/supabase/server";

/**
 * Check whether a company-level setting is enabled for a given workspace.
 *
 * Returns `true` only when a `workspace_settings` record exists for the
 * (workspaceId, module, key) combination AND its value equals `"true"`.
 * Defaults to `false` when the record is absent or the value is anything else.
 */
export async function isSettingEnabled(
  supabase: ReturnType<typeof createClient>,
  workspaceId: string,
  module: string,
  key: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("workspace_settings")
    .select("value")
    .eq("workspace_id", workspaceId)
    .eq("module", module)
    .eq("key", key)
    .maybeSingle();

  return data?.value === "true";
}
