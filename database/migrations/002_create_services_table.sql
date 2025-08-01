-- Create Services Table Migration
-- This migration creates the services table for flooring service management

-- Create ENUMs for services (must be outside transaction for PostgreSQL)
DO $$ 
BEGIN
    -- Service Category ENUM
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_category_enum') THEN
        CREATE TYPE service_category_enum AS ENUM (
            'wood_glue',
            'wood_click', 
            'laminate_glue',
            'laminate_click',
            'vinyl_glue',
            'vinyl_click',
            'transport',
            'baseboards'
        );
    END IF;

    -- Material ENUM  
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'material_enum') THEN
        CREATE TYPE material_enum AS ENUM (
            'drewno',
            'laminat',
            'winyl',
            'transport',
            'listwa_mdf',
            'listwa_tworzywowa',
            'listwa_dollken',
            'listwa_wenev'
        );
    END IF;

    -- Installation Method ENUM
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'installation_method_enum') THEN
        CREATE TYPE installation_method_enum AS ENUM (
            'klej',
            'click',
            'transport',
            'montaż_listwy'
        );
    END IF;

    -- Flooring Form ENUM
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flooring_form_enum') THEN
        CREATE TYPE flooring_form_enum AS ENUM (
            'parkiet',
            'deska',
            'transport',
            'listwa'
        );
    END IF;

    -- Pattern ENUM
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pattern_enum') THEN
        CREATE TYPE pattern_enum AS ENUM (
            'nieregularnie',
            'regularnie',
            'jodła_klasyczna',
            'jodła_francuska',
            'regularnie_ipa',
            'jodła_klasyczna_berry_alloc',
            'jodła_klasyczna_barlinek',
            'jodła_francuska_barlinek',
            'jodła_klasyczna_arbiton',
            'jodła_francuska_arbiton',
            'jodła_klasyczna_unizip',
            'transport',
            'listwa_10cm',
            'listwa_12cm', 
            'listwa_15cm',
            'listwa_dollken',
            'listwa_wenev'
        );
    END IF;

    -- Service Status ENUM
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_status_enum') THEN
        CREATE TYPE service_status_enum AS ENUM (
            'active',
            'inactive',
            'discontinued'
        );
    END IF;
END $$;

-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_code VARCHAR(100) UNIQUE NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    category service_category_enum NOT NULL,
    material material_enum NOT NULL,
    installation_method installation_method_enum NOT NULL,
    flooring_form flooring_form_enum NOT NULL,
    pattern pattern_enum NOT NULL,
    description TEXT,
    base_price_per_m2 DECIMAL(10,2) DEFAULT 0.00 CHECK (base_price_per_m2 >= 0),
    minimum_charge DECIMAL(10,2) DEFAULT 0.00 CHECK (minimum_charge >= 0),
    time_per_m2_minutes INTEGER DEFAULT 0 CHECK (time_per_m2_minutes >= 0 AND time_per_m2_minutes <= 1440),
    skill_level INTEGER DEFAULT 1 CHECK (skill_level >= 1 AND skill_level <= 5),
    status service_status_enum DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_category_status ON services(category, status);
CREATE INDEX IF NOT EXISTS idx_services_material_installation ON services(material, installation_method);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_price_range ON services(base_price_per_m2);
CREATE INDEX IF NOT EXISTS idx_services_skill_level ON services(skill_level);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_services_updated_at ON services;
CREATE TRIGGER trigger_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_services_updated_at();

