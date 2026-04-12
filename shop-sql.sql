-- ============================================
-- STAGEFY SHOP - SIMPLE SQL SCRIPT
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Anyone can view active shop_products" ON shop_products;
DROP POLICY IF EXISTS "Anyone can view all shop_products" ON shop_products;
DROP POLICY IF EXISTS "Authenticated can insert shop_products" ON shop_products;
DROP POLICY IF EXISTS "Authenticated can update shop_products" ON shop_products;
DROP POLICY IF EXISTS "Authenticated can delete shop_products" ON shop_products;
DROP POLICY IF EXISTS "Users can view own shop_orders" ON shop_orders;
DROP POLICY IF EXISTS "Users can insert own shop_orders" ON shop_orders;
DROP POLICY IF EXISTS "Users can update own shop_orders" ON shop_orders;

-- Create new policies with unique names
CREATE POLICY "shop_products_public_active" ON shop_products
    FOR SELECT TO public USING (status = 'active');

CREATE POLICY "shop_products_auth_all" ON shop_products
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "shop_products_auth_insert" ON shop_products
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "shop_products_auth_update" ON shop_products
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "shop_products_auth_delete" ON shop_products
    FOR DELETE TO authenticated USING (true);

CREATE POLICY "shop_orders_user_select" ON shop_orders
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "shop_orders_user_insert" ON shop_orders
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shop_orders_user_update" ON shop_orders
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Insert sample products
INSERT INTO shop_products (name, description, price, category, status, credits_included, is_featured, sort_order) VALUES
('50 Credits', 'Add 50 credits to your account', 499, 'credits', 'active', 50, true, 1),
('100 Credits', 'Add 100 credits to your account', 899, 'credits', 'active', 100, true, 2),
('200 Credits', 'Add 200 credits - Save R99!', 1599, 'credits', 'active', 200, false, 3),
('500 Credits', 'Add 500 credits - Best value!', 3499, 'credits', 'active', 500, true, 4);

SELECT 'Shop setup complete!' as status;
