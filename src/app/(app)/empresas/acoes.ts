"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { limparCnpj } from "@/lib/cnpj";
import { lerFormularioEmpresa } from "@/lib/empresas/schema";
import { exigirConsultor } from "@/lib/supabase/server";

export type EstadoEmpresa = {
  erro?: string;
  erros?: Partial<Record<string, string>>;
  valores?: Record<string, string>;
};

const idSchema = z.uuid();

export async function salvarEmpresa(id: string | null, _: EstadoEmpresa, formData: FormData): Promise<EstadoEmpresa> {
  const { supabase } = await exigirConsultor();
  if (id !== null && !idSchema.safeParse(id).success) return { erro: "Empresa não encontrada." };

  const { entrada, resultado } = lerFormularioEmpresa(formData);
  if (!resultado.success) {
    const erros: Record<string, string> = {};
    for (const issue of resultado.error.issues) erros[String(issue.path[0])] ??= issue.message;
    return { erros, valores: entrada };
  }

  // O consultor_id é preenchido pelo banco (auth.uid()) e as regras de acesso garantem o dono.
  const consulta = id
    ? supabase.from("empresas").update(resultado.data).eq("id", id).select("id").single()
    : supabase.from("empresas").insert(resultado.data).select("id").single();
  const { data, error } = await consulta;

  if (error?.code === "23505") {
    return { erros: { cnpj: "Você já tem uma empresa cadastrada com este CNPJ" }, valores: entrada };
  }
  if (error || !data) {
    return { erro: "Não foi possível salvar. Tente de novo.", valores: entrada };
  }

  revalidatePath("/empresas");
  redirect(`/empresas/${data.id}`);
}

export async function alterarStatusEmpresa(id: string, status: "ativa" | "arquivada") {
  const { supabase } = await exigirConsultor();
  if (!idSchema.safeParse(id).success) return;

  await supabase.from("empresas").update({ status }).eq("id", id);
  revalidatePath("/empresas");
  revalidatePath(`/empresas/${id}`);
}

export async function excluirEmpresa(id: string, _: EstadoEmpresa, formData: FormData): Promise<EstadoEmpresa> {
  const { supabase } = await exigirConsultor();
  if (!idSchema.safeParse(id).success) return { erro: "Empresa não encontrada." };

  const { data: empresa } = await supabase.from("empresas").select("cnpj").eq("id", id).single();
  if (!empresa) return { erro: "Empresa não encontrada." };

  if (limparCnpj(String(formData.get("confirmacao") ?? "")) !== empresa.cnpj) {
    return { erro: "Digite o CNPJ da empresa para confirmar a exclusão." };
  }

  const { error } = await supabase.from("empresas").delete().eq("id", id);
  if (error) return { erro: "Não foi possível excluir. Tente de novo." };

  revalidatePath("/empresas");
  redirect("/empresas");
}
