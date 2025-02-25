import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Card,
  CardMedia,
  CardContent,
  Link,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material'
import { useDropzone } from 'react-dropzone'
import { toast } from 'react-hot-toast'
import * as productService from '../../services/products'
import * as categoryService from '../../services/categories'
import * as supplierService from '../../services/suppliers'

const FileUploadZone = ({ onDrop, accept, title, files, onRemove }) => {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept,
    maxFiles: 4,
  })

  return (
    <Box>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed grey',
          borderRadius: 2,
          p: 2,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
          },
          mb: 2,
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 40, color: 'grey.500' }} />
        <Typography>{title}</Typography>
      </Box>
      {files && files.length > 0 && (
        <List>
          {files.map((file, index) => (
            <ListItem key={index}>
              <ListItemText 
                primary={file.name}
                secondary={accept.image ? (
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={file.name}
                    style={{ maxWidth: 100, maxHeight: 100, marginTop: 8 }}
                  />
                ) : `${(file.size / 1024).toFixed(2)} KB`}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => onRemove(index)}>
                  <ClearIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  )
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [open, setOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    supplier_id: '',
    images: [],
    documents: [],
  })

  const loadData = async () => {
    try {
      const [
        { data: productsData, error: productsError },
        { data: categoriesData, error: categoriesError },
        { data: suppliersData, error: suppliersError },
      ] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories(),
        supplierService.getSuppliers(),
      ])

      if (productsError) throw productsError
      if (categoriesError) throw categoriesError
      if (suppliersError) throw suppliersError

      setProducts(productsData)
      setCategories(categoriesData)
      setSuppliers(suppliersData)
    } catch (error) {
      toast.error('Erreur lors du chargement des données')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpen = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        category_id: product.category_id,
        supplier_id: product.supplier_id,
        images: [],
        documents: [],
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        description: '',
        price: '',
        category_id: '',
        supplier_id: '',
        images: [],
        documents: [],
      })
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingProduct(null)
  }

  const handleViewOpen = (product) => {
    setSelectedProduct(product)
    setViewOpen(true)
  }

  const handleViewClose = () => {
    setViewOpen(false)
    setSelectedProduct(null)
  }

  const handleChange = (e) => {
    const value = e.target.name === 'price' ? parseFloat(e.target.value) : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
  }

  const handleImageDrop = (acceptedFiles) => {
    setFormData({
      ...formData,
      images: [...formData.images, ...acceptedFiles].slice(0, 4),
    })
  }

  const handleDocumentDrop = (acceptedFiles) => {
    setFormData({
      ...formData,
      documents: [...formData.documents, ...acceptedFiles].slice(0, 4),
    })
  }

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    })
  }

  const handleRemoveDocument = (index) => {
    setFormData({
      ...formData,
      documents: formData.documents.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const toastId = toast.loading('Enregistrement en cours...')
    try {
      if (!formData.name || !formData.price || !formData.category_id || !formData.supplier_id) {
        toast.error('Veuillez remplir tous les champs obligatoires', { id: toastId })
        return
      }

      if (editingProduct) {
        const { error } = await productService.updateProduct(editingProduct.id, formData)
        if (error) throw error
        toast.success('Produit modifié avec succès', { id: toastId })
      } else {
        const { error } = await productService.createProduct(formData)
        if (error) throw error
        toast.success('Produit ajouté avec succès', { id: toastId })
      }
      
      handleClose()
      loadData()
    } catch (error) {
      console.error('Erreur dans handleSubmit:', error)
      toast.error(error.message || 'Une erreur est survenue lors de l\'enregistrement', { id: toastId })
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return
    try {
      const { error } = await productService.deleteProduct(id)
      if (error) throw error
      toast.success('Produit supprimé avec succès')
      loadData()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Produits</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Ajouter un produit
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Prix</TableCell>
              <TableCell>Catégorie</TableCell>
              <TableCell>Fournisseur</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.description}</TableCell>
                <TableCell>{product.price}€</TableCell>
                <TableCell>{product.category?.name}</TableCell>
                <TableCell>{product.supplier?.name}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleViewOpen(product)}>
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton onClick={() => handleOpen(product)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(product.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de vue détaillée */}
      <Dialog open={viewOpen} onClose={handleViewClose} maxWidth="md" fullWidth>
        <DialogTitle>Détails du produit</DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6">{selectedProduct.name}</Typography>
                <Typography variant="body1" color="textSecondary">
                  {selectedProduct.description}
                </Typography>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Prix: {selectedProduct.price}€
                </Typography>
                <Typography variant="body1">
                  Catégorie: {selectedProduct.category?.name}
                </Typography>
                <Typography variant="body1">
                  Fournisseur: {selectedProduct.supplier?.name}
                </Typography>
              </Grid>

              {/* Images */}
              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Images</Typography>
                  {console.log('Images du produit:', selectedProduct.images)}
                  <Grid container spacing={2}>
                    {selectedProduct.images.map((image, index) => {
                      console.log('URL de l\'image:', image.image_url);
                      return (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                          <Card>
                            <CardMedia
                              component="img"
                              height="200"
                              image={image.image_url || ''}
                              alt={`Image ${index + 1}`}
                              sx={{ 
                                objectFit: 'contain',
                                bgcolor: 'grey.100'
                              }}
                              onError={(e) => {
                                console.error('Erreur de chargement de l\'image:', image.image_url);
                                e.target.src = 'https://via.placeholder.com/200x200?text=Image+non+disponible';
                              }}
                            />
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Grid>
              )}

              {/* Documents */}
              {selectedProduct.documents && selectedProduct.documents.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Documents</Typography>
                  {console.log('Documents du produit:', selectedProduct.documents)}
                  <List>
                    {selectedProduct.documents.map((doc, index) => {
                      console.log('URL du document:', doc.document_url);
                      return (
                        <ListItem key={index}>
                          <ListItemText
                            primary={`Document ${index + 1}`}
                            secondary={
                              doc.document_url ? (
                                <Link 
                                  href={doc.document_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  onClick={(e) => {
                                    if (!doc.document_url) {
                                      e.preventDefault();
                                      toast.error('URL du document non disponible');
                                    }
                                  }}
                                >
                                  Voir le document
                                </Link>
                              ) : 'URL non disponible'
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleViewClose}>Fermer</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              handleViewClose();
              handleOpen(selectedProduct);
            }}
          >
            Modifier
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog d'édition */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Nom"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="price"
                  label="Prix"
                  fullWidth
                  type="number"
                  required
                  value={formData.price}
                  onChange={handleChange}
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="category_id"
                  label="Catégorie"
                  fullWidth
                  select
                  required
                  value={formData.category_id}
                  onChange={handleChange}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="supplier_id"
                  label="Fournisseur"
                  fullWidth
                  select
                  required
                  value={formData.supplier_id}
                  onChange={handleChange}
                >
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <FileUploadZone
                  onDrop={handleImageDrop}
                  accept={{ image: ['image/jpeg', 'image/png'] }}
                  title="Glissez jusqu'à 4 images ici"
                  files={formData.images}
                  onRemove={handleRemoveImage}
                />
              </Grid>
              <Grid item xs={12}>
                <FileUploadZone
                  onDrop={handleDocumentDrop}
                  accept={{ pdf: ['application/pdf'] }}
                  title="Glissez jusqu'à 4 documents PDF ici"
                  files={formData.documents}
                  onRemove={handleRemoveDocument}
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingProduct ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
