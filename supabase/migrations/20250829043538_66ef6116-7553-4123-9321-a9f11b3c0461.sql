-- Migration 3: Add new enum values for FIRM roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'FIRM_ADMIN';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ACCOUNTANT';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'CONTRIBUTOR';