-- Avantages en nature (voiture de fonction, ticket resto, etc.)
-- Déjà exécuté via MCP Supabase

CREATE TABLE IF NOT EXISTS avantages_en_nature (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  name text NOT NULL,
  montant_annuel_brut numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avantages_org ON avantages_en_nature(organization_id);
CREATE INDEX IF NOT EXISTS idx_avantages_dept ON avantages_en_nature(department_id);

ALTER TABLE avantages_en_nature ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view avantages in their org" ON avantages_en_nature FOR SELECT USING (
  EXISTS (SELECT 1 FROM employees e WHERE e.organization_id = avantages_en_nature.organization_id AND e.clerk_user_id = auth.jwt()->>'sub')
);

CREATE POLICY "Users can manage avantages in their org" ON avantages_en_nature FOR ALL USING (
  EXISTS (SELECT 1 FROM employees e WHERE e.organization_id = avantages_en_nature.organization_id AND e.clerk_user_id = auth.jwt()->>'sub')
);
