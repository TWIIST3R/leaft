-- Cache comparatif marché HasData (Indeed + Glassdoor) par talent — évite un appel API à chaque chargement.
CREATE TABLE IF NOT EXISTS talent_market_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  search_keyword text NOT NULL,
  search_location text NOT NULL,
  salary_at_fetch numeric,
  p25_annual numeric,
  p50_annual numeric,
  p75_annual numeric,
  sample_size integer NOT NULL DEFAULT 0,
  indeed_ok boolean NOT NULL DEFAULT false,
  glassdoor_ok boolean NOT NULL DEFAULT false,
  indeed_count integer NOT NULL DEFAULT 0,
  glassdoor_count integer NOT NULL DEFAULT 0,
  market_compa_pct integer,
  position_vs_market text,
  fetch_error text,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_talent_market_benchmarks_org ON talent_market_benchmarks(organization_id);

COMMENT ON TABLE talent_market_benchmarks IS 'Snapshot HasData (offres) par employé ; rafraîchi seulement si salaire / recherche changent.';
