-- ========================================
-- IMPROVED PRODUCTS DATABASE SCHEMA
-- UUID Primary Key with Logical Structure
-- ========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- PRODUCTS TABLE (IMPROVED STRUCTURE)
-- ========================================
CREATE TABLE IF NOT EXISTS products (
    -- Primary Identification
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_code VARCHAR(50) UNIQUE, -- Original kod_produktu
    
    -- Core Product Information
    product_name VARCHAR(500) NOT NULL,
    unofficial_product_name VARCHAR(1000),
    category VARCHAR(20) DEFAULT 'other' CHECK (category IN ('flooring', 'molding', 'accessory', 'panel', 'profile', 'other')),
    
    -- Unit Management
    measure_unit VARCHAR(10) DEFAULT 'piece' CHECK (measure_unit IN ('mm', 'm', 'm²', 'piece')),
    base_unit_for_pricing VARCHAR(10) DEFAULT 'piece' CHECK (base_unit_for_pricing IN ('mm', 'm', 'm²', 'piece')),
    selling_unit VARCHAR(10) DEFAULT 'szt' CHECK (selling_unit IN ('mb', 'm²', 'szt', 'paczka')),
    measurement_units_per_selling_unit DECIMAL(10,4) DEFAULT 1.0 CHECK (measurement_units_per_selling_unit > 0),
    
    -- Product Specifications
    type_of_finish VARCHAR(200),
    surface VARCHAR(200),
    bevel VARCHAR(200),
    
    -- Dimensions (in mm)
    thickness_mm DECIMAL(10,2) CHECK (thickness_mm >= 0),
    width_mm DECIMAL(10,2) CHECK (width_mm >= 0),
    length_mm DECIMAL(10,2) CHECK (length_mm >= 0),
    package_m2 DECIMAL(10,3) CHECK (package_m2 >= 0),
    
    -- Product Description
    additional_item_description TEXT,
    description TEXT,
    
    -- Pricing (per base unit in PLN)
    retail_price_per_unit DECIMAL(10,2) CHECK (retail_price_per_unit >= 0),
    selling_price_per_unit DECIMAL(10,2) CHECK (selling_price_per_unit >= 0),
    purchase_price_per_unit DECIMAL(10,2) CHECK (purchase_price_per_unit >= 0),
    potential_profit DECIMAL(10,2),
    installation_allowance DECIMAL(5,2) DEFAULT 0.0 CHECK (installation_allowance >= 0),
    currency VARCHAR(3) DEFAULT 'PLN',
    
    -- Inventory & Status
    current_stock INTEGER DEFAULT 0 CHECK (current_stock >= 0),
    standard_stock_percent DECIMAL(5,2) CHECK (standard_stock_percent >= 0),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock', 'discontinued')),
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    original_scraped_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- PERFORMANCE INDEXES
-- ========================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_products_external_code ON products(external_code);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(product_name);
CREATE INDEX IF NOT EXISTS idx_products_name_text ON products USING gin(to_tsvector('polish', product_name));
CREATE INDEX IF NOT EXISTS idx_products_unofficial_name_text ON products USING gin(to_tsvector('polish', unofficial_product_name));

-- Filter indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_selling_unit ON products(selling_unit);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Pricing indexes for business queries
CREATE INDEX IF NOT EXISTS idx_products_selling_price ON products(selling_price_per_unit);
CREATE INDEX IF NOT EXISTS idx_products_purchase_price ON products(purchase_price_per_unit);
CREATE INDEX IF NOT EXISTS idx_products_profit ON products(potential_profit);

-- Dimension indexes for filtering by size
CREATE INDEX IF NOT EXISTS idx_products_thickness ON products(thickness_mm);
CREATE INDEX IF NOT EXISTS idx_products_dimensions ON products(width_mm, length_mm);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(current_stock);
CREATE INDEX IF NOT EXISTS idx_products_stock_percent ON products(standard_stock_percent);

-- Specification indexes
CREATE INDEX IF NOT EXISTS idx_products_finish ON products(type_of_finish);
CREATE INDEX IF NOT EXISTS idx_products_surface ON products(surface);

-- JSON and timestamp indexes
CREATE INDEX IF NOT EXISTS idx_products_original_data ON products USING gin(original_scraped_data);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at);

-- ========================================
-- TRIGGERS FOR UPDATED_AT
-- ========================================

CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

-- ========================================
-- BUSINESS LOGIC VIEWS
-- ========================================

