# AMG Jewelry Manager

Application de gestion de produits pour joailliers développée avec React et Supabase.

## Fonctionnalités

- Gestion des fournisseurs
- Gestion des catégories de produits
- Gestion des produits avec images et documents
- Interface moderne et responsive
- Mode sombre/clair
- Authentification sécurisée
- Tableau de bord avec statistiques

## Prérequis

- Node.js (version 16 ou supérieure)
- NPM ou Yarn
- Un compte Supabase

## Installation

1. Cloner le dépôt :
```bash
git clone [url-du-depot]
cd AMG
```

2. Installer les dépendances :
```bash
npm install
```

3. Créer un fichier `.env` à la racine du projet avec vos identifiants Supabase :
```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

4. Démarrer l'application en mode développement :
```bash
npm run dev
```

## Structure de la base de données

L'application utilise les tables suivantes dans Supabase :

- `AMG_suppliers` : Gestion des fournisseurs
- `AMG_categories` : Gestion des catégories
- `AMG_products` : Gestion des produits
- `AMG_product_images` : Stockage des images des produits
- `AMG_product_documents` : Stockage des documents des produits

## Déploiement

Pour construire l'application pour la production :

```bash
npm run build
```

Les fichiers de production seront générés dans le dossier `dist`.

## Technologies utilisées

- React.js avec Vite
- Material-UI pour l'interface
- Supabase pour le backend
- React Router pour la navigation
- React Dropzone pour l'upload de fichiers
- Formik et Yup pour la validation des formulaires
