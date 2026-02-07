# Rôles et transparence salariale

## Trois niveaux d’accès

- **Admin** : accès complet au dashboard actuel (Accueil, Talents, Grilles de salaire, Paramétrage). Gestion des départements, grilles, talents, paramètres et option de transparence.
- **Manager** : accès à la section Entretiens et suivi des talents de son département. (À implémenter : dashboard Manager.)
- **Talent (employé)** : dashboard employé pour suivre sa propre évolution. (À implémenter : dashboard Talent.)

## Transparence salariale (loi française)

Conformité avec la loi sur la transparence des rémunérations en France.

- L’**admin** peut activer ou désactiver l’option **Transparence salariale** dans **Paramétrage**.
- Lorsque l’option est **activée** :
  - Les comptes **Manager** et **Talent** peuvent consulter l’ensemble des salaires de l’entreprise.
- Lorsque l’option est **désactivée** :
  - Seul l’admin (et les droits configurés côté backend) peut voir les rémunérations.

La préférence est stockée en base : `organizations.salary_transparency_enabled`. L’utilisation effective (affichage conditionnel des salaires selon le rôle et cette option) sera implémentée avec les dashboards Manager et Talent.
