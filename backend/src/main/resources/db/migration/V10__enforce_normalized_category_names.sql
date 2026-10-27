-- Historical normalized duplicates require a manual decision; this migration never
-- deletes, renames, or merges categories automatically.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM categories
        GROUP BY tenant_id, lower(btrim(regexp_replace(name, '[[:space:]]+', ' ', 'g')))
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Cannot enforce normalized category uniqueness: resolve duplicate category names per tenant before applying V10';
    END IF;
END $$;

CREATE UNIQUE INDEX uq_categories_tenant_normalized_name
    ON categories (
        tenant_id,
        lower(btrim(regexp_replace(name, '[[:space:]]+', ' ', 'g')))
    );
