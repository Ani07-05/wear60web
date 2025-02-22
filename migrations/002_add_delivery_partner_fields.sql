-- wear60web/migrations/002_add_delivery_partner_fields.sql
-- Add new columns to delivery_partners table
ALTER TABLE delivery_partners
ADD COLUMN phone VARCHAR(20) NOT NULL,
ADD COLUMN vehicle_type VARCHAR(50),
ADD COLUMN vehicle_number VARCHAR(20),
ADD COLUMN license_number VARCHAR(50),
ADD COLUMN is_active BOOLEAN DEFAULT true,
ADD COLUMN rating DECIMAL(3,2) DEFAULT 5.0,
ADD COLUMN total_deliveries INTEGER DEFAULT 0;

-- Add constraints
ALTER TABLE delivery_partners
ADD CONSTRAINT phone_unique UNIQUE (phone);

-- Add indexes for better query performance
CREATE INDEX idx_delivery_partners_phone ON delivery_partners(phone);
CREATE INDEX idx_delivery_partners_is_active ON delivery_partners(is_active);