"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { criarClienteSupabase, etapaDeAcesso } from "@/lib/supabase/server";

export type EstadoForm = { erro?: string; email?: string };

const credenciais = z.object({
  email: z.email("Informe um e-mail válido"),
  senha: z.string().min(1, "Informe a senha"),
});

export async function entrar(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const dados = credenciais.safeParse({ email: formData.get("email"), senha: formData.get("senha") });
  const email = String(formData.get("email") ?? "");
  if (!dados.success) return { erro: dados.error.issues[0].message, email };

  const supabase = await criarClienteSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email: dados.data.email, password: dados.data.senha });
  // Mensagem única para não revelar se o e-mail existe.
  if (error) return { erro: "E-mail ou senha incorretos.", email };

  const etapa = await etapaDeAcesso(supabase);
  redirect(etapa === "verificar-2fa" ? "/2fa/verificar" : "/2fa/configurar");
}

const codigo = z.string().regex(/^\d{6}$/, "O código tem 6 números");

export type EstadoCadastro2fa = EstadoForm & { fatorId?: string; qrCode?: string; segredo?: string };

export async function iniciarCadastro2fa(): Promise<EstadoCadastro2fa> {
  const supabase = await criarClienteSupabase();

  // Remove tentativas anteriores não concluídas para não acumular fatores pendentes.
  const { data: fatores } = await supabase.auth.mfa.listFactors();
  for (const fator of fatores?.all ?? []) {
    if (fator.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: fator.id });
  }

  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Aplicativo autenticador" });
  if (error || !data) return { erro: "Não foi possível gerar o QR code. Tente de novo." };

  return { fatorId: data.id, qrCode: data.totp.qr_code, segredo: data.totp.secret };
}

export async function concluirCadastro2fa(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const valor = codigo.safeParse(formData.get("codigo"));
  if (!valor.success) return { erro: valor.error.issues[0].message };
  const fatorId = formData.get("fatorId");
  if (typeof fatorId !== "string" || !fatorId) return { erro: "Gere o QR code primeiro." };

  // O Supabase só aceita fatores do próprio usuário logado.
  const supabase = await criarClienteSupabase();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: fatorId, code: valor.data });
  if (error) return { erro: "Código inválido ou expirado. Confira o horário do celular e tente de novo." };

  redirect("/");
}

export async function verificar2fa(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const valor = codigo.safeParse(formData.get("codigo"));
  if (!valor.success) return { erro: valor.error.issues[0].message };

  const supabase = await criarClienteSupabase();
  const { data: fatores } = await supabase.auth.mfa.listFactors();
  const fator = fatores?.totp[0];
  if (!fator) redirect("/2fa/configurar");

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: fator.id, code: valor.data });
  if (error) return { erro: "Código inválido ou expirado." };

  redirect("/");
}

export async function sair() {
  const supabase = await criarClienteSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}
