import "server-only";
import { notFound } from "next/navigation";
import { z } from "zod";
import type { Empresa } from "@/lib/empresas/schema";
import { exigirConsultor } from "@/lib/supabase/server";

export async function buscarEmpresa(id: string): Promise<Empresa> {
  if (!z.uuid().safeParse(id).success) notFound();

  const { supabase } = await exigirConsultor();
  const { data } = await supabase.from("empresas").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return data as Empresa;
}
