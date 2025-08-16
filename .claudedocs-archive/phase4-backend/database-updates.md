# Phase 4 Database Schema Updates

## Migration Overview

Database enhancements to support advanced pricing for Services (already implemented) and Products (new enhancements), with Polish business compliance and bulk operation optimization.

## Services Table Status ✅

**Already Implemented via Migration 003:**
- Advanced pricing tiers (basic, standard, premium)
- VAT rate integration (0%, 8%, 23%)
- Regional multipliers for Polish cities
- Volume discount thresholds
- Seasonal adjustment capabilities
- Proper indexes for pricing queries

**Database Objects Created:**
- ENUMs: `pricing_tier_enum`, `pricing_model_enum`, `vat_rate_enum`, `regional_zone_enum`
- Views: `service_pricing_analytics`, `service_vat_summary`
- Function: `calculate_service_price()` with full pricing logic

## Products Table Enhancements

### Migration 004: Products Pricing Enhancement

```sql
-- Migration 004: Add Advanced Pricing to Products Table
-- Enhanced margin management, supplier integration, and bulk operations

-- Add new columns to products table for advanced pricing
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2) DEFAULT 23.00 CHECK (vat_rate >= 0 AND vat_rate <= 30),
ADD COLUMN IF NOT EXISTS supplier_cost DECIMAL(10,2) CHECK (supplier_cost >= 0),
ADD COLUMN IF NOT EXISTS target_margin_percent DECIMAL(5,2) CHECK (target_margin_percent >= 0 AND target_margin_percent <= 500),
ADD COLUMN IF NOT EXISTS minimum_selling_price DECIMAL(10,2) CHECK (minimum_selling_price >= 0),
ADD COLUMN IF NOT EXISTS maximum_retail_price DECIMAL(10,2) CHECK (maximum_retail_price >= 0),
ADD COLUMN IF NOT EXISTS last_cost_update TIMESTAMP,
ADD COLUMN IF NOT EXISTS price_tier VARCHAR(20) DEFAULT 'standard' CHECK (price_tier IN ('basic', 'standard', 'premium')),
ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS supplier_product_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS bulk_update_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_bulk_update TIMESTAMP;

-- Create indexes for pricing queries and bulk operations
CREATE INDEX IF NOT EXISTS idx_products_vat_rate ON products(vat_rate);
CREATE INDEX IF NOT EXISTS idx_products_supplier_cost ON products(supplier_cost);
CREATE INDEX IF NOT EXISTS idx_products_target_margin ON products(target_margin_percent);
CREATE INDEX IF NOT EXISTS idx_products_price_tier ON products(price_tier);
CREATE INDEX IF NOT EXISTS idx_products_supplier_name ON products(supplier_name);
CREATE INDEX IF NOT EXISTS idx_products_bulk_locked ON products(bulk_update_locked);
CREATE INDEX IF NOT EXISTS idx_products_last_cost_update ON products(last_cost_update);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_products_pricing_analytics ON products(category, price_tier, vat_rate);
CREATE INDEX IF NOT EXISTS idx_products_margin_analysis ON products(supplier_cost, selling_price_per_unit, target_margin_percent);
CREATE INDEX IF NOT EXISTS idx_products_supplier_analysis ON products(supplier_name, supplier_cost, last_cost_update);

-- Update existing products with default values
UPDATE products 
SET 
    vat_rate = 23.00, -- Standard Polish VAT
    price_tier = 'standard',
    target_margin_percent = CASE 
        WHEN category = 'flooring' THEN 35.0  -- Higher margins for flooring
        WHEN category = 'accessory' THEN 45.0 -- Highest margins for accessories
        WHEN category = 'molding' THEN 30.0   -- Standard margins for molding
        ELSE 25.0                             -- Default margin
    END
WHERE vat_rate IS NULL;

-- Set supplier costs where purchase price exists
UPDATE products 
SET supplier_cost = purchase_price_per_unit
WHERE purchase_price_per_unit IS NOT NULL 
  AND supplier_cost IS NULL;

-- Calculate minimum selling prices based on costs and margins
UPDATE products 
SET minimum_selling_price = ROUND(
    COALESCE(supplier_cost, purchase_price_per_unit, 0) * 
    (1 + COALESCE(target_margin_percent, 25) / 100), 2
)
WHERE supplier_cost IS NOT NULL OR purchase_price_per_unit IS NOT NULL;
```

### Price History Tracking Table