-- Products with profit analysis
CREATE OR REPLACE VIEW products_profit_analysis AS
SELECT 
    id,
    external_code,
    product_name,
    category,
    selling_unit,
    purchase_price_per_unit,
    selling_price_per_unit,
    retail_price_per_unit,
    potential_profit,
    CASE 
        WHEN purchase_price_per_unit > 0 AND selling_price_per_unit > 0 
        THEN ROUND(((selling_price_per_unit - purchase_price_per_unit) / purchase_price_per_unit * 100), 2)
        ELSE 0 
    END as profit_percentage,
    CASE 
        WHEN selling_price_per_unit > 0 AND purchase_price_per_unit > 0
        THEN ROUND((selling_price_per_unit - purchase_price_per_unit), 2)
        ELSE 0
    END as profit_margin,
    status,
    created_at
FROM products
WHERE is_active = true;

-- Products by category summary
CREATE OR REPLACE VIEW products_by_category AS
SELECT 
    category,
    COUNT(*) as product_count,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
    ROUND(AVG(selling_price_per_unit), 2) as avg_selling_price,
    ROUND(MIN(selling_price_per_unit), 2) as min_price,
    ROUND(MAX(selling_price_per_unit), 2) as max_price,
    SUM(current_stock) as total_stock,
    ROUND(AVG(CASE 
        WHEN purchase_price_per_unit > 0 AND selling_price_per_unit > 0 
        THEN ((selling_price_per_unit - purchase_price_per_unit) / purchase_price_per_unit * 100)
        ELSE 0 
    END), 2) as avg_profit_percentage
FROM products
WHERE is_active = true
GROUP BY category
ORDER BY product_count DESC;

-- Low stock products
CREATE OR REPLACE VIEW products_low_stock AS
SELECT 
    id,
    external_code,
    product_name,
    category,
    current_stock,
    standard_stock_percent,
    selling_price_per_unit,
    status,
    CASE 
        WHEN standard_stock_percent > 0 
        THEN ROUND((standard_stock_percent * 10), 0) -- Assuming base stock of 10
        ELSE 10
    END as recommended_stock
FROM products
WHERE is_active = true 
AND status = 'active'
AND (
    (standard_stock_percent > 0 AND current_stock < (standard_stock_percent * 10))
    OR (standard_stock_percent IS NULL AND current_stock < 10)
)
ORDER BY current_stock ASC;

-- High profit margin products
CREATE OR REPLACE VIEW products_high_profit AS
SELECT 
    id,
    external_code,
    product_name,
    category,
    selling_unit,
    purchase_price_per_unit,
    selling_price_per_unit,
    potential_profit,
    ROUND(((selling_price_per_unit - purchase_price_per_unit) / purchase_price_per_unit * 100), 2) as profit_percentage
FROM products
WHERE is_active = true 
AND status = 'active'
AND purchase_price_per_unit > 0 
AND selling_price_per_unit > 0
AND ((selling_price_per_unit - purchase_price_per_unit) / purchase_price_per_unit * 100) > 30
ORDER BY profit_percentage DESC;

-- ========================================
-- UTILITY FUNCTIONS
-- ========================================

