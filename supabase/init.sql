-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

BEGIN;

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS clients_name_idx;
DROP INDEX IF EXISTS clients_company_name_idx;
DROP INDEX IF EXISTS clients_email_idx;
DROP INDEX IF EXISTS clients_status_idx;
DROP INDEX IF EXISTS clients_type_idx;
DROP INDEX IF EXISTS clients_active_idx;

-- Drop existing table if exists
DROP TABLE IF EXISTS amg_clients CASCADE;

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

-- Création de la table clients
CREATE TABLE amg_clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Type de client
    client_type TEXT NOT NULL CHECK (client_type IN ('individual', 'company')),
    is_active BOOLEAN DEFAULT true,
    
    -- Informations communes
    email TEXT UNIQUE,
    phone TEXT,
    mobile_phone TEXT,
    fax TEXT,
    website TEXT,
    
    -- Informations particulier
    civility TEXT,
    first_name TEXT,
    last_name TEXT,
    birth_date DATE,
    
    -- Informations entreprise
    company_name TEXT,
    siret TEXT UNIQUE,
    vat_number TEXT,
    legal_form TEXT,
    registration_date DATE,
    company_size TEXT CHECK (company_size IN ('micro', 'small', 'medium', 'large')),
    industry_sector TEXT,
    
    -- Contact principal (pour entreprise)
    contact_name TEXT,
    contact_role TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    
    -- Adresse principale
    address TEXT,
    postal_code TEXT,
    city TEXT,
    country TEXT DEFAULT 'France',
    
    -- Adresse de facturation
    billing_address TEXT,
    billing_postal_code TEXT,
    billing_city TEXT,
    billing_country TEXT,
    
    -- Adresse de livraison
    shipping_address TEXT,
    shipping_postal_code TEXT,
    shipping_city TEXT,
    shipping_country TEXT,
    
    -- Informations bancaires
    bank_name TEXT,
    iban TEXT,
    bic TEXT,
    
    -- Préférences et marketing
    preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'sms', 'mail')),
    newsletter_subscribed BOOLEAN DEFAULT false,
    special_offers_subscribed BOOLEAN DEFAULT false,
    communication_preferences TEXT[],
    
    -- Informations commerciales
    payment_terms TEXT,
    credit_limit DECIMAL(10,2),
    payment_method TEXT,
    loyalty_points INTEGER DEFAULT 0,
    vip_status BOOLEAN DEFAULT false,
    notes TEXT,
    
    -- Statistiques
    total_purchases DECIMAL(10,2) DEFAULT 0,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    average_purchase_amount DECIMAL(10,2) DEFAULT 0,
    purchase_count INTEGER DEFAULT 0,
    payment_reliability_score INTEGER CHECK (payment_reliability_score BETWEEN 0 AND 100),
    
    -- Métadonnées
    tags TEXT[],
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    
    -- Relations
    favorite_products UUID[],
    assigned_sales_rep UUID,
    
    -- Documents
    documents JSONB DEFAULT '[]'::jsonb,
    
    CONSTRAINT proper_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT client_identification CHECK (
        (client_type = 'individual' AND first_name IS NOT NULL AND last_name IS NOT NULL AND civility IN ('M.', 'Mme', 'Autre')) OR
        (client_type = 'company' AND company_name IS NOT NULL)
    )
);

-- Création des index après avoir vérifié que la table existe
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'amg_clients'
    ) THEN
        CREATE INDEX IF NOT EXISTS clients_name_idx ON amg_clients (last_name, first_name) WHERE client_type = 'individual';
        CREATE INDEX IF NOT EXISTS clients_company_name_idx ON amg_clients (company_name) WHERE client_type = 'company';
        CREATE INDEX IF NOT EXISTS clients_email_idx ON amg_clients (email);
        CREATE INDEX IF NOT EXISTS clients_status_idx ON amg_clients (status);
        CREATE INDEX IF NOT EXISTS clients_type_idx ON amg_clients (client_type);
        CREATE INDEX IF NOT EXISTS clients_active_idx ON amg_clients (is_active);
    END IF;
END $$;

-- Fonction pour vérifier les champs obligatoires selon le type de client
CREATE OR REPLACE FUNCTION validate_client_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.client_type = 'individual' THEN
        IF NEW.first_name IS NULL OR NEW.last_name IS NULL THEN
            RAISE EXCEPTION 'Les champs prénom et nom sont obligatoires pour un particulier';
        END IF;
    ELSIF NEW.client_type = 'company' THEN
        IF NEW.company_name IS NULL THEN
            RAISE EXCEPTION 'Le nom de l''entreprise est obligatoire pour une société';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_client_fields_trigger
    BEFORE INSERT OR UPDATE ON amg_clients
    FOR EACH ROW
    EXECUTE FUNCTION validate_client_fields();

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON amg_clients
    FOR EACH ROW
    EXECUTE FUNCTION update_clients_updated_at();

-- Trigger pour calculer les statistiques d'achat
CREATE OR REPLACE FUNCTION update_client_purchase_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour les statistiques du client
    UPDATE amg_clients
    SET 
        total_purchases = (
            SELECT COALESCE(SUM(total_amount), 0)
            FROM amg_orders
            WHERE client_id = NEW.client_id
        ),
        last_purchase_date = NEW.created_at,
        purchase_count = (
            SELECT COUNT(*)
            FROM amg_orders
            WHERE client_id = NEW.client_id
        ),
        average_purchase_amount = (
            SELECT COALESCE(AVG(total_amount), 0)
            FROM amg_orders
            WHERE client_id = NEW.client_id
        )
    WHERE id = NEW.client_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE amg_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE amg_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE amg_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE amg_product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE amg_product_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE amg_clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON amg_suppliers;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON amg_categories;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON amg_products;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON amg_product_images;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON amg_product_documents;
DROP POLICY IF EXISTS "Allow authenticated users to read clients" ON amg_clients;
DROP POLICY IF EXISTS "Allow authenticated users to insert clients" ON amg_clients;
DROP POLICY IF EXISTS "Allow authenticated users to update clients" ON amg_clients;
DROP POLICY IF EXISTS "Allow authenticated users to delete clients" ON amg_clients;

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

-- Politique de lecture
CREATE POLICY "Allow authenticated users to read clients"
    ON amg_clients
    FOR SELECT
    TO authenticated
    USING (true);

-- Politique d'insertion
CREATE POLICY "Allow authenticated users to insert clients"
    ON amg_clients
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Politique de mise à jour
CREATE POLICY "Allow authenticated users to update clients"
    ON amg_clients
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Politique de suppression
CREATE POLICY "Allow authenticated users to delete clients"
    ON amg_clients
    FOR DELETE
    TO authenticated
    USING (true);

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

COMMIT;