-- Insert sample data (36 services from the provided list)
INSERT INTO services (
    service_code, service_name, category, material, installation_method, 
    flooring_form, pattern, description, base_price_per_m2, minimum_charge, 
    time_per_m2_minutes, skill_level, status
) VALUES 
-- 🪵 Wood Glue Services (10)
('WOOD_GLUE_PARQUET_IRREGULAR', 'Montaż podłogi drewnianej na klej - parkiet nieregularnie', 'wood_glue', 'drewno', 'klej', 'parkiet', 'nieregularnie', 'Professional wooden parquet installation using adhesive method', 45.00, 300.00, 35, 4, 'active'),
('WOOD_GLUE_PARQUET_REGULAR', 'Montaż podłogi drewnianej na klej - parkiet regularnie', 'wood_glue', 'drewno', 'klej', 'parkiet', 'regularnie', 'Professional wooden parquet installation with regular pattern', 40.00, 300.00, 30, 3, 'active'),
('WOOD_GLUE_PARQUET_HERRINGBONE_CLASSIC', 'Montaż podłogi drewnianej na klej - parkiet jodła klasyczna', 'wood_glue', 'drewno', 'klej', 'parkiet', 'jodła_klasyczna', 'Professional wooden parquet with classic herringbone pattern', 55.00, 400.00, 45, 5, 'active'),
('WOOD_GLUE_PARQUET_HERRINGBONE_FRENCH', 'Montaż podłogi drewnianej na klej - parkiet jodła francuska', 'wood_glue', 'drewno', 'klej', 'parkiet', 'jodła_francuska', 'Professional wooden parquet with French herringbone pattern', 60.00, 450.00, 50, 5, 'active'),
('WOOD_GLUE_PLANK_IRREGULAR', 'Montaż podłogi drewnianej na klej - deska nieregularnie', 'wood_glue', 'drewno', 'klej', 'deska', 'nieregularnie', 'Professional wooden plank installation with irregular pattern', 38.00, 280.00, 28, 3, 'active'),
('WOOD_GLUE_PLANK_REGULAR', 'Montaż podłogi drewnianej na klej - deska regularnie', 'wood_glue', 'drewno', 'klej', 'deska', 'regularnie', 'Professional wooden plank installation with regular pattern', 35.00, 280.00, 25, 3, 'active'),
('WOOD_GLUE_PLANK_HERRINGBONE_CLASSIC', 'Montaż podłogi drewnianej na klej - deska jodła klasyczna', 'wood_glue', 'drewno', 'klej', 'deska', 'jodła_klasyczna', 'Professional wooden plank with classic herringbone pattern', 50.00, 380.00, 40, 4, 'active'),
('WOOD_GLUE_PLANK_HERRINGBONE_CLASSIC_BARLINEK', 'Montaż podłogi drewnianej na klej - deska jodła klasyczna Barlinek', 'wood_glue', 'drewno', 'klej', 'deska', 'jodła_klasyczna_barlinek', 'Professional Barlinek wooden plank with classic herringbone', 52.00, 400.00, 42, 4, 'active'),
('WOOD_GLUE_PLANK_HERRINGBONE_FRENCH', 'Montaż podłogi drewnianej na klej - deska jodła francuska', 'wood_glue', 'drewno', 'klej', 'deska', 'jodła_francuska', 'Professional wooden plank with French herringbone pattern', 55.00, 420.00, 45, 5, 'active'),
('WOOD_GLUE_PLANK_HERRINGBONE_FRENCH_BARLINEK', 'Montaż podłogi drewnianej na klej - deska jodła francuska Barlinek', 'wood_glue', 'drewno', 'klej', 'deska', 'jodła_francuska_barlinek', 'Professional Barlinek wooden plank with French herringbone', 58.00, 450.00, 48, 5, 'active'),

-- 🪵 Wood Click Services (4)
('WOOD_CLICK_PLANK_IRREGULAR', 'Montaż podłogi drewnianej na click - deska nieregularnie', 'wood_click', 'drewno', 'click', 'deska', 'nieregularnie', 'Professional wooden plank click installation with irregular pattern', 28.00, 220.00, 18, 2, 'active'),
('WOOD_CLICK_PLANK_REGULAR', 'Montaż podłogi drewnianej na click - deska regularnie', 'wood_click', 'drewno', 'click', 'deska', 'regularnie', 'Professional wooden plank click installation with regular pattern', 25.00, 200.00, 15, 2, 'active'),
('WOOD_CLICK_PLANK_HERRINGBONE_CLASSIC_BARLINEK', 'Montaż podłogi drewnianej na click - deska jodła klasyczna Barlinek', 'wood_click', 'drewno', 'click', 'deska', 'jodła_klasyczna_barlinek', 'Professional Barlinek wooden click plank with classic herringbone', 35.00, 280.00, 25, 3, 'active'),
('WOOD_CLICK_PLANK_HERRINGBONE_FRENCH_BARLINEK', 'Montaż podłogi drewnianej na click - deska jodła francuska Barlinek', 'wood_click', 'drewno', 'click', 'deska', 'jodła_francuska_barlinek', 'Professional Barlinek wooden click plank with French herringbone', 40.00, 320.00, 30, 4, 'active'),