-- Function to search products with full-text search
CREATE OR REPLACE FUNCTION search_products(search_term TEXT, limit_results INT DEFAULT 50)
RETURNS TABLE (
    id UUID,
    external_code VARCHAR,
    product_name VARCHAR,
    category VARCHAR,
    selling_price_per_unit DECIMAL,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.external_code,
        p.product_name,
        p.category::VARCHAR,
        p.selling_price_per_unit,
        ts_rank(
            to_tsvector('polish', 
                p.product_name || ' ' || 
                COALESCE(p.unofficial_product_name, '') || ' ' || 
                COALESCE(p.description, '') || ' ' ||
                COALESCE(p.additional_item_description, '')
            ), 
            plainto_tsquery('polish', search_term)
        ) as rank
    FROM products p
    WHERE p.is_active = true
    AND (
        to_tsvector('polish', 
            p.product_name || ' ' || 
            COALESCE(p.unofficial_product_name, '') || ' ' || 
            COALESCE(p.description, '') || ' ' ||
            COALESCE(p.additional_item_description, '')
        ) @@ plainto_tsquery('polish', search_term)
        OR p.external_code ILIKE '%' || search_term || '%'
        OR p.product_name ILIKE '%' || search_term || '%'
    )
    ORDER BY rank DESC, p.product_name
    LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total price with installation
CREATE OR REPLACE FUNCTION calculate_total_price(
    product_id UUID, 
    quantity DECIMAL, 
    include_installation BOOLEAN DEFAULT true
)
RETURNS DECIMAL AS $$
DECLARE
    base_price DECIMAL;
    installation_rate DECIMAL;
    total_price DECIMAL;
BEGIN
    SELECT 
        selling_price_per_unit,
        installation_allowance
    INTO base_price, installation_rate
    FROM products 
    WHERE id = product_id AND is_active = true;
    
    IF base_price IS NULL THEN
        RETURN 0;
    END IF;
    
    total_price := base_price * quantity;
    
    IF include_installation AND installation_rate > 0 THEN
        total_price := total_price + (total_price * installation_rate / 100);
    END IF;
    
    RETURN ROUND(total_price, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get products by price range
CREATE OR REPLACE FUNCTION get_products_by_price_range(
    min_price DECIMAL DEFAULT 0,
    max_price DECIMAL DEFAULT 999999,
    product_category VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    external_code VARCHAR,
    product_name VARCHAR,
    category VARCHAR,
    selling_price_per_unit DECIMAL,
    profit_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.external_code,
        p.product_name,
        p.category::VARCHAR,
        p.selling_price_per_unit,
        CASE 
            WHEN p.purchase_price_per_unit > 0 AND p.selling_price_per_unit > 0 
            THEN ROUND(((p.selling_price_per_unit - p.purchase_price_per_unit) / p.purchase_price_per_unit * 100), 2)
            ELSE 0 
        END as profit_percentage
    FROM products p
    WHERE p.is_active = true
    AND p.status = 'active'
    AND p.selling_price_per_unit BETWEEN min_price AND max_price
    AND (product_category IS NULL OR p.category = product_category)
    ORDER BY p.selling_price_per_unit;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- DATA IMPORT HELPER FUNCTIONS
-- ========================================

-- Function to clean and convert Polish decimal format
CREATE OR REPLACE FUNCTION clean_polish_decimal(input_text TEXT)
RETURNS DECIMAL AS $$
BEGIN
    IF input_text IS NULL OR input_text = '' THEN
        RETURN NULL;
    END IF;
    
    -- Replace Polish comma with dot and convert to decimal
    RETURN CAST(REPLACE(TRIM(input_text), ',', '.') AS DECIMAL);
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to determine product category from name
CREATE OR REPLACE FUNCTION determine_product_category(product_name TEXT)
RETURNS VARCHAR AS $$
BEGIN
    IF product_name IS NULL THEN
        RETURN 'other';
    END IF;
    
    -- Convert to lowercase for matching
    product_name := LOWER(product_name);
    
    -- Flooring patterns
    IF product_name LIKE '%vinyl%' OR 
       product_name LIKE '%laminat%' OR 
       product_name LIKE '%podłog%' OR
       product_name LIKE '%panel%' OR
       product_name LIKE '%parkiet%' THEN
        RETURN 'flooring';
    END IF;
    
    -- Molding patterns  
    IF product_name LIKE '%listwa%' OR 
       product_name LIKE '%profil%' OR
       product_name LIKE '%krawędź%' THEN
        RETURN 'molding';
    END IF;
    
    -- Panel patterns
    IF product_name LIKE '%panel%' AND 
       product_name NOT LIKE '%podłog%' THEN
        RETURN 'panel';
    END IF;
    
    -- Default
    RETURN 'other';
END;
$$ LANGUAGE plpgsql;

-- Function to extract unit from price field name
CREATE OR REPLACE FUNCTION extract_unit_from_field(field_name TEXT)
RETURNS VARCHAR AS $$
BEGIN
    IF field_name LIKE '%1mb%' THEN
        RETURN 'mb';
    ELSIF field_name LIKE '%1m²%' OR field_name LIKE '%1m2%' THEN
        RETURN 'm²';
    ELSIF field_name LIKE '%1szt%' THEN
        RETURN 'szt';
    ELSE
        RETURN 'szt'; -- default
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PERMISSIONS
-- ========================================

-- Grant permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO crm_user;
GRANT SELECT ON products_profit_analysis TO crm_user;
GRANT SELECT ON products_by_category TO crm_user;
GRANT SELECT ON products_low_stock TO crm_user;
GRANT SELECT ON products_high_profit TO crm_user;
GRANT EXECUTE ON FUNCTION search_products(TEXT, INT) TO crm_user;
GRANT EXECUTE ON FUNCTION calculate_total_price(UUID, DECIMAL, BOOLEAN) TO crm_user;
GRANT EXECUTE ON FUNCTION get_products_by_price_range(DECIMAL, DECIMAL, VARCHAR) TO crm_user;
GRANT EXECUTE ON FUNCTION clean_polish_decimal(TEXT) TO crm_user;
GRANT EXECUTE ON FUNCTION determine_product_category(TEXT) TO crm_user;
GRANT EXECUTE ON FUNCTION extract_unit_from_field(TEXT) TO crm_user;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

SELECT 'Improved products schema created successfully!' as message,
       'Table: products (UUID primary key)' as table_info,
       'Views: 4 business views created' as views_info,
       'Functions: 6 utility functions created' as functions_info;