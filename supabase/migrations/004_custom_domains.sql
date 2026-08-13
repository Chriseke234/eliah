-- =============================================================================
-- Migration 004: Custom Domain & Subdomain Mapping
-- Adds custom_domain column to public.organizations with unique index.
-- =============================================================================

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255) UNIQUE;

-- Create index for fast domain resolution in middleware
CREATE INDEX IF NOT EXISTS idx_organizations_custom_domain
ON public.organizations (custom_domain);

-- Comment on column
COMMENT ON COLUMN public.organizations.custom_domain IS 'Custom domain mapped to the organization (e.g., portal.agency.com)';
