import Link from "next/link";
import { Suspense } from "react";
import { alterarStatusEmpresa } from "../acoes";
import { buscarEmpresa } from "./buscar";
import { ExcluirEmpresa } from "./excluir-empresa";
import { formatarCnpj } from "@/lib/cnpj";
import { REGIMES } from "@/lib/empresas/schema";
import { Carregando } from "@/components/carregando";

function Item({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{rotulo}</dt>
      <dd className="mt-0.5 whitespace-pre-line text-slate-900">{valor || "–"}</dd>
    </div>
  );
}

const data = (iso: string | null) => (iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR") : null);

type Params = Promise<{ id: string }>;

export default function PaginaEmpresa({ params }: { params: Params }) {
  return (
    <Suspense fallback={<Carregando />}>
      <DetalheEmpresa params={params} />
    </Suspense>
  );
}

async function DetalheEmpresa({ params }: { params: Params }) {
  const { id } = await params;
  const empresa = await buscarEmpresa(id);
  const arquivada = empresa.status === "arquivada";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/empresas" className="text-sm text-slate-600 underline">
          ← Empresas
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{empresa.nome_fantasia || empresa.razao_social}</h1>
            <p className="font-mono text-sm text-slate-600">{formatarCnpj(empresa.cnpj)}</p>
            {arquivada && (
              <span className="mt-2 inline-block rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">Arquivada</span>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              href={`/empresas/${empresa.id}/editar`}
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              Editar
            </Link>
            <form action={alterarStatusEmpresa.bind(null, empresa.id, arquivada ? "ativa" : "arquivada")}>
              <button className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
                {arquivada ? "Reativar" : "Arquivar"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <dl className="grid gap-5 sm:grid-cols-3">
          <Item rotulo="Razão social" valor={empresa.razao_social} />
          <Item rotulo="Nome fantasia" valor={empresa.nome_fantasia} />
          <Item rotulo="Data de abertura" valor={data(empresa.data_abertura)} />
          <Item
            rotulo="Regime tributário"
            valor={`${REGIMES[empresa.regime_tributario]}${empresa.anexo_simples ? ` · Anexo ${empresa.anexo_simples}` : ""}`}
          />
          <Item rotulo="Atividade" valor={empresa.atividade} />
          <Item rotulo="Cidade" valor={empresa.cidade && `${empresa.cidade}${empresa.uf ? `/${empresa.uf}` : ""}`} />
          <Item rotulo="Responsável" valor={empresa.responsavel_nome} />
          <Item rotulo="Telefone" valor={empresa.responsavel_telefone} />
          <Item rotulo="E-mail" valor={empresa.responsavel_email} />
          <Item rotulo="Programa / consultoria" valor={empresa.programa} />
          <div className="sm:col-span-2">
            <Item rotulo="Observações" valor={empresa.observacoes} />
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        <h2 className="mb-1 font-semibold text-slate-900">Diagnóstico</h2>
        Faturamento, Simples Nacional, extratos e indicadores entram nas próximas etapas.
      </section>

      <ExcluirEmpresa id={empresa.id} />

      <p className="text-xs text-slate-500">
        Cadastrada em {new Date(empresa.criado_em).toLocaleString("pt-BR")} · atualizada em{" "}
        {new Date(empresa.atualizado_em).toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
