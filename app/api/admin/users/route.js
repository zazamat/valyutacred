import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const ADMIN_ROLES = new Set(["super_admin", "admin"]);
const ALLOWED_ROLES = new Set(["organization_user"]);
const ALLOWED_STATUSES = new Set(["active", "pending"]);

function getEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function getBearerToken(request) {
  const header = request.headers.get("authorization") || "";
  const [type, token] = header.split(" ");

  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

function createSupabaseClients() {
  const env = getEnv();

  if (!env.url || !env.anonKey) {
    return {
      error:
        "Supabase URL ve anon key tapilmadi. NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY yoxlanilmalidir.",
    };
  }

  if (!env.serviceRoleKey) {
    return {
      error:
        "SUPABASE_SERVICE_ROLE_KEY server env-de yoxdur. Admin user yaratmaq ucun bu key .env.local-a elave edilmelidir.",
    };
  }

  return {
    anon: createClient(env.url, env.anonKey),
    admin: createClient(env.url, env.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
  };
}

async function authorizeAdmin(request, clients) {
  const token = getBearerToken(request);

  if (!token) {
    return { error: jsonError("Admin sessiyasi tapilmadi.", 401) };
  }

  const { data: userData, error: userError } = await clients.anon.auth.getUser(
    token
  );

  if (userError || !userData?.user) {
    return { error: jsonError("Admin sessiyasi etibarsizdir.", 401) };
  }

  const { data: profile, error: profileError } = await clients.admin
    .from("profiles")
    .select("id, email, role, status")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile) {
    return { error: jsonError("Admin profili tapilmadi.", 403) };
  }

  if (profile.status !== "active" || !ADMIN_ROLES.has(profile.role)) {
    return { error: jsonError("Bu emeliyyat ucun admin icazesi yoxdur.", 403) };
  }

  return { profile };
}

async function getProfiles(adminClient) {
  const withCreatedAt = await adminClient
    .from("profiles")
    .select("id, email, full_name, role, status, organization_id, created_at")
    .order("email", { ascending: true });

  if (!withCreatedAt.error) {
    return { data: withCreatedAt.data || [], hasCreatedAt: true };
  }

  const withoutCreatedAt = await adminClient
    .from("profiles")
    .select("id, email, full_name, role, status, organization_id")
    .order("email", { ascending: true });

  return {
    data: withoutCreatedAt.data || [],
    error: withoutCreatedAt.error,
    hasCreatedAt: false,
  };
}

async function getUsersPayload(adminClient) {
  const [profilesRes, organizationsRes] = await Promise.all([
    getProfiles(adminClient),
    adminClient
      .from("organizations")
      .select("id, name, status, approval_status")
      .order("name", { ascending: true }),
  ]);

  if (profilesRes.error) {
    return { error: profilesRes.error };
  }

  if (organizationsRes.error) {
    return { error: organizationsRes.error };
  }

  const organizationMap = new Map(
    (organizationsRes.data || []).map((item) => [Number(item.id), item])
  );

  const users = (profilesRes.data || []).map((profile) => {
    const organization = profile.organization_id
      ? organizationMap.get(Number(profile.organization_id))
      : null;

    return {
      ...profile,
      created_at: profilesRes.hasCreatedAt ? profile.created_at || null : null,
      organization_name: organization?.name || "",
    };
  });

  return {
    users,
    organizations: organizationsRes.data || [],
    profile_has_created_at: profilesRes.hasCreatedAt,
  };
}

export async function GET(request) {
  const clients = createSupabaseClients();
  if (clients.error) return jsonError(clients.error, 500);

  const auth = await authorizeAdmin(request, clients);
  if (auth.error) return auth.error;

  const payload = await getUsersPayload(clients.admin);

  if (payload.error) {
    return jsonError("Istifadeciler yuklenmedi: " + payload.error.message, 500);
  }

  return NextResponse.json(payload);
}

export async function POST(request) {
  const clients = createSupabaseClients();
  if (clients.error) return jsonError(clients.error, 500);

  const auth = await authorizeAdmin(request, clients);
  if (auth.error) return auth.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Sorgu formati yanlisdir.");
  }

  const fullName = String(body.full_name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const role = String(body.role || "organization_user");
  const status = String(body.status || "pending");
  const organizationId = Number(body.organization_id);

  if (!fullName) return jsonError("Full name bos ola bilmez.");
  if (!email) return jsonError("Email bos ola bilmez.");
  if (password.length < 6) {
    return jsonError("Temporary password minimum 6 simvol olmalidir.");
  }
  if (!ALLOWED_ROLES.has(role)) {
    return jsonError("Bu MVP yalniz organization_user yaratmaga icaze verir.");
  }
  if (!ALLOWED_STATUSES.has(status)) {
    return jsonError("Status yalniz active ve ya pending ola biler.");
  }
  if (!Number.isFinite(organizationId) || organizationId <= 0) {
    return jsonError("Organization secilmelidir.");
  }

  const { data: organization, error: organizationError } = await clients.admin
    .from("organizations")
    .select("id, name")
    .eq("id", organizationId)
    .single();

  if (organizationError || !organization) {
    return jsonError("Secilen organization tapilmadi.");
  }

  const { data: authData, error: authError } =
    await clients.admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
        organization_id: organizationId,
      },
    });

  if (authError || !authData?.user) {
    return jsonError("Auth user yaradilmadi: " + authError.message, 500);
  }

  const profilePayload = {
    id: authData.user.id,
    email,
    full_name: fullName,
    role,
    status,
    organization_id: organizationId,
  };

  const { error: profileError } = await clients.admin
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" });

  if (profileError) {
    await clients.admin.auth.admin.deleteUser(authData.user.id);
    return jsonError("Profile yaradilmadi: " + profileError.message, 500);
  }

  const payload = await getUsersPayload(clients.admin);

  return NextResponse.json({
    message: "Organization user yaradildi.",
    user_id: authData.user.id,
    organization_name: organization.name,
    ...payload,
  });
}
