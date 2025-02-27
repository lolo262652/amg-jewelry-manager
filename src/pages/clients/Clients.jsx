import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Star as StarIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import { clientsService } from '../../services/clients';

// Schéma de validation commun
const commonSchema = {
  email: Yup.string().email('Email invalide'),
  phone: Yup.string(),
  address: Yup.string(),
  postal_code: Yup.string(),
  city: Yup.string(),
  country: Yup.string(),
  preferred_contact_method: Yup.string(),
  newsletter_subscribed: Yup.boolean(),
  special_offers_subscribed: Yup.boolean()
};

// Schéma de validation pour particulier
const individualSchema = Yup.object().shape({
  client_type: Yup.string().required().equals(['individual']),
  civility: Yup.string().required('La civilité est requise'),
  first_name: Yup.string().required('Le prénom est requis'),
  last_name: Yup.string().required('Le nom est requis'),
  ...commonSchema
});

// Schéma de validation pour entreprise
const companySchema = Yup.object().shape({
  client_type: Yup.string().required().equals(['company']),
  company_name: Yup.string().required('Le nom de l\'entreprise est requis'),
  siret: Yup.string().required('Le SIRET est requis'),
  vat_number: Yup.string(),
  legal_form: Yup.string(),
  contact_name: Yup.string().required('Le nom du contact est requis'),
  contact_role: Yup.string(),
  ...commonSchema
});

