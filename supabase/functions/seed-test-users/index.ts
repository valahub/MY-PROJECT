// Seeds 4 test accounts (admin/author/customer/support) with fixed creds.
// Idempotent: skips if email already exists, ensures roles assigned.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_USERS = [
  { email: "admin@test.com",    password: "Test#12345", role: "admin",    full_name: "Test Admin" },
  { email: "merchant@test.com", password: "Test#12345", role: "merchant", full_name: "Test Merchant" },
  { email: "author@test.com",   password: "Test#12345", role: "author",   full_name: "Test Author" },
  { email: "customer@test.com", password: "Test#12345", role: "customer", full_name: "Test Customer" },
  { email: "support@test.com",  password: "Test#12345", role: "support",  full_name: "Test Support" },
] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const results: Array<{ email: string; status: string }> = [];

  for (const u of TEST_USERS) {
    // Try to find existing user
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list?.users.find((x) => x.email === u.email);

    let userId = existing?.id;
    if (!existing) {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full_name },
      });
      if (error || !created.user) {
        results.push({ email: u.email, status: `create-failed: ${error?.message}` });
        continue;
      }
      userId = created.user.id;
    }

    // Ensure role row exists (handle_new_user trigger gives 'customer' by default)
    if (userId) {
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", u.role)
        .maybeSingle();
      if (!existingRole) {
        await supabase.from("user_roles").insert({ user_id: userId, role: u.role });
      }
      results.push({ email: u.email, status: existing ? "ensured" : "created" });
    }
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
