-- wear60web/migrations/003_add_delivery_partner_status.sql
-- Add status column to delivery_partners table
ALTER TABLE delivery_partners
ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending';

-- Add check constraint to ensure valid status values
ALTER TABLE delivery_partners
ADD CONSTRAINT delivery_partner_status_check 
CHECK (status IN ('pending', 'approved', 'inactive'));

-- Add index for better query performance on status field
CREATE INDEX idx_delivery_partners_status ON delivery_partners(status);