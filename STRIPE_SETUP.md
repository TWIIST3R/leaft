# Configuration Stripe pour Leaft

## 📋 Flux d'inscription et abonnement

### 1. Inscription (Sign-up)
- L'utilisateur crée un compte sur `/sign-up`
- Clerk crée automatiquement une organisation
- Après inscription, redirection vers `/onboarding`

### 2. Onboarding
- Route `/onboarding` qui :
  - Crée l'organisation dans Supabase (si elle n'existe pas)
  - Crée l'entrée `user_organizations` avec le rôle "Owner"
  - Redirige vers `/pricing?onboarding=true`

### 3. Sélection du plan (Pricing)
- L'utilisateur choisit un plan (1-5, 6-19, 20-99, 100+ talents)
- Choisit mensuel ou annuel
- Clique sur "Choisir ce plan"
- Appel à `/api/stripe/checkout` qui crée une session Stripe Checkout

### 4. Paiement Stripe
- Redirection vers Stripe Checkout
- L'utilisateur paie
- Après paiement réussi, redirection vers `/dashboard?session_id={CHECKOUT_SESSION_ID}`

### 5. Webhook Stripe
- Stripe envoie un webhook à `/api/stripe/webhook`
- Le webhook synchronise l'abonnement dans la table `subscriptions`
- L'utilisateur peut maintenant accéder au dashboard

---

## 🛠️ Configuration Stripe

### Option 1 : Création automatique (recommandé pour le développement)

Le code crée automatiquement les produits et prices Stripe si ils n'existent pas. **Vous n'avez rien à faire** pour commencer à tester.

**Avantages :**
- Fonctionne immédiatement
- Pas de configuration manuelle

**Inconvénients :**
- Les produits/prices sont créés à la volée
- Moins de contrôle sur les noms/descriptions

### Option 2 : Création manuelle (recommandé pour la production)

Créez les produits et prices dans le dashboard Stripe pour avoir plus de contrôle.

#### Étapes :

1. **Aller dans Stripe Dashboard** → Products

2. **Créer un produit "Leaft"**
   - Nom : `Leaft`
   - Description : `Abonnement Leaft - Transparence salariale et gestion des talents`

3. **Créer les Prices pour chaque palier**

   Pour chaque palier (1-5, 6-19, 20-99, 100+), créez 2 prices (mensuel + annuel) :

   **Exemple pour "1 à 5 talents" :**
   - **Mensuel** :
     - Montant : `9400` centimes (49€ base + 9€ × 5 = 94€)
     - Récurrence : Mensuel
     - Metadata : `seat_count: "5"`, `plan_type: "monthly"`
   
   - **Annuel** :
     - Montant : `94000` centimes (490€ base + 90€ × 5 = 940€)
     - Récurrence : Annuel
     - Metadata : `seat_count: "5"`, `plan_type: "annual"`

   **Formule de calcul :**
   - Mensuel : `(base + perSeat × seatCount) × 100` centimes
   - Annuel : `(base × 10 + perSeat × 10 × seatCount) × 100` centimes

4. **Récupérer les Price IDs** et les stocker dans votre code (optionnel)

   Si vous voulez utiliser des Price IDs spécifiques, modifiez `src/lib/stripe/subscriptions.ts` pour utiliser directement les Price IDs au lieu de créer des prices dynamiquement.

---

## 🔄 Quand créer les produits Stripe ?

### Pour le développement/test :
**Vous pouvez commencer maintenant sans rien créer !** Le code créera automatiquement les produits et prices lors du premier checkout.

### Pour la production :
**Créez les produits manuellement** avant de lancer en production pour :
- Avoir des noms/descriptions cohérents
- Contrôler exactement les montants
- Faciliter la gestion dans Stripe Dashboard

---

## 📝 Configuration des webhooks Stripe

1. **Aller dans Stripe Dashboard** → Developers → Webhooks

2. **Ajouter un endpoint** :
   - URL : `https://votre-domaine.com/api/stripe/webhook`
   - Événements à écouter :
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

3. **Récupérer le Webhook Secret** et l'ajouter à vos variables d'environnement :
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## ✅ Test du flux complet

1. **Créer un compte** sur `/sign-up`
2. **Vérifier la redirection** vers `/onboarding` puis `/pricing`
3. **Sélectionner un plan** et cliquer sur "Choisir ce plan"
4. **Utiliser une carte de test Stripe** :
   - Numéro : `4242 4242 4242 4242`
   - Date : n'importe quelle date future
   - CVC : n'importe quel 3 chiffres
5. **Vérifier la redirection** vers `/dashboard` après paiement
6. **Vérifier dans Supabase** que l'abonnement est bien créé dans la table `subscriptions`

---

## 🐛 Dépannage

### Le checkout ne se crée pas
- Vérifier que `STRIPE_SECRET_KEY` est bien configuré
- Vérifier les logs du serveur pour voir les erreurs

### Le webhook ne fonctionne pas
- Vérifier que `STRIPE_WEBHOOK_SECRET` est correct
- Utiliser Stripe CLI pour tester localement : `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### L'abonnement n'est pas synchronisé
- Vérifier que le webhook est bien configuré dans Stripe
- Vérifier les logs du serveur
- Vérifier que les metadata `organization_id`, `seat_count`, `plan_type` sont bien présentes

