import { describe, expect, it } from "vitest";
import { cnpjValido, formatarCnpj, limparCnpj } from "./cnpj";

describe("cnpjValido", () => {
  it("aceita CNPJs numéricos válidos, com ou sem pontuação", () => {
    expect(cnpjValido("11.222.333/0001-81")).toBe(true);
    expect(cnpjValido("11444777000161")).toBe(true);
  });

  it("aceita o CNPJ alfanumérico do exemplo da Receita Federal", () => {
    expect(cnpjValido("12.ABC.345/01DE-35")).toBe(true);
    expect(cnpjValido("12abc34501de35")).toBe(true);
  });

  it("recusa dígito verificador errado", () => {
    expect(cnpjValido("11.222.333/0001-82")).toBe(false);
    expect(cnpjValido("12.ABC.345/01DE-36")).toBe(false);
  });

  it("recusa tamanho errado, letras no DV e sequências repetidas", () => {
    expect(cnpjValido("1122233300018")).toBe(false);
    expect(cnpjValido("12ABC34501DEA5")).toBe(false);
    expect(cnpjValido("00000000000000")).toBe(false);
    expect(cnpjValido("")).toBe(false);
  });
});

describe("formatação", () => {
  it("limpa e formata", () => {
    expect(limparCnpj("12.abc.345/01de-35")).toBe("12ABC34501DE35");
    expect(formatarCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });
});
