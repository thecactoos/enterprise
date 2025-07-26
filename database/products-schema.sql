-- ========================================
-- BUILDING PRODUCTS TABLE SCHEMA
-- Designed for Polish building materials data
-- ========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- BUILDING PRODUCTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS building_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Core Product Information
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    extended_name VARCHAR(1000),
    unit VARCHAR(20) DEFAULT 'szt' CHECK (unit IN ('mb', 'm²', 'szt', 'paczka')),
    
    -- Material Specifications
    material VARCHAR(50) CHECK (material IN ('PVC', 'wood', 'laminate', 'vinyl', 'composite', 'metal', 'other')),
    color VARCHAR(200),
    finish_type VARCHAR(200),
    surface VARCHAR(200),
    edge_treatment VARCHAR(200),
    
    -- Dimensions (in mm)
    thickness_mm DECIMAL(10,2) CHECK (thickness_mm >= 0),
    height_mm DECIMAL(10,2) CHECK (height_mm >= 0),
    width_mm DECIMAL(10,2) CHECK (width_mm >= 0),
    length_mm DECIMAL(10,2) CHECK (length_mm >= 0),
    
    -- Sales Dimensions
    sales_length_m DECIMAL(10,3) CHECK (sales_length_m >= 0),
    package_area_m2 DECIMAL(10,3) CHECK (package_area_m2 >= 0),
    
    -- Pricing (in PLN)
    purchase_price DECIMAL(10,2) CHECK (purchase_price >= 0),
    sale_price DECIMAL(10,2) CHECK (sale_price >= 0),
    retail_price DECIMAL(10,2) CHECK (retail_price >= 0),
    profit_margin DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'PLN',
    
    -- Inventory Management
    standard_stock_percent DECIMAL(5,2) CHECK (standard_stock_percent >= 0),
    current_stock INTEGER DEFAULT 0 CHECK (current_stock >= 0),
    
    -- Additional Information
    additional_description TEXT,
    full_identifier TEXT,
    description TEXT,
    
    -- Status and Metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock', 'discontinued')),
    is_active BOOLEAN DEFAULT true,
    
    -- Original scraped data (JSON)
    original_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_building_products_sku ON building_products(sku);
CREATE INDEX IF NOT EXISTS idx_building_products_name ON building_products(name);
CREATE INDEX IF NOT EXISTS idx_building_products_name_text ON building_products USING gin(to_tsvector('polish', name));

-- Filter indexes
CREATE INDEX IF NOT EXISTS idx_building_products_material ON building_products(material);
CREATE INDEX IF NOT EXISTS idx_building_products_unit ON building_products(unit);
CREATE INDEX IF NOT EXISTS idx_building_products_status ON building_products(status);
CREATE INDEX IF NOT EXISTS idx_building_products_active ON building_products(is_active);

-- Pricing indexes
CREATE INDEX IF NOT EXISTS idx_building_products_purchase_price ON building_products(purchase_price);
CREATE INDEX IF NOT EXISTS idx_building_products_sale_price ON building_products(sale_price);
CREATE INDEX IF NOT EXISTS idx_building_products_profit_margin ON building_products(profit_margin);

-- Dimension indexes (for size-based searches)
CREATE INDEX IF NOT EXISTS idx_building_products_thickness ON building_products(thickness_mm);
CREATE INDEX IF NOT EXISTS idx_building_products_dimensions ON building_products(width_mm, length_mm);

-- JSON data index (for advanced queries on original data)
CREATE INDEX IF NOT EXISTS idx_building_products_original_data ON building_products USING gin(original_data);

-- Timestamp indexes
CREATE INDEX IF NOT EXISTS idx_building_products_created_at ON building_products(created_at);
CREATE INDEX IF NOT EXISTS idx_building_products_updated_at ON building_products(updated_at);

-- ========================================
-- TRIGGERS FOR UPDATED_AT
-- ========================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_building_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_building_products_updated_at 
    BEFORE UPDATE ON building_products 
    FOR EACH ROW EXECUTE FUNCTION update_building_products_updated_at();

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- View for products with profit analysis
CREATE OR REPLACE VIEW building_products_with_profit AS
SELECT 
    id,
    sku,
    name,
    material,
    unit,
    purchase_price,
    sale_price,
    retail_price,
    profit_margin,
    CASE 
        WHEN purchase_price > 0 AND sale_price > 0 
        THEN ((sale_price - purchase_price) / purchase_price * 100)
        ELSE 0 
    END as profit_percentage,
    status,
    created_at
