# Configuration email (info@leaft.io)

L'application envoie des e-mails (invitations entretiens, rappels, mise à jour abonnement, etc.) depuis **info@leaft.io** via l'API Resend.

## Option recommandée : Resend + domaine vérifié

Pour que les e-mails envoyés par l'app arrivent bien en boîte de réception (et pas en spam) :

1. **Compte Resend**  
   Créez un compte sur [resend.com](https://resend.com) et récupérez une clé API.

2. **Variable d'environnement**  
   Dans votre `.env` :
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxx
   ```
   Le code utilise déjà l’expéditeur `Leaft <info@leaft.io>` (voir `src/lib/resend.ts`).

3. **Vérification du domaine leaft.io dans Resend**  
   - Dans le dashboard Resend : **Domains** → **Add Domain**  
   - Saisir **leaft.io**  
   - Resend affiche des enregistrements DNS (SPF, DKIM, etc.) à ajouter chez votre hébergeur DNS.  
   - Ajoutez ces enregistrements pour le domaine (ou le sous-domaine indiqué).  
   - Une fois la vérification OK, les envois depuis `@leaft.io` via Resend sont correctement authentifiés et la délivrabilité est bien meilleure.

4. **Réception des e-mails (Zoho)**  
   Vous avez configuré la **réception** sur Zoho pour info@leaft.io : les réponses des destinataires et les éventuels retours iront dans cette boîte. Il n’y a rien à changer côté app : l’expéditeur reste info@leaft.io, donc les réponses reviennent vers votre mailbox Zoho.

Résumé : **envoi** = Resend (avec domaine leaft.io vérifié), **réception** = Zoho pour info@leaft.io.

## Option alternative : envoi direct via Zoho

Si vous préférez que l’envoi passe aussi par Zoho (SMTP) au lieu de Resend, il faudrait adapter le code pour utiliser les identifiants SMTP Zoho (et un client type Nodemailer). Les paramètres SMTP Zoho sont disponibles dans la configuration de la boîte info@leaft.io. Cette option n’est pas implémentée par défaut ; l’option Resend + domaine vérifié est la plus simple avec le code actuel.
