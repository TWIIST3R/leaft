-- Avantages : plusieurs départements (table de liaison)
CREATE TABLE IF NOT EXISTS avantage_departments (
  avantage_id uuid NOT NULL REFERENCES avantages_en_nature(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  PRIMARY KEY (avantage_id, department_id)
);
CREATE INDEX IF NOT EXISTS idx_avantage_depts_avantage ON avantage_departments(avantage_id);

INSERT INTO avantage_departments (avantage_id, department_id)
SELECT id, department_id FROM avantages_en_nature WHERE department_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Management & Ancienneté (grille_extra)
CREATE TABLE IF NOT EXISTS grille_extra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('management', 'anciennete')),
  name text NOT NULL,
  details text,
  montant_annuel numeric,
  "order" int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_grille_extra_org ON grille_extra(organization_id);
CREATE INDEX IF NOT EXISTS idx_grille_extra_type ON grille_extra(type);
ALTER TABLE grille_extra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view grille_extra" ON grille_extra FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_organizations uo WHERE uo.organization_id = grille_extra.organization_id AND uo.clerk_user_id = auth.jwt()->>'sub')
);
CREATE POLICY "Users manage grille_extra" ON grille_extra FOR ALL USING (
  EXISTS (SELECT 1 FROM user_organizations uo WHERE uo.organization_id = grille_extra.organization_id AND uo.clerk_user_id = auth.jwt()->>'sub')
);
