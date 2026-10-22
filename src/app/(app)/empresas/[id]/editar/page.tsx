import { Suspense } from "react";
import { FormularioEmpresa } from "../../formulario-empresa";
import { buscarEmpresa } from "../buscar";
import { Carregando } from "@/components/carregando";

type Params = Promise<{ id: string }>;

export default function PaginaEditarEmpresa({ params }: { params: Params }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Editar empresa</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <Suspense fallback={<Carregando />}>
          <EditarEmpresa params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function EditarEmpresa({ params }: { params: Params }) {
  const { id } = await params;
  return <FormularioEmpresa empresa={await buscarEmpresa(id)} />;
}
