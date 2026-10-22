import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

// Renova a sessão a cada navegação e faz o primeiro filtro de acesso.
// A garantia real fica em exigirConsultor() e nas regras do banco (RLS).

const ROTAS_PUBLICAS = ["/login"];
const ROTAS_2FA = ["/2fa/configurar", "/2fa/verificar"];

export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl, env.supabaseChave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesParaGravar, headers) {
        for (const { name, value } of cookiesParaGravar) request.cookies.set(name, value);
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of cookiesParaGravar) resposta.cookies.set(name, value, options);
        for (const [chave, valor] of Object.entries(headers ?? {})) resposta.headers.set(chave, valor);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const caminho = request.nextUrl.pathname;
  const publica = ROTAS_PUBLICAS.some((rota) => caminho.startsWith(rota));

  if (!data && !publica) {
    return redirecionar(request, resposta, "/login");
  }

  if (data && !publica && !ROTAS_2FA.some((rota) => caminho.startsWith(rota))) {
    const { data: nivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (nivel?.currentLevel !== "aal2") {
      return redirecionar(request, resposta, nivel?.nextLevel === "aal2" ? "/2fa/verificar" : "/2fa/configurar");
    }
  }

  return resposta;
}

function redirecionar(request: NextRequest, resposta: NextResponse, destino: string) {
  const redirecionamento = NextResponse.redirect(new URL(destino, request.url));
  for (const cookie of resposta.cookies.getAll()) redirecionamento.cookies.set(cookie);
  return redirecionamento;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
