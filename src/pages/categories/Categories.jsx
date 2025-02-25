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
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { toast } from 'react-hot-toast'
import * as categoryService from '../../services/categories'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [open, setOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const loadCategories = async () => {
    const { data, error } = await categoryService.getCategories()
    if (error) {
      toast.error('Erreur lors du chargement des catégories')
      return
    }
    setCategories(data)
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleOpen = (category = null) => {
    if (category) {
      setEditingCategory(category)
      setFormData(category)
    } else {
      setEditingCategory(null)
      setFormData({
        name: '',
        description: '',
      })
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingCategory(null)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        const { error } = await categoryService.updateCategory(editingCategory.id, formData)
        if (error) throw error
        toast.success('Catégorie modifiée avec succès')
      } else {
        const { error } = await categoryService.createCategory(formData)
        if (error) throw error
        toast.success('Catégorie ajoutée avec succès')
      }
      handleClose()
      loadCategories()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return
    try {
      const { error } = await categoryService.deleteCategory(id)
      if (error) throw error
      toast.success('Catégorie supprimée avec succès')
      loadCategories()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <h1>Gestion des catégories</h1>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Ajouter une catégorie
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(category)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(category.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              name="name"
              label="Nom"
              fullWidth
              required
              value={formData.name}
              onChange={handleChange}
              margin="normal"
            />
            <TextField
              name="description"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCategory ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
