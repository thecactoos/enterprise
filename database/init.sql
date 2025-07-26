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
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    "isActive" BOOLEAN DEFAULT true,
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
CREATE INDEX IF NOT EXISTS idx_users_active ON users("isActive");

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

-- Insert sample users (passwords are hashed for 'password123')
INSERT INTO users (id, name, email, password, role) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'John Admin', 'john@example.com', '$2b$10$8EisDV7FGbGPqK0PGVv5T.dkMZ/eY8hF8aEpHK7zG2J0J9eLr6gHu', 'admin'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Jane User', 'jane@example.com', '$2b$10$8EisDV7FGbGPqK0PGVv5T.dkMZ/eY8hF8aEpHK7zG2J0J9eLr6gHu', 'user'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Bob Manager', 'bob@example.com', '$2b$10$8EisDV7FGbGPqK0PGVv5T.dkMZ/eY8hF8aEpHK7zG2J0J9eLr6gHu', 'user')
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
    u.name,
    u.email,
    COUNT(n.id) as total_notes,
    COUNT(CASE WHEN n."createdAt" > CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as notes_this_week,
    MAX(n."createdAt") as last_activity
FROM users u
LEFT JOIN notes n ON u.id = n."userId"
WHERE u."isActive" = true
GROUP BY u.id, u.name, u.email;

-- ========================================
-- PERMISSIONS (if needed in production)
-- ========================================

-- Grant permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO crm_user;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO crm_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO crm_user;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

SELECT 'Database schema created successfully!' as message;