-- Modèle simplifié : Département → Paliers (sans famille de métiers)
-- Exécuter ce script dans le SQL Editor de Supabase

-- 1. Ajouter department_id aux paliers (levels)
ALTER TABLE levels
ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id) ON DELETE CASCADE;

-- 2. Migrer les paliers existants : récupérer department_id depuis job_families
UPDATE levels l
SET department_id = jf.department_id
FROM job_families jf
WHERE l.job_family_id = jf.id AND jf.department_id IS NOT NULL;

-- Si job_families n'a pas department_id, lier au 1er département de l'org
UPDATE levels l
SET department_id = (
  SELECT d.id FROM departments d
  JOIN job_families jf ON jf.organization_id = d.organization_id
  WHERE jf.id = l.job_family_id
  ORDER BY d.name
  LIMIT 1
)
WHERE l.department_id IS NULL AND l.job_family_id IS NOT NULL;

-- 3. Montant fixe + critères (si pas déjà fait par une migration précédente)
ALTER TABLE levels ADD COLUMN IF NOT EXISTS montant_annuel numeric;
ALTER TABLE levels ADD COLUMN IF NOT EXISTS criteria jsonb DEFAULT '{}';
UPDATE levels SET montant_annuel = mid_salary WHERE montant_annuel IS NULL AND mid_salary IS NOT NULL;

-- 4. Supprimer la liaison job_family
ALTER TABLE levels DROP COLUMN IF EXISTS job_family_id;
