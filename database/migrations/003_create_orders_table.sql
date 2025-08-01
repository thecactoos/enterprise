-- Migration: Create Orders table
-- This creates the orders system that is automatically generated from accepted quotes

BEGIN;

-- Create order status enum
CREATE TYPE order_status AS ENUM (
    'NEW',
    'CONFIRMED',
    'PROCESSING',
    'READY_FOR_PICKUP',
    'SHIPPED',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
    'REFUNDED'
);

-- Create payment status enum
CREATE TYPE payment_status AS ENUM (
    'PENDING',
    'PARTIAL',
    'PAID',
    'OVERDUE',
    'REFUNDED'
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contactId UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    quoteId UUID NOT NULL REFERENCES quotes(id) ON DELETE RESTRICT,
    orderNumber VARCHAR(50) UNIQUE NOT NULL,
    
    -- Status
    status order_status NOT NULL DEFAULT 'NEW',
    paymentStatus payment_status NOT NULL DEFAULT 'PENDING',
    
    -- Dates
    createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
    updatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
    confirmedAt TIMESTAMP,
    completedAt TIMESTAMP,
    cancelledAt TIMESTAMP,
    
    -- Financial (copied from quote at creation)
    subtotalNet NUMERIC(15,2) NOT NULL,
    subtotalGross NUMERIC(15,2) NOT NULL,
    discountAmount NUMERIC(15,2) DEFAULT 0,
    totalNet NUMERIC(15,2) NOT NULL,
    totalGross NUMERIC(15,2) NOT NULL,
    vatAmount NUMERIC(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'PLN',
    
    -- Payment info
    paymentDueDate TIMESTAMP,
    paidAmount NUMERIC(15,2) DEFAULT 0,
    paymentMethod VARCHAR(50),
    
    -- Delivery
    deliveryMethod VARCHAR(100),
    deliveryAddress TEXT,
    deliveryCost NUMERIC(15,2) DEFAULT 0,
    deliveryDate TIMESTAMP,
    trackingNumber VARCHAR(100),
    
    -- Invoice
    invoiceNumber VARCHAR(50),
    invoiceDate TIMESTAMP,
    invoiceUrl TEXT,
    
    -- Notes
    customerNotes TEXT,
    internalNotes TEXT,
    cancellationReason TEXT,
    
    -- Relations
    createdByUserId UUID,
    assignedUserId UUID
);

-- Create order items table (copied from quote_items)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orderId UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    quoteItemId UUID, -- reference to original quote item
    itemType VARCHAR(20) NOT NULL CHECK (itemType IN ('PRODUCT', 'SERVICE')),
    productId UUID REFERENCES products(id) ON DELETE SET NULL,
    
    -- Item details (frozen at order time)
    position INTEGER NOT NULL,
    sku VARCHAR(100),
    name VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- Quantities
    quantity NUMERIC(15,3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    quantityDelivered NUMERIC(15,3) DEFAULT 0,
    
    -- Pricing (frozen at order time)
    pricePerUnit NUMERIC(15,2) NOT NULL,
    discount NUMERIC(5,2) DEFAULT 0,
    netPrice NUMERIC(15,2) NOT NULL,
    vatRate NUMERIC(5,2) NOT NULL,
    vatAmount NUMERIC(15,2) NOT NULL,
    grossPrice NUMERIC(15,2) NOT NULL,
    
    -- Status
    fulfilled BOOLEAN DEFAULT FALSE,
    fulfilledAt TIMESTAMP,
    
    createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
    updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create order status history
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orderId UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    fromStatus order_status,
    toStatus order_status NOT NULL,
    changedByUserId UUID,
    changedAt TIMESTAMP NOT NULL DEFAULT NOW(),
    notes TEXT
);

-- Create indexes
CREATE INDEX idx_orders_contactId ON orders(contactId);
CREATE INDEX idx_orders_quoteId ON orders(quoteId);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_paymentStatus ON orders(paymentStatus);
CREATE INDEX idx_orders_createdAt ON orders(createdAt);
CREATE INDEX idx_orders_orderNumber ON orders(orderNumber);
CREATE INDEX idx_order_items_orderId ON order_items(orderId);
CREATE INDEX idx_order_items_productId ON order_items(productId);
CREATE INDEX idx_order_status_history_orderId ON order_status_history(orderId);

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR AS $$
DECLARE
    year_month VARCHAR(6);
    seq_num INTEGER;
BEGIN
    year_month := TO_CHAR(NOW(), 'YYYYMM');
    seq_num := nextval('order_number_seq');
    RETURN 'ZAM/' || year_month || '/' || LPAD(seq_num::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to set order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.orderNumber IS NULL THEN
        NEW.orderNumber = generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();

-- Function to create order from accepted quote
CREATE OR REPLACE FUNCTION create_order_from_quote(p_quote_id UUID)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_contact_id UUID;
    v_quote RECORD;
BEGIN
    -- Get quote details
    SELECT * INTO v_quote FROM quotes WHERE id = p_quote_id AND status = 'ACCEPTED';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quote not found or not accepted';
    END IF;
    
    -- Create order
    INSERT INTO orders (
        contactId, quoteId,
        subtotalNet, subtotalGross, discountAmount,
        totalNet, totalGross, vatAmount, currency,
        deliveryMethod, deliveryAddress, deliveryCost,
        customerNotes, createdByUserId, assignedUserId
    )
    SELECT 
        contactId, id,
        subtotalNet, subtotalGross, discountAmount,
        totalNet, totalGross, vatAmount, currency,
        deliveryMethod, deliveryAddress, deliveryCost,
        notes, createdByUserId, assignedUserId
    FROM quotes
    WHERE id = p_quote_id
    RETURNING id INTO v_order_id;
    
    -- Copy quote items to order items
    INSERT INTO order_items (
        orderId, quoteItemId, itemType, productId,
        position, sku, name, description,
        quantity, unit, pricePerUnit, discount,
        netPrice, vatRate, vatAmount, grossPrice
    )
    SELECT 
        v_order_id, id, itemType, productId,
        position, sku, name, description,
        quantity, unit, pricePerUnit, discount,
        netPrice, vatRate, vatAmount, grossPrice
    FROM quote_items
    WHERE quoteId = p_quote_id;
    
    -- Update quote with order reference
    UPDATE quotes 
    SET convertedToOrderId = v_order_id,
        updatedAt = NOW()
    WHERE id = p_quote_id;
    
    -- Update contact to CLIENT if still LEAD
    UPDATE contacts 
    SET type = 'CLIENT',
        clientSince = COALESCE(clientSince, NOW()),
        lastPurchaseDate = NOW(),
        totalPurchases = COALESCE(totalPurchases, 0) + v_quote.totalGross,
        updatedAt = NOW()
    WHERE id = v_quote.contactId AND type = 'LEAD';
    
    -- Add to status history
    INSERT INTO order_status_history (orderId, fromStatus, toStatus, changedByUserId)
    VALUES (v_order_id, NULL, 'NEW', v_quote.createdByUserId);
    
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track status changes
CREATE OR REPLACE FUNCTION track_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (orderId, fromStatus, toStatus, changedByUserId)
        VALUES (NEW.id, OLD.status, NEW.status, current_setting('app.current_user_id', true)::UUID);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_track_order_status
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION track_order_status_change();

-- Add update timestamp triggers
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;