-- 🧱 Laminate Glue Services (3) 
('LAMINATE_GLUE_PARQUET_HERRINGBONE_BERRY_ALLOC', 'Montaż laminatu na klej - parkiet jodła klasyczna Berry Alloc', 'laminate_glue', 'laminat', 'klej', 'parkiet', 'jodła_klasyczna_berry_alloc', 'Berry Alloc laminate parquet with classic herringbone pattern', 32.00, 250.00, 25, 3, 'active'),
('LAMINATE_GLUE_PLANK_IRREGULAR', 'Montaż laminatu na klej - deska nieregularnie', 'laminate_glue', 'laminat', 'klej', 'deska', 'nieregularnie', 'Professional laminate plank installation with adhesive', 25.00, 200.00, 20, 2, 'active'),
('LAMINATE_GLUE_PLANK_REGULAR_IPA', 'Montaż laminatu na klej - deska regularnie + IPA', 'laminate_glue', 'laminat', 'klej', 'deska', 'regularnie_ipa', 'Professional laminate plank with IPA treatment', 28.00, 220.00, 22, 3, 'active'),

-- 🧱 Laminate Click Services (3)
('LAMINATE_CLICK_PARQUET_HERRINGBONE_BERRY_ALLOC', 'Montaż laminatu na click - parkiet jodła klasyczna Berry Alloc', 'laminate_click', 'laminat', 'click', 'parkiet', 'jodła_klasyczna_berry_alloc', 'Berry Alloc laminate click parquet with herringbone pattern', 22.00, 180.00, 15, 2, 'active'),
('LAMINATE_CLICK_PLANK_IRREGULAR', 'Montaż laminatu na click - deska nieregularnie', 'laminate_click', 'laminat', 'click', 'deska', 'nieregularnie', 'Professional laminate click plank installation', 18.00, 150.00, 12, 1, 'active'),
('LAMINATE_CLICK_PLANK_REGULAR_IPA', 'Montaż laminatu na click - deska regularnie + IPA', 'laminate_click', 'laminat', 'click', 'deska', 'regularnie_ipa', 'Professional laminate click plank with IPA treatment', 20.00, 160.00, 14, 2, 'active'),

-- 💿 Vinyl Glue Services (4)
('VINYL_GLUE_PLANK_IRREGULAR', 'Montaż winylu na klej - deska nieregularnie', 'vinyl_glue', 'winyl', 'klej', 'deska', 'nieregularnie', 'Professional vinyl plank installation with adhesive', 30.00, 240.00, 25, 3, 'active'),
('VINYL_GLUE_PLANK_REGULAR', 'Montaż winylu na klej - deska regularnie', 'vinyl_glue', 'winyl', 'klej', 'deska', 'regularnie', 'Professional vinyl plank with regular pattern installation', 28.00, 220.00, 22, 2, 'active'),
('VINYL_GLUE_PLANK_HERRINGBONE_CLASSIC_ARBITON', 'Montaż winylu na klej - deska jodła klasyczna Arbiton', 'vinyl_glue', 'winyl', 'klej', 'deska', 'jodła_klasyczna_arbiton', 'Arbiton vinyl plank with classic herringbone pattern', 35.00, 280.00, 30, 4, 'active'),
('VINYL_GLUE_PLANK_HERRINGBONE_FRENCH_ARBITON', 'Montaż winylu na klej - deska jodła francuska Arbiton', 'vinyl_glue', 'winyl', 'klej', 'deska', 'jodła_francuska_arbiton', 'Arbiton vinyl plank with French herringbone pattern', 38.00, 300.00, 33, 4, 'active'),

-- 💿 Vinyl Click Services (5)
('VINYL_CLICK_PLANK_IRREGULAR', 'Montaż winylu na click - deska nieregularnie', 'vinyl_click', 'winyl', 'click', 'deska', 'nieregularnie', 'Professional vinyl click plank installation', 20.00, 160.00, 15, 2, 'active'),
('VINYL_CLICK_PLANK_REGULAR', 'Montaż winylu na click - deska regularnie', 'vinyl_click', 'winyl', 'click', 'deska', 'regularnie', 'Professional vinyl click plank with regular pattern', 18.00, 150.00, 12, 1, 'active'),
('VINYL_CLICK_PLANK_HERRINGBONE_CLASSIC_ARBITON', 'Montaż winylu na click - deska jodła klasyczna Arbiton', 'vinyl_click', 'winyl', 'click', 'deska', 'jodła_klasyczna_arbiton', 'Arbiton vinyl click plank with classic herringbone', 25.00, 200.00, 18, 3, 'active'),
('VINYL_CLICK_PLANK_HERRINGBONE_CLASSIC_UNIZIP', 'Montaż winylu na click - deska jodła klasyczna Unizip (np. QS)', 'vinyl_click', 'winyl', 'click', 'deska', 'jodła_klasyczna_unizip', 'Unizip vinyl click plank with classic herringbone pattern', 27.00, 220.00, 20, 3, 'active'),
('VINYL_CLICK_PLANK_HERRINGBONE_FRENCH_ARBITON', 'Montaż winylu na click - deska jodła francuska Arbiton', 'vinyl_click', 'winyl', 'click', 'deska', 'jodła_francuska_arbiton', 'Arbiton vinyl click plank with French herringbone', 30.00, 240.00, 22, 3, 'active'),

