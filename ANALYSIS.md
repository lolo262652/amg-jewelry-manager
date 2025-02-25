# AMG Jewelry Manager - Document d'Analyse Technique

## 1. Vue d'ensemble de l'Application

### 1.1 Description
AMG Jewelry Manager est une application de gestion de bijouterie permettant de gérer les produits, les fournisseurs et les catégories. L'application est construite avec React pour le frontend et utilise Supabase comme backend.

### 1.2 Technologies Principales
- **Frontend** : React 18+
- **Backend** : Supabase
- **UI Framework** : Material-UI (MUI)
- **Gestion des fichiers** : React Dropzone
- **Notifications** : React Hot Toast
- **Styles** : Emotion (via MUI)

### 1.3 Structure du Projet
```
AMG/
├── src/
│   ├── config/           # Configuration Supabase
│   ├── services/         # Services API
│   ├── pages/           # Composants de pages
│   └── components/      # Composants réutilisables
├── supabase/           # Scripts SQL Supabase
└── public/            # Assets statiques
```

## 2. Architecture de la Base de Données

### 2.1 Tables Principales
```sql
-- Tables de base
amg_products        # Produits
amg_categories      # Catégories
amg_suppliers       # Fournisseurs
amg_product_images  # Images des produits
amg_product_documents # Documents des produits
```

### 2.2 Relations
- Un produit appartient à une catégorie (N-1)
- Un produit est lié à un fournisseur (N-1)
- Un produit peut avoir plusieurs images (1-N)
- Un produit peut avoir plusieurs documents (1-N)

### 2.3 Structure des Tables
```sql
-- Exemple pour les produits
amg_products {
    id: UUID (PK)
    name: VARCHAR
    description: TEXT
    price: DECIMAL(10,2)
    category_id: UUID (FK)
    supplier_id: UUID (FK)
    created_at: TIMESTAMP
}
```

## 3. Configuration Supabase

### 3.1 Configuration Initiale
```javascript
const supabaseUrl = 'VOTRE_URL_SUPABASE'
const supabaseAnonKey = 'VOTRE_CLE_ANONYME'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})
```

### 3.2 Politiques de Sécurité (RLS)
```sql
-- Tables
ALTER TABLE amg_products ENABLE ROW LEVEL SECURITY;

-- Politiques
CREATE POLICY "Allow full access for authenticated users" 
ON amg_products FOR ALL 
USING (auth.role() = 'authenticated');
```

### 3.3 Configuration du Stockage
```sql
-- Création du bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Politiques de stockage
CREATE POLICY "Give public access to products bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

CREATE POLICY "Allow authenticated users to upload products storage"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');
```

## 4. Fonctionnalités Principales

### 4.1 Gestion des Produits
- Création, lecture, mise à jour et suppression (CRUD)
- Upload multiple d'images (max 4)
- Upload multiple de documents (max 4)
- Prévisualisation des images
- Liens vers les documents
- Filtrage et recherche

### 4.2 Gestion des Fichiers
```javascript
// Structure des dossiers de stockage
images/
└── <product_id>/
    └── <timestamp>-<index>.<extension>

documents/
└── <product_id>/
    └── <timestamp>-<index>.<extension>
```

### 4.3 Composants Réutilisables
- FileUploadZone : Zone de drop pour les fichiers
- ProductForm : Formulaire de produit
- ProductCard : Carte de présentation produit
- FilePreview : Prévisualisation de fichiers

## 5. Services API

### 5.1 Structure des Services
```javascript
// Exemple de service produit
export const productService = {
  getProducts: async () => {
    const { data, error } = await supabase
      .from('amg_products')
      .select(`
        *,
        category:amg_categories(id, name),
        supplier:amg_suppliers(id, name),
        images:amg_product_images(id, image_url),
        documents:amg_product_documents(id, document_url)
      `)
    return { data, error }
  }
}
```

### 5.2 Gestion des URLs de Fichiers
```javascript
const getPublicUrl = (bucket, path) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  return data?.publicUrl
}
```

## 6. Bonnes Pratiques

### 6.1 Structure des Composants
- Séparation des responsabilités
- Composants réutilisables
- Props typées
- Gestion d'état locale vs globale

### 6.2 Gestion des Erreurs
- Messages d'erreur utilisateur
- Logging côté serveur
- Fallbacks pour les ressources manquantes

### 6.3 Sécurité
- Authentification requise
- Validation des entrées
- Politiques RLS strictes
- Accès contrôlé aux fichiers

## 7. Points d'Attention pour le Déploiement

### 7.1 Configuration Supabase
- Créer toutes les tables nécessaires
- Configurer les politiques RLS
- Créer et configurer le bucket de stockage
- Vérifier les limites de taille de fichiers

