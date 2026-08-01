# Geneviève Nutrition — démo statique

Instantané statique du site public, destiné à une présentation client. Il ne contient ni base de données, ni administration, ni traitement du formulaire de contact.

## Régénérer l’instantané

L’application complète doit être accessible localement sur `http://localhost:3000`.

```bash
npm run snapshot
```

Pour utiliser une autre adresse :

```bash
npm run snapshot -- http://localhost:3001
```

Le contenu de `site/` est entièrement recréé à chaque exécution.

## Vérifier localement

```bash
npm run serve
```

Vérifier tous les liens et fichiers locaux :

```bash
npm run check
```

## Publier sur GitHub Pages

1. Copier ce dossier dans un dépôt GitHub distinct.
2. Utiliser `main` comme branche principale et pousser le dépôt.
3. Dans **Settings → Pages → Build and deployment**, sélectionner **GitHub Actions**.
4. Attendre la fin de l’action `Deploy static demo to GitHub Pages`.

Les chemins sont relatifs : la démo fonctionne aussi bien sur `utilisateur.github.io/depot/` que sur un domaine personnalisé.

## Limites volontaires

- Les routes `/admin`, `/auth` et `/api` ne sont pas copiées.
- Les formulaires affichent un message de démonstration et n’envoient rien.
- Une directive `noindex` est ajoutée à chaque page, mais un dépôt ou un site GitHub Pages public reste accessible à toute personne possédant son URL.
