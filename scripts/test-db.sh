#!/usr/bin/env bash
# Sobe um Postgres temporário, aplica as migrações e roda os testes de segurança.
# Uso: npm run test:db   (requer Postgres 15+ instalado localmente)
set -euo pipefail

raiz="$(cd "$(dirname "$0")/.." && pwd)"
bin="${PG_BIN:-$(pg_config --bindir)}"
dir="$(mktemp -d)"
porta="${PG_TEST_PORT:-54329}"

executar() {
  if [ "$(id -u)" = "0" ]; then runuser -u postgres -- "$@"; else "$@"; fi
}

[ "$(id -u)" = "0" ] && chown postgres "$dir"
trap 'executar "$bin/pg_ctl" -D "$dir/data" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$dir"' EXIT

executar "$bin/initdb" -D "$dir/data" -U postgres -A trust >/dev/null
executar "$bin/pg_ctl" -D "$dir/data" -o "-p $porta -k $dir" -l "$dir/log" start -w >/dev/null

psql_teste() {
  executar "$bin/psql" -h "$dir" -p "$porta" -U postgres -d postgres -v ON_ERROR_STOP=1 -q "$@"
}

psql_teste -f "$raiz/supabase/tests/stub_auth.sql"
for migracao in "$raiz"/supabase/migrations/*.sql; do
  psql_teste -f "$migracao"
done
psql_teste -t -f "$raiz/supabase/tests/rls_empresas.sql"
