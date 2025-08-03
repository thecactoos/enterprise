-- Add Advanced Pricing System to Services Table Migration
-- This migration adds advanced pricing tiers, VAT integration, and Polish business features

-- Create new ENUMs for advanced pricing
DO $$ 
BEGIN
    -- Pricing Tier ENUM
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_tier_enum') THEN
        CREATE TYPE pricing_tier_enum AS ENUM (
            'basic',
            'standard', 
            'premium'
        );
    END IF;

    -- Pricing Model ENUM
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_model_enum') THEN
        CREATE TYPE pricing_model_enum AS ENUM (
            'per_m2',
            'hourly',
            'daily', 
            'project',
            'per_room'
        );
    END IF;

    -- VAT Rate ENUM (Polish VAT rates)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vat_rate_enum') THEN
        CREATE TYPE vat_rate_enum AS ENUM ('0', '8', '23');
    END IF;

    -- Regional Zone ENUM (Polish cities/regions)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'regional_zone_enum') THEN
        CREATE TYPE regional_zone_enum AS ENUM (
            'warsaw',
            'krakow',
            'gdansk',
            'wroclaw',
            'poznan',
            'other'
        );
    END IF;
END $$;

-- Add new columns to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS pricing_tier pricing_tier_enum DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS pricing_model pricing_model_enum DEFAULT 'per_m2',
ADD COLUMN IF NOT EXISTS vat_rate vat_rate_enum DEFAULT '23',
ADD COLUMN IF NOT EXISTS standard_price DECIMAL(10,2) DEFAULT 0.00 CHECK (standard_price >= 0),
ADD COLUMN IF NOT EXISTS premium_price DECIMAL(10,2) DEFAULT 0.00 CHECK (premium_price >= 0),
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 0.00 CHECK (hourly_rate >= 0),
ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(10,2) DEFAULT 0.00 CHECK (daily_rate >= 0),
ADD COLUMN IF NOT EXISTS volume_threshold DECIMAL(10,2) DEFAULT 0.00 CHECK (volume_threshold >= 0),
ADD COLUMN IF NOT EXISTS volume_discount_percent DECIMAL(5,2) DEFAULT 0.00 CHECK (volume_discount_percent >= 0 AND volume_discount_percent <= 30),
ADD COLUMN IF NOT EXISTS regional_multiplier DECIMAL(5,3) DEFAULT 1.000 CHECK (regional_multiplier >= 0.5 AND regional_multiplier <= 2.0),
ADD COLUMN IF NOT EXISTS seasonal_adjustment_active BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS seasonal_multiplier DECIMAL(5,3) DEFAULT 1.000 CHECK (seasonal_multiplier >= 0.8 AND seasonal_multiplier <= 1.3);

-- Create additional indexes for pricing queries
CREATE INDEX IF NOT EXISTS idx_services_pricing_tier ON services(pricing_tier);
CREATE INDEX IF NOT EXISTS idx_services_pricing_model ON services(pricing_model);
CREATE INDEX IF NOT EXISTS idx_services_vat_rate ON services(vat_rate);
CREATE INDEX IF NOT EXISTS idx_services_standard_price ON services(standard_price);
CREATE INDEX IF NOT EXISTS idx_services_premium_price ON services(premium_price);
CREATE INDEX IF NOT EXISTS idx_services_volume_threshold ON services(volume_threshold);
CREATE INDEX IF NOT EXISTS idx_services_seasonal_active ON services(seasonal_adjustment_active);
CREATE INDEX IF NOT EXISTS idx_services_regional_multiplier ON services(regional_multiplier);

-- Update existing services with calculated pricing tiers
UPDATE services 
SET 
    standard_price = ROUND(base_price_per_m2 * 1.15, 2),
    premium_price = ROUND(base_price_per_m2 * 1.25, 2),
    vat_rate = '23', -- Standard VAT rate for most construction services
    pricing_tier = 'standard',
    pricing_model = 'per_m2'
WHERE standard_price = 0 OR premium_price = 0;

-- Set reduced VAT rate for specific service categories (if applicable)
-- In Poland, some construction services may qualify for 8% VAT
UPDATE services 
SET vat_rate = '8' 
WHERE category IN ('transport') -- Transport services may have reduced VAT
   OR service_name ILIKE '%konserwacja%' -- Maintenance services
   OR service_name ILIKE '%naprawa%'; -- Repair services

