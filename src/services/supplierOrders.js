import { supabase } from '../config/supabase';

export const supplierOrdersService = {
    // Récupérer toutes les commandes fournisseurs avec pagination et filtres
    getOrders: async ({ page = 1, limit = 10, search = '', filters = {}, sortBy = 'order_date', sortOrder = 'desc' }) => {
        try {
            let query = supabase
                .from('amg_supplier_orders')
                .select(`
                    *,
                    supplier:amg_suppliers(id, name),
                    items:amg_supplier_order_items(
                        id,
                        product_id,
                        quantity,
                        unit_price,
                        total_price,
                        received_quantity,
                        status,
                        product:amg_products(id, name)
                    )
                `, { count: 'exact' });

            // Appliquer les filtres
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.supplier_id) {
                query = query.eq('supplier_id', filters.supplier_id);
            }
            if (filters.dateFrom) {
                query = query.gte('order_date', filters.dateFrom);
            }
            if (filters.dateTo) {
                query = query.lte('order_date', filters.dateTo);
            }
            if (search) {
                query = query.or(`order_number.ilike.%${search}%,supplier.name.ilike.%${search}%`);
            }

            // Pagination et tri
            query = query.order(sortBy, { ascending: sortOrder === 'asc' });
            if (limit > 0) {
                query = query.range((page - 1) * limit, page * limit - 1);
            }

            const { data, count, error } = await query;

            if (error) throw error;

            return {
                orders: data || [],
                total: count || 0
            };
        } catch (error) {
            console.error('Error fetching orders:', error);
            return { error };
        }
    },

    // Récupérer une commande par son ID
    getOrderById: async (orderId) => {
        try {
            const { data, error } = await supabase
                .from('amg_supplier_orders')
                .select(`
                    *,
                    supplier:amg_suppliers(id, name),
                    items:amg_supplier_order_items(
                        id,
                        product_id,
                        quantity,
                        unit_price,
                        total_price,
                        received_quantity,
                        status,
                        product:amg_products(id, name)
                    )
                `)
                .eq('id', orderId)
                .single();

            if (error) throw error;

            // Formater les données pour le formulaire
            return {
                data: {
                    ...data,
                    items: data.items.map(item => ({
                        ...item,  // Garder toutes les données de l'item
                        product_id: item.product_id,
                        product: item.product,  // Garder les informations du produit
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        received_quantity: item.received_quantity,
                        status: item.status
                    }))
                }
            };
        } catch (error) {
            console.error('Error fetching order:', error);
            return { error };
        }
    },

    // Créer une nouvelle commande
    createOrder: async (orderData) => {
        try {
            const { items, ...orderDetails } = orderData;
            
            // Générer un numéro de commande unique
            const orderNumber = await generateOrderNumber();

            // Début de la transaction
            const { error: beginError } = await supabase.rpc('begin_transaction');
            if (beginError) throw beginError;
            
            try {
                // Créer la commande
                const { data: order, error: orderError } = await supabase
                    .from('amg_supplier_orders')
                    .insert([{ ...orderDetails, order_number: orderNumber, status: 'draft' }])
                    .select()
                    .single();

                if (orderError) throw orderError;

                // Ajouter les articles
                if (items && items.length > 0) {
                    const orderItems = items.map(item => ({
                        order_id: order.id,
                        product_id: item.product_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        expected_delivery_date: item.expected_delivery_date,
                        received_quantity: 0,
                        status: 'pending'
                    }));

                    const { error: itemsError } = await supabase
                        .from('amg_supplier_order_items')
                        .insert(orderItems);

                    if (itemsError) throw itemsError;
                }

                // Valider la transaction
                const { error: commitError } = await supabase.rpc('commit_transaction');
                if (commitError) throw commitError;

                // Récupérer la commande avec tous ses articles
                const { data: fullOrder, error: getError } = await supabase
                    .from('amg_supplier_orders')
                    .select(`
                        *,
                        supplier:amg_suppliers(id, name),
                        items:amg_supplier_order_items(
                            id,
                            product_id,
                            quantity,
                            unit_price,
                            total_price,
                            received_quantity,
                            status,
                            product:amg_products(id, name)
                        )
                    `)
                    .eq('id', order.id)
                    .single();

                if (getError) throw getError;

                return { data: fullOrder };
            } catch (error) {
                // Annuler la transaction en cas d'erreur
                await supabase.rpc('rollback_transaction');
                throw error;
            }
        } catch (error) {
            console.error('Error creating order:', error);
            return { error };
        }
    },

    // Mettre à jour une commande
    updateOrder: async (orderId, orderData) => {
        const { items, ...orderDetails } = orderData;

        try {
            // Début de la transaction
            const { error: beginError } = await supabase.rpc('begin_transaction');
            if (beginError) throw beginError;

            try {
                // 1. Mettre à jour la commande
                const { data: order, error: orderError } = await supabase
                    .from('amg_supplier_orders')
                    .update(orderDetails)
                    .eq('id', orderId)
                    .select()
                    .single();

                if (orderError) throw orderError;

                // 2. Supprimer les anciens articles
                const { error: deleteError } = await supabase
                    .from('amg_supplier_order_items')
                    .delete()
                    .eq('order_id', orderId);

                if (deleteError) throw deleteError;

                // 3. Ajouter les nouveaux articles
                if (items && items.length > 0) {
                    const orderItems = items.map(item => ({
                        order_id: orderId,
                        product_id: item.product_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        expected_delivery_date: item.expected_delivery_date,
                        received_quantity: item.received_quantity || 0,
                        status: item.status || 'pending'
                    }));

                    const { error: itemsError } = await supabase
                        .from('amg_supplier_order_items')
                        .insert(orderItems);

                    if (itemsError) throw itemsError;
                }

                // Valider la transaction
                const { error: commitError } = await supabase.rpc('commit_transaction');
                if (commitError) throw commitError;

                // Récupérer la commande mise à jour avec tous ses articles
                const { data: fullOrder, error: getError } = await supabase
                    .from('amg_supplier_orders')
                    .select(`
                        *,
                        supplier:amg_suppliers(id, name),
                        items:amg_supplier_order_items(
                            id,
                            product_id,
                            quantity,
                            unit_price,
                            total_price,
                            received_quantity,
                            status,
                            product:amg_products(id, name)
                        )
                    `)
                    .eq('id', orderId)
                    .single();

                if (getError) throw getError;

                return { data: fullOrder };
            } catch (error) {
                // Annuler la transaction en cas d'erreur
                await supabase.rpc('rollback_transaction');
                throw error;
            }
        } catch (error) {
            console.error('Error updating order:', error);
            return { error };
        }
    },

    // Supprimer une commande
    deleteOrder: async (orderId) => {
        try {
            const { error } = await supabase
                .from('amg_supplier_orders')
                .delete()
                .eq('id', orderId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting supplier order:', error);
            throw error;
        }
    },

    // Ajouter des articles à une commande
    addOrderItems: async (orderId, items) => {
        try {
            const { data, error } = await supabase
                .from('amg_supplier_order_items')
                .insert(items.map(item => ({
                    order_id: orderId,
                    ...item,
                    status: 'pending'
                })))
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error adding order items:', error);
            throw error;
        }
    },

    // Mettre à jour la réception des articles
    updateOrderItemsReception: async (orderId, items) => {
        try {
            const updates = items.map(item => 
                supabase
                    .from('amg_supplier_order_items')
                    .update({
                        received_quantity: item.received_quantity,
                        status: item.received_quantity === item.quantity ? 'received' : 
                               item.received_quantity > 0 ? 'partially_received' : 'pending'
                    })
                    .eq('id', item.id)
            );

            await Promise.all(updates);
        } catch (error) {
            console.error('Error updating order items reception:', error);
            throw error;
        }
    },

    // Annuler une commande
    cancelOrder: async (orderId) => {
        try {
            const { data: order, error } = await supabase
                .from('amg_supplier_orders')
                .update({ status: 'cancelled' })
                .eq('id', orderId)
                .select()
                .single();

            if (error) throw error;
            return order;
        } catch (error) {
            console.error('Error cancelling supplier order:', error);
            throw error;
        }
    }
};

// Fonction utilitaire pour générer un numéro de commande unique
async function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Récupérer le dernier numéro de commande pour ce mois
    const { data: lastOrder } = await supabase
        .from('amg_supplier_orders')
        .select('order_number')
        .ilike('order_number', `CMD${year}${month}%`)
        .order('order_number', { ascending: false })
        .limit(1);

    let sequence = '001';
    if (lastOrder && lastOrder.length > 0) {
        const lastSequence = parseInt(lastOrder[0].order_number.slice(-3));
        sequence = (lastSequence + 1).toString().padStart(3, '0');
    }

    return `CMD${year}${month}${sequence}`;
}
