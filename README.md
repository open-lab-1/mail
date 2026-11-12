# Messagerie — L'Atelier de Noël 3D

Site indépendant pour préparer et envoyer des e-mails depuis l'adresse Gmail habituelle de l'Atelier.

## Déploiement GitHub Pages
1. Ouvrir **Settings → Pages** dans ce dépôt.
2. Dans **Build and deployment**, choisir **Deploy from a branch**.
3. Sélectionner la branche `main` et le dossier `/ (root)), puis enregistrer.
4. Le site sera publié à l'adresse `https://open-lab-1.github.io/mail/`.

## Fonctionnement
- Connexion avec Supabase Auth (comptes administrateurs existants).
- L'interface vérifie le compte et la fonction serveur vérifie à nouveau l'identité.
- La fonction `mail-send` appelle le relais Google Apps Script déjà configuré dans le projet Supabase.
- Les secrets Gmail restent exclusivement côté serveur.
- Les e-mails sont envoyés en texte brut. L'aperçu du site reprend l'identité visuelle de l'Atelier.

## Sécurité
La clé Supabase utilisée dans le navigateur est une clé publishable, prévue pour être publique. Aucun secret de service, mot de passe Gmail, URL privée de relais ou jeton du relais n'est stocké dans ce dépôt.
