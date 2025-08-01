-- Migration: Create Quotes table (simplified for MVP)
-- This creates the quotes system for managing offers/quotations

BEGIN;

-- Create quotes status enum
CREATE TYPE quote_status AS ENUM (
    'DRAFT',
    'SENT', 
    'NEGOTIATION',
    'ACCEPTED',
    'REJECTED',
    'EXPIRED',
    'CANCELLED'
);

-- Create quotes table (using leads table for now)
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contactId UUID NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
    quoteNumber VARCHAR(50) UNIQUE NOT NULL,
    version INTEGER DEFAULT 1,
    status quote_status NOT NULL DEFAULT 'DRAFT',
    
    -- Dates
    createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
    updatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
    sentAt TIMESTAMP,
    validUntil TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    acceptedAt TIMESTAMP,
    rejectedAt TIMESTAMP,
    
    -- Financial
    subtotalNet NUMERIC(15,2) NOT NULL DEFAULT 0,
    subtotalGross NUMERIC(15,2) NOT NULL DEFAULT 0,
    discountAmount NUMERIC(15,2) DEFAULT 0,
    discountPercent NUMERIC(5,2) DEFAULT 0,
    totalNet NUMERIC(15,2) NOT NULL DEFAULT 0,
    totalGross NUMERIC(15,2) NOT NULL DEFAULT 0,
    vatAmount NUMERIC(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'PLN',
    
    -- Details
    notes TEXT,
    internalNotes TEXT,
    rejectionReason TEXT,
    termsAndConditions TEXT,
    
    -- Delivery & Payment
    deliveryMethod VARCHAR(100),
    deliveryAddress TEXT,
    deliveryCost NUMERIC(15,2) DEFAULT 0,
    paymentTerms VARCHAR(100) DEFAULT 'Przelew 14 dni',
    
    -- Relations
    createdByUserId UUID REFERENCES users(id),
    assignedUserId UUID REFERENCES users(id),
    previousVersionId UUID REFERENCES quotes(id),
    convertedToOrderId UUID,
    
    -- Metadata
    projectArea NUMERIC(10,2), -- m² powierzchni projektu
    installationIncluded BOOLEAN DEFAULT FALSE,
    measurementIncluded BOOLEAN DEFAULT FALSE
);

-- Create quote items table
CREATE TABLE IF NOT EXISTS quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quoteId UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    itemType VARCHAR(20) NOT NULL CHECK (itemType IN ('PRODUCT', 'SERVICE')),
    productId UUID REFERENCES products(id) ON DELETE SET NULL,
    
    -- Item details
    position INTEGER NOT NULL,
    sku VARCHAR(100),
    name VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- Quantities and units
    quantity NUMERIC(15,3) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- m², szt, mb, paczka, usługa
    quantityPerPackage NUMERIC(10,3), -- ile w paczce
    numberOfPackages NUMERIC(10,2), -- ile paczek
    
    -- Pricing
    pricePerUnit NUMERIC(15,2) NOT NULL,
    discount NUMERIC(5,2) DEFAULT 0,
    discountAmount NUMERIC(15,2) DEFAULT 0,
    netPrice NUMERIC(15,2) NOT NULL,
    vatRate NUMERIC(5,2) NOT NULL DEFAULT 23,
    vatAmount NUMERIC(15,2) NOT NULL,
    grossPrice NUMERIC(15,2) NOT NULL,
    
    -- For area calculations
    coveragePerUnit NUMERIC(10,3), -- ile m² pokrywa jednostka
    totalCoverage NUMERIC(15,2), -- całkowite pokrycie
    wastePercent NUMERIC(5,2) DEFAULT 10, -- % na straty przy cięciu
    
    createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
    updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_quotes_contactId ON quotes(contactId);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_createdAt ON quotes(createdAt);
CREATE INDEX idx_quotes_quoteNumber ON quotes(quoteNumber);
CREATE INDEX idx_quotes_validUntil ON quotes(validUntil);
CREATE INDEX idx_quote_items_quoteId ON quote_items(quoteId);
CREATE INDEX idx_quote_items_productId ON quote_items(productId);

-- Create sequence for quote numbers
CREATE SEQUENCE IF NOT EXISTS quote_number_seq START 1;

-- Function to generate quote number
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS VARCHAR AS $$
DECLARE
    year_month VARCHAR(7);
    seq_num INTEGER;
BEGIN
    year_month := TO_CHAR(NOW(), 'YYYY/MM');
    seq_num := nextval('quote_number_seq');
    RETURN 'OF/' || year_month || '/' || LPAD(seq_num::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to set quote number
CREATE OR REPLACE FUNCTION set_quote_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quoteNumber IS NULL THEN
        NEW.quoteNumber = generate_quote_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_quote_number
    BEFORE INSERT ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION set_quote_number();

-- Function to calculate quote totals
CREATE OR REPLACE FUNCTION calculate_quote_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_subtotal_net NUMERIC(15,2);
    v_subtotal_gross NUMERIC(15,2);
    v_vat_amount NUMERIC(15,2);
    quote_id UUID;
BEGIN
    -- Get the quote ID from the operation
    IF TG_OP = 'DELETE' THEN
        quote_id := OLD.quoteId;
    ELSE
        quote_id := NEW.quoteId;
    END IF;
    
    -- Calculate totals from items
    SELECT 
        COALESCE(SUM(netPrice), 0),
        COALESCE(SUM(grossPrice), 0),
        COALESCE(SUM(vatAmount), 0)
    INTO v_subtotal_net, v_subtotal_gross, v_vat_amount
    FROM quote_items
    WHERE quoteId = quote_id;
    
    -- Update quote totals
    UPDATE quotes
    SET 
        subtotalNet = v_subtotal_net,
        subtotalGross = v_subtotal_gross,
        vatAmount = v_vat_amount,
        totalNet = v_subtotal_net - COALESCE(discountAmount, 0) + COALESCE(deliveryCost, 0),
        totalGross = v_subtotal_gross - COALESCE(discountAmount, 0) + COALESCE(deliveryCost, 0),
        updatedAt = NOW()
    WHERE id = quote_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate quote totals when items change
CREATE TRIGGER trg_recalculate_quote_totals
    AFTER INSERT OR UPDATE OR DELETE ON quote_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_quote_totals();

-- Add update timestamp trigger for quotes
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add update timestamp trigger for quote_items
CREATE TRIGGER update_quote_items_updated_at BEFORE UPDATE ON quote_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;