-- Add hourly rates for services that might benefit from hourly pricing
UPDATE services 
SET 
    hourly_rate = CASE 
        WHEN skill_level >= 4 THEN 90.00  -- Expert level
        WHEN skill_level >= 3 THEN 75.00  -- Advanced level  
        WHEN skill_level >= 2 THEN 60.00  -- Intermediate level
        ELSE 45.00                        -- Basic level
    END,
    daily_rate = CASE 
        WHEN skill_level >= 4 THEN 720.00 -- Expert level (8h * 90)
        WHEN skill_level >= 3 THEN 600.00 -- Advanced level (8h * 75)
        WHEN skill_level >= 2 THEN 480.00 -- Intermediate level (8h * 60)
        ELSE 360.00                       -- Basic level (8h * 45)
    END
WHERE hourly_rate = 0;

-- Set volume discounts for premium services
UPDATE services 
SET 
    volume_threshold = 50.0,
    volume_discount_percent = 10.0
WHERE category IN ('wood_glue', 'wood_click') -- Premium wood services get volume discounts
   AND base_price_per_m2 > 40;

-- Set volume discounts for other services 
UPDATE services 
SET 
    volume_threshold = 100.0,
    volume_discount_percent = 5.0
WHERE volume_threshold = 0
   AND base_price_per_m2 > 20;

-- Regional multipliers based on Polish market data
-- (These would typically be updated via API, but we set reasonable defaults)
UPDATE services 
SET regional_multiplier = 1.2 -- Slight premium over base pricing
WHERE regional_multiplier = 1.0;

-- Create a view for pricing analytics
CREATE OR REPLACE VIEW service_pricing_analytics AS
SELECT 
    s.category,
    s.pricing_tier,
    s.vat_rate,
    COUNT(*) as service_count,
    AVG(s.base_price_per_m2) as avg_basic_price,
    AVG(s.standard_price) as avg_standard_price,
    AVG(s.premium_price) as avg_premium_price,
    AVG(s.hourly_rate) as avg_hourly_rate,
    AVG(s.daily_rate) as avg_daily_rate,
    COUNT(CASE WHEN s.volume_threshold > 0 THEN 1 END) as services_with_volume_discount,
    AVG(s.volume_discount_percent) as avg_volume_discount,
    COUNT(CASE WHEN s.seasonal_adjustment_active THEN 1 END) as services_with_seasonal_pricing
FROM services s
WHERE s.status = 'active'
GROUP BY s.category, s.pricing_tier, s.vat_rate
ORDER BY s.category, s.pricing_tier;

-- Create a view for VAT calculations
CREATE OR REPLACE VIEW service_vat_summary AS
SELECT 
    s.id,
    s.service_name,
    s.service_code,
    s.category,
    s.base_price_per_m2 as net_price_basic,
    s.standard_price as net_price_standard,  
    s.premium_price as net_price_premium,
    s.vat_rate,
    ROUND(s.base_price_per_m2 * (1 + s.vat_rate::numeric / 100), 2) as gross_price_basic,
    ROUND(s.standard_price * (1 + s.vat_rate::numeric / 100), 2) as gross_price_standard,
    ROUND(s.premium_price * (1 + s.vat_rate::numeric / 100), 2) as gross_price_premium,
    ROUND(s.base_price_per_m2 * (s.vat_rate::numeric / 100), 2) as vat_amount_basic,
    ROUND(s.standard_price * (s.vat_rate::numeric / 100), 2) as vat_amount_standard,
    ROUND(s.premium_price * (s.vat_rate::numeric / 100), 2) as vat_amount_premium
FROM services s
WHERE s.status = 'active'
ORDER BY s.category, s.service_name;