```sql
-- Create price history table for tracking changes
CREATE TABLE IF NOT EXISTS product_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price_type VARCHAR(50) NOT NULL CHECK (price_type IN ('retail', 'selling', 'purchase', 'supplier_cost')),
    old_price DECIMAL(10,2),
    new_price DECIMAL(10,2) NOT NULL,
    change_reason VARCHAR(500),
    changed_by UUID, -- User ID who made the change
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    bulk_operation_id UUID, -- Track bulk operations
    
    CONSTRAINT check_price_change CHECK (old_price != new_price OR old_price IS NULL)
);

-- Indexes for price history queries
CREATE INDEX IF NOT EXISTS idx_price_history_product ON product_price_history(product_id, change_date DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_type ON product_price_history(price_type, change_date DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_bulk ON product_price_history(bulk_operation_id);
CREATE INDEX IF NOT EXISTS idx_price_history_user ON product_price_history(changed_by);

-- Create trigger function for automatic price history tracking
CREATE OR REPLACE FUNCTION track_product_price_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Track retail price changes
    IF OLD.retail_price_per_unit IS DISTINCT FROM NEW.retail_price_per_unit THEN
        INSERT INTO product_price_history (product_id, price_type, old_price, new_price, change_reason)
        VALUES (NEW.id, 'retail', OLD.retail_price_per_unit, NEW.retail_price_per_unit, 'Automatic tracking');
    END IF;
    
    -- Track selling price changes
    IF OLD.selling_price_per_unit IS DISTINCT FROM NEW.selling_price_per_unit THEN
        INSERT INTO product_price_history (product_id, price_type, old_price, new_price, change_reason)
        VALUES (NEW.id, 'selling', OLD.selling_price_per_unit, NEW.selling_price_per_unit, 'Automatic tracking');
    END IF;
    
    -- Track purchase price changes
    IF OLD.purchase_price_per_unit IS DISTINCT FROM NEW.purchase_price_per_unit THEN
        INSERT INTO product_price_history (product_id, price_type, old_price, new_price, change_reason)
        VALUES (NEW.id, 'purchase', OLD.purchase_price_per_unit, NEW.purchase_price_per_unit, 'Automatic tracking');
    END IF;
    
    -- Track supplier cost changes
    IF OLD.supplier_cost IS DISTINCT FROM NEW.supplier_cost THEN
        INSERT INTO product_price_history (product_id, price_type, old_price, new_price, change_reason)
        VALUES (NEW.id, 'supplier_cost', OLD.supplier_cost, NEW.supplier_cost, 'Automatic tracking');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS product_price_change_trigger ON products;
CREATE TRIGGER product_price_change_trigger
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION track_product_price_changes();
```

## Advanced Database Views

### Products Pricing Analytics View

```sql
-- Comprehensive pricing analytics view
CREATE OR REPLACE VIEW product_pricing_analytics AS
SELECT 
    p.category,
    p.price_tier,
    p.vat_rate,
    p.supplier_name,
    COUNT(*) as product_count,
    AVG(p.selling_price_per_unit) as avg_selling_price,
    AVG(p.supplier_cost) as avg_supplier_cost,
    AVG(p.target_margin_percent) as avg_target_margin,
    AVG(
        CASE 
            WHEN p.supplier_cost > 0 THEN 
                ((p.selling_price_per_unit - p.supplier_cost) / p.supplier_cost) * 100
            ELSE 0 
        END
    ) as avg_actual_margin,
    COUNT(CASE WHEN p.selling_price_per_unit < p.minimum_selling_price THEN 1 END) as underpriced_products,
    COUNT(CASE WHEN p.selling_price_per_unit > p.maximum_retail_price THEN 1 END) as overpriced_products,
    SUM(p.selling_price_per_unit * p.current_stock) as total_inventory_value,
    AVG(p.selling_price_per_unit * (1 + p.vat_rate / 100)) as avg_gross_price
FROM products p
WHERE p.is_active = TRUE
GROUP BY p.category, p.price_tier, p.vat_rate, p.supplier_name
ORDER BY p.category, p.price_tier;
```

### Margin Opportunity View