-- 📦 Transport Service (1)
('TRANSPORT_DELIVERY', 'Transport materiałów', 'transport', 'transport', 'transport', 'transport', 'transport', 'Professional material delivery and transport service', 5.00, 100.00, 0, 1, 'active'),

-- 🪚 Baseboard Services (6)
('BASEBOARD_MDF_10CM', 'Listwa MDF do 10 cm z akrylowaniem dół/góra z materiałami', 'baseboards', 'listwa_mdf', 'montaż_listwy', 'listwa', 'listwa_10cm', 'MDF baseboard up to 10cm with acrylic coating and materials', 15.00, 120.00, 10, 2, 'active'),
('BASEBOARD_MDF_12CM', 'Listwa MDF do 12 cm z akrylowaniem dół/góra z materiałami', 'baseboards', 'listwa_mdf', 'montaż_listwy', 'listwa', 'listwa_12cm', 'MDF baseboard up to 12cm with acrylic coating and materials', 18.00, 140.00, 12, 2, 'active'),
('BASEBOARD_MDF_15CM', 'Listwa MDF do 15 cm z akrylowaniem dół/góra z materiałami', 'baseboards', 'listwa_mdf', 'montaż_listwy', 'listwa', 'listwa_15cm', 'MDF baseboard up to 15cm with acrylic coating and materials', 22.00, 160.00, 15, 2, 'active'),
('BASEBOARD_PLASTIC_10CM', 'Listwa tworzywowa do 10 cm z akrylowaniem dół/góra z materiałami', 'baseboards', 'listwa_tworzywowa', 'montaż_listwy', 'listwa', 'listwa_10cm', 'Plastic baseboard up to 10cm with acrylic coating and materials', 12.00, 100.00, 8, 1, 'active'),
('BASEBOARD_DOLLKEN', 'Listwa Dollken bez kleju, ale z akrylem i usługą akrylowania', 'baseboards', 'listwa_dollken', 'montaż_listwy', 'listwa', 'listwa_dollken', 'Dollken baseboard without glue but with acrylic and coating service', 25.00, 180.00, 18, 3, 'active'),
('BASEBOARD_WENEV', 'Listwa przypodłogowa WENEV', 'baseboards', 'listwa_wenev', 'montaż_listwy', 'listwa', 'listwa_wenev', 'WENEV baseboard installation service', 20.00, 150.00, 12, 2, 'active')

ON CONFLICT (service_code) DO NOTHING;

-- Create a view for service statistics
CREATE OR REPLACE VIEW service_statistics AS
SELECT 
    s.category,
    s.material,
    s.status,
    COUNT(*) as service_count,
    AVG(s.base_price_per_m2) as avg_price,
    MIN(s.base_price_per_m2) as min_price,
    MAX(s.base_price_per_m2) as max_price,
    AVG(s.time_per_m2_minutes) as avg_time_minutes,
    AVG(s.skill_level) as avg_skill_level
FROM services s
GROUP BY s.category, s.material, s.status;

COMMENT ON TABLE services IS 'Flooring services catalog with pricing and time estimates';
COMMENT ON COLUMN services.service_code IS 'Unique code for service identification';
COMMENT ON COLUMN services.base_price_per_m2 IS 'Base price per square meter in PLN';
COMMENT ON COLUMN services.minimum_charge IS 'Minimum charge for service in PLN';
COMMENT ON COLUMN services.time_per_m2_minutes IS 'Estimated time per square meter in minutes';
COMMENT ON COLUMN services.skill_level IS 'Required skill level from 1 (basic) to 5 (expert)';

COMMIT;