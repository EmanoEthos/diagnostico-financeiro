import Link from "next/link";
import { Suspense } from "react";
import { formatarCnpj } from "@/lib/cnpj";
import { REGIMES, type Empresa } from "@/lib/empresas/schema";
import { exigirConsultor } from "@/lib/supabase/server";
import { Entrada } from "@/components/ui";
import { Carregando } from "@/components/carregando";

type Filtros = Promise<{ busca?: string; status?: string }>;

export default function PaginaEmpresas({ searchParams }: { searchParams: Filtros }) {
  return (
    <Suspense fallback={<Carregando />}>
      <ListaEmpresas searchParams={searchParams} />
    </Suspense>
  );
}

async function ListaEmpresas({ searchParams }: { searchParams: Filtros }) {
  const { supabase } = await exigirConsultor();
  const { busca = "", status } = await searchParams;
  const arquivadas = status === "arquivada";

  let consulta = supabase
    .from("empresas")
    .select("id, razao_social, nome_fantasia, cnpj, regime_tributario, anexo_simples, cidade, uf")
    .eq("status", arquivadas ? "arquivada" : "ativa")
    .order("razao_social");

  const termo = busca.trim().replace(/[%_,()]/g, "");
  if (termo) {
    const digitos = termo.toUpperCase().replace(/[^0-9A-Z]/g, "");
    const filtros = [`razao_social.ilike.%${termo}%`, `nome_fantasia.ilike.%${termo}%`];
    if (digitos.length >= 3) filtros.push(`cnpj.ilike.%${digitos}%`);
    consulta = consulta.or(filtros.join(","));
  }

  const { data, error } = await consulta;
  const empresas = (data ?? []) as Pick<
    Empresa,
    "id" | "razao_social" | "nome_fantasia" | "cnpj" | "regime_tributario" | "anexo_simples" | "cidade" | "uf"
  >[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Empresas atendidas</h1>
        <Link href="/empresas/nova" className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800">
          Nova empresa
        </Link>
      </div>

      <form className="flex flex-wrap items-center gap-3">
        <Entrada name="busca" defaultValue={busca} placeholder="Buscar por nome ou CNPJ" className="w-full sm:w-80" />
        {arquivadas && <input type="hidden" name="status" value="arquivada" />}
        <button className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm">Buscar</button>
        <Link href={arquivadas ? "/empresas" : "/empresas?status=arquivada"} className="text-sm text-slate-600 underline">
          {arquivadas ? "Ver ativas" : "Ver arquivadas"}
        </Link>
      </form>

      {error ? (
        <p className="text-sm text-red-700">Não foi possível carregar as empresas.</p>
      ) : empresas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          {termo
            ? "Nenhuma empresa encontrada para essa busca."
            : arquivadas
              ? "Nenhuma empresa arquivada."
              : "Nenhuma empresa cadastrada ainda. Comece pelo botão “Nova empresa”."}
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {empresas.map((empresa) => (
            <li key={empresa.id}>
              <Link href={`/empresas/${empresa.id}`} className="flex flex-col gap-1 px-4 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{empresa.nome_fantasia || empresa.razao_social}</p>
                  {empresa.nome_fantasia && <p className="text-sm text-slate-500">{empresa.razao_social}</p>}
                </div>
                <div className="text-sm text-slate-600 sm:text-right">
                  <p className="font-mono">{formatarCnpj(empresa.cnpj)}</p>
                  <p>
                    {REGIMES[empresa.regime_tributario]}
                    {empresa.anexo_simples && ` · Anexo ${empresa.anexo_simples}`}
                    {empresa.cidade && ` · ${empresa.cidade}${empresa.uf ? `/${empresa.uf}` : ""}`}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