FROM building_products
WHERE is_active = true;

-- View for products by category
CREATE OR REPLACE VIEW building_products_by_material AS
SELECT 
    material,
    COUNT(*) as product_count,
    AVG(sale_price) as avg_sale_price,
    MIN(sale_price) as min_price,
    MAX(sale_price) as max_price,
    SUM(current_stock) as total_stock
FROM building_products
WHERE is_active = true AND sale_price > 0
GROUP BY material
ORDER BY product_count DESC;

-- View for low stock products
CREATE OR REPLACE VIEW building_products_low_stock AS
SELECT 
    id,
    sku,
    name,
    current_stock,
    standard_stock_percent,
    sale_price,
    status
FROM building_products
WHERE is_active = true 
AND current_stock < (standard_stock_percent * 10) -- Assuming base stock of 10 units
ORDER BY current_stock ASC;

-- ========================================
-- SAMPLE DATA INSERTION FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION insert_sample_building_products()
RETURNS void AS $$
BEGIN
    INSERT INTO building_products (
        sku, name, extended_name, unit, material, color, 
        thickness_mm, width_mm, length_mm, purchase_price, 
        sale_price, retail_price, currency, description
    ) VALUES
    (
        'TRK-54045',
        'Tarkett Listwa Foliowana Biała',
        'Tarkett Listwa Foliowana Biała | 16x60x2400 | 8791740',
        'mb',
        'PVC',
        'Foliowana Biała',
        16.00,
        60.00,
        2400.00,
        14.26,
        23.00,
        28.75,
        'PLN',
        'High-quality PVC molding strip in white foil finish'
    ),
    (
        'QS-17005',
        'Quick-Step Alpha Vinyl Bloom AVMPU40088 Dąb Jesienny Miodowy',
        'Quick-Step Alpha Vinyl Bloom AVMPU40088 Dąb Jesienny Miodowy',
        'm²',
        'vinyl',
        'Dąb Jesienny Miodowy',
        6.00,
        209.00,
        1494.00,
        93.00,
        135.00,
        154.43,
        'PLN',
        'Premium vinyl flooring with integrated underlay'
    )
    ON CONFLICT (sku) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Execute sample data insertion
SELECT insert_sample_building_products();

-- ========================================
-- UTILITY FUNCTIONS
-- ========================================

-- Function to search products by text
CREATE OR REPLACE FUNCTION search_building_products(search_term TEXT)
RETURNS TABLE (
    id UUID,
    sku VARCHAR,
    name VARCHAR,
    material VARCHAR,
    sale_price DECIMAL,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bp.id,
        bp.sku,
        bp.name,
        bp.material::VARCHAR,
        bp.sale_price,
        ts_rank(to_tsvector('polish', bp.name || ' ' || COALESCE(bp.extended_name, '') || ' ' || COALESCE(bp.description, '')), 
                 plainto_tsquery('polish', search_term)) as rank
    FROM building_products bp
    WHERE bp.is_active = true
    AND (
        to_tsvector('polish', bp.name || ' ' || COALESCE(bp.extended_name, '') || ' ' || COALESCE(bp.description, '')) 
        @@ plainto_tsquery('polish', search_term)
        OR bp.sku ILIKE '%' || search_term || '%'
    )
    ORDER BY rank DESC, bp.name;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PERMISSIONS
-- ========================================

-- Grant permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON building_products TO crm_user;
GRANT SELECT ON building_products_with_profit TO crm_user;
GRANT SELECT ON building_products_by_material TO crm_user;
GRANT SELECT ON building_products_low_stock TO crm_user;
GRANT EXECUTE ON FUNCTION search_building_products(TEXT) TO crm_user;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

SELECT 'Building products schema created successfully!' as message,
       'Table: building_products' as table_name,
       'Sample records: 2' as sample_data;