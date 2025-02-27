import { supabase } from '../config/supabase'

const TABLE_NAME = 'amg_suppliers'

export const getSuppliers = async () => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('name')
  
  return { data, error }
}

export const getSupplier = async (id) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', id)
    .single()
  
  return { data, error }
}

export const createSupplier = async (supplier) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([supplier])
    .select()
  
  return { data, error }
}

export const updateSupplier = async (id, supplier) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(supplier)
    .eq('id', id)
    .select()
  
  return { data, error }
}

export const deleteSupplier = async (id) => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id)
  
  return { error }
}
