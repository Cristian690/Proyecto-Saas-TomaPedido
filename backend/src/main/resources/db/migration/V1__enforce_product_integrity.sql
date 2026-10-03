ALTER TABLE products
    ALTER COLUMN category_id SET NOT NULL,
    ALTER COLUMN tenant_id SET NOT NULL,
    ALTER COLUMN active SET NOT NULL;

ALTER TABLE products
    ADD CONSTRAINT chk_products_price_positive CHECK (price > 0),
    ADD CONSTRAINT chk_products_stock_non_negative CHECK (stock >= 0);
