"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { salvarEmpresa, type EstadoEmpresa } from "./acoes";
import { ANEXOS, CAMPOS_EMPRESA, REGIMES, UFS, type Empresa } from "@/lib/empresas/schema";
import { formatarCnpj } from "@/lib/cnpj";
import { Alerta, AreaTexto, Botao, Campo, Entrada, Selecao } from "@/components/ui";

type Props = { empresa?: Empresa };

function valoresIniciais(empresa?: Empresa): Record<string, string> {
  const valores = Object.fromEntries(CAMPOS_EMPRESA.map((c) => [c, String(empresa?.[c] ?? "")]));
  if (!empresa) {
    valores.regime_tributario = "simples_nacional";
    valores.anexo_simples = "III";
  } else {
    valores.cnpj = formatarCnpj(empresa.cnpj);
  }
  return valores;
}

export function FormularioEmpresa({ empresa }: Props) {
  const [estado, acao, enviando] = useActionState<EstadoEmpresa, FormData>(
    salvarEmpresa.bind(null, empresa?.id ?? null),
    {},
  );
  const v = estado.valores ?? valoresIniciais(empresa);
  const e = estado.erros ?? {};
  const [regime, setRegime] = useState(v.regime_tributario);

  return (
    <form action={acao} className="flex flex-col gap-6" noValidate>
      {estado.erro && <Alerta>{estado.erro}</Alerta>}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-base font-semibold text-slate-900">Dados da empresa</legend>
        <Campo rotulo="Razão social *" erro={e.razao_social}>
          <Entrada name="razao_social" defaultValue={v.razao_social} required maxLength={200} />
        </Campo>
        <Campo rotulo="Nome fantasia" erro={e.nome_fantasia}>
          <Entrada name="nome_fantasia" defaultValue={v.nome_fantasia} maxLength={200} />
        </Campo>
        <Campo rotulo="CNPJ *" erro={e.cnpj} ajuda="Aceita o novo CNPJ com letras">
          <Entrada name="cnpj" defaultValue={v.cnpj} required maxLength={18} placeholder="00.000.000/0000-00" />
        </Campo>
        <Campo rotulo="Data de abertura" erro={e.data_abertura}>
          <Entrada name="data_abertura" type="date" defaultValue={v.data_abertura} />
        </Campo>
        <Campo rotulo="Regime tributário *" erro={e.regime_tributario}>
          <Selecao name="regime_tributario" defaultValue={v.regime_tributario} onChange={(ev) => setRegime(ev.target.value)}>
            {Object.entries(REGIMES).map(([valor, nome]) => (
              <option key={valor} value={valor}>
                {nome}
              </option>
            ))}
          </Selecao>
        </Campo>
        {regime === "simples_nacional" ? (
          <Campo rotulo="Anexo do Simples Nacional *" erro={e.anexo_simples} ajuda="Serviços em geral: Anexo III">
            <Selecao name="anexo_simples" defaultValue={v.anexo_simples || "III"}>
              {ANEXOS.map((anexo) => (
                <option key={anexo} value={anexo}>
                  Anexo {anexo}
                </option>
              ))}
            </Selecao>
          </Campo>
        ) : (
          <input type="hidden" name="anexo_simples" value="" />
        )}
        <Campo rotulo="Atividade principal" erro={e.atividade}>
          <Entrada name="atividade" defaultValue={v.atividade} maxLength={300} placeholder="Ex.: instalação de gás" />
        </Campo>
        <div className="grid grid-cols-[1fr_6rem] gap-4">
          <Campo rotulo="Cidade" erro={e.cidade}>
            <Entrada name="cidade" defaultValue={v.cidade} maxLength={100} />
          </Campo>
          <Campo rotulo="UF" erro={e.uf}>
            <Selecao name="uf" defaultValue={v.uf}>
              <option value="">–</option>
              {UFS.map((uf) => (
                <option key={uf}>{uf}</option>
              ))}
            </Selecao>
          </Campo>
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-2 text-base font-semibold text-slate-900">Responsável</legend>
        <Campo rotulo="Nome" erro={e.responsavel_nome}>
          <Entrada name="responsavel_nome" defaultValue={v.responsavel_nome} maxLength={200} />
        </Campo>
        <Campo rotulo="Telefone" erro={e.responsavel_telefone}>
          <Entrada name="responsavel_telefone" type="tel" defaultValue={v.responsavel_telefone} maxLength={30} />
        </Campo>
        <Campo rotulo="E-mail" erro={e.responsavel_email}>
          <Entrada name="responsavel_email" type="email" defaultValue={v.responsavel_email} maxLength={200} />
        </Campo>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-2 text-base font-semibold text-slate-900">Atendimento</legend>
        <Campo rotulo="Programa / consultoria" erro={e.programa}>
          <Entrada name="programa" defaultValue={v.programa} maxLength={200} placeholder="Ex.: Finanças e Acesso ao Crédito" />
        </Campo>
        <Campo rotulo="Observações" erro={e.observacoes}>
          <AreaTexto name="observacoes" defaultValue={v.observacoes} rows={4} maxLength={5000} />
        </Campo>
      </fieldset>

      <div className="flex gap-3">
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar"}
        </Botao>
        <Link href={empresa ? `/empresas/${empresa.id}` : "/empresas"} className="self-center text-sm text-slate-600 underline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
