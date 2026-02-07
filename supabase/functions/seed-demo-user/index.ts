import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

  // Check if demo user exists
  const { data: existing } = await admin.auth.admin.listUsers();
  const demoExists = existing?.users?.some(u => u.email === "demo@gmail.com");

  if (!demoExists) {
    const { data, error } = await admin.auth.admin.createUser({
      email: "demo@gmail.com",
      password: "demo@1234",
      email_confirm: true,
      user_metadata: { full_name: "Demo User", role: "business" },
    });

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify({ message: "Demo user created", id: data.user.id }));
  }

  return new Response(JSON.stringify({ message: "Demo user already exists" }));
});
