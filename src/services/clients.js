import { supabase } from '../config/supabase';

const TABLE_NAME = 'amg_clients';

export const clientsService = {
  // Récupérer tous les clients avec pagination et filtres
  getClients: async ({ 
    page = 1, 
    limit = 10, 
    search = '', 
    filters = {}, 
    sortBy = 'last_name', 
    sortOrder = 'asc',
    clientType = null 
  }) => {
    try {
      let query = supabase
        .from(TABLE_NAME)
        .select('*', { count: 'exact' });

      // Filtre par type de client
      if (clientType) {
        query = query.eq('client_type', clientType);
      }

      // Recherche selon le type de client
      if (search) {
        if (clientType === 'company') {
          query = query.or(`company_name.ilike.%${search}%,siret.ilike.%${search}%,email.ilike.%${search}%`);
        } else if (clientType === 'individual') {
          query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
        } else {
          query = query.or(`
            company_name.ilike.%${search}%,
            siret.ilike.%${search}%,
            first_name.ilike.%${search}%,
            last_name.ilike.%${search}%,
            email.ilike.%${search}%
          `);
        }
      }

      // Filtre actif/inactif
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      // Autres filtres
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && key !== 'is_active') {
          if (Array.isArray(value)) {
            query = query.contains(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Tri adaptatif selon le type de client
      const orderBy = clientType === 'company' ? 'company_name' : sortBy;
      query = query.order(orderBy, { ascending: sortOrder === 'asc' });

      // Pagination
      const startIndex = (page - 1) * limit;
      query = query.range(startIndex, startIndex + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        clients: data,
        total: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      throw error;
    }
  },

  // Récupérer un client par ID
  getClientById: async (id) => {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du client:', error);
      throw error;
    }
  },

  // Créer un nouveau client
  createClient: async (clientData) => {
    try {
      // Validation selon le type de client
      if (clientData.client_type === 'individual') {
        if (!clientData.first_name || !clientData.last_name) {
          throw new Error('Le prénom et le nom sont requis pour un particulier');
        }
      } else if (clientData.client_type === 'company') {
        if (!clientData.company_name) {
          throw new Error('Le nom de l\'entreprise est requis');
        }
      }

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([clientData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      throw error;
    }
  },

  // Mettre à jour un client
  updateClient: async (id, clientData) => {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(clientData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du client:', error);
      throw error;
    }
  },

  // Changer le statut actif/inactif
  toggleClientStatus: async (id, isActive) => {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      throw error;
    }
  },

  // Gérer les documents
  addDocument: async (id, document) => {
    try {
      const { data: client } = await supabase
        .from(TABLE_NAME)
        .select('documents')
        .eq('id', id)
        .single();

      const documents = client.documents || [];
      documents.push({
        ...document,
        id: Date.now(),
        uploadDate: new Date().toISOString()
      });

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({ documents })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du document:', error);
      throw error;
    }
  },

  // Supprimer un document
  removeDocument: async (id, documentId) => {
    try {
      const { data: client } = await supabase
        .from(TABLE_NAME)
        .select('documents')
        .eq('id', id)
        .single();

      const documents = client.documents.filter(doc => doc.id !== documentId);

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({ documents })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      throw error;
    }
  },

  // Mettre à jour le statut VIP
  updateVipStatus: async (id, isVip) => {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({ vip_status: isVip })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut VIP:', error);
      throw error;
    }
  },

  // Ajouter/Retirer des points de fidélité
  updateLoyaltyPoints: async (id, points) => {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({
          loyalty_points: supabase.raw(`loyalty_points + ${points}`)
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des points de fidélité:', error);
      throw error;
    }
  },

  // Ajouter/Retirer des tags
  updateTags: async (id, tags, action = 'add') => {
    try {
      let updateQuery;
      if (action === 'add') {
        updateQuery = {
          tags: supabase.raw(`array_append(COALESCE(tags, ARRAY[]::text[]), ${tags})`)
        };
      } else {
        updateQuery = {
          tags: supabase.raw(`array_remove(COALESCE(tags, ARRAY[]::text[]), ${tags})`)
        };
      }

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updateQuery)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des tags:', error);
      throw error;
    }
  },

  // Obtenir les statistiques des clients
  getClientStats: async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_client_statistics');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  },

  // Supprimer un client
  deleteClient: async (id) => {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error);
      throw error;
    }
  },
};
