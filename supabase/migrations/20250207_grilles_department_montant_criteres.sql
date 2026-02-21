-- Grilles rattachées au département + montant fixe + critères structurés
-- Exécuter ce script dans le SQL Editor de Supabase

-- 1. Lier les familles de métiers (grilles) aux départements
ALTER TABLE job_families
ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id) ON DELETE SET NULL;

-- 2. Montant fixe annuel + critères structurés sur les niveaux
ALTER TABLE levels
ADD COLUMN IF NOT EXISTS montant_annuel numeric,
ADD COLUMN IF NOT EXISTS criteria jsonb DEFAULT '{}';

-- Migrer mid_salary -> montant_annuel pour les données existantes
UPDATE levels
SET montant_annuel = mid_salary
WHERE montant_annuel IS NULL AND mid_salary IS NOT NULL;

-- 3. (Optionnel) Remplir department_id sur job_families existantes
-- À faire manuellement si vous avez une logique : par ex. lier à un département par défaut
-- UPDATE job_families SET department_id = (SELECT id FROM departments WHERE organization_id = job_families.organization_id LIMIT 1) WHERE department_id IS NULL;

-- Structure suggérée pour criteria (jsonb) :
-- {
--   "objectives": ["Objectif mesurable 1", "Objectif 2"],
--   "competencies": ["Compétence requise X"],
--   "min_tenure_months": 12,
--   "notes": "Autres critères..."
-- }
