-- Add new columns to shop_products table
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS weight TEXT;

SELECT 'Columns added!' as status;