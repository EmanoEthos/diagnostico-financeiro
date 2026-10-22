-- Testes de isolamento entre consultores e de exigência de 2FA.
-- Cada bloco falha com exception se a regra não estiver valendo.

\set ON_ERROR_STOP on

insert into auth.users (id) values
  ('00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-00000000000b');

create function pg_temp.entrar(usuario text, aal text) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', usuario, 'aal', aal, 'role', 'authenticated')::text, false);
  set role authenticated;
end;
$$;

-- Consultor A, com 2FA, cadastra uma empresa (CNPJ fictício).
select pg_temp.entrar('00000000-0000-0000-0000-00000000000a', 'aal2');
insert into public.empresas (razao_social, cnpj, anexo_simples)
values ('Empresa Fictícia A Ltda', '11222333000181', 'III');
reset role;

-- Consultor B, com 2FA, cadastra a sua.
select pg_temp.entrar('00000000-0000-0000-0000-00000000000b', 'aal2');
insert into public.empresas (razao_social, cnpj) values ('Empresa Fictícia B Ltda', '11444777000161');

do $$
begin
  if (select count(*) from public.empresas) <> 1 then
    raise exception 'FALHOU: consultor B enxerga empresas de outro consultor';
  end if;

  update public.empresas set razao_social = 'invadida' where razao_social like '%A Ltda';
  delete from public.empresas where razao_social like '%A Ltda';
  -- Nada acontece porque a linha é invisível para B; conferido abaixo como superusuário.

  begin
    insert into public.empresas (consultor_id, razao_social, cnpj)
    values ('00000000-0000-0000-0000-00000000000a', 'Plantada por B', '11222333000181');
    raise exception 'FALHOU: consultor B cadastrou empresa em nome de A';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

do $$
begin
  if not exists (select 1 from public.empresas where razao_social = 'Empresa Fictícia A Ltda') then
    raise exception 'FALHOU: consultor B alterou ou excluiu empresa de A';
  end if;
end;
$$;

-- Consultor A sem 2FA (aal1) não vê nada nem consegue gravar.
select pg_temp.entrar('00000000-0000-0000-0000-00000000000a', 'aal1');
do $$
begin
  if (select count(*) from public.empresas) <> 0 then
    raise exception 'FALHOU: dados visíveis sem 2FA';
  end if;
  begin
    insert into public.empresas (razao_social, cnpj) values ('Sem 2FA', '11444777000161');
    raise exception 'FALHOU: cadastro permitido sem 2FA';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

-- Visitante sem login não acessa a tabela.
set role anon;
do $$
begin
  begin
    perform 1 from public.empresas;
    raise exception 'FALHOU: visitante anônimo leu empresas';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

-- Consultor A não pode transferir a empresa para B.
select pg_temp.entrar('00000000-0000-0000-0000-00000000000a', 'aal2');
do $$
begin
  begin
    update public.empresas set consultor_id = '00000000-0000-0000-0000-00000000000b';
    raise exception 'FALHOU: empresa transferida para outro consultor';
  exception when raise_exception or insufficient_privilege then
    if sqlerrm like 'FALHOU%' then raise; end if;
  end;

  -- CNPJ duplicado para o mesmo consultor é recusado.
  begin
    insert into public.empresas (razao_social, cnpj) values ('Duplicada', '11222333000181');
    raise exception 'FALHOU: CNPJ duplicado aceito';
  exception when unique_violation then null;
  end;

  -- O consultor não acessa o log de auditoria diretamente.
  begin
    perform 1 from auditoria.log;
    raise exception 'FALHOU: log de auditoria exposto';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

-- Auditoria registrou os dois cadastros com o autor certo.
do $$
begin
  if (select count(*) from auditoria.log where operacao = 'INSERT') <> 2 then
    raise exception 'FALHOU: auditoria não registrou os cadastros';
  end if;
  if exists (select 1 from auditoria.log where usuario_id is distinct from consultor_id) then
    raise exception 'FALHOU: auditoria com autor errado';
  end if;
end;
$$;

select 'OK: todos os testes de segurança do banco passaram' as resultado;