### 7.2 Variables d'Environnement
```
REACT_APP_SUPABASE_URL=votre_url
REACT_APP_SUPABASE_ANON_KEY=votre_cle
```

### 7.3 Optimisations
- Compression des images
- Mise en cache des requêtes
- Lazy loading des composants
- Pagination des résultats

## 8. Prompt de Départ pour une Application Similaire

```
Créer une application web de gestion [TYPE_ENTREPRISE] avec React et Supabase avec les fonctionnalités suivantes :

1. Structure de Base de Données :
   - Tables principales : produits, catégories, fournisseurs
   - Relations : produit-catégorie (N-1), produit-fournisseur (N-1)
   - Stockage de fichiers : images et documents par produit

2. Fonctionnalités Requises :
   - CRUD complet pour les produits/catégories/fournisseurs
   - Upload multiple d'images (max 4) avec prévisualisation
   - Upload de documents PDF
   - Interface de recherche et filtrage
   - Authentification utilisateur

3. Technologies à Utiliser :
   - Frontend : React avec Material-UI
   - Backend : Supabase (Auth, Database, Storage)
   - Composants : React Dropzone, React Hot Toast

4. Configuration Supabase :
   - Tables avec RLS
   - Bucket de stockage public pour les fichiers
   - Politiques de sécurité pour l'accès authentifié

5. Structure du Projet :
   - Organisation modulaire (services, composants, pages)
   - Gestion d'état centralisée
   - Composants réutilisables
   - Gestion des erreurs et retours utilisateur

6. UI/UX :
   - Design responsive
   - Feedback utilisateur pour les actions
   - Prévisualisation des fichiers
   - Navigation intuitive
```

Ce prompt fournit une base solide pour créer une application similaire, en couvrant tous les aspects essentiels de l'architecture et des fonctionnalités.

## 9. Gestion des Erreurs et Validation

### 9.1 Validation des Données
```javascript
// Exemple de validation de produit
const validateProduct = (product) => {
  const errors = {};
  
  if (!product.name?.trim()) {
    errors.name = "Le nom est requis";
  }
  
  if (!product.price || product.price <= 0) {
    errors.price = "Le prix doit être supérieur à 0";
  }
  
  if (!product.category_id) {
    errors.category_id = "La catégorie est requise";
  }
  
  if (!product.supplier_id) {
    errors.supplier_id = "Le fournisseur est requis";
  }
  
  return errors;
};
```

### 9.2 Gestion des Erreurs Réseau
```javascript
const handleApiError = (error) => {
  if (error.code === "PGRST301") {
    return "Session expirée, veuillez vous reconnecter";
  }
  
  if (error.code === "23505") {
    return "Un élément avec ce nom existe déjà";
  }
  
  return error.message || "Une erreur est survenue";
};
```

### 9.3 Feedback Utilisateur
```javascript
// Utilisation de react-hot-toast pour les notifications
const handleSubmit = async (data) => {
  const toastId = toast.loading("Enregistrement en cours...");
  try {
    await saveData(data);
    toast.success("Enregistré avec succès", { id: toastId });
  } catch (error) {
    toast.error(handleApiError(error), { id: toastId });
  }
};
```

## 10. Tests et Qualité du Code

### 10.1 Tests Unitaires
```javascript
// Exemple avec Jest et React Testing Library
describe('ProductForm', () => {
  it('should validate required fields', () => {
    const { getByText, getByLabelText } = render(<ProductForm />);
    fireEvent.click(getByText('Enregistrer'));
    expect(getByText('Le nom est requis')).toBeInTheDocument();
  });
  
  it('should handle file upload', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const { getByTestId } = render(<ProductForm />);
    const input = getByTestId('file-input');
    await fireEvent.drop(input, { dataTransfer: { files: [file] } });
    expect(getByTestId('file-preview')).toBeInTheDocument();
  });
});
```

### 10.2 Tests d'Intégration
```javascript
// Test d'intégration avec Cypress
describe('Product Management', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/products');
  });
  
  it('should create a new product', () => {
    cy.get('[data-testid=add-product]').click();
    cy.get('[name=name]').type('Test Product');
    cy.get('[name=price]').type('100');
    cy.get('[name=category_id]').select('Rings');
    cy.get('[name=supplier_id]').select('Supplier 1');
    cy.get('[type=submit]').click();
    cy.contains('Test Product').should('be.visible');
  });
});
```

