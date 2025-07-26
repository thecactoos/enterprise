-- ========================================
-- PRODUCTS SCHEMA WITH USER'S EXACT COLUMN NAMES
-- Based on your specified requirements
-- ========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table if needed (for clean recreation)
-- DROP TABLE IF EXISTS products CASCADE;

-- ========================================
-- PRODUCTS TABLE - YOUR EXACT SPECIFICATIONS
-- ========================================
CREATE TABLE IF NOT EXISTS products_complete (
    -- PRIMARY KEY: UUID (as you requested instead of product codes)
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 1. PRODUCT CODE (kept as reference but not primary key)
    product_code VARCHAR(50) UNIQUE, -- Original kod_produktu from scraped data
    
    -- 2. PRODUCT NAME
    product_name VARCHAR(500) NOT NULL,
    
    -- 3. MEASURE UNIT
    measure_unit VARCHAR(20) NOT NULL DEFAULT 'szt',
    
    -- 4. BASE UNIT FOR PRICING  
    base_unit_for_pricing VARCHAR(20) NOT NULL DEFAULT 'szt',
    
    -- 5. SELLING UNIT
    selling_unit VARCHAR(20) NOT NULL DEFAULT 'szt',
    
    -- 6. MEASUREMENT UNITS PER SELLING UNIT
    measurement_units_per_selling_unit DECIMAL(10,4) DEFAULT 1.0 CHECK (measurement_units_per_selling_unit > 0),
    
    -- 7. UNOFFICIAL PRODUCT NAME
    unofficial_product_name VARCHAR(1000),
    
    -- 8. TYPE OF FINISH
    type_of_finish VARCHAR(200),
    
    -- 9. SURFACE
    surface VARCHAR(200),
    
    -- 10. BEVEL
    bevel VARCHAR(200),
    
    -- 11. THICKNESS [MM]
    thickness_mm DECIMAL(10,2) CHECK (thickness_mm >= 0),
    
    -- 12. WIDTH [MM]
    width_mm DECIMAL(10,2) CHECK (width_mm >= 0),
    
    -- 13. LENGTH [MM]
    length_mm DECIMAL(10,2) CHECK (length_mm >= 0),
    
    -- 14. PACKAGE [M²]
    package_m2 DECIMAL(10,3) CHECK (package_m2 >= 0),
    
    -- 15. ADDITIONAL ITEM DESCRIPTION
    additional_item_description TEXT,
    
    -- 16. RETAIL PRICE PER UNIT
    retail_price_per_unit DECIMAL(10,2) CHECK (retail_price_per_unit >= 0),
    
    -- 17. SELLING PRICE PER UNIT
    selling_price_per_unit DECIMAL(10,2) CHECK (selling_price_per_unit >= 0),
    
    -- 18. PURCHASE PRICE PER UNIT
    purchase_price_per_unit DECIMAL(10,2) CHECK (purchase_price_per_unit >= 0),
    
    -- 19. POTENTIAL PROFIT
    potential_profit DECIMAL(10,2),
    
    -- 20. INSTALLATION ALLOWANCE
    installation_allowance DECIMAL(5,2) DEFAULT 0.0 CHECK (installation_allowance >= 0),
    
    -- ADDITIONAL SYSTEM FIELDS
    currency VARCHAR(3) DEFAULT 'PLN',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock', 'discontinued')),
    is_active BOOLEAN DEFAULT true,
    
    -- METADATA
    original_scraped_data JSONB, -- Keep original data for reference
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- PERFORMANCE INDEXES
-- ========================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_products_complete_product_code ON products_complete(product_code);
CREATE INDEX IF NOT EXISTS idx_products_complete_product_name ON products_complete(product_name);
CREATE INDEX IF NOT EXISTS idx_products_complete_name_text ON products_complete USING gin(to_tsvector('polish', product_name));

-- Unit-based indexes
CREATE INDEX IF NOT EXISTS idx_products_complete_measure_unit ON products_complete(measure_unit);
CREATE INDEX IF NOT EXISTS idx_products_complete_selling_unit ON products_complete(selling_unit);
CREATE INDEX IF NOT EXISTS idx_products_complete_base_unit_pricing ON products_complete(base_unit_for_pricing);

-- Specification indexes
CREATE INDEX IF NOT EXISTS idx_products_complete_type_of_finish ON products_complete(type_of_finish);
CREATE INDEX IF NOT EXISTS idx_products_complete_surface ON products_complete(surface);
CREATE INDEX IF NOT EXISTS idx_products_complete_bevel ON products_complete(bevel);

-- Dimension indexes
CREATE INDEX IF NOT EXISTS idx_products_complete_thickness ON products_complete(thickness_mm);
CREATE INDEX IF NOT EXISTS idx_products_complete_width ON products_complete(width_mm);
CREATE INDEX IF NOT EXISTS idx_products_complete_length ON products_complete(length_mm);
CREATE INDEX IF NOT EXISTS idx_products_complete_dimensions ON products_complete(thickness_mm, width_mm, length_mm);
CREATE INDEX IF NOT EXISTS idx_products_complete_package ON products_complete(package_m2);

-- Pricing indexes
CREATE INDEX IF NOT EXISTS idx_products_complete_retail_price ON products_complete(retail_price_per_unit);
CREATE INDEX IF NOT EXISTS idx_products_complete_selling_price ON products_complete(selling_price_per_unit);
CREATE INDEX IF NOT EXISTS idx_products_complete_purchase_price ON products_complete(purchase_price_per_unit);
CREATE INDEX IF NOT EXISTS idx_products_complete_potential_profit ON products_complete(potential_profit);
CREATE INDEX IF NOT EXISTS idx_products_complete_installation_allowance ON products_complete(installation_allowance);

-- Status and system indexes
CREATE INDEX IF NOT EXISTS idx_products_complete_status ON products_complete(status);
CREATE INDEX IF NOT EXISTS idx_products_complete_is_active ON products_complete(is_active);
CREATE INDEX IF NOT EXISTS idx_products_complete_created_at ON products_complete(created_at);

-- JSON data index
CREATE INDEX IF NOT EXISTS idx_products_complete_original_data ON products_complete USING gin(original_scraped_data);

-- ========================================
-- COMPUTED COLUMNS & BUSINESS LOGIC
-- ========================================

-- View with computed profit analysis
CREATE OR REPLACE VIEW products_with_analysis AS
SELECT 
    id,
    product_code,
    product_name,
    unofficial_product_name,
    measure_unit,
    base_unit_for_pricing,
    selling_unit,
    measurement_units_per_selling_unit,
    type_of_finish,
    surface,
    bevel,
    thickness_mm,
    width_mm,
    length_mm,
    package_m2,
    additional_item_description,
    retail_price_per_unit,
    selling_price_per_unit,
    purchase_price_per_unit,
    potential_profit,
    installation_allowance,
    
    -- COMPUTED FIELDS
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
    
    CASE 
        WHEN thickness_mm IS NOT NULL OR width_mm IS NOT NULL OR length_mm IS NOT NULL
        THEN CONCAT_WS(' × ', 
            CASE WHEN thickness_mm IS NOT NULL THEN thickness_mm || 'mm' END,
            CASE WHEN width_mm IS NOT NULL THEN width_mm || 'mm' END,
            CASE WHEN length_mm IS NOT NULL THEN length_mm || 'mm' END
        )
        ELSE NULL
    END as dimensions_string,
    
    COALESCE(unofficial_product_name, product_name) as display_name,
    
    CASE 
        WHEN selling_price_per_unit > 0 AND installation_allowance > 0
        THEN ROUND(selling_price_per_unit * (1 + installation_allowance / 100), 2)
        ELSE selling_price_per_unit
    END as total_price_with_installation,
    
    currency,
    status,
    is_active,
    created_at,
    updated_at
    
FROM products_complete
WHERE is_active = true;

-- ========================================
-- MAPPING FROM SCRAPED DATA
-- ========================================

/*
FIELD MAPPING FROM YOUR SCRAPED DATA:

Your Column Name              ->    Scraped Field Name
==========================================
product_code                  ->    kod_produktu
product_name                  ->    nazwa_produktu  
measure_unit                  ->    jednostka_sprzedażowa (or derived)
base_unit_for_pricing        ->    extracted from price field names
selling_unit                  ->    jednostka_sprzedażowa
measurement_units_per_selling_unit -> długość_sprzedażowa_[mb] or calculated
unofficial_product_name       ->    nieoficjalna_nazwa_produktu
type_of_finish               ->    rodzaj_wykończenia
surface                      ->    powierzchnia
bevel                        ->    fazowanie
thickness_mm                 ->    grubość_[mm]
width_mm                     ->    szerokość_[mm]
length_mm                    ->    długość_[mm]
package_m2                   ->    paczka_[m²]
additional_item_description  ->    dodatkowy_opis_przedmiotu
retail_price_per_unit        ->    cena_detaliczna_netto_1mb_[zł] / cena_detaliczna_netto_1m²_[zł]
selling_price_per_unit       ->    cena_sprzedaży_netto_1mb_[zł] / cena_sprzedaży_netto_1m²_[zł]
purchase_price_per_unit      ->    cena_zakupu_netto_1mb_[zł] / cena_zakupu_netto_1m²_[zł]
potential_profit             ->    potencjalny_zysk_1mb_[zł] / potencjalny_zysk_1m²_[zł]
installation_allowance       ->    NOT IN SCRAPED DATA (default 0, configurable)
*/

-- ========================================
-- UTILITY FUNCTIONS
-- ========================================

-- Function to search products with your exact field names
CREATE OR REPLACE FUNCTION search_products_exact(search_term TEXT, limit_results INT DEFAULT 50)
RETURNS TABLE (
    id UUID,
    product_code VARCHAR,
    product_name VARCHAR,
    selling_unit VARCHAR,
    selling_price_per_unit DECIMAL,
    dimensions_string TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.product_code,
        p.product_name,
        p.selling_unit,
        p.selling_price_per_unit,
        pa.dimensions_string,
        ts_rank(
            to_tsvector('polish', 
                p.product_name || ' ' || 
                COALESCE(p.unofficial_product_name, '') || ' ' || 
                COALESCE(p.additional_item_description, '')
            ), 
            plainto_tsquery('polish', search_term)
        ) as rank
    FROM products_complete p
    LEFT JOIN products_with_analysis pa ON p.id = pa.id
    WHERE p.is_active = true
    AND (
        to_tsvector('polish', 
            p.product_name || ' ' || 
            COALESCE(p.unofficial_product_name, '') || ' ' || 
            COALESCE(p.additional_item_description, '')
        ) @@ plainto_tsquery('polish', search_term)
        OR p.product_code ILIKE '%' || search_term || '%'
        OR p.product_name ILIKE '%' || search_term || '%'
    )
    ORDER BY rank DESC, p.product_name
    LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PERMISSIONS
-- ========================================

-- Grant permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON products_complete TO crm_user;
GRANT SELECT ON products_with_analysis TO crm_user;
GRANT EXECUTE ON FUNCTION search_products_exact(TEXT, INT) TO crm_user;

-- ========================================
-- SAMPLE DATA INSERTION
-- ========================================

-- Example of how to insert data with your exact column names
/*
INSERT INTO products_complete (
    product_code,
    product_name,
    measure_unit,
    base_unit_for_pricing,
    selling_unit,
    measurement_units_per_selling_unit,
    unofficial_product_name,
    type_of_finish,
    surface,
    bevel,
    thickness_mm,
    width_mm,
    length_mm,
    package_m2,
    additional_item_description,
    retail_price_per_unit,
    selling_price_per_unit,
    purchase_price_per_unit,
    potential_profit,
    installation_allowance
) VALUES (
    '54045',
    '[S] Tarkett Listwa Foliowana Biała',
    'm',
    'm',
    'mb',
    2.5,
    'Tarkett Listwa Foliowana Biała | 16x60x2400 | 8791740',
    'PVC',
    'foliowana',
    null,
    16.00,
    60.00,
    2400.00,
    null,
    'High-quality PVC molding strip',
    28.75,
    23.00,
    14.26,
    8.74,
    0.0
);
*/

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

SELECT 'Products schema created with YOUR EXACT column names!' as message,
       'Table: products_complete' as table_name,
       '20 user-specified columns implemented' as columns_info,
       'UUID primary key as requested' as primary_key_info;