-- ========================================
-- SPS Enterprise CRM Database Schema
-- ========================================

-- Create database if not exists (handled by Docker)
-- CREATE DATABASE crm_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- USERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'sales' CHECK (role IN ('admin', 'sales', 'manager')),
    status VARCHAR(50) DEFAULT 'invited' CHECK (status IN ('active', 'invited', 'inactive')),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- CLIENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    address TEXT,
    notes TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- NOTES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    "clientId" UUID NOT NULL,
    "userId" UUID,
    "isImportant" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_notes_client 
        FOREIGN KEY ("clientId") REFERENCES clients(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_notes_user 
        FOREIGN KEY ("userId") REFERENCES users(id) 
        ON DELETE SET NULL
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients("isActive");
CREATE INDEX IF NOT EXISTS idx_clients_created ON clients("createdAt");

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_notes_client_id ON notes("clientId");
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes("userId");
CREATE INDEX IF NOT EXISTS idx_notes_important ON notes("isImportant");
CREATE INDEX IF NOT EXISTS idx_notes_created ON notes("createdAt");

-- ========================================
-- SAMPLE DATA FOR DEVELOPMENT
-- ========================================

-- Insert real test users from TEST_USERS.md
INSERT INTO users (id, "firstName", "lastName", email, "passwordHash", role, status) VALUES
    ('cedb2a5f-5cf8-426f-a64a-686d4eca476e', 'Arek', 'Orłowski', 'a.orlowski@superparkiet.pl', '$2a$10$no4t0.PEFgVCxNC0jZkIzO9BWIxGLaSKvbCRJXg/U6lgzfgCFuqeq', 'admin', 'active'),
    ('8192cb3a-0c60-4cf0-a7a2-65d464ae7edf', 'Paulina', 'Sowińska', 'p.sowinska@superparkiet.pl', '$2a$10$eTJ.hc.K/99ohF8wiHhgv.JKFQJ7xbb.CF8QV.XfUUWISb7OJwcia', 'sales', 'active'),
    ('5ef5b2f2-18a7-404d-a3de-b50981f986e6', 'Grzegorz', 'Pol', 'g.pol@superparkiet.pl', '$2a$10$cdXzGD4gQ07usv8ouFjAtuBLSIQOJV5EKDjpUd6ZG/mBzhck9LEG.', 'manager', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert sample clients
INSERT INTO clients (id, name, email, phone, company, address) VALUES
    ('660e8400-e29b-42d4-a716-446655440001', 'Acme Corporation', 'contact@acme.com', '+1-555-0101', 'Acme Corp', '123 Business St, City, State 12345'),
    ('660e8400-e29b-42d4-a716-446655440002', 'Tech Solutions Ltd', 'info@techsolutions.com', '+1-555-0102', 'Tech Solutions', '456 Innovation Ave, Tech City, TC 67890'),
    ('660e8400-e29b-42d4-a716-446655440003', 'Global Industries', 'hello@global.com', '+1-555-0103', 'Global Industries', '789 Enterprise Blvd, Metro, MT 54321'),
    ('660e8400-e29b-42d4-a716-446655440004', 'StartupXYZ', 'team@startupxyz.com', '+1-555-0104', 'StartupXYZ', '321 Startup Lane, Innovation Hub, IH 98765'),
    ('660e8400-e29b-42d4-a716-446655440005', 'Enterprise Corp', 'sales@enterprise.com', '+1-555-0105', 'Enterprise Corp', '654 Corporate Drive, Business District, BD 13579')
ON CONFLICT (email) DO NOTHING;

-- Insert sample notes
INSERT INTO notes (title, content, "clientId", "userId", "isImportant") VALUES
    ('Initial Meeting', 'Had a great first meeting with the Acme team. They are interested in our enterprise solution.', '660e8400-e29b-42d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', true),
    ('Follow-up Required', 'Need to send proposal by Friday. Client is very interested in our services.', '660e8400-e29b-42d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', true),
    ('Payment Discussion', 'Discussed payment terms. They prefer quarterly billing.', '660e8400-e29b-42d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', false),
    ('Technical Requirements', 'Startup needs custom integration with their existing system.', '660e8400-e29b-42d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', true),
    ('Contract Signed', 'Successfully signed annual contract with Enterprise Corp!', '660e8400-e29b-42d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', true);

-- ========================================
-- TRIGGERS FOR UPDATED_AT
-- ========================================

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at 
    BEFORE UPDATE ON notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- View for client statistics
CREATE OR REPLACE VIEW client_stats AS
SELECT 
    c.id,
    c.name,
    c.company,
    c.email,
    COUNT(n.id) as total_notes,
    COUNT(CASE WHEN n."isImportant" = true THEN 1 END) as important_notes,
    MAX(n."createdAt") as last_note_date,
    c."createdAt" as client_since
FROM clients c
LEFT JOIN notes n ON c.id = n."clientId"
WHERE c."isActive" = true
GROUP BY c.id, c.name, c.company, c.email, c."createdAt";

-- View for user activity
CREATE OR REPLACE VIEW user_activity AS
SELECT 
    u.id,
    CONCAT(u."firstName", ' ', u."lastName") as name,
    u.email,
    COUNT(n.id) as total_notes,
    COUNT(CASE WHEN n."createdAt" > CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as notes_this_week,
    MAX(n."createdAt") as last_activity
FROM users u
LEFT JOIN notes n ON u.id = n."userId"
WHERE u.status = 'active'
GROUP BY u.id, u."firstName", u."lastName", u.email;

-- ========================================
-- PERMISSIONS (if needed in production)
-- ========================================

-- Grant permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO crm_user;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO crm_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO crm_user;

-- ========================================
-- LEADS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Contact Information
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    
    -- Company Information
    company VARCHAR(200),
    position VARCHAR(100),
    nip VARCHAR(20),
    industry VARCHAR(200),
    "companySize" VARCHAR(100),
    
    -- Lead Classification
    source VARCHAR(50) DEFAULT 'other' CHECK (source IN ('website', 'referral', 'social_media', 'advertisement', 'cold_call', 'event', 'email_campaign', 'direct_contact', 'partnership', 'other')),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'converted', 'unqualified', 'lost', 'on_hold')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    "leadType" VARCHAR(50) DEFAULT 'b2c' CHECK ("leadType" IN ('b2b', 'b2c', 'distributor', 'contractor', 'architect', 'designer')),
    "projectType" VARCHAR(50) CHECK ("projectType" IN ('residential', 'commercial', 'office', 'hotel', 'restaurant', 'retail', 'industrial', 'public', 'other')),
    
    -- Financial Information
    "estimatedValue" DECIMAL(15,2),
    "estimatedArea" DECIMAL(15,2),
    "budgetMin" DECIMAL(15,2),
    "budgetMax" DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'PLN',
    
    -- Timeline
    "expectedCloseDate" DATE,
    "projectStartDate" DATE,
    "projectEndDate" DATE,
    "urgencyScore" INTEGER CHECK ("urgencyScore" BETWEEN 1 AND 10),
    
    -- Geographic Information
    address VARCHAR(200),
    city VARCHAR(100),
    "postalCode" VARCHAR(20),
    voivodeship VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Poland',
    
    -- Detailed Information
    notes TEXT,
    requirements TEXT,
    "painPoints" TEXT,
    "competitorInfo" TEXT,
    "interestedProducts" JSONB,
    "communicationPreferences" JSONB,
    
    -- Tracking & Analytics
    "sourceDetails" VARCHAR(200),
    "referralSource" VARCHAR(200),
    "initialTouchpoint" VARCHAR(500),
    "trackingData" JSONB,
    "qualificationScore" INTEGER DEFAULT 0 CHECK ("qualificationScore" BETWEEN 0 AND 100),
    "contactAttempts" INTEGER DEFAULT 0,
    "lastContactDate" TIMESTAMP,
    "nextFollowUpDate" TIMESTAMP,
    
    -- Relationships
    "assignedUserId" UUID,
    "convertedToClientId" UUID,
    "originalLeadId" UUID,
    
    -- Metadata
    "isActive" BOOLEAN DEFAULT true,
    "isArchived" BOOLEAN DEFAULT false,
    "gdprConsent" BOOLEAN DEFAULT false,
    "gdprConsentDate" TIMESTAMP,
    "marketingConsent" BOOLEAN DEFAULT false,
    "customFields" JSONB,
    tags TEXT[],
    
    -- Timestamps
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" TIMESTAMP,
    "lostAt" TIMESTAMP,
    "lostReason" VARCHAR(500),
    
    -- Foreign Key Constraints
    CONSTRAINT fk_leads_assigned_user 
        FOREIGN KEY ("assignedUserId") REFERENCES users(id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_leads_converted_client 
        FOREIGN KEY ("convertedToClientId") REFERENCES clients(id) 
        ON DELETE SET NULL,
    CONSTRAINT fk_leads_original_lead 
        FOREIGN KEY ("originalLeadId") REFERENCES leads(id) 
        ON DELETE SET NULL
);

-- ========================================
-- LEADS INDEXES FOR PERFORMANCE
-- ========================================

-- Primary indexes for filtering and searching
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_lead_type ON leads("leadType");
CREATE INDEX IF NOT EXISTS idx_leads_assigned_user ON leads("assignedUserId");
CREATE INDEX IF NOT EXISTS idx_leads_converted_client ON leads("convertedToClientId");
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads("createdAt");
CREATE INDEX IF NOT EXISTS idx_leads_estimated_value ON leads("estimatedValue");
CREATE INDEX IF NOT EXISTS idx_leads_expected_close_date ON leads("expectedCloseDate");

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leads_status_priority ON leads(status, priority);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_status ON leads("assignedUserId", status);
CREATE INDEX IF NOT EXISTS idx_leads_active_status ON leads("isActive", status);
CREATE INDEX IF NOT EXISTS idx_leads_source_status ON leads(source, status);

-- Geographic indexes
CREATE INDEX IF NOT EXISTS idx_leads_city ON leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_voivodeship ON leads(voivodeship);

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads(industry);

-- JSONB indexes for custom fields and tags
CREATE INDEX IF NOT EXISTS idx_leads_custom_fields ON leads USING GIN ("customFields");
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_leads_interested_products ON leads USING GIN ("interestedProducts");

-- Date-based indexes for follow-ups and analytics
CREATE INDEX IF NOT EXISTS idx_leads_next_followup ON leads("nextFollowUpDate");
CREATE INDEX IF NOT EXISTS idx_leads_last_contact ON leads("lastContactDate");

-- ========================================
-- LEADS TRIGGERS
-- ========================================

-- Update timestamp trigger for leads
CREATE TRIGGER update_leads_updated_at 
    BEFORE UPDATE ON leads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- LEADS SAMPLE DATA
-- ========================================

-- Insert sample leads for development
INSERT INTO leads (
    id, "firstName", "lastName", email, phone, company, position, 
    source, status, priority, "leadType", "estimatedValue", 
    city, voivodeship, "assignedUserId", "qualificationScore", notes
) VALUES
    (
        'lead-001-uuid-sample-000000000001', 
        'Anna', 'Kowalska', 'a.kowalska@budownictwo.pl', '+48 123 456 789',
        'Kowalska Budownictwo Sp. z o.o.', 'Prezes',
        'website', 'qualified', 'high', 'b2b', 150000.00,
        'Warszawa', 'mazowieckie', 'cedb2a5f-5cf8-426f-a64a-686d4eca476e', 85,
        'Duży projekt biurowy w centrum Warszawy. Klient szuka wysokiej jakości parkietów.'
    ),
    (
        'lead-002-uuid-sample-000000000002',
        'Piotr', 'Nowak', 'p.nowak@gmail.com', '+48 987 654 321',
        NULL, NULL,
        'referral', 'contacted', 'medium', 'b2c', 25000.00,
        'Kraków', 'małopolskie', 'cedb2a5f-5cf8-426f-a64a-686d4eca476e', 65,
        'Remont mieszkania - salon i sypialnia. Polecenie od klienta Kowalska Budownictwo.'
    ),
    (
        'lead-003-uuid-sample-000000000003',
        'Marcin', 'Wiśniewski', 'm.wisniewski@architektura.com', '+48 555 123 456',
        'Wiśniewski Architekci', 'Architekt główny',
        'event', 'proposal_sent', 'urgent', 'architect', 300000.00,
        'Gdańsk', 'pomorskie', '8192cb3a-0c60-4cf0-a7a2-65d464ae7edf', 90,
        'Prestiżowy projekt hotelowy. Spotkanie na targach w Poznaniu. Wymaga szybkiej oferty.'
    ),
    (
        'lead-004-uuid-sample-000000000004',
        'Katarzyna', 'Zielińska', 'k.zielinska@restauracja.pl', '+48 777 888 999',
        'Restauracja Pod Dębem', 'Właścicielka',
        'social_media', 'new', 'high', 'b2b', 75000.00,
        'Wrocław', 'dolnośląskie', NULL, 45,
        'Nowa restauracja - potrzebuje parkiety odporne na duży ruch. Kontakt przez Facebook.'
    ),
    (
        'lead-005-uuid-sample-000000000005',
        'Tomasz', 'Kaczmarek', 't.kaczmarek@dom.pl', '+48 111 222 333',
        NULL, 'Inżynier',
        'cold_call', 'unqualified', 'low', 'b2c', 15000.00,
        'Poznań', 'wielkopolskie', '5ef5b2f2-18a7-404d-a3de-b50981f986e6', 25,
        'Mały budżet, nierealne oczekiwania cenowe. Cold call - niechętny do rozmowy.'
    )
ON CONFLICT (email) DO NOTHING;

-- ========================================
-- LEADS VIEWS FOR ANALYTICS
-- ========================================

-- View for lead statistics by status
CREATE OR REPLACE VIEW lead_status_stats AS
SELECT 
    status,
    COUNT(*) as total_count,
    COUNT(CASE WHEN "createdAt" > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as last_30_days,
    COUNT(CASE WHEN "createdAt" > CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as last_7_days,
    ROUND(AVG("estimatedValue"), 2) as avg_estimated_value,
    SUM("estimatedValue") as total_estimated_value
FROM leads 
WHERE "isActive" = true AND "isArchived" = false
GROUP BY status;

-- View for lead statistics by source
CREATE OR REPLACE VIEW lead_source_stats AS
SELECT 
    source,
    COUNT(*) as total_count,
    ROUND(AVG("qualificationScore"), 2) as avg_qualification_score,
    COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_count,
    ROUND(
        COUNT(CASE WHEN status = 'converted' THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as conversion_rate_percent
FROM leads 
WHERE "isActive" = true AND "isArchived" = false
GROUP BY source;

-- View for leads needing follow-up
CREATE OR REPLACE VIEW leads_followup_due AS
SELECT 
    l.*,
    CONCAT(l."firstName", ' ', l."lastName") as full_name,
    CASE 
        WHEN l."nextFollowUpDate" IS NOT NULL AND l."nextFollowUpDate" <= CURRENT_TIMESTAMP 
        THEN 'scheduled_overdue'
        WHEN l."lastContactDate" IS NULL AND l."createdAt" <= CURRENT_TIMESTAMP - INTERVAL '1 day'
        THEN 'new_lead_overdue'
        WHEN l."lastContactDate" IS NOT NULL AND l."lastContactDate" <= CURRENT_TIMESTAMP - INTERVAL '7 days'
        THEN 'no_recent_contact'
        ELSE 'other'
    END as followup_reason,
    CASE 
        WHEN l."nextFollowUpDate" IS NOT NULL 
        THEN EXTRACT(DAY FROM CURRENT_TIMESTAMP - l."nextFollowUpDate")
        WHEN l."lastContactDate" IS NOT NULL 
        THEN EXTRACT(DAY FROM CURRENT_TIMESTAMP - l."lastContactDate")
        ELSE EXTRACT(DAY FROM CURRENT_TIMESTAMP - l."createdAt")
    END as days_overdue
FROM leads l
WHERE 
    l."isActive" = true 
    AND l."isArchived" = false 
    AND l.status NOT IN ('converted', 'lost', 'unqualified')
    AND (
        (l."nextFollowUpDate" IS NOT NULL AND l."nextFollowUpDate" <= CURRENT_TIMESTAMP)
        OR (l."nextFollowUpDate" IS NULL AND l."lastContactDate" IS NULL AND l."createdAt" <= CURRENT_TIMESTAMP - INTERVAL '1 day')
        OR (l."nextFollowUpDate" IS NULL AND l."lastContactDate" IS NOT NULL AND l."lastContactDate" <= CURRENT_TIMESTAMP - INTERVAL '7 days')
    );

-- View for high-value leads
CREATE OR REPLACE VIEW high_value_leads AS
SELECT 
    l.*,
    CONCAT(l."firstName", ' ', l."lastName") as full_name,
    ROUND(l."estimatedValue" * (
        CASE l.status
            WHEN 'new' THEN 0.1
            WHEN 'contacted' THEN 0.2
            WHEN 'qualified' THEN 0.4
            WHEN 'proposal_sent' THEN 0.6
            WHEN 'negotiation' THEN 0.75
            WHEN 'converted' THEN 1.0
            ELSE 0.05
        END
    ), 2) as weighted_value
FROM leads l
WHERE 
    l."isActive" = true 
    AND l."isArchived" = false
    AND l."estimatedValue" > 50000
    AND l.status NOT IN ('lost', 'unqualified')
ORDER BY l."estimatedValue" DESC;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

SELECT 'Database schema with leads table created successfully!' as message;

-- ========================================
-- MVP MIGRATIONS - QUOTES & ORDERS SYSTEM
-- ========================================

-- Include migration files
\i /docker-entrypoint-initdb.d/migrations/001_transform_leads_to_contacts.sql
\i /docker-entrypoint-initdb.d/migrations/002_create_quotes_table.sql
\i /docker-entrypoint-initdb.d/migrations/003_create_orders_table.sql

SELECT 'MVP Quotes & Orders system migrations completed!' as message;