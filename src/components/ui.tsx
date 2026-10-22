import type { ComponentProps, ReactNode } from "react";

export function Campo({
  rotulo,
  erro,
  ajuda,
  children,
}: {
  rotulo: string;
  erro?: string;
  ajuda?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{rotulo}</span>
      {children}
      {ajuda && !erro && <span className="text-xs text-slate-500">{ajuda}</span>}
      {erro && <span className="text-xs text-red-700">{erro}</span>}
    </label>
  );
}

const estiloEntrada =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-100";

export function Entrada(props: ComponentProps<"input">) {
  return <input {...props} className={`${estiloEntrada} ${props.className ?? ""}`} />;
}

export function Selecao(props: ComponentProps<"select">) {
  return <select {...props} className={`${estiloEntrada} ${props.className ?? ""}`} />;
}

export function AreaTexto(props: ComponentProps<"textarea">) {
  return <textarea {...props} className={`${estiloEntrada} ${props.className ?? ""}`} />;
}

const variantes = {
  primario: "bg-teal-700 text-white hover:bg-teal-800",
  secundario: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
  perigo: "bg-red-700 text-white hover:bg-red-800",
};

export function Botao({ variante = "primario", ...props }: ComponentProps<"button"> & { variante?: keyof typeof variantes }) {
  return (
    <button
      {...props}
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variantes[variante]} ${props.className ?? ""}`}
    />
  );
}

export function Alerta({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {children}
    </p>
  );
}

export function CartaoAuth({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Diagnóstico Financeiro</p>
        <h1 className="mt-1 mb-5 text-xl font-semibold text-slate-900">{titulo}</h1>
        {children}
      </div>
    </main>
  );
}
