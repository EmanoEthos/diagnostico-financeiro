import { FormularioEmpresa } from "../formulario-empresa";

export default function PaginaNovaEmpresa() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Nova empresa</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <FormularioEmpresa />
      </div>
    </div>
  );
}
