-- ========================================
-- CREATE PRODUCTS TABLE
-- Based on Product entity from products-service
-- ========================================

CREATE TABLE IF NOT EXISTS products (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code VARCHAR(50) UNIQUE,
    
    -- Core product information
    product_name VARCHAR(500) NOT NULL,
    unofficial_product_name VARCHAR(1000),
    category VARCHAR(50) DEFAULT 'other' CHECK (category IN ('flooring', 'molding', 'accessory', 'panel', 'profile', 'other')),
    
    -- Unit management
    measure_unit VARCHAR(10) DEFAULT 'piece' CHECK (measure_unit IN ('mm', 'm', 'mb', 'm²', 'piece')),
    base_unit_for_pricing VARCHAR(10) DEFAULT 'piece' CHECK (base_unit_for_pricing IN ('mm', 'm', 'mb', 'm²', 'piece')),
    selling_unit VARCHAR(10) DEFAULT 'szt' CHECK (selling_unit IN ('mb', 'm²', 'szt', 'paczka')),
    measurement_units_per_selling_unit DECIMAL(10,4) DEFAULT 1.0 CHECK (measurement_units_per_selling_unit >= 0),
    
    -- Product specifications
    type_of_finish VARCHAR(200),
    surface VARCHAR(200),
    bevel VARCHAR(200),
    
    -- Dimensions (in mm)
    thickness_mm DECIMAL(10,2) CHECK (thickness_mm >= 0),
    width_mm DECIMAL(10,2) CHECK (width_mm >= 0),
    length_mm DECIMAL(10,2) CHECK (length_mm >= 0),
    package_m2 DECIMAL(10,3) CHECK (package_m2 >= 0),
    
    -- Product description
    additional_item_description TEXT,
    description TEXT,
    
    -- Pricing (per base unit)
    retail_price_per_unit DECIMAL(10,2) CHECK (retail_price_per_unit >= 0),
    selling_price_per_unit DECIMAL(10,2) CHECK (selling_price_per_unit >= 0),
    purchase_price_per_unit DECIMAL(10,2) CHECK (purchase_price_per_unit >= 0),
    potential_profit DECIMAL(10,2),
    installation_allowance DECIMAL(5,2) DEFAULT 0.0 CHECK (installation_allowance >= 0 AND installation_allowance <= 100),
    currency VARCHAR(3) DEFAULT 'PLN',
    
    -- Inventory & status
    current_stock INTEGER DEFAULT 0 CHECK (current_stock >= 0),
    standard_stock_percent DECIMAL(5,2) CHECK (standard_stock_percent >= 0),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock', 'discontinued')),
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    original_scraped_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_products_product_code ON products (product_code);
CREATE INDEX IF NOT EXISTS idx_products_product_name ON products (product_name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_selling_unit ON products (selling_unit);
CREATE INDEX IF NOT EXISTS idx_products_status ON products (status);
CREATE INDEX IF NOT EXISTS idx_products_selling_price ON products (selling_price_per_unit);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at);

-- ========================================
-- TRIGGER FOR UPDATED_AT
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SAMPLE DATA VERIFICATION
-- ========================================

-- Insert a test product to verify table structure
INSERT INTO products (
    product_code, product_name, measure_unit, base_unit_for_pricing, selling_unit,
    measurement_units_per_selling_unit, type_of_finish, surface,
    thickness_mm, width_mm, length_mm,
    retail_price_per_unit, selling_price_per_unit, purchase_price_per_unit, potential_profit,
    currency, status, is_active
) VALUES (
    'TEST-001',
    'Test Product - Vinyl Flooring',
    'm²',
    'm²', 
    'm²',
    1.0,
    'vinyl',
    'textured',
    8.0,
    200.0,
    1200.0,
    89.99,
    79.99,
    55.99,
    24.00,
    'PLN',
    'active',
    true
) ON CONFLICT (product_code) DO NOTHING;

-- Verify table creation
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Show sample data
SELECT 
    product_code, 
    product_name, 
    measure_unit, 
    selling_unit, 
    selling_price_per_unit,
    created_at
FROM products 
LIMIT 5;