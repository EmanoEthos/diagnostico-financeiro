"use client";

import { useActionState, useState, useTransition } from "react";
import { concluirCadastro2fa, iniciarCadastro2fa, sair, type EstadoCadastro2fa } from "../../acoes";
import { Alerta, Botao, CartaoAuth, Campo, Entrada } from "@/components/ui";

export default function PaginaConfigurar2fa() {
  const [cadastro, setCadastro] = useState<EstadoCadastro2fa>({});
  const [gerando, iniciar] = useTransition();
  const [estado, acao, enviando] = useActionState(concluirCadastro2fa, {});

  return (
    <CartaoAuth titulo="Ative a verificação em dois fatores">
      <p className="mb-4 text-sm text-slate-600">
        Por segurança, o sistema só libera os dados dos clientes com um segundo fator. Instale um aplicativo autenticador
        no celular (Google Authenticator, Microsoft Authenticator ou similar).
      </p>

      {!cadastro.fatorId ? (
        <div className="flex flex-col gap-4">
          {cadastro.erro && <Alerta>{cadastro.erro}</Alerta>}
          <Botao disabled={gerando} onClick={() => iniciar(async () => setCadastro(await iniciarCadastro2fa()))}>
            {gerando ? "Gerando…" : "Gerar QR code"}
          </Botao>
        </div>
      ) : (
        <form action={acao} className="flex flex-col gap-4">
          <input type="hidden" name="fatorId" value={cadastro.fatorId} />
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG em data URL gerado pelo Supabase */}
          <img src={cadastro.qrCode} alt="QR code para o aplicativo autenticador" className="mx-auto h-48 w-48" />
          <p className="text-center text-xs text-slate-500">
            Não consegue ler? Digite a chave: <code className="break-all font-mono">{cadastro.segredo}</code>
          </p>
          <Campo rotulo="Código de 6 números mostrado no aplicativo">
            <Entrada name="codigo" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required />
          </Campo>
          {estado.erro && <Alerta>{estado.erro}</Alerta>}
          <Botao type="submit" disabled={enviando}>
            {enviando ? "Confirmando…" : "Confirmar e ativar"}
          </Botao>
        </form>
      )}

      <form action={sair} className="mt-4">
        <button className="text-sm text-slate-600 underline">Sair</button>
      </form>
    </CartaoAuth>
  );
}
