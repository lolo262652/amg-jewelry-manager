-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create suppliers table
CREATE TABLE IF NOT EXISTS amg_suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR NOT NULL,
    contact VARCHAR,
    address TEXT,
    email VARCHAR,
    phone VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create categories table
CREATE TABLE IF NOT EXISTS amg_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS amg_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    category_id UUID REFERENCES amg_categories(id),
    supplier_id UUID REFERENCES amg_suppliers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create product images table
CREATE TABLE IF NOT EXISTS amg_product_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES amg_products(id) ON DELETE CASCADE,
    image_url VARCHAR NOT NULL,
    image_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create product documents table
CREATE TABLE IF NOT EXISTS amg_product_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES amg_products(id) ON DELETE CASCADE,
    document_url VARCHAR NOT NULL,
    document_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE amg_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE amg_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE amg_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE amg_product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE amg_product_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON amg_suppliers;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON amg_categories;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON amg_products;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON amg_product_images;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON amg_product_documents;

-- Create policies for authenticated users
CREATE POLICY "Allow full access for authenticated users" ON amg_suppliers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for authenticated users" ON amg_categories
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for authenticated users" ON amg_products
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for authenticated users" ON amg_product_images
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for authenticated users" ON amg_product_documents
    FOR ALL USING (auth.role() = 'authenticated');

-- Create storage bucket for products if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Enable RLS for storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Give public access to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload products storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update products storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete products storage" ON storage.objects;

-- Create storage policies
CREATE POLICY "Give public access to products bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

CREATE POLICY "Allow authenticated users to upload products storage"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

CREATE POLICY "Allow authenticated users to update products storage"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products');

CREATE POLICY "Allow authenticated users to delete products storage"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');
