"use client";

import { useActionState } from "react";
import { excluirEmpresa } from "../acoes";
import { Alerta, Botao, Campo, Entrada } from "@/components/ui";

export function ExcluirEmpresa({ id }: { id: string }) {
  const [estado, acao, enviando] = useActionState(excluirEmpresa.bind(null, id), {});

  return (
    <details className="rounded-lg border border-red-200 bg-white p-6">
      <summary className="cursor-pointer text-sm font-medium text-red-800">Excluir empresa</summary>
      <form action={acao} className="mt-4 flex max-w-md flex-col gap-3">
        <p className="text-sm text-slate-600">
          A exclusão é definitiva e apaga todos os dados desta empresa. Se só quer tirá-la da lista, use “Arquivar”.
        </p>
        <Campo rotulo="Digite o CNPJ da empresa para confirmar">
          <Entrada name="confirmacao" autoComplete="off" required />
        </Campo>
        {estado.erro && <Alerta>{estado.erro}</Alerta>}
        <Botao variante="perigo" type="submit" disabled={enviando}>
          {enviando ? "Excluindo…" : "Excluir definitivamente"}
        </Botao>
      </form>
    </details>
  );
}
