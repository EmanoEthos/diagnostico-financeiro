-- Etapa 1: cadastro de empresas atendidas, isoladas por consultor.
--
-- Regras de segurança:
--  * Cada consultor só enxerga e altera as próprias empresas (RLS por consultor_id).
--  * Nenhum dado é acessível sem login em dois fatores (política restritiva exigindo aal2).
--  * Toda inclusão, alteração e exclusão fica registrada em auditoria.log, que só o
--    próprio consultor pode ler e ninguém pode alterar pela API.

-- ---------------------------------------------------------------------------
-- Empresas
-- ---------------------------------------------------------------------------

create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  consultor_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  razao_social text not null check (length(trim(razao_social)) between 2 and 200),
  nome_fantasia text check (nome_fantasia is null or length(nome_fantasia) <= 200),
  -- 14 caracteres sem pontuação; aceita o CNPJ alfanumérico (a partir de jul/2026).
  cnpj text not null check (cnpj ~ '^[0-9A-Z]{12}[0-9]{2}$'),
  data_abertura date,
  regime_tributario text not null default 'simples_nacional'
    check (regime_tributario in ('mei', 'simples_nacional', 'lucro_presumido', 'lucro_real')),
  -- Anexo do Simples Nacional usado no cálculo da alíquota efetiva (LC 123/2006).
  anexo_simples text check (anexo_simples in ('I', 'II', 'III', 'IV', 'V')),
  atividade text check (atividade is null or length(atividade) <= 300),
  responsavel_nome text check (responsavel_nome is null or length(responsavel_nome) <= 200),
  responsavel_telefone text check (responsavel_telefone is null or length(responsavel_telefone) <= 30),
  responsavel_email text check (responsavel_email is null or length(responsavel_email) <= 200),
  cidade text check (cidade is null or length(cidade) <= 100),
  uf char(2) check (uf is null or uf ~ '^[A-Z]{2}$'),
  programa text check (programa is null or length(programa) <= 200),
  observacoes text check (observacoes is null or length(observacoes) <= 5000),
  status text not null default 'ativa' check (status in ('ativa', 'arquivada')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint empresas_anexo_so_no_simples
    check (anexo_simples is null or regime_tributario = 'simples_nacional'),
  constraint empresas_cnpj_unico_por_consultor unique (consultor_id, cnpj)
);

create index empresas_consultor_status_idx on public.empresas (consultor_id, status, razao_social);

create function public.definir_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger empresas_atualizado_em
  before update on public.empresas
  for each row execute function public.definir_atualizado_em();

-- O dono do registro não pode ser trocado depois de criado.
create function public.impedir_troca_de_consultor()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.consultor_id is distinct from old.consultor_id then
    raise exception 'Não é permitido transferir a empresa para outro consultor';
  end if;
  return new;
end;
$$;

create trigger empresas_consultor_fixo
  before update on public.empresas
  for each row execute function public.impedir_troca_de_consultor();

alter table public.empresas enable row level security;

revoke all on public.empresas from anon;
grant select, insert, update, delete on public.empresas to authenticated;

create policy "consultor lê as próprias empresas"
  on public.empresas for select to authenticated
  using (consultor_id = (select auth.uid()));

create policy "consultor cadastra empresas para si"
  on public.empresas for insert to authenticated
  with check (consultor_id = (select auth.uid()));

create policy "consultor altera as próprias empresas"
  on public.empresas for update to authenticated
  using (consultor_id = (select auth.uid()))
  with check (consultor_id = (select auth.uid()));

create policy "consultor exclui as próprias empresas"
  on public.empresas for delete to authenticated
  using (consultor_id = (select auth.uid()));

-- Política restritiva: soma-se às anteriores e bloqueia tudo sem 2FA.
create policy "exige login em dois fatores"
  on public.empresas as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- ---------------------------------------------------------------------------
-- Auditoria
-- ---------------------------------------------------------------------------

create schema auditoria;

create table auditoria.log (
  id bigint generated always as identity primary key,
  consultor_id uuid not null,
  usuario_id uuid,
  tabela text not null,
  registro_id uuid not null,
  operacao text not null check (operacao in ('INSERT', 'UPDATE', 'DELETE')),
  dados_antes jsonb,
  dados_depois jsonb,
  ocorrido_em timestamptz not null default now()
);

create index log_consultor_idx on auditoria.log (consultor_id, ocorrido_em desc);

create function auditoria.registrar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into auditoria.log (consultor_id, usuario_id, tabela, registro_id, operacao, dados_antes, dados_depois)
  values (
    coalesce(new.consultor_id, old.consultor_id),
    auth.uid(),
    tg_table_name,
    coalesce(new.id, old.id),
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

revoke all on function auditoria.registrar() from public, anon, authenticated;

create trigger empresas_auditoria
  after insert or update or delete on public.empresas
  for each row execute function auditoria.registrar();

alter table auditoria.log enable row level security;

revoke all on schema auditoria from public, anon;
revoke all on auditoria.log from public, anon, authenticated;
-- O log não fica exposto na API por enquanto; quando houver tela de histórico,
-- liberar "usage" no schema e "select" na tabela para authenticated.
create policy "consultor lê o próprio histórico"
  on auditoria.log for select to authenticated
  using (consultor_id = (select auth.uid()) and (select auth.jwt() ->> 'aal') = 'aal2');
