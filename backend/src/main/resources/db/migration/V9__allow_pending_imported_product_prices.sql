ALTER TABLE products
    DROP CONSTRAINT chk_products_price_positive;

ALTER TABLE products
    ALTER COLUMN price DROP NOT NULL;

ALTER TABLE products
    ADD CONSTRAINT chk_products_price_pending_or_positive
    CHECK (stock >= 0 AND (price IS NULL OR price > 0));
