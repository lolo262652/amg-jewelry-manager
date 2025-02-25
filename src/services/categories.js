import { supabase } from '../config/supabase'

const TABLE_NAME = 'amg_categories'

export const getCategories = async () => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('name')
  
  return { data, error }
}

export const getCategory = async (id) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', id)
    .single()
  
  return { data, error }
}

export const createCategory = async (category) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([category])
    .select()
  
  return { data, error }
}

export const updateCategory = async (id, category) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(category)
    .eq('id', id)
    .select()
  
  return { data, error }
}

export const deleteCategory = async (id) => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id)
  
  return { error }
}
