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
    useTheme
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Search as SearchIcon,
    Cancel as CancelIcon,
    LocalShipping as ShippingIcon,
    Assignment as AssignmentIcon,
    PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import { supplierOrdersService } from '../../services/supplierOrders';
import { DatePicker } from '@mui/x-date-pickers';
import * as supplierService from '../../services/suppliers';
import * as productService from '../../services/products';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import PurchaseOrderPreview from '../../components/PurchaseOrderPreview';

// Schéma de validation pour la commande fournisseur
const orderSchema = Yup.object().shape({
    supplier_id: Yup.string().required('Le fournisseur est requis'),
    expected_delivery_date: Yup.date().nullable(),
    notes: Yup.string(),
    payment_terms: Yup.string(),
    currency: Yup.string().required('La devise est requise'),
    shipping_cost: Yup.number().min(0, 'Le coût de livraison doit être positif').default(0),
    tax_amount: Yup.number().min(0, 'Le montant de la taxe doit être positif').default(0),
    items: Yup.array().of(
        Yup.object().shape({
            product_id: Yup.string().required('Le produit est requis'),
            quantity: Yup.number().required('La quantité est requise').min(1, 'La quantité doit être supérieure à 0'),
            unit_price: Yup.number().required('Le prix unitaire est requis').min(0, 'Le prix doit être positif')
        })
    )
});

const statusColors = {
    draft: 'default',
    pending: 'warning',
    confirmed: 'info',
    shipped: 'primary',
    delivered: 'success',
    cancelled: 'error',
    partially_delivered: 'warning'
};

const statusLabels = {
    draft: 'Brouillon',
    pending: 'En attente',
    confirmed: 'Confirmée',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
    partially_delivered: 'Partiellement livrée'
};

