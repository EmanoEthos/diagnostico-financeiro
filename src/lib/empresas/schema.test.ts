import { describe, expect, it } from "vitest";
import { CAMPOS_EMPRESA, lerFormularioEmpresa } from "./schema";

function formulario(valores: Record<string, string>) {
  const dados = new FormData();
  for (const campo of CAMPOS_EMPRESA) dados.set(campo, "");
  for (const [campo, valor] of Object.entries(valores)) dados.set(campo, valor);
  return dados;
}

const minimo = {
  razao_social: "  Empresa Fictícia Ltda ",
  cnpj: "11.222.333/0001-81",
  regime_tributario: "simples_nacional",
  anexo_simples: "III",
};

describe("lerFormularioEmpresa", () => {
  it("normaliza um cadastro mínimo válido", () => {
    const { resultado } = lerFormularioEmpresa(formulario(minimo));
    expect(resultado.success).toBe(true);
    expect(resultado.data).toMatchObject({
      razao_social: "Empresa Fictícia Ltda",
      cnpj: "11222333000181",
      anexo_simples: "III",
      nome_fantasia: null,
      data_abertura: null,
      uf: null,
      responsavel_email: null,
    });
  });

  it("recusa CNPJ inválido", () => {
    const { resultado } = lerFormularioEmpresa(formulario({ ...minimo, cnpj: "11.222.333/0001-80" }));
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0].path).toEqual(["cnpj"]);
  });

  it("exige anexo no Simples Nacional e proíbe fora dele", () => {
    const semAnexo = lerFormularioEmpresa(formulario({ ...minimo, anexo_simples: "" })).resultado;
    expect(semAnexo.error?.issues.map((i) => i.path[0])).toContain("anexo_simples");

    const presumido = lerFormularioEmpresa(formulario({ ...minimo, regime_tributario: "lucro_presumido" })).resultado;
    expect(presumido.error?.issues.map((i) => i.path[0])).toContain("anexo_simples");

    const ok = lerFormularioEmpresa(
      formulario({ ...minimo, regime_tributario: "lucro_presumido", anexo_simples: "" }),
    ).resultado;
    expect(ok.success).toBe(true);
  });

  it("valida e-mail, UF e data quando preenchidos", () => {
    const { resultado } = lerFormularioEmpresa(
      formulario({ ...minimo, responsavel_email: "nao-e-email", uf: "XX", data_abertura: "31/12/2024" }),
    );
    expect(resultado.error?.issues.map((i) => i.path[0]).sort()).toEqual(["data_abertura", "responsavel_email", "uf"]);
  });
});
