-- Add new role values to the existing app_role enum.
-- Each ALTER TYPE ... ADD VALUE must be a separate statement and cannot run inside a transaction block,
-- but Supabase migrations execute each statement individually so this is safe.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'influencer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'creator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'brand';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'campaign_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'influencer_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'builder_user';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'builder_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'builder_admin';