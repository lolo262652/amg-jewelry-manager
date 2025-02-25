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

-- Create indexes for suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON amg_suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON amg_suppliers(email);

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

-- Create supplier orders table
CREATE TABLE IF NOT EXISTS amg_supplier_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supplier_id UUID REFERENCES amg_suppliers(id) NOT NULL,
    order_number VARCHAR NOT NULL UNIQUE,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    expected_delivery_date TIMESTAMP WITH TIME ZONE,
    delivery_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR NOT NULL CHECK (status IN ('draft', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'partially_delivered')),
    total_amount DECIMAL(10,2) DEFAULT 0,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    payment_terms TEXT,
    payment_status VARCHAR CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid')),
    payment_due_date TIMESTAMP WITH TIME ZONE,
    currency VARCHAR(3) DEFAULT 'EUR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    created_by UUID,
    updated_by UUID,
    documents JSONB DEFAULT '[]'::jsonb
);

-- Create supplier order items table
CREATE TABLE IF NOT EXISTS amg_supplier_order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES amg_supplier_orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES amg_products(id) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    expected_delivery_date TIMESTAMP WITH TIME ZONE,
    received_quantity INTEGER DEFAULT 0 CHECK (received_quantity >= 0),
    status VARCHAR CHECK (status IN ('pending', 'partially_received', 'received', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create supplier order history table
CREATE TABLE IF NOT EXISTS amg_supplier_order_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES amg_supplier_orders(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    created_by UUID
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_supplier_orders_supplier ON amg_supplier_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_status ON amg_supplier_orders(status);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_date ON amg_supplier_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_supplier_order_items_order ON amg_supplier_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_order_items_product ON amg_supplier_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_order_history_order ON amg_supplier_order_history(order_id);

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_supplier_order_total_trigger ON amg_supplier_order_items;
DROP TRIGGER IF EXISTS update_supplier_order_status_trigger ON amg_supplier_order_items;
DROP TRIGGER IF EXISTS log_supplier_order_status_change_trigger ON amg_supplier_orders;

-- Create or replace the functions
CREATE OR REPLACE FUNCTION update_supplier_order_total()
RETURNS TRIGGER AS $$
BEGIN
    WITH order_total AS (
        SELECT 
            order_id,
            COALESCE(SUM(quantity * unit_price), 0) as subtotal
        FROM amg_supplier_order_items
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        GROUP BY order_id
    )
    UPDATE amg_supplier_orders
    SET total_amount = order_total.subtotal + COALESCE(shipping_cost, 0) + COALESCE(tax_amount, 0)
    FROM order_total
    WHERE amg_supplier_orders.id = order_total.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_supplier_order_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total items and received items
    WITH order_stats AS (
        SELECT 
            COUNT(*) as total_items,
            COUNT(*) FILTER (WHERE status = 'received') as received_items,
            COUNT(*) FILTER (WHERE status = 'partially_received') as partial_items
        FROM amg_supplier_order_items
        WHERE order_id = NEW.order_id
    )
    UPDATE amg_supplier_orders
    SET status = CASE
        WHEN EXISTS (SELECT 1 FROM amg_supplier_order_items WHERE order_id = NEW.order_id AND status = 'cancelled') THEN 'cancelled'
        WHEN (SELECT received_items = total_items FROM order_stats) THEN 'delivered'
        WHEN (SELECT partial_items > 0 OR received_items > 0 FROM order_stats) THEN 'partially_delivered'
        ELSE status
    END
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_supplier_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS NULL OR NEW.status != OLD.status THEN
        INSERT INTO amg_supplier_order_history (order_id, status, notes, created_by)
        VALUES (NEW.id, NEW.status, 'Status changed to: ' || NEW.status, NEW.updated_by);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the triggers
CREATE TRIGGER update_supplier_order_total_trigger
    AFTER INSERT OR UPDATE OR DELETE ON amg_supplier_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_supplier_order_total();

CREATE TRIGGER update_supplier_order_status_trigger
    AFTER INSERT OR UPDATE ON amg_supplier_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_supplier_order_status();

CREATE TRIGGER log_supplier_order_status_change_trigger
    AFTER UPDATE OF status ON amg_supplier_orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION log_supplier_order_status_change();

-- Create transaction management functions
CREATE OR REPLACE FUNCTION begin_transaction()
RETURNS void AS $$
BEGIN
    -- Nothing to do, transaction is already started
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION commit_transaction()
RETURNS void AS $$
BEGIN
    COMMIT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rollback_transaction()
RETURNS void AS $$
BEGIN
    ROLLBACK;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- Insert test data
INSERT INTO amg_suppliers (name, contact, address, email, phone)
VALUES 
    ('Bijoux & Co', 'Jean Dupont', '123 Rue des Artisans, Paris', 'contact@bijoux-co.fr', '+33123456789'),
    ('Pierres Précieuses SARL', 'Marie Martin', '456 Avenue des Gemmes, Lyon', 'info@pierres-precieuses.fr', '+33234567890'),
    ('Or & Argent', 'Pierre Durand', '789 Boulevard des Métaux, Marseille', 'contact@or-argent.fr', '+33345678901')
ON CONFLICT (id) DO NOTHING;
