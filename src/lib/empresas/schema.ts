import { z } from "zod";
import { cnpjValido, limparCnpj } from "@/lib/cnpj";

export const REGIMES = {
  mei: "MEI",
  simples_nacional: "Simples Nacional",
  lucro_presumido: "Lucro Presumido",
  lucro_real: "Lucro Real",
} as const;

export const ANEXOS = ["I", "II", "III", "IV", "V"] as const;

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;

// Campos opcionais chegam do formulário como "" e viram null no banco.
const opcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres`)
    .transform((v) => (v === "" ? null : v));

export const empresaSchema = z
  .object({
    razao_social: z.string().trim().min(2, "Informe a razão social").max(200, "Use no máximo 200 caracteres"),
    nome_fantasia: opcional(200),
    cnpj: z
      .string()
      .transform(limparCnpj)
      .refine(cnpjValido, "CNPJ inválido – confira os dígitos"),
    data_abertura: z
      .string()
      .trim()
      .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Data inválida")
      .transform((v) => (v === "" ? null : v)),
    regime_tributario: z.enum(Object.keys(REGIMES) as [keyof typeof REGIMES], "Escolha o regime tributário"),
    anexo_simples: z
      .enum(["", ...ANEXOS], "Anexo inválido")
      .transform((v) => (v === "" ? null : v)),
    atividade: opcional(300),
    responsavel_nome: opcional(200),
    responsavel_telefone: opcional(30),
    responsavel_email: z
      .string()
      .trim()
      .refine((v) => v === "" || z.email().safeParse(v).success, "E-mail inválido")
      .transform((v) => (v === "" ? null : v)),
    cidade: opcional(100),
    uf: z.enum(["", ...UFS], "UF inválida").transform((v) => (v === "" ? null : v)),
    programa: opcional(200),
    observacoes: opcional(5000),
  })
  .superRefine((empresa, ctx) => {
    if (empresa.regime_tributario === "simples_nacional" && !empresa.anexo_simples) {
      ctx.addIssue({ code: "custom", path: ["anexo_simples"], message: "Informe o anexo do Simples Nacional" });
    }
    if (empresa.regime_tributario !== "simples_nacional" && empresa.anexo_simples) {
      ctx.addIssue({ code: "custom", path: ["anexo_simples"], message: "Anexo só se aplica ao Simples Nacional" });
    }
  });

export type EmpresaEntrada = z.input<typeof empresaSchema>;
export type EmpresaDados = z.output<typeof empresaSchema>;

export type Empresa = EmpresaDados & {
  id: string;
  status: "ativa" | "arquivada";
  criado_em: string;
  atualizado_em: string;
};

export const CAMPOS_EMPRESA = [
  "razao_social", "nome_fantasia", "cnpj", "data_abertura", "regime_tributario", "anexo_simples",
  "atividade", "responsavel_nome", "responsavel_telefone", "responsavel_email", "cidade", "uf",
  "programa", "observacoes",
] as const satisfies readonly (keyof EmpresaEntrada)[];

export function lerFormularioEmpresa(formData: FormData) {
  const entrada = Object.fromEntries(CAMPOS_EMPRESA.map((campo) => [campo, String(formData.get(campo) ?? "")]));
  return { entrada, resultado: empresaSchema.safeParse(entrada) };
}
