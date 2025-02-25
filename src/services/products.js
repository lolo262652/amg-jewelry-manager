import { supabase, getFileUrl } from '../config/supabase'

const TABLE_NAME = 'amg_products'
const IMAGES_TABLE = 'amg_product_images'
const DOCUMENTS_TABLE = 'amg_product_documents'
const STORAGE_BUCKET = 'products'

const getPublicUrls = (data) => {
  if (!data) return data;
  
  return data.map(product => {
    // Traiter les images
    if (product.images) {
      product.images = product.images.map(img => {
        // Si l'URL est déjà complète, on la garde
        if (img.image_url.startsWith('http')) {
          return img;
        }
        
        // Obtenir l'URL publique via Supabase
        const { data } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(img.image_url);
          
        console.log('Image URL originale:', img.image_url);
        console.log('Public URL générée:', data?.publicUrl);
        
        return {
          ...img,
          image_url: data?.publicUrl || img.image_url
        };
      });
    }
    
    // Traiter les documents
    if (product.documents) {
      product.documents = product.documents.map(doc => {
        // Si l'URL est déjà complète, on la garde
        if (doc.document_url.startsWith('http')) {
          return doc;
        }
        
        // Obtenir l'URL publique via Supabase
        const { data } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(doc.document_url);
          
        console.log('Document URL originale:', doc.document_url);
        console.log('Public URL générée:', data?.publicUrl);
        
        return {
          ...doc,
          document_url: data?.publicUrl || doc.document_url
        };
      });
    }
    
    return product;
  });
}

export const getProducts = async () => {
  try {
    console.log('Fetching products...')
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`
        *,
        category:amg_categories(id, name),
        supplier:amg_suppliers(id, name),
        images:amg_product_images(id, image_url, image_order),
        documents:amg_product_documents(id, document_url, document_order)
      `)
      .order('name')
    
    if (error) {
      console.error('Error fetching products:', error)
      throw error
    }
    
    const productsWithUrls = getPublicUrls(data);
    console.log('Products fetched successfully:', productsWithUrls)
    return { data: productsWithUrls, error: null }
  } catch (error) {
    console.error('Error in getProducts:', error)
    return { data: null, error }
  }
}

