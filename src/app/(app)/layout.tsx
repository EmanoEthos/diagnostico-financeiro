import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { sair } from "../(auth)/acoes";
import { exigirConsultor } from "@/lib/supabase/server";

async function EmailConsultor() {
  const { email } = await exigirConsultor();
  return <span className="hidden sm:inline">{email}</span>;
}

export default function LayoutApp({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/empresas" className="font-semibold text-teal-800">
            Diagnóstico Financeiro
          </Link>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <Suspense>
              <EmailConsultor />
            </Suspense>
            <form action={sair}>
              <button className="underline">Sair</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
