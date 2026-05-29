ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS salary_disclosure_mode text NOT NULL DEFAULT 'department_average';

ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_salary_disclosure_mode_check;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_salary_disclosure_mode_check
  CHECK (salary_disclosure_mode IN ('department_average', 'exact'));

COMMENT ON COLUMN organizations.salary_disclosure_mode IS
  'department_average : moyenne du département (conforme loi) ; exact : salaires individuels (optionnel). Ignoré si salary_transparency_enabled = false.';
