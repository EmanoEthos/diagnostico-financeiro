function obrigatoria(nome: string, valor: string | undefined): string {
  if (!valor) throw new Error(`Variável de ambiente ${nome} não definida. Veja o README.`);
  return valor;
}

export const env = {
  get supabaseUrl() {
    return obrigatoria("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabaseChave() {
    return obrigatoria("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  },
};