const ClientsPage = () => {
  const theme = useTheme();
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('last_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientType, setClientType] = useState('individual');
  const [showInactive, setShowInactive] = useState(false);

  // Formik pour la gestion du formulaire
  const formik = useFormik({
    initialValues: {
      client_type: 'individual',
      civility: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      postal_code: '',
      city: '',
      country: 'France',
      preferred_contact_method: 'email',
      newsletter_subscribed: false,
      special_offers_subscribed: false,
      // Champs entreprise
      company_name: '',
      siret: '',
      vat_number: '',
      legal_form: '',
      contact_name: '',
      contact_role: '',
      contact_email: '',
      contact_phone: '',
      is_active: true
    },
    validationSchema: clientType === 'individual' ? individualSchema : companySchema,
    onSubmit: async (values) => {
      try {
        if (selectedClient) {
          await clientsService.updateClient(selectedClient.id, values);
          toast.success('Client mis à jour avec succès');
        } else {
          await clientsService.createClient(values);
          toast.success('Client créé avec succès');
        }
        handleCloseDialog();
        loadClients();
      } catch (error) {
        toast.error('Erreur: ' + error.message);
      }
    }
  });

  // Chargement des clients
  const loadClients = async () => {
    try {
      const result = await clientsService.getClients({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        filters: { ...filters, is_active: !showInactive },
        sortBy,
        sortOrder,
        clientType
      });
      setClients(result.clients);
      setTotal(result.total);
    } catch (error) {
      toast.error('Erreur lors du chargement des clients');
    }
  };

  useEffect(() => {
    loadClients();
  }, [page, rowsPerPage, searchTerm, filters, sortBy, sortOrder, clientType, showInactive]);

  // Gestion du changement de type de client
  const handleClientTypeChange = (event, newValue) => {
    setClientType(newValue);
    formik.setValues({
      ...formik.initialValues,
      client_type: newValue
    });
  };

  // Gestion du statut actif/inactif
  const handleToggleStatus = async (client) => {
    try {
      await clientsService.toggleClientStatus(client.id, !client.is_active);
      toast.success('Statut mis à jour avec succès');
      loadClients();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  // Gestion du tri
  const handleSort = (column) => {
    const isAsc = sortBy === column && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(column);
  };

  // Gestion de la pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Gestion du dialogue
  const handleOpenDialog = (client = null) => {
    if (client) {
      setSelectedClient(client);
      formik.setValues({
        ...client,
        client_type: client.client_type || 'individual'
      });
    } else {
      setSelectedClient(null);
      formik.resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClient(null);
    formik.resetForm();
  };

  // Gestion du statut VIP
  const handleVipStatus = async (client) => {
    try {
      await clientsService.updateVipStatus(client.id, !client.vip_status);
      toast.success('Statut VIP mis à jour');
      loadClients();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut VIP');
    }
  };

  // Suppression d'un client
  const handleDelete = async (client) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        await clientsService.deleteClient(client.id);
        toast.success('Client supprimé avec succès');
        loadClients();
      } catch (error) {
        toast.error('Erreur lors de la suppression du client');
      }
    }
  };

  // Rendu des colonnes selon le type de client
  const getColumns = () => {
    const commonColumns = [
      { id: 'email', label: 'Email' },
      { id: 'phone', label: 'Téléphone' },
      { id: 'city', label: 'Ville' },
      { id: 'status', label: 'Statut' }
    ];

    if (clientType === 'company') {
      return [
        { id: 'company_name', label: 'Entreprise' },
        { id: 'siret', label: 'SIRET' },
        ...commonColumns
      ];
    }

    return [
      { id: 'name', label: 'Nom' },
      ...commonColumns
    ];
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestion des Clients
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouveau Client
        </Button>
      </Box>

      {/* Sélection du type de client */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={clientType}
          onChange={handleClientTypeChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab 
            icon={<PersonIcon />} 
            label="Particuliers" 
            value="individual"
          />
          <Tab 
            icon={<BusinessIcon />} 
            label="Entreprises" 
            value="company"
          />
        </Tabs>
      </Paper>

      {/* Barre de recherche et filtres */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Rechercher"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1 }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={!showInactive}
                  onChange={(e) => setShowInactive(!e.target.checked)}
                />
              }
              label="Clients actifs uniquement"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Table des clients */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {getColumns().map((column) => (
                <TableCell key={column.id}>
                  <TableSortLabel
                    active={sortBy === column.id}
                    direction={sortOrder}
                    onClick={() => handleSort(column.id)}
                  >
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell>Points</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client) => (
              <TableRow 
                key={client.id}
                sx={{
                  backgroundColor: !client.is_active ? 'action.hover' : 'inherit'
                }}
              >
                {clientType === 'company' ? (
                  <>
                    <TableCell>{client.company_name}</TableCell>
                    <TableCell>{client.siret}</TableCell>
                  </>
                ) : (
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {client.vip_status && (
                        <StarIcon sx={{ color: theme.palette.warning.main, mr: 1 }} />
                      )}
                      {client.civility} {client.first_name} {client.last_name}
                    </Box>
                  </TableCell>
                )}
                <TableCell>{client.email}</TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell>{client.city}</TableCell>
                <TableCell>
                  <Chip
                    label={client.is_active ? 'Actif' : 'Inactif'}
                    color={client.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{client.loyalty_points}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleToggleStatus(client)}
                    color={client.is_active ? 'success' : 'default'}
                  >
                    <Switch
                      checked={client.is_active}
                      size="small"
                    />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleVipStatus(client)}
                    color={client.vip_status ? 'warning' : 'default'}
                  >
                    <StarIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(client)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(client)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page"
        />
      </TableContainer>

      {/* Dialogue d'édition/création */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle>
            {selectedClient ? 'Modifier le Client' : 'Nouveau Client'}
          </DialogTitle>
          <DialogContent>
            {/* Type de client */}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Tabs
                  value={formik.values.client_type}
                  onChange={(e, value) => {
                    formik.setFieldValue('client_type', value);
                    formik.setValues({
                      ...formik.initialValues,
                      client_type: value
                    });
                  }}
                >
                  <Tab 
                    icon={<PersonIcon />} 
                    label="Particulier" 
                    value="individual"
                  />
                  <Tab 
                    icon={<BusinessIcon />} 
                    label="Entreprise" 
                    value="company"
                  />
                </Tabs>
              </Grid>

              {formik.values.client_type === 'individual' ? (
                // Champs pour particulier
                <>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      select
                      label="Civilité"
                      name="civility"
                      value={formik.values.civility}
                      onChange={formik.handleChange}
                      error={formik.touched.civility && Boolean(formik.errors.civility)}
                      helperText={formik.touched.civility && formik.errors.civility}
                    >
                      <MenuItem value="M.">M.</MenuItem>
                      <MenuItem value="Mme">Mme</MenuItem>
                      <MenuItem value="Autre">Autre</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Prénom"
                      name="first_name"
                      value={formik.values.first_name}
                      onChange={formik.handleChange}
                      error={formik.touched.first_name && Boolean(formik.errors.first_name)}
                      helperText={formik.touched.first_name && formik.errors.first_name}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Nom"
                      name="last_name"
                      value={formik.values.last_name}
                      onChange={formik.handleChange}
                      error={formik.touched.last_name && Boolean(formik.errors.last_name)}
                      helperText={formik.touched.last_name && formik.errors.last_name}
                    />
                  </Grid>
                </>
              ) : (
                // Champs pour entreprise
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nom de l'entreprise"
                      name="company_name"
                      value={formik.values.company_name}
                      onChange={formik.handleChange}
                      error={formik.touched.company_name && Boolean(formik.errors.company_name)}
                      helperText={formik.touched.company_name && formik.errors.company_name}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="SIRET"
                      name="siret"
                      value={formik.values.siret}
                      onChange={formik.handleChange}
                      error={formik.touched.siret && Boolean(formik.errors.siret)}
                      helperText={formik.touched.siret && formik.errors.siret}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Numéro de TVA"
                      name="vat_number"
                      value={formik.values.vat_number}
                      onChange={formik.handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Forme juridique"
                      name="legal_form"
                      value={formik.values.legal_form}
                      onChange={formik.handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nom du contact"
                      name="contact_name"
                      value={formik.values.contact_name}
                      onChange={formik.handleChange}
                      error={formik.touched.contact_name && Boolean(formik.errors.contact_name)}
                      helperText={formik.touched.contact_name && formik.errors.contact_name}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Fonction du contact"
                      name="contact_role"
                      value={formik.values.contact_role}
                      onChange={formik.handleChange}
                    />
                  </Grid>
                </>
              )}

              {/* Champs communs */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Téléphone"
                  name="phone"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Adresse"
                  name="address"
                  value={formik.values.address}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Code Postal"
                  name="postal_code"
                  value={formik.values.postal_code}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Ville"
                  name="city"
                  value={formik.values.city}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Pays"
                  name="country"
                  value={formik.values.country}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formik.values.is_active}
                      onChange={(e) => formik.setFieldValue('is_active', e.target.checked)}
                      name="is_active"
                    />
                  }
                  label="Client actif"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Annuler</Button>
            <Button type="submit" variant="contained">
              {selectedClient ? 'Modifier' : 'Créer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ClientsPage;
