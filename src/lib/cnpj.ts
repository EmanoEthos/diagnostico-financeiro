// Validação de CNPJ numérico e alfanumérico (IN RFB 2.229/2024, vigente a partir de jul/2026).
// Os 12 primeiros caracteres podem ser 0-9 ou A-Z; os 2 dígitos verificadores são sempre numéricos.
// Cada caractere vale (código ASCII − 48), o que mantém o cálculo antigo para CNPJs só com números.

const PESOS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

export function limparCnpj(valor: string): string {
  return valor.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

function digitoVerificador(base: string, pesos: number[]): number {
  const soma = [...base].reduce((total, caractere, i) => total + (caractere.charCodeAt(0) - 48) * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function cnpjValido(valor: string): boolean {
  const cnpj = limparCnpj(valor);
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(cnpj)) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const dv1 = digitoVerificador(cnpj.slice(0, 12), PESOS_DV1);
  const dv2 = digitoVerificador(cnpj.slice(0, 12) + dv1, PESOS_DV2);
  return cnpj.endsWith(`${dv1}${dv2}`);
}

export function formatarCnpj(valor: string): string {
  const cnpj = limparCnpj(valor);
  if (cnpj.length !== 14) return valor;
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}