-- Add comments for documentation
COMMENT ON COLUMN services.pricing_tier IS 'Service pricing tier: basic, standard, or premium';
COMMENT ON COLUMN services.pricing_model IS 'Pricing model: per_m2, hourly, daily, project, or per_room';
COMMENT ON COLUMN services.vat_rate IS 'Polish VAT rate: 0%, 8% (reduced), or 23% (standard)';
COMMENT ON COLUMN services.standard_price IS 'Standard tier price (typically 15% above basic)';
COMMENT ON COLUMN services.premium_price IS 'Premium tier price (typically 25% above basic)';
COMMENT ON COLUMN services.hourly_rate IS 'Hourly rate for hourly pricing model';
COMMENT ON COLUMN services.daily_rate IS 'Daily rate for daily pricing model';
COMMENT ON COLUMN services.volume_threshold IS 'Minimum quantity for volume discount eligibility';
COMMENT ON COLUMN services.volume_discount_percent IS 'Volume discount percentage (0-30%)';
COMMENT ON COLUMN services.regional_multiplier IS 'Regional price adjustment multiplier (0.5-2.0)';
COMMENT ON COLUMN services.seasonal_adjustment_active IS 'Whether seasonal pricing adjustments are active';
COMMENT ON COLUMN services.seasonal_multiplier IS 'Seasonal price adjustment multiplier (0.8-1.3)';

-- Create a function to calculate service price with all factors
CREATE OR REPLACE FUNCTION calculate_service_price(
    p_service_id UUID,
    p_quantity DECIMAL DEFAULT 1.0,
    p_tier pricing_tier_enum DEFAULT 'standard',
    p_regional_zone regional_zone_enum DEFAULT 'other'
) RETURNS TABLE (
    service_name TEXT,
    quantity DECIMAL,
    tier TEXT,
    base_rate DECIMAL,
    net_price DECIMAL,
    vat_rate INTEGER,
    vat_amount DECIMAL,
    gross_price DECIMAL,
    discount_applied DECIMAL,
    effective_rate DECIMAL
) AS $$
DECLARE
    service_record services%ROWTYPE;
    base_rate_calc DECIMAL;
    regional_mult DECIMAL;
    net_calc DECIMAL;
    discount_calc DECIMAL;
    vat_calc DECIMAL;
BEGIN
    -- Get service record
    SELECT * INTO service_record FROM services WHERE id = p_service_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service not found with ID: %', p_service_id;
    END IF;
    
    -- Calculate base rate based on tier
    base_rate_calc := CASE p_tier
        WHEN 'basic' THEN service_record.base_price_per_m2
        WHEN 'standard' THEN COALESCE(service_record.standard_price, service_record.base_price_per_m2 * 1.15)
        WHEN 'premium' THEN COALESCE(service_record.premium_price, service_record.base_price_per_m2 * 1.25)
    END;
    
    -- Apply regional multiplier
    regional_mult := CASE p_regional_zone
        WHEN 'warsaw' THEN 1.25
        WHEN 'krakow' THEN 1.15
        WHEN 'gdansk' THEN 1.10
        WHEN 'wroclaw' THEN 1.08
        WHEN 'poznan' THEN 1.05  
        ELSE service_record.regional_multiplier
    END;
    
    base_rate_calc := base_rate_calc * regional_mult;
    
    -- Apply seasonal adjustment if active
    IF service_record.seasonal_adjustment_active THEN
        base_rate_calc := base_rate_calc * service_record.seasonal_multiplier;
    END IF;
    
    net_calc := base_rate_calc * p_quantity;
    
    -- Apply volume discount if applicable
    discount_calc := 0;
    IF p_quantity >= service_record.volume_threshold AND service_record.volume_discount_percent > 0 THEN
        discount_calc := net_calc * service_record.volume_discount_percent / 100;
        net_calc := net_calc - discount_calc;
    END IF;
    
    -- Ensure minimum charge
    net_calc := GREATEST(net_calc, service_record.minimum_charge);
    
    -- Calculate VAT
    vat_calc := net_calc * service_record.vat_rate::numeric / 100;
    
    RETURN QUERY SELECT 
        service_record.service_name,
        p_quantity,
        p_tier::TEXT,
        ROUND(base_rate_calc, 2),
        ROUND(net_calc, 2),
        service_record.vat_rate::INTEGER,
        ROUND(vat_calc, 2),
        ROUND(net_calc + vat_calc, 2),
        ROUND(discount_calc, 2),
        ROUND(base_rate_calc, 2);
END;
$$ LANGUAGE plpgsql;

COMMIT;