const SupplierOrders = () => {
    const theme = useTheme();
    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('order_date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({});
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [previewOpen, setPreviewOpen] = useState(false);

    // Formik pour la gestion du formulaire
    const formik = useFormik({
        initialValues: {
            supplier_id: '',
            expected_delivery_date: null,
            notes: '',
            payment_terms: '',
            currency: 'EUR',
            shipping_cost: 0,
            tax_amount: 0,
            items: []
        },
        validationSchema: orderSchema,
        onSubmit: async (values) => {
            try {
                if (selectedOrder) {
                    await supplierOrdersService.updateOrder(selectedOrder.id, values);
                    toast.success('Commande mise à jour avec succès');
                } else {
                    await supplierOrdersService.createOrder(values);
                    toast.success('Commande créée avec succès');
                }
                handleCloseDialog();
                loadOrders();
            } catch (error) {
                console.error('Error:', error);
                toast.error('Erreur lors de l\'enregistrement de la commande');
            }
        }
    });

    // Chargement des commandes
    const loadOrders = async () => {
        try {
            const result = await supplierOrdersService.getOrders({
                page: page + 1,
                limit: rowsPerPage,
                search: searchTerm,
                filters,
                sortBy,
                sortOrder
            });
            setOrders(result.orders);
            setTotal(result.total);
        } catch (error) {
            toast.error('Erreur lors du chargement des commandes');
        }
    };

    // Chargement des fournisseurs
    const loadSuppliers = async () => {
        const { data, error } = await supplierService.getSuppliers();
        if (error) {
            toast.error('Erreur lors du chargement des fournisseurs');
            return;
        }
        setSuppliers(data || []);
    };

    // Chargement des produits
    const loadProducts = async () => {
        const { data, error } = await productService.getProducts();
        if (error) {
            toast.error('Erreur lors du chargement des produits');
            return;
        }
        setProducts(data || []);
    };

    useEffect(() => {
        loadOrders();
        loadSuppliers();
        loadProducts();
    }, [page, rowsPerPage, searchTerm, filters, sortBy, sortOrder]);

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
    const handleOpenDialog = async (order = null) => {
        if (order) {
            setSelectedOrder(order);
            const { data: orderDetails, error } = await supplierOrdersService.getOrderById(order.id);
            if (error) {
                toast.error('Erreur lors du chargement de la commande');
                return;
            }
            formik.setValues({
                supplier_id: orderDetails.supplier_id,
                expected_delivery_date: orderDetails.expected_delivery_date ? dayjs(orderDetails.expected_delivery_date) : null,
                notes: orderDetails.notes || '',
                payment_terms: orderDetails.payment_terms || '',
                currency: orderDetails.currency || 'EUR',
                shipping_cost: orderDetails.shipping_cost || 0,
                tax_amount: orderDetails.tax_amount || 0,
                items: orderDetails.items?.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    received_quantity: item.received_quantity || 0,
                    status: item.status || 'pending'
                })) || []
            });
        } else {
            setSelectedOrder(null);
            formik.resetForm({
                values: {
                    supplier_id: '',
                    expected_delivery_date: null,
                    notes: '',
                    payment_terms: '',
                    currency: 'EUR',
                    shipping_cost: 0,
                    tax_amount: 0,
                    items: []
                }
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedOrder(null);
        formik.resetForm();
    };

    // Annulation d'une commande
    const handleCancelOrder = async (order) => {
        if (window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
            try {
                await supplierOrdersService.cancelOrder(order.id);
                toast.success('Commande annulée avec succès');
                loadOrders();
            } catch (error) {
                toast.error('Erreur lors de l\'annulation de la commande');
            }
        }
    };

    // Fonction pour ajouter une ligne de produit
    const handleAddItem = () => {
        formik.setFieldValue('items', [
            ...formik.values.items,
            { product_id: '', quantity: 1, unit_price: 0 }
        ]);
    };

    // Fonction pour supprimer une ligne de produit
    const handleRemoveItem = (index) => {
        const newItems = formik.values.items.filter((_, i) => i !== index);
        formik.setFieldValue('items', newItems);
    };

    // Fonction pour mettre à jour une ligne de produit
    const handleItemChange = (index, field, value) => {
        const newItems = [...formik.values.items];
        newItems[index] = { ...newItems[index], [field]: value };
        formik.setFieldValue('items', newItems);
    };

    // Fonction pour calculer le sous-total
    const calculateSubtotal = (items) => {
        return items.reduce((total, item) => total + (item.quantity * item.unit_price), 0);
    };

    // Fonction pour calculer le total
    const calculateTotal = (items, shippingCost, taxAmount) => {
        const subtotal = calculateSubtotal(items);
        return subtotal + (shippingCost || 0) + (taxAmount || 0);
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* En-tête */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Commandes Fournisseurs
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    Nouvelle Commande
                </Button>
            </Box>

            {/* Filtres */}
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
                        <TextField
                            fullWidth
                            select
                            label="Statut"
                            value={filters.status || ''}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <MenuItem value="">Tous</MenuItem>
                            {Object.entries(statusLabels).map(([value, label]) => (
                                <MenuItem key={value} value={value}>{label}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            select
                            label="Fournisseur"
                            value={filters.supplier_id || ''}
                            onChange={(e) => setFilters({ ...filters, supplier_id: e.target.value })}
                        >
                            <MenuItem value="">Tous</MenuItem>
                            {suppliers.map((supplier) => (
                                <MenuItem key={supplier.id} value={supplier.id}>
                                    {supplier.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                </Grid>
            </Paper>

            {/* Table des commandes */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <TableSortLabel
                                    active={sortBy === 'order_number'}
                                    direction={sortOrder}
                                    onClick={() => handleSort('order_number')}
                                >
                                    N° Commande
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortBy === 'supplier'}
                                    direction={sortOrder}
                                    onClick={() => handleSort('supplier')}
                                >
                                    Fournisseur
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortBy === 'order_date'}
                                    direction={sortOrder}
                                    onClick={() => handleSort('order_date')}
                                >
                                    Date
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell>{order.order_number}</TableCell>
                                <TableCell>{order.supplier?.name}</TableCell>
                                <TableCell>
                                    {new Date(order.order_date).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={statusLabels[order.status]}
                                        color={statusColors[order.status]}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    {order.total_amount?.toLocaleString('fr-FR', {
                                        style: 'currency',
                                        currency: order.currency || 'EUR'
                                    })}
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setPreviewOpen(true);
                                        }}
                                        title="Prévisualiser le bon de commande"
                                    >
                                        <PdfIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleOpenDialog(order)}
                                        title="Modifier"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleCancelOrder(order)}
                                        title="Annuler"
                                        color="error"
                                    >
                                        <CancelIcon />
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
                        {selectedOrder ? 'Modifier la Commande' : 'Nouvelle Commande'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Fournisseur"
                                    name="supplier_id"
                                    value={formik.values.supplier_id}
                                    onChange={formik.handleChange}
                                    error={formik.touched.supplier_id && Boolean(formik.errors.supplier_id)}
                                    helperText={formik.touched.supplier_id && formik.errors.supplier_id}
                                >
                                    {suppliers.map((supplier) => (
                                        <MenuItem key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Produits
                                </Typography>
                                {formik.values.items.map((item, index) => (
                                    <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                                        <TextField
                                            select
                                            label="Produit"
                                            value={item.product_id}
                                            onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                                            error={formik.touched.items?.[index]?.product_id && Boolean(formik.errors.items?.[index]?.product_id)}
                                            helperText={formik.touched.items?.[index]?.product_id && formik.errors.items?.[index]?.product_id}
                                            sx={{ flexGrow: 1 }}
                                        >
                                            {products.map((product) => (
                                                <MenuItem key={product.id} value={product.id}>
                                                    {product.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                        <TextField
                                            type="number"
                                            label="Quantité"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                            error={formik.touched.items?.[index]?.quantity && Boolean(formik.errors.items?.[index]?.quantity)}
                                            helperText={formik.touched.items?.[index]?.quantity && formik.errors.items?.[index]?.quantity}
                                            sx={{ width: 120 }}
                                        />
                                        <TextField
                                            type="number"
                                            label="Prix unitaire"
                                            value={item.unit_price}
                                            onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                                            error={formik.touched.items?.[index]?.unit_price && Boolean(formik.errors.items?.[index]?.unit_price)}
                                            helperText={formik.touched.items?.[index]?.unit_price && formik.errors.items?.[index]?.unit_price}
                                            sx={{ width: 120 }}
                                        />
                                        <Box sx={{ width: 120, textAlign: 'right' }}>
                                            {(item.quantity * item.unit_price).toLocaleString('fr-FR', {
                                                style: 'currency',
                                                currency: formik.values.currency
                                            })}
                                        </Box>
                                        <IconButton color="error" onClick={() => handleRemoveItem(index)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                ))}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, mb: 2 }}>
                                    <Button
                                        startIcon={<AddIcon />}
                                        onClick={handleAddItem}
                                        variant="outlined"
                                    >
                                        Ajouter un produit
                                    </Button>
                                    <Typography variant="h6">
                                        Total: {formik.values.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toLocaleString('fr-FR', {
                                            style: 'currency',
                                            currency: formik.values.currency
                                        })}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <DatePicker
                                    label="Date de livraison prévue"
                                    value={formik.values.expected_delivery_date}
                                    onChange={(newValue) => {
                                        formik.setFieldValue('expected_delivery_date', newValue);
                                    }}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            error: formik.touched.expected_delivery_date && Boolean(formik.errors.expected_delivery_date),
                                            helperText: formik.touched.expected_delivery_date && formik.errors.expected_delivery_date
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Devise"
                                    name="currency"
                                    value={formik.values.currency}
                                    onChange={formik.handleChange}
                                    error={formik.touched.currency && Boolean(formik.errors.currency)}
                                    helperText={formik.touched.currency && formik.errors.currency}
                                >
                                    <MenuItem value="EUR">EUR</MenuItem>
                                    <MenuItem value="USD">USD</MenuItem>
                                    <MenuItem value="GBP">GBP</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Coût de livraison"
                                    name="shipping_cost"
                                    value={formik.values.shipping_cost}
                                    onChange={formik.handleChange}
                                    error={formik.touched.shipping_cost && Boolean(formik.errors.shipping_cost)}
                                    helperText={formik.touched.shipping_cost && formik.errors.shipping_cost}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Montant de la taxe"
                                    name="tax_amount"
                                    value={formik.values.tax_amount}
                                    onChange={formik.handleChange}
                                    error={formik.touched.tax_amount && Boolean(formik.errors.tax_amount)}
                                    helperText={formik.touched.tax_amount && formik.errors.tax_amount}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Conditions de paiement"
                                    name="payment_terms"
                                    value={formik.values.payment_terms}
                                    onChange={formik.handleChange}
                                    error={formik.touched.payment_terms && Boolean(formik.errors.payment_terms)}
                                    helperText={formik.touched.payment_terms && formik.errors.payment_terms}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Notes"
                                    name="notes"
                                    value={formik.values.notes}
                                    onChange={formik.handleChange}
                                    error={formik.touched.notes && Boolean(formik.errors.notes)}
                                    helperText={formik.touched.notes && formik.errors.notes}
                                />
                            </Grid>
                            {/* Résumé de la commande */}
                            <Grid item xs={12}>
                                <Card sx={{ mt: 2 }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Résumé de la commande
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography>Sous-total:</Typography>
                                                    <Typography>
                                                        {calculateSubtotal(formik.values.items).toLocaleString('fr-FR', {
                                                            style: 'currency',
                                                            currency: formik.values.currency
                                                        })}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography>Frais de livraison:</Typography>
                                                    <Typography>
                                                        {Number(formik.values.shipping_cost).toLocaleString('fr-FR', {
                                                            style: 'currency',
                                                            currency: formik.values.currency
                                                        })}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography>Taxes:</Typography>
                                                    <Typography>
                                                        {Number(formik.values.tax_amount).toLocaleString('fr-FR', {
                                                            style: 'currency',
                                                            currency: formik.values.currency
                                                        })}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                                    <Typography variant="h6">Total:</Typography>
                                                    <Typography variant="h6">
                                                        {calculateTotal(
                                                            formik.values.items,
                                                            formik.values.shipping_cost,
                                                            formik.values.tax_amount
                                                        ).toLocaleString('fr-FR', {
                                                            style: 'currency',
                                                            currency: formik.values.currency
                                                        })}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Annuler</Button>
                        <Button type="submit" variant="contained">
                            {selectedOrder ? 'Modifier' : 'Créer'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
            
            <PurchaseOrderPreview
                order={selectedOrder}
                open={previewOpen}
                onClose={() => {
                    setPreviewOpen(false);
                    setSelectedOrder(null);
                }}
            />
        </Box>
    );
};

export default SupplierOrders;