```sql
-- Identify pricing optimization opportunities
CREATE OR REPLACE VIEW product_margin_opportunities AS
SELECT 
    p.id,
    p.product_code,
    p.product_name,
    p.category,
    p.supplier_name,
    p.selling_price_per_unit,
    p.supplier_cost,
    p.target_margin_percent,
    CASE 
        WHEN p.supplier_cost > 0 THEN 
            ((p.selling_price_per_unit - p.supplier_cost) / p.supplier_cost) * 100
        ELSE 0 
    END as actual_margin_percent,
    p.target_margin_percent - 
    CASE 
        WHEN p.supplier_cost > 0 THEN 
            ((p.selling_price_per_unit - p.supplier_cost) / p.supplier_cost) * 100
        ELSE 0 
    END as margin_gap,
    CASE 
        WHEN p.supplier_cost > 0 THEN
            ROUND(p.supplier_cost * (1 + p.target_margin_percent / 100), 2)
        ELSE p.selling_price_per_unit
    END as recommended_price,
    p.current_stock,
    p.selling_price_per_unit * p.current_stock as current_value,
    CASE 
        WHEN p.supplier_cost > 0 THEN
            (p.supplier_cost * (1 + p.target_margin_percent / 100)) * p.current_stock
        ELSE p.selling_price_per_unit * p.current_stock
    END as potential_value
FROM products p
WHERE p.is_active = TRUE 
  AND p.supplier_cost IS NOT NULL 
  AND p.supplier_cost > 0
  AND p.target_margin_percent IS NOT NULL
ORDER BY ABS(
    p.target_margin_percent - 
    CASE 
        WHEN p.supplier_cost > 0 THEN 
            ((p.selling_price_per_unit - p.supplier_cost) / p.supplier_cost) * 100
        ELSE 0 
    END
) DESC;
```

### Supplier Performance View

```sql
-- Supplier pricing and performance analytics
CREATE OR REPLACE VIEW supplier_performance_analytics AS
SELECT 
    p.supplier_name,
    COUNT(*) as total_products,
    COUNT(CASE WHEN p.is_active THEN 1 END) as active_products,
    AVG(p.supplier_cost) as avg_supplier_cost,
    AVG(p.selling_price_per_unit) as avg_selling_price,
    AVG(
        CASE 
            WHEN p.supplier_cost > 0 THEN 
                ((p.selling_price_per_unit - p.supplier_cost) / p.supplier_cost) * 100
            ELSE 0 
        END
    ) as avg_margin_percent,
    SUM(p.current_stock * p.supplier_cost) as total_inventory_cost,
    SUM(p.current_stock * p.selling_price_per_unit) as total_inventory_value,
    COUNT(CASE WHEN p.last_cost_update > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_updates,
    MAX(p.last_cost_update) as last_price_update
FROM products p
WHERE p.supplier_name IS NOT NULL
GROUP BY p.supplier_name
ORDER BY total_inventory_value DESC;
```

## Database Functions

### Bulk Pricing Update Function

```sql
-- Function for safe bulk pricing updates
CREATE OR REPLACE FUNCTION bulk_update_product_pricing(
    p_product_ids UUID[],
    p_adjustment_percent DECIMAL DEFAULT NULL,
    p_new_vat_rate DECIMAL DEFAULT NULL,
    p_new_margin_percent DECIMAL DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_reason TEXT DEFAULT 'Bulk update'
) 
RETURNS TABLE (
    updated_count INTEGER,
    operation_id UUID
) AS $$
DECLARE
    operation_uuid UUID;
    updated_products INTEGER;
BEGIN
    -- Generate operation ID for tracking
    operation_uuid := gen_random_uuid();
    
    -- Lock products to prevent concurrent updates
    UPDATE products 
    SET bulk_update_locked = TRUE, last_bulk_update = CURRENT_TIMESTAMP
    WHERE id = ANY(p_product_ids) AND NOT bulk_update_locked;
    
    GET DIAGNOSTICS updated_products = ROW_COUNT;
    
    -- Apply price adjustments if specified
    IF p_adjustment_percent IS NOT NULL THEN
        UPDATE products 
        SET 
            selling_price_per_unit = ROUND(selling_price_per_unit * (1 + p_adjustment_percent / 100), 2),
            retail_price_per_unit = ROUND(retail_price_per_unit * (1 + p_adjustment_percent / 100), 2)
        WHERE id = ANY(p_product_ids) AND bulk_update_locked;
    END IF;
    
    -- Apply VAT rate changes if specified
    IF p_new_vat_rate IS NOT NULL THEN
        UPDATE products 
        SET vat_rate = p_new_vat_rate
        WHERE id = ANY(p_product_ids) AND bulk_update_locked;
    END IF;
    
    -- Apply margin changes if specified
    IF p_new_margin_percent IS NOT NULL THEN
        UPDATE products 
        SET 
            target_margin_percent = p_new_margin_percent,
            selling_price_per_unit = ROUND(
                COALESCE(supplier_cost, purchase_price_per_unit, selling_price_per_unit) * 
                (1 + p_new_margin_percent / 100), 2
            )
        WHERE id = ANY(p_product_ids) AND bulk_update_locked;
    END IF;
    
    -- Log bulk operation in price history
    INSERT INTO product_price_history (product_id, price_type, new_price, change_reason, changed_by, bulk_operation_id)
    SELECT id, 'bulk_operation', selling_price_per_unit, p_reason, p_user_id, operation_uuid
    FROM products 
    WHERE id = ANY(p_product_ids) AND bulk_update_locked;
    
    -- Unlock products
    UPDATE products 
    SET bulk_update_locked = FALSE
    WHERE id = ANY(p_product_ids);
    
    RETURN QUERY SELECT updated_products, operation_uuid;
END;
$$ LANGUAGE plpgsql;
```

