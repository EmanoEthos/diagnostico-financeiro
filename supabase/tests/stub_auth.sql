-- Reproduz o mínimo do Supabase (papéis, auth.users, auth.uid(), auth.jwt())
-- para testar as migrações num Postgres comum. Só para testes locais.

create role anon nologin;
create role authenticated nologin;

create schema auth;
grant usage on schema auth to anon, authenticated;

create table auth.users (id uuid primary key);

create function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid $$;

create function auth.jwt() returns jsonb
language sql stable
as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;

grant usage on schema public to anon, authenticated;
