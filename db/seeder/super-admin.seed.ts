import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const email = "admin@procureflow.com";
const workspaceName = "Demo Company";

async function seed() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;

  const missingVars: string[] = [];

  if (!supabaseUrl) {
    missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!secretKey) {
    missingVars.push("SUPABASE_SECRET_KEY");
  }

  if (missingVars.length > 0) {
    throw new Error(`Missing environment variable(s): ${missingVars.join(", ")}`);
  }

  const resolvedSupabaseUrl = supabaseUrl as string;
  const resolvedSecretKey = secretKey as string;

  if (!password) {
    throw new Error("Missing SEED_SUPER_ADMIN_PASSWORD for seed user creation");
  }

  const supabase = createClient(resolvedSupabaseUrl, resolvedSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // create workspace if it doesn't exist, otherwise use existing workspace id
  const { data: existingWorkspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("name", workspaceName)
    .maybeSingle();

  let workspaceId = existingWorkspace?.id as string | undefined;

  if (!workspaceId) {
    const { data: insertedWorkspace, error: workspaceError } = await supabase
      .from("workspaces")
      .insert({ name: workspaceName })
      .select("id")
      .single();

    if (workspaceError || !insertedWorkspace) {
      throw new Error(workspaceError?.message ?? "Failed to create workspace");
    }

    workspaceId = insertedWorkspace.id;
  }

  // find user
  const { data: users, error: listUsersError } = await supabase.auth.admin.listUsers();

  if (listUsersError) {
    throw new Error(listUsersError.message);
  }

  let user = users.users.find((item) => item.email?.toLowerCase() === email.toLowerCase()) ?? null;

  // create user
  if (!user) {
    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createUserError || !createdUser.user) {
      throw new Error(createUserError?.message ?? "Failed to create auth user");
    }

    user = createdUser.user;
  }

  // update user
  const { error: userError } = await supabase.from("users").upsert(
    {
      id: user.id,
      email,
      is_super_admin: true,
    },
    {
      onConflict: "id",
    },
  );

  if (userError) {
    throw new Error(userError.message);
  }

  // set membership as admin 
  const { error: membershipError } = await supabase.from("memberships").upsert(
    {
      user_id: user.id,
      workspace_id: workspaceId,
      role: "admin",
    },
    {
      onConflict: "user_id,workspace_id",
    },
  );

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  console.log("Seed complete");
  console.log(`Workspace: ${workspaceName} (${workspaceId})`);
  console.log(`Super Admin: ${email}`);
}

seed().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown seed error";
  console.error(message);
  process.exit(1);
});
