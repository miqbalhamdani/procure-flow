import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

/**
 * Seeds company settings for a specific partner workspace.
 *
 * Usage:
 *   WORKSPACE_ID=<uuid> tsx db/seeder/company-settings.seed.ts
 *
 * Settings inserted:
 *   - purchase-order / skip_approval: PO auto-approves on submit (bypasses manual approval)
 *   - shipment / skip_transit: Supplier cannot add transit tracking; logistics marks delivered directly
 */

const SETTINGS = [
  {
    workspaceId: 'e201dc47-6c1d-4a6f-88d2-7d999baeea26',
    module: "purchase-order",
    key: "skip_approval",
    value: "true",
    description:
      "Skip PO approval step. PO transitions directly to in_progress on submit, allowing suppliers to create shipments immediately.",
  },
  {
    workspaceId: '830cafc2-5c98-4ead-b80d-c2b2fdd0c336',
    module: "shipment",
    key: "skip_transit",
    value: "true",
    description:
      "Supplier cannot add tracking updates or view the tracking timeline. Logistics marks shipment as delivered directly.",
  },
];

async function seed() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  const missingVars: string[] = [];
  if (!supabaseUrl) missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!secretKey) missingVars.push("SUPABASE_SECRET_KEY");

  if (missingVars.length > 0) {
    throw new Error(`Missing environment variable(s): ${missingVars.join(", ")}`);
  }

  const supabase = createClient(supabaseUrl as string, secretKey as string, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify workspace exists
  const { data: workspaces, error: wsError } = await supabase
    .from("workspaces")
    .select("id, name")
    .in("id", SETTINGS.map((s) => s.workspaceId));

  if (wsError) throw new Error(wsError.message);
  if (!workspaces || workspaces.length === 0) {
    throw new Error(`Workspace not found: ${SETTINGS.map((s) => s.workspaceId).join(", ")}`);
  }

  const foundIds = new Set(workspaces.map((workspace) => workspace.id));
  const missingWorkspaceIds = SETTINGS.map((s) => s.workspaceId).filter(
    (workspaceId) => !foundIds.has(workspaceId),
  );

  if (missingWorkspaceIds.length > 0) {
    throw new Error(`Workspace not found: ${missingWorkspaceIds.join(", ")}`);
  }

  console.log(`Seeding workspace settings for ${workspaces.length} workspace(s):`);
  for (const workspace of workspaces) {
    console.log(`  - "${workspace.name}" (${workspace.id})`);
  }

  for (const setting of SETTINGS) {
    const { error } = await supabase.from("workspace_settings").upsert(
      {
        workspace_id: setting.workspaceId,
        module: setting.module,
        key: setting.key,
        value: setting.value,
        description: setting.description,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,module,key" },
    );

    if (error) {
      throw new Error(`Failed to upsert [${setting.module}/${setting.key}]: ${error.message}`);
    }

    console.log(`  ✓ ${setting.module} / ${setting.key} = "${setting.value}"`);
  }

  console.log("\nDone. Workspace settings seeded successfully.");
}

seed().catch((err) => {
  console.error("Seeder failed:", err.message);
  process.exit(1);
});
