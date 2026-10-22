"use client";

import { useActionState } from "react";
import { entrar } from "../acoes";
import { Alerta, Botao, CartaoAuth, Campo, Entrada } from "@/components/ui";

export default function PaginaLogin() {
  const [estado, acao, enviando] = useActionState(entrar, {});

  return (
    <CartaoAuth titulo="Entrar">
      <form action={acao} className="flex flex-col gap-4">
        <Campo rotulo="E-mail">
          <Entrada name="email" type="email" autoComplete="email" defaultValue={estado.email} required />
        </Campo>
        <Campo rotulo="Senha">
          <Entrada name="senha" type="password" autoComplete="current-password" required />
        </Campo>
        {estado.erro && <Alerta>{estado.erro}</Alerta>}
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </Botao>
      </form>
    </CartaoAuth>
  );
}