### 10.3 Meilleures Pratiques de Code
```javascript
// Exemple de hooks personnalisés
const useFileUpload = (options = {}) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleUpload = async (newFiles) => {
    setLoading(true);
    try {
      const results = await Promise.all(
        newFiles.map(file => uploadFile(file))
      );
      setFiles(prev => [...prev, ...results]);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  
  return { files, loading, error, handleUpload };
};
```

## 11. Optimisations et Performance

### 11.1 Optimisation des Images
```javascript
const optimizeImage = async (file) => {
  if (file.size > 1024 * 1024) { // Plus de 1MB
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };
    return await imageCompression(file, options);
  }
  return file;
};
```

### 11.2 Mise en Cache
```javascript
// Exemple avec React Query
const { data: products, isLoading } = useQuery(
  ['products'],
  fetchProducts,
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false
  }
);
```

### 11.3 Chargement Différé
```javascript
// Lazy loading des composants lourds
const ProductImageGallery = lazy(() => import('./ProductImageGallery'));

function Product() {
  return (
    <Suspense fallback={<Skeleton />}>
      <ProductImageGallery />
    </Suspense>
  );
}
```

## 12. Sécurité

### 12.1 Validation Côté Serveur (Supabase)
```sql
-- Exemple de trigger de validation
CREATE FUNCTION validate_product()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price <= 0 THEN
    RAISE EXCEPTION 'Le prix doit être supérieur à 0';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_product_trigger
BEFORE INSERT OR UPDATE ON amg_products
FOR EACH ROW
EXECUTE FUNCTION validate_product();
```

### 12.2 Protection des Routes
```javascript
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};
```

### 12.3 Sanitisation des Données
```javascript
const sanitizeInput = (input) => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  });
};

```

## 13. Configuration Détaillée du Stockage Supabase

### 13.1 Configuration Initiale du Bucket
```sql
-- 1. Créer le bucket avec les bonnes permissions
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'products',           -- id du bucket
  'products',          -- nom du bucket
  true                 -- accès public
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Activer RLS sur la table storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Give public access to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload products storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update products storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete products storage" ON storage.objects;

-- 4. Créer les nouvelles politiques
-- Lecture publique
CREATE POLICY "Give public access to products bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- Upload pour utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to upload products storage"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Mise à jour pour utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to update products storage"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products');

-- Suppression pour utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to delete products storage"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');
```

### 13.2 Structure des Dossiers et Nommage
```javascript
// Configuration des chemins de stockage
const STORAGE_CONFIG = {
  BUCKET: 'products',
  PATHS: {
    IMAGES: 'images',
    DOCUMENTS: 'documents'
  },
  MAX_FILES: 4,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOC_TYPES: ['application/pdf'],
  MAX_FILE_SIZE: 5 * 1024 * 1024 // 5MB
};

// Fonction pour générer un nom de fichier unique
const generateFileName = (file, productId, index) => {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  return `${STORAGE_CONFIG.PATHS.IMAGES}/${productId}/${timestamp}-${index}.${extension}`;
};
```

