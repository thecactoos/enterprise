-- ========================================
-- Invoice Tables Migration
-- Polish VAT-compliant invoice system
-- ========================================

-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums for invoice types and statuses
CREATE TYPE invoice_type_enum AS ENUM ('vat_invoice', 'proforma', 'corrective');
CREATE TYPE invoice_status_enum AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE payment_method_enum AS ENUM ('bank_transfer', 'cash', 'card', 'blik');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'partial', 'paid', 'overdue');
CREATE TYPE item_type_enum AS ENUM ('service', 'product');

-- ========================================
-- INVOICES TABLE
-- ========================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_type invoice_type_enum NOT NULL DEFAULT 'vat_invoice',
    status invoice_status_enum NOT NULL DEFAULT 'draft',
    
    -- Customer Information (linked to contacts service)
    contact_id UUID NOT NULL,
    customer_nip VARCHAR(15),
    customer_regon VARCHAR(20),
    customer_vat_payer BOOLEAN DEFAULT TRUE,
    customer_name VARCHAR(255) NOT NULL,
    customer_address TEXT,
    
    -- Polish Invoice Dates (required by law)
    issue_date DATE NOT NULL,
    sale_date DATE NOT NULL,
    due_date DATE NOT NULL,
    
    -- Financial Summary (in PLN)
    total_net DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_vat DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_gross DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'PLN',
    
    -- Payment Information
    payment_method payment_method_enum DEFAULT 'bank_transfer',
    payment_status payment_status_enum DEFAULT 'pending',
    paid_at TIMESTAMP,
    
    -- Additional Information
    notes TEXT,
    payment_terms TEXT,
    quote_id UUID,
    created_by UUID,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- INVOICE ITEMS TABLE
-- ========================================
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Item Reference (Service or Product)
    item_type item_type_enum NOT NULL,
    service_id UUID,
    product_id UUID,
    
    -- Item Details
    description TEXT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_price_net DECIMAL(10,2) NOT NULL,
    vat_rate DECIMAL(5,2) NOT NULL,
    
    -- Calculated Totals
    total_net DECIMAL(10,2) NOT NULL,
    total_vat DECIMAL(10,2) NOT NULL,
    total_gross DECIMAL(10,2) NOT NULL,
    
    -- Pricing Context (for services from Services Service)
    pricing_tier VARCHAR(20),
    regional_zone VARCHAR(20),
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Item sequence/line number on invoice
    line_number INTEGER DEFAULT 1,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Invoices indexes
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_contact ON invoices(contact_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_dates ON invoices(issue_date, due_date);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_invoices_created ON invoices(created_at);
CREATE INDEX idx_invoices_quote ON invoices(quote_id);
CREATE INDEX idx_invoices_customer_name ON invoices(customer_name);

-- Invoice items indexes
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_service ON invoice_items(service_id);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);
CREATE INDEX idx_invoice_items_type ON invoice_items(item_type);
CREATE INDEX idx_invoice_items_line ON invoice_items(line_number);

-- ========================================
-- SEQUENCES FOR INVOICE NUMBERING
-- ========================================

-- Sequences for different invoice types
CREATE SEQUENCE invoice_number_sequence START 1;
CREATE SEQUENCE proforma_number_sequence START 1;
CREATE SEQUENCE corrective_number_sequence START 1;

-- ========================================
-- TRIGGERS AND FUNCTIONS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for invoices table
CREATE TRIGGER update_invoices_updated_at 
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to validate invoice business rules
CREATE OR REPLACE FUNCTION validate_invoice_business_rules()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure issue_date <= sale_date <= due_date
    IF NEW.issue_date > NEW.sale_date THEN
        RAISE EXCEPTION 'Issue date cannot be after sale date';
    END IF;
    
    IF NEW.sale_date > NEW.due_date THEN
        RAISE EXCEPTION 'Sale date cannot be after due date';
    END IF;
    
    -- Ensure totals are non-negative
    IF NEW.total_net < 0 OR NEW.total_vat < 0 OR NEW.total_gross < 0 THEN
        RAISE EXCEPTION 'Invoice totals cannot be negative';
    END IF;
    
    -- Ensure gross = net + vat (with small tolerance for rounding)
    IF ABS(NEW.total_gross - (NEW.total_net + NEW.total_vat)) > 0.02 THEN
        RAISE EXCEPTION 'Total gross must equal total net plus total VAT';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for invoice validation
CREATE TRIGGER validate_invoice_data
    BEFORE INSERT OR UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION validate_invoice_business_rules();

-- Function to validate invoice item business rules
CREATE OR REPLACE FUNCTION validate_invoice_item_business_rules()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure quantity is positive
    IF NEW.quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be positive';
    END IF;
    
    -- Ensure unit price is non-negative
    IF NEW.unit_price_net < 0 THEN
        RAISE EXCEPTION 'Unit price cannot be negative';
    END IF;
    
    -- Ensure VAT rate is valid (0, 5, 8, or 23 for Poland)
    IF NEW.vat_rate NOT IN (0, 5, 8, 23) THEN
        RAISE EXCEPTION 'Invalid VAT rate. Valid rates in Poland: 0%, 5%, 8%, 23%';
    END IF;
    
    -- Ensure service_id is provided for service items
    IF NEW.item_type = 'service' AND NEW.service_id IS NULL THEN
        RAISE EXCEPTION 'Service ID is required for service items';
    END IF;
    
    -- Ensure product_id is provided for product items
    IF NEW.item_type = 'product' AND NEW.product_id IS NULL THEN
        RAISE EXCEPTION 'Product ID is required for product items';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for invoice item validation
