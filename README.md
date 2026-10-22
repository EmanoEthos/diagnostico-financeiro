# Diagnóstico Financeiro

Sistema web para consultores conduzirem o diagnóstico financeiro e de crédito
de empresas atendidas (metodologia SEBRAE): faturamento, Simples Nacional,
movimentação bancária, indicadores, capital de giro, fluxo projetado,
precificação e simulação de crédito.

## Situação

| Etapa | Conteúdo | Status |
| --- | --- | --- |
| 1 | Login com 2FA obrigatório, cadastro de empresas, auditoria | ✅ pronta |
| 2 | Faturamento mensal, RBT12, alíquota efetiva e DAS do Simples | próxima |
| 3 | Importação e classificação de extrato bancário | |
| 4 | Notas fiscais: concentração e ticket médio | |
| 5 | Indicadores, capital de giro e fluxo projetado | |
| 6 | Painel do diagnóstico e relatório em PDF | |

## Segurança

- **Cada consultor só acessa as próprias empresas.** A regra está no banco
  (Row Level Security do Postgres), não só nas telas.
- **2FA obrigatório.** Sem o código do aplicativo autenticador o banco não
  devolve nenhum dado, mesmo com a senha correta.
- **Auditoria:** toda inclusão, alteração e exclusão fica registrada com autor,
  data e o antes/depois.
- **Sem cadastro público:** contas de consultor são criadas pelo administrador
  no painel do Supabase.
- Os testes automáticos usam apenas dados fictícios. **Nunca** coloque planilhas
  ou dados reais de clientes no repositório.

## Como colocar no ar

### 1. Supabase (banco de dados e login)

1. Crie uma conta em [supabase.com](https://supabase.com) e um projeto novo.
   Região: **South America (São Paulo)**. Guarde a senha do banco num
   gerenciador de senhas.
2. Em **SQL Editor**, cole e execute o conteúdo de cada arquivo de
   `supabase/migrations/`, em ordem de nome.
3. Em **Authentication → Sign In / Providers**, **desligue** "Allow new users to
   sign up" e deixe ligado "Confirm email".
4. Em **Authentication → Multi-Factor**, confirme que **TOTP** está habilitado.
5. Em **Authentication → Users → Add user → Send invitation**, convide o seu
   e-mail. Você define a senha pelo link recebido.
6. Em **Project Settings → API**, copie a **Project URL** e a chave
   **publishable**. A chave **secret** nunca vai para o app.

### 2. Vercel (hospedagem)

1. Crie uma conta em [vercel.com](https://vercel.com) entrando com o GitHub.
2. **Add New → Project**, escolha este repositório.
3. Em **Environment Variables**, cadastre as duas variáveis do arquivo
   `.env.example` com os valores do passo 1.6.
4. Clique em **Deploy**. Depois, no Supabase, em **Authentication → URL
   Configuration**, coloque o endereço do site em "Site URL".

No primeiro acesso, o sistema pede para cadastrar o aplicativo autenticador
(Google Authenticator, Microsoft Authenticator etc.).

> Perdeu o celular? No Supabase, em **Authentication → Users**, abra o usuário
> e remova o fator de MFA. No próximo login o sistema pede um cadastro novo.

## Desenvolvimento

```bash
npm install
cp .env.example .env.local   # preencha com os dados do Supabase
npm run dev                  # http://localhost:3000

npm test                     # testes de cálculo e validação
npm run test:db              # testes de segurança do banco (precisa de Postgres local)
npm run typecheck
npm run lint
```

Estrutura:

```
supabase/migrations/   estrutura do banco e regras de acesso
supabase/tests/        testes de isolamento entre consultores e de 2FA
src/proxy.ts           renova a sessão e redireciona para login/2FA
src/lib/               regras de negócio (CNPJ, validações) e acesso ao Supabase
src/app/(auth)/        login e 2FA
src/app/(app)/         telas internas (empresas, …)
```
