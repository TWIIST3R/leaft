-- Sécurité : ces deux tables étaient exposées via l'API PostgREST sans RLS.
-- Tout l'accès applicatif se fait côté serveur via la clé service role (qui
-- contourne le RLS), donc activer le RLS sans policy ferme l'accès public
-- (rôles anon/authenticated) sans rien casser — même schéma que meeting_requests.
alter table public.talent_market_benchmarks enable row level security;
alter table public.avantage_departments enable row level security;