### 13.3 Service de Gestion des Fichiers
```javascript
// Service complet pour la gestion des fichiers
export const storageService = {
  // Upload d'un fichier
  uploadFile: async (file, productId, index, type = 'image') => {
    try {
      // 1. Validation du fichier
      if (!file) throw new Error('Fichier requis');
      
      const isImage = type === 'image';
      const allowedTypes = isImage 
        ? STORAGE_CONFIG.ALLOWED_IMAGE_TYPES 
        : STORAGE_CONFIG.ALLOWED_DOC_TYPES;
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Type de fichier non autorisé: ${file.type}`);
      }
      
      if (file.size > STORAGE_CONFIG.MAX_FILE_SIZE) {
        throw new Error('Fichier trop volumineux');
      }
      
      // 2. Génération du nom de fichier
      const path = isImage ? STORAGE_CONFIG.PATHS.IMAGES : STORAGE_CONFIG.PATHS.DOCUMENTS;
      const fileName = `${path}/${productId}/${Date.now()}-${index}.${file.name.split('.').pop()}`;
      
      // 3. Upload du fichier
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_CONFIG.BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      // 4. Génération de l'URL publique
      const { data } = supabase.storage
        .from(STORAGE_CONFIG.BUCKET)
        .getPublicUrl(fileName);
      
      return {
        fileName,
        publicUrl: data.publicUrl,
        type: file.type,
        size: file.size
      };
      
    } catch (error) {
      console.error('Erreur upload:', error);
      throw error;
    }
  },
  
  // Suppression d'un fichier
  deleteFile: async (fileName) => {
    try {
      const { error } = await supabase.storage
        .from(STORAGE_CONFIG.BUCKET)
        .remove([fileName]);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Erreur suppression:', error);
      throw error;
    }
  },
  
  // Récupération de l'URL publique
  getPublicUrl: (fileName) => {
    const { data } = supabase.storage
      .from(STORAGE_CONFIG.BUCKET)
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  }
};
```

### 13.4 Composant de Gestion des Fichiers
```javascript
const FileManager = ({ 
  files, 
  onUpload, 
  onRemove, 
  type = 'image',
  maxFiles = STORAGE_CONFIG.MAX_FILES 
}) => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: type === 'image' 
      ? STORAGE_CONFIG.ALLOWED_IMAGE_TYPES.join(',')
      : STORAGE_CONFIG.ALLOWED_DOC_TYPES.join(','),
    maxFiles: maxFiles - files.length,
    onDrop: onUpload,
    disabled: files.length >= maxFiles
  });
  
  return (
    <Box>
      {/* Zone de drop */}
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: 'grey.300',
          borderRadius: 1,
          p: 2,
          mb: 2,
          textAlign: 'center',
          cursor: files.length >= maxFiles ? 'not-allowed' : 'pointer',
          bgcolor: files.length >= maxFiles ? 'grey.100' : 'transparent',
          '&:hover': {
            borderColor: files.length >= maxFiles ? 'grey.300' : 'primary.main'
          }
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 40, color: 'grey.500', mb: 1 }} />
        <Typography>
          {files.length >= maxFiles 
            ? `Nombre maximum de fichiers atteint (${maxFiles})`
            : `Glisser-déposer ou cliquer pour sélectionner ${type === 'image' ? 'des images' : 'des documents'}`
          }
        </Typography>
      </Box>

      {/* Liste des fichiers */}
      {files.length > 0 && (
        <List>
          {files.map((file, index) => (
            <ListItem key={index}>
              {type === 'image' ? (
                <Box sx={{ width: 100, height: 100, mr: 2 }}>
                  <img 
                    src={file.publicUrl} 
                    alt={`Preview ${index}`}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain' 
                    }}
                  />
                </Box>
              ) : (
                <InsertDriveFileIcon sx={{ mr: 2 }} />
              )}
              <ListItemText 
                primary={file.fileName.split('/').pop()}
                secondary={`${(file.size / 1024).toFixed(2)} KB`}
              />
              <IconButton edge="end" onClick={() => onRemove(index)}>
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};
```

### 13.5 Utilisation dans un Formulaire
```javascript
const ProductForm = () => {
  const [files, setFiles] = useState({
    images: [],
    documents: []
  });
  
  const handleFileUpload = async (newFiles, type) => {
    try {
      const productId = 'temp-' + Date.now(); // ou l'ID réel du produit
      const uploadPromises = newFiles.map((file, index) => 
        storageService.uploadFile(file, productId, index, type)
      );
      
      const uploadedFiles = await Promise.all(uploadPromises);
      
      setFiles(prev => ({
        ...prev,
        [type]: [...prev[type], ...uploadedFiles]
      }));
      
    } catch (error) {
      toast.error('Erreur lors de l\'upload: ' + error.message);
    }
  };
  
  const handleFileRemove = async (index, type) => {
    try {
      const file = files[type][index];
      await storageService.deleteFile(file.fileName);
      
      setFiles(prev => ({
        ...prev,
        [type]: prev[type].filter((_, i) => i !== index)
      }));
      
    } catch (error) {
      toast.error('Erreur lors de la suppression: ' + error.message);
    }
  };
  
  return (
    <form>
      {/* Autres champs du formulaire */}
      
      <FileManager
        files={files.images}
        onUpload={(newFiles) => handleFileUpload(newFiles, 'images')}
        onRemove={(index) => handleFileRemove(index, 'images')}
        type="image"
      />
      
      <FileManager
        files={files.documents}
        onUpload={(newFiles) => handleFileUpload(newFiles, 'documents')}
        onRemove={(index) => handleFileRemove(index, 'documents')}
        type="document"
      />
    </form>
  );
};
```

Cette configuration complète permet de :
1. Créer et configurer correctement le bucket de stockage
2. Gérer les permissions d'accès aux fichiers
3. Structurer les fichiers de manière organisée
4. Valider les fichiers avant l'upload
5. Gérer les erreurs et les retours utilisateur
6. Fournir une interface utilisateur intuitive

Le système est :
- Sécurisé : seuls les utilisateurs authentifiés peuvent uploader/modifier/supprimer
- Public : les fichiers sont accessibles publiquement pour l'affichage
- Organisé : structure claire des dossiers par type et par produit
- Robuste : validation des types et tailles de fichiers
- Utilisable : interface drag & drop avec prévisualisation
