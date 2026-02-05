-- Drop the global unique constraint on code
ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_code_key;

-- Add a composite unique constraint on (code, organization_id)
-- This allows the same code to exist in different organizations
ALTER TABLE public.stores ADD CONSTRAINT stores_code_organization_unique UNIQUE (code, organization_id);