CREATE TRIGGER validate_invoice_item_data
    BEFORE INSERT OR UPDATE ON invoice_items
    FOR EACH ROW EXECUTE FUNCTION validate_invoice_item_business_rules();

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- View for invoice summary with customer details
CREATE VIEW invoice_summary AS
SELECT 
    i.id,
    i.invoice_number,
    i.invoice_type,
    i.status,
    i.customer_name,
    i.customer_nip,
    i.issue_date,
    i.due_date,
    i.total_gross,
    i.payment_status,
    i.currency,
    CASE 
        WHEN i.due_date < CURRENT_DATE AND i.payment_status != 'paid' THEN TRUE
        ELSE FALSE
    END as is_overdue,
    CURRENT_DATE - i.due_date as days_overdue,
    COUNT(ii.id) as item_count
FROM invoices i
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
GROUP BY i.id, i.invoice_number, i.invoice_type, i.status, i.customer_name, 
         i.customer_nip, i.issue_date, i.due_date, i.total_gross, 
         i.payment_status, i.currency;

-- View for VAT summary by rate
CREATE VIEW vat_summary AS
SELECT 
    i.id as invoice_id,
    i.invoice_number,
    ii.vat_rate,
    SUM(ii.total_net) as net_amount,
    SUM(ii.total_vat) as vat_amount,
    SUM(ii.total_gross) as gross_amount,
    COUNT(ii.id) as item_count
FROM invoices i
JOIN invoice_items ii ON i.id = ii.invoice_id
WHERE i.status IN ('sent', 'paid')
GROUP BY i.id, i.invoice_number, ii.vat_rate
ORDER BY i.invoice_number, ii.vat_rate DESC;

-- ========================================
-- SAMPLE DATA FOR DEVELOPMENT
-- ========================================

-- Insert sample invoice for testing (only in development)
DO $$
BEGIN
    IF current_setting('server_version_num')::int >= 120000 THEN
        -- Only insert if we're in development mode
        IF current_setting('log_statement', true) = 'all' THEN
            INSERT INTO invoices (
                id,
                invoice_number,
                invoice_type,
                status,
                contact_id,
                customer_name,
                customer_address,
                customer_nip,
                customer_vat_payer,
                issue_date,
                sale_date,
                due_date,
                total_net,
                total_vat,
                total_gross,
                payment_method,
                payment_terms,
                notes
            ) VALUES (
                '11111111-1111-1111-1111-111111111111',
                'FV/2025/01/0001',
                'vat_invoice',
                'draft',
                '660e8400-e29b-42d4-a716-446655440001',
                'ABC Construction Sp. z o.o.',
                'ul. Budowlana 123, 00-001 Warsaw, Poland',
                '1234567890',
                true,
                CURRENT_DATE,
                CURRENT_DATE,
                CURRENT_DATE + INTERVAL '30 days',
                1000.00,
                230.00,
                1230.00,
                'bank_transfer',
                'Płatność w terminie 30 dni od daty wystawienia faktury',
                'Sample invoice for testing'
            ) ON CONFLICT (id) DO NOTHING;

            -- Insert sample invoice item
            INSERT INTO invoice_items (
                id,
                invoice_id,
                item_type,
                service_id,
                description,
                quantity,
                unit,
                unit_price_net,
                vat_rate,
                total_net,
                total_vat,
                total_gross,
                pricing_tier,
                regional_zone,
                line_number
            ) VALUES (
                '22222222-2222-2222-2222-222222222222',
                '11111111-1111-1111-1111-111111111111',
                'service',
                '33333333-3333-3333-3333-333333333333',
                'Montaż podłogi drewnianej na klej - parkiet nieregularnie',
                25.5,
                'm²',
                39.22,
                23.00,
                1000.00,
                230.00,
                1230.00,
                'standard',
                'warsaw',
                1
            ) ON CONFLICT (id) DO NOTHING;
        END IF;
    END IF;
END $$;

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Grant permissions to application user (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'crm_user') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON invoices TO crm_user;
        GRANT SELECT, INSERT, UPDATE, DELETE ON invoice_items TO crm_user;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO crm_user;
        GRANT SELECT ON invoice_summary TO crm_user;
        GRANT SELECT ON vat_summary TO crm_user;
    END IF;
END $$;

-- ========================================
-- MIGRATION COMPLETED
-- ========================================

-- Log migration completion
INSERT INTO schema_migrations (version, name, executed_at) 
VALUES (4, 'create_invoices_table', CURRENT_TIMESTAMP)
ON CONFLICT (version) DO UPDATE SET executed_at = CURRENT_TIMESTAMP;

COMMENT ON TABLE invoices IS 'Polish VAT-compliant invoices with comprehensive business logic';
COMMENT ON TABLE invoice_items IS 'Invoice line items with service/product integration';
COMMENT ON VIEW invoice_summary IS 'Summary view for invoice listing and reporting';
COMMENT ON VIEW vat_summary IS 'VAT breakdown view for Polish tax reporting';

-- Migration completed successfully
SELECT 'Invoice tables created successfully with Polish VAT compliance' as result;