export const getProduct = async (id) => {
  try {
    console.log('Fetching product...')
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(`
        *,
        category:amg_categories(id, name),
        supplier:amg_suppliers(id, name),
        images:amg_product_images(id, image_url, image_order),
        documents:amg_product_documents(id, document_url, document_order)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching product:', error)
      throw error
    }
    
    const productWithUrls = getPublicUrls([data])[0];
    console.log('Product fetched successfully:', productWithUrls)
    return { data: productWithUrls, error: null }
  } catch (error) {
    console.error('Error in getProduct:', error)
    return { data: null, error }
  }
}

export const createProduct = async (product) => {
  try {
    console.log('Creating product:', product)
    const { name, description, price, category_id, supplier_id, images, documents } = product

    // Create product
    const { data: newProduct, error: productError } = await supabase
      .from(TABLE_NAME)
      .insert([
        { name, description, price, category_id, supplier_id }
      ])
      .select()
      .single()

    if (productError) {
      console.error('Error creating product:', productError)
      throw productError
    }

    console.log('Product created successfully:', newProduct)

    // Upload and save images
    if (images && images.length > 0) {
      console.log('Uploading images...')
      const imagePromises = images.map(async (file, index) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `images/${newProduct.id}/${Date.now()}-${index}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, file)

        if (uploadError) {
          console.error('Error uploading image:', uploadError)
          throw uploadError
        }
        
        return { image_url: fileName, image_order: index, product_id: newProduct.id }
      })

      const imageData = await Promise.all(imagePromises)
      const { error: imagesError } = await supabase
        .from(IMAGES_TABLE)
        .insert(imageData)

      if (imagesError) {
        console.error('Error saving image records:', imagesError)
        throw imagesError
      }

      console.log('Images uploaded successfully')
    }

    // Upload and save documents
    if (documents && documents.length > 0) {
      console.log('Uploading documents...')
      const documentPromises = documents.map(async (file, index) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `documents/${newProduct.id}/${Date.now()}-${index}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, file)

        if (uploadError) {
          console.error('Error uploading document:', uploadError)
          throw uploadError
        }
        
        return { document_url: fileName, document_order: index, product_id: newProduct.id }
      })

      const documentData = await Promise.all(documentPromises)
      const { error: documentsError } = await supabase
        .from(DOCUMENTS_TABLE)
        .insert(documentData)

      if (documentsError) {
        console.error('Error saving document records:', documentsError)
        throw documentsError
      }

      console.log('Documents uploaded successfully')
    }
    
    const productWithUrls = getPublicUrls([newProduct])[0];
    return { data: productWithUrls, error: null }
  } catch (error) {
    console.error('Error in createProduct:', error)
    return { data: null, error }
  }
}

export const updateProduct = async (id, product) => {
  try {
    console.log('Updating product:', product)
    const { images, documents, ...productData } = product
    
    // Update product
    const { data: updatedProduct, error: productError } = await supabase
      .from(TABLE_NAME)
      .update(productData)
      .eq('id', id)
      .select()
      .single()
    
    if (productError) {
      console.error('Error updating product:', productError)
      throw productError
    }
    
    console.log('Product updated successfully:', updatedProduct)
    
    // Handle images
    if (images && images.length > 0) {
      // Delete old images
      const { error: deleteImagesError } = await supabase
        .from(IMAGES_TABLE)
        .delete()
        .eq('product_id', id)
      
      if (deleteImagesError) {
        console.error('Error deleting old images:', deleteImagesError)
        throw deleteImagesError
      }
      
      console.log('Old images deleted successfully')
      
      // Upload new images
      const imagePromises = images.map(async (file, index) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `images/${id}/${Date.now()}-${index}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, file)

        if (uploadError) {
          console.error('Error uploading image:', uploadError)
          throw uploadError
        }
        
        return { image_url: fileName, image_order: index, product_id: id }
      })
      
      const imageResults = await Promise.all(imagePromises)
      const { error: imagesError } = await supabase
        .from(IMAGES_TABLE)
        .insert(imageResults)
      
      if (imagesError) {
        console.error('Error saving image records:', imagesError)
        throw imagesError
      }
      
      console.log('Images uploaded successfully')
    }
    
    // Handle documents
    if (documents && documents.length > 0) {
      // Delete old documents
      const { error: deleteDocumentsError } = await supabase
        .from(DOCUMENTS_TABLE)
        .delete()
        .eq('product_id', id)
      
      if (deleteDocumentsError) {
        console.error('Error deleting old documents:', deleteDocumentsError)
        throw deleteDocumentsError
      }
      
      console.log('Old documents deleted successfully')
      
      // Upload new documents
      const documentPromises = documents.map(async (file, index) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `documents/${id}/${Date.now()}-${index}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, file)

        if (uploadError) {
          console.error('Error uploading document:', uploadError)
          throw uploadError
        }
        
        return { document_url: fileName, document_order: index, product_id: id }
      })
      
      const documentResults = await Promise.all(documentPromises)
      const { error: documentsError } = await supabase
        .from(DOCUMENTS_TABLE)
        .insert(documentResults)
      
      if (documentsError) {
        console.error('Error saving document records:', documentsError)
        throw documentsError
      }
      
      console.log('Documents uploaded successfully')
    }
    
    const productWithUrls = getPublicUrls([updatedProduct])[0];
    return { data: productWithUrls, error: null }
  } catch (error) {
    console.error('Error in updateProduct:', error)
    return { data: null, error }
  }
}

export const deleteProduct = async (id) => {
  try {
    console.log('Deleting product...')
    
    // Delete associated files from storage
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([`images/${id}`, `documents/${id}`])
    
    console.log('Associated files deleted successfully')
    
    // Delete product and related records (cascade delete should handle images and documents)
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting product:', error)
      throw error
    }
    
    console.log('Product deleted successfully')
    return { error: null }
  } catch (error) {
    console.error('Error in deleteProduct:', error)
    return { error }
  }
}