### Polish PLN Formatting Function

```sql
-- Function for consistent Polish PLN formatting
CREATE OR REPLACE FUNCTION format_pln_price(amount DECIMAL)
RETURNS TEXT AS $$
BEGIN
    IF amount IS NULL THEN
        RETURN '0,00 PLN';
    END IF;
    
    RETURN REPLACE(amount::TEXT, '.', ',') || ' PLN';
END;
$$ LANGUAGE plpgsql;
```

## Performance Optimization

### Database Configuration

```sql
-- Optimize for bulk operations
SET work_mem = '256MB';  -- Increase for large bulk operations
SET maintenance_work_mem = '1GB';  -- For index maintenance
SET effective_cache_size = '8GB';  -- Adjust based on available RAM

-- Connection pooling optimization
SET max_connections = 200;
SET shared_buffers = '2GB';  -- Adjust based on available RAM
```

### Index Maintenance

```sql
-- Create maintenance script for index optimization
CREATE OR REPLACE FUNCTION maintain_pricing_indexes()
RETURNS VOID AS $$
BEGIN
    -- Reindex pricing-related tables during low usage
    REINDEX TABLE products;
    REINDEX TABLE product_price_history;
    REINDEX TABLE services;
    
    -- Update table statistics for query optimization
    ANALYZE products;
    ANALYZE product_price_history;
    ANALYZE services;
    
    -- Clean up old price history (keep last 2 years)
    DELETE FROM product_price_history 
    WHERE change_date < CURRENT_DATE - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;
```

## Migration Rollback Strategy

```sql
-- Rollback script for Products enhancements (if needed)
-- DROP TRIGGER IF EXISTS product_price_change_trigger ON products;
-- DROP FUNCTION IF EXISTS track_product_price_changes();
-- DROP FUNCTION IF EXISTS bulk_update_product_pricing(UUID[], DECIMAL, DECIMAL, DECIMAL, UUID, TEXT);
-- DROP FUNCTION IF EXISTS format_pln_price(DECIMAL);
-- DROP VIEW IF EXISTS product_pricing_analytics;
-- DROP VIEW IF EXISTS product_margin_opportunities;
-- DROP VIEW IF EXISTS supplier_performance_analytics;
-- DROP TABLE IF EXISTS product_price_history;

-- Remove columns (uncomment only if rollback needed)
-- ALTER TABLE products 
-- DROP COLUMN IF EXISTS vat_rate,
-- DROP COLUMN IF EXISTS supplier_cost,
-- DROP COLUMN IF EXISTS target_margin_percent,
-- DROP COLUMN IF EXISTS minimum_selling_price,
-- DROP COLUMN IF EXISTS maximum_retail_price,
-- DROP COLUMN IF EXISTS last_cost_update,
-- DROP COLUMN IF EXISTS price_tier,
-- DROP COLUMN IF EXISTS supplier_name,
-- DROP COLUMN IF EXISTS supplier_product_code,
-- DROP COLUMN IF EXISTS bulk_update_locked,
-- DROP COLUMN IF EXISTS last_bulk_update;
```

## Implementation Timeline

### Week 1: Core Schema Updates
- Apply Products table enhancements
- Create price history table
- Add essential indexes

### Week 2: Views and Functions  
- Implement analytics views
- Create pricing functions
- Set up automated triggers

### Week 3: Performance Optimization
- Index optimization
- Bulk operation testing
- Query performance tuning

### Week 4: Testing and Validation
- Load testing with 3450+ products
- Bulk operation validation
- Polish compliance verification

## Success Metrics

### Performance Targets
- **Bulk Updates**: <5 seconds for 1000+ products
- **Analytics Queries**: <2 seconds response time
- **Price History**: <100ms for recent changes
- **Index Efficiency**: >95% index usage for pricing queries

### Data Integrity
- **Price History**: 100% change tracking
- **Bulk Operations**: Atomic transactions with rollback
- **Constraint Validation**: All pricing rules enforced
- **Polish Compliance**: Accurate VAT calculations