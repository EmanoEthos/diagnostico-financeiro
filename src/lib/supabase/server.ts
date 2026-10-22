import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";

export async function criarClienteSupabase() {
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseChave, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesParaGravar) {
        try {
          for (const { name, value, options } of cookiesParaGravar) cookieStore.set(name, value, options);
        } catch {
          // Chamado de um Server Component, que não pode gravar cookies; o proxy renova a sessão.
        }
      },
    },
  });
}

export type Etapa = "login" | "configurar-2fa" | "verificar-2fa" | "liberado";

export async function etapaDeAcesso(supabase: Awaited<ReturnType<typeof criarClienteSupabase>>): Promise<Etapa> {
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) return "login";

  const { data: nivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (nivel?.currentLevel === "aal2") return "liberado";
  if (nivel?.nextLevel === "aal2") return "verificar-2fa";
  return "configurar-2fa";
}

const DESTINO: Record<Exclude<Etapa, "liberado">, string> = {
  login: "/login",
  "configurar-2fa": "/2fa/configurar",
  "verificar-2fa": "/2fa/verificar",
};

/** Garante login com 2FA nas páginas e ações protegidas. O banco também exige (RLS). */
export async function exigirConsultor() {
  const supabase = await criarClienteSupabase();
  const etapa = await etapaDeAcesso(supabase);
  if (etapa !== "liberado") redirect(DESTINO[etapa]);

  const { data } = await supabase.auth.getClaims();
  return { supabase, consultorId: data!.claims.sub, email: data!.claims.email as string | undefined };
}
