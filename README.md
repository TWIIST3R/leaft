# Leaft

Leaft est un SaaS dédié à la transparence salariale et à la gestion des parcours collaborateurs.

## Fonctionnalités prévues

- Grilles salariales détaillées, attentes par niveau, et suivi des compa-ratios.
- Gestion complète des employés (CRUD), invitations Clerk et suivi des entretiens.
- Statistiques d’équité, organigramme automatique et comparatifs marché.
- Espace employé avec simulateur d’augmentation et benchmarks HasData/Indeed.
- Site vitrine Next.js : accueil, prix, contact, ressources, mentions légales.

## Pile technique

- Front : Next.js (App Router), TypeScript, React Query, GSAP.
- Back / DB : Supabase (Postgres + RLS, fonctions server).
- Authentification : Clerk (organisations, rôles Owner/RH/Manager/Employé).
- Paiements : Stripe (Checkout, Portal, abonnements mensuels/annuels).
- Hébergement : Render ; stockage fichiers via Supabase Storage.

## Démarrage

1. Installer Node.js 18+ et `pnpm`.
2. Cloner ce dépôt (une fois le dépôt GitHub distant configuré).
3. Installer les dépendances : `pnpm install` (si `pnpm` bloque certains scripts, exécuter `pnpm approve-builds`).
4. Définir les variables d’environnement (Supabase, Clerk, Stripe, Render).
5. Lancer le serveur de développement : `pnpm dev`.

## Déploiement

- Render détectera les commits sur la branche principale et déclenchera les builds.
- Les migrations et accès aux services tiers se font directement en production.

### Variables d'environnement (à définir sur Render)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET` (si webhooks Clerk déclenchés)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` *(alias recommandé si besoin côté client)*
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL` (URL Render / production)
- `HASDATA_API_KEY` *(si connexion HasData/Indeed disponible)*

## Ressources internes

- Règles et vision produit : `.cursor/rules/project.mdc`.
- Docs Supabase : projet `qjeywlppgmerihdxicrk`.
- Workspace Render : “Vincent's workspace”.
- Compte Stripe : “leaft”.
- Env runtime : `src/env.ts` (throws si une variable obligatoire est absente).
- Assets marque : `public/brand/` (`logo-light.png`, `logo-dark.png`).

---

_Dernière mise à jour : bootstrap Next.js + dépendances._

