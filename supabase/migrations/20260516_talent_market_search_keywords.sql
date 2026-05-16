ALTER TABLE talent_market_benchmarks
  ADD COLUMN IF NOT EXISTS search_keywords_used text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN talent_market_benchmarks.search_keywords_used IS 'Intitulés utilisés pour les recherches Indeed / Glassdoor (variantes IA ou heuristiques).';
