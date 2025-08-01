-- ========================================
-- MIGRATION: Transform leads table to contacts table
-- Purpose: Create unified contacts model supporting both leads and clients
-- Date: 2025-01-31
-- ========================================

-- Update ENUMs to include client statuses - must be outside transaction
ALTER TYPE leads_status_enum ADD VALUE IF NOT EXISTS 'active';
ALTER TYPE leads_status_enum ADD VALUE IF NOT EXISTS 'inactive'; 
ALTER TYPE leads_status_enum ADD VALUE IF NOT EXISTS 'vip';
ALTER TYPE leads_status_enum ADD VALUE IF NOT EXISTS 'churned';

BEGIN;

-- First, add the new columns that are required for the unified contacts model
ALTER TABLE leads 
    ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'lead' CHECK (type IN ('lead', 'client')),
    ADD COLUMN IF NOT EXISTS "businessType" VARCHAR(50) CHECK ("businessType" IN ('individual', 'company', 'partnership', 'corporation', 'ngo', 'government', 'other')),
    ADD COLUMN IF NOT EXISTS "firstContactDate" TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "clientSince" TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "totalPurchases" DECIMAL(15,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS "lastPurchaseDate" TIMESTAMP,
    ADD COLUMN IF NOT EXISTS "lastPurchaseAmount" DECIMAL(15,2),
    ADD COLUMN IF NOT EXISTS "averageOrderValue" DECIMAL(15,2),
    ADD COLUMN IF NOT EXISTS "purchaseCount" INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "lifetimeValue" DECIMAL(15,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS "churnRisk" INTEGER CHECK ("churnRisk" BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS "customerSegment" VARCHAR(50) CHECK ("customerSegment" IN ('new', 'regular', 'vip', 'enterprise', 'at_risk', 'churned'));

-- Set first contact date for existing leads if not already set
UPDATE leads 
SET "firstContactDate" = "createdAt" 
WHERE "firstContactDate" IS NULL;

-- Update existing converted leads to be clients
UPDATE leads 
SET 
    type = 'client',
    "clientSince" = "convertedAt",
    status = 'active'
WHERE status = 'converted' AND "convertedAt" IS NOT NULL;

-- Convert foreign key columns to UUID type to match referenced tables
ALTER TABLE leads ALTER COLUMN "assignedUserId" TYPE UUID USING CASE WHEN "assignedUserId" = '' OR "assignedUserId" IS NULL THEN NULL ELSE "assignedUserId"::UUID END;
ALTER TABLE leads ALTER COLUMN "convertedToClientId" TYPE UUID USING CASE WHEN "convertedToClientId" = '' OR "convertedToClientId" IS NULL THEN NULL ELSE "convertedToClientId"::UUID END;
ALTER TABLE leads ALTER COLUMN "originalLeadId" TYPE UUID USING CASE WHEN "originalLeadId" = '' OR "originalLeadId" IS NULL THEN NULL ELSE "originalLeadId"::UUID END;

-- Rename the table to contacts
ALTER TABLE leads RENAME TO contacts;

-- Update indexes to use new table name - drop old ones first
DROP INDEX IF EXISTS idx_leads_email;
DROP INDEX IF EXISTS idx_leads_phone;
DROP INDEX IF EXISTS idx_leads_status;
DROP INDEX IF EXISTS idx_leads_priority;
DROP INDEX IF EXISTS idx_leads_source;
DROP INDEX IF EXISTS idx_leads_lead_type;
DROP INDEX IF EXISTS idx_leads_assigned_user;
DROP INDEX IF EXISTS idx_leads_converted_client;
DROP INDEX IF EXISTS idx_leads_created_at;
DROP INDEX IF EXISTS idx_leads_estimated_value;
DROP INDEX IF EXISTS idx_leads_expected_close_date;
DROP INDEX IF EXISTS idx_leads_status_priority;
DROP INDEX IF EXISTS idx_leads_assigned_status;
DROP INDEX IF EXISTS idx_leads_active_status;
DROP INDEX IF EXISTS idx_leads_source_status;
DROP INDEX IF EXISTS idx_leads_city;
DROP INDEX IF EXISTS idx_leads_voivodeship;
DROP INDEX IF EXISTS idx_leads_company;
DROP INDEX IF EXISTS idx_leads_industry;
DROP INDEX IF EXISTS idx_leads_custom_fields;
DROP INDEX IF EXISTS idx_leads_tags;
DROP INDEX IF EXISTS idx_leads_interested_products;
DROP INDEX IF EXISTS idx_leads_next_followup;
DROP INDEX IF EXISTS idx_leads_last_contact;

-- Create new indexes for contacts table
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_priority ON contacts(priority);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);
CREATE INDEX IF NOT EXISTS idx_contacts_lead_type ON contacts("leadType");
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_user ON contacts("assignedUserId");
CREATE INDEX IF NOT EXISTS idx_contacts_converted_client ON contacts("convertedToClientId");
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts("createdAt");
CREATE INDEX IF NOT EXISTS idx_contacts_estimated_value ON contacts("estimatedValue");
CREATE INDEX IF NOT EXISTS idx_contacts_expected_close_date ON contacts("expectedCloseDate");
CREATE INDEX IF NOT EXISTS idx_contacts_business_type ON contacts("businessType");
CREATE INDEX IF NOT EXISTS idx_contacts_customer_segment ON contacts("customerSegment");
CREATE INDEX IF NOT EXISTS idx_contacts_total_purchases ON contacts("totalPurchases");
CREATE INDEX IF NOT EXISTS idx_contacts_last_purchase_date ON contacts("lastPurchaseDate");

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_contacts_type_status ON contacts(type, status);
CREATE INDEX IF NOT EXISTS idx_contacts_status_priority ON contacts(status, priority);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_status ON contacts("assignedUserId", status);
CREATE INDEX IF NOT EXISTS idx_contacts_active_status ON contacts("isActive", status);
CREATE INDEX IF NOT EXISTS idx_contacts_source_status ON contacts(source, status);
CREATE INDEX IF NOT EXISTS idx_contacts_type_segment ON contacts(type, "customerSegment");

-- Geographic indexes
CREATE INDEX IF NOT EXISTS idx_contacts_city ON contacts(city);
CREATE INDEX IF NOT EXISTS idx_contacts_voivodeship ON contacts(voivodeship);

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
CREATE INDEX IF NOT EXISTS idx_contacts_industry ON contacts(industry);

-- JSONB indexes for custom fields and tags
CREATE INDEX IF NOT EXISTS idx_contacts_custom_fields ON contacts USING GIN ("customFields");
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_contacts_interested_products ON contacts USING GIN ("interestedProducts");

-- Date-based indexes for follow-ups and analytics
CREATE INDEX IF NOT EXISTS idx_contacts_next_followup ON contacts("nextFollowUpDate");
CREATE INDEX IF NOT EXISTS idx_contacts_last_contact ON contacts("lastContactDate");
CREATE INDEX IF NOT EXISTS idx_contacts_first_contact ON contacts("firstContactDate");
CREATE INDEX IF NOT EXISTS idx_contacts_client_since ON contacts("clientSince");

-- Update triggers to use new table name
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
DROP TRIGGER IF EXISTS update_leads_updated_at ON contacts;

CREATE TRIGGER update_contacts_updated_at 
    BEFORE UPDATE ON contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update foreign key constraints that reference the old table
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS fk_leads_assigned_user;
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS fk_leads_converted_client; 
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS fk_leads_original_lead;

ALTER TABLE contacts ADD CONSTRAINT fk_contacts_assigned_user 
    FOREIGN KEY ("assignedUserId") REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE contacts ADD CONSTRAINT fk_contacts_converted_client 
    FOREIGN KEY ("convertedToClientId") REFERENCES clients(id) ON DELETE SET NULL;

ALTER TABLE contacts ADD CONSTRAINT fk_contacts_original_contact 
    FOREIGN KEY ("originalLeadId") REFERENCES contacts(id) ON DELETE SET NULL;

-- Update any views that reference the old table
DROP VIEW IF EXISTS lead_status_stats;
DROP VIEW IF EXISTS lead_source_stats;
DROP VIEW IF EXISTS leads_followup_due;
DROP VIEW IF EXISTS high_value_leads;

-- Create new views for unified contacts
CREATE OR REPLACE VIEW contact_status_stats AS
SELECT 
    type,
    status,
    COUNT(*) as total_count,
    COUNT(CASE WHEN "createdAt" > CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as last_30_days,
    COUNT(CASE WHEN "createdAt" > CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as last_7_days,
    ROUND(AVG("estimatedValue"), 2) as avg_estimated_value,
    SUM("estimatedValue") as total_estimated_value,
    ROUND(AVG("totalPurchases"), 2) as avg_total_purchases,
    SUM("totalPurchases") as total_purchases_value
FROM contacts 
WHERE "isActive" = true AND "isArchived" = false
GROUP BY type, status;

-- View for contact statistics by source
CREATE OR REPLACE VIEW contact_source_stats AS
SELECT 
    type,
    source,
    COUNT(*) as total_count,
    ROUND(AVG("qualificationScore"), 2) as avg_qualification_score,
    COUNT(CASE WHEN status IN ('converted', 'active') THEN 1 END) as converted_count,
    ROUND(
        COUNT(CASE WHEN status IN ('converted', 'active') THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as conversion_rate_percent
FROM contacts 
WHERE "isActive" = true AND "isArchived" = false
GROUP BY type, source;

-- View for contacts needing follow-up (both leads and clients)
CREATE OR REPLACE VIEW contacts_followup_due AS
SELECT 
    c.*,
    CONCAT(c."firstName", ' ', c."lastName") as full_name,
    CASE 
        WHEN c."nextFollowUpDate" IS NOT NULL AND c."nextFollowUpDate" <= CURRENT_TIMESTAMP 
        THEN 'scheduled_overdue'
        WHEN c."lastContactDate" IS NULL AND c."createdAt" <= CURRENT_TIMESTAMP - INTERVAL '1 day'
        THEN 'new_contact_overdue'
        WHEN c."lastContactDate" IS NOT NULL AND c."lastContactDate" <= CURRENT_TIMESTAMP - INTERVAL '7 days'
        THEN 'no_recent_contact'
        WHEN c.type = 'client' AND c."lastPurchaseDate" IS NOT NULL AND c."lastPurchaseDate" <= CURRENT_TIMESTAMP - INTERVAL '90 days'
        THEN 'client_no_recent_purchase'
        ELSE 'other'
    END as followup_reason,
    CASE 
        WHEN c."nextFollowUpDate" IS NOT NULL 
        THEN EXTRACT(DAY FROM CURRENT_TIMESTAMP - c."nextFollowUpDate")
        WHEN c."lastContactDate" IS NOT NULL 
        THEN EXTRACT(DAY FROM CURRENT_TIMESTAMP - c."lastContactDate")
        ELSE EXTRACT(DAY FROM CURRENT_TIMESTAMP - c."createdAt")
    END as days_overdue
FROM contacts c
WHERE 
    c."isActive" = true 
    AND c."isArchived" = false 
    AND (
        (c.type = 'lead' AND c.status NOT IN ('converted', 'lost', 'unqualified'))
        OR (c.type = 'client' AND c.status NOT IN ('churned', 'inactive'))
    )
    AND (
        (c."nextFollowUpDate" IS NOT NULL AND c."nextFollowUpDate" <= CURRENT_TIMESTAMP)
        OR (c."nextFollowUpDate" IS NULL AND c."lastContactDate" IS NULL AND c."createdAt" <= CURRENT_TIMESTAMP - INTERVAL '1 day')
        OR (c."nextFollowUpDate" IS NULL AND c."lastContactDate" IS NOT NULL AND c."lastContactDate" <= CURRENT_TIMESTAMP - INTERVAL '7 days')
        OR (c.type = 'client' AND c."lastPurchaseDate" IS NOT NULL AND c."lastPurchaseDate" <= CURRENT_TIMESTAMP - INTERVAL '90 days')
    );

-- View for high-value contacts (both leads and clients)
CREATE OR REPLACE VIEW high_value_contacts AS
SELECT 
    c.*,
    CONCAT(c."firstName", ' ', c."lastName") as full_name,
    CASE 
        WHEN c.type = 'lead' THEN 
            ROUND(c."estimatedValue" * (
                CASE c.status
                    WHEN 'new' THEN 0.1
                    WHEN 'contacted' THEN 0.2
                    WHEN 'qualified' THEN 0.4
                    WHEN 'proposal_sent' THEN 0.6
                    WHEN 'negotiation' THEN 0.75
                    WHEN 'converted' THEN 1.0
                    ELSE 0.05
                END
            ), 2)
        WHEN c.type = 'client' THEN c."lifetimeValue"
        ELSE 0.00
    END as weighted_value
FROM contacts c
WHERE 
    c."isActive" = true 
    AND c."isArchived" = false
    AND (
        (c.type = 'lead' AND c."estimatedValue" > 50000 AND c.status NOT IN ('lost', 'unqualified'))
        OR (c.type = 'client' AND c."lifetimeValue" > 75000 AND c.status NOT IN ('churned', 'inactive'))
    )
ORDER BY 
    CASE 
        WHEN c.type = 'lead' THEN c."estimatedValue"
        WHEN c.type = 'client' THEN c."lifetimeValue"
        ELSE 0.00
    END DESC;

-- Grant permissions on new table and views
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO crm_user;
GRANT SELECT ON contact_status_stats TO crm_user;
GRANT SELECT ON contact_source_stats TO crm_user;
GRANT SELECT ON contacts_followup_due TO crm_user;
GRANT SELECT ON high_value_contacts TO crm_user;

-- Update sequence permissions if needed
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO crm_user;

-- Add comment
COMMENT ON TABLE contacts IS 'Unified table for leads and clients - type field determines the contact type';

COMMIT;

SELECT 'Successfully transformed leads table to unified contacts table!' as message;