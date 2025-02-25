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
import * as supplierService from '../../services/suppliers'

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [open, setOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    address: '',
    email: '',
    phone: '',
  })

  const loadSuppliers = async () => {
    const { data, error } = await supplierService.getSuppliers()
    if (error) {
      toast.error('Erreur lors du chargement des fournisseurs')
      return
    }
    setSuppliers(data)
  }

  useEffect(() => {
    loadSuppliers()
  }, [])

  const handleOpen = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setFormData(supplier)
    } else {
      setEditingSupplier(null)
      setFormData({
        name: '',
        contact: '',
        address: '',
        email: '',
        phone: '',
      })
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingSupplier(null)
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
      if (editingSupplier) {
        const { error } = await supplierService.updateSupplier(editingSupplier.id, formData)
        if (error) throw error
        toast.success('Fournisseur modifié avec succès')
      } else {
        const { error } = await supplierService.createSupplier(formData)
        if (error) throw error
        toast.success('Fournisseur ajouté avec succès')
      }
      handleClose()
      loadSuppliers()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) return
    try {
      const { error } = await supplierService.deleteSupplier(id)
      if (error) throw error
      toast.success('Fournisseur supprimé avec succès')
      loadSuppliers()
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <h1>Gestion des fournisseurs</h1>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Ajouter un fournisseur
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Téléphone</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell>{supplier.name}</TableCell>
                <TableCell>{supplier.contact}</TableCell>
                <TableCell>{supplier.email}</TableCell>
                <TableCell>{supplier.phone}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(supplier)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(supplier.id)}>
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
          {editingSupplier ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'}
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
              name="contact"
              label="Contact"
              fullWidth
              value={formData.contact}
              onChange={handleChange}
              margin="normal"
            />
            <TextField
              name="address"
              label="Adresse"
              fullWidth
              multiline
              rows={3}
              value={formData.address}
              onChange={handleChange}
              margin="normal"
            />
            <TextField
              name="email"
              label="Email"
              fullWidth
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
            />
            <TextField
              name="phone"
              label="Téléphone"
              fullWidth
              value={formData.phone}
              onChange={handleChange}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingSupplier ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
