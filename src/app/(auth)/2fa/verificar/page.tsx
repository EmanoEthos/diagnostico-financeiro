"use client";

import { useActionState } from "react";
import { sair, verificar2fa } from "../../acoes";
import { Alerta, Botao, CartaoAuth, Campo, Entrada } from "@/components/ui";

export default function PaginaVerificar2fa() {
  const [estado, acao, enviando] = useActionState(verificar2fa, {});

  return (
    <CartaoAuth titulo="Verificação em dois fatores">
      <form action={acao} className="flex flex-col gap-4">
        <Campo rotulo="Código do aplicativo autenticador">
          <Entrada
            name="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            autoFocus
          />
        </Campo>
        {estado.erro && <Alerta>{estado.erro}</Alerta>}
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Verificando…" : "Verificar"}
        </Botao>
      </form>
      <form action={sair} className="mt-4">
        <button className="text-sm text-slate-600 underline">Sair</button>
      </form>
    </CartaoAuth>
